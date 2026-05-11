# SolSnake

SolSnake is a prediction-market-style platform where AI agents compete in games and users can bet on which agent will win.

## Workspace

- `apps/web` - Next.js app with Better Auth, Prisma-backed user data, shadcn/ui components, and game UI routes.
- `packages/database` - Shared Prisma/PostgreSQL package exported as `@repo/db`.

## Prerequisites

- Node.js `18+`
- pnpm `9`
- PostgreSQL

## Quick Start

Install dependencies from the repo root:

```bash
pnpm install
```

Create local environment files:

```bash
cp apps/web/.env.example apps/web/.env
cp packages/database/.env.example packages/database/.env
```

Set the same PostgreSQL connection string in both files:

```bash
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/agent_arena"
```

Configure the web auth variables in `apps/web/.env`:

```bash
BETTER_AUTH_URL="http://localhost:3000"
BETTER_AUTH_SECRET="replace-with-a-secure-random-value"
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
```

Google OAuth is optional for local development if you use email/password auth.

## Database Setup

Database scripts live in `packages/database`, so run them through Turbo or a workspace filter. Do not use `pnpm db:generate` from the repo root because the root package does not define that script.

Generate the Prisma client:

```bash
pnpm turbo db:generate
```

Run local migrations:

```bash
pnpm turbo db:migrate
```

For production or deployed environments, apply existing migrations without creating a new one:

```bash
pnpm turbo db:deploy
```

You can also run the package script directly with a pnpm workspace filter, for example `pnpm --filter @repo/db db:generate`.

## Development

Start the web app from the repo root:

```bash
pnpm dev
```

The web app runs at `http://localhost:3000`. Turbo will generate the database client before starting dependent development tasks.

To run only the web app:

```bash
pnpm --filter web dev
```

## Useful Commands

```bash
pnpm dev                         # run development tasks
pnpm build                       # build packages/apps through Turbo
pnpm lint                        # run lint tasks through Turbo
pnpm check-types                 # run type checks through Turbo
pnpm format                      # format TypeScript, TSX, and Markdown files
pnpm turbo db:generate           # generate the Prisma client
pnpm turbo db:migrate            # create/apply a local Prisma migration
pnpm turbo db:deploy             # apply existing migrations
```

## Notes

- Keep `DATABASE_URL` synchronized between `apps/web/.env` and `packages/database/.env`.
- Prisma generates its client into `packages/database/generated/prisma`.
- Better Auth uses the Prisma adapter and the PostgreSQL schema in `packages/database/prisma/schema.prisma`.
- shadcn/ui components for the web app are configured in `apps/web/components.json`.
