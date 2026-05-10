"use client";

import type { GameSnapshot, ServerMessage } from "@repo/types";
import { useEffect, useRef } from "react";
import { useAtomValue, useSetAtom } from "jotai";
import { advanceCamera, drawFrame, pickCameraTarget } from "@/lib/renderer";
import {
  spectatingAgentAtom,
  gameSnapshotAtom,
  connectionStatusAtom,
  matchWinnerAtom,
  gameMetadataAtom,
  matchStartCountdownAtom,
} from "@/lib/store";

const MAX_DEVICE_PIXEL_RATIO = 1.5;

const WS_URL = process.env.NEXT_PUBLIC_GAME_WS_URL ?? "ws://localhost:3001";

function countdownSeconds(targetMs: number): number {
  return Math.max(0, Math.ceil((targetMs - Date.now()) / 1000));
}

export function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const spectatorRef = useRef<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const spectatingAgent = useAtomValue(spectatingAgentAtom);
  const gameMetadata = useAtomValue(gameMetadataAtom);

  const setSpectatingAgent = useSetAtom(spectatingAgentAtom);
  const setGameSnapshot = useSetAtom(gameSnapshotAtom);
  const setConnectionStatus = useSetAtom(connectionStatusAtom);
  const setMatchWinner = useSetAtom(matchWinnerAtom);
  const setGameMetadata = useSetAtom(gameMetadataAtom);
  const setMatchStartCountdown = useSetAtom(matchStartCountdownAtom);

  useEffect(() => {
    spectatorRef.current = spectatingAgent;
  }, [spectatingAgent]);

  useEffect(() => {
    const handleInteraction = () => {
      if (gameMetadata?.status === "LIVE" && audioRef.current?.paused) {
        audioRef.current.play().catch(() => {});
      }
    };

    window.addEventListener("click", handleInteraction);
    window.addEventListener("keydown", handleInteraction);

    return () => {
      window.removeEventListener("click", handleInteraction);
      window.removeEventListener("keydown", handleInteraction);
    };
  }, [gameMetadata?.status]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { willReadFrequently: false });
    if (!canvas || !ctx) return;

    let viewport = { width: 0, height: 0, ratio: 0 };
    let animationFrame = 0;
    let countdownTimer = 0;
    let winnerTimer = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, Math.floor(rect.width));
      const height = Math.max(1, Math.floor(rect.height));
      const ratio = Math.min(
        window.devicePixelRatio || 1,
        MAX_DEVICE_PIXEL_RATIO
      );
      viewport = { width, height, ratio };

      const targetW = Math.floor(width * ratio);
      const targetH = Math.floor(height * ratio);
      if (canvas.width !== targetW) canvas.width = targetW;
      if (canvas.height !== targetH) canvas.height = targetH;
    };

    const cancelRender = () => {
      if (animationFrame) {
        window.cancelAnimationFrame(animationFrame);
        animationFrame = 0;
      }
    };

    const clearCountdown = () => {
      if (countdownTimer) {
        window.clearInterval(countdownTimer);
        countdownTimer = 0;
      }
    };

    const setCountdownTarget = (target?: string) => {
      clearCountdown();

      if (!target) {
        setMatchStartCountdown(null);
        return;
      }

      const targetMs = new Date(target).getTime();
      if (!Number.isFinite(targetMs)) {
        setMatchStartCountdown(null);
        return;
      }

      const update = () => {
        const seconds = countdownSeconds(targetMs);
        setMatchStartCountdown(seconds);
        if (seconds === 0) clearCountdown();
      };

      update();
      if (targetMs > Date.now()) {
        countdownTimer = window.setInterval(update, 1000);
      }
    };

    const renderGame = (snapshot: GameSnapshot) => {
      const camera = pickCameraTarget(snapshot, spectatorRef.current);

      if (camera.followingId !== spectatorRef.current) {
        spectatorRef.current = camera.followingId;
        setSpectatingAgent(camera.followingId);
      }

      advanceCamera(camera, viewport, snapshot.world);
      drawFrame(ctx, viewport, snapshot, camera);
    };

    setConnectionStatus("connecting");
    const socket = new WebSocket(WS_URL);

    socket.addEventListener("open", () => {
      setConnectionStatus("connected");
    });

    socket.addEventListener("message", (event) => {
      if (typeof event.data !== "string") return;
      try {
        const message = JSON.parse(event.data) as ServerMessage;

        switch (message.type) {
          case "snapshot": {
            setGameSnapshot(message.data);
            cancelRender();
            animationFrame = window.requestAnimationFrame(() => renderGame(message.data));
            break;
          }
          case "status": {
            setMatchWinner(null);
            setGameMetadata(message.data);

            if (message.data.status === "LIVE") {
              clearCountdown();
              setMatchStartCountdown(null);
              
              if (audioRef.current) {
                if (audioRef.current.paused) {
                  audioRef.current.currentTime = 0;
                  audioRef.current.play().catch(() => {});
                }
              }
            } else {
              setGameSnapshot(null);
              ctx.reset();
              setCountdownTarget(
                message.data.matchStartsAt ?? message.data.bettingClosesAt
              );

              if (audioRef.current) {
                audioRef.current.pause();
              }
            }
            break;
          }
          case "winner": {
            clearCountdown();
            setMatchStartCountdown(null);
            setMatchWinner(message.data);

            if (audioRef.current) {
              audioRef.current.pause();
            }

            if (winnerTimer) window.clearTimeout(winnerTimer);
            winnerTimer = window.setTimeout(() => {
              setMatchWinner(null);
            }, 5000);
            break;
          }
          case "error":
            break;
        }
      } catch {
        // Ignore malformed messages
      }
    });

    socket.addEventListener("close", () => {
      setConnectionStatus("disconnected");
    });

    socket.addEventListener("error", () => {
      socket?.close();
    });

    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    return () => {
      cancelRender();
      clearCountdown();
      if (winnerTimer) window.clearTimeout(winnerTimer);
      socket?.close();
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
