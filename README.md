# Nickhub + Supabase Auth Integration

This adds a complete, beautiful **email + password login/signup flow** with Supabase Auth to your existing Nickhub project.

Your repo already has:
- Next.js App Router + TypeScript + Tailwind
- Supabase client/server setup in `src/lib/supabase/`
- Supabase project connected (for DB)

We are now enabling **Supabase Authentication** on top of it.

## Files to Add

Copy the following into your local clone of `nickhub`:

```
src/app/login/page.tsx
src/app/signup/page.tsx
src/app/auth/confirm/route.ts
```

(You can also add middleware later for automatic protection of routes like `/settings` or your community dashboard.)

## Step-by-Step Instructions

### 1. Enable Auth in Supabase Dashboard
1. Go to your Supabase project (axdhcinekndhwsoxwgab)
2. **Authentication → Providers → Email** → Enable it
3. **Authentication → URL Configuration** → Add these **Redirect URLs**:
   - `http://localhost:3000/auth/confirm`
   - `https://your-nickhub-domain.com/auth/confirm`
4. **Authentication → Password strength & leaked password protection** → Turn **ON** "Prevent the use of leaked passwords"
5. (Recommended for dev) You can temporarily disable "Enable email confirmations" while testing.

### 2. Copy the Files
From this folder, copy into your project root:

```bash
# Example commands (run from your nickhub folder)
cp -r artifacts/nickhub-supabase-auth/src/app/login src/app/
cp -r artifacts/nickhub-supabase-auth/src/app/signup src/app/
cp -r artifacts/nickhub-supabase-auth/src/app/auth src/app/
```

Or manually create the folders and paste the code.

### 3. Update Navigation (Recommended)
Add links in your header/navbar (probably in `src/app/layout.tsx` or a Header component):

```tsx
<Link href="/login" className="...">Sign in</Link>
<Link href="/signup" className="...">Sign up</Link>
```

After login, you can show user email + logout button.

### 4. Protect Routes (Next Step)
Once auth is working, protect your community dashboard / settings pages:

- Option A (simple): Add session check at the top of those pages (like the dashboard example below).
- Option B (better): Add `middleware.ts` at root for automatic redirects.

Example middleware (create `src/middleware.ts`):

```ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // Protect these routes
  const protectedPaths = ['/settings', '/community', '/dashboard']
  const isProtected = protectedPaths.some(path => request.nextUrl.pathname.startsWith(path))

  if (isProtected && !session) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
```

### 5. Test the Flow
1. `npm run dev`
2. Visit http://localhost:3000/login
3. Create account → confirm email (or skip confirmation in Supabase)
4. Login → should redirect to wherever you point it (currently `/dashboard` — change to your community page)

## What You Get
- Beautiful dark cinematic-themed login & signup screens matching Nickhub vibe
- Full email/password auth with Supabase
- Leaked password protection support
- Email confirmation flow (`/auth/confirm`)
- Auto redirect if already logged in
- Password visibility toggle
- Clean error/success messaging
- Ready for user-specific features (personal watchlists, settings per user_id, etc.)

## Next Ideas for Nickhub
- Store user settings in Supabase table `user_settings` (user_id, theme, default_debrid, etc.)
- Personal "My Library" or watch history
- Community features gated behind login

Let me know if you want:
- Dark mode refinements
- Integration with existing Header component
- User settings page example using Supabase
- Full middleware
- Logout button component

You're now one step closer to a full authenticated media hub! 🎥
