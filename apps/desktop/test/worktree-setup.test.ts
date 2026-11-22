import { execFileSync } from "node:child_process";
import { chmodSync, lstatSync, mkdirSync, readFileSync, readdirSync, readlinkSync, rmSync, statSync, symlinkSync, writeFileSync, existsSync } from "node:fs";
import { link, rm } from "node:fs/promises";
import { basename, dirname, join } from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import { beginSetup, copyIncluded, endedSetup, readSetup } from "../src/daemon/worktree-setup";
import { git, temporaryRepository } from "./repositories";

// No volume the suite runs on refuses a hard link, and nothing else writes in a staging folder while it is removed, so a case swaps in the refusal or the writer; every other case links and removes as the system does.
vi.mock("node:fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof import("node:fs/promises")>();
  return { ...actual, link: vi.fn(actual.link), rm: vi.fn(actual.rm) };
});

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

/** Gives the owner back read, write and search on everything under `base` before the case's folders are removed, which a folder it kept read-only would refuse. */
function removableAfter(base: string): void {
  cleanups.push(() => execFileSync("chmod", ["-R", "u+rwx", base]));
}

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
    // Each path is cloned into a folder of its own beside its place, one folder down, then moved into it.
    const beside = (path: string) => expect.stringMatching(new RegExp(`^-c -R -P ${join(repo, path)} ${join(worktree, dirname(path), ".owlery-copy-[^/]+", "copy", basename(path))}$`));
    expect(clone.calls()).toEqual([beside("apps/web/.env.local"), beside("node_modules")]);
    expect(readdirSync(worktree).filter((name) => name.startsWith(".owlery-copy-"))).toEqual([]);
    for (const path of ["apps/web/.env.local", "node_modules/pkg/index.js"]) expect(readFileSync(join(worktree, path), "utf8")).toBe(readFileSync(join(repo, path), "utf8"));
    expect(readlinkSync(join(worktree, "node_modules", ".bin", "tool"))).toBe("../pkg/index.js");
    expect(readFileSync(join(worktree, ".env"), "utf8")).toBe("KEY=worktree\n");
  });

  it("shows git nothing of a copy before it stands in its place, where the repository's patterns are anchored at its top", async () => {
    const { repo, worktree, base } = repositoryWithIgnoredFiles();
    for (const checkout of [repo, worktree]) writeFileSync(join(checkout, ".gitignore"), "/.env\n/node_modules/\n");
    git(worktree, "commit", "--quiet", "-am", "anchored");
    writeFileSync(join(repo, ".worktreeinclude"), ".env\nnode_modules/\n");
    // What git, and so a command in the person's pane, lists in the worktree once each clone has written its copy.
    const listed = join(base, "status.log");
    const clone = clonedBy(base, `/bin/cp "$@" && git -C "${worktree}" status --porcelain --untracked-files=all >> "${listed}"`);
    expect(await copyIncluded(repo, worktree, clone.program)).toEqual({ copied: [".env", "node_modules/"], copiedCount: 2, failed: [], failure: null });
    expect(clone.calls()).toHaveLength(2);
    expect(readFileSync(listed, "utf8")).toBe("");
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
    // A clone that fails half way: it leaves a folder at each target, with a stray file in it and a folder it kept read-only, as `cp` gives a folder the source's mode.
    removableAfter(base);
    const clone = clonedBy(base, 'mkdir -p "$5/kept" && echo stray > "$5/stray" && echo stray > "$5/kept/stray" && chmod 555 "$5/kept"\nexit 1');
    expect(await copyIncluded(repo, worktree, clone.program)).toEqual({ copied: [".env", "node_modules/"], copiedCount: 2, failed: [], failure: null });
    expect(clone.calls()).toHaveLength(2);
    expect(readFileSync(join(worktree, ".env"), "utf8")).toBe("KEY=main\n");
    expect(readFileSync(join(worktree, "node_modules", "pkg", "index.js"), "utf8")).toBe("module.exports = 1;\n");
    expect(existsSync(join(worktree, "node_modules", "stray"))).toBe(false);
    expect(existsSync(join(worktree, "node_modules", "kept"))).toBe(false);
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

  it("leaves nothing of a path it could not copy, the folders it made for it among them and a folder the source keeps read-only, and follows no link in the copy, so a copy again copies the path whole", async () => {
    const { repo, worktree, base } = repositoryWithIgnoredFiles();
    for (const name of ["a.js", "m.js", "z.js"]) writeFileSync(join(repo, "node_modules", "pkg", name), `${name}\n`);
    const unreadable = [join(repo, "node_modules", "pkg", "m.js"), join(repo, "apps", "web", ".env.local")];
    for (const file of unreadable) chmodSync(file, 0o000);
    cleanups.push(() => {
      for (const file of unreadable) chmodSync(file, 0o600);
    });
    // `cp` gives the copy of a folder the source's mode, so the copy holds a folder the daemon cannot remove anything from as it stands.
    removableAfter(base);
    mkdirSync(join(repo, "node_modules", "pkg", "kept"));
    writeFileSync(join(repo, "node_modules", "pkg", "kept", "index.js"), "kept\n");
    chmodSync(join(repo, "node_modules", "pkg", "kept"), 0o555);
    // A link in the copy to a read-only folder outside the worktree, whose mode the removal leaves as it is.
    const outside = join(base, "outside");
    mkdirSync(outside);
    writeFileSync(join(outside, "keep.txt"), "keep\n");
    chmodSync(outside, 0o555);
    symlinkSync(outside, join(repo, "node_modules", "pkg", "outside"));
    writeFileSync(join(repo, ".worktreeinclude"), "**/.env.local\nnode_modules/\n");
    const copy = await copyIncluded(repo, worktree);
    expect([copy.copied, copy.failed]).toEqual([[], [{ path: "apps/web/.env.local", why: expect.stringContaining("EACCES") }, { path: "node_modules/", why: expect.stringContaining("EACCES") }]]);
    expect(readdirSync(worktree).sort()).toEqual([".env.example", ".git", ".gitignore", "README.md"]);
    expect(statSync(outside).mode & 0o777).toBe(0o555);
    for (const file of unreadable) chmodSync(file, 0o600);
    expect(await copyIncluded(repo, worktree)).toEqual({ copied: ["apps/web/.env.local", "node_modules/"], copiedCount: 2, failed: [], failure: null });
    expect(readdirSync(join(worktree, "node_modules", "pkg")).sort()).toEqual(["a.js", "index.js", "kept", "m.js", "outside", "z.js"]);
  });

  it("names in a failed path's error the staging folder it could not remove, which stays as git ignores it, and a later setup removes it", async () => {
    const { repo, worktree } = repositoryWithIgnoredFiles();
    const { rm: removed } = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
    cleanups.push(() => vi.mocked(rm).mockImplementation(removed));
    writeFileSync(join(repo, ".env.secret"), "SECRET=1\n");
    chmodSync(join(repo, ".env.secret"), 0o000);
    cleanups.push(() => chmodSync(join(repo, ".env.secret"), 0o600));
    writeFileSync(join(repo, ".worktreeinclude"), ".env.secret\n");
    // A copy the daemon cannot make removable, as one a flag of the system holds, refuses its removal however its modes stand.
    vi.mocked(rm).mockImplementation(async (path, options) => {
      const at = String(path);
      if (basename(at) === "copy" && basename(dirname(at)).startsWith(".owlery-copy-")) throw Object.assign(new Error(`EPERM: operation not permitted, unlink '${at}'`), { code: "EPERM" });
      return removed(path, options);
    });
    const copy = await copyIncluded(repo, worktree);
    const staging = readdirSync(worktree).filter((name) => name.startsWith(".owlery-copy-"));
    expect(staging).toHaveLength(1);
    const left = staging[0] ?? "";
    // The copy's own error first, then the folder that stayed.
    expect(copy.failed).toEqual([{ path: ".env.secret", why: expect.stringContaining(`; its staging folder ${left} stayed beside it, which git ignores: EPERM`) }]);
    expect(copy.failed[0]?.why).toMatch(/^EACCES/);
    expect(readFileSync(join(worktree, left, ".gitignore"), "utf8")).toBe("*\n");
    expect(git(worktree, "status", "--porcelain", "--untracked-files=all")).toBe("");
    vi.mocked(rm).mockImplementation(removed);
    chmodSync(join(repo, ".env.secret"), 0o600);
    expect(await copyIncluded(repo, worktree)).toEqual({ copied: [".env.secret"], copiedCount: 1, failed: [], failure: null });
    expect(readdirSync(worktree).filter((name) => name.startsWith(".owlery-copy-"))).toEqual([]);
  });

  it("removes the staging folders a stopped copy left beside a path, whether the path is copied or stands, and no folder it did not write", async () => {
    const { repo, worktree } = repositoryWithIgnoredFiles();
    writeFileSync(join(repo, ".worktreeinclude"), ".env\n**/.env.local\n");
    // `.env` stands in the worktree and is not copied again; the folder its stopped copy left goes all the same.
    writeFileSync(join(worktree, ".env"), "KEY=worktree\n");
    for (const left of [join(worktree, ".owlery-copy-Ab12Cd"), join(worktree, "apps", "web", ".owlery-copy-Ef34Gh")]) {
      mkdirSync(join(left, "copy"), { recursive: true });
      writeFileSync(join(left, ".gitignore"), "*\n");
      writeFileSync(join(left, "copy", ".env"), "KEY=par");
    }
    // A copy stopped before it wrote the folder's `.gitignore` left it empty.
    mkdirSync(join(worktree, ".owlery-copy-Ij56Kl"));
    // The person's: a folder of that name that holds no such `.gitignore`, and an empty folder.
    mkdirSync(join(worktree, ".owlery-copy-person"));
    writeFileSync(join(worktree, ".owlery-copy-person", "notes.txt"), "mine\n");
    mkdirSync(join(worktree, "logs"));
    expect(await copyIncluded(repo, worktree)).toEqual({ copied: ["apps/web/.env.local"], copiedCount: 1, failed: [], failure: null });
    expect(readdirSync(worktree).sort()).toEqual([".env", ".env.example", ".git", ".gitignore", ".owlery-copy-person", "README.md", "apps", "logs"]);
    expect(readdirSync(join(worktree, "apps", "web"))).toEqual([".env.local"]);
    expect(readFileSync(join(worktree, ".owlery-copy-person", "notes.txt"), "utf8")).toBe("mine\n");
  });

  it("leaves a link of a staging folder's name as it is, and removes nothing in the folder it leads to", async () => {
    const { repo, worktree, base } = repositoryWithIgnoredFiles();
    writeFileSync(join(repo, ".worktreeinclude"), ".env\n");
    // A folder outside the worktree that holds what a staging folder holds, which a link the branch tracks could lead to.
    const outside = join(base, "outside");
    mkdirSync(join(outside, "copy", "deep"), { recursive: true });
    writeFileSync(join(outside, ".gitignore"), "*\n");
    writeFileSync(join(outside, "copy", "notes.txt"), "mine\n");
    writeFileSync(join(outside, "copy", "deep", "work.txt"), "work\n");
    symlinkSync(outside, join(worktree, ".owlery-copy-Zz99Yy"));
    expect(await copyIncluded(repo, worktree)).toEqual({ copied: [".env"], copiedCount: 1, failed: [], failure: null });
    expect(readFileSync(join(outside, "copy", "notes.txt"), "utf8")).toBe("mine\n");
    expect(readFileSync(join(outside, "copy", "deep", "work.txt"), "utf8")).toBe("work\n");
    expect(readFileSync(join(outside, ".gitignore"), "utf8")).toBe("*\n");
    expect(readlinkSync(join(worktree, ".owlery-copy-Zz99Yy"))).toBe(outside);
  });

  it("removes the copy in a staging folder before its .gitignore, so a folder whose copy something still writes stays as git ignores it, and a later setup removes it", async () => {
    const { repo, worktree } = repositoryWithIgnoredFiles();
    const { rm: removed } = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
    cleanups.push(() => vi.mocked(rm).mockImplementation(removed));
    for (const checkout of [repo, worktree]) writeFileSync(join(checkout, ".gitignore"), "/.env\n/node_modules/\n");
    git(worktree, "commit", "--quiet", "-am", "anchored");
    writeFileSync(join(repo, ".worktreeinclude"), ".env\n");
    const left = join(worktree, ".owlery-copy-Ab12Cd");
    mkdirSync(join(left, "copy", "node_modules"), { recursive: true });
    writeFileSync(join(left, ".gitignore"), "*\n");
    writeFileSync(join(left, "copy", "node_modules", "index.js"), "module.exports = 1;\n");
    // A `cp` a stopped daemon started still writes in the `copy/` of each staging folder, so a removal of that folder fails, and a removal of the staging folder takes all else it holds, then fails.
    const notEmpty = (path: string) => Object.assign(new Error(`ENOTEMPTY: directory not empty, rmdir '${path}'`), { code: "ENOTEMPTY" });
    vi.mocked(rm).mockImplementation(async (path, options) => {
      const at = String(path);
      if (basename(at) === "copy" && basename(dirname(at)).startsWith(".owlery-copy-")) throw notEmpty(at);
      if (basename(at).startsWith(".owlery-copy-") && existsSync(join(at, "copy"))) {
        for (const name of readdirSync(at)) if (name !== "copy") await removed(join(at, name), options);
        throw notEmpty(at);
      }
      return removed(path, options);
    });
    expect(await copyIncluded(repo, worktree)).toEqual({ copied: [".env"], copiedCount: 1, failed: [], failure: null });
    const staging = readdirSync(worktree).filter((name) => name.startsWith(".owlery-copy-"));
    // The folder the stopped copy left, and the one this copy wrote, whose own removal the writer defeats too.
    expect(staging).toHaveLength(2);
    for (const name of staging) expect(readFileSync(join(worktree, name, ".gitignore"), "utf8")).toBe("*\n");
    expect(git(worktree, "status", "--porcelain", "--untracked-files=all")).toBe("");
    // The `cp` has ended.
    vi.mocked(rm).mockImplementation(removed);
    expect(await copyIncluded(repo, worktree)).toEqual({ copied: [], copiedCount: 0, failed: [], failure: null });
    expect(readdirSync(worktree).filter((name) => name.startsWith(".owlery-copy-"))).toEqual([]);
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

  it("copies a file where the worktree's volume makes no hard link, with its mode, over nothing that came to stand meanwhile, and fails a path whose link is refused for another reason", async () => {
    const { repo, worktree, base } = repositoryWithIgnoredFiles();
    const { link: linked } = await vi.importActual<typeof import("node:fs/promises")>("node:fs/promises");
    cleanups.push(() => vi.mocked(link).mockImplementation(linked));
    const refused = (code: string) => Object.assign(new Error(`${code}: refused, link`), { code });
    chmodSync(join(repo, ".env"), 0o600);
    writeFileSync(join(repo, ".worktreeinclude"), ".env\n");
    const worktreeFor = (name: string) => {
      const other = join(base, name);
      git(repo, "worktree", "add", "--quiet", "-b", `owlery/${name}`, other);
      return other;
    };
    // A volume that makes no hard link refuses one with ENOTSUP, as exFAT does on macOS, or with EPERM; a link across volumes is refused with EXDEV.
    for (const code of ["ENOTSUP", "EXDEV", "EPERM"]) {
      const other = worktreeFor(code);
      vi.mocked(link).mockImplementation(() => Promise.reject(refused(code)));
      expect(await copyIncluded(repo, other)).toEqual({ copied: [".env"], copiedCount: 1, failed: [], failure: null });
      expect(readFileSync(join(other, ".env"), "utf8")).toBe("KEY=main\n");
      expect(statSync(join(other, ".env")).mode & 0o777).toBe(0o600);
    }
    // The person's command writes the path as its link is refused.
    vi.mocked(link).mockImplementation((_, target) => {
      writeFileSync(target, "PERSON=1\n");
      return Promise.reject(refused("ENOTSUP"));
    });
    expect(await copyIncluded(repo, worktree)).toEqual({ copied: [], copiedCount: 0, failed: [{ path: ".env", why: "it came to stand in the worktree during the copy, and was left as it is" }], failure: null });
    expect(readFileSync(join(worktree, ".env"), "utf8")).toBe("PERSON=1\n");
    const other = worktreeFor("EIO");
    vi.mocked(link).mockImplementation(() => Promise.reject(refused("EIO")));
    expect(await copyIncluded(repo, other)).toEqual({ copied: [], copiedCount: 0, failed: [{ path: ".env", why: "EIO: refused, link" }], failure: null });
    expect(existsSync(join(other, ".env"))).toBe(false);
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
    expect(await beginSetup(repo, worktree, clock(5), null)).toBeNull();
    expect(git(worktree, "ls-files", "--others", "--ignored", "--exclude-standard", "--directory")).toBe("");
  });

  it("gives a running setup where the command shown stands, and an ended one at once where only .worktreeinclude does, by the copy", async () => {
    const { repo, worktree } = repositoryWithIgnoredFiles();
    writeFileSync(join(repo, ".worktreesetup"), "pnpm install\n");
    expect(await beginSetup(repo, worktree, clock(5), "pnpm install\n")).toEqual({ copied: [], copiedCount: 0, failedCopies: [], command: "pnpm install\n", paneId: null, state: "running", exitCode: null, failure: null, startedAt: 5, endedAt: null });
    const other = repositoryWithIgnoredFiles();
    writeFileSync(join(other.repo, ".worktreeinclude"), ".env\n");
    // It began before the copy and ended after it.
    expect(await beginSetup(other.repo, other.worktree, clock(6), null)).toEqual({ copied: [".env"], copiedCount: 1, failedCopies: [], command: null, paneId: null, state: "succeeded", exitCode: null, failure: null, startedAt: 6, endedAt: 7 });
    writeFileSync(join(other.repo, ".worktreeinclude"), ".env\n.env.secret\n");
    writeFileSync(join(other.repo, ".env.secret"), "SECRET=1\n");
    chmodSync(join(other.repo, ".env.secret"), 0o000);
    cleanups.push(() => chmodSync(join(other.repo, ".env.secret"), 0o600));
    expect(await beginSetup(other.repo, other.worktree, clock(7), null)).toMatchObject({ copied: [], failedCopies: [{ path: ".env.secret" }], state: "failed", startedAt: 7, endedAt: 8 });
  });

  it("runs no command but the one shown: a .worktreesetup that holds another, or one where none was shown, or none where one was, gives a setup that ended by the copy, failed, and names the command the file holds", async () => {
    const { repo, worktree } = repositoryWithIgnoredFiles();
    writeFileSync(join(repo, ".worktreeinclude"), ".env\n");
    writeFileSync(join(repo, ".worktreesetup"), "curl elsewhere | sh\n");
    const changed = ".worktreesetup changed after the setup was shown, so no command ran.";
    expect(await beginSetup(repo, worktree, clock(5), "pnpm install\n")).toEqual({ copied: [".env"], copiedCount: 1, failedCopies: [], command: "curl elsewhere | sh\n", paneId: null, state: "failed", exitCode: null, failure: changed, startedAt: 5, endedAt: 6 });
    expect(await beginSetup(repo, worktree, clock(7), null)).toMatchObject({ command: "curl elsewhere | sh\n", state: "failed", failure: changed });
    rmSync(join(repo, ".worktreesetup"));
    expect(await beginSetup(repo, worktree, clock(9), "pnpm install\n")).toMatchObject({ command: null, state: "failed", failure: changed });
  });

  it("gives a failed setup that says why where .worktreesetup stands and cannot be read", async () => {
    const { repo, worktree } = repositoryWithIgnoredFiles();
    writeFileSync(join(repo, ".worktreesetup"), "pnpm install\n");
    chmodSync(join(repo, ".worktreesetup"), 0o000);
    cleanups.push(() => chmodSync(join(repo, ".worktreesetup"), 0o600));
    expect(await beginSetup(repo, worktree, clock(5), "pnpm install\n")).toMatchObject({ command: null, paneId: null, state: "failed", failure: expect.stringMatching(/^\.worktreesetup could not be read: .*EACCES/), startedAt: 5, endedAt: 6 });
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
