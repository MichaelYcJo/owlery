// The app's icon as the build ships it: Owlery's emblem, which the main
// process gives the macOS Dock from dist/app-icon.png. The emblem the app
// showed before stands in the tree as an archive, and the build ships none of
// it (TRADEMARKS.md).
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";
import { buildApp } from "./built-app";

const APP_DIR = join(__dirname, "..");
const ICON = join(APP_DIR, "assets", "icon");
const EARLIER = join(ICON, "earlier-2026-11-19");
const DIST = join(APP_DIR, "dist");

/** Every file under a folder, by its path from the folder, sorted. */
function filesOf(folder: string): string[] {
  const found: string[] = [];
  const walk = (at: string): void => {
    for (const name of readdirSync(at)) {
      const path = join(at, name);
      if (statSync(path).isDirectory()) walk(path);
      else found.push(relative(folder, path));
    }
  };
  walk(folder);
  return found.sort();
}

describe("the built app's icon", () => {
  beforeAll(() => buildApp(), 60_000);

  it("is the emblem's PNG at dist/app-icon.png, and no file of the build has the bytes of a file of the earlier emblem", () => {
    expect(readFileSync(join(DIST, "app-icon.png")).equals(readFileSync(join(ICON, "app-icon.png"))), "dist/app-icon.png is assets/icon/app-icon.png").toBe(true);
    // The archive holds the three files of the earlier emblem, so the search below has something to find.
    const earlier = filesOf(EARLIER);
    expect(earlier).toEqual(["app-icon-small.svg", "app-icon.png", "app-icon.svg"]);
    const earlierBytes = earlier.map((file) => readFileSync(join(EARLIER, file)));
    const shipped = filesOf(DIST).filter((file) => {
      const bytes = readFileSync(join(DIST, file));
      return earlierBytes.some((archived) => archived.equals(bytes));
    });
    expect(shipped, "files of dist/ with the bytes of a file of assets/icon/earlier-2026-11-19/").toEqual([]);
  });
});
