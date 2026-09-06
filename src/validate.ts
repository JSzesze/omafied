export const STATUSES = ["works", "partial", "broken", "unknown"] as const;
export type Status = (typeof STATUSES)[number];

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
};

const MAX_BRAND = 64;
const MAX_MODEL = 128;
const MAX_NOTES = 2000;
const MAX_REPORTER = 64;
const YEAR_MIN = 1995;
const YEAR_MAX = 2036;

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

function asStatus(value: unknown, field: string): Status {
  const raw = asString(value, field, { required: true, max: 16 });
  if (!raw || !STATUSES.includes(raw as Status)) {
    throw new ValidationError(`${field} must be one of ${STATUSES.join(", ")}`);
  }
  return raw as Status;
}

function asYear(value: unknown): number | null {
  if (value === undefined || value === null || value === "") return null;
  const n = typeof value === "number" ? value : typeof value === "string" ? Number(value.trim()) : NaN;
  if (!Number.isInteger(n)) throw new ValidationError("year must be an integer");
  if (n < YEAR_MIN || n > YEAR_MAX) throw new ValidationError(`year must be between ${YEAR_MIN} and ${YEAR_MAX}`);
  return n;
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
  };
}
