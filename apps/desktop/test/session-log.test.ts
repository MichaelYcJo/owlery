import { appendFileSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { LINE_BYTES, SessionLogWatch } from "../src/daemon/session-log";

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

const pause = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A log in a folder of the case's own, and a watch of it that keeps each line it hands on and each failure. */
function watched(before: string | null): { log: string; lines: string[]; failures: Error[]; watch: () => SessionLogWatch } {
  const folder = mkdtempSync(join(tmpdir(), "owlery-session-log-"));
  const log = join(folder, "session.jsonl");
  if (before !== null) writeFileSync(log, before);
  const lines: string[] = [];
  const failures: Error[] = [];
  const watch = () => {
    const made = new SessionLogWatch(log, (line) => lines.push(line), (error) => failures.push(error), 300);
    cleanups.push(() => made.end());
    return made;
  };
  cleanups.push(() => rmSync(folder, { recursive: true, force: true }));
  return { log, lines, failures, watch };
}

describe("SessionLogWatch", () => {
  it("hands on each line appended after it began once and whole, a line written in two parts among them, and skips a line longer than its bound to its end", async () => {
    const { log, lines, failures, watch } = watched('{"before":1}\n');
    watch();
    // Each write waits for the read of the one before, so a line spans reads: the watch is armed at the next turn of the loop.
    for (const part of ['{"one":', `1}\n{"two":2}\n{"long":"`, "x".repeat(LINE_BYTES), "x".repeat(10), `"}\n{"three":3}\n${"y".repeat(LINE_BYTES)}\n${"z".repeat(LINE_BYTES + 1)}\n{"four":4}\n`]) {
      await pause(60);
      appendFileSync(log, part);
    }
    await pause(60);
    expect(lines).toEqual(['{"one":1}', '{"two":2}', '{"three":3}', "y".repeat(LINE_BYTES), '{"four":4}']);
    expect(failures).toEqual([]);
  });

  it("reads a log that stands only after it began from its first byte, and hands nothing on once it ended, though the read that ended it holds more lines", async () => {
    const { log, lines, failures, watch } = watched(null);
    const made = watch();
    writeFileSync(log, '{"one":1}\n');
    await pause(250);
    made.end();
    appendFileSync(log, '{"two":2}\n');
    await pause(60);
    expect([lines, failures, made.open]).toEqual([['{"one":1}'], [], false]);
    const ending = watched("");
    const ends = new SessionLogWatch(
      ending.log,
      (line) => {
        ending.lines.push(line);
        ends.end();
      },
      (error) => ending.failures.push(error),
    );
    cleanups.push(() => ends.end());
    await pause(30);
    appendFileSync(ending.log, '{"one":1}\n{"two":2}\n');
    await pause(60);
    expect([ending.lines, ending.failures]).toEqual([['{"one":1}'], []]);
    // A watch ended while it waits for its log neither fails when the wait would have run out nor reads the log once it stands.
    const unborn = watched(null);
    unborn.watch().end();
    await pause(450);
    writeFileSync(unborn.log, '{"one":1}\n');
    await pause(250);
    expect([unborn.lines, unborn.failures]).toEqual([[], []]);
  });

  it("fails once and stops where the log does not stand within its wait", async () => {
    const { lines, failures, watch } = watched(null);
    const made = watch();
    await pause(500);
    expect([lines, failures.map(({ message }) => message.replace(/^.*\//, "")), made.open]).toEqual([[], ["session.jsonl did not stand within 300 ms"], false]);
  });
});
