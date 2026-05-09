"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useAtom } from "jotai";
import { leftSidebarOpenAtom } from "@/lib/store";
import { useGames, useBets, useGameDetail, placeBet } from "@/lib/swr";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  ChevronRight,
  ArrowLeft,
  PanelLeftClose,
  PanelLeftOpen,
  Lock,
  Loader2,
  Target,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import type { Game, Agent, Bet } from "@repo/db";

type GameWithAgents = Game & { agents: Agent[] };

function StatusBadge({ status }: { status: Game["status"] }) {
  if (status === "LIVE") {
    return (
      <span className="text-label text-accent inline-flex items-center gap-2">
        <span className="live-dot" />
        LIVE
      </span>
    );
  }
  if (status === "OPEN") {
    return (
      <span className="text-label text-success">
        OPEN
      </span>
    );
  }
  if (status === "UPCOMING") {
    return (
      <span className="text-label text-muted-foreground">
        UPCOMING
      </span>
    );
  }
  if (status === "LOCKED") {
    return (
      <span className="text-label text-warning">
        LOCKED
      </span>
    );
  }
  if (status === "CANCELLED") {
    return (
      <span className="text-label text-muted-foreground">
        CANCELLED
      </span>
    );
  }
  return (
    <span className="text-label text-muted-foreground">
      ENDED
    </span>
  );
}

function GameRow({
  game,
  onClick,
  hasBet
}: {
  game: GameWithAgents;
  onClick: () => void;
  hasBet: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left px-4 py-3 hover:bg-secondary group border-b border-border"
    >
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-subheading text-foreground truncate">
              {game.name}
            </span>
            {hasBet && (
              <span className="size-1.5 rounded-full bg-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-2 text-label text-muted-foreground">
            <span>R{game.id.slice(0, 6).toUpperCase()}</span>
            <span className="text-border">·</span>
            <span>{game.totalPool.toFixed(1)} SOL</span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-3">
          <StatusBadge status={game.status} />
          <ChevronRight className="size-3.5 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </div>
    </button>
  );
}

function LoadMoreTrigger({ onLoadMore, hasMore, isLoading }: { onLoadMore: () => void; hasMore: boolean; isLoading: boolean }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMore && !isLoading) {
          onLoadMore();
        }
      },
      { rootMargin: "200px" }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [onLoadMore, hasMore, isLoading]);

  return <div ref={ref} className="h-px" />;
}

function GamesList({
  onSelectGame,
  userBetGameIds,
}: {
  onSelectGame: (game: GameWithAgents) => void;
  userBetGameIds: Set<string>;
}) {
  const { games, hasMore, isLoading, isLoadingMore, error, loadMore } =
    useGames();

  if (isLoading && !games.length) {
    return (
      <div className="flex flex-col">
        <div className="px-4 py-2.5 border-b border-border bg-secondary">
          <span className="text-label text-muted-foreground">SELECT ARENA</span>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-4 text-muted-foreground animate-spin" />
        </div>
      </div>
    );
  }

  if (error && !games.length) {
    return (
      <div className="flex flex-col">
        <div className="px-4 py-2.5 border-b border-border bg-secondary">
          <span className="text-label text-muted-foreground">SELECT ARENA</span>
        </div>
        <div className="flex items-center justify-center py-16">
          <p className="text-label text-muted-foreground">[ ERROR LOADING ]</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="px-4 py-2.5 border-b border-border bg-secondary">
        <span className="text-label text-muted-foreground">SELECT ARENA</span>
      </div>
      {games.map((game) => (
        <GameRow
          key={game.id}
          game={game}
          onClick={() => onSelectGame(game)}
          hasBet={userBetGameIds.has(game.id)}
        />
      ))}
      {hasMore && (
        <LoadMoreTrigger onLoadMore={loadMore} hasMore={hasMore} isLoading={isLoadingMore} />
      )}
      {isLoadingMore && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="size-3 text-muted-foreground animate-spin" />
        </div>
      )}
      {!hasMore && games.length > 0 && (
        <div className="flex items-center justify-center py-4">
          <p className="text-label text-muted-foreground">[ END OF LIST ]</p>
        </div>
      )}
    </div>
  );
}

function AgentCard({
  agent,
  isSelected,
  isBetAgent,
  isWinner,
  canBet,
  onSelect,
}: {
  agent: Agent;
  isSelected: boolean;
  isBetAgent: boolean;
  isWinner: boolean;
  canBet: boolean;
  onSelect: () => void;
}) {
  const active = isSelected || isBetAgent;

  return (
    <button
      type="button"
      disabled={!canBet}
      onClick={onSelect}
      className={`w-full text-left px-3 py-3 transition-percussive ${active
        ? "bg-secondary border border-border"
        : "border border-transparent hover:bg-secondary/50"
        } ${!canBet ? "cursor-default opacity-60" : ""}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`size-2.5 ${active ? "bg-foreground" : "bg-muted-foreground"}`} />
          <span className="text-body text-foreground uppercase tracking-wide">
            {agent.name}
          </span>
        </div>
        {isWinner && (
          <span className="text-label text-success border border-success px-2 py-0.5">WINNER</span>
        )}
      </div>
    </button>
  );
}

function BetInputInline({
  value,
  onChange,
  onSubmit,
  submitting,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const num = parseFloat(value);
  const valid = !isNaN(num) && num > 0;

  return (
    <div className="px-3 pb-3 pt-1">
      <div className="flex items-center gap-2 p-2 border border-border bg-background">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Target className="size-3.5 text-muted-foreground shrink-0" />
          <Input
            type="number"
            placeholder="0.00"
            autoFocus
            className="h-8 rounded-none border-0 bg-transparent text-data text-foreground placeholder:text-muted-foreground focus-visible:ring-0 px-0"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            min="0"
            step="0.01"
            onKeyDown={(e) => {
              if (e.key === "Enter" && valid) onSubmit();
            }}
          />
          <span className="text-label text-muted-foreground shrink-0">SOL</span>
        </div>
        <Button
          disabled={!valid || submitting}
          className="h-8 rounded-full bg-primary text-primary-foreground text-label px-4 hover:bg-primary/90 disabled:opacity-50 shrink-0"
          onClick={onSubmit}
        >
          {submitting ? (
            <Loader2 className="size-3 animate-spin" />
          ) : (
            "PLACE"
          )}
        </Button>
      </div>
    </div>
  );
}

function GameDetail({
  game: initialGame,
  onBack,
  initialBet,
  onBetPlaced,
}: {
  game: GameWithAgents;
  onBack: () => void;
  initialBet: Bet | null;
  onBetPlaced: () => void;
}) {
  const { game, userBet, isLoading, mutate } = useGameDetail(initialGame.id);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [betAmount, setBetAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const displayGame = game || initialGame;
  const displayBet = userBet || initialBet;

  const canBet = (displayGame.status === "OPEN" || displayGame.status === "UPCOMING") && !displayBet;
  const selectedAgentData = displayGame?.agents.find((a) => a.id === selectedAgent);

  const handlePlaceBet = async () => {
    if (!selectedAgent || !selectedAgentData) return;
    const amount = parseFloat(betAmount);
    if (isNaN(amount) || amount <= 0) return;

    setSubmitting(true);
    try {
      await placeBet(displayGame.id, selectedAgent, amount, "wallet-placeholder");
      toast.success("Bet placed", {
        description: `${betAmount} SOL on ${selectedAgentData.name}`,
        duration: 3000,
      });
      setSelectedAgent(null);
      setBetAmount("");
      onBetPlaced();
      mutate();
    } catch (err) {
      toast.error("Bet failed", {
        description: err instanceof Error ? err.message : "Could not place bet",
        duration: 4000,
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading && !game) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-4 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-2 text-label text-muted-foreground hover:text-foreground transition-percussive mb-4"
        >
          <ArrowLeft className="size-3" />
          BACK
        </button>

        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-display-sm text-foreground">
              {displayGame.name}
            </h2>
            <div className="flex items-center gap-3 mt-1.5">
              <StatusBadge status={displayGame.status} />
              <span className="text-label text-muted-foreground">R{displayGame.id.slice(0, 6).toUpperCase()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hero Metric */}
      <div className="px-4 py-6 border-b border-border bg-secondary">
        <span className="text-label text-muted-foreground block mb-2">PRIZE POOL</span>
        <span className="text-display-lg text-foreground text-data">
          {displayGame.totalPool.toFixed(1)}<span className="text-label text-muted-foreground ml-2">SOL</span>
        </span>
      </div>

      {/* Status Messages */}
      {displayGame.status === "LIVE" && (
        <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
          <Lock className="size-3 text-muted-foreground" />
          <span className="text-label text-muted-foreground">BETTING LOCKED — MATCH IN PROGRESS</span>
        </div>
      )}

      {displayBet && (
        <div className="px-4 py-2.5 border-b border-border bg-card flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-success" />
            <span className="text-label text-foreground">
              {displayBet.amount.toFixed(2)} SOL ON {displayBet.agentId.toUpperCase()}
            </span>
          </div>
          <span className="text-label text-muted-foreground">[{displayBet.status}]</span>
        </div>
      )}

      {displayGame.status === "ENDED" && displayGame.winnerAgentId && (
        <div className="px-4 py-2.5 border-b border-border bg-foreground text-background">
          <span className="text-label">WINNER: {displayGame.winnerAgentId.toUpperCase()}</span>
        </div>
      )}

      {displayGame.status === "CANCELLED" && (
        <div className="px-4 py-2.5 border-b border-border">
          <span className="text-label text-muted-foreground">MATCH CANCELLED — ALL BETS REFUNDED</span>
        </div>
      )}

      {/* Agent Roster */}
      <div className="flex flex-col">
        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
          <span className="text-label text-muted-foreground">
            {canBet ? "SELECT CONTESTANT" : "ROSTER"}
          </span>
          <span className="text-label text-muted-foreground">
            {displayGame.agents.length} AGENTS
          </span>
        </div>

        <div className="flex flex-col">
          {displayGame?.agents.map((a) => (
            <div key={a.id} className="border-b border-border last:border-b-0">
              <AgentCard
                agent={a}
                isSelected={selectedAgent === a.id}
                isBetAgent={displayBet?.agentId === a.id}
                isWinner={displayGame.winnerAgentId === a.id}
                canBet={canBet}
                onSelect={() => {
                  if (!canBet) return;
                  if (selectedAgent === a.id) {
                    setSelectedAgent(null);
                    setBetAmount("");
                  } else {
                    setSelectedAgent(a.id);
                    setBetAmount("");
                  }
                }}
              />
              {canBet && selectedAgent === a.id && (
                <BetInputInline
                  value={betAmount}
                  onChange={setBetAmount}
                  onSubmit={handlePlaceBet}
                  submitting={submitting}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function MyBetsView() {
  const { bets, hasMore, isLoading, isLoadingMore, error, loadMore } = useBets();

  if (isLoading && !bets.length) {
    return (
      <div className="flex flex-col">
        <div className="px-4 py-2.5 border-b border-border bg-secondary">
          <span className="text-label text-muted-foreground">BET HISTORY</span>
        </div>
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-4 text-muted-foreground animate-spin" />
        </div>
      </div>
    );
  }

  if (error && !bets.length) {
    return (
      <div className="flex flex-col">
        <div className="px-4 py-2.5 border-b border-border bg-secondary">
          <span className="text-label text-muted-foreground">BET HISTORY</span>
        </div>
        <div className="flex items-center justify-center py-16">
          <p className="text-label text-muted-foreground">[ ERROR LOADING ]</p>
        </div>
      </div>
    );
  }

  if (!bets.length) {
    return (
      <div className="flex flex-col">
        <div className="px-4 py-2.5 border-b border-border bg-secondary">
          <span className="text-label text-muted-foreground">BET HISTORY</span>
        </div>
        <div className="py-16 flex items-center justify-center">
          <p className="text-label text-muted-foreground">[ NO BETS ]</p>
        </div>
      </div>
    );
  }

  const totalWagered = bets.reduce((s, b) => s + b.amount, 0);
  const totalOut = bets
    .filter((b) => b.status === "WON")
    .reduce((s, b) => s + (b.payout || 0), 0);
  const pnl = totalOut - totalWagered;

  return (
    <div className="flex flex-col">
      <div className="px-4 py-2.5 border-b border-border bg-secondary">
        <span className="text-label text-muted-foreground">BET HISTORY</span>
      </div>

      <div className="flex flex-col">
        {bets.map((bet) => (
          <div
            key={bet.id}
            className="flex items-center justify-between px-4 py-3 border-b border-border hover:bg-secondary"
          >
            <div className="flex flex-col gap-0.5">
              <span className="text-body text-foreground uppercase tracking-wide">
                {bet.agent.name?.toUpperCase() || bet.agentId.toUpperCase()}
              </span>
              <span className="text-label text-muted-foreground">
                R{bet.gameId.slice(0, 6).toUpperCase()}
              </span>
            </div>
            <div className="flex flex-col items-end gap-0.5">
              <span className="text-data text-foreground">
                {bet.amount.toFixed(2)} SOL
              </span>
              <div className="flex items-center gap-2">
                {bet.status === "WON" && bet.payout && (
                  <span className="text-label text-success text-data">
                    +{(bet.payout - bet.amount).toFixed(2)}
                  </span>
                )}
                <span className={`text-label ${bet.status === "WON" ? "text-success" :
                  bet.status === "LOST" ? "text-muted-foreground" :
                    bet.status === "REFUNDED" ? "text-warning" :
                      "text-foreground"
                  }`}>
                  [{bet.status}]
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {hasMore && (
        <LoadMoreTrigger onLoadMore={loadMore} hasMore={hasMore} isLoading={isLoadingMore} />
      )}
      {isLoadingMore && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="size-3 text-muted-foreground animate-spin" />
        </div>
      )}

      <div className="px-4 py-3 border-t border-border bg-card">
        <div className="flex items-center justify-between mb-2">
          <span className="text-label text-muted-foreground">TOTAL WAGERED</span>
          <span className="text-data text-foreground">
            {totalWagered.toFixed(2)} SOL
          </span>
        </div>
        <Separator className="bg-border my-2" />
        <div className="flex items-center justify-between">
          <span className="text-label text-muted-foreground">NET RESULT</span>
          <span className={`text-data ${pnl >= 0 ? "text-success" : "text-muted-foreground"}`}>
            {pnl >= 0 ? "+" : ""}{pnl.toFixed(2)} SOL
          </span>
        </div>
      </div>
    </div>
  );
}

export function LeftSidebarContent({ tab }: { tab: "games" | "bets"; }) {
  const [selectedGame, setSelectedGame] = useState<GameWithAgents | null>(null);
  const [userBetGameIds, setUserBetGameIds] = useState<Set<string>>(new Set());

  const handleBetPlaced = useCallback(() => {
    if (selectedGame) {
      setUserBetGameIds((prev) => new Set(prev).add(selectedGame.id));
    }
  }, [selectedGame]);

  return (
    <ScrollArea className="h-full bg-card">
      {tab === "games" ? (
        selectedGame ? (
          <GameDetail
            game={selectedGame}
            onBack={() => setSelectedGame(null)}
            initialBet={null}
            onBetPlaced={handleBetPlaced}
          />
        ) : (
          <GamesList
            onSelectGame={setSelectedGame}
            userBetGameIds={userBetGameIds}
          />
        )
      ) : (
        <MyBetsView />
      )}
    </ScrollArea>
  );
}

export function LeftSidebar() {
  const [isSidebarOpen] = useAtom(leftSidebarOpenAtom);

  return (
    <div className={`relative h-full transition-all duration-0 ${!isSidebarOpen ? "w-0 overflow-hidden" : "w-85"}`}>
      <aside className="flex h-full w-85 flex-col border-r border-border bg-card">
        <Tabs defaultValue="games" className="w-full flex flex-col h-full">
          <TabsList className="w-full bg-secondary p-0 h-10 border-b border-border rounded-none">
            <TabsTrigger
              value="games"
              className="flex-1 h-full rounded-none text-label data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground text-muted-foreground hover:text-foreground"
            >
              GAMES
            </TabsTrigger>
            <TabsTrigger
              value="bets"
              className="flex-1 h-full rounded-none text-label data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground text-muted-foreground hover:text-foreground"
            >
              MY BETS
            </TabsTrigger>
          </TabsList>
          <TabsContent value="games" className="flex-1 m-0 data-[state=inactive]:hidden">
            <LeftSidebarContent tab="games" />
          </TabsContent>
          <TabsContent value="bets" className="flex-1 m-0 data-[state=inactive]:hidden">
            <LeftSidebarContent tab="bets" />
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-secondary">
          <div className="flex items-center gap-2">
            <div className="size-1.5 bg-success rounded-full" />
            <span className="text-label text-foreground">MAINNET</span>
          </div>
          <span className="text-label text-muted-foreground">v1.0</span>
        </div>
      </aside>
    </div>
  );
}

export function LeftSidebarToggle() {
  const [isSidebarOpen, setIsSidebarOpen] = useAtom(leftSidebarOpenAtom);

  return (
    <button
      onClick={() => setIsSidebarOpen(!isSidebarOpen)}
      className="absolute top-3 left-3 z-50 p-1.5 bg-card border border-border hover:bg-secondary"
    >
      {isSidebarOpen ? (
        <PanelLeftClose className="size-3.5 text-foreground" />
      ) : (
        <PanelLeftOpen className="size-3.5 text-foreground" />
      )}
    </button>
  );
}
