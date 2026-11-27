// The place for work records and the pull request check, as connecting a
// repository creates them: what a plan names, what a setup writes and
// commits, and what stands and is kept. Each case runs in a temporary
// repository, never in Owlery's own, which one case reads for its workflow.
import { execFileSync, spawn } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { MARKER, SUBJECT, moveSubject, olderVersion, onOwlChain, pinnedVersion, planRecords, proposedBroadGate, readHeavyCommands, readRecordsPlace, setUpRecords, workflowText } from "../src/daemon/records-place";
import { REPOSITORY_FILE_BYTES } from "../src/daemon/repository-file";
import { commitFile, git, runs, temporaryClone, temporaryRepository } from "./repositories";

const PR_CHECK = join(__dirname, "..", "..", "..", "pr-check");
const WORKFLOW = ".github/workflows/owlery-inspection.yml";
const VERSION = "1.2.3";
/**
 * The first line of the AgenticSeal plugin's records root. This repository is
 * built with the plugin and keeps its root, `seal/`, until the plugin takes
 * IADD's names (#322, *When it lands*, step 4), so the line is written out
 * here rather than read from `MARKER`, which follows Owlery's own root.
 */
const PLUGIN_ROOT_MARKER = "# What AgenticSeal maintains in seal/";
/**
 * The version this repository's own workflow stays pinned at while its
 * records stand in the plugin's root, since the check of a later release
 * reads IADD's forms once #322 renames them. Step 4 of #322 moves the root and
 * the pin in one commit, and from then on the pin follows the app's version.
 */
const PIN_HELD_FOR_THE_PLUGIN = "0.1.0";
/** The step of AgenticSeal's `hygiene.yml` that runs the check, as its 0.38.4 template writes it. */
const PLUGIN_CHECK = 'jobs:\n  hygiene:\n    steps:\n      - run: |\n          python3 "$RUNNER_TEMP/agentic/skills/code-review/scripts/chain_check.py" \\\n            --baseline "origin/${{ github.base_ref }}"\n';
/** The refusal of a plan where the checkout does not hold a path of the place as the commit does. */
/** The refusal of a plan where the project keeps something of its own at the root's name. */
const OWN = "iadd/ holds something of this repository's own, so Owlery has no folder to keep work records in. Rename that folder in a commit, and open this again.";
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
    expect(plan.files.map((file) => file.path)).toEqual(["iadd/README.md", "iadd/config.json", WORKFLOW]);
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
    expect(git(repo, "show", "--name-only", "--format=%s|%an", "HEAD").trim().split("\n").filter((line) => line !== "")).toEqual([`${SUBJECT}|Owlery Test`, WORKFLOW, "iadd/README.md", "iadd/config.json"]);
    for (const { path, text } of plan.files) expect(readFileSync(join(repo, path), "utf8"), path).toBe(text);
    expect(status(repo)).toBe("A  other.txt\n");
    expect(readRecordsPlace(repo)).toEqual({ root: "iadd", check: WORKFLOW, broadGate: "pnpm test", olderCheck: null });
    // What stands now is kept: a second plan writes no file.
    expect((await planRecords(repo, "another", VERSION)).files).toEqual([
      { path: "iadd/README.md", text: null },
      { path: "iadd/config.json", text: null },
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
    write(repo, "iadd/README.md", `${MARKER}\r\n\r\nAgenticSeal's own.\r\n`);
    write(repo, "iadd/config.json", '{ "Mode": "shared", "Broad gate": "make check" }\n');
    write(repo, ".github/workflows/hygiene.yml", `name: hygiene\n${PLUGIN_CHECK}`);
    commitAll(repo, "chore: the plugin's root");
    const before = [head(repo), tree(repo)];
    expect(readRecordsPlace(repo)).toEqual({ root: "iadd", check: ".github/workflows/hygiene.yml", broadGate: "make check", olderCheck: null });
    const plan = await planRecords(repo, "pnpm test", VERSION);
    expect(plan.blocked).toBeNull();
    expect(plan.files).toEqual([
      { path: "iadd/README.md", text: null },
      { path: "iadd/config.json", text: null },
      { path: ".github/workflows/hygiene.yml", text: null },
    ]);
    await setUpRecords(repo, "pnpm test", VERSION, plan.stamp);
    expect([head(repo), tree(repo)]).toEqual(before);
    expect(status(repo)).toBe("");
    expect(readFileSync(join(repo, "iadd/config.json"), "utf8")).toBe('{ "Mode": "shared", "Broad gate": "make check" }\n');
  });

  it("takes a hygiene.yml for the check only where it runs AgenticSeal's script: beside a project's own workflow of that name the setup writes Owlery's, and the repository is read as holding no check", async () => {
    const repo = repository();
    write(repo, ".github/workflows/hygiene.yml", "name: hygiene\non: pull_request\njobs:\n  lint:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm run lint\n");
    commitAll(repo, "ci: the project's own lint");
    expect(readRecordsPlace(repo).check).toBeNull();
    const plan = await planRecords(repo, "pnpm test", VERSION);
    expect(plan.files.map((file) => [file.path, file.text === null])).toEqual([
      ["iadd/README.md", false],
      ["iadd/config.json", false],
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

  it("reads an older check from Owlery's workflow in the working tree, committed or not: the version it pins where that is older than the one given, and none for the same version, a newer one, no version given, a workflow whose version line is not read, and AgenticSeal's hygiene.yml", () => {
    const repo = repository();
    expect(readRecordsPlace(repo, VERSION).olderCheck).toBeNull();
    write(repo, WORKFLOW, workflowText("1.2.2"));
    expect(readRecordsPlace(repo, VERSION)).toEqual({ root: null, check: WORKFLOW, broadGate: null, olderCheck: "1.2.2" });
    expect(readRecordsPlace(repo, "1.2.2").olderCheck).toBeNull();
    expect(readRecordsPlace(repo, "1.2.1").olderCheck).toBeNull();
    expect(readRecordsPlace(repo).olderCheck).toBeNull();
    write(repo, WORKFLOW, workflowText("1.2.2").replace("--branch v1.2.2 \\", "--branch main \\"));
    expect(readRecordsPlace(repo, VERSION).olderCheck).toBeNull();
    const plugin = repository();
    write(plugin, ".github/workflows/hygiene.yml", `name: hygiene\n${PLUGIN_CHECK}# --branch v1.2.2 \\\n# --branch release/v1.2.2 \\\n`);
    expect(readRecordsPlace(plugin, VERSION)).toEqual({ root: null, check: ".github/workflows/hygiene.yml", broadGate: null, olderCheck: null });
  });

  it("reads a folder as on the owl chain where Owlery's workflow stands in it, committed or not, and as on none where AgenticSeal's check stands alone, where a project's own hygiene.yml does, and where no workflow does", () => {
    const repo = repository();
    expect(onOwlChain(repo)).toBe(false);
    write(repo, ".github/workflows/hygiene.yml", `name: hygiene\n${PLUGIN_CHECK}`);
    expect(onOwlChain(repo)).toBe(false);
    write(repo, ".github/workflows/hygiene.yml", "name: hygiene\njobs:\n  lint:\n    steps:\n      - run: npm run lint\n");
    expect(onOwlChain(repo)).toBe(false);
    // The folder is read as it stands, so a branch that installs the workflow carries the chain before its commit.
    write(repo, WORKFLOW, workflowText(VERSION));
    expect(onOwlChain(repo)).toBe(true);
    // A folder that does not stand holds no workflow.
    expect(onOwlChain(join(repo, "absent"))).toBe(false);
  });

  it("writes only what a root lacks: the config.json of a root that holds none, and no Broad gate into a config.json that stands without the key", async () => {
    const repo = repository();
    write(repo, "iadd/README.md", `${MARKER}\n`);
    write(repo, WORKFLOW, "name: inspection\n");
    commitAll(repo, "chore: a root with no config");
    expect(readRecordsPlace(repo)).toEqual({ root: "iadd", check: WORKFLOW, broadGate: null, olderCheck: null });
    const plan = await planRecords(repo, "pnpm test", VERSION);
    expect(plan.files.map((file) => [file.path, file.text === null])).toEqual([
      ["iadd/README.md", true],
      ["iadd/config.json", false],
      [WORKFLOW, true],
    ]);
    await setUpRecords(repo, "pnpm test", VERSION, plan.stamp);
    expect(git(repo, "show", "--name-only", "--format=", "HEAD").trim()).toBe("iadd/config.json");
    expect(readRecordsPlace(repo).broadGate).toBe("pnpm test");

    const keyless = repository();
    write(keyless, "iadd/README.md", `${MARKER}\n`);
    write(keyless, "iadd/config.json", '{ "Record language": "Korean" }\n');
    commitAll(keyless, "chore: a root with no command");
    expect((await planRecords(keyless, "pnpm test", VERSION)).files.slice(0, 2)).toEqual([
      { path: "iadd/README.md", text: null },
      { path: "iadd/config.json", text: null },
    ]);
    expect(readRecordsPlace(keyless)).toEqual({ root: "iadd", check: null, broadGate: null, olderCheck: null });
    // A config.json that is no JSON, and a key that holds no text, give no command.
    write(keyless, "iadd/config.json", "{ not json");
    expect(readRecordsPlace(keyless).broadGate).toBeNull();
    write(keyless, "iadd/config.json", '{ "Broad gate": 3 }');
    expect(readRecordsPlace(keyless).broadGate).toBeNull();
  });

  it("reads the heavy commands a root's config.json names, each by its name with its command line, and none from a value that is no object, from an entry that holds no text or an empty one, from a config.json that is no JSON, and where no root stands, this repository's own `seal/` among them", () => {
    const repo = repository();
    write(repo, "iadd/README.md", `${MARKER}\n`);
    write(repo, "iadd/config.json", `${JSON.stringify({ "Broad gate": "pnpm test", "Heavy commands": { test: "pnpm --filter @owlery/desktop run test", install: "pnpm install", count: 3, blank: "  ", list: ["pnpm"] } })}\n`);
    expect(readHeavyCommands(repo)).toEqual({ test: "pnpm --filter @owlery/desktop run test", install: "pnpm install" });
    for (const value of ["pnpm test", ["pnpm test"], null, 3]) {
      write(repo, "iadd/config.json", JSON.stringify({ "Heavy commands": value }));
      expect(readHeavyCommands(repo), JSON.stringify(value)).toEqual({});
    }
    write(repo, "iadd/config.json", '{ "Broad gate": "pnpm test" }');
    expect(readHeavyCommands(repo)).toEqual({});
    write(repo, "iadd/config.json", "{ not json");
    expect(readHeavyCommands(repo)).toEqual({});
    // A config.json beside no root's README.md names nothing.
    const rootless = repository();
    write(rootless, "iadd/config.json", JSON.stringify({ "Heavy commands": { test: "pnpm test" } }));
    expect(readHeavyCommands(rootless)).toEqual({});
    // This repository's own root stays `seal/`, in AgenticSeal's form, so the daemon reads no heavy command of it.
    expect(readHeavyCommands(join(__dirname, "..", "..", ".."))).toEqual({});
  });

  it("reads no root from a `README.md` that holds more than the daemon reads of a file, or that links to what is no plain file, though each opens with the marker or leads to a folder", () => {
    const large = repository();
    write(large, "iadd/README.md", `${MARKER}\n${"a".repeat(REPOSITORY_FILE_BYTES)}`);
    expect(readRecordsPlace(large).root).toBeNull();
    write(large, "iadd/README.md", `${MARKER}\n`);
    expect(readRecordsPlace(large).root).toBe("iadd");
    const folder = repository();
    mkdirSync(join(folder, "iadd"));
    symlinkSync("..", join(folder, "iadd/README.md"));
    expect(readRecordsPlace(folder).root).toBeNull();
  });

  it("blocks a plan where the project keeps an iadd/ of its own, whose README.md is no root's, and a setup of it writes nothing: the root has no second name to move to", async () => {
    const repo = repository();
    write(repo, "iadd/README.md", "# The adds of the harbour\n");
    commitAll(repo, "docs: the adds");
    expect(readRecordsPlace(repo)).toEqual({ root: null, check: null, broadGate: null, olderCheck: null });
    const before = [head(repo), tree(repo)];
    const plan = await planRecords(repo, "pnpm test", VERSION);
    expect(plan.blocked).toBe(OWN);
    await expect(setUpRecords(repo, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(plan.blocked ?? "blocked");
    expect([head(repo), tree(repo)]).toEqual(before);
    expect(readFileSync(join(repo, "iadd/README.md"), "utf8")).toBe("# The adds of the harbour\n");
    // A file of the project's own of another name under iadd/ blocks the plan too, and so does a file at the name.
    const small = repository();
    write(small, "iadd/readme.md", "# The adds of the harbour\n");
    commitAll(small, "docs: the adds");
    expect((await planRecords(small, "pnpm test", VERSION)).blocked).toBe(plan.blocked);
    const filed = repository();
    write(filed, "iadd", "a file of the project's\n");
    commitAll(filed, "chore: a file at the name");
    expect((await planRecords(filed, "pnpm test", VERSION)).blocked).toBe(plan.blocked);
  });

  it("reads no root at AgenticSeal's second name, agentic-seal/, though its README.md opens with the marker, and plans the root at iadd/ beside it", async () => {
    const repo = repository();
    write(repo, "agentic-seal/README.md", `${MARKER}\n`);
    write(repo, "agentic-seal/config.json", '{ "Broad gate": "make check" }\n');
    commitAll(repo, "chore: a root at the second name");
    expect(readRecordsPlace(repo)).toEqual({ root: null, check: null, broadGate: null, olderCheck: null });
    const plan = await planRecords(repo, "pnpm test", VERSION);
    expect([plan.files.map((file) => file.path), plan.blocked]).toEqual([["iadd/README.md", "iadd/config.json", WORKFLOW], null]);
  });

  it("blocks a plan where git ignores a path the setup would write, names the path, and a setup of it writes nothing", async () => {
    const repo = repository();
    write(repo, ".gitignore", "iadd/\n");
    commitAll(repo, "chore: ignore iadd/");
    const before = [head(repo), tree(repo)];
    const plan = await planRecords(repo, "pnpm test", VERSION);
    expect(plan.blocked).toBe("Git ignores iadd/README.md and iadd/config.json in this repository, so it cannot keep work records in its tree. A repository that cannot is out of scope for Owlery.");
    expect(plan.branch).toBe("main");
    await expect(setUpRecords(repo, "pnpm test", VERSION, plan.stamp)).rejects.toThrow("Git ignores iadd/README.md");
    expect([head(repo), tree(repo)]).toEqual(before);
    expect(status(repo)).toBe("");
  });

  it("blocks a plan where a root stands in the checkout and git ignores it, names the files of the root, and a setup of it writes nothing", async () => {
    const repo = repository();
    write(repo, ".gitignore", "iadd/\n");
    commitAll(repo, "chore: ignore iadd/");
    write(repo, "iadd/README.md", `${MARKER}\n`);
    write(repo, "iadd/config.json", '{ "Broad gate": "make check" }\n');
    const before = [head(repo), tree(repo)];
    const plan = await planRecords(repo, "pnpm test", VERSION);
    // No commit holds the root, so the plan is of a new one, and what stands there is not kept.
    expect(plan.files.map((file) => [file.path, file.text === null])).toEqual([
      ["iadd/README.md", false],
      ["iadd/config.json", false],
      [WORKFLOW, false],
    ]);
    expect(plan.blocked).toBe("Git ignores iadd/README.md and iadd/config.json in this repository, so it cannot keep work records in its tree. A repository that cannot is out of scope for Owlery.");
    await expect(setUpRecords(repo, "pnpm test", VERSION, plan.stamp)).rejects.toThrow("Git ignores iadd/README.md and iadd/config.json in this repository");
    expect([head(repo), tree(repo)]).toEqual(before);
  });

  it("blocks a plan where git ignores where a work item's records go, in a new root and in a kept one: the folder threads/ of the root, or a record by its name, and a setup of it writes nothing", async () => {
    /** The refusal where git ignores `count` of the 13 paths asked below a root, `first` the first of them. */
    const says = (root: string, count: number, first: string): string =>
      `Git ignores ${count} of the 13 paths Owlery asked about where a work item's records go in this repository, ${first} among them, so it cannot keep work records in its tree. The paths asked are ${root}/threads/ and a sample of the names a work item's records bear, so a rule that ignores another record is not found here. A repository that cannot keep work records in its tree is out of scope for Owlery.`;
    // A new root: none of the three files is ignored, and every record below the root would be.
    const repo = repository();
    write(repo, ".gitignore", "iadd/threads/\n");
    commitAll(repo, "chore: ignore the records");
    const before = [head(repo), tree(repo)];
    let plan = await planRecords(repo, "pnpm test", VERSION);
    expect(plan.files.map((file) => [file.path, file.text === null])).toEqual([
      ["iadd/README.md", false],
      ["iadd/config.json", false],
      [WORKFLOW, false],
    ]);
    expect(plan.blocked).toBe(says("iadd", 13, "iadd/threads/"));
    await expect(setUpRecords(repo, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(says("iadd", 13, "iadd/threads/"));
    expect([head(repo), tree(repo), status(repo)]).toEqual([...before, ""]);

    // A kept root with every part committed: nothing is left to write, and the plan is blocked all the same.
    const kept = repository();
    write(kept, "iadd/README.md", `${MARKER}\n`);
    write(kept, "iadd/config.json", '{ "Broad gate": "make check" }\n');
    write(kept, WORKFLOW, "name: inspection\n");
    commitAll(kept, "chore: the place");
    expect((await planRecords(kept, "pnpm test", VERSION)).blocked).toBeNull();
    write(kept, ".gitignore", "iadd/threads/\n");
    commitAll(kept, "chore: ignore the records");
    plan = await planRecords(kept, "pnpm test", VERSION);
    expect(plan.files.map((file) => file.text)).toEqual([null, null, null]);
    expect(plan.blocked).toBe(says("iadd", 13, "iadd/threads/"));

    // A rule on one record's name, anywhere in the tree: the folder is not ignored, and that record is.
    const one = repository();
    write(one, ".gitignore", "inspection.md\n");
    commitAll(one, "chore: ignore a name");
    expect((await planRecords(one, "pnpm test", VERSION)).blocked).toBe(says("iadd", 1, "iadd/threads/0-work-item/inspection.md"));
  });

  it("blocks a plan where something other than a folder stands where a kept root's records go: a link, the link beside a rule that ignores a record, and a file, in the commit, in the index alone or in the checkout alone; and the plan fails with git's words where git cannot say whether it ignores a record", async () => {
    const says = "Each work item's records go in a folder at iadd/threads/, and something other than a folder stands there in this repository. Rename or remove it, commit that where git holds it, and open this again.";
    /** A repository whose commit holds every part of the place at `iadd/`, so a plan of it writes nothing. */
    const whole = async (): Promise<string> => {
      const repo = repository();
      write(repo, "iadd/README.md", `${MARKER}\n`);
      write(repo, "iadd/config.json", '{ "Broad gate": "make check" }\n');
      write(repo, WORKFLOW, "name: inspection\n");
      commitAll(repo, "chore: the place");
      expect((await planRecords(repo, "pnpm test", VERSION)).blocked).toBeNull();
      return repo;
    };

    // The commit holds `iadd/threads` as a link to a folder of the project's own: a record written there lands outside the place, and git refuses to say whether it ignores a path behind the link.
    const linked = await whole();
    write(linked, "notes/keep.txt", "notes\n");
    symlinkSync("../notes", join(linked, "iadd/threads"));
    commitAll(linked, "chore: a link where the records go");
    const before = [head(linked), tree(linked), status(linked)];
    let plan = await planRecords(linked, "pnpm test", VERSION);
    expect(plan.files.map((file) => file.text)).toEqual([null, null, null]);
    expect(plan.blocked).toBe(says);
    await expect(setUpRecords(linked, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(says);
    expect([head(linked), tree(linked), status(linked)]).toEqual(before);
    // Beside a rule that ignores a record by its name: the link does not hide the plan's refusal.
    write(linked, ".gitignore", "inspection.md\n");
    commitAll(linked, "chore: ignore a name");
    expect((await planRecords(linked, "pnpm test", VERSION)).blocked).toBe(says);

    // The commit holds `iadd/threads` as a file, where no work item's directory can be made.
    const filed = await whole();
    write(filed, "iadd/threads", "not a folder\n");
    commitAll(filed, "chore: a file where the records go");
    expect((await planRecords(filed, "pnpm test", VERSION)).blocked).toBe(says);
    // Removed from the checkout and the index, the file is still the commit's, which is what a clone gets.
    git(filed, "rm", "--quiet", "iadd/threads");
    expect(status(filed)).toBe("D  iadd/threads\n");
    expect((await planRecords(filed, "pnpm test", VERSION)).blocked).toBe(says);

    // The file stands in the checkout alone, where git's status is not asked below a kept root.
    const untracked = await whole();
    write(untracked, "iadd/threads", "not a folder\n");
    expect((await planRecords(untracked, "pnpm test", VERSION)).blocked).toBe(says);
    // Staged and then removed from the checkout, it is the index's alone, and the person's next commit takes it.
    git(untracked, "add", "iadd/threads");
    rmSync(join(untracked, "iadd/threads"));
    expect(status(untracked)).toBe("AD iadd/threads\n");
    expect((await planRecords(untracked, "pnpm test", VERSION)).blocked).toBe(says);

    // A folder stands at `iadd/threads`, and a link below it at the path of the sample's work item: no arm refuses that, git cannot answer for a record behind the link, and the plan fails with git's words rather than as one that ignores nothing.
    const behind = await whole();
    write(behind, "notes/keep.txt", "notes\n");
    mkdirSync(join(behind, "iadd/threads"));
    symlinkSync("../../notes", join(behind, "iadd/threads/0-work-item"));
    commitAll(behind, "chore: a link below where the records go");
    await expect(planRecords(behind, "pnpm test", VERSION)).rejects.toThrow("beyond a symbolic link");

    // A new root whose name is a link in the checkout alone: git cannot answer for a record behind it either, and the plan is refused by the arm that says what stands there, not with git's words.
    const rootLinked = repository();
    write(rootLinked, "notes/keep.txt", "notes\n");
    commitAll(rootLinked, "chore: notes");
    symlinkSync("notes", join(rootLinked, "iadd"));
    expect((await planRecords(rootLinked, "pnpm test", VERSION)).blocked).toBe("The setup needs a folder at iadd, and something else stands there in this repository. Rename or remove it, and open this again.");
  });

  it("blocks a plan where the checkout holds a file of the place the commit does not: a root left untracked, the files of a setup whose commit never landed, and a root behind a link; a setup of each writes nothing, and the plan is free once the files are committed", async () => {
    const untracked = repository();
    write(untracked, "iadd/README.md", `${MARKER}\n`);
    let before = [head(untracked), tree(untracked), status(untracked)];
    let plan = await planRecords(untracked, "pnpm test", VERSION);
    expect(plan.blocked).toBe(differs("iadd/README.md"));
    await expect(setUpRecords(untracked, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(differs("iadd/README.md"));
    expect([head(untracked), tree(untracked), status(untracked)]).toEqual(before);
    commitAll(untracked, "chore: the root");
    expect((await planRecords(untracked, "pnpm test", VERSION)).blocked).toBeNull();

    // The three files stand as a setup wrote them, one of them staged, and no commit holds them: the plan is of the commit, which holds none, and names each.
    const cut = repository();
    for (const { path, text } of (await planRecords(cut, "pnpm test", VERSION)).files) write(cut, path, text ?? "");
    git(cut, "add", "iadd/README.md");
    before = [head(cut), tree(cut), status(cut)];
    plan = await planRecords(cut, "pnpm test", VERSION);
    expect(plan.files.map((file) => file.text === null)).toEqual([false, false, false]);
    expect(plan.blocked).toBe(differs(`iadd/README.md, iadd/config.json and ${WORKFLOW}`));
    await expect(setUpRecords(cut, "pnpm test", VERSION, plan.stamp)).rejects.toThrow("This checkout does not hold iadd/README.md");
    expect([head(cut), tree(cut), status(cut)]).toEqual(before);
    commitAll(cut, "chore: the place");
    expect((await planRecords(cut, "pnpm test", VERSION)).blocked).toBeNull();

    // The commit holds a link named `iadd`, which is the project's own there, and the checkout shows a root through it, in a folder outside the repository.
    const linked = temporaryRepository();
    cleanups.push(linked.remove);
    write(linked.base, "elsewhere/README.md", `${MARKER}\n`);
    write(linked.base, "elsewhere/config.json", '{ "Broad gate": "make check" }\n');
    symlinkSync(join(linked.base, "elsewhere"), join(linked.repo, "iadd"));
    write(linked.repo, WORKFLOW, "name: inspection\n");
    commitAll(linked.repo, "chore: a link and the workflow");
    expect(readRecordsPlace(linked.repo).root).toBe("iadd");
    plan = await planRecords(linked.repo, "pnpm test", VERSION);
    expect(plan.files.map((file) => file.path)).toEqual([WORKFLOW]);
    expect(plan.blocked).toBe(OWN);

    // The commit holds `iadd/README.md` itself as a link to a file outside the repository, which a clone does not get.
    const file = temporaryRepository();
    cleanups.push(file.remove);
    mkdirSync(join(file.repo, "iadd"));
    symlinkSync(join(linked.base, "elsewhere", "README.md"), join(file.repo, "iadd", "README.md"));
    write(file.repo, "iadd/config.json", '{ "Broad gate": "make check" }\n');
    write(file.repo, WORKFLOW, "name: inspection\n");
    commitAll(file.repo, "chore: a link for the root's file");
    expect(readRecordsPlace(file.repo).root).toBe("iadd");
    expect((await planRecords(file.repo, "pnpm test", VERSION)).blocked).toBe(OWN);
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
    write(gone, "iadd/README.md", `${MARKER}\n`);
    write(gone, "iadd/config.json", '{ "Broad gate": "make check" }\n');
    write(gone, WORKFLOW, "name: inspection\n");
    commitAll(gone, "chore: the place");
    rmSync(join(gone, "iadd/config.json"));
    const before = head(gone);
    plan = await planRecords(gone, "pnpm test", VERSION);
    // The commit holds it, so it is kept and not written again.
    expect(plan.files[1]).toEqual({ path: "iadd/config.json", text: null });
    expect(plan.blocked).toBe(differs("iadd/config.json"));
    await expect(setUpRecords(gone, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(differs("iadd/config.json"));
    expect([head(gone), git(gone, "show", "HEAD:iadd/config.json"), status(gone)]).toEqual([before, '{ "Broad gate": "make check" }\n', " D iadd/config.json\n"]);

    const removed = repository();
    write(removed, WORKFLOW, "name: theirs\n");
    commitAll(removed, "ci: theirs");
    git(removed, "rm", "--quiet", WORKFLOW);
    plan = await planRecords(removed, "pnpm test", VERSION);
    expect(plan.blocked).toBe(differs(WORKFLOW));
    await expect(setUpRecords(removed, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(differs(WORKFLOW));
    expect(status(removed)).toBe(`D  ${WORKFLOW}\n`);
  });

  it("takes the root's name for the project's own where the commit holds a file below it that the checkout does not show, and blocks a plan of a new root below which a file stands or is staged that the commit does not hold", async () => {
    const repo = repository();
    write(repo, "iadd/notes.txt", "the project's\n");
    commitAll(repo, "docs: notes");
    rmSync(join(repo, "iadd"), { recursive: true });
    expect((await planRecords(repo, "pnpm test", VERSION)).blocked).toBe(OWN);
    // A file of the project's stands below the name, untracked: the commit holds nothing there, and the setup does not write a root around it.
    const untracked = repository();
    write(untracked, "iadd/notes.txt", "the project's\n");
    expect((await planRecords(untracked, "pnpm test", VERSION)).blocked).toBe(differs("iadd/notes.txt"));
    // A file git ignores below the name is named too.
    const cached = repository();
    write(cached, ".gitignore", "iadd/cache/\n");
    commitAll(cached, "chore: ignore the cache");
    write(cached, "iadd/cache/built.bin", "x\n");
    expect((await planRecords(cached, "pnpm test", VERSION)).blocked).toBe(differs("iadd/cache/built.bin"));
    // Staged alone and gone from the checkout, it is named the same.
    git(untracked, "add", "iadd/notes.txt");
    rmSync(join(untracked, "iadd"), { recursive: true });
    expect((await planRecords(untracked, "pnpm test", VERSION)).blocked).toBe(differs("iadd/notes.txt"));
    // Committed, the name is the project's own.
    git(untracked, "commit", "--quiet", "-m", "docs: more notes");
    expect((await planRecords(untracked, "pnpm test", VERSION)).blocked).toBe(OWN);
  });

  it("judges the root and the check by what the commit holds, and blocks a plan where the checkout holds a file of the place with other text: a marker, a check step and a config.json written in the checkout alone", async () => {
    // The commit's `iadd/README.md` is the project's own, and the checkout's copy opens with the marker, uncommitted.
    const marked = repository();
    write(marked, "iadd/README.md", "# Our iadd package\n");
    commitAll(marked, "docs: the iadd package");
    write(marked, "iadd/README.md", `${MARKER}\n`);
    let before = [head(marked), tree(marked), status(marked)];
    let plan = await planRecords(marked, "pnpm test", VERSION);
    // The plan is the commit's: `iadd/` is the project's own there, so the plan has no folder for the records.
    expect(plan.files.map((file) => [file.path, file.text === null])).toEqual([[WORKFLOW, false]]);
    expect(plan.blocked).toBe(OWN);
    await expect(setUpRecords(marked, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(OWN);
    expect([head(marked), tree(marked), status(marked)]).toEqual(before);

    // The commit's `hygiene.yml` is the project's own lint, and the checkout's copy holds the step of AgenticSeal's check.
    const stepped = repository();
    write(stepped, "iadd/README.md", `${MARKER}\n`);
    write(stepped, "iadd/config.json", '{ "Broad gate": "make check" }\n');
    write(stepped, ".github/workflows/hygiene.yml", "name: hygiene\njobs:\n  lint:\n    steps:\n      - run: npm run lint\n");
    commitAll(stepped, "chore: a root and the project's lint");
    write(stepped, ".github/workflows/hygiene.yml", `name: hygiene\n${PLUGIN_CHECK}`);
    before = [head(stepped), tree(stepped), status(stepped)];
    plan = await planRecords(stepped, "pnpm test", VERSION);
    expect(plan.files.map((file) => [file.path, file.text === null])).toEqual([
      ["iadd/README.md", true],
      ["iadd/config.json", true],
      [WORKFLOW, false],
    ]);
    expect(plan.blocked).toBe(differs(".github/workflows/hygiene.yml"));
    await expect(setUpRecords(stepped, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(differs(".github/workflows/hygiene.yml"));
    expect([head(stepped), tree(stepped), status(stepped)]).toEqual(before);

    // Every part is committed, and the checkout's `config.json` holds another command than the commit's: nothing is left to write, and the plan is blocked all the same.
    const edited = repository();
    write(edited, "iadd/README.md", `${MARKER}\n`);
    write(edited, "iadd/config.json", '{ "Broad gate": "make check" }\n');
    write(edited, WORKFLOW, "name: inspection\n");
    commitAll(edited, "chore: the place");
    expect((await planRecords(edited, "pnpm test", VERSION)).blocked).toBeNull();
    write(edited, "iadd/config.json", '{ "Commit and pull request language": "English", "Record language": "English", "Broad gate": "make check" }\n');
    plan = await planRecords(edited, "pnpm test", VERSION);
    expect(plan.files.map((file) => file.text)).toEqual([null, null, null]);
    expect(plan.blocked).toBe(differs("iadd/config.json"));
    // The same text staged and the checkout put back: the index alone differs, and the plan names the file.
    git(edited, "add", "iadd/config.json");
    write(edited, "iadd/config.json", '{ "Broad gate": "make check" }\n');
    expect((await planRecords(edited, "pnpm test", VERSION)).blocked).toBe(differs("iadd/config.json"));

    // Git is told not to compare the file with the checkout, by either flag of its index entry, so its status reports no change: the checkout's text is another than the commit's all the same, and the plan names the file.
    for (const flag of ["skip-worktree", "assume-unchanged"]) {
      const flagged = repository();
      write(flagged, "iadd/README.md", `${MARKER}\n`);
      write(flagged, "iadd/config.json", '{ "Broad gate": "make check" }\n');
      write(flagged, WORKFLOW, "name: inspection\n");
      commitAll(flagged, "chore: the place");
      git(flagged, "update-index", `--${flag}`, "iadd/config.json");
      // The flag alone, over the commit's own text, blocks nothing.
      expect((await planRecords(flagged, "pnpm test", VERSION)).blocked).toBeNull();
      write(flagged, "iadd/config.json", '{ "Broad gate": "make all" }\n');
      expect(status(flagged)).toBe("");
      plan = await planRecords(flagged, "pnpm test", VERSION);
      expect(plan.files.map((file) => file.text)).toEqual([null, null, null]);
      expect(plan.blocked).toBe(differs("iadd/config.json"));
      // A link stands in the file's place, to a file outside the repository that holds the commit's text: a clone gets a file there, and the plan names the path.
      rmSync(join(flagged, "iadd/config.json"));
      write(flagged, "../elsewhere.json", '{ "Broad gate": "make check" }\n');
      symlinkSync(join(flagged, "../elsewhere.json"), join(flagged, "iadd/config.json"));
      expect(status(flagged)).toBe("");
      expect((await planRecords(flagged, "pnpm test", VERSION)).blocked).toBe(differs("iadd/config.json"));
    }
  });

  it("reads a file the plan neither keeps nor writes for what the daemon reads of it alone: an edit of the project's own hygiene.yml that makes it no check blocks nothing, and the project's own iadd/README.md, edited or with a marker staged alone, blocks the plan", async () => {
    const repo = repository();
    write(repo, ".github/workflows/hygiene.yml", "name: hygiene\njobs:\n  lint:\n    steps:\n      - run: npm run lint\n");
    commitAll(repo, "chore: the project's own lint");
    // It is edited in the checkout and staged, and the edit is no step of the check.
    write(repo, ".github/workflows/hygiene.yml", "name: hygiene\njobs:\n  lint:\n    steps:\n      - run: npm run lint -- --fix\n");
    git(repo, "add", ".github/workflows/hygiene.yml");
    const plan = await planRecords(repo, "pnpm test", VERSION);
    expect(plan.files.map((file) => [file.path, file.text === null])).toEqual([
      ["iadd/README.md", false],
      ["iadd/config.json", false],
      [WORKFLOW, false],
    ]);
    expect(plan.blocked).toBeNull();
    await setUpRecords(repo, "pnpm test", VERSION, plan.stamp);
    // The setup's commit holds its three files, and the person's edit stays staged.
    expect(git(repo, "show", "--name-only", "--format=", "HEAD").trim().split("\n")).toEqual([WORKFLOW, "iadd/README.md", "iadd/config.json"]);
    expect(status(repo)).toBe("M  .github/workflows/hygiene.yml\n");

    // The project's own README.md at the root's name: edited, and with the marker staged and the checkout put back.
    const edited = repository();
    write(edited, "iadd/README.md", "# Our iadd package\n");
    commitAll(edited, "docs: the iadd package");
    write(edited, "iadd/README.md", "# Our iadd package\n\nIt adds.\n");
    expect((await planRecords(edited, "pnpm test", VERSION)).blocked).toBe(OWN);
    const staged = repository();
    write(staged, "iadd/README.md", "# Our iadd package\n");
    commitAll(staged, "docs: the iadd package");
    write(staged, "iadd/README.md", `${MARKER}\n`);
    git(staged, "add", "iadd/README.md");
    write(staged, "iadd/README.md", "# Our iadd package\n");
    expect(readRecordsPlace(staged).root).toBeNull();
    expect((await planRecords(staged, "pnpm test", VERSION)).blocked).toBe(OWN);
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
    write(folder, "iadd/README.md", `${MARKER}\n`);
    write(folder, "iadd/config.json/notes.txt", "x\n");
    write(folder, WORKFLOW, "name: inspection\n");
    commitAll(folder, "chore: a folder named config.json");
    plan = await planRecords(folder, "pnpm test", VERSION);
    expect(plan.files.map((file) => file.text === null)).toEqual([true, false, true]);
    expect(plan.blocked).toBe(says("iadd/config.json"));
  });

  it("keeps a root the commit holds and the checkout does not show, and blocks the plan in place of a second root: one removed and not staged, and one a sparse checkout leaves out", async () => {
    /** A repository whose commit holds an AgenticSeal root at `iadd/` and AgenticSeal's workflow. */
    const rooted = (): string => {
      const repo = repository();
      write(repo, "iadd/README.md", `${MARKER}\n`);
      write(repo, "iadd/config.json", '{ "Broad gate": "make check" }\n');
      write(repo, ".github/workflows/hygiene.yml", `name: hygiene\n${PLUGIN_CHECK}`);
      commitAll(repo, "chore: the plugin's root");
      return repo;
    };
    const kept = [
      { path: "iadd/README.md", text: null },
      { path: "iadd/config.json", text: null },
      { path: ".github/workflows/hygiene.yml", text: null },
    ];
    const says = differs("iadd/README.md and iadd/config.json");

    const removed = rooted();
    rmSync(join(removed, "iadd"), { recursive: true });
    let before = [head(removed), tree(removed), status(removed)];
    let plan = await planRecords(removed, "pnpm test", VERSION);
    expect(plan.files).toEqual(kept);
    expect(plan.blocked).toBe(says);
    await expect(setUpRecords(removed, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(says);
    expect([head(removed), tree(removed), status(removed)]).toEqual(before);
    // Restored, the repository holds every part again.
    git(removed, "checkout", "--quiet", "--", "iadd");
    expect((await planRecords(removed, "pnpm test", VERSION)).blocked).toBeNull();

    // A sparse checkout of everything but `iadd/`: git reports no change, and the checkout shows no root.
    const sparse = rooted();
    git(sparse, "sparse-checkout", "set", "--no-cone", "/*", "!/iadd/");
    expect([existsSync(join(sparse, "iadd")), status(sparse)]).toEqual([false, ""]);
    before = [head(sparse), tree(sparse)];
    plan = await planRecords(sparse, "pnpm test", VERSION);
    expect(plan.files).toEqual(kept);
    expect(plan.blocked).toBe(says);
    await expect(setUpRecords(sparse, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(says);
    expect([head(sparse), tree(sparse), status(sparse)]).toEqual([...before, ""]);

    // A cone of `.github` alone, which leaves the root out the same way.
    const cone = rooted();
    git(cone, "sparse-checkout", "set", "--cone", ".github");
    expect(existsSync(join(cone, "iadd"))).toBe(false);
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
    write(repo, "Iadd/notes.txt", "the project's\n");
    commitAll(repo, "docs: notes in Iadd/");
    const before = [head(repo), tree(repo), status(repo)];
    let plan = await planRecords(repo, "pnpm test", VERSION);
    // The plan is the commit's, which holds nothing at `iadd`.
    expect(plan.files.map((file) => file.path)).toEqual(["iadd/README.md", "iadd/config.json", WORKFLOW]);
    expect(plan.blocked).toBe(folds ? says("iadd") : null);
    if (folds) {
      await expect(setUpRecords(repo, "pnpm test", VERSION, plan.stamp)).rejects.toThrow(says("iadd"));
      expect([head(repo), tree(repo), status(repo)]).toEqual(before);
    }

    // The folder above the workflow: the one that stands under other letters is named, and no folder below it.
    const workflows = repository();
    write(workflows, ".GitHub/workflows/ci.yml", "name: ci\n");
    commitAll(workflows, "ci: theirs, in .GitHub/");
    expect((await planRecords(workflows, "pnpm test", VERSION)).blocked).toBe(folds ? says(".github") : null);

    // A kept root that holds `Config.json`: the setup writes `config.json`, where the disk finds the other.
    const file = repository();
    write(file, "iadd/README.md", `${MARKER}\n`);
    write(file, "iadd/Config.json", "{}\n");
    write(file, WORKFLOW, "name: inspection\n");
    commitAll(file, "chore: a root with Config.json");
    plan = await planRecords(file, "pnpm test", VERSION);
    expect(plan.files[1]?.text).not.toBeNull();
    expect(plan.blocked).toBe(folds ? says("iadd/config.json") : null);
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
    expect(existsSync(join(repo, "iadd"))).toBe(false);
    expect(existsSync(join(repo, ".github", "workflows"))).toBe(false);
    expect(status(repo)).toBe("A  other.txt\n");
  });

  /**
   * A temporary repository with one commit on `main` and a program at
   * `.git/hooks/<name>` that notes its process id and then waits for a file
   * that never comes, and the ids noted so far. The case's cleanup ends by its id each one that still
   * runs.
   */
  const hanging = (name: string): { repo: string; started: () => number[] } => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    const noted = join(made.base, "hook-pids.txt");
    write(made.repo, `.git/hooks/${name}`, `#!/bin/sh\necho $$ >> '${noted}'\nwhile [ ! -e '${join(made.base, "never")}' ]; do sleep 0.2; done\n`, 0o755);
    const started = (): number[] => (existsSync(noted) ? readFileSync(noted, "utf8").split("\n").filter((line) => line !== "").map(Number) : []);
    cleanups.push(() => {
      for (const pid of started()) if (runs(pid)) process.kill(pid, "SIGKILL");
    });
    return { repo: made.repo, started };
  };

  it("ends a setup whose pre-commit hook never ends at the limit, and one whose clean filter holds git add: each throws the command and the limit, no file or folder of the setup stands, and nothing of it is staged", async () => {
    for (const [name, command] of [
      ["pre-commit", "git commit"],
      ["never-filter", "git add"],
    ] as const) {
      const { repo, started } = hanging(name);
      if (name === "never-filter") {
        git(repo, "config", "filter.never.clean", join(repo, ".git", "hooks", name));
        write(repo, ".git/info/attributes", "iadd/README.md filter=never\n");
      }
      const before = [head(repo), tree(repo)];
      const plan = await planRecords(repo, "pnpm test", VERSION);
      await expect(setUpRecords(repo, "pnpm test", VERSION, plan.stamp, 2000)).rejects.toThrow(`${command} did not end in 2 seconds and was ended`);
      expect(started()).toHaveLength(1);
      expect([head(repo), tree(repo)]).toEqual(before);
      expect(status(repo)).toBe("");
      expect(existsSync(join(repo, ".git", "index.lock"))).toBe(false);
    }
  });

  it("keeps a setup's commit that was made before it was ended: a post-commit hook that never ends leaves the commit of the plan's files on the branch, each file standing and nothing staged", async () => {
    const { repo, started } = hanging("post-commit");
    const before = head(repo);
    const plan = await planRecords(repo, "pnpm test", VERSION);
    await setUpRecords(repo, "pnpm test", VERSION, plan.stamp, 2000);
    expect(started()).toHaveLength(1);
    expect(git(repo, "rev-parse", "HEAD~1").trim()).toBe(before);
    expect(git(repo, "show", "--name-only", "--format=%s", "HEAD").trim().split("\n").filter((line) => line !== "")).toEqual([SUBJECT, WORKFLOW, "iadd/README.md", "iadd/config.json"]);
    expect(status(repo)).toBe("");
  });

  it("writes over nothing that appeared after the plan was made: a file that stands at a path of the setup by the time it is written refuses the setup, and stays as it is", async () => {
    const made = temporaryRepository();
    cleanups.push(made.remove);
    const plan = await planRecords(made.repo, "pnpm test", VERSION);
    // A `git` before the real one on the path: at the plan's last question, whether git ignores its paths, the person's own file appears, after the plan read that nothing stands there.
    const bin = join(made.base, "bin");
    const path = process.env.PATH ?? "";
    mkdirSync(bin);
    writeFileSync(join(bin, "git"), `#!/bin/sh\nif [ "$1" = check-ignore ]; then mkdir -p iadd && printf 'theirs\\n' > iadd/config.json; fi\nPATH='${path}' exec git "$@"\n`, { mode: 0o755 });
    process.env.PATH = `${bin}:${path}`;
    cleanups.push(() => {
      process.env.PATH = path;
    });
    await expect(setUpRecords(made.repo, "pnpm test", VERSION, plan.stamp)).rejects.toThrow("EEXIST");
    process.env.PATH = path;
    expect(readFileSync(join(made.repo, "iadd/config.json"), "utf8")).toBe("theirs\n");
    // The file the setup had written before the refusal is gone, the folder the person's file stands in stays, and nothing is staged.
    expect(tree(made.repo)).toEqual(["README.md", "iadd", "iadd/config.json"]);
    expect(status(made.repo)).toBe("?? iadd/config.json\n");
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
    expect(git(fresh, "show", "--name-only", "--format=%s", "HEAD").trim().split("\n").filter((line) => line !== "")).toEqual([SUBJECT, WORKFLOW, "iadd/README.md", "iadd/config.json"]);
    expect(status(fresh)).toBe("");
  });

  /** Commits in the repository a whole records place whose workflow is the one a setup of `version` writes. */
  const placed = (repo: string, version: string): void => {
    write(repo, "iadd/README.md", `${MARKER}\n`);
    write(repo, "iadd/config.json", '{ "Broad gate": "make check" }\n');
    write(repo, WORKFLOW, workflowText(version));
    commitAll(repo, `chore: the records place of ${version}`);
  };

  it("offers the move of the check where the commit holds every part of the place and its workflow pins an older version: the plan writes the workflow alone, whole, for the version given, carries the move under the move's subject, and writes nothing; the same version and a newer one move nothing", async () => {
    const repo = repository();
    placed(repo, "1.2.2");
    const before = [head(repo), tree(repo)];
    const plan = await planRecords(repo, "", VERSION);
    expect(plan.blocked).toBeNull();
    expect(plan.files).toEqual([
      { path: "iadd/README.md", text: null },
      { path: "iadd/config.json", text: null },
      { path: WORKFLOW, text: workflowText(VERSION) },
    ]);
    expect(plan.move).toEqual({ from: "1.2.2", to: VERSION });
    expect(plan.subject).toBe(moveSubject(VERSION));
    expect(plan.subject).toBe("chore: move the pull request check to Owlery 1.2.3");
    expect(plan.proposedBroadGate).toBeNull();
    expect([head(repo), tree(repo)]).toEqual(before);
    expect(status(repo)).toBe("");
    // The stamp covers the move: a plan for another version is another.
    expect((await planRecords(repo, "", "1.2.4")).stamp).not.toBe(plan.stamp);
    for (const version of ["1.2.2", "1.2.1"]) {
      const kept = await planRecords(repo, "", version);
      expect([kept.files.map((file) => file.text), kept.move, kept.subject, kept.blocked]).toEqual([[null, null, null], null, SUBJECT, null]);
    }
  });

  it("offers no move where the plan writes a file of the setup, and none where the commit's workflow pins no version the daemon reads: the workflow is kept as it is", async () => {
    const lacking = repository();
    write(lacking, "iadd/README.md", `${MARKER}\n`);
    write(lacking, WORKFLOW, workflowText("1.2.2"));
    commitAll(lacking, "chore: a root with no config.json");
    const setup = await planRecords(lacking, "make check", VERSION);
    expect([setup.files.map((file) => [file.path, file.text === null]), setup.move, setup.subject]).toEqual([
      [
        ["iadd/README.md", true],
        ["iadd/config.json", false],
        [WORKFLOW, true],
      ],
      null,
      SUBJECT,
    ]);
    const edited = repository();
    write(edited, "iadd/README.md", `${MARKER}\n`);
    write(edited, "iadd/config.json", '{ "Broad gate": "make check" }\n');
    write(edited, WORKFLOW, workflowText("1.2.2").replace("--branch v1.2.2 \\", "--branch main \\"));
    commitAll(edited, "chore: a workflow the person edited");
    const kept = await planRecords(edited, "", VERSION);
    expect([kept.files.map((file) => file.text), kept.move, kept.blocked]).toEqual([[null, null, null], null, null]);
  });

  it("blocks a move where the checkout does not hold the workflow as the commit does, edited and not staged, or staged, and names the workflow; a setup of it writes nothing", async () => {
    const repo = repository();
    placed(repo, "1.2.2");
    write(repo, WORKFLOW, `${workflowText("1.2.2")}# the person's line\n`);
    const edited = await planRecords(repo, "", VERSION);
    expect([edited.move, edited.blocked]).toEqual([{ from: "1.2.2", to: VERSION }, differs(WORKFLOW)]);
    await expect(setUpRecords(repo, "", VERSION, edited.stamp)).rejects.toThrow(differs(WORKFLOW));
    expect(readFileSync(join(repo, WORKFLOW), "utf8")).toBe(`${workflowText("1.2.2")}# the person's line\n`);
    git(repo, "add", WORKFLOW);
    expect((await planRecords(repo, "", VERSION)).blocked).toBe(differs(WORKFLOW));
    expect(status(repo)).toBe(`M  ${WORKFLOW}\n`);
    // An edit git's status is told not to look at is read from the file's text.
    git(repo, "reset", "--quiet", "--", WORKFLOW);
    git(repo, "update-index", "--skip-worktree", WORKFLOW);
    expect(status(repo)).toBe("");
    expect((await planRecords(repo, "", VERSION)).blocked).toBe(differs(WORKFLOW));
  });

  it("moves the check in one commit of the workflow alone under the move's subject, on the checked-out branch, pushes nothing and leaves another staged file staged; a plan read before a commit landed moves nothing", async () => {
    const made = temporaryClone();
    cleanups.push(made.remove);
    const { repo } = made;
    placed(repo, "1.2.2");
    const pushed = git(made.origin, "rev-parse", "main").trim();
    const stale = await planRecords(repo, "", VERSION);
    commitFile(repo, "landed.txt");
    await expect(setUpRecords(repo, "", VERSION, stale.stamp)).rejects.toThrow("The repository changed since the plan was read");
    expect(readFileSync(join(repo, WORKFLOW), "utf8")).toBe(workflowText("1.2.2"));
    write(repo, "other.txt", "staged by the person\n");
    git(repo, "add", "other.txt");
    const before = head(repo);
    const plan = await planRecords(repo, "", VERSION);
    await setUpRecords(repo, "", VERSION, plan.stamp);
    expect(git(repo, "rev-parse", "HEAD~1").trim()).toBe(before);
    expect(git(repo, "symbolic-ref", "--short", "HEAD").trim()).toBe("main");
    expect(git(repo, "show", "--name-only", "--format=%s|%an", "HEAD").trim().split("\n").filter((line) => line !== "")).toEqual([`${moveSubject(VERSION)}|Owlery Test`, WORKFLOW]);
    expect(git(repo, "show", `HEAD:${WORKFLOW}`)).toBe(workflowText(VERSION));
    expect(readFileSync(join(repo, WORKFLOW), "utf8")).toBe(workflowText(VERSION));
    expect(status(repo)).toBe("A  other.txt\n");
    expect(git(made.origin, "rev-parse", "main").trim()).toBe(pushed);
    expect(readRecordsPlace(repo, VERSION).olderCheck).toBeNull();
    // Moved, the plan moves nothing more.
    expect((await planRecords(repo, "", VERSION)).move).toBeNull();
  });

  it("leaves the workflow as the commit holds it where the commit of a move fails: the hook's output is the refusal, and git's status prints nothing", async () => {
    const repo = repository();
    placed(repo, "1.2.2");
    write(repo, ".git/hooks/pre-commit", "#!/bin/sh\necho 'the hook says no'\nexit 1\n", 0o755);
    const before = [head(repo), tree(repo)];
    const plan = await planRecords(repo, "", VERSION);
    expect(plan.move).toEqual({ from: "1.2.2", to: VERSION });
    await expect(setUpRecords(repo, "", VERSION, plan.stamp)).rejects.toThrow("the hook says no");
    expect([head(repo), tree(repo)]).toEqual(before);
    expect(readFileSync(join(repo, WORKFLOW), "utf8")).toBe(workflowText("1.2.2"));
    expect(status(repo)).toBe("");
  });

  it("refuses a move where the workflow changed while the plan was made again, after the plan compared it with the commit: the person's edit stands, and nothing is committed or staged", async () => {
    const repo = repository();
    placed(repo, "1.2.2");
    const plan = await planRecords(repo, "", VERSION);
    const before = head(repo);
    // A `git` first on the PATH that saves the person's edit the first time the plan asks git what it ignores, which the plan does after it compared the workflow with the commit.
    const shim = mkdtempSync(join(tmpdir(), "owlery-git-shim-"));
    cleanups.push(() => rmSync(shim, { recursive: true, force: true }));
    const real = execFileSync("/bin/sh", ["-c", "command -v git"], { encoding: "utf8" }).trim();
    const edited = `${workflowText("1.2.2")}# saved while the plan ran\n`;
    write(shim, "git", `#!/bin/sh\nif [ "$1" = "check-ignore" ] && [ ! -e '${join(shim, "saved")}' ]; then\n  : > '${join(shim, "saved")}'\n  printf '# saved while the plan ran\\n' >> '${join(repo, WORKFLOW)}'\nfi\nexec '${real}' "$@"\n`, 0o755);
    const path = process.env.PATH;
    process.env.PATH = `${shim}:${path ?? ""}`;
    try {
      await expect(setUpRecords(repo, "", VERSION, plan.stamp)).rejects.toThrow("The repository changed since the plan was read");
    } finally {
      process.env.PATH = path;
    }
    expect(existsSync(join(shim, "saved"))).toBe(true);
    expect(readFileSync(join(repo, WORKFLOW), "utf8")).toBe(edited);
    expect([head(repo), status(repo)]).toEqual([before, ` M ${WORKFLOW}\n`]);
  });

  it("refuses, without waiting on it, a named pipe that stands at the workflow's path when the plan is made again: the setup reads it as the plan reads a person's file, and the plan's refusal is the answer", { timeout: 2000 }, async () => {
    const repo = repository();
    placed(repo, "1.2.2");
    const plan = await planRecords(repo, "", VERSION);
    rmSync(join(repo, WORKFLOW));
    execFileSync("mkfifo", [join(repo, WORKFLOW)]);
    // A writer opens the pipe after the case's limit, so a read that waits on a writer ends then, and the case has failed at its limit, not hung.
    const writer = spawn("/usr/bin/perl", ["-e", "sleep 3; open(my $f, '>', $ARGV[0]); close $f", join(repo, WORKFLOW)], { stdio: "ignore" });
    cleanups.push(() => {
      writer.kill();
    });
    await expect(setUpRecords(repo, "", VERSION, plan.stamp)).rejects.toThrow(differs(WORKFLOW));
  });

  it("writes a workflow that fetches the check from Owlery's repository at the version's tag, falls back to the release's branch, runs a script that stands under pr-check/, and lets it post `inspection` with the run's token from a job of another name, `records`", () => {
    const text = workflowText(VERSION);
    expect(text).toContain("\nname: inspection\n");
    expect(text).toContain("\njobs:\n  records:\n");
    expect(text).not.toContain("\n  inspection:\n");
    expect(text).toContain("\n# The check posts its verdict as the check `inspection` on the pull request's\n");
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

  it("reads the version the clone step of Owlery's workflow names, in the one spelling workflowText writes, and none where a line of the step is missing, the two lines name different versions, or the text is no such workflow", () => {
    expect(pinnedVersion(workflowText("0.0.4"))).toBe("0.0.4");
    expect(pinnedVersion(workflowText("0.1.0-rc.1"))).toBe("0.1.0-rc.1");
    const apart = workflowText("0.0.4").replace("--branch release/v0.0.4 \\", "--branch release/v0.0.3 \\");
    expect(apart).toContain("--branch release/v0.0.3 \\");
    expect(pinnedVersion(apart)).toBeNull();
    const fallbackless = workflowText("0.0.4").replace(/ {10}\|\| git clone [^\n]*\n[^\n]*\n/u, "");
    expect(fallbackless).not.toContain("release/v0.0.4");
    expect(pinnedVersion(fallbackless)).toBeNull();
    const stepless = workflowText("0.0.4").replace(/ {10}git clone [^\n]*\n[^\n]*\n {10}\|\| git clone [^\n]*\n[^\n]*\n/u, "");
    expect(stepless).not.toContain("--branch");
    expect(pinnedVersion(stepless)).toBeNull();
    expect(pinnedVersion("name: inspection\n")).toBeNull();
    expect(pinnedVersion(null)).toBeNull();
  });

  it("tells an older version by its numbers, compared as numbers from the first, a version with a suffix older than the same numbers without one, and no version older or newer than text that does not parse as one", () => {
    expect(olderVersion("0.0.4", "0.1.0")).toBe(true);
    expect(olderVersion("0.1.0", "0.0.4")).toBe(false);
    expect(olderVersion("0.0.9", "0.0.10")).toBe(true);
    expect(olderVersion("0.0.10", "0.0.9")).toBe(false);
    expect(olderVersion("1.0.0", "0.9.9")).toBe(false);
    expect(olderVersion("0.1.0-rc.1", "0.1.0")).toBe(true);
    expect(olderVersion("0.1.0", "0.1.0-rc.1")).toBe(false);
    expect(olderVersion("0.1.0", "0.1.0")).toBe(false);
    expect(olderVersion("0.1.0-rc.1", "0.1.0-rc.2")).toBe(false);
    expect(olderVersion("0.1.0-rc.2", "0.1.0-rc.1")).toBe(false);
    expect(olderVersion("main", "0.1.0")).toBe(false);
    expect(olderVersion("0.1.0", "main")).toBe(false);
    expect(olderVersion("0.1", "0.1.0")).toBe(false);
    expect(olderVersion("0.0.4", "0.1")).toBe(false);
  });

  it("holds Owlery's own workflow to the one a setup writes for the app's version, so the pull request that moves the version rewrites it, and its pin to 0.1.0 while this repository's records stand in the AgenticSeal plugin's root", () => {
    const { version } = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf8")) as { version: string };
    const top = join(PR_CHECK, "..");
    const pluginRoot = join(top, "seal", "README.md");
    const onThePlugin = existsSync(pluginRoot) && readFileSync(pluginRoot, "utf8").startsWith(`${PLUGIN_ROOT_MARKER}\n`);
    if (onThePlugin) {
      // The plugin's root and its pinned workflow, which keeps the name the plugin's process reads.
      expect(pinnedVersion(readFileSync(join(top, ".github/workflows/owlery-seal.yml"), "utf8"))).toBe(PIN_HELD_FOR_THE_PLUGIN);
    } else {
      // Once the root has moved, Owlery's own root and the workflow a setup writes, for the app's version.
      expect(readFileSync(join(top, "iadd", "README.md"), "utf8").split("\n")[0]).toBe(MARKER);
      expect(readFileSync(join(top, WORKFLOW), "utf8")).toBe(workflowText(version));
    }
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
