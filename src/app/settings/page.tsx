"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

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
import { useUserSettings } from "@/hooks/use-user-settings";

const debridProviders = [
  { id: "real-debrid", name: "Real-Debrid" },
  { id: "all-debrid", name: "AllDebrid" },
  { id: "premiumize", name: "Premiumize" },
  { id: "debrid-link", name: "Debrid-Link" },
  { id: "offcloud", name: "Offcloud" },
];

const qualities = ["4K", "1080p", "720p"];

export default function SettingsPage() {
  const { settings, loading, updateSettings } = useUserSettings();

  const [appName, setAppName] = useState("");
  const [tmdbApiKey, setTmdbApiKey] = useState("");
  const [debridProvider, setDebridProvider] = useState("");
  const [debridApiToken, setDebridApiToken] = useState("");
  const [bingeMode, setBingeMode] = useState(true);
  const [autoAdvanceDelay, setAutoAdvanceDelay] = useState(5);
  const [preferredQuality, setPreferredQuality] = useState("1080p");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!settings) return;
    setAppName(settings.app_name);
    setTmdbApiKey(settings.tmdb_api_key ?? "");
    setDebridProvider(settings.debrid_provider ?? "");
    setDebridApiToken(settings.debrid_api_token ?? "");
    setBingeMode(settings.binge_mode_enabled);
    setAutoAdvanceDelay(settings.auto_advance_delay_seconds);
    setPreferredQuality(settings.preferred_quality);
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateSettings({
      app_name: appName,
      tmdb_api_key: tmdbApiKey || null,
      debrid_provider: debridProvider || null,
      debrid_api_token: debridApiToken || null,
      binge_mode_enabled: bingeMode,
      auto_advance_delay_seconds: autoAdvanceDelay,
      preferred_quality: preferredQuality,
    });
    setSaving(false);

    if (error) {
      toast.error("Failed to save settings", {
        description: error.message,
      });
    } else {
      toast.success("Settings saved", {
        description: "Your integrations are stored in your account.",
      });
    }
  };

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#070711] text-slate-300">
        Loading settings...
      </main>
    );
  }

  if (!settings) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#070711] text-white">
        <p className="text-slate-300">Sign in to manage your settings.</p>
        <Button asChild className="rounded-full bg-violet-500 px-6 font-black text-white hover:bg-violet-400">
          <Link href="/auth/signin">Sign in</Link>
        </Button>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#070711] px-4 py-12 text-white">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight">Settings</h1>
            <p className="mt-1 text-sm text-slate-400">
              Saved to your account and synced across devices.
            </p>
          </div>
          <form action="/auth/signout" method="post">
            <Button
              type="submit"
              variant="outline"
              className="rounded-full border-white/15 bg-white/5 font-bold text-white hover:bg-white/10 hover:text-white"
            >
              Sign out
            </Button>
          </form>
        </div>

        <section className="space-y-4 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
          <h2 className="text-lg font-black">General</h2>
          <div className="space-y-2">
            <Label htmlFor="app-name" className="text-slate-200">App name</Label>
            <Input
              id="app-name"
              value={appName}
              onChange={(event) => setAppName(event.target.value)}
              className="h-11 rounded-2xl border-white/10 bg-black/25 text-white focus-visible:ring-violet-300"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="tmdb-key" className="text-slate-200">TMDB API key</Label>
            <Input
              id="tmdb-key"
              type="password"
              placeholder="Used for metadata and discovery"
              value={tmdbApiKey}
              onChange={(event) => setTmdbApiKey(event.target.value)}
              className="h-11 rounded-2xl border-white/10 bg-black/25 text-white placeholder:text-slate-500 focus-visible:ring-violet-300"
            />
          </div>
        </section>

        <section className="space-y-4 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
          <h2 className="text-lg font-black">Debrid integration</h2>
          <div className="space-y-2">
            <Label className="text-slate-200">Provider</Label>
            <Select value={debridProvider} onValueChange={setDebridProvider}>
              <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-black/25 text-white focus:ring-violet-300">
                <SelectValue placeholder="Choose provider" />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-white/10 bg-[#111126] text-white">
                {debridProviders.map((provider) => (
                  <SelectItem
                    key={provider.id}
                    value={provider.id}
                    className="rounded-xl focus:bg-violet-500/20 focus:text-white"
                  >
                    {provider.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="debrid-token" className="text-slate-200">API token</Label>
            <Input
              id="debrid-token"
              type="password"
              placeholder="Stored privately in your account"
              value={debridApiToken}
              onChange={(event) => setDebridApiToken(event.target.value)}
              className="h-11 rounded-2xl border-white/10 bg-black/25 text-white placeholder:text-slate-500 focus-visible:ring-violet-300"
            />
          </div>
        </section>

        <section className="space-y-4 rounded-[2rem] border border-white/10 bg-white/[0.06] p-6 backdrop-blur-xl">
          <h2 className="text-lg font-black">Playback</h2>
          <div className="flex items-center justify-between gap-4">
            <div>
              <Label className="text-slate-200">Binge mode</Label>
              <p className="text-sm text-slate-400">Automatically play the next item.</p>
            </div>
            <Switch
              checked={bingeMode}
              onCheckedChange={setBingeMode}
              className="data-[state=checked]:bg-violet-500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="advance-delay" className="text-slate-200">Auto-advance delay (seconds)</Label>
            <Input
              id="advance-delay"
              type="number"
              min={0}
              max={60}
              value={autoAdvanceDelay}
              onChange={(event) => setAutoAdvanceDelay(Number(event.target.value))}
              className="h-11 rounded-2xl border-white/10 bg-black/25 text-white focus-visible:ring-violet-300"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-200">Preferred quality</Label>
            <Select value={preferredQuality} onValueChange={setPreferredQuality}>
              <SelectTrigger className="h-11 rounded-2xl border-white/10 bg-black/25 text-white focus:ring-violet-300">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-2xl border-white/10 bg-[#111126] text-white">
                {qualities.map((quality) => (
                  <SelectItem
                    key={quality}
                    value={quality}
                    className="rounded-xl focus:bg-violet-500/20 focus:text-white"
                  >
                    {quality}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="h-12 w-full rounded-2xl bg-violet-500 text-base font-black text-white shadow-lg shadow-violet-950/50 hover:bg-violet-400"
        >
          {saving ? "Saving..." : "Save settings"}
        </Button>
      </div>
    </main>
  );
}
