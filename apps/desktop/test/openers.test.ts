// layer: logic
import { describe, expect, it } from "vitest";
import { appFolders, copyText, EDITOR_COMMANDS, installedApps, KNOWN_APPS, openFolder, openInEditor, trashFolder, type Openers } from "../src/main/openers";

const HOME = "/Users/someone";

/** A work item's worktree, and a repository's folder: each holds `.git` at its top. */
const WORKTREE = "/w/project/fix login";
const REPOSITORY = "/r/project";

/** What the main process hands the openers, with a Mac that holds the bundles given, the two folders above with their `.git`, and nothing else, and what was run and opened. `others` are more paths the Mac holds, and `files` the paths among them a file stands at. */
function mac(bundles: readonly string[], fails: { run?: string; openPath?: string } = {}, others: readonly string[] = [], files: readonly string[] = []) {
  const ran: [string, string[]][] = [];
  const opened: string[] = [];
  const held = [...bundles, WORKTREE, `${WORKTREE}/.git`, REPOSITORY, `${REPOSITORY}/.git`, ...others, ...files];
  const openers: Openers = {
    exists: (path) => held.includes(path),
    isFile: (path) => files.includes(path),
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

describe("trashFolder", () => {
  /** A stand-in for the system's Trash: it notes each folder it is handed, and fails with `fails` where one is given. Nothing is moved. */
  function trash(fails?: string) {
    const moved: string[] = [];
    return { moved, move: async (folder: string) => { moved.push(folder); if (fails !== undefined) throw new Error(fails); } };
  }

  it("hands the function it was given the repository's folder alone, and answers nothing where the move was made", async () => {
    const { openers } = mac([]);
    const { moved, move } = trash();
    expect(await trashFolder(REPOSITORY, openers.exists, move)).toBeNull();
    expect(moved).toEqual([REPOSITORY]);
  });

  it("answers the failure's sentence where the move fails", async () => {
    const { openers } = mac([]);
    const { moved, move } = trash("The Trash cannot take the folder.");
    expect(await trashFolder(REPOSITORY, openers.exists, move)).toBe("The Trash cannot take the folder.");
    expect(moved).toEqual([REPOSITORY]);
  });

  it("moves no path that is not whole from /, none where nothing stands, and none that holds no `.git` at its top: the folder above a repository, a folder inside one and the person's home among them", async () => {
    const { openers } = mac([], {}, ["/r", `${REPOSITORY}/src`, HOME]);
    const { moved, move } = trash();
    for (const folder of ["project", "", "~", 7, undefined, null]) expect(await trashFolder(folder, openers.exists, move)).toBe("A folder is moved to the Trash by its whole path.");
    expect(await trashFolder("/r/gone", openers.exists, move)).toBe("/r/gone is gone.");
    for (const folder of ["/r", `${REPOSITORY}/src`, HOME]) expect(await trashFolder(folder, openers.exists, move)).toBe("Owlery moves a repository's folder to the Trash, and nothing else.");
    expect(moved).toEqual([]);
  });
});

describe("openInEditor", () => {
  /** A file of a work item's worktree, and the path of each editor's bundle and of the command inside it that takes a line. */
  const FILE = `${WORKTREE}/src/a.ts`;
  const CODE = "/Applications/Visual Studio Code.app";
  const COMMANDS = {
    "Visual Studio Code": `${CODE}/Contents/Resources/app/bin/code`,
    Cursor: "/Applications/Cursor.app/Contents/Resources/app/bin/cursor",
    Zed: "/Applications/Zed.app/Contents/MacOS/cli",
    "Sublime Text": "/Applications/Sublime Text.app/Contents/SharedSupport/bin/subl",
    Xcode: "/usr/bin/xed",
  };
  const ALL_BUNDLES = ["/Applications/Visual Studio Code.app", "/Applications/Cursor.app", "/Applications/Zed.app", "/Applications/Sublime Text.app", "/Applications/Xcode.app"];
  /** A start that is neither in the background nor given a stand-in. */
  const PERSON = { program: null, background: false };

  it("opens a file in the chosen editor by the command inside its bundle, at the line and the column, with no shell (scenario C1)", async () => {
    const { openers, ran, opened } = mac([CODE], {}, [COMMANDS["Visual Studio Code"]], [FILE]);
    expect(await openInEditor(FILE, 12, 5, "Visual Studio Code", openers, PERSON)).toBeNull();
    expect(ran).toEqual([[COMMANDS["Visual Studio Code"], ["--goto", `${FILE}:12:5`]]]);
    expect(opened).toEqual([]);
  });

  it("hands each editor of the list the file and its line in the form its command takes, and the file alone where no line is named", async () => {
    const { openers, ran } = mac(ALL_BUNDLES, {}, Object.values(COMMANDS), [FILE]);
    for (const name of Object.keys(COMMANDS)) {
      await openInEditor(FILE, 12, 5, name, openers, PERSON);
      await openInEditor(FILE, 12, undefined, name, openers, PERSON);
      await openInEditor(FILE, undefined, undefined, name, openers, PERSON);
    }
    expect(ran).toEqual([
      [COMMANDS["Visual Studio Code"], ["--goto", `${FILE}:12:5`]],
      [COMMANDS["Visual Studio Code"], ["--goto", `${FILE}:12`]],
      [COMMANDS["Visual Studio Code"], [FILE]],
      [COMMANDS.Cursor, ["--goto", `${FILE}:12:5`]],
      [COMMANDS.Cursor, ["--goto", `${FILE}:12`]],
      [COMMANDS.Cursor, [FILE]],
      [COMMANDS.Zed, [`${FILE}:12:5`]],
      [COMMANDS.Zed, [`${FILE}:12`]],
      [COMMANDS.Zed, [FILE]],
      [COMMANDS["Sublime Text"], [`${FILE}:12:5`]],
      [COMMANDS["Sublime Text"], [`${FILE}:12`]],
      [COMMANDS["Sublime Text"], [FILE]],
      // Xcode takes no column.
      [COMMANDS.Xcode, ["--line", "12", FILE]],
      [COMMANDS.Xcode, ["--line", "12", FILE]],
      [COMMANDS.Xcode, [FILE]],
    ]);
    // Every editor of the list has its command, and no terminal has one.
    expect(Object.keys(EDITOR_COMMANDS)).toEqual(KNOWN_APPS.filter((known) => known.kind === "editor").map((known) => known.name));
  });

  it("opens the file at no line, by `open -a`, where the editor's command does not stand in its bundle", async () => {
    const { openers, ran } = mac(["/Applications/Zed.app"], {}, [], [FILE]);
    expect(await openInEditor(FILE, 12, 5, "Zed", openers, PERSON)).toBeNull();
    expect(ran).toEqual([["open", ["-a", "/Applications/Zed.app", FILE]]]);
  });

  it("hands no line that is no whole number from 1, and no column without its line", async () => {
    const { openers, ran } = mac([CODE], {}, [COMMANDS["Visual Studio Code"]], [FILE]);
    for (const [line, column] of [
      [0, 5],
      [-1, undefined],
      [1.5, 2],
      ["12", "5"],
      [undefined, 5],
      [null, null],
    ] as const)
      await openInEditor(FILE, line, column, "Visual Studio Code", openers, PERSON);
    await openInEditor(FILE, 12, 0, "Visual Studio Code", openers, PERSON);
    expect(ran).toEqual([...Array(6).fill([COMMANDS["Visual Studio Code"], [FILE]]), [COMMANDS["Visual Studio Code"], ["--goto", `${FILE}:12`]]]);
  });

  it("opens nothing but a whole path a file stands at, read again at the request, and says why (scenario C4)", async () => {
    const { openers, ran, opened } = mac([CODE], {}, [COMMANDS["Visual Studio Code"], `${WORKTREE}/src`], [FILE]);
    for (const path of ["src/a.ts", "-R", "", 7, undefined]) expect(await openInEditor(path, 12, 5, "Visual Studio Code", openers, PERSON)).toBe("A file is opened by its whole path.");
    expect(await openInEditor(`${WORKTREE}/src/gone.ts`, 12, 5, "Visual Studio Code", openers, PERSON)).toBe(`${WORKTREE}/src/gone.ts is gone.`);
    for (const folder of [`${WORKTREE}/src`, WORKTREE, CODE]) expect(await openInEditor(folder, 12, 5, "Visual Studio Code", openers, PERSON)).toBe("Owlery opens a file in an editor, and nothing else.");
    expect([ran, opened]).toEqual([[], []]);
  });

  it("runs no app that is not an editor of its list, though a bundle of that name exists, none that is not installed, and none where no editor is chosen (scenario C4)", async () => {
    const { openers, ran, opened } = mac(["/Applications/Notes.app", "/System/Applications/Utilities/Terminal.app"], {}, [], [FILE]);
    expect(await openInEditor(FILE, 12, 5, "Notes", openers, PERSON)).toBe("Notes is not an editor Owlery opens a file in.");
    expect(await openInEditor(FILE, 12, 5, "Terminal", openers, PERSON)).toBe("Terminal is not an editor Owlery opens a file in.");
    expect(await openInEditor(FILE, 12, 5, "/Applications/Notes.app", openers, PERSON)).toBe("/Applications/Notes.app is not an editor Owlery opens a file in.");
    expect(await openInEditor(FILE, 12, 5, "Cursor", openers, PERSON)).toBe("Cursor is not installed.");
    for (const none of [null, "finder"]) expect(await openInEditor(FILE, 12, 5, none, openers, PERSON)).toBe("No editor is chosen in Settings.");
    expect([ran, opened]).toEqual([[], []]);
  });

  it("runs the stand-in a start was given in the editor's place, with the file and its line and column as one argument, in the background too (scenario C1)", async () => {
    const { openers, ran } = mac([CODE], {}, [COMMANDS["Visual Studio Code"]], [FILE]);
    for (const background of [true, false]) {
      expect(await openInEditor(FILE, 12, 5, "Visual Studio Code", openers, { program: "/t/opener.sh", background })).toBeNull();
      expect(await openInEditor(FILE, undefined, undefined, "Visual Studio Code", openers, { program: "/t/opener.sh", background })).toBeNull();
    }
    expect(ran).toEqual([
      ["/t/opener.sh", [`${FILE}:12:5`]],
      ["/t/opener.sh", [FILE]],
      ["/t/opener.sh", [`${FILE}:12:5`]],
      ["/t/opener.sh", [FILE]],
    ]);
    // The stand-in runs only where a real editor would.
    expect(await openInEditor(`${WORKTREE}/src`, 12, 5, "Visual Studio Code", openers, { program: "/t/opener.sh", background: true })).toBe(`${WORKTREE}/src is gone.`);
    expect(ran).toHaveLength(4);
  });

  it("opens nothing in an app started in the background without a stand-in (scenario C4)", async () => {
    const { openers, ran, opened } = mac([CODE], {}, [COMMANDS["Visual Studio Code"]], [FILE]);
    expect(await openInEditor(FILE, 12, 5, "Visual Studio Code", openers, { program: null, background: true })).toBeNull();
    expect([ran, opened]).toEqual([[], []]);
  });

  it("answers the failure's sentence where the editor's command fails", async () => {
    const { openers } = mac([CODE], { run: "The editor cannot be opened." }, [COMMANDS["Visual Studio Code"]], [FILE]);
    expect(await openInEditor(FILE, 12, 5, "Visual Studio Code", openers, PERSON)).toBe("The editor cannot be opened.");
  });
});
