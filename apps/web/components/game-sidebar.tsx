"use client";

import { toast } from "sonner";
import { BetsView } from "./bets-view";
import { USDC_MINT } from "@/lib/jupiter";
import { TOKEN_PROGRAM_ADDRESS } from "@solana/client";
import {
  confirmBetDepositPayment,
  createBetDepositPayment,
  useGameDetail,
} from "@/lib/swr";
import {
  useSplToken,
  useWalletConnection,
  useWalletSession,
} from "@solana/react-hooks";
import { Wallet, CheckCircle2, Swords } from "lucide-react";

type GameSidebarProps = {
  gameId: number;
};

export function GameSidebar({ gameId }: GameSidebarProps) {
  const { game, userBets, mutate } = useGameDetail(gameId);
  const { connected, wallet } = useWalletConnection();
  const session = useWalletSession();

  const walletAddress = wallet?.account.address.toString();
  const { send, balance, refresh } = useSplToken(USDC_MINT, {
    config: {
      decimals: 6,
      tokenProgram: TOKEN_PROGRAM_ADDRESS,
    },
    owner: walletAddress,
    commitment: "processed",
    revalidateOnFocus: true,
  });

  const handlePlaceBet = async (betAmount: string, agentId: string) => {
    if (!connected || !wallet || !walletAddress) {
      toast.error("Wallet not connected");
      return;
    }

    if (!balance || balance.amount < Number(betAmount) * 1e6) {
      toast.error("Insufficient USDC balance");
      return;
    }
    try {
      const { payment } = await createBetDepositPayment(
        game.id,
        agentId,
        Number(betAmount),
        walletAddress
      );

      const txHash = await send(
        {
          amount: betAmount,
          amountInBaseUnits: false,
          ensureDestinationAta: false,
          destinationOwner: payment.toAddress,
          destinationToken: payment.toTokenAccount,
          authority: session,
          commitment: "processed",
        },
        { commitment: "processed", maxRetries: 3 }
      );

      await confirmBetDepositPayment(payment.id, txHash.toString());

      toast.success("Bet placed", {
        description: `${betAmount} USDC on ${agentId}`,
      });
      await mutate();
      await refresh();
    } catch (err) {
      console.log("Bet placement error:", err);
      toast.error(err instanceof Error ? err.message : "Bet failed");
    }
  };

  return (
    <aside className="flex h-full w-full flex-col overflow-y-auto">
      <div className="flex flex-col gap-1.5 border-b-2 border-border px-5 py-5">
        <div className="flex items-center gap-2">
          <Swords className="size-4 text-primary" />
          <h1 className="font-display text-2xl leading-tight font-black text-foreground">
            {game.name}
          </h1>
        </div>
        <p className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
          Arena R{game.id} · {game.agents.length} Agents
        </p>
      </div>

      <div className="grid grid-cols-2 gap-px border-b-2 border-border bg-border">
        <div className="flex flex-col gap-0.5 bg-card px-4 py-3">
          <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            Status
          </span>
          {game.status === "LIVE" ? (
            <span className="flex items-center gap-1.5 font-mono text-sm font-black text-destructive">
              <span className="live-dot" /> LIVE
            </span>
          ) : (
            <span className="font-mono text-sm font-bold text-muted-foreground">
              {game.status}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-0.5 bg-card px-4 py-3">
          <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            Prize Pool
          </span>
          <span className="font-mono text-sm font-black text-foreground">
            {game.totalPool.toFixed(1)}{" "}
            <span className="text-[10px] font-bold text-muted-foreground">
              USDC
            </span>
          </span>
        </div>
      </div>

      {userBets.length > 0 && (
        <div className="border-b-2 border-primary/20 bg-primary/5 px-5 py-4">
          <div className="mb-2 flex items-center gap-2">
            <CheckCircle2 className="size-4 text-primary" />
            <h4 className="font-mono text-[10px] font-black tracking-widest text-primary uppercase">
              Your Position
            </h4>
          </div>
          <div className="flex flex-col gap-2">
            {userBets.map((bet) => (
              <div
                key={bet.id}
                className="flex items-center justify-between rounded-lg border-2 border-primary/15 bg-card px-3 py-2"
              >
                <span className="font-mono text-xs font-bold text-foreground">
                  {bet.amount.toFixed(2)} USDC{" "}
                  <span className="text-muted-foreground">on</span>{" "}
                  {bet.agentName}
                </span>
                <span className="rounded-full border-2 border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-black text-primary uppercase">
                  {bet.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col px-5 pt-5 pb-2">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-mono text-[10px] font-black tracking-widest text-muted-foreground uppercase">
            Pick your Champion
          </h3>
          {!connected && game.status === "LIVE" && (
            <span className="flex items-center gap-1.5 rounded-full border-2 border-destructive/20 bg-destructive/5 px-2 py-0.5 font-mono text-[10px] font-bold text-destructive">
              <Wallet className="size-2.5" /> Not Connected
            </span>
          )}
        </div>
      </div>

      <BetsView game={game} bets={userBets} placeBet={handlePlaceBet} />
    </aside>
  );
}
