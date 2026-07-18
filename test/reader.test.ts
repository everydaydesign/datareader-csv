import { describe, expect, test } from "bun:test";
import { CsvError, readCsv } from "../src/index";

describe("readCsv", () => {
  test("typed by default: numeric cells become numbers, header row stays strings", () => {
    const r = readCsv("a,b,c\n1,2,3\n4,5,6");
    expect(r.delimiter).toBe(",");
    expect(r.header).toBeUndefined();
    expect(r.rows).toEqual([
      ["a", "b", "c"],
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });

  test("typed:false keeps every cell a string", () => {
    const r = readCsv("a,b\n1,2", { typed: false });
    expect(r.rows).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  test("header:true splits off the header and excludes it from rows", () => {
    const r = readCsv("a,b\n1,2\n3,4", { header: true });
    expect(r.header).toEqual(["a", "b"]);
    expect(r.rows).toEqual([
      [1, 2],
      [3, 4],
    ]);
  });

  test("header:true keeps a numeric-looking header as raw strings", () => {
    const r = readCsv("1,2\n3,4", { header: true });
    expect(r.header).toEqual(["1", "2"]);
    expect(r.rows).toEqual([[3, 4]]);
  });

  test("blank cells → null when typed", () => {
    const r = readCsv("a,b\n1,\n,4");
    expect(r.rows).toEqual([
      ["a", "b"],
      [1, null],
      [null, 4],
    ]);
  });

  test("sniffs a semicolon delimiter", () => {
    const r = readCsv("a;b;c\n1;2;0.4967");
    expect(r.delimiter).toBe(";");
    expect(r.rows).toEqual([
      ["a", "b", "c"],
      [1, 2, 0.4967],
    ]);
  });

  test("delimiter override wins over the sniff", () => {
    const r = readCsv("a|b\n1|2", { delimiter: "|", typed: false });
    expect(r.delimiter).toBe("|");
    expect(r.rows).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });

  test("accepts a Uint8Array and strips the BOM", () => {
    const bytes = new TextEncoder().encode("﻿a,b\n1,2");
    const r = readCsv(bytes);
    expect(r.rows).toEqual([
      ["a", "b"],
      [1, 2],
    ]);
  });

  test("throws CsvError when the grid exceeds maxCells", () => {
    expect(() => readCsv("a,b\n1,2\n3,4", { maxCells: 3 })).toThrow(CsvError);
  });

  test("a grid with exactly maxCells cells is accepted; one over throws (boundary is `>`)", () => {
    expect(() => readCsv("a,b\nc,d", { maxCells: 4, typed: false })).not.toThrow(); // 2×2 = 4 cells
    expect(() => readCsv("a,b\nc,d", { maxCells: 3, typed: false })).toThrow(CsvError);
  });

  test("a quote-bearing semicolon file (comma-bearing quoted labels) sniffs as semicolon, not comma", () => {
    const r = readCsv('"Q, one";"Q, two";Q3\n1;2;3', { typed: false });
    expect(r.delimiter).toBe(";");
    expect(r.rows).toEqual([
      ["Q, one", "Q, two", "Q3"],
      ["1", "2", "3"],
    ]);
  });

  test("preserves protected whitespace inside a quoted field (trim skips quoted cells)", () => {
    const r = readCsv('"  padded  ",x\n1,2', { typed: false });
    expect(r.rows[0]).toEqual(["  padded  ", "x"]);
  });

  test("throws CsvError on a non-UTF-8 byte stream instead of corrupting names", () => {
    // A Windows-1252 'é' (0xE9) is an invalid lone UTF-8 byte.
    expect(() => readCsv(new Uint8Array([0x61, 0xe9, 0x2c, 0x62]))).toThrow(CsvError);
  });
});
