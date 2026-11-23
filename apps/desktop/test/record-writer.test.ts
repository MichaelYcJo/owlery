// The one way the daemon writes a file of a work item's directory. A worktree
// is a checkout the daemon did not write, so a folder on the way to a record,
// or the record's own path, may be a link that leaves the worktree. Each case
// puts one such thing in the way and reads what the write did.
import { existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, statSync, symlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { RECORD_FILE, withDecision, writeRecord } from "../src/daemon/decision-record";
import { writeRecordFile } from "../src/daemon/record-writer";
import { temporaryRepository } from "./repositories";

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

const ITEM = join("seal", "threads", "1-x");
const ROUND = join(ITEM, "trail", "rounds", "round-1.md");
const TEXT = "# Review round 1: 1-x\n";
const decide = (text: string): string => withDecision(text, { kind: "scope", decided: "No push.", grounds: "None asked." });

/** A worktree that holds `seal/threads/`, and a folder beside it, outside the worktree, that holds one file. */
function worktree(): { worktree: string; outside: string } {
  const made = temporaryRepository();
  cleanups.push(made.remove);
  const outside = join(made.base, "outside");
  mkdirSync(join(made.repo, "seal", "threads"), { recursive: true });
  mkdirSync(outside);
  writeFileSync(join(outside, "kept.md"), "kept\n");
  return { worktree: made.repo, outside };
}

/** Every file and folder below a folder, by its path from it. */
function below(folder: string, from = ""): string[] {
  return readdirSync(join(folder, from)).flatMap((name) => {
    const path = join(from, name);
    return lstatSync(join(folder, path)).isDirectory() ? [path, ...below(folder, path)] : [path];
  });
}

describe("the writer of a work item's records", () => {
  it("writes the file whole and makes the folders above it that do not stand, replaces a plain file that stands at its path, and leaves no other file beside it", () => {
    const made = worktree();
    writeRecordFile(made.worktree, join(made.worktree, ROUND), TEXT);
    expect(readFileSync(join(made.worktree, ROUND), "utf8")).toBe(TEXT);
    expect(below(join(made.worktree, "seal"))).toEqual(["threads", "threads/1-x", "threads/1-x/trail", "threads/1-x/trail/rounds", "threads/1-x/trail/rounds/round-1.md"]);
    writeRecordFile(made.worktree, join(made.worktree, ROUND), `${TEXT}\nA second write.\n`);
    expect(readFileSync(join(made.worktree, ROUND), "utf8")).toBe(`${TEXT}\nA second write.\n`);
    expect(readdirSync(join(made.worktree, ITEM, "trail", "rounds"))).toEqual(["round-1.md"]);
  });

  it("refuses a round record and a decision where the work item's directory is a link to a folder outside the worktree, with a sentence that names the path, and writes nothing there", () => {
    const made = worktree();
    symlinkSync(made.outside, join(made.worktree, ITEM));
    expect(() => writeRecordFile(made.worktree, join(made.worktree, ROUND), TEXT)).toThrow("Owlery writes no record at seal/threads/1-x/trail/rounds/round-1.md: seal/threads/1-x is a link, and each folder above a record is a folder of the worktree itself.");
    expect(() => writeRecord(made.worktree, join(made.worktree, ITEM), decide)).toThrow("Owlery writes no record at seal/threads/1-x/decisions.md: seal/threads/1-x is a link, and each folder above a record is a folder of the worktree itself.");
    expect(below(made.outside)).toEqual(["kept.md"]);
  });

  it("refuses a round record where `trail` is a link to a folder outside the worktree, and one where it is a link to a folder inside it, and makes no folder through either", () => {
    const made = worktree();
    mkdirSync(join(made.worktree, ITEM));
    symlinkSync(made.outside, join(made.worktree, ITEM, "trail"));
    expect(() => writeRecordFile(made.worktree, join(made.worktree, ROUND), TEXT)).toThrow("Owlery writes no record at seal/threads/1-x/trail/rounds/round-1.md: seal/threads/1-x/trail is a link, and each folder above a record is a folder of the worktree itself.");
    expect(below(made.outside)).toEqual(["kept.md"]);

    const inside = worktree();
    mkdirSync(join(inside.worktree, ITEM, "elsewhere"), { recursive: true });
    symlinkSync(join(inside.worktree, ITEM, "elsewhere"), join(inside.worktree, ITEM, "trail"));
    expect(() => writeRecordFile(inside.worktree, join(inside.worktree, ROUND), TEXT)).toThrow("seal/threads/1-x/trail is a link");
    expect(readdirSync(join(inside.worktree, ITEM, "elsewhere"))).toEqual([]);
  });

  it("refuses a round record and a decision where a link stands at the record's own path, to a file outside the worktree and to nothing alike, and leaves the link a link and what it leads to as it was", () => {
    const made = worktree();
    const round = join(made.worktree, ROUND);
    mkdirSync(join(made.worktree, ITEM, "trail", "rounds"), { recursive: true });
    symlinkSync(join(made.outside, "kept.md"), round);
    expect(() => writeRecordFile(made.worktree, round, TEXT)).toThrow("Owlery writes no record at seal/threads/1-x/trail/rounds/round-1.md: a link stands at that path, and a record is a file of its own.");
    symlinkSync(join(made.outside, "kept.md"), join(made.worktree, ITEM, RECORD_FILE));
    expect(() => writeRecord(made.worktree, join(made.worktree, ITEM), decide)).toThrow("decisions.md is a link, and Owlery reads it only as a file of its own");
    expect([lstatSync(round).isSymbolicLink(), lstatSync(join(made.worktree, ITEM, RECORD_FILE)).isSymbolicLink(), readFileSync(join(made.outside, "kept.md"), "utf8"), below(made.outside)]).toEqual([true, true, "kept\n", ["kept.md"]]);

    const nowhere = worktree();
    mkdirSync(join(nowhere.worktree, ITEM, "trail", "rounds"), { recursive: true });
    symlinkSync(join(nowhere.outside, "no-such-file"), join(nowhere.worktree, ROUND));
    expect(() => writeRecordFile(nowhere.worktree, join(nowhere.worktree, ROUND), TEXT)).toThrow("a link stands at that path");
    expect(below(nowhere.outside)).toEqual(["kept.md"]);
  });

  it("refuses a record where a link stands at the path of the partial file the write goes through, and writes nothing through the link", () => {
    const made = worktree();
    mkdirSync(join(made.worktree, ITEM, "trail", "rounds"), { recursive: true });
    symlinkSync(join(made.outside, "written.md"), `${join(made.worktree, ROUND)}.${String(process.pid)}`);
    expect(() => writeRecordFile(made.worktree, join(made.worktree, ROUND), TEXT)).toThrow(`Owlery writes no record at seal/threads/1-x/trail/rounds/round-1.md: a link stands at seal/threads/1-x/trail/rounds/round-1.md.${String(process.pid)}, which the write goes through.`);
    expect(below(made.outside)).toEqual(["kept.md"]);
    expect(existsSync(join(made.worktree, ROUND))).toBe(false);
  });

  it("refuses a record where a file stands at a folder's path, where a folder stands at the record's own, and where the path is the worktree's or outside it, and changes nothing", () => {
    const made = worktree();
    writeFileSync(join(made.worktree, ITEM), "a file\n");
    expect(() => writeRecordFile(made.worktree, join(made.worktree, ROUND), TEXT)).toThrow("Owlery writes no record at seal/threads/1-x/trail/rounds/round-1.md: seal/threads/1-x is not a folder.");
    expect(readFileSync(join(made.worktree, ITEM), "utf8")).toBe("a file\n");

    const folder = worktree();
    mkdirSync(join(folder.worktree, ROUND), { recursive: true });
    expect(() => writeRecordFile(folder.worktree, join(folder.worktree, ROUND), TEXT)).toThrow("Owlery writes no record at seal/threads/1-x/trail/rounds/round-1.md: what stands at that path is not a plain file.");
    expect(statSync(join(folder.worktree, ROUND)).isDirectory()).toBe(true);

    expect(() => writeRecordFile(folder.worktree, join(folder.outside, "round-1.md"), TEXT)).toThrow("Owlery writes no record at ../outside/round-1.md: the path is not inside the worktree.");
    expect(() => writeRecordFile(folder.worktree, join(folder.worktree, "seal", "..", "..", "outside", "round-1.md"), TEXT)).toThrow("the path is not inside the worktree");
    expect(() => writeRecordFile(folder.worktree, folder.worktree, TEXT)).toThrow("the path is not inside the worktree");
    expect(below(folder.outside)).toEqual(["kept.md"]);
  });
});
