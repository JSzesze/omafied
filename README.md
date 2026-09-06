# Omafied

Community table of laptops that run [Omarchy](https://omarchy.org). Super fast browse, live submit, laptops only.

Community-reported. **Not official Omarchy.**

Live UI is a dense table in the visual language of [radio.omarchy.org](https://radio.omarchy.org/) — JetBrains Mono, Space Grotesk, VT323, 1px borders, uppercase spaced wordmark, theme picker.

## Stack

- Cloudflare Worker (TypeScript)
- D1 for live submits
- Static HTML/CSS/JS via the Worker assets binding

No Next.js, no Convex, no git-YAML CMS. v1 has no auth and no moderation.

Deploy to **workers.dev** first. `omafied.com` is already on Vercel — do not buy or attach DNS here.

## Cloudflare placeholders

Jason deploys. Leave these as placeholders in `wrangler.toml` until then:

- `account_id = "CF_ACCOUNT_ID"`
- `database_id = "CF_D1_DATABASE_ID"`

Node 22+ is required (Wrangler 4).

## Local

```bash
npm i
npx wrangler d1 migrations apply omafied --local
npx wrangler dev
```

Open `http://127.0.0.1:8787/`.

- `GET /` — table + filter/search
- `GET /submit` — form
- `GET /api/laptops` — newest first
- `POST /api/laptops` — submit (JSON, no auth)

## Deploy (Jason)

```bash
npm i
npx wrangler login
npx wrangler d1 create omafied
```

Copy the printed `database_id` (and your Cloudflare `account_id`) into `wrangler.toml`, replacing the `CF_*` placeholders.

```bash
npx wrangler d1 migrations apply omafied --remote
npx wrangler deploy
```

That publishes `https://omafied.<account>.workers.dev`. Do not attach `omafied.com`.

## Schema

`laptops`

| column | type |
| --- | --- |
| id | TEXT PRIMARY KEY |
| brand, model | TEXT NOT NULL |
| year | INTEGER nullable |
| wifi, gpu, sleep, audio | TEXT NOT NULL `works \| partial \| broken \| unknown` |
| notes, reporter | TEXT |
| created_at, updated_at | TEXT NOT NULL (ISO) |

Seed rows: Framework 13/16, Dell XPS, ThinkPad — with honest `unknown` / `partial` where that is the truth. Reporter: `seed`.

## Out of scope (v1)

Moderation, auth, desktops/phones, custom domain, payments.
