import { tokenize } from "./tokenize";

const DELIMITERS = [",", ";", "\t"] as const;
// Sniff over a bounded prefix (enough rows for the vote, cheap to tokenize three times).
const SNIFF_BYTES = 65536;
const SNIFF_ROWS = 10;

/** Rows sharing the most common (modal) width — higher means a more rectangular, plausible grid. */
function widthConsistency(rows: string[][]): number {
  const counts = new Map<number, number>();
  for (const r of rows) counts.set(r.length, (counts.get(r.length) ?? 0) + 1);
  let most = 0;
  for (const c of counts.values()) most = Math.max(most, c);
  return most;
}

/**
 * Sniff the field delimiter (comma, semicolon, or tab) QUOTE-AWARELY: tokenize a prefix under each
 * candidate and pick the one yielding the most cells. Counting split points on the raw line instead
 * (the old approach) miscounts delimiters INSIDE quoted fields — a `;`-file with comma-bearing quoted
 * labels (European Excel / SmartPLS) then sniffs as comma and collapses to one garbled column.
 * Ties break to the more consistent row width, then to comma (the first candidate). Blank lines are
 * ignored. `opts.delimiter` bypasses this entirely.
 */
export function detectDelimiter(text: string): string {
  const sample = text.slice(0, SNIFF_BYTES);
  let best = ",";
  let bestCells = -1;
  let bestConsistency = -1;
  for (const d of DELIMITERS) {
    const rows = tokenize(sample, d, false)
      .filter((r) => r.some((c) => c !== ""))
      .slice(0, SNIFF_ROWS);
    const cells = rows.reduce((n, r) => n + r.length, 0);
    const consistency = widthConsistency(rows);
    if (cells > bestCells || (cells === bestCells && consistency > bestConsistency)) {
      bestCells = cells;
      bestConsistency = consistency;
      best = d;
    }
  }
  return best;
}
