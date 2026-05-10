import { Provider } from "jotai";
import { Game } from "@/components/game";
import { Navbar } from "@/components/navbar";
import { GameOverlay } from "@/components/game-overlay";
import {
  LeftSidebar,
  LeftSidebarContent,
  LeftSidebarToggle,
} from "@/components/left-sidebar";
import { RightSidebar, RightSidebarContent } from "@/components/right-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prisma } from "@repo/db";
import type { GamesResponse, GameWithAgents } from "@/lib/swr-types";
import { SWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";

async function getInitialData() {
  try {
    const games = await prisma.game.findMany({
      where: {
        status: {
          in: ["LIVE", "UPCOMING", "OPEN"],
        },
      },
      take: 16,
      orderBy: { startedAt: "asc" },
      include: {
        agents: {
          include: {
            agent: true,
          },
        },
        winner: true,
      },
    });

    let nextCursor: string | null = null;
    if (games.length > 15) {
      const nextItem = games.pop();
      nextCursor = nextItem!.id;
    }

    const normalizedGames: GamesResponse = {
      games: games.map((game) => ({
        ...game,
        agents: game.agents.map((ag) => ag.agent),
        totalPool: game.totalPool / 1e9,
      })),
      nextCursor,
    };

    const liveGame =
      normalizedGames.games.find((g) => g.status === "LIVE") ||
      normalizedGames.games.find((g) => g.status === "OPEN") ||
      null;

    return {
      initialGames: [normalizedGames],
      activeGame: liveGame as GameWithAgents | null,
    };
  } catch {
    return { initialGames: null, activeGame: null };
  }
}

export async function Home() {
  const { initialGames, activeGame } = await getInitialData();

  return (
    <Provider>
      <SWRConfig
        value={{
          fallback: {
            [unstable_serialize(() => "/api/games?limit=15")]: initialGames,
          },
        }}
      >
        <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
          <Navbar />

          <div className="hidden min-h-0 w-full flex-1 lg:flex">
            <LeftSidebar />

            <main className="relative flex min-w-0 flex-1 flex-col bg-muted">
              <LeftSidebarToggle />
              <div className="flex flex-1 items-center justify-center p-4 md:p-6">
                <div className="relative aspect-video w-full max-w-5xl border border-border bg-card">
                  <Game />
                  <GameOverlay />
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-border bg-card px-4 py-2">
                <div className="flex items-center gap-4">
                  <span className="text-label text-muted-foreground">
                    ROUND{" "}
                    <span className="text-foreground">
                      #{activeGame?.id.slice(0, 6).toUpperCase() || "---"}
                    </span>
                  </span>
                  <span className="text-label text-muted-foreground">
                    STATUS{" "}
                    <span
                      className={
                        activeGame?.status === "LIVE"
                          ? "text-success"
                          : "text-muted-foreground"
                      }
                    >
                      {activeGame?.status || "IDLE"}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-label text-muted-foreground">
                    POOL{" "}
                    <span className="text-foreground">
                      {activeGame
                        ? `${activeGame.totalPool.toFixed(1)}`
                        : "0.0"}{" "}
                      SOL
                    </span>
                  </span>
                </div>
              </div>
            </main>

            <RightSidebar />
          </div>

          <div className="flex min-h-0 w-full flex-1 flex-col bg-background lg:hidden">
            <div className="relative aspect-video w-full border-b border-border bg-card">
              <Game />
              <GameOverlay />
            </div>

            <div className="flex border-b border-border bg-background">
              <Tabs defaultValue="games" className="w-full">
                <TabsList className="flex h-10 w-full rounded-none border-b-0 bg-transparent p-0">
                  <TabsTrigger
                    value="games"
                    className="text-label flex-1 rounded-none text-muted-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    GAMES
                  </TabsTrigger>
                  <TabsTrigger
                    value="bets"
                    className="text-label flex-1 rounded-none text-muted-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    MY BETS
                  </TabsTrigger>
                  <TabsTrigger
                    value="info"
                    className="text-label flex-1 rounded-none text-muted-foreground data-[state=active]:border-b-2 data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none"
                  >
                    DATA
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="games" className="mt-0">
                  <LeftSidebarContent tab="games" />
                </TabsContent>
                <TabsContent value="bets" className="mt-0">
                  <LeftSidebarContent tab="bets" />
                </TabsContent>
                <TabsContent value="info" className="mt-0">
                  <RightSidebarContent />
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </SWRConfig>
    </Provider>
  );
}
