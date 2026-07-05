"use client";

import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Activity,
  Bell,
  Check,
  ChevronRight,
  CirclePlay,
  Clock3,
  Cloud,
  Copy,
  Database,
  DownloadCloud,
  ExternalLink,
  Eye,
  Film,
  HardDrive,
  Heart,
  KeyRound,
  LockKeyhole,
  Magnet,
  MonitorPlay,
  Play,
  Plus,
  Puzzle,
  RadioTower,
  Server,
  Settings2,
  ShieldCheck,
  Sparkles,
  Subtitles,
  UsersRound,

  WandSparkles,
  Wifi,
  Zap,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

type DebridProvider = {
  id: string;
  name: string;
  type: "Debrid" | "Resolver" | "Indexer";
  status: "Ready" | "Configured" | "Optional";
  endpoint: string;
  env: string;
  features: string[];
  accent: string;
};

type Addon = {
  id: string;
  name: string;
  url: string;
  type: "Metadata" | "Subtitles" | "Torrent sources" | "Live TV";
  enabled: boolean;
  verified: boolean;
};

type MediaItem = {
  title: string;
  year: string;
  runtime: string;
  format: string;
  quality: string;
  description: string;
  tags: string[];
  accent: string;
  artwork: "hero" | "community" | "addons" | "icons";
};

const debridProviders: DebridProvider[] = [
  {
    id: "real-debrid",
    name: "Real-Debrid",
    type: "Debrid",
    status: "Ready",
    endpoint: "/api/debrid/resolve",
    env: "REAL_DEBRID_TOKEN",
    features: ["Magnet queue", "Link unrestrict", "Browser playback"],
    accent: "bg-violet-500",
  },
  {
    id: "all-debrid",
    name: "AllDebrid",
    type: "Debrid",
    status: "Ready",
    endpoint: "/api/debrid/resolve",
    env: "ALLDEBRID_TOKEN",
    features: ["Magnet upload", "Link unlock", "API agent"],
    accent: "bg-cyan-400",
  },
  {
    id: "premiumize",
    name: "Premiumize",
    type: "Debrid",
    status: "Ready",
    endpoint: "/api/debrid/resolve",
    env: "PREMIUMIZE_TOKEN",
    features: ["Transfer create", "Direct DL", "Cloud cache"],
    accent: "bg-indigo-400",
  },
  {
    id: "debrid-link",
    name: "Debrid-Link",
    type: "Debrid",
    status: "Ready",
    endpoint: "/api/debrid/resolve",
    env: "DEBRID_LINK_TOKEN",
    features: ["Downloader add", "Passkey token", "File links"],
    accent: "bg-emerald-400",
  },
  {
    id: "offcloud",
    name: "Offcloud",
    type: "Debrid",
    status: "Ready",
    endpoint: "/api/debrid/resolve",
    env: "OFFCLOUD_TOKEN",
    features: ["Cloud transfer", "Remote cache", "Direct link"],
    accent: "bg-amber-300",
  },
  {
    id: "orionoid",
    name: "Orionoid",
    type: "Indexer",
    status: "Optional",
    endpoint: "External resolver",
    env: "ORIONOID_TOKEN",
    features: ["Source indexing", "API key setup", "Addon pairing"],
    accent: "bg-fuchsia-400",
  },
];

const defaultAddons: Addon[] = [
  {
    id: "cinemeta",
    name: "Cinemeta",
    url: "https://v3-cinemeta.strem.io/manifest.json",
    type: "Metadata",
    enabled: true,
    verified: true,
  },
  {
    id: "opensubtitles",
    name: "OpenSubtitles v3",
    url: "https://opensubtitles-v3.strem.io/manifest.json",
    type: "Subtitles",
    enabled: true,
    verified: true,
  },
  {
    id: "community-sources",
    name: "Community legal sources",
    url: "Add your own manifest URL",
    type: "Torrent sources",
    enabled: false,
    verified: false,
  },
];

const mediaItems: MediaItem[] = [
  {
    title: "Sintel",
    year: "2010",
    runtime: "15m",
    format: "Open movie",
    quality: "4K HDR",
    description:
      "A fantasy short from the Blender Foundation, ready for testing community watch flows and direct playback.",
    tags: ["Open", "Fantasy", "Short"],
    accent: "bg-violet-500/45",
    artwork: "hero",
  },
  {
    title: "Tears of Steel",
    year: "2012",
    runtime: "12m",
    format: "Open movie",
    quality: "1080p",
    description:
      "A sci-fi open film ideal for validating subtitle tracks, transcoder compatibility, and debrid handoff.",
    tags: ["Sci-fi", "Legal", "Featured"],
    accent: "bg-cyan-400/35",
    artwork: "community",
  },
  {
    title: "Big Buck Bunny",
    year: "2008",
    runtime: "10m",
    format: "Open movie",
    quality: "4K",
    description:
      "A bright public test title for verifying media cards, watch progress, casting, and mobile layouts.",
    tags: ["Family", "Open", "Test"],
    accent: "bg-amber-300/35",
    artwork: "addons",
  },
  {
    title: "Elephants Dream",
    year: "2006",
    runtime: "11m",
    format: "Open movie",
    quality: "HD",
    description:
      "An atmospheric open film for private library experiments and metadata addon testing.",
    tags: ["Classic", "Open", "Library"],
    accent: "bg-emerald-400/35",
    artwork: "icons",
  },
];

const activeSessions = [
  { user: "Nick", title: "Sintel", device: "Living room", progress: "68%" },
  { user: "Ari", title: "Tears of Steel", device: "Chrome", progress: "24%" },
  { user: "Maya", title: "Big Buck Bunny", device: "Tablet", progress: "91%" },
];

const resolveSchema = z.object({
  provider: z.string().min(1),
  token: z.string().optional(),
  input: z
    .string()
    .trim()
    .min(8, "Paste a legal magnet URI or provider-supported HTTPS link."),
});

const addonSchema = z.object({
  url: z.string().trim().url("Use a valid addon manifest URL."),
});

type ResolveValues = z.infer<typeof resolveSchema>;
type AddonValues = z.infer<typeof addonSchema>;

type ResolveResult = {
  provider: string;
  mode: string;
  status: string;
  streamUrl?: string;
  transferId?: string;
  dashboardUrl?: string;
  message?: string;
};

type AddonInspectResult = {
  id: string;
  name: string;
  version?: string;
  description?: string;
  resources?: string[];
  types?: string[];
};

function artworkPath(kind: MediaItem["artwork"]) {
  switch (kind) {
    case "community":
      return "/assets/nickhub-community.png";
    case "addons":
      return "/assets/nickhub-addons.png";
    case "icons":
      return "/assets/nickhub-icons.png";
    default:
      return "/assets/nickhub-hero.png";
  }
}

export function NickhubApp() {
  const [selectedMedia, setSelectedMedia] = useState(mediaItems[0]);
  const [addons, setAddons] = useState(defaultAddons);
  const [resolveResult, setResolveResult] = useState<ResolveResult | null>(null);
  const [inspectedAddon, setInspectedAddon] = useState<AddonInspectResult | null>(null);
  const [privateMode, setPrivateMode] = useState(true);

  const resolveForm = useForm<ResolveValues>({
    resolver: zodResolver(resolveSchema),
    defaultValues: {
      provider: "real-debrid",
      token: "",
      input: "",
    },
  });

  const addonForm = useForm<AddonValues>({
    resolver: zodResolver(addonSchema),
    defaultValues: {
      url: "https://v3-cinemeta.strem.io/manifest.json",
    },
  });

  const enabledAddons = useMemo(
    () => addons.filter((addon) => addon.enabled).length,
    [addons],
  );

  const onResolve = async (values: ResolveValues) => {
    setResolveResult(null);
    try {
      const response = await fetch("/api/debrid/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as ResolveResult & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to resolve this item.");
      }

      setResolveResult(payload);
      toast.success("Resolver accepted the request", {
        description: payload.streamUrl
          ? "A streamable provider link was returned."
          : "The transfer was queued with your debrid provider.",
      });
    } catch (error) {
      toast.error("Resolver failed", {
        description: error instanceof Error ? error.message : "Try another provider or token.",
      });
    }
  };

  const onInspectAddon = async (values: AddonValues) => {
    setInspectedAddon(null);
    try {
      const response = await fetch("/api/addons/inspect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const payload = (await response.json()) as AddonInspectResult & { error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to inspect this addon.");
      }

      const newAddon: Addon = {
        id: payload.id,
        name: payload.name,
        url: values.url,
        type: payload.resources?.includes("subtitles") ? "Subtitles" : "Metadata",
        enabled: true,
        verified: true,
      };

      setInspectedAddon(payload);
      setAddons((current) => {
        const exists = current.some((addon) => addon.url === values.url);
        return exists ? current : [newAddon, ...current];
      });
      toast.success("Addon manifest verified", {
        description: `${payload.name} is now enabled in Nickhub.`,
      });
    } catch (error) {
      toast.error("Addon check failed", {
        description: error instanceof Error ? error.message : "Check the manifest URL.",
      });
    }
  };

  const copyValue = async (value: string, label: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#070711] text-white">
      <div className="fixed inset-0 -z-10 opacity-50">
        <Image
          src="/assets/nickhub-hero.png"
          alt="Cinematic Nickhub background"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[#070711]/70" />
        <div className="absolute left-0 top-0 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute right-0 top-10 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#070711]/80 backdrop-blur-2xl">

        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-2xl border border-violet-300/30 bg-violet-500/15 shadow-lg shadow-violet-950/60">
              <Image src="/assets/nickhub-logo.png" alt="Nickhub logo" fill className="object-cover" sizes="44px" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight sm:text-xl">Nickhub</h1>
                <Badge className="rounded-full border-violet-300/30 bg-violet-400/15 text-violet-100 hover:bg-violet-400/20">
                  Self-hosted
                </Badge>
              </div>
              <p className="hidden text-xs text-slate-400 sm:block">Private community media cockpit</p>
            </div>
          </div>

          <nav className="hidden items-center gap-6 text-sm font-medium text-slate-300 md:flex">
            <a href="/discover" className="transition hover:text-white">Discover</a>
            <a href="#library" className="transition hover:text-white">Library</a>
            <a href="#resolver" className="transition hover:text-white">Debrid</a>
            <a href="#addons" className="transition hover:text-white">Addons</a>
            <a href="#deploy" className="transition hover:text-white">Deploy</a>
          </nav>

          <div className="flex items-center gap-2">

            <Button
              variant="ghost"
              size="icon"
              className="rounded-full border border-white/10 bg-white/5 text-slate-200 hover:bg-white/10 hover:text-white"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <Button className="rounded-full bg-violet-500 px-4 font-bold text-white shadow-lg shadow-violet-950/50 hover:bg-violet-400">
              <UsersRound className="h-4 w-4" />
              <span className="hidden sm:inline">Invite</span>
            </Button>
          </div>
        </div>
      </header>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 pb-14 pt-8 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:px-8 lg:pb-20 lg:pt-12">
        <div className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-8">
          <div className="absolute -right-32 -top-32 h-72 w-72 rounded-full bg-violet-500/25 blur-3xl" />
          <div className="relative z-10 max-w-2xl">
            <Badge className="mb-5 rounded-full border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-cyan-100 hover:bg-cyan-300/15">
              <Sparkles className="mr-1 h-3.5 w-3.5" />
              Inspired by Streamer, rebuilt for the web
            </Badge>
            <h2 className="text-4xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Your private cinema, routed through your own VPS.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
              Nickhub gives a small community a polished media hub with legal-source browsing, debrid handoff, addon manifests, watch sessions, and container-ready deployment.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Button asChild className="h-12 rounded-full bg-violet-500 px-6 text-base font-extrabold text-white shadow-xl shadow-violet-950/60 hover:bg-violet-400">
                <a href="#resolver">
                  <CirclePlay className="h-5 w-5" />
                  Resolve legal source
                </a>
              </Button>
              <Button asChild variant="outline" className="h-12 rounded-full border-white/15 bg-white/5 px-6 text-base font-bold text-white hover:bg-white/10 hover:text-white">
                <a href="#deploy">
                  <Server className="h-5 w-5" />
                  Deployment setup
                </a>
              </Button>
            </div>

          </div>

          <div className="relative z-10 mt-9 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Debrid APIs", value: "5", icon: KeyRound },
              { label: "Addon slots", value: enabledAddons.toString(), icon: Puzzle },
              { label: "Active now", value: "3", icon: MonitorPlay },
              { label: "Uptime", value: "99.9", icon: Activity },
            ].map((stat) => (
              <div key={stat.label} className="rounded-3xl border border-white/10 bg-black/25 p-4 shadow-inner shadow-white/5">
                <stat.icon className="mb-3 h-5 w-5 text-violet-200" />
                <div className="text-2xl font-black">{stat.value}</div>
                <div className="text-xs font-medium text-slate-400">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4">
          <div className="relative min-h-[360px] overflow-hidden rounded-[2.4rem] border border-white/10 bg-[#111126] shadow-2xl shadow-black/40">
            <Image
              src={artworkPath(selectedMedia.artwork)}
              alt={`${selectedMedia.title} artwork`}
              fill
              className="object-cover opacity-80"
              sizes="(min-width: 1024px) 50vw, 100vw"
            />
            <div className="absolute inset-0 bg-[#090914]/50" />
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-8">
              <div className="mb-3 flex flex-wrap gap-2">

                {selectedMedia.tags.map((tag) => (
                  <Badge key={tag} className="rounded-full border-white/15 bg-black/35 text-slate-100 backdrop-blur-md hover:bg-black/45">
                    {tag}
                  </Badge>
                ))}
              </div>
              <h3 className="text-3xl font-black tracking-tight sm:text-5xl">{selectedMedia.title}</h3>
              <p className="mt-3 max-w-lg text-sm leading-6 text-slate-300">{selectedMedia.description}</p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Button className="rounded-full bg-white px-5 font-black text-[#101020] hover:bg-violet-100">
                  <Play className="h-4 w-4 fill-current" />
                  Preview
                </Button>
                <Button variant="outline" className="rounded-full border-white/15 bg-white/5 font-bold text-white hover:bg-white/10 hover:text-white">
                  <Heart className="h-4 w-4" />
                  Save
                </Button>
                <span className="text-sm font-semibold text-slate-300">{selectedMedia.year} • {selectedMedia.runtime} • {selectedMedia.quality}</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4" id="library">
            {mediaItems.map((item) => (
              <button
                key={item.title}
                onClick={() => setSelectedMedia(item)}
                className={`group overflow-hidden rounded-3xl border p-1 text-left transition duration-300 hover:-translate-y-1 ${
                  selectedMedia.title === item.title
                    ? "border-violet-300/60 bg-violet-400/15 shadow-lg shadow-violet-950/40"
                    : "border-white/10 bg-white/[0.06] hover:border-white/25"
                }`}
              >
                <div className={`relative h-28 overflow-hidden rounded-[1.25rem] ${item.accent}`}>
                  <Image src={artworkPath(item.artwork)} alt="" fill className="object-cover opacity-50 transition group-hover:scale-105" sizes="160px" />
                  <div className="absolute inset-0 bg-black/20" />
                  <Film className="absolute bottom-3 right-3 h-5 w-5 text-white/80" />
                </div>

                <div className="px-2 py-3">
                  <p className="truncate text-sm font-black text-white">{item.title}</p>
                  <p className="text-xs text-slate-400">{item.format}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <Tabs defaultValue="resolver" className="w-full">
          <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.25em] text-violet-200">Control room</p>
              <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-5xl">Integrations, addons, and VPS health.</h2>
            </div>
            <TabsList className="h-auto w-full justify-start overflow-x-auto rounded-full border border-white/10 bg-white/[0.06] p-1 text-slate-300 md:w-auto">
              <TabsTrigger value="resolver" className="rounded-full px-4 py-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white">Debrid</TabsTrigger>
              <TabsTrigger value="addons" className="rounded-full px-4 py-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white">Addons</TabsTrigger>
              <TabsTrigger value="community" className="rounded-full px-4 py-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white">Community</TabsTrigger>
              <TabsTrigger value="deploy" className="rounded-full px-4 py-2 data-[state=active]:bg-violet-500 data-[state=active]:text-white">Deploy</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="resolver" id="resolver" className="mt-0">
            <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
              <form onSubmit={resolveForm.handleSubmit(onResolve)} className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-6">
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div>
                    <Badge className="rounded-full border-violet-300/20 bg-violet-300/10 text-violet-100 hover:bg-violet-300/15">
                      <Magnet className="mr-1 h-3.5 w-3.5" />
                      Legal torrent/debrid resolver
                    </Badge>
                    <h3 className="mt-4 text-2xl font-black">Resolve a source</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-400">
                      Paste a lawful magnet URI or provider-supported HTTPS link. Tokens can come from server environment variables or your browser form.
                    </p>
                  </div>
                  <ShieldCheck className="h-7 w-7 text-emerald-300" />

                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-slate-200">Provider</Label>
                    <Select
                      value={resolveForm.watch("provider")}
                      onValueChange={(value) => resolveForm.setValue("provider", value)}
                    >
                      <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-black/25 text-white focus:ring-violet-300">
                        <SelectValue placeholder="Choose provider" />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border-white/10 bg-[#111126] text-white">
                        {debridProviders.filter((provider) => provider.type === "Debrid").map((provider) => (
                          <SelectItem key={provider.id} value={provider.id} className="rounded-xl focus:bg-violet-500/20 focus:text-white">
                            {provider.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200">API token or passkey</Label>
                    <Input
                      type="password"
                      placeholder="Leave blank to use server environment token"
                      className="h-12 rounded-2xl border-white/10 bg-black/25 text-white placeholder:text-slate-500 focus-visible:ring-violet-300"
                      {...resolveForm.register("token")}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-200">Magnet URI or HTTPS link</Label>
                    <Textarea
                      placeholder="magnet:?xt=urn:btih:... or https://..."
                      className="min-h-28 rounded-2xl border-white/10 bg-black/25 text-white placeholder:text-slate-500 focus-visible:ring-violet-300"
                      {...resolveForm.register("input")}
                    />
                    {resolveForm.formState.errors.input ? (
                      <p className="text-sm text-rose-300">{resolveForm.formState.errors.input.message}</p>
                    ) : null}
                  </div>

                  <Button
                    type="submit"
                    disabled={resolveForm.formState.isSubmitting}
                    className="h-12 w-full rounded-2xl bg-violet-500 text-base font-black text-white shadow-lg shadow-violet-950/50 hover:bg-violet-400"
                  >
                    {resolveForm.formState.isSubmitting ? "Resolving..." : "Send to debrid provider"}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>

                {resolveResult ? (
                  <div className="mt-5 rounded-3xl border border-emerald-300/20 bg-emerald-300/10 p-4 text-sm text-emerald-50">
                    <div className="mb-2 flex items-center gap-2 font-black">
                      <Check className="h-4 w-4" />
                      {resolveResult.status}
                    </div>
                    <p className="text-emerald-100/80">Mode: {resolveResult.mode}</p>
                    {resolveResult.transferId ? <p className="text-emerald-100/80">Transfer ID: {resolveResult.transferId}</p> : null}
                    {resolveResult.streamUrl ? (
                      <Button
                        type="button"
                        onClick={() => copyValue(resolveResult.streamUrl ?? "", "Stream URL")}
                        className="mt-3 rounded-full bg-emerald-300 text-emerald-950 hover:bg-emerald-200"
                      >
                        <Copy className="h-4 w-4" />
                        Copy stream URL
                      </Button>
                    ) : null}
                  </div>
                ) : null}
              </form>

              <div className="grid gap-4 sm:grid-cols-2">
                {debridProviders.map((provider) => (
                  <div key={provider.id} className="rounded-[1.75rem] border border-white/10 bg-white/[0.06] p-5 shadow-xl shadow-black/20 backdrop-blur-xl">
                    <div className="mb-4 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className={`h-3 w-3 rounded-full ${provider.accent} shadow-lg`} />
                        <div>
                          <h4 className="font-black text-white">{provider.name}</h4>
                          <p className="text-xs text-slate-400">{provider.type}</p>
                        </div>
                      </div>
                      <Badge className="rounded-full border-white/10 bg-black/25 text-slate-200 hover:bg-black/35">
                        {provider.status}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      {provider.features.map((feature) => (
                        <div key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                          <Zap className="h-3.5 w-3.5 text-violet-200" />
                          {feature}
                        </div>
                      ))}
                    </div>
                    <button
                      onClick={() => copyValue(provider.env, "Environment variable name")}
                      className="mt-4 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-black/20 px-3 py-2 text-left text-xs text-slate-400 transition hover:bg-black/30 hover:text-slate-200"
                    >
                      <span>{provider.env}</span>
                      <Copy className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="addons" id="addons" className="mt-0">
            <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-6">
                <div className="grid gap-6 md:grid-cols-[0.95fr_1.05fr] md:items-center">
                  <div>
                    <Badge className="rounded-full border-cyan-300/20 bg-cyan-300/10 text-cyan-100 hover:bg-cyan-300/15">
                      <Puzzle className="mr-1 h-3.5 w-3.5" />
                      Stremio-style addons
                    </Badge>
                    <h3 className="mt-4 text-3xl font-black">Bring your own manifests.</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-400">
                      Add metadata, subtitle, live TV, and lawful source manifests. Nickhub verifies manifests server-side before enabling them.
                    </p>
                  </div>
                  <div className="relative h-56 overflow-hidden rounded-[1.75rem] border border-white/10 bg-black/25">
                    <Image src="/assets/nickhub-addons.png" alt="Addon integration illustration" fill className="object-cover" sizes="480px" />
                    <div className="absolute inset-0 bg-black/30" />
                  </div>
                </div>

                <form onSubmit={addonForm.handleSubmit(onInspectAddon)} className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">

                  <div>
                    <Input
                      placeholder="https://addon.example.com/manifest.json"
                      className="h-12 rounded-2xl border-white/10 bg-black/25 text-white placeholder:text-slate-500 focus-visible:ring-violet-300"
                      {...addonForm.register("url")}
                    />
                    {addonForm.formState.errors.url ? (
                      <p className="mt-2 text-sm text-rose-300">{addonForm.formState.errors.url.message}</p>
                    ) : null}
                  </div>
                  <Button
                    type="submit"
                    disabled={addonForm.formState.isSubmitting}
                    className="h-12 rounded-2xl bg-cyan-300 px-5 font-black text-cyan-950 hover:bg-cyan-200"
                  >
                    <Plus className="h-4 w-4" />
                    Verify
                  </Button>
                </form>

                {inspectedAddon ? (
                  <div className="mt-5 rounded-3xl border border-cyan-300/20 bg-cyan-300/10 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h4 className="font-black text-cyan-50">{inspectedAddon.name}</h4>
                        <p className="mt-1 text-sm text-cyan-100/75">{inspectedAddon.description ?? "Manifest verified and added."}</p>
                      </div>
                      <Badge className="rounded-full bg-cyan-300 text-cyan-950 hover:bg-cyan-200">v{inspectedAddon.version ?? "1"}</Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {inspectedAddon.resources?.map((resource) => (
                        <Badge key={resource} className="rounded-full border-white/10 bg-black/25 text-cyan-100 hover:bg-black/30">{resource}</Badge>
                      ))}
                    </div>
                  </div>
                ) : null}
              </div>

              <div className="space-y-3">
                {addons.map((addon) => (
                  <div key={addon.id} className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-4 backdrop-blur-xl">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="truncate font-black">{addon.name}</h4>
                          {addon.verified ? <ShieldCheck className="h-4 w-4 text-emerald-300" /> : <Clock3 className="h-4 w-4 text-amber-200" />}
                        </div>
                        <p className="mt-1 truncate text-xs text-slate-400">{addon.url}</p>
                      </div>
                      <Switch
                        checked={addon.enabled}
                        onCheckedChange={(checked) =>
                          setAddons((current) =>
                            current.map((item) => (item.id === addon.id ? { ...item, enabled: checked } : item)),
                          )
                        }
                        className="data-[state=checked]:bg-violet-500"
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                      <Badge className="rounded-full border-white/10 bg-black/25 text-slate-200 hover:bg-black/35">{addon.type}</Badge>
                      <Button variant="ghost" size="sm" className="rounded-full text-slate-300 hover:bg-white/10 hover:text-white">
                        <ExternalLink className="h-3.5 w-3.5" />
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="community" className="mt-0">
            <div className="grid gap-5 lg:grid-cols-[0.85fr_1.15fr]">
              <div className="relative min-h-[420px] overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.06] shadow-2xl shadow-black/25">
                <Image src="/assets/nickhub-community.png" alt="Nickhub community watch" fill className="object-cover" sizes="(min-width:1024px) 45vw, 100vw" />
                <div className="absolute inset-0 bg-[#080812]/45" />
                <div className="absolute bottom-0 p-6">
                  <Badge className="rounded-full border-violet-300/20 bg-violet-300/10 text-violet-100 hover:bg-violet-300/15">Small private community</Badge>

                  <h3 className="mt-4 text-3xl font-black">Profiles, watch history, and shared rooms.</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Designed for household or invite-only communities, with private mode enabled by default.</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl md:col-span-2">
                  <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                    <div>
                      <h3 className="text-2xl font-black">Community guardrails</h3>
                      <p className="mt-1 text-sm text-slate-400">Keep the instance invite-only and lawful-source focused.</p>
                    </div>
                    <div className="flex items-center gap-3 rounded-full border border-white/10 bg-black/20 px-4 py-2">
                      <LockKeyhole className="h-4 w-4 text-violet-200" />
                      <span className="text-sm font-bold text-slate-200">Private mode</span>
                      <Switch checked={privateMode} onCheckedChange={setPrivateMode} className="data-[state=checked]:bg-violet-500" />
                    </div>
                  </div>
                </div>

                {[
                  { icon: UsersRound, title: "Invite groups", body: "Create trusted circles for family, friends, or admins." },
                  { icon: Eye, title: "Watch sync", body: "Track progress and resume sessions across devices." },
                  { icon: Subtitles, title: "Subtitle stack", body: "Prioritize addon subtitle sources per language." },
                  { icon: RadioTower, title: "Cast ready", body: "Surface provider links for players and cast receivers." },
                ].map((item) => (
                  <div key={item.title} className="rounded-[1.5rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl">
                    <item.icon className="mb-4 h-7 w-7 text-violet-200" />
                    <h4 className="font-black">{item.title}</h4>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{item.body}</p>
                  </div>
                ))}

                <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 backdrop-blur-xl md:col-span-2">
                  <h4 className="mb-4 font-black">Active sessions</h4>
                  <div className="space-y-3">
                    {activeSessions.map((session) => (
                      <div key={`${session.user}-${session.title}`} className="flex items-center justify-between gap-4 rounded-2xl bg-black/20 p-3">
                        <div className="flex items-center gap-3">
                          <div className="grid h-10 w-10 place-items-center rounded-full bg-violet-400/20 font-black text-violet-100">{session.user[0]}</div>
                          <div>
                            <p className="text-sm font-black">{session.user}</p>
                            <p className="text-xs text-slate-400">{session.title} • {session.device}</p>
                          </div>
                        </div>
                        <Badge className="rounded-full border-white/10 bg-black/25 text-slate-200 hover:bg-black/30">{session.progress}</Badge>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="deploy" id="deploy" className="mt-0">
            <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.06] p-5 shadow-2xl shadow-black/25 backdrop-blur-xl sm:p-6">
                <Badge className="rounded-full border-emerald-300/20 bg-emerald-300/10 text-emerald-100 hover:bg-emerald-300/15">
                  <Cloud className="mr-1 h-3.5 w-3.5" />
                  Container ready
                </Badge>
                <h3 className="mt-4 text-3xl font-black">Deploy as a Dockerized Next.js service.</h3>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  The project includes Dockerfile, compose file, and env examples. Add provider tokens as server secrets if you want shared credentials.
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  {[
                    { icon: HardDrive, title: "Persistent config", body: "Use env secrets or external storage later." },
                    { icon: Wifi, title: "Health endpoint", body: "Expose /api/health for container checks." },
                    { icon: Database, title: "No database required", body: "Local-first setup for the initial community build." },
                    { icon: WandSparkles, title: "Extensible", body: "Drop in auth/database when you want accounts." },
                  ].map((item) => (
                    <div key={item.title} className="rounded-3xl border border-white/10 bg-black/20 p-4">
                      <item.icon className="mb-3 h-5 w-5 text-emerald-200" />
                      <h4 className="font-black">{item.title}</h4>
                      <p className="mt-1 text-sm leading-6 text-slate-400">{item.body}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-[#0d0d1c] p-5 shadow-2xl shadow-black/25">
                <div className="mb-4 flex items-center justify-between">
                  <h4 className="font-black">Server environment</h4>
                  <Settings2 className="h-5 w-5 text-violet-200" />
                </div>
                <div className="space-y-3 font-mono text-xs text-slate-300">
                  {[
                    "NEXT_PUBLIC_APP_NAME=Nickhub",
                    "REAL_DEBRID_TOKEN=",
                    "ALLDEBRID_TOKEN=",
                    "PREMIUMIZE_TOKEN=",
                    "DEBRID_LINK_TOKEN=",
                    "OFFCLOUD_TOKEN=",
                    "ORIONOID_TOKEN=",
                  ].map((line) => (
                    <button
                      key={line}
                      onClick={() => copyValue(line, "Environment line")}
                      className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-3 text-left transition hover:bg-white/[0.08]"
                    >
                      <span>{line}</span>
                      <Copy className="h-3.5 w-3.5 text-slate-500" />
                    </button>
                  ))}
                </div>
                <div className="mt-5 rounded-3xl border border-violet-300/20 bg-violet-300/10 p-4 text-sm leading-6 text-violet-50">
                  <div className="mb-1 flex items-center gap-2 font-black">
                    <DownloadCloud className="h-4 w-4" />
                    Deployment note
                  </div>
                  Keep shared provider tokens as server secrets. Browser-entered tokens are only used for the current resolver request.
                </div>
              </div>
            </div>
          </TabsContent>

        </Tabs>
      </section>
    </main>
  );
}
