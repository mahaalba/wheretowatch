# Where We Watch

Find a pub, bar or restaurant showing World Cup 2026 games near you — live availability, real-time crowd backing, and instant reservations.

**Site:** [wherewewatch.co.uk](https://wherewewatch.co.uk)

## Stack

- **Next.js 14** (App Router, TypeScript)
- **Supabase** — venues, fixtures, bookings, crowd picks
- **Tailwind CSS** + inline design tokens
- **Leaflet** — interactive map
- **PostHog** — analytics

## Getting Started

```bash
npm install
npm run dev
```

Copy `.env.local.example` to `.env.local` and fill in:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=
```

Open [http://localhost:3000](http://localhost:3000).

## Seed fixtures

After running the Supabase SQL schema, seed 2026 World Cup fixtures (remaining from 19 Jun):

```bash
npx tsx scripts/seed-fixtures.ts
```
