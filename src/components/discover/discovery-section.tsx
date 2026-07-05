"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";

import { fetchTmdb } from "@/lib/discover-client";
import type { MediaItem } from "@/lib/tmdb";

import { MediaCard } from "./media-card";

const rowCardClass = "w-[45%] shrink-0 sm:w-[30%] md:w-[22%] lg:w-[16%] xl:w-[13%]";

function RowSkeleton() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className={rowCardClass}>
          <div className="aspect-[2/3] w-full animate-pulse rounded-2xl border border-white/10 bg-white/[0.06]" />
        </div>
      ))}
    </>
  );
}

/**
 * A titled, horizontally-scrolling row that fetches its own `/api/tmdb/*`
 * endpoint. Used to compose the discovery hub from several rows.
 */
export function DiscoverySection({
  title,
  endpoint,
  href,
  apiKey,
}: {
  title: string;
  endpoint: string;
  href?: string;
  apiKey?: string | null;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetchTmdb<{ results: MediaItem[] }>(endpoint, apiKey, controller.signal)
      .then((data) => {
        setItems(data.results ?? []);
        setFailed(false);
      })
      .catch((error) => {
        if (!controller.signal.aborted) setFailed(true);
        if (error?.name !== "AbortError") console.error(`Failed to load "${title}"`, error);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, [endpoint, apiKey, title]);

  if (!loading && (failed || items.length === 0)) {
    return null;
  }

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-4">
        <h2 className="text-lg font-black tracking-tight text-white sm:text-xl">{title}</h2>
        {href ? (
          <Link
            href={href}
            className="flex items-center gap-0.5 text-sm font-bold text-violet-300 transition hover:text-violet-200"
          >
            See all <ChevronRight className="h-4 w-4" />
          </Link>
        ) : null}
      </div>

      <div className="flex snap-x gap-4 overflow-x-auto pb-2 [scrollbar-width:thin]">
        {loading ? (
          <RowSkeleton />
        ) : (
          items.map((item) => (
            <div key={item.id} className={`${rowCardClass} snap-start`}>
              <MediaCard item={item} />
            </div>
          ))
        )}
      </div>
    </section>
  );
}
