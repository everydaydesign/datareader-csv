import type { CellValue } from "./types";

/** Coerce a raw string cell to a {@link CellValue}: a blank cell → null; a cell that parses to a
 * finite number → that number; anything else stays the string. Blank is checked first because
 * `Number("")` is 0. Any `Number()`-parseable cell coerces, so `"007"` → 7 — callers needing exact
 * text pass `typed: false`. */
export function coerceCell(raw: string): CellValue {
  if (raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : raw;
}
