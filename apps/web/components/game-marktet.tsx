"use client";

import type { GameStatus } from "@repo/db";
import { useGames } from "@/lib/swr";
import { GameCard } from "@/components/game-card";
import { Loader2, Zap, Trophy } from "lucide-react";

export function GameMarket({ statusFilters }: { statusFilters: GameStatus[] }) {
  const { games, hasMore, isLoading, isLoadingMore, error, loadMore } =
    useGames(statusFilters);

  return isLoading && !games.length ? (
    <div className="flex flex-col items-center justify-center gap-4 py-32">
      <div className="flex size-16 items-center justify-center rounded-xl border-2 border-border bg-card shadow-[4px_4px_0px_0px_var(--border)]">
        <Loader2 className="size-7 animate-spin text-primary" />
      </div>
      <span className="font-mono text-sm font-bold tracking-widest text-muted-foreground uppercase">
        Loading markets...
      </span>
    </div>
  ) : error && !games.length ? (
    <div className="flex flex-col items-center justify-center gap-4 py-32">
      <div className="flex size-16 items-center justify-center rounded-xl border-2 border-destructive/30 bg-destructive/10">
        <Zap className="size-7 text-destructive" />
      </div>
      <span className="font-mono text-sm font-bold tracking-widest text-muted-foreground uppercase">
        Error loading markets
      </span>
    </div>
  ) : !games.length ? (
    <div className="flex flex-col items-center justify-center gap-4 py-32">
      <div className="flex size-16 items-center justify-center rounded-xl border-2 border-border bg-card">
        <Trophy className="size-7 text-muted-foreground" />
      </div>
      <span className="font-mono text-sm font-bold tracking-widest text-muted-foreground uppercase">
        No markets available
      </span>
    </div>
  ) : (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <GameCard
            key={game.id}
            id={game.id}
            name={game.name}
            status={game.status}
            agents={game.agents}
            totalPool={game.totalPool}
          />
        ))}
      </div>

      {hasMore && (
        <div className="mt-12 flex justify-center">
          <button
            onClick={loadMore}
            disabled={isLoadingMore}
            className="brutalist-button flex items-center gap-2 rounded-lg bg-card px-8 py-3 font-mono text-sm font-bold tracking-wider text-foreground uppercase disabled:opacity-50"
          >
            {isLoadingMore && <Loader2 className="size-4 animate-spin" />}
            LOAD MORE MARKETS
          </button>
        </div>
      )}
    </>
  );
}
