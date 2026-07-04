import { NextResponse } from "next/server";
import { z } from "zod";

const searchSchema = z.object({
  q: z.string().trim().max(120).optional(),
  tmdbApiKey: z.string().trim().max(256).optional(),
  tmdbReadToken: z.string().trim().max(2048).optional(),
  includeFallback: z.boolean().optional(),
  safeSearch: z.boolean().optional(),
});

type SearchInput = z.infer<typeof searchSchema>;

type TmdbMovie = {
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
  adult?: boolean;
};

type TmdbResponse = {
  results?: TmdbMovie[];
};

const imageBase = "https://image.tmdb.org/t/p/w780";

const genres: Record<number, string> = {
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
  10402: "Music",
  10749: "Romance",
  10751: "Family",
  10752: "War",
};

const fallbackMovies = [
  {
    id: "curated-sintel",
    title: "Sintel",
    year: "2010",
    overview:
      "A cinematic open movie from the Blender Foundation. Use it to test playback, subtitle workflows, and community watch rooms.",
    poster: null,
    backdrop: "/assets/nickhub-hero.png",
    rating: 7.4,
    runtime: "15m",
    genres: ["Open movie", "Fantasy", "Demo stream"],
    source: "curated",
    sampleUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  },
  {
    id: "curated-bunny",
    title: "Big Buck Bunny",
    year: "2008",
    overview:
      "A bright open short film that is perfect for testing direct HTTPS playback and TV-friendly layouts.",
    poster: null,
    backdrop: "/assets/nickhub-community.png",
    rating: 7.1,
    runtime: "10m",
    genres: ["Open movie", "Family", "4K test"],
    source: "curated",
    sampleUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  },
  {
    id: "curated-tears",
    title: "Tears of Steel",
    year: "2012",
    overview:
      "A sci-fi open movie for validating resolver handoff, player controls, and cinematic detail panels.",
    poster: null,
    backdrop: "/assets/nickhub-addons.png",
    rating: 7.0,
    runtime: "12m",
    genres: ["Open movie", "Sci-fi", "Legal source"],
    source: "curated",
    sampleUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  },
];

function credentials(input: SearchInput) {
  return {
    apiKey: input.tmdbApiKey || process.env.TMDB_API_KEY || "",
    readToken: input.tmdbReadToken || process.env.TMDB_READ_TOKEN || "",
  };
}

function tmdbHeaders(readToken: string) {
  return readToken ? { Authorization: `Bearer ${readToken}` } : undefined;
}

function tmdbUrl(query: string, apiKey: string, safeSearch: boolean) {
  const url = new URL("https://api.themoviedb.org/3/search/movie");
  url.searchParams.set("query", query);
  url.searchParams.set("include_adult", safeSearch ? "false" : "true");
  url.searchParams.set("language", "en-US");
  url.searchParams.set("page", "1");

  if (apiKey) {
    url.searchParams.set("api_key", apiKey);
  }

  return url;
}

function yearFrom(value?: string) {
  return value?.slice(0, 4) || "";
}

function imageUrl(path?: string | null) {
  return path ? `${imageBase}${path}` : null;
}

function mapMovie(movie: TmdbMovie) {
  const title = movie.title || movie.name || "Untitled";

  return {
    id: `tmdb-${movie.id}`,
    title,
    year: yearFrom(movie.release_date || movie.first_air_date),
    overview: movie.overview || "No overview is available for this title yet.",
    poster: imageUrl(movie.poster_path),
    backdrop: imageUrl(movie.backdrop_path),
    rating: typeof movie.vote_average === "number" ? movie.vote_average : null,
    genres: movie.genre_ids?.map((id) => genres[id]).filter(Boolean).slice(0, 3) ?? ["Movie"],
    source: "tmdb" as const,
  };
}

function localFallback(query: string | undefined, includeFallback: boolean) {
  if (!includeFallback) {
    return [];
  }

  if (!query) {
    return fallbackMovies;
  }

  const normalized = query.toLowerCase();
  const filtered = fallbackMovies.filter((movie) =>
    movie.title.toLowerCase().includes(normalized) ||
    movie.genres.some((genre) => genre.toLowerCase().includes(normalized)),
  );

  return filtered.length ? filtered : fallbackMovies;
}

async function handleSearch(input: SearchInput) {
  const query = input.q;
  const includeFallback = input.includeFallback ?? true;
  const safeSearch = input.safeSearch ?? true;

  if (!query) {
    return NextResponse.json({ movies: localFallback(query, includeFallback), fallback: true });
  }

  const { apiKey, readToken } = credentials(input);
  if (!apiKey && !readToken) {
    return NextResponse.json({ movies: localFallback(query, includeFallback), fallback: true });
  }

  try {
    const response = await fetch(tmdbUrl(query, readToken ? "" : apiKey, safeSearch), {
      headers: tmdbHeaders(readToken),
      signal: AbortSignal.timeout(8000),
      next: readToken || apiKey !== process.env.TMDB_API_KEY ? undefined : { revalidate: 3600 },
    });

    if (!response.ok) {
      return NextResponse.json({ error: "Movie provider search failed." }, { status: 502 });
    }

    const data = (await response.json()) as TmdbResponse;
    const movies = (data.results ?? [])
      .filter((movie) => !safeSearch || !movie.adult)
      .slice(0, 18)
      .map(mapMovie);

    return NextResponse.json({ movies, fallback: false });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Movie search failed." },
      { status: 502 },
    );
  }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = searchSchema.safeParse({
    q: searchParams.get("q") ?? undefined,
    includeFallback: searchParams.get("includeFallback") !== "false",
    safeSearch: searchParams.get("safeSearch") !== "false",
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Search query is invalid." }, { status: 400 });
  }

  return handleSearch(parsed.data);
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = searchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Search request is invalid." }, { status: 400 });
  }

  return handleSearch(parsed.data);
}
