"use client"
import React, { useState } from "react"

const ROOMS = [
  { id: "r1", name: "Alpha Arena", time: "04:32", players: 8, max: 10 },
  { id: "r2", name: "Beta Blitz", time: "02:15", players: 4, max: 8 },
  { id: "r3", name: "Gamma Grid", time: "06:47", players: 6, max: 6 },
  { id: "r4", name: "Delta Dome", time: "01:20", players: 2, max: 10 },
  { id: "r5", name: "Sigma Storm", time: "03:58", players: 5, max: 8 },
]

const AGENTS = [
  { id: "a1", name: "ChatGPT", currentBet: 1 },
  { id: "a2", name: "Claude", currentBet: 0 },
  { id: "a3", name: "Gemini", currentBet: 2 },
  { id: "a4", name: "DeepSeek", currentBet: 0 },
]

const MY_BETS = [
  { room: "Alpha Arena", agent: "ChatGPT", amount: 5, status: "active" },
  { room: "Beta Blitz", agent: "Gemini", amount: 3, status: "won" },
  { room: "Gamma Grid", agent: "Claude", amount: 2, status: "lost" },
]

/* Join Room popup when clicking PLAY on a room */
function JoinModal({ room, onClose }: { room: typeof ROOMS[0]; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 backdrop-blur-md" style={{ background: "var(--ab-backdrop)" }} />
      <div className="relative z-10 w-[420px] rounded-3xl p-8" onClick={e => e.stopPropagation()}
        style={{ background: "var(--ab-modal-bg)", border: "3px solid var(--ab-green)", animation: "ab-slide-up 0.3s ease forwards" }}>
        <h2 className="ab-heading text-center text-3xl" style={{ color: "var(--ab-text)" }}>{room.name}</h2>
        <div className="mx-auto mt-6 flex items-center justify-center gap-8 rounded-2xl p-6"
          style={{ background: "var(--ab-green-fill)", border: "1px solid var(--ab-card-border)" }}>
          <div className="text-center">
            <span className="ab-heading block text-4xl" style={{ color: "var(--ab-text)" }}>{room.players}/{room.max}</span>
            <span className="ab-mono text-[11px] uppercase tracking-wider" style={{ color: "var(--ab-text-muted)" }}>players</span>
          </div>
        </div>
        <button className="ab-mono mt-7 w-full cursor-pointer rounded-2xl py-4 text-base font-bold uppercase tracking-widest transition-all hover:scale-[1.02]"
          style={{ background: "var(--ab-green)", color: "#fff" }} onClick={onClose}>
          Play
        </button>
        <button className="ab-mono mt-3 w-full cursor-pointer rounded-2xl py-3 text-xs uppercase tracking-widest"
          style={{ background: "transparent", color: "var(--ab-text-muted)", border: "1px solid var(--ab-card-border)" }} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}

/* PLAY tab: room list */
function PlayList({ onJoin }: { onJoin: (r: typeof ROOMS[0]) => void }) {
  return (
    <div className="flex flex-col gap-2.5 px-4 py-4">
      {ROOMS.map((r, i) => (
        <div key={r.id} className="flex items-center justify-between rounded-xl px-4 py-4"
          style={{ background: "var(--ab-green-fill)", border: "1px solid var(--ab-card-border)", animation: `ab-fade-in 0.2s ${i * 0.05}s both` }}>
          <div>
            <span className="ab-mono block text-[13px] font-bold" style={{ color: "var(--ab-text)" }}>{r.name}</span>
            <span className="ab-mono text-[10px]" style={{ color: "var(--ab-text-muted)" }}>Time rem : {r.time}</span>
          </div>
          <button className="ab-mono cursor-pointer rounded-xl px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all hover:scale-105"
            style={{ background: "var(--ab-green)", color: "#fff" }}
            onClick={() => onJoin(r)}>
            Join
          </button>
        </div>
      ))}
    </div>
  )
}

/* BETS tab content */
function BetsContent({ onOpenWallet }: { onOpenWallet: () => void }) {
  const [subTab, setSubTab] = useState<"place" | "my">("place")
  const [amounts, setAmounts] = useState<Record<string, string>>({})
  const totalPool = AGENTS.reduce((s, a) => s + a.currentBet, 0)

  return (
    <div className="flex flex-col px-4 py-4">
      {/* Sub-tabs */}
      <div className="flex gap-2 mb-4">
        <button className="ab-mono flex-1 cursor-pointer rounded-xl py-2 text-[10px] font-bold uppercase tracking-wider transition-all"
          style={{ background: subTab === "place" ? "var(--ab-green)" : "var(--ab-btn-subtle-bg)",
            color: subTab === "place" ? "#fff" : "var(--ab-text-dim)",
            border: `1.5px solid ${subTab === "place" ? "var(--ab-green)" : "var(--ab-card-border)"}` }}
          onClick={() => setSubTab("place")}>
          Place Bets
        </button>
        <button className="ab-mono flex-1 cursor-pointer rounded-xl py-2 text-[10px] font-bold uppercase tracking-wider transition-all"
          style={{ background: subTab === "my" ? "var(--ab-orange)" : "var(--ab-btn-subtle-bg)",
            color: subTab === "my" ? "#fff" : "var(--ab-text-dim)",
            border: `1.5px solid ${subTab === "my" ? "var(--ab-orange)" : "var(--ab-card-border)"}` }}
          onClick={() => setSubTab("my")}>
          My Bets
        </button>
      </div>

      {subTab === "place" ? (
        <>
          {/* Total Pool */}
          <div className="flex items-center justify-between rounded-xl px-4 py-3 mb-3"
            style={{ background: "var(--ab-orange-fill)", border: "2px solid var(--ab-orange)" }}>
            <span className="ab-mono text-xs font-bold uppercase tracking-wider" style={{ color: "var(--ab-text)" }}>Total Pool</span>
            <span className="ab-heading text-xl" style={{ color: "var(--ab-orange)" }}>${totalPool}</span>
          </div>
          <div className="h-2 w-full rounded-full mb-5" style={{ background: "var(--ab-card-border)" }}>
            <div className="h-full rounded-full" style={{ background: "var(--ab-blue)", width: `${Math.min(totalPool * 20, 100)}%` }} />
          </div>

          {/* Agent bet cards */}
          <div className="flex flex-col gap-3">
            {AGENTS.map((agent, i) => (
              <div key={agent.id} className="rounded-xl p-4"
                style={{ background: "var(--ab-card-bg)", border: "1px solid var(--ab-card-border)", animation: `ab-fade-in 0.2s ${i * 0.05}s both` }}>
                <div className="flex items-center justify-between mb-3">
                  <span className="ab-mono text-sm font-bold uppercase" style={{ color: "var(--ab-green)" }}>{agent.name}</span>
                  <span className="ab-heading text-lg" style={{ color: "var(--ab-text)" }}>${agent.currentBet}</span>
                </div>
                <div className="flex gap-2.5">
                  <input type="number" placeholder="amount"
                    className="ab-mono flex-1 rounded-xl px-3 py-2 text-xs"
                    style={{ background: "var(--ab-bg)", border: "1.5px solid var(--ab-card-border)", color: "var(--ab-text)", outline: "none" }}
                    value={amounts[agent.id] || ""}
                    onChange={e => setAmounts({ ...amounts, [agent.id]: e.target.value })}
                  />
                  <button className="ab-mono cursor-pointer rounded-xl px-6 py-2 text-xs font-bold uppercase tracking-wider transition-all hover:scale-105"
                    style={{ background: "var(--ab-blue)", color: "#fff" }}
                    onClick={onOpenWallet}>
                    Bet
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        /* My Bets list */
        <div className="flex flex-col gap-3">
          {MY_BETS.map((bet, i) => {
            const colors: Record<string, { bg: string; text: string }> = {
              active: { bg: "var(--ab-green-fill)", text: "var(--ab-green)" },
              won: { bg: "var(--ab-orange-fill)", text: "var(--ab-orange)" },
              lost: { bg: "var(--ab-red-dim)", text: "var(--ab-red)" },
            }
            const c = colors[bet.status] || colors.active
            return (
              <div key={i} className="flex items-center justify-between rounded-xl p-4"
                style={{ background: c.bg, border: "1px solid var(--ab-card-border)", animation: `ab-fade-in 0.2s ${i * 0.05}s both` }}>
                <div>
                  <span className="ab-mono block text-sm font-bold" style={{ color: "var(--ab-text)" }}>{bet.room}</span>
                  <span className="ab-mono text-xs" style={{ color: "var(--ab-text-muted)" }}>on {bet.agent}</span>
                </div>
                <div className="text-right">
                  <span className="ab-heading block text-lg" style={{ color: "var(--ab-text)" }}>${bet.amount}</span>
                  <span className="ab-mono text-[10px] font-bold uppercase" style={{ color: c.text }}>{bet.status}</span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function LeftSidebar() {
  const [tab, setTab] = useState<"play" | "bets">("play")
  const [joiningRoom, setJoiningRoom] = useState<typeof ROOMS[0] | null>(null)
  const [walletOpen, setWalletOpen] = useState(false)

  // Expose wallet state to parent via custom event
  const openWallet = () => {
    setWalletOpen(true)
    window.dispatchEvent(new CustomEvent("allbet-wallet", { detail: { open: true } }))
  }

  return (
    <>
      <aside className="relative flex h-full w-[400px] flex-shrink-0 flex-col overflow-hidden transition-colors duration-300"
        style={{ background: "var(--ab-bg)", borderRight: "2px solid var(--ab-sidebar-border)" }}>

        {/* Brand */}
        <div className="px-6 pt-7 pb-5">
          <h1 className="ab-display text-xl tracking-widest" style={{ color: "var(--ab-text)" }}>ALLBET</h1>
        </div>

        {/* PLAY & BETS tabs */}
        <div className="flex gap-2 px-5 mb-2">
          <button id="nav-play" className="ab-mono flex-1 cursor-pointer rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-all"
            style={{ background: tab === "play" ? "var(--ab-tab-active)" : "var(--ab-btn-subtle-bg)",
              color: tab === "play" ? "var(--ab-tab-active-text)" : "var(--ab-text-dim)",
              border: `2.5px solid ${tab === "play" ? "var(--ab-green)" : "var(--ab-card-border)"}` }}
            onClick={() => setTab("play")}>
            Play
          </button>
          <button id="nav-bets" className="ab-mono flex-1 cursor-pointer rounded-xl py-3 text-xs font-bold uppercase tracking-wider transition-all"
            style={{ background: tab === "bets" ? "var(--ab-tab-active)" : "var(--ab-btn-subtle-bg)",
              color: tab === "bets" ? "var(--ab-tab-active-text)" : "var(--ab-text-dim)",
              border: `2.5px solid ${tab === "bets" ? "var(--ab-green)" : "var(--ab-card-border)"}` }}
            onClick={() => setTab("bets")}>
            Bets
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-2">
          {tab === "play" && <PlayList onJoin={r => setJoiningRoom(r)} />}
          {tab === "bets" && <BetsContent onOpenWallet={openWallet} />}
        </div>
      </aside>

      {joiningRoom && <JoinModal room={joiningRoom} onClose={() => setJoiningRoom(null)} />}
    </>
  )
}
