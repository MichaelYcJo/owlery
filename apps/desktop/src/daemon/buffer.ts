// The most characters the drop of a line's rest takes, its line break among them. An escape sequence is far shorter.
const LINE_REST_MAX = 4096;

// A private mode sequence: `ESC [ ? Pm h` sets each mode `Pm` names and `ESC [ ? Pm l` resets each, where `Pm` is one number or several joined by `;`.
const PRIVATE_MODES = /\u001b\[\?(\d+(?:;\d+)*)([hl])/g;
// The full reset, `ESC c`, which ends every mode.
const FULL_RESET = "\u001bc";
// The sequence the output stops inside, where it stops inside one: an escape alone or with its intermediate characters, a CSI sequence that holds only parameter characters followed only by intermediate characters, or an OSC string with no end yet. No other unfinished sequence is read. A bell, a cancel (`18`, `1a`), an escape and each code from `80` to `9f` end an OSC string, as xterm's parser reads them. Its rest arrives later, and a terminal that was cleared and not reset reads that rest as the sequence's.
const OPEN_SEQUENCE = /\u001b(?:[ -/]*|\[[0-?]*[ -/]*|\][^\u0007\u0018\u001a\u001b\u0080-\u009f]*)$/;

/**
 * The private modes a text of output leaves a terminal with, as sequences:
 * for each mode number, the last sequence that named it, written for that
 * number alone, set or reset as that sequence had it. They stand in the
 * order in which those last sequences stood. Where the text holds a full
 * reset, only what stands after the last one is read. No other kind of
 * sequence is read: a mode that is not private (`ESC [ 4 h`), a soft reset
 * and a request for a mode's state are not. The read is a pattern over the
 * text, so the same characters inside another sequence's text are read as a
 * mode too.
 */
function lastModes(text: string): string {
  // A map keeps its keys in the order they were last added, once a key named again is taken out first.
  const last = new Map<number, string>();
  // Where the text holds no full reset the search answers -1, and the read starts at the text's first character.
  for (const [, numbers, ends] of text.slice(text.lastIndexOf(FULL_RESET) + 1).matchAll(PRIVATE_MODES)) {
    for (const number of (numbers as string).split(";").map(Number)) {
      last.delete(number);
      last.set(number, ends as string);
    }
  }
  return [...last].map(([number, ends]) => `\u001b[?${number}${ends}`).join("");
}

/**
 * The most recent output of one session, so a window that reconnects can draw
 * what it missed. Older output is dropped, and nothing else keeps it.
 *
 * What it keeps after a drop opens at a line's start, so a replay never opens
 * inside an escape sequence that stands on one line. Where the first line
 * break it keeps stands past its first 4,096 characters, it opens where the
 * count of characters cut it: a program that prints a long stretch without a
 * line break, as a full-screen program may, keeps that stretch.
 */
export class OutputBuffer {
  private chunks: string[] = [];
  private size = 0;

  constructor(private maxChars: number) {}

  append(data: string): void {
    this.chunks.push(data);
    this.size += data.length;
    this.drop();
  }

  /** Gives the buffer another size. A smaller one drops the older output at once, as an append past the size does; a larger one keeps more of what is appended afterwards. */
  setLimit(maxChars: number): void {
    this.maxChars = maxChars;
    this.drop();
  }

  /** Drops the oldest output past the size, and the rest of the line the kept output then opens in. */
  private drop(): void {
    if (this.size <= this.maxChars) return;
    // The last character the count of characters dropped.
    let dropped = "";
    while (this.size > this.maxChars && this.chunks.length > 0) {
      const head = this.chunks[0] as string;
      const excess = this.size - this.maxChars;
      if (head.length <= excess) {
        this.chunks.shift();
        this.size -= head.length;
        dropped = head.slice(-1) || dropped;
      } else {
        this.chunks[0] = head.slice(excess);
        this.size -= excess;
        dropped = head.charAt(excess - 1);
      }
    }
    // A cut after a line break is at a line's start already.
    if (dropped !== "\n") this.dropLineRest();
  }

  /**
   * Empties the buffer: the output it kept is gone, and what is appended
   * afterwards is kept as in a new buffer. With `keepModes` it first reads
   * that output for the private modes a program set or reset, and holds in
   * its place one sequence for each mode (`lastModes`). A replay then opens
   * with those sequences, so a terminal drawn from it has the modes again.
   * They count toward the buffer's size as output does, and the next
   * emptying with `keepModes` reads them as it reads output. Where the output
   * stops inside a sequence `OPEN_SEQUENCE` reads, that unfinished sequence is
   * kept after them, so the rest the program prints next completes it. Every
   * other unfinished sequence is dropped.
   */
  clear(keepModes = false): void {
    const text = keepModes ? this.text() : "";
    const kept = lastModes(text) + (OPEN_SEQUENCE.exec(text)?.[0] ?? "");
    this.chunks = kept === "" ? [] : [kept];
    this.size = kept.length;
  }

  text(): string {
    return this.chunks.join("");
  }

  /** Drops the rest of the line the kept output opens in, through its line break. Where no line break stands within the first `LINE_REST_MAX` characters kept, nothing is dropped. */
  private dropLineRest(): void {
    // The characters kept before the piece at `at`.
    let before = 0;
    for (let at = 0; at < this.chunks.length && before < LINE_REST_MAX; at++) {
      const chunk = this.chunks[at] as string;
      const found = chunk.slice(0, LINE_REST_MAX - before).indexOf("\n");
      if (found === -1) {
        before += chunk.length;
        continue;
      }
      const rest = chunk.slice(found + 1);
      this.chunks.splice(0, at + 1, ...(rest === "" ? [] : [rest]));
      this.size -= before + found + 1;
      return;
    }
  }
}
