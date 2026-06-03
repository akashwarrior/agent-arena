import { WalletButton } from "@/components/wallet-button";
import { ThemeToggle } from "@/components/theme-toggle";
import { LiveTicker } from "@/components/live-ticker";
import { redirect } from "next/navigation";
import { Provider } from "jotai";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import Link from "next/link";
import { prisma } from "@repo/db";
import {
  liveBetActivitySelect,
  normalizeLiveBetActivity,
} from "@/lib/api-types";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const bets = await prisma.bet.findMany({
    orderBy: {
      placedAt: "desc",
    },
    take: 12,
    select: liveBetActivitySelect,
  });

  return (
    <Provider>
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-background text-foreground">
        <div className="bg-grid pointer-events-none absolute inset-0" />

        <nav className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b-2 border-border bg-card px-6">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              prefetch={false}
              className="group flex items-center gap-2 transition-opacity hover:opacity-80"
            >
              <div className="flex size-8 items-center justify-center rounded-lg border-2 border-border bg-primary font-display text-sm font-black text-primary-foreground shadow-[2px_2px_0px_0px_var(--border)]">
                S
              </div>
              <span className="font-display text-lg font-black tracking-tight text-foreground">
                SOL<span className="text-primary">SNAKE</span>
              </span>
            </Link>

            <div className="hidden h-5 w-0.5 bg-border md:block" />

            <div className="hidden items-center gap-1.5 md:flex">
              <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                Devnet
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <WalletButton />
          </div>
        </nav>

        <LiveTicker bets={bets.map(normalizeLiveBetActivity)} />

        <div className="relative flex flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </div>
    </Provider>
  );
}
