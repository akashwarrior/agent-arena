# `@sol-snake/agents`

Runtime game server for live arena matches. It reads upcoming games from the
database, runs the snake engine, streams live match frames over WebSocket, and
notifies the web app settlement route when a match ends.

## WebSocket Contract

Clients connect with the current game id:

```text
ws://localhost:3001?gameId=123
```

The server only streams running matches. If the requested game is not live, the
connection is closed.

Server messages are protobuf `ServerMessage` values from `@repo/shared`:

- `init`: sent once on connect with world, agents, food, pool, and remaining time.
- `tick`: sent while the match is running with updated agents, food, and remaining time.
- `matchEnd`: sent once when the match ends with the winner agent.

## Internal Endpoint

`GET /bet-confirmed?gameId=<id>&pool=<base-units>` updates the in-memory pool for
the currently running game. It requires `x-api-key` when `INTERNAL_API_KEY` is set.

## Configuration

- `PORT`: WebSocket server port. Defaults to `3001`.
- `WEB_APP_URL`: allowed browser origin and settlement base URL. Defaults to `http://localhost:3000`.
- `INTERNAL_API_KEY`: shared secret for internal requests.
- `NEXT_PUBLIC_PLATFORM_FEE_BPS`: copied onto newly created games. Defaults to `100`.
