import { chmodSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, symlinkSync, writeFileSync, existsSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { beginSetup, copyIncluded, endedSetup, readSetup } from "../src/daemon/worktree-setup";
import { git, temporaryRepository } from "./repositories";

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

/**
 * A temporary repository whose `.gitignore` ignores `.env`, `.env.*` and
 * `node_modules/` and keeps the tracked `.env.example`, holding the ignored
 * `.env`, `apps/web/.env.local` and `node_modules/pkg/index.js`, the
 * untracked `notes.txt` git does not ignore, and a linked worktree checked
 * out from it.
 */
function repositoryWithIgnoredFiles() {
  const made = temporaryRepository();
  cleanups.push(made.remove);
  const { repo } = made;
  writeFileSync(join(repo, ".gitignore"), ".env\n.env.*\n!.env.example\nnode_modules/\n");
  writeFileSync(join(repo, ".env.example"), "KEY=\n");
  git(repo, "add", ".gitignore", ".env.example");
  git(repo, "commit", "--quiet", "-m", "ignore");
  writeFileSync(join(repo, ".env"), "KEY=main\n");
  mkdirSync(join(repo, "apps", "web"), { recursive: true });
  writeFileSync(join(repo, "apps", "web", ".env.local"), "WEB=main\n");
  mkdirSync(join(repo, "node_modules", "pkg"), { recursive: true });
  writeFileSync(join(repo, "node_modules", "pkg", "index.js"), "module.exports = 1;\n");
  writeFileSync(join(repo, "notes.txt"), "my notes\n");
  const worktree = join(made.base, "worktree");
  git(repo, "worktree", "add", "--quiet", "-b", "owlery/setup", worktree);
  return { ...made, worktree };
}

describe("readSetup", () => {
  it("says whether .worktreeinclude stands as a file and gives the command .worktreesetup holds, whole, whether git tracks either or not", async () => {
    const { repo } = repositoryWithIgnoredFiles();
    expect(await readSetup(repo)).toEqual({ include: false, command: null });
    writeFileSync(join(repo, ".worktreeinclude"), ".env\n");
    writeFileSync(join(repo, ".worktreesetup"), "pnpm install\n# then\necho done\n");
    expect(await readSetup(repo)).toEqual({ include: true, command: "pnpm install\n# then\necho done\n" });
    git(repo, "add", ".worktreeinclude", ".worktreesetup");
    git(repo, "commit", "--quiet", "-m", "setup");
    expect(await readSetup(repo)).toEqual({ include: true, command: "pnpm install\n# then\necho done\n" });
  });

  it("reads a .worktreesetup that holds only white space, and one that is a folder, as no command, and a .worktreeinclude that is a folder as none", async () => {
    const { repo } = repositoryWithIgnoredFiles();
    writeFileSync(join(repo, ".worktreesetup"), " \n\t\n");
    expect(await readSetup(repo)).toEqual({ include: false, command: null });
    const other = repositoryWithIgnoredFiles().repo;
    mkdirSync(join(other, ".worktreesetup"));
    mkdirSync(join(other, ".worktreeinclude"));
    expect(await readSetup(other)).toEqual({ include: false, command: null });
  });
});

describe("copyIncluded", () => {
  it("copies from the main checkout each path a pattern matches that git ignores, a folder as one path, and nothing tracked or merely untracked", async () => {
    const { repo, worktree } = repositoryWithIgnoredFiles();
    writeFileSync(join(repo, ".worktreeinclude"), ".env\n**/.env.local\nnode_modules/\nnotes.txt\n.env.example\n");
    const copy = await copyIncluded(repo, worktree);
    expect(copy).toEqual({ copied: [".env", "apps/web/.env.local", "node_modules/"], copiedCount: 3, failed: [], failure: null });
    for (const path of [".env", "apps/web/.env.local", "node_modules/pkg/index.js"]) expect(readFileSync(join(worktree, path), "utf8")).toBe(readFileSync(join(repo, path), "utf8"));
    expect(existsSync(join(worktree, "notes.txt"))).toBe(false);
    // The tracked file is the checkout's, and was not copied over it.
    expect(readFileSync(join(worktree, ".env.example"), "utf8")).toBe("KEY=\n");
    // Patterns that match no ignored path copy nothing, and nothing failed.
    writeFileSync(join(repo, ".worktreeinclude"), "notes.txt\n");
    expect(await copyIncluded(repo, worktree)).toEqual({ copied: [], copiedCount: 0, failed: [], failure: null });
  });

  // Each of the 501 paths is cloned by a process of its own, twice, so the case takes longer than the default five seconds on a loaded machine.
  it("lists 500 of the paths it copied and of those it could not, and counts every one it copied", { timeout: 30_000 }, async () => {
    const { repo, worktree, base } = repositoryWithIgnoredFiles();
    writeFileSync(join(repo, ".gitignore"), "*.log\n");
    writeFileSync(join(repo, ".worktreeinclude"), "*.log\n");
    const names = Array.from({ length: 501 }, (_, at) => `f${String(at).padStart(3, "0")}.log`);
    for (const name of names) writeFileSync(join(repo, name), "x\n");
    const copy = await copyIncluded(repo, worktree);
    expect([copy.copied, copy.copiedCount, copy.failed]).toEqual([names.slice(0, 500), 501, []]);
    for (const name of names) chmodSync(join(repo, name), 0o000);
    cleanups.push(() => {
      for (const name of names) chmodSync(join(repo, name), 0o600);
    });
    const other = join(base, "other");
    git(repo, "worktree", "add", "--quiet", "-b", "owlery/other", other);
    const refused = await copyIncluded(repo, other);
    expect([refused.copied, refused.copiedCount, refused.failed.map((entry) => entry.path)]).toEqual([[], 0, names.slice(0, 500)]);
  });

  it("copies a link as a link with the same target, and writes over no path that stands in the worktree", async () => {
    const { repo, worktree } = repositoryWithIgnoredFiles();
    mkdirSync(join(repo, "node_modules", ".bin"));
    symlinkSync("../pkg/index.js", join(repo, "node_modules", ".bin", "tool"));
    // A path that is itself a link, and is moved into its place as one.
    symlinkSync("apps/web/.env.local", join(repo, ".env.web"));
    writeFileSync(join(repo, ".worktreeinclude"), ".env\n.env.web\nnode_modules/\n");
    writeFileSync(join(worktree, ".env"), "KEY=worktree\n");
    const copy = await copyIncluded(repo, worktree);
    expect(copy.copied).toEqual([".env.web", "node_modules/"]);
    for (const [link, target] of [[join(worktree, "node_modules", ".bin", "tool"), "../pkg/index.js"], [join(worktree, ".env.web"), "apps/web/.env.local"]] as const) {
      expect(lstatSync(link).isSymbolicLink()).toBe(true);
      expect(readlinkSync(link)).toBe(target);
    }
    expect(readFileSync(join(worktree, ".env"), "utf8")).toBe("KEY=worktree\n");
  });

  it("writes nothing through a link the worktree's branch tracks out of the worktree, and lists the path as not copied", async () => {
    const { repo, worktree, base } = repositoryWithIgnoredFiles();
    const outside = join(base, "outside");
    mkdirSync(outside);
    // The worktree's branch tracks `apps` as a link to a folder outside both checkouts, where the main checkout holds `apps/web/.env.local`.
    symlinkSync(outside, join(worktree, "apps"));
    git(worktree, "add", "apps");
    git(worktree, "commit", "--quiet", "-m", "link");
    writeFileSync(join(repo, ".worktreeinclude"), "**/.env.local\n");
    expect(await copyIncluded(repo, worktree)).toEqual({ copied: [], copiedCount: 0, failed: [{ path: "apps/web/.env.local", why: "a link in the worktree leads its folder out of the worktree" }], failure: null });
    expect(readdirSync(outside)).toEqual([]);
    // A link to a folder that does not stand leads nowhere a write may go, and no folder is made where it points.
    const other = join(base, "other");
    git(repo, "worktree", "add", "--quiet", "-b", "owlery/other", other);
    symlinkSync(join(base, "nowhere"), join(other, "apps"));
    expect(await copyIncluded(repo, other)).toEqual({ copied: [], copiedCount: 0, failed: [{ path: "apps/web/.env.local", why: "a link in the worktree leads its folder out of the worktree" }], failure: null });
    expect(existsSync(join(base, "nowhere"))).toBe(false);
  });

  /** A program in the place of `/bin/cp` that writes each call's arguments to `log`, then runs `body`. */
  function clonedBy(base: string, body: string) {
    const log = join(base, "clone.log");
    const program = join(base, "clone.sh");
    writeFileSync(program, `#!/bin/sh\necho "$*" >> "${log}"\n${body}\n`, { mode: 0o755 });
    return { program, calls: () => (existsSync(log) ? readFileSync(log, "utf8").split("\n").filter((line) => line !== "") : []) };
  }

  it("clones each path with cp -c -R -P, a folder and a file alike, and clones no path that stands in the worktree", async () => {
    const { repo, worktree, base } = repositoryWithIgnoredFiles();
    mkdirSync(join(repo, "node_modules", ".bin"));
    symlinkSync("../pkg/index.js", join(repo, "node_modules", ".bin", "tool"));
    writeFileSync(join(repo, ".worktreeinclude"), ".env\n**/.env.local\nnode_modules/\n");
    writeFileSync(join(worktree, ".env"), "KEY=worktree\n");
    const clone = clonedBy(base, 'exec /bin/cp "$@"');
    expect(await copyIncluded(repo, worktree, clone.program)).toEqual({ copied: ["apps/web/.env.local", "node_modules/"], copiedCount: 2, failed: [], failure: null });
    // Each path is cloned into a folder of its own beside its place, then moved into it.
    const beside = (path: string) => expect.stringMatching(new RegExp(`^-c -R -P ${join(repo, path)} ${join(worktree, dirname(path), ".owlery-copy-[^/]+", basename(path))}$`));
    expect(clone.calls()).toEqual([beside("apps/web/.env.local"), beside("node_modules")]);
    expect(readdirSync(worktree).filter((name) => name.startsWith(".owlery-copy-"))).toEqual([]);
    for (const path of ["apps/web/.env.local", "node_modules/pkg/index.js"]) expect(readFileSync(join(worktree, path), "utf8")).toBe(readFileSync(join(repo, path), "utf8"));
    expect(readlinkSync(join(worktree, "node_modules", ".bin", "tool"))).toBe("../pkg/index.js");
    expect(readFileSync(join(worktree, ".env"), "utf8")).toBe("KEY=worktree\n");
  });

  it("clones a path whose folders the worktree lacks, once it made them", async () => {
    const { repo, worktree, base } = repositoryWithIgnoredFiles();
    writeFileSync(join(repo, ".worktreeinclude"), "**/.env.local\n");
    // The worktree's branch holds no `apps/web`, and a clone that fails leaves a mark, so the copy of the bytes is told apart from it.
    const failedClone = join(base, "clone-failed");
    const clone = clonedBy(base, `/bin/cp "$@" || { touch "${failedClone}"; exit 1; }`);
    expect(await copyIncluded(repo, worktree, clone.program)).toEqual({ copied: ["apps/web/.env.local"], copiedCount: 1, failed: [], failure: null });
    expect(existsSync(failedClone)).toBe(false);
    expect(readFileSync(join(worktree, "apps", "web", ".env.local"), "utf8")).toBe("WEB=main\n");
  });

  it("copies a path with Node's copy where its clone fails, in place of what the failed clone left, and where no cp can start", async () => {
    const { repo, worktree, base } = repositoryWithIgnoredFiles();
    mkdirSync(join(repo, "node_modules", ".bin"));
    symlinkSync("../pkg/index.js", join(repo, "node_modules", ".bin", "tool"));
    writeFileSync(join(repo, ".worktreeinclude"), ".env\nnode_modules/\n");
    // A clone that fails half way: it leaves a folder, with a stray file in it, at each target.
    const clone = clonedBy(base, 'mkdir -p "$5" && echo stray > "$5/stray"\nexit 1');
    expect(await copyIncluded(repo, worktree, clone.program)).toEqual({ copied: [".env", "node_modules/"], copiedCount: 2, failed: [], failure: null });
    expect(clone.calls()).toHaveLength(2);
    expect(readFileSync(join(worktree, ".env"), "utf8")).toBe("KEY=main\n");
    expect(readFileSync(join(worktree, "node_modules", "pkg", "index.js"), "utf8")).toBe("module.exports = 1;\n");
    expect(existsSync(join(worktree, "node_modules", "stray"))).toBe(false);
    expect(readlinkSync(join(worktree, "node_modules", ".bin", "tool"))).toBe("../pkg/index.js");
    const other = join(base, "other");
    git(repo, "worktree", "add", "--quiet", "-b", "owlery/other", other);
    expect(await copyIncluded(repo, other, join(base, "no-such-cp"))).toEqual({ copied: [".env", "node_modules/"], copiedCount: 2, failed: [], failure: null });
    expect(readFileSync(join(other, ".env"), "utf8")).toBe("KEY=main\n");
  });

  it("lists a path it could not copy with the error, and copies the others", async () => {
    const { repo, worktree } = repositoryWithIgnoredFiles();
    writeFileSync(join(repo, ".env.secret"), "SECRET=1\n");
    chmodSync(join(repo, ".env.secret"), 0o000);
    cleanups.push(() => chmodSync(join(repo, ".env.secret"), 0o600));
    writeFileSync(join(repo, ".worktreeinclude"), ".env\n.env.secret\nnode_modules/\n");
    const copy = await copyIncluded(repo, worktree);
    expect(copy.copied).toEqual([".env", "node_modules/"]);
    expect(copy.copiedCount).toBe(2);
    expect(copy.failed).toEqual([{ path: ".env.secret", why: expect.stringContaining("EACCES") }]);
    expect(copy.failure).toBeNull();
    expect(readFileSync(join(worktree, ".env"), "utf8")).toBe("KEY=main\n");
  });

  it("leaves nothing of a path it could not copy, the folders it made for it among them, so a copy again copies the path whole", async () => {
    const { repo, worktree } = repositoryWithIgnoredFiles();
    for (const name of ["a.js", "m.js", "z.js"]) writeFileSync(join(repo, "node_modules", "pkg", name), `${name}\n`);
    const unreadable = [join(repo, "node_modules", "pkg", "m.js"), join(repo, "apps", "web", ".env.local")];
    for (const file of unreadable) chmodSync(file, 0o000);
    cleanups.push(() => {
      for (const file of unreadable) chmodSync(file, 0o600);
    });
    writeFileSync(join(repo, ".worktreeinclude"), "**/.env.local\nnode_modules/\n");
    const copy = await copyIncluded(repo, worktree);
    expect([copy.copied, copy.failed]).toEqual([[], [{ path: "apps/web/.env.local", why: expect.stringContaining("EACCES") }, { path: "node_modules/", why: expect.stringContaining("EACCES") }]]);
    expect(readdirSync(worktree).sort()).toEqual([".env.example", ".git", ".gitignore", "README.md"]);
    for (const file of unreadable) chmodSync(file, 0o600);
    expect(await copyIncluded(repo, worktree)).toEqual({ copied: ["apps/web/.env.local", "node_modules/"], copiedCount: 2, failed: [], failure: null });
    expect(readdirSync(join(worktree, "node_modules", "pkg")).sort()).toEqual(["a.js", "index.js", "m.js", "z.js"]);
  });

  it("leaves a path that came to stand in the worktree during its copy as it is, and lists it as not copied", async () => {
    const { repo, worktree, base } = repositoryWithIgnoredFiles();
    writeFileSync(join(repo, ".worktreeinclude"), ".env\nnode_modules/\n");
    // A clone during which the person's command makes the path in the worktree, then fails, so Node's copy runs after it.
    const clone = clonedBy(base, `case "$5" in\n*/.env) echo PERSON=1 > "${join(worktree, ".env")}" ;;\n*/node_modules) mkdir -p "${join(worktree, "node_modules", "made")}" && echo person > "${join(worktree, "node_modules", "made", "file")}" ;;\nesac\nexit 1`);
    const appeared = "it came to stand in the worktree during the copy, and was left as it is";
    expect(await copyIncluded(repo, worktree, clone.program)).toEqual({ copied: [], copiedCount: 0, failed: [{ path: ".env", why: appeared }, { path: "node_modules/", why: appeared }], failure: null });
    expect(readFileSync(join(worktree, ".env"), "utf8")).toBe("PERSON=1\n");
    expect(readdirSync(join(worktree, "node_modules"))).toEqual(["made"]);
    expect(readFileSync(join(worktree, "node_modules", "made", "file"), "utf8")).toBe("person\n");
    expect(readdirSync(worktree).sort()).toEqual([".env", ".env.example", ".git", ".gitignore", "README.md", "node_modules"]);
  });

  it("gives the failure of git's command as the copy's, and copies nothing", async () => {
    const { base, worktree } = repositoryWithIgnoredFiles();
    // A folder that is no repository: git's listing of the ignored paths fails there.
    const plain = join(base, "plain");
    mkdirSync(plain);
    writeFileSync(join(plain, ".worktreeinclude"), ".env\n");
    writeFileSync(join(plain, ".env"), "KEY=plain\n");
    const copy = await copyIncluded(plain, worktree);
    expect(copy).toEqual({ copied: [], copiedCount: 0, failed: [], failure: expect.stringContaining("not a git repository") });
    expect(existsSync(join(worktree, ".env"))).toBe(false);
    // A repository whose .worktreeinclude is gone: git's listing refuses the file it was given.
    const { repo } = repositoryWithIgnoredFiles();
    expect((await copyIncluded(repo, worktree)).failure).toMatch(/\.worktreeinclude/);
  });
});

describe("beginSetup", () => {
  /** A clock that reads one more at each read, from `start`. */
  const clock = (start: number) => {
    let at = start;
    return () => at++;
  };

  it("gives no setup for a repository that names neither file, and copies nothing", async () => {
    const { repo, worktree } = repositoryWithIgnoredFiles();
    expect(await beginSetup(repo, worktree, clock(5))).toBeNull();
    expect(git(worktree, "ls-files", "--others", "--ignored", "--exclude-standard", "--directory")).toBe("");
  });

  it("gives a running setup where a command stands, and an ended one at once where only .worktreeinclude does, by the copy", async () => {
    const { repo, worktree } = repositoryWithIgnoredFiles();
    writeFileSync(join(repo, ".worktreesetup"), "pnpm install\n");
    expect(await beginSetup(repo, worktree, clock(5))).toEqual({ copied: [], copiedCount: 0, failedCopies: [], command: "pnpm install\n", paneId: null, state: "running", exitCode: null, failure: null, startedAt: 5, endedAt: null });
    const other = repositoryWithIgnoredFiles();
    writeFileSync(join(other.repo, ".worktreeinclude"), ".env\n");
    // It began before the copy and ended after it.
    expect(await beginSetup(other.repo, other.worktree, clock(6))).toEqual({ copied: [".env"], copiedCount: 1, failedCopies: [], command: null, paneId: null, state: "succeeded", exitCode: null, failure: null, startedAt: 6, endedAt: 7 });
    writeFileSync(join(other.repo, ".worktreeinclude"), ".env\n.env.secret\n");
    writeFileSync(join(other.repo, ".env.secret"), "SECRET=1\n");
    chmodSync(join(other.repo, ".env.secret"), 0o000);
    cleanups.push(() => chmodSync(join(other.repo, ".env.secret"), 0o600));
    expect(await beginSetup(other.repo, other.worktree, clock(7))).toMatchObject({ copied: [], failedCopies: [{ path: ".env.secret" }], state: "failed", startedAt: 7, endedAt: 8 });
  });

  it("gives a failed setup that says why where .worktreesetup stands and cannot be read", async () => {
    const { repo, worktree } = repositoryWithIgnoredFiles();
    writeFileSync(join(repo, ".worktreesetup"), "pnpm install\n");
    chmodSync(join(repo, ".worktreesetup"), 0o000);
    cleanups.push(() => chmodSync(join(repo, ".worktreesetup"), 0o600));
    expect(await beginSetup(repo, worktree, clock(5))).toMatchObject({ command: null, paneId: null, state: "failed", failure: expect.stringMatching(/^\.worktreesetup could not be read: .*EACCES/), startedAt: 5, endedAt: 6 });
  });
});

describe("endedSetup", () => {
  const RUNNING = { copied: [".env"], copiedCount: 1, failedCopies: [], command: "make", paneId: 3, state: "running" as const, exitCode: null, failure: null, startedAt: 5, endedAt: null };

  it("succeeds where the command exited with 0, no copy failed and nothing ended it, and fails otherwise", () => {
    expect(endedSetup(RUNNING, { exitCode: 0, failure: null }, 9)).toEqual({ ...RUNNING, state: "succeeded", exitCode: 0, endedAt: 9 });
    expect(endedSetup(RUNNING, { exitCode: 3, failure: null }, 9)).toEqual({ ...RUNNING, state: "failed", exitCode: 3, endedAt: 9 });
    expect(endedSetup({ ...RUNNING, failedCopies: [{ path: ".env.secret", why: "EACCES" }] }, { exitCode: 0, failure: null }, 9)).toMatchObject({ state: "failed", exitCode: 0 });
    expect(endedSetup({ ...RUNNING, failure: "git failed" }, { exitCode: 0, failure: null }, 9)).toMatchObject({ state: "failed", failure: "git failed" });
    expect(endedSetup(RUNNING, { exitCode: 0, failure: "The setup pane ended before its command did." }, 9)).toMatchObject({ state: "failed", exitCode: 0, failure: "The setup pane ended before its command did." });
  });
});
