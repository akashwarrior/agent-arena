import type { GameWithAgents, UserGameBet } from "@/lib/api-types";
import Link from "next/link";
import { ArrowUpRight, Clock } from "lucide-react";

function summarizeBets(userBets: UserGameBet[]) {
  const totalWagered = userBets.reduce((sum, b) => sum + b.amount, 0);
  const totalPayout = userBets.reduce(
    (sum, b) => sum + (b.payoutAmount ?? 0),
    0
  );
  return {
    totalWagered,
    totalPayout,
    netResult: totalPayout - totalWagered,
  };
}

export function EndedLayout({
  game,
  userBets,
}: {
  game: GameWithAgents;
  userBets: UserGameBet[];
}) {
  const winner = game.agents.find((agent) => agent.id === game.winnerAgentId);
  const { totalWagered, totalPayout, netResult } = summarizeBets(userBets);
  const hasBets = userBets.length > 0;
  const isSettled = game.status === "SETTLED";
  const isPending = game.status === "ENDED" && hasBets;
  const isWin = netResult > 0;
  const isLoss = netResult < 0;

  return (
    <div className="relative flex w-full max-w-5xl flex-col overflow-hidden rounded-xl border-2 border-border bg-card shadow-[4px_4px_0px_0px_var(--border)] min-h-[400px] md:aspect-video">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />

      {winner && (
        <div
          className="absolute inset-0 opacity-15"
          style={{
            background: `radial-gradient(ellipse at 50% 0%, ${winner.color}50 0%, transparent 50%)`,
          }}
        />
      )}

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-center justify-between gap-2 border-b-2 border-border px-4 py-2 md:px-5 md:py-2.5">
          <div className="flex min-w-0 items-center gap-2">
            <span
              className={`size-1.5 shrink-0 rounded-full ${
                isPending ? "bg-warning animate-pulse" : "bg-success"
              }`}
            />
            <span className="truncate font-mono text-[10px] font-black tracking-widest text-foreground uppercase">
              {isSettled || !hasBets
                ? "Match Finished"
                : "Awaiting Settlement"}{" "}
              · R{game.id}
            </span>
          </div>
          <span
            className={`shrink-0 font-mono text-[10px] font-bold tracking-widest uppercase ${
              isPending ? "text-warning" : "text-muted-foreground"
            }`}
          >
            {isSettled ? "Settled" : isPending ? "Pending" : game.status}
          </span>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center gap-4 p-5 md:gap-6 md:p-8">
          {winner ? (
            <>
              <div className="flex flex-col items-center gap-2 md:gap-2.5">
                <div
                  className="size-10 rounded-lg border-2 md:size-12"
                  style={{
                    backgroundColor: winner.color,
                    borderColor: winner.accent,
                  }}
                />
                <p className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  Champion
                </p>
                <h3 className="font-display text-2xl font-black tracking-tight text-foreground uppercase md:text-3xl">
                  {winner.name}
                </h3>
                {winner.finalScore !== null && (
                  <p className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase tabular-nums">
                    {winner.finalScore} PTS
                  </p>
                )}
              </div>

              {hasBets ? (
                isSettled ? (
                  <div className="-rotate-1 rounded-xl border-2 border-border bg-background px-7 py-3 shadow-[4px_4px_0px_0px_var(--border)] md:px-9 md:py-4 md:shadow-[5px_5px_0px_0px_var(--border)]">
                    <p className="text-center font-mono text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                      {isWin ? "You Won" : isLoss ? "You Lost" : "Break Even"}
                    </p>
                    <p
                      className={`mt-1 whitespace-nowrap text-center font-display text-4xl font-black tracking-tighter tabular-nums md:text-5xl ${
                        isWin
                          ? "text-success"
                          : isLoss
                            ? "text-destructive"
                            : "text-foreground"
                      }`}
                    >
                      {isWin ? "+" : ""}
                      {netResult.toFixed(2)}
                      <span className="ml-1.5 font-mono text-sm font-black text-muted-foreground md:text-base">
                        USDC
                      </span>
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase tabular-nums md:mt-2">
                      <span>Wagered {totalWagered.toFixed(2)}</span>
                      <span className="text-muted-foreground/30">·</span>
                      <span>Returned {totalPayout.toFixed(2)}</span>
                    </div>
                  </div>
                ) : (
                  <div className="-rotate-1 rounded-xl border-2 border-warning/40 bg-warning/5 px-7 py-3 shadow-[4px_4px_0px_0px_var(--border)] md:px-9 md:py-4 md:shadow-[5px_5px_0px_0px_var(--border)]">
                    <div className="flex items-center justify-center gap-1.5">
                      <Clock className="size-3 animate-pulse text-warning" />
                      <p className="font-mono text-[10px] font-black tracking-widest text-warning uppercase">
                        Awaiting Settlement
                      </p>
                    </div>
                    <p className="mt-2 whitespace-nowrap text-center font-display text-3xl font-black tracking-tight text-foreground uppercase md:text-4xl">
                      {userBets.length}{" "}
                      {userBets.length === 1 ? "Bet" : "Bets"} Pending
                    </p>
                    <p className="mt-1.5 text-center font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                      Payouts will be processed shortly
                    </p>
                  </div>
                )
              ) : (
                <Link
                  href="/app"
                  prefetch={false}
                  className="brutalist-button inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-4 font-mono text-[10px] font-black tracking-widest text-primary-foreground uppercase md:h-10 md:px-5 md:text-[11px]"
                >
                  Browse Markets
                  <ArrowUpRight className="size-3 md:size-3.5" />
                </Link>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center gap-2 md:gap-3">
              <h3 className="font-display text-2xl font-black tracking-tight text-foreground uppercase md:text-3xl">
                No Winner
              </h3>
              <p className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Match concluded without a champion
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
