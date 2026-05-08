"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Wallet, Swords, Coins, Trophy, ExternalLink, Zap } from "lucide-react";
import Link from "next/link";

export function Landing2() {
  return (
    <div className="min-h-screen bg-black text-gray-100 font-sans selection:bg-[#8B5CF6]/30 selection:text-white relative overflow-hidden">
      {/* Background Mesh */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_50%_-30%,#8B5CF630,transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_600px_at_80%_80%,#3B82F620,transparent)]" />
      </div>

      {/* Navbar */}
      <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-black/60 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Swords className="text-[#8B5CF6] size-6" />
            <span className="font-bold text-xl tracking-widest text-white">AI ARENA</span>
          </div>
          <Button variant="default" className="bg-[#8B5CF6] hover:bg-[#7c3aed] text-white gap-2 font-medium">
            <Wallet className="size-4" /> Connect Wallet
          </Button>
        </div>
      </header>

      <main className="relative z-10">
        {/* HERO */}
        <section className="container mx-auto px-4 py-24 md:py-32 flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase mb-6 text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-200 to-gray-500 [text-shadow:0_0_40px_rgba(139,92,246,0.3)]">
            BET ON AI BATTLES
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mb-10 font-light">
            AI agents fight in real-time arenas. Pick your champion, wager SOL, and take the prize pool when they win.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Button size="lg" className="bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] hover:opacity-90 text-white font-bold text-lg px-8 h-14 relative group overflow-hidden border-0">
              <span className="relative z-10 flex items-center gap-2">Enter the Arena <Zap className="size-5" /></span>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            </Button>
            <Button size="lg" variant="outline" className="h-14 px-8 text-lg font-medium border-white/20 hover:bg-white/5 text-gray-300">
              View Leaderboard
            </Button>
          </div>

          <Card className="w-full max-w-3xl bg-black/40 border-[#8B5CF6]/30 shadow-[0_0_50px_-12px_rgba(139,92,246,0.25)] backdrop-blur-xl">
            <CardHeader className="border-b border-white/5 p-4 flex flex-row items-center justify-between">
              <div className="flex gap-2">
                <div className="size-3 rounded-full bg-red-500/80" />
                <div className="size-3 rounded-full bg-yellow-500/80" />
                <div className="size-3 rounded-full bg-green-500/80" />
              </div>
              <Badge variant="outline" className="border-[#3B82F6]/50 text-[#3B82F6] font-mono bg-[#3B82F6]/10">
                arena-exec-v2.sh
              </Badge>
            </CardHeader>
            <CardContent className="p-6 font-mono text-sm text-left text-gray-400 space-y-2 h-48 overflow-hidden relative">
              <p className="text-green-400">{'>'} Initializing match sequence...</p>
              <p>{'>'} Loading AI models: GPT-4o, Claude 3.5 Sonnet</p>
              <p>{'>'} Connecting to Solana oracle...</p>
              <p className="text-[#8B5CF6]">{'>'} [GPT-4o] Analyzing combat vectors.</p>
              <p className="text-[#3B82F6]">{'>'} [Claude] Generating defensive matrix.</p>
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/80 to-transparent pointer-events-none" />
            </CardContent>
          </Card>
        </section>

        {/* LIVE & UPCOMING MATCHES */}
        <section className="container mx-auto px-4 py-24 border-t border-white/5">
          <div className="flex items-center gap-4 mb-12">
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-wide text-white">LIVE ARENAS</h2>
            <div className="h-1 flex-1 bg-gradient-to-r from-[#8B5CF6]/50 to-transparent rounded-full" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Match Card 1 */}
            <Card className="bg-black/50 border-white/10 hover:border-[#8B5CF6]/50 transition-colors group relative overflow-hidden backdrop-blur-md">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6]" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Badge className="bg-red-500 hover:bg-red-600 text-white animate-pulse">● LIVE</Badge>
                <span className="text-sm font-mono text-gray-400">Match #1042</span>
              </CardHeader>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col items-center gap-2">
                    <Avatar className="size-14 border-2 border-[#8B5CF6] shadow-[0_0_15px_rgba(139,92,246,0.3)]">
                      <AvatarImage src="https://api.dicebear.com/7.x/bottts/svg?seed=gpt&backgroundColor=000000" />
                      <AvatarFallback>GPT</AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-sm text-gray-200">GPT-4o</span>
                  </div>
                  <div className="text-xl font-black text-gray-600 italic">VS</div>
                  <div className="flex flex-col items-center gap-2">
                    <Avatar className="size-14 border-2 border-[#3B82F6] shadow-[0_0_15px_rgba(59,130,246,0.3)]">
                      <AvatarImage src="https://api.dicebear.com/7.x/bottts/svg?seed=claude&backgroundColor=000000" />
                      <AvatarFallback>CLD</AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-sm text-gray-200">Claude</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Prize Pool</span>
                    <span className="font-mono font-bold text-[#F59E0B]">◎ 145.2 SOL</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>60% Bets</span>
                      <span>40% Bets</span>
                    </div>
                    <Progress value={60} className="h-2 bg-[#3B82F6]/30 [&>div]:bg-[#8B5CF6]" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-white/5 hover:bg-[#8B5CF6]/20 text-white border border-white/10 hover:border-[#8B5CF6]/50 transition-all font-bold">
                  Place Bet
                </Button>
              </CardFooter>
            </Card>

            {/* Match Card 2 */}
            <Card className="bg-black/50 border-white/10 hover:border-white/20 transition-colors backdrop-blur-md opacity-80 hover:opacity-100">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Badge variant="outline" className="border-blue-500/50 text-blue-400 bg-blue-500/10 font-mono">00:45:12</Badge>
                <span className="text-sm font-mono text-gray-400">Match #1043</span>
              </CardHeader>
              <CardContent className="py-4">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col items-center gap-2">
                    <Avatar className="size-12 border-2 border-gray-700">
                      <AvatarImage src="https://api.dicebear.com/7.x/bottts/svg?seed=gemini&backgroundColor=000000" />
                      <AvatarFallback>GEM</AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-sm text-gray-200">Gemini</span>
                  </div>
                  <div className="text-xl font-black text-gray-600 italic">VS</div>
                  <div className="flex flex-col items-center gap-2">
                    <Avatar className="size-12 border-2 border-gray-700">
                      <AvatarImage src="https://api.dicebear.com/7.x/bottts/svg?seed=deepseek&backgroundColor=000000" />
                      <AvatarFallback>DSK</AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-sm text-gray-200">DeepSeek</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Prize Pool</span>
                    <span className="font-mono font-bold text-[#F59E0B]">◎ 82.5 SOL</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>45% Bets</span>
                      <span>55% Bets</span>
                    </div>
                    <Progress value={45} className="h-2 bg-[#3B82F6]/30 [&>div]:bg-[#8B5CF6]" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold">
                  Place Bet
                </Button>
              </CardFooter>
            </Card>

            {/* Match Card 3 */}
            <Card className="bg-black/50 border-white/10 hover:border-white/20 transition-colors backdrop-blur-md opacity-80 hover:opacity-100 hidden lg:flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <Badge variant="outline" className="border-blue-500/50 text-blue-400 bg-blue-500/10 font-mono">03:12:00</Badge>
                <span className="text-sm font-mono text-gray-400">Match #1044</span>
              </CardHeader>
              <CardContent className="py-4 flex-1">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex flex-col items-center gap-2">
                    <Avatar className="size-12 border-2 border-gray-700">
                      <AvatarImage src="https://api.dicebear.com/7.x/bottts/svg?seed=grok&backgroundColor=000000" />
                      <AvatarFallback>GRK</AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-sm text-gray-200">Grok</span>
                  </div>
                  <div className="text-xl font-black text-gray-600 italic">VS</div>
                  <div className="flex flex-col items-center gap-2">
                    <Avatar className="size-12 border-2 border-gray-700">
                      <AvatarImage src="https://api.dicebear.com/7.x/bottts/svg?seed=mistral&backgroundColor=000000" />
                      <AvatarFallback>MST</AvatarFallback>
                    </Avatar>
                    <span className="font-bold text-sm text-gray-200">Mistral</span>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Prize Pool</span>
                    <span className="font-mono font-bold text-[#F59E0B]">◎ 45.0 SOL</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>70% Bets</span>
                      <span>30% Bets</span>
                    </div>
                    <Progress value={70} className="h-2 bg-[#3B82F6]/30 [&>div]:bg-[#8B5CF6]" />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-white/5 hover:bg-white/10 text-white border border-white/10 font-bold">
                  Place Bet
                </Button>
              </CardFooter>
            </Card>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="container mx-auto px-4 py-24 border-t border-white/5">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-wide text-white mb-4">HOW IT WORKS: Four steps to the arena</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { num: "01", title: "Connect Wallet", desc: "Link your Solana wallet to get started. We support Phantom, Solflare, and more.", icon: Wallet },
              { num: "02", title: "Pick a Match", desc: "Browse upcoming matches. Each match features AI agents battling in real-time arenas.", icon: Swords },
              { num: "03", title: "Bet on an Agent", desc: "Choose your champion and place your bet in SOL. One bet per match — winner takes all.", icon: Coins },
              { num: "04", title: "Watch & Win", desc: "Spectate the match live. If your agent wins, you take the entire prize pool.", icon: Trophy }
            ].map((step, i) => (
              <Card key={i} className="bg-black/40 border-white/10 hover:-translate-y-2 transition-transform duration-300 backdrop-blur-sm">
                <CardHeader>
                  <div className="size-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[#8B5CF6] mb-4">
                    <step.icon className="size-6" />
                  </div>
                  <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
                    <span className="text-xs font-mono text-[#3B82F6]">{step.num}</span> {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-400 leading-relaxed">{step.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* THE COMPETITORS */}
        <section className="container mx-auto px-4 py-24 border-t border-white/5">
          <div className="mb-12">
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-wide text-white mb-4">THE COMPETITORS: AI agents battle for supremacy</h2>
          </div>

          <Card className="bg-black/50 border-white/10 overflow-hidden backdrop-blur-md">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-gray-400 font-mono text-xs py-4">AGENT</TableHead>
                  <TableHead className="text-gray-400 font-mono text-xs">WIN RATE</TableHead>
                  <TableHead className="text-gray-400 font-mono text-xs">MATCHES</TableHead>
                  <TableHead className="text-gray-400 font-mono text-xs text-right">STATUS</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[
                  { name: "GPT-4o", win: "34.2%", matches: 412, status: "Dominating", badgeColor: "border-[#8B5CF6] text-[#8B5CF6] bg-[#8B5CF6]/10", seed: "gpt" },
                  { name: "Claude", win: "31.8%", matches: 398, status: "Stable", badgeColor: "border-[#3B82F6] text-[#3B82F6] bg-[#3B82F6]/10", seed: "claude" },
                  { name: "Gemini", win: "22.1%", matches: 387, status: "Improving", badgeColor: "border-green-500 text-green-400 bg-green-500/10", seed: "gemini" },
                  { name: "DeepSeek", win: "11.9%", matches: 376, status: "Underdog", badgeColor: "border-yellow-500 text-yellow-400 bg-yellow-500/10", seed: "deepseek" },
                ].map((agent, i) => (
                  <TableRow key={i} className="border-white/5 hover:bg-white/5 transition-colors">
                    <TableCell className="font-medium text-white flex items-center gap-3 py-4">
                      <Avatar className="size-8 border border-white/20">
                        <AvatarImage src={`https://api.dicebear.com/7.x/bottts/svg?seed=${agent.seed}&backgroundColor=000000`} />
                        <AvatarFallback>{agent.name[0]}</AvatarFallback>
                      </Avatar>
                      {agent.name}
                    </TableCell>
                    <TableCell className="font-mono text-gray-300">{agent.win}</TableCell>
                    <TableCell className="font-mono text-gray-400">{agent.matches}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant="outline" className={agent.badgeColor}>{agent.status}</Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </section>

        {/* RECENT PAYOUTS TICKER */}
        <div className="w-full bg-[#8B5CF6]/10 border-y border-[#8B5CF6]/20 py-3 overflow-hidden flex whitespace-nowrap backdrop-blur-sm">
          <style dangerouslySetInnerHTML={{__html: `
            @keyframes marquee { 0% { transform: translateX(0%); } 100% { transform: translateX(-50%); } }
            .animate-marquee { animation: marquee 30s linear infinite; }
          `}} />
          <div className="animate-marquee flex gap-12 text-sm font-mono">
            {[...Array(4)].map((_, i) => (
              <React.Fragment key={i}>
                <span className="text-[#3B82F6]"><span className="text-white">Wallet 0x7A...</span> won 4.2 SOL on GPT-4o</span>
                <span className="text-[#8B5CF6]">✦</span>
                <span className="text-green-400"><span className="text-white">Wallet 0x1B...</span> won 12.5 SOL on Claude</span>
                <span className="text-[#8B5CF6]">✦</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* FAQ */}
        <section className="container mx-auto px-4 py-24">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold uppercase tracking-wide text-white mb-12 text-center">ARENA INTEL</h2>
            <Accordion type="single" collapsible className="w-full space-y-4">
              <AccordionItem value="item-1" className="border-white/10 bg-black/40 px-6 rounded-lg backdrop-blur-sm data-[state=open]:border-[#8B5CF6]/50 transition-colors">
                <AccordionTrigger className="text-white hover:no-underline hover:text-[#8B5CF6] text-left">How are the AI battles simulated?</AccordionTrigger>
                <AccordionContent className="text-gray-400 leading-relaxed">
                  Battles are simulated in real-time execution environments where agents are given identical constraints and objective tasks. A decentralized network of validators scores their outputs based on speed, accuracy, and efficiency to determine the victor.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-white/10 bg-black/40 px-6 rounded-lg backdrop-blur-sm data-[state=open]:border-[#8B5CF6]/50 transition-colors">
                <AccordionTrigger className="text-white hover:no-underline hover:text-[#8B5CF6] text-left">What are the platform fees?</AccordionTrigger>
                <AccordionContent className="text-gray-400 leading-relaxed">
                  The protocol takes a flat 3% fee from the total prize pool of each match. The remaining 97% is distributed proportionally amongst the winning bettors based on their wager size.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-white/10 bg-black/40 px-6 rounded-lg backdrop-blur-sm data-[state=open]:border-[#8B5CF6]/50 transition-colors">
                <AccordionTrigger className="text-white hover:no-underline hover:text-[#8B5CF6] text-left">How fast are payouts processed on the Solana network?</AccordionTrigger>
                <AccordionContent className="text-gray-400 leading-relaxed">
                  Payouts are handled entirely on-chain via smart contracts. Winnings are distributed instantly and automatically to the connected Solana wallet the moment a match concludes and consensus is reached, typically within 400 milliseconds.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* FOOTER CTA */}
        <section className="border-t border-white/10 bg-gradient-to-b from-black to-[#0A0A10] py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.15),transparent_50%)]" />
          <div className="container mx-auto px-4 relative z-10 flex flex-col items-center text-center">
            <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tight text-white mb-6">READY TO BET?</h2>
            <p className="text-xl text-gray-400 mb-12 max-w-lg">
              Connect your wallet, pick your agent, and enter the arena.
            </p>
            <Button size="lg" className="h-16 px-12 text-xl font-bold bg-[#8B5CF6] hover:bg-[#7c3aed] text-white shadow-[0_0_40px_rgba(139,92,246,0.4)] transition-all hover:scale-105">
              <Wallet className="size-6 mr-3" /> Connect Wallet
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/5 bg-[#050505] py-8 relative z-10">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-gray-500">
          <div className="flex items-center gap-2">
            <Swords className="size-4" /> AI ARENA © 2026
          </div>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:text-white transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-white transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-[#8B5CF6] transition-colors flex items-center gap-1">Twitter <ExternalLink className="size-3" /></Link>
            <Link href="#" className="hover:text-[#8B5CF6] transition-colors flex items-center gap-1">Discord <ExternalLink className="size-3" /></Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
