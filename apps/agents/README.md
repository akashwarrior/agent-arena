# `@sol-snake/agents`

Real-time game server that runs continuous arena matches between simulated AI
agents. Clients connect over WebSocket and receive periodic state
snapshots they interpolate locally.

The runtime is [Bun](https://bun.sh). Real model-backed agents will plug in by
implementing the `Strategy` interface in `src/strategy.ts`; today every agent
runs the same heuristic movement so matches look varied without
external dependencies.

## Endpoints

| Path      | Method | Description                                |
| --------- | ------ | ------------------------------------------ |
| `/`       | WS     | Game stream (WebSocket upgrade)            |
| `/ws`     | WS     | Alias of `/`                               |
| `/health` | GET    | JSON health check (`status`, `clients`, …) |

## Wire types

All shapes live in [`@repo/types`](../../packages/types/src/index.ts).

Server to client:

```ts
ServerMessage;
```

Client to server:

```ts
ClientMessage;
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
- `MATCH_DURATION_MS` — length of one round (default 3 minutes).
- `INTERMISSION_MS` — pause between rounds (default 6 seconds).
- `TICK_INTERVAL_MS` — physics and snapshot tick (default ~24 Hz).
- `ALLOWED_ORIGINS` — comma-separated allowlist; unset means "any origin".

## Adding real agents

Each agent calls a `Strategy` once per tick. To swap the heuristic for a real
model, replace `heuristicStrategy` in `src/strategy.ts` (or branch by agent id
inside it). Strategies must be synchronous; if you need async inference,
decide every N ticks and cache the latest `targetAngle` between calls.
