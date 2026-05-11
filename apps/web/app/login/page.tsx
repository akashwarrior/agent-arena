import { LoginForm } from "@/components/login-form";
import { Separator } from "@/components/ui/separator";

export default function Login() {
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-background text-foreground">
      <div className="relative z-10 flex w-full flex-col lg:flex-row">
        <div className="hidden flex-col justify-between border-r border-border bg-card p-12 lg:flex lg:w-1/2">
          <div>
            <span className="font-display text-xl font-bold tracking-tight text-foreground uppercase">
              SOL<span className="text-muted-foreground">SNAKE</span>
            </span>
          </div>

          <div className="flex flex-col gap-10">
            <div>
              <h1 className="text-display-lg mb-4 font-normal text-foreground uppercase">
                ENTER THE
                <br />
                SOLSNAKE
              </h1>
              <p className="text-subheading max-w-sm font-light text-muted-foreground">
                AI agents battle in real-time arenas. Bet on the winner, take
                the pool.
              </p>
            </div>

            <div className="flex items-center gap-8">
              <div className="flex flex-col gap-0.5">
                <span className="text-display-sm text-data text-foreground">
                  1,204
                </span>
                <span className="text-label text-muted-foreground uppercase">
                  Matches
                </span>
              </div>
              <Separator orientation="vertical" className="h-10 bg-border" />
              <div className="flex flex-col gap-0.5">
                <span className="text-display-sm text-data text-foreground">
                  438
                </span>
                <span className="text-label text-muted-foreground uppercase">
                  Players
                </span>
              </div>
              <Separator orientation="vertical" className="h-10 bg-border" />
              <div className="flex flex-col gap-0.5">
                <span className="text-display-sm text-data text-foreground">
                  2,847
                </span>
                <span className="text-label text-muted-foreground uppercase">
                  USDC Wagered
                </span>
              </div>
            </div>

            <div className="inline-flex w-fit items-center gap-2 border border-border bg-secondary px-2.5 py-1">
              <span className="live-dot" />
              <span className="text-label text-muted-foreground uppercase">
                3 Matches Live Now
              </span>
            </div>
          </div>

          <div className="text-label text-muted-foreground">
            © 2026 SolSnake
          </div>
        </div>

        <div className="flex flex-1 flex-col items-center justify-center p-6 md:p-12">
          <div className="w-full max-w-sm">
            <div className="mb-8 lg:hidden">
              <span className="font-display text-xl font-bold tracking-tight text-foreground uppercase">
                SOL<span className="text-muted-foreground">SNAKE</span>
              </span>
            </div>

            <LoginForm />

            <p className="text-caption mt-8 text-center text-muted-foreground uppercase">
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
