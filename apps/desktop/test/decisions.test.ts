import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { DecisionStore } from "../src/daemon/decisions";
import type { Decision } from "../src/shared/protocol";

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

function runDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "owlery-run-"));
  cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

const ROUTE = { kind: "route", says: "Build it with no framer.", grounds: "The issue names one file, apps/desktop/src/renderer/view.ts." } as const;
const DEFAULT = { kind: "default", says: "Start from main.", grounds: "frame/questions.md Q1 states main as its default." } as const;
const FIRST: Decision = { id: 1, ...ROUTE, at: 100, reversed: null };
const SECOND: Decision = { id: 2, ...DEFAULT, at: 200, reversed: null };
const file = (dir: string): unknown => JSON.parse(readFileSync(join(dir, "decisions.json"), "utf8"));

describe("DecisionStore", () => {
  it("holds no decision until one is recorded, then gives each an id of its own, from 1, over every work item, in the order they were recorded and with no reversal", () => {
    const store = new DecisionStore(runDir());
    expect(store.of(7)).toEqual([]);
    expect(store.record(7, ROUTE, 100)).toEqual(FIRST);
    expect(store.record(8, DEFAULT, 200)).toEqual(SECOND);
    expect(store.record(7, DEFAULT, 300)).toEqual({ ...SECOND, id: 3, at: 300 });
    expect(store.of(7)).toEqual([FIRST, { ...SECOND, id: 3, at: 300 }]);
    expect(store.of(8)).toEqual([SECOND]);
    expect(store.of(9)).toEqual([]);
  });

  it("keeps a decision as it stood, though one it gave or was given changes afterwards", () => {
    const store = new DecisionStore(runDir());
    const given = { ...ROUTE };
    const recorded = store.record(7, given, 100) as { says: string };
    (given as { says: string }).says = "changed";
    recorded.says = "changed";
    const reversed = store.reverse(7, 1, "No, frame it.", 150);
    (reversed!.reversed as { message: string }).message = "changed";
    (store.of(7)[0] as { grounds: string }).grounds = "changed";
    (store.of(7)[0]!.reversed as { at: number }).at = 9;
    store.of(7).pop();
    expect(store.of(7)).toEqual([{ ...FIRST, reversed: { at: 150, message: "No, frame it." } }]);
  });

  it("reverses a decision of the work item named, with the time and the message, and gives nothing and changes nothing for a decision of another work item, one it does not hold and one already reversed", () => {
    const dir = runDir();
    const store = new DecisionStore(dir);
    store.record(7, ROUTE, 100);
    store.record(8, DEFAULT, 200);
    expect(store.reverse(7, 2, "wrong work item", 250)).toBeUndefined();
    expect(store.reverse(7, 9, "no such decision", 250)).toBeUndefined();
    expect(store.reverse(9, 1, "no such work item", 250)).toBeUndefined();
    expect([store.of(7), store.of(8)]).toEqual([[FIRST], [SECOND]]);
    expect(store.reverse(7, 1, "No, frame it.", 300)).toEqual({ ...FIRST, reversed: { at: 300, message: "No, frame it." } });
    expect(store.reverse(7, 1, "a second time", 400)).toBeUndefined();
    expect(store.of(7)).toEqual([{ ...FIRST, reversed: { at: 300, message: "No, frame it." } }]);
    expect(file(dir)).toEqual({ nextId: 3, workItems: { 7: [{ ...FIRST, reversed: { at: 300, message: "No, frame it." } }], 8: [SECOND] } });
  });

  it("writes decisions.json in the run directory at each change, readable by the user alone", () => {
    const dir = runDir();
    const store = new DecisionStore(dir);
    expect(existsSync(join(dir, "decisions.json"))).toBe(false);
    store.record(7, ROUTE, 100);
    expect(statSync(join(dir, "decisions.json")).mode & 0o777).toBe(0o600);
    expect(file(dir)).toEqual({ nextId: 2, workItems: { 7: [FIRST] } });
    store.record(8, DEFAULT, 200);
    expect(file(dir)).toEqual({ nextId: 3, workItems: { 7: [FIRST], 8: [SECOND] } });
    expect(readdirSync(dir)).toEqual(["decisions.json"]);
  });

  it("reads at start what an earlier store wrote, a reversal among it, and gives the next decision an id above every one that was ever given", () => {
    const dir = runDir();
    const earlier = new DecisionStore(dir);
    earlier.record(7, ROUTE, 100);
    earlier.record(7, DEFAULT, 200);
    earlier.record(8, DEFAULT, 250);
    earlier.reverse(7, 2, "기본값 말고 main에서 시작해 주세요", 300);
    // The work item that held the highest id is gone, and its id is given to no later decision.
    earlier.drop([8]);
    const later = new DecisionStore(dir);
    expect(later.of(7)).toEqual([FIRST, { ...SECOND, reversed: { at: 300, message: "기본값 말고 main에서 시작해 주세요" } }]);
    expect(later.of(8)).toEqual([]);
    expect(later.record(9, ROUTE, 400).id).toBe(4);
  });

  it("takes the decisions of the work items given out of the file, leaves the others, and writes nothing where it held none of them", () => {
    const dir = runDir();
    const store = new DecisionStore(dir);
    store.record(7, ROUTE, 100);
    store.record(8, DEFAULT, 200);
    store.drop([7, 9]);
    expect([store.of(7), store.of(8)]).toEqual([[], [SECOND]]);
    expect(file(dir)).toEqual({ nextId: 3, workItems: { 8: [SECOND] } });
    rmSync(join(dir, "decisions.json"));
    store.drop([7, 9]);
    expect(existsSync(join(dir, "decisions.json"))).toBe(false);
    store.drop([8]);
    expect(file(dir)).toEqual({ nextId: 3, workItems: {} });
  });

  it("holds no decision where the file is not the store's, and replaces the file at the next record", () => {
    const dir = runDir();
    const path = join(dir, "decisions.json");
    const read = (text: string): Decision[] => {
      writeFileSync(path, text);
      return new DecisionStore(dir).of(7);
    };
    const held = { nextId: 3, workItems: { 7: [FIRST, SECOND] } };
    expect(read("{ not json")).toEqual([]);
    expect(read("null")).toEqual([]);
    expect(read(JSON.stringify([held]))).toEqual([]);
    expect(read(JSON.stringify({ workItems: held.workItems }))).toEqual([]);
    expect(read(JSON.stringify({ ...held, nextId: "3" }))).toEqual([]);
    expect(read(JSON.stringify({ ...held, nextId: 2.5 }))).toEqual([]);
    // An id the file holds would be given a second time.
    expect(read(JSON.stringify({ ...held, nextId: 2 }))).toEqual([]);
    expect(read(JSON.stringify({ nextId: 3 }))).toEqual([]);
    expect(read(JSON.stringify({ ...held, workItems: [[FIRST]] }))).toEqual([]);
    expect(read(JSON.stringify({ ...held, workItems: { seven: [FIRST] } }))).toEqual([]);
    expect(read(JSON.stringify({ ...held, workItems: { 7: FIRST } }))).toEqual([]);
    expect(read(JSON.stringify({ ...held, workItems: { 7: [null] } }))).toEqual([]);
    for (const field of [{ id: "1" }, { kind: "guess" }, { kind: 3 }, { says: 3 }, { grounds: null }, { at: "100" }, { reversed: undefined }, { reversed: "no" }, { reversed: { at: "1", message: "x" } }, { reversed: { at: 1, message: 3 } }, { reversed: { at: 1 } }]) {
      expect(read(JSON.stringify({ ...held, workItems: { 7: [{ ...FIRST, ...field }] } }))).toEqual([]);
    }
    // The file as the first line of this case would have it read, so the reader is the one under test.
    expect(read(JSON.stringify(held))).toEqual([FIRST, SECOND]);
    expect(read(JSON.stringify({ ...held, workItems: { 7: [{ ...FIRST, reversed: { at: 1, message: "x" } }] } }))).toEqual([{ ...FIRST, reversed: { at: 1, message: "x" } }]);

    writeFileSync(path, "{ not json");
    const store = new DecisionStore(dir);
    expect(store.record(7, ROUTE, 100)).toEqual(FIRST);
    expect(file(dir)).toEqual({ nextId: 2, workItems: { 7: [FIRST] } });
  });

  it("reads only the fields of a decision, whatever else the file carries", () => {
    const dir = runDir();
    writeFileSync(join(dir, "decisions.json"), JSON.stringify({ nextId: 2, by: "a daemon", workItems: { 7: [{ ...FIRST, model: "x", reversed: { at: 5, message: "no", by: "someone" } }] } }));
    expect(new DecisionStore(dir).of(7)).toEqual([{ ...FIRST, reversed: { at: 5, message: "no" } }]);
  });

  it("holds a change though the file cannot be written, and throws what refused the write", () => {
    const dir = runDir();
    // A folder stands where the file goes, so the partial file is written and its rename refused.
    mkdirSync(join(dir, "decisions.json"));
    const store = new DecisionStore(dir);
    expect(() => store.record(7, ROUTE, 100)).toThrow(/rename/);
    expect(() => store.reverse(7, 1, "No.", 200)).toThrow(/rename/);
    expect(store.of(7)).toEqual([{ ...FIRST, reversed: { at: 200, message: "No." } }]);
    expect(() => store.drop([7])).toThrow(/rename/);
    expect(store.of(7)).toEqual([]);
    expect(readdirSync(dir)).toEqual(["decisions.json"]);
  });

  it("keeps the decisions in memory alone where it is given no run directory", () => {
    // Where a store with no run directory would write, were it to write at all.
    const stray = join(process.cwd(), "decisions.json");
    cleanups.push(() => rmSync(stray, { force: true }));
    const store = new DecisionStore(undefined);
    store.record(7, ROUTE, 100);
    expect(store.of(7)).toEqual([FIRST]);
    expect(existsSync(stray)).toBe(false);
  });
});
