"use client";

import { useState } from "react";
import { Provider, useAtomValue } from "jotai";
import { selectedGameAtom } from "@/lib/store";
// import { Game } from "@/components/game";
import { Navbar } from "@/components/navbar";
// import { GameOverlay } from "@/components/game-overlay";
import { LeftSidebar, LeftSidebarContent } from "@/components/left-sidebar";
import { RightSidebar, RightSidebarContent } from "@/components/right-sidebar";

type ContentTab = "games" | "bets" | "info";

function GamePlaceholder() {
  const selectedGame = useAtomValue(selectedGameAtom);

  return (
    <div className="dot-grid-subtle flex h-full items-center justify-center p-nd-md">
      <div className="flex flex-col items-center gap-nd-sm text-center sm:gap-nd-md">
        <span className="font-display text-2xl tracking-tight text-nd-text-display sm:text-3xl lg:text-4xl">
          {selectedGame ? selectedGame.name.toUpperCase() : "AGENT ARENA"}
        </span>
        {selectedGame?.status === "UPCOMING" && (
          <span className="font-mono text-[10px] tracking-[0.08em] text-nd-text-secondary uppercase sm:text-xs">
            MATCH NOT STARTED — PLACE YOUR BET
          </span>
        )}
        {selectedGame?.status === "ENDED" && (
          <div className="flex flex-col items-center gap-nd-xs">
            <span className="font-mono text-[10px] tracking-[0.08em] text-nd-text-disabled uppercase sm:text-xs">
              MATCH COMPLETED
            </span>
            {selectedGame.winnerAgentId && (
              <span className="font-mono text-xs tracking-[0.04em] text-nd-text-primary sm:text-sm">
                WINNER: {selectedGame.winnerAgentId.toUpperCase()}
              </span>
            )}
          </div>
        )}
        {!selectedGame && (
          <span className="font-mono text-[10px] tracking-[0.08em] text-nd-text-disabled uppercase sm:text-xs">
            SELECT A GAME TO BEGIN
          </span>
        )}
      </div>
    </div>
  );
}

export function Home() {
  const selectedGame = useAtomValue(selectedGameAtom);
  const isLive = selectedGame?.status === "LIVE";
  const [mobileTab, setMobileTab] = useState<ContentTab>("games");
  return (
    <Provider>
      <div className="flex h-dvh w-full flex-col overflow-hidden bg-nd-black">
        <Navbar />

        <div className="hidden min-h-0 flex-1 lg:flex">
          <LeftSidebar />
          <main className="relative min-w-0 flex-1">
            {isLive ? (
              <>
                {/* <Game />
                <GameOverlay game={selectedGame} /> */}
              </>
            ) : (
              <GamePlaceholder />
            )}
          </main>
          <RightSidebar />
        </div>

        <div className="flex min-h-0 flex-1 flex-col lg:hidden">
          <div className="relative aspect-video w-full bg-nd-black">
            {isLive ? (
              <>
                {/* <Game />
                <GameOverlay game={selectedGame} /> */}
              </>
            ) : (
              <GamePlaceholder />
            )}
          </div>

          <div className="flex border-b border-nd-border bg-nd-surface">
            {(
              [
                { id: "games" as const, label: "GAMES" },
                { id: "bets" as const, label: "MY BETS" },
                { id: "info" as const, label: "INFO" },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMobileTab(tab.id)}
                className={`flex-1 py-nd-sm font-mono text-[11px] tracking-[0.08em] uppercase transition-colors ${
                  mobileTab === tab.id
                    ? "border-b-2 border-nd-text-display text-nd-text-display"
                    : "text-nd-text-disabled hover:text-nd-text-secondary"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {mobileTab === "games" && <LeftSidebarContent tab="games" />}
            {mobileTab === "bets" && <LeftSidebarContent tab="bets" />}
            {mobileTab === "info" && <RightSidebarContent />}
          </div>
        </div>
      </div>
    </Provider>
  );
}
