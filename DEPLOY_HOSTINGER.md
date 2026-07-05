# Deploying to Hostinger (hPanel Node.js Web App)

Nickhub is a Next.js App Router project with server-side API routes and
Supabase auth, so it needs a real Node.js process — not a static/FTP upload.
Hostinger's **Node.js Web Apps** hosting runs `npm run build` + a start
command against a Git-connected repo, which is what these steps use.

## 1. Point the domain at Hostinger (if not already)

The hPanel screenshot for this plan shows nameservers
`ns1.dns-parking.com` / `ns2.dns-parking.com`. That's a parking/holding
service, not Hostinger's own DNS. Before the app will be reachable at
`thirty4x.com`:

- If the domain is registered at Hostinger: hPanel → **Domains** →
  `thirty4x.com` → **Nameservers** → switch to Hostinger's nameservers
  (or keep the current registrar's DNS and add an A record for
  `thirty4x.com` / `www` pointing at `145.79.4.82` instead).
- If the domain is registered elsewhere: update its nameservers or DNS
  records with your registrar to point at Hostinger.

DNS propagation can take a few hours.

## 2. Create the Node.js Web App

1. hPanel → **Websites** → **Add Website** → **Node.js Apps**.
2. Choose **Import Git Repository**, authorize GitHub access, and select
   `BoabNick/nickhub`.
3. Branch: `main`.
4. Framework: Next.js should auto-detect. If you're offered a manual
   "Other" configuration instead, use:
   - **Build command**: `npm run build`
   - **Start command**: `npm start`
   - **Output directory**: `.next`
   - **Entry file**: leave blank (`next start` is the entry point via
     `npm start` — no custom `server.js` is needed for this project)
5. Node.js version: 22.x or 20.x (either supported version works).

## 3. Set environment variables

In the app's **Environment variables** section, add the values from
`.env.example`:

| Variable | Required | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Supabase anon/publishable key |
| `TMDB_API_KEY` or `TMDB_READ_TOKEN` | No | Shared fallback if a user hasn't saved their own TMDB key in Settings |
| `REAL_DEBRID_TOKEN`, `ALLDEBRID_TOKEN`, `PREMIUMIZE_TOKEN`, `DEBRID_LINK_TOKEN`, `OFFCLOUD_TOKEN` | No | Shared fallback debrid tokens |

Do not set `PORT` — Hostinger's Node.js runner injects its own, and
`next start` already reads `process.env.PORT`.

## 4. Deploy

Click **Deploy**. Hostinger pulls the branch, runs `npm install` and the
build command, then starts the app. Subsequent pushes to `main` redeploy
automatically once the Git integration is connected.

## 5. Verify

Once the domain resolves and the app is running:

- `https://thirty4x.com/api/health` should return a healthy response.
- `https://thirty4x.com/api/db/status` should return
  `{ "status": "ok", "configured": true }` once Supabase env vars are set.
- Sign up at `/auth/signup` and confirm `/settings` persists your TMDB
  key and debrid token.

## Note on the existing Coolify docs

This repo's `README.md` and `docker-compose.yml`/`Dockerfile` also
document a Coolify (self-hosted Docker) deployment path for the same
domain. That setup is unrelated to this one — use whichever hosting is
actually running `thirty4x.com`, not both at once, or you'll have two
services fighting over the same DNS record.
