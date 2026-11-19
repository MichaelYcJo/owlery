import { existsSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { aheadOf, branchChanges, branchCommits, branchHead, createWorktree, newCommits, slugFor, worktreesRoot } from "../src/daemon/worktrees";
import { git, temporaryRepository } from "./repositories";

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

function repository(name?: string) {
  const made = temporaryRepository(name);
  cleanups.push(made.remove);
  return made;
}

/** The branch each worktree of the repository is on, by the worktree's folder. */
function worktrees(repo: string): Record<string, string> {
  const found: Record<string, string> = {};
  let folder = "";
  for (const line of git(repo, "worktree", "list", "--porcelain").split("\n")) {
    if (line.startsWith("worktree ")) folder = line.slice("worktree ".length);
    if (line.startsWith("branch ")) found[folder] = line.slice("branch ".length);
  }
  return found;
}

describe("slugFor", () => {
  it("lower-cases the title and turns each run of other characters into one dash", () => {
    expect(slugFor("Fix the login bug")).toBe("fix-the-login-bug");
    expect(slugFor("Add OAuth2 -- (again)!")).toBe("add-oauth2-again");
  });

  it("trims the dashes at both ends", () => {
    expect(slugFor("  [urgent] crash on start?  ")).toBe("urgent-crash-on-start");
  });

  it("cuts the slug to 40 characters, and leaves no dash where it cut", () => {
    expect(slugFor("a".repeat(60))).toBe("a".repeat(40));
    expect(slugFor(`${"a".repeat(39)} bcd`)).toBe("a".repeat(39));
  });

  it("names a title with no letter or digit of its own work-item", () => {
    expect(slugFor("")).toBe("work-item");
    expect(slugFor("로그인 버그")).toBe("work-item");
  });
});

describe("worktreesRoot", () => {
  it("is OWLERY_WORKTREES when set, and ~/.owlery/worktrees otherwise", () => {
    expect(worktreesRoot({ OWLERY_WORKTREES: "/somewhere/else" })).toBe("/somewhere/else");
    expect(worktreesRoot({})).toBe(join(homedir(), ".owlery", "worktrees"));
    expect(worktreesRoot({ OWLERY_WORKTREES: "" })).toBe(join(homedir(), ".owlery", "worktrees"));
  });
});

describe("createWorktree", () => {
  it("cuts the branch owlery/<slug> at HEAD and checks it out in <root>/<repo name>/<slug>", async () => {
    const { repo, root } = repository();
    const made = await createWorktree({ folder: repo, title: "Fix the login bug", root });
    const head = git(repo, "rev-parse", "HEAD").trim();
    expect(made).toEqual({ repo, branch: "owlery/fix-the-login-bug", worktree: join(root, "project", "fix-the-login-bug"), baseCommit: head, baseBranch: "main" });
    expect(git(repo, "branch", "--list", "owlery/*").trim()).toContain("owlery/fix-the-login-bug");
    expect(worktrees(repo)[made.worktree]).toBe("refs/heads/owlery/fix-the-login-bug");
    expect(git(repo, "rev-parse", "owlery/fix-the-login-bug")).toBe(git(repo, "rev-parse", "HEAD"));
    // The person's own checkout stays on its branch.
    expect(worktrees(repo)[repo]).toBe("refs/heads/main");
  });

  it("gives no base branch where the repository's HEAD is on no branch", async () => {
    const { repo, root } = repository();
    git(repo, "checkout", "--quiet", "--detach");
    const made = await createWorktree({ folder: repo, title: "Cut from a commit", root });
    expect(made.baseBranch).toBeNull();
    expect(made.baseCommit).toBe(git(repo, "rev-parse", "HEAD").trim());
  });

  it("names as the base the branch HEAD is on, slashes and all, though a tag of the same name exists", async () => {
    const { repo, root } = repository();
    git(repo, "checkout", "--quiet", "-b", "feat/login");
    git(repo, "tag", "feat/login");
    expect((await createWorktree({ folder: repo, title: "Cut from a feature", root })).baseBranch).toBe("feat/login");
  });

  it("takes the repository's top-level folder when given a folder inside it", async () => {
    const { repo, root } = repository();
    mkdirSync(join(repo, "src"));
    const made = await createWorktree({ folder: join(repo, "src"), title: "From inside", root });
    expect(made.repo).toBe(repo);
    expect(made.worktree).toBe(join(root, "project", "from-inside"));
  });

  it("keeps two work items of one repository apart: each on its own branch, a file of one absent from the other", async () => {
    const { repo, root } = repository();
    const one = await createWorktree({ folder: repo, title: "One", root });
    const two = await createWorktree({ folder: repo, title: "Two", root });
    writeFileSync(join(one.worktree, "only-in-one.txt"), "one\n");
    expect(existsSync(join(two.worktree, "only-in-one.txt"))).toBe(false);
    expect(existsSync(join(repo, "only-in-one.txt"))).toBe(false);
    expect(existsSync(join(two.worktree, "README.md"))).toBe(true);
    expect(worktrees(repo)[one.worktree]).toBe("refs/heads/owlery/one");
    expect(worktrees(repo)[two.worktree]).toBe("refs/heads/owlery/two");
  });

  it("appends -2, then -3, to the branch and the folder of a title already taken", async () => {
    const { repo, root } = repository();
    await createWorktree({ folder: repo, title: "Fix the login bug", root });
    const second = await createWorktree({ folder: repo, title: "Fix the login bug", root });
    expect(second.branch).toBe("owlery/fix-the-login-bug-2");
    expect(second.worktree).toBe(join(root, "project", "fix-the-login-bug-2"));
    const third = await createWorktree({ folder: repo, title: "fix the LOGIN bug", root });
    expect(third.branch).toBe("owlery/fix-the-login-bug-3");
    expect(third.worktree).toBe(join(root, "project", "fix-the-login-bug-3"));
    expect(worktrees(repo)[third.worktree]).toBe("refs/heads/owlery/fix-the-login-bug-3");
  });

  it("skips a name whose branch exists though its folder does not", async () => {
    const { repo, root } = repository();
    git(repo, "branch", "owlery/taken");
    const made = await createWorktree({ folder: repo, title: "Taken", root });
    expect(made.branch).toBe("owlery/taken-2");
    expect(made.worktree).toBe(join(root, "project", "taken-2"));
  });

  it("skips a name whose folder exists though its branch does not", async () => {
    const { repo, root } = repository();
    mkdirSync(join(root, "project", "taken"), { recursive: true });
    const made = await createWorktree({ folder: repo, title: "Taken", root });
    expect(made.branch).toBe("owlery/taken-2");
    expect(made.worktree).toBe(join(root, "project", "taken-2"));
  });

  it("refuses a folder outside any git repository, and creates nothing", async () => {
    const base = realpathSync(mkdtempSync(join(tmpdir(), "owlery-not-a-repo-")));
    cleanups.push(() => rmSync(base, { recursive: true, force: true }));
    const folder = join(base, "plain");
    mkdirSync(folder);
    const root = join(base, "worktrees");
    await expect(createWorktree({ folder, title: "Anything", root })).rejects.toThrow(`${folder} is not inside a git repository`);
    expect(existsSync(root)).toBe(false);
    expect(readdirSync(folder)).toEqual([]);
  });

  it("refuses a folder that does not exist", async () => {
    const { base, root } = repository();
    const folder = join(base, "missing");
    await expect(createWorktree({ folder, title: "Anything", root })).rejects.toThrow(`${folder} is not inside a git repository`);
    expect(existsSync(root)).toBe(false);
  });
});

describe("newCommits", () => {
  /** Commits a new file in the folder, on whatever branch it has checked out. */
  function commit(folder: string, file: string): void {
    writeFileSync(join(folder, file), `${file}\n`);
    git(folder, "add", file);
    git(folder, "commit", "--quiet", "-m", `add ${file}`);
  }

  it("counts none on a branch just cut, then each commit made in its worktree", async () => {
    const { repo, root } = repository();
    const made = await createWorktree({ folder: repo, title: "Counted", root });
    expect(await newCommits(made.repo, made.branch, made.baseCommit)).toBe(0);
    commit(made.worktree, "one.txt");
    expect(await newCommits(made.repo, made.branch, made.baseCommit)).toBe(1);
    commit(made.worktree, "two.txt");
    expect(await newCommits(made.repo, made.branch, made.baseCommit)).toBe(2);
  });

  it("counts the work item's branch alone, not what the person's own checkout or another work item commits", async () => {
    const { repo, root } = repository();
    const made = await createWorktree({ folder: repo, title: "Mine", root });
    const other = await createWorktree({ folder: repo, title: "Other", root });
    commit(repo, "on-main.txt");
    commit(other.worktree, "on-other.txt");
    expect(await newCommits(made.repo, made.branch, made.baseCommit)).toBe(0);
    expect(await newCommits(other.repo, other.branch, other.baseCommit)).toBe(1);
  });

  it("gives no count where git cannot give one: the branch is gone, or the repository is", async () => {
    const { repo, root, base } = repository();
    const made = await createWorktree({ folder: repo, title: "Gone", root });
    expect(await newCommits(made.repo, "owlery/never-cut", made.baseCommit)).toBeNull();
    expect(await newCommits(join(base, "missing"), made.branch, made.baseCommit)).toBeNull();
  });
});

describe("what a branch holds since its base", () => {
  /** Commits whatever the folder holds, and gives the commit's short hash and its time. */
  function commitAll(folder: string, subject: string): { hash: string; at: number } {
    git(folder, "add", "--all");
    git(folder, "commit", "--quiet", "--allow-empty", "-m", subject);
    return { hash: git(folder, "rev-parse", "--short", "HEAD").trim(), at: Number(git(folder, "log", "-1", "--format=%ct").trim()) * 1000 };
  }

  async function cut(title: string) {
    const { repo, root, base } = repository();
    const made = await createWorktree({ folder: repo, title, root });
    return { ...made, base, head: async () => (await branchHead(made.repo, made.branch))! };
  }

  it("reads a branch's head, and none where the branch is gone", async () => {
    const made = await cut("Headed");
    expect(await branchHead(made.repo, made.branch)).toBe(made.baseCommit);
    writeFileSync(join(made.worktree, "one.txt"), "one\n");
    commitAll(made.worktree, "add one");
    expect(await branchHead(made.repo, made.branch)).toBe(git(made.worktree, "rev-parse", "HEAD").trim());
    expect(await branchHead(made.repo, "owlery/never-cut")).toBeNull();
    expect(await branchHead(join(made.base, "missing"), made.branch)).toBeNull();
  });

  it("lists no commit on a branch just cut, then each commit newest first, with its short hash, its subject, its time and its lines", async () => {
    const made = await cut("Listed");
    expect(await branchCommits(made.repo, made.baseCommit, await made.head())).toEqual([]);
    writeFileSync(join(made.worktree, "one.txt"), "a\nb\nc\n");
    const one = commitAll(made.worktree, "add one");
    writeFileSync(join(made.worktree, "one.txt"), "a\nB\n");
    writeFileSync(join(made.worktree, "two.txt"), "two\n");
    // A subject that holds the character the daemon parts git's fields with.
    const two = commitAll(made.worktree, "change one\x1fand add two");
    // A moved file is one removed and one added, as the changed files count it.
    git(made.worktree, "mv", "one.txt", "moved.txt");
    const three = commitAll(made.worktree, "move one");
    expect(await branchCommits(made.repo, made.baseCommit, await made.head())).toEqual([
      { ...three, subject: "move one", added: 2, removed: 2 },
      { ...two, subject: "change one\x1fand add two", added: 2, removed: 2 },
      { ...one, subject: "add one", added: 3, removed: 0 },
    ]);
  });

  it("gives a commit that changes no file no lines, and one whose files git counts no lines of, such as a binary file, no count", async () => {
    const made = await cut("Counted lines");
    const empty = commitAll(made.worktree, "nothing");
    writeFileSync(join(made.worktree, "owl.bin"), Buffer.from([0, 1, 2, 0, 255]));
    const binary = commitAll(made.worktree, "add a binary file");
    writeFileSync(join(made.worktree, "owl.bin"), Buffer.from([0, 9, 9, 0]));
    writeFileSync(join(made.worktree, "note.txt"), "one\ntwo\n");
    const mixed = commitAll(made.worktree, "change it, beside a note");
    expect(await branchCommits(made.repo, made.baseCommit, await made.head())).toEqual([
      { ...mixed, subject: "change it, beside a note", added: 2, removed: 0 },
      { ...binary, subject: "add a binary file", added: null, removed: null },
      { ...empty, subject: "nothing", added: 0, removed: 0 },
    ]);
  });

  it("lists the files a branch changed since its base, each with its lines, and counts a moved file as one removed and one added", async () => {
    const made = await cut("Changed");
    expect(await branchChanges(made.repo, made.baseCommit, await made.head())).toEqual({ files: 0, added: 0, removed: 0, list: [] });
    writeFileSync(join(made.worktree, "README.md"), "a repository\nof owls\n");
    mkdirSync(join(made.worktree, "src"));
    writeFileSync(join(made.worktree, "src", "새 파일 one.txt"), "하나\n둘\n");
    writeFileSync(join(made.worktree, "owl.bin"), Buffer.from([0, 1, 2, 0, 255]));
    commitAll(made.worktree, "first");
    // A second commit, so the changes are the branch's and not the last commit's.
    git(made.worktree, "mv", "README.md", "READ.md");
    commitAll(made.worktree, "second");
    expect(await branchChanges(made.repo, made.baseCommit, await made.head())).toEqual({
      files: 4,
      added: 4,
      removed: 1,
      list: [
        { path: "READ.md", added: 2, removed: 0 },
        { path: "README.md", added: 0, removed: 1 },
        { path: "owl.bin", added: null, removed: null },
        { path: "src/새 파일 one.txt", added: 2, removed: 0 },
      ],
    });
  });

  it("gives a merge commit the lines it brought onto the branch, which are its difference from its first parent", async () => {
    const made = await cut("Merged into");
    writeFileSync(join(made.worktree, "own.txt"), "own\n");
    const own = commitAll(made.worktree, "add own");
    writeFileSync(join(made.repo, "README.md"), "a repository\nof owls\nand more\n");
    const onMain = commitAll(made.repo, "say more");
    git(made.worktree, "merge", "--quiet", "--no-ff", "-m", "merge main", "main");
    const merge = { hash: git(made.worktree, "rev-parse", "--short", "HEAD").trim(), at: Number(git(made.worktree, "log", "-1", "--format=%ct").trim()) * 1000 };
    const commits = (await branchCommits(made.repo, made.baseCommit, await made.head()))!;
    expect(commits[0]).toEqual({ ...merge, subject: "merge main", added: 2, removed: 0 });
    // The base's own commit and the branch's stand under it, in whichever order their times give.
    expect(commits.slice(1)).toEqual(expect.arrayContaining([{ ...onMain, subject: "say more", added: 2, removed: 0 }, { ...own, subject: "add own", added: 1, removed: 0 }]));
    expect(commits).toHaveLength(3);
  });

  it("reads the commits and the changes of a branch whose list of files is longer than a megabyte of git's output", async () => {
    const made = await cut("Wide");
    // Three names of 250 letters: 1500 files under them are more than a megabyte of paths, twice over in a diff's two columns of counts.
    const deep = join("a".repeat(250), "b".repeat(250), "c".repeat(250));
    mkdirSync(join(made.worktree, deep), { recursive: true });
    for (let n = 0; n < 1500; n++) writeFileSync(join(made.worktree, deep, `file-${n}.txt`), "one\n");
    const wide = commitAll(made.worktree, "add many files");
    const head = await made.head();
    expect(await branchCommits(made.repo, made.baseCommit, head)).toEqual([{ ...wide, subject: "add many files", added: 1500, removed: 0 }]);
    const changes = (await branchChanges(made.repo, made.baseCommit, head))!;
    expect({ files: changes.files, added: changes.added, removed: changes.removed, listed: changes.list.length }).toEqual({ files: 1500, added: 1500, removed: 0, listed: 50 });
  });

  it("counts how many commits a head holds that its base branch does not: its own and a merge of the base, and not the commits the base gained", async () => {
    const made = await cut("Ahead");
    expect(await aheadOf(made.repo, "main", await made.head())).toBe(0);
    writeFileSync(join(made.worktree, "own.txt"), "own\n");
    commitAll(made.worktree, "add own");
    expect(await aheadOf(made.repo, "main", await made.head())).toBe(1);
    writeFileSync(join(made.repo, "README.md"), "a repository\nof owls\n");
    commitAll(made.repo, "say more");
    commitAll(made.repo, "and more");
    expect(await aheadOf(made.repo, "main", await made.head())).toBe(1);
    git(made.worktree, "merge", "--quiet", "--no-ff", "-m", "merge main", "main");
    // Four commits since the cut, two of them the base's own.
    expect(await newCommits(made.repo, made.branch, made.baseCommit)).toBe(4);
    expect(await aheadOf(made.repo, "main", await made.head())).toBe(2);
    // The base takes the branch, and the branch is ahead by none.
    git(made.repo, "merge", "--quiet", "--ff-only", made.branch);
    expect(await aheadOf(made.repo, "main", await made.head())).toBe(0);
    expect(await newCommits(made.repo, made.branch, made.baseCommit)).toBe(4);
  });

  it("gives no count of commits ahead where the base branch is gone, or the repository is", async () => {
    const made = await cut("Ahead of none");
    const head = await made.head();
    expect(await aheadOf(made.repo, "never-cut", head)).toBeNull();
    expect(await aheadOf(join(made.base, "missing"), "main", head)).toBeNull();
  });

  it("lists 50 files of a branch that changed more, beside the count and the lines of all of them", async () => {
    const made = await cut("Many files");
    for (let n = 10; n < 65; n++) writeFileSync(join(made.worktree, `file-${n}.txt`), "one\ntwo\n");
    commitAll(made.worktree, "many");
    const changes = (await branchChanges(made.repo, made.baseCommit, await made.head()))!;
    expect({ ...changes, list: changes.list.map((file) => file.path) }).toEqual({ files: 55, added: 110, removed: 0, list: Array.from({ length: 50 }, (_, i) => `file-${i + 10}.txt`) });
  });

  it("gives neither commits nor changes where git cannot: the repository is gone, or the base commit is not one", async () => {
    const made = await cut("Gone");
    const head = await made.head();
    expect(await branchCommits(join(made.base, "missing"), made.baseCommit, head)).toBeNull();
    expect(await branchChanges(join(made.base, "missing"), made.baseCommit, head)).toBeNull();
    expect(await branchCommits(made.repo, "0".repeat(40), head)).toBeNull();
    expect(await branchChanges(made.repo, "0".repeat(40), head)).toBeNull();
  });
});
