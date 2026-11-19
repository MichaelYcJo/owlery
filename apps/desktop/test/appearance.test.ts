import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { GROUNDS, groundAtStart, readAppearance, writeAppearance } from "../src/main/appearance";
import { THEME_CHOICES, THEMES, themeChoice, themeFor } from "../src/shared/appearance";

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

/** A folder that stands in for the app's user data folder. */
function userData(): string {
  const dir = mkdtempSync(join(tmpdir(), "owlery-user-data-"));
  cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

describe("themeFor", () => {
  it("gives the theme a person chose, whatever the system's appearance is", () => {
    expect(themeFor("night-desk", false)).toBe("night-desk");
    expect(themeFor("night-desk", true)).toBe("night-desk");
    expect(themeFor("letter", true)).toBe("letter");
    expect(themeFor("letter", false)).toBe("letter");
  });

  it("gives Night desk under the system's dark appearance and Letter under its light one, where the choice is to match the system", () => {
    expect(themeFor("system", true)).toBe("night-desk");
    expect(themeFor("system", false)).toBe("letter");
  });
});

describe("themeChoice", () => {
  it("reads each of the three choices as it is", () => {
    expect(themeChoice("night-desk")).toBe("night-desk");
    expect(themeChoice("letter")).toBe("letter");
    expect(themeChoice("system")).toBe("system");
  });

  it("reads anything else as Night desk, the first run's theme", () => {
    expect(themeChoice(undefined)).toBe("night-desk");
    expect(themeChoice(null)).toBe("night-desk");
    expect(themeChoice("sepia")).toBe("night-desk");
    expect(themeChoice(1)).toBe("night-desk");
    expect(themeChoice(["letter"])).toBe("night-desk");
  });
});

describe("THEME_CHOICES", () => {
  it("offers Night desk, Letter and Match the system, in that order and in those words", () => {
    expect(THEME_CHOICES).toEqual([
      { value: "night-desk", label: "Night desk" },
      { value: "letter", label: "Letter" },
      { value: "system", label: "Match the system" },
    ]);
  });
});

describe("the theme's file", () => {
  it("gives Night desk where no choice was ever saved, the first run", () => {
    expect(readAppearance(userData())).toBe("night-desk");
  });

  it("gives each choice back as it was saved, the last one where several were", () => {
    const dir = userData();
    writeAppearance(dir, "letter");
    expect(readAppearance(dir)).toBe("letter");
    writeAppearance(dir, "system");
    expect(readAppearance(dir)).toBe("system");
    writeAppearance(dir, "night-desk");
    expect(readAppearance(dir)).toBe("night-desk");
  });

  it("writes appearance.json, readable by the user alone, and leaves no partial file beside it", () => {
    const dir = userData();
    writeAppearance(dir, "letter");
    expect(readdirSync(dir)).toEqual(["appearance.json"]);
    expect(statSync(join(dir, "appearance.json")).mode & 0o777).toBe(0o600);
    expect(JSON.parse(readFileSync(join(dir, "appearance.json"), "utf8"))).toEqual({ theme: "letter" });
  });

  it("throws where the rename fails, and removes the partial file it wrote", () => {
    const dir = userData();
    // A folder stands where the file goes, so the partial file is written and its rename refused.
    mkdirSync(join(dir, "appearance.json"));
    expect(() => writeAppearance(dir, "letter")).toThrow(/rename/);
    expect(readdirSync(dir)).toEqual(["appearance.json"]);
    expect(statSync(join(dir, "appearance.json")).isDirectory()).toBe(true);
  });

  it("throws where the write fails, and leaves no partial file", () => {
    const dir = userData();
    const partial = `appearance.json.${process.pid}`;
    // A file the user may not write stands at the partial file's path, so the write is refused at its open and the file is still there after it.
    writeFileSync(join(dir, partial), "", { mode: 0o400 });
    expect(() => writeAppearance(dir, "letter")).toThrow(/EACCES.*open/);
    expect(readdirSync(dir)).toEqual([]);
  });

  it("gives Night desk where the file is not JSON, holds no theme or holds one the app does not know", () => {
    const dir = userData();
    for (const text of ["{", "null", "[]", JSON.stringify({ colour: "letter" }), JSON.stringify({ theme: "sepia" }), JSON.stringify("letter")]) {
      writeFileSync(join(dir, "appearance.json"), text);
      expect(readAppearance(dir)).toBe("night-desk");
    }
    expect(existsSync(join(dir, "appearance.json"))).toBe(true);
  });
});

describe("the window's ground at start", () => {
  // The main process names each theme's ground itself, because it opens the window before any page is drawn. The stylesheet is where the ground is defined.
  const themes = readFileSync(join(__dirname, "..", "src", "renderer", "themes.css"), "utf8");
  const groundOf = (theme: string): string | undefined => new RegExp(`:root\\[data-theme="${theme}"\\]\\s*\\{[^{}]*?--ground:\\s*(#[0-9a-f]{6});`).exec(themes)?.[1];

  it("is the ground the stylesheet gives each theme", () => {
    expect(THEMES.length).toBeGreaterThan(0);
    for (const theme of THEMES) expect([theme, GROUNDS[theme]]).toEqual([theme, groundOf(theme)]);
  });

  it("is the saved theme's, and under Match the system the ground of the theme the system's appearance gives", () => {
    expect(groundAtStart("night-desk", false)).toBe(GROUNDS["night-desk"]);
    expect(groundAtStart("letter", true)).toBe(GROUNDS.letter);
    expect(groundAtStart("system", true)).toBe(GROUNDS["night-desk"]);
    expect(groundAtStart("system", false)).toBe(GROUNDS.letter);
    expect(GROUNDS.letter).not.toBe(GROUNDS["night-desk"]);
  });
});
