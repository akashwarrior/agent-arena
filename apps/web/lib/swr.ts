import type { GameStatus } from "@repo/db";
import useSWR from "swr";
import useSWRInfinite from "swr/infinite";
import type {
  GamesResponse,
  GameDetailResponse,
  BetConfirmationResponse,
  PaymentInitResponse,
} from "@/lib/api-types";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }
  return res.json();
};

export function useGames(statusFilters: GameStatus[]) {
  const { data, error, isLoading, size, setSize, isValidating, mutate } =
    useSWRInfinite<GamesResponse>(
      (pageIdx, previousPageData) => {
        const cursor = pageIdx === 0 ? null : previousPageData?.nextCursor;
        const params = new URLSearchParams();
        if (cursor) params.set("cursor", cursor);
        params.set("limit", "15");
        for (const status of statusFilters) {
          params.append("status", status);
        }
        return `/api/games?${params.toString()}`;
      },
      fetcher,
      { refreshInterval: 5000 }
    );

  const games = data ? data.flatMap((page) => page.games) : [];
  const hasMore = data ? data[data.length - 1]?.nextCursor !== null : true;
  const isLoadingMore =
    isLoading || (size > 0 && data && typeof data[size - 1] === "undefined");

  return {
    games,
    hasMore: !!hasMore,
    isLoading,
    isLoadingMore: !!isLoadingMore,
    isValidating,
    error,
    loadMore: () => setSize(size + 1),
    mutate,
  };
}

export function useGameDetail(gameId: number) {
  const { data, error, isLoading, mutate } = useSWR<GameDetailResponse>(
    `/api/games/${gameId}`,
    fetcher,
    {
      revalidateOnFocus: false,
      refreshInterval(data) {
        if (data?.game.status === "ENDED") {
          return 2000;
        } else if (data?.game.status === "LIVE") {
          return 5000;
        } else if (data?.game.status === "UPCOMING" && data.game.startedAt) {
          return (new Date(data.game.startedAt).getTime() - new Date().getTime());
        }
        return 0;
      },
    }
  );

  return {
    game: data!.game,
    userBets: data?.userBets ?? [],
    isLoading,
    error,
    mutate,
  };
}

export async function createBetDepositPayment(
  gameId: number,
  agentId: string,
  amount: number,
  walletAddress: string
): Promise<PaymentInitResponse> {
  const res = await fetch("/api/payments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ gameId, agentId, amount, walletAddress }),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ error: "Failed to initiate bet" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export async function confirmBetDepositPayment(
  paymentId: string,
  txHash: string
): Promise<BetConfirmationResponse> {
  const res = await fetch(`/api/payments/${paymentId}/confirmation`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      txHash,
    }),
  });

  if (!res.ok) {
    const error = await res
      .json()
      .catch(() => ({ error: "Failed to confirm bet" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}
