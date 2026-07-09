import type { CellValue, CsvOptions, CsvResult } from "./types";
import { decodeInput } from "./decode";
import { detectDelimiter } from "./delimiter";
import { CsvError, DEFAULT_LIMITS } from "./limits";
import { tokenize } from "./tokenize";
import { coerceCell } from "./typing";

/** The first non-empty line, used to sniff the delimiter (leading blank lines are ignored). */
function firstLine(text: string): string {
  return text.trim().split(/\r?\n/, 1)[0] ?? "";
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
  const trim = opts?.trim ?? true;
  const typed = opts?.typed ?? true;
  const maxCells = opts?.maxCells ?? DEFAULT_LIMITS.maxCells;
  const text = decodeInput(input);
  const delimiter = opts?.delimiter ?? detectDelimiter(firstLine(text));
  const raw = tokenize(text, delimiter, trim);
  assertCellBudget(raw, maxCells);
  const grid: CellValue[][] = typed ? raw.map((r) => r.map(coerceCell)) : raw;
  if (opts?.header) {
    return { delimiter, header: (raw[0] ?? []).slice(), rows: grid.slice(1) };
  }
  return { delimiter, rows: grid };
}
