import type {
  GameAgentMetadata,
  GameMetadata,
  ServerMessage,
} from "@repo/types";
import type { Game, GameStatus } from "@repo/db";
import { prisma } from "@repo/db";
import { GameEngine, type GameConfig } from "./engine";

type ClientData = { id: string };
type Client = Bun.ServerWebSocket<ClientData>;

const clients = new Set<Client>();

const PORT = process.env.PORT || 3001;
const TICK_INTERVAL_MS = Math.floor(1000 / 24);
const INTERMISSION_MS = 6000;
const MATCH_DURATION_MS = 3 * 60 * 1000; // 3 mins

let engine: GameEngine | null = null;
let lastEngineTickAt = Date.now();
let nextMatchCheckAt = Date.now();

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function makeClientId(): string {
  return `c-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function scheduleMatchCheck(delayMs: number = 1000): void {
  nextMatchCheckAt = Date.now() + Math.max(0, delayMs);
}

function broadcast(message: ServerMessage): void {
  const payload = JSON.stringify(message);

  for (const client of clients) {
    client.send(payload);
  }
}

function broadcastSnapshot(): void {
  if (!engine) return;
  broadcast({ type: "snapshot", data: engine.getSnapshot() });
}

function broadcastStatus(status: GameMetadata): void {
  broadcast({ type: "status", data: status });
}

async function updateGameStatus(
  gameId: string,
  status: GameStatus,
  winnerAgentId?: string | null,
) {
  try {
    return await prisma.game.update({
      where: { id: gameId },
      data: {
        status,
        ...(winnerAgentId !== undefined ? { winnerAgentId } : {}),
        ...(status === "LIVE" ? { startedAt: new Date() } : {}),
        ...(status === "ENDED" ? { endedAt: new Date() } : {}),
      },
    });
  } catch (error) {
    console.error("[arena] failed to update game status", {
      gameId,
      status,
      error,
    });
    return null;
  }
}

async function fetchNextGame() {
  try {
    return await prisma.game.findFirst({
      where: {
        status: { in: ["LIVE", "LOCKED", "OPEN", "UPCOMING"] },
      },
      orderBy: [
        { bettingClosesAt: "asc" },
        { bettingOpensAt: "asc" },
        { createdAt: "asc" },
      ],
      include: {
        agents: {
          include: {
            agent: true,
          },
        },
      },
    });
  } catch (error) {
    console.error("[arena] failed to fetch next game", error);
    return null;
  }
}

function getSchedule(game: Game, now: number) {
  const bettingOpensAtMs = game.bettingOpensAt?.getTime() ?? now;
  const bettingClosesAtMs = game.bettingClosesAt?.getTime() ?? bettingOpensAtMs;
  return {
    bettingOpensAtMs,
    bettingClosesAtMs: Math.max(bettingClosesAtMs, bettingOpensAtMs),
  };
}

function toGameMetadata(
  game: Game & { agents: { agent: GameAgentMetadata }[] },
  status: GameStatus = game.status,
): GameMetadata {
  const { bettingClosesAtMs } = getSchedule(game, Date.now());

  return {
    id: game.id,
    name: game.name,
    pool: game.totalPool / 1e6,
    status,
    bettingOpensAt: game.bettingOpensAt?.toISOString(),
    bettingClosesAt: game.bettingClosesAt?.toISOString(),
    matchStartsAt:
      status === "LIVE" ? undefined : new Date(bettingClosesAtMs).toISOString(),
    startedAt: game.startedAt?.toISOString(),
    agents: game.agents.map((x) => x.agent),
  };
}

function getLiveMetadata(activeEngine: GameEngine): GameMetadata {
  return {
    id: activeEngine.id,
    name: activeEngine.name,
    pool: activeEngine.pool,
    status: "LIVE",
    startedAt: new Date(activeEngine.getSnapshot().startedAt).toISOString(),
    agents: activeEngine.getAgents(),
  };
}

function finishCurrentMatch(): void {
  if (!engine) {
    return;
  }

  engine.finishMatch();

  const id = engine.id;
  const winner = engine.getWinner()!;
  const agents = engine.getAgents()!;

  engine = null;

  // TODO: verify if this works correctly
  console.log({
    msg: "after engine cleanup match result",
    id,
    winner,
    agents,
  });

  broadcastSnapshot();
  broadcast({
    type: "winner",
    data: { gameId: id, winnerId: winner.id, winnerName: winner.name },
  });

  updateGameStatus(id, "ENDED", winner.id).then(() => {
    console.log("[arena] triggering payout resolution", { gameId: id });
    return fetch("http://localhost:3000/api/games/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gameId: id, agentRanks: agents }),
    });
  });

  scheduleMatchCheck(INTERMISSION_MS);
}

function tickLoop(): void {
  const now = Date.now();

  if (!engine) {
    if (now >= nextMatchCheckAt) {
      startNextMatch();
    }
    return;
  }

  const deltaSeconds = clamp((now - lastEngineTickAt) / 1000, 0, 0.12);
  lastEngineTickAt = now;
  engine.tick(deltaSeconds, now);

  if (engine.isMatchComplete()) {
    finishCurrentMatch();
    return;
  }

  broadcastSnapshot();
}

async function startNextMatch(): Promise<Awaited<
  ReturnType<typeof fetchNextGame>
> | void> {
  const game = await fetchNextGame();

  if (!game) {
    scheduleMatchCheck();
    console.log("[arena] no upcoming games, waiting...");
    return;
  }

  const now = Date.now();
  const { bettingOpensAtMs, bettingClosesAtMs } = getSchedule(game, now);

  if (game.status === "UPCOMING" && now < bettingOpensAtMs) {
    broadcastStatus(toGameMetadata(game, "UPCOMING"));
    scheduleMatchCheck();
    console.log("[arena] waiting for betting to open", {
      gameId: game.id,
    });
    return;
  }

  if (
    now < bettingClosesAtMs &&
    game.status !== "LIVE" &&
    game.status !== "LOCKED"
  ) {
    if (game.status !== "OPEN") {
      const openedGame = await updateGameStatus(game.id, "OPEN");
      if (!openedGame) {
        scheduleMatchCheck();
        return;
      }
    }
    broadcastStatus(toGameMetadata(game, "OPEN"));
    scheduleMatchCheck();
    console.log("[arena] betting open, waiting for match start", {
      gameId: game.id,
    });
    return;
  }

  if (game.status !== "LIVE") {
    const lockedGame = await updateGameStatus(game.id, "LOCKED");
    if (!lockedGame) {
      scheduleMatchCheck();
      return;
    }
    broadcastStatus(toGameMetadata(game, "LOCKED"));
  }

  const liveGame =
    game.status === "LIVE" && game.startedAt
      ? game
      : await updateGameStatus(game.id, "LIVE");
  if (!liveGame) {
    scheduleMatchCheck();
    return;
  }

  const startedAtMs = liveGame.startedAt?.getTime() ?? Date.now();
  const config: GameConfig = {
    id: game.id,
    name: game.name,
    pool: game.totalPool / 1e6,
    durationMs: MATCH_DURATION_MS,
    startedAtMs,
    agents: game.agents.map((x) => x.agent),
  };

  engine = new GameEngine(config);
  lastEngineTickAt = Date.now();

  broadcastStatus({
    ...toGameMetadata(game, "LIVE"),
    startedAt: new Date(startedAtMs).toISOString(),
  });

  console.log("[arena] starting match", {
    gameId: game.id,
    name: game.name,
    durationMs: MATCH_DURATION_MS,
  });
}

const server = Bun.serve<ClientData, never>({
  port: PORT,

  fetch(request, server) {
    const ok = server.upgrade(request, { data: { id: makeClientId() } });
    if (ok) return;

    return new Response(
      "Upgrade required: connect via WebSocket to receive game state.",
      { status: 426 },
    );
  },

  websocket: {
    open(client) {
      clients.add(client);
      console.log("[arena] client connected", {
        clientId: client.data.id,
        clients: clients.size,
      });
      if (engine) {
        client.send(
          JSON.stringify({ type: "status", data: getLiveMetadata(engine) }),
        );
        client.send(
          JSON.stringify({ type: "snapshot", data: engine.getSnapshot() }),
        );
      }
    },

    message(client, raw) {},

    close(client, code, reason) {
      clients.delete(client);
      console.log("[arena] client disconnected", {
        clientId: client.data.id,
        clients: clients.size,
        code,
        reason: reason || undefined,
      });
    },
  },
});

setInterval(tickLoop, TICK_INTERVAL_MS);

console.log("[arena] listening", {
  url: `ws://localhost:${server.port}`,
});
