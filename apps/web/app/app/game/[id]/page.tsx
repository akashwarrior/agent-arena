import Link from "next/link";
import { prisma } from "@repo/db";
import { notFound } from "next/navigation";
import { SWRConfig } from "swr";
import { ArrowLeft, Tv } from "lucide-react";
import { GameStage } from "@/components/game-stage";
import { GameSidebar } from "@/components/game-sidebar";
import { gameDetailSelect, normalizeGameDetail } from "@/lib/api-types";
import { z } from "zod";
import { Provider } from "jotai";

const gameIdSchema = z
  .string()
  .regex(/^[1-9]\d*$/)
  .transform(Number);

async function getGame(id: number) {
  const game = await prisma.game.findUnique({
    where: { id },
    select: gameDetailSelect,
  });
  if (!game) return null;

  return normalizeGameDetail(game);
}

export default async function GamePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const parsedGameId = gameIdSchema.safeParse(id);
  if (!parsedGameId.success) return notFound();

  const gameId = parsedGameId.data;

  const game = await getGame(gameId);
  if (!game) return notFound();

  const fallback = {
    [`/api/games/${gameId}`]: { game, userBets: [] },
  };

  return (
    <SWRConfig value={{ fallback }}>
      <Provider>
        <main className="flex flex-col overflow-x-hidden bg-background md:flex-row">
          <div className="flex flex-1 flex-col">
            <div className="flex items-center justify-between border-b-2 border-border bg-card px-4 py-3 lg:px-6">
              <div className="flex items-center gap-3">
                <Link
                  href="/app"
                  className="flex items-center gap-1.5 rounded-lg border-2 border-border bg-secondary px-3 py-1.5 font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase transition-all hover:bg-muted hover:text-foreground"
                >
                  <ArrowLeft className="size-3" />
                  Markets
                </Link>
                <span className="hidden text-muted-foreground/40 sm:inline">
                  /
                </span>
                <div className="hidden items-center gap-2 sm:flex">
                  <Tv className="size-3.5 text-primary" />
                  <span className="font-display text-sm font-black tracking-tight text-foreground">
                    {game.name}
                  </span>
                  <span className="rounded-md border-2 border-border bg-secondary px-1.5 py-0.5 font-mono text-[10px] font-bold text-muted-foreground">
                    R{game.id}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-4 bg-card px-4 py-2">
                <span className="text-label text-muted-foreground">
                  ROUND{" "}
                  <span className="text-foreground">#{game.id || "---"}</span>
                </span>
              </div>
            </div>

            <GameStage gameId={game.id} />
          </div>

          <div className="w-full border-t-2 border-border bg-card md:w-100 md:border-t-0 md:border-l-2">
            <GameSidebar gameId={game.id} />
          </div>
        </main>
      </Provider>
    </SWRConfig>
  );
}
