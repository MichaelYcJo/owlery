import { closeSync, type FSWatcher, openSync, readSync, statSync, watch } from "node:fs";

/**
 * How many bytes of one line of a session log the watch holds and hands on.
 * Claude Code's entry of an interrupted turn ran under 800 bytes in the
 * recording `test/fixtures/claude-interrupted-turn.json`, and the longest
 * lines of its log, a snapshot of the prompt or the shape of a request, ran
 * past 90,000: a longer line is skipped to its end and never handed on.
 */
export const LINE_BYTES = 16 * 1024;
/** How long a watch waits for a log that does not stand yet before it gives up; 10 seconds. Claude Code makes the log at a session's first prompt, after the prompt's hook event. */
export const SESSION_LOG_WAIT_MS = 10_000;
/** How often a watch looks for a log that does not stand yet. */
const APPEAR_POLL_MS = 100;
/** How much of the log one read takes at a time. */
const CHUNK_BYTES = 64 * 1024;
const NOTHING = Buffer.alloc(0);

/**
 * Hands on each line appended to a session log after the watch began, once,
 * whole, and without its line end. Claude Code writes the log in batches, so
 * a read can end inside a line: the watch holds the line's start until the
 * rest arrives, and holds nothing of a line it has handed on. A log that does
 * not stand yet is looked for until `waitMs` passes, and every byte it holds
 * once it stands was appended after the watch began. Where the log never
 * stands, or cannot be watched or read, the watch ends and calls `failed`
 * once. `end` ends it, and nothing is handed on after it.
 */
export class SessionLogWatch {
  private watcher: FSWatcher | undefined;
  private poll: NodeJS.Timeout | undefined;
  private offset = 0;
  private held = NOTHING;
  private skipping = false;
  private ended = false;

  constructor(
    readonly path: string,
    private readonly line: (line: string) => void,
    private readonly failed: (error: Error) => void,
    waitMs = SESSION_LOG_WAIT_MS,
  ) {
    const stands = statSync(path, { throwIfNoEntry: false });
    if (stands !== undefined) {
      this.offset = stands.size;
      this.watch();
      return;
    }
    const until = Date.now() + waitMs;
    const look = (): void => {
      this.poll = undefined;
      if (statSync(path, { throwIfNoEntry: false }) !== undefined) {
        this.watch();
        this.read();
      } else if (Date.now() >= until) this.fail(new Error(`${path} did not stand within ${String(waitMs)} ms`));
      else this.poll = setTimeout(look, APPEAR_POLL_MS);
    };
    this.poll = setTimeout(look, APPEAR_POLL_MS);
  }

  /** Whether the watch still reads: it has not ended, and has not failed. */
  get open(): boolean {
    return !this.ended;
  }

  end(): void {
    this.ended = true;
    this.watcher?.close();
    clearTimeout(this.poll);
    this.held = NOTHING;
  }

  private watch(): void {
    try {
      this.watcher = watch(this.path, () => this.read());
      this.watcher.on("error", (error) => this.fail(error));
    } catch (error) {
      this.fail(error);
    }
  }

  /** Reads what was appended since the last read, to the log's end. */
  private read(): void {
    let file: number | undefined;
    try {
      file = openSync(this.path, "r");
      const chunk = Buffer.alloc(CHUNK_BYTES);
      for (let count = readSync(file, chunk, 0, CHUNK_BYTES, this.offset); count > 0; count = readSync(file, chunk, 0, CHUNK_BYTES, this.offset)) {
        this.offset += count;
        this.take(chunk.subarray(0, count));
      }
    } catch (error) {
      this.fail(error);
    } finally {
      if (file !== undefined) closeSync(file);
    }
  }

  /** Hands on each line `bytes` ends, and holds the start of the line it leaves unfinished. */
  private take(bytes: Buffer): void {
    let start = 0;
    for (let end = bytes.indexOf(0x0a); end >= 0 && !this.ended; end = bytes.indexOf(0x0a, start)) {
      const part = bytes.subarray(start, end);
      start = end + 1;
      if (this.skipping) {
        this.skipping = false;
        continue;
      }
      const whole = this.held.length === 0 ? part : Buffer.concat([this.held, part]);
      this.held = NOTHING;
      if (whole.length <= LINE_BYTES) this.line(whole.toString("utf8"));
    }
    const rest = bytes.subarray(start);
    if (this.skipping || rest.length === 0) return;
    if (this.held.length + rest.length > LINE_BYTES) {
      this.held = NOTHING;
      this.skipping = true;
    } else this.held = Buffer.concat([this.held, rest]);
  }

  /** Ends the watch, which stops every source of a second failure, and calls `failed`. */
  private fail(error: unknown): void {
    this.end();
    this.failed(error instanceof Error ? error : new Error(String(error)));
  }
}
