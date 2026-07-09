import { describe, expect, test } from "bun:test";
import Papa from "papaparse";
import { readCsv } from "../src/index";

// Fixtures with NO trailing newline and unambiguous field structure, so csvloader and papaparse
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
      const ours = readCsv(fixture, { typed: false, trim: false, delimiter: "," }).rows;
      const theirs = Papa.parse<string[]>(fixture, { delimiter: "," }).data;
      expect(ours).toEqual(theirs);
    });
  }
});
