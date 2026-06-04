import type { Agent, ConnectionStatus } from "@repo/shared";
import { atom, type PrimitiveAtom } from "jotai";
import { atomFamily } from "jotai-family";

export const spectatingAgentAtom = atom<string | null>(null);

export const agentAliveAtom = atomFamily<string, PrimitiveAtom<boolean | null>>(
  () => atom<boolean | null>(null)
);

export const agentScoreAtom = atomFamily<string, PrimitiveAtom<number>>(() =>
  atom<number>(0)
);

export const connectionStatusAtom = atom<ConnectionStatus>("connecting");

export const matchWinnerAtom = atom<Agent | null>(null);
