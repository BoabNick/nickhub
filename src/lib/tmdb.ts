/**
 * Shared TMDB helpers for the discovery API routes.
 *
 * Credentials resolve per-request: a signed-in user's own TMDB key/read-token
 * (forwarded from the browser as headers) takes precedence, falling back to the
 * deployment-wide `TMDB_API_KEY` / `TMDB_READ_TOKEN` env vars. Responses are
 * normalised to the `MediaItem` shape the UI renders.
 */

export type MediaType = "movie" | "tv";

export interface MediaItem {
  id: string;
  tmdbId: number;
  mediaType: MediaType;
  title: string;
  year: string;
  overview: string;
  poster: string | null;
  backdrop: string | null;
  rating: number | null;
  genres: string[];
}

export interface TmdbCredentials {
  apiKey: string;
  readToken: string;
}

interface TmdbRawItem {
  id: number;
  title?: string;
  name?: string;
  release_date?: string;
  first_air_date?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  vote_average?: number;
  genre_ids?: number[];
  media_type?: string;
  adult?: boolean;
}

const POSTER_BASE = "https://image.tmdb.org/t/p/w500";
const BACKDROP_BASE = "https://image.tmdb.org/t/p/w780";

// Combined TMDB movie + TV genre ids, so a normalised item can label itself
// without a second round-trip.
const GENRES: Record<number, string> = {
  10759: "Action & Adventure",
  10762: "Kids",
  10763: "News",
  10764: "Reality",
  10765: "Sci-Fi & Fantasy",
  10766: "Soap",
  10767: "Talk",
  10768: "War & Politics",
  10751: "Family",
  10752: "War",
  10749: "Romance",
  10402: "Music",
  12: "Adventure",
  14: "Fantasy",
  16: "Animation",
  18: "Drama",
  27: "Horror",
  28: "Action",
  35: "Comedy",
  36: "History",
  37: "Western",
  53: "Thriller",
  80: "Crime",
  99: "Documentary",
  878: "Sci-Fi",
  9648: "Mystery",
};

/** Reads TMDB credentials from request headers, falling back to env vars. */
export function credentialsFromRequest(request: Request): TmdbCredentials {
  return {
    apiKey: request.headers.get("x-tmdb-api-key")?.trim() || process.env.TMDB_API_KEY || "",
    readToken:
      request.headers.get("x-tmdb-read-token")?.trim() || process.env.TMDB_READ_TOKEN || "",
  };
}

export function hasCredentials(credentials: TmdbCredentials) {
  return Boolean(credentials.apiKey || credentials.readToken);
}

/** Whether the resolved credentials came only from the deployment env vars. */
function usesEnvCredentials(credentials: TmdbCredentials) {
  return (
    credentials.apiKey === (process.env.TMDB_API_KEY || "") &&
    credentials.readToken === (process.env.TMDB_READ_TOKEN || "")
  );
}

function imageUrl(base: string, path?: string | null) {
  return path ? `${base}${path}` : null;
}

function yearFrom(value?: string) {
  return value?.slice(0, 4) || "";
}

export function mapMediaItem(raw: TmdbRawItem, fallbackType: MediaType): MediaItem {
  const mediaType: MediaType =
    raw.media_type === "movie" || raw.media_type === "tv" ? raw.media_type : fallbackType;

  return {
    id: `tmdb-${raw.id}`,
    tmdbId: raw.id,
    mediaType,
    title: raw.title || raw.name || "Untitled",
    year: yearFrom(raw.release_date || raw.first_air_date),
    overview: raw.overview || "No overview is available for this title yet.",
    poster: imageUrl(POSTER_BASE, raw.poster_path),
    backdrop: imageUrl(BACKDROP_BASE, raw.backdrop_path),
    rating: typeof raw.vote_average === "number" ? raw.vote_average : null,
    genres:
      raw.genre_ids
        ?.map((genreId) => GENRES[genreId])
        .filter(Boolean)
        .slice(0, 3) ?? [],
  };
}

/**
 * Calls a TMDB v3 endpoint with the resolved credentials. Responses backed by
 * the shared env key are cached for an hour; per-user requests are never cached.
 */
export async function tmdbFetch(
  path: string,
  searchParams: Record<string, string>,
  credentials: TmdbCredentials,
): Promise<unknown> {
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  url.searchParams.set("language", "en-US");
  for (const [key, value] of Object.entries(searchParams)) {
    if (value) url.searchParams.set(key, value);
  }

  // Prefer the read token (Bearer); otherwise fall back to the api_key query.
  if (!credentials.readToken && credentials.apiKey) {
    url.searchParams.set("api_key", credentials.apiKey);
  }

  const response = await fetch(url, {
    headers: credentials.readToken ? { Authorization: `Bearer ${credentials.readToken}` } : undefined,
    signal: AbortSignal.timeout(8000),
    next: usesEnvCredentials(credentials) ? { revalidate: 3600 } : undefined,
  });

  if (!response.ok) {
    throw new Error(`TMDB request failed (${response.status}).`);
  }

  return response.json();
}
