"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { fetchTmdb, type GenresResponse } from "@/lib/discover-client";
import type { MediaType } from "@/lib/tmdb";

/** Fetches the genre list for a media type and links each to its browse page. */
export function GenreChips({
  type,
  apiKey,
  activeId,
}: {
  type: MediaType;
  apiKey?: string | null;
  activeId?: number;
}) {
  const [genres, setGenres] = useState<{ id: number; name: string }[]>([]);

  useEffect(() => {
    const controller = new AbortController();

    fetchTmdb<GenresResponse>(`/api/tmdb/genres?type=${type}`, apiKey, controller.signal)
      .then((data) => setGenres(data.genres ?? []))
      .catch((error) => {
        if (error?.name !== "AbortError") console.error("Failed to load genres", error);
      });

    return () => controller.abort();
  }, [type, apiKey]);

  if (genres.length === 0) {
    return null;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((genre) => {
        const active = genre.id === activeId;
        return (
          <Link
            key={genre.id}
            href={`/discover/genre/${genre.id}?type=${type}`}
            className={`rounded-full border px-3 py-1 text-sm font-semibold transition ${
              active
                ? "border-violet-300/50 bg-violet-500/30 text-white"
                : "border-white/10 bg-white/[0.05] text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
          >
            {genre.name}
          </Link>
        );
      })}
    </div>
  );
}
