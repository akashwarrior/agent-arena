"use client";

import useSWR from "swr";
import { Loader2, WifiOff, Zap } from "lucide-react";

type LiveBetActivity = {
  id: string;
  amount: number;
  placedAt: string;
  agent: {
    id: string;
    name: string;
    color: string;
    accent: string;
  };
  game: {
    id: number;
    name: string;
    status: string;
  };
};

type LiveBetActivityResponse = {
  activities: LiveBetActivity[];
};

async function fetcher(url: string): Promise<LiveBetActivityResponse> {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to load live betting activity");
  }

  return response.json();
}

function formatUsdc(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: amount < 1 ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function LiveTicker({ bets }: { bets: LiveBetActivity[] }) {
  const { data, error, isLoading } = useSWR<LiveBetActivityResponse>(
    "/api/activity/bets",
    fetcher,
    {
      refreshInterval: 10_000,
      revalidateOnFocus: false,
      revalidateOnMount: false,
      keepPreviousData: true,
      fallbackData: { activities: bets },
    }
  );

  const activities = data?.activities ?? [];

  return (
    <div className="relative flex h-7 items-center overflow-hidden border-b-2 border-border bg-secondary">
      <div className="pointer-events-none absolute left-0 z-10 h-full w-10 bg-linear-to-r from-secondary to-transparent" />
      <div className="pointer-events-none absolute right-0 z-10 h-full w-10 bg-linear-to-l from-secondary to-transparent" />

      {activities.length > 0 ? (
        <div className="animate-marquee flex min-w-max items-center whitespace-nowrap">
          {activities.map((activity, i) => (
            <span
              key={`${activity.id}-${i}`}
              className="mx-5 flex items-center gap-1.5 font-mono text-[10px] font-bold tracking-wider text-muted-foreground uppercase"
            >
              <Zap className="size-2.5 text-primary" />
              <span>Someone bet</span>
              <span className="rounded border-2 border-primary/30 bg-primary/10 px-1 py-px font-black text-foreground">
                {formatUsdc(activity.amount)} USDC
              </span>
              <span>on</span>
              <span className="rounded border-2 border-border bg-card px-1 py-px font-black text-foreground">
                {activity.agent.name}
              </span>
              <span className="ml-0.5 text-muted-foreground/60">
                in R{activity.game.id}
              </span>
            </span>
          ))}
        </div>
      ) : (
        <div className="flex w-full items-center justify-center gap-2 font-mono text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
          {isLoading ? (
            <>
              <Loader2 className="size-3 animate-spin text-primary" />
              Loading live betting activity
            </>
          ) : error ? (
            <>
              <WifiOff className="size-3 text-destructive" />
              Live betting activity unavailable
            </>
          ) : (
            <>
              <Zap className="size-3 text-primary" />
              No live bets yet
            </>
          )}
        </div>
      )}
    </div>
  );
}
