import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use in Client Components ("use client").
 *
 * Reads the public project URL and anon/publishable key from the
 * NEXT_PUBLIC_* environment variables so the browser bundle can talk to
 * the Nickhub Supabase project. These keys are safe to expose publicly;
 * row access is still governed by Row Level Security policies.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }

  return createBrowserClient(url, key);
}
