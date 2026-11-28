// The inspection a work item's branch holds at its head commit, as the daemon reads
// it: `cleared`, `lapsed` or none, from git and the committed records alone.
// Each case commits the records to a temporary repository as the daemon's
// writers write them (`inspection-records.ts#gateText` and `#inspectionText`), and
// no case starts an agent or reaches a remote.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { roundBase, routingText, standingOf } from "../src/daemon/chain";
import { withQuestion } from "../src/daemon/decision-record";
import { MARKER } from "../src/daemon/records-place";
import { gateText } from "../src/daemon/inspection-records";
import { workItemInspection } from "../src/daemon/inspection-state";
import { type Cleanups, commitAll, commitInspection, inspectionWith, head, roundRecord, write } from "./chain-run";
import { git, temporaryRepository } from "./repositories";

const cleanups: Cleanups = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

const NAME = "1795396351-cleared-work";
const DIRECTORY = `iadd/threads/${NAME}`;
const BRANCH = "feat/cleared-work";
const INSPECTION = `${DIRECTORY}/inspection.md`;
const HEADING = (round: number): string => `# Review round ${String(round)}: ${NAME}`;
/**
 * A repository whose `main` holds the records root, checked out on a branch
 * that adds a source file and then the records of a chain that cleared it
 * (`chain-run.ts#commitInspection`), with the options that helper takes.
 * `before` commits what the branch holds before the records.
 */
function clearedBranch(options: { inspection?: boolean; verdict?: string; target?: string; before?: (repo: string) => void } = {}) {
  const made = temporaryRepository();
  cleanups.push(made.remove);
  const repo = made.repo;
  write(repo, "iadd/README.md", `${MARKER}\n\nOwlery keeps the work records of this repository here.\n`);
  write(repo, "iadd/config.json", `${JSON.stringify({ "Record language": "English" }, null, 2)}\n`);
  write(repo, ".gitignore", "ignored.log\n");
  const base = commitAll(repo, "chore: add the place for work records");
  git(repo, "checkout", "--quiet", "-b", BRANCH);
  write(repo, "feature.txt", "A greeting\n");
  commitAll(repo, "feat: greet");
  options.before?.(repo);
  const gate = commitInspection(repo, { workItem: NAME, branch: BRANCH, base, ...options });
  const item = { worktree: repo, branch: BRANCH, baseBranch: "main", baseCommit: base };
  return { repo, base, gate, item, inspection: () => workItemInspection(item, head(repo)) };
}

/** Commits a change of `feature.txt` in the folder, and gives the commit. */
function commitSource(folder: string, text = "A greeting.\n"): string {
  writeFileSync(join(folder, "feature.txt"), text);
  return commitAll(folder, "fix: end the greeting");
}

/** The sentence of an inspection a commit changed a path after. */
const changedAfter = (path: string, gate: string): string => `\`${path}\` changed after the cleared commit \`${gate.slice(0, 7)}\`.`;

describe("the inspection a branch's head holds", { timeout: 30_000 }, () => {
  it("is cleared, with the cleared commit whole, where the head holds an inspection of the gate's commit and only closing records were committed after it, and stays so after a commit that changes the inspection below its block", async () => {
    const { repo, gate, inspection } = clearedBranch();
    expect(await inspection()).toEqual({ state: "cleared", commit: gate, why: null });
    // Only closing records follow the cleared commit: the gate's record and the inspection.
    expect(git(repo, "diff", "--name-only", gate, "HEAD").trim().split("\n")).toEqual([`${DIRECTORY}/inspection.md`, `${DIRECTORY}/trail/gate.md`]);
    write(repo, INSPECTION, `${git(repo, "show", `HEAD:${INSPECTION}`)}\nThe inspector's notes end here.\n`);
    commitAll(repo, "docs: note below the verdict");
    expect(await inspection()).toEqual({ state: "cleared", commit: gate, why: null });
    write(repo, `${DIRECTORY}/trail/refusals.md`, "# Refusals\n");
    commitAll(repo, "chore: record the refusals");
    expect(await inspection()).toEqual({ state: "cleared", commit: gate, why: null });
  });

  it("reads the order against the base round 1's record names, whatever base the work item stores, and the inspection holds", async () => {
    const { repo, gate, base } = clearedBranch();
    // The work item stores another base than the one its first round read the branch against, as after the branch was moved.
    git(repo, "branch", "develop", base);
    const item = { worktree: repo, branch: BRANCH, baseBranch: "develop", baseCommit: base };
    expect((await standingOf(repo, join(repo, DIRECTORY), head(repo), roundBase(item.baseBranch, item.baseCommit, head(repo)), "head")).base).toBe("main");
    expect(await workItemInspection(item, head(repo))).toEqual({ state: "cleared", commit: gate, why: null });
  });

  it("is lapsed, with the cleared commit and the first path that differs, after a commit that changes a source file, one that changes decisions.md, and one that adds a round record", async () => {
    const histories: [string, (repo: string) => void][] = [
      ["feature.txt", (repo) => commitSource(repo)],
      [
        `${DIRECTORY}/decisions.md`,
        (repo) => {
          write(repo, `${DIRECTORY}/decisions.md`, `# Decisions and questions: ${NAME}\n`);
          commitAll(repo, "chore: record a decision");
        },
      ],
      [
        `${DIRECTORY}/trail/rounds/round-2.md`,
        (repo) => {
          write(repo, `${DIRECTORY}/trail/rounds/round-2.md`, roundRecord(HEADING(2), `${head(repo)}, fixes ${head(repo)}..${head(repo)}`));
          commitAll(repo, "chore: record review round 2");
        },
      ],
    ];
    for (const [path, commit] of histories) {
      const { repo, gate, inspection } = clearedBranch();
      commit(repo);
      expect(await inspection(), path).toEqual({ state: "lapsed", commit: gate, why: changedAfter(path, gate) });
    }
  });

  it("is lapsed after a merge of a base that gained a commit, and after a merge commit that itself changes a source file", async () => {
    const merged = clearedBranch();
    git(merged.repo, "checkout", "--quiet", "main");
    write(merged.repo, "other.txt", "Another file\n");
    commitAll(merged.repo, "feat: another file");
    git(merged.repo, "checkout", "--quiet", BRANCH);
    git(merged.repo, "merge", "--quiet", "--no-edit", "main");
    expect(git(merged.repo, "rev-list", "--parents", "-n", "1", "HEAD").trim().split(" ")).toHaveLength(3);
    expect(await merged.inspection()).toEqual({ state: "lapsed", commit: merged.gate, why: changedAfter("other.txt", merged.gate) });

    const edited = clearedBranch();
    git(edited.repo, "checkout", "--quiet", "main");
    write(edited.repo, "other.txt", "Another file\n");
    commitAll(edited.repo, "feat: another file");
    git(edited.repo, "checkout", "--quiet", BRANCH);
    git(edited.repo, "merge", "--quiet", "--no-commit", "--no-ff", "main");
    writeFileSync(join(edited.repo, "feature.txt"), "A greeting, edited in the merge\n");
    git(edited.repo, "add", "feature.txt");
    git(edited.repo, "commit", "--quiet", "--no-edit");
    expect(git(edited.repo, "rev-list", "--parents", "-n", "1", "HEAD").trim().split(" ")).toHaveLength(3);
    expect(await edited.inspection()).toEqual({ state: "lapsed", commit: edited.gate, why: changedAfter("feature.txt", edited.gate) });
  });

  it("is lapsed after two commits of which the second takes the first back, and says which step the order owes, since no path differs from the cleared commit", async () => {
    const { repo, gate, inspection } = clearedBranch();
    commitSource(repo);
    commitSource(repo, "A greeting\n");
    expect(git(repo, "diff", "--name-only", gate, "HEAD").trim().split("\n")).toEqual([`${DIRECTORY}/inspection.md`, `${DIRECTORY}/trail/gate.md`]);
    expect(await inspection()).toEqual({ state: "lapsed", commit: gate, why: `Review round 2 is owed after the cleared commit \`${gate.slice(0, 7)}\`.` });
  });

  it("is lapsed where the head holds an open question that the cleared commit held too, as records written by hand can, and says that the work item waits for its answers", async () => {
    const { repo, gate, inspection } = clearedBranch({
      before: (folder) => {
        write(folder, `${DIRECTORY}/decisions.md`, withQuestion(`# Decisions and questions: ${NAME}\n\n`, { asks: "May the pass change the protocol?", grounds: "The frame names no such change.", by: "proofer", options: [], default: null }));
        commitAll(folder, "chore: record a question");
      },
    });
    expect(git(repo, "diff", "--name-only", gate, "HEAD").trim().split("\n")).toEqual([`${DIRECTORY}/inspection.md`, `${DIRECTORY}/trail/gate.md`]);
    expect(await inspection()).toEqual({ state: "lapsed", commit: gate, why: `The work item waits for the answers to its open questions after the cleared commit \`${gate.slice(0, 7)}\`.` });
  });

  it("is lapsed where a record of the head does not read, and says what the reader refuses", async () => {
    const { repo, gate, inspection } = clearedBranch();
    write(repo, `${DIRECTORY}/trail/rounds/round-2.md`, "# Review round 2\n\nNo round block.\n");
    commitAll(repo, "chore: record review round 2");
    const read = await inspection();
    expect(read).toMatchObject({ state: "lapsed", commit: gate });
    expect(read?.why).toMatch(new RegExp(`^The records at the head do not read: the reader refuses ${DIRECTORY}/trail/rounds/round-2\\.md: no round block: .*\\.$`, "u"));
  });

  it("counts only what a commit holds: an inspection the worktree holds and no commit does is none, and an edit, an untracked file, an ignored file and an open question that no commit holds leave an inspection cleared", async () => {
    const uninspected = clearedBranch({ inspection: false });
    write(uninspected.repo, INSPECTION, inspectionWith(null, NAME, 1, `${uninspected.gate} against main`));
    expect(await uninspected.inspection()).toBeNull();

    const { repo, gate, inspection } = clearedBranch();
    writeFileSync(join(repo, "feature.txt"), "An edit nobody committed\n");
    write(repo, "untracked.txt", "A file git does not track\n");
    write(repo, "ignored.log", "A file git ignores\n");
    write(repo, `${DIRECTORY}/decisions.md`, withQuestion(`# Decisions and questions: ${NAME}\n\n`, { asks: "May the pass change the protocol?", grounds: "The frame names no such change.", by: "proofer", options: [], default: null }));
    expect(git(repo, "status", "--porcelain", "--untracked-files=all", "--ignored").split("\n").filter((line) => line !== "").sort()).toEqual([" M feature.txt", "!! ignored.log", `?? ${DIRECTORY}/decisions.md`, "?? untracked.txt"]);
    expect(await inspection()).toEqual({ state: "cleared", commit: gate, why: null });
  });

  it("is none where the head holds no inspection, where the newest verdict block is withheld or undecided, where the reader refuses a line of the inspection, and on a branch reset to the commit before the inspection", async () => {
    expect(await clearedBranch({ inspection: false }).inspection()).toBeNull();
    expect(await clearedBranch({ verdict: "withheld reason: x" }).inspection()).toBeNull();
    expect(await clearedBranch({ verdict: "undecided question: May it?" }).inspection()).toBeNull();
    // An inspection followed by a withheld verdict: the newest block decides.
    const withheld = clearedBranch();
    write(withheld.repo, INSPECTION, inspectionWith(git(withheld.repo, "show", `HEAD:${INSPECTION}`), NAME, 2, `${withheld.gate} against main`, "withheld reason: x"));
    commitAll(withheld.repo, "chore: record the inspector's verdict");
    expect(await withheld.inspection()).toBeNull();

    const refused = clearedBranch();
    write(refused.repo, INSPECTION, git(refused.repo, "show", `HEAD:${INSPECTION}`).replace("Verdict: cleared\n", "Verdict: cleared\ngate: passed\n"));
    commitAll(refused.repo, "chore: write a line the reader refuses");
    expect(await refused.inspection()).toBeNull();

    const reset = clearedBranch();
    expect(await reset.inspection()).toMatchObject({ state: "cleared" });
    git(reset.repo, "reset", "--quiet", "--hard", "HEAD~1");
    expect(await reset.inspection()).toBeNull();
  });

  it("is none for a work item whose worktree holds no directory that names its branch, and for one whose worktree holds two", async () => {
    const { repo, item } = clearedBranch();
    expect(await workItemInspection({ ...item, branch: "feat/another" }, head(repo))).toBeNull();
    write(repo, "iadd/threads/1795396352-twin/routing.md", routingText("1795396352-twin", BRANCH, "2026-11-23"));
    expect(await workItemInspection(item, head(repo))).toBeNull();
  });

  it("is lapsed where the inspection names a commit the head does not hold, and where it names no commit of the repository, and says so", async () => {
    // The commit the inspection names stands on another branch of the same repository.
    const made = clearedBranch({ inspection: false });
    git(made.repo, "checkout", "--quiet", "-b", "aside", "main");
    write(made.repo, "aside.txt", "Aside\n");
    const aside = commitAll(made.repo, "feat: aside");
    git(made.repo, "checkout", "--quiet", BRANCH);
    write(made.repo, INSPECTION, inspectionWith(null, NAME, 1, `${aside} against main`));
    commitAll(made.repo, "chore: record the inspector's verdict");
    expect(await made.inspection()).toEqual({ state: "lapsed", commit: aside, why: `The branch no longer holds the cleared commit \`${aside.slice(0, 7)}\`.` });

    const none = "d".repeat(40);
    const nowhere = clearedBranch({ target: none });
    expect(await nowhere.inspection()).toEqual({ state: "lapsed", commit: none, why: `The repository holds no cleared commit \`${none.slice(0, 7)}\`.` });
  });

  it("reads a head of 10 round records within the interval of the daemon's read of the branches, 3 seconds", async () => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    const repo = made.repo;
    write(repo, "iadd/README.md", `${MARKER}\n`);
    const base = commitAll(repo, "chore: add the place for work records");
    git(repo, "checkout", "--quiet", "-b", BRANCH);
    write(repo, "feature.txt", "A greeting\n");
    write(repo, `${DIRECTORY}/routing.md`, routingText(NAME, BRANCH, "2026-11-23"));
    let target = commitAll(repo, "feat: greet");
    for (let round = 1; round <= 10; round += 1) {
      write(repo, `${DIRECTORY}/trail/rounds/round-${String(round)}.md`, roundRecord(HEADING(round), round === 1 ? `${target} against main` : `${target}, fixes ${target}..${target}`));
      target = commitAll(repo, `chore: record review round ${String(round)}`);
    }
    write(repo, `${DIRECTORY}/trail/gate.md`, gateText(null, NAME, { head: target, base }));
    commitAll(repo, "chore: record the broad gate's run");
    write(repo, INSPECTION, inspectionWith(null, NAME, 1, `${target} against main`));
    commitAll(repo, "chore: record the inspector's verdict");
    const item = { worktree: repo, branch: BRANCH, baseBranch: "main", baseCommit: base };
    const started = performance.now();
    const read = await workItemInspection(item, head(repo));
    const took = performance.now() - started;
    expect(read).toEqual({ state: "cleared", commit: target, why: null });
    expect(took, `the head reading of 10 round records took ${took.toFixed(0)} ms`).toBeLessThan(3000);
  });
});
