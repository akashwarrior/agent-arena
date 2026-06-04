"use client";

import type { GameAgent, GameWithAgents, UserGameBet } from "@/lib/api-types";
import type { Dispatch, SetStateAction } from "react";
import { memo, useMemo, useState } from "react";
import { useAtomValue } from "jotai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { agentAliveAtom, agentScoreAtom } from "@/lib/store";
import { ChevronRight, Loader2, Trophy, XCircle } from "lucide-react";
import { SlidingNumber } from "./ui/sliding-number";

type BetsViewProps = {
  game: GameWithAgents;
  bets: UserGameBet[];
  placeBet: (betAmount: string, agentId: string) => Promise<void>;
};

type BetAgentRowProps = {
  agent: GameAgent;
  alreadyBet: boolean;
  gameStatus: GameWithAgents["status"];
  isSelected: boolean;
  isWinner: boolean;
  placeBet: (betAmount: string, agentId: string) => Promise<void>;
  setSelectedAgentId: Dispatch<SetStateAction<string | null>>;
};

export function BetsView({ game, bets, placeBet }: BetsViewProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const userBets = useMemo(
    () => new Set(bets.map((bet) => bet.agentId)),
    [bets.length]
  );

  return (
    <div className="flex flex-col gap-2.5 px-5 pb-5">
      {game.agents.map((agent) => (
        <BetAgentRow
          key={agent.id}
          agent={agent}
          alreadyBet={userBets.has(agent.id)}
          gameStatus={game.status}
          isSelected={selectedAgentId === agent.id}
          isWinner={game.winnerAgentId === agent.id}
          placeBet={placeBet}
          setSelectedAgentId={setSelectedAgentId}
        />
      ))}
    </div>
  );
}

const BetAgentRow = memo(function BetAgentRow({
  agent,
  alreadyBet,
  gameStatus,
  isSelected,
  isWinner,
  placeBet,
  setSelectedAgentId,
}: BetAgentRowProps) {
  const alive = useAtomValue(agentAliveAtom(agent.id));
  const [betting, setBetting] = useState(false);
  const [betAmount, setBetAmount] = useState("");

  const agentCanBet = gameStatus === "LIVE" && !alreadyBet && alive !== false;
  const expanded = alive !== false && isSelected;

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border-2 transition-all duration-200 ${
        expanded
          ? "border-primary bg-primary/5 shadow-[3px_3px_0px_0px_var(--primary)]"
          : "border-border bg-card hover:shadow-[2px_2px_0px_0px_var(--border)]"
      } ${alive === false && !isWinner ? "opacity-40 grayscale" : ""}`}
    >
      <button
        type="button"
        disabled={!agentCanBet}
        className="flex w-full items-center justify-between p-3 text-left transition-colors duration-150"
        onClick={() =>
          setSelectedAgentId((prev) => (prev === agent.id ? null : agent.id))
        }
      >
        <div className="flex items-center gap-3">
          <div className="flex size-8 items-center justify-center rounded-lg border-2 border-border/30">
            <div
              className="size-3 rounded-full"
              style={{
                background: `linear-gradient(125deg, ${agent.color}, ${agent.accent})`,
              }}
            />
          </div>
          <div className="flex flex-col">
            <span className="font-display text-base font-bold text-foreground">
              {agent.name}
            </span>
            <span className="flex font-mono text-[10px] font-bold text-muted-foreground uppercase">
              Score:{" "}
              {agent.finalScore ? (
                agent.finalScore
              ) : (
                <SlidingScore agentId={agent.id} />
              )}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isWinner && (
            <span className="flex items-center gap-1 rounded-full border-2 border-primary/20 bg-primary/15 px-2 py-0.5 font-mono text-[10px] font-black text-primary uppercase">
              <Trophy className="size-3" /> Winner
            </span>
          )}
          {alive === false && !isWinner && (
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
              className={`size-4 text-muted-foreground transition-transform ${
                expanded ? "rotate-90 text-primary" : ""
              }`}
            />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t-2 border-border bg-secondary/20 px-4 py-4">
          <div className="flex flex-col gap-3">
            <div className="relative flex items-center">
              <Input
                type="number"
                placeholder="0.00"
                className="h-10 rounded-lg border-2 border-border bg-background px-3 font-mono text-sm font-bold shadow-none focus-visible:border-primary focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-inner-spin-button]:appearance-none"
                value={betAmount}
                onChange={(event) => setBetAmount(event.target.value)}
                min="0"
                step="0.01"
              />
              <span className="absolute right-3 font-mono text-[10px] font-bold text-muted-foreground">
                USDC
              </span>
            </div>
            <div className="flex gap-2">
              {[1, 5, 10, 25].map((amount) => (
                <button
                  key={amount}
                  type="button"
                  onClick={() => setBetAmount(String(amount))}
                  className={`flex-1 rounded-lg border-2 py-1.5 font-mono text-[10px] font-bold transition-all ${
                    betAmount === String(amount)
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-muted-foreground hover:bg-secondary"
                  }`}
                >
                  {amount}
                </button>
              ))}
            </div>
            <Button
              onClick={() => {
                setBetting(true);
                placeBet(betAmount, agent.id).finally(() => setBetting(false));
              }}
              disabled={betting || !betAmount}
              className="brutalist-button h-10 w-full rounded-lg bg-primary font-mono text-sm font-black tracking-wide text-primary-foreground disabled:opacity-50"
            >
              {betting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                "PLACE BET"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
});

function SlidingScore({ agentId }: { agentId: string }) {
  return <SlidingNumber value={useAtomValue(agentScoreAtom(agentId))} />;
}
