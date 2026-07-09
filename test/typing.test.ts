import { describe, expect, test } from "bun:test";
import { coerceCell } from "../src/typing";

describe("coerceCell", () => {
  test("blank → null", () => {
    expect(coerceCell("")).toBeNull();
    expect(coerceCell("   ")).toBeNull();
  });
  test("integers and decimals → number", () => {
    expect(coerceCell("42")).toBe(42);
    expect(coerceCell("3.14")).toBe(3.14);
    expect(coerceCell("-0.5")).toBe(-0.5);
    expect(coerceCell("1e5")).toBe(100000);
  });
  test("non-numeric → string", () => {
    expect(coerceCell("N/A")).toBe("N/A");
    expect(coerceCell("2026-07-09")).toBe("2026-07-09");
    expect(coerceCell("true")).toBe("true");
  });
  test("Infinity/NaN literals stay strings (not finite)", () => {
    expect(coerceCell("Infinity")).toBe("Infinity");
    expect(coerceCell("NaN")).toBe("NaN");
  });
  test("documented gotcha: leading-zero numeric strings coerce", () => {
    expect(coerceCell("007")).toBe(7);
  });
});
