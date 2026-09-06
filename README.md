# Omafied

Community table of laptops that run [Omarchy](https://omarchy.org). Super fast browse, live submit, laptops only.

Community-reported. **Not official Omarchy.**

Live UI is a dense table in the visual language of [radio.omarchy.org](https://radio.omarchy.org/) — Geist Mono, Geist Pixel Square, 1px borders, uppercase wordmark, theme picker.

## Stack

- Cloudflare Worker (TypeScript)
- D1 for live submits and anonymous agree/disagree votes
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
- `POST /api/laptops/:id/vote` — `{ "direction": 1 | -1 }` (toggle / flip; IP+UA hash)

## Deploy (Jason)

If this database already exists (v1 schema), apply the new migration **before** or right after deploy:

```bash
npx wrangler d1 migrations apply omafied --remote
```

That runs `migrations/0002_likeit.sql` (adds like-it columns, seed values, and `votes`). Fresh deploys still start with `0001_init.sql`.

Full first-time deploy:

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
| tier | TEXT NOT NULL `daily \| works \| fiddly \| avoid` (default `works`) |
| battery, fingerprint | TEXT NOT NULL `works \| partial \| broken \| unknown` |
| build | TEXT NOT NULL `tank \| solid \| meh \| unknown` |
| quirks, uniques, sweet_spot | TEXT |
| cost, used_cost | INTEGER nullable (USD ballpark, not a live scrape) |

`votes` — one anonymous vote per laptop per IP+UA hash. Same direction again removes the vote; opposite flips it.

| column | type |
| --- | --- |
| id | TEXT PRIMARY KEY |
| laptop_id | TEXT NOT NULL |
| direction | INTEGER `1` or `-1` |
| voter_hash | TEXT NOT NULL |
| created_at | TEXT NOT NULL |

List responses include `agree_up` / `agree_down` counts.

Seed rows: Framework 13/16, Dell XPS, ThinkPad — honest `unknown` / `partial` on the run matrix, opinionated like-it tiers and sweet-spot lines. Reporter: `seed`.

## Fonts

Self-hosted under `public/assets/fonts/` from the official [vercel/geist-font](https://github.com/vercel/geist-font) release (SIL OFL 1.1, `OFL.txt` next to the woff2 files). No Google Fonts CDN.

- **Geist Mono** — body, chips, filters, notes, meta (`--mono`, `--sans`)
- **Geist Pixel Square** — large display accents only: wordmark, intro title, tier (`--lcdfont`)

## Out of scope (v1)

Moderation, auth, desktops/phones, custom domain, payments, OG/share cards.
