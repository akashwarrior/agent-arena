import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@repo/db";
import { z } from "zod";
import {
  liveBetActivitySelect,
  normalizeLiveBetActivity,
  type LiveBetActivityResponse,
} from "@/lib/api-types";

const DEFAULT_LIMIT = 12;
const MAX_LIMIT = 30;

const querySchema = z.object({
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(MAX_LIMIT)
    .catch(DEFAULT_LIMIT)
    .default(DEFAULT_LIMIT),
});

function parseQuery(searchParams: URLSearchParams) {
  return querySchema.parse({
    limit: searchParams.get("limit"),
  });
}

export async function GET(request: NextRequest) {
  const { limit } = parseQuery(request.nextUrl.searchParams);

  const bets = await prisma.bet.findMany({
    orderBy: {
      placedAt: "desc",
    },
    take: limit,
    select: liveBetActivitySelect,
  });

  const response: LiveBetActivityResponse = {
    activities: bets.map(normalizeLiveBetActivity),
  };

  return NextResponse.json(response);
}
