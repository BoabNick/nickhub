"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, use, useEffect, useState } from "react";

import { MediaFeed } from "@/components/discover/media-feed";
import { MediaGrid } from "@/components/discover/media-grid";
import { Segmented } from "@/components/discover/segmented";
import { fetchTmdb, type GenresResponse } from "@/lib/discover-client";
import type { MediaType } from "@/lib/tmdb";
import { useUserSettings } from "@/hooks/use-user-settings";

type Sort = "popularity.desc" | "vote_average.desc" | "primary_release_date.desc";

export default function GenrePage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense fallback={<MediaGrid items={[]} loading />}>
      <GenreBrowser params={params} />
    </Suspense>
  );
}

function GenreBrowser({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const genreId = Number(id);
  const searchParams = useSearchParams();
  const type: MediaType = searchParams.get("type") === "tv" ? "tv" : "movie";

  const { settings } = useUserSettings();
  const apiKey = settings?.tmdb_api_key ?? null;

  const [sort, setSort] = useState<Sort>("popularity.desc");
  const [genreName, setGenreName] = useState("");

  useEffect(() => {
    const controller = new AbortController();

    fetchTmdb<GenresResponse>(`/api/tmdb/genres?type=${type}`, apiKey, controller.signal)
      .then((data) => {
        setGenreName(data.genres.find((genre) => genre.id === genreId)?.name ?? "");
      })
      .catch((error) => {
        if (error?.name !== "AbortError") console.error("Failed to resolve genre", error);
      });

    return () => controller.abort();
  }, [type, genreId, apiKey]);

  const endpoint = `/api/tmdb/discover?type=${type}&genre=${genreId}&sort=${sort}`;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <p className="text-sm font-bold uppercase tracking-wider text-violet-300">
          {type === "tv" ? "TV genre" : "Movie genre"}
        </p>
        <h1 className="text-3xl font-black tracking-tight">{genreName || "Genre"}</h1>
      </div>

      <Segmented
        ariaLabel="Sort by"
        value={sort}
        onChange={setSort}
        options={[
          { label: "Popular", value: "popularity.desc" },
          { label: "Top rated", value: "vote_average.desc" },
          { label: "Newest", value: "primary_release_date.desc" },
        ]}
      />

      <MediaFeed
        key={endpoint}
        endpoint={endpoint}
        apiKey={apiKey}
        paginate
        emptyLabel="No titles found for this genre yet."
      />
    </div>
  );
}
