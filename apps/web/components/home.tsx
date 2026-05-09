import { Provider } from "jotai";
import { Game } from "@/components/game";
import { Navbar } from "@/components/navbar";
import { GameOverlay } from "@/components/game-overlay";
import { LeftSidebar, LeftSidebarContent, LeftSidebarToggle } from "@/components/left-sidebar";
import { RightSidebar, RightSidebarContent } from "@/components/right-sidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { prisma } from "@repo/db";
import type { GamesResponse, GameWithAgents } from "@/lib/swr-types";
import { SWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";

async function getInitialData() {
  try {
    const games = await prisma.game.findMany({
      take: 16,
      orderBy: { createdAt: "desc" },
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

    const liveGame = normalizedGames.games.find(
      (g) => g.status === "LIVE"
    ) || normalizedGames.games.find(
      (g) => g.status === "OPEN"
    ) || null;

    return { initialGames: [normalizedGames], activeGame: liveGame as GameWithAgents | null };
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

          <div className="hidden min-h-0 flex-1 lg:flex w-full">
            <LeftSidebar />

            <main className="relative min-w-0 flex-1 flex flex-col bg-muted">
              <LeftSidebarToggle />
              <div className="flex-1 flex items-center justify-center p-4 md:p-6">
                <div className="w-full max-w-5xl aspect-video relative bg-card border border-border">
                  <Game />
                  <GameOverlay />
                </div>
              </div>

              <div className="px-4 py-2 border-t border-border bg-card flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className="text-label text-muted-foreground">ROUND <span className="text-foreground">#{activeGame?.id.slice(0, 6).toUpperCase() || "---"}</span></span>
                  <span className="text-label text-muted-foreground">STATUS <span className={activeGame?.status === "LIVE" ? "text-success" : "text-muted-foreground"}>{activeGame?.status || "IDLE"}</span></span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-label text-muted-foreground">POOL <span className="text-foreground">{activeGame ? `${activeGame.totalPool.toFixed(1)}` : "0.0"} SOL</span></span>
                </div>
              </div>
            </main>

            <RightSidebar activeGame={activeGame} />
          </div>

          <div className="flex min-h-0 flex-1 flex-col lg:hidden w-full bg-background">
            <div className="relative aspect-video w-full border-b border-border bg-card">
              <Game />
              <GameOverlay />
            </div>

            <div className="flex border-b border-border bg-background">
              <Tabs defaultValue="games" className="w-full">
                <TabsList className="w-full bg-transparent p-0 h-10 border-b-0 rounded-none flex">
                  <TabsTrigger
                    value="games"
                    className="flex-1 rounded-none text-label data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground text-muted-foreground"
                  >
                    GAMES
                  </TabsTrigger>
                  <TabsTrigger
                    value="bets"
                    className="flex-1 rounded-none text-label data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground text-muted-foreground"
                  >
                    MY BETS
                  </TabsTrigger>
                  <TabsTrigger
                    value="info"
                    className="flex-1 rounded-none text-label data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-foreground text-muted-foreground"
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
