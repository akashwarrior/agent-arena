import { atom } from "jotai";
import type {
  ConnectionStatus,
  GameMetadata,
  GameSnapshot,
  MatchResult,
} from "@repo/types";

export const spectatingAgentAtom = atom<string | null>(null);

export const leftSidebarOpenAtom = atom(true);

export const gameSnapshotAtom = atom<GameSnapshot | null>(null);

export const connectionStatusAtom = atom<ConnectionStatus>("connecting");

export const matchWinnerAtom = atom<MatchResult | null>(null);

export const gameMetadataAtom = atom<GameMetadata | null>(null);

export const matchStartCountdownAtom = atom<number | null>(null);
