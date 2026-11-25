import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, realpathSync, renameSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { BaseFetches, baseDistance, branchChanges, branchCommits, branchHead, branchName, commitNamed, commitPaths, createWorktree, diffBetween, fetchBase, fileAt, filesAt, headStands, holdsCommit, mainCheckout, makeBranch, newCommits, pathsBetween, pathsOfCommit, pathsOfCommits, planBranchMaking, planBranchRename, planWorktree, readLoss, removeBranch, removeWorktree, renameBranch, repositoryOf, repositoryOfSync, slugFor, trailerValues, uncommittedPaths, worktreeHead, worktreesRoot } from "../src/daemon/worktrees";
import { generateName } from "../src/shared/names";
import { commitFile, git, lingeringOrigin, runs, temporaryClone, temporaryRepository, unansweringOrigin, unbranched } from "./repositories";

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

  it("cuts a work item no base was sent for at the branch the remote's HEAD names, and at neither local branch, and gives the new branch no upstream", async () => {
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

    /** Adds remotes to the repository, and plants the branches named as a fetch from them would leave them. Nothing is fetched here, and each remote's folder does not exist, so the fetch a creation runs for a remote's branch fails at once and the cut is at the planted commit. */
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

describe("the fetch of a base", () => {
  /** The repository's refs under a pattern, each with its commit, by the ref's name. */
  function refs(repo: string, ...patterns: string[]): Record<string, string> {
    return Object.fromEntries(
      git(repo, "for-each-ref", "--format=%(refname) %(objectname)", ...patterns)
        .split("\n")
        .filter((line) => line !== "")
        .map((line) => line.split(" ") as [string, string]),
    );
  }

  /** Waits until no process of these ids runs, and says whether that came within two seconds. */
  async function ended(pids: number[]): Promise<boolean> {
    const end = Date.now() + 2000;
    while (pids.some(runs)) {
      if (Date.now() > end) return false;
      await new Promise((r) => setTimeout(r, 20));
    }
    return true;
  }

  it("cuts a work item from a remote's branch at the commit the remote holds, where the clone did not fetch it, for a base sent and for the default base", async () => {
    const { origin, repo, root } = clone();
    const held = commitOf(repo, "refs/remotes/origin/main");
    const moved = commitFile(origin, "moved.txt");
    expect(moved).not.toBe(held);
    const sent = await createWorktree({ folder: repo, title: "Sent", root, base: "origin/main" });
    expect([sent.baseBranch, sent.baseCommit]).toEqual(["origin/main", moved]);
    expect(commitOf(repo, "refs/remotes/origin/main")).toBe(moved);
    expect(commitOf(repo, "refs/heads/owlery/sent")).toBe(moved);
    const again = commitFile(origin, "again.txt");
    const unsent = await createWorktree({ folder: repo, title: "Unsent", root });
    expect([unsent.baseBranch, unsent.baseCommit]).toEqual(["origin/main", again]);
    expect(commitOf(repo, "refs/remotes/origin/main")).toBe(again);
  });

  it("asks no remote for a local base, a local branch that bears a remote branch's name among them", async () => {
    const { origin, repo, root } = clone();
    git(origin, "branch", "--quiet", "shadow");
    git(repo, "fetch", "--quiet", "origin");
    const local = commitFile(repo, "local.txt");
    // A local branch whose name reads as the remote's `shadow`, one commit off it.
    git(repo, "branch", "--quiet", "origin/shadow");
    commitFile(origin, "main-moved.txt");
    git(origin, "checkout", "--quiet", "shadow");
    commitFile(origin, "shadow-moved.txt");
    const before = refs(repo, "refs/remotes");
    expect(await fetchBase(repo, "main")).toEqual({ base: "main", commit: local, fetch: "none", failure: null, since: null });
    expect(await fetchBase(repo, "origin/shadow")).toEqual({ base: "origin/shadow", commit: local, fetch: "none", failure: null, since: null });
    const fromMain = await createWorktree({ folder: repo, title: "From main", root, base: "main" });
    expect([fromMain.baseBranch, fromMain.baseCommit]).toEqual(["main", local]);
    const fromShadow = await createWorktree({ folder: repo, title: "From shadow", root, base: "origin/shadow" });
    expect([fromShadow.baseBranch, fromShadow.baseCommit]).toEqual(["origin/shadow", local]);
    expect(refs(repo, "refs/remotes")).toEqual(before);
  });

  it("moves the one ref of the remote's branch and nothing else: no local branch, no other branch, no other remote, no tag, no FETCH_HEAD and nothing of the checkout", async () => {
    const { base, origin, repo, root } = clone();
    const second = join(base, "second");
    git(base, "clone", "--quiet", origin, second);
    git(second, "config", "user.name", "Owlery Test");
    git(second, "config", "user.email", "test@owlery.invalid");
    git(second, "config", "commit.gpgsign", "false");
    git(origin, "branch", "--quiet", "side");
    git(repo, "remote", "add", "second", second);
    git(repo, "fetch", "--quiet", "--all");
    git(repo, "branch", "--quiet", "--no-track", "side", "origin/side");
    // Everything a wider fetch would bring: the remote's `main` and `side` each moved, a tag stands on the new commit, a branch appeared, and the second remote moved.
    const moved = commitFile(origin, "moved.txt");
    git(origin, "tag", "v1");
    git(origin, "branch", "--quiet", "appeared");
    git(origin, "checkout", "--quiet", "side");
    commitFile(origin, "side-moved.txt");
    commitFile(second, "second-moved.txt");
    // A refspec that writes the remote's branches over the local ones, which a fetch by the remote's configuration would follow.
    git(repo, "config", "--add", "remote.origin.fetch", "+refs/heads/*:refs/heads/*");
    writeFileSync(join(repo, "README.md"), "changed in the checkout\n");
    rmSync(join(repo, ".git", "FETCH_HEAD"));
    const before = { refs: refs(repo), head: git(repo, "symbolic-ref", "HEAD"), status: git(repo, "status", "--porcelain") };
    expect(before.status).not.toBe("");
    const made = await createWorktree({ folder: repo, title: "Narrow", root, base: "origin/main" });
    expect(made.baseCommit).toBe(moved);
    const after = refs(repo);
    const changed = [...new Set([...Object.keys(before.refs), ...Object.keys(after)])].filter((ref) => before.refs[ref] !== after[ref]).sort();
    expect(changed).toEqual(["refs/heads/owlery/narrow", "refs/remotes/origin/HEAD", "refs/remotes/origin/main"]);
    expect(after["refs/remotes/origin/main"]).toBe(moved);
    expect(git(repo, "symbolic-ref", "HEAD")).toBe(before.head);
    expect(git(repo, "status", "--porcelain")).toBe(before.status);
    expect(existsSync(join(repo, ".git", "FETCH_HEAD"))).toBe(false);
  });

  it("reads the remote of a base as the longest remote's name that opens it", async () => {
    const { base, origin, repo } = clone();
    const team = join(base, "team");
    git(base, "clone", "--quiet", origin, team);
    git(team, "config", "user.name", "Owlery Test");
    git(team, "config", "user.email", "test@owlery.invalid");
    git(team, "config", "commit.gpgsign", "false");
    const held = commitOf(repo, "refs/remotes/origin/main");
    const moved = commitFile(team, "team.txt");
    // A remote whose name opens with another remote's, as the clone's configuration holds one, and its branch as an earlier fetch left it.
    git(repo, "config", "remote.origin/team.url", team);
    git(repo, "config", "remote.origin/team.fetch", "+refs/heads/*:refs/remotes/origin/team/*");
    git(repo, "update-ref", "refs/remotes/origin/team/main", held);
    expect(await fetchBase(repo, "origin/team/main")).toEqual({ base: "origin/team/main", commit: moved, fetch: "fetched", failure: null, since: null });
    expect(commitOf(repo, "refs/remotes/origin/main")).toBe(held);
  });

  it("keeps the clone's commit where the remote cannot be reached, says git's first line and since when the clone has held it, and a creation is still cut there", async () => {
    const { origin, repo, root } = clone();
    const began = Math.floor(Date.now() / 1000) * 1000;
    const moved = commitFile(origin, "moved.txt");
    expect(await fetchBase(repo, "origin/main")).toEqual({ base: "origin/main", commit: moved, fetch: "fetched", failure: null, since: null });
    renameSync(origin, `${origin}-away`);
    const kept = await fetchBase(repo, "origin/main");
    expect(kept).toEqual({ base: "origin/main", commit: moved, fetch: "kept", failure: `fatal: '${origin}' does not appear to be a git repository`, since: kept.since });
    expect(kept.since).toBeGreaterThanOrEqual(began);
    expect(kept.since).toBeLessThanOrEqual(Date.now());
    const made = await createWorktree({ folder: repo, title: "Kept", root, base: "origin/main" });
    expect([made.baseBranch, made.baseCommit]).toEqual(["origin/main", moved]);
  });

  it("gives no time where the clone's ref never moved, and keeps the commit of a branch the remote deleted and of one whose remote the clone does not have", async () => {
    const { origin, repo } = clone();
    const held = commitOf(repo, "refs/remotes/origin/main");
    git(origin, "branch", "--quiet", "gone");
    git(repo, "fetch", "--quiet", "origin");
    git(origin, "branch", "--quiet", "-D", "gone");
    expect(await fetchBase(repo, "origin/gone")).toMatchObject({ commit: held, fetch: "kept", failure: "fatal: couldn't find remote ref refs/heads/gone" });
    git(repo, "update-ref", "refs/remotes/ghost/main", held);
    expect(await fetchBase(repo, "ghost/main")).toMatchObject({ base: "ghost/main", commit: held, fetch: "kept", failure: "the clone has no remote for ghost/main" });
    renameSync(origin, `${origin}-away`);
    expect(await fetchBase(repo, "origin/main")).toMatchObject({ commit: held, fetch: "kept", since: null });
    await expect(fetchBase(repo, "origin/never")).rejects.toThrow(`${repo} has no branch origin/never to start a work item from`);
  });

  it("runs the fetch with GIT_TERMINAL_PROMPT=0, so git asks nothing on a terminal", async () => {
    const { base, origin, repo } = clone();
    const moved = commitFile(origin, "moved.txt");
    // A `git` before the real one on the path, which notes the variable a fetch runs with and runs the real one.
    const bin = join(base, "bin");
    const noted = join(base, "prompt.txt");
    const path = process.env.PATH ?? "";
    mkdirSync(bin);
    writeFileSync(join(bin, "git"), `#!/bin/sh\n[ "$1" = fetch ] && echo "prompt=$GIT_TERMINAL_PROMPT" > '${noted}'\nPATH='${path}' exec git "$@"\n`, { mode: 0o755 });
    process.env.PATH = `${bin}:${path}`;
    cleanups.push(() => {
      process.env.PATH = path;
    });
    expect(await fetchBase(repo, "origin/main")).toMatchObject({ commit: moved, fetch: "fetched" });
    expect(readFileSync(noted, "utf8")).toBe("prompt=0\n");
  });

  it("gives up a remote that does not answer within the wait, and ends the process git started for it and leaves no lock", async () => {
    const made = clone();
    const held = commitOf(made.repo, "refs/remotes/origin/main");
    const standIn = unansweringOrigin(made);
    cleanups.push(standIn.stop);
    const began = Date.now();
    expect(await fetchBase(made.repo, "origin/main", { waitMs: 2000 })).toEqual({ base: "origin/main", commit: held, fetch: "kept", failure: "origin did not answer in 2 seconds", since: null });
    expect(Date.now() - began).toBeLessThan(4000);
    expect(standIn.started()).toHaveLength(1);
    expect(await ended(standIn.started())).toBe(true);
    const locks = (readdirSync(join(made.repo, ".git"), { recursive: true }) as string[]).filter((file) => file.endsWith(".lock"));
    expect(locks).toEqual([]);
  });

  it("ends a fetch once git has exited, by git's exit code and with what git printed, where a process git's transport left behind holds git's stderr past the wait", async () => {
    const made = clone();
    const moved = commitFile(made.origin, "moved.txt");
    const standIn = lingeringOrigin(made, made.origin);
    cleanups.push(standIn.stop);
    const began = Date.now();
    expect(await fetchBase(made.repo, "origin/main", { waitMs: 5000 })).toEqual({ base: "origin/main", commit: moved, fetch: "fetched", failure: null, since: null });
    expect(Date.now() - began).toBeLessThan(2500);
    // The process left behind still runs, and so still holds the pipe, when the fetch has ended.
    expect(standIn.started()).toHaveLength(1);
    expect(standIn.started().every(runs)).toBe(true);
    renameSync(made.origin, `${made.origin}-away`);
    const again = Date.now();
    expect(await fetchBase(made.repo, "origin/main", { waitMs: 5000 })).toMatchObject({ commit: moved, fetch: "kept", failure: `fatal: '${made.origin}' does not appear to be a git repository` });
    expect(Date.now() - again).toBeLessThan(2500);
    expect(standIn.started()).toHaveLength(2);
    expect(standIn.started().every(runs)).toBe(true);
    // The test's limit is past the fetch's wait, so a fetch that waited for the pipe to close is seen not to end when the wait passes.
  }, 8000);

  it("signals no process group where a fetch is ended after git has exited, and gives the result of git's exit", async () => {
    const made = clone();
    const moved = commitFile(made.origin, "moved.txt");
    const standIn = lingeringOrigin(made, made.origin);
    cleanups.push(standIn.stop);
    const signalled = vi.spyOn(process, "kill");
    cleanups.push(() => signalled.mockRestore());
    const ending = new AbortController();
    const fetched = fetchBase(made.repo, "origin/main", { waitMs: 5000, ended: ending.signal });
    // Git writes the ref as the last thing before it exits, and the process left behind holds the pipe, so the fetch has not ended when the ref has moved.
    const end = Date.now() + 4000;
    while (commitOf(made.repo, "refs/remotes/origin/main") !== moved && Date.now() < end) await new Promise((r) => setTimeout(r, 10));
    await new Promise((r) => setTimeout(r, 50));
    ending.abort();
    expect(await fetched).toEqual({ base: "origin/main", commit: moved, fetch: "fetched", failure: null, since: null });
    expect(signalled.mock.calls.filter(([pid, signal]) => pid < 0 && signal === "SIGTERM")).toEqual([]);
  }, 8000);

  it("keeps a fetch's result for a creation while it is fresh, fetches again for a creation once it is not, and fetches for whoever asks without reuse", async () => {
    const { origin, repo, root } = clone();
    let clock = 1000;
    const fetches = new BaseFetches({ freshMs: 60, now: () => clock });
    const first = commitFile(origin, "first.txt");
    expect(await fetches.fetch(repo, "origin/main", { reuse: false })).toMatchObject({ commit: first, fetch: "fetched" });
    const second = commitFile(origin, "second.txt");
    clock += 59;
    // Within the time a result stays fresh a creation is cut where that fetch left the ref.
    expect((await createWorktree({ folder: repo, title: "Fresh", root, base: "origin/main", fetches })).baseCommit).toBe(first);
    clock += 1;
    expect((await createWorktree({ folder: repo, title: "Stale", root, base: "origin/main", fetches })).baseCommit).toBe(second);
    // A request that is not a creation's asks the remote whatever ended before it.
    const third = commitFile(origin, "third.txt");
    expect(await fetches.fetch(repo, "origin/main", { reuse: false })).toMatchObject({ commit: third, fetch: "fetched" });
    expect(await fetches.fetch(repo, "main", { reuse: true })).toMatchObject({ base: "main", fetch: "none" });
  });

  it("starts one fetch for two who ask for a branch at once, and ends it when the keeper closes", async () => {
    const made = clone();
    const standIn = unansweringOrigin(made);
    cleanups.push(standIn.stop);
    const fetches = new BaseFetches({ waitMs: 30_000 });
    const one = fetches.fetch(made.repo, "origin/main", { reuse: false });
    const two = fetches.fetch(made.repo, "origin/main", { reuse: true });
    const end = Date.now() + 5000;
    while (standIn.started().length === 0 && Date.now() < end) await new Promise((r) => setTimeout(r, 20));
    // Long enough for a second fetch to have started its own stand-in.
    await new Promise((r) => setTimeout(r, 300));
    expect(standIn.started()).toHaveLength(1);
    fetches.close();
    expect((await one).fetch).toBe("kept");
    expect(await two).toEqual(await one);
    expect(await ended(standIn.started())).toBe(true);
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

  it("reads the main checkout as the first worktree git lists, bare or not, and none where git listed no worktree", () => {
    const listed = "worktree /r/project\nHEAD 1234\nbranch refs/heads/main\n\nworktree /w/project/linked\nHEAD 1234\nbranch refs/heads/side\n\n";
    expect(mainCheckout(listed)).toEqual({ folder: "/r/project", bare: false });
    // A bare repository's folder, with a linked worktree that is not bare after it.
    expect(mainCheckout("worktree /r/bare.git\nbare\n\nworktree /w/of-bare\nHEAD 1234\nbranch refs/heads/side\n\n")).toEqual({ folder: "/r/bare.git", bare: true });
    expect(mainCheckout("")).toBeNull();
    expect(mainCheckout("HEAD 1234\n")).toBeNull();
  });

  it("is the top-level folder of the main checkout, for a folder inside the main checkout and for one inside a linked worktree alike", async () => {
    const made = repository();
    const { worktree, inside } = linked(made);
    mkdirSync(join(made.repo, "src"));
    for (const folder of [made.repo, join(made.repo, "src"), worktree, inside]) {
      expect(await repositoryOf(folder)).toBe(made.repo);
      expect(repositoryOfSync(folder)).toBe(made.repo);
    }
  });

  it("is the checkout's folder where git keeps the git directory elsewhere, a submodule's and one made with a separate git directory, and refuses a linked worktree of either, whose main checkout git does not name", async () => {
    const made = repository("super");
    const lib = repository("lib");
    git(made.repo, "-c", "protocol.file.allow=always", "submodule", "add", "--quiet", lib.repo, "sub");
    const sub = join(made.repo, "sub");
    mkdirSync(join(sub, "src"));
    const apart = join(made.base, "apart");
    git(made.base, "init", "--quiet", "--initial-branch=main", "--separate-git-dir", join(made.base, "apart.git"), apart);
    git(apart, "-c", "user.name=Owlery Test", "-c", "user.email=test@owlery.invalid", "-c", "commit.gpgsign=false", "commit", "--quiet", "--allow-empty", "-m", "first");
    for (const [folder, checkout] of [[sub, sub], [join(sub, "src"), sub], [apart, apart]] as const) {
      expect(await repositoryOf(folder)).toBe(checkout);
      expect(repositoryOfSync(folder)).toBe(checkout);
    }
    expect((await createWorktree({ folder: sub, title: "In the submodule", root: made.root })).repo).toBe(sub);
    // For a linked worktree of either, git lists a git directory first, and names no checkout.
    for (const [checkout, name] of [[sub, "of-sub"], [apart, "of-apart"]] as const) {
      const worktree = join(made.base, name);
      git(checkout, "worktree", "add", "--quiet", "-b", "side", worktree);
      await expect(repositoryOf(worktree)).rejects.toThrow(`${worktree} is a worktree of a repository whose main checkout git does not name`);
      expect(repositoryOfSync(worktree)).toBeNull();
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
    // The bare repository's own folder is refused as its worktree is.
    const bareFolder = join(made.base, "bare.git");
    await expect(repositoryOf(bareFolder)).rejects.toThrow(`${bareFolder} belongs to a bare repository, which has no checkout to keep`);
    // The read at the daemon's start gives no folder for any of the four, and throws for none.
    expect([repositoryOfSync(plain), repositoryOfSync(join(made.base, "missing")), repositoryOfSync(worktree), repositoryOfSync(bareFolder)]).toEqual([null, null, null, null]);
  });

  it("waits two seconds in all at the daemon's start for a folder git does not answer for, over the two commands the read can take", () => {
    const made = repository();
    const bin = join(made.base, "slow-bin");
    mkdirSync(bin);
    // A git that answers no command within the wait, and ends at the signal the timeout sends.
    writeFileSync(join(bin, "git"), "#!/bin/sh\nexec sleep 6\n", { mode: 0o755 });
    const path = process.env.PATH ?? "";
    process.env.PATH = `${bin}:${path}`;
    const began = Date.now();
    let read: string | null;
    try {
      read = repositoryOfSync(made.repo);
    } finally {
      process.env.PATH = path;
    }
    const waited = Date.now() - began;
    expect(read).toBeNull();
    expect(waited).toBeGreaterThanOrEqual(1900);
    expect(waited).toBeLessThan(3000);
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

  it("counts how many commits a head holds that its base branch does not, and how many the base holds that the head does not: a merge of the base counts as the head's own, and the base's commits it took count no longer behind", async () => {
    const made = await cut("Ahead");
    const distance = async () => await baseDistance(made.repo, "main", await made.head());
    expect(await distance()).toEqual({ ahead: 0, behind: 0 });
    writeFileSync(join(made.worktree, "own.txt"), "own\n");
    commitAll(made.worktree, "add own");
    expect(await distance()).toEqual({ ahead: 1, behind: 0 });
    writeFileSync(join(made.repo, "README.md"), "a repository\nof owls\n");
    commitAll(made.repo, "say more");
    commitAll(made.repo, "and more");
    expect(await distance()).toEqual({ ahead: 1, behind: 2 });
    git(made.worktree, "merge", "--quiet", "--no-ff", "-m", "merge main", "main");
    // Four commits since the cut, two of them the base's own.
    expect(await newCommits(made.repo, made.branch, made.baseCommit)).toBe(4);
    expect(await distance()).toEqual({ ahead: 2, behind: 0 });
    // The base takes the branch, and the branch is ahead by none and behind by none.
    git(made.repo, "merge", "--quiet", "--ff-only", made.branch);
    expect(await distance()).toEqual({ ahead: 0, behind: 0 });
    expect(await newCommits(made.repo, made.branch, made.baseCommit)).toBe(4);
  });

  it("counts against a remote's branch as the clone holds it, so a fetch moves both counts, gives none once a fetch pruned the branch, and reads a base's name as the local branch where one bears it", async () => {
    const { repo, origin, root } = clone();
    const made = await createWorktree({ folder: repo, title: "Ahead of the remote", root });
    expect(made.baseBranch).toBe("origin/main");
    commitFile(made.worktree, "own.txt");
    const head = (await branchHead(made.repo, made.branch))!;
    expect(await baseDistance(repo, "origin/main", head)).toEqual({ ahead: 1, behind: 0 });
    // The remote's main takes the commit, and the count moves only once the clone fetches.
    git(origin, "pull", "--quiet", "--ff-only", repo, made.branch);
    expect(await baseDistance(repo, "origin/main", head)).toEqual({ ahead: 1, behind: 0 });
    git(repo, "fetch", "--quiet", "origin");
    expect(await baseDistance(repo, "origin/main", head)).toEqual({ ahead: 0, behind: 0 });
    // The remote's main gains a commit the branch does not hold, and the branch is behind it only once the clone fetches.
    commitFile(origin, "theirs.txt");
    expect(await baseDistance(repo, "origin/main", head)).toEqual({ ahead: 0, behind: 0 });
    git(repo, "fetch", "--quiet", "origin");
    expect(await baseDistance(repo, "origin/main", head)).toEqual({ ahead: 0, behind: 1 });
    // The local main never moved, and a base named `main` is still read as it.
    expect(await baseDistance(repo, "main", head)).toEqual({ ahead: 1, behind: 0 });
    git(origin, "checkout", "--quiet", "-b", "renamed");
    git(origin, "branch", "--quiet", "-D", "main");
    git(repo, "fetch", "--quiet", "--prune", "origin");
    expect(await baseDistance(repo, "origin/main", head)).toBeNull();
    // A remote's HEAD entry is no base.
    git(repo, "remote", "set-head", "origin", "renamed");
    expect(commitOf(repo, "refs/remotes/origin/HEAD")).toBe(commitOf(repo, "refs/remotes/origin/renamed"));
    expect(await baseDistance(repo, "origin/HEAD", `${head}~1`)).toBeNull();
    // A local branch of a remote's branch's name is the one a base's name reads.
    git(repo, "branch", "--quiet", "origin/renamed", made.baseCommit);
    expect(await baseDistance(repo, "origin/renamed", head)).toEqual({ ahead: 1, behind: 0 });
  });

  it("gives no count of commits ahead or behind where the base branch is gone, the head is no commit, or the repository is gone", async () => {
    const made = await cut("Ahead of none");
    const head = await made.head();
    expect(await baseDistance(made.repo, "never-cut", head)).toBeNull();
    expect(await baseDistance(made.repo, "main", "0".repeat(40))).toBeNull();
    expect(await baseDistance(join(made.base, "missing"), "main", head)).toBeNull();
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
    expect(await planBranchRename(repo, made.branch, "  Second name!  ", true)).toEqual({ branch: "owlery/second-name", blocked: null });
    git(repo, "branch", "--quiet", "owlery/second-name");
    expect(await planBranchRename(repo, made.branch, "Second name", true)).toEqual({ branch: "owlery/second-name-2", blocked: null });
    git(repo, "branch", "--quiet", "owlery/second-name-2");
    expect(await planBranchRename(repo, made.branch, "Second name", true)).toEqual({ branch: "owlery/second-name-3", blocked: null });
    expect(worktrees(repo)[made.worktree]).toBe("refs/heads/owlery/first-name");
  });

  it("says that a name which leaves no slug names no branch, and that a name whose branch the work item has changes none, the numbered one among them", async () => {
    const { repo, root } = repository();
    await createWorktree({ folder: repo, title: "Same name", root });
    const second = await createWorktree({ folder: repo, title: "Same name", root });
    expect(second.branch).toBe("owlery/same-name-2");
    expect(await planBranchRename(repo, second.branch, " ?! ", true)).toEqual({ branch: null, blocked: "The name leaves no letter or digit to name a branch by." });
    // `owlery/same-name` is another work item's, so the name gives the branch the work item already has.
    expect(await planBranchRename(repo, second.branch, "Same name", true)).toEqual({ branch: "owlery/same-name-2", blocked: "The branch is already owlery/same-name-2." });
  });

  it("says that a branch with an upstream keeps its name, and so does one a remote holds under its name with no upstream", async () => {
    const { repo, root } = clone();
    const tracked = await createWorktree({ folder: repo, title: "Tracked", root });
    git(repo, "push", "--quiet", "-u", "origin", tracked.branch);
    expect(upstreamOf(repo, tracked.branch)).toBe("refs/remotes/origin/owlery/tracked");
    expect(await planBranchRename(repo, tracked.branch, "Other", true)).toEqual({ branch: "owlery/other", blocked: "The branch owlery/tracked has an upstream, origin/owlery/tracked, so it keeps its name." });
    const pushed = await createWorktree({ folder: repo, title: "Pushed", root });
    git(repo, "push", "--quiet", "origin", pushed.branch);
    expect(upstreamOf(repo, pushed.branch)).toBe("");
    expect(await planBranchRename(repo, pushed.branch, "Other", true)).toEqual({ branch: "owlery/other", blocked: "The remote origin holds a branch owlery/pushed, so the branch keeps its name." });
    // A remote's branch of a longer name is not the branch's.
    const short = await createWorktree({ folder: repo, title: "Push", root });
    expect(await planBranchRename(repo, short.branch, "Other", true)).toEqual({ branch: "owlery/other", blocked: null });
  });

  it("says that a branch which is gone cannot be renamed", async () => {
    const { repo } = repository();
    expect(await planBranchRename(repo, "owlery/gone", "Other", true)).toEqual({ branch: "owlery/other", blocked: "The branch owlery/gone is gone." });
  });

  it("says that a branch Owlery did not make keeps its name", async () => {
    const { repo, root } = repository();
    const picked = await createWorktree({ folder: repo, title: "Picked", root });
    expect(await planBranchRename(repo, picked.branch, "Other", false)).toEqual({ branch: "owlery/other", blocked: "The branch owlery/picked is not one Owlery made, so it keeps its name." });
    expect(await planBranchRename(repo, picked.branch, "Other", true)).toEqual({ branch: "owlery/other", blocked: null });
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

describe("making the branch of a work item with no branch yet", () => {
  /** A worktree a creation made, taken off the branch it cut: its `HEAD` detached at the base commit, which `main` holds. */
  async function detached(made: { repo: string; root: string }, title: string) {
    const place = await createWorktree({ folder: made.repo, title, root: made.root });
    unbranched(made.repo, place);
    return place.worktree;
  }

  /** The path of a file or folder in a worktree's own git folder, whole. */
  const gitPath = (worktree: string, name: string): string => git(worktree, "rev-parse", "--path-format=absolute", "--git-path", name).trim();

  it("names the branch owlery/<slug of the title>, owlery/<slug of the worktree's folder> where the title leaves none, with -2, -3 and so on while a local branch bears the name", async () => {
    const { repo, root } = repository();
    const folder = join(root, "project", "eager-heron");
    expect(await branchName(repo, "  Fix the login bug!  ", folder)).toBe("owlery/fix-the-login-bug");
    expect(await branchName(repo, " ?! ", folder)).toBe("owlery/eager-heron");
    git(repo, "branch", "--quiet", "owlery/fix-the-login-bug");
    expect(await branchName(repo, "Fix the login bug", folder)).toBe("owlery/fix-the-login-bug-2");
    git(repo, "branch", "--quiet", "owlery/fix-the-login-bug-2");
    expect(await branchName(repo, "Fix the login bug", folder)).toBe("owlery/fix-the-login-bug-3");
  });

  it("says what a worktree with no branch holds for one: the branch its HEAD names, or a commit no local branch, no remote's branch and no tag holds, and nothing where HEAD stands at a commit one of them holds or git cannot say", async () => {
    const made = clone();
    const worktree = await detached(made, "Standing");
    expect(await headStands(worktree)).toBeNull();
    const lone = commitFile(worktree, "lone.txt");
    expect(await headStands(worktree)).toEqual({ commit: lone });
    git(made.repo, "tag", "kept", lone);
    expect(await headStands(worktree)).toBeNull();
    git(made.repo, "tag", "--delete", "kept");
    git(made.repo, "branch", "--quiet", "other", lone);
    expect(await headStands(worktree)).toBeNull();
    git(made.repo, "branch", "--quiet", "-D", "other");
    git(worktree, "push", "--quiet", "origin", "HEAD:refs/heads/elsewhere");
    expect(await headStands(worktree)).toBeNull();
    git(worktree, "switch", "--quiet", "-c", "fix/x");
    expect(await headStands(worktree)).toEqual({ branch: "fix/x" });
    expect(await headStands(join(made.base, "missing"))).toBeNull();
  });

  it("makes the branch at the commit the worktree's HEAD is detached at and puts the worktree on it, with the worktree's files as they were", async () => {
    const made = repository();
    const worktree = await detached(made, "Detached");
    const lone = commitFile(worktree, "lone.txt");
    writeFileSync(join(worktree, "loose.txt"), "not committed\n");
    await makeBranch(worktree, "owlery/made");
    expect(git(worktree, "symbolic-ref", "HEAD").trim()).toBe("refs/heads/owlery/made");
    expect(commitOf(made.repo, "refs/heads/owlery/made")).toBe(lone);
    expect(git(worktree, "status", "--porcelain")).toBe("?? loose.txt\n");
  });

  it("refuses with git's words where a rebase is under way in the worktree, and makes no branch", async () => {
    const made = repository();
    const worktree = await detached(made, "Rebasing");
    commitFile(worktree, "lone.txt");
    mkdirSync(gitPath(worktree, "rebase-merge"));
    await expect(makeBranch(worktree, "owlery/made")).rejects.toThrow("cannot switch branch while rebasing");
    expect(await branchHead(made.repo, "owlery/made")).toBeNull();
    expect(git(worktree, "rev-parse", "--abbrev-ref", "HEAD").trim()).toBe("HEAD");
  });

  it("moves the branch on to a commit made in the worktree between git's read of HEAD and its switch onto the branch, which the switch leaves off the branch", async () => {
    const made = repository();
    const worktree = await detached(made, "Racing");
    const lone = commitFile(worktree, "lone.txt");
    // In place of `git switch -c <name>`, the order git 2.54 gives where a commit lands while it switches: the switch reads HEAD, the commit lands on the detached HEAD, and the switch makes the branch at the commit it read and points HEAD at it.
    const bin = join(made.base, "racing-bin");
    const path = process.env.PATH ?? "";
    mkdirSync(bin);
    writeFileSync(join(bin, "git"), `#!/bin/sh\nreal() { PATH='${path}' git "$@"; }\nif [ "$1" = switch ]; then\n  read=$(real rev-parse HEAD) && real commit --quiet --allow-empty -m racing && real branch "$4" "$read" && real symbolic-ref -m "checkout: moving from $read to $4" HEAD "refs/heads/$4"\n  exit $?\nfi\nreal "$@"\n`, { mode: 0o755 });
    process.env.PATH = `${bin}:${path}`;
    cleanups.push(() => {
      process.env.PATH = path;
    });
    await makeBranch(worktree, "owlery/made");
    process.env.PATH = path;
    expect(git(worktree, "symbolic-ref", "HEAD").trim()).toBe("refs/heads/owlery/made");
    expect(git(worktree, "log", "--format=%s %P", "-1", "refs/heads/owlery/made").trim()).toBe(`racing ${lone}`);
    expect(git(worktree, "status", "--porcelain")).toBe("");
  });

  it("plans the branch a rename makes for a work item with no branch, and says why none is made where an operation is under way in the worktree or its HEAD names a branch", async () => {
    const made = repository();
    const worktree = await detached(made, "Standing");
    expect(await planBranchMaking(made.repo, worktree, "Fix the login bug")).toEqual({ branch: "owlery/fix-the-login-bug", blocked: null });
    expect(await planBranchMaking(made.repo, worktree, " ?! ")).toEqual({ branch: "owlery/standing", blocked: null });
    const marker = gitPath(worktree, "MERGE_HEAD");
    writeFileSync(marker, `${git(worktree, "rev-parse", "HEAD").trim()}\n`);
    expect(await planBranchMaking(made.repo, worktree, "Fix the login bug")).toEqual({ branch: "owlery/fix-the-login-bug", blocked: "The branch cannot be made while a merge is under way in the worktree." });
    rmSync(marker);
    git(worktree, "switch", "--quiet", "-c", "fix/x");
    expect(await planBranchMaking(made.repo, worktree, "Fix the login bug")).toEqual({ branch: "owlery/fix-the-login-bug", blocked: "The worktree is on the branch fix/x, which becomes the work item's at Owlery's next read." });
    expect(git(made.repo, "for-each-ref", "--format=%(refname:short)", "refs/heads").trim().split("\n")).toEqual(["fix/x", "main"]);
  });
});

describe("committing files of a worktree", () => {
  const WHO = "Owlery Test <test@owlery.invalid>, Owlery Test <test@owlery.invalid>";
  const TRAILER = "Seal-Routing: 1-x";
  /** How many commits the folder's branch holds. */
  const commitsIn = (folder: string): number => Number(git(folder, "rev-list", "--count", "HEAD"));
  /** The newest commit of the folder's branch: its subject, the rest of its message, who wrote and who committed it, and the paths it changed. */
  const newest = (folder: string) => ({
    subject: git(folder, "log", "-1", "--format=%s").trim(),
    body: git(folder, "log", "-1", "--format=%b").trim(),
    by: git(folder, "log", "-1", "--format=%an <%ae>, %cn <%ce>").trim(),
    paths: git(folder, "show", "--name-only", "--format=", "HEAD").trim().split("\n"),
  });
  /** What git says of the folder's changes, a line for each path. */
  const status = (folder: string): string[] => git(folder, "status", "--porcelain", "--untracked-files=all").split("\n").filter((line) => line !== "").sort();
  /** Writes a file of the folder, with the folders above it. */
  const write = (folder: string, path: string, text: string): void => {
    mkdirSync(join(folder, path, ".."), { recursive: true });
    writeFileSync(join(folder, path), text);
  };

  it("commits the paths given together and nothing else: one commit that holds them, with the subject and the one trailer as its two paragraphs, under the person's identity, while a change staged beside them and one not staged stand as they stood", async () => {
    const { repo } = repository();
    write(repo, "seal/threads/1-x/trail/rounds/round-1.md", "# Review round 1: 1-x\n");
    write(repo, "seal/threads/1-x/decisions.md", "# Decisions and questions: 1-x\n");
    write(repo, "staged.txt", "staged\n");
    git(repo, "add", "staged.txt");
    write(repo, "README.md", "changed and not staged\n");
    await commitPaths(repo, "main", ["seal/threads/1-x/trail/rounds/round-1.md", "seal/threads/1-x/decisions.md"], "chore: record review round 1", [TRAILER]);
    expect(commitsIn(repo)).toBe(2);
    expect(newest(repo)).toEqual({ subject: "chore: record review round 1", body: TRAILER, by: WHO, paths: ["seal/threads/1-x/decisions.md", "seal/threads/1-x/trail/rounds/round-1.md"] });
    expect(status(repo)).toEqual([" M README.md", "A  staged.txt"]);
  });

  it("writes two trailers as the two lines of the commit's second paragraph, in the order given, and git reads each back as a trailer by its key", async () => {
    const { repo } = repository();
    write(repo, "seal/threads/1-x/trail/rounds/round-1.md", "# Review round 1: 1-x\n");
    await commitPaths(repo, "main", ["seal/threads/1-x/trail/rounds/round-1.md"], "chore: record the fix pass of round 1", [TRAILER, "Seal-Built-By: s-1"]);
    expect(newest(repo)).toMatchObject({ subject: "chore: record the fix pass of round 1", body: `${TRAILER}\nSeal-Built-By: s-1` });
    expect(git(repo, "log", "-1", "--format=%(trailers:key=Seal-Built-By,valueonly)").trim()).toBe("s-1");
    expect(git(repo, "log", "-1", "--format=%(trailers:key=Seal-Routing,valueonly)").trim()).toBe(TRAILER.slice("Seal-Routing: ".length));
  });

  it("commits one path alone, and of two paths the one that differs from the newest commit; where none differs it commits nothing", async () => {
    const { repo } = repository();
    write(repo, "seal/threads/1-x/decisions.md", "one\n");
    write(repo, "seal/threads/1-x/routing.md", "routing\n");
    await commitPaths(repo, "main", ["seal/threads/1-x/decisions.md"], "chore: record a word", [TRAILER]);
    expect(newest(repo)).toMatchObject({ subject: "chore: record a word", body: TRAILER, paths: ["seal/threads/1-x/decisions.md"] });
    expect(status(repo)).toEqual(["?? seal/threads/1-x/routing.md"]);

    await commitPaths(repo, "main", ["seal/threads/1-x/decisions.md", "seal/threads/1-x/routing.md"], "chore: declare the routing", [TRAILER]);
    expect(commitsIn(repo)).toBe(3);
    expect(newest(repo)).toMatchObject({ subject: "chore: declare the routing", paths: ["seal/threads/1-x/routing.md"] });

    await commitPaths(repo, "main", ["seal/threads/1-x/decisions.md", "seal/threads/1-x/routing.md"], "chore: nothing to carry", [TRAILER]);
    expect(commitsIn(repo)).toBe(3);
    expect(status(repo)).toEqual([]);
  });

  it("throws why the worktree takes no commit, on another branch than the one named, with nothing staged and nothing committed", async () => {
    const { repo } = repository();
    write(repo, "a.md", "a\n");
    write(repo, "b.md", "b\n");
    await expect(commitPaths(repo, "owlery/other", ["a.md", "b.md"], "chore: record", [TRAILER])).rejects.toThrow("the worktree is not on the branch owlery/other");
    expect(commitsIn(repo)).toBe(1);
    expect(status(repo)).toEqual(["?? a.md", "?? b.md"]);
  });

  it("throws git's words and takes every path out of the index again where a path names no file, and where a hook of the repository refuses the commit, so each file stands written and not staged", async () => {
    const { repo } = repository();
    write(repo, "a.md", "a\n");
    write(repo, "b.md", "b\n");
    await expect(commitPaths(repo, "main", ["a.md", "no-such.md"], "chore: record", [TRAILER])).rejects.toThrow("pathspec 'no-such.md' did not match any files");
    expect(status(repo)).toEqual(["?? a.md", "?? b.md"]);

    write(repo, ".git/hooks/pre-commit", "#!/bin/sh\necho 'the hook says no' >&2\nexit 1\n");
    chmodSync(join(repo, ".git", "hooks", "pre-commit"), 0o755);
    await expect(commitPaths(repo, "main", ["a.md", "b.md"], "chore: record", [TRAILER])).rejects.toThrow("the hook says no");
    expect(commitsIn(repo)).toBe(1);
    expect(status(repo)).toEqual(["?? a.md", "?? b.md"]);
  });
});

describe("the values of a trailer between two commits", () => {
  /** Commits one new file in the repository, each further word a paragraph of the message, and gives the commit. */
  const committer = (repo: string) => (file: string, ...message: string[]): string => {
    writeFileSync(join(repo, file), `${file}\n`);
    git(repo, "add", file);
    git(repo, "commit", "--quiet", ...message.flatMap((paragraph) => ["-m", paragraph]));
    return git(repo, "rev-parse", "HEAD").trim();
  };

  it("gives each value of the trailer the commits after the first and up to the second carry, the oldest first and each once, and none of a commit outside them, of another key or of a message's first paragraph", async () => {
    const { repo } = repository();
    const commit = committer(repo);
    const before = commit("a.txt", "chore: record a pass before the base", "Seal-Routing: 1-x\nSeal-Built-By: s-0");
    commit("b.txt", "fix: end the greeting");
    commit("c.txt", "chore: record the fix pass of round 1", "Seal-Routing: 1-x\nSeal-Built-By: s-1");
    commit("d.txt", "chore: record review round 2", "Seal-Routing: 1-x");
    commit("e.txt", "Seal-Built-By: s-subject", "A body that names Seal-Built-By: s-prose in a sentence.");
    commit("f.txt", "chore: record the fix pass of round 2", "Seal-Routing: 1-x\nSeal-Built-By: s-2");
    commit("f2.txt", "chore: record the fix pass of round 3", "Seal-Routing: 1-x\nSeal-Built-By: s-2");
    const gate = commit("g.txt", "chore: record the fix pass of round 4", "Seal-Routing: 1-x\nSeal-Built-By: s-3");
    commit("h.txt", "chore: record the fix pass of round 5", "Seal-Routing: 1-x\nSeal-Built-By: s-4");
    expect(await trailerValues(repo, [before], gate, "Seal-Built-By")).toEqual(["s-1", "s-2", "s-3"]);
    expect(await trailerValues(repo, [before], gate, "Seal-Routing")).toEqual(["1-x"]);
    expect(await trailerValues(repo, [gate], gate, "Seal-Built-By")).toEqual([]);
    await expect(trailerValues(repo, ["a".repeat(40)], gate, "Seal-Built-By")).rejects.toThrow();
  });

  it("reads no trailer of a commit that a merge brought onto the branch from another line", async () => {
    const { repo } = repository();
    const commit = committer(repo);
    const base = commit("a.txt", "chore: the base");
    git(repo, "checkout", "--quiet", "-b", "other");
    commit("o.txt", "chore: record the fix pass of round 1", "Seal-Routing: 1-other\nSeal-Built-By: s-other");
    git(repo, "checkout", "--quiet", "-");
    commit("b.txt", "chore: record the fix pass of round 1", "Seal-Routing: 2-this\nSeal-Built-By: s-this");
    git(repo, "merge", "--quiet", "--no-ff", "-m", "merge the other line", "other");
    commit("c.txt", "chore: record the fix pass of round 2", "Seal-Routing: 2-this\nSeal-Built-By: s-later");
    expect(await trailerValues(repo, [base], git(repo, "rev-parse", "HEAD").trim(), "Seal-Built-By")).toEqual(["s-this", "s-later"]);
  });

  it("reads no trailer of a commit that a branch named as outside holds and a fast-forward or a rebase put on the line", async () => {
    const { repo } = repository();
    const commit = committer(repo);
    const base = commit("a.txt", "chore: the base");
    git(repo, "branch", "rebased");
    git(repo, "checkout", "--quiet", "-b", "release");
    commit("o.txt", "fix: another work item's fix pass", "Seal-Routing: 1-other\nSeal-Built-By: s-other");
    git(repo, "checkout", "--quiet", "-");
    git(repo, "merge", "--quiet", "release");
    commit("b.txt", "chore: record the fix pass of round 1", "Seal-Routing: 2-this\nSeal-Built-By: s-this");
    expect(await trailerValues(repo, [base, "release"], git(repo, "rev-parse", "HEAD").trim(), "Seal-Built-By")).toEqual(["s-this"]);

    git(repo, "checkout", "--quiet", "rebased");
    commit("c.txt", "chore: record the fix pass of round 1", "Seal-Routing: 3-rebased\nSeal-Built-By: s-rebased");
    git(repo, "rebase", "--quiet", "release");
    expect(await trailerValues(repo, [base, "release"], git(repo, "rev-parse", "HEAD").trim(), "Seal-Built-By")).toEqual(["s-rebased"]);
  });
});

describe("what a chain reads of a worktree", () => {
  it("gives the head whole, the commit a name gives, a shortened hash and a branch among them, and none for a name that names no commit", async () => {
    const { repo } = repository();
    const first = commitOf(repo, "HEAD");
    const second = commitFile(repo, "a.txt");
    expect(await worktreeHead(repo)).toBe(second);
    expect([await commitNamed(repo, second.slice(0, 7)), await commitNamed(repo, "main"), await commitNamed(repo, first)]).toEqual([second, second, first]);
    expect([await commitNamed(repo, "a".repeat(40)), await commitNamed(repo, "no-such-branch"), await commitNamed(repo, "--all")]).toEqual([null, null, null]);
  });

  it("says whether one commit holds another: itself and each of its ancestors, and no commit after it or beside it, and throws for a name that is no commit", async () => {
    const { repo } = repository();
    const first = commitOf(repo, "HEAD");
    const second = commitFile(repo, "a.txt");
    git(repo, "checkout", "--quiet", "-b", "beside", first);
    const beside = commitFile(repo, "b.txt");
    expect([await holdsCommit(repo, second, first), await holdsCommit(repo, second, second), await holdsCommit(repo, first, second), await holdsCommit(repo, second, beside)]).toEqual([true, true, false, false]);
    await expect(holdsCommit(repo, second, "a".repeat(40))).rejects.toThrow(/a{40}/u);
  });

  it("lists each path with a change no commit holds, staged or not, and each untracked file, a moved file as both of its paths, and no ignored file and no committed one", async () => {
    const { repo } = repository();
    writeFileSync(join(repo, ".gitignore"), "ignored.txt\n");
    for (const file of ["staged.txt", "moved from.txt", "kept.txt"]) writeFileSync(join(repo, file), `${file}\n`);
    git(repo, "add", "--all");
    git(repo, "commit", "--quiet", "-m", "three files");
    expect(await uncommittedPaths(repo)).toEqual([]);
    writeFileSync(join(repo, "README.md"), "changed\n");
    writeFileSync(join(repo, "staged.txt"), "staged, changed\n");
    git(repo, "add", "staged.txt");
    git(repo, "mv", "moved from.txt", "moved to.txt");
    mkdirSync(join(repo, "new folder"));
    writeFileSync(join(repo, "new folder", "untracked.txt"), "untracked\n");
    writeFileSync(join(repo, "ignored.txt"), "ignored\n");
    expect((await uncommittedPaths(repo)).sort()).toEqual(["README.md", "moved from.txt", "moved to.txt", "new folder/untracked.txt", "staged.txt"]);
  });

  it("lists the paths one commit changed, as the pull request check reads them: a path with a space whole, the first commit's files, none for a merge, and throws for a name that is no commit", async () => {
    const { repo } = repository();
    const first = commitOf(repo, "HEAD");
    git(repo, "checkout", "--quiet", "-b", "work");
    mkdirSync(join(repo, "sub"));
    writeFileSync(join(repo, "sub", "b c.txt"), "b\n");
    writeFileSync(join(repo, "a.txt"), "a\n");
    git(repo, "add", "--all");
    git(repo, "commit", "--quiet", "-m", "two files");
    const two = commitOf(repo, "HEAD");
    git(repo, "checkout", "--quiet", "main");
    commitFile(repo, "on-main.txt");
    git(repo, "merge", "--quiet", "--no-ff", "-m", "merge work", "work");
    const merge = commitOf(repo, "HEAD");
    expect((await pathsOfCommit(repo, two)).sort()).toEqual(["a.txt", "sub/b c.txt"]);
    expect(await pathsOfCommit(repo, first)).toEqual(git(repo, "ls-tree", "-r", "--name-only", first).trim().split("\n"));
    expect(await pathsOfCommit(repo, merge)).toEqual([]);
    await expect(pathsOfCommit(repo, "a".repeat(40))).rejects.toThrow();
  });

  it("lists the paths the commits after one commit changed, each once, and what one commit changed against another: from the commit they last shared where asked, so what the base gained since is no part of it", async () => {
    const { repo } = repository();
    const base = commitOf(repo, "HEAD");
    git(repo, "checkout", "--quiet", "-b", "work");
    commitFile(repo, "a.txt");
    writeFileSync(join(repo, "a.txt"), "a.txt, again\n");
    mkdirSync(join(repo, "sub"));
    writeFileSync(join(repo, "sub", "b c.txt"), "b\n");
    git(repo, "add", "--all");
    git(repo, "commit", "--quiet", "-m", "again");
    const head = commitOf(repo, "HEAD");
    git(repo, "checkout", "--quiet", "main");
    const moved = commitFile(repo, "on-main.txt");
    expect((await pathsOfCommits(repo, base, head)).sort()).toEqual(["a.txt", "sub/b c.txt"]);
    expect(await pathsOfCommits(repo, head, head)).toEqual([]);
    await expect(pathsOfCommits(repo, "a".repeat(40), head)).rejects.toThrow();
    const since = await diffBetween(repo, "main", head, true);
    expect(since.paths.sort()).toEqual(["a.txt", "sub/b c.txt"]);
    expect(since.text).toContain("+a.txt, again\n");
    expect(since.text).not.toContain("on-main.txt");
    // Read between the two commits themselves, what the base gained reads as removed.
    const between = await diffBetween(repo, moved, head, false);
    expect(between.paths.sort()).toEqual(["a.txt", "on-main.txt", "sub/b c.txt"]);
    expect(between.text).toContain("-on-main.txt\n");
  });

  it("gives the paths at which the trees of two commits differ, whatever commits lie between them: a merge's own changes are among them, a moved file is both of its paths, a file a later commit took back is none, and it throws where a name is no commit", async () => {
    const { repo } = repository();
    const base = commitOf(repo, "HEAD");
    git(repo, "checkout", "--quiet", "-b", "work");
    commitFile(repo, "kept.txt");
    commitFile(repo, "taken-back.txt");
    git(repo, "rm", "--quiet", "taken-back.txt");
    git(repo, "commit", "--quiet", "-m", "take it back");
    git(repo, "mv", "README.md", "moved.md");
    git(repo, "commit", "--quiet", "-m", "move the file");
    git(repo, "checkout", "--quiet", "main");
    commitFile(repo, "on-main.txt");
    git(repo, "checkout", "--quiet", "work");
    // A merge that changes a file of its own, which a walk of the commits leaves out.
    git(repo, "merge", "--quiet", "--no-ff", "--no-commit", "main");
    writeFileSync(join(repo, "in-the-merge.txt"), "changed by the merge alone\n");
    git(repo, "add", "in-the-merge.txt");
    git(repo, "commit", "--quiet", "-m", "merge main");
    const head = commitOf(repo, "HEAD");
    expect((await pathsBetween(repo, base, head)).sort()).toEqual(["README.md", "in-the-merge.txt", "kept.txt", "moved.md", "on-main.txt"]);
    expect(await pathsOfCommits(repo, base, head)).not.toContain("in-the-merge.txt");
    expect((await pathsBetween(repo, head, base)).sort()).toEqual(["README.md", "in-the-merge.txt", "kept.txt", "moved.md", "on-main.txt"]);
    expect(await pathsBetween(repo, head, head)).toEqual([]);
    await expect(pathsBetween(repo, "a".repeat(40), head)).rejects.toThrow();
    await expect(pathsBetween(repo, base, "no-such-branch")).rejects.toThrow();
  });

  it("gives a file's text as a commit holds it, whatever the worktree and the commits after it hold, and the files that commit holds directly in a folder, and none of either where the commit holds none", async () => {
    const { repo } = repository();
    mkdirSync(join(repo, "rounds", "deeper"), { recursive: true });
    for (const file of ["rounds/round-1.md", "rounds/round-2.md", "rounds/deeper/round-3.md"]) writeFileSync(join(repo, file), `${file}\n`);
    git(repo, "add", "--all");
    git(repo, "commit", "--quiet", "-m", "records");
    const held = commitOf(repo, "HEAD");
    writeFileSync(join(repo, "rounds/round-1.md"), "changed in a later commit\n");
    writeFileSync(join(repo, "rounds/round-4.md"), "added in a later commit\n");
    git(repo, "add", "--all");
    git(repo, "commit", "--quiet", "-m", "later");
    writeFileSync(join(repo, "rounds/round-1.md"), "changed in the worktree\n");
    writeFileSync(join(repo, "rounds/round-9.md"), "untracked\n");
    expect([await fileAt(repo, held, "rounds/round-1.md"), await fileAt(repo, held, "rounds/round-4.md"), await fileAt(repo, held, "rounds/round-9.md")]).toEqual(["rounds/round-1.md\n", null, null]);
    expect(await fileAt(repo, "HEAD", "rounds/round-1.md")).toBe("changed in a later commit\n");
    expect(await filesAt(repo, held, "rounds")).toEqual(["rounds/deeper", "rounds/round-1.md", "rounds/round-2.md"]);
    expect([await filesAt(repo, held, "rounds/"), await filesAt(repo, held, "no-such-folder")]).toEqual([["rounds/deeper", "rounds/round-1.md", "rounds/round-2.md"], []]);
  });
});

describe("what a delete would lose", () => {
  /** A work item's branch and worktree in a clone, with `.env` and `node_modules/` ignored by a commit of the branch, which the branch `keeps` holds too. */
  async function workItem(made: { repo: string; root: string }) {
    const place = await createWorktree({ folder: made.repo, title: "Lose", root: made.root });
    writeFileSync(join(place.worktree, ".gitignore"), ".env\nnode_modules/\n");
    git(place.worktree, "add", ".gitignore");
    git(place.worktree, "commit", "--quiet", "-m", "ignore the environment");
    git(made.repo, "branch", "keeps", place.branch);
    return place;
  }
  const short = (repo: string, commit: string): string => git(repo, "rev-parse", "--short", commit).trim();
  const NOTHING = { commits: [], commitCount: 0, uncommitted: [], uncommittedCount: 0, untracked: [], untrackedCount: 0, ignored: [], ignoredCount: 0, blocked: null, unreachable: false };

  it("names the branch, the folder, the one commit no other branch holds, the changed tracked file, the untracked file by its own path and the ignored file and folder; no commit once the branch is pushed or a tag holds it; and the commit of the worktree's detached HEAD", async () => {
    const made = clone();
    const { branch, worktree } = await workItem(made);
    const second = commitFile(worktree, "second.txt");
    writeFileSync(join(worktree, "README.md"), "changed and not committed\n");
    mkdirSync(join(worktree, "newdir", "deep"), { recursive: true });
    writeFileSync(join(worktree, "newdir", "deep", "u.txt"), "untracked\n");
    writeFileSync(join(worktree, ".env"), "SECRET=1\n");
    mkdirSync(join(worktree, "node_modules", "left-pad"), { recursive: true });
    writeFileSync(join(worktree, "node_modules", "left-pad", "index.js"), "\n");
    const files = { uncommitted: ["README.md"], uncommittedCount: 1, untracked: ["newdir/deep/u.txt"], untrackedCount: 1, ignored: [".env", "node_modules/"], ignoredCount: 2 };
    const loss = await readLoss(made.repo, branch, worktree);
    expect(loss).toEqual({ ...NOTHING, branch, worktree, commits: [{ hash: short(made.repo, second), subject: "add second.txt" }], commitCount: 1, ...files, stamp: loss.stamp });
    expect(loss.stamp).not.toBe("");
    // A tag on the branch's head holds its commits, and so does the remote's branch as the clone holds it after a push with no upstream.
    git(made.repo, "tag", "kept", branch);
    const tagged = await readLoss(made.repo, branch, worktree);
    expect(tagged).toMatchObject({ commits: [], commitCount: 0, ...files });
    // The branch's head did not move, and the loss is another.
    expect(tagged.stamp).not.toBe(loss.stamp);
    git(made.repo, "tag", "-d", "kept");
    expect((await readLoss(made.repo, branch, worktree)).commitCount).toBe(1);
    git(made.repo, "push", "--quiet", "origin", branch);
    expect(upstreamOf(made.repo, branch)).toBe("");
    expect(await readLoss(made.repo, branch, worktree)).toMatchObject({ branch, worktree, commits: [], commitCount: 0, ...files });
    // A commit on a detached HEAD of the worktree is on no branch at all.
    git(worktree, "checkout", "--quiet", "--detach");
    git(worktree, "commit", "--quiet", "--allow-empty", "-m", "on no branch");
    const detached = commitOf(worktree, "HEAD");
    expect(await readLoss(made.repo, branch, worktree)).toMatchObject({ branch, worktree, commits: [{ hash: short(made.repo, detached), subject: "on no branch" }], commitCount: 1 });
  });

  it("names no branch where the delete removes none: the commits of a worktree with no branch are those its HEAD holds and nothing else holds, a branch the delete leaves holds its own, and no other worktree's checkout blocks it, one with no branch either", async () => {
    const made = repository();
    const { branch, worktree } = await workItem(made);
    commitFile(worktree, "second.txt");
    const detached = join(made.root, "detached");
    const other = join(made.root, "other");
    for (const folder of [detached, other]) git(made.repo, "worktree", "add", "--quiet", "--detach", folder, "main");
    const lone = commitFile(detached, "lone.txt");
    const loss = await readLoss(made.repo, null, detached);
    expect(loss).toEqual({ ...NOTHING, branch: null, worktree: detached, commits: [{ hash: short(made.repo, lone), subject: "add lone.txt" }], commitCount: 1, stamp: loss.stamp });
    // The work item's own branch stays, and holds the commit its worktree made.
    expect(await readLoss(made.repo, null, worktree)).toMatchObject({ ...NOTHING, branch: null, worktree });
    git(worktree, "checkout", "--quiet", "--detach");
    git(made.repo, "checkout", "--quiet", branch);
    expect(await readLoss(made.repo, null, worktree)).toMatchObject({ ...NOTHING, branch: null, worktree });
  });

  it("says why a delete cannot run: the branch is checked out in the repository's own checkout, or the worktree is locked", async () => {
    const made = repository();
    const { branch, worktree } = await workItem(made);
    const free = await readLoss(made.repo, branch, worktree);
    expect(free.blocked).toBeNull();
    git(made.repo, "worktree", "lock", worktree);
    const locked = await readLoss(made.repo, branch, worktree);
    expect(locked.blocked).toBe(`The worktree ${worktree} is locked, so git does not remove it.`);
    expect(locked.stamp).not.toBe(free.stamp);
    git(made.repo, "worktree", "unlock", worktree);
    git(worktree, "checkout", "--quiet", "--detach");
    git(made.repo, "checkout", "--quiet", branch);
    expect((await readLoss(made.repo, branch, worktree)).blocked).toBe(`The branch ${branch} is checked out in ${made.repo}, so it cannot be deleted.`);
  });

  it("gives a stamp that stays while nothing changes and differs after a commit, after a new untracked file, and for an entry the lists leave out; each list holds 500 entries beside the count of them all", async () => {
    const made = repository();
    const { branch, worktree } = await workItem(made);
    const stamps = [(await readLoss(made.repo, branch, worktree)).stamp, (await readLoss(made.repo, branch, worktree)).stamp];
    expect(stamps[0]).toBe(stamps[1]);
    commitFile(worktree, "second.txt");
    stamps.push((await readLoss(made.repo, branch, worktree)).stamp);
    for (let n = 0; n < 501; n++) writeFileSync(join(worktree, `u${String(n).padStart(3, "0")}.txt`), "");
    const many = await readLoss(made.repo, branch, worktree);
    expect([many.untracked.length, many.untracked[0], many.untracked[499], many.untrackedCount]).toEqual([500, "u000.txt", "u499.txt", 501]);
    stamps.push(many.stamp);
    // The 502nd file is one the list does not carry.
    writeFileSync(join(worktree, "u501.txt"), "");
    const more = await readLoss(made.repo, branch, worktree);
    expect([more.untracked, more.untrackedCount]).toEqual([many.untracked, 502]);
    stamps.push(more.stamp);
    // An ignored file is of the loss too.
    writeFileSync(join(worktree, ".env"), "SECRET=1\n");
    stamps.push((await readLoss(made.repo, branch, worktree)).stamp);
    expect(new Set(stamps).size).toBe(5);
  });

  it("names no branch that is gone, names a folder removed by hand while git still lists it, names no folder git lists no worktree at, though one stands there, and says where git reads nothing in the repository's folder", async () => {
    const made = repository();
    const { branch, worktree } = await workItem(made);
    rmSync(worktree, { recursive: true });
    expect(await readLoss(made.repo, branch, worktree)).toMatchObject({ ...NOTHING, branch, worktree });
    git(made.repo, "worktree", "prune");
    mkdirSync(worktree);
    writeFileSync(join(worktree, "left.txt"), "no worktree of git's\n");
    // The folder is inside no worktree now, and git is not asked about it: it would answer for a repository the folder happens to be inside.
    expect(await readLoss(made.repo, branch, worktree)).toMatchObject({ ...NOTHING, branch, worktree: null });
    git(made.repo, "branch", "-D", branch);
    expect(await readLoss(made.repo, branch, worktree)).toMatchObject({ ...NOTHING, branch: null, worktree: null });
    // The main checkout is no worktree a delete removes, whatever a work item's entry says.
    expect((await readLoss(made.repo, "main", made.repo)).worktree).toBeNull();
    rmSync(made.repo, { recursive: true });
    const gone = await readLoss(made.repo, branch, worktree);
    expect(gone).toEqual({ ...NOTHING, branch: null, worktree: null, unreachable: true, stamp: gone.stamp });
  });
});

describe("removing a work item's worktree and branch", () => {
  it("removes a worktree that holds nothing but ignored files without the force, refuses one with an untracked file in git's own words and leaves it whole, and removes it with the force", async () => {
    const made = repository();
    const first = await createWorktree({ folder: made.repo, title: "First", root: made.root });
    const second = await createWorktree({ folder: made.repo, title: "Second", root: made.root });
    writeFileSync(join(first.worktree, ".gitignore"), ".env\n");
    git(first.worktree, "add", ".gitignore");
    git(first.worktree, "commit", "--quiet", "-m", "ignore the environment");
    writeFileSync(join(first.worktree, ".env"), "SECRET=1\n");
    await removeWorktree(made.repo, first.worktree, false);
    expect([existsSync(first.worktree), Object.keys(worktrees(made.repo))]).toEqual([false, [made.repo, second.worktree]]);
    // The branch stays until it is removed by its own command.
    expect(await branchHead(made.repo, first.branch)).not.toBeNull();
    writeFileSync(join(second.worktree, "untracked.txt"), "kept\n");
    await expect(removeWorktree(made.repo, second.worktree, false)).rejects.toThrow("contains modified or untracked files, use --force to delete it");
    expect([readdirSync(second.worktree).sort(), Object.keys(worktrees(made.repo))]).toEqual([[".git", "README.md", "untracked.txt"], [made.repo, second.worktree]]);
    await removeWorktree(made.repo, second.worktree, true);
    expect([existsSync(second.worktree), Object.keys(worktrees(made.repo)), existsSync(made.root)]).toEqual([false, [made.repo], true]);
  });

  it("takes a worktree whose folder was removed by hand off git's list, and removes nothing where git lists no linked worktree at the folder: a folder that is no worktree's, and the main checkout", async () => {
    const made = repository();
    const { worktree } = await createWorktree({ folder: made.repo, title: "First", root: made.root });
    rmSync(worktree, { recursive: true });
    await removeWorktree(made.repo, worktree, false);
    expect(Object.keys(worktrees(made.repo))).toEqual([made.repo]);
    mkdirSync(worktree);
    writeFileSync(join(worktree, "left.txt"), "no worktree of git's\n");
    await removeWorktree(made.repo, worktree, true);
    await removeWorktree(made.repo, made.repo, true);
    expect([readdirSync(worktree), existsSync(join(made.repo, "README.md"))]).toEqual([["left.txt"], true]);
  });

  it("finds a worktree whose folder a work item names through a link, as git lists it by the folder the link leads to", async () => {
    const made = repository();
    mkdirSync(made.root);
    const link = join(made.base, "linked-root");
    symlinkSync(made.root, link);
    const { branch, worktree } = await createWorktree({ folder: made.repo, title: "First", root: link });
    expect(worktree.startsWith(link)).toBe(true);
    expect((await readLoss(made.repo, branch, worktree)).worktree).not.toBeNull();
    await removeWorktree(made.repo, worktree, false);
    expect([existsSync(worktree), Object.keys(worktrees(made.repo))]).toEqual([false, [made.repo]]);
  });

  it("removes the local branch though no other branch holds its commit, leaves the remote's branch of its name and every other ref, and does nothing for a branch that is gone", async () => {
    const made = clone();
    const { branch, worktree } = await createWorktree({ folder: made.repo, title: "First", root: made.root });
    commitFile(worktree, "work.txt");
    git(made.repo, "push", "--quiet", "origin", branch);
    commitFile(worktree, "later.txt");
    await removeWorktree(made.repo, worktree, false);
    const refs = (): string[] => git(made.repo, "for-each-ref", "--format=%(refname) %(objectname)").split("\n").filter((line) => line !== "");
    const before = refs();
    const remote = git(made.origin, "for-each-ref");
    await removeBranch(made.repo, branch);
    expect(refs()).toEqual(before.filter((line) => !line.startsWith(`refs/heads/${branch} `)));
    expect(before.some((line) => line.startsWith(`refs/remotes/origin/${branch} `))).toBe(true);
    expect(git(made.origin, "for-each-ref")).toBe(remote);
    await removeBranch(made.repo, branch);
    expect(refs()).toEqual(before.filter((line) => !line.startsWith(`refs/heads/${branch} `)));
  });
});
