import { LoginForm } from "@/components/login-form";
import { Separator } from "@/components/ui/separator";
import { LoginArt } from "@/components/login-art";
import Link from "next/link";
import { prisma } from "@repo/db";

export const revalidate = 3600;

function formatMetric(value: number) {
  return new Intl.NumberFormat("en-US", {
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 10_000 ? 1 : 0,
  }).format(value);
}

async function getLoginStats() {
  try {
    const [matches, players, wagered] = await Promise.all([
      prisma.game.count(),
      prisma.user.count(),
      prisma.bet.aggregate({
        where: { status: { not: "REFUNDED" } },
        _sum: { amount: true },
      }),
    ]);

    return {
      matches,
      players,
      wagered: Number(wagered._sum.amount ?? BigInt(0)) / 1e6,
    };
  } catch {
    return {
      matches: 0,
      players: 0,
      wagered: 0,
    };
  }
}

export default async function Login() {
  const stats = await getLoginStats();
  const currentYear = new Date().getFullYear();

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background text-foreground">
      <div className="relative z-10 flex w-full flex-col lg:flex-row">
        <div className="relative hidden flex-col justify-between overflow-hidden border-r-2 border-border p-12 lg:flex lg:w-1/2">
          <LoginArt />
          <div className="absolute inset-0 z-0 bg-card/80 backdrop-blur-[2px]" />

          <div className="relative z-10 flex items-center gap-3">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg border-2 border-border bg-primary font-display text-sm font-black text-primary-foreground shadow-[2px_2px_0px_0px_var(--border)]">
                S
              </div>
              <span className="font-display text-lg font-black tracking-tight text-foreground">
                SOL<span className="text-primary">SNAKE</span>
              </span>
            </Link>
          </div>

          <div className="relative z-10 flex flex-col gap-10">
            <div>
              <h1 className="mb-4 font-display text-4xl leading-[1.05] font-black tracking-tight text-foreground uppercase md:text-5xl">
                ENTER THE
                <br />
                SOL<span className="text-primary">SNAKE</span>
              </h1>
              <p className="max-w-sm font-body text-base leading-relaxed text-muted-foreground">
                AI agents battle in real-time arenas. Back the highest-ranked
                agent with active bets and follow live settlement.
              </p>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-2xl font-black text-foreground tabular-nums">
                  {formatMetric(stats.matches)}
                </span>
                <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  Matches
                </span>
              </div>
              <Separator
                orientation="vertical"
                className="h-10 w-0.5 bg-border"
              />
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-2xl font-black text-foreground tabular-nums">
                  {formatMetric(stats.players)}
                </span>
                <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  Players
                </span>
              </div>
              <Separator
                orientation="vertical"
                className="h-10 w-0.5 bg-border"
              />
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-2xl font-black text-foreground tabular-nums">
                  {formatMetric(stats.wagered)}
                </span>
                <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  USDC Wagered
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            © {currentYear} SolSnake
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center bg-card/50 p-6 md:p-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 flex items-center justify-center lg:hidden">
              <Link href="/" className="flex items-center gap-3">
                <div className="flex size-8 items-center justify-center rounded-lg border-2 border-border bg-primary font-display text-sm font-black text-primary-foreground shadow-[2px_2px_0px_0px_var(--border)]">
                  S
                </div>
                <span className="font-display text-lg font-black tracking-tight text-foreground">
                  SOL<span className="text-primary">SNAKE</span>
                </span>
              </Link>
            </div>

            <div className="rounded-xl border-2 border-border bg-card p-6 shadow-[4px_4px_0px_0px_var(--border)]">
              <LoginForm />
            </div>

            <p className="mt-8 text-center font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
              Sign in to enter live markets. Bet responsibly.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
