import { NextResponse } from "next/server";
import { z } from "zod";

const requestSchema = z.object({
  url: z.string().trim().url(),
});

type Manifest = {
  id?: unknown;
  name?: unknown;
  version?: unknown;
  description?: unknown;
  resources?: unknown;
  types?: unknown;
};

const blockedHostnames = new Set(["localhost", "0.0.0.0", "127.0.0.1", "::1"]);

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function isPrivateHostname(hostname: string) {
  const normalized = hostname.toLowerCase();

  if (blockedHostnames.has(normalized) || normalized.endsWith(".local")) {
    return true;
  }

  const octets = normalized.split(".").map((part) => Number(part));
  if (octets.length === 4 && octets.every((part) => Number.isInteger(part))) {
    const [first, second] = octets;
    return (
      first === 10 ||
      first === 127 ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 168) ||
      (first === 169 && second === 254)
    );
  }

  return false;
}

function stringArray(value: unknown) {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string").slice(0, 12);
}

function manifestString(value: unknown, fallback: string) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid JSON body.");
  }

  const parsed = requestSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError("A valid addon manifest URL is required.");
  }

  const manifestUrl = new URL(parsed.data.url);
  if (manifestUrl.protocol !== "https:") {
    return jsonError("Addon manifests must use HTTPS.");
  }

  if (isPrivateHostname(manifestUrl.hostname)) {
    return jsonError("Private network addon URLs are not allowed from this inspector.");
  }

  try {
    const response = await fetch(manifestUrl, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });

    if (!response.ok) {
      return jsonError("Addon manifest could not be reached.", 502);
    }

    const manifest = (await response.json()) as Manifest;
    const id = manifestString(manifest.id, manifestUrl.hostname);
    const name = manifestString(manifest.name, id);

    return NextResponse.json({
      id,
      name,
      version: manifestString(manifest.version, "1.0"),
      description: manifestString(manifest.description, "Verified addon manifest."),
      resources: stringArray(manifest.resources),
      types: stringArray(manifest.types),
    });
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Addon inspection failed.", 502);
  }
}
