import { existsSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { createWorktree, slugFor, worktreesRoot } from "../src/daemon/worktrees";
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
    expect(made).toEqual({ repo, branch: "owlery/fix-the-login-bug", worktree: join(root, "project", "fix-the-login-bug") });
    expect(git(repo, "branch", "--list", "owlery/*").trim()).toContain("owlery/fix-the-login-bug");
    expect(worktrees(repo)[made.worktree]).toBe("refs/heads/owlery/fix-the-login-bug");
    expect(git(repo, "rev-parse", "owlery/fix-the-login-bug")).toBe(git(repo, "rev-parse", "HEAD"));
    // The person's own checkout stays on its branch.
    expect(worktrees(repo)[repo]).toBe("refs/heads/main");
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
