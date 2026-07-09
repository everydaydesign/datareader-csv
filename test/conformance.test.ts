import { describe, expect, test } from "bun:test";
import { readCsv } from "../src/index";

describe("RFC-4180 conformance (seeded from EasyPLS)", () => {
  test("header + numeric rows (comma)", () => {
    expect(readCsv("a,b,c\n1,2,3\n4,5,6").rows).toEqual([
      ["a", "b", "c"],
      [1, 2, 3],
      [4, 5, 6],
    ]);
  });

  test("semicolon with dot decimals (SmartPLS / European export)", () => {
    const r = readCsv("a;b;c\n1;2;3\n4;5;0.4967");
    expect(r.delimiter).toBe(";");
    expect(r.rows).toEqual([
      ["a", "b", "c"],
      [1, 2, 3],
      [4, 5, 0.4967],
    ]);
  });

  test("tab delimiter", () => {
    const r = readCsv("a\tb\n1\t2\n3\t4");
    expect(r.delimiter).toBe("\t");
    expect(r.rows).toEqual([
      ["a", "b"],
      [1, 2],
      [3, 4],
    ]);
  });

  test("quoted embedded comma is one cell", () => {
    expect(readCsv('label,x\n"hello, world",1', { typed: false }).rows).toEqual([
      ["label", "x"],
      ["hello, world", "1"],
    ]);
  });

  test('escaped "" becomes a literal quote', () => {
    expect(readCsv('"a""b",c\n1,2', { typed: false }).rows[0]).toEqual(['a"b', "c"]);
  });

  test("newline inside a quoted field stays in one record", () => {
    expect(readCsv('note,x\n"line one\nline two",1', { typed: false }).rows).toEqual([
      ["note", "x"],
      ["line one\nline two", "1"],
    ]);
  });

  test("CRLF line endings", () => {
    expect(readCsv("a,b\r\n1,2\r\n3,4").rows).toEqual([
      ["a", "b"],
      [1, 2],
      [3, 4],
    ]);
  });

  test("strips a leading UTF-8 BOM from the header", () => {
    expect(readCsv("﻿a,b\n1,2").rows[0]).toEqual(["a", "b"]);
  });

  test("raw Qualtrics shape: quoted ImportId row is one record per column, not split", () => {
    const qualtrics = [
      "StartDate,Q1,ResponseId",
      "Start Date,Question 1,Response ID",
      '"{""ImportId"":""startDate""}","{""ImportId"":""QID1""}","{""ImportId"":""_recordId""}"',
      "2026-01-01 10:00,5,R_abc",
    ].join("\n");
    const r = readCsv(qualtrics, { typed: false });
    expect(r.rows).toHaveLength(4);
    expect(r.rows.every((row) => row.length === 3)).toBe(true);
    expect(r.rows[2][0]).toBe('{"ImportId":"startDate"}');
  });
});
