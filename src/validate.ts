export const STATUSES = ["works", "partial", "broken", "unknown"] as const;
export type Status = (typeof STATUSES)[number];

export const TIERS = ["daily", "works", "fiddly", "avoid"] as const;
export type Tier = (typeof TIERS)[number];

export const BUILDS = ["tank", "solid", "meh", "unknown"] as const;
export type Build = (typeof BUILDS)[number];

export type Laptop = {
  id: string;
  brand: string;
  model: string;
  year: number | null;
  wifi: Status;
  gpu: Status;
  sleep: Status;
  audio: Status;
  notes: string | null;
  reporter: string | null;
  created_at: string;
  updated_at: string;
  tier: Tier;
  battery: Status;
  fingerprint: Status;
  build: Build;
  quirks: string | null;
  uniques: string | null;
  cost: number | null;
  used_cost: number | null;
  sweet_spot: string | null;
  agree_up: number;
  agree_down: number;
};

export type LaptopInput = {
  brand: string;
  model: string;
  year: number | null;
  wifi: Status;
  gpu: Status;
  sleep: Status;
  audio: Status;
  notes: string | null;
  reporter: string | null;
  tier: Tier;
  battery: Status;
  fingerprint: Status;
  build: Build;
  quirks: string | null;
  uniques: string | null;
  cost: number | null;
  used_cost: number | null;
  sweet_spot: string | null;
};

export type VoteInput = {
  direction: 1 | -1;
};

const MAX_BRAND = 64;
const MAX_MODEL = 128;
const MAX_NOTES = 2000;
const MAX_REPORTER = 64;
const MAX_QUIRKS = 500;
const MAX_UNIQUES = 500;
const MAX_SWEET = 160;
const YEAR_MIN = 1995;
const YEAR_MAX = 2036;
const COST_MIN = 1;
const COST_MAX = 99999;
const ID_RE = /^[a-zA-Z0-9-]{8,80}$/;

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function asString(value: unknown, field: string, { required, max }: { required: boolean; max: number }): string | null {
  if (value === undefined || value === null) {
    if (required) throw new ValidationError(`${field} is required`);
    return null;
  }
  if (typeof value !== "string") throw new ValidationError(`${field} must be a string`);
  const trimmed = value.replace(/\s+/g, " ").trim();
  if (!trimmed) {
    if (required) throw new ValidationError(`${field} is required`);
    return null;
  }
  if (trimmed.length > max) throw new ValidationError(`${field} must be at most ${max} characters`);
  return trimmed;
}

function asOneOf<T extends string>(value: unknown, field: string, allowed: readonly T[], fallback?: T): T {
  if ((value === undefined || value === null || value === "") && fallback !== undefined) {
    return fallback;
  }
  const raw = asString(value, field, { required: true, max: 16 });
  if (!raw || !allowed.includes(raw as T)) {
    throw new ValidationError(`${field} must be one of ${allowed.join(", ")}`);
  }
  return raw as T;
}

function asStatus(value: unknown, field: string, fallback?: Status): Status {
  return asOneOf(value, field, STATUSES, fallback);
}

function asYear(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value.trim()) : NaN;
  if (!Number.isInteger(n)) throw new ValidationError("year must be an integer");
  if (n < YEAR_MIN || n > YEAR_MAX) throw new ValidationError(`year must be between ${YEAR_MIN} and ${YEAR_MAX}`);
  return n;
}

function asCost(value: unknown, field: string): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value.trim()) : NaN;
  if (!Number.isInteger(n)) throw new ValidationError(`${field} must be an integer USD ballpark`);
  if (n < COST_MIN || n > COST_MAX) {
    throw new ValidationError(`${field} must be between ${COST_MIN} and ${COST_MAX}`);
  }
  return n;
}

export function parseLaptopId(value: string): string {
  if (!ID_RE.test(value)) throw new ValidationError("invalid laptop id");
  return value;
}

export function parseLaptopInput(body: unknown): LaptopInput {
  if (!isRecord(body)) throw new ValidationError("body must be a JSON object");

  const brand = asString(body.brand, "brand", { required: true, max: MAX_BRAND });
  const model = asString(body.model, "model", { required: true, max: MAX_MODEL });
  if (!brand || !model) throw new ValidationError("brand and model are required");

  return {
    brand,
    model,
    year: asYear(body.year),
    wifi: asStatus(body.wifi, "wifi"),
    gpu: asStatus(body.gpu, "gpu"),
    sleep: asStatus(body.sleep, "sleep"),
    audio: asStatus(body.audio, "audio"),
    notes: asString(body.notes, "notes", { required: false, max: MAX_NOTES }),
    reporter: asString(body.reporter, "reporter", { required: false, max: MAX_REPORTER }),
    tier: asOneOf(body.tier, "tier", TIERS, "works"),
    battery: asStatus(body.battery, "battery", "unknown"),
    fingerprint: asStatus(body.fingerprint, "fingerprint", "unknown"),
    build: asOneOf(body.build, "build", BUILDS, "unknown"),
    quirks: asString(body.quirks, "quirks", { required: false, max: MAX_QUIRKS }),
    uniques: asString(body.uniques, "uniques", { required: false, max: MAX_UNIQUES }),
    cost: asCost(body.cost, "cost"),
    used_cost: asCost(body.used_cost, "used_cost"),
    sweet_spot: asString(body.sweet_spot, "sweet_spot", { required: false, max: MAX_SWEET }),
  };
}

export function parseVoteInput(body: unknown): VoteInput {
  if (!isRecord(body)) throw new ValidationError("body must be a JSON object");
  const raw = body.direction;
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw.trim()) : NaN;
  if (n !== 1 && n !== -1) throw new ValidationError("direction must be 1 or -1");
  return { direction: n };
}
