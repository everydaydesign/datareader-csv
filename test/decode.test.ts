import { describe, expect, test } from "bun:test";
import { decodeInput } from "../src/decode";
import { CsvError } from "../src/limits";

const enc = (s: string) => new TextEncoder().encode(s);

/** Encode a BMP string as UTF-16 bytes with a leading BOM — the shape Excel's "Unicode text" export
 * produces (test-only; the runtime never encodes UTF-16). */
function utf16(s: string, endian: "be" | "le"): Uint8Array {
  const out: number[] = endian === "le" ? [0xff, 0xfe] : [0xfe, 0xff];
  for (let i = 0; i < s.length; i++) {
    const code = s.charCodeAt(i);
    if (endian === "le") out.push(code & 0xff, code >> 8);
    else out.push(code >> 8, code & 0xff);
  }
  return new Uint8Array(out);
}

describe("decodeInput", () => {
  test("passes a string through", () => {
    expect(decodeInput("a,b\n1,2")).toBe("a,b\n1,2");
  });
  test("strips a leading UTF-8 BOM from a string", () => {
    expect(decodeInput("﻿a,b")).toBe("a,b");
  });
  test("decodes a Uint8Array as UTF-8", () => {
    expect(decodeInput(enc("café,x"))).toBe("café,x");
  });
  test("decodes an ArrayBuffer and strips the BOM", () => {
    const bytes = enc("﻿a,b");
    expect(
      decodeInput(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength)),
    ).toBe("a,b");
  });
  test("decodes UTF-16LE+BOM identically to the UTF-8 parse (Excel 'Unicode text')", () => {
    expect(decodeInput(utf16("a,b\n1,2", "le"))).toBe("a,b\n1,2");
  });
  test("decodes UTF-16BE+BOM identically", () => {
    expect(decodeInput(utf16("a,b\n1,2", "be"))).toBe("a,b\n1,2");
  });
  test("throws CsvError on invalid UTF-8 instead of emitting U+FFFD (lone Windows-1252 byte)", () => {
    // "Temp<é>r" with é as the lone Windows-1252 byte 0xE9 — invalid as UTF-8.
    expect(() => decodeInput(new Uint8Array([0x54, 0x65, 0x6d, 0x70, 0xe9, 0x72]))).toThrow(
      CsvError,
    );
  });
});
