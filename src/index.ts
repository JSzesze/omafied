import {
  parseLaptopId,
  parseLaptopInput,
  parseVoteInput,
  ValidationError,
  type Laptop,
} from "./validate";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
} as const;

const MAX_BODY_BYTES = 16 * 1024;

const LAPTOP_COLS = `l.id, l.brand, l.model, l.year, l.wifi, l.gpu, l.sleep, l.audio,
  l.notes, l.reporter, l.created_at, l.updated_at,
  l.tier, l.battery, l.fingerprint, l.build, l.quirks, l.uniques,
  l.cost, l.used_cost, l.sweet_spot,
  COALESCE(v.up, 0) AS agree_up,
  COALESCE(v.down, 0) AS agree_down`;

const VOTE_JOIN = `LEFT JOIN (
  SELECT laptop_id,
    SUM(CASE WHEN direction = 1 THEN 1 ELSE 0 END) AS up,
    SUM(CASE WHEN direction = -1 THEN 1 ELSE 0 END) AS down
  FROM votes
  GROUP BY laptop_id
) v ON v.laptop_id = l.id`;

const LIST_SQL = `SELECT ${LAPTOP_COLS}
FROM laptops l
${VOTE_JOIN}
ORDER BY datetime(l.created_at) DESC, l.id DESC`;

const GET_SQL = `SELECT ${LAPTOP_COLS}
FROM laptops l
${VOTE_JOIN}
WHERE l.id = ?`;

const INSERT_SQL = `INSERT INTO laptops (
  id, brand, model, year, wifi, gpu, sleep, audio, notes, reporter, created_at, updated_at,
  tier, battery, fingerprint, build, quirks, uniques, cost, used_cost, sweet_spot
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const GET_VOTE_SQL = `SELECT id, direction FROM votes WHERE laptop_id = ? AND voter_hash = ?`;

const INSERT_VOTE_SQL = `INSERT INTO votes (id, laptop_id, direction, voter_hash, created_at)
VALUES (?, ?, ?, ?, ?)`;

const UPDATE_VOTE_SQL = `UPDATE votes SET direction = ?, created_at = ? WHERE id = ?`;

const DELETE_VOTE_SQL = `DELETE FROM votes WHERE id = ?`;

const VOTE_PATH = /^\/api\/laptops\/([^/]+)\/vote$/;

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "OPTIONS" && url.pathname.startsWith("/api/")) {
      return new Response(null, { status: 204, headers: cors(request) });
    }

    try {
      if (url.pathname === "/api/laptops" && request.method === "GET") {
        return withCors(request, await listLaptops(env));
      }
      if (url.pathname === "/api/laptops" && request.method === "POST") {
        return withCors(request, await createLaptop(request, env));
      }
      const voteMatch = VOTE_PATH.exec(url.pathname);
      if (voteMatch && request.method === "POST") {
        return withCors(request, await voteLaptop(request, env, voteMatch[1] ?? ""));
      }
      if (url.pathname === "/api/laptops" || url.pathname.startsWith("/api/laptops/")) {
        return withCors(request, json({ error: "method not allowed" }, 405));
      }
      if (url.pathname.startsWith("/api/")) {
        return withCors(request, json({ error: "not found" }, 404));
      }
    } catch (err) {
      if (err instanceof ValidationError) {
        return withCors(request, json({ error: err.message }, 400));
      }
      console.error(err);
      return withCors(request, json({ error: "internal error" }, 500));
    }

    return env.ASSETS.fetch(request);
  },
};

async function listLaptops(env: Env): Promise<Response> {
  const { results } = await env.DB.prepare(LIST_SQL).all<Record<string, unknown>>();
  return json({ laptops: (results ?? []).map(normalizeLaptop) });
}

async function createLaptop(request: Request, env: Env): Promise<Response> {
  const raw = await readJson(request);
  const input = parseLaptopInput(raw);
  const now = new Date().toISOString();
  const id = crypto.randomUUID();

  await env.DB.prepare(INSERT_SQL)
    .bind(
      id,
      input.brand,
      input.model,
      input.year,
      input.wifi,
      input.gpu,
      input.sleep,
      input.audio,
      input.notes,
      input.reporter,
      now,
      now,
      input.tier,
      input.battery,
      input.fingerprint,
      input.build,
      input.quirks,
      input.uniques,
      input.cost,
      input.used_cost,
      input.sweet_spot,
    )
    .run();

  const row = await env.DB.prepare(GET_SQL).bind(id).first<Record<string, unknown>>();
  if (!row) return json({ error: "failed to persist report" }, 500);
  return json({ laptop: normalizeLaptop(row) }, 201);
}

async function voteLaptop(request: Request, env: Env, rawId: string): Promise<Response> {
  const id = parseLaptopId(rawId);
  const input = parseVoteInput(await readJson(request));
  const hash = await voterHash(request);
  const now = new Date().toISOString();

  const laptop = await env.DB.prepare(`SELECT id FROM laptops WHERE id = ?`).bind(id).first<{ id: string }>();
  if (!laptop) return json({ error: "laptop not found" }, 404);

  const existing = await env.DB.prepare(GET_VOTE_SQL)
    .bind(id, hash)
    .first<{ id: string; direction: number }>();

  if (!existing) {
    await env.DB.prepare(INSERT_VOTE_SQL)
      .bind(crypto.randomUUID(), id, input.direction, hash, now)
      .run();
  } else if (existing.direction === input.direction) {
    await env.DB.prepare(DELETE_VOTE_SQL).bind(existing.id).run();
  } else {
    await env.DB.prepare(UPDATE_VOTE_SQL).bind(input.direction, now, existing.id).run();
  }

  const row = await env.DB.prepare(GET_SQL).bind(id).first<Record<string, unknown>>();
  if (!row) return json({ error: "laptop not found" }, 404);
  return json({ laptop: normalizeLaptop(row) });
}

function normalizeLaptop(row: Record<string, unknown>): Laptop {
  return {
    id: String(row.id ?? ""),
    brand: String(row.brand ?? ""),
    model: String(row.model ?? ""),
    year: asNullableInt(row.year),
    wifi: asStatusField(row.wifi),
    gpu: asStatusField(row.gpu),
    sleep: asStatusField(row.sleep),
    audio: asStatusField(row.audio),
    notes: asNullableString(row.notes),
    reporter: asNullableString(row.reporter),
    created_at: String(row.created_at ?? ""),
    updated_at: String(row.updated_at ?? ""),
    tier: asTierField(row.tier),
    battery: asStatusField(row.battery),
    fingerprint: asStatusField(row.fingerprint),
    build: asBuildField(row.build),
    quirks: asNullableString(row.quirks),
    uniques: asNullableString(row.uniques),
    cost: asNullableInt(row.cost),
    used_cost: asNullableInt(row.used_cost),
    sweet_spot: asNullableString(row.sweet_spot),
    agree_up: asInt(row.agree_up),
    agree_down: asInt(row.agree_down),
  };
}

function asNullableString(value: unknown): string | null {
  if (value == null) return null;
  const s = String(value);
  return s.length ? s : null;
}

function asInt(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
}

function asNullableInt(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isInteger(n) ? n : null;
}

function asStatusField(value: unknown): Laptop["wifi"] {
  const s = String(value ?? "unknown");
  if (s === "works" || s === "partial" || s === "broken" || s === "unknown") return s;
  return "unknown";
}

function asTierField(value: unknown): Laptop["tier"] {
  const s = String(value ?? "works");
  if (s === "daily" || s === "works" || s === "fiddly" || s === "avoid") return s;
  return "works";
}

function asBuildField(value: unknown): Laptop["build"] {
  const s = String(value ?? "unknown");
  if (s === "tank" || s === "solid" || s === "meh" || s === "unknown") return s;
  return "unknown";
}

async function voterHash(request: Request): Promise<string> {
  const ip =
    request.headers.get("cf-connecting-ip") ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown";
  const ua = request.headers.get("user-agent") || "";
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(`${ip}\n${ua}`));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function readJson(request: Request): Promise<unknown> {
  const length = Number(request.headers.get("content-length") || "0");
  if (length > MAX_BODY_BYTES) throw new ValidationError("body too large");

  const text = await request.text();
  if (text.length > MAX_BODY_BYTES) throw new ValidationError("body too large");
  if (!text.trim()) throw new ValidationError("body must be a JSON object");

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new ValidationError("body must be valid JSON");
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function cors(request: Request): HeadersInit {
  const origin = request.headers.get("origin") || "*";
  return {
    "access-control-allow-origin": origin,
    "access-control-allow-methods": "GET, POST, OPTIONS",
    "access-control-allow-headers": "content-type",
    vary: "origin",
  };
}

function withCors(request: Request, response: Response): Response {
  const headers = new Headers(response.headers);
  const extra = cors(request);
  for (const [k, v] of Object.entries(extra)) headers.set(k, v);
  return new Response(response.body, { status: response.status, headers });
}
