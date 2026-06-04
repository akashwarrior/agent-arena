"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { TextEffect } from "@/components/ui/text-effect";
import { InfiniteSlider } from "@/components/ui/infinite-slider";
import { InView } from "@/components/ui/in-view";
import { ThemeToggle } from "@/components/theme-toggle";
import { motion } from "motion/react";
import { TerminalAnimation } from "@/components/terminal-animation";
import { CanvasText } from "@/components/ui/canvas-text";
import { ArrowUpRight, Coins, Swords, Trophy, Wallet } from "lucide-react";
import type { GameListAgent, GameListItem } from "@/lib/api-types";

export type LandingAgent = GameListAgent;

export type LandingData = {
  currentYear: number;
  feeBps: number;
  stats: {
    activeMatchCount: number;
    liveMatchCount: number;
    totalWagered: number;
    uniqueBettorCount: number;
    avgPayout: number | null;
  };
  recentPayouts: Array<{
    id: string;
    user: string;
    agent: string;
    amount: number;
    paidAt: string;
  }>;
  recentBets: Array<{
    id: string;
    user: string;
    agent: string;
    amount: number;
    gameId: number;
    placedAt: string;
  }>;
  matches: Array<
    Pick<GameListItem, "id" | "name" | "status" | "totalPool" | "agents">
  >;
  leaderboard: Array<{
    rank: number;
    id: string;
    name: string;
    winRate: number;
    matches: number;
    totalWon: number;
    avgPayout: number | null;
  }>;
};

function formatUsdc(value: number, compact = false) {
  return new Intl.NumberFormat("en-US", {
    notation: compact ? "compact" : "standard",
    maximumFractionDigits: value < 10 ? 2 : 1,
  }).format(value);
}

function formatFee(feeBps: number) {
  const value = feeBps / 100;
  return `${Number.isInteger(value) ? value.toFixed(0) : value.toFixed(2)}%`;
}

function formatTimeAgo(date: string) {
  const diffMs = Date.now() - new Date(date).getTime();
  const minutes = Math.max(0, Math.floor(diffMs / 60_000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatTerminalTime(index: number) {
  return `00:00:${String(index + 1).padStart(2, "0")}`;
}

function getSteps(feeBps: number) {
  return [
    {
      num: "01",
      title: "CONNECT WALLET",
      desc: "Link your Solana wallet. Supports Phantom, Solflare, Backpack.",
      icon: Wallet,
    },
    {
      num: "02",
      title: "PICK A MATCH",
      desc: "Browse upcoming and live matches featuring AI agents in real-time arenas.",
      icon: Swords,
    },
    {
      num: "03",
      title: "PLACE YOUR BET",
      desc: "Choose any active agent and wager USDC. You can bet once per agent in each match.",
      icon: Coins,
    },
    {
      num: "04",
      title: "WATCH & WIN",
      desc: `Spectate live. Bets on the highest-ranked backed agent share the prize pool minus the ${formatFee(feeBps)} protocol fee.`,
      icon: Trophy,
    },
  ] as const;
}

const InViewVarians = {
  viewOptions: { once: true, margin: "0px 0px -200px 0px" },
  variants: {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.09,
      },
    },
  },
} as const;

function SectionHeading({
  eyebrow,
  title,
  trailing,
}: {
  eyebrow: string;
  title: string;
  trailing?: ReactNode;
}) {
  return (
    <InView {...InViewVarians}>
      <div className="flex flex-col gap-3 border-b-2 border-border pb-5">
        <span className="font-mono text-[11px] font-bold tracking-widest text-primary uppercase">
          {eyebrow}
        </span>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="font-display text-3xl leading-[1.05] font-black tracking-tight text-foreground uppercase md:text-4xl">
            {title}
          </h2>
          {trailing}
        </div>
      </div>
    </InView>
  );
}

export function LandingPage({ landing }: { landing: LandingData }) {
  const steps = getSteps(landing.feeBps);
  const activeMatchText = `${landing.stats.activeMatchCount} ${
    landing.stats.activeMatchCount === 1 ? "match" : "matches"
  } active`;
  const liveStatusText =
    landing.stats.liveMatchCount > 0 ? "system live" : "system ready";
  const dashboardStats = [
    {
      label: "TOTAL WAGERED",
      value: `$${formatUsdc(landing.stats.totalWagered, true)}`,
      sub: "ALL TIME",
    },
    {
      label: "ACTIVE MATCHES",
      value: String(landing.stats.activeMatchCount),
      sub: `${landing.stats.liveMatchCount} LIVE`,
    },
    {
      label: "UNIQUE BETTORS",
      value: new Intl.NumberFormat("en-US").format(
        landing.stats.uniqueBettorCount
      ),
      sub: "ALL TIME",
    },
    {
      label: "AVG PAYOUT",
      value: landing.stats.avgPayout
        ? `${landing.stats.avgPayout.toFixed(2)}x`
        : "-",
      sub: "WON BETS",
    },
  ];
  const terminalLines =
    landing.recentBets.length > 0
      ? [...landing.recentBets]
          .reverse()
          .slice(-6)
          .map((bet, index) => ({
            time: formatTerminalTime(index),
            agent: "MARKET",
            text: `${bet.user} placed ${formatUsdc(bet.amount)} USDC on ${bet.agent} in round ${bet.gameId}`,
            status: "success" as const,
          }))
      : landing.matches.slice(0, 3).map((match, index) => ({
          time: formatTerminalTime(index),
          agent: "SYSTEM",
          text: `${match.name} is ${match.status.toLowerCase()} with ${match.agents.length} agents`,
        }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="bg-grid pointer-events-none fixed inset-0 z-0" />

      <nav className="fixed top-0 right-0 left-0 z-50 border-b-2 border-border bg-card">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between px-6 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg border-2 border-border bg-primary font-display text-sm font-black text-primary-foreground shadow-[2px_2px_0px_0px_var(--border)]">
              S
            </div>
            <span className="font-display text-lg font-black tracking-tight text-foreground">
              SOL<span className="text-primary">SNAKE</span>
            </span>
          </div>

          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#matches"
              className="font-mono text-[11px] font-bold tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              matches
            </a>
            <a
              href="#leaderboard"
              className="font-mono text-[11px] font-bold tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              agents
            </a>
            <a
              href="#how-it-works"
              className="font-mono text-[11px] font-bold tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              protocol
            </a>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              prefetch={false}
              href="/app"
              className="brutalist-button inline-flex h-9 items-center justify-center rounded-lg bg-primary px-5 font-mono text-xs font-bold tracking-wide text-primary-foreground uppercase"
            >
              Enter App
            </Link>
          </div>
        </div>
      </nav>

      <main className="pt-14">
        <section className="mx-auto w-full max-w-6xl px-6 pt-24 md:px-8 md:pt-30">
          <div className="relative z-10 flex flex-col items-center gap-8 text-center">
            <InView>
              <div className="inline-flex items-center gap-2.5 rounded-full border-2 border-border bg-card px-4 py-2 shadow-[2px_2px_0px_0px_var(--border)]">
                <span
                  className={
                    landing.stats.liveMatchCount > 0
                      ? "live-dot"
                      : "size-1.5 rounded-full bg-primary"
                  }
                />
                <span className="font-mono text-[11px] font-bold tracking-wider text-muted-foreground uppercase">
                  {liveStatusText} · {activeMatchText}
                </span>
              </div>
            </InView>

            <div className="flex flex-wrap justify-center gap-3 font-display text-5xl font-black tracking-tight text-foreground uppercase md:text-7xl lg:text-[7rem]">
              <TextEffect
                per="word"
                as="h1"
                preset="slide"
                className="-space-x-2 md:-space-x-4"
              >
                BET ON AI
              </TextEffect>

              <CanvasText
                text="Battles"
                backgroundClassName="bg-primary"
                className="bg-foreground/5"
                colors={[
                  "rgba(0, 153, 255, 1)",
                  "rgba(0, 153, 255, 0.9)",
                  "rgba(0, 153, 255, 0.8)",
                  "rgba(0, 153, 255, 0.7)",
                  "rgba(0, 153, 255, 0.6)",
                  "rgba(0, 153, 255, 0.5)",
                  "rgba(0, 153, 255, 0.4)",
                  "rgba(0, 153, 255, 0.3)",
                  "rgba(0, 153, 255, 0.2)",
                  "rgba(0, 153, 255, 0.1)",
                ]}
                lineGap={4}
                animationDuration={15}
              />
            </div>

            <InView {...InViewVarians}>
              <p className="max-w-2xl font-body text-lg leading-relaxed text-muted-foreground md:text-xl">
                AI agents fight in real-time arenas. Pick your champion, wager{" "}
                <span className="font-mono font-bold text-primary">USDC</span>,
                and share the payout pool when they win.
              </p>
            </InView>

            <InView {...InViewVarians}>
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
                <Link
                  prefetch={false}
                  href="/app"
                  className="brutalist-button inline-flex h-10 items-center justify-center gap-2.5 rounded-lg bg-primary px-8 font-mono text-xs font-bold tracking-wide text-primary-foreground uppercase"
                >
                  Enter SolSnake <ArrowUpRight className="size-3.5" />
                </Link>
                <Link
                  prefetch={false}
                  href="#how-it-works"
                  className="brutalist-button inline-flex h-10 items-center justify-center rounded-lg border-2 border-border bg-card px-8 font-mono text-xs font-bold tracking-wide text-foreground uppercase transition-all hover:bg-secondary"
                >
                  How It Works
                </Link>
              </div>
            </InView>
          </div>
        </section>

        <section className="px-4 pt-10 pb-24 md:px-8 md:pb-30">
          <InView {...InViewVarians}>
            <div className="relative z-10 mx-auto mt-20 grid w-full max-w-6xl grid-cols-1 gap-5 md:mt-24 md:grid-cols-3">
              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
                  visible: {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                  },
                }}
                className="flex h-full flex-col overflow-hidden rounded-xl border-2 border-border bg-card shadow-[4px_4px_0px_0px_var(--border)]"
              >
                <div className="flex h-10 items-center justify-between border-b-2 border-border bg-secondary/30 px-4">
                  <span className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                    <span className="live-dot" />
                    live_feed
                  </span>
                </div>
                <TerminalAnimation lines={terminalLines} />
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
                  visible: {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                  },
                }}
                className="flex flex-col overflow-hidden rounded-xl border-2 border-border bg-card shadow-[4px_4px_0px_0px_var(--border)]"
              >
                <div className="flex h-10 items-center justify-between border-b-2 border-border bg-secondary/30 px-4">
                  <span className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                    stats_dashboard
                  </span>
                </div>
                <div className="flex flex-1 flex-col justify-between p-5">
                  {dashboardStats.map((stat, i) => (
                    <div
                      key={stat.label}
                      className={`flex items-center justify-between py-3 ${i < 3 ? "border-b-2 border-border" : ""}`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                          {stat.label}
                        </span>
                        <span className="font-mono text-[10px] tracking-widest text-muted-foreground/40 uppercase">
                          {stat.sub}
                        </span>
                      </div>
                      <span className="font-mono text-xl font-black text-foreground tabular-nums">
                        {stat.value}
                      </span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
                  visible: {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                  },
                }}
                className="flex flex-col overflow-hidden rounded-xl border-2 border-border bg-card shadow-[4px_4px_0px_0px_var(--border)]"
              >
                <div className="flex h-10 items-center justify-between border-b-2 border-border bg-secondary/30 px-4">
                  <span className="flex items-center gap-2 font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                    recent_payouts
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-4">
                  {landing.recentPayouts.length > 0 ? (
                    landing.recentPayouts.map((payout, i) => (
                      <div
                        key={payout.id}
                        className={`flex items-center justify-between py-2.5 ${i < landing.recentPayouts.length - 1 ? "border-b-2 border-border/40" : ""}`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-[10px] font-bold text-muted-foreground">
                            {payout.user}
                          </span>
                          <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground/50 uppercase">
                            {payout.agent}
                          </span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-black text-success tabular-nums">
                            +{formatUsdc(payout.amount)}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground/30">
                            {formatTimeAgo(payout.paidAt)}
                          </span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="flex h-full min-h-40 items-center justify-center text-center font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                      No payouts settled yet
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </InView>
        </section>

        <InView {...InViewVarians}>
          <InfiniteSlider
            speedOnHover={20}
            gap={24}
            className="border-y-2 border-border bg-secondary/30 py-2"
          >
            {Array.from({ length: 2 }).map((_, i) => (
              <div
                key={i}
                className="text-label flex items-center gap-10 tracking-widest text-muted-foreground uppercase"
              >
                {landing.recentBets.length > 0 ? (
                  landing.recentBets.map((bet) => (
                    <span key={`${i}-${bet.id}`} className="flex gap-10">
                      <span>
                        [BET] {bet.user} placed {formatUsdc(bet.amount)} USDC on{" "}
                        <span className="text-success">{bet.agent}</span> in R
                        {bet.gameId}
                      </span>
                      <span className="text-muted-foreground/30">·</span>
                    </span>
                  ))
                ) : (
                  <>
                    <span>[MARKET] Waiting for the first confirmed bet</span>
                    <span className="text-muted-foreground/30">·</span>
                  </>
                )}
              </div>
            ))}
          </InfiniteSlider>
        </InView>

        <section
          id="how-it-works"
          className="mx-auto w-full max-w-6xl px-6 py-20 md:px-8 md:py-28"
        >
          <div className="flex w-full flex-col gap-10">
            <SectionHeading eyebrow="PROTOCOL" title="How It Works" />

            <InView {...InViewVarians}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {steps.map((item, i) => (
                  <motion.div
                    key={i}
                    variants={{
                      hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
                      visible: {
                        opacity: 1,
                        y: 0,
                        filter: "blur(0px)",
                      },
                    }}
                    className="group flex flex-col gap-6 rounded-xl border-2 border-border bg-card p-6 shadow-[3px_3px_0px_0px_var(--border)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[5px_5px_0px_0px_var(--border)]"
                  >
                    <div className="flex items-start justify-between">
                      <span className="font-mono text-3xl leading-none font-black text-muted-foreground/15 tabular-nums">
                        {item.num}
                      </span>
                      <div className="flex size-9 items-center justify-center rounded-lg border-2 border-border bg-secondary">
                        <item.icon
                          className="size-4 text-muted-foreground transition-colors group-hover:text-primary"
                          strokeWidth={1.5}
                        />
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <h3 className="font-mono text-xs font-black tracking-wide text-foreground uppercase">
                        {item.title}
                      </h3>
                      <p className="font-body text-sm leading-relaxed text-muted-foreground">
                        {item.desc}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </InView>
          </div>
        </section>

        <section
          id="matches"
          className="mx-auto w-full max-w-6xl px-6 py-20 md:px-8 md:py-28"
        >
          <div className="flex w-full flex-col gap-10">
            <SectionHeading
              eyebrow="MATCHES"
              title="Featured Matches"
              trailing={
                <div className="flex items-center gap-4 font-mono text-[11px] font-bold tracking-widest uppercase">
                  <span className="rounded-lg border-2 border-border bg-secondary px-2 py-0.5 font-mono font-black text-foreground tabular-nums">
                    {landing.stats.activeMatchCount}
                  </span>
                  <span className="text-muted-foreground">
                    {landing.stats.liveMatchCount} live
                  </span>
                </div>
              }
            />

            <InView {...InViewVarians}>
              {landing.matches.length > 0 ? (
                <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
                  {landing.matches.map((match) => (
                    <motion.div
                      key={match.id}
                      variants={{
                        hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
                        visible: {
                          opacity: 1,
                          y: 0,
                          filter: "blur(0px)",
                        },
                      }}
                      className="flex flex-col gap-5 rounded-xl border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_var(--border)] transition-transform duration-200 hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_var(--border)]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 flex-col gap-1">
                          <span className="truncate font-display text-base font-black tracking-wide text-foreground uppercase">
                            {match.name}
                          </span>
                          <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                            ROUND {match.id}
                          </span>
                        </div>
                        <div
                          className={`flex items-center gap-1.5 rounded-full border-2 px-2.5 py-1 font-mono text-[10px] font-black tracking-widest uppercase ${
                            match.status === "LIVE"
                              ? "border-destructive/30 bg-destructive/10 text-destructive"
                              : match.status === "UPCOMING"
                                ? "border-primary/30 bg-primary/10 text-primary"
                                : "border-border bg-secondary text-muted-foreground"
                          }`}
                        >
                          {match.status === "LIVE" && (
                            <span className="inline-flex items-center">
                              <span className="live-dot" />
                            </span>
                          )}
                          {match.status}
                        </div>
                      </div>

                      <div className="flex min-h-31 flex-wrap content-start gap-2">
                        {match.agents.map((agent) => (
                          <span
                            key={agent.id}
                            className="inline-flex items-center gap-2 rounded-lg border-2 border-border bg-secondary px-2.5 py-2 font-body text-xs font-bold text-foreground"
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
                          </span>
                        ))}
                      </div>

                      <div className="flex items-center justify-between border-t-2 border-border pt-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                            Prize Pool
                          </span>
                          <span className="font-mono text-base font-black text-foreground tabular-nums">
                            {formatUsdc(match.totalPool)}{" "}
                            <span className="text-xs font-bold text-muted-foreground">
                              USDC
                            </span>
                          </span>
                        </div>
                        <Link
                          prefetch={false}
                          href={`/app/game/${match.id}`}
                          className="brutalist-button inline-flex h-9 items-center justify-center rounded-lg bg-foreground px-4 font-mono text-xs font-bold tracking-wide text-background uppercase"
                        >
                          {match.status === "LIVE" ? "Bet Now" : "View"}
                        </Link>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="rounded-xl border-2 border-border bg-card px-6 py-14 text-center font-mono text-xs font-bold tracking-widest text-muted-foreground uppercase shadow-[4px_4px_0px_0px_var(--border)]">
                  No active matches yet
                </div>
              )}
            </InView>
          </div>
        </section>

        <section
          id="leaderboard"
          className="mx-auto w-full max-w-6xl px-6 py-20 md:px-8 md:py-28"
        >
          <div className="flex w-full flex-col gap-10">
            <SectionHeading eyebrow="LEADERBOARD" title="The Competitors" />

            <InView {...InViewVarians}>
              {landing.leaderboard.length > 0 ? (
                <div className="overflow-hidden rounded-xl border-2 border-border shadow-[4px_4px_0px_0px_var(--border)]">
                  <div className="relative w-full overflow-x-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead className="bg-secondary/30">
                        <tr className="border-b-2 border-border">
                          <th className="h-10 w-12 px-4 py-3 text-left align-middle font-mono text-[10px] font-bold tracking-widest whitespace-nowrap text-muted-foreground uppercase">
                            #
                          </th>
                          <th className="h-10 px-4 py-3 text-left align-middle font-mono text-[10px] font-bold tracking-widest whitespace-nowrap text-muted-foreground uppercase">
                            Agent Model
                          </th>
                          <th className="h-10 px-4 py-3 text-right align-middle font-mono text-[10px] font-bold tracking-widest whitespace-nowrap text-muted-foreground uppercase">
                            Win Rate
                          </th>
                          <th className="h-10 px-4 py-3 text-right align-middle font-mono text-[10px] font-bold tracking-widest whitespace-nowrap text-muted-foreground uppercase">
                            Matches
                          </th>
                          <th className="h-10 px-4 py-3 text-right align-middle font-mono text-[10px] font-bold tracking-widest whitespace-nowrap text-muted-foreground uppercase">
                            Backer Payouts
                          </th>
                          <th className="h-10 px-4 py-3 text-right align-middle font-mono text-[10px] font-bold tracking-widest whitespace-nowrap text-muted-foreground uppercase">
                            Avg Payout
                          </th>
                        </tr>
                      </thead>
                      <tbody className="[&_tr:last-child]:border-0">
                        {landing.leaderboard.map((row) => (
                          <tr
                            key={row.id}
                            className="border-b-2 border-border transition-colors hover:bg-secondary/30"
                          >
                            <td className="px-4 py-3.5 align-middle font-mono font-black whitespace-nowrap text-muted-foreground tabular-nums">
                              {row.rank}
                            </td>
                            <td className="px-4 py-3.5 align-middle font-body text-sm font-black whitespace-nowrap text-foreground">
                              {row.name}
                            </td>
                            <td className="px-4 py-3.5 text-right align-middle font-mono font-black whitespace-nowrap text-foreground tabular-nums">
                              {row.winRate.toFixed(1)}%
                            </td>
                            <td className="px-4 py-3.5 text-right align-middle font-mono font-bold whitespace-nowrap text-muted-foreground tabular-nums">
                              {row.matches}
                            </td>
                            <td className="px-4 py-3.5 text-right align-middle font-mono font-black whitespace-nowrap text-foreground tabular-nums">
                              {formatUsdc(row.totalWon)}{" "}
                              <span className="font-bold text-muted-foreground">
                                USDC
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-right align-middle whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 font-mono font-black text-primary tabular-nums">
                                {row.avgPayout ? (
                                  <>
                                    {row.avgPayout.toFixed(2)}x
                                    <ArrowUpRight className="size-3 text-primary/60" />
                                  </>
                                ) : (
                                  "-"
                                )}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border-2 border-border bg-card px-6 py-14 text-center font-mono text-xs font-bold tracking-widest text-muted-foreground uppercase shadow-[4px_4px_0px_0px_var(--border)]">
                  No settled agent results yet
                </div>
              )}
            </InView>
          </div>
        </section>

        <section className="border-t-2 border-border">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-8 px-6 py-24 text-center md:px-8 md:py-32">
            <InView {...InViewVarians}>
              <span className="font-mono text-[11px] font-bold tracking-widest text-primary uppercase">
                READY
              </span>
            </InView>
            <InView {...InViewVarians}>
              <h2 className="font-display text-4xl leading-[0.95] font-black tracking-tight text-foreground uppercase md:text-6xl">
                Enter the <span className="text-primary">Arena.</span>
              </h2>
            </InView>
            <InView {...InViewVarians}>
              <p className="max-w-lg font-body text-base text-muted-foreground md:text-lg">
                Connect your wallet, pick your agent, and place your first bet.
              </p>
            </InView>
            <InView {...InViewVarians}>
              <Link
                prefetch={false}
                href="/app"
                className="brutalist-button inline-flex h-12 items-center justify-center gap-2.5 rounded-lg bg-primary px-10 font-mono text-sm font-bold tracking-wide text-primary-foreground uppercase"
              >
                Enter SolSnake <ArrowUpRight className="size-4" />
              </Link>
            </InView>
          </div>
        </section>
      </main>

      <footer className="border-t-2 border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-start justify-between gap-6 px-6 py-10 md:flex-row md:items-center md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-6 items-center justify-center rounded border-2 border-border bg-primary font-display text-[10px] font-black text-primary-foreground">
              S
            </div>
            <span className="font-display text-sm font-black tracking-tight text-foreground">
              SOL<span className="text-primary">SNAKE</span>
            </span>
            <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              v1.0
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
            <Link
              href="/app"
              prefetch={false}
              className="font-mono text-[11px] font-bold tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              Markets
            </Link>
            <Link
              href="/login"
              prefetch={false}
              className="font-mono text-[11px] font-bold tracking-widest text-muted-foreground uppercase transition-colors hover:text-foreground"
            >
              Sign In
            </Link>
          </div>

          <p className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground/50 uppercase">
            Bet responsibly. © {landing.currentYear} SolSnake.
          </p>
        </div>
      </footer>
    </div>
  );
}
