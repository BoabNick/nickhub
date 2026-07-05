import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";

/** Ends the Supabase session and sends the user back to the sign-in page. */
export async function POST(request: Request) {
  // Env-less preview builds have no session to end — just redirect.
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }

  return NextResponse.redirect(new URL("/auth/signin", request.url), {
    status: 303,
  });
}
