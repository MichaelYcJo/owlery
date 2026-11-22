import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { AskedStore } from "../src/daemon/asked";
import type { Asked } from "../src/shared/protocol";

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

function runDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "owlery-run-"));
  cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

const BASE = { id: 1, asks: "Which base does the branch start from?", options: [{ label: "main", implies: "The release's fixes are not in it." }, { label: "release/v0.0.2", implies: "It merges after the release." }], default: 0, answer: null };
const FREE = { id: 2, asks: "What should the screen be called?", options: [], default: null, answer: null };
const PARKED: Asked = { by: "sealer", at: 100, questions: [BASE, FREE], answeredAt: null };
const ONE: Asked = { by: "proofer", at: 200, questions: [{ ...FREE, id: 1 }], answeredAt: null };
const ANSWERS = new Map([
  [1, "main"],
  [2, "둘 다 아니고, 세 번째 방법으로"],
]);
const ANSWERED: Asked = { ...PARKED, questions: [{ ...BASE, answer: "main" }, { ...FREE, answer: "둘 다 아니고, 세 번째 방법으로" }], answeredAt: 300 };
const file = (dir: string): unknown => JSON.parse(readFileSync(join(dir, "asked.json"), "utf8"));

describe("AskedStore", () => {
  it("holds no record until a work item is parked, then that work item's record alone, and a later park of it replaces the record", () => {
    const store = new AskedStore(runDir());
    expect(store.of(7)).toBeNull();
    expect(store.park(7, PARKED)).toEqual(PARKED);
    expect(store.of(7)).toEqual(PARKED);
    expect(store.of(8)).toBeNull();
    expect(store.park(8, ONE)).toEqual(ONE);
    expect(store.park(7, ONE)).toEqual(ONE);
    expect([store.of(7), store.of(8), store.of(9)]).toEqual([ONE, ONE, null]);
  });

  it("keeps a record as it stood, though one it gave or was given changes afterwards", () => {
    const store = new AskedStore(runDir());
    const given: Asked = { ...PARKED, questions: [{ ...BASE, options: BASE.options.map((option) => ({ ...option })) }, { ...FREE }] };
    const parked = store.park(7, given);
    given.by = "changed";
    given.questions[0]!.asks = "changed";
    given.questions[0]!.options[0]!.label = "changed";
    given.questions.pop();
    parked.questions[1]!.asks = "changed";
    store.of(7)!.questions[0]!.options[1]!.implies = "changed";
    store.of(7)!.questions[0]!.options.pop();
    const answered = store.answer(7, ANSWERS, 300)!;
    answered.questions[0]!.answer = "changed";
    store.of(7)!.answeredAt = 9;
    expect(store.of(7)).toEqual(ANSWERED);
  });

  it("answers a parked work item's questions with the time, each question with the answer under its id, and gives nothing and changes nothing for a work item it holds no record of, one already answered, a question left out and an answer to a question the record does not hold", () => {
    const dir = runDir();
    const store = new AskedStore(dir);
    store.park(7, PARKED);
    store.park(8, ONE);
    expect(store.answer(9, ANSWERS, 250)).toBeUndefined();
    expect(store.answer(7, new Map([[1, "main"]]), 250)).toBeUndefined();
    expect(store.answer(7, new Map([...ANSWERS, [3, "a third"]]), 250)).toBeUndefined();
    expect(store.answer(8, ANSWERS, 250)).toBeUndefined();
    expect([store.of(7), store.of(8)]).toEqual([PARKED, ONE]);
    expect(file(dir)).toEqual({ workItems: { 7: PARKED, 8: ONE } });
    expect(store.answer(7, ANSWERS, 300)).toEqual(ANSWERED);
    expect(store.answer(7, ANSWERS, 400)).toBeUndefined();
    expect([store.of(7), store.of(8)]).toEqual([ANSWERED, ONE]);
    expect(file(dir)).toEqual({ workItems: { 7: ANSWERED, 8: ONE } });
  });

  it("writes asked.json in the run directory at each change, readable by the user alone", () => {
    const dir = runDir();
    const store = new AskedStore(dir);
    expect(existsSync(join(dir, "asked.json"))).toBe(false);
    store.park(7, PARKED);
    expect(statSync(join(dir, "asked.json")).mode & 0o777).toBe(0o600);
    expect(file(dir)).toEqual({ workItems: { 7: PARKED } });
    store.park(8, ONE);
    expect(file(dir)).toEqual({ workItems: { 7: PARKED, 8: ONE } });
    expect(readdirSync(dir)).toEqual(["asked.json"]);
  });

  it("reads at start what an earlier store wrote, a parked work item's record and an answered one's as each stood", () => {
    const dir = runDir();
    const earlier = new AskedStore(dir);
    earlier.park(7, PARKED);
    earlier.park(8, ONE);
    earlier.answer(7, ANSWERS, 300);
    const later = new AskedStore(dir);
    expect([later.of(7), later.of(8), later.of(9)]).toEqual([ANSWERED, ONE, null]);
    // The record read is the one a later answer ends.
    expect(later.answer(8, new Map([[1, "The answering screen"]]), 500)).toEqual({ ...ONE, questions: [{ ...ONE.questions[0]!, answer: "The answering screen" }], answeredAt: 500 });
  });

  it("takes the records of the work items given out of the file, leaves the others, and writes nothing where it held none of them", () => {
    const dir = runDir();
    const store = new AskedStore(dir);
    store.park(7, PARKED);
    store.park(8, ONE);
    store.drop([7, 9]);
    expect([store.of(7), store.of(8)]).toEqual([null, ONE]);
    expect(file(dir)).toEqual({ workItems: { 8: ONE } });
    rmSync(join(dir, "asked.json"));
    store.drop([7, 9]);
    expect(existsSync(join(dir, "asked.json"))).toBe(false);
    store.drop([8]);
    expect(file(dir)).toEqual({ workItems: {} });
  });

  it("holds no record where the file is not the store's, and replaces the file at the next park", () => {
    const dir = runDir();
    const path = join(dir, "asked.json");
    const read = (text: string): Asked | null => {
      writeFileSync(path, text);
      return new AskedStore(dir).of(7);
    };
    const held = { workItems: { 7: PARKED } };
    expect(read("{ not json")).toBeNull();
    expect(read("null")).toBeNull();
    expect(read(JSON.stringify([held]))).toBeNull();
    expect(read(JSON.stringify({}))).toBeNull();
    expect(read(JSON.stringify({ workItems: [PARKED] }))).toBeNull();
    // A key that is no work item's id makes the whole file another's, the record under an id among it.
    expect(read(JSON.stringify({ workItems: { 7: PARKED, seven: ONE } }))).toBeNull();
    expect(read(JSON.stringify({ workItems: { 7: [PARKED] } }))).toBeNull();
    expect(read(JSON.stringify({ workItems: { 7: null } }))).toBeNull();
    for (const field of [{ by: 3 }, { at: "100" }, { answeredAt: undefined }, { answeredAt: "300" }, { questions: {} }, { questions: [] }, { questions: [null] }]) {
      expect(read(JSON.stringify({ workItems: { 7: { ...PARKED, ...field } } }))).toBeNull();
    }
    const questions = [
      { id: "1" },
      // A question's id is its place in the record, from 1.
      { id: 2 },
      { asks: 3 },
      { options: {} },
      { options: [null] },
      { options: [{ label: "main" }] },
      { options: [{ label: 3, implies: "x" }] },
      { options: [{ label: "main", implies: null }] },
      { default: undefined },
      { default: "0" },
      // A default names an option of its question.
      { default: 2 },
      { default: -1 },
      { default: 0.5 },
      { answer: undefined },
      { answer: 3 },
    ];
    for (const field of questions) {
      expect(read(JSON.stringify({ workItems: { 7: { ...PARKED, questions: [{ ...BASE, ...field }, FREE] } } }))).toBeNull();
    }
    // The file as the first line of this case would have it read, so the reader is the one under test.
    expect(read(JSON.stringify(held))).toEqual(PARKED);
    expect(read(JSON.stringify({ workItems: { 7: ANSWERED } }))).toEqual(ANSWERED);

    writeFileSync(path, "{ not json");
    const store = new AskedStore(dir);
    expect(store.park(8, ONE)).toEqual(ONE);
    expect(file(dir)).toEqual({ workItems: { 8: ONE } });
  });

  it("reads only the fields of a record, whatever else the file carries", () => {
    const dir = runDir();
    const carried = { ...PARKED, model: "x", questions: [{ ...BASE, kind: "choice", options: BASE.options.map((option) => ({ ...option, note: "x" })) }, { ...FREE, by: "someone" }] };
    writeFileSync(join(dir, "asked.json"), JSON.stringify({ by: "a daemon", workItems: { 7: carried } }));
    expect(new AskedStore(dir).of(7)).toEqual(PARKED);
  });

  it("holds a change though the file cannot be written, and throws what refused the write", () => {
    const dir = runDir();
    // A folder stands where the file goes, so the partial file is written and its rename refused.
    mkdirSync(join(dir, "asked.json"));
    const store = new AskedStore(dir);
    expect(() => store.park(7, PARKED)).toThrow(/rename/);
    expect(() => store.answer(7, ANSWERS, 300)).toThrow(/rename/);
    expect(store.of(7)).toEqual(ANSWERED);
    expect(() => store.drop([7])).toThrow(/rename/);
    expect(store.of(7)).toBeNull();
    expect(readdirSync(dir)).toEqual(["asked.json"]);
  });

  it("keeps the records in memory alone where it is given no run directory", () => {
    // Where a store with no run directory would write, were it to write at all.
    const stray = join(process.cwd(), "asked.json");
    cleanups.push(() => rmSync(stray, { force: true }));
    const store = new AskedStore(undefined);
    store.park(7, PARKED);
    expect(store.of(7)).toEqual(PARKED);
    expect(existsSync(stray)).toBe(false);
  });
});
