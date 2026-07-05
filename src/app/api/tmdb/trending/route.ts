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
  window: z.enum(["day", "week"]).default("week"),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({
    type: searchParams.get("type") ?? undefined,
    window: searchParams.get("window") ?? undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid trending request." }, { status: 400 });
  }

  const { type, window } = parsed.data;
  const credentials = credentialsFromRequest(request);

  if (!hasCredentials(credentials)) {
    return NextResponse.json({ results: [], configured: false });
  }

  try {
    const data = (await tmdbFetch(`/trending/${type}/${window}`, {}, credentials)) as {
      results?: unknown[];
    };
    const results = (data.results ?? [])
      .map((item) => mapMediaItem(item as Parameters<typeof mapMediaItem>[0], type as MediaType))
      .filter((item) => item.poster);

    return NextResponse.json({ results, configured: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Trending request failed." },
      { status: 502 },
    );
  }
}
