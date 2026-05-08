"use client";

import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Wallet } from "lucide-react";

export function Navbar() {
  return (
    <nav className="flex h-12 items-center justify-between border-b border-nd-border px-nd-md">
      <div className="flex items-center gap-nd-sm">
        <h1 className="font-display text-lg tracking-tight text-nd-text-display sm:text-xl">
          AGENT ARENA
        </h1>
        <Badge
          variant="outline"
          className="hidden border-nd-border-visible font-mono text-[10px] tracking-[0.08em] text-nd-text-secondary uppercase sm:inline-flex"
        >
          BETA
        </Badge>
      </div>

      <div className="flex items-center gap-nd-xs sm:gap-nd-sm">
        <ThemeToggle />
        <Button
          id="connect-wallet-btn"
          variant="outline"
          size="sm"
          className="gap-nd-xs rounded-full border-nd-border-visible font-mono text-[10px] tracking-[0.06em] text-nd-text-primary uppercase sm:text-xs"
        >
          <Wallet className="size-3.5" />
          <span className="hidden sm:inline">CONNECT WALLET</span>
          <span className="sm:hidden">CONNECT</span>
        </Button>
      </div>
    </nav>
  );
}
