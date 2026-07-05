import { NextResponse } from "next/server";
import { z } from "zod";

import { credentialsFromRequest, hasCredentials, tmdbFetch } from "@/lib/tmdb";

const querySchema = z.object({
  type: z.enum(["movie", "tv"]).default("movie"),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = querySchema.safeParse({ type: searchParams.get("type") ?? undefined });

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid genres request." }, { status: 400 });
  }

  const { type } = parsed.data;
  const credentials = credentialsFromRequest(request);

  if (!hasCredentials(credentials)) {
    return NextResponse.json({ genres: [], configured: false });
  }

  try {
    const data = (await tmdbFetch(`/genre/${type}/list`, {}, credentials)) as {
      genres?: { id: number; name: string }[];
    };

    return NextResponse.json({ genres: data.genres ?? [], configured: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Genres request failed." },
      { status: 502 },
    );
  }
}
