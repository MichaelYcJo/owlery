// The place for work records and the pull request check, as connecting a
// repository creates them: what a plan names, what a setup writes and
// commits, and what stands and is kept. Each case runs in a temporary
// repository, never in Owlery's own.
import { existsSync, mkdirSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { MARKER, SUBJECT, planRecords, proposedBroadGate, readRecordsPlace, setUpRecords, workflowText } from "../src/daemon/records-place";
import { REPOSITORY_FILE_BYTES } from "../src/daemon/repository-file";
import { commitFile, git, temporaryRepository } from "./repositories";

const PR_CHECK = join(__dirname, "..", "..", "..", "pr-check");
const WORKFLOW = ".github/workflows/owlery-seal.yml";
const VERSION = "1.2.3";
/** The step of AgenticSeal's `hygiene.yml` that runs the check, as its 0.38.4 template writes it. */
const PLUGIN_CHECK = 'jobs:\n  seal:\n    steps:\n      - run: |\n          python3 "$RUNNER_TEMP/agentic/skills/code-review/scripts/chain_check.py" \\\n            --baseline "origin/${{ github.base_ref }}"\n';
/** The refusal of a plan where the checkout does not hold a path of the place as the commit does. */
const differs = (names: string): string =>
  `This checkout does not hold ${names} as the commit it stands at does. Owlery plans the records place from the commit, which is what a clone and the check on GitHub get. Commit what is named or put it back as the commit has it, widening a sparse checkout that leaves it out, and open this again.`;

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

  it("reads no root from a `README.md` that holds more than the daemon reads of a file, or that links to what is no plain file, though each opens with the marker or leads to a folder", () => {
    const large = repository();
    write(large, "seal/README.md", `${MARKER}\n${"a".repeat(REPOSITORY_FILE_BYTES)}`);
    expect(readRecordsPlace(large).root).toBeNull();
    write(large, "seal/README.md", `${MARKER}\n`);
    expect(readRecordsPlace(large).root).toBe("seal");
    const folder = repository();
    mkdirSync(join(folder, "seal"));
    symlinkSync("..", join(folder, "seal/README.md"));
    expect(readRecordsPlace(folder).root).toBeNull();
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
    // The project's file is named in small letters: it is no `README.md` of the place, on a disk that tells the two names apart and on one that does not.
    const small = repository();
    write(small, "seal/readme.md", "# The seals of the harbour\n");
    commitAll(small, "docs: the seals");
    const beside = await planRecords(small, "pnpm test", VERSION);
    expect([beside.files.map((file) => file.path), beside.blocked]).toEqual([["agentic-seal/README.md", "agentic-seal/config.json", WORKFLOW], null]);
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

  it("blocks a plan where a root stands in the checkout and git ignores it, names the files of the root, and a setup of it writes nothing", async () => {
    const repo = repository();
    write(repo, ".gitignore", "seal/\n");
    commitAll(repo, "chore: ignore seal/");
    write(repo, "seal/README.md", `${MARKER}\n`);
    write(repo, "seal/config.json", '{ "Broad gate": "make check" }\n');
    const before = [head(repo), tree(repo)];
    const plan = await planRecords(repo, "pnpm test", VERSION);
    // No commit holds the root, so the plan is of a new one, and what stands there is not kept.
    expect(plan.files.map((file) => [file.path, file.text === null])).toEqual([
      ["seal/README.md", false],
      ["seal/config.json", false],
      [WORKFLOW, false],
    ]);
    expect(plan.blocked).toBe("Git ignores seal/README.md and seal/config.json in this repository, so it cannot keep work records in its tree. A repository that cannot is out of scope for Owlery.");
    await expect(setUpRecords(repo, "pnpm test", VERSION, plan.stamp)).rejects.toThrow("Git ignores seal/README.md and seal/config.json in this repository");
    expect([head(repo), tree(repo)]).toEqual(before);
  });

  it("blocks a plan where git ignores where a work item's records go, in a new root and in a kept one: the folder threads/ of the root, or a record by its name, and a setup of it writes nothing", async () => {
    /** The refusal where git ignores `count` of the 13 paths asked below a root, `first` the first of them. */
    const says = (root: string, count: number, first: string): string =>
      `Git ignores ${count} of the 13 paths Owlery asked about where a work item's records go in this repository, ${first} among them, so it cannot keep work records in its tree. The paths asked are ${root}/threads/ and a sample of the names a work item's records bear, so a rule that ignores another record is not found here. A repository that cannot keep work records in its tree is out of scope for Owlery.`;
    // A new root: none of the three files is ignored, and every record below the root would be.
    const repo = repository();
    write(repo, ".gitignore", "seal/threads/\n");
    commitAll(repo, "chore: ignore the records");
    const before = [head(repo), tree(repo)];
    let plan = await planRecords(repo, "pnpm test", VERSION);
    expect(plan.files.map((file) => [file.path, file.text === null])).toEqual([
      ["seal/README.md", false],
      ["seal/config.json", false],
      [WORKFLOW, false],
    ]);
    expect(plan.blocked).toBe(says("seal", 13, "seal/threads/"));
    await expect(setUpRecords(repo, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(says("seal", 13, "seal/threads/"));
    expect([head(repo), tree(repo), status(repo)]).toEqual([...before, ""]);

    // A kept root with every part committed: nothing is left to write, and the plan is blocked all the same.
    const kept = repository();
    write(kept, "agentic-seal/README.md", `${MARKER}\n`);
    write(kept, "agentic-seal/config.json", '{ "Broad gate": "make check" }\n');
    write(kept, WORKFLOW, "name: seal\n");
    commitAll(kept, "chore: the place");
    expect((await planRecords(kept, "pnpm test", VERSION)).blocked).toBeNull();
    write(kept, ".gitignore", "agentic-seal/threads/\n");
    commitAll(kept, "chore: ignore the records");
    plan = await planRecords(kept, "pnpm test", VERSION);
    expect(plan.files.map((file) => file.text)).toEqual([null, null, null]);
    expect(plan.blocked).toBe(says("agentic-seal", 13, "agentic-seal/threads/"));

    // A rule on one record's name, anywhere in the tree: the folder is not ignored, and that record is.
    const one = repository();
    write(one, ".gitignore", "guarantee.md\n");
    commitAll(one, "chore: ignore a name");
    expect((await planRecords(one, "pnpm test", VERSION)).blocked).toBe(says("seal", 1, "seal/threads/0-work-item/guarantee.md"));
  });

  it("blocks a plan where something other than a folder stands where a kept root's records go: a link, the link beside a rule that ignores a record, and a file, in the commit, in the index alone or in the checkout alone; and the plan fails with git's words where git cannot say whether it ignores a record", async () => {
    const says = "Each work item's records go in a folder at seal/threads/, and something other than a folder stands there in this repository. Rename or remove it, commit that where git holds it, and open this again.";
    /** A repository whose commit holds every part of the place at `seal/`, so a plan of it writes nothing. */
    const whole = async (): Promise<string> => {
      const repo = repository();
      write(repo, "seal/README.md", `${MARKER}\n`);
      write(repo, "seal/config.json", '{ "Broad gate": "make check" }\n');
      write(repo, WORKFLOW, "name: seal\n");
      commitAll(repo, "chore: the place");
      expect((await planRecords(repo, "pnpm test", VERSION)).blocked).toBeNull();
      return repo;
    };

    // The commit holds `seal/threads` as a link to a folder of the project's own: a record written there lands outside the place, and git refuses to say whether it ignores a path behind the link.
    const linked = await whole();
    write(linked, "notes/keep.txt", "notes\n");
    symlinkSync("../notes", join(linked, "seal/threads"));
    commitAll(linked, "chore: a link where the records go");
    const before = [head(linked), tree(linked), status(linked)];
    let plan = await planRecords(linked, "pnpm test", VERSION);
    expect(plan.files.map((file) => file.text)).toEqual([null, null, null]);
    expect(plan.blocked).toBe(says);
    await expect(setUpRecords(linked, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(says);
    expect([head(linked), tree(linked), status(linked)]).toEqual(before);
    // Beside a rule that ignores a record by its name: the link does not hide the plan's refusal.
    write(linked, ".gitignore", "guarantee.md\n");
    commitAll(linked, "chore: ignore a name");
    expect((await planRecords(linked, "pnpm test", VERSION)).blocked).toBe(says);

    // The commit holds `seal/threads` as a file, where no work item's directory can be made.
    const filed = await whole();
    write(filed, "seal/threads", "not a folder\n");
    commitAll(filed, "chore: a file where the records go");
    expect((await planRecords(filed, "pnpm test", VERSION)).blocked).toBe(says);
    // Removed from the checkout and the index, the file is still the commit's, which is what a clone gets.
    git(filed, "rm", "--quiet", "seal/threads");
    expect(status(filed)).toBe("D  seal/threads\n");
    expect((await planRecords(filed, "pnpm test", VERSION)).blocked).toBe(says);

    // The file stands in the checkout alone, where git's status is not asked below a kept root.
    const untracked = await whole();
    write(untracked, "seal/threads", "not a folder\n");
    expect((await planRecords(untracked, "pnpm test", VERSION)).blocked).toBe(says);
    // Staged and then removed from the checkout, it is the index's alone, and the person's next commit takes it.
    git(untracked, "add", "seal/threads");
    rmSync(join(untracked, "seal/threads"));
    expect(status(untracked)).toBe("AD seal/threads\n");
    expect((await planRecords(untracked, "pnpm test", VERSION)).blocked).toBe(says);

    // A folder stands at `seal/threads`, and a link below it at the path of the sample's work item: no arm refuses that, git cannot answer for a record behind the link, and the plan fails with git's words rather than as one that ignores nothing.
    const behind = await whole();
    write(behind, "notes/keep.txt", "notes\n");
    mkdirSync(join(behind, "seal/threads"));
    symlinkSync("../../notes", join(behind, "seal/threads/0-work-item"));
    commitAll(behind, "chore: a link below where the records go");
    await expect(planRecords(behind, "pnpm test", VERSION)).rejects.toThrow("beyond a symbolic link");

    // A new root whose name is a link in the checkout alone: git cannot answer for a record behind it either, and the plan is refused by the arm that says what stands there, not with git's words.
    const rootLinked = repository();
    write(rootLinked, "notes/keep.txt", "notes\n");
    commitAll(rootLinked, "chore: notes");
    symlinkSync("notes", join(rootLinked, "seal"));
    expect((await planRecords(rootLinked, "pnpm test", VERSION)).blocked).toBe("The setup needs a folder at seal, and something else stands there in this repository. Rename or remove it, and open this again.");
  });

  it("blocks a plan where the checkout holds a file of the place the commit does not: a root left untracked, the files of a setup whose commit never landed, and a root behind a link; a setup of each writes nothing, and the plan is free once the files are committed", async () => {
    const untracked = repository();
    write(untracked, "seal/README.md", `${MARKER}\n`);
    let before = [head(untracked), tree(untracked), status(untracked)];
    let plan = await planRecords(untracked, "pnpm test", VERSION);
    expect(plan.blocked).toBe(differs("seal/README.md"));
    await expect(setUpRecords(untracked, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(differs("seal/README.md"));
    expect([head(untracked), tree(untracked), status(untracked)]).toEqual(before);
    commitAll(untracked, "chore: the root");
    expect((await planRecords(untracked, "pnpm test", VERSION)).blocked).toBeNull();

    // The three files stand as a setup wrote them, one of them staged, and no commit holds them: the plan is of the commit, which holds none, and names each.
    const cut = repository();
    for (const { path, text } of (await planRecords(cut, "pnpm test", VERSION)).files) write(cut, path, text ?? "");
    git(cut, "add", "seal/README.md");
    before = [head(cut), tree(cut), status(cut)];
    plan = await planRecords(cut, "pnpm test", VERSION);
    expect(plan.files.map((file) => file.text === null)).toEqual([false, false, false]);
    expect(plan.blocked).toBe(differs(`seal/README.md, seal/config.json and ${WORKFLOW}`));
    await expect(setUpRecords(cut, "pnpm test", VERSION, plan.stamp)).rejects.toThrow("This checkout does not hold seal/README.md");
    expect([head(cut), tree(cut), status(cut)]).toEqual(before);
    commitAll(cut, "chore: the place");
    expect((await planRecords(cut, "pnpm test", VERSION)).blocked).toBeNull();

    // The commit holds a link named `seal`, which is the project's own there, and the checkout shows a root through it, in a folder outside the repository.
    const linked = temporaryRepository();
    cleanups.push(linked.remove);
    write(linked.base, "elsewhere/README.md", `${MARKER}\n`);
    write(linked.base, "elsewhere/config.json", '{ "Broad gate": "make check" }\n');
    symlinkSync(join(linked.base, "elsewhere"), join(linked.repo, "seal"));
    write(linked.repo, WORKFLOW, "name: seal\n");
    commitAll(linked.repo, "chore: a link and the workflow");
    expect(readRecordsPlace(linked.repo).root).toBe("seal");
    plan = await planRecords(linked.repo, "pnpm test", VERSION);
    expect(plan.files.map((file) => file.path)).toEqual(["agentic-seal/README.md", "agentic-seal/config.json", WORKFLOW]);
    expect(plan.blocked).toBe(differs("seal/README.md"));

    // The commit holds `seal/README.md` itself as a link to a file outside the repository, which a clone does not get.
    const file = temporaryRepository();
    cleanups.push(file.remove);
    mkdirSync(join(file.repo, "seal"));
    symlinkSync(join(linked.base, "elsewhere", "README.md"), join(file.repo, "seal", "README.md"));
    write(file.repo, "seal/config.json", '{ "Broad gate": "make check" }\n');
    write(file.repo, WORKFLOW, "name: seal\n");
    commitAll(file.repo, "chore: a link for the root's file");
    expect(readRecordsPlace(file.repo).root).toBe("seal");
    expect((await planRecords(file.repo, "pnpm test", VERSION)).blocked).toBe(differs("seal/README.md"));
  });

  it("blocks a plan where git holds a file of the place and the checkout does not: one staged and then deleted, one committed and then deleted, and one staged for removal; a setup of each leaves the index and the commit as they were", async () => {
    const staged = repository();
    write(staged, WORKFLOW, "name: theirs\n");
    git(staged, "add", WORKFLOW);
    rmSync(join(staged, WORKFLOW));
    // A hook that refuses: were the setup to reach its commit, its cleanup would take the person's staged file out of the index.
    write(staged, ".git/hooks/pre-commit", "#!/bin/sh\nexit 1\n", 0o755);
    const index = git(staged, "ls-files", "--stage");
    expect(index).toContain(WORKFLOW);
    let plan = await planRecords(staged, "pnpm test", VERSION);
    expect(plan.blocked).toBe(differs(WORKFLOW));
    await expect(setUpRecords(staged, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(differs(WORKFLOW));
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
    // The commit holds it, so it is kept and not written again.
    expect(plan.files[1]).toEqual({ path: "seal/config.json", text: null });
    expect(plan.blocked).toBe(differs("seal/config.json"));
    await expect(setUpRecords(gone, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(differs("seal/config.json"));
    expect([head(gone), git(gone, "show", "HEAD:seal/config.json"), status(gone)]).toEqual([before, '{ "Broad gate": "make check" }\n', " D seal/config.json\n"]);

    const removed = repository();
    write(removed, WORKFLOW, "name: theirs\n");
    commitAll(removed, "ci: theirs");
    git(removed, "rm", "--quiet", WORKFLOW);
    plan = await planRecords(removed, "pnpm test", VERSION);
    expect(plan.blocked).toBe(differs(WORKFLOW));
    await expect(setUpRecords(removed, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(differs(WORKFLOW));
    expect(status(removed)).toBe(`D  ${WORKFLOW}\n`);
  });

  it("takes a name of the root for the project's own where the commit holds a file below it that the checkout does not show, and blocks a plan of a new root below which a file stands or is staged that the commit does not hold", async () => {
    const repo = repository();
    write(repo, "seal/notes.txt", "the project's\n");
    commitAll(repo, "docs: notes");
    rmSync(join(repo, "seal"), { recursive: true });
    expect((await planRecords(repo, "pnpm test", VERSION)).files.map((file) => file.path)).toEqual(["agentic-seal/README.md", "agentic-seal/config.json", WORKFLOW]);
    expect((await planRecords(repo, "pnpm test", VERSION)).blocked).toBeNull();
    // A file of the project's stands below the second name, untracked: the commit holds nothing there, and the setup does not write a root around it.
    write(repo, "agentic-seal/notes.txt", "the project's\n");
    expect((await planRecords(repo, "pnpm test", VERSION)).blocked).toBe(differs("agentic-seal/notes.txt"));
    // A file git ignores below the name is named too.
    const cached = repository();
    write(cached, ".gitignore", "seal/cache/\n");
    commitAll(cached, "chore: ignore the cache");
    write(cached, "seal/cache/built.bin", "x\n");
    expect((await planRecords(cached, "pnpm test", VERSION)).blocked).toBe(differs("seal/cache/built.bin"));
    // Staged alone and gone from the checkout, it is named the same.
    git(repo, "add", "agentic-seal/notes.txt");
    rmSync(join(repo, "agentic-seal"), { recursive: true });
    expect((await planRecords(repo, "pnpm test", VERSION)).blocked).toBe(differs("agentic-seal/notes.txt"));
    // Committed, the second name is the project's own too.
    git(repo, "commit", "--quiet", "-m", "docs: more notes");
    expect((await planRecords(repo, "pnpm test", VERSION)).blocked).toBe("Both seal/ and agentic-seal/ hold something of this repository's own, so Owlery has no folder to keep work records in.");
  });

  it("judges the root and the check by what the commit holds, and blocks a plan where the checkout holds a file of the place with other text: a marker, a check step and a config.json written in the checkout alone", async () => {
    // The commit's `seal/README.md` is the project's own, and the checkout's copy opens with the marker, uncommitted.
    const marked = repository();
    write(marked, "seal/README.md", "# Our seal package\n");
    commitAll(marked, "docs: the seal package");
    write(marked, "seal/README.md", `${MARKER}\n`);
    let before = [head(marked), tree(marked), status(marked)];
    let plan = await planRecords(marked, "pnpm test", VERSION);
    // The plan is the commit's: `seal/` is the project's own there, so the root is planned beside it.
    expect(plan.files.map((file) => [file.path, file.text === null])).toEqual([
      ["agentic-seal/README.md", false],
      ["agentic-seal/config.json", false],
      [WORKFLOW, false],
    ]);
    expect(plan.blocked).toBe(differs("seal/README.md"));
    await expect(setUpRecords(marked, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(differs("seal/README.md"));
    expect([head(marked), tree(marked), status(marked)]).toEqual(before);

    // The commit's `hygiene.yml` is the project's own lint, and the checkout's copy holds the step of AgenticSeal's check.
    const stepped = repository();
    write(stepped, "seal/README.md", `${MARKER}\n`);
    write(stepped, "seal/config.json", '{ "Broad gate": "make check" }\n');
    write(stepped, ".github/workflows/hygiene.yml", "name: hygiene\njobs:\n  lint:\n    steps:\n      - run: npm run lint\n");
    commitAll(stepped, "chore: a root and the project's lint");
    write(stepped, ".github/workflows/hygiene.yml", `name: hygiene\n${PLUGIN_CHECK}`);
    before = [head(stepped), tree(stepped), status(stepped)];
    plan = await planRecords(stepped, "pnpm test", VERSION);
    expect(plan.files.map((file) => [file.path, file.text === null])).toEqual([
      ["seal/README.md", true],
      ["seal/config.json", true],
      [WORKFLOW, false],
    ]);
    expect(plan.blocked).toBe(differs(".github/workflows/hygiene.yml"));
    await expect(setUpRecords(stepped, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(differs(".github/workflows/hygiene.yml"));
    expect([head(stepped), tree(stepped), status(stepped)]).toEqual(before);

    // Every part is committed, and the checkout's `config.json` holds another command than the commit's: nothing is left to write, and the plan is blocked all the same.
    const edited = repository();
    write(edited, "seal/README.md", `${MARKER}\n`);
    write(edited, "seal/config.json", '{ "Broad gate": "make check" }\n');
    write(edited, WORKFLOW, "name: seal\n");
    commitAll(edited, "chore: the place");
    expect((await planRecords(edited, "pnpm test", VERSION)).blocked).toBeNull();
    write(edited, "seal/config.json", '{ "Commit and pull request language": "English", "Record language": "English", "Broad gate": "make check" }\n');
    plan = await planRecords(edited, "pnpm test", VERSION);
    expect(plan.files.map((file) => file.text)).toEqual([null, null, null]);
    expect(plan.blocked).toBe(differs("seal/config.json"));
    // The same text staged and the checkout put back: the index alone differs, and the plan names the file.
    git(edited, "add", "seal/config.json");
    write(edited, "seal/config.json", '{ "Broad gate": "make check" }\n');
    expect((await planRecords(edited, "pnpm test", VERSION)).blocked).toBe(differs("seal/config.json"));

    // Git is told not to compare the file with the checkout, by either flag of its index entry, so its status reports no change: the checkout's text is another than the commit's all the same, and the plan names the file.
    for (const flag of ["skip-worktree", "assume-unchanged"]) {
      const flagged = repository();
      write(flagged, "seal/README.md", `${MARKER}\n`);
      write(flagged, "seal/config.json", '{ "Broad gate": "make check" }\n');
      write(flagged, WORKFLOW, "name: seal\n");
      commitAll(flagged, "chore: the place");
      git(flagged, "update-index", `--${flag}`, "seal/config.json");
      // The flag alone, over the commit's own text, blocks nothing.
      expect((await planRecords(flagged, "pnpm test", VERSION)).blocked).toBeNull();
      write(flagged, "seal/config.json", '{ "Broad gate": "make all" }\n');
      expect(status(flagged)).toBe("");
      plan = await planRecords(flagged, "pnpm test", VERSION);
      expect(plan.files.map((file) => file.text)).toEqual([null, null, null]);
      expect(plan.blocked).toBe(differs("seal/config.json"));
      // A link stands in the file's place, to a file outside the repository that holds the commit's text: a clone gets a file there, and the plan names the path.
      rmSync(join(flagged, "seal/config.json"));
      write(flagged, "../elsewhere.json", '{ "Broad gate": "make check" }\n');
      symlinkSync(join(flagged, "../elsewhere.json"), join(flagged, "seal/config.json"));
      expect(status(flagged)).toBe("");
      expect((await planRecords(flagged, "pnpm test", VERSION)).blocked).toBe(differs("seal/config.json"));
    }
  });

  it("reads a file the plan neither keeps nor writes for what the daemon reads of it alone: an edit of the project's own seal/README.md or hygiene.yml that makes neither a root nor the check blocks nothing, and a marker staged alone blocks the plan", async () => {
    const repo = repository();
    write(repo, "seal/README.md", "# Our seal package\n");
    write(repo, ".github/workflows/hygiene.yml", "name: hygiene\njobs:\n  lint:\n    steps:\n      - run: npm run lint\n");
    commitAll(repo, "chore: the project's own seal package and lint");
    // Both are edited in the checkout, one staged too, and neither edit is a marker or the check's step.
    write(repo, "seal/README.md", "# Our seal package\n\nIt seals envelopes.\n");
    write(repo, ".github/workflows/hygiene.yml", "name: hygiene\njobs:\n  lint:\n    steps:\n      - run: npm run lint -- --fix\n");
    git(repo, "add", "seal/README.md");
    const plan = await planRecords(repo, "pnpm test", VERSION);
    expect(plan.files.map((file) => [file.path, file.text === null])).toEqual([
      ["agentic-seal/README.md", false],
      ["agentic-seal/config.json", false],
      [WORKFLOW, false],
    ]);
    expect(plan.blocked).toBeNull();
    await setUpRecords(repo, "pnpm test", VERSION, plan.stamp);
    // The setup's commit holds its three files, and the person's two edits stay as they were, one staged.
    expect(git(repo, "show", "--name-only", "--format=", "HEAD").trim().split("\n")).toEqual([WORKFLOW, "agentic-seal/README.md", "agentic-seal/config.json"]);
    expect(status(repo)).toBe(" M .github/workflows/hygiene.yml\nM  seal/README.md\n");

    // The marker is staged in the project's own README.md and the checkout is put back: the next commit of the person's makes `seal/` a root, and the plan names the file.
    const staged = repository();
    write(staged, "seal/README.md", "# Our seal package\n");
    commitAll(staged, "docs: the seal package");
    write(staged, "seal/README.md", `${MARKER}\n`);
    git(staged, "add", "seal/README.md");
    write(staged, "seal/README.md", "# Our seal package\n");
    expect(readRecordsPlace(staged).root).toBeNull();
    expect((await planRecords(staged, "pnpm test", VERSION)).blocked).toBe(differs("seal/README.md"));
  });

  it("blocks a plan where the commit holds something other than a file at a path the setup writes, though the checkout holds it as the commit does: a link, and a folder; a setup of it writes nothing", async () => {
    const says = (path: string): string => `The commit this checkout stands at holds something other than a file at ${path}, where the setup writes one. Rename it in a commit, and open this again.`;
    // A link at the workflow's path, committed, and the checkout holds the same link: git's status reports nothing.
    const linked = repository();
    mkdirSync(join(linked, ".github/workflows"), { recursive: true });
    symlinkSync("ci.yml", join(linked, WORKFLOW));
    commitAll(linked, "ci: a link at the workflow's path");
    expect(status(linked)).toBe("");
    const before = [head(linked), tree(linked)];
    let plan = await planRecords(linked, "pnpm test", VERSION);
    expect(plan.files.at(-1)?.text).not.toBeNull();
    expect(plan.blocked).toBe(says(WORKFLOW));
    await expect(setUpRecords(linked, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(says(WORKFLOW));
    expect([head(linked), tree(linked), status(linked)]).toEqual([...before, ""]);

    // A kept root whose `config.json` is a folder in the commit.
    const folder = repository();
    write(folder, "seal/README.md", `${MARKER}\n`);
    write(folder, "seal/config.json/notes.txt", "x\n");
    write(folder, WORKFLOW, "name: seal\n");
    commitAll(folder, "chore: a folder named config.json");
    plan = await planRecords(folder, "pnpm test", VERSION);
    expect(plan.files.map((file) => file.text === null)).toEqual([true, false, true]);
    expect(plan.blocked).toBe(says("seal/config.json"));
  });

  it("keeps a root the commit holds and the checkout does not show, and blocks the plan in place of a second root: one removed and not staged, and one a sparse checkout leaves out", async () => {
    /** A repository whose commit holds an AgenticSeal root at `seal/` and AgenticSeal's workflow. */
    const rooted = (): string => {
      const repo = repository();
      write(repo, "seal/README.md", `${MARKER}\n`);
      write(repo, "seal/config.json", '{ "Broad gate": "make check" }\n');
      write(repo, ".github/workflows/hygiene.yml", `name: hygiene\n${PLUGIN_CHECK}`);
      commitAll(repo, "chore: the plugin's root");
      return repo;
    };
    const kept = [
      { path: "seal/README.md", text: null },
      { path: "seal/config.json", text: null },
      { path: ".github/workflows/hygiene.yml", text: null },
    ];
    const says = differs("seal/README.md and seal/config.json");

    const removed = rooted();
    rmSync(join(removed, "seal"), { recursive: true });
    let before = [head(removed), tree(removed), status(removed)];
    let plan = await planRecords(removed, "pnpm test", VERSION);
    expect(plan.files).toEqual(kept);
    expect(plan.blocked).toBe(says);
    await expect(setUpRecords(removed, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(says);
    expect([head(removed), tree(removed), status(removed)]).toEqual(before);
    // Restored, the repository holds every part again.
    git(removed, "checkout", "--quiet", "--", "seal");
    expect((await planRecords(removed, "pnpm test", VERSION)).blocked).toBeNull();
    // Where the commit holds a root at each name, the first is the one kept, as the check takes it.
    write(removed, "agentic-seal/README.md", `${MARKER}\n`);
    commitAll(removed, "chore: a second root");
    expect((await planRecords(removed, "pnpm test", VERSION)).files).toEqual(kept);

    // A sparse checkout of everything but `seal/`: git reports no change, and the checkout shows no root.
    const sparse = rooted();
    git(sparse, "sparse-checkout", "set", "--no-cone", "/*", "!/seal/");
    expect([existsSync(join(sparse, "seal")), status(sparse)]).toEqual([false, ""]);
    before = [head(sparse), tree(sparse)];
    plan = await planRecords(sparse, "pnpm test", VERSION);
    expect(plan.files).toEqual(kept);
    expect(plan.blocked).toBe(says);
    await expect(setUpRecords(sparse, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(says);
    expect([head(sparse), tree(sparse), status(sparse)]).toEqual([...before, ""]);

    // A cone of `.github` alone, which leaves the root out the same way.
    const cone = rooted();
    git(cone, "sparse-checkout", "set", "--cone", ".github");
    expect(existsSync(join(cone, "seal"))).toBe(false);
    plan = await planRecords(cone, "pnpm test", VERSION);
    expect(plan.files).toEqual(kept);
    expect(plan.blocked).toBe(says);
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
    // Its removal is staged, so the checkout and the index hold nothing there, and the commit still holds the file.
    git(repo, "rm", "--quiet", ".github");
    expect((await planRecords(repo, "pnpm test", VERSION)).blocked).toBe(says);
    // A file that was staged there and then deleted: the index alone holds it.
    const staged = repository();
    write(staged, ".github", "a file of the project's\n");
    git(staged, "add", ".github");
    rmSync(join(staged, ".github"));
    expect((await planRecords(staged, "pnpm test", VERSION)).blocked).toBe(says);
    // A link stands there, which the setup does not write through.
    const linked = temporaryRepository();
    cleanups.push(linked.remove);
    mkdirSync(join(linked.base, "elsewhere"));
    symlinkSync(join(linked.base, "elsewhere"), join(linked.repo, ".github"));
    expect((await planRecords(linked.repo, "pnpm test", VERSION)).blocked).toBe(says);
    expect(readdirSync(join(linked.base, "elsewhere"))).toEqual([]);
  });

  it("blocks a plan, on a disk that takes two names for one where they differ only in the case of their letters, where a path the setup needs stands under other letters: the root's folder, the folder .github, and a file of a kept root", async () => {
    const says = (names: string): string =>
      `The setup needs ${names}, and this disk finds something of the repository there under the same name in other letters, which git and GitHub take for another name. Rename it, and open this again.`;
    const repo = repository();
    // On a disk that tells the two names apart nothing stands at the setup's paths, and no plan below is blocked.
    const folds = existsSync(join(repo, "readme.md"));
    write(repo, "Seal/notes.txt", "the project's\n");
    commitAll(repo, "docs: notes in Seal/");
    const before = [head(repo), tree(repo), status(repo)];
    let plan = await planRecords(repo, "pnpm test", VERSION);
    // The plan is the commit's, which holds nothing at `seal`.
    expect(plan.files.map((file) => file.path)).toEqual(["seal/README.md", "seal/config.json", WORKFLOW]);
    expect(plan.blocked).toBe(folds ? says("seal") : null);
    if (folds) {
      await expect(setUpRecords(repo, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(says("seal"));
      expect([head(repo), tree(repo), status(repo)]).toEqual(before);
    }

    // The folder above the workflow: the one that stands under other letters is named, and no folder below it.
    const workflows = repository();
    write(workflows, ".GitHub/workflows/ci.yml", "name: ci\n");
    commitAll(workflows, "ci: theirs, in .GitHub/");
    expect((await planRecords(workflows, "pnpm test", VERSION)).blocked).toBe(folds ? says(".github") : null);

    // A kept root that holds `Config.json`: the setup writes `config.json`, where the disk finds the other.
    const file = repository();
    write(file, "seal/README.md", `${MARKER}\n`);
    write(file, "seal/Config.json", "{}\n");
    write(file, WORKFLOW, "name: seal\n");
    commitAll(file, "chore: a root with Config.json");
    plan = await planRecords(file, "pnpm test", VERSION);
    expect(plan.files[1]?.text).not.toBeNull();
    expect(plan.blocked).toBe(folds ? says("seal/config.json") : null);
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

  it("writes a workflow that fetches the check from Owlery's repository at the version's tag, falls back to the release's branch, runs a script that stands under pr-check/, and lets it post `Owlery seal` with the run's token", () => {
    const text = workflowText(VERSION);
    expect(text).toContain("\nname: seal\n");
    expect(text).toContain("\njobs:\n  seal:\n");
    expect(text).toContain('git clone --quiet --depth 1 --branch v1.2.3 \\\n            https://github.com/MichaelYcJo/owlery.git "$RUNNER_TEMP/owlery" \\\n          || git clone --quiet --depth 1 --branch release/v1.2.3 \\\n            https://github.com/MichaelYcJo/owlery.git "$RUNNER_TEMP/owlery"\n');
    expect(text).toContain("- name: the check, at Owlery 1.2.3\n");
    expect(text).not.toContain("<version>");
    const script = /python3 "\$RUNNER_TEMP\/owlery\/(pr-check\/[^"]+)"/.exec(text)?.[1];
    expect(script).toBe("pr-check/skills/code-review/scripts/chain_check.py");
    expect(existsSync(join(PR_CHECK, "..", script ?? "missing"))).toBe(true);
    expect(text).toContain('--baseline "origin/${{ github.base_ref }}" \\\n            --post\n');
    expect(text).toContain("fetch-depth: 0");
    // The job may read the code and write a check, and nothing else; its step is handed the run's token.
    expect(text).toContain("\npermissions:\n  contents: read\n  checks: write\n\n");
    expect(text).toContain("        env:\n          GITHUB_TOKEN: ${{ github.token }}\n");
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
