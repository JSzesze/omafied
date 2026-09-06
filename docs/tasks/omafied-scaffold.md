# Omafied – Omarchy laptop compatibility board (v1)

## Product
Community table of laptops that run Omarchy. Super fast browse + live submit. Laptops only.

## Stack (locked)
- Cloudflare Worker (TypeScript)
- D1 for live submits
- Static HTML/CSS/JS from the Worker (assets binding ok)
- No Next.js, no Convex, no git-YAML CMS
- Deploy workers.dev first; omafied.com is on Vercel — do not buy/attach DNS here

## Schema (laptops)
- id TEXT PRIMARY KEY
- brand, model TEXT NOT NULL
- year INTEGER nullable
- wifi, gpu, sleep, audio TEXT NOT NULL CHECK IN (works|partial|broken|unknown)
- notes TEXT, reporter TEXT
- created_at, updated_at TEXT NOT NULL (ISO)

## API / routes
- GET /api/laptops — list newest first
- POST /api/laptops — submit (validate; no auth v1)
- GET / — dense table + filter/search
- GET /submit — form

## Style (canonical)
Match https://radio.omarchy.org/
- Fonts: JetBrains Mono (body), Space Grotesk (titles), VT323 optional
- Tokens: --bg #0a0b0a, --fg #e7e6e0, --ac #5ef2a0, --bd #23261f, muted --c2 #797b74
- Uppercase spaced wordmark OMAFIED, thin 1px borders, theme picker
- Dense table; almost no rounding; no SaaS cards
- Community-reported, not official Omarchy

## Seed
Framework 13/16, XPS, ThinkPad with honest unknown/partial; reporter seed.

## Deliverables
1. Full Worker project: wrangler.toml, package.json, migrations/, src/, public/assets
2. README: npm i, wrangler d1 create, set database_id, migrate, deploy
3. Commit and push to main (repo empty) or open a PR
4. Leave C placeholders — Jason deploys

## Out of scope
Moderation, auth, desktops/phones, custom domain, payments.
