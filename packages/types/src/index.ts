import type { GameStatus } from "@repo/db";

export type Point = {
  x: number;
  y: number;
};

export type Food = Point & {
  id: string;
};

export type Agent = {
  id: string;
  name: string;
  color: string;
  accent: string;
  alive: boolean;
  score: number;
  size: number;
  angle: number;
  head: Point;
  body: Point[];
  length: number;
  survivedMs: number;
  rank: number | null;
};

export type World = {
  width: number;
  height: number;
};

export type GameAgentMetadata = Pick<Agent, "id" | "name" | "color" | "accent">;

export type GameSnapshot = {
  gameId: string;
  gameName: string;
  world: World;
  durationMs: number;
  remainingMs: number;
  elapsedMs: number;
  startedAt: number;
  food: Food[];
  agents: Agent[];
  winnerId: string | null;
};

export type GameMetadata = {
  id: string;
  name: string;
  pool: number;
  status: GameStatus;
  bettingOpensAt?: string;
  bettingClosesAt?: string;
  matchStartsAt?: string;
  startedAt?: string;
  agents: GameAgentMetadata[];
};

export type MatchResult = {
  gameId: string;
  winnerId: string | null;
  winnerName: string | null;
};

export type ServerMessage =
  | { type: "snapshot"; data: GameSnapshot }
  | { type: "status"; data: GameMetadata }
  | { type: "winner"; data: MatchResult }
  | { type: "pong"; data: { sentAt: number | null; serverTime: number } }
  | { type: "error"; data: { message: string } };

export type ConnectionStatus = "connecting" | "connected" | "disconnected";
