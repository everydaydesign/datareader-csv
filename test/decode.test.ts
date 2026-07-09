import { describe, expect, test } from "bun:test";
import { decodeInput } from "../src/decode";

const enc = (s: string) => new TextEncoder().encode(s);

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
});
