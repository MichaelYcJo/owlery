import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { Ledger } from "../src/daemon/ledger";
import type { LedgerEntry } from "../src/shared/protocol";

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

function runFolder(): string {
  const runDir = mkdtempSync(join(tmpdir(), "owlery-ledger-"));
  cleanups.push(() => rmSync(runDir, { recursive: true, force: true }));
  return runDir;
}

/** What `console.error` is given until the case ends. */
function errors(): unknown[][] {
  const said: unknown[][] = [];
  const error = console.error;
  console.error = (...args: unknown[]) => void said.push(args);
  cleanups.push(() => {
    console.error = error;
  });
  return said;
}

const lines = (runDir: string): string[] => readFileSync(join(runDir, "ledger.jsonl"), "utf8").split("\n");

/** An entry of work item 7 that started at `startedAt`, with what else a case gives it. */
function entry(startedAt: number, more: Partial<LedgerEntry> = {}): LedgerEntry {
  return {
    workItemId: 7,
    repo: "/repos/project",
    branch: "owlery/asked-in",
    stage: { role: "proofer", stage: "round" },
    startedAt,
    endedAt: startedAt + 500,
    state: "finished",
    stopped: null,
    usage: { costUsd: 0.25, converted: true, models: [{ model: "owl-1", inputTokens: 10, outputTokens: 20, cacheReadTokens: null, cacheWriteTokens: 0, costUsd: 0.25 }] },
    ...more,
  };
}

describe("Ledger", () => {
  it("appends each entry as one line of a file the user alone can read, and gives a work item's entries in the order they were added, to a second store on the folder too", () => {
    const runDir = runFolder();
    const ledger = new Ledger(runDir);
    const first = entry(1000);
    const other = entry(1100, { workItemId: 8 });
    const second = entry(1200, { stage: null, state: "failed", stopped: "limit", usage: null });
    for (const added of [first, other, second]) ledger.add(added);
    expect(lines(runDir)).toEqual([JSON.stringify(first), JSON.stringify(other), JSON.stringify(second), ""]);
    expect(statSync(join(runDir, "ledger.jsonl")).mode & 0o777).toBe(0o600);
    expect(ledger.read(7, 0)).toEqual({ entries: [first, second], unread: 0 });
    expect(new Ledger(runDir).read(8, 0)).toEqual({ entries: [other], unread: 0 });
    expect(new Ledger(runDir).read(9, 0)).toEqual({ entries: [], unread: 0 });
  });

  it("gives an empty ledger where its file does not exist", () => {
    const said = errors();
    expect(new Ledger(runFolder()).read(7, 0)).toEqual({ entries: [], unread: 0 });
    expect(said).toEqual([]);
  });

  it("gives a work item no entry that started before the time it is read from, and gives one that started at that time", () => {
    const runDir = runFolder();
    const ledger = new Ledger(runDir);
    // An earlier work item under the same id, before `repositories.json` was lost.
    const earlier = entry(900);
    const atCreation = entry(1000);
    ledger.add(earlier);
    ledger.add(atCreation);
    expect(ledger.read(7, 1000)).toEqual({ entries: [atCreation], unread: 0 });
    expect(ledger.read(7, 1001)).toEqual({ entries: [], unread: 0 });
  });

  it("counts each line it cannot read as an entry, gives the others, and leaves those lines in the file at the next add", () => {
    const runDir = runFolder();
    const kept = entry(1000);
    const written = [JSON.stringify(kept), "{not json", JSON.stringify({ workItemId: 7, startedAt: 1000 })];
    writeFileSync(join(runDir, "ledger.jsonl"), `${written.join("\n")}\n`);
    const ledger = new Ledger(runDir);
    expect(ledger.read(7, 0)).toEqual({ entries: [kept], unread: 2 });
    const added = entry(2000);
    ledger.add(added);
    expect(lines(runDir)).toEqual([...written, JSON.stringify(added), ""]);
    expect(ledger.read(7, 0)).toEqual({ entries: [kept, added], unread: 2 });
  });

  it("writes the next entry on a line of its own after a last line a crash cut, and the first entry of an empty file on its first line", () => {
    const runDir = runFolder();
    const torn = JSON.stringify(entry(1000)).slice(0, 40);
    writeFileSync(join(runDir, "ledger.jsonl"), torn);
    const ledger = new Ledger(runDir);
    const added = entry(2000);
    ledger.add(added);
    expect(lines(runDir)).toEqual([torn, JSON.stringify(added), ""]);
    expect(ledger.read(7, 0)).toEqual({ entries: [added], unread: 1 });
    // A crash between the file's creation and its first line leaves it empty.
    writeFileSync(join(runDir, "ledger.jsonl"), "");
    ledger.add(added);
    expect(lines(runDir)).toEqual([JSON.stringify(added), ""]);
  });

  it("reads as an entry only a line with every field in its type, a stage a pair the protocol lists, the gate or none, and a usage with its mark", () => {
    const runDir = runFolder();
    const good = entry(1000);
    const model = good.usage!.models[0]!;
    const wrong: unknown[] = [
      [],
      null,
      { ...good, workItemId: "7" },
      { ...good, repo: null },
      { ...good, branch: 1 },
      { ...good, stage: { role: "proofer", stage: "seal" } },
      { ...good, stage: { role: null, stage: "round" } },
      { ...good, stage: "gate" },
      { ...good, startedAt: "1000" },
      { ...good, endedAt: null },
      { ...good, state: "working" },
      { ...good, stopped: "crash" },
      { ...good, usage: undefined },
      { ...good, usage: { costUsd: "0.25", converted: true, models: [] } },
      { ...good, usage: { costUsd: 0.25, converted: "yes", models: [] } },
      { ...good, usage: { costUsd: 0.25, models: [] } },
      { ...good, usage: { costUsd: 0.25, converted: true, models: {} } },
      { ...good, usage: { costUsd: 0.25, converted: true, models: [null] } },
      { ...good, usage: { costUsd: 0.25, converted: true, models: [{ ...model, model: 1 }] } },
      ...(["inputTokens", "outputTokens", "cacheReadTokens", "cacheWriteTokens", "costUsd"] as const).map((count) => ({ ...good, usage: { ...good.usage, models: [{ ...model, [count]: "10" }] } })),
    ];
    const right = [
      entry(1001, { stage: { role: "crafter", stage: "fix-pass" } }),
      entry(1002, { stage: { role: "sealer", stage: "seal" } }),
      entry(1003, { stage: null, usage: null }),
      entry(1004, { usage: { costUsd: null, converted: false, models: [] } }),
      entry(1006, { state: "failed", stopped: "request", usage: null }),
      entry(1007, { state: "failed", stopped: "daemon", usage: null }),
    ];
    // A field the protocol does not name is not given with the entry.
    const more = { ...entry(1005), vendor: "x", stage: { role: "proofer", stage: "round", more: "x" }, usage: { ...good.usage, raw: "x", models: [{ ...model, raw: "x" }] } };
    writeFileSync(join(runDir, "ledger.jsonl"), `${[...wrong, ...right, more].map((value) => JSON.stringify(value)).join("\n")}\n`);
    expect(new Ledger(runDir).read(7, 0)).toEqual({ entries: [...right, entry(1005)], unread: wrong.length });
  });

  it("keeps an entry whose append failed, says so in its log, gives it in every read meanwhile, and writes it before the next entry once the file can be written", () => {
    const said = errors();
    const runDir = runFolder();
    // A folder where the file would be refuses the append, and the read.
    mkdirSync(join(runDir, "ledger.jsonl"));
    const ledger = new Ledger(runDir);
    const kept = entry(1000);
    ledger.add(kept);
    expect(said.map((args) => String(args[0]))).toEqual([expect.stringMatching(/^an entry of the ledger was not written: /)]);
    expect(ledger.read(7, 0)).toEqual({ entries: [kept], unread: 0 });
    expect(said.map((args) => String(args[0]))).toEqual([expect.stringMatching(/^an entry of the ledger was not written: /), expect.stringMatching(/^the ledger was not read: /)]);
    rmSync(join(runDir, "ledger.jsonl"), { recursive: true });
    const next = entry(2000);
    ledger.add(next);
    expect(lines(runDir)).toEqual([JSON.stringify(kept), JSON.stringify(next), ""]);
    expect(ledger.read(7, 0)).toEqual({ entries: [kept, next], unread: 0 });
    expect(said).toHaveLength(2);
  });

  it("gives back an entry of the gate, which has no usage", () => {
    const runDir = runFolder();
    const gate = entry(1000, { stage: { role: null, stage: "gate" }, usage: null });
    new Ledger(runDir).add(gate);
    expect(new Ledger(runDir).read(7, 0)).toEqual({ entries: [gate], unread: 0 });
  });

  it("gives the entries held since an append failed after the lines of a file it can still read", () => {
    const said = errors();
    const runDir = runFolder();
    const ledger = new Ledger(runDir);
    const first = entry(1000);
    ledger.add(first);
    // A file the user can read and not write refuses the append alone.
    chmodSync(join(runDir, "ledger.jsonl"), 0o400);
    const second = entry(2000);
    ledger.add(second);
    expect(ledger.read(7, 0)).toEqual({ entries: [first, second], unread: 0 });
    chmodSync(join(runDir, "ledger.jsonl"), 0o600);
    const third = entry(3000);
    ledger.add(third);
    expect(lines(runDir)).toEqual([first, second, third].map((written) => JSON.stringify(written)).concat(""));
    expect(said.map((args) => String(args[0]))).toEqual([expect.stringMatching(/^an entry of the ledger was not written: /)]);
  });

  it("keeps the entries in memory alone where it is given no run directory", () => {
    const said = errors();
    const ledger = new Ledger(undefined);
    const first = entry(1000);
    ledger.add(first);
    ledger.add(entry(1100, { workItemId: 8 }));
    expect(ledger.read(7, 0)).toEqual({ entries: [first], unread: 0 });
    expect(ledger.read(7, 1001)).toEqual({ entries: [], unread: 0 });
    expect(said).toEqual([]);
  });
});
