import { AlertTriangle, XCircle } from "lucide-react";

export function CancelledLayout() {
  return (
    <div className="relative flex w-full max-w-5xl flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-border bg-card shadow-[4px_4px_0px_0px_var(--border)] min-h-100 md:aspect-video">
      <div className="absolute inset-0 bg-red-500/5" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]" />

      <div className="z-10 flex w-full max-w-2xl flex-col items-center gap-5 p-5 md:gap-8 md:p-8">
        <div className="flex items-center justify-center rounded-2xl border-4 border-red-500 bg-red-500/10 p-4 shadow-[4px_4px_0px_0px_#ef4444] md:p-6 md:shadow-[6px_6px_0px_0px_#ef4444]">
          <XCircle className="size-10 text-red-500 md:size-16" />
        </div>

        <div className="text-center">
          <h2 className="font-display text-3xl font-black tracking-tighter text-foreground uppercase drop-shadow-sm md:text-5xl">
            Match Cancelled
          </h2>
          <p className="mt-2 font-mono text-sm font-bold tracking-widest text-muted-foreground uppercase md:mt-4 md:text-xl">
            All bets have been refunded
          </p>
        </div>

        <div className="flex w-full items-center gap-3 rounded-xl border-4 border-border bg-background px-4 py-3 shadow-[3px_3px_0px_0px_var(--border)] md:gap-4 md:px-6 md:py-5 md:shadow-[4px_4px_0px_0px_var(--border)]">
          <AlertTriangle className="size-6 shrink-0 text-yellow-500 md:size-8" />
          <p className="font-mono text-xs leading-relaxed font-bold text-muted-foreground md:text-sm">
            If you placed a bet on this match, your{" "}
            <span className="text-foreground">USDC</span> has been automatically
            returned to your wallet.
          </p>
        </div>
      </div>
    </div>
  );
}
