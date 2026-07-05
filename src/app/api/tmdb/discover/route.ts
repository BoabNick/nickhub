import { NextResponse } from "next/server";
import { z } from "zod";

import {
  credentialsFromRequest,
  hasCredentials,
  mapMediaItem,
  tmdbFetch,
  type MediaType,
} from "@/lib/tmdb";

const querySchema = z.object({
  type: z.enum(["movie", "tv"]).default("movie"),
  genre: z.coerce.number().int().positive().optional(),
  sort: z
    .enum(["popularity.desc", "vote_average.desc", "primary_release_date.desc", "revenue.desc"])
    .default("popularity.desc"),
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  page: z.coerce.number().int().min(1).max(500).default(1),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    type: searchParams.get("type") ?? undefined,
    genre: searchParams.get("genre") ?? undefined,
    sort: searchParams.get("sort") ?? undefined,
    year: searchParams.get("year") ?? undefined,
    page: searchParams.get("page") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid discover request." }, { status: 400 });
  }

  const { type, genre, sort, year, page } = parsed.data;
  const credentials = credentialsFromRequest(request);

  if (!hasCredentials(credentials)) {
    return NextResponse.json({ results: [], page: 1, totalPages: 0, configured: false });
  }

  // TMDB names the release-date sort differently for TV.
  const sortBy =
    type === "tv" && sort === "primary_release_date.desc" ? "first_air_date.desc" : sort;

  // vote_average sorts need a vote floor or a handful of obscure 10/10 titles win.
  const params: Record<string, string> = {
    sort_by: sortBy,
    include_adult: "false",
    page: String(page),
    "vote_count.gte": sort === "vote_average.desc" ? "200" : "0",
  };
  if (genre) params.with_genres = String(genre);
  if (year) params[type === "tv" ? "first_air_date_year" : "primary_release_year"] = String(year);

  try {
    const data = (await tmdbFetch(`/discover/${type}`, params, credentials)) as {
      results?: unknown[];
      page?: number;
      total_pages?: number;
    };
    const results = (data.results ?? [])
      .map((item) => mapMediaItem(item as Parameters<typeof mapMediaItem>[0], type as MediaType))
      .filter((item) => item.poster);

    return NextResponse.json({
      results,
      page: data.page ?? page,
      totalPages: Math.min(data.total_pages ?? 0, 500),
      configured: true,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Discover request failed." },
      { status: 502 },
    );
  }
}
