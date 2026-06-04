"use client";

import { Game } from "@/components/game";
import { GameOverlay } from "@/components/game-overlay";
import { UpcomingLayout } from "@/components/game-layouts/upcoming-layout";
import { EndedLayout } from "@/components/game-layouts/ended-layout";
import { CancelledLayout } from "@/components/game-layouts/cancelled-layout";
import { useGameDetail } from "@/lib/swr";

export function GameStage({ gameId }: { gameId: number }) {
  const { game, userBets } = useGameDetail(gameId);

  return (
    <div className="relative flex flex-1 items-center justify-center p-4 lg:p-6">
      {game.status === "LIVE" ? (
        <div className="relative aspect-video w-full max-w-5xl overflow-hidden rounded-xl border-2 border-border bg-black shadow-[4px_4px_0px_0px_var(--border)]">
          <Game gameId={game.id} />
          <GameOverlay agents={game.agents} />
        </div>
      ) : game.status === "UPCOMING" ? (
        <UpcomingLayout
          pool={game.totalPool}
          startedAt={game.startedAt}
          agentsCount={game.agents.length}
        />
      ) : game.status === "ENDED" || game.status === "SETTLED" ? (
        <EndedLayout game={game} userBets={userBets} />
      ) : (
        <CancelledLayout />
      )}
    </div>
  );
}
