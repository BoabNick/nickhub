"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import type { UserSettings } from "@/types/supabase";

/**
 * Loads (and lazily creates) the signed-in user's settings row and exposes
 * an updater that persists partial changes back to Supabase. Returns
 * `settings: null` when nobody is signed in.
 */
export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  // Start settled when Supabase is unconfigured so the effect never has to
  // call setState synchronously (which triggers cascading renders).
  const [loading, setLoading] = useState(() => isSupabaseConfigured());

  const fetchSettings = useCallback(async () => {
    if (!isSupabaseConfigured()) {
      return;
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setSettings(null);
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("user_settings")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Failed to load user settings", error);
    } else if (data) {
      setSettings(data as UserSettings);
    } else {
      // First sign-in: create the default settings row. `upsert` keeps this
      // idempotent if two tabs/devices race on the same `user_id`.
      const { data: created, error: insertError } = await supabase
        .from("user_settings")
        .upsert({ user_id: user.id }, { onConflict: "user_id" })
        .select()
        .single();

      if (insertError) {
        console.error("Failed to create default user settings", insertError);
      } else {
        setSettings(created as UserSettings);
      }
    }

    setLoading(false);
  }, []);

  const updateSettings = useCallback(
    async (updates: Partial<Omit<UserSettings, "user_id" | "created_at" | "updated_at">>) => {
      if (!isSupabaseConfigured()) {
        return { data: null, error: new Error("Supabase is not configured.") };
      }

      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        return { data: null, error: new Error("Not signed in.") };
      }

      const { data, error } = await supabase
        .from("user_settings")
        .update(updates)
        .eq("user_id", user.id)
        .select()
        .single();

      if (!error && data) {
        setSettings(data as UserSettings);
      }

      return { data: data as UserSettings | null, error };
    },
    [],
  );

  useEffect(() => {
    // `fetchSettings` only calls setState after awaiting network work, so it
    // cannot cause the synchronous cascading render this rule guards against.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, updateSettings, refetch: fetchSettings };
}
