import { Keypair, PublicKey, Connection, Transaction } from "@solana/web3.js";
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

const PLATFORM_KEYPAIR = process.env.SOLANA_PRIVATE_KEY
  ? Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(process.env.SOLANA_PRIVATE_KEY))
    )
  : null;

export interface EscrowWallet {
  publicKey: string;
  secretKey: string;
}

export function generateEscrowKeypair(): EscrowWallet {
  const keypair = Keypair.generate();
  return {
    publicKey: keypair.publicKey.toBase58(),
    secretKey: JSON.stringify(Array.from(keypair.secretKey)),
  };
}

export function restoreEscrowKeypair(secretKeyJson: string): Keypair {
  const secretKey = Uint8Array.from(JSON.parse(secretKeyJson));
  return Keypair.fromSecretKey(secretKey);
}

export async function getEscrowUSDCAddress(
  escrowPublicKey: string
): Promise<string> {
  const escrowPubkey = new PublicKey(escrowPublicKey);
  const ata = await getAssociatedTokenAddress(
    new PublicKey(USDC_MINT),
    escrowPubkey
  );
  return ata.toBase58();
}

export interface WinnerPayout {
  walletAddress: string;
  betAmount: number;
  payoutAmount: number;
}

export async function resolveGameEscrow(params: {
  escrowSecretKey: string;
  winners: WinnerPayout[];
}): Promise<{ txIds: string[] }> {
  const { escrowSecretKey, winners } = params;

  const escrowKeypair = restoreEscrowKeypair(escrowSecretKey);
  const feePayer = PLATFORM_KEYPAIR ?? escrowKeypair;

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
    console.warn(
      "[escrow] escrow has no USDC balance, skipping on-chain transfers",
      {
        escrow: escrowKeypair.publicKey.toBase58(),
        escrowUSDC: escrowUSDC.toBase58(),
      }
    );
    return { txIds: [] };
  }

  const txIds: string[] = [];

  for (const winner of winners) {
    try {
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
          winner.payoutAmount,
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
      txIds.push(txid);
    } catch (err) {
      console.warn("[escrow] failed to pay winner", {
        address: winner.walletAddress,
        error: (err as Error).message,
      });
    }
  }

  return { txIds };
}

export async function verifyUSDCDeposit(
  txHash: string,
  expectedRecipient: string,
  expectedAmount: number
): Promise<boolean> {
  try {
    const tx = await connection.getParsedTransaction(txHash, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx || tx.meta?.err) {
      return false;
    }

    const recipientPubkey = new PublicKey(expectedRecipient);

    for (const instruction of tx.transaction.message.instructions) {
      if ("parsed" in instruction) {
        const parsed = instruction.parsed;
        if (
          parsed.type === "transfer" &&
          parsed.info.destination === recipientPubkey.toBase58() &&
          parsed.info.amount === String(expectedAmount)
        ) {
          return true;
        }
      }
    }

    return false;
  } catch {
    return false;
  }
}
