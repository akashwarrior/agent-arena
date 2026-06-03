import { NextRequest, NextResponse } from "next/server";
import { GameStatus, prisma } from "@repo/db";
import type { Prisma } from "@repo/db";
import { z } from "zod";
import {
  gameListSelect,
  normalizeGameListItem,
  type GamesResponse,
} from "@/lib/api-types";

const PAGE_SIZE = 15;
const MAX_PAGE_SIZE = 50;
const GAME_STATUSES = Object.values(GameStatus) as [
  GameStatus,
  ...GameStatus[],
];
const gameStatusSchema = z.enum(GAME_STATUSES);

const statusQuerySchema = z
  .array(z.string())
  .transform((status) =>
    status
      .flatMap((status) => status.split(","))
      .map((status) => status.trim())
      .filter(Boolean)
  )
  .pipe(z.array(gameStatusSchema))
  .transform((status) => Array.from(new Set(status)));

const querySchema = z.object({
  cursor: z.coerce.number().int().positive().nullable(),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .catch(PAGE_SIZE)
    .default(PAGE_SIZE)
    .transform((limit) => Math.min(limit, MAX_PAGE_SIZE)),
  status: statusQuerySchema,
});

function parseQuery(searchParams: URLSearchParams) {
  return querySchema.safeParse({
    cursor: searchParams.get("cursor"),
    limit: searchParams.get("limit"),
    status: searchParams.getAll("status"),
  });
}

export async function GET(request: NextRequest) {
  const query = parseQuery(request.nextUrl.searchParams);

  if (!query.success) {
    return NextResponse.json(
      {
        error: "Invalid query parameters",
        issues: query.error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 }
    );
  }

  const { cursor, limit, status } = query.data;

  const where: Prisma.GameWhereInput = {};
  if (status.length > 0) {
    where.status = { in: status };
  }

  const games = await prisma.game.findMany({
    where,
    take: limit + 1,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: {
      id: "asc",
    },
    select: gameListSelect,
  });

  let nextCursor: number | null = null;
  if (games.length > limit) {
    const nextItem = games.pop();
    nextCursor = nextItem!.id;
  }

  const response: GamesResponse = {
    games: games.map(normalizeGameListItem),
    nextCursor,
  };

  return NextResponse.json(response);
}
