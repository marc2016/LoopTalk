import type { z } from "zod";
import { AppError, notFound } from "../errors";

export function parseBody<S extends z.ZodType>(schema: S, value: unknown): z.infer<S> {
  const result = schema.safeParse(value ?? {});
  if (!result.success) {
    throw new AppError("bad_request", result.error.issues[0]?.message ?? "Ungültige Eingabe.");
  }
  return result.data;
}

/** IDs in Pfaden: alles, was keine positive Ganzzahl ist, gibt es nicht. */
export function parseId(value: unknown): number {
  const id = typeof value === "string" && /^[1-9]\d{0,15}$/.test(value) ? Number(value) : NaN;
  if (!Number.isSafeInteger(id)) throw notFound();
  return id;
}
