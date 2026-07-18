import { describe, expect, test } from "bun:test";
import { tokenize } from "../src/tokenize";

describe("tokenize (RFC-4180)", () => {
  test("simple rows", () => {
    expect(tokenize("a,b\n1,2", ",", true)).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
  test("a quoted field with an embedded delimiter is one cell", () => {
    expect(tokenize('"hello, world",1', ",", true)).toEqual([["hello, world", "1"]]);
  });
  test('a doubled "" becomes one literal quote', () => {
    expect(tokenize('"a""b",c', ",", true)).toEqual([['a"b', "c"]]);
  });
  test("a newline inside a quoted field stays in one record", () => {
    expect(tokenize('"line one\nline two",1', ",", true)).toEqual([["line one\nline two", "1"]]);
  });
  test("CRLF and CR line endings both break rows", () => {
    expect(tokenize("a,b\r\n1,2\r3,4", ",", true)).toEqual([
      ["a", "b"],
      ["1", "2"],
      ["3", "4"],
    ]);
  });
  test("a trailing newline leaves no empty final row", () => {
    expect(tokenize("a,b\n1,2\n", ",", true)).toEqual([
      ["a", "b"],
      ["1", "2"],
    ]);
  });
  test("trim=true trims cells; trim=false preserves whitespace", () => {
    expect(tokenize(" a , b ", ",", true)).toEqual([["a", "b"]]);
    expect(tokenize(" a , b ", ",", false)).toEqual([[" a ", " b "]]);
  });
  test("honors a non-comma delimiter", () => {
    expect(tokenize("a;b;c", ";", true)).toEqual([["a", "b", "c"]]);
  });
  test("trim skips a QUOTED field's protected whitespace but still trims the adjacent unquoted one", () => {
    // The quoted cell keeps its padding; the next (unquoted) cell trims — proves wasQuoted resets.
    expect(tokenize('"  padded  ", y ', ",", true)).toEqual([["  padded  ", "y"]]);
  });
});
