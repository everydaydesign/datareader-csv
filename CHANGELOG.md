# Changelog

All notable changes to `datareader-csv` are documented here.
The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and this
project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.0] — 2026-07-18

Correctness pass on encoding, delimiter sniffing, and quoted-field handling. Two **behavior changes**
(marked below); pin `0.1.x` if you depend on the old behavior.

### Changed
- **Encoding is now content-aware (behavior change).** Byte input (`ArrayBuffer`/`Uint8Array`) is
  decoded by its content instead of always as UTF-8: a UTF-16 BOM (`FF FE` / `FE FF`, e.g. Excel's
  "Unicode text" export) selects the matching UTF-16 decoder, and other bytes decode as UTF-8 with
  `{ fatal: true }`. Bytes that are neither valid UTF-8 nor UTF-16 now throw a `CsvError` — previously
  they were silently mangled into U+FFFD replacement characters. String input is unchanged (BOM strip).
- **Quoted fields are no longer trimmed (behavior change).** With the default `trim: true`, only
  **unquoted** cells are trimmed; a quoted field's content is significant per RFC 4180 and kept verbatim.
- **Delimiter sniffing is quote-aware.** The delimiter is chosen by tokenizing a sample under each
  candidate (`,` `;` `\t`) and picking the one that yields the most cells (ties → most consistent row
  width, then comma), instead of counting raw split points on the first line. Fixes semicolon files
  whose quoted labels contain commas (European Excel / SmartPLS), which previously sniffed as comma.

## [0.1.0] — 2026-07-09

### Added
- Initial release: zero-dependency CSV/TSV/delimited-text reader for the browser and Node.
  Synchronous `readCsv`, RFC-4180 conformant, papaparse-validated.

[0.2.0]: https://github.com/everydaydesign/datareader-csv/releases/tag/v0.2.0
[0.1.0]: https://github.com/everydaydesign/datareader-csv/releases/tag/v0.1.0
