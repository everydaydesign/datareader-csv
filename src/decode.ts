import { CsvError } from "./limits";

const BOM = 0xfeff;

/** Strip a single leading UTF-8 BOM (U+FEFF) if present. */
function stripBom(text: string): string {
  return text.charCodeAt(0) === BOM ? text.slice(1) : text;
}

/** Decode bytes that carry a UTF-16 BOM (`FF FE` / `FE FF`, e.g. Excel's "Unicode text" export) with
 * the matching decoder — which consumes the BOM natively — or return null when there's no UTF-16 BOM. */
function decodeUtf16ByBom(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) return new TextDecoder("utf-16le").decode(bytes);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) return new TextDecoder("utf-16be").decode(bytes);
  return null;
}

/**
 * Normalize any accepted input to a BOM-free string.
 * - A string is already decoded — only a leading BOM is stripped.
 * - Bytes are decoded by their content, never assumed UTF-8: a UTF-16 BOM selects the UTF-16 decoder,
 *   and everything else decodes as UTF-8 with `{ fatal: true }`. Invalid bytes then throw a `CsvError`
 *   naming the problem instead of SILENTLY emitting U+FFFD replacement characters (e.g. a lone
 *   Windows-1252 `é`) — silent corruption of variable names is the worst failure mode here.
 */
export function decodeInput(input: string | ArrayBuffer | Uint8Array): string {
  if (typeof input === "string") return stripBom(input);
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  const utf16 = decodeUtf16ByBom(bytes);
  if (utf16 !== null) return utf16;
  try {
    return stripBom(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
  } catch {
    throw new CsvError(
      "This file isn't valid UTF-8 (or UTF-16). Re-save it as UTF-8 CSV and try again.",
    );
  }
}
