"use client";

import { useCallback, useEffect, useState } from "react";

import { createClient } from "@/lib/supabase/client";
import type { UserSettings } from "@/types/supabase";

/**
 * Loads (and lazily creates) the signed-in user's settings row and exposes
 * an updater that persists partial changes back to Supabase. Returns
 * `settings: null` when nobody is signed in.
 */
export function useUserSettings() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
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
      // First sign-in: create the default settings row.
      const { data: created, error: insertError } = await supabase
        .from("user_settings")
        .insert({ user_id: user.id })
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
    void fetchSettings();
  }, [fetchSettings]);

  return { settings, loading, updateSettings, refetch: fetchSettings };
}
