"use client";

import { useAtomValue, useSetAtom } from "jotai";
import { Loader2, WifiOff, Wifi, Trophy } from "lucide-react";
import {
  gameSnapshotAtom,
  spectatingAgentAtom,
  connectionStatusAtom,
  matchWinnerAtom,
} from "@/lib/store";

export function GameOverlay() {
  const snapshot = useAtomValue(gameSnapshotAtom);
  const spectatingAgent = useAtomValue(spectatingAgentAtom);
  const setSpectatingAgent = useSetAtom(spectatingAgentAtom);
  const connectionStatus = useAtomValue(connectionStatusAtom);
  const matchWinner = useAtomValue(matchWinnerAtom);

  const aliveAgents = snapshot?.agents.filter((a) => a.alive);
  const currentAgent = snapshot?.agents.find((a) => a.id === spectatingAgent);

  if (connectionStatus === "connecting") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background/80">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
          <span className="text-label text-muted-foreground uppercase">
            Connecting to arena...
          </span>
        </div>
      </div>
    );
  }

  if (connectionStatus === "disconnected") {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-background/80">
        <div className="flex flex-col items-center gap-3">
          <WifiOff className="size-6 text-muted-foreground" />
          <span className="text-label text-muted-foreground uppercase">
            Disconnected
          </span>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="absolute top-3 left-3 z-10">
        <div className="flex items-center gap-2 border border-border bg-card/90 px-2.5 py-1.5">
          {connectionStatus === "connected" ? (
            <Wifi className="size-3 text-success" />
          ) : (
            <WifiOff className="size-3 text-muted-foreground" />
          )}
          <span className="text-label text-muted-foreground uppercase">
            {connectionStatus}
          </span>
        </div>
      </div>

      {matchWinner && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/70">
          <div className="flex flex-col items-center gap-3 border border-border bg-card px-8 py-6">
            <Trophy className="size-8 text-foreground" />
            <span className="text-label text-muted-foreground uppercase">
              Winner
            </span>
            <span className="text-display-md text-foreground uppercase">
              {matchWinner.name ?? "No winner"}
            </span>
          </div>
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 left-3 z-10">
        <div className="pointer-events-auto flex items-center gap-2 border border-border bg-card/90 px-2.5 py-1.5">
          <span className="text-label text-muted-foreground">SPECTATING</span>
          {currentAgent ? (
            <>
              <div
                className="size-1.5"
                style={{ backgroundColor: currentAgent.color }}
              />
              <span className="text-caption text-foreground uppercase">
                {currentAgent.name}
              </span>
            </>
          ) : (
            <span className="text-caption text-foreground uppercase">AUTO</span>
          )}
        </div>
      </div>

      <div className="absolute right-3 bottom-3 z-10">
        <div className="flex flex-col gap-0.5 border border-border bg-card/90 p-1.5">
          <span className="text-label px-1.5 pb-1 text-muted-foreground">
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
              <div
                className="size-1.5"
                style={{ backgroundColor: agent.color }}
              />
              <span
                className={`text-label ${spectatingAgent === agent.id ? "text-foreground" : "text-muted-foreground"}`}
              >
                {agent.name}
              </span>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
