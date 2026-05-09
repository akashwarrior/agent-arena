"use client";

import { useAtom, useAtomValue } from "jotai";
import { gameSnapshotAtom, spectatingAgentAtom } from "@/lib/store";

export function GameOverlay() {
  const snapshot = useAtomValue(gameSnapshotAtom)
  const [spectatingAgent, setSpectatingAgent] = useAtom(spectatingAgentAtom);
  const aliveAgents = snapshot?.snakes.filter((s) => s.alive);
  const currentSnake = snapshot?.snakes.find((s) => s.id === spectatingAgent);

  return (
    <>
      <div className="pointer-events-none absolute bottom-3 left-3 z-10">
        <div className="pointer-events-auto flex items-center gap-2 bg-card/95 border border-border px-2.5 py-1.5">
          <span className="text-label text-muted-foreground">SPECTATING</span>
          {currentSnake ? (
            <>
              <div className="size-1.5" style={{ backgroundColor: currentSnake.color }} />
              <span className="text-caption text-foreground uppercase">
                {currentSnake.name}
              </span>
              {spectatingAgent && (
                <button
                  type="button"
                  onClick={() => setSpectatingAgent(null)}
                  className="text-label text-muted-foreground hover:text-foreground ml-1"
                >
                  [RESET]
                </button>
              )}
            </>
          ) : (
            <span className="text-caption text-foreground uppercase">
              AUTO
            </span>
          )}
        </div>
      </div>

      <div className="absolute right-3 bottom-3 z-10">
        <div className="flex flex-col gap-0.5 bg-card/95 border border-border p-1.5">
          <span className="text-label text-muted-foreground px-1.5 pb-1">
            ROSTER
          </span>
          {aliveAgents?.map((agent) => (
            <button
              key={agent.id}
              type="button"
              onClick={() => setSpectatingAgent(agent.id)}
              className={`flex items-center gap-2 px-2 py-1 text-left ${spectatingAgent === agent.id
                ? "bg-secondary"
                : "hover:bg-secondary/50"
                }`}
            >
              <div className="size-1.5" style={{ backgroundColor: agent.color }} />
              <span className={`text-label ${spectatingAgent === agent.id ? "text-foreground" : "text-muted-foreground"}`}>
                {agent.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
