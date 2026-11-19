// The theme a person chose, kept by the main process in `appearance.json` in
// the app's user data folder, so a window opens in the theme it was left in.
// It is this client's own appearance and not the daemon's state. Nothing
// here is Electron's, so the cases run without it.
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { writeWholeFile } from "../daemon/whole-file";
import { themeChoice, themeFor, type Theme, type ThemeChoice } from "../shared/appearance";

const FILE = "appearance.json";

/** Each theme's ground, `--ground` of its block in src/renderer/themes.css. The main process names them itself because it opens the window before any page is drawn; test/appearance.test.ts holds the two files equal. */
export const GROUNDS: Record<Theme, string> = {
  "night-desk": "#1c1a18",
  letter: "#f1e9d8",
};

/** The saved choice, or Night desk where none was saved, as at the first run, and where the file is not one this app wrote. */
export function readAppearance(userData: string): ThemeChoice {
  try {
    // A file that holds `null` throws here as one that is not JSON throws above, and both are read as no file.
    return themeChoice((JSON.parse(readFileSync(join(userData, FILE), "utf8")) as { theme?: unknown }).theme);
  } catch {
    return themeChoice(undefined);
  }
}

/** Saves a choice, as the daemon writes its list of work items: to a partial file it then renames, readable by the user alone. A save that fails throws what refused it, after removing the partial file. */
export function writeAppearance(userData: string, choice: ThemeChoice): void {
  // A window that loads meanwhile never reads a half-written file.
  writeWholeFile(join(userData, FILE), JSON.stringify({ theme: choice }));
}

/** The ground a window opens on, so it does not flash another theme's colour before its page is drawn. */
export function groundAtStart(choice: ThemeChoice, systemIsDark: boolean): string {
  return GROUNDS[themeFor(choice, systemIsDark)];
}
