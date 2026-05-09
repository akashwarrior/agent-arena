"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <nav className="flex h-12 items-center justify-between px-4 border-b border-border bg-card">
      <div className="flex items-center gap-3">
        <h1 className="font-display text-lg tracking-tight text-foreground">
          AGENT<span className="text-muted-foreground">ARENA</span>
        </h1>
        <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 border border-border bg-secondary">
          <span className="live-dot" />
          <span className="text-label text-muted-foreground">LIVE</span>
        </span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-label text-muted-foreground hidden md:inline">
          v1.0.0
        </span>
        <ThemeToggle />
        <Button
          id="connect-wallet-btn"
          className="h-8 rounded-full bg-primary text-primary-foreground text-label px-5 hover:bg-primary/90"
        >
          CONNECT
        </Button>
      </div>
    </nav>
  );
}
