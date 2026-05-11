import { Keypair, PublicKey, Connection, Transaction } from "@solana/web3.js";
import bs58 from "bs58";
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { USDC_MINT } from "./jupiter";

const RPC_URL =
  process.env.SOLANA_RPC_URL ??
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
  "https://api.devnet.solana.com";

const connection = new Connection(RPC_URL, "confirmed");

const FEE_BPS = parseInt(
  process.env.NEXT_PUBLIC_PLATFORM_FEE_BPS ?? "100",
  10
);

function parseKey(envValue: string): Keypair {
  if (envValue.startsWith("[")) {
    return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(envValue)));
  }
  return Keypair.fromSecretKey(bs58.decode(envValue));
}

function getSharedEscrowKeypair(): Keypair | null {
  const key = process.env.SHARED_ESCROW_PRIVATE_KEY;
  if (!key) return null;
  return parseKey(key);
}

function getPlatformKeypair(): Keypair | null {
  const key = process.env.PLATFORM_PRIVATE_KEY;
  if (!key) return null;
  return parseKey(key);
}

export async function getSharedEscrowUSDCAddress(): Promise<string> {
  const escrow = getSharedEscrowKeypair();
  if (!escrow) return "";
  const ata = await getAssociatedTokenAddress(
    new PublicKey(USDC_MINT),
    escrow.publicKey
  );
  return ata.toBase58();
}

export function getSharedEscrowPublicKey(): string {
  return getSharedEscrowKeypair()?.publicKey.toBase58() ?? "";
}

export interface WinnerPayout {
  walletAddress: string;
  betAmount: number;
  payoutAmount: number;
}

export async function resolveGameEscrow(params: {
  winners: WinnerPayout[];
  totalPool: number;
  feeAmount?: number;
}): Promise<{ winnerTxIds: string[]; totalFee: number; feeTxId?: string }> {
  const { winners, totalPool, feeAmount: passedFee } = params;

  const escrowKeypair = getSharedEscrowKeypair();
  if (!escrowKeypair) {
    return { winnerTxIds: [], totalFee: 0 };
  }

  const platformKeypair = getPlatformKeypair();
  const feePayer = platformKeypair ?? escrowKeypair;

  const escrowUSDC = await getAssociatedTokenAddress(
    new PublicKey(USDC_MINT),
    escrowKeypair.publicKey
  );

  const balance = await connection
    .getTokenAccountBalance(escrowUSDC)
    .catch(() => null);
  if (
    !balance ||
    balance.value.uiAmount === 0 ||
    balance.value.uiAmount === null
  ) {
    console.warn("[escrow] no USDC balance, skipping on-chain transfers");
    return { winnerTxIds: [], totalFee: 0 };
  }

  const feeAmount = passedFee ?? Math.floor((totalPool * FEE_BPS) / 10000);

  const winnerTxIds: string[] = [];
  let feeTxId: string | undefined;

  // send platform fee
  if (feeAmount > 0 && platformKeypair) {
    try {
      const platformUSDC = await getOrCreateAssociatedTokenAccount(
        connection,
        feePayer,
        new PublicKey(USDC_MINT),
        platformKeypair.publicKey
      );

      const feeTx = new Transaction().add(
        createTransferInstruction(
          escrowUSDC,
          platformUSDC.address,
          escrowKeypair.publicKey,
          feeAmount,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      feeTx.recentBlockhash = blockhash;
      feeTx.feePayer = feePayer.publicKey;

      const signers = [escrowKeypair];
      if (feePayer !== escrowKeypair) signers.push(feePayer);
      feeTx.sign(...signers);

      const txid = await connection.sendRawTransaction(feeTx.serialize(), {
        maxRetries: 3,
      });
      await connection.confirmTransaction({
        signature: txid,
        blockhash,
        lastValidBlockHeight,
      });
      feeTxId = txid;
    } catch (err) {
      console.warn("[escrow] failed to send platform fee", (err as Error).message);
    }
  }

  // pay winners
  for (const winner of winners) {
    try {
      const winnerShare = winner.payoutAmount;
      const winnerPubkey = new PublicKey(winner.walletAddress);
      const winnerUSDC = await getOrCreateAssociatedTokenAccount(
        connection,
        feePayer,
        new PublicKey(USDC_MINT),
        winnerPubkey
      );

      const tx = new Transaction().add(
        createTransferInstruction(
          escrowUSDC,
          winnerUSDC.address,
          escrowKeypair.publicKey,
          winnerShare,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;
      tx.feePayer = feePayer.publicKey;

      const signers = [escrowKeypair];
      if (feePayer !== escrowKeypair) signers.push(feePayer);
      tx.sign(...signers);

      const txid = await connection.sendRawTransaction(tx.serialize(), {
        maxRetries: 3,
      });
      await connection.confirmTransaction({
        signature: txid,
        blockhash,
        lastValidBlockHeight,
      });
      winnerTxIds.push(txid);
    } catch (err) {
      console.warn("[escrow] failed to pay winner", {
        address: winner.walletAddress,
        error: (err as Error).message,
      });
    }
  }

  return { winnerTxIds, totalFee: Number(feeAmount), feeTxId };
}

export interface RefundEntry {
  walletAddress: string;
  betAmount: number;
}

export async function cancelGameEscrow(refunds: RefundEntry[]): Promise<{ txIds: string[] }> {
  const escrowKeypair = getSharedEscrowKeypair();
  if (!escrowKeypair) return { txIds: [] };

  const platformKeypair = getPlatformKeypair();
  const feePayer = platformKeypair ?? escrowKeypair;

  const escrowUSDC = await getAssociatedTokenAddress(
    new PublicKey(USDC_MINT),
    escrowKeypair.publicKey
  );

  const balance = await connection.getTokenAccountBalance(escrowUSDC).catch(() => null);
  if (!balance || balance.value.uiAmount === 0 || balance.value.uiAmount === null) {
    console.warn("[escrow] no USDC balance, skipping refunds");
    return { txIds: [] };
  }

  const txIds: string[] = [];
  for (const refund of refunds) {
    try {
      const amount = refund.betAmount;
      if (amount <= 0) continue;

      const refundPubkey = new PublicKey(refund.walletAddress);
      const refundUSDC = await getOrCreateAssociatedTokenAccount(
        connection,
        feePayer,
        new PublicKey(USDC_MINT),
        refundPubkey
      );

      const tx = new Transaction().add(
        createTransferInstruction(
          escrowUSDC,
          refundUSDC.address,
          escrowKeypair.publicKey,
          amount,
          [],
          TOKEN_PROGRAM_ID
        )
      );

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;
      tx.feePayer = feePayer.publicKey;

      const signers = [escrowKeypair];
      if (feePayer !== escrowKeypair) signers.push(feePayer);
      tx.sign(...signers);

      const txid = await connection.sendRawTransaction(tx.serialize(), { maxRetries: 3 });
      await connection.confirmTransaction({ signature: txid, blockhash, lastValidBlockHeight });
      txIds.push(txid);
    } catch (err) {
      console.warn("[escrow] failed to refund", { address: refund.walletAddress, error: (err as Error).message });
    }
  }

  return { txIds };
}

export async function verifyUSDCDeposit(
  txHash: string,
  senderWallet?: string
): Promise<{ verified: false } | { verified: true; amount: number }> {
  try {
    const tx = await connection.getParsedTransaction(txHash, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || tx.meta?.err) {
      return { verified: false };
    }

    const expectedRecipient = await getSharedEscrowUSDCAddress();
    if (!expectedRecipient) return { verified: false };

    const recipientPubkey = new PublicKey(expectedRecipient);

    for (const instruction of tx.transaction.message.instructions) {
      if ("parsed" in instruction) {
        const parsed = instruction.parsed;
        if (
          parsed.type === "transfer" &&
          parsed.info.destination === recipientPubkey.toBase58()
        ) {
          const amount = parseInt(parsed.info.amount, 10);
          if (isNaN(amount) || amount <= 0) continue;

          if (senderWallet) {
            const senderPubkey = new PublicKey(senderWallet);
            const expectedSource = await getAssociatedTokenAddress(
              new PublicKey(USDC_MINT),
              senderPubkey
            );
            if (
              parsed.info.source !== expectedSource.toBase58() &&
              parsed.info.authority !== senderWallet
            ) {
              continue;
            }
          }
          return { verified: true, amount };
        }
      }
    }

    return { verified: false };
  } catch {
    return { verified: false };
  }
}
