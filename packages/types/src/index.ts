export type Point = {
  x: number;
  y: number;
};

export type Food = Point & {
  id: string;
};

export type Snake = {
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
  WIDTH: number;
  HEIGHT: number;
};

export type GameSnapshot = {
  roundId: string;
  roundNumber: number;
  world: World;
  durationMs: number;
  remainingMs: number;
  elapsedMs: number;
  startedAt: number;
  food: Food[];
  snakes: Snake[];
  winnerId: string | null;
};

export type ConnectionStatus = "connecting" | "connected" | "disconnected";
