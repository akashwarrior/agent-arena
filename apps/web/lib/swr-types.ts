import type { Game, Agent, Bet } from "@repo/db";

export type GameWithAgents = Game & { agents: Agent[] };

export type GamesResponse = {
  games: GameWithAgents[];
  nextCursor: string | null;
};

export type GameDetailResponse = {
  game: GameWithAgents;
  userBet: Bet | null;
};

export type BetsResponse = {
  bets: (Bet & { game: Game; agent: Agent })[];
  nextCursor: string | null;
};

export type BetPlacementResponse = {
  bet: Bet;
};

export type BetInitResponse = {
  escrowPublicKey: string;
  escrowUSDCAddress: string;
  usdcAmount: number;
  gameId: string;
};

export type LeaderboardEntry = {
  rank: number;
  id: string;
  name: string;
  totalBetsPlaced: number;
  totalBetsWon: number;
  totalBetsLost: number;
  totalWagered: number;
  totalPayout: number;
  netEarnings: number;
};

export type LeaderboardResponse = {
  leaderboard: LeaderboardEntry[];
};
