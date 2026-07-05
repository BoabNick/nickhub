import type { MediaItem } from "@/lib/tmdb";

/**
 * Browser-side helpers for the `/api/tmdb/*` routes. The signed-in user's TMDB
 * key (from their settings) is forwarded as a header so the server can use it;
 * when absent the server falls back to the deployment env key.
 */

export interface DiscoverResponse {
  results: MediaItem[];
  page: number;
  totalPages: number;
  configured: boolean;
}

export interface TrendingResponse {
  results: MediaItem[];
  configured: boolean;
}

export interface GenresResponse {
  genres: { id: number; name: string }[];
  configured: boolean;
}

function tmdbHeaders(apiKey?: string | null): HeadersInit | undefined {
  return apiKey ? { "x-tmdb-api-key": apiKey } : undefined;
}

export async function fetchTmdb<T>(
  path: string,
  apiKey?: string | null,
  signal?: AbortSignal,
): Promise<T> {
  const response = await fetch(path, { headers: tmdbHeaders(apiKey), signal });
  if (!response.ok) {
    throw new Error(`Request failed (${response.status}).`);
  }
  return (await response.json()) as T;
}
