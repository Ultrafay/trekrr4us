# Our Library 📖🎬📺

A private, two-person watchlist for films, series, and books.
Built for **Spideyyy 🕷️ & Muuunn 🌙**.

## Stack

- Next.js 14 + TypeScript
- Tailwind CSS (paper-warm aesthetic)
- Supabase (auth + database + realtime)
- TMDB API (movies & series)
- Open Library API (books)
- Magic-link auth with strict email allowlist

---

## Setup (one-time, ~15 min)

### 1. Supabase database

1. Go to your Supabase project → **SQL Editor** → **New Query**
2. Paste the entire contents of `supabase-schema.sql`
3. Click **Run**. It creates the `items` table + Row Level Security policies.

### 2. Supabase auth settings

1. Supabase → **Authentication** → **URL Configuration**
2. Add to **Redirect URLs**:
   - `http://localhost:3000/auth/callback` (for local dev)
   - `https://YOUR-VERCEL-URL.vercel.app/auth/callback` (after you deploy)
3. Set **Site URL** to your Vercel URL once you have it.

### 3. Local dev

```bash
cp .env.example .env.local
# Edit .env.local with your real values
npm install
npm run dev
```

Open http://localhost:3000.

### 4. Deploy to Vercel

1. Push this repo to GitHub.
2. Go to [vercel.com](https://vercel.com) → **Add New** → **Project** → import your repo.
3. Before clicking Deploy, expand **Environment Variables** and add:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `TMDB_TOKEN`
   - `ALLOWED_EMAILS`
4. Click **Deploy**.
5. After deploy, copy the Vercel URL and update Supabase **Site URL** and **Redirect URLs**.

---

## How it works

- **Login**: only emails in `ALLOWED_EMAILS` env var can log in. Magic link sent to email. Nothing else stored.
- **Adding**: search → tap → saved as `status: want`.
- **Tracking**: tap "Start watching/reading" → moves to `in_progress`. Tap "Mark done" → opens rating + note.
- **Sharing**: everything is shared between both of you. Items show who added them and who's reviewed them.
- **Suggestions**: `/suggest` page shows items added by one for the other.

---

## Adding a third person?

Just add their email to `ALLOWED_EMAILS` env var in Vercel and redeploy. No code changes.

---

## File map

```
app/
  page.tsx              → home feed
  login/page.tsx        → magic link form
  auth/callback/route.ts → handles magic link callback
  library/page.tsx      → full library with filters
  search/page.tsx       → search to add
  suggest/page.tsx      → between-us view
  me/page.tsx           → personal stats
  api/
    auth/check          → server-side allowlist check
    search              → unified TMDB + Open Library search
    profile             → name/emoji lookup
components/
  Nav.tsx
  ItemCard.tsx
  SignOutButton.tsx
lib/
  supabase-server.ts
  supabase-browser.ts
  allowlist.ts          → email → name/emoji mapping (from env var)
  search.ts             → TMDB + Open Library clients
middleware.ts           → redirects unauthenticated users to /login
supabase-schema.sql     → run this once in Supabase
```
