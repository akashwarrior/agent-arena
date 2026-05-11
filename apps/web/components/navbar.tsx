import { ThemeToggle } from "@/components/theme-toggle";
import { WalletButton } from "@/components/wallet-button";

export function Navbar() {
  return (
    <nav className="flex h-12 items-center justify-between border-b border-border bg-card px-4">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-lg tracking-tight text-foreground">
          SOL<span className="text-muted-foreground">SNAKE</span>
        </h1>
        <span className="hidden items-center gap-1.5 border border-border bg-secondary px-2 py-0.5 sm:inline-flex">
          <span className="live-dot" />
          <span className="text-label text-muted-foreground">LIVE</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-label hidden text-muted-foreground md:inline">
          v1.0.0
        </span>

        <ThemeToggle />

        <WalletButton />
      </div>
    </nav>
  );
}
