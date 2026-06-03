"use client";

import { toast } from "sonner";
import { useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { agentsSnapshotAtom, matchWinnerAtom } from "@/lib/store";

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

import {
  Loader2,
  Wallet,
  CheckCircle2,
  XCircle,
  Trophy,
  Swords,
  ChevronRight,
} from "lucide-react";

type GameSidebarProps = {
  gameId: number;
};

export function GameSidebar({ gameId }: GameSidebarProps) {
  const { game, userBets, mutate } = useGameDetail(gameId);

  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  const agents = useAtomValue(agentsSnapshotAtom);
  const matchWinner = useAtomValue(matchWinnerAtom);

  const isLiveGame = game.status === "LIVE";
  const displayPool = game.totalPool;

  const agentAliveMap = new Map<string, boolean>();
  const agentScoreMap = new Map<string, number>();

  if (agents.length) {
    for (const agent of agents) {
      agentAliveMap.set(agent.id, agent.alive);
      agentScoreMap.set(agent.id, agent.score);
    }
  } else {
    for (const agent of game.agents) {
      agentScoreMap.set(agent.id, agent.finalScore ?? 0);
    }
  }

  const canBet = isLiveGame || game.status === "LIVE";
  const hasBetOnAgent = (agentId: string) =>
    userBets.some((b) => b.agentId === agentId);
  const selectedAgentData = useMemo(
    () => game.agents.find((agent) => agent.id === selectedAgent),
    [game.agents, selectedAgent]
  );
  const isBusy = submitting;

  const handlePlaceBet = async () => {
    const now = performance.now();
    if (!selectedAgent || !selectedAgentData) return;

    if (!connected || !wallet || !walletAddress) {
      toast.error("Wallet not connected");
      return;
    }

    if (!balance || balance.amount < Number(betAmount) * 1e6) {
      toast.error("Insufficient USDC balance");
      return;
    }

    setSubmitting(true);
    try {
      console.log("Requesting bet swap...", performance.now() - now);
      const { payment } = await createBetDepositPayment(
        game.id,
        selectedAgent,
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

      console.log("USDC transfer confirmed:", performance.now() - now);

      await confirmBetDepositPayment(payment.id, txHash.toString());

      console.log("Bet confirmed on backend:", performance.now() - now);

      toast.success("Bet placed", {
        description: `${betAmount} USDC on ${selectedAgentData.name}`,
      });
      setSelectedAgent(null);
      setBetAmount("");
      await mutate();
      await refresh();
    } catch (err) {
      console.log("Bet placement error:", err);
      toast.error(err instanceof Error ? err.message : "Bet failed");
    } finally {
      setSubmitting(false);
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
            {Number(displayPool).toFixed(1)}{" "}
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
          {!connected && canBet && (
            <span className="flex items-center gap-1.5 rounded-full border-2 border-destructive/20 bg-destructive/5 px-2 py-0.5 font-mono text-[10px] font-bold text-destructive">
              <Wallet className="size-2.5" /> Not Connected
            </span>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-2.5 px-5 pb-5">
        {game.agents.map((a) => {
          const alreadyBet = hasBetOnAgent(a.id);
          const isAlive = agentAliveMap.get(a.id) ?? true;
          const score = agentScoreMap.get(a.id) ?? 0;
          const agentCanBet = canBet && !alreadyBet && isAlive;
          const isWinner =
            matchWinner?.id === a.id || game.winnerAgentId === a.id;

          const isSelected = selectedAgent === a.id;

          return (
            <div
              key={a.id}
              className={`flex flex-col overflow-hidden rounded-xl border-2 transition-all duration-200 ${isSelected
                ? "border-primary bg-primary/5 shadow-[3px_3px_0px_0px_var(--primary)]"
                : "border-border bg-card hover:shadow-[2px_2px_0px_0px_var(--border)]"
                } ${!isAlive && !isWinner ? "opacity-40 grayscale" : ""}`}
            >
              <button
                type="button"
                disabled={!agentCanBet}
                onClick={() => {
                  if (agentCanBet) setSelectedAgent(isSelected ? null : a.id);
                }}
                className="flex w-full items-center justify-between p-3 text-left transition-colors duration-150"
              >
                <div className="flex items-center gap-3">
                  <div className="flex size-8 items-center justify-center rounded-lg border-2 border-border/30">
                    <div
                      className="size-3 rounded-full"
                      style={{
                        background:
                          "linear-gradient(125deg, " +
                          a.color +
                          ", " +
                          a.accent +
                          ")",
                      }}
                    />
                  </div>
                  <div className="flex flex-col">
                    <span className="font-display text-base font-bold text-foreground">
                      {a.name}
                    </span>
                    <span className="font-mono text-[10px] font-bold text-muted-foreground uppercase">
                      Score: {score}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isWinner && (
                    <span className="flex items-center gap-1 rounded-full border-2 border-primary/20 bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-black text-primary uppercase">
                      <Trophy className="size-3" /> Winner
                    </span>
                  )}
                  {!isAlive && !isWinner && (
                    <span className="flex items-center gap-1 rounded-full border-2 border-border bg-muted/50 px-2 py-0.5 font-mono text-[10px] font-bold text-muted-foreground uppercase">
                      <XCircle className="size-3" /> Out
                    </span>
                  )}
                  {alreadyBet && (
                    <span className="rounded-full border-2 border-primary/20 bg-primary/10 px-2 py-0.5 font-mono text-[10px] font-black text-primary uppercase">
                      Bet Placed
                    </span>
                  )}
                  {agentCanBet && (
                    <ChevronRight
                      className={`size-4 text-muted-foreground transition-transform ${isSelected ? "rotate-90 text-primary" : ""}`}
                    />
                  )}
                </div>
              </button>

              {isSelected && (
                <div className="border-t-2 border-border bg-secondary/20 px-4 py-4">
                  <div className="flex flex-col gap-3">
                    <div className="relative flex items-center">
                      <Input
                        type="number"
                        placeholder="0.00"
                        className="[&::-webkit-inner-spin-button]:appearance-none h-10 rounded-lg border-2 border-border bg-background px-3 font-mono text-sm font-bold shadow-none focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0"
                        value={betAmount}
                        onChange={(e) => setBetAmount(e.target.value)}
                        min="0"
                        step="0.01"
                      />
                      <span className="absolute right-3 font-mono text-[10px] font-bold text-muted-foreground">
                        USDC
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {[1, 5, 10, 25].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setBetAmount(String(amt))}
                          className={`flex-1 rounded-lg border-2 py-1.5 font-mono text-[10px] font-bold transition-all ${betAmount === String(amt)
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-muted-foreground hover:bg-secondary"
                            }`}
                        >
                          {amt}
                        </button>
                      ))}
                    </div>
                    <Button
                      onClick={handlePlaceBet}
                      disabled={isBusy || !betAmount || !connected}
                      className="brutalist-button h-10 w-full rounded-lg bg-primary font-mono text-sm font-black tracking-wide text-primary-foreground disabled:opacity-50"
                    >
                      {isBusy ? (
                        <Loader2 className="size-4 animate-spin" />
                      ) : !connected ? (
                        "CONNECT WALLET"
                      ) : (
                        "PLACE BET"
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </aside>
  );
}
