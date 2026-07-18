/** Mutable cursor for the single-pass RFC-4180 scan (see {@link tokenize}). */
type Scan = {
  delimiter: string;
  field: string;
  i: number;
  quoted: boolean;
  row: string[];
  rows: string[][];
  text: string;
  trim: boolean;
  /** True once the current field has OPENED on a quote — its content is then protected from trim. */
  wasQuoted: boolean;
};

function endField(s: Scan): void {
  // Quoted content is significant per RFC 4180 (intentional surrounding whitespace inside quotes must
  // survive), so trim skips a field that opened on a quote. Unquoted fields still trim as before.
  s.row.push(s.trim && !s.wasQuoted ? s.field.trim() : s.field);
  s.field = "";
  s.wasQuoted = false;
}

function endRow(s: Scan): void {
  endField(s);
  s.rows.push(s.row);
  s.row = [];
}

/** Inside a quoted field: a doubled `""` is one literal quote; a lone `"` closes the field. */
function scanQuoted(s: Scan): void {
  const ch = s.text[s.i];
  if (ch === '"' && s.text[s.i + 1] === '"') {
    s.field += '"';
    s.i += 2;
    return;
  }
  if (ch === '"') {
    s.quoted = false;
    s.i += 1;
    return;
  }
  s.field += ch;
  s.i += 1;
}

/** Outside quotes: `"` opens a quoted field; the delimiter ends a cell; `\r\n`/`\r`/`\n` ends a
 * row; anything else is literal. The runtime delimiter is handled before the switch so the switch
 * keeps only constant case labels. */
function scanUnquoted(s: Scan): void {
  const ch = s.text[s.i];
  if (ch === s.delimiter) {
    endField(s);
    s.i += 1;
    return;
  }
  switch (ch) {
    case '"': {
      if (s.field === "") s.wasQuoted = true; // opens a quoted field only when it's the first char
      s.quoted = true;
      s.i += 1;
      break;
    }
    case "\n": {
      endRow(s);
      s.i += 1;
      break;
    }
    case "\r": {
      endRow(s);
      s.i += s.text[s.i + 1] === "\n" ? 2 : 1;
      break;
    }
    default: {
      s.field += ch;
      s.i += 1;
    }
  }
}

/** RFC-4180 tokenizer: rows of raw string cells honoring quoted fields (embedded
 * delimiters/newlines literal, `""` escapes a quote) and `\r\n`/`\r`/`\n` breaks. A final newline
 * leaves no empty trailing row. Cells are trimmed when `trim` is set — except quoted fields, whose
 * content is significant and kept verbatim. */
export function tokenize(text: string, delimiter: string, trim: boolean): string[][] {
  const s: Scan = {
    delimiter,
    field: "",
    i: 0,
    quoted: false,
    row: [],
    rows: [],
    text,
    trim,
    wasQuoted: false,
  };
  while (s.i < text.length) {
    if (s.quoted) scanQuoted(s);
    else scanUnquoted(s);
  }
  if (s.field !== "" || s.row.length > 0) endRow(s);
  return s.rows;
}
