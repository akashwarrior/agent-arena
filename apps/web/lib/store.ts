import { atom } from "jotai";
import type { GameSnapshot } from "@repo/types";
import type { GameWithAgents } from "@/lib/swr-types";

export const spectatingAgentAtom = atom<string | null>(null);

export const leftSidebarOpenAtom = atom(true);

export const gameSnapshotAtom = atom<GameSnapshot | null>(null);

export const activeGameAtom = atom<GameWithAgents | null>(null);
