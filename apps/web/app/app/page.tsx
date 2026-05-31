import type { GamesResponse } from "@/lib/swr-types";
import { SWRConfig } from "swr";
import { unstable_serialize } from "swr/infinite";
import { prisma } from "@repo/db";
import { Cover } from "@/components/ui/cover";
import { GameMarket } from "@/components/game-marktet";
import { Zap, Trophy, Clock, Flame } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

async function getInitialGames() {
  try {
    const games = await prisma.game.findMany({
      where: {
        status: {
          in: ["LIVE", "UPCOMING"],
        },
      },
      take: 16,
      include: {
        agents: {
          include: {
            agent: true,
          },
        },
        winner: true,
      },
    });

    let nextCursor: number | null = null;
    if (games.length > 15) {
      const nextItem = games.pop();
      nextCursor = nextItem!.id;
    }

    const normalizedGames: GamesResponse = {
      games: games.map((game) => ({
        ...game,
        agents: game.agents.map((ag) => ag.agent),
        totalPool: Number(game.totalPool) / 1e6,
        feeAmount: game.feeAmount ? Number(game.feeAmount) / 1e6 : null,
      })),
      nextCursor,
    };

    return [normalizedGames];
  } catch {
    return null;
  }
}

const filters = [
  { id: "active", label: "ALL", icon: Zap },
  { id: "ended", label: "ENDED", icon: Trophy },
] as const;

export default async function App() {
  const [liveCount, endedCount, totalPoolAgg, initialGames] = await Promise.all(
    [
      prisma.game.count({
        where: { status: "LIVE" },
      }),
      prisma.game.count({
        where: { status: "ENDED" },
      }),
      prisma.game.aggregate({
        where: { status: "LIVE" },
        _sum: {
          totalPool: true,
        },
      }),
      getInitialGames(),
    ]
  );

  const fallback = {
    [unstable_serialize(() => "/api/games?limit=15&status=active")]:
      initialGames,
  } as const;

  return (
    <SWRConfig value={{ fallback }}>
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto flex w-full max-w-7xl flex-col px-6 py-8">
          <div className="mb-6">
            <h1 className="font-display text-4xl font-black tracking-tight text-foreground sm:text-5xl">
              LIVE{" "}
              <span className="text-primary">
                <Cover>MARKETS</Cover>
              </span>
            </h1>
            <p className="mt-2 max-w-xl text-base text-muted-foreground">
              Pick your champion. Place your bet. Watch AI agents battle it out
              in real-time snake arenas.
            </p>
          </div>

          <div className="mb-8 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 rounded-xl border-2 border-border bg-card px-4 py-2.5 shadow-[2px_2px_0px_0px_var(--border)]">
              <div className="flex size-7 items-center justify-center rounded-lg border-2 border-destructive/30 bg-destructive/15">
                <Flame className="size-3.5 text-destructive" />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  LIVE MATCHES
                </span>
                <span className="font-mono text-lg leading-none font-black text-foreground">
                  {liveCount}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border-2 border-border bg-card px-4 py-2.5 shadow-[2px_2px_0px_0px_var(--border)]">
              <div className="flex size-7 items-center justify-center rounded-lg border-2 border-info/30 bg-info/15">
                <Clock className="size-3.5 text-info" />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  MATCHES ENDED
                </span>
                <span className="font-mono text-lg leading-none font-black text-foreground">
                  {endedCount}
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl border-2 border-border bg-card px-4 py-2.5 shadow-[2px_2px_0px_0px_var(--border)]">
              <div className="flex size-7 items-center justify-center rounded-lg border-2 border-primary/30 bg-primary/15">
                <Trophy className="size-3.5 text-primary" />
              </div>
              <div className="flex flex-col">
                <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  TOTAL POOL
                </span>
                <span className="font-mono text-lg leading-none font-black text-foreground">
                  {(Number(totalPoolAgg._sum.totalPool || "0") / 1e6).toFixed(
                    0
                  )}{" "}
                  <span className="text-xs font-bold text-muted-foreground">
                    USDC
                  </span>
                </span>
              </div>
            </div>
          </div>

          <Tabs defaultValue={filters[0].id} className="w-full">
            <TabsList className="mb-8 h-auto! items-center gap-3 bg-transparent">
              {filters.map((f) => (
                <TabsTrigger
                  key={f.id}
                  value={f.id}
                  className="brutalist-button flex items-center gap-2 rounded-full bg-card px-5 py-2 font-mono text-xs font-bold tracking-wider uppercase active:shadow-[2px_2px_0px_0px_transparent]! data-active:bg-primary! data-active:shadow-[4px_4px_0px_0px_var(--border)]!"
                >
                  <f.icon className="size-3.5" />
                  {f.label}
                </TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value="active">
              <GameMarket statusFilter="active" />
            </TabsContent>

            <TabsContent value="ended">
              <GameMarket statusFilter="ended" />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </SWRConfig>
  );
}
