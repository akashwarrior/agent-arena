import { atom } from "jotai";
import type {
  Agent,
  ConnectionStatus,
  Food,
  ServerMessage,
} from "@repo/shared";

type ServerPayload = ServerMessage["payload"];

export type LiveGameFrame = {
  gameId: number;
  remainingMs: number;
  food: Food[];
  agents: Agent[];
};

export const spectatingAgentAtom = atom<string | null>(null);

export const gameSnapshotAtom = atom<LiveGameFrame | null>(null);

export const connectionStatusAtom = atom<ConnectionStatus>("connecting");

export const matchWinnerAtom = atom<Agent | null>(null);

export const gameServerEventAtom = atom(
  null,
  (_get, set, payload: ServerPayload) => {
    switch (payload.case) {
      case "tick":
        set(gameSnapshotAtom,payload.value);
        break;

      case "matchEnd":
        set(matchWinnerAtom, payload.value.winner ?? null);
        set(gameSnapshotAtom, null);
        break;

      case undefined:
        break;
    }
  }
);
