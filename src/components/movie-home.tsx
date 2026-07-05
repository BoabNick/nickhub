"use client";

import Image from "next/image";
import Link from "next/link";
import {
  BadgeCheck,
  Clapperboard,
  CirclePlay,
  CloudLightning,
  Copy,
  ExternalLink,
  Info,
  KeyRound,
  Magnet,
  MonitorPlay,
  Play,
  PlugZap,
  Search,
  Server,
  Settings2,
  Video,
  WandSparkles,
} from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { DiscoverySection } from "@/components/discover/discovery-section";
import { GenreChips } from "@/components/discover/genre-chips";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

type Movie = {
  id: string;
  title: string;
  year: string;
  overview: string;
  poster: string | null;
  backdrop: string | null;
  rating: number | null;
  runtime?: string;
  genres: string[];
  source: "tmdb" | "curated";
  sampleUrl?: string;
};

type ResolveResult = {
  provider: string;
  mode: string;
  status: string;
  streamUrl?: string;
  transferId?: string;
  dashboardUrl?: string;
  message?: string;
};

type AppSettings = {
  appName: string;
  profileName: string;
  metadataMode: "server" | "apiKey" | "readToken";
  tmdbApiKey: string;
  tmdbReadToken: string;
  defaultProvider: string;
  debridTokens: Record<string, string>;
  defaultSource: string;
  autoplayResolved: boolean;
  showOpenDemoTitles: boolean;
  safeSearch: boolean;
  addonManifests: string;
};

const settingsKey = "nickhub-settings-v2";

const debridProviders = [
  { id: "real-debrid", name: "Real-Debrid", env: "REAL_DEBRID_TOKEN" },
  { id: "all-debrid", name: "AllDebrid", env: "ALLDEBRID_TOKEN" },
  { id: "premiumize", name: "Premiumize", env: "PREMIUMIZE_TOKEN" },
  { id: "debrid-link", name: "Debrid-Link", env: "DEBRID_LINK_TOKEN" },
  { id: "offcloud", name: "Offcloud", env: "OFFCLOUD_TOKEN" },
];

const defaultDebridTokens = debridProviders.reduce<Record<string, string>>((tokens, provider) => {
  tokens[provider.id] = "";
  return tokens;
}, {});

const defaultSettings: AppSettings = {
  appName: "Nickhub",
  profileName: "Private room",
  metadataMode: "server",
  tmdbApiKey: "",
  tmdbReadToken: "",
  defaultProvider: "real-debrid",
  debridTokens: defaultDebridTokens,
  defaultSource: "",
  autoplayResolved: true,
  showOpenDemoTitles: true,
  safeSearch: true,
  addonManifests: "https://v3-cinemeta.strem.io/manifest.json\nhttps://opensubtitles-v3.strem.io/manifest.json",
};

const curatedMovies: Movie[] = [
  {
    id: "curated-sintel",
    title: "Sintel",
    year: "2010",
    overview:
      "A cinematic open movie from the Blender Foundation. Use it to test playback, subtitle workflows, and community watch rooms.",
    poster: null,
    backdrop: "/assets/nickhub-hero.png",
    rating: 7.4,
    runtime: "15m",
    genres: ["Open movie", "Fantasy", "Demo stream"],
    source: "curated",
    sampleUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/Sintel.mp4",
  },
  {
    id: "curated-bunny",
    title: "Big Buck Bunny",
    year: "2008",
    overview:
      "A bright open short film that is perfect for testing direct HTTPS playback and TV-friendly layouts.",
    poster: null,
    backdrop: "/assets/nickhub-community.png",
    rating: 7.1,
    runtime: "10m",
    genres: ["Open movie", "Family", "4K test"],
    source: "curated",
    sampleUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
  },
  {
    id: "curated-tears",
    title: "Tears of Steel",
    year: "2012",
    overview:
      "A sci-fi open movie for validating resolver handoff, player controls, and cinematic detail panels.",
    poster: null,
    backdrop: "/assets/nickhub-addons.png",
    rating: 7.0,
    runtime: "12m",
    genres: ["Open movie", "Sci-fi", "Legal source"],
    source: "curated",
    sampleUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4",
  },
  {
    id: "curated-dream",
    title: "Elephants Dream",
    year: "2006",
    overview:
      "An atmospheric open film for testing metadata discovery, private libraries, and server-side source resolving.",
    poster: null,
    backdrop: "/assets/nickhub-icons.png",
    rating: 6.8,
    runtime: "11m",
    genres: ["Open movie", "Classic", "Library"],
    source: "curated",
    sampleUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
  },
];

function mergeSettings(value: unknown): AppSettings {
  if (!value || typeof value !== "object") {
    return defaultSettings;
  }

  const partial = value as Partial<AppSettings>;

  return {
    ...defaultSettings,
    ...partial,
    debridTokens: {
      ...defaultSettings.debridTokens,
      ...(partial.debridTokens ?? {}),
    },
  };
}

function posterFallback(movie: Movie) {
  return movie.backdrop ?? "/assets/nickhub-hero.png";
}

function isDirectPlayableUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:";
  } catch {
    return false;
  }
}

function tokenForProvider(settings: AppSettings, providerId: string) {
  return settings.debridTokens[providerId] ?? "";
}

export function MovieHome() {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [draftSettings, setDraftSettings] = useState<AppSettings>(defaultSettings);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>(curatedMovies);
  const [activeMovie, setActiveMovie] = useState<Movie>(curatedMovies[0]);
  const [isSearching, setIsSearching] = useState(false);
  const [sourceInput, setSourceInput] = useState("");
  const [provider, setProvider] = useState(defaultSettings.defaultProvider);
  const [token, setToken] = useState("");
  const [playerUrl, setPlayerUrl] = useState(curatedMovies[0].sampleUrl ?? "");
  const [resolveResult, setResolveResult] = useState<ResolveResult | null>(null);
  const [isResolving, setIsResolving] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(settingsKey);
    if (!stored) {
      return;
    }

    try {
      const nextSettings = mergeSettings(JSON.parse(stored));
      setSettings(nextSettings);
      setDraftSettings(nextSettings);
      setProvider(nextSettings.defaultProvider);
      setToken(tokenForProvider(nextSettings, nextSettings.defaultProvider));
      setSourceInput(nextSettings.defaultSource);
    } catch {
      window.localStorage.removeItem(settingsKey);
    }
  }, []);

  const featuredBackdrop = activeMovie.backdrop ?? "/assets/nickhub-hero.png";
  const selectedProvider = useMemo(
    () => debridProviders.find((item) => item.id === provider) ?? debridProviders[0],
    [provider],
  );

  const configuredAddonCount = useMemo(
    () => settings.addonManifests.split("\n").map((line) => line.trim()).filter(Boolean).length,
    [settings.addonManifests],
  );

  // The discovery rows only forward a raw TMDB API key header; a read-token
  // credential falls back to the server's own TMDB env vars if configured.
  const tmdbApiKeyForDiscovery = settings.metadataMode === "apiKey" ? settings.tmdbApiKey : undefined;

  const updateDraft = <Key extends keyof AppSettings>(key: Key, value: AppSettings[Key]) => {
    setDraftSettings((current) => ({ ...current, [key]: value }));
  };

  const updateDraftDebridToken = (providerId: string, value: string) => {
    setDraftSettings((current) => ({
      ...current,
      debridTokens: {
        ...current.debridTokens,
        [providerId]: value,
      },
    }));
  };

  const openSettings = () => {
    setDraftSettings(settings);
    setSettingsOpen(true);
  };

  const saveSettings = () => {
    const normalized = mergeSettings(draftSettings);
    setSettings(normalized);
    setProvider(normalized.defaultProvider);
    setToken(tokenForProvider(normalized, normalized.defaultProvider));
    setSourceInput(normalized.defaultSource);
    window.localStorage.setItem(settingsKey, JSON.stringify(normalized));
    setSettingsOpen(false);
    toast.success("Settings saved", {
      description: "Your preferences are stored in this browser.",
    });
  };

  const resetSettings = () => {
    setDraftSettings(defaultSettings);
    setSettings(defaultSettings);
    setProvider(defaultSettings.defaultProvider);
    setToken("");
    setSourceInput("");
    window.localStorage.removeItem(settingsKey);
    toast.success("Settings reset");
  };

  const selectProvider = (providerId: string) => {
    setProvider(providerId);
    setToken(tokenForProvider(settings, providerId));
  };

  const searchMovies = async (event?: FormEvent<HTMLFormElement>) => {
    event?.preventDefault();
    const trimmed = query.trim();

    if (!trimmed) {
      const nextMovies = settings.showOpenDemoTitles ? curatedMovies : [];
      setMovies(nextMovies);
      if (nextMovies[0]) {
        setActiveMovie(nextMovies[0]);
      }
      toast.info("Showing local titles", {
        description: "Type a movie name to search your metadata provider.",
      });
      return;
    }

    setIsSearching(true);
    try {
      const tmdbApiKey = settings.metadataMode === "apiKey" ? settings.tmdbApiKey : "";
      const tmdbReadToken = settings.metadataMode === "readToken" ? settings.tmdbReadToken : "";
      const response = await fetch("/api/movies/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: trimmed,
          tmdbApiKey,
          tmdbReadToken,
          includeFallback: settings.showOpenDemoTitles,
          safeSearch: settings.safeSearch,
        }),
      });
      const payload = (await response.json()) as { movies?: Movie[]; error?: string; fallback?: boolean };

      if (!response.ok) {
        throw new Error(payload.error ?? "Movie search failed.");
      }

      const nextMovies = payload.movies?.length ? payload.movies : settings.showOpenDemoTitles ? curatedMovies : [];
      setMovies(nextMovies);
      if (nextMovies[0]) {
        setActiveMovie(nextMovies[0]);
        setPlayerUrl(nextMovies[0].sampleUrl ?? "");
      }
      setResolveResult(null);

      if (payload.fallback) {
        toast.info("Showing local results", {
          description: "Add a TMDB key in Settings or configure one on the server for full movie search.",
        });
      } else {
        toast.success(`Found ${nextMovies.length} movie${nextMovies.length === 1 ? "" : "s"}`);
      }
    } catch (error) {
      toast.error("Search failed", {
        description: error instanceof Error ? error.message : "Try again later.",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const chooseMovie = (movie: Movie) => {
    setActiveMovie(movie);
    setPlayerUrl(movie.sampleUrl ?? "");
    setResolveResult(null);
  };

  const playDemo = () => {
    if (!activeMovie.sampleUrl) {
      toast.info("No bundled stream for this title", {
        description: "Paste an authorized direct link, magnet, or debrid-supported source below.",
      });
      return;
    }

    setPlayerUrl(activeMovie.sampleUrl);
    toast.success(`Playing ${activeMovie.title}`);
  };

  const playDirect = () => {
    const trimmed = sourceInput.trim();
    if (!isDirectPlayableUrl(trimmed)) {
      toast.error("Paste a secure HTTPS media URL first.");
      return;
    }

    setPlayerUrl(trimmed);
    setResolveResult({
      provider: "direct",
      mode: "link",
      status: "Direct source loaded in player",
      streamUrl: trimmed,
    });
  };

  const resolveSource = async () => {
    const trimmed = sourceInput.trim();
    if (!trimmed) {
      toast.error("Paste a legal magnet URI or HTTPS source first.");
      return;
    }

    setIsResolving(true);
    setResolveResult(null);
    try {
      const response = await fetch("/api/debrid/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider, token, input: trimmed }),
      });
      const payload = (await response.json()) as ResolveResult & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Resolver failed.");
      }

      setResolveResult(payload);
      if (payload.streamUrl && settings.autoplayResolved) {
        setPlayerUrl(payload.streamUrl);
        toast.success("Stream URL resolved", {
          description: "The returned provider link was loaded in the player.",
        });
      } else if (payload.streamUrl) {
        toast.success("Stream URL resolved", {
          description: "Autoplay is off. Copy or load the returned link when ready.",
        });
      } else {
        toast.success("Transfer queued", {
          description: payload.message ?? "Open the provider dashboard if file selection is required.",
        });
      }
    } catch (error) {
      toast.error("Could not resolve source", {
        description: error instanceof Error ? error.message : "Check provider settings and token.",
      });
    } finally {
      setIsResolving(false);
    }
  };

  const copyPlayerUrl = async () => {
    if (!playerUrl) {
      toast.info("No stream URL loaded yet.");
      return;
    }
    await navigator.clipboard.writeText(playerUrl);
    toast.success("Stream URL copied");
  };

  return (
    <main className="min-h-screen bg-[#070711] text-white">
      <div className="fixed inset-0 -z-10 opacity-60">
        <Image src="/assets/nickhub-hero.png" alt="Nickhub cinema background" fill priority className="object-cover" sizes="100vw" />
        <div className="absolute inset-0 bg-[#070711]/75" />
        <div className="absolute left-6 top-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-12 right-8 h-72 w-72 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070711]/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex shrink-0 items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-2xl border border-violet-300/30 bg-violet-500/15 shadow-lg shadow-violet-950/60">
              <Image src="/assets/nickhub-logo.png" alt="Nickhub logo" fill className="object-cover" sizes="40px" />
            </div>
            <h1 className="hidden text-lg font-black tracking-tight sm:block">{settings.appName}</h1>
          </div>

          <form onSubmit={searchMovies} className="relative mx-auto hidden w-full max-w-md flex-1 md:block">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <Input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search movies & shows..."
              className="h-10 rounded-full border-white/10 bg-white/[0.06] pl-10 text-sm text-white placeholder:text-slate-500 focus-visible:ring-violet-300"
            />
          </form>

          <nav className="ml-auto hidden items-center gap-5 text-sm font-semibold text-slate-300 md:flex">
            <Link href="/discover" className="hover:text-white">Discover</Link>
            <a href="#library" className="hover:text-white">Library</a>
            <a href="#player" className="hover:text-white">Player</a>
          </nav>

          <div className="ml-auto flex items-center gap-2 md:ml-0">
            <Button onClick={openSettings} variant="ghost" size="icon" className="rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white">
              <Settings2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <section className="relative flex min-h-[62vh] w-full items-end overflow-hidden sm:min-h-[70vh]">
        <MovieBackdrop movie={activeMovie} src={featuredBackdrop} />
        <div className="absolute inset-0 bg-gradient-to-t from-[#070711] via-[#070711]/60 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#070711]/90 via-[#070711]/20 to-transparent" />

        <div className="relative z-10 mx-auto w-full max-w-7xl px-4 pb-10 sm:px-6 sm:pb-14 lg:px-8">
          <div className="max-w-2xl">
            <div className="mb-3 flex flex-wrap gap-2">
              {activeMovie.genres.slice(0, 3).map((genre) => (
                <Badge key={genre} className="rounded-full border-white/15 bg-black/35 text-slate-100 backdrop-blur-md hover:bg-black/45">
                  {genre}
                </Badge>
              ))}
            </div>
            <h2 className="text-4xl font-black leading-[0.95] tracking-tight sm:text-6xl lg:text-7xl">{activeMovie.title}</h2>
            <p className="mt-3 text-sm font-semibold text-slate-300">
              {activeMovie.year} {activeMovie.runtime ? `• ${activeMovie.runtime}` : ""} {activeMovie.rating ? `• ★ ${activeMovie.rating.toFixed(1)}` : ""}
            </p>
            <p className="mt-4 line-clamp-3 max-w-xl text-sm leading-6 text-slate-300 sm:text-base">{activeMovie.overview}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button onClick={playDemo} className="h-12 rounded-full bg-white px-6 font-black text-[#101020] hover:bg-violet-100">
                <Play className="h-4 w-4 fill-current" />
                Play
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-full border-white/15 bg-white/10 px-6 font-bold text-white backdrop-blur-md hover:bg-white/20 hover:text-white">
                <a href="#library">
                  <Info className="h-4 w-4" />
                  More info
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl space-y-3 px-4 pt-8 sm:px-6 lg:px-8">
        <GenreChips type="movie" apiKey={tmdbApiKeyForDiscovery} />
      </section>

      <section className="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
        <DiscoverySection
          title="Trending This Week"
          endpoint="/api/tmdb/trending?type=movie&window=week"
          href="/discover/trending"
          apiKey={tmdbApiKeyForDiscovery}
        />
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-10 pt-10 sm:px-6 lg:px-8" id="library">
        <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.24em] text-violet-200">Results</p>
            <h3 className="mt-1 text-3xl font-black">Choose what to watch</h3>
          </div>
          <Badge className="w-fit rounded-full border-white/10 bg-white/[0.07] px-3 py-1 text-slate-200 hover:bg-white/[0.1]">
            {movies.length} titles loaded
          </Badge>
        </div>

        {movies.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
            {movies.map((movie) => (
              <button
                key={movie.id}
                onClick={() => chooseMovie(movie)}
                className={`group overflow-hidden rounded-[1.65rem] border p-1 text-left transition duration-300 hover:-translate-y-1 ${
                  activeMovie.id === movie.id
                    ? "border-violet-300/60 bg-violet-400/15 shadow-lg shadow-violet-950/40"
                    : "border-white/10 bg-white/[0.06] hover:border-white/25"
                }`}
              >
                <div className="relative aspect-[2/3] overflow-hidden rounded-[1.35rem] bg-[#17172d]">
                  <Poster movie={movie} />
                  <div className="absolute left-2 top-2 rounded-full bg-black/55 px-2 py-1 text-[0.7rem] font-black text-white backdrop-blur-md">
                    {movie.rating ? `★ ${movie.rating.toFixed(1)}` : movie.year}
                  </div>
                </div>
                <div className="px-2 py-3">
                  <p className="line-clamp-1 text-sm font-black text-white">{movie.title}</p>
                  <p className="text-xs text-slate-400">{movie.year || "Movie"}</p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-8 text-center">
            <Search className="mx-auto mb-3 h-10 w-10 text-violet-200" />
            <h4 className="text-xl font-black">No titles loaded</h4>
            <p className="mt-2 text-sm text-slate-400">Enable demo titles in Settings or connect a metadata provider.</p>
          </div>
        )}
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 pb-20 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8" id="player">
        <div className="overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] p-4 shadow-2xl shadow-black/30 backdrop-blur-xl">
          <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div>
              <Badge className="rounded-full border-violet-300/20 bg-violet-300/10 text-violet-100 hover:bg-violet-300/15">
                <MonitorPlay className="mr-1 h-3.5 w-3.5" />
                Now playing
              </Badge>
              <h3 className="mt-2 text-2xl font-black">{activeMovie.title}</h3>
            </div>
            <Button onClick={copyPlayerUrl} variant="outline" className="rounded-full border-white/15 bg-white/5 font-bold text-white hover:bg-white/10 hover:text-white">
              <Copy className="h-4 w-4" />
              Copy stream URL
            </Button>
          </div>

          <div className="relative overflow-hidden rounded-[1.5rem] border border-white/10 bg-black">
            {playerUrl ? (
              <video key={playerUrl} controls playsInline className="aspect-video w-full bg-black" poster={activeMovie.backdrop ?? undefined}>
                <source src={playerUrl} />
                Your browser cannot play this media source.
              </video>
            ) : (
              <div className="grid aspect-video place-items-center bg-[#080812] p-8 text-center">
                <div>
                  <CirclePlay className="mx-auto mb-4 h-14 w-14 text-violet-200" />
                  <h4 className="text-xl font-black">No stream loaded</h4>
                  <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                    Select a demo title or add an authorized direct/debrid source below to start playback.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl" id="sources">
          <Badge className="rounded-full border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/15">
            <CloudLightning className="mr-1 h-3.5 w-3.5" />
            Source resolver
          </Badge>
          <h3 className="mt-4 text-3xl font-black">Stream your authorized source.</h3>
          <p className="mt-2 text-sm leading-6 text-slate-400">
            Paste a direct HTTPS media URL to play immediately, or send a legal magnet/provider link to your debrid integration.
          </p>

          <div className="mt-5 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="text-slate-200">Debrid provider</Label>
                <Select value={provider} onValueChange={selectProvider}>
                  <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-black/25 text-white focus:ring-violet-300">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-2xl border-white/10 bg-[#111126] text-white">
                    {debridProviders.map((item) => (
                      <SelectItem key={item.id} value={item.id} className="rounded-xl focus:bg-violet-500/20 focus:text-white">
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="text-slate-200">API token</Label>
                <Input
                  type="password"
                  value={token}
                  onChange={(event) => setToken(event.target.value)}
                  placeholder={`Optional: ${selectedProvider.env}`}
                  className="h-12 rounded-2xl border-white/10 bg-black/25 text-white placeholder:text-slate-500 focus-visible:ring-violet-300"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-slate-200">Direct HTTPS, magnet, or provider link</Label>
              <Textarea
                value={sourceInput}
                onChange={(event) => setSourceInput(event.target.value)}
                placeholder="https://your-authorized-file.mp4 or magnet:?xt=urn:btih:..."
                className="min-h-28 rounded-2xl border-white/10 bg-black/25 text-white placeholder:text-slate-500 focus-visible:ring-violet-300"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Button onClick={playDirect} variant="outline" className="h-12 rounded-2xl border-white/15 bg-white/5 font-black text-white hover:bg-white/10 hover:text-white">
                <Video className="h-4 w-4" />
                Play direct URL
              </Button>
              <Button onClick={resolveSource} disabled={isResolving} className="h-12 rounded-2xl bg-violet-500 font-black text-white hover:bg-violet-400">
                <Magnet className="h-4 w-4" />
                {isResolving ? "Resolving..." : "Resolve with debrid"}
              </Button>
            </div>
          </div>

          {resolveResult ? (
            <div className="mt-5 rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-50">
              <div className="mb-2 flex items-center gap-2 font-black">
                <BadgeCheck className="h-4 w-4" />
                {resolveResult.status}
              </div>
              <p className="text-emerald-100/80">Mode: {resolveResult.mode}</p>
              {resolveResult.transferId ? <p className="text-emerald-100/80">Transfer ID: {resolveResult.transferId}</p> : null}
              {resolveResult.dashboardUrl ? (
                <a href={resolveResult.dashboardUrl} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 font-bold text-emerald-100 hover:text-white">
                  Open provider dashboard <ExternalLink className="h-3.5 w-3.5" />
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8" id="server">
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { icon: Server, title: "Docker ready", body: "Dockerfile, compose file, and health endpoint are included." },
            { icon: KeyRound, title: "Editable tokens", body: "Store TMDB and debrid credentials in Settings or on your server." },
            { icon: PlugZap, title: "Addon friendly", body: `${configuredAddonCount} manifest${configuredAddonCount === 1 ? "" : "s"} configured for metadata, subtitles, or sources.` },
            { icon: WandSparkles, title: "TV-like UI", body: "Large cards, quick actions, and a focused in-page player." },
          ].map((item) => (
            <div key={item.title} className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
              <item.icon className="mb-4 h-7 w-7 text-violet-200" />
              <h4 className="font-black">{item.title}</h4>
              <p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p>
            </div>
          ))}
        </div>
      </section>

      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto rounded-[2rem] border-white/10 bg-[#0d0d1c] p-0 text-white shadow-2xl shadow-black/60">
          <div className="border-b border-white/10 p-5 sm:p-6">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl font-black">
                <Settings2 className="h-5 w-5 text-violet-200" />
                Settings
              </DialogTitle>
              <DialogDescription className="text-slate-400">
                Edit your app identity, metadata search, debrid providers, playback defaults, and addon manifests.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-2">
            <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
              <h3 className="mb-4 font-black">App</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">App name</Label>
                  <Input
                    value={draftSettings.appName}
                    onChange={(event) => updateDraft("appName", event.target.value)}
                    className="h-11 rounded-2xl border-white/10 bg-black/25 text-white focus-visible:ring-violet-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">Profile / room label</Label>
                  <Input
                    value={draftSettings.profileName}
                    onChange={(event) => updateDraft("profileName", event.target.value)}
                    className="h-11 rounded-2xl border-white/10 bg-black/25 text-white focus-visible:ring-violet-300"
                  />
                </div>
                <SettingSwitch
                  label="Show open demo titles"
                  description="Keep legal sample movies visible for testing playback."
                  checked={draftSettings.showOpenDemoTitles}
                  onCheckedChange={(checked) => updateDraft("showOpenDemoTitles", checked)}
                />
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
              <h3 className="mb-4 font-black">Movie metadata</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">Metadata credential mode</Label>
                  <Select value={draftSettings.metadataMode} onValueChange={(value) => updateDraft("metadataMode", value as AppSettings["metadataMode"])}>
                    <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-black/25 text-white focus:ring-violet-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-white/10 bg-[#111126] text-white">
                      <SelectItem value="server" className="rounded-xl focus:bg-violet-500/20 focus:text-white">Use server environment</SelectItem>
                      <SelectItem value="apiKey" className="rounded-xl focus:bg-violet-500/20 focus:text-white">TMDB API key</SelectItem>
                      <SelectItem value="readToken" className="rounded-xl focus:bg-violet-500/20 focus:text-white">TMDB read token</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">TMDB API key</Label>
                  <Input
                    type="password"
                    value={draftSettings.tmdbApiKey}
                    onChange={(event) => updateDraft("tmdbApiKey", event.target.value)}
                    className="h-11 rounded-2xl border-white/10 bg-black/25 text-white focus-visible:ring-violet-300"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-200">TMDB read token</Label>
                  <Input
                    type="password"
                    value={draftSettings.tmdbReadToken}
                    onChange={(event) => updateDraft("tmdbReadToken", event.target.value)}
                    className="h-11 rounded-2xl border-white/10 bg-black/25 text-white focus-visible:ring-violet-300"
                  />
                </div>
                <SettingSwitch
                  label="Safe search"
                  description="Ask metadata providers to exclude adult results."
                  checked={draftSettings.safeSearch}
                  onCheckedChange={(checked) => updateDraft("safeSearch", checked)}
                />
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4 lg:col-span-2">
              <h3 className="mb-4 font-black">Debrid providers</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-slate-200">Default provider</Label>
                  <Select value={draftSettings.defaultProvider} onValueChange={(value) => updateDraft("defaultProvider", value)}>
                    <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-black/25 text-white focus:ring-violet-300">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl border-white/10 bg-[#111126] text-white">
                      {debridProviders.map((item) => (
                        <SelectItem key={item.id} value={item.id} className="rounded-xl focus:bg-violet-500/20 focus:text-white">
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {debridProviders.map((item) => (
                  <div key={item.id} className="space-y-2">
                    <Label className="text-slate-200">{item.name} token</Label>
                    <Input
                      type="password"
                      value={draftSettings.debridTokens[item.id] ?? ""}
                      onChange={(event) => updateDraftDebridToken(item.id, event.target.value)}
                      placeholder={item.env}
                      className="h-11 rounded-2xl border-white/10 bg-black/25 text-white placeholder:text-slate-500 focus-visible:ring-violet-300"
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
              <h3 className="mb-4 font-black">Playback</h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-200">Default source URL</Label>
                  <Textarea
                    value={draftSettings.defaultSource}
                    onChange={(event) => updateDraft("defaultSource", event.target.value)}
                    placeholder="https://... or magnet:?xt=urn:btih:..."
                    className="min-h-24 rounded-2xl border-white/10 bg-black/25 text-white placeholder:text-slate-500 focus-visible:ring-violet-300"
                  />
                </div>
                <SettingSwitch
                  label="Autoplay resolved links"
                  description="Automatically load returned debrid stream URLs into the player."
                  checked={draftSettings.autoplayResolved}
                  onCheckedChange={(checked) => updateDraft("autoplayResolved", checked)}
                />
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-white/10 bg-white/[0.05] p-4">
              <h3 className="mb-4 font-black">Addons</h3>
              <div className="space-y-2">
                <Label className="text-slate-200">Addon manifest URLs</Label>
                <Textarea
                  value={draftSettings.addonManifests}
                  onChange={(event) => updateDraft("addonManifests", event.target.value)}
                  placeholder="One HTTPS manifest URL per line"
                  className="min-h-40 rounded-2xl border-white/10 bg-black/25 text-white placeholder:text-slate-500 focus-visible:ring-violet-300"
                />
                <p className="text-xs leading-5 text-slate-500">These are stored for your UI configuration. Use the addon inspector route to validate manifests server-side.</p>
              </div>
            </section>
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-white/10 p-5 sm:flex-row sm:justify-between sm:p-6">
            <Button onClick={resetSettings} variant="outline" className="rounded-full border-rose-300/30 bg-rose-300/10 font-bold text-rose-100 hover:bg-rose-300/15 hover:text-white">
              Reset settings
            </Button>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Button onClick={() => setSettingsOpen(false)} variant="outline" className="rounded-full border-white/15 bg-white/5 font-bold text-white hover:bg-white/10 hover:text-white">
                Cancel
              </Button>
              <Button onClick={saveSettings} className="rounded-full bg-violet-500 font-black text-white hover:bg-violet-400">
                Save settings
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}

function SettingSwitch({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-black/20 p-3">
      <div>
        <p className="text-sm font-black text-white">{label}</p>
        <p className="mt-1 text-xs leading-5 text-slate-400">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} className="data-[state=checked]:bg-violet-500" />
    </div>
  );
}

function Poster({ movie }: { movie: Movie }) {
  if (movie.poster) {
    return <img src={movie.poster} alt={`${movie.title} poster`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />;
  }

  return (
    <div className="relative h-full w-full">
      <Image src={posterFallback(movie)} alt={`${movie.title} artwork`} fill className="object-cover opacity-70 transition duration-500 group-hover:scale-105" sizes="240px" />
      <div className="absolute inset-0 bg-violet-950/35" />
      <Clapperboard className="absolute bottom-4 right-4 h-8 w-8 text-white/80" />
    </div>
  );
}

function MovieBackdrop({ movie, src }: { movie: Movie; src: string }) {
  if (movie.backdrop?.startsWith("https://")) {
    return <img src={src} alt={`${movie.title} backdrop`} className="absolute inset-0 h-full w-full object-cover opacity-80" />;
  }

  return <Image src={src} alt={`${movie.title} backdrop`} fill priority className="object-cover opacity-80" sizes="100vw" />;
}
