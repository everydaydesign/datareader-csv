import { describe, expect, test } from "bun:test";
import { detectDelimiter } from "../src/delimiter";

describe("detectDelimiter", () => {
  test("comma", () => expect(detectDelimiter("a,b,c")).toBe(","));
  test("semicolon (European export)", () => expect(detectDelimiter("a;b;c")).toBe(";"));
  test("tab", () => expect(detectDelimiter("a\tb\tc")).toBe("\t"));
  test("falls back to comma with no delimiter", () => expect(detectDelimiter("abc")).toBe(","));
  test("picks the most frequent", () => expect(detectDelimiter("a,b;c;d")).toBe(";"));
});
