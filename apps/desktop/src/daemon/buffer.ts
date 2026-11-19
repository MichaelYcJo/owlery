/**
 * The most recent output of one session, so a window that reconnects can draw
 * what it missed. Older output is dropped; the disk log that keeps all of it
 * comes later (docs/architecture.md, "Memory design").
 *
 * What it keeps after a drop opens at a line's start, so a replay never opens
 * inside an escape sequence that stands on one line.
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

  /** Drops the rest of the line the kept output opens in, through its line break. Where no line break is kept, nothing is dropped. */
  private dropLineRest(): void {
    const at = this.chunks.findIndex((chunk) => chunk.includes("\n"));
    if (at === -1) return;
    const chunk = this.chunks[at] as string;
    const rest = chunk.slice(chunk.indexOf("\n") + 1);
    const gone = this.chunks.splice(0, at + 1, ...(rest === "" ? [] : [rest]));
    this.size -= gone.reduce((sum, each) => sum + each.length, 0) - rest.length;
  }
}
