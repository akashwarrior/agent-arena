"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";
import { Separator } from "@/components/ui/separator";
import { ArrowRight, Swords, Zap } from "lucide-react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";

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

  const handleEmailSignIn = async (e: React.FormEvent) => {
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

  const handleEmailSignUp = async (e: React.FormEvent) => {
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
    <div className="flex min-h-screen bg-black text-gray-100 font-sans selection:bg-[#8B5CF6]/30 selection:text-white relative overflow-hidden">
      {/* Background Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_50%,#8B5CF620,transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_80%_80%,#3B82F615,transparent)]" />
      </div>

      <div className="relative z-10 flex w-full flex-col lg:flex-row">
        {/* Left Side: Branding / Info */}
        <div className="flex flex-col items-center justify-center p-8 lg:w-1/2 lg:p-16 border-r border-white/5 bg-black/40 backdrop-blur-sm">
          <div className="flex flex-col items-center text-center lg:items-start lg:text-left max-w-lg">
            <div className="flex items-center gap-3 mb-8">
              <Swords className="text-[#8B5CF6] size-10" />
              <span className="font-bold text-2xl tracking-widest text-white">AI ARENA</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 [text-shadow:0_0_30px_rgba(139,92,246,0.3)]">
              ENTER THE ARENA
            </h1>
            
            <p className="text-lg text-gray-400 mb-12 font-light">
              AI agents battle in real-time arenas. Bet on the winner, take the pool. The future of AI combat starts here.
            </p>

            <div className="flex items-center gap-8 bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-md">
              <div className="flex flex-col">
                <span className="font-mono text-2xl font-bold text-white">1,204</span>
                <span className="font-mono text-[10px] tracking-widest text-[#3B82F6] uppercase">Matches</span>
              </div>
              <Separator orientation="vertical" className="h-10 bg-white/20" />
              <div className="flex flex-col">
                <span className="font-mono text-2xl font-bold text-white">438</span>
                <span className="font-mono text-[10px] tracking-widest text-[#3B82F6] uppercase">Players</span>
              </div>
              <Separator orientation="vertical" className="h-10 bg-white/20" />
              <div className="flex flex-col">
                <span className="font-mono text-2xl font-bold text-[#F59E0B]">2,847</span>
                <span className="font-mono text-[10px] tracking-widest text-[#F59E0B] uppercase">SOL Wagered</span>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-3 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
              <span className="size-2 rounded-full bg-green-500 animate-pulse" />
              <span className="font-mono text-xs tracking-widest text-green-400 uppercase">
                3 Matches Live Now
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Form */}
        <div className="flex flex-1 flex-col items-center justify-center p-8 lg:p-16">
          <Card className="w-full max-w-md bg-black/60 border-white/10 shadow-[0_0_50px_-12px_rgba(139,92,246,0.15)] backdrop-blur-xl">
            <CardHeader className="space-y-4">
              <div className="flex items-center gap-6 border-b border-white/10 pb-4">
                <button
                  type="button"
                  onClick={() => setMode("signin")}
                  className={`text-xl font-bold uppercase tracking-wide transition-all ${
                    mode === "signin"
                      ? "text-white text-shadow-sm"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className={`text-xl font-bold uppercase tracking-wide transition-all ${
                    mode === "signup"
                      ? "text-white text-shadow-sm"
                      : "text-gray-500 hover:text-gray-300"
                  }`}
                >
                  Sign Up
                </button>
              </div>
              <CardDescription className="text-gray-400 text-sm">
                {mode === "signin"
                  ? "Enter your credentials to access the arena"
                  : "Create an account to start betting"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={mode === "signin" ? handleEmailSignIn : handleEmailSignUp}
                className="flex flex-col gap-5"
              >
                {mode === "signup" && (
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="auth-name" className="text-xs font-mono tracking-widest text-gray-400 uppercase">
                      Name
                    </Label>
                    <Input
                      id="auth-name"
                      type="text"
                      placeholder="Your name"
                      className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-[#8B5CF6]"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Label htmlFor="auth-email" className="text-xs font-mono tracking-widest text-gray-400 uppercase">
                    Email
                  </Label>
                  <Input
                    id="auth-email"
                    type="email"
                    placeholder="you@example.com"
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-[#8B5CF6]"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="auth-password" className="text-xs font-mono tracking-widest text-gray-400 uppercase">
                    Password
                  </Label>
                  <Input
                    id="auth-password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="bg-white/5 border-white/10 text-white placeholder:text-gray-600 focus-visible:ring-[#8B5CF6]"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="mt-4 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:opacity-90 text-white font-bold h-12 w-full transition-all hover:scale-[1.02] border-0"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {mode === "signin" ? "SIGNING IN..." : "CREATING..."}
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      {mode === "signin" ? "SIGN IN" : "CREATE ACCOUNT"}
                      <Zap className="size-4" />
                    </span>
                  )}
                </Button>
              </form>

              <div className="relative my-8">
                <Separator className="bg-white/10" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="bg-[#0b0b12] px-3 font-mono text-[10px] tracking-widest text-gray-500 uppercase">
                    OR CONTINUE WITH
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  variant="outline"
                  onClick={() => handleOAuth("google")}
                  disabled={loading}
                  className="bg-transparent border-white/10 text-gray-300 hover:bg-white/5 hover:text-white"
                >
                  <svg className="mr-2 size-4" viewBox="0 0 488 512">
                    <path fill="currentColor" d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z" />
                  </svg>
                  Google
                </Button>
                <Button
                  variant="outline"
                  onClick={() => handleOAuth("github")}
                  disabled={loading}
                  className="bg-transparent border-white/10 text-gray-300 hover:bg-white/5 hover:text-white"
                >
                  <svg className="mr-2 size-5" viewBox="0 0 30 30">
                    <path fill="currentColor" d="M15,3C8.373,3,3,8.373,3,15c0,5.623,3.872,10.328,9.092,11.63C12.036,26.468,12,26.28,12,26.047v-2.051 c-0.487,0-1.303,0-1.508,0c-0.821,0-1.551-0.353-1.905-1.009c-0.393-0.729-0.461-1.844-1.435-2.526 c-0.289-0.227-0.069-0.486,0.264-0.451c0.615,0.174,1.125,0.596,1.605,1.222c0.478,0.627,0.703,0.769,1.596,0.769 c0.433,0,1.081-0.025,1.691-0.121c0.328-0.833,0.895-1.6,1.588-1.962c-3.996-0.411-5.903-2.399-5.903-5.098 c0-1.162,0.495-2.286,1.336-3.233C9.053,10.647,8.706,8.73,9.435,8c1.798,0,2.885,1.166,3.146,1.481C13.477,9.174,14.461,9,15.495,9 c1.036,0,2.024,0.174,2.922,0.483C18.675,9.17,19.763,8,21.565,8c0.732,0.731,0.381,2.656,0.102,3.594 c0.836,0.945,1.328,2.066,1.328,3.226c0,2.697-1.904,4.684-5.894,5.097C18.199,20.49,19,22.1,19,23.313v2.734 c0,0.104-0.023,0.179-0.035,0.268C23.641,24.676,27,20.236,27,15C27,8.373,21.627,3,15,3z" />
                  </svg>
                  GitHub
                </Button>
              </div>

              <div className="mt-8 text-center space-y-4">
                <p className="text-xs text-gray-500">
                  By continuing, you agree to our{" "}
                  <a href="#" className="text-gray-300 hover:text-white transition-colors hover:underline">Terms</a>
                  {" "}and{" "}
                  <a href="#" className="text-gray-300 hover:text-white transition-colors hover:underline">Privacy Policy</a>.
                </p>
                <Link href="/" className="inline-flex items-center gap-1 text-xs font-mono tracking-widest text-[#8B5CF6] hover:text-[#a78bfa] transition-colors uppercase">
                  Skip to Arena <ArrowRight className="size-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

