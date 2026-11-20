// What stands at a path a pane printed, and how Finder shows one. It imports
// nothing of Electron, and Finder's two acts are passed in, so the cases
// read it on the disk of a temporary folder and open no Finder window.
import { realpath, stat } from "node:fs/promises";
import { basename, isAbsolute, join, resolve } from "node:path";
import type { PathFound } from "../shared/ipc";
import { chooseOpener, type Opener } from "./links";

/** What stands at a whole path: a folder, a file, or neither. A link is read as what it leads to. The disk is read without blocking, so a volume that answers slowly holds nothing else back. */
async function kindAt(path: string): Promise<"folder" | "file" | null> {
  try {
    const found = await stat(path);
    return found.isDirectory() ? "folder" : found.isFile() ? "file" : null;
  } catch {
    // Nothing stands there, or the path is one no disk holds.
    return null;
  }
}

/**
 * What stands at a text a pane printed, or null where neither a file nor a
 * folder does: the whole path, with every `.` and `..` resolved, and whether
 * it is a folder. A text that opens with `/` is read as it stands, one that
 * opens with `~/` from `home`, the person's home folder, and any other from
 * `worktree`, the worktree of the pane's work item. A text of that last
 * kind is answered with nothing where no worktree is named. The text is
 * what a pane printed and the window passed on, so a value that is no text
 * is answered with nothing as well.
 */
export async function standsAt(worktree: string | null, text: unknown, home: string): Promise<PathFound | null> {
  if (typeof text !== "string" || text === "") return null;
  let path: string;
  if (text.startsWith("/")) path = resolve(text);
  else if (text.startsWith("~/")) path = resolve(home, text.slice(2));
  else if (worktree !== null && isAbsolute(worktree)) path = resolve(worktree, text);
  else return null;
  const kind = await kindAt(path);
  return kind === null ? null : { path, folder: kind === "folder" };
}

/** What stands at each text of one request of the window, in the request's order (`standsAt`). A worktree that is no text is read as none named, and texts that are no list are answered with none. */
export async function pathsOf(worktree: unknown, texts: unknown, home: string): Promise<(PathFound | null)[]> {
  if (!Array.isArray(texts)) return [];
  const from = typeof worktree === "string" ? worktree : null;
  return Promise.all(texts.map((text: unknown) => standsAt(from, text, home)));
}

/** What Finder is asked to do with a path: show it selected in the folder that holds it, or open it as a folder. */
export type FinderAct = "select" | "open";

/**
 * Which act shows what stands at a path, from its name, whether it is a
 * folder, and whether it is a checkout, a folder that holds `.git` at its
 * top. A file is selected and never opened, since opening it would start
 * the app the system gives it. A folder is opened, except one whose name
 * holds a dot after its first character and that is no checkout: an app's
 * bundle is such a folder, and opening one starts the app.
 */
export function finderAct(name: string, folder: boolean, checkout: boolean): FinderAct {
  if (!folder) return "select";
  return name.includes(".", 1) && !checkout ? "select" : "open";
}

/** Finder's two acts, each answering whether it showed the path it was handed. */
export interface Finder {
  select: Opener;
  open: Opener;
}

/** Who shows a path for this start of the app, chosen for each act as the opener of an address is (./links, `chooseOpener`): the program `OWLERY_OPENER` names, run with the path as its one argument, nobody in the background, and the system's act otherwise. */
export function chooseFinder(program: string | null, background: boolean, system: Finder): Finder {
  return { select: chooseOpener(program, background, system.select), open: chooseOpener(program, background, system.open) };
}

/**
 * Has `finder` show a path a person chose in a pane, and answers whether it
 * was shown. The disk is read again here, since the path comes from the
 * window: nothing is shown where the path is no text, does not open with
 * `/`, or has neither a file nor a folder at it. A link is read as what it
 * leads to, its name too, so a link to an app's bundle is a bundle whatever
 * the link is called. The act is `finderAct`'s, and it is handed the whole
 * path, which for a link is the link's own.
 */
export async function showInFinder(path: unknown, finder: Finder): Promise<boolean> {
  if (typeof path !== "string" || !path.startsWith("/")) return false;
  const whole = resolve(path);
  // Every link on the path followed. Nothing stands at a path this fails on.
  const real = await realpath(whole).catch(() => null);
  if (real === null) return false;
  const kind = await kindAt(real);
  if (kind === null) return false;
  const checkout = kind === "folder" && (await kindAt(join(real, ".git"))) !== null;
  return finder[finderAct(basename(real), kind === "folder", checkout)](whole);
}
