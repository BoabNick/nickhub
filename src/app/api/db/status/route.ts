import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Supabase connectivity check.
 *
 * Confirms the deployed app can reach the Nickhub Supabase project using the
 * configured environment variables. Returns `configured: false` (instead of
 * throwing) when the env vars are absent, so preview builds without Supabase
 * credentials still respond cleanly.
 */
export async function GET() {
  const configured =
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL) &&
    Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  if (!configured) {
    return NextResponse.json(
      {
        status: "unconfigured",
        configured: false,
        message:
          "Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to connect Supabase.",
      },
      { status: 503 },
    );
  }

  try {
    const supabase = await createClient();
    // Lightweight round-trip that proves auth + network reach the project.
    const { error } = await supabase.auth.getSession();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      status: "ok",
      configured: true,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        configured: true,
        message: error instanceof Error ? error.message : "Supabase request failed.",
      },
      { status: 502 },
    );
  }
}
