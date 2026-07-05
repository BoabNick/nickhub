"use client";

import { useState } from "react";

import { MediaFeed } from "@/components/discover/media-feed";
import { Segmented } from "@/components/discover/segmented";
import type { MediaType } from "@/lib/tmdb";
import { useUserSettings } from "@/hooks/use-user-settings";

type TimeWindow = "day" | "week";

export default function TrendingPage() {
  const { settings } = useUserSettings();
  const apiKey = settings?.tmdb_api_key ?? null;

  const [type, setType] = useState<MediaType>("movie");
  const [window, setWindow] = useState<TimeWindow>("week");

  const endpoint = `/api/tmdb/trending?type=${type}&window=${window}`;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">Trending</h1>
        <p className="text-sm text-slate-400">The titles everyone is watching right now.</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Segmented
          ariaLabel="Media type"
          value={type}
          onChange={setType}
          options={[
            { label: "Movies", value: "movie" },
            { label: "TV", value: "tv" },
          ]}
        />
        <Segmented
          ariaLabel="Time window"
          value={window}
          onChange={setWindow}
          options={[
            { label: "Today", value: "day" },
            { label: "This week", value: "week" },
          ]}
        />
      </div>

      <MediaFeed
        key={endpoint}
        endpoint={endpoint}
        apiKey={apiKey}
        emptyLabel="No trending titles right now. Add a TMDB key in settings if this looks empty."
      />
    </div>
  );
}
