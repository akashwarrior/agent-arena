"use client";

import { fromBinary, ServerMessageSchema } from "@repo/shared";
import { useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import {
  advanceCamera,
  drawFrame,
  pickCameraTarget,
} from "@/lib/renderer";
import {
  spectatingAgentAtom,
  connectionStatusAtom,
  agentsSnapshotAtom,
  matchWinnerAtom,
} from "@/lib/store";

const MAX_DEVICE_PIXEL_RATIO = 1.5;

const WS_URL = process.env.NEXT_PUBLIC_GAME_WS_URL ?? "ws://localhost:3001";

export function Game({ gameId }: { gameId: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spectatorRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const spectatingAgent = useAtomValue(spectatingAgentAtom);

  const setSpectatingAgent = useSetAtom(spectatingAgentAtom);
  const setConnectionStatus = useSetAtom(connectionStatusAtom);
  const setAgentsSnapshot = useSetAtom(agentsSnapshotAtom);
  const setMatchWinner = useSetAtom(matchWinnerAtom);

  useEffect(() => {
    spectatorRef.current = spectatingAgent;
  }, [spectatingAgent]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: false });
    if (!canvas || !ctx) return;

    let viewport = { width: 0, height: 0, ratio: 0 };
    let animationFrame = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const ratio = Math.min(
        devicePixelRatio || 1,
        MAX_DEVICE_PIXEL_RATIO
      );
      viewport = { width, height, ratio };

      const targetW = Math.floor(width * ratio);
      const targetH = Math.floor(height * ratio);
      if (canvas.width !== targetW) canvas.width = targetW;
      if (canvas.height !== targetH) canvas.height = targetH;
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
        audioRef.current.play().catch(() => { });
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
            if (animationFrame) {
              cancelAnimationFrame(animationFrame);
            }
            animationFrame = requestAnimationFrame(() => {
              const camera = pickCameraTarget(payload.value.agents, spectatorRef.current);
              if (camera.followingId !== spectatorRef.current) {
                spectatorRef.current = camera.followingId;
                setSpectatingAgent(camera.followingId);
              }
              advanceCamera(camera, viewport);
              drawFrame(ctx, viewport, payload.value, camera);
            });
            setAgentsSnapshot(payload.value.agents);
            break;

          case "matchEnd":
            ctx.reset();
            audioRef.current?.pause();
            setMatchWinner(payload.value.winner || null);
            setAgentsSnapshot([]);
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
      socket.close();
    });

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
      socket.close();
      observer.disconnect();
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="block h-full w-full bg-background" />
      <audio ref={audioRef} src="/music.mp3" loop />
    </>
  );
}
