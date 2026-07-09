# datareader-csv

**Correct, zero-dependency CSV/TSV/delimited-text reader for the browser and Node.**

`datareader-csv` parses CSV, TSV, and any single-delimiter text into a typed, row-major grid of plain
JavaScript values: strings, coerced finite numbers, and `null` for blank cells. It is written in
pure TypeScript against a Web platform API (`TextDecoder`) — **no runtime dependencies**, it is
fully **synchronous**, and the same build runs in the browser and in Node.

## Why

The ecosystem has no shortage of CSV parsers, but most drag in a dependency, hand you a
streaming/async API you don't need for an in-memory file, or return untyped strings you then
re-coerce by hand. Real-world exports also break the naive `split(",")` approach: quoted fields
with embedded commas and newlines, `""` escapes, `\r\n`/`\r` line endings, a leading BOM, and the
semicolon or tab delimiters that European Excel, SmartPLS, and Qualtrics emit.

`datareader-csv` was built to read those files correctly with no fuss: a single-pass RFC-4180 tokenizer,
a delimiter sniff over `,`/`;`/`\t`, and opt-out numeric typing — all synchronous, all in one
dependency-free ESM module that behaves identically in a browser upload flow or a Node script. The
tokenizer and delimiter sniff are battle-tested on real Qualtrics and SmartPLS exports.

## Install

```bash
npm i datareader-csv
```

```bash
bun add datareader-csv
pnpm add datareader-csv
yarn add datareader-csv
```

## Usage

### Browser — a picked/dropped `File`

```ts
import { readCsv } from "datareader-csv";

const input =
  document.querySelector<HTMLInputElement>("#file");

input.addEventListener("change", async () => {
  const file = input.files?.[0];
  if (!file) return;

  // File.text() is async; readCsv itself is sync.
  const { header, rows } = readCsv(await file.text(), {
    header: true,
  });

  console.log(header); // column names
  console.log(rows.length); // row count
  console.log(rows[0]); // first data row
});
```

### React — a file input

```tsx
import { useState } from "react";
import { readCsv, type CellValue } from "datareader-csv";

export function CsvImporter() {
  const [header, setHeader] = useState<string[]>([]);
  const [rows, setRows] = useState<CellValue[][]>([]);

  async function onFile(
    e: React.ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;
    const parsed = readCsv(await file.text(), {
      header: true,
    });
    setHeader(parsed.header ?? []);
    setRows(parsed.rows);
  }

  return (
    <>
      <input
        type="file"
        accept=".csv,.tsv,.txt"
        onChange={onFile}
      />
      <p>
        {rows.length} rows × {header.length} columns
      </p>
    </>
  );
}
```

### Node — a file on disk

```ts
import { readFile } from "node:fs/promises";
import { readCsv } from "datareader-csv";

// readFile returns a Buffer (a Uint8Array), which
// readCsv decodes as UTF-8 directly — no .toString().
const { header, rows } = readCsv(
  await readFile("data.csv"),
  { header: true },
);

console.log(header);
console.log(`${rows.length} data rows`);
```

### Typed vs. raw

```ts
import { readCsv } from "datareader-csv";

const csv = "id,score\n007,12.5\n,\n";

// Default: numbers are coerced, blanks become null.
readCsv(csv).rows;
// => [["id", "score"], [7, 12.5], [null, null]]

// typed: false keeps every cell a trimmed string.
readCsv(csv, { typed: false }).rows;
// => [["id", "score"], ["007", "12.5"], ["", ""]]
```

## API

### `readCsv(input, opts?)`

```ts
function readCsv(
  input: string | ArrayBuffer | Uint8Array,
  opts?: CsvOptions,
): CsvResult;
```

Reads delimited text end-to-end — decode → sniff delimiter → RFC-4180 tokenize → optionally coerce
cells and split off a header — and returns a `CsvResult`. **Synchronous**: no `Promise`, no `await`
on the call itself. Throws a `CsvError` when the parsed grid exceeds `maxCells` (see
[Security & limits](#security--limits)).

### `CsvOptions`

```ts
type CsvOptions = {
  // Force the delimiter instead of sniffing it
  // (e.g. ",", ";", "\t", "|").
  delimiter?: string;
  // Treat row 0 as a header: return it as `header`
  // and drop it from `rows`. Default false.
  header?: boolean;
  // Coerce numbers and map blank cells to null.
  // false keeps every cell a trimmed string.
  // Default true.
  typed?: boolean;
  // Trim whitespace around each cell. Default true.
  trim?: boolean;
  // Reject inputs whose grid (rows × columns)
  // exceeds this many cells. Default 5,000,000.
  maxCells?: number;
};
```

### `CsvResult`

```ts
type CsvResult = {
  // The delimiter used — the sniffed one, or
  // opts.delimiter when provided.
  delimiter: string;
  // The header row, present only when
  // opts.header was true.
  header?: string[];
  // Row-major cells. Excludes the header row when
  // opts.header was true.
  rows: CellValue[][];
};

// A parsed cell: a string, a coerced finite number,
// or null (a blank cell).
type CellValue = string | number | null;
```

### `CsvError`

```ts
class CsvError extends Error {}
```

Thrown when a resource bound rejects an oversized input (a bad file, not a reader bug). Because it
extends `Error`, a plain `catch` still catches it; check `err instanceof CsvError` to tell a
rejected input apart from an unexpected bug.

### `DEFAULT_LIMITS`

```ts
const DEFAULT_LIMITS: { maxCells: number } = {
  maxCells: 5_000_000, // rows × columns ceiling
};
```

The default ceiling `readCsv` uses when you pass no `maxCells`. No real spreadsheet is affected;
pass a stricter value where memory is tight.

## Type inference

With `typed` true (the default), each raw cell is coerced by one rule:

- A **blank** cell (empty after trimming) → `null`.
- A cell that parses to a **finite number** → that `number`.
- **Everything else** stays the `string`.

Blank is tested first because `Number("")` is `0`. The number test uses JavaScript's `Number()`, so
any numeric-looking string coerces — including ones you may want to keep as text:

```ts
readCsv("code\n007").rows; // => [["code"], [7]]
readCsv("v\n1e3").rows; // => [["v"], [1000]]
readCsv("v\n0x10").rows; // => [["v"], [16]]
```

Zip codes, product codes, and leading-zero IDs lose their form (`"007"` → `7`). When you need the
exact text, pass `typed: false` — every cell stays a trimmed string and nothing is coerced:

```ts
readCsv("code\n007", { typed: false }).rows;
// => [["code"], ["007"]]
```

## Format coverage

| Area         | Handled                                                                              |
| ------------ | ------------------------------------------------------------------------------------ |
| Delimiters   | `,` `;` `\t` sniffed from the first non-empty line (comma fallback); any single character via `delimiter` |
| Quoting      | `"…"` fields with embedded delimiters and newlines; `""` escapes a literal quote      |
| Line endings | `\r\n`, `\r`, and `\n`; a trailing newline adds no empty row                          |
| BOM          | a single leading UTF-8 BOM (U+FEFF) is stripped                                       |
| Encoding     | UTF-8, decoded via `TextDecoder` (`ArrayBuffer`/`Uint8Array` in, string out)         |
| Whitespace   | each cell trimmed by default (`trim: false` keeps it)                                 |

## Security & limits

`datareader-csv` bounds the one attacker-controllable allocation — the parsed grid. After tokenizing, it
rejects any input whose cell count (`rows × widest row`) exceeds `maxCells` (default **5,000,000**)
with a catchable `CsvError`, so a pathologically wide or tall file can't silently balloon memory in
whatever consumes the grid.

```ts
import { readCsv, CsvError } from "datareader-csv";

try {
  const { rows } = readCsv(text, { maxCells: 200_000 });
} catch (err) {
  if (err instanceof CsvError) {
    // input too large — reject it
  }
}
```

Recommendations for consumers:

- Still bound the **input** size before you hand text/bytes to `readCsv` — reject files larger than
  you expect. `maxCells` caps the parsed grid, not the raw byte length the tokenizer reads.
- Treat header strings (and any file-derived cell) as **untrusted** — don't use a header label as a
  plain-object key without care; prefer a `Map` or a `null`-prototype object to avoid
  prototype-pollution surprises from adversarial names.

## Roadmap

`datareader-csv` reads delimited text correctly today and is intentionally **read-only** (no writer). On
the map for future releases:

- **Multi-line delimiter sniff** — the delimiter is currently guessed from the first non-empty line;
  sampling several lines would harden the guess on ragged files.
- **More encodings** — input is decoded as UTF-8 today; declared or alternate encodings (e.g.
  windows-125x) via `TextDecoder` are a natural extension.
- **Streaming** — a chunked API for files too large to hold in memory, alongside today's
  whole-string read.

Issues and contributions are welcome.

## License

MIT © 2026 everydaydesign
