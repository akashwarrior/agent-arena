"use client";

import type { GameWithAgents } from "@/lib/api-types";
import { useEffect, useRef, useState } from "react";
import { Clock, Users, Trophy } from "lucide-react";

export function UpcomingLayout({
  game,
  onCountdownEnd,
}: {
  game: GameWithAgents;
  onCountdownEnd: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState("TBA");
  const lastRefreshAtRef = useRef(0);

  useEffect(() => {
    if (!game.startedAt) return;

    const updateCountdown = () => {
      const now = new Date();
      const diffMs = new Date(game.startedAt!).getTime() - now.getTime();

      if (diffMs <= 0) {
        setTimeLeft("Starting soon...");
        if (now.getTime() - lastRefreshAtRef.current >= 1000) {
          lastRefreshAtRef.current = now.getTime();
          onCountdownEnd();
        }
      } else {
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        const diffHours = Math.floor(
          (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const diffMinutes = Math.floor(
          (diffMs % (1000 * 60 * 60)) / (1000 * 60)
        );
        const diffSeconds = Math.floor((diffMs % (1000 * 60)) / 1000);

        let timeString = "";
        if (diffDays > 0) timeString += `${diffDays}d `;
        if (diffHours > 0 || diffDays > 0) timeString += `${diffHours}h `;
        if (diffMinutes > 0 || diffHours > 0 || diffDays > 0)
          timeString += `${diffMinutes}m `;
        timeString += `${diffSeconds}s`;

        setTimeLeft(timeString);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="relative flex w-full max-w-5xl flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-border bg-card shadow-[4px_4px_0px_0px_var(--border)] min-h-[400px] md:aspect-video">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />

      <div className="z-10 m-auto flex flex-col items-center gap-5 p-5 md:gap-10 md:p-8">
        <div className="flex items-center justify-center rounded-2xl border-4 border-primary bg-primary/10 p-4 shadow-[4px_4px_0px_0px_var(--primary)] md:p-6 md:shadow-[6px_6px_0px_0px_var(--primary)]">
          <Clock className="size-10 animate-pulse text-primary md:size-16" />
        </div>

        <div className="text-center">
          <h2 className="font-display text-3xl font-black tracking-tighter text-foreground uppercase drop-shadow-sm md:text-5xl">
            Match Upcoming
          </h2>
          <div className="mt-4 inline-block -rotate-2 transform border-2 border-black bg-primary px-4 py-2 text-primary-foreground shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] md:mt-6 md:px-6 md:py-3 md:shadow-[6px_6px_0px_0px_rgba(0,0,0,0.5)]">
            <p className="font-mono text-xl font-black tracking-wider uppercase md:text-3xl">
              {startedAt ? `${timeLeft}` : "TBA"}
            </p>
          </div>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center sm:gap-6">
          <div className="flex items-center gap-3 rounded-xl border-2 border-border bg-card px-4 py-3 shadow-[3px_3px_0px_0px_var(--border)] transition-transform hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_var(--border)] md:gap-4 md:px-6 md:py-4 md:shadow-[4px_4px_0px_0px_var(--border)]">
            <div className="rounded-lg bg-yellow-500/20 p-2 md:p-3">
              <Trophy className="size-6 text-yellow-500 md:size-8" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                Prize Pool
              </span>
              <span className="font-display text-lg font-black text-foreground md:text-2xl">
                {game.totalPool} USDC
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border-2 border-border bg-card px-4 py-3 shadow-[3px_3px_0px_0px_var(--border)] transition-transform hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_var(--border)] md:gap-4 md:px-6 md:py-4 md:shadow-[4px_4px_0px_0px_var(--border)]">
            <div className="rounded-lg bg-blue-500/20 p-2 md:p-3">
              <Users className="size-6 text-blue-500 md:size-8" />
            </div>
            <div className="flex flex-col">
              <span className="font-mono text-[10px] font-black tracking-widest text-muted-foreground uppercase">
                Contenders
              </span>
              <span className="font-display text-lg font-black text-foreground md:text-2xl">
                {game.agents?.length || 0} Agents
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
