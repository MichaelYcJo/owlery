import { chmodSync, existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { afterAll, describe, expect, it } from "vitest";
import type { Opener } from "../src/main/links";
import { chooseFinder, type Finder, finderAct, pathsOf, showInFinder, standsAt } from "../src/main/paths";

// A temporary folder that stands for a disk: a worktree with a file and a folder in it, a home folder, and the folders Finder is asked about. No case opens Finder: the two acts are handed in.
const base = realpathSync(mkdtempSync(join(tmpdir(), "owlery-paths-")));
const worktree = join(base, "worktree");
const home = join(base, "home");
mkdirSync(join(worktree, "src", "main"), { recursive: true });
writeFileSync(join(worktree, "src", "a.ts"), "");
mkdirSync(join(home, "notes"), { recursive: true });
writeFileSync(join(home, "notes", "today.md"), "");
symlinkSync(join(worktree, "src"), join(base, "link-to-src"));
// A bundle is a folder whose name holds a dot. One of the two is a checkout as well.
mkdirSync(join(base, "Thing.app"));
// A link whose own name holds no dot, to a folder named as a bundle, and one whose name holds a dot, to a plain folder.
symlinkSync(join(base, "Thing.app"), join(base, "link-to-thing"));
symlinkSync(join(worktree, "src"), join(base, "link.to-src"));
mkdirSync(join(base, "my.project", ".git"), { recursive: true });
// A linked worktree holds `.git` as a file.
mkdirSync(join(base, "linked.tree"));
writeFileSync(join(base, "linked.tree", ".git"), "gitdir: elsewhere\n");
mkdirSync(join(base, ".config"));

afterAll(() => rmSync(base, { recursive: true, force: true }));

describe("standsAt", () => {
  it("answers a path from the root with the whole path and whether a folder stands there", async () => {
    expect(await standsAt(null, join(worktree, "src", "a.ts"), home)).toEqual({ path: join(worktree, "src", "a.ts"), folder: false });
    expect(await standsAt(null, join(worktree, "src"), home)).toEqual({ path: join(worktree, "src"), folder: true });
    // The worktree is not read for a path from the root.
    expect(await standsAt(join(base, "elsewhere"), join(worktree, "src"), home)).toEqual({ path: join(worktree, "src"), folder: true });
  });

  it("reads any other path from the worktree", async () => {
    expect(await standsAt(worktree, "src/a.ts", home)).toEqual({ path: join(worktree, "src", "a.ts"), folder: false });
    expect(await standsAt(worktree, "./src/main", home)).toEqual({ path: join(worktree, "src", "main"), folder: true });
  });

  it("resolves every dot and every step up, and a slash at the end", async () => {
    expect(await standsAt(worktree, "src/main/../a.ts", home)).toEqual({ path: join(worktree, "src", "a.ts"), folder: false });
    expect(await standsAt(worktree, "../worktree/./src/", home)).toEqual({ path: join(worktree, "src"), folder: true });
    expect(await standsAt(null, `${worktree}/src/main/../../src`, home)).toEqual({ path: join(worktree, "src"), folder: true });
  });

  it("reads a path that opens with a tilde and a slash from the home folder handed in", async () => {
    expect(await standsAt(worktree, "~/notes/today.md", home)).toEqual({ path: join(home, "notes", "today.md"), folder: false });
    expect(await standsAt(null, "~/notes", home)).toEqual({ path: join(home, "notes"), folder: true });
    // A tilde with a name after it is another person's home, which is not read: it is a folder's name in the worktree.
    expect(await standsAt(worktree, "~notes/today.md", home)).toBeNull();
  });

  it("answers the link's own path where the path is a link to a folder", async () => {
    expect(await standsAt(null, join(base, "link-to-src"), home)).toEqual({ path: join(base, "link-to-src"), folder: true });
  });

  it("answers nothing where nothing stands at the path", async () => {
    expect(await standsAt(worktree, "src/no-such-file.ts", home)).toBeNull();
    expect(await standsAt(null, join(base, "no-such-folder", "a"), home)).toBeNull();
    expect(await standsAt(null, "~/no-such-file", home)).toBeNull();
  });

  it("answers nothing for a path from the worktree where no worktree is named, or the one named is no whole path", async () => {
    expect(await standsAt(null, "src/a.ts", home)).toBeNull();
    // A worktree written from the folder the app runs in would be read from wherever that is.
    expect(await standsAt(relative(process.cwd(), worktree), "src/a.ts", home)).toBeNull();
    expect(await standsAt("", "src/a.ts", home)).toBeNull();
  });

  it.each([["a number", 12], ["a list that reads as a path", [join(worktree, "src")]], ["no value", undefined], ["an empty text", ""], ["a text that holds a null character", `${worktree}/src\u0000`]])("answers nothing for %s", async (_name, text) => {
    expect(await standsAt(worktree, text, home)).toBeNull();
  });
});

describe("pathsOf", () => {
  it("answers each text of the request in its place", async () => {
    expect(await pathsOf(worktree, ["src/a.ts", "src/none", join(worktree, "src"), 12], home)).toEqual([{ path: join(worktree, "src", "a.ts"), folder: false }, null, { path: join(worktree, "src"), folder: true }, null]);
    expect(await pathsOf(worktree, [], home)).toEqual([]);
  });

  it("reads a worktree that is no text as none named", async () => {
    expect(await pathsOf(undefined, ["src/a.ts", join(worktree, "src")], home)).toEqual([null, { path: join(worktree, "src"), folder: true }]);
    expect(await pathsOf([worktree], ["src/a.ts"], home)).toEqual([null]);
  });

  it("answers nothing for a request whose texts are no list", async () => {
    expect(await pathsOf(worktree, "src/a.ts", home)).toEqual([]);
    expect(await pathsOf(worktree, undefined, home)).toEqual([]);
  });
});

describe("finderAct", () => {
  it("has a file selected in its folder, whatever its name", () => {
    expect(finderAct("a.ts", false, false)).toBe("select");
    expect(finderAct("Makefile", false, false)).toBe("select");
  });

  it("has a folder opened", () => {
    expect(finderAct("src", true, false)).toBe("open");
    expect(finderAct("project", true, true)).toBe("open");
    // A dot that opens the name is no ending.
    expect(finderAct(".config", true, false)).toBe("open");
  });

  it("has a folder whose name holds a dot after its first character selected, unless it is a checkout", () => {
    expect(finderAct("Thing.app", true, false)).toBe("select");
    expect(finderAct(".hidden.d", true, false)).toBe("select");
    expect(finderAct("my.project", true, true)).toBe("open");
  });
});

/** The two acts of Finder as stand-ins that note the path they were handed and answer `shown`. */
function noting(shown = true): { selected: string[]; opened: string[]; finder: Finder } {
  const selected: string[] = [];
  const opened: string[] = [];
  const act =
    (handed: string[]): Opener =>
    async (path) => {
      handed.push(path);
      return shown;
    };
  return { selected, opened, finder: { select: act(selected), open: act(opened) } };
}

describe("showInFinder", () => {
  it("has a file selected, and answers that it was shown", async () => {
    const { selected, opened, finder } = noting();
    expect(await showInFinder(join(worktree, "src", "a.ts"), finder)).toBe(true);
    expect({ selected, opened }).toEqual({ selected: [join(worktree, "src", "a.ts")], opened: [] });
  });

  it("has a folder opened", async () => {
    const { selected, opened, finder } = noting();
    expect(await showInFinder(join(worktree, "src"), finder)).toBe(true);
    expect(await showInFinder(join(base, ".config"), finder)).toBe(true);
    expect({ selected, opened }).toEqual({ selected: [], opened: [join(worktree, "src"), join(base, ".config")] });
  });

  it("has a folder named as a bundle selected, and opened where it holds .git at its top, as a folder or as a file", async () => {
    const { selected, opened, finder } = noting();
    expect(await showInFinder(join(base, "Thing.app"), finder)).toBe(true);
    expect(await showInFinder(join(base, "my.project"), finder)).toBe(true);
    expect(await showInFinder(join(base, "linked.tree"), finder)).toBe(true);
    expect({ selected, opened }).toEqual({ selected: [join(base, "Thing.app")], opened: [join(base, "my.project"), join(base, "linked.tree")] });
  });

  it("reads a link by what it leads to, its name too, and hands the act the link's own path", async () => {
    const { selected, opened, finder } = noting();
    // A link to a bundle is a bundle, whatever the link is called: opening it would start the app.
    expect(await showInFinder(join(base, "link-to-thing"), finder)).toBe(true);
    // A link to a plain folder is a plain folder, though the link's own name holds a dot.
    expect(await showInFinder(join(base, "link.to-src"), finder)).toBe(true);
    expect({ selected, opened }).toEqual({ selected: [join(base, "link-to-thing")], opened: [join(base, "link.to-src")] });
  });

  it("hands the act the whole path, with every dot and every step up resolved", async () => {
    const { selected, opened, finder } = noting();
    expect(await showInFinder(`${worktree}/src/main/../a.ts`, finder)).toBe(true);
    expect(await showInFinder(`${base}/worktree/../Thing.app/`, finder)).toBe(true);
    expect({ selected, opened }).toEqual({ selected: [join(worktree, "src", "a.ts"), join(base, "Thing.app")], opened: [] });
  });

  it.each([
    ["a path nothing stands at", join(worktree, "src", "no-such-file.ts")],
    ["a path that does not open with a slash", "src/a.ts"],
    ["a path from the home folder", "~/notes/today.md"],
    ["an address", "https://example.com/"],
    ["an empty text", ""],
    ["a list that reads as a path", [join(worktree, "src")]],
    ["no value", undefined],
  ])("calls neither act for %s, and answers that nothing was shown", async (_name, path) => {
    const { selected, opened, finder } = noting();
    expect(await showInFinder(path, finder)).toBe(false);
    expect({ selected, opened }).toEqual({ selected: [], opened: [] });
  });

  it("answers that nothing was shown where the act showed nothing", async () => {
    expect(await showInFinder(join(worktree, "src"), noting(false).finder)).toBe(false);
    expect(await showInFinder(join(worktree, "src", "a.ts"), noting(false).finder)).toBe(false);
  });
});

describe("chooseFinder", () => {
  const shownFile = join(base, "shown");
  // A program that writes each argument it was started with on a line of its own.
  const program = join(base, "shower.sh");
  writeFileSync(program, `#!/bin/sh\nprintf '%s\\n' "$@" >> '${shownFile}'\n`);
  chmodSync(program, 0o755);

  it("runs the program named with the path as its one argument for either act, in the background too, and never the system's", async () => {
    const system = noting();
    const finder = chooseFinder(program, true, system.finder);
    expect(await showInFinder(join(worktree, "src", "a.ts"), finder)).toBe(true);
    expect(await showInFinder(join(worktree, "src"), finder)).toBe(true);
    expect(readFileSync(shownFile, "utf8")).toBe(`${join(worktree, "src", "a.ts")}\n${join(worktree, "src")}\n`);
    expect({ selected: system.selected, opened: system.opened }).toEqual({ selected: [], opened: [] });
  });

  it("shows nothing in the background where no program is named, and answers so", async () => {
    const system = noting();
    rmSync(shownFile, { force: true });
    const finder = chooseFinder(null, true, system.finder);
    expect(await showInFinder(join(worktree, "src", "a.ts"), finder)).toBe(false);
    expect(await showInFinder(join(worktree, "src"), finder)).toBe(false);
    expect({ selected: system.selected, opened: system.opened }).toEqual({ selected: [], opened: [] });
    expect(existsSync(shownFile)).toBe(false);
  });

  it("calls the system's two acts where no program is named and the app is not in the background", async () => {
    const system = noting();
    const finder = chooseFinder(null, false, system.finder);
    expect(await showInFinder(join(worktree, "src", "a.ts"), finder)).toBe(true);
    expect(await showInFinder(join(worktree, "src"), finder)).toBe(true);
    expect({ selected: system.selected, opened: system.opened }).toEqual({ selected: [join(worktree, "src", "a.ts")], opened: [join(worktree, "src")] });
  });
});
