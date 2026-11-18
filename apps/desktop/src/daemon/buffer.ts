/**
 * The most recent output of one session, so a window that reconnects can draw
 * what it missed. Older output is dropped; the disk log that keeps all of it
 * comes later (docs/architecture.md, "Memory design").
 */
export class OutputBuffer {
  private chunks: string[] = [];
  private size = 0;

  constructor(private readonly maxChars: number) {}

  append(data: string): void {
    this.chunks.push(data);
    this.size += data.length;
    while (this.size > this.maxChars && this.chunks.length > 0) {
      const head = this.chunks[0] as string;
      const excess = this.size - this.maxChars;
      if (head.length <= excess) {
        this.chunks.shift();
        this.size -= head.length;
      } else {
        this.chunks[0] = head.slice(excess);
        this.size -= excess;
      }
    }
  }

  text(): string {
    return this.chunks.join("");
  }
}
