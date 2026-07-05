"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

import { fetchTmdb, type DiscoverResponse } from "@/lib/discover-client";
import type { MediaItem } from "@/lib/tmdb";

import { MediaGrid } from "./media-grid";

function withPage(endpoint: string, page: number) {
  return `${endpoint}${endpoint.includes("?") ? "&" : "?"}page=${page}`;
}

/**
 * Fetches a paged `/api/tmdb/*` list and renders it as a grid with an optional
 * "Load more" button. Callers remount this via a `key` to reset when filters
 * change, so the mount effect never has to reset state synchronously.
 */
export function MediaFeed({
  endpoint,
  apiKey,
  paginate = false,
  emptyLabel,
}: {
  endpoint: string;
  apiKey?: string | null;
  paginate?: boolean;
  emptyLabel?: string;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetchTmdb<DiscoverResponse>(withPage(endpoint, 1), apiKey, controller.signal)
      .then((data) => {
        setItems(data.results ?? []);
        setTotalPages(data.totalPages ?? 0);
      })
      .catch((error) => {
        if (error?.name !== "AbortError") console.error("Failed to load feed", error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [endpoint, apiKey]);

  const loadMore = async () => {
    const next = page + 1;
    setLoadingMore(true);
    try {
      const data = await fetchTmdb<DiscoverResponse>(withPage(endpoint, next), apiKey);
      setItems((prev) => [...prev, ...(data.results ?? [])]);
      setPage(next);
    } catch (error) {
      console.error("Failed to load more", error);
    } finally {
      setLoadingMore(false);
    }
  };

  return (
    <div className="space-y-6">
      <MediaGrid items={items} loading={loading} emptyLabel={emptyLabel} />

      {paginate && !loading && page < totalPages ? (
        <div className="flex justify-center">
          <button
            type="button"
            onClick={loadMore}
            disabled={loadingMore}
            className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-white/10 disabled:opacity-60"
          >
            {loadingMore ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loadingMore ? "Loading..." : "Load more"}
          </button>
        </div>
      ) : null}
    </div>
  );
}
