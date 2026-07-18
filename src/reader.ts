import type { CellValue, CsvOptions, CsvResult } from "./types";
import { decodeInput } from "./decode";
import { detectDelimiter } from "./delimiter";
import { CsvError, DEFAULT_LIMITS } from "./limits";
import { tokenize } from "./tokenize";
import { coerceCell } from "./typing";

type ResolvedCsvOptions = { maxCells: number; trim: boolean; typed: boolean };

/** Resolve the caller options against defaults (the delimiter is resolved separately — it needs the
 * decoded text to sniff). */
function resolveCsvOptions(opts?: CsvOptions): ResolvedCsvOptions {
  return {
    maxCells: opts?.maxCells ?? DEFAULT_LIMITS.maxCells,
    trim: opts?.trim ?? true,
    typed: opts?.typed ?? true,
  };
}

/** Reject a grid whose cell count (rows × widest row) exceeds `maxCells`. */
function assertCellBudget(rows: string[][], maxCells: number): void {
  const cols = rows.reduce((w, r) => Math.max(w, r.length), 0);
  const cells = rows.length * cols;
  if (cells > maxCells)
    throw new CsvError(`This input has ${cells} cells, over the ${maxCells}-cell limit.`);
}

/** Read delimited text (CSV / TSV / semicolon / any single-char delimiter) into a typed cell grid.
 * Synchronous: decode → sniff delimiter → RFC-4180 tokenize → optionally coerce cells and split off
 * a header. `opts.typed` (default true) turns numeric cells into numbers and blanks into null; the
 * header, when requested, is always the raw trimmed strings. */
export function readCsv(input: string | ArrayBuffer | Uint8Array, opts?: CsvOptions): CsvResult {
  const { maxCells, trim, typed } = resolveCsvOptions(opts);
  const text = decodeInput(input);
  const delimiter = opts?.delimiter ?? detectDelimiter(text);
  const raw = tokenize(text, delimiter, trim);
  assertCellBudget(raw, maxCells);
  const grid: CellValue[][] = typed ? raw.map((r) => r.map(coerceCell)) : raw;
  if (opts?.header) {
    return { delimiter, header: (raw[0] ?? []).slice(), rows: grid.slice(1) };
  }
  return { delimiter, rows: grid };
}
