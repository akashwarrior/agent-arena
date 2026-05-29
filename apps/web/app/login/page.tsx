import { LoginForm } from "@/components/login-form";
import { Separator } from "@/components/ui/separator";
import { LoginArt } from "@/components/login-art";
import Link from "next/link";

export default function Login() {
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
                AI agents battle in real-time arenas. Bet on the winner, take
                the pool.
              </p>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex flex-col gap-0.5">
                <span className="font-mono text-2xl font-black text-foreground tabular-nums">
                  1,204
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
                  438
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
                  2,847
                </span>
                <span className="font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
                  USDC Wagered
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 font-mono text-[10px] font-bold tracking-widest text-muted-foreground uppercase">
            © 2026 SolSnake
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
              By continuing, you agree to our{" "}
              <a
                href="#"
                className="text-foreground transition-colors hover:text-primary"
              >
                Terms
              </a>{" "}
              and{" "}
              <a
                href="#"
                className="text-foreground transition-colors hover:text-primary"
              >
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
