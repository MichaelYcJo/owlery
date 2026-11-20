// What the main process does for a menu's "Open in" and "Copy" items, and
// for a repository's removal: which editors and terminals the Mac holds,
// opening a folder in Finder or in one of them, writing the clipboard, and
// moving a repository's folder to the Trash. What reads the disk, runs a
// command, opens a folder, writes the clipboard and moves a folder to the
// Trash is handed in, so the cases run without Electron, open no app and
// move nothing.
import { isAbsolute, join } from "node:path";
import type { InstalledApp } from "../shared/ipc";

/** An app Owlery opens a folder in: the name a person reads, its kind, and the name of its bundle. */
export interface KnownApp extends InstalledApp {
  bundle: string;
}

/** The apps Owlery opens a folder in, the editors before the terminals. No other app is ever opened. */
export const KNOWN_APPS: readonly KnownApp[] = [
  { name: "Visual Studio Code", kind: "editor", bundle: "Visual Studio Code.app" },
  { name: "Cursor", kind: "editor", bundle: "Cursor.app" },
  { name: "Zed", kind: "editor", bundle: "Zed.app" },
  { name: "Sublime Text", kind: "editor", bundle: "Sublime Text.app" },
  { name: "Xcode", kind: "editor", bundle: "Xcode.app" },
  { name: "Terminal", kind: "terminal", bundle: "Terminal.app" },
  { name: "iTerm", kind: "terminal", bundle: "iTerm.app" },
  { name: "Ghostty", kind: "terminal", bundle: "Ghostty.app" },
  { name: "Warp", kind: "terminal", bundle: "Warp.app" },
];

/** The folders a bundle is looked for in, in this order: the Mac's, the system's, and the ones under the person's home folder. */
export function appFolders(home: string): string[] {
  return ["/Applications", "/Applications/Utilities", "/System/Applications", "/System/Applications/Utilities", join(home, "Applications")];
}

/** The known apps whose bundle stands in one of the folders, in the list's order, each with its bundle's path in the first folder that holds it. */
export function installedApps(exists: (path: string) => boolean, home: string): (InstalledApp & { path: string })[] {
  return KNOWN_APPS.flatMap(({ name, kind, bundle }) => {
    const path = appFolders(home)
      .map((folder) => join(folder, bundle))
      .find(exists);
    return path === undefined ? [] : [{ name, kind, path }];
  });
}

/** What opening a folder needs of the main process. */
export interface Openers {
  /** Whether anything stands at a path: a bundle, a folder, or the `.git` at a folder's top. A symlink is followed, as `existsSync` follows one. */
  exists(path: string): boolean;
  /** The person's home folder. */
  home: string;
  /** Runs a command with its arguments and no shell, and rejects with the failure's sentence. */
  run(command: string, args: string[]): Promise<void>;
  /** Opens a folder in Finder, and answers an empty string or the failure's sentence, as Electron's `shell.openPath` does. */
  openPath(folder: string): Promise<string>;
}

/**
 * Opens a folder in Finder, where `app` is null, or in the installed app of
 * that name, by `open -a <the bundle's path> <the folder>`. It answers null,
 * or why nothing was opened, as a sentence the window shows as it is. An app
 * that is not of the list is never run, whatever stands on the disk under
 * its name. The folder is a whole path from /: `open` would read one that
 * starts with a dash as an option. It is a work item's worktree or a
 * repository's folder, each of which holds `.git` at its top, and any other
 * path is opened nowhere: Finder opens a file, and an app's bundle, in the
 * app the system gives it, which is no app of the list. A path nothing
 * stands at is answered as a folder that is gone.
 */
export async function openFolder(folder: unknown, app: unknown, openers: Openers): Promise<string | null> {
  if (typeof folder !== "string" || !isAbsolute(folder)) return "A folder is opened by its whole path.";
  // A person can remove a worktree's folder by hand, and the sentence then says so.
  if (!openers.exists(folder)) return `${folder} is gone.`;
  if (!openers.exists(join(folder, ".git"))) return "Owlery opens a work item's folder or a repository's folder, and nothing else.";
  if (app === null) return (await openers.openPath(folder)) || null;
  if (!KNOWN_APPS.some((known) => known.name === app)) return `${String(app)} is not an app Owlery opens a folder in.`;
  const installed = installedApps(openers.exists, openers.home).find((known) => known.name === app);
  if (!installed) return `${String(app)} is not installed.`;
  try {
    await openers.run("open", ["-a", installed.path, folder]);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

/** Writes a text to the clipboard through the writer it is handed. What is no text is not written. */
export async function copyText(text: unknown, write: (text: string) => unknown): Promise<void> {
  if (typeof text === "string") await write(text);
}

/**
 * Moves a repository's folder to the Trash, whole, through the function it
 * is handed, and with that folder alone. It answers null, or why nothing
 * was moved, as a sentence the window shows as it is. The folder is a whole
 * path from /, and holds `.git` at its top, as a repository's folder does:
 * a path nothing stands at is answered as a folder that is gone, and any
 * other path is moved nowhere, the folder above a repository and a folder
 * inside one among them. Nothing in the folder is erased, and a person puts
 * it back from the Trash.
 */
export async function trashFolder(folder: unknown, exists: (path: string) => boolean, trash: (folder: string) => Promise<void>): Promise<string | null> {
  if (typeof folder !== "string" || !isAbsolute(folder)) return "A folder is moved to the Trash by its whole path.";
  if (!exists(folder)) return `${folder} is gone.`;
  if (!exists(join(folder, ".git"))) return "Owlery moves a repository's folder to the Trash, and nothing else.";
  try {
    await trash(folder);
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}
