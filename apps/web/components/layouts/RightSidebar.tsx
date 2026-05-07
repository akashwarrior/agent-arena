import { ThemeToggle } from "../theme-toggle";

const AGENTS_IN_ROOM = ["ChatGPT", "Claude", "Gemini", "DeepSeek"];

const HALL_OF_FAME = [
  { rank: 1, name: "ChipX", wins: 3, total: 5, pct: "60.0" },
  { rank: 2, name: "Caramelo", wins: 3, total: 10, pct: "30.0" },
  { rank: 3, name: "SerpentSage", wins: 14, total: 40, pct: "35.0" },
  { rank: 4, name: "Shawn", wins: 13, total: 33, pct: "39.4" },
  { rank: 5, name: "PixelateDust", wins: 1, total: 23, pct: "30.4" },
];

export function RightSidebar() {
  return (
    <aside
      className="relative flex h-full w-[360px] flex-col overflow-hidden transition-colors duration-300"
      style={{
        background: "var(--ab-bg)",
        borderLeft: "2px solid var(--ab-sidebar-border)",
      }}
    >
      <div className="flex items-center justify-between px-6 pt-7 pb-4">
        <div>
          <span
            className="ab-mono text-xs tracking-[0.2em] uppercase"
            style={{ color: "var(--ab-text-muted)" }}
          >
            Status
          </span>
          <span
            className="ab-mono ml-3 text-xs font-bold uppercase"
            style={{ color: "var(--ab-green)" }}
          >
            ● Active
          </span>
        </div>

        <ThemeToggle />
      </div>

      <div className="mx-6 h-px" style={{ background: "var(--ab-divider)" }} />

      <div className="px-6 py-5">
        <span
          className="ab-mono mb-3 block text-xs font-bold tracking-[0.15em] uppercase"
          style={{ color: "var(--ab-text-dim)" }}
        >
          Agents
        </span>
        <div className="flex flex-col gap-2">
          {AGENTS_IN_ROOM.map((agent, i) => (
            <div
              key={agent}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: "var(--ab-green-fill)",
                border: "1px solid var(--ab-card-border)",
                animation: `ab-fade-in 0.2s ${i * 0.05}s both`,
              }}
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{
                  background: "var(--ab-green)",
                  animation: "ab-dot-blink 2s ease-in-out infinite",
                }}
              />
              <span
                className="ab-mono text-sm font-bold"
                style={{ color: "var(--ab-text)" }}
              >
                {agent}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mx-6 h-px" style={{ background: "var(--ab-divider)" }} />

      <div className="flex-1 overflow-y-auto px-6 py-5">
        <span
          className="ab-mono mb-3 block text-xs font-bold tracking-[0.15em] uppercase"
          style={{ color: "var(--ab-text-dim)" }}
        >
          Hall of Fame
        </span>
        <div className="flex flex-col gap-2">
          {HALL_OF_FAME.map((p, i) => (
            <div
              key={p.rank}
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background:
                  i === 0 ? "var(--ab-orange-fill)" : "var(--ab-card-bg)",
                border: `1px solid ${i === 0 ? "var(--ab-orange)" : "var(--ab-card-border)"}`,
                animation: `ab-fade-in 0.2s ${i * 0.05}s both`,
              }}
            >
              <span
                className="ab-mono w-6 text-xs font-bold"
                style={{
                  color: i === 0 ? "var(--ab-orange)" : "var(--ab-text-muted)",
                }}
              >
                {p.rank}
              </span>
              <span
                className="ab-mono flex-1 truncate text-xs font-bold"
                style={{ color: "var(--ab-text)" }}
              >
                {p.name}
              </span>
              <span
                className="ab-mono text-xs"
                style={{ color: "var(--ab-text-muted)" }}
              >
                {p.wins}/{p.total}
              </span>
              <span
                className="ab-mono text-xs font-bold"
                style={{
                  color:
                    parseFloat(p.pct) >= 50
                      ? "var(--ab-green)"
                      : "var(--ab-text-muted)",
                }}
              >
                {p.pct}%
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="px-6 py-4"
        style={{ borderTop: "1px solid var(--ab-divider)" }}
      >
        <div className="flex items-center justify-between">
          <span
            className="ab-mono text-[10px] uppercase"
            style={{ color: "var(--ab-text-muted)" }}
          >
            ● connected
          </span>
          <span
            className="ab-mono text-[10px]"
            style={{ color: "var(--ab-text-muted)" }}
          >
            v0.1.0
          </span>
        </div>
      </div>
    </aside>
  );
}
