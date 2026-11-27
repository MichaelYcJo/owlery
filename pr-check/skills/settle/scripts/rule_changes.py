#!/usr/bin/env python3
"""rule_changes — the one reader of a design's `## Rule changes` section.

The grammar is `skills/settle/rule-changes.md` *Rule changes*. `GRAMMAR` below is
the one spelling of its operations in code; the item lines, their fields and
the no-change block are spelt once in `lib/items.py`. `parse` reads a section
into operations, refusing at its line any block that does not match whole, and names, without
refusing it, a line that opens like one of the section's forms and is not it.
Each operation carries its fields' lines at their lines in the design
(`Op.lines`), by which `skills/code-review/scripts/chain_check.py` names a
check line inside a `to` at its line, and `section_lines` finds a
section's lines in a document.
`pending` reads the designs not yet settled, and `removed_by` says which of
their `remove` items with no `from` takes a line's section out, for the two
readers that excuse such a line: `.github/scripts/rules.py` and
`tests/behaviour/test_a_cited_section_stands_in_its_file.py`.
`literals`, `pins` and `copies` say what an operation takes out of a test
and what its `to` repeats of another rule document, over texts their caller
hands them, for `chain_check.py` to name as notices; a copy is read
through `passages.py`, the paste check's reader, loaded on first use.
`apply_op` places one operation in one document's text as the grammar
places it, for `settle --draft` to write; it reads a table row
through `lib/tables.py`, loaded on first use.
`settle` prints what they read and writes what `apply_op` returns; nothing
here writes a file.

Headings and fences are read through `lib/lines.py` (`live_lines`,
`heading_level`, `liveness`, `blank_fences`, `comment_lines`) and a text's
lines through `lib/blocks.py#gfm_lines`, each loaded on first use, so this
module spells no fence or heading rule of its own. A design is a
record and carries no HTML comment, so `parse` reads it with no comment
state and refuses a section line that begins with `<!--`; `headings`
keeps the comment state for `section_lines`, which reads the policy
documents.
"""

import ast
import collections
import glob
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
# `lib/` first on `sys.path`, where `lib/sibling.py` is imported from; the
# import stands in each getter below, at the module's first use, so a copy
# of this script taken on its own loads nothing until it is asked to read.
sys.path.insert(0, os.path.join(HERE, "..", "..", "..", "lib"))
# The modules this reads, each as `lib/sibling.py#load` names it.
READER = "lib/lines.py"
GRAMMAR_READER = "lib/items.py"
BLOCKS = "lib/blocks.py"
FIELDS = "lib/fields.py"
PASSAGES = "skills/settle/scripts/passages.py"
TABLES = "lib/tables.py"

HEADING = "Rule changes"
# Each operation's fields: (required, optional). The item lines, their fields
# and the no-change block are `lib/items.py`'s (`items`, `field_values`,
# `nothing_block`).
GRAMMAR = {
    "add": (("file", "to"), ("section",)),
    "change": (("file", "section", "from", "to"), ()),
    "remove": (("file", "section"), ("from",)),
}

# `lines` maps each field's name to its value's lines as they land, each
# with its line in the design: `[(line number, text)]`, whose texts joined
# with `\n` are the value `old`, `new`, `file` or `section` holds.
Op = collections.namedtuple("Op", "kind file section old new line lines")
# `ops` is None where the design has no section, and `[]` with no error
# where it holds the no-change block; `errors` is `[(line, reason)]`;
# `unread` is `[(line, why)]` for each line that opens like one of the
# section's forms and is not it, which decides nothing (`parse`).
Parsed = collections.namedtuple("Parsed", "ops errors unread")
# What `parse` says of a heading near `## Rule changes`, at its line.
NEAR_HEADING = (
    "`{written}` opens like `## {heading}` and is not it, so it is another "
    "section and none of its lines were read; the one heading read is "
    "`## {heading}`, spelt exactly so"
)


def reader():
    """`lib/lines.py`, the line reader, loaded on first use."""
    import sibling

    return sibling.load(READER)


def grammar():
    """`lib/items.py`, the reader of a section's items and of the no-change
    block, loaded on first use."""
    import sibling

    return sibling.load(GRAMMAR_READER)


def blocks():
    """`lib/blocks.py`, whose `gfm_lines` splits a text where GFM ends a
    line, loaded on first use."""
    import sibling

    return sibling.load(BLOCKS)


def fields():
    """`lib/fields.py`, whose `COMMENT_LINE` is what a reader of a record says
    of a line that opens an HTML comment, loaded on first use."""
    import sibling

    return sibling.load(FIELDS)


def passages():
    """`passages.py`, the paste check's reader, loaded on first use."""
    import sibling

    return sibling.load(PASSAGES)


def tables():
    """`lib/tables.py`, the reader of a GFM table row held to
    cmark-gfm, loaded on first use."""
    import sibling

    return sibling.load(TABLES)


def heading_text(line):
    """A heading line's text, without its `#` runs, trimmed."""
    text = line.strip().lstrip("#").strip()
    return re.sub(r"(^|\s+)#+\s*$", "", text).strip()


def headings(lines, comments=True):
    """`[(index, level, text)]` for every live heading in LINES. `comments`
    is `live_lines`'s: `parse` reads a design with none."""
    r = reader()
    out = []
    for n, (line, live) in enumerate(r.live_lines(lines, comments=comments)):
        level = r.heading_level(line) if live else None
        if level is not None:
            out.append((n, level, heading_text(line)))
    return out


def letters(text):
    """TEXT's letters, case folded. A heading whose letters are those of
    `HEADING` and that is not `## HEADING` is a near miss of it."""
    return re.sub(r"[^a-z]", "", text.casefold())


def parse(text, policy_root):
    """The `## Rule changes` section of a design's TEXT, as a `Parsed`; each
    `file` is a `.md` of the directory POLICY_ROOT or of one group directory
    directly in it, `<policy root>/<name>.md` or
    `<policy root>/<group>/<name>.md`.

    The section is read under `## Rule changes` alone. A heading at any
    level whose letters, case folded, are that heading's, that is not it and
    that stands outside the section is another section: none of its lines
    is read, nothing is refused for it, and it goes to `unread` at its line
    (`NEAR_HEADING`), so the settle reads the design whole. Such a heading
    below level 2 inside the section is a line of the section, refused as
    the items refuse a line outside them, and is not named. A first
    line of the section that opens like the no-change block and is not it
    goes there too (`lib/items.py#unread_block`), beside the refusal
    the items give it. Whether either meant the form is the judgment of the
    agent that reads the design."""
    r, g = reader(), grammar()
    lines = blocks().gfm_lines(text)
    marks = headings(lines, comments=False)
    found = [(n, lv) for n, lv, t in marks if lv == 2 and t == HEADING]
    # A section runs to the next heading of level 2 or higher, so a heading
    # below level 2 inside one is a line of it, read and refused as the
    # items refuse a line outside them, and not named.
    inside = set()
    for start, _ in found:
        end = next((n for n, lv, _ in marks if n > start and lv <= 2), len(lines))
        inside.update(range(start + 1, end))
    unread = [
        (n + 1, NEAR_HEADING.format(written=lines[n].strip(), heading=HEADING))
        for n, lv, t in marks
        if letters(t) == letters(HEADING) and (n, lv) not in found and n not in inside
    ]

    def done(ops, errors):
        return Parsed(ops, errors, unread)

    if not found:
        return done(None, [])
    if len(found) > 1:
        return done([], [(found[1][0] + 1, "a second `## Rule changes`")])
    start = found[0][0]
    end = next((n for n, lv, _ in marks if n > start and lv <= 2), len(lines))
    live = [flag for _, flag in r.live_lines(lines, comments=False)]
    # `live_lines` ANDs two readings, here with no comment state, since a
    # design carries no comment. In this one a code span never leaves
    # its line, so a line dead here is in a fence and is skipped. A fence's
    # opener is live, so a fence inside the section is refused at that line
    # as no field. A line live here and dead in `live` begins inside a code
    # span an earlier line opened, and is refused, before a line
    # beginning with `<!--` is, since an opener inside a span is text.
    literal = r.liveness(lines, spans_cross_lines=False, comments=False)
    commented = set(r.comment_lines(r.blank_fences(lines)))

    body = []
    for n in range(start + 1, end):
        line = lines[n]
        if literal[n] and not live[n]:
            why = (
                "this line begins inside a code span an earlier line opened, "
                "and settle would drop it: close each span on the line that "
                "opens it"
            )
            return done([], [(n + 1, why)])
        if n in commented:
            return done([], [(n + 1, fields().COMMENT_LINE)])
        if not literal[n]:
            continue
        body.append((n + 1, line))
    while body and not body[-1][1].strip():
        body.pop()
    while body and not body[0][1].strip():
        body.pop(0)
    if not body:
        return done([], [(start + 1, "the section is empty")])

    block = g.nothing_block(body)
    if block is not None:
        return done([], block)
    # A first line that opens like the block and is not it is read as the
    # items read it, and named.
    near = g.unread_block(body)
    if near is not None:
        unread.append(near)

    ops, error = g.items(body)
    # An item's kind is judged before a later line's error, in line order.
    for item in ops:
        if item["kind"] == g.NOTHING:
            error = (item["line"], f"`- {g.NOTHING}` is the section's one item")
        elif item["kind"] not in GRAMMAR:
            kinds = ", ".join([*GRAMMAR, g.NOTHING])
            error = (item["line"], f"`{item['kind']}` is not one of {kinds}")
        else:
            continue
        break
    if error:
        return done([], [error])

    out = []
    numbers = [no for no, _ in body]
    for item in ops:
        values, error = g.field_values(item, *GRAMMAR[item["kind"]])
        file = (values or {}).get("file", "")
        # No separator of either system and no drive colon in a name, so a
        # value joins to one file on every platform: at the top level, or in
        # one group directory that is neither `.` nor `..`.
        placed = re.fullmatch(
            re.escape(policy_root) + r"/(?:([^/\\:]+)/)?[^/\\:]+\.md", file
        )
        if not error and (not placed or placed.group(1) in (".", "..")):
            error = (
                item["line"],
                f"`{file}` is not a `.md` of {policy_root}/ or of one group "
                "directory in it",
            )
        if error:
            return done([], [error])
        out.append(
            Op(
                item["kind"],
                file,
                values.get("section"),
                values.get("from"),
                values.get("to"),
                item["line"],
                {
                    name: value_lines(numbers, first, parts)
                    for name, (first, parts) in item["fields"].items()
                },
            )
        )
    return done(out, [])


def value_lines(numbers, first, parts):
    """`[(line number, text)]` for one field whose value lines are PARTS, the
    first at line FIRST, NUMBERS being the line numbers of the section's body
    in order: each part takes the number of its body line, and the leading
    empty parts and the trailing blank ones are dropped and the last part's
    end trimmed, as `lib/items.py#field_values` strips its value."""
    at = numbers.index(first)
    lines = list(zip(numbers[at : at + len(parts)], parts))
    while lines and lines[0][1] == "":
        lines.pop(0)
    while lines and not lines[-1][1].strip():
        lines.pop()
    if lines:
        lines[-1] = (lines[-1][0], lines[-1][1].rstrip())
    return lines


# --- where an operation's text stands in a document ---------------------------


def pattern(old):
    """OLD as a pattern: whitespace runs collapsed, and no match inside a word.
    `settle`'s dry run finds an operation's `from` and `to` with it."""
    words = old.split()
    pat = r"\s+".join(re.escape(w) for w in words)
    if re.match(r"\w", words[0]):
        pat = r"(?<!\w)" + pat
    if re.search(r"\w$", words[-1]):
        pat += r"(?!\w)"
    return re.compile(pat)


def section_lines(text, section):
    """`((first, last), None)`: the lines, counted from 1, that SECTION spans
    in TEXT, from its heading to its last line of text before the next
    heading of its level or higher, and the whole document where SECTION is
    None; or `(None, why)` where the document is absent or the heading is not
    there once. Headings are read through `headings`, with the comment state
    a policy document keeps."""
    if text is None:
        return None, "the document is not in the tree"
    lines = blocks().gfm_lines(text)
    if section is None:
        return (1, len(lines)), None
    marks = headings(lines)
    at = [(n, lv) for n, lv, t in marks if t == section]
    if not at:
        return None, f"no heading `{section}`"
    if len(at) > 1:
        return None, f"heading `{section}` appears {len(at)} times"
    h, level = at[0]
    end = next((n for n, lv, _ in marks if n > h and lv <= level), len(lines))
    while end > h + 1 and not lines[end - 1].strip():
        end -= 1
    return (h + 1, end), None


# --- placing one operation in one document's text -----------------------------


def _cut(text, s, e):
    """TEXT with [s, e) removed, and the line or blank line it leaves tidied."""
    if e < len(text) and text[e] in " \t":
        while e < len(text) and text[e] in " \t":
            e += 1
    else:
        while s > 0 and text[s - 1] in " \t":
            s -= 1
    out = text[:s] + text[e:]
    start = out.rfind("\n", 0, s) + 1
    stop = out.find("\n", s)
    if out[start : stop if stop >= 0 else len(out)].strip():
        return out
    out = out[:start] + (out[stop + 1 :] if stop >= 0 else "")
    if out[max(0, start - 2) : start] == "\n\n" and out[start : start + 1] == "\n":
        out = out[:start] + out[start + 1 :]
    return out


def _last_row(lines, first, stop, new):
    """The index in LINES of the last row of the last table in
    LINES[first:stop], where NEW is one line `tables.py#table_cells` reads
    as a row; else None. A table opens where `tables.py#opens_table` finds a
    header over its delimiter row, on a line outside a fence or a comment,
    and its rows run to the first blank line, as GFM ends a table."""
    walker = tables()
    if "\n" in new or walker.table_cells(new) is None:
        return None
    bare = [line.rstrip("\r\n") for line in lines]
    live = [flag for _, flag in reader().live_lines(bare)]
    last, n = None, first
    while n < stop:
        under = [(n + 1, bare[n + 1])] if n + 1 < stop else []
        if not (live[n] and walker.opens_table(n, bare[n], under)):
            n += 1
            continue
        n += 1
        while n + 1 < stop and bare[n + 1].strip():
            n += 1
        last, n = n, n + 1
    return last


def apply_op(text, op):
    """OP placed in TEXT, a document's text with its line ends, as *Rule
    changes* in `skills/settle/rule-changes.md` places each kind: `(new text, None)`;
    `(None, None)` where a `remove` with no `from` leaves the document empty,
    so it is deleted; or `(None, why)` where OP is not placed, WHY naming the
    file and the section. TEXT is None for a document not in the tree.

    A `from` is found by `pattern` in its section's lines, and only once
    there. An `add` whose `to` is one table row lands as the last row of the
    last table in the section's own text (`_last_row`), and where no table
    stands there, as any `add` does. The document's line end, CRLF or LF, is
    kept in what it writes. AgenticSeal's `settle --draft` calls it once per released
    operation. `copies` above applies an operation too, to the whole document
    with no section, for the runs of words the document will hold; a new
    operation kind is applied in both."""
    if op.kind == "add" and op.section is None:
        if text is not None:
            return None, f"{op.file} exists, and an add with no section creates one"
        return op.new + "\n", None
    if text is None:
        return None, f"{op.file} does not exist"
    lines = blocks().gfm_lines(text, keepends=True)
    marks = headings([line.rstrip("\r\n") for line in lines])
    at = [(n, lv) for n, lv, t in marks if t == op.section]
    if not at:
        return None, f"no heading `{op.section}` in {op.file}"
    h, level = at[0]
    end = next((n for n, lv, _ in marks if n > h and lv <= level), len(lines))
    # A whole-section removal whose heading text the section's own
    # sub-headings repeat names the outer one: a title and the first section
    # under it often read alike, and the outer range holds every other match.
    nested = op.kind == "remove" and op.old is None and all(n < end for n, _ in at)
    if len(at) > 1 and not nested:
        return None, f"heading `{op.section}` appears {len(at)} times in {op.file}"
    nl = "\r\n" if "\r\n" in text else "\n"

    if op.kind == "remove" and op.old is None:
        out = "".join(lines[:h] + lines[end:])
        if not out.strip():
            return None, None
        if end == len(lines):
            out = out.rstrip("\r\n") + nl
        return out, None

    if op.kind == "add":
        own = next((n for n, _, _ in marks if n > h), len(lines))
        row = _last_row(lines, h + 1, own, op.new)
        if row is not None:
            head = lines[: row + 1]
            if not head[-1].endswith(("\n", "\r")):
                head[-1] += nl
            return "".join([*head, op.new + nl, *lines[row + 1 :]]), None
        q = own
        while q > h + 1 and not lines[q - 1].strip():
            q -= 1
        head = lines[:q]
        if not head[-1].endswith(("\n", "\r")):
            head[-1] += nl
        tail = lines[q:own] + lines[own:]
        rule = nl.join(op.new.split("\n")) + nl
        gap = [nl] if own < len(lines) and not lines[q:own] else []
        return "".join([*head, nl, rule, *gap, *tail]), None

    offset = len("".join(lines[: h + 1]))
    region = "".join(lines[h + 1 : end])
    hits = list(pattern(op.old).finditer(region))
    if not hits:
        return None, f"the `from` text is not in section `{op.section}` of {op.file}"
    if len(hits) > 1:
        return None, (
            f"the `from` text appears {len(hits)} times in section `{op.section}` "
            f"of {op.file}"
        )
    s, e = offset + hits[0].start(), offset + hits[0].end()
    if op.kind == "change":
        return text[:s] + nl.join(op.new.split("\n")) + text[e:], None
    return _cut(text, s, e), None


# --- what an operation takes out of a test and repeats of a document ----------

# A string constant of a test reads as a pin of a rule's text from this many
# words. At three words the 0.27.1 settle's record names 44 pins against 26,
# and none more of the literals that failed.
LITERAL_WORDS = 4


def _collapsed(text):
    return " ".join(text.split())


def literals(source):
    """`[(line, text)]` for each string constant of the Python SOURCE that is
    no docstring and holds at least `LITERAL_WORDS` words, its whitespace runs
    collapsed to one space, at the line it starts on. An implicit
    concatenation is one constant, as the parser joins it. Raises the
    parser's SyntaxError or ValueError where SOURCE does not parse; naming
    that file is the caller's."""
    tree = ast.parse(source)
    docstrings = set()
    for node in ast.walk(tree):
        if isinstance(
            node, (ast.Module, ast.ClassDef, ast.FunctionDef, ast.AsyncFunctionDef)
        ):
            first = node.body[0] if node.body else None
            if isinstance(first, ast.Expr) and isinstance(first.value, ast.Constant):
                docstrings.add(id(first.value))
    found = set()
    for node in ast.walk(tree):
        if (
            isinstance(node, ast.Constant)
            and isinstance(node.value, str)
            and id(node) not in docstrings
        ):
            text = _collapsed(node.value)
            if len(text.split()) >= LITERAL_WORDS:
                found.add((node.lineno, text))
    return sorted(found)


def pins(op, taken, found):
    """The entries of FOUND, `[(path, line, text)]` as `literals` gives a
    test file's, whose text stands in TAKEN and not in OP's `to`, both with
    their whitespace runs collapsed. TAKEN is what OP takes out of the policy
    root: its `from`, or for a `remove` with no `from` its section's text;
    None where it takes out nothing."""
    if not taken:
        return []
    taken, kept = _collapsed(taken), _collapsed(op.new or "")
    return [f for f in found if f[2] in taken and f[2] not in kept]


def copies(op, texts, gone=None):
    """`[(path, count, run)]` for each rule document of TEXTS, `{path: text}`,
    other than OP's file, that shares a run of `passages.py#WINDOW` words with
    OP's `to`, read as `passages.py#words` reads both: the number of distinct
    runs shared and the first of them in the `to`'s order. GONE, `{path:
    [(text, put)]}`, is what the same design's operations do to each
    document, all three kinds the parser reads applied before the runs are
    counted. A `change` gives its `from` and its `to`: the `from` is found
    once by `pattern`, across any wrapping, and replaced by the `to`, and a
    `to` whose `from` is not in the document yet, standing in another
    pending design's `to`, is put at its end. A `remove` gives its text and
    None, and the text is taken out. An `add` gives None and its `to`, put at
    the document's end. So a passage the design moves leaves no copy where
    it took it from, a passage a `change` keeps in its `to` is still a copy
    there, and one passage two `add`s put into two documents is a copy in
    each. A run that would span a `to` put at a document's end and the words
    the settle places around it is not counted. [] for an operation with no
    `to`, or whose file `passages.py#in_corpus` leaves out."""
    p = passages()
    if op.new is None or not p.in_corpus(op.file):
        return []
    said = p.words(op.new)
    order = [" ".join(said[i : i + p.WINDOW]) for i in range(len(said) - p.WINDOW + 1)]
    out = []
    for path in sorted(texts):
        if path == op.file or not p.in_corpus(path):
            continue
        text = texts[path]
        for taken, put in (gone or {}).get(path, ()):
            found = 0
            if taken and taken.split():
                # A function, so a backslash in PUT is text, not a group.
                text, found = pattern(taken).subn(
                    lambda _m, put=put: f"\n{put or ''}\n", text, count=1
                )
            if not found and put:
                text = f"{text}\n{put}\n"
        shared = p.windows(p.words(text)).intersection(order)
        if shared:
            out.append((path, len(shared), next(r for r in order if r in shared)))
    return out


# --- the pending designs, not yet settled -------------------------------------


def pending(home, policy_root):
    """`[(Op, work item directory)]` for every item of a pending `## Rule
    changes`: each `frame/design.md` under `<home>/threads/`, HOME the
    `iadd/` root, read through `parse` against POLICY_ROOT. The directory
    is named `<name>/threads/<id>/`, NAME being HOME's own. A design that
    cannot be read as UTF-8, or a section `parse` refuses, gives no item."""
    found = []
    pattern = os.path.join(glob.escape(home), THREADS, "*", *DESIGN.split("/"))
    for path in sorted(glob.glob(pattern)):
        try:
            with open(path, encoding="utf-8") as handle:
                text = handle.read()
        except (OSError, UnicodeDecodeError):
            continue
        work_item = os.path.basename(os.path.dirname(os.path.dirname(path)))
        item = f"{os.path.basename(home)}/{THREADS}/{work_item}/"
        found += [(o, item) for o in parse(text, policy_root).ops or []]
    return found


def removed_by(items, rel, text, line):
    """The work item directory of the first of ITEMS, as `pending` gives
    them, that is a `remove` with no `from` whose section of REL holds LINE,
    REL's text being TEXT; or None. That section leaves at the settle. An
    item whose `from` holds the line is not read here."""
    for o, item in items:
        if o.file != rel or o.kind != "remove" or o.old is not None:
            continue
        span, _ = section_lines(text, o.section)
        if span and span[0] <= line <= span[1]:
            return item
    return None


# A thread's design, relative to its directory: `lib/optin.py#DESIGN`.
DESIGN = "frame/design.md"
# The sub-directory of the root that holds the threads: `lib/optin.py#WORK_ITEMS`.
THREADS = "threads"
