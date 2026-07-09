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
});
