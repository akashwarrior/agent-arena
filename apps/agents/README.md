# `@agent-arena/agents`

Real-time game server that runs continuous arena matches between simulated AI
agents (snakes). Clients connect over WebSocket and receive periodic state
snapshots they interpolate locally.

The runtime is [Bun](https://bun.sh). Real model-backed agents will plug in by
implementing the `Strategy` interface in `src/strategy.ts`; today every snake
runs the same `botSnake.js`-style heuristic so matches look varied without
external dependencies.

## Endpoints

| Path      | Method | Description                                |
| --------- | ------ | ------------------------------------------ |
| `/`       | WS     | Game stream (WebSocket upgrade)            |
| `/ws`     | WS     | Alias of `/`                               |
| `/health` | GET    | JSON health check (`status`, `clients`, …) |

## Wire types

All shapes live in [`@repo/types`](../../packages/types/src/index.ts).

Server → client (every `BROADCAST_INTERVAL_MS`):

```ts
GameSnapshot;
```

The server may also send tagged messages:

```ts
{
  type: "pong";
  t: number;
}
```

Client → server:

```ts
{
  type: "hello";
} // request a fresh snapshot
{
  type: "ping";
  t: number;
} // server replies with { type: "pong", t }
```

## Scripts

```bash
bun install
bun run dev            # bun src/index.ts
```

## Configuration

All knobs are environment variables. See `.env.example` for defaults. Notable
values:

- `PORT` — listen port (default 3001).
- `WORLD_WIDTH` / `WORLD_HEIGHT` — arena size in pixels.
- `MATCH_DURATION_MS` — length of one round (default 3 minutes).
- `INTERMISSION_MS` — pause between rounds (default 6 seconds).
- `TICK_INTERVAL_MS` — physics tick (default 16 ms = ~60 Hz).
- `BROADCAST_INTERVAL_MS` — snapshot push cadence (default 50 ms = 20 Hz).
- `FOOD_COUNT` — number of pellets in the world.
- `MAX_BODY_POINTS` — hard cap on snake length.
- `ALLOWED_ORIGINS` — comma-separated allowlist; unset means "any origin".

## Adding real agents

Each snake calls a `Strategy` once per tick. To swap the heuristic for a real
model, replace `heuristicStrategy` in `src/strategy.ts` (or branch by snake id
inside it). Strategies must be synchronous; if you need async inference,
decide every N ticks and cache the latest `targetAngle` between calls.
