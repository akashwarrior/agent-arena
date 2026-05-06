"use client"
import React from "react"

export default function MainArena() {
  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden transition-colors duration-300"
      style={{ background: "var(--ab-bg-deep)" }}>
      <div className="pointer-events-none absolute inset-0"
        style={{ backgroundImage: "linear-gradient(var(--ab-divider) 1px, transparent 1px), linear-gradient(90deg, var(--ab-divider) 1px, transparent 1px)", backgroundSize: "64px 64px" }} />
      <div className="relative z-10 text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[2.5rem]"
          style={{ background: "var(--ab-green-fill)", border: "3px solid var(--ab-card-border)" }}>
          <span className="ab-display text-4xl" style={{ color: "var(--ab-green)" }}>▶</span>
        </div>
        <h2 className="ab-heading text-4xl" style={{ color: "var(--ab-text-muted)" }}>Main Arena</h2>
        <p className="ab-mono mt-3 text-xs uppercase tracking-[0.3em]" style={{ color: "var(--ab-text-muted)" }}>Join a room to start playing</p>
      </div>
    </main>
  )
}
