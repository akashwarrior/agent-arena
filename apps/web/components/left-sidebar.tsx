"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { selectedGameAtom, betsAtom } from "@/lib/store";
import { MOCK_GAMES } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Zap, Lock, ChevronRight, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Bet, Game } from "@repo/db";

function statusBadge(status: Game["status"]) {
  switch (status) {
    case "LIVE":
      return (
        <Badge
          variant="outline"
          className="border-nd-success/30 font-mono text-[9px] text-nd-success"
        >
          ● LIVE
        </Badge>
      );
    case "UPCOMING":
      return (
        <Badge
          variant="outline"
          className="border-nd-border-visible font-mono text-[9px] text-nd-text-secondary"
        >
          OPEN
        </Badge>
      );
    case "ENDED":
      return (
        <Badge
          variant="outline"
          className="border-nd-border font-mono text-[9px] text-nd-text-disabled"
        >
          ENDED
        </Badge>
      );
  }
}

function betStatusColor(status: Bet["status"]) {
  switch (status) {
    case "PENDING":
      return "text-nd-text-primary";
    case "WON":
      return "text-nd-success";
    case "LOST":
      return "text-nd-accent";
  }
}

function GamesList({
  onSelectGame,
  bets,
}: {
  onSelectGame: (game: Game) => void;
  bets: Bet[];
}) {
  return (
    <div className="flex flex-col gap-nd-xs">
      <span className="font-mono text-[11px] tracking-[0.08em] text-nd-text-secondary uppercase">
        ALL GAMES
      </span>
      {MOCK_GAMES.map((game) => {
        const hasBet = bets.some((b) => b.gameId === game.id);
        return (
          <button
            key={game.id}
            type="button"
            onClick={() => onSelectGame(game)}
            className="flex w-full items-center justify-between rounded-lg border border-nd-border px-nd-sm py-nd-sm text-left transition-colors hover:border-nd-border-visible hover:bg-nd-surface-raised"
          >
            <div className="flex flex-col gap-nd-2xs">
              <div className="flex items-center gap-nd-sm">
                <span className="font-body text-sm text-nd-text-primary">
                  {game.name}
                </span>
                {hasBet && (
                  <span className="inline-block size-1.5 rounded-full bg-nd-success" />
                )}
              </div>
              <span className="font-mono text-[10px] text-nd-text-disabled tabular-nums">
                {game.totalPool.toFixed(1)} SOL · R{game.id}
              </span>
            </div>
            <div className="flex items-center gap-nd-sm">
              {statusBadge(game.status)}
              <ChevronRight className="size-3.5 text-nd-text-disabled" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

function GameDetail({
  game,
  onBack,
  onPlaceBet,
  existingBet,
}: {
  game: Game;
  onBack: () => void;
  onPlaceBet: (agentId: string, agentName: string, amount: number) => void;
  existingBet: Bet | undefined;
}) {
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  const canBet = game.status === "UPCOMING" && !existingBet;
  const isLive = game.status === "LIVE";
  const agent = game?.agents.find((a) => a.id === selectedAgent);

  const handleConfirmBet = () => {
    if (!selectedAgent || !agent) return;
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return;
    onPlaceBet(selectedAgent, agent.name, amount);
    setConfirmOpen(false);
    setSelectedAgent(null);
    setBetAmount("");
  };

  return (
    <>
      <div className="flex flex-col gap-nd-md">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-nd-xs text-nd-text-secondary transition-colors hover:text-nd-text-primary"
        >
          <ArrowLeft className="size-3.5" />
          <span className="font-mono text-[10px] tracking-[0.06em] uppercase">
            ALL GAMES
          </span>
        </button>

        <div className="flex items-center justify-between">
          <span className="font-body text-lg font-medium text-nd-text-display">
            {game.name}
          </span>
          {statusBadge(game.status)}
        </div>

        <div className="flex items-center gap-nd-md">
          <div className="flex flex-col">
            <span className="font-mono text-[10px] tracking-[0.08em] text-nd-text-disabled uppercase">
              POOL
            </span>
            <span className="font-mono text-sm font-bold text-nd-text-display tabular-nums">
              {game.totalPool.toFixed(1)} SOL
            </span>
          </div>
          <Separator orientation="vertical" className="h-8 bg-nd-border" />
          <div className="flex flex-col">
            <span className="font-mono text-[10px] tracking-[0.08em] text-nd-text-disabled uppercase">
              ROUND
            </span>
            <span className="font-mono text-sm text-nd-text-primary tabular-nums">
              {game.id}
            </span>
          </div>
          <Separator orientation="vertical" className="h-8 bg-nd-border" />
          <div className="flex flex-col">
            <span className="font-mono text-[10px] tracking-[0.08em] text-nd-text-disabled uppercase">
              AGENTS
            </span>
            <span className="font-mono text-sm text-nd-text-primary tabular-nums">
              {game?.agents.length}
            </span>
          </div>
        </div>

        {isLive && (
          <div className="flex items-center gap-nd-sm rounded-lg border border-nd-border-visible bg-nd-surface-raised px-nd-sm py-nd-sm">
            <Lock className="size-3.5 text-nd-text-disabled" />
            <span className="font-mono text-[10px] tracking-[0.06em] text-nd-text-secondary uppercase">
              BETTING CLOSED — MATCH IS LIVE
            </span>
          </div>
        )}

        {existingBet && (
          <div className="rounded-lg border border-nd-success/20 bg-nd-success/5 px-nd-sm py-nd-sm">
            <span className="font-mono text-[10px] tracking-[0.06em] text-nd-success uppercase">
              YOU BET {existingBet.amount.toFixed(2)} SOL ON{" "}
              {existingBet.agentId.toUpperCase()}
            </span>
          </div>
        )}

        {game.status === "ENDED" && game.winnerAgentId && (
          <div className="rounded-lg border border-nd-border bg-nd-surface-raised px-nd-sm py-nd-sm">
            <span className="font-mono text-[10px] tracking-[0.08em] text-nd-text-disabled uppercase">
              WINNER:{" "}
              <span className="text-nd-text-display">
                {game.winnerAgentId.toUpperCase()}
              </span>
            </span>
          </div>
        )}

        <Separator className="bg-nd-border" />

        <span className="font-mono text-[11px] tracking-[0.08em] text-nd-text-secondary uppercase">
          {canBet ? "TAP AN AGENT TO BET" : "AGENTS"}
        </span>

        {game?.agents.map((a) => {
          const isSelected = selectedAgent === a.id;
          const isBetAgent = existingBet?.agentId === a.id;
          return (
            <div key={a.id} className="flex flex-col">
              <button
                type="button"
                disabled={!canBet}
                onClick={() => {
                  if (!canBet) return;
                  setSelectedAgent(isSelected ? null : a.id);
                  setBetAmount("");
                }}
                className={`flex w-full items-center justify-between rounded-lg border px-nd-sm py-nd-sm text-left transition-colors ${
                  isSelected
                    ? "border-nd-text-display bg-nd-surface-raised"
                    : isBetAgent
                      ? "border-nd-success/30 bg-nd-success/5"
                      : "border-nd-border hover:border-nd-border-visible"
                } ${!canBet ? "cursor-default" : ""}`}
              >
                <div className="flex items-center gap-nd-sm">
                  <span
                    className="inline-block size-2.5 rounded-full"
                    style={{ backgroundColor: a.color }}
                  />
                  <span
                    className={`font-body text-sm ${
                      a.alive
                        ? "text-nd-text-primary"
                        : "text-nd-text-disabled line-through"
                    }`}
                  >
                    {a.name}
                  </span>
                  {game.winnerAgentId === a.id && (
                    <Badge
                      variant="outline"
                      className="border-nd-text-display/20 font-mono text-[8px] text-nd-text-display"
                    >
                      WINNER
                    </Badge>
                  )}
                  {isBetAgent && (
                    <Badge
                      variant="outline"
                      className="border-nd-success/30 font-mono text-[8px] text-nd-success"
                    >
                      YOUR BET
                    </Badge>
                  )}
                </div>
                {game.status !== "UPCOMING" && (
                  <span className="font-mono text-xs text-nd-text-secondary tabular-nums">
                    {a.score}
                  </span>
                )}
              </button>

              {canBet && isSelected && (
                <div className="mt-nd-xs flex items-center gap-nd-xs rounded-lg border border-nd-text-display/20 bg-nd-surface-raised px-nd-sm py-nd-sm">
                  <Input
                    id={`bet-${a.id}`}
                    type="number"
                    placeholder="0.00"
                    autoFocus
                    className="h-9 flex-1 border-nd-border-visible bg-nd-surface font-mono text-sm text-nd-text-primary placeholder:text-nd-text-disabled"
                    value={betAmount}
                    onChange={(e) => setBetAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                  <span className="font-mono text-[10px] text-nd-text-disabled">
                    SOL
                  </span>
                  <Button
                    id={`confirm-bet-${a.id}`}
                    disabled={!betAmount || parseFloat(betAmount) <= 0}
                    className="h-9 rounded-full bg-nd-text-display px-nd-md font-mono text-xs tracking-[0.06em] text-nd-black uppercase hover:bg-nd-text-primary disabled:opacity-30"
                    onClick={() => setConfirmOpen(true)}
                  >
                    BET
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-sm border-nd-border-visible bg-nd-surface">
          <DialogHeader>
            <DialogTitle className="font-body text-lg text-nd-text-display">
              Confirm Bet
            </DialogTitle>
            <DialogDescription className="font-mono text-xs tracking-[0.04em] text-nd-text-secondary">
              Placing bet on {agent?.name} in {game.name}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-nd-sm pt-nd-xs">
            <div className="flex items-center justify-between py-nd-xs">
              <span className="font-mono text-[11px] tracking-[0.08em] text-nd-text-secondary uppercase">
                AGENT
              </span>
              <span className="font-body text-sm text-nd-text-primary">
                {agent?.name}
              </span>
            </div>
            <Separator className="bg-nd-border" />
            <div className="flex items-center justify-between py-nd-xs">
              <span className="font-mono text-[11px] tracking-[0.08em] text-nd-text-secondary uppercase">
                AMOUNT
              </span>
              <span className="font-mono text-sm font-bold text-nd-text-display tabular-nums">
                {betAmount} SOL
              </span>
            </div>
            <Separator className="bg-nd-border" />
            <div className="flex items-center justify-between py-nd-xs">
              <span className="font-mono text-[11px] tracking-[0.08em] text-nd-text-secondary uppercase">
                PAYOUT
              </span>
              <span className="font-mono text-[10px] text-nd-text-disabled">
                WINNER TAKES ALL
              </span>
            </div>
            <div className="flex gap-nd-sm pt-nd-sm">
              <Button
                variant="outline"
                className="flex-1 rounded-full border-nd-border-visible font-mono text-xs tracking-[0.06em] text-nd-text-secondary uppercase"
                onClick={() => setConfirmOpen(false)}
              >
                CANCEL
              </Button>
              <Button
                className="flex-1 rounded-full bg-nd-text-display font-mono text-xs tracking-[0.06em] text-nd-black uppercase hover:bg-nd-text-primary"
                onClick={handleConfirmBet}
              >
                CONFIRM
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function MyBetsView({ bets }: { bets: Bet[] }) {
  return (
    <div className="flex flex-col">
      <span className="mb-nd-sm font-mono text-[11px] tracking-[0.08em] text-nd-text-secondary uppercase">
        BET HISTORY
      </span>

      {bets.length === 0 ? (
        <div className="py-nd-3xl text-center">
          <p className="font-mono text-sm text-nd-text-secondary">
            [NO BETS PLACED]
          </p>
          <p className="mt-nd-xs font-mono text-[10px] text-nd-text-disabled">
            Select a game and pick an agent to bet
          </p>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-nd-xs">
            {bets.map((bet) => (
              <div
                key={bet.id}
                className="flex items-center justify-between border-b border-nd-border py-nd-sm last:border-b-0"
              >
                <div className="flex flex-col gap-nd-2xs">
                  <span className="font-body text-sm text-nd-text-primary">
                    {bet.agentId}
                  </span>
                  <span className="font-mono text-[10px] tracking-[0.08em] text-nd-text-disabled uppercase">
                    {bet.gameId}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-nd-2xs">
                  <span className="font-mono text-sm text-nd-text-primary tabular-nums">
                    {bet.amount.toFixed(2)} SOL
                  </span>
                  <div className="flex items-center gap-nd-xs">
                    {bet.status === "WON" && (
                      <span className="font-mono text-[10px] text-nd-success tabular-nums">
                        +{((bet.payout || 0) - bet.amount).toFixed(2)}
                      </span>
                    )}
                    {bet.status === "LOST" && (
                      <span className="font-mono text-[10px] text-nd-accent tabular-nums">
                        -{bet.amount.toFixed(2)}
                      </span>
                    )}
                    <span
                      className={`font-mono text-[10px] tracking-[0.08em] uppercase ${betStatusColor(bet.status)}`}
                    >
                      {bet.status === "PENDING" && "● "}
                      {bet.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-nd-sm bg-nd-border" />
          <div className="flex flex-col gap-nd-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-[0.08em] text-nd-text-disabled uppercase">
                TOTAL WAGERED
              </span>
              <span className="font-mono text-xs text-nd-text-secondary tabular-nums">
                {bets.reduce((s, b) => s + b.amount, 0).toFixed(2)} SOL
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] tracking-[0.08em] text-nd-text-disabled uppercase">
                NET P&L
              </span>
              {(() => {
                const totalIn = bets.reduce((s, b) => s + b.amount, 0);
                const totalOut = bets
                  .filter((b) => b.status === "WON")
                  .reduce((s, b) => s + (b.payout || 0), 0);
                const pnl = totalOut - totalIn;
                return (
                  <span
                    className={`font-mono text-xs font-bold tabular-nums ${pnl >= 0 ? "text-nd-success" : "text-nd-accent"}`}
                  >
                    {pnl >= 0 ? "+" : ""}
                    {pnl.toFixed(2)} SOL
                  </span>
                );
              })()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export function LeftSidebarContent({ tab }: { tab: "games" | "bets" }) {
  const [selectedGame, setSelectedGame] = useAtom(selectedGameAtom);
  const [bets, setBets] = useAtom(betsAtom);

  const handlePlaceBet = (
    agentId: string,
    agentName: string,
    amount: number
  ) => {
    if (!selectedGame) return;
    const newBet: Bet = {
      id: `bet-${Date.now()}`,
      gameId: selectedGame.id,
      payoutTxHash: "",
      settledAt: null,
      txHash: "",
      userId: "",
      walletAddress: "",
      agentId,
      amount,
      payout: 0,
      status: "PENDING",
      placedAt: new Date(),
    };
    setBets((prev) => [newBet, ...prev]);
  };

  const existingBet = selectedGame
    ? bets.find((b) => b.gameId === selectedGame.id)
    : undefined;

  return (
    <ScrollArea className="h-full">
      <div className="p-nd-md">
        {tab === "games" ? (
          selectedGame ? (
            <GameDetail
              game={selectedGame}
              onBack={() => setSelectedGame(null)}
              onPlaceBet={handlePlaceBet}
              existingBet={existingBet}
            />
          ) : (
            <GamesList onSelectGame={setSelectedGame} bets={bets} />
          )
        ) : (
          <MyBetsView bets={bets} />
        )}
      </div>
    </ScrollArea>
  );
}

export function LeftSidebar() {
  const [tab, setTab] = useState<"games" | "bets">("games");

  return (
    <aside className="flex h-full w-[340px] flex-col border-r border-nd-border bg-nd-surface">
      <div className="flex border-b border-nd-border">
        <button
          type="button"
          onClick={() => setTab("games")}
          className={`flex-1 py-nd-sm font-mono text-[11px] tracking-[0.08em] uppercase transition-colors ${
            tab === "games"
              ? "border-b-2 border-nd-text-display text-nd-text-display"
              : "text-nd-text-disabled hover:text-nd-text-secondary"
          }`}
        >
          GAMES
        </button>
        <button
          type="button"
          onClick={() => setTab("bets")}
          className={`flex-1 py-nd-sm font-mono text-[11px] tracking-[0.08em] uppercase transition-colors ${
            tab === "bets"
              ? "border-b-2 border-nd-text-display text-nd-text-display"
              : "text-nd-text-disabled hover:text-nd-text-secondary"
          }`}
        >
          MY BETS
        </button>
      </div>

      <div className="min-h-0 flex-1">
        <LeftSidebarContent tab={tab} />
      </div>

      <div className="flex items-center justify-between border-t border-nd-border px-nd-md py-nd-sm">
        <div className="flex items-center gap-nd-xs">
          <Zap className="size-3 text-nd-text-disabled" />
          <span className="font-mono text-[10px] tracking-[0.08em] text-nd-text-disabled uppercase">
            SOLANA
          </span>
        </div>
        <span className="font-mono text-[10px] text-nd-text-disabled">
          v0.1.0
        </span>
      </div>
    </aside>
  );
}
