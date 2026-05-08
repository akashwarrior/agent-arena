import { GameEngine } from "./engine";

type ClientData = { id: string };
type Client = Bun.ServerWebSocket<ClientData>;

const clients = new Set<Client>();

const TICK_INTERVAL = Math.floor(1000 / 24);
const INTERMISSION_MS = 6 * 1000;

const PORT = Number(process.env.PORT ?? process.env.port ?? 3001);

let nextRoundNumber = 0;
let engine: GameEngine | null = null;
let lastTickAt = Date.now();
let intermissionUntil = 0;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function broadcastSnapshot(snapshot: string): void {
  for (const client of clients) {
    client.send(snapshot);
  }
}

function makeClientId(): string {
  return `c-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

function tickLoop(): void {
  const now = Date.now();

  if (now < intermissionUntil) {
    lastTickAt = now;
    return;
  }

  if (!engine || engine.getSnapshot().winnerId !== null) {
    engine = new GameEngine(++nextRoundNumber);

    console.log("[arena] round started", {
      round: engine.roundNumber,
      roundId: engine.roundId,
    });
  } else {
    const dt = clamp((now - lastTickAt) / 1000, 0, 0.12);
    engine.tick(dt, now);

    if (engine.isMatchComplete()) {
      engine.finishMatch();
      intermissionUntil = now + INTERMISSION_MS;
      console.log("[arena] round finished", {
        round: engine.roundNumber,
        winnerId: engine.getSnapshot().winnerId,
        intermissionMs: INTERMISSION_MS,
      });
    }
  }
  lastTickAt = now;
  broadcastSnapshot(JSON.stringify(engine.getSnapshot()));
}

const server = Bun.serve<ClientData, never>({
  port: PORT,

  fetch(req, srv) {
    const ok = srv.upgrade(req, { data: { id: makeClientId() } });
    if (ok) return;

    return new Response(
      "Upgrade required: connect via WebSocket to receive game state.",
      { status: 426 },
    );
  },

  websocket: {
    open(ws) {
      clients.add(ws);
      console.log("[arena] client connected", {
        clientId: ws.data.id,
        clients: clients.size,
      });
    },

    message(ws) {},

    close(ws, code, reason) {
      clients.delete(ws);
      console.log("[arena] client disconnected", {
        clientId: ws.data.id,
        clients: clients.size,
        code,
        reason: reason || undefined,
      });
    },
  },
});

setInterval(tickLoop, TICK_INTERVAL);

console.log("[arena] listening", {
  url: `ws://localhost:${server.port}`,
});
