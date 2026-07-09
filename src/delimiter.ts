const DELIMITERS = [",", ";", "\t"] as const;

/** Sniff the field delimiter from the first line — whichever of comma, semicolon, or tab occurs
 * most (SmartPLS/European Excel export semicolons; .txt/.tsv are tab). Falls back to comma. */
export function detectDelimiter(firstLine: string): string {
  let best = ",";
  let bestCount = 0;
  for (const d of DELIMITERS) {
    const count = firstLine.split(d).length - 1;
    if (count > bestCount) {
      bestCount = count;
      best = d;
    }
  }
  return best;
}
