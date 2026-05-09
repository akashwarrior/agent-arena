"use client";

import { useAtomValue } from "jotai";
import { useHydrateAtoms } from 'jotai/utils'
import { activeGameAtom, gameSnapshotAtom } from "@/lib/store";
import { useLeaderboard } from "@/lib/swr";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { GameWithAgents } from "@/lib/swr-types";

function SegmentedBar({ value, max, color = "foreground" }: { value: number; max: number; color?: string }) {
  const segments = 12;
  const filled = Math.round((value / max) * segments);

  return (
    <div className="flex gap-0.5">
      {Array.from({ length: segments }).map((_, i) => (
        <div
          key={i}
          className={`h-1 flex-1 ${i < filled ? `bg-${color}` : "bg-muted"}`}
        />
      ))}
    </div>
  );
}

function AgentStatus({
  name,
  score,
  maxScore,
  alive,
  isWinner
}: {
  name: string;
  score: number;
  maxScore: number;
  alive: boolean;
  isWinner?: boolean;
}) {
  return (
    <div className="py-2">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div className={`size-1.5 ${alive ? "bg-foreground" : "bg-muted-foreground"}`} />
          <span className={`text-body-sm uppercase tracking-wide ${alive ? "text-foreground" : "text-muted-foreground line-through"}`}>
            {name}
          </span>
          {isWinner && (
            <span className="text-label text-success border border-success px-1.5 py-0.5">WIN</span>
          )}
        </div>
        <span className="text-data text-foreground">
          {score}
        </span>
      </div>
      <SegmentedBar value={score} max={maxScore} color={alive ? "foreground" : "muted-foreground"} />
    </div>
  );
}

function LeaderboardRow({ rank, name, netEarnings }: { rank: number; name: string; netEarnings: number }) {
  return (
    <div className="flex items-center justify-between py-2 px-4 hover:bg-secondary">
      <div className="flex items-center gap-3">
        <span className="text-label text-muted-foreground w-5 text-right">
          #{rank}
        </span>
        <span className="text-body-sm text-foreground uppercase tracking-wide font-mono">
          {name}
        </span>
      </div>
      <span className={`text-label text-data ${netEarnings >= 0 ? "text-success" : "text-muted-foreground"}`}>
        {netEarnings >= 0 ? "+" : ""}{netEarnings.toFixed(1)}
      </span>
    </div>
  );
}

function ActivityLog() {
  return (
    <div className="flex flex-col gap-1.5 overflow-y-auto h-full">
      <div className="flex items-start gap-2 text-caption text-muted-foreground">
        <span className="shrink-0 w-14 text-right">--:--:--</span>
        <span className="shrink-0 w-12">SYS</span>
        <span>AWAITING EVENTS</span>
      </div>
    </div>
  );
}

export function RightSidebarContent() {
  const activeGame = useAtomValue(activeGameAtom);
  const snapshot = useAtomValue(gameSnapshotAtom);
  const { leaderboard, isLoading: leaderboardLoading } = useLeaderboard();

  const liveSnakes = snapshot ? snapshot.snakes : null;

  const agents = activeGame
    ? (liveSnakes || activeGame.agents.map(a => ({ ...a, score: 0, alive: true })))
      .sort((a, b) => b.score - a.score)
    : [];
  const maxScore = Math.max(...agents.map(a => a.score), 1);

  if (!activeGame) {
    return (
      <div className="flex flex-col h-full gap-0 bg-card">
        <div className="flex items-center justify-center py-16">
          <p className="text-label text-muted-foreground">[ NO ACTIVE GAME ]</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full gap-0 bg-card">
      <div className="shrink-0 px-4 py-3 border-b border-border">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="text-display-sm text-foreground">
              {activeGame.name}
            </h3>
            <div className="flex items-center gap-3 mt-1">
              {activeGame.status === "LIVE" && (
                <span className="inline-flex items-center gap-1.5">
                  <span className="live-dot" />
                  <span className="text-label text-accent">LIVE</span>
                </span>
              )}
              <span className="text-label text-muted-foreground">R{activeGame.id.slice(0, 6).toUpperCase()}</span>
            </div>
          </div>
        </div>

        <div className="py-3 border-b border-border">
          <span className="text-label text-muted-foreground block mb-1">PRIZE POOL</span>
          <span className="text-display-md text-foreground text-data">
            {activeGame.totalPool.toFixed(1)}<span className="text-label text-muted-foreground ml-2">SOL</span>
          </span>
        </div>

        <div className="pt-3">
          <span className="text-label text-muted-foreground block mb-2">STATUS</span>
          {agents.map((agent) => (
            <AgentStatus
              key={agent.id}
              name={agent.name}
              score={agent.score}
              maxScore={maxScore}
              alive={agent.alive}
              isWinner={activeGame.winnerAgentId === agent.id}
            />
          ))}
        </div>
      </div>

      <div className="px-4 py-3 bg-secondary h-1/3">
        <div className="flex items-center gap-2 mb-3">
          <span className="live-dot" />
          <span className="text-label text-foreground">ACTIVITY</span>
        </div>
        <ActivityLog />
      </div>

      <div className="flex-1 flex flex-col min-h-0 border-y border-border">
        <div className="px-4 py-2.5 border-b border-border bg-secondary">
          <span className="text-label text-muted-foreground">TOP BETTORS</span>
        </div>
        <ScrollArea className="flex-1">
          {leaderboardLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="size-3 text-muted-foreground animate-spin" />
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <p className="text-label text-muted-foreground">[ NO DATA ]</p>
            </div>
          ) : (
            leaderboard.map((player) => (
              <LeaderboardRow key={player.rank} {...player} />
            ))
          )}
        </ScrollArea>
      </div>
    </div>
  );
}

export function RightSidebar({ activeGame }: { activeGame: GameWithAgents | null }) {
  useHydrateAtoms([[activeGameAtom, activeGame]]);

  return (
    <aside className="hidden h-full w-75 flex-col border-l border-border bg-card lg:flex z-10 relative">
      <div className="flex items-center px-4 py-2.5 border-b border-border bg-secondary">
        <span className="text-label text-muted-foreground">TELEMETRY</span>
      </div>

      <div className="min-h-0 flex-1 bg-card overflow-y-auto">
        <RightSidebarContent />
      </div>

      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border bg-secondary">
        <div className="flex items-center gap-2">
          <span className="size-1.5 bg-success rounded-full" />
          <span className="text-label text-foreground">SYNCED</span>
        </div>
      </div>
    </aside>
  );
}
