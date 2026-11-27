// What the committed records of a work item say for the inspection sheet,
// as the daemon reads them at the branch's head commit: the inspection's record,
// the rounds with their findings, the commit that lapsed a lapsed inspection, and
// the refused calls. Each case commits the records to a temporary
// repository as the daemon's writers write them, and no case starts an
// agent or reaches a remote.
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { refusalsText } from "../src/daemon/chain";
import { MARKER } from "../src/daemon/records-place";
import { backRecords } from "../src/daemon/inspection-sheet-records";
import type { Inspection } from "../src/shared/protocol";
import { type Cleanups, commitAll, commitInspection, head, roundRecord, VERSION, write } from "./chain-run";
import { git, temporaryRepository } from "./repositories";

const cleanups: Cleanups = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

const NAME = "1795400730-cleared-work";
const DIRECTORY = `iadd/threads/${NAME}`;
const BRANCH = "feat/cleared-work";
const F = "```";
const HEADING = (round: number): string => `# Review round ${String(round)}: ${NAME}`;

/**
 * A repository whose `main` holds the records root, checked out on a branch
 * that adds a source file and then the records of a chain that cleared it
 * (`chain-run.ts#commitInspection`), with the options that helper takes.
 * `before` commits what the branch holds before the records.
 */
function sealedBranch(options: { inspection?: boolean; verdict?: string; before?: (repo: string) => void } = {}) {
  const made = temporaryRepository();
  cleanups.push(made.remove);
  const repo = made.repo;
  write(repo, "iadd/README.md", `${MARKER}\n\nOwlery keeps the work records of this repository here.\n`);
  const base = commitAll(repo, "chore: add the place for work records");
  git(repo, "checkout", "--quiet", "-b", BRANCH);
  write(repo, "feature.txt", "A greeting\n");
  commitAll(repo, "feat: greet");
  options.before?.(repo);
  const gate = commitInspection(repo, { workItem: NAME, branch: BRANCH, base, ...options });
  const directory = join(repo, DIRECTORY);
  return { repo, base, gate, directory, read: (inspection: Inspection | null) => backRecords(repo, directory, head(repo), inspection) };
}

/** A lapsed inspection of the commit, with a sentence the module does not read. */
const lapsed = (commit: string): Inspection => ({ state: "lapsed", commit, why: "A sentence of the inspection." });

describe("the records of the inspection sheet", { timeout: 30_000 }, () => {
  it("reads the round records the branch's head commit holds and none the worktree holds alone, each finding with its symptom, its places, its close and its references, and a record with a refused line with its other findings and the count of the lines refused", async () => {
    const { repo, directory, gate, read } = sealedBranch();
    // Round 1's target is the commit of the routing, three below the verdict's.
    const routed = git(repo, "rev-parse", "HEAD~3").trim();
    const round2 = [
      HEADING(2),
      "",
      `${F}iadd`,
      `target: ${gate}, fixes ${gate}..${gate}`,
      F,
      "",
      "## Findings",
      "",
      "### 1. A session that exits before its result line stays working",
      "",
      `${F}iadd`,
      "severity: must",
      "location: `src/daemon/headless.ts:88`, `src/b.ts:3-9`, `src/c.ts`",
      "reopens: round-1#2",
      F,
      "",
      `${F}iadd`,
      "verdict: fixed 86cb04d",
      "answer: The session ends at its exit.",
      F,
      "",
      "### 2. A close the reader refuses",
      "",
      `${F}iadd`,
      "severity: should",
      "location: `src/d.ts`",
      F,
      "",
      `${F}iadd`,
      "verdict: open",
      F,
      "",
      "### 3. A wrong sentence",
      "",
      `${F}iadd`,
      "severity: nit",
      "location: `docs/e.md:4`",
      "regression: round-1",
      F,
      "",
      `${F}iadd`,
      "verdict: deferred #141",
      F,
      "",
      "### 4. Another wrong sentence",
      "",
      `${F}iadd`,
      "severity: nit",
      "location: `docs/e.md:9`",
      "regression: round-1#1",
      F,
      "",
      "## Confirmations",
      "",
      `${F}iadd`,
      "confirms: round-1#1",
      F,
      "",
    ].join("\n");
    write(repo, `${DIRECTORY}/trail/rounds/round-2.md`, round2);
    commitAll(repo, "chore: record review round 2");
    // A third round written and not committed says nothing.
    write(repo, `${DIRECTORY}/trail/rounds/round-3.md`, roundRecord(HEADING(3), `${gate} against main`, [1]));
    expect(git(repo, "status", "--porcelain")).toContain("round-3.md");

    const got = await read(null);
    expect(got.head).toBe(head(repo));
    expect(got.rounds).toEqual([
      { round: 1, target: routed, findings: [], confirms: [], unread: 0 },
      {
        round: 2,
        target: gate,
        findings: [
          {
            number: 1,
            says: "A session that exits before its result line stays working",
            severity: "must",
            places: [
              { path: "src/daemon/headless.ts", lines: "88" },
              { path: "src/b.ts", lines: "3-9" },
              { path: "src/c.ts", lines: null },
            ],
            close: { verdict: "fixed", commit: "86cb04d", home: null, answer: "The session ends at its exit." },
            reopens: { round: 1, finding: 2 },
            regression: null,
          },
          {
            number: 3,
            says: "A wrong sentence",
            severity: "nit",
            places: [{ path: "docs/e.md", lines: "4" }],
            close: { verdict: "deferred", commit: null, home: "#141", answer: null },
            reopens: null,
            regression: { round: 1, finding: null },
          },
          { number: 4, says: "Another wrong sentence", severity: "nit", places: [{ path: "docs/e.md", lines: "9" }], close: null, reopens: null, regression: { round: 1, finding: 1 } },
        ],
        confirms: [{ round: 1, finding: 1 }],
        unread: 1,
      },
    ]);
    expect(directory).toBe(join(repo, DIRECTORY));
  });

  it("reads the inspection's record from the newest verdict block where it is an inspection: the cleared commit, the branch, the base, the item, the gate's commit, the rounds the cleared commit holds, who built, who judged, the model and the rules", async () => {
    const { repo, gate, read } = sealedBranch({
      before: (folder) => {
        write(folder, `${DIRECTORY}/trail/rounds/round-2.md`, roundRecord(HEADING(2), `${head(folder)} against main`));
        write(folder, `${DIRECTORY}/trail/rounds/round-3.md`, roundRecord(HEADING(3), `${head(folder)} against main`));
        write(folder, `${DIRECTORY}/trail/rounds/notes.md`, "No round record.\n");
        commitAll(folder, "chore: record two rounds early");
      },
    });
    // A round recorded after the inspection is no round of the record.
    write(repo, `${DIRECTORY}/trail/rounds/round-4.md`, roundRecord(HEADING(4), `${gate}, fixes ${gate}..${gate}`));
    commitAll(repo, "chore: record review round 4");
    const got = await read({ state: "lapsed", commit: gate, why: "A sentence of the inspection." });
    expect(got.record).toEqual({ commit: gate, branch: BRANCH, base: "main", item: NAME, gate, rounds: 3, builtBy: ["the session"], inspectedBy: "s-2", model: "fake", rules: `owlery ${VERSION}` });
    expect(got.rounds.map(({ round }) => round)).toEqual([1, 2, 3, 4]);
  });

  it("gives no record where the newest verdict block is no inspection, where no guarantee stands and where the reader refuses a line of it, and still gives the rounds", async () => {
    const withheld = sealedBranch({ verdict: "withheld reason: The suite failed." });
    const none = sealedBranch({ inspection: false });
    const refused = sealedBranch();
    write(refused.repo, `${DIRECTORY}/inspection.md`, `${git(refused.repo, "show", `HEAD:${DIRECTORY}/inspection.md`)}\n${F}iadd\nVerdict: cleared\n${F}\n`);
    commitAll(refused.repo, "chore: add a block with no target");
    for (const [name, branch] of [
      ["withheld", withheld],
      ["no guarantee", none],
      ["refused", refused],
    ] as const) {
      const got = await branch.read(null);
      expect([got.record, got.rounds.map(({ round }) => round)], name).toEqual([null, [1]]);
    }
  });

  it("names the oldest commit on the branch's own line that changes a path that is no closing record, as the commit that lapsed a lapsed inspection, with its subject", async () => {
    // A closing record alone, then a commit that changes a source file and one that changes a closing record and a source file.
    const source = sealedBranch();
    write(source.repo, `${DIRECTORY}/trail/refusals.md`, refusalsText(null, NAME, { kind: "inspection", round: 1, role: "inspector", calls: [] }));
    commitAll(source.repo, "chore: record the refusals");
    expect((await source.read(lapsed(source.gate))).lapsedBy).toBeNull();
    write(source.repo, "feature.txt", "A greeting.\n");
    const changed = commitAll(source.repo, "fix: end the greeting");
    write(source.repo, "feature.txt", "A greeting!\n");
    commitAll(source.repo, "fix: end the greeting otherwise");
    expect((await source.read(lapsed(source.gate))).lapsedBy).toEqual({ commit: changed, subject: "fix: end the greeting" });
    // An inspection that holds names none, whatever follows it.
    expect((await source.read({ state: "cleared", commit: source.gate, why: null })).lapsedBy).toBeNull();
    expect((await source.read(null)).lapsedBy).toBeNull();

    // A commit that changes a closing record and a source file together.
    const together = sealedBranch();
    write(together.repo, `${DIRECTORY}/inspection.md`, `${git(together.repo, "show", `HEAD:${DIRECTORY}/inspection.md`)}\nA note.\n`);
    write(together.repo, "feature.txt", "A greeting.\n");
    const both = commitAll(together.repo, "fix: end the greeting and note it");
    expect((await together.read(lapsed(together.gate))).lapsedBy).toEqual({ commit: both, subject: "fix: end the greeting and note it" });

    // A merge of the base is named by its merge commit, and not by the base's own commit.
    const merged = sealedBranch();
    git(merged.repo, "checkout", "--quiet", "main");
    write(merged.repo, "other.txt", "Another file\n");
    commitAll(merged.repo, "feat: another file");
    git(merged.repo, "checkout", "--quiet", BRANCH);
    git(merged.repo, "merge", "--quiet", "--no-edit", "main");
    expect((await merged.read(lapsed(merged.gate))).lapsedBy).toEqual({ commit: head(merged.repo), subject: git(merged.repo, "log", "-1", "--format=%s").trim() });
  });

  it("names no commit where the head does not hold the cleared commit, and where the repository holds no commit of the name the inspection gives", async () => {
    const moved = sealedBranch();
    git(moved.repo, "reset", "--quiet", "--hard", "HEAD~4");
    write(moved.repo, "feature.txt", "A greeting, again\n");
    commitAll(moved.repo, "fix: greet again");
    expect((await moved.read(lapsed(moved.gate))).lapsedBy).toBeNull();
    const missing = sealedBranch();
    write(missing.repo, "feature.txt", "A greeting.\n");
    commitAll(missing.repo, "fix: end the greeting");
    expect((await missing.read(lapsed("f".repeat(40)))).lapsedBy).toBeNull();
  });

  it("gives the rounds in the order of their numbers, round 10 after round 2, which the back and a pull request's body list them in", async () => {
    const { repo, gate, read } = sealedBranch();
    for (const round of [10, 2]) write(repo, `${DIRECTORY}/trail/rounds/round-${String(round)}.md`, roundRecord(HEADING(round), `${gate} against main`));
    commitAll(repo, "chore: record review rounds 2 and 10");
    expect((await read(null)).rounds.map((round) => round.round)).toEqual([1, 2, 10]);
  });

  it("reads the refused calls of `trail/refusals.md` as the head holds it, each row's stage and rule, and counts a row whose stage or rule its writer does not write as not read", async () => {
    const { repo, read } = sealedBranch();
    let text = refusalsText(null, NAME, { kind: "round", round: 1, role: "proofer", calls: [{ tool: "Write", action: "write", rule: "no-write" }, { tool: "Bash", action: "run", rule: "no-command" }] });
    text = refusalsText(text, NAME, { kind: "ruling", round: 1, role: "orchestrator", calls: [{ tool: "Edit", action: "write", rule: "no-write" }] });
    text = refusalsText(text, NAME, { kind: "fix-pass", round: 1, role: "crafter", calls: [{ tool: "Write", action: "write", rule: "outside-worktree" }] });
    text = refusalsText(text, NAME, { kind: "inspection", round: 1, role: "inspector", calls: [{ tool: "Fetch", action: "other", rule: "other" }] });
    text += "| build 1 | crafter | Write | writes a file | no-write |\n| round 1 | proofer | Write | writes a file | sometimes |\n";
    write(repo, `${DIRECTORY}/trail/refusals.md`, text);
    commitAll(repo, "chore: record the refusals");
    // A row written and not committed says nothing.
    write(repo, `${DIRECTORY}/trail/refusals.md`, `${text}| round 2 | proofer | Write | writes a file | no-write |\n`);
    const got = await read(null);
    expect([got.refusals, got.unreadRefusals]).toEqual([
      [
        { kind: "round", round: 1, rule: "no-write" },
        { kind: "round", round: 1, rule: "no-command" },
        { kind: "ruling", round: 1, rule: "no-write" },
        { kind: "fix-pass", round: 1, rule: "outside-worktree" },
        { kind: "inspection", round: 1, rule: "other" },
      ],
      2,
    ]);
  });
});
