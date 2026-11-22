// The place for work records and the pull request check, as connecting a
// repository creates them: what a plan names, what a setup writes and
// commits, and what stands and is kept. Each case runs in a temporary
// repository, never in Owlery's own.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { MARKER, SUBJECT, planRecords, proposedBroadGate, readRecordsPlace, setUpRecords, workflowText } from "../src/daemon/records-place";
import { commitFile, git, temporaryRepository } from "./repositories";

const PR_CHECK = join(__dirname, "..", "..", "..", "pr-check");
const WORKFLOW = ".github/workflows/owlery-seal.yml";
const VERSION = "1.2.3";

/** Writes a file in a repository, with the folders above it. */
function write(repo: string, path: string, text: string, mode?: number): void {
  mkdirSync(dirname(join(repo, path)), { recursive: true });
  writeFileSync(join(repo, path), text, mode === undefined ? {} : { mode });
}

function commitAll(repo: string, subject: string): void {
  git(repo, "add", "--all");
  git(repo, "commit", "--quiet", "-m", subject);
}

const head = (repo: string): string => git(repo, "rev-parse", "HEAD").trim();
const status = (repo: string): string => git(repo, "status", "--porcelain=v1", "--untracked-files=all");
/** Every file and folder of the repository's working tree, without git's own folder. */
const tree = (repo: string): string[] =>
  (readdirSync(repo, { recursive: true }) as string[]).filter((path) => path !== ".git" && !path.startsWith(".git/")).sort();

describe("the records place", () => {
  const cleanups: (() => void)[] = [];
  afterEach(() => {
    for (const cleanup of cleanups.splice(0).reverse()) cleanup();
  });

  /** A temporary repository with one commit on `main`, removed when the case ends. */
  const repository = (): string => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    return made.repo;
  };

  it("plans the root's README.md, its config.json and the workflow, each with its whole text, the branch, the subject and a stamp, and writes nothing", async () => {
    const repo = repository();
    const before = tree(repo);
    const plan = await planRecords(repo, "  pnpm test  ", VERSION);
    expect(plan.branch).toBe("main");
    expect(plan.subject).toBe(SUBJECT);
    expect(plan.subject).toBe("chore: add the place for work records and the pull request check");
    expect(plan.blocked).toBeNull();
    expect(plan.stamp).toMatch(/^[0-9a-f]{64}$/);
    expect(plan.files.map((file) => file.path)).toEqual(["seal/README.md", "seal/config.json", WORKFLOW]);
    const [readme, config, workflow] = plan.files.map((file) => file.text ?? "");
    expect(readme?.split("\n")[0]).toBe(MARKER);
    expect(readme).toContain("`threads/<work-item-id>/` holds one work item's records");
    // The command is written without the white space at its ends, beside the two languages the check asks for.
    expect(config).toBe('{\n  "Commit and pull request language": "English",\n  "Record language": "English",\n  "Broad gate": "pnpm test"\n}\n');
    expect(workflow).toBe(workflowText(VERSION));
    expect(status(repo)).toBe("");
    expect(tree(repo)).toEqual(before);
    // The stamp is the same for the same plan, and another for another command or another commit.
    expect((await planRecords(repo, "pnpm test", VERSION)).stamp).toBe(plan.stamp);
    expect((await planRecords(repo, "make check", VERSION)).stamp).not.toBe(plan.stamp);
    commitFile(repo, "later.txt");
    expect((await planRecords(repo, "pnpm test", VERSION)).stamp).not.toBe(plan.stamp);
  });

  it("sets up in one commit of the plan's files alone, on the checked-out branch and under the person's identity, and leaves another staged file staged", async () => {
    const repo = repository();
    write(repo, "other.txt", "staged by the person\n");
    git(repo, "add", "other.txt");
    const before = head(repo);
    const plan = await planRecords(repo, "pnpm test", VERSION);
    await setUpRecords(repo, "pnpm test", VERSION, plan.stamp);
    expect(git(repo, "rev-parse", "HEAD~1").trim()).toBe(before);
    expect(git(repo, "symbolic-ref", "--short", "HEAD").trim()).toBe("main");
    expect(git(repo, "show", "--name-only", "--format=%s|%an", "HEAD").trim().split("\n").filter((line) => line !== "")).toEqual([`${SUBJECT}|Owlery Test`, WORKFLOW, "seal/README.md", "seal/config.json"]);
    for (const { path, text } of plan.files) expect(readFileSync(join(repo, path), "utf8"), path).toBe(text);
    expect(status(repo)).toBe("A  other.txt\n");
    expect(readRecordsPlace(repo)).toEqual({ root: "seal", check: WORKFLOW, broadGate: "pnpm test" });
    // What stands now is kept: a second plan writes no file.
    expect((await planRecords(repo, "another", VERSION)).files).toEqual([
      { path: "seal/README.md", text: null },
      { path: "seal/config.json", text: null },
      { path: WORKFLOW, text: null },
    ]);
  });

  it("refuses a setup whose stamp is not the plan's as the repository stands, and one whose command is empty, and writes nothing", async () => {
    const repo = repository();
    const plan = await planRecords(repo, "pnpm test", VERSION);
    commitFile(repo, "later.txt");
    const before = [head(repo), tree(repo)];
    await expect(setUpRecords(repo, "pnpm test", VERSION, plan.stamp)).rejects.toThrow("The repository changed since the plan was read");
    const empty = await planRecords(repo, "   ", VERSION);
    await expect(setUpRecords(repo, "   ", VERSION, empty.stamp)).rejects.toThrow("The broad gate command is empty");
    expect([head(repo), tree(repo)]).toEqual(before);
    expect(status(repo)).toBe("");
  });

  it("keeps an AgenticSeal root, its config.json and its hygiene.yml: every file of the plan is kept, and a setup changes no file and makes no commit", async () => {
    const repo = repository();
    // The marker's line may end as a file of Windows ends its lines.
    write(repo, "seal/README.md", `${MARKER}\r\n\r\nAgenticSeal's own.\r\n`);
    write(repo, "seal/config.json", '{ "Mode": "shared", "Broad gate": "make check" }\n');
    write(repo, ".github/workflows/hygiene.yml", "name: hygiene\n");
    commitAll(repo, "chore: the plugin's root");
    const before = [head(repo), tree(repo)];
    expect(readRecordsPlace(repo)).toEqual({ root: "seal", check: ".github/workflows/hygiene.yml", broadGate: "make check" });
    const plan = await planRecords(repo, "pnpm test", VERSION);
    expect(plan.blocked).toBeNull();
    expect(plan.files).toEqual([
      { path: "seal/README.md", text: null },
      { path: "seal/config.json", text: null },
      { path: ".github/workflows/hygiene.yml", text: null },
    ]);
    await setUpRecords(repo, "pnpm test", VERSION, plan.stamp);
    expect([head(repo), tree(repo)]).toEqual(before);
    expect(status(repo)).toBe("");
    expect(readFileSync(join(repo, "seal/config.json"), "utf8")).toBe('{ "Mode": "shared", "Broad gate": "make check" }\n');
  });

  it("writes only what a root lacks: the config.json of a root that holds none, and no Broad gate into a config.json that stands without the key", async () => {
    const repo = repository();
    write(repo, "agentic-seal/README.md", `${MARKER}\n`);
    write(repo, WORKFLOW, "name: seal\n");
    commitAll(repo, "chore: a root with no config");
    expect(readRecordsPlace(repo)).toEqual({ root: "agentic-seal", check: WORKFLOW, broadGate: null });
    const plan = await planRecords(repo, "pnpm test", VERSION);
    expect(plan.files.map((file) => [file.path, file.text === null])).toEqual([
      ["agentic-seal/README.md", true],
      ["agentic-seal/config.json", false],
      [WORKFLOW, true],
    ]);
    await setUpRecords(repo, "pnpm test", VERSION, plan.stamp);
    expect(git(repo, "show", "--name-only", "--format=", "HEAD").trim()).toBe("agentic-seal/config.json");
    expect(readRecordsPlace(repo).broadGate).toBe("pnpm test");

    const keyless = repository();
    write(keyless, "seal/README.md", `${MARKER}\n`);
    write(keyless, "seal/config.json", '{ "Record language": "Korean" }\n');
    commitAll(keyless, "chore: a root with no command");
    expect((await planRecords(keyless, "pnpm test", VERSION)).files.slice(0, 2)).toEqual([
      { path: "seal/README.md", text: null },
      { path: "seal/config.json", text: null },
    ]);
    expect(readRecordsPlace(keyless)).toEqual({ root: "seal", check: null, broadGate: null });
    // A config.json that is no JSON, and a key that holds no text, give no command.
    write(keyless, "seal/config.json", "{ not json");
    expect(readRecordsPlace(keyless).broadGate).toBeNull();
    write(keyless, "seal/config.json", '{ "Broad gate": 3 }');
    expect(readRecordsPlace(keyless).broadGate).toBeNull();
  });

  it("leaves a project's own seal/ alone: the root is written at agentic-seal/, and nothing under seal/", async () => {
    const repo = repository();
    write(repo, "seal/README.md", "# The seals of the harbour\n");
    commitAll(repo, "docs: the seals");
    expect(readRecordsPlace(repo)).toEqual({ root: null, check: null, broadGate: null });
    const plan = await planRecords(repo, "pnpm test", VERSION);
    expect(plan.blocked).toBeNull();
    expect(plan.files.map((file) => file.path)).toEqual(["agentic-seal/README.md", "agentic-seal/config.json", WORKFLOW]);
    await setUpRecords(repo, "pnpm test", VERSION, plan.stamp);
    expect(readdirSync(join(repo, "seal"))).toEqual(["README.md"]);
    expect(readFileSync(join(repo, "seal/README.md"), "utf8")).toBe("# The seals of the harbour\n");
    expect(readRecordsPlace(repo)).toEqual({ root: "agentic-seal", check: WORKFLOW, broadGate: "pnpm test" });
  });

  it("blocks a plan where both root names hold something of the project's own, and a setup of it writes nothing", async () => {
    const repo = repository();
    write(repo, "seal/notes.txt", "x\n");
    write(repo, "agentic-seal", "a file of the project's\n");
    commitAll(repo, "chore: both names taken");
    const before = [head(repo), tree(repo)];
    const plan = await planRecords(repo, "pnpm test", VERSION);
    expect(plan.blocked).toBe("Both seal/ and agentic-seal/ hold something of this repository's own, so Owlery has no folder to keep work records in.");
    await expect(setUpRecords(repo, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(plan.blocked ?? "blocked");
    expect([head(repo), tree(repo)]).toEqual(before);
  });

  it("blocks a plan where git ignores a path the setup would write, names the path, and a setup of it writes nothing", async () => {
    const repo = repository();
    write(repo, ".gitignore", "seal/\n");
    commitAll(repo, "chore: ignore seal/");
    const before = [head(repo), tree(repo)];
    const plan = await planRecords(repo, "pnpm test", VERSION);
    expect(plan.blocked).toBe("Git ignores seal/README.md and seal/config.json in this repository, so it cannot keep work records in its tree. A repository that cannot is out of scope for Owlery.");
    expect(plan.branch).toBe("main");
    await expect(setUpRecords(repo, "pnpm test", VERSION, plan.stamp)).rejects.toThrow("Git ignores seal/README.md");
    expect([head(repo), tree(repo)]).toEqual(before);
    expect(status(repo)).toBe("");
  });

  it("blocks a plan where no branch is checked out, and a setup of it writes nothing", async () => {
    const repo = repository();
    git(repo, "checkout", "--quiet", "--detach");
    const before = [head(repo), tree(repo)];
    const plan = await planRecords(repo, "pnpm test", VERSION);
    expect(plan.branch).toBeNull();
    expect(plan.blocked).toBe("No branch is checked out in this repository, so the commit has no branch to land on. Check a branch out and open this again.");
    await expect(setUpRecords(repo, "pnpm test", VERSION, plan.stamp)).rejects.toThrow("No branch is checked out");
    expect([head(repo), tree(repo)]).toEqual(before);
  });

  it("leaves nothing where the commit fails: the hook's output is the refusal, no file or folder of the setup stands, nothing of it is staged, and what stood before stays", async () => {
    const repo = repository();
    write(repo, ".github/CODEOWNERS", "* @someone\n");
    commitAll(repo, "chore: owners");
    write(repo, ".git/hooks/pre-commit", "#!/bin/sh\necho 'the hook says no'\nexit 1\n", 0o755);
    write(repo, "other.txt", "staged by the person\n");
    git(repo, "add", "other.txt");
    const before = [head(repo), tree(repo)];
    const plan = await planRecords(repo, "pnpm test", VERSION);
    await expect(setUpRecords(repo, "pnpm test", VERSION, plan.stamp)).rejects.toThrow("the hook says no");
    expect([head(repo), tree(repo)]).toEqual(before);
    expect(existsSync(join(repo, "seal"))).toBe(false);
    expect(existsSync(join(repo, ".github", "workflows"))).toBe(false);
    expect(status(repo)).toBe("A  other.txt\n");
  });

  it("sets up in a repository with no commit yet, as its first commit, and a commit that fails there leaves nothing staged and no file", async () => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    const fresh = join(made.base, "fresh");
    mkdirSync(fresh);
    git(fresh, "init", "--quiet", "--initial-branch=main");
    git(fresh, "config", "user.name", "Owlery Test");
    git(fresh, "config", "user.email", "test@owlery.invalid");
    git(fresh, "config", "commit.gpgsign", "false");
    write(fresh, ".git/hooks/pre-commit", "#!/bin/sh\necho 'the hook says no'\nexit 1\n", 0o755);
    const plan = await planRecords(fresh, "pnpm test", VERSION);
    expect([plan.branch, plan.blocked]).toEqual(["main", null]);
    await expect(setUpRecords(fresh, "pnpm test", VERSION, plan.stamp)).rejects.toThrow("the hook says no");
    expect([tree(fresh), status(fresh)]).toEqual([[], ""]);
    rmSync(join(fresh, ".git/hooks/pre-commit"));
    await setUpRecords(fresh, "pnpm test", VERSION, plan.stamp);
    expect(git(fresh, "rev-list", "--count", "HEAD").trim()).toBe("1");
    expect(git(fresh, "show", "--name-only", "--format=%s", "HEAD").trim().split("\n").filter((line) => line !== "")).toEqual([SUBJECT, WORKFLOW, "seal/README.md", "seal/config.json"]);
    expect(status(fresh)).toBe("");
  });

  it("writes a workflow that fetches the check from Owlery's repository at the version's tag, falls back to the release's branch, and runs a script that stands under pr-check/", () => {
    const text = workflowText(VERSION);
    expect(text).toContain("\nname: seal\n");
    expect(text).toContain("\njobs:\n  seal:\n");
    expect(text).toContain('git clone --quiet --depth 1 --branch v1.2.3 \\\n            https://github.com/MichaelYcJo/owlery.git "$RUNNER_TEMP/owlery" \\\n          || git clone --quiet --depth 1 --branch release/v1.2.3 \\\n            https://github.com/MichaelYcJo/owlery.git "$RUNNER_TEMP/owlery"\n');
    expect(text).toContain("- name: the check, at Owlery 1.2.3\n");
    expect(text).not.toContain("<version>");
    const script = /python3 "\$RUNNER_TEMP\/owlery\/(pr-check\/[^"]+)"/.exec(text)?.[1];
    expect(script).toBe("pr-check/skills/code-review/scripts/chain_check.py");
    expect(existsSync(join(PR_CHECK, "..", script ?? "missing"))).toBe(true);
    expect(text).toContain('--baseline "origin/${{ github.base_ref }}"');
    expect(text).toContain("fetch-depth: 0");
    // The marker the root's README opens with is the one the taken check tells a root by.
    expect(readFileSync(join(PR_CHECK, "lib", "optin.py"), "utf8")).toContain(`\nMARKER = ${JSON.stringify(MARKER)}\n`);
  });

  it("proposes a broad gate command from the package.json of the repository: its check script before its test script, run by the package manager whose lock file stands, and none where it reads neither", () => {
    const repo = repository();
    expect(proposedBroadGate(repo)).toBeNull();
    write(repo, "package.json", '{ "scripts": { "test": "vitest", "check": "tsc && vitest" } }');
    expect(proposedBroadGate(repo)).toBe("npm run check");
    write(repo, "pnpm-lock.yaml", "");
    expect(proposedBroadGate(repo)).toBe("pnpm run check");
    write(repo, "package.json", '{ "scripts": { "test": "vitest" } }');
    expect(proposedBroadGate(repo)).toBe("pnpm run test");
    write(repo, "package.json", '{ "scripts": { "build": "tsc" } }');
    expect(proposedBroadGate(repo)).toBeNull();
    write(repo, "package.json", "{ not json");
    expect(proposedBroadGate(repo)).toBeNull();
  });
});
