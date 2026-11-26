// The editor a person chose to open the files a pane printed in, kept by the
// main process in `editor.json` in the app's user data folder. The editor is
// an app of the Mac the window runs on, so it is this client's own choice
// and not the daemon's state. Nothing here is Electron's, so the cases run
// without it.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { writeWholeFile } from "../daemon/whole-file";
import { KNOWN_APPS } from "./openers";

const FILE = "editor.json";

/** What a value names as a choice of the Settings dialog's "Open files in": the name of an editor of the list (./openers, `KNOWN_APPS`) or `"finder"`, as it is, and anything else, a terminal of the list among it, as no choice. */
export function editorChoice(value: unknown): string | null {
  if (value === "finder") return value;
  return typeof value === "string" && KNOWN_APPS.some((known) => known.name === value && known.kind === "editor") ? value : null;
}

/** The choice `editor.json` keeps, or null where none was kept, where the file is not JSON, and where it names no choice `editorChoice` reads. */
export function readEditor(userData: string): string | null {
  try {
    return editorChoice((JSON.parse(readFileSync(join(userData, FILE), "utf8")) as { editor?: unknown } | null)?.editor);
  } catch {
    return null;
  }
}

/** Keeps a choice in `editor.json`, readable by the user alone and never half-written, and answers whether it was kept: a value that `editorChoice` reads as no choice is not, and the choice kept before stands. A write that fails throws what refused it. */
export function writeEditor(userData: string, value: unknown): boolean {
  const chosen = editorChoice(value);
  if (chosen === null) return false;
  writeWholeFile(join(userData, FILE), JSON.stringify({ editor: chosen }));
  return true;
}
