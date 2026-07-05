import { ExternalLink, Star } from "lucide-react";

import type { MediaItem } from "@/lib/tmdb";

/**
 * A single poster tile. Links out to the title's TMDB page (no in-app detail
 * view exists yet), and degrades to a text card when no poster is available.
 */
export function MediaCard({ item }: { item: MediaItem }) {
  return (
    <a
      href={`https://www.themoviedb.org/${item.mediaType}/${item.tmdbId}`}
      target="_blank"
      rel="noreferrer"
      className="group relative block overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] shadow-lg shadow-black/30 transition hover:border-violet-300/40 hover:shadow-violet-950/30"
    >
      <div className="relative aspect-[2/3] w-full overflow-hidden bg-black/40">
        {item.poster ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote TMDB host isn't configured for next/image
          <img
            src={item.poster}
            alt={`${item.title} poster`}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center p-3 text-center text-sm font-semibold text-slate-300">
            {item.title}
          </div>
        )}

        {item.rating ? (
          <div className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[0.7rem] font-black text-white backdrop-blur-md">
            <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
            {item.rating.toFixed(1)}
          </div>
        ) : null}

        <div className="pointer-events-none absolute inset-0 flex items-end bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 transition group-hover:opacity-100">
          <span className="flex items-center gap-1 p-3 text-xs font-bold text-white">
            View on TMDB <ExternalLink className="h-3 w-3" />
          </span>
        </div>
      </div>

      <div className="space-y-0.5 p-3">
        <p className="truncate text-sm font-bold text-white">{item.title}</p>
        <p className="text-xs text-slate-400">
          {[item.year, item.genres[0]].filter(Boolean).join(" · ") || "—"}
        </p>
      </div>
    </a>
  );
}
