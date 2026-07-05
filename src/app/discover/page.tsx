"use client";

import Link from "next/link";
import { Sparkles } from "lucide-react";
import { useEffect, useState } from "react";

import { DiscoverySection } from "@/components/discover/discovery-section";
import { GenreChips } from "@/components/discover/genre-chips";
import { fetchTmdb, type TrendingResponse } from "@/lib/discover-client";
import { useUserSettings } from "@/hooks/use-user-settings";

export default function DiscoverPage() {
  const { settings } = useUserSettings();
  const apiKey = settings?.tmdb_api_key ?? null;

  // Probe once to tell "no TMDB key configured" apart from "genuinely empty".
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    fetchTmdb<TrendingResponse>(
      "/api/tmdb/trending?type=movie&window=week",
      apiKey,
      controller.signal,
    )
      .then((data) => setConfigured(data.configured))
      .catch((error) => {
        if (error?.name !== "AbortError") setConfigured(false);
      });

    return () => controller.abort();
  }, [apiKey]);

  return (
    <div className="space-y-10">
      <div className="space-y-2">
        <h1 className="flex items-center gap-2 text-3xl font-black tracking-tight">
          <Sparkles className="h-7 w-7 text-violet-300" />
          Discover
        </h1>
        <p className="text-sm text-slate-400">
          Trending titles, popular picks, and genres — powered by TMDB.
        </p>
      </div>

      {configured === false ? (
        <div className="rounded-[2rem] border border-violet-300/20 bg-violet-500/10 p-6">
          <h2 className="text-lg font-black">Connect TMDB to start discovering</h2>
          <p className="mt-1 text-sm text-slate-300">
            Add your TMDB API key in settings (or set <code>TMDB_API_KEY</code> on the server) to
            load trending and popular titles.
          </p>
          <Link
            href="/settings"
            className="mt-4 inline-flex rounded-full bg-violet-500 px-5 py-2 text-sm font-black text-white transition hover:bg-violet-400"
          >
            Open settings
          </Link>
        </div>
      ) : (
        <>
          <DiscoverySection
            title="Trending this week"
            endpoint="/api/tmdb/trending?type=movie&window=week"
            href="/discover/trending"
            apiKey={apiKey}
          />
          <DiscoverySection
            title="Popular movies"
            endpoint="/api/tmdb/discover?type=movie&sort=popularity.desc"
            apiKey={apiKey}
          />
          <DiscoverySection
            title="Popular shows"
            endpoint="/api/tmdb/discover?type=tv&sort=popularity.desc"
            apiKey={apiKey}
          />
          <DiscoverySection
            title="Top rated movies"
            endpoint="/api/tmdb/discover?type=movie&sort=vote_average.desc"
            apiKey={apiKey}
          />

          <section className="space-y-3">
            <h2 className="text-lg font-black tracking-tight sm:text-xl">Browse by genre</h2>
            <GenreChips type="movie" apiKey={apiKey} />
          </section>
        </>
      )}
    </div>
  );
}
