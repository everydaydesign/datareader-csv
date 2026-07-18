import { describe, expect, test } from "bun:test";
import Papa from "papaparse";
import { readCsv } from "../src/index";

// Fixtures with NO trailing newline and unambiguous field structure, so datareader-csv and papaparse
// (an independent RFC-4180 implementation) must agree on the raw tokenization.
const FIXTURES = [
  "a,b,c\n1,2,3\n4,5,6",
  'label,x\n"hello, world",1\n"foo, bar",2',
  '"a""b",c\n1,2\n3,4',
  'note,x\n"line one\nline two",1',
  "x,y\n10,20\n30,40",
];

describe("differential vs papaparse (dev-only oracle)", () => {
  for (const [i, fixture] of FIXTURES.entries()) {
    test(`fixture ${i} tokenizes identically`, () => {
      const ours = readCsv(fixture, { delimiter: ",", trim: false, typed: false }).rows;
      const theirs = Papa.parse<string[]>(fixture, { delimiter: "," }).data;
      expect(ours).toEqual(theirs);
    });
  }
});

// Both sides SNIFF the delimiter (papaparse's guessDelimiter is the oracle). Covers the M1 shapes the
// old raw-split sniff garbled: quoted delimiters and semicolon + CRLF.
const SNIFF_FIXTURES = [
  '"Q, one";"Q, two";Q3\n1;2;3\n4;5;6', // semicolon file, comma-bearing quoted labels
  "a;b;c\r\n1;2;3\r\n4;5;6", // semicolon + CRLF
];

describe("differential vs papaparse (delimiter sniff)", () => {
  for (const [i, fixture] of SNIFF_FIXTURES.entries()) {
    test(`sniff fixture ${i} agrees on delimiter and rows`, () => {
      const ours = readCsv(fixture, { trim: false, typed: false });
      const theirs = Papa.parse<string[]>(fixture, {});
      expect(ours.delimiter).toBe(theirs.meta.delimiter);
      expect(ours.rows).toEqual(theirs.data);
    });
  }
});
