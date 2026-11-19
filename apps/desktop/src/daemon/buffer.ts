// The most characters the drop of a line's rest takes, its line break among them. An escape sequence is far shorter.
const LINE_REST_MAX = 4096;

/**
 * The most recent output of one session, so a window that reconnects can draw
 * what it missed. Older output is dropped; the disk log that keeps all of it
 * comes later (docs/architecture.md, "Memory design").
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

  constructor(private readonly maxChars: number) {}

  append(data: string): void {
    this.chunks.push(data);
    this.size += data.length;
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
