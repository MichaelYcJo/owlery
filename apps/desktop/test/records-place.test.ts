// The place for work records and the pull request check, as connecting a
// repository creates them: what a plan names, what a setup writes and
// commits, and what stands and is kept. Each case runs in a temporary
// repository, never in Owlery's own.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { MARKER, SUBJECT, planRecords, proposedBroadGate, readRecordsPlace, setUpRecords, workflowText } from "../src/daemon/records-place";
import { commitFile, git, temporaryRepository } from "./repositories";

const PR_CHECK = join(__dirname, "..", "..", "..", "pr-check");
const WORKFLOW = ".github/workflows/owlery-seal.yml";
const VERSION = "1.2.3";
/** The step of AgenticSeal's `hygiene.yml` that runs the check, as its 0.38.4 template writes it. */
const PLUGIN_CHECK = 'jobs:\n  seal:\n    steps:\n      - run: |\n          python3 "$RUNNER_TEMP/agentic/skills/code-review/scripts/chain_check.py" \\\n            --baseline "origin/${{ github.base_ref }}"\n';
/** The refusal of a plan that keeps a file the commit of the checkout does not hold. */
const unheld = (names: string): string => `This checkout holds ${names}, and the commit it stands at does not, so a clone of the repository would lack it. Commit or remove what is named, and open this again.`;
/** The refusal of a plan that writes a path git holds and the checkout does not. */
const known = (names: string): string => `Git holds ${names}, staged or committed, and this checkout does not, so the setup would replace it. Restore what is named or unstage it, or commit its removal, and open this again.`;

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
    write(repo, ".github/workflows/hygiene.yml", `name: hygiene\n${PLUGIN_CHECK}`);
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

  it("takes a hygiene.yml for the check only where it runs AgenticSeal's script: beside a project's own workflow of that name the setup writes Owlery's, and the repository is read as holding no check", async () => {
    const repo = repository();
    write(repo, ".github/workflows/hygiene.yml", "name: hygiene\non: pull_request\njobs:\n  lint:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm run lint\n");
    commitAll(repo, "ci: the project's own lint");
    expect(readRecordsPlace(repo).check).toBeNull();
    const plan = await planRecords(repo, "pnpm test", VERSION);
    expect(plan.files.map((file) => [file.path, file.text === null])).toEqual([
      ["seal/README.md", false],
      ["seal/config.json", false],
      [WORKFLOW, false],
    ]);
    await setUpRecords(repo, "pnpm test", VERSION, plan.stamp);
    expect(readRecordsPlace(repo).check).toBe(WORKFLOW);
    expect(readFileSync(join(repo, ".github/workflows/hygiene.yml"), "utf8")).toContain("npm run lint");
    // The same name with the step of AgenticSeal's workflow is the check.
    const plugin = repository();
    write(plugin, ".github/workflows/hygiene.yml", `name: hygiene\n${PLUGIN_CHECK}`);
    expect(readRecordsPlace(plugin).check).toBe(".github/workflows/hygiene.yml");
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

  it("blocks a plan that keeps a root git ignores, names the files that stand there, and a setup of it writes nothing", async () => {
    const repo = repository();
    write(repo, ".gitignore", "seal/\n");
    commitAll(repo, "chore: ignore seal/");
    write(repo, "seal/README.md", `${MARKER}\n`);
    write(repo, "seal/config.json", '{ "Broad gate": "make check" }\n');
    const before = [head(repo), tree(repo)];
    const plan = await planRecords(repo, "pnpm test", VERSION);
    expect(plan.files.map((file) => [file.path, file.text === null])).toEqual([
      ["seal/README.md", true],
      ["seal/config.json", true],
      [WORKFLOW, false],
    ]);
    expect(plan.blocked).toBe("Git ignores seal/README.md and seal/config.json in this repository, so it cannot keep work records in its tree. A repository that cannot is out of scope for Owlery.");
    await expect(setUpRecords(repo, "pnpm test", VERSION, plan.stamp)).rejects.toThrow("Git ignores seal/README.md and seal/config.json in this repository");
    expect([head(repo), tree(repo)]).toEqual(before);
  });

  it("blocks a plan that keeps a file the commit of the checkout does not hold: a root left untracked, the files of a setup whose commit never landed, and a root behind a link; a setup of each writes nothing, and the plan is free once the files are committed", async () => {
    const untracked = repository();
    write(untracked, "seal/README.md", `${MARKER}\n`);
    let before = [head(untracked), tree(untracked), status(untracked)];
    let plan = await planRecords(untracked, "pnpm test", VERSION);
    expect(plan.blocked).toBe(unheld("seal/README.md"));
    await expect(setUpRecords(untracked, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(unheld("seal/README.md"));
    expect([head(untracked), tree(untracked), status(untracked)]).toEqual(before);
    commitAll(untracked, "chore: the root");
    expect((await planRecords(untracked, "pnpm test", VERSION)).blocked).toBeNull();

    // The three files stand as a setup wrote them, one of them staged, and no commit holds them: nothing is left to write, and the plan is blocked all the same.
    const cut = repository();
    for (const { path, text } of (await planRecords(cut, "pnpm test", VERSION)).files) write(cut, path, text ?? "");
    git(cut, "add", "seal/README.md");
    before = [head(cut), tree(cut), status(cut)];
    plan = await planRecords(cut, "pnpm test", VERSION);
    expect(plan.files.map((file) => file.text)).toEqual([null, null, null]);
    expect(plan.blocked).toBe(unheld(`seal/README.md, seal/config.json and ${WORKFLOW}`));
    await expect(setUpRecords(cut, "pnpm test", VERSION, plan.stamp)).rejects.toThrow("This checkout holds seal/README.md");
    expect([head(cut), tree(cut), status(cut)]).toEqual(before);
    commitAll(cut, "chore: the place");
    expect((await planRecords(cut, "pnpm test", VERSION)).blocked).toBeNull();

    // The commit holds a link named `seal`, and the root's files stand in the folder it leads to, outside the repository.
    const linked = temporaryRepository();
    cleanups.push(linked.remove);
    write(linked.base, "elsewhere/README.md", `${MARKER}\n`);
    write(linked.base, "elsewhere/config.json", '{ "Broad gate": "make check" }\n');
    symlinkSync(join(linked.base, "elsewhere"), join(linked.repo, "seal"));
    write(linked.repo, WORKFLOW, "name: seal\n");
    commitAll(linked.repo, "chore: a link and the workflow");
    expect(readRecordsPlace(linked.repo).root).toBe("seal");
    expect((await planRecords(linked.repo, "pnpm test", VERSION)).blocked).toBe(unheld("seal/README.md and seal/config.json"));
  });

  it("blocks a plan that writes a path git holds and the checkout does not: one staged and then deleted, one committed and then deleted, and one staged for removal; a setup of each leaves the index and the commit as they were", async () => {
    const staged = repository();
    write(staged, WORKFLOW, "name: theirs\n");
    git(staged, "add", WORKFLOW);
    rmSync(join(staged, WORKFLOW));
    // A hook that refuses: were the setup to reach its commit, its cleanup would take the person's staged file out of the index.
    write(staged, ".git/hooks/pre-commit", "#!/bin/sh\nexit 1\n", 0o755);
    const index = git(staged, "ls-files", "--stage");
    expect(index).toContain(WORKFLOW);
    let plan = await planRecords(staged, "pnpm test", VERSION);
    expect(plan.blocked).toBe(known(WORKFLOW));
    await expect(setUpRecords(staged, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(known(WORKFLOW));
    expect(git(staged, "ls-files", "--stage")).toBe(index);
    expect(status(staged)).toBe(`AD ${WORKFLOW}\n`);

    const gone = repository();
    write(gone, "seal/README.md", `${MARKER}\n`);
    write(gone, "seal/config.json", '{ "Broad gate": "make check" }\n');
    write(gone, WORKFLOW, "name: seal\n");
    commitAll(gone, "chore: the place");
    rmSync(join(gone, "seal/config.json"));
    const before = head(gone);
    plan = await planRecords(gone, "pnpm test", VERSION);
    expect(plan.files[1]?.text).not.toBeNull();
    expect(plan.blocked).toBe(known("seal/config.json"));
    await expect(setUpRecords(gone, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(known("seal/config.json"));
    expect([head(gone), git(gone, "show", "HEAD:seal/config.json"), status(gone)]).toEqual([before, '{ "Broad gate": "make check" }\n', " D seal/config.json\n"]);

    const removed = repository();
    write(removed, WORKFLOW, "name: theirs\n");
    commitAll(removed, "ci: theirs");
    git(removed, "rm", "--quiet", WORKFLOW);
    plan = await planRecords(removed, "pnpm test", VERSION);
    expect(plan.blocked).toBe(known(WORKFLOW));
    await expect(setUpRecords(removed, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(known(WORKFLOW));
    expect(status(removed)).toBe(`D  ${WORKFLOW}\n`);
  });

  it("takes a name of the root for the project's own where git holds a file below it that the checkout does not show", async () => {
    const repo = repository();
    write(repo, "seal/notes.txt", "the project's\n");
    commitAll(repo, "docs: notes");
    rmSync(join(repo, "seal"), { recursive: true });
    expect((await planRecords(repo, "pnpm test", VERSION)).files.map((file) => file.path)).toEqual(["agentic-seal/README.md", "agentic-seal/config.json", WORKFLOW]);
    // The second name is taken by a file that is staged alone.
    write(repo, "agentic-seal/notes.txt", "the project's\n");
    git(repo, "add", "agentic-seal/notes.txt");
    rmSync(join(repo, "agentic-seal"), { recursive: true });
    expect((await planRecords(repo, "pnpm test", VERSION)).blocked).toBe("Both seal/ and agentic-seal/ hold something of this repository's own, so Owlery has no folder to keep work records in.");
  });

  it("blocks a plan where something other than a folder is at a folder the setup writes below, on disk or in the commit, and a setup of it writes nothing", async () => {
    const says = "The setup needs a folder at .github, and something else stands there in this repository. Rename or remove it, and open this again.";
    const repo = repository();
    write(repo, ".github", "a file of the project's\n");
    commitAll(repo, "chore: a file named .github");
    const before = [head(repo), tree(repo), status(repo)];
    const plan = await planRecords(repo, "pnpm test", VERSION);
    expect(plan.blocked).toBe(says);
    await expect(setUpRecords(repo, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(says);
    expect([head(repo), tree(repo), status(repo)]).toEqual(before);
    // The file is gone from the checkout, and the commit still holds it.
    rmSync(join(repo, ".github"));
    expect((await planRecords(repo, "pnpm test", VERSION)).blocked).toBe(says);
    // A link stands there, which the setup does not write through.
    const linked = temporaryRepository();
    cleanups.push(linked.remove);
    mkdirSync(join(linked.base, "elsewhere"));
    symlinkSync(join(linked.base, "elsewhere"), join(linked.repo, ".github"));
    expect((await planRecords(linked.repo, "pnpm test", VERSION)).blocked).toBe(says);
    expect(readdirSync(join(linked.base, "elsewhere"))).toEqual([]);
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

  it("writes over nothing that appeared after the plan was made: a file that stands at a path of the setup by the time it is written refuses the setup, and stays as it is", async () => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    const plan = await planRecords(made.repo, "pnpm test", VERSION);
    // A `git` before the real one on the path: at the plan's last question, whether git ignores its paths, the person's own file appears, after the plan read that nothing stands there.
    const bin = join(made.base, "bin");
    const path = process.env.PATH ?? "";
    mkdirSync(bin);
    writeFileSync(join(bin, "git"), `#!/bin/sh\nif [ "$1" = check-ignore ]; then mkdir -p seal && printf 'theirs\\n' > seal/config.json; fi\nPATH='${path}' exec git "$@"\n`, { mode: 0o755 });
    process.env.PATH = `${bin}:${path}`;
    cleanups.push(() => {
      process.env.PATH = path;
    });
    await expect(setUpRecords(made.repo, "pnpm test", VERSION, plan.stamp)).rejects.toThrow("EEXIST");
    process.env.PATH = path;
    expect(readFileSync(join(made.repo, "seal/config.json"), "utf8")).toBe("theirs\n");
    // The file the setup had written before the refusal is gone, the folder the person's file stands in stays, and nothing is staged.
    expect(tree(made.repo)).toEqual(["README.md", "seal", "seal/config.json"]);
    expect(status(made.repo)).toBe("?? seal/config.json\n");
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
