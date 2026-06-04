"use client";

import type { GameAgent } from "@/lib/api-types";
import { useAtomValue, useSetAtom } from "jotai";
import { Loader2, WifiOff, Wifi, Trophy } from "lucide-react";
import {
  agentAliveAtom,
  spectatingAgentAtom,
  connectionStatusAtom,
  matchWinnerAtom,
} from "@/lib/store";

type GameOverlayProps = {
  agents: GameAgent[];
};

export function GameOverlay({ agents }: GameOverlayProps) {
  const connectionStatus = useAtomValue(connectionStatusAtom);

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
          <Wifi className="size-3 text-success" />
          <span className="text-label text-muted-foreground uppercase">
            {connectionStatus}
          </span>
        </div>
      </div>
      <WinnerOverlay />
      <Spectating agents={agents} />
    </>
  );
}

function WinnerOverlay() {
  const matchWinner = useAtomValue(matchWinnerAtom);
  if (!matchWinner) return null;

  return (
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
  );
}

function Spectating({ agents }: GameOverlayProps) {
  const spectatingAgent = useAtomValue(spectatingAgentAtom);
  const currentAgent = agents?.find((a) => a.id === spectatingAgent);

  return (
    <>
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
          {agents.map((agent) => (
            <RosterAgentButton
              key={agent.id}
              agent={agent}
              selected={spectatingAgent === agent.id}
            />
          ))}
        </div>
      </div>
    </>
  );
}

function RosterAgentButton({
  agent,
  selected,
}: {
  agent: GameAgent;
  selected: boolean;
}) {
  const alive = useAtomValue(agentAliveAtom(agent.id));
  const setSpectatingAgent = useSetAtom(spectatingAgentAtom);

  if (alive === false) return null;

  return (
    <button
      type="button"
      onClick={() => setSpectatingAgent(agent.id)}
      className={`flex items-center gap-2 px-2 py-1 text-left ${
        selected ? "bg-secondary" : "hover:bg-secondary/50"
      }`}
    >
      <div className="size-1.5" style={{ backgroundColor: agent.color }} />
      <span
        className={`text-label ${
          selected ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {agent.name}
      </span>
    </button>
  );
}
