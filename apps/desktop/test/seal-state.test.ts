// The seal a work item's branch holds at its head commit, as the daemon reads
// it: `sealed`, `broken` or none, from git and the committed records alone.
// Each case commits the records to a temporary repository as the daemon's
// writers write them (`seal-records.ts#gateText` and `#guaranteeText`), and
// no case starts an agent or reaches a remote.
import { writeFileSync } from "node:fs";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { routingText } from "../src/daemon/chain";
import { withQuestion } from "../src/daemon/decision-record";
import { MARKER } from "../src/daemon/records-place";
import { gateText } from "../src/daemon/seal-records";
import { workItemSeal } from "../src/daemon/seal-state";
import { type Cleanups, commitAll, commitSeal, guaranteeWith, head, roundRecord, write } from "./chain-run";
import { git, temporaryRepository } from "./repositories";

const cleanups: Cleanups = [];
afterEach(async () => {
  for (const cleanup of cleanups.splice(0).reverse()) await cleanup();
});

const NAME = "1795396351-sealed-work";
const DIRECTORY = `seal/threads/${NAME}`;
const BRANCH = "feat/sealed-work";
const GUARANTEE = `${DIRECTORY}/guarantee.md`;
const HEADING = (round: number): string => `# Review round ${String(round)}: ${NAME}`;
/**
 * A repository whose `main` holds the records root, checked out on a branch
 * that adds a source file and then the records of a chain that sealed it
 * (`chain-run.ts#commitSeal`), with the options that helper takes.
 */
function sealedBranch(options: { seal?: boolean; verdict?: string; target?: string } = {}) {
  const made = temporaryRepository();
  cleanups.push(made.remove);
  const repo = made.repo;
  write(repo, "seal/README.md", `${MARKER}\n\nOwlery keeps the work records of this repository here.\n`);
  write(repo, "seal/config.json", `${JSON.stringify({ "Record language": "English" }, null, 2)}\n`);
  write(repo, ".gitignore", "ignored.log\n");
  const base = commitAll(repo, "chore: add the place for work records");
  git(repo, "checkout", "--quiet", "-b", BRANCH);
  write(repo, "feature.txt", "A greeting\n");
  commitAll(repo, "feat: greet");
  const gate = commitSeal(repo, { workItem: NAME, branch: BRANCH, base, ...options });
  const item = { worktree: repo, branch: BRANCH, baseBranch: "main", baseCommit: base };
  return { repo, base, gate, item, seal: () => workItemSeal(item, head(repo)) };
}

/** Commits a change of `feature.txt` in the folder, and gives the commit. */
function commitSource(folder: string, text = "A greeting.\n"): string {
  writeFileSync(join(folder, "feature.txt"), text);
  return commitAll(folder, "fix: end the greeting");
}

/** The sentence of a seal a commit changed a path after. */
const changedAfter = (path: string, gate: string): string => `\`${path}\` changed after the sealed commit \`${gate.slice(0, 7)}\`.`;

describe("the seal a branch's head holds", { timeout: 30_000 }, () => {
  it("is sealed, with the sealed commit whole, where the head holds a seal of the gate's commit and only closing records were committed after it, and stays so after a commit that changes the guarantee below its block", async () => {
    const { repo, gate, seal } = sealedBranch();
    expect(await seal()).toEqual({ state: "sealed", commit: gate, why: null });
    // Only closing records follow the sealed commit: the gate's record and the guarantee.
    expect(git(repo, "diff", "--name-only", gate, "HEAD").trim().split("\n")).toEqual([`${DIRECTORY}/guarantee.md`, `${DIRECTORY}/trail/gate.md`]);
    write(repo, GUARANTEE, `${git(repo, "show", `HEAD:${GUARANTEE}`)}\nThe sealer's notes end here.\n`);
    commitAll(repo, "docs: note below the verdict");
    expect(await seal()).toEqual({ state: "sealed", commit: gate, why: null });
    write(repo, `${DIRECTORY}/trail/refusals.md`, "# Refusals\n");
    commitAll(repo, "chore: record the refusals");
    expect(await seal()).toEqual({ state: "sealed", commit: gate, why: null });
  });

  it("is broken, with the sealed commit and the first path that differs, after a commit that changes a source file, one that changes decisions.md, and one that adds a round record", async () => {
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
      const { repo, gate, seal } = sealedBranch();
      commit(repo);
      expect(await seal(), path).toEqual({ state: "broken", commit: gate, why: changedAfter(path, gate) });
    }
  });

  it("is broken after a merge of a base that gained a commit, and after a merge commit that itself changes a source file", async () => {
    const merged = sealedBranch();
    git(merged.repo, "checkout", "--quiet", "main");
    write(merged.repo, "other.txt", "Another file\n");
    commitAll(merged.repo, "feat: another file");
    git(merged.repo, "checkout", "--quiet", BRANCH);
    git(merged.repo, "merge", "--quiet", "--no-edit", "main");
    expect(git(merged.repo, "rev-list", "--parents", "-n", "1", "HEAD").trim().split(" ")).toHaveLength(3);
    expect(await merged.seal()).toEqual({ state: "broken", commit: merged.gate, why: changedAfter("other.txt", merged.gate) });

    const edited = sealedBranch();
    git(edited.repo, "checkout", "--quiet", "main");
    write(edited.repo, "other.txt", "Another file\n");
    commitAll(edited.repo, "feat: another file");
    git(edited.repo, "checkout", "--quiet", BRANCH);
    git(edited.repo, "merge", "--quiet", "--no-commit", "--no-ff", "main");
    writeFileSync(join(edited.repo, "feature.txt"), "A greeting, edited in the merge\n");
    git(edited.repo, "add", "feature.txt");
    git(edited.repo, "commit", "--quiet", "--no-edit");
    expect(git(edited.repo, "rev-list", "--parents", "-n", "1", "HEAD").trim().split(" ")).toHaveLength(3);
    expect(await edited.seal()).toEqual({ state: "broken", commit: edited.gate, why: changedAfter("feature.txt", edited.gate) });
  });

  it("is broken after two commits of which the second takes the first back, and says which step the order owes, since no path differs from the sealed commit", async () => {
    const { repo, gate, seal } = sealedBranch();
    commitSource(repo);
    commitSource(repo, "A greeting\n");
    expect(git(repo, "diff", "--name-only", gate, "HEAD").trim().split("\n")).toEqual([`${DIRECTORY}/guarantee.md`, `${DIRECTORY}/trail/gate.md`]);
    expect(await seal()).toEqual({ state: "broken", commit: gate, why: `Review round 2 is owed after the sealed commit \`${gate.slice(0, 7)}\`.` });
  });

  it("is broken where a record of the head does not read, and says what the reader refuses", async () => {
    const { repo, gate, seal } = sealedBranch();
    write(repo, `${DIRECTORY}/trail/rounds/round-2.md`, "# Review round 2\n\nNo round block.\n");
    commitAll(repo, "chore: record review round 2");
    const read = await seal();
    expect(read).toMatchObject({ state: "broken", commit: gate });
    expect(read?.why).toMatch(new RegExp(`^The records at the head do not read: the reader refuses ${DIRECTORY}/trail/rounds/round-2\\.md: no round block: .*\\.$`, "u"));
  });

  it("counts only what a commit holds: a seal the worktree holds and no commit does is none, and an edit, an untracked file, an ignored file and an open question that no commit holds leave a seal sealed", async () => {
    const unsealed = sealedBranch({ seal: false });
    write(unsealed.repo, GUARANTEE, guaranteeWith(null, NAME, 1, `${unsealed.gate} against main`));
    expect(await unsealed.seal()).toBeNull();

    const { repo, gate, seal } = sealedBranch();
    writeFileSync(join(repo, "feature.txt"), "An edit nobody committed\n");
    write(repo, "untracked.txt", "A file git does not track\n");
    write(repo, "ignored.log", "A file git ignores\n");
    write(repo, `${DIRECTORY}/decisions.md`, withQuestion(`# Decisions and questions: ${NAME}\n\n`, { asks: "May the pass change the protocol?", grounds: "The frame names no such change.", by: "proofer", options: [], default: null }));
    expect(git(repo, "status", "--porcelain", "--untracked-files=all", "--ignored").split("\n").filter((line) => line !== "").sort()).toEqual([" M feature.txt", "!! ignored.log", `?? ${DIRECTORY}/decisions.md`, "?? untracked.txt"]);
    expect(await seal()).toEqual({ state: "sealed", commit: gate, why: null });
  });

  it("is none where the head holds no guarantee, where the newest verdict block is withheld or undecided, where the reader refuses a line of the guarantee, and on a branch reset to the commit before the guarantee", async () => {
    expect(await sealedBranch({ seal: false }).seal()).toBeNull();
    expect(await sealedBranch({ verdict: "withheld reason: x" }).seal()).toBeNull();
    expect(await sealedBranch({ verdict: "undecided question: May it?" }).seal()).toBeNull();
    // A seal followed by a withheld verdict: the newest block decides.
    const withheld = sealedBranch();
    write(withheld.repo, GUARANTEE, guaranteeWith(git(withheld.repo, "show", `HEAD:${GUARANTEE}`), NAME, 2, `${withheld.gate} against main`, "withheld reason: x"));
    commitAll(withheld.repo, "chore: record the sealer's verdict");
    expect(await withheld.seal()).toBeNull();

    const refused = sealedBranch();
    write(refused.repo, GUARANTEE, git(refused.repo, "show", `HEAD:${GUARANTEE}`).replace("Verdict: sealed\n", "Verdict: sealed\ngate: passed\n"));
    commitAll(refused.repo, "chore: write a line the reader refuses");
    expect(await refused.seal()).toBeNull();

    const reset = sealedBranch();
    expect(await reset.seal()).toMatchObject({ state: "sealed" });
    git(reset.repo, "reset", "--quiet", "--hard", "HEAD~1");
    expect(await reset.seal()).toBeNull();
  });

  it("is none for a work item whose worktree holds no directory that names its branch, and for one whose worktree holds two", async () => {
    const { repo, item } = sealedBranch();
    expect(await workItemSeal({ ...item, branch: "feat/another" }, head(repo))).toBeNull();
    write(repo, "seal/threads/1795396352-twin/routing.md", routingText("1795396352-twin", BRANCH, "2026-11-23"));
    expect(await workItemSeal(item, head(repo))).toBeNull();
  });

  it("is broken where the seal names a commit the head does not hold, and where it names no commit of the repository, and says so", async () => {
    // The commit the seal names stands on another branch of the same repository.
    const made = sealedBranch({ seal: false });
    git(made.repo, "checkout", "--quiet", "-b", "aside", "main");
    write(made.repo, "aside.txt", "Aside\n");
    const aside = commitAll(made.repo, "feat: aside");
    git(made.repo, "checkout", "--quiet", BRANCH);
    write(made.repo, GUARANTEE, guaranteeWith(null, NAME, 1, `${aside} against main`));
    commitAll(made.repo, "chore: record the sealer's verdict");
    expect(await made.seal()).toEqual({ state: "broken", commit: aside, why: `The branch no longer holds the sealed commit \`${aside.slice(0, 7)}\`.` });

    const none = "d".repeat(40);
    const nowhere = sealedBranch({ target: none });
    expect(await nowhere.seal()).toEqual({ state: "broken", commit: none, why: `The repository holds no sealed commit \`${none.slice(0, 7)}\`.` });
  });

  it("reads a head of 10 round records within the interval of the daemon's read of the branches, 3 seconds", async () => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    const repo = made.repo;
    write(repo, "seal/README.md", `${MARKER}\n`);
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
    write(repo, GUARANTEE, guaranteeWith(null, NAME, 1, `${target} against main`));
    commitAll(repo, "chore: record the sealer's verdict");
    const item = { worktree: repo, branch: BRANCH, baseBranch: "main", baseCommit: base };
    const started = performance.now();
    const read = await workItemSeal(item, head(repo));
    const took = performance.now() - started;
    expect(read).toEqual({ state: "sealed", commit: target, why: null });
    expect(took, `the head reading of 10 round records took ${took.toFixed(0)} ms`).toBeLessThan(3000);
  });
});
