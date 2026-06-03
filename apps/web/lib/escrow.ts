import { Keypair, PublicKey, Connection, Transaction } from "@solana/web3.js";
import { createSolanaRpc, type Signature } from "@solana/kit";
import {
  getOrCreateAssociatedTokenAccount,
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const RPC_URL =
  process.env.SOLANA_RPC_URL ??
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
  "https://api.devnet.solana.com";

const connection = new Connection(RPC_URL, "confirmed");

const DEFAULT_USDC_MINT =
  process.env.NEXT_PUBLIC_USDC_MINT ??
  "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const DEFAULT_USDC_DECIMALS = 6;

export type EscrowTokenConfig = {
  publicKey: string;
  tokenAccount: string;
  usdcMintAddress: string;
  usdcDecimals: number;
};

export class EscrowTransferConfirmationError extends Error {
  txHash: string;

  constructor(txHash: string, message: string) {
    super(message);
    this.name = "EscrowTransferConfirmationError";
    this.txHash = txHash;
  }
}

function getSharedEscrowKeypair(): Keypair | null {
  const key = process.env.SHARED_ESCROW_PRIVATE_KEY;
  if (!key) return null;
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(key)));
}

function getConfiguredEscrowKeypair(publicKey?: string): Keypair | null {
  const escrow = getSharedEscrowKeypair();
  if (!escrow) return null;
  if (publicKey && escrow.publicKey.toBase58() !== publicKey) {
    console.warn("[escrow] shared escrow keypair does not match escrow row", {
      expected: publicKey,
      actual: escrow.publicKey.toBase58(),
    });
    return null;
  }

  return escrow;
}

async function getEscrowTokenAccount(
  escrow: Keypair,
  mint: PublicKey,
  config?: Partial<EscrowTokenConfig>
): Promise<PublicKey> {
  return config?.tokenAccount
    ? new PublicKey(config.tokenAccount)
    : getAssociatedTokenAddress(mint, escrow.publicKey);
}

function getUsdcDecimals(decimals?: number): number {
  return typeof decimals === "number" &&
    Number.isInteger(decimals) &&
    decimals >= 0
    ? decimals
    : DEFAULT_USDC_DECIMALS;
}

export async function getSharedEscrowUSDCAddress(
  mintAddress = DEFAULT_USDC_MINT
): Promise<string> {
  const escrow = getSharedEscrowKeypair();
  if (!escrow) return "";
  const ata = await getAssociatedTokenAddress(
    new PublicKey(mintAddress),
    escrow.publicKey
  );
  return ata.toBase58();
}

export function getSharedEscrowPublicKey(): string {
  return getSharedEscrowKeypair()?.publicKey.toBase58() ?? "";
}

export interface WinnerPayout {
  walletAddress: string;
  betAmount: bigint | number;
  payoutAmount: bigint | number;
}

export async function transferEscrowUsdc(params: {
  escrow: EscrowTokenConfig;
  toAddress: string;
  amount: bigint | number;
}): Promise<string> {
  const escrowKeypair = getConfiguredEscrowKeypair(params.escrow.publicKey);
  if (!escrowKeypair) {
    throw new Error("Escrow keypair is not configured");
  }

  const amount = BigInt(params.amount);
  if (amount <= BigInt(0)) {
    throw new Error("Transfer amount must be greater than 0");
  }

  const usdcMint = new PublicKey(params.escrow.usdcMintAddress);
  const escrowUSDC = await getEscrowTokenAccount(
    escrowKeypair,
    usdcMint,
    params.escrow
  );
  const recipientUSDC = await getOrCreateAssociatedTokenAccount(
    connection,
    escrowKeypair,
    usdcMint,
    new PublicKey(params.toAddress)
  );

  const tx = new Transaction().add(
    createTransferInstruction(
      escrowUSDC,
      recipientUSDC.address,
      escrowKeypair.publicKey,
      amount,
      [],
      TOKEN_PROGRAM_ID
    )
  );

  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = escrowKeypair.publicKey;
  tx.sign(escrowKeypair);

  const txid = await connection.sendRawTransaction(tx.serialize(), {
    maxRetries: 3,
  });

  try {
    const confirmation = await connection.confirmTransaction({
      signature: txid,
      blockhash,
      lastValidBlockHeight,
    });

    if (confirmation.value.err) {
      throw new Error(JSON.stringify(confirmation.value.err));
    }
  } catch (error) {
    throw new EscrowTransferConfirmationError(
      txid,
      `Transfer was submitted but could not be confirmed: ${
        error instanceof Error ? error.message : "unknown confirmation error"
      }`
    );
  }

  return txid;
}

export async function resolveGameEscrow(params: {
  escrow: EscrowTokenConfig;
  winners: WinnerPayout[];
  feeAmount?: bigint | number;
}): Promise<{ winnerTxIds: string[]; totalFee: number; feeTxId?: string }> {
  const { winners } = params;

  const escrowKeypair = getConfiguredEscrowKeypair(params.escrow.publicKey);
  if (!escrowKeypair) {
    return { winnerTxIds: [], totalFee: 0 };
  }

  const usdcMint = new PublicKey(params.escrow.usdcMintAddress);
  const escrowUSDC = await getEscrowTokenAccount(
    escrowKeypair,
    usdcMint,
    params.escrow
  );

  const winnerTxIds: string[] = [];
  let feeTxId: string | undefined;
  const feeAmount =
    params.feeAmount === undefined ? BigInt(0) : BigInt(params.feeAmount);

  if (feeAmount > BigInt(0)) {
    const feeWalletAddress = process.env.PLATFORM_FEE_WALLET_ADDRESS;
    if (!feeWalletAddress) {
      console.warn("[escrow] platform fee wallet is not configured");
    } else {
      try {
        const platformUSDC = await getOrCreateAssociatedTokenAccount(
          connection,
          escrowKeypair,
          usdcMint,
          new PublicKey(feeWalletAddress)
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
        feeTx.feePayer = escrowKeypair.publicKey;
        feeTx.sign(escrowKeypair);

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
        console.warn("[escrow] failed to send platform fee", {
          error: (err as Error).message,
        });
      }
    }
  }

  // pay winners
  for (const winner of winners) {
    try {
      const winnerShare = BigInt(winner.payoutAmount);
      const winnerPubkey = new PublicKey(winner.walletAddress);
      const winnerUSDC = await getOrCreateAssociatedTokenAccount(
        connection,
        escrowKeypair,
        usdcMint,
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
      tx.feePayer = escrowKeypair.publicKey;
      tx.sign(escrowKeypair);

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
  betAmount: bigint | number;
}

export async function cancelGameEscrow(
  refunds: RefundEntry[],
  escrowConfig?: EscrowTokenConfig
): Promise<{ txIds: string[] }> {
  const escrowKeypair = getConfiguredEscrowKeypair(escrowConfig?.publicKey);
  if (!escrowKeypair) return { txIds: [] };

  const usdcMint = new PublicKey(
    escrowConfig?.usdcMintAddress ?? DEFAULT_USDC_MINT
  );
  const escrowUSDC = await getEscrowTokenAccount(
    escrowKeypair,
    usdcMint,
    escrowConfig
  );

  const balance = await connection
    .getTokenAccountBalance(escrowUSDC)
    .catch(() => null);
  if (
    !balance ||
    balance.value.uiAmount === 0 ||
    balance.value.uiAmount === null
  ) {
    console.warn("[escrow] no USDC balance, skipping refunds");
    return { txIds: [] };
  }

  const txIds: string[] = [];
  for (const refund of refunds) {
    try {
      const amount = BigInt(refund.betAmount);
      if (amount <= BigInt(0)) continue;

      const refundPubkey = new PublicKey(refund.walletAddress);
      const refundUSDC = await getOrCreateAssociatedTokenAccount(
        connection,
        escrowKeypair,
        usdcMint,
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

      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash("confirmed");
      tx.recentBlockhash = blockhash;
      tx.feePayer = escrowKeypair.publicKey;

      tx.sign(escrowKeypair);

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
      console.warn("[escrow] failed to refund", {
        address: refund.walletAddress,
        error: (err as Error).message,
      });
    }
  }

  return { txIds };
}

type TokenBalance = {
  accountIndex: number;
  mint: string;
  owner?: string;
  uiTokenAmount: {
    amount: string;
    decimals: number;
    uiAmountString?: string;
  };
};

type ParsedInstruction = {
  program?: string;
  programId?: string;
  parsed?: {
    type: string;
    info: Record<string, unknown>;
  };
};

type ParsedTransaction = {
  slot: number;
  blockTime: number | null;
  meta: {
    err: unknown;
    fee: number;
    preTokenBalances?: TokenBalance[];
    postTokenBalances?: TokenBalance[];
    innerInstructions?: {
      index: number;
      instructions: ParsedInstruction[];
    }[];
  } | null;
  transaction: {
    signatures: string[];
    message: {
      accountKeys: {
        pubkey: string;
        signer: boolean;
        writable: boolean;
      }[];
      instructions: ParsedInstruction[];
    };
  };
};

type VerifyUsdcPaymentInput = {
  signature: string;
  senderWallet: string;
  recipientWallet: string;
  expectedAmount: string;
  mintAddress?: string;
  decimals?: number;
};

type VerifyUsdcPaymentResult = {
  ok: boolean;
  reason?: string;

  signature: string;
  slot?: number;
  blockTime?: number | null;

  senderWallet: string;
  recipientWallet: string;

  expectedRawAmount: string;
  expectedAmount: string;

  actualReceivedRawAmount?: string;
  actualReceivedAmount?: string;

  matchedTransfer?: {
    sourceTokenAccount: string;
    destinationTokenAccount: string;
    rawAmount: string;
    amount: string;
    instructionPath: string;
  };
};

function parseDecimalToUnits(value: string, decimals: number): bigint {
  if (!/^\d+(\.\d+)?$/.test(value)) {
    throw new Error(`Invalid decimal amount: ${value}`);
  }

  const [whole, fraction = ""] = value.split(".");

  if (fraction.length > decimals) {
    throw new Error(`Amount has more than ${decimals} decimals: ${value}`);
  }

  return BigInt(whole + fraction.padEnd(decimals, "0"));
}

function formatUnits(raw: bigint, decimals: number): string {
  const base = BigInt(10) ** BigInt(decimals);
  const whole = raw / base;
  const fraction = raw % base;

  const fractionText = fraction
    .toString()
    .padStart(decimals, "0")
    .replace(/0+$/, "");

  return fractionText ? `${whole}.${fractionText}` : whole.toString();
}

function isSplTokenInstruction(ix: ParsedInstruction): boolean {
  return (
    ix.program === "spl-token" ||
    ix.program === "spl-token-2022" ||
    ix.programId === "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" ||
    ix.programId === "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
  );
}

function collectInstructions(tx: ParsedTransaction) {
  const topLevel = tx.transaction.message.instructions.map((ix, index) => ({
    ix,
    path: `instructions[${index}]`,
  }));

  const inner =
    tx.meta?.innerInstructions?.flatMap((group) =>
      group.instructions.map((ix, index) => ({
        ix,
        path: `innerInstructions[${group.index}][${index}]`,
      }))
    ) ?? [];

  return [...topLevel, ...inner];
}

function buildTokenAccountMap(tx: ParsedTransaction) {
  const accountKeys = tx.transaction.message.accountKeys;

  const map = new Map<
    string,
    {
      owner: string | null;
      mint: string;
      decimals: number;
    }
  >();

  const add = (balance: TokenBalance) => {
    const tokenAccount = accountKeys[balance.accountIndex]?.pubkey;
    if (!tokenAccount) return;

    map.set(tokenAccount, {
      owner: balance.owner ?? null,
      mint: balance.mint,
      decimals: balance.uiTokenAmount.decimals,
    });
  };

  for (const balance of tx.meta?.preTokenBalances ?? []) add(balance);
  for (const balance of tx.meta?.postTokenBalances ?? []) add(balance);

  return map;
}

function getOwnerTokenDelta(params: {
  tx: ParsedTransaction;
  owner: string;
  mint: string;
}): bigint {
  const { tx, owner, mint } = params;

  const preByIndex = new Map<number, TokenBalance>();
  const postByIndex = new Map<number, TokenBalance>();

  for (const balance of tx.meta?.preTokenBalances ?? []) {
    preByIndex.set(balance.accountIndex, balance);
  }

  for (const balance of tx.meta?.postTokenBalances ?? []) {
    postByIndex.set(balance.accountIndex, balance);
  }

  const indexes = new Set([...preByIndex.keys(), ...postByIndex.keys()]);

  let totalDelta = BigInt(0);

  for (const index of indexes) {
    const pre = preByIndex.get(index);
    const post = postByIndex.get(index);

    const tokenMint = post?.mint ?? pre?.mint;
    const tokenOwner = post?.owner ?? pre?.owner;

    if (tokenMint !== mint) continue;
    if (tokenOwner !== owner) continue;

    const preAmount = BigInt(pre?.uiTokenAmount.amount ?? "0");
    const postAmount = BigInt(post?.uiTokenAmount.amount ?? "0");

    totalDelta += postAmount - preAmount;
  }

  return totalDelta;
}

function findDirectUsdcTransfer(params: {
  tx: ParsedTransaction;
  senderWallet: string;
  recipientWallet: string;
  expectedRawAmount: bigint;
  mintAddress: string;
  decimals: number;
  allowOverpay: boolean;
}) {
  const {
    tx,
    senderWallet,
    recipientWallet,
    expectedRawAmount,
    mintAddress,
    decimals,
    allowOverpay,
  } = params;

  const tokenAccountMap = buildTokenAccountMap(tx);

  for (const { ix, path } of collectInstructions(tx)) {
    if (!isSplTokenInstruction(ix)) continue;

    const parsed = ix.parsed;
    if (!parsed) continue;

    if (parsed.type !== "transfer" && parsed.type !== "transferChecked") {
      continue;
    }

    const info = parsed.info;

    const sourceTokenAccount =
      typeof info.source === "string" ? info.source : undefined;
    const destinationTokenAccount =
      typeof info.destination === "string" ? info.destination : undefined;

    if (!sourceTokenAccount || !destinationTokenAccount) continue;

    const sourceMeta = tokenAccountMap.get(sourceTokenAccount);
    const destinationMeta = tokenAccountMap.get(destinationTokenAccount);

    const mint =
      typeof info.mint === "string"
        ? info.mint
        : (sourceMeta?.mint ?? destinationMeta?.mint);
    if (mint !== mintAddress) continue;

    const sourceOwner = sourceMeta?.owner;
    const destinationOwner = destinationMeta?.owner;

    if (sourceOwner !== senderWallet) continue;
    if (destinationOwner !== recipientWallet) continue;

    const tokenAmount =
      typeof info.tokenAmount === "object" && info.tokenAmount !== null
        ? (info.tokenAmount as { amount?: unknown })
        : null;
    const rawAmount = BigInt(String(tokenAmount?.amount ?? info.amount ?? "0"));

    const amountOk = allowOverpay
      ? rawAmount >= expectedRawAmount
      : rawAmount === expectedRawAmount;

    if (!amountOk) continue;

    return {
      sourceTokenAccount,
      destinationTokenAccount,
      rawAmount,
      amount: formatUnits(rawAmount, decimals),
      instructionPath: path,
    };
  }

  return null;
}

export async function verifyUsdcPayment(
  input: VerifyUsdcPaymentInput
): Promise<VerifyUsdcPaymentResult> {
  const mintAddress = input.mintAddress ?? DEFAULT_USDC_MINT;
  const decimals = getUsdcDecimals(input.decimals);
  const expectedRawAmount = parseDecimalToUnits(input.expectedAmount, decimals);

  const baseResult = {
    signature: input.signature,
    senderWallet: input.senderWallet,
    recipientWallet: input.recipientWallet,
    expectedRawAmount: expectedRawAmount.toString(),
    expectedAmount: input.expectedAmount,
  };

  const rpc = createSolanaRpc(RPC_URL);

  const tx = (await rpc
    .getTransaction(input.signature as Signature, {
      commitment: "confirmed",
      encoding: "jsonParsed",
      maxSupportedTransactionVersion: 0,
    })
    .send()) as ParsedTransaction | null;

  if (!tx) {
    return {
      ok: false,
      reason: "Transaction not found or not finalized yet",
      ...baseResult,
    };
  }

  if (!tx.meta) {
    return {
      ok: false,
      reason: "Transaction metadata missing",
      slot: tx.slot,
      blockTime: tx.blockTime,
      ...baseResult,
    };
  }

  if (tx.meta.err) {
    return {
      ok: false,
      reason: `Transaction failed: ${JSON.stringify(tx.meta.err)}`,
      slot: tx.slot,
      blockTime: tx.blockTime,
      ...baseResult,
    };
  }

  const senderSigned = tx.transaction.message.accountKeys.some(
    (account) => account.pubkey === input.senderWallet && account.signer
  );

  if (!senderSigned) {
    return {
      ok: false,
      reason: "Sender wallet did not sign this transaction",
      slot: tx.slot,
      blockTime: tx.blockTime,
      ...baseResult,
    };
  }

  const recipientDelta = getOwnerTokenDelta({
    tx,
    owner: input.recipientWallet,
    mint: mintAddress,
  });

  const senderDelta = getOwnerTokenDelta({
    tx,
    owner: input.senderWallet,
    mint: mintAddress,
  });

  if (recipientDelta < expectedRawAmount) {
    return {
      ok: false,
      reason: "Recipient did not receive the expected USDC amount",
      slot: tx.slot,
      blockTime: tx.blockTime,
      actualReceivedRawAmount: recipientDelta.toString(),
      actualReceivedAmount: formatUnits(recipientDelta, decimals),
      ...baseResult,
    };
  }

  const senderSentAmount = -senderDelta;

  const senderAmountOk = senderSentAmount >= expectedRawAmount;

  if (!senderAmountOk) {
    return {
      ok: false,
      reason: "Sender did not send the expected USDC amount",
      slot: tx.slot,
      blockTime: tx.blockTime,
      actualReceivedRawAmount: recipientDelta.toString(),
      actualReceivedAmount: formatUnits(recipientDelta, decimals),
      ...baseResult,
    };
  }

  const matchedTransfer = findDirectUsdcTransfer({
    tx,
    senderWallet: input.senderWallet,
    recipientWallet: input.recipientWallet,
    expectedRawAmount,
    mintAddress,
    decimals,
    allowOverpay: true,
  });

  if (!matchedTransfer) {
    return {
      ok: false,
      reason:
        "No direct USDC transfer instruction matched sender, recipient, and amount",
      slot: tx.slot,
      blockTime: tx.blockTime,
      actualReceivedRawAmount: recipientDelta.toString(),
      actualReceivedAmount: formatUnits(recipientDelta, decimals),
      ...baseResult,
    };
  }

  return {
    ok: true,
    slot: tx.slot,
    blockTime: tx.blockTime,
    actualReceivedRawAmount: recipientDelta.toString(),
    actualReceivedAmount: formatUnits(recipientDelta, decimals),
    matchedTransfer: {
      sourceTokenAccount: matchedTransfer.sourceTokenAccount,
      destinationTokenAccount: matchedTransfer.destinationTokenAccount,
      rawAmount: matchedTransfer.rawAmount.toString(),
      amount: matchedTransfer.amount,
      instructionPath: matchedTransfer.instructionPath,
    },
    ...baseResult,
  };
}
