import { mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { RecordTimes } from "../src/daemon/record-times";

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0)) cleanup();
});

function runFolder(): string {
  const runDir = mkdtempSync(join(tmpdir(), "owlery-record-times-"));
  cleanups.push(() => rmSync(runDir, { recursive: true, force: true }));
  return runDir;
}

const stored = (runDir: string): unknown => JSON.parse(readFileSync(join(runDir, "record-times.json"), "utf8"));
const DECIDED = { id: 1, state: "decided" };
const OPEN = { id: 2, state: "open" };

describe("RecordTimes", () => {
  it("gives each block the clock of the read that first found it in its state, keeps that time at every later read, and a second store on the folder gives the same", () => {
    const runDir = runFolder();
    const times = new RecordTimes(runDir);
    expect([...times.since(7, [DECIDED, OPEN], 1000)]).toEqual([[1, 1000], [2, 1000]]);
    expect([...times.since(7, [DECIDED, OPEN], 2000)]).toEqual([[1, 1000], [2, 1000]]);
    // A block read for the first time later is as old as that read.
    expect([...times.since(7, [DECIDED, OPEN, { id: 3, state: "decided" }], 3000)]).toEqual([[1, 1000], [2, 1000], [3, 3000]]);
    times.flush();
    expect(stored(runDir)).toEqual({ workItems: { 7: { 1: { state: "decided", since: 1000 }, 2: { state: "open", since: 1000 }, 3: { state: "decided", since: 3000 } } } });
    expect(statSync(join(runDir, "record-times.json")).mode & 0o777).toBe(0o600);
    expect([...new RecordTimes(runDir).since(7, [DECIDED, OPEN], 9000)]).toEqual([[1, 1000], [2, 1000]]);
  });

  it("gives a block whose state changed the time of the read that found the change, and leaves every other block's time", () => {
    const times = new RecordTimes(runFolder());
    times.since(7, [DECIDED, OPEN], 1000);
    expect([...times.since(7, [{ id: 1, state: "reversed" }, OPEN], 2000)]).toEqual([[1, 2000], [2, 1000]]);
    expect([...times.since(7, [{ id: 1, state: "reversed" }, { id: 2, state: "answered" }], 3000)]).toEqual([[1, 2000], [2, 3000]]);
  });

  it("drops the entry of a block the record no longer holds, so the id read again later starts anew, and tells two work items' blocks of one id apart", () => {
    const runDir = runFolder();
    const times = new RecordTimes(runDir);
    times.since(7, [DECIDED, OPEN], 1000);
    times.since(8, [DECIDED], 1500);
    // Written before the block leaves, so the write below is the one the leaving asks for.
    times.flush();
    expect([...times.since(7, [OPEN], 2000)]).toEqual([[2, 1000]]);
    times.flush();
    expect(stored(runDir)).toEqual({ workItems: { 7: { 2: { state: "open", since: 1000 } }, 8: { 1: { state: "decided", since: 1500 } } } });
    expect([...times.since(7, [DECIDED, OPEN], 3000)]).toEqual([[1, 3000], [2, 1000]]);
    // A work item whose record holds no block holds no entry.
    times.since(8, [], 4000);
    times.flush();
    expect(stored(runDir)).toEqual({ workItems: { 7: { 1: { state: "decided", since: 3000 }, 2: { state: "open", since: 1000 } } } });
  });

  it("drops the work items given and no other, and writes nothing where it holds none of them", () => {
    const runDir = runFolder();
    const times = new RecordTimes(runDir);
    times.since(7, [DECIDED], 1000);
    times.since(8, [DECIDED], 1000);
    times.flush();
    times.drop([7, 99]);
    times.flush();
    expect(stored(runDir)).toEqual({ workItems: { 8: { 1: { state: "decided", since: 1000 } } } });
    // The file is then put back by nobody: a drop of what the store does not hold changes nothing.
    rmSync(join(runDir, "record-times.json"));
    times.drop([7]);
    times.flush();
    expect(() => stored(runDir)).toThrow();
  });

  it("writes only where a read or a drop changed what it holds", () => {
    const runDir = runFolder();
    const times = new RecordTimes(runDir);
    times.since(7, [DECIDED], 1000);
    times.flush();
    rmSync(join(runDir, "record-times.json"));
    times.since(7, [DECIDED], 2000);
    times.flush();
    expect(() => stored(runDir)).toThrow();
    times.since(7, [{ id: 1, state: "reversed" }], 3000);
    times.flush();
    expect(stored(runDir)).toEqual({ workItems: { 7: { 1: { state: "reversed", since: 3000 } } } });
  });

  it("reads a file that is no JSON, or of another shape, as no time, and replaces it at the next read", () => {
    const shapes = ["{", "[]", "null", JSON.stringify({ workItems: [] }), JSON.stringify({ workItems: { x: {} } }), JSON.stringify({ workItems: { 7: { 1: { state: "decided" } } } }), JSON.stringify({ workItems: { 7: { 1: { state: 3, since: 5 } } } }), JSON.stringify({ workItems: { 7: { one: { state: "decided", since: 5 } } } }), JSON.stringify({ workItems: { 7: [] } })];
    for (const text of shapes) {
      const runDir = runFolder();
      writeFileSync(join(runDir, "record-times.json"), text);
      const times = new RecordTimes(runDir);
      expect([...times.since(7, [DECIDED], 2000)], text).toEqual([[1, 2000]]);
      times.flush();
      expect(stored(runDir), text).toEqual({ workItems: { 7: { 1: { state: "decided", since: 2000 } } } });
    }
    // A file of the store's shape is read, so the shapes above are refused by what they hold.
    const runDir = runFolder();
    writeFileSync(join(runDir, "record-times.json"), JSON.stringify({ workItems: { 7: { 1: { state: "decided", since: 5 } } } }));
    expect([...new RecordTimes(runDir).since(7, [DECIDED], 2000)]).toEqual([[1, 5]]);
  });

  it("keeps the times in memory alone where it is given no run folder, and holds a change where its write throws", () => {
    const alone = new RecordTimes(undefined);
    alone.since(7, [DECIDED], 1000);
    alone.flush();
    expect([...alone.since(7, [DECIDED], 2000)]).toEqual([[1, 1000]]);

    const runDir = runFolder();
    // A folder stands where the file goes, so its write is refused.
    mkdirSync(join(runDir, "record-times.json"));
    const times = new RecordTimes(runDir);
    times.since(7, [DECIDED], 1000);
    expect(() => times.flush()).toThrow();
    expect([...times.since(7, [DECIDED], 2000)]).toEqual([[1, 1000]]);
    // The write that failed is not tried again until something changes.
    expect(() => times.flush()).not.toThrow();
  });
});
