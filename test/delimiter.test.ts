import { describe, expect, test } from "bun:test";
import { detectDelimiter } from "../src/delimiter";

describe("detectDelimiter", () => {
  test("comma", () => expect(detectDelimiter("a,b,c")).toBe(","));
  test("semicolon (European export)", () => expect(detectDelimiter("a;b;c")).toBe(";"));
  test("tab", () => expect(detectDelimiter("a\tb\tc")).toBe("\t"));
  test("falls back to comma with no delimiter", () => expect(detectDelimiter("abc")).toBe(","));
  test("picks the most frequent", () => expect(detectDelimiter("a,b;c;d")).toBe(";"));
  test("quote-aware: a semicolon file with comma-bearing quoted labels sniffs as semicolon", () =>
    expect(detectDelimiter('"Q, one";"Q, two";Q3\n1;2;3\n4;5;6')).toBe(";"));
  test("prefers comma on a true tie (single-column input has no delimiter)", () =>
    expect(detectDelimiter("aaa\nbbb\nccc")).toBe(","));
});
