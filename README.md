# Nickhub

Nickhub is a self-hosted cinematic media hub rebuilt from the ideas in Streamer for a web workflow. It includes a private community dashboard, movie metadata search, direct authorized playback, debrid provider handoff, Stremio-style addon manifest inspection, and Docker deployment files.

## What is included

- Cinematic Next.js App Router movie home UI
- Settings menu for app name, profile, metadata keys, debrid tokens, playback defaults, and addon manifests
- Searchable movie metadata route at `/api/movies/search`
- In-page video player for direct authorized HTTPS streams
- Legal magnet/HTTPS source resolver route at `/api/debrid/resolve`
- Addon manifest inspector at `/api/addons/inspect`
- Health endpoint at `/api/health`
- Dockerfile and `docker-compose.yml` for container hosting
- Generated Nickhub logo, hero, addon, icon, and community assets in `public/assets`

## Movie search

Nickhub can search movie metadata through TMDB. Add either `TMDB_API_KEY` or `TMDB_READ_TOKEN` as server environment variables, or enter a TMDB credential in the Settings menu. Without a TMDB key, the home page still works with bundled open-movie demo titles.

## Settings

Open **Settings** in the header to edit:

- App name and room/profile label
- Metadata credential mode and TMDB credentials
- Default debrid provider and provider tokens
- Default source URL or magnet
- Autoplay and safe-search behavior
- Addon manifest URL list

Settings entered in the UI are stored in this browser's local storage. Server environment variables remain useful for shared deployments.

## Streaming

The home page can play direct HTTPS media URLs that you are authorized to access. For debrid workflows, paste a legal magnet URI or provider-supported HTTPS source, choose a provider, and resolve it through `/api/debrid/resolve`.

## Debrid providers

The resolver supports user-provided legal magnets or HTTPS links for:

- Real-Debrid (`REAL_DEBRID_TOKEN`)
- AllDebrid (`ALLDEBRID_TOKEN`)
- Premiumize (`PREMIUMIZE_TOKEN`)
- Debrid-Link (`DEBRID_LINK_TOKEN`)
- Offcloud (`OFFCLOUD_TOKEN`)

Tokens can be configured as server environment variables or entered in the Settings menu. Browser-entered tokens are sent only to this self-hosted app's resolver route for the current request.

## Addons

Nickhub accepts HTTPS Stremio-style manifest URLs. The inspector validates the manifest and blocks private-network URLs to avoid exposing internal services.

## Supabase backend

Nickhub connects to the **Nickhub** Supabase project (`axdhcinekndhwsoxwgab`).

1. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` — `https://axdhcinekndhwsoxwgab.supabase.co`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the anon/publishable key from
     **Supabase Dashboard → Project Settings → API**
2. Client helpers live in `src/lib/supabase/`:
   - `client.ts` — browser client for Client Components
   - `server.ts` — cookie-aware client for Server Components, Route Handlers,
     and Server Actions
3. Verify connectivity at `GET /api/db/status`. It returns
   `{ "status": "ok", "configured": true }` when the app can reach Supabase.

On Vercel, add the same two variables under **Project Settings → Environment
Variables** (they are provided automatically if the project is linked through
the Vercel + Supabase integration).

## Coolify deployment

1. Create a Coolify project named `nickhub`.
2. Add a Git deploy key with access to this repository.
3. Create a Docker Compose application from the `main` branch using `docker-compose.yml`.
4. Set the domain to `https://thirty4x.com` on the `nickhub` service.
5. Expose port `3000` and use `/api/health` as the health check path.
6. Optionally run `scripts/deploy-coolify.sh` after exporting `COOLIFY_*` variables.

## Container deployment

1. Deploy this repository as a Dockerfile or Docker Compose application.
2. Set optional server environment variables for shared TMDB and debrid credentials.
3. Expose port `3000`.
4. Use `/api/health` as the health check path.

## Legal use

Nickhub does not ship copyrighted source catalogs or bundled torrents. Use it only with media you own, public-domain/open media, or sources you are legally authorized to access.
