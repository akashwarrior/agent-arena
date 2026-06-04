"use client";

import {
  fromBinary,
  ServerMessageSchema,
  type LiveMatchTick,
} from "@repo/shared";
import { useEffect, useRef } from "react";
import { useAtomValue, useSetAtom, useStore } from "jotai";
import { advanceCamera, drawFrame, pickCameraTarget } from "@/lib/renderer";
import {
  spectatingAgentAtom,
  connectionStatusAtom,
  agentAliveAtom,
  agentScoreAtom,
  matchWinnerAtom,
} from "@/lib/store";

const MAX_DEVICE_PIXEL_RATIO = 1.5 as const;

const WS_URL = process.env.NEXT_PUBLIC_GAME_WS_URL ?? "ws://localhost:3001";

export function Game({ gameId }: { gameId: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spectatorRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const spectatingAgent = useAtomValue(spectatingAgentAtom);

  const setSpectatingAgent = useSetAtom(spectatingAgentAtom);
  const setConnectionStatus = useSetAtom(connectionStatusAtom);
  const setMatchWinner = useSetAtom(matchWinnerAtom);
  const store = useStore();

  useEffect(() => {
    spectatorRef.current = spectatingAgent;
  }, [spectatingAgent]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let animationFrame = 0;
    let tick: LiveMatchTick | null = null;

    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    const ratio = Math.min(devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO);
    const viewport = { width, height, ratio };

    const targetW = Math.floor(width * ratio);
    const targetH = Math.floor(height * ratio);
    if (canvas.width !== targetW) canvas.width = targetW;
    if (canvas.height !== targetH) canvas.height = targetH;

    const render = () => {
      animationFrame = 0;
      if (!tick) return;

      const camera = pickCameraTarget(tick.agents, spectatorRef.current);
      if (camera.followingId !== spectatorRef.current) {
        spectatorRef.current = camera.followingId;
        setSpectatingAgent(camera.followingId);
      }
      advanceCamera(camera, viewport);
      drawFrame(ctx, viewport, tick, camera);
      for (const agent of tick.agents) {
        store.set(agentAliveAtom(agent.id), agent.alive);
        store.set(agentScoreAtom(agent.id), agent.score);
      }
    };

    const socketUrl = new URL(WS_URL);
    socketUrl.searchParams.set("gameId", String(gameId));

    setConnectionStatus("connecting");
    const socket = new WebSocket(socketUrl);
    socket.binaryType = "arraybuffer";

    socket.addEventListener("open", () => {
      setConnectionStatus("connected");
      if (audioRef.current?.paused) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    });

    socket.addEventListener("message", ({ data: message }) => {
      try {
        const { payload } = fromBinary(
          ServerMessageSchema,
          new Uint8Array(message)
        );

        switch (payload.case) {
          case "tick":
            tick = payload.value;
            if (animationFrame) return;
            animationFrame = requestAnimationFrame(render);
            break;

          case "matchEnd":
            if (animationFrame) {
              cancelAnimationFrame(animationFrame);
              animationFrame = 0;
            }
            ctx.reset();
            audioRef.current?.pause();
            setMatchWinner(payload.value.winner || null);
            break;
        }
      } catch {
        // Ignore malformed messages
      }
    });

    socket.addEventListener("close", () => {
      setConnectionStatus("disconnected");
      audioRef.current?.pause();
    });

    socket.addEventListener("error", () => {
      setConnectionStatus("disconnected");
      socket.close();
    });

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
      socket.close();
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="block h-full w-full bg-background" />
      <audio ref={audioRef} src="/music.mp3" loop />
    </>
  );
}
