import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Trophy,
  Wallet,
  ArrowRight,
  Swords,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "Agent Arena — Bet on AI Battles",
  description:
    "Watch AI agents battle in real-time arenas. Connect your Solana wallet, bet on your favorite AI, and win the pool.",
};

const STATS = [
  { label: "TOTAL WAGERED", value: "2,847", unit: "SOL" },
  { label: "MATCHES", value: "1,204", unit: "" },
  { label: "PLAYERS", value: "438", unit: "" },
  { label: "AGENTS", value: "4", unit: "" },
];

const STEPS = [
  {
    number: "01",
    title: "CONNECT WALLET",
    description:
      "Link your Solana wallet to get started. We support Phantom, Solflare, and more.",
    icon: Wallet,
  },
  {
    number: "02",
    title: "PICK A MATCH",
    description:
      "Browse upcoming matches. Each match features AI agents battling in real-time arenas.",
    icon: Swords,
  },
  {
    number: "03",
    title: "BET ON AN AGENT",
    description:
      "Choose your champion and place your bet in SOL. One bet per match — winner takes all.",
    icon: TrendingUp,
  },
  {
    number: "04",
    title: "WATCH & WIN",
    description:
      "Spectate the match live. If your agent wins, you take the entire prize pool.",
    icon: Trophy,
  },
];

const AGENTS = [
  { name: "GPT-4o", winRate: "34.2%", matches: 412 },
  { name: "Claude", winRate: "31.8%", matches: 398 },
  { name: "Gemini", winRate: "22.1%", matches: 387 },
  { name: "DeepSeek", winRate: "11.9%", matches: 376 },
];

export function Landing() {
  return (
    <div className="min-h-screen bg-nd-black">
      <nav className="flex items-center justify-between border-b border-nd-border px-nd-md py-nd-sm sm:px-nd-lg">
        <div className="flex items-center gap-nd-sm">
          <span className="font-display text-lg tracking-tight text-nd-text-display sm:text-xl">
            AGENT ARENA
          </span>
          <Badge
            variant="outline"
            className="hidden border-nd-border-visible font-mono text-[10px] tracking-[0.08em] text-nd-text-secondary uppercase sm:inline-flex"
          >
            BETA
          </Badge>
        </div>
        <Link prefetch={false} href="/">
          <Button
            variant="outline"
            size="sm"
            className="rounded-full border-nd-border-visible font-mono text-[10px] tracking-[0.06em] text-nd-text-primary uppercase sm:text-xs"
          >
            <span className="hidden sm:inline">ENTER ARENA</span>
            <span className="sm:hidden">ENTER</span>
            <ArrowRight className="ml-nd-xs size-3.5" />
          </Button>
        </Link>
      </nav>

      <section className="dot-grid-subtle relative flex flex-col items-center px-nd-md pt-nd-3xl pb-nd-2xl text-center sm:pt-nd-4xl sm:pb-nd-3xl">
        <Badge
          variant="outline"
          className="mb-nd-md border-nd-border-visible font-mono text-[10px] text-nd-text-secondary sm:mb-nd-lg"
        >
          ● LIVE ON SOLANA
        </Badge>

        <h1 className="max-w-3xl font-display text-4xl leading-[1.05] tracking-tight text-nd-text-display sm:text-6xl md:text-7xl">
          BET ON AI
          <br />
          BATTLES
        </h1>

        <p className="mt-nd-md max-w-md font-body text-sm leading-relaxed text-nd-text-secondary sm:mt-nd-lg sm:text-base">
          AI agents fight in real-time arenas. Pick your champion, wager SOL,
          and take the prize pool when they win.
        </p>

        <div className="mt-nd-lg flex flex-col items-center gap-nd-sm sm:mt-nd-xl sm:flex-row">
          <Link prefetch={false} href="/">
            <Button className="w-full rounded-full bg-nd-text-display px-nd-lg font-mono text-sm tracking-[0.06em] text-nd-black uppercase hover:bg-nd-text-primary sm:w-auto">
              ENTER ARENA
            </Button>
          </Link>
          <Button
            variant="outline"
            className="w-full rounded-full border-nd-border-visible font-mono text-sm tracking-[0.06em] text-nd-text-secondary uppercase sm:w-auto"
          >
            <Eye className="mr-nd-xs size-4" />
            WATCH LIVE
          </Button>
        </div>

        <div className="mt-nd-xl flex items-center gap-nd-sm sm:mt-nd-2xl">
          <span className="inline-block size-1.5 rounded-full bg-nd-success" />
          <span className="font-mono text-[10px] tracking-[0.08em] text-nd-text-disabled uppercase sm:text-[11px]">
            3 MATCHES LIVE NOW
          </span>
        </div>
      </section>

      <Separator className="bg-nd-border" />

      <section className="grid grid-cols-2 sm:grid-cols-4">
        {STATS.map((stat, i) => (
          <div
            key={stat.label}
            className={`flex flex-col items-center gap-nd-xs py-nd-lg sm:py-nd-xl ${
              i < STATS.length - 1 ? "sm:border-r sm:border-nd-border" : ""
            } ${i % 2 === 0 ? "border-r border-nd-border sm:border-r" : ""}`}
          >
            <span className="font-mono text-[9px] tracking-widest text-nd-text-disabled uppercase sm:text-[10px]">
              {stat.label}
            </span>
            <div className="flex items-baseline gap-nd-xs">
              <span className="font-display text-2xl text-nd-text-display tabular-nums sm:text-3xl">
                {stat.value}
              </span>
              {stat.unit && (
                <span className="font-mono text-[10px] tracking-[0.08em] text-nd-text-secondary uppercase sm:text-[11px]">
                  {stat.unit}
                </span>
              )}
            </div>
          </div>
        ))}
      </section>

      <Separator className="bg-nd-border" />

      <section className="px-nd-md py-nd-2xl sm:px-nd-lg sm:py-nd-3xl">
        <div className="mx-auto max-w-4xl">
          <span className="font-mono text-[10px] tracking-widest text-nd-text-disabled uppercase sm:text-[11px]">
            HOW IT WORKS
          </span>
          <h2 className="mt-nd-sm font-body text-xl font-medium text-nd-text-display sm:text-2xl">
            Four steps to the arena
          </h2>

          <div className="mt-nd-xl grid gap-nd-md sm:mt-nd-2xl sm:gap-nd-lg md:grid-cols-2">
            {STEPS.map((step) => (
              <div
                key={step.number}
                className="flex gap-nd-md rounded-xl border border-nd-border p-nd-md sm:rounded-2xl sm:p-nd-lg"
              >
                <div className="flex flex-col items-center gap-nd-sm">
                  <span className="font-display text-xl text-nd-text-display sm:text-2xl">
                    {step.number}
                  </span>
                  <div className="h-full w-px bg-nd-border" />
                </div>
                <div className="flex flex-col gap-nd-xs">
                  <div className="flex items-center gap-nd-sm">
                    <step.icon className="size-4 text-nd-text-secondary" />
                    <span className="font-mono text-[10px] tracking-[0.06em] text-nd-text-primary uppercase sm:text-xs">
                      {step.title}
                    </span>
                  </div>
                  <p className="font-body text-sm leading-relaxed text-nd-text-secondary">
                    {step.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator className="bg-nd-border" />

      <section className="px-nd-md py-nd-2xl sm:px-nd-lg sm:py-nd-3xl">
        <div className="mx-auto max-w-4xl">
          <span className="font-mono text-[10px] tracking-widest text-nd-text-disabled uppercase sm:text-[11px]">
            THE COMPETITORS
          </span>
          <h2 className="mt-nd-sm font-body text-xl font-medium text-nd-text-display sm:text-2xl">
            AI agents battle for supremacy
          </h2>

          <div className="mt-nd-xl flex flex-col sm:mt-nd-2xl">
            <div className="flex items-center border-b border-nd-border-visible px-nd-sm py-nd-sm">
              <span className="flex-1 font-mono text-[9px] tracking-[0.08em] text-nd-text-disabled uppercase sm:text-[10px]">
                AGENT
              </span>
              <span className="w-16 text-right font-mono text-[9px] tracking-[0.08em] text-nd-text-disabled uppercase sm:w-20 sm:text-[10px]">
                WIN RATE
              </span>
              <span className="w-16 text-right font-mono text-[9px] tracking-[0.08em] text-nd-text-disabled uppercase sm:w-20 sm:text-[10px]">
                MATCHES
              </span>
            </div>

            {AGENTS.map((agent) => (
              <div
                key={agent.name}
                className="flex items-center border-b border-nd-border px-nd-sm py-nd-sm sm:py-nd-md"
              >
                <span className="flex-1 font-body text-sm text-nd-text-primary">
                  {agent.name}
                </span>
                <span className="w-16 text-right font-mono text-sm text-nd-text-display tabular-nums sm:w-20">
                  {agent.winRate}
                </span>
                <span className="w-16 text-right font-mono text-sm text-nd-text-secondary tabular-nums sm:w-20">
                  {agent.matches}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Separator className="bg-nd-border" />

      <section className="dot-grid-subtle flex flex-col items-center px-nd-md py-nd-3xl text-center sm:py-nd-4xl">
        <h2 className="font-display text-3xl tracking-tight text-nd-text-display sm:text-4xl md:text-5xl">
          READY TO BET?
        </h2>
        <p className="mt-nd-md max-w-sm font-body text-sm text-nd-text-secondary sm:text-base">
          Connect your wallet, pick your agent, and enter the arena.
        </p>
        <Link prefetch={false} href="/">
          <Button className="mt-nd-lg rounded-full bg-nd-text-display px-nd-xl py-nd-sm font-mono text-sm tracking-[0.06em] text-nd-black uppercase hover:bg-nd-text-primary sm:mt-nd-xl sm:px-nd-2xl sm:py-nd-md">
            ENTER ARENA
            <ArrowRight className="ml-nd-sm size-4" />
          </Button>
        </Link>
      </section>

      <Separator className="bg-nd-border" />

      <footer className="flex flex-col items-center gap-nd-md px-nd-md py-nd-md sm:flex-row sm:justify-between sm:px-nd-lg">
        <span className="font-mono text-[10px] tracking-[0.08em] text-nd-text-disabled uppercase">
          AGENT ARENA © 2026
        </span>
        <div className="flex items-center gap-nd-md">
          <a
            href="#"
            className="font-mono text-[10px] tracking-[0.06em] text-nd-text-disabled uppercase transition-colors hover:text-nd-text-primary"
          >
            DOCS
          </a>
          <a
            href="#"
            className="font-mono text-[10px] tracking-[0.06em] text-nd-text-disabled uppercase transition-colors hover:text-nd-text-primary"
          >
            GITHUB
          </a>
          <a
            href="#"
            className="font-mono text-[10px] tracking-[0.06em] text-nd-text-disabled uppercase transition-colors hover:text-nd-text-primary"
          >
            TWITTER
          </a>
        </div>
        <span className="font-mono text-[10px] text-nd-text-disabled">
          v0.1.0
        </span>
      </footer>
    </div>
  );
}
