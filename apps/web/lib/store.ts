import type { Agent, ConnectionStatus } from "@repo/shared";
import { atom } from "jotai";

export const spectatingAgentAtom = atom<string | null>(null);

export const agentsSnapshotAtom = atom<Agent[]>([]);

export const connectionStatusAtom = atom<ConnectionStatus>("connecting");

export const matchWinnerAtom = atom<Agent | null>(null);