import { describe, expect, it } from "vitest";
import { appFolders, copyText, installedApps, KNOWN_APPS, openFolder, type Openers } from "../src/main/openers";

const HOME = "/Users/someone";

/** A work item's worktree, and a repository's folder: each holds `.git` at its top. */
const WORKTREE = "/w/project/fix login";
const REPOSITORY = "/r/project";

/** What the main process hands the openers, with a Mac that holds the bundles given, the two folders above with their `.git`, and nothing else, and what was run and opened. `others` are more paths the Mac holds. */
function mac(bundles: readonly string[], fails: { run?: string; openPath?: string } = {}, others: readonly string[] = []) {
  const ran: [string, string[]][] = [];
  const opened: string[] = [];
  const held = [...bundles, WORKTREE, `${WORKTREE}/.git`, REPOSITORY, `${REPOSITORY}/.git`, ...others];
  const openers: Openers = {
    exists: (path) => held.includes(path),
    home: HOME,
    run: async (command, args) => {
      ran.push([command, args]);
      if (fails.run !== undefined) throw new Error(fails.run);
    },
    openPath: async (folder) => {
      opened.push(folder);
      return fails.openPath ?? "";
    },
  };
  return { openers, ran, opened };
}

describe("installedApps", () => {
  it("knows the editors Visual Studio Code, Cursor, Zed, Sublime Text and Xcode and the terminals Terminal, iTerm, Ghostty and Warp, each by its bundle's name", () => {
    expect(KNOWN_APPS.map(({ name, kind, bundle }) => [name, kind, bundle])).toEqual([
      ["Visual Studio Code", "editor", "Visual Studio Code.app"],
      ["Cursor", "editor", "Cursor.app"],
      ["Zed", "editor", "Zed.app"],
      ["Sublime Text", "editor", "Sublime Text.app"],
      ["Xcode", "editor", "Xcode.app"],
      ["Terminal", "terminal", "Terminal.app"],
      ["iTerm", "terminal", "iTerm.app"],
      ["Ghostty", "terminal", "Ghostty.app"],
      ["Warp", "terminal", "Warp.app"],
    ]);
  });

  it("looks for a bundle in the folders apps are installed in, the person's own among them", () => {
    expect(appFolders(HOME)).toEqual(["/Applications", "/Applications/Utilities", "/System/Applications", "/System/Applications/Utilities", "/Users/someone/Applications"]);
  });

  it("gives the known apps whose bundle exists, the editors before the terminals, and none whose bundle does not", () => {
    const { openers } = mac(["/Applications/Warp.app", "/System/Applications/Utilities/Terminal.app", "/Applications/Xcode.app", "/Users/someone/Applications/Zed.app", "/Applications/Notes.app", "/Applications/Utilities/iTerm.app"]);
    expect(installedApps(openers.exists, HOME)).toEqual([
      { name: "Zed", kind: "editor", path: "/Users/someone/Applications/Zed.app" },
      { name: "Xcode", kind: "editor", path: "/Applications/Xcode.app" },
      { name: "Terminal", kind: "terminal", path: "/System/Applications/Utilities/Terminal.app" },
      { name: "iTerm", kind: "terminal", path: "/Applications/Utilities/iTerm.app" },
      { name: "Warp", kind: "terminal", path: "/Applications/Warp.app" },
    ]);
    expect(installedApps(() => false, HOME)).toEqual([]);
  });

  it("gives an app that stands in two of the folders once, at the first of them", () => {
    const { openers } = mac(["/Users/someone/Applications/Cursor.app", "/Applications/Cursor.app"]);
    expect(installedApps(openers.exists, HOME)).toEqual([{ name: "Cursor", kind: "editor", path: "/Applications/Cursor.app" }]);
  });
});

describe("openFolder", () => {
  it("opens a folder in an installed app by running `open` with `-a`, the bundle's path and the folder, and answers no error", async () => {
    const { openers, ran, opened } = mac(["/Applications/Visual Studio Code.app"]);
    expect(await openFolder(WORKTREE, "Visual Studio Code", openers)).toBeNull();
    expect(ran).toEqual([["open", ["-a", "/Applications/Visual Studio Code.app", "/w/project/fix login"]]]);
    expect(opened).toEqual([]);
  });

  it("opens a folder in Finder, where no app is named, through the function it was handed, and runs nothing", async () => {
    const { openers, ran, opened } = mac(["/Applications/Xcode.app"]);
    expect(await openFolder(WORKTREE, null, openers)).toBeNull();
    expect(await openFolder(REPOSITORY, null, openers)).toBeNull();
    expect(opened).toEqual([WORKTREE, REPOSITORY]);
    expect(ran).toEqual([]);
  });

  it("opens nothing at a path that holds no `.git` at its top, in Finder or in an installed app, and says what it opens: a file, an app's bundle and a plain folder are no work item's folder and no repository's", async () => {
    const { openers, ran, opened } = mac(["/Applications/Xcode.app"], {}, ["/Applications/Calculator.app", "/w/project/fix login/notes.txt", "/w/plain", "/w/project"]);
    for (const path of ["/Applications/Calculator.app", "/Applications/Xcode.app", "/w/project/fix login/notes.txt", "/w/plain", "/w/project"]) {
      expect(await openFolder(path, null, openers)).toBe("Owlery opens a work item's folder or a repository's folder, and nothing else.");
      expect(await openFolder(path, "Xcode", openers)).toBe("Owlery opens a work item's folder or a repository's folder, and nothing else.");
    }
    expect([ran, opened]).toEqual([[], []]);
  });

  it("says that a folder is gone where nothing stands at its path, and opens nothing", async () => {
    const { openers, ran, opened } = mac(["/Applications/Xcode.app"]);
    expect(await openFolder("/w/project/removed", null, openers)).toBe("/w/project/removed is gone.");
    expect(await openFolder("/w/project/removed", "Xcode", openers)).toBe("/w/project/removed is gone.");
    expect([ran, opened]).toEqual([[], []]);
  });

  it("runs nothing for an app that is not of its list, though a bundle of that name exists, and for a known app that is not installed, and answers an error", async () => {
    const { openers, ran, opened } = mac(["/Applications/Notes.app", "/Applications/Xcode.app"]);
    expect(await openFolder(WORKTREE, "Notes", openers)).toBe("Notes is not an app Owlery opens a folder in.");
    expect(await openFolder(WORKTREE, "/Applications/Notes.app", openers)).toBe("/Applications/Notes.app is not an app Owlery opens a folder in.");
    expect(await openFolder(WORKTREE, "Cursor", openers)).toBe("Cursor is not installed.");
    expect(await openFolder(WORKTREE, 7, openers)).toBe("7 is not an app Owlery opens a folder in.");
    expect([ran, opened]).toEqual([[], []]);
  });

  it("opens no folder whose path is not whole from /, in an app or in Finder: `open` would read one that starts with a dash as an option", async () => {
    const { openers, ran, opened } = mac(["/Applications/Xcode.app"]);
    for (const folder of ["-R", "project", "", 7, undefined]) {
      expect(await openFolder(folder, "Xcode", openers)).toBe("A folder is opened by its whole path.");
      expect(await openFolder(folder, null, openers)).toBe("A folder is opened by its whole path.");
    }
    expect([ran, opened]).toEqual([[], []]);
  });

  it("answers the failure's sentence where `open` fails, and where Finder does not open the folder", async () => {
    const app = mac(["/Applications/Xcode.app"], { run: "The application cannot be opened." });
    expect(await openFolder(WORKTREE, "Xcode", app.openers)).toBe("The application cannot be opened.");
    const finder = mac([], { openPath: "Failed to open path" });
    expect(await openFolder(WORKTREE, null, finder.openers)).toBe("Failed to open path");
  });
});

describe("copyText", () => {
  it("writes the text it is given to the writer it was handed, as it is", () => {
    const written: string[] = [];
    copyText("/w/project/fix login ", (text) => written.push(text));
    copyText("owlery/fix-login", (text) => written.push(text));
    expect(written).toEqual(["/w/project/fix login ", "owlery/fix-login"]);
  });

  it("writes nothing that is no text", () => {
    const written: string[] = [];
    copyText(7, (text) => written.push(text));
    copyText(undefined, (text) => written.push(text));
    expect(written).toEqual([]);
  });
});
