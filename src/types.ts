/** A parsed cell: a string, a coerced finite number, or null (a blank cell). Deliberately no
 * boolean/Date inference — a delimited file carries no type information beyond "looks numeric". */
export type CellValue = string | number | null;

/** Options for {@link readCsv}. All optional; the defaults suit a typed comma/semicolon/tab file. */
export type CsvOptions = {
  /** Force the field delimiter instead of sniffing it (e.g. ",", ";", "\t", "|"). */
  delimiter?: string;
  /** Treat row 0 as a header: return it as `header` and exclude it from `rows`. Default false. */
  header?: boolean;
  /** Infer numbers and map blank cells to null. false keeps every cell a (trimmed) string. Default true. */
  typed?: boolean;
  /** Trim whitespace around each cell. Default true. */
  trim?: boolean;
  /** Reject inputs whose grid exceeds this many cells (rows × columns). Default 5,000,000. */
  maxCells?: number;
};

/** The result of {@link readCsv}. */
export type CsvResult = {
  /** The delimiter used — the sniffed one, or `opts.delimiter` when provided. */
  delimiter: string;
  /** The header row, present only when `opts.header` was true. */
  header?: string[];
  /** Row-major cell grid. Excludes the header row when `opts.header` was true. */
  rows: CellValue[][];
};
