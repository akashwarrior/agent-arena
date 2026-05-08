"use client";

import { useAtomValue } from "jotai";
import { selectedGameAtom } from "@/lib/store";
import { MOCK_LEADERBOARD } from "@/lib/mock-data";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

export function RightSidebarContent() {
  const selectedGame = useAtomValue(selectedGameAtom);

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col">
        {selectedGame ? (
          <>
            <div className="p-nd-md">
              <div className="flex items-center justify-between">
                <span className="font-body text-lg font-medium text-nd-text-display">
                  {selectedGame.name}
                </span>
                <Badge
                  variant="outline"
                  className={`font-mono text-[9px] ${
                    selectedGame.status === "LIVE"
                      ? "border-nd-success/30 text-nd-success"
                      : selectedGame.status === "UPCOMING"
                        ? "border-nd-border-visible text-nd-text-secondary"
                        : "border-nd-border text-nd-text-disabled"
                  }`}
                >
                  {selectedGame.status === "LIVE" && "● "}
                  {selectedGame.status.toUpperCase()}
                </Badge>
              </div>
              <div className="mt-nd-xs flex items-center gap-nd-md font-mono text-[10px] text-nd-text-disabled tabular-nums">
                <span>R{selectedGame.id}</span>
                <span>·</span>
                <span>{selectedGame.totalPool.toFixed(1)} SOL</span>
              </div>
            </div>

            <Separator className="bg-nd-border" />

            <div className="p-nd-md">
              <span className="font-mono text-[11px] tracking-[0.08em] text-nd-text-secondary uppercase">
                AGENTS
              </span>
              <div className="mt-nd-sm flex flex-col gap-nd-xs">
                {selectedGame?.agents
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .map((agent, i) => (
                    <div
                      key={agent.id}
                      className="flex items-center justify-between py-nd-xs"
                    >
                      <div className="flex items-center gap-nd-sm">
                        <span className="w-3 font-mono text-[10px] text-nd-text-disabled tabular-nums">
                          {i + 1}
                        </span>
                        <span
                          className="inline-block size-2 rounded-full"
                          style={{ backgroundColor: agent.color }}
                        />
                        <span
                          className={`font-body text-sm ${
                            agent.alive
                              ? "text-nd-text-primary"
                              : "text-nd-text-disabled line-through"
                          }`}
                        >
                          {agent.name}
                        </span>
                        {selectedGame.winnerAgentId === agent.id && (
                          <Badge
                            variant="outline"
                            className="border-nd-text-display/20 font-mono text-[8px] text-nd-text-display"
                          >
                            W
                          </Badge>
                        )}
                      </div>
                      <span className="font-mono text-xs text-nd-text-secondary tabular-nums">
                        {agent.score}
                      </span>
                    </div>
                  ))}
              </div>

              <div className="mt-nd-md flex flex-col gap-nd-sm">
                {selectedGame?.agents
                  .slice()
                  .sort((a, b) => b.score - a.score)
                  .map((agent) => {
                    const maxScore = Math.max(
                      ...selectedGame.agents.map((a) => a.score),
                      1
                    );
                    const segments = 12;
                    const filled = Math.round(
                      (agent.score / maxScore) * segments
                    );
                    return (
                      <div key={agent.id} className="flex flex-col gap-nd-2xs">
                        <div className="flex items-center justify-between">
                          <span className="font-mono text-[10px] text-nd-text-secondary">
                            {agent.name}
                          </span>
                          <span className="font-mono text-[10px] text-nd-text-disabled tabular-nums">
                            {agent.score}
                          </span>
                        </div>
                        <div className="flex gap-px">
                          {Array.from({ length: segments }).map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 ${
                                i < filled
                                  ? agent.alive
                                    ? "bg-nd-text-display"
                                    : "bg-nd-text-disabled"
                                  : "bg-nd-border"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-nd-3xl text-center">
            <span className="font-mono text-xs text-nd-text-disabled">
              [SELECT A GAME]
            </span>
          </div>
        )}

        <Separator className="bg-nd-border" />

        <div className="p-nd-md">
          <span className="font-mono text-[11px] tracking-[0.08em] text-nd-text-secondary uppercase">
            TOP BETTORS
          </span>
          <div className="mt-nd-sm flex flex-col gap-nd-sm">
            {MOCK_LEADERBOARD.map((player) => (
              <div key={player.rank} className="flex flex-col gap-nd-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-nd-sm">
                    <span className="w-4 font-mono text-[10px] text-nd-text-disabled tabular-nums">
                      {player.rank}
                    </span>
                    <span className="font-mono text-xs text-nd-text-primary">
                      {player.name}
                    </span>
                  </div>
                  <span
                    className={`font-mono text-[10px] font-bold tabular-nums ${
                      player.winRate >= 50
                        ? "text-nd-text-display"
                        : "text-nd-text-disabled"
                    }`}
                  >
                    {player.winRate.toFixed(1)}%
                  </span>
                </div>
                <div className="flex gap-px">
                  {Array.from({ length: 10 }).map((_, i) => (
                    <div
                      key={i}
                      className={`h-0.5 flex-1 ${
                        i < Math.round(player.winRate / 10)
                          ? "bg-nd-text-display"
                          : "bg-nd-border"
                      }`}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}

export function RightSidebar() {
  return (
    <aside className="hidden h-full w-[280px] flex-col border-l border-nd-border bg-nd-surface lg:flex">
      <div className="flex items-center border-b border-nd-border px-nd-md py-nd-sm">
        <span className="font-mono text-[11px] tracking-[0.08em] text-nd-text-secondary uppercase">
          MATCH INFO
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <RightSidebarContent />
      </div>
      <div className="flex items-center justify-between border-t border-nd-border px-nd-md py-nd-sm">
        <span className="font-mono text-[10px] tracking-[0.08em] text-nd-text-disabled uppercase">
          ● CONNECTED
        </span>
        <span className="font-mono text-[10px] text-nd-text-disabled">
          {MOCK_LEADERBOARD.length} PLAYERS
        </span>
      </div>
    </aside>
  );
}
