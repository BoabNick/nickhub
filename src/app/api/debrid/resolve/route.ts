import { NextResponse } from "next/server";
import { z } from "zod";

const providerSchema = z.enum([
  "real-debrid",
  "all-debrid",
  "premiumize",
  "debrid-link",
  "offcloud",
]);

const requestSchema = z.object({
  provider: providerSchema,
  input: z.string().trim().min(8).max(8192),
  token: z.string().trim().max(2048).optional(),
});

type Provider = z.infer<typeof providerSchema>;

type ResolvePayload = {
  provider: Provider;
  mode: "magnet" | "link";
  status: string;
  streamUrl?: string;
  transferId?: string;
  dashboardUrl?: string;
  message?: string;
};

const envTokenNames: Record<Provider, string> = {
  "real-debrid": "REAL_DEBRID_TOKEN",
  "all-debrid": "ALLDEBRID_TOKEN",
  premiumize: "PREMIUMIZE_TOKEN",
  "debrid-link": "DEBRID_LINK_TOKEN",
  offcloud: "OFFCLOUD_TOKEN",
};

const providerLabels: Record<Provider, string> = {
  "real-debrid": "Real-Debrid",
  "all-debrid": "AllDebrid",
  premiumize: "Premiumize",
  "debrid-link": "Debrid-Link",
  offcloud: "Offcloud",
};

function jsonError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

function getToken(provider: Provider, requestToken?: string) {
  return requestToken || process.env[envTokenNames[provider]] || "";
}

function detectMode(input: string): "magnet" | "link" | null {
  if (input.startsWith("magnet:?")) {
    return "magnet";
  }

  try {
    const url = new URL(input);
    return url.protocol === "https:" ? "link" : null;
  } catch {
    return null;
  }
}

async function readProviderResponse(response: Response) {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { raw: text };
  }
}

function stringValue(value: unknown) {
  return typeof value === "string" ? value : undefined;
}

async function resolveRealDebrid(input: string, token: string, mode: "magnet" | "link"): Promise<ResolvePayload> {
  if (mode === "magnet") {
    const response = await fetch("https://api.real-debrid.com/rest/1.0/torrents/addMagnet", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ magnet: input }),
    });
    const data = await readProviderResponse(response);

    if (!response.ok) {
      throw new Error(stringValue(data?.error) ?? "Real-Debrid rejected the magnet.");
    }

    return {
      provider: "real-debrid",
      mode,
      status: "Queued in Real-Debrid",
      transferId: stringValue(data?.id),
      dashboardUrl: "https://real-debrid.com/torrents",
      message: "Open the provider dashboard to select files if required, then resolve the generated link.",
    };
  }

  const response = await fetch("https://api.real-debrid.com/rest/1.0/unrestrict/link", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ link: input }),
  });
  const data = await readProviderResponse(response);

  if (!response.ok) {
    throw new Error(stringValue(data?.error) ?? "Real-Debrid could not unrestrict this link.");
  }

  return {
    provider: "real-debrid",
    mode,
    status: "Stream link ready",
    streamUrl: stringValue(data?.download) ?? stringValue(data?.link),
    dashboardUrl: "https://real-debrid.com/downloads",
  };
}

async function resolveAllDebrid(input: string, token: string, mode: "magnet" | "link"): Promise<ResolvePayload> {
  if (mode === "magnet") {
    const response = await fetch(`https://api.alldebrid.com/v4/magnet/upload?agent=Nickhub&apikey=${encodeURIComponent(token)}`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ "magnets[]": input }),
    });
    const data = await readProviderResponse(response);
    const responseData = data?.data as Record<string, unknown> | undefined;
    const magnets = responseData?.magnets as Array<Record<string, unknown>> | undefined;

    if (!response.ok || data?.status === "error") {
      throw new Error(stringValue(data?.error) ?? "AllDebrid rejected the magnet.");
    }

    return {
      provider: "all-debrid",
      mode,
      status: "Queued in AllDebrid",
      transferId: stringValue(magnets?.[0]?.id),
      dashboardUrl: "https://alldebrid.com/magnets/",
    };
  }

  const url = new URL("https://api.alldebrid.com/v4/link/unlock");
  url.searchParams.set("agent", "Nickhub");
  url.searchParams.set("apikey", token);
  url.searchParams.set("link", input);

  const response = await fetch(url);
  const data = await readProviderResponse(response);
  const responseData = data?.data as Record<string, unknown> | undefined;

  if (!response.ok || data?.status === "error") {
    throw new Error(stringValue(data?.error) ?? "AllDebrid could not unlock this link.");
  }

  return {
    provider: "all-debrid",
    mode,
    status: "Stream link ready",
    streamUrl: stringValue(responseData?.link),
    dashboardUrl: "https://alldebrid.com/links/",
  };
}

async function resolvePremiumize(input: string, token: string, mode: "magnet" | "link"): Promise<ResolvePayload> {
  if (mode === "magnet") {
    const response = await fetch("https://www.premiumize.me/api/transfer/create", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ apikey: token, src: input }),
    });
    const data = await readProviderResponse(response);

    if (!response.ok || data?.status === "error") {
      throw new Error(stringValue(data?.message) ?? "Premiumize rejected the transfer.");
    }

    return {
      provider: "premiumize",
      mode,
      status: "Queued in Premiumize cloud",
      transferId: stringValue(data?.id),
      dashboardUrl: "https://www.premiumize.me/transfers",
    };
  }

  const response = await fetch("https://www.premiumize.me/api/transfer/directdl", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ apikey: token, src: input }),
  });
  const data = await readProviderResponse(response);
  const content = data?.content as Array<Record<string, unknown>> | undefined;

  if (!response.ok || data?.status === "error") {
    throw new Error(stringValue(data?.message) ?? "Premiumize could not create a direct link.");
  }

  return {
    provider: "premiumize",
    mode,
    status: "Stream link ready",
    streamUrl: stringValue(content?.[0]?.link) ?? stringValue(data?.location),
    dashboardUrl: "https://www.premiumize.me/files",
  };
}

async function resolveDebridLink(input: string, token: string, mode: "magnet" | "link"): Promise<ResolvePayload> {
  const response = await fetch("https://debrid-link.com/api/v2/downloader/add", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ url: input }),
  });
  const data = await readProviderResponse(response);
  const responseData = data?.value as Record<string, unknown> | undefined;

  if (!response.ok || data?.success === false) {
    throw new Error(stringValue(data?.error) ?? "Debrid-Link could not add this source.");
  }

  return {
    provider: "debrid-link",
    mode,
    status: mode === "magnet" ? "Queued in Debrid-Link" : "Stream link ready",
    streamUrl: stringValue(responseData?.downloadUrl) ?? stringValue(responseData?.downloadLink),
    transferId: stringValue(responseData?.id),
    dashboardUrl: "https://debrid-link.com/webapp/downloader",
  };
}

async function resolveOffcloud(input: string, token: string, mode: "magnet" | "link"): Promise<ResolvePayload> {
  const response = await fetch(`https://offcloud.com/api/cloud?key=${encodeURIComponent(token)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url: input }),
  });
  const data = await readProviderResponse(response);

  if (!response.ok || data?.error) {
    throw new Error(stringValue(data?.error) ?? "Offcloud could not create this transfer.");
  }

  return {
    provider: "offcloud",
    mode,
    status: mode === "magnet" ? "Queued in Offcloud" : "Remote transfer created",
    transferId: stringValue(data?.requestId) ?? stringValue(data?.url),
    dashboardUrl: "https://offcloud.com/#/cloud",
    message: "Offcloud typically exposes the final file from its cloud dashboard after processing.",
  };
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
    return jsonError("Provider, token, and legal magnet or HTTPS source are required.");
  }

  const { provider, input, token: requestToken } = parsed.data;
  const mode = detectMode(input);
  if (!mode) {
    return jsonError("Only magnet URIs and HTTPS links are supported.");
  }

  const token = getToken(provider, requestToken);
  if (!token) {
    return jsonError(`Add ${envTokenNames[provider]} on the server or enter a ${providerLabels[provider]} token in Settings.`, 401);
  }

  try {

    const result = await (async () => {
      switch (provider) {
        case "real-debrid":
          return resolveRealDebrid(input, token, mode);
        case "all-debrid":
          return resolveAllDebrid(input, token, mode);
        case "premiumize":
          return resolvePremiumize(input, token, mode);
        case "debrid-link":
          return resolveDebridLink(input, token, mode);
        case "offcloud":
          return resolveOffcloud(input, token, mode);
      }
    })();

    return NextResponse.json(result);
  } catch (error) {
    return jsonError(error instanceof Error ? error.message : "Provider request failed.", 502);
  }
}
