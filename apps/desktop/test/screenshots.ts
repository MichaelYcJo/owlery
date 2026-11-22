// What the screenshot command captures and where it writes: the themes a run
// was asked for, the file of each view in each theme and appearance, the
// folder of the run, and the size a PNG file says it has. The run itself is
// test/screenshots.test.ts.
import { join, resolve } from "node:path";
import { APPEARANCES, type Appearance, lookChoice, THEMES, type Theme } from "../src/shared/appearance";

/** The views a run captures, in the order it draws them: the inbox, the view of the work item that needs the person, the view of the work item parked with questions, a work item's menu and the "New work item" form. */
export const VIEWS = ["inbox", "view", "parked", "menu", "dialog"] as const;
export type View = (typeof VIEWS)[number];

/** One screenshot: a view in a theme and an appearance, and the name of its file. */
export interface Shot {
  theme: Theme;
  appearance: Appearance;
  view: View;
  file: string;
}

/**
 * The themes a run captures, in the order of `THEMES`. The theme a first run
 * opens in is always among them. `asked` is what `OWLERY_SCREENSHOT_THEMES`
 * holds: nothing, `all` for every theme, or the names of themes with commas
 * between them. A name that is no theme's is refused, so a mistyped name
 * does not pass as a run that captured it.
 */
export function themesAsked(asked: string | undefined): Theme[] {
  const first = lookChoice(undefined).theme;
  const names = (asked ?? "")
    .split(",")
    .map((name) => name.trim())
    .filter((name) => name !== "");
  if (names.includes("all")) return [...THEMES];
  const unknown = names.filter((name) => !(THEMES as readonly string[]).includes(name));
  if (unknown.length > 0) throw new Error(`OWLERY_SCREENSHOT_THEMES names ${unknown.join(", ")}, and the themes are ${THEMES.join(", ")}, or all`);
  return THEMES.filter((theme) => theme === first || names.includes(theme));
}

/** Every screenshot of a run: each view, in each appearance, of each theme. */
export function shots(themes: readonly Theme[]): Shot[] {
  return themes.flatMap((theme) => APPEARANCES.flatMap((appearance) => VIEWS.map((view) => ({ theme, appearance, view, file: `${theme}-${appearance}-${view}.png` }))));
}

/**
 * The folder a run writes into. `named` is what `OWLERY_SCREENSHOT_DIR`
 * holds, read from the folder the command runs in. Without it the folder is
 * `screenshots/<the run's start>` under the app's folder, with the start in
 * UTC as `20261122T091500Z`, so two runs never write into one folder.
 */
export function runFolder(named: string | undefined, appDir: string, start: Date): string {
  if (named !== undefined && named !== "") return resolve(named);
  return join(appDir, "screenshots", start.toISOString().replace(/[-:]/g, "").replace(/\.\d+Z$/, "Z"));
}

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

/** The width and the height a PNG file's header gives. Bytes that do not open as a PNG file are refused. */
export function pngSize(bytes: Buffer): { width: number; height: number } {
  if (bytes.length < 24 || !bytes.subarray(0, 8).equals(PNG_SIGNATURE) || bytes.toString("latin1", 12, 16) !== "IHDR") throw new Error("the bytes are not a PNG file's");
  return { width: bytes.readUInt32BE(16), height: bytes.readUInt32BE(20) };
}
