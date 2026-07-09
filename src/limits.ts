/** Thrown for a bad or oversized input a resource bound rejects — a bad file, not a reader bug.
 * Extends Error, so a plain catch still catches it; check `err instanceof CsvError` to tell a
 * rejected input apart from an unexpected bug. */
export class CsvError extends Error {}

/** Generous resource ceilings; no real spreadsheet is affected. Pass `readCsv(input, opts)` with a
 * stricter `maxCells` where memory is tight. */
export const DEFAULT_LIMITS: { maxCells: number } = {
  maxCells: 5_000_000,
};
