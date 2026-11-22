// The theme and the appearance a person chose, kept by the main process in
// `appearance.json` in the app's user data folder, so a window opens in the
// look it was left in. It is this client's own appearance and not the
// daemon's state. Nothing here is Electron's, so the cases run without it.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { writeWholeFile } from "../daemon/whole-file";
import { type Appearance, appearanceFor, lookChoice, type LookChoice, type Theme } from "../shared/appearance";

const FILE = "appearance.json";

/** The ground of each theme in each appearance, `--ground` of its block in src/renderer/themes.css. The main process names them itself because it opens the window before any page is drawn; test/appearance.test.ts holds the two files equal. */
export const GROUNDS: Record<Theme, Record<Appearance, string>> = {
  "night-watch": { dark: "#0f0f10", light: "#f3efe6" },
  register: { dark: "#1c1a18", light: "#f1e9d8" },
  desk: { dark: "#1c1a18", light: "#f1e9d8" },
};

/** The saved choice, or the first run's where none was saved and where the file is not one this app wrote. */
export function readAppearance(userData: string): LookChoice {
  try {
    // A file that is not JSON throws here, and is read as no file.
    return lookChoice(JSON.parse(readFileSync(join(userData, FILE), "utf8")));
  } catch {
    return lookChoice(undefined);
  }
}

/** Saves a choice, as the daemon writes its repositories: to a partial file it then renames, readable by the user alone. A save that fails throws what refused it, after removing the partial file. */
export function writeAppearance(userData: string, choice: LookChoice): void {
  // A window that loads meanwhile never reads a half-written file.
  writeWholeFile(join(userData, FILE), JSON.stringify({ theme: choice.theme, appearance: choice.appearance }));
}

/** The ground a window opens on, so it does not flash another colour before its page is drawn. */
export function groundAtStart(choice: LookChoice, systemIsDark: boolean): string {
  return GROUNDS[choice.theme][appearanceFor(choice.appearance, systemIsDark)];
}
