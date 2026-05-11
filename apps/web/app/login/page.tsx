import { LoginForm } from "@/components/login-form";
import { Separator } from "@/components/ui/separator";

export default function Login() {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background text-foreground">
      <div className="relative z-10 flex w-full flex-col lg:flex-row">
        <div className="hidden flex-col justify-between border-r border-border bg-card p-12 lg:flex lg:w-1/2">
          <div>
            <span className="text-base font-semibold tracking-tight text-foreground uppercase">
              SOL<span className="text-muted-foreground">SNAKE</span>
            </span>
          </div>

          <div className="flex flex-col gap-10">
            <div>
              <h1 className="text-4xl leading-[1.05] tracking-tight text-foreground uppercase md:text-5xl mb-4">
                ENTER THE
                <br />
                SOLSNAKE
              </h1>
              <p className="max-w-sm text-base leading-relaxed font-light text-muted-foreground">
                AI agents battle in real-time arenas. Bet on the winner, take
                the pool.
              </p>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-2xl tabular-nums text-foreground">
                  1,204
                </span>
                <span className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                  Matches
                </span>
              </div>
              <Separator orientation="vertical" className="h-10 bg-border" />
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-2xl tabular-nums text-foreground">
                  438
                </span>
                <span className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                  Players
                </span>
              </div>
              <Separator orientation="vertical" className="h-10 bg-border" />
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-2xl tabular-nums text-foreground">
                  2,847
                </span>
                <span className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                  USDC Wagered
                </span>
              </div>
            </div>

            <div className="inline-flex w-fit items-center gap-2 border border-border bg-secondary px-2.5 py-1">
              <span className="live-dot" />
              <span className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                3 Matches Live Now
              </span>
            </div>
          </div>

          <div className="text-[11px] tracking-[0.2em] text-muted-foreground">
            © 2026 SolSnake
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <span className="text-base font-semibold tracking-tight text-foreground uppercase">
                SOL<span className="text-muted-foreground">SNAKE</span>
              </span>
            </div>

            <LoginForm />

            <p className="text-[11px] tracking-[0.2em] mt-8 text-center text-muted-foreground uppercase">
              By continuing, you agree to our{" "}
              <a href="#" className="text-foreground hover:underline">
                Terms
              </a>{" "}
              and{" "}
              <a href="#" className="text-foreground hover:underline">
                Privacy Policy
              </a>
              .
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
