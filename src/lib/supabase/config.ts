/**
 * Whether the public Supabase environment variables are present.
 *
 * Preview builds without Supabase credentials are explicitly supported (see
 * `src/proxy.ts` and `src/app/api/db/status/route.ts`). Call sites use this to
 * degrade gracefully instead of letting `createClient()` throw.
 */
export function isSupabaseConfigured() {
  return (
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
  );
}
