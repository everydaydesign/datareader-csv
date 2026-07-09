const BOM = 0xfeff;

/** Strip a single leading UTF-8 BOM (U+FEFF) if present. */
function stripBom(text: string): string {
  return text.charCodeAt(0) === BOM ? text.slice(1) : text;
}

/** Normalize any accepted input to a BOM-free string. Bytes are decoded as UTF-8. */
export function decodeInput(input: string | ArrayBuffer | Uint8Array): string {
  if (typeof input === "string") return stripBom(input);
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);
  return stripBom(new TextDecoder("utf-8").decode(bytes));
}
