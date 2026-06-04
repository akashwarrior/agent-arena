import { GameEngine, type GameAgentConfig } from "./engine";
import { prisma, type Prisma } from "@repo/db";
import {
  ServerMessageSchema,
  toBinary,
  type Agent,
  type ServerMessage,
} from "@repo/shared";

type ServerPayload = ServerMessage["payload"];

const GAME_TOPIC = "game" as const;

const PORT = process.env.PORT || 3001;
const WEB_APP_URL = process.env.WEB_APP_URL ?? "http://localhost:3000";
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;

if (!INTERNAL_API_KEY) {
  throw new Error("INTERNAL_API_KEY environment variable is required");
}

const headers: Record<string, string> = {
  "x-api-key": INTERNAL_API_KEY,
} as const;

const MAX_AGENTS = 5 as const;
const GAME_NAMES = [
  "Phoenix Fury",
  "Velocity Vault",
  "Alpha Clash",
  "Beta Blitz",
  "Gamma Grid",
  "Delta Dash",
  "Epsilon Edge",
  "Zeta Zone",
  "Theta Thunder",
  "Iota Impact",
  "Kappa Krush",
  "Sigma Storm",
  "Omega Onslaught",
  "Nova Nexus",
  "Rift Rumble",
  "Void Vortex",
] as const;

const engine = new GameEngine(MAX_AGENTS);

const gameScheduleSelect = {
  id: true,
  name: true,
  totalPool: true,
  participants: {
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: {
      agent: {
        select: {
          id: true,
          name: true,
          color: true,
          accent: true,
        },
      },
    },
  },
} satisfies Prisma.GameSelect;

type ScheduledGame = Prisma.GameGetPayload<{
  select: typeof gameScheduleSelect;
}>;

function getPlatformFeeBps(): number {
  const feeBps = Number(process.env.NEXT_PUBLIC_PLATFORM_FEE_BPS ?? 100);

  if (!Number.isInteger(feeBps) || feeBps < 0 || feeBps > 10_000) {
    throw new Error("NEXT_PUBLIC_PLATFORM_FEE_BPS must be between 0 and 10000");
  }

  return feeBps;
}

const PLATFORM_FEE_BPS = getPlatformFeeBps();

const SERVER_MESSAGE: ServerMessage = {
  $typeName: "ServerMessage",
  payload: { case: undefined },
} as const;

function encodePayload(payload: ServerPayload): Uint8Array {
  SERVER_MESSAGE.payload = payload;
  return toBinary(ServerMessageSchema, SERVER_MESSAGE, {
    writeUnknownFields: false,
  });
}

function createTickPayload(): ServerPayload {
  return {
    case: "tick",
    value: {
      $typeName: "LiveMatchTick",
      gameId: engine.getId(),
      food: engine.getFood(),
      agents: engine.getAgents(),
    },
  };
}

function createMatchEndPayload(): ServerPayload | null {
  const winner = engine.getWinner();
  if (!winner) return null;

  return {
    case: "matchEnd",
    value: {
      $typeName: "MatchEnd",
      gameId: engine.getId(),
      winner,
    },
  };
}

function parseGameId(value: string | null): number | null {
  if (!value) return null;

  const gameId = Number(value);
  if (!Number.isSafeInteger(gameId) || gameId <= 0) return null;

  return gameId;
}

async function fetchNextGame(): Promise<ScheduledGame | null> {
  try {
    return await prisma.game.findFirst({
      where: {
        status: "UPCOMING",
        participants: {
          some: {},
        },
      },
      orderBy: { id: "asc" },
      select: gameScheduleSelect,
    });
  } catch (error) {
    console.error("[arena] failed to fetch next game", error);
    return null;
  }
}

async function createNextGame() {
  try {
    const [agents, escrowAccount] = await Promise.all([
      prisma.agent.findMany({
        take: MAX_AGENTS,
        orderBy: { createdAt: "asc" },
        select: { id: true },
      }),
      prisma.escrowAccount.findFirst({
        where: {
          status: "ACTIVE",
        },
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
        },
      }),
    ]);

    if (agents.length < 2) {
      console.warn("[arena] at least two agents are required to create a game");
      return;
    }

    if (!escrowAccount) {
      console.warn(
        "[arena] no active USDC escrow in database, cannot create game",
      );
      return;
    }

    const name = GAME_NAMES[Math.floor(Math.random() * GAME_NAMES.length)]!;
    const game = await prisma.game.create({
      data: {
        name,
        status: "UPCOMING",
        escrowAccountId: escrowAccount.id,
        feeBps: PLATFORM_FEE_BPS,
        participants: {
          create: agents.map((agent, position) => ({
            agentId: agent.id,
            position: position + 1,
          })),
        },
      },
      select: {
        id: true,
        name: true,
        status: true,
      },
    });
    console.log({
      "Created new game :": game,
    });
  } catch (error) {
    console.error("[arena] failed to create next game", error);
  }
}
async function persistMatchResult(
  gameId: number,
  agentRanks: ReadonlyArray<Agent>,
): Promise<void> {
  const finishedAt = new Date();
  const participantRows = await prisma.gameParticipant.findMany({
    where: {
      gameId,
      agentId: {
        in: agentRanks.map((agent) => agent.id),
      },
    },
    select: {
      id: true,
      agentId: true,
    },
  });
  const participantByAgentId = new Map(
    participantRows.map((participant) => [participant.agentId, participant]),
  );
  const winnerAgent = agentRanks[0] ?? null;
  const winnerParticipantId = winnerAgent
    ? (participantByAgentId.get(winnerAgent.id)?.id ?? null)
    : null;

  await prisma.$transaction(async (tx) => {
    await tx.game.update({
      where: { id: gameId },
      data: {
        status: "ENDED",
        endedAt: finishedAt,
        winnerParticipantId,
      },
      select: { id: true },
    });

    for (const [index, agent] of agentRanks.entries()) {
      const participant = participantByAgentId.get(agent.id);
      if (!participant) {
        console.warn("[arena] missing participant for agent result", {
          gameId,
          agentId: agent.id,
        });
        continue;
      }

      await tx.gameParticipant.update({
        where: { id: participant.id },
        data: {
          status: index === 0 ? "WINNER" : "LOSER",
          finalRank: agent.rank ?? index + 1,
          finalScore: agent.score,
          eliminatedAt: agent.alive ? null : finishedAt,
        },
        select: { id: true },
      });
    }
  });
}

async function resolveMatch(): Promise<void> {
  try {
    const id = engine.getId();
    const agents = engine.getAgents();
    await persistMatchResult(id, agents);

    // TODO: push settlement to a queue so payout/refund processing retries safely.
    try {
      const response = await fetch(
        `${WEB_APP_URL}/api/games/${id}/settlement`,
        {
          method: "POST",
          headers: headers,
          body: JSON.stringify({ agentRanks: agents }),
        },
      );
      if (!response.ok) {
        console.error("[arena] settlement request failed", {
          gameId: id,
          status: response.status,
          body: await response.text(),
        });
      }
    } catch (err) {
      console.error("[arena] settlement request failed", { gameId: id, err });
    }

    const upcomingCount = await prisma.game.count({
      where: { status: "UPCOMING" },
    });

    if (upcomingCount < 10) {
      await Promise.all(
        Array.from(
          { length: 10 - upcomingCount },
          async () => await createNextGame(),
        ),
      );
    }
  } catch (error) {
    console.error("[arena] failed to refill upcoming games", error);
  }
}

const INTERVAL_DURATION = 30 * 1000;
const GAME_TICK = Math.round(1000 / 30);

async function startGameLoop() {
  let lastEngineTickAt = Date.now();
  let tick_ms = GAME_TICK;

  while (true) {
    const now = Date.now();

    switch (engine.getStatus()) {
      case "RUNNING":
        const deltaSeconds = Math.max(
          0,
          Math.min((now - lastEngineTickAt) / 1000, 0.12),
        );
        engine.tick(deltaSeconds, now);
        lastEngineTickAt = now;
        if (engine.getStatus() === "ENDED") {
          const endPayload = createMatchEndPayload();
          if (endPayload) broadcast(endPayload);
          await resolveMatch();
          break;
        }
        broadcast(createTickPayload());
        tick_ms = GAME_TICK;
        break;

      case "ENDED":
        if (!(await scheduleNextMatch(now + INTERVAL_DURATION))) {
          tick_ms = 200;
        } else {
          tick_ms = 1000;
        }
        break;

      case "INTERVAL":
        const startedAt = engine.getStartedAt();
        if (startedAt <= now) {
          try {
            await prisma.game.update({
              where: { id: engine.getId(), status: "UPCOMING" },
              data: { status: "LIVE" },
            });

            engine.startGame();
            tick_ms = GAME_TICK;
            lastEngineTickAt = now;
          } catch {
            tick_ms = 200;
          }
        } else {
          tick_ms = Math.max(100, Math.min(1000, startedAt - now));
        }
        break;
    }

    const diff = Date.now() - now;
    if (diff < tick_ms) {
      await new Promise((r) => setTimeout(r, tick_ms - diff));
    }
  }
}

async function scheduleNextMatch(time: number): Promise<boolean> {
  const game = await fetchNextGame();

  if (!game) {
    console.log("[arena] no upcoming games, creating one...");
    await createNextGame();
    return false;
  }

  if (game.participants.length < 2) {
    console.warn("[arena] upcoming game has fewer than two participants", {
      gameId: game.id,
    });
    await prisma.game.update({
      where: { id: game.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
      select: { id: true },
    });
    return false;
  }

  const agents: GameAgentConfig[] = game.participants.map(
    (participant) => participant.agent,
  );

  try {
    await prisma.$transaction([
      prisma.game.update({
        where: { id: game.id },
        data: {
          startedAt: new Date(time),
          winnerParticipantId: null,
          endedAt: null,
          settledAt: null,
          cancelledAt: null,
        },
        select: { id: true },
      }),
      prisma.gameParticipant.updateMany({
        where: { gameId: game.id },
        data: {
          status: "ACTIVE",
          finalRank: null,
          finalScore: null,
          eliminatedAt: null,
        },
      }),
    ]);
  } catch (error) {
    console.error("[arena] failed to update game status", {
      gameId: game.id,
      error,
    });
    return false;
  }

  engine.scheduleGame({
    id: game.id,
    name: game.name,
    startedAt: time,
    agents,
  });

  console.log("[arena] starting match", {
    gameId: game.id,
    name: game.name,
  });
  return true;
}

async function init() {
  const liveGames = await prisma.game.findMany({
    where: { status: "LIVE" },
    select: { id: true },
  });

  const cancelledAt = new Date();
  for (const game of liveGames) {
    // TODO: create refund payments for cancelled live games.
    await prisma.$transaction([
      prisma.bet.updateMany({
        where: { gameId: game.id, status: "ACTIVE" },
        data: { status: "REFUNDED", settledAt: cancelledAt },
      }),
      prisma.game.update({
        where: { id: game.id },
        data: {
          status: "CANCELLED",
          endedAt: cancelledAt,
          cancelledAt,
        },
        select: { id: true },
      }),
    ]);
  }

  await startGameLoop();
}

const WEB_APP_ORIGIN = new URL(WEB_APP_URL).origin;

const server = Bun.serve({
  port: PORT,

  fetch(request, server) {
    const url = new URL(request.url);

    const requestedGameId = parseGameId(url.searchParams.get("gameId"));
    if (
      requestedGameId !== engine.getId() ||
      engine.getStatus() !== "RUNNING"
    ) {
      return new Response("Invalid gameId", { status: 400 });
    }

    const origin = request.headers.get("origin");
    if (!origin || origin !== WEB_APP_ORIGIN) {
      return new Response("Forbidden", { status: 403 });
    }

    const upgraded = server.upgrade(request);

    if (upgraded) return;

    return new Response(
      "Upgrade required: connect via WebSocket to receive game state.",
      { status: 426 },
    );
  },

  websocket: {
    open(client) {
      client.subscribe(GAME_TOPIC);
      console.log("[arena] client connected", {
        viewers: server.subscriberCount(GAME_TOPIC),
      });
    },

    backpressureLimit: 0,
    closeOnBackpressureLimit: true,
    maxPayloadLength: 300 * 1024,
    perMessageDeflate: { compress: "disable", decompress: "disable" },
    sendPings: false,

    message() {},

    close() {
      console.log("[arena] client disconnected", {
        viewers: server.subscriberCount(GAME_TOPIC),
      });
    },
  },
});

console.log("[arena] listening", { url: `ws://localhost:${server.port}` });

function broadcast(payload: ServerPayload): void {
  if (server.subscriberCount(GAME_TOPIC) === 0) return;
  server.publish(GAME_TOPIC, encodePayload(payload));
}

init().catch((err) => {
  console.error("[arena] initialization failed", err);
  process.exit(1);
});
