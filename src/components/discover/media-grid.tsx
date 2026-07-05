import type { MediaItem } from "@/lib/tmdb";

import { MediaCard } from "./media-card";

const gridClass =
  "grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6";

function SkeletonCard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04]">
      <div className="aspect-[2/3] w-full animate-pulse bg-white/[0.06]" />
      <div className="space-y-2 p-3">
        <div className="h-3 w-3/4 animate-pulse rounded bg-white/[0.08]" />
        <div className="h-2.5 w-1/2 animate-pulse rounded bg-white/[0.06]" />
      </div>
    </div>
  );
}

/** Responsive poster grid with a loading skeleton and empty state. */
export function MediaGrid({
  items,
  loading,
  skeletonCount = 12,
  emptyLabel = "Nothing to show here yet.",
}: {
  items: MediaItem[];
  loading?: boolean;
  skeletonCount?: number;
  emptyLabel?: string;
}) {
  if (loading && items.length === 0) {
    return (
      <div className={gridClass}>
        {Array.from({ length: skeletonCount }).map((_, index) => (
          <SkeletonCard key={index} />
        ))}
      </div>
    );
  }

  if (!loading && items.length === 0) {
    return (
      <p className="rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-center text-sm text-slate-400">
        {emptyLabel}
      </p>
    );
  }

  return (
    <div className={gridClass}>
      {items.map((item) => (
        <MediaCard key={item.id} item={item} />
      ))}
    </div>
  );
}
