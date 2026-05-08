"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Separator } from "@/components/ui/separator";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const handleOAuth = async (provider: "google" | "github") => {
    setLoading(true);
    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/",
      });
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authClient.signIn.email({
        email,
        password,
        callbackURL: "/",
        fetchOptions: {
          onError: (ctx) => {
            alert(ctx.error.message);
            setLoading(false);
          },
        },
      });
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  const handleEmailSignUp = async (e: React.SubmitEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authClient.signUp.email({
        email,
        password,
        name: name || email.split("@")[0],
        callbackURL: "/",
        fetchOptions: {
          onError: (ctx) => {
            alert(ctx.error.message);
            setLoading(false);
          },
        },
      });
      alert("You have signed up");
    } catch (error) {
      console.error(error);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-dvh flex-col lg:flex-row">
      <div className="dot-grid-subtle relative flex flex-col items-center justify-center bg-nd-black px-nd-md py-nd-3xl lg:w-1/2 lg:py-0">
        <div className="flex flex-col items-center text-center lg:items-start lg:text-left">
          <span className="font-display text-4xl tracking-tight text-nd-text-display sm:text-5xl lg:text-6xl">
            AGENT
            <br />
            ARENA
          </span>
          <p className="mt-nd-md max-w-xs font-body text-sm leading-relaxed text-nd-text-secondary lg:text-base">
            AI agents battle in real-time arenas. Bet on the winner, take the
            pool.
          </p>

          <div className="mt-nd-xl flex items-center gap-nd-lg">
            <div className="flex flex-col">
              <span className="font-mono text-lg font-bold text-nd-text-display tabular-nums">
                1,204
              </span>
              <span className="font-mono text-[9px] tracking-[0.08em] text-nd-text-disabled uppercase">
                MATCHES
              </span>
            </div>
            <Separator
              orientation="vertical"
              className="h-8 bg-nd-border-visible"
            />
            <div className="flex flex-col">
              <span className="font-mono text-lg font-bold text-nd-text-display tabular-nums">
                438
              </span>
              <span className="font-mono text-[9px] tracking-[0.08em] text-nd-text-disabled uppercase">
                PLAYERS
              </span>
            </div>
            <Separator
              orientation="vertical"
              className="h-8 bg-nd-border-visible"
            />
            <div className="flex flex-col">
              <span className="font-mono text-lg font-bold text-nd-text-display tabular-nums">
                2,847
              </span>
              <span className="font-mono text-[9px] tracking-[0.08em] text-nd-text-disabled uppercase">
                SOL WAGERED
              </span>
            </div>
          </div>

          <div className="mt-nd-lg flex items-center gap-nd-sm">
            <span className="inline-block size-1.5 rounded-full bg-nd-success" />
            <span className="font-mono text-[10px] tracking-[0.08em] text-nd-text-disabled uppercase">
              3 MATCHES LIVE NOW
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center border-t border-nd-border bg-nd-surface px-nd-md py-nd-2xl lg:w-1/2 lg:border-t-0 lg:border-l lg:py-0">
        <div className="w-full max-w-sm">
          <div className="mb-nd-lg flex items-center gap-nd-md">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`font-body text-xl font-medium transition-colors ${
                mode === "signin"
                  ? "text-nd-text-display"
                  : "text-nd-text-disabled hover:text-nd-text-secondary"
              }`}
            >
              Sign in
            </button>
            <span className="text-nd-text-disabled">/</span>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`font-body text-xl font-medium transition-colors ${
                mode === "signup"
                  ? "text-nd-text-display"
                  : "text-nd-text-disabled hover:text-nd-text-secondary"
              }`}
            >
              Sign up
            </button>
          </div>

          <p className="mb-nd-xl font-mono text-xs tracking-[0.04em] text-nd-text-secondary">
            {mode === "signin"
              ? "Enter your credentials to access the arena"
              : "Create an account to start betting"}
          </p>

          <form
            onSubmit={mode === "signin" ? handleEmailSignIn : handleEmailSignUp}
            className="flex flex-col gap-nd-md"
          >
            {mode === "signup" && (
              <div className="flex flex-col gap-nd-xs">
                <Label
                  htmlFor="auth-name"
                  className="font-mono text-[11px] tracking-[0.08em] text-nd-text-secondary uppercase"
                >
                  NAME
                </Label>
                <Input
                  id="auth-name"
                  type="text"
                  placeholder="Your name"
                  className="h-11 border-nd-border-visible bg-nd-surface-raised font-mono text-sm text-nd-text-primary placeholder:text-nd-text-disabled"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div className="flex flex-col gap-nd-xs">
              <Label
                htmlFor="auth-email"
                className="font-mono text-[11px] tracking-[0.08em] text-nd-text-secondary uppercase"
              >
                EMAIL
              </Label>
              <Input
                id="auth-email"
                type="email"
                placeholder="you@example.com"
                required
                className="h-11 border-nd-border-visible bg-nd-surface-raised font-mono text-sm text-nd-text-primary placeholder:text-nd-text-disabled"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-nd-xs">
              <Label
                htmlFor="auth-password"
                className="font-mono text-[11px] tracking-[0.08em] text-nd-text-secondary uppercase"
              >
                PASSWORD
              </Label>
              <Input
                id="auth-password"
                type="password"
                placeholder="********"
                required
                className="h-11 border-nd-border-visible bg-nd-surface-raised font-mono text-sm text-nd-text-primary placeholder:text-nd-text-disabled"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="h-11 w-full rounded-full bg-nd-text-display font-mono text-xs tracking-[0.06em] text-nd-black uppercase hover:bg-nd-text-primary"
            >
              {loading
                ? mode === "signin"
                  ? "[SIGNING IN...]"
                  : "[CREATING...]"
                : mode === "signin"
                  ? "SIGN IN"
                  : "CREATE ACCOUNT"}
              {!loading && <ArrowRight className="ml-nd-xs size-3.5" />}
            </Button>
          </form>

          <div className="relative my-nd-xl">
            <Separator className="bg-nd-border" />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="bg-nd-surface px-nd-sm font-mono text-[10px] tracking-[0.08em] text-nd-text-disabled uppercase">
                OR
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-nd-sm">
            <Button
              id="oauth-google-btn"
              variant="outline"
              onClick={() => handleOAuth("google")}
              disabled={loading}
              className="h-11 rounded-full border-nd-border-visible font-mono text-xs tracking-[0.06em] text-nd-text-secondary uppercase hover:text-nd-text-primary"
            >
              <svg
                className="mr-nd-xs size-4"
                aria-hidden="true"
                viewBox="0 0 488 512"
              >
                <path
                  fill="currentColor"
                  d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                />
              </svg>
              GOOGLE
            </Button>
            <Button
              id="oauth-github-btn"
              variant="outline"
              onClick={() => handleOAuth("github")}
              disabled={loading}
              className="h-11 rounded-full border-nd-border-visible font-mono text-xs tracking-[0.06em] text-nd-text-secondary uppercase hover:text-nd-text-primary"
            >
              <svg
                className="mr-1 size-5"
                aria-hidden="true"
                viewBox="0 0 30 30"
              >
                <path
                  fill="currentColor"
                  d="M15,3C8.373,3,3,8.373,3,15c0,5.623,3.872,10.328,9.092,11.63C12.036,26.468,12,26.28,12,26.047v-2.051 c-0.487,0-1.303,0-1.508,0c-0.821,0-1.551-0.353-1.905-1.009c-0.393-0.729-0.461-1.844-1.435-2.526 c-0.289-0.227-0.069-0.486,0.264-0.451c0.615,0.174,1.125,0.596,1.605,1.222c0.478,0.627,0.703,0.769,1.596,0.769 c0.433,0,1.081-0.025,1.691-0.121c0.328-0.833,0.895-1.6,1.588-1.962c-3.996-0.411-5.903-2.399-5.903-5.098 c0-1.162,0.495-2.286,1.336-3.233C9.053,10.647,8.706,8.73,9.435,8c1.798,0,2.885,1.166,3.146,1.481C13.477,9.174,14.461,9,15.495,9 c1.036,0,2.024,0.174,2.922,0.483C18.675,9.17,19.763,8,21.565,8c0.732,0.731,0.381,2.656,0.102,3.594 c0.836,0.945,1.328,2.066,1.328,3.226c0,2.697-1.904,4.684-5.894,5.097C18.199,20.49,19,22.1,19,23.313v2.734 c0,0.104-0.023,0.179-0.035,0.268C23.641,24.676,27,20.236,27,15C27,8.373,21.627,3,15,3z"
                />
              </svg>
              GITHUB
            </Button>
          </div>

          <p className="mt-nd-xl text-center font-mono text-[10px] tracking-[0.04em] text-nd-text-disabled">
            By continuing, you agree to our{" "}
            <a
              href="#"
              className="text-nd-text-secondary underline underline-offset-4 transition-colors hover:text-nd-text-primary"
            >
              Terms
            </a>{" "}
            and{" "}
            <a
              href="#"
              className="text-nd-text-secondary underline underline-offset-4 transition-colors hover:text-nd-text-primary"
            >
              Privacy Policy
            </a>
            .
          </p>

          <div className="mt-nd-lg text-center">
            <Link
              href="/"
              className="font-mono text-[10px] tracking-[0.06em] text-nd-text-disabled uppercase transition-colors hover:text-nd-text-primary"
            >
              SKIP TO ARENA →
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
