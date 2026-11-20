import { existsSync, mkdirSync, mkdtempSync, readdirSync, realpathSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { aheadOf, branchChanges, branchCommits, branchHead, createWorktree, newCommits, planBranchRename, planWorktree, renameBranch, repositoryOf, repositoryOfSync, slugFor, worktreesRoot } from "../src/daemon/worktrees";
import { generateName } from "../src/shared/names";
import { commitFile, git, temporaryClone, temporaryRepository } from "./repositories";

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

function repository(name?: string) {
  const made = temporaryRepository(name);
  cleanups.push(made.remove);
  return made;
}

function clone(branch?: string) {
  const made = temporaryClone(branch);
  cleanups.push(made.remove);
  return made;
}

/** The commit a ref of the repository points at. */
function commitOf(repo: string, ref: string): string {
  return git(repo, "rev-parse", "--verify", ref).trim();
}

/** The upstream of a local branch, or an empty string where it has none. */
function upstreamOf(repo: string, branch: string): string {
  return git(repo, "for-each-ref", "--format=%(upstream)", `refs/heads/${branch}`).trim();
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

  it("leaves nothing of a title with no letter or digit of its own", () => {
    expect(slugFor("")).toBe("");
    expect(slugFor("로그인 버그")).toBe("");
    expect(slugFor(" -- ")).toBe("");
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
  it("cuts the branch owlery/<slug> at the default base and checks it out in <root>/<repo name>/<slug>", async () => {
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

  it("gives no base branch, and cuts at the checkout's commit, where the checkout is on no branch and the repository has no local branch and no remote", async () => {
    const { repo, root } = repository();
    git(repo, "checkout", "--quiet", "--detach");
    git(repo, "branch", "--quiet", "-D", "main");
    const made = await createWorktree({ folder: repo, title: "Cut from a commit", root });
    expect(made.baseBranch).toBeNull();
    expect(made.baseCommit).toBe(commitOf(repo, "HEAD"));
    expect(worktrees(repo)[made.worktree]).toBe("refs/heads/owlery/cut-from-a-commit");
  });

  it("cuts at the branch a base names, slashes and all, though a tag of the same name stands at another commit", async () => {
    const { repo, root } = repository();
    git(repo, "tag", "feat/login");
    git(repo, "checkout", "--quiet", "-b", "feat/login");
    const feature = commitFile(repo, "login.txt");
    git(repo, "checkout", "--quiet", "main");
    const made = await createWorktree({ folder: repo, title: "Cut from a feature", root, base: "feat/login" });
    expect(made.baseBranch).toBe("feat/login");
    expect(made.baseCommit).toBe(feature);
    expect(made.baseCommit).not.toBe(commitOf(repo, "refs/tags/feat/login"));
  });

  it("names the branch and the folder by the title's slug, by the slug of the name sent where the title leaves none, and by a generated name where neither leaves one", async () => {
    const { repo, root } = repository();
    const korean = await createWorktree({ folder: repo, title: "로그인 버그", name: "amber-heron", root });
    expect([korean.branch, korean.worktree]).toEqual(["owlery/amber-heron", join(root, "project", "amber-heron")]);
    const titled = await createWorktree({ folder: repo, title: "Fix the login bug", name: "amber-heron", root });
    expect([titled.branch, titled.worktree]).toEqual(["owlery/fix-the-login-bug", join(root, "project", "fix-the-login-bug")]);
    // A name is made a slug as a title is.
    const sent = await createWorktree({ folder: repo, title: "", name: " Quiet Otter! ", root });
    expect([sent.branch, sent.worktree]).toEqual(["owlery/quiet-otter", join(root, "project", "quiet-otter")]);
    // A name already taken gets the number a title already taken gets.
    const again = await createWorktree({ folder: repo, title: "  ", name: "amber-heron", root });
    expect([again.branch, again.worktree]).toEqual(["owlery/amber-heron-2", join(root, "project", "amber-heron-2")]);
    const generated = generateName(() => 0.5);
    const unnamed = await createWorktree({ folder: repo, title: "", root, random: () => 0.5 });
    expect([unnamed.branch, unnamed.worktree]).toEqual([`owlery/${generated}`, join(root, "project", generated)]);
    const neither = await createWorktree({ folder: repo, title: "버그", name: "이름", root, random: () => 0.5 });
    expect([neither.branch, neither.worktree]).toEqual([`owlery/${generated}-2`, join(root, "project", `${generated}-2`)]);
  });

  it("cuts a work item no base was sent for at the branch the remote's HEAD names, as the clone holds it, and at neither local branch, and gives the new branch no upstream", async () => {
    const { repo, root } = clone("trunk");
    // A person's setting that would give every new branch its start as its upstream.
    git(repo, "config", "branch.autoSetupMerge", "always");
    const remote = commitOf(repo, "refs/remotes/origin/trunk");
    // The local trunk is one commit ahead of the remote's, and the checkout stands on a branch one commit further.
    const local = commitFile(repo, "local.txt");
    git(repo, "checkout", "--quiet", "-b", "feature");
    const feature = commitFile(repo, "feature.txt");
    const made = await createWorktree({ folder: repo, title: "From the remote", root });
    expect(made.baseBranch).toBe("origin/trunk");
    expect(made.baseCommit).toBe(remote);
    expect(new Set([remote, local, feature]).size).toBe(3);
    expect(commitOf(repo, "refs/heads/owlery/from-the-remote")).toBe(remote);
    expect(upstreamOf(repo, "owlery/from-the-remote")).toBe("");
    // The local branch as a base gives none either.
    const fromLocal = await createWorktree({ folder: repo, title: "From the local", root, base: "trunk" });
    expect([fromLocal.baseBranch, fromLocal.baseCommit]).toEqual(["trunk", local]);
    expect(upstreamOf(repo, "owlery/from-the-local")).toBe("");
  });

  describe("the default base", () => {
    /** A repository whose checkout stands on `feature`, beside the local `main`, and the commit both stand at. */
    function onFeature() {
      const made = repository();
      git(made.repo, "checkout", "--quiet", "-b", "feature");
      return { ...made, commit: commitOf(made.repo, "HEAD") };
    }

    /** Adds remotes to the repository, and plants the branches named as a fetch from them would leave them. Nothing is fetched. */
    function remotes(made: { repo: string; base: string; commit: string }, names: string[], branches: string[]): void {
      for (const name of names) git(made.repo, "remote", "add", name, join(made.base, `${name}.git`));
      for (const branch of branches) git(made.repo, "update-ref", `refs/remotes/${branch}`, made.commit);
    }

    /** The base a creation without one gets in the repository now. */
    async function defaultBase(made: { repo: string; root: string }): Promise<string | null> {
      const { baseBranch } = await createWorktree({ folder: made.repo, title: "Default", root: made.root });
      // A plan names the same default.
      expect((await planWorktree({ folder: made.repo, title: "Default", root: made.root })).defaultBase).toBe(baseBranch);
      return baseBranch;
    }

    it("is the branch a remote's HEAD names: origin's first, then the other remotes' in the order of their names, and none whose branch the clone does not hold", async () => {
      const made = onFeature();
      remotes(made, ["beta", "origin", "alpha"], ["origin/main", "origin/side", "alpha/dev", "beta/dev"]);
      git(made.repo, "symbolic-ref", "refs/remotes/beta/HEAD", "refs/remotes/beta/dev");
      git(made.repo, "symbolic-ref", "refs/remotes/alpha/HEAD", "refs/remotes/alpha/dev");
      // Origin has no HEAD, and its `main` stands behind another remote's HEAD.
      expect(await defaultBase(made)).toBe("alpha/dev");
      git(made.repo, "symbolic-ref", "refs/remotes/origin/HEAD", "refs/remotes/origin/side");
      expect(await defaultBase(made)).toBe("origin/side");
      git(made.repo, "symbolic-ref", "refs/remotes/origin/HEAD", "refs/remotes/origin/gone");
      expect(await defaultBase(made)).toBe("alpha/dev");
      git(made.repo, "symbolic-ref", "--delete", "refs/remotes/alpha/HEAD");
      expect(await defaultBase(made)).toBe("beta/dev");
    });

    it("is, where no remote's HEAD names one, a remote's branch of the name init.defaultBranch gives, then `main`, then `master`: every name in origin before any in another remote, and all before a local branch", async () => {
      const made = onFeature();
      git(made.repo, "config", "init.defaultBranch", "trunk");
      git(made.repo, "branch", "--quiet", "trunk");
      remotes(made, ["origin", "alpha"], ["origin/master", "origin/main", "origin/trunk", "origin/side", "alpha/trunk"]);
      expect(await defaultBase(made)).toBe("origin/trunk");
      git(made.repo, "update-ref", "-d", "refs/remotes/origin/trunk");
      expect(await defaultBase(made)).toBe("origin/main");
      git(made.repo, "update-ref", "-d", "refs/remotes/origin/main");
      expect(await defaultBase(made)).toBe("origin/master");
      git(made.repo, "update-ref", "-d", "refs/remotes/origin/master");
      expect(await defaultBase(made)).toBe("alpha/trunk");
      // A remote's branch of no such name is no default, and the local branch of the first name is.
      git(made.repo, "update-ref", "-d", "refs/remotes/alpha/trunk");
      expect(await defaultBase(made)).toBe("trunk");
    });

    it("is, where no remote holds one, the local branch of the name init.defaultBranch gives, then `main`, then `master`, then the branch the checkout stands on", async () => {
      const made = onFeature();
      git(made.repo, "config", "init.defaultBranch", "trunk");
      git(made.repo, "branch", "--quiet", "trunk");
      git(made.repo, "branch", "--quiet", "master");
      git(made.repo, "branch", "--quiet", "aaa");
      expect(await defaultBase(made)).toBe("trunk");
      git(made.repo, "branch", "--quiet", "-D", "trunk");
      expect(await defaultBase(made)).toBe("main");
      git(made.repo, "branch", "--quiet", "-D", "main");
      expect(await defaultBase(made)).toBe("master");
      git(made.repo, "branch", "--quiet", "-D", "master");
      // Neither the first branch by name nor the newest: the one the checkout stands on.
      expect(await defaultBase(made)).toBe("feature");
    });

    it("is no remote's branch whose name a local branch bears, which a base's name reads as the local branch", async () => {
      const made = onFeature();
      remotes(made, ["origin"], ["origin/main", "origin/side"]);
      git(made.repo, "symbolic-ref", "refs/remotes/origin/HEAD", "refs/remotes/origin/side");
      git(made.repo, "branch", "--quiet", "origin/side");
      expect(await defaultBase(made)).toBe("origin/main");
    });

    it("is no local branch that names another ref, which a base's name never reads", async () => {
      const made = repository();
      // An old repository on `master` that keeps `main` as an alias of it.
      git(made.repo, "branch", "--quiet", "-m", "main", "master");
      git(made.repo, "symbolic-ref", "refs/heads/main", "refs/heads/master");
      const plan = await planWorktree({ folder: made.repo, title: "Alias", root: made.root });
      expect([plan.localBases, plan.defaultBase]).toEqual([["master"], "master"]);
      expect((await createWorktree({ folder: made.repo, title: "Alias", root: made.root })).baseBranch).toBe("master");
    });
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

describe("the repository of a folder", () => {
  /** A linked worktree of the repository, on a branch of its own, with a folder inside it. */
  function linked(made: { repo: string; base: string }): { worktree: string; inside: string } {
    const worktree = join(made.base, "linked");
    git(made.repo, "worktree", "add", "--quiet", "-b", "side", worktree);
    const inside = join(worktree, "src", "deep");
    mkdirSync(inside, { recursive: true });
    return { worktree, inside };
  }

  /** A bare repository with one commit, and a linked worktree of it. */
  function bare(made: { repo: string; base: string }): { worktree: string } {
    const folder = join(made.base, "bare.git");
    git(made.base, "clone", "--quiet", "--bare", made.repo, folder);
    const worktree = join(made.base, "of-bare");
    git(folder, "worktree", "add", "--quiet", "-b", "side", worktree);
    return { worktree };
  }

  it("is the top-level folder of the main checkout, for a folder inside the main checkout and for one inside a linked worktree alike", async () => {
    const made = repository();
    const { worktree, inside } = linked(made);
    mkdirSync(join(made.repo, "src"));
    for (const folder of [made.repo, join(made.repo, "src"), worktree, inside]) {
      expect(await repositoryOf(folder)).toBe(made.repo);
      expect(repositoryOfSync(folder)).toBe(made.repo);
    }
  });

  it("refuses a folder outside any repository with the sentence a creation there gets, and a folder whose repository has a bare main checkout with a sentence of its own", async () => {
    const made = repository();
    const plain = join(made.base, "plain");
    mkdirSync(plain);
    const { worktree } = bare(made);
    await expect(repositoryOf(plain)).rejects.toThrow(`${plain} is not inside a git repository`);
    await expect(repositoryOf(join(made.base, "missing"))).rejects.toThrow(`${join(made.base, "missing")} is not inside a git repository`);
    await expect(repositoryOf(worktree)).rejects.toThrow(`${worktree} belongs to a bare repository, which has no checkout to keep`);
    // The read at the daemon's start gives no folder for any of the three, and throws for none.
    expect([repositoryOfSync(plain), repositoryOfSync(join(made.base, "missing")), repositoryOfSync(worktree)]).toEqual([null, null, null]);
  });

  it("puts a work item created in a linked worktree's folder under the main checkout, in the worktrees' folder of its name, and plans it there", async () => {
    const made = repository();
    const { inside } = linked(made);
    const plan = await planWorktree({ folder: inside, title: "From a worktree", root: made.root });
    expect([plan.branch, plan.worktree]).toEqual(["owlery/from-a-worktree", join(made.root, "project", "from-a-worktree")]);
    const place = await createWorktree({ folder: inside, title: "From a worktree", root: made.root });
    expect([place.repo, place.worktree]).toEqual([made.repo, join(made.root, "project", "from-a-worktree")]);
  });
});

describe("the base a person chose for a repository", () => {
  it("is the default base of a plan and the base of a creation without one, where the repository still lists it, and is passed over where it does not", async () => {
    const made = repository();
    git(made.repo, "branch", "--quiet", "develop");
    const asked: string[] = [];
    const chosenBase = (repo: string): string | null => {
      asked.push(repo);
      return "develop";
    };
    mkdirSync(join(made.repo, "src"));
    const plan = await planWorktree({ folder: join(made.repo, "src"), title: "Planned", root: made.root, chosenBase });
    expect([plan.defaultBase, plan.localBases]).toEqual(["develop", ["main", "develop"]]);
    const place = await createWorktree({ folder: made.repo, title: "On develop", root: made.root, chosenBase });
    expect(place.baseBranch).toBe("develop");
    // The repository is named by its top-level folder, whatever folder inside it was sent.
    expect(asked).toEqual([made.repo, made.repo]);
    // A base that is sent stands before the one chosen for the repository.
    expect((await createWorktree({ folder: made.repo, title: "On main", root: made.root, base: "main", chosenBase })).baseBranch).toBe("main");
    git(made.repo, "branch", "--quiet", "-D", "develop");
    expect((await planWorktree({ folder: made.repo, title: "Planned", root: made.root, chosenBase })).defaultBase).toBe("main");
    expect((await createWorktree({ folder: made.repo, title: "Develop is gone", root: made.root, chosenBase })).baseBranch).toBe("main");
    // No base is chosen: the repository's own default.
    expect((await planWorktree({ folder: made.repo, title: "Planned", root: made.root, chosenBase: () => null })).defaultBase).toBe("main");
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

  it("counts against a remote's branch as the clone holds it, so a fetch moves the count, gives none once a fetch pruned the branch, and reads a base's name as the local branch where one bears it", async () => {
    const { repo, origin, root } = clone();
    const made = await createWorktree({ folder: repo, title: "Ahead of the remote", root });
    expect(made.baseBranch).toBe("origin/main");
    commitFile(made.worktree, "own.txt");
    const head = (await branchHead(made.repo, made.branch))!;
    expect(await aheadOf(repo, "origin/main", head)).toBe(1);
    // The remote's main takes the commit, and the count moves only once the clone fetches.
    git(origin, "pull", "--quiet", "--ff-only", repo, made.branch);
    expect(await aheadOf(repo, "origin/main", head)).toBe(1);
    git(repo, "fetch", "--quiet", "origin");
    expect(await aheadOf(repo, "origin/main", head)).toBe(0);
    // The local main never moved, and a base named `main` is still read as it.
    expect(await aheadOf(repo, "main", head)).toBe(1);
    git(origin, "checkout", "--quiet", "-b", "renamed");
    git(origin, "branch", "--quiet", "-D", "main");
    git(repo, "fetch", "--quiet", "--prune", "origin");
    expect(await aheadOf(repo, "origin/main", head)).toBeNull();
    // A remote's HEAD entry is no base.
    git(repo, "remote", "set-head", "origin", "renamed");
    expect(commitOf(repo, "refs/remotes/origin/HEAD")).toBe(head);
    expect(await aheadOf(repo, "origin/HEAD", `${head}~1`)).toBeNull();
    // A local branch of a remote's branch's name is the one a base's name reads.
    git(repo, "branch", "--quiet", "origin/renamed", made.baseCommit);
    expect(await aheadOf(repo, "origin/renamed", head)).toBe(1);
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

describe("renaming a work item's branch", () => {
  it("plans owlery/<slug of the name> for a branch with no upstream that no remote holds, with -2 where another branch bears the name, and renames nothing", async () => {
    const { repo, root } = clone();
    const made = await createWorktree({ folder: repo, title: "First name", root });
    expect(await planBranchRename(repo, made.branch, "  Second name!  ")).toEqual({ branch: "owlery/second-name", blocked: null });
    git(repo, "branch", "--quiet", "owlery/second-name");
    expect(await planBranchRename(repo, made.branch, "Second name")).toEqual({ branch: "owlery/second-name-2", blocked: null });
    git(repo, "branch", "--quiet", "owlery/second-name-2");
    expect(await planBranchRename(repo, made.branch, "Second name")).toEqual({ branch: "owlery/second-name-3", blocked: null });
    expect(worktrees(repo)[made.worktree]).toBe("refs/heads/owlery/first-name");
  });

  it("says that a name which leaves no slug names no branch, and that a name whose branch the work item has changes none, the numbered one among them", async () => {
    const { repo, root } = repository();
    await createWorktree({ folder: repo, title: "Same name", root });
    const second = await createWorktree({ folder: repo, title: "Same name", root });
    expect(second.branch).toBe("owlery/same-name-2");
    expect(await planBranchRename(repo, second.branch, " ?! ")).toEqual({ branch: null, blocked: "The name leaves no letter or digit to name a branch by." });
    // `owlery/same-name` is another work item's, so the name gives the branch the work item already has.
    expect(await planBranchRename(repo, second.branch, "Same name")).toEqual({ branch: "owlery/same-name-2", blocked: "The branch is already owlery/same-name-2." });
  });

  it("says that a branch with an upstream keeps its name, and so does one a remote holds under its name with no upstream", async () => {
    const { repo, root } = clone();
    const tracked = await createWorktree({ folder: repo, title: "Tracked", root });
    git(repo, "push", "--quiet", "-u", "origin", tracked.branch);
    expect(upstreamOf(repo, tracked.branch)).toBe("refs/remotes/origin/owlery/tracked");
    expect(await planBranchRename(repo, tracked.branch, "Other")).toEqual({ branch: "owlery/other", blocked: "The branch owlery/tracked has an upstream, origin/owlery/tracked, so it keeps its name." });
    const pushed = await createWorktree({ folder: repo, title: "Pushed", root });
    git(repo, "push", "--quiet", "origin", pushed.branch);
    expect(upstreamOf(repo, pushed.branch)).toBe("");
    expect(await planBranchRename(repo, pushed.branch, "Other")).toEqual({ branch: "owlery/other", blocked: "The remote origin holds a branch owlery/pushed, so the branch keeps its name." });
    // A remote's branch of a longer name is not the branch's.
    const short = await createWorktree({ folder: repo, title: "Push", root });
    expect(await planBranchRename(repo, short.branch, "Other")).toEqual({ branch: "owlery/other", blocked: null });
  });

  it("says that a branch which is gone cannot be renamed", async () => {
    const { repo } = repository();
    expect(await planBranchRename(repo, "owlery/gone", "Other")).toEqual({ branch: "owlery/other", blocked: "The branch owlery/gone is gone." });
  });

  it("renames the branch while its worktree has it checked out: the worktree's HEAD names the new branch at the same commit, and the folder is the one it was", async () => {
    const { repo, root } = repository();
    const made = await createWorktree({ folder: repo, title: "First name", root });
    const commit = commitFile(made.worktree, "work.txt");
    await renameBranch(repo, made.branch, "owlery/second-name");
    expect(worktrees(repo)[made.worktree]).toBe("refs/heads/owlery/second-name");
    expect(git(made.worktree, "symbolic-ref", "HEAD").trim()).toBe("refs/heads/owlery/second-name");
    expect(commitOf(repo, "refs/heads/owlery/second-name")).toBe(commit);
    expect(await branchHead(repo, made.branch)).toBeNull();
    expect(existsSync(join(made.worktree, "work.txt"))).toBe(true);
  });

  it("refuses a rename onto a branch that exists, with git's own sentence, and leaves both branches as they were", async () => {
    const { repo, root } = repository();
    const made = await createWorktree({ folder: repo, title: "First name", root });
    git(repo, "branch", "--quiet", "owlery/taken");
    await expect(renameBranch(repo, made.branch, "owlery/taken")).rejects.toThrow("a branch named 'owlery/taken' already exists");
    expect(worktrees(repo)[made.worktree]).toBe("refs/heads/owlery/first-name");
    expect(commitOf(repo, "refs/heads/owlery/taken")).toBe(commitOf(repo, "refs/heads/main"));
  });
});
