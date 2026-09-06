import { parseLaptopInput, ValidationError, type Laptop } from "./validate";

const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
} as const;

const MAX_BODY_BYTES = 16 * 1024;

const LIST_SQL = `SELECT id, brand, model, year, wifi, gpu, sleep, audio, notes, reporter, created_at, updated_at
FROM laptops
ORDER BY datetime(created_at) DESC, id DESC`;

const INSERT_SQL = `INSERT INTO laptops (
  id, brand, model, year, wifi, gpu, sleep, audio, notes, reporter, created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;

const GET_SQL = `SELECT id, brand, model, year, wifi, gpu, sleep, audio, notes, reporter, created_at, updated_at
FROM laptops WHERE id = ?`;

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
      if (url.pathname === "/api/laptops") {
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
  const { results } = await env.DB.prepare(LIST_SQL).all<Laptop>();
  return json({ laptops: results ?? [] });
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
    )
    .run();

  const row = await env.DB.prepare(GET_SQL).bind(id).first<Laptop>();
  if (!row) return json({ error: "failed to persist report" }, 500);
  return json({ laptop: row }, 201);
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
