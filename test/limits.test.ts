import { describe, expect, test } from "bun:test";
import { CsvError, DEFAULT_LIMITS } from "../src/limits";

describe("limits", () => {
  test("CsvError is a catchable Error subclass", () => {
    const e = new CsvError("bad");
    expect(e).toBeInstanceOf(Error);
    expect(e).toBeInstanceOf(CsvError);
    expect(e.message).toBe("bad");
  });

  test("DEFAULT_LIMITS.maxCells is 5,000,000", () => {
    expect(DEFAULT_LIMITS.maxCells).toBe(5_000_000);
  });
});
