import type { GameWithAgents } from "@/lib/swr-types";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Users, Trophy, Clock, Flame } from "lucide-react";

export function GameCard({ game }: { game: GameWithAgents }) {
  const isLiveGame = game.status === "LIVE";
  const displayPool = game.totalPool;
  const status = isLiveGame ? "LIVE" : game.status;

  const isLive = status === "LIVE";
  const isUpcoming = status === "UPCOMING";

  return (
    <Link
      prefetch={isLiveGame}
      href={`/app/game/${game.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-border bg-card transition-all duration-200 hover:-translate-y-1"
      style={{
        boxShadow: "4px 4px 0px 0px var(--border)",
      }}
    >
      {/* <div
        className={`h-1.5 w-full ${isLive
          ? "bg-linear-to-r from-destructive via-warning to-destructive"
          : isUpcoming
            ? "bg-linear-to-r from-info via-primary to-info"
            : "bg-linear-to-r from-muted-foreground via-muted to-muted-foreground"
          }`}
      /> */}

      <div className="flex flex-col gap-4 p-5">
        <div className="flex items-center justify-between">
          {isLive ? (
            <span className="flex items-center gap-1.5 rounded-full border-2 border-destructive/40 bg-destructive/10 px-2.5 py-1">
              <span className="live-dot" />
              <span className="font-mono text-[10px] font-black tracking-wider text-destructive uppercase">
                LIVE
              </span>
            </span>
          ) : isUpcoming ? (
            <span className="flex items-center gap-1.5 rounded-full border-2 border-info/40 bg-info/10 px-2.5 py-1">
              <Clock className="size-3 text-info" />
              <span className="font-mono text-[10px] font-black tracking-wider text-info uppercase">
                UPCOMING
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 rounded-full border-2 border-border bg-secondary px-2.5 py-1">
              <Trophy className="size-3 text-muted-foreground" />
              <span className="font-mono text-[10px] font-black tracking-wider text-muted-foreground uppercase">
                ENDED
              </span>
            </span>
          )}

          <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            #R{game.id}
          </span>
        </div>

        <h3 className="line-clamp-2 min-h-12 font-display text-2xl leading-tight font-black text-foreground">
          {game.name}
        </h3>

        <div className="flex flex-wrap gap-2">
          {game.agents
            .slice(0, Math.min(6, game.agents.length))
            .map((agent, i) => (
              <Badge
                key={agent.id}
                variant="secondary"
                className="gap-1.5 rounded-md px-2.5 py-3"
              >
                <span
                  className="size-2.5 rounded-full"
                  style={{
                    background:
                      "linear-gradient(125deg, " +
                      agent.color +
                      ", " +
                      agent.accent +
                      ")",
                  }}
                />
                {agent.name}
              </Badge>
            ))}
          {game.agents.length > 6 && (
            <span className="flex items-center rounded-lg border-2 border-border bg-secondary px-2.5 py-1 text-xs font-bold text-muted-foreground">
              +{game.agents.length - 6}
            </span>
          )}
        </div>

        <div className="mt-auto flex items-center justify-between border-t-2 border-border pt-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <Trophy className="size-3.5 text-primary" />
              <span className="font-mono text-sm font-black text-foreground">
                {Number(displayPool).toFixed(1)}
              </span>
              <span className="font-mono text-[10px] font-bold text-muted-foreground">
                USDC
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="size-3.5 text-muted-foreground" />
              <span className="font-mono text-xs font-bold text-muted-foreground">
                {game.agents.length}
              </span>
            </div>
          </div>

          <span className="flex items-center gap-1.5 rounded-full border-2 border-border bg-primary px-3 py-1.5 text-xs font-black text-primary-foreground shadow-[2px_2px_0px_0px_var(--border)] transition-all group-hover:shadow-[3px_3px_0px_0px_var(--border)] group-active:translate-x-0.5 group-active:translate-y-0.5 group-active:shadow-none">
            {isLive ? (
              <>
                <Flame className="size-3" /> BET
              </>
            ) : (
              <>
                VIEW <ArrowRight className="size-3" />
              </>
            )}
          </span>
        </div>
      </div>
    </Link>
  );
}
