"use client"
import React, { useState, useEffect } from "react"
import { useTheme } from "next-themes"

const AGENTS_IN_ROOM = ["ChatGPT", "Claude", "Gemini", "DeepSeek"]

const HALL_OF_FAME = [
  { rank: 1, name: "ChipX", wins: 3, total: 5, pct: "60.0" },
  { rank: 2, name: "Caramelo", wins: 3, total: 10, pct: "30.0" },
  { rank: 3, name: "SerpentSage", wins: 14, total: 40, pct: "35.0" },
  { rank: 4, name: "Shawn", wins: 13, total: 33, pct: "39.4" },
  { rank: 5, name: "PixelateDust", wins: 1, total: 23, pct: "30.4" },
]

const COMMON_WALLET = "allbet_treasury_0x7F3a...9Bc2"

export default function RightSidebar() {
  const { resolvedTheme, setTheme } = useTheme()
  const isDark = resolvedTheme === "dark"
  const [walletOpen, setWalletOpen] = useState(false)
  const [sendAmount, setSendAmount] = useState("")
  const [sent, setSent] = useState(false)

  // Listen for wallet open events from LeftSidebar
  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail?.open) setWalletOpen(true)
    }
    window.addEventListener("allbet-wallet", handler)
    return () => window.removeEventListener("allbet-wallet", handler)
  }, [])

  const handleSend = () => {
    if (!sendAmount || parseFloat(sendAmount) <= 0) return
    setSent(true)
    setTimeout(() => { setSent(false); setSendAmount(""); setWalletOpen(false) }, 2000)
  }

  return (
    <aside className="relative flex h-full w-[360px] flex-shrink-0 flex-col overflow-hidden transition-colors duration-300"
      style={{ background: "var(--ab-bg)", borderLeft: "2px solid var(--ab-sidebar-border)" }}>

      {/* Header: Status + Dark Mode */}
      <div className="flex items-center justify-between px-6 pt-7 pb-4">
        <div>
          <span className="ab-mono text-xs uppercase tracking-[0.2em]" style={{ color: "var(--ab-text-muted)" }}>Status</span>
          <span className="ab-mono ml-3 text-xs font-bold uppercase" style={{ color: "var(--ab-green)" }}>● Active</span>
        </div>
        <button onClick={() => setTheme(isDark ? "light" : "dark")}
          className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl transition-all hover:scale-110"
          style={{ background: "var(--ab-btn-subtle-bg)", border: "1.5px solid var(--ab-card-border)" }}
          title={isDark ? "Light mode" : "Dark mode"}>
          {isDark ? (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ab-orange)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ab-purple)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          )}
        </button>
      </div>

      <div className="mx-6 h-px" style={{ background: "var(--ab-divider)" }} />

      {/* Agents in room */}
      <div className="px-6 py-5">
        <span className="ab-mono mb-3 block text-xs font-bold uppercase tracking-[0.15em]" style={{ color: "var(--ab-text-dim)" }}>Agents</span>
        <div className="flex flex-col gap-2">
          {AGENTS_IN_ROOM.map((agent, i) => (
            <div key={agent} className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: "var(--ab-green-fill)", border: "1px solid var(--ab-card-border)", animation: `ab-fade-in 0.2s ${i * 0.05}s both` }}>
              <div className="h-2 w-2 rounded-full" style={{ background: "var(--ab-green)", animation: "ab-dot-blink 2s ease-in-out infinite" }} />
              <span className="ab-mono text-sm font-bold" style={{ color: "var(--ab-text)" }}>{agent}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-6 h-px" style={{ background: "var(--ab-divider)" }} />

      {/* Wallet Panel (shown when BET is clicked) */}
      {walletOpen && (
        <div className="px-6 py-5" style={{ animation: "ab-fade-in 0.2s ease both" }}>
          <div className="flex items-center justify-between mb-3">
            <span className="ab-mono text-xs font-bold uppercase tracking-[0.15em]" style={{ color: "var(--ab-text-dim)" }}>Wallet</span>
            <button className="ab-mono cursor-pointer text-xs uppercase" style={{ color: "var(--ab-text-muted)" }}
              onClick={() => setWalletOpen(false)}>✕</button>
          </div>
          <div className="rounded-2xl p-4 mb-3" style={{ background: "var(--ab-card-bg)", border: "1px solid var(--ab-card-border)" }}>
            <span className="ab-mono block text-[10px] uppercase tracking-wider" style={{ color: "var(--ab-text-muted)" }}>Your Balance</span>
            <span className="ab-heading block text-2xl mt-1" style={{ color: "var(--ab-text)" }}>$247.50</span>
          </div>
          <div className="rounded-2xl p-4 mb-3" style={{ background: "var(--ab-orange-fill)", border: "2px solid var(--ab-orange)" }}>
            <span className="ab-mono block text-[10px] uppercase tracking-wider mb-2" style={{ color: "var(--ab-text-muted)" }}>Send to ALLBET Pool</span>
            <span className="ab-mono block text-[9px] truncate mb-3" style={{ color: "var(--ab-text-dim)" }}>{COMMON_WALLET}</span>
            <div className="flex gap-2.5">
              <input type="number" placeholder="$0.00"
                className="ab-mono flex-1 rounded-xl px-3 py-2 text-xs"
                style={{ background: "var(--ab-bg)", border: "1.5px solid var(--ab-card-border)", color: "var(--ab-text)", outline: "none" }}
                value={sendAmount} onChange={e => setSendAmount(e.target.value)}
              />
              <button className="ab-mono cursor-pointer rounded-xl px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all hover:scale-105"
                style={{ background: sent ? "var(--ab-green)" : "var(--ab-orange)", color: "#fff" }}
                onClick={handleSend}>
                {sent ? "Sent ✓" : "Send"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hall of Fame */}
      <div className="flex-1 overflow-y-auto px-6 py-5">
        <span className="ab-mono mb-3 block text-xs font-bold uppercase tracking-[0.15em]" style={{ color: "var(--ab-text-dim)" }}>Hall of Fame</span>
        <div className="flex flex-col gap-2">
          {HALL_OF_FAME.map((p, i) => (
            <div key={p.rank} className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: i === 0 ? "var(--ab-orange-fill)" : "var(--ab-card-bg)",
                border: `1px solid ${i === 0 ? "var(--ab-orange)" : "var(--ab-card-border)"}`,
                animation: `ab-fade-in 0.2s ${i * 0.05}s both` }}>
              <span className="ab-mono w-6 text-xs font-bold" style={{ color: i === 0 ? "var(--ab-orange)" : "var(--ab-text-muted)" }}>{p.rank}</span>
              <span className="ab-mono flex-1 truncate text-xs font-bold" style={{ color: "var(--ab-text)" }}>{p.name}</span>
              <span className="ab-mono text-xs" style={{ color: "var(--ab-text-muted)" }}>{p.wins}/{p.total}</span>
              <span className="ab-mono text-xs font-bold" style={{ color: parseFloat(p.pct) >= 50 ? "var(--ab-green)" : "var(--ab-text-muted)" }}>{p.pct}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="px-6 py-4" style={{ borderTop: "1px solid var(--ab-divider)" }}>
        <div className="flex items-center justify-between">
          <span className="ab-mono text-[10px] uppercase" style={{ color: "var(--ab-text-muted)" }}>● connected</span>
          <span className="ab-mono text-[10px]" style={{ color: "var(--ab-text-muted)" }}>v0.1.0</span>
        </div>
      </div>
    </aside>
  )
}
