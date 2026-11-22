import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { GROUNDS, groundAtStart, readAppearance, writeAppearance } from "../src/main/appearance";
import { APPEARANCE_CHOICES, APPEARANCES, appearanceFor, lookChoice, THEME_CHOICES, THEMES } from "../src/shared/appearance";

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

const FIRST_RUN = { theme: "night-watch", appearance: "dark" };

describe("appearanceFor", () => {
  it("gives the appearance a person chose, whatever the system's appearance is", () => {
    expect(appearanceFor("dark", false)).toBe("dark");
    expect(appearanceFor("dark", true)).toBe("dark");
    expect(appearanceFor("light", true)).toBe("light");
    expect(appearanceFor("light", false)).toBe("light");
  });

  it("gives the system's appearance where the choice is to match the system", () => {
    expect(appearanceFor("system", true)).toBe("dark");
    expect(appearanceFor("system", false)).toBe("light");
  });
});

describe("lookChoice", () => {
  it("reads each theme with each choice of appearance as it is", () => {
    expect(THEMES).toEqual(["night-watch", "register", "desk"]);
    expect(APPEARANCES).toEqual(["dark", "light"]);
    for (const theme of THEMES) for (const appearance of ["dark", "light", "system"]) expect(lookChoice({ theme, appearance })).toEqual({ theme, appearance });
  });

  it("reads anything else as Night watch in the dark appearance, the first run's choice", () => {
    for (const value of [undefined, null, 1, "desk", ["desk", "light"], {}, { theme: "desk" }, { appearance: "light" }, { theme: "sepia", appearance: "light" }, { theme: "desk", appearance: "sepia" }, { theme: "dark", appearance: "desk" }]) {
      expect([value, lookChoice(value)]).toEqual([value, FIRST_RUN]);
    }
  });
});

describe("the choices a control offers", () => {
  it("offers Night watch, Register and Desk as the themes, in that order and in those words", () => {
    expect(THEME_CHOICES).toEqual([
      { value: "night-watch", label: "Night watch" },
      { value: "register", label: "Register" },
      { value: "desk", label: "Desk" },
    ]);
  });

  it("offers Dark, Light and Match the system as the appearance, in that order and in those words", () => {
    expect(APPEARANCE_CHOICES).toEqual([
      { value: "dark", label: "Dark" },
      { value: "light", label: "Light" },
      { value: "system", label: "Match the system" },
    ]);
  });
});

describe("the choice's file", () => {
  it("gives Night watch in the dark appearance where no choice was ever saved, the first run", () => {
    expect(readAppearance(userData())).toEqual(FIRST_RUN);
  });

  it("gives each choice back as it was saved, the last one where several were", () => {
    const dir = userData();
    writeAppearance(dir, { theme: "register", appearance: "light" });
    expect(readAppearance(dir)).toEqual({ theme: "register", appearance: "light" });
    writeAppearance(dir, { theme: "desk", appearance: "system" });
    expect(readAppearance(dir)).toEqual({ theme: "desk", appearance: "system" });
    writeAppearance(dir, { theme: "night-watch", appearance: "dark" });
    expect(readAppearance(dir)).toEqual({ theme: "night-watch", appearance: "dark" });
  });

  // The file an earlier version of the app wrote held one of three values as its theme, each a theme in one appearance or the system's.
  it.each([
    ["night-desk", "dark"],
    ["letter", "light"],
    ["system", "system"],
  ])("reads the earlier file's %s as Night watch with the appearance %s", (earlier, appearance) => {
    const dir = userData();
    writeFileSync(join(dir, "appearance.json"), JSON.stringify({ theme: earlier }));
    expect(readAppearance(dir)).toEqual({ theme: "night-watch", appearance });
  });

  it("leaves the earlier file as it is at a read, and writes the new form over it at the next save", () => {
    const dir = userData();
    writeFileSync(join(dir, "appearance.json"), JSON.stringify({ theme: "letter" }));
    const read = readAppearance(dir);
    expect(JSON.parse(readFileSync(join(dir, "appearance.json"), "utf8"))).toEqual({ theme: "letter" });
    writeAppearance(dir, { ...read, theme: "desk" });
    expect(JSON.parse(readFileSync(join(dir, "appearance.json"), "utf8"))).toEqual({ theme: "desk", appearance: "light" });
  });

  it("writes appearance.json, readable by the user alone, and leaves no partial file beside it", () => {
    const dir = userData();
    writeAppearance(dir, { theme: "register", appearance: "light" });
    expect(readdirSync(dir)).toEqual(["appearance.json"]);
    expect(statSync(join(dir, "appearance.json")).mode & 0o777).toBe(0o600);
    expect(JSON.parse(readFileSync(join(dir, "appearance.json"), "utf8"))).toEqual({ theme: "register", appearance: "light" });
  });

  it("throws where the rename fails, and removes the partial file it wrote", () => {
    const dir = userData();
    // A folder stands where the file goes, so the partial file is written and its rename refused.
    mkdirSync(join(dir, "appearance.json"));
    expect(() => writeAppearance(dir, { theme: "register", appearance: "light" })).toThrow(/rename/);
    expect(readdirSync(dir)).toEqual(["appearance.json"]);
    expect(statSync(join(dir, "appearance.json")).isDirectory()).toBe(true);
  });

  it("throws where the write fails, and leaves no partial file", () => {
    const dir = userData();
    const partial = `appearance.json.${process.pid}`;
    // A file the user may not write stands at the partial file's path, so the write is refused at its open and the file is still there after it.
    writeFileSync(join(dir, partial), "", { mode: 0o400 });
    expect(() => writeAppearance(dir, { theme: "register", appearance: "light" })).toThrow(/EACCES.*open/);
    expect(readdirSync(dir)).toEqual([]);
  });

  it("gives the first run's choice where the file is not JSON, or holds neither the form the app writes nor the earlier one", () => {
    const dir = userData();
    for (const text of ["{", "null", "[]", JSON.stringify({ colour: "desk" }), JSON.stringify({ theme: "sepia" }), JSON.stringify({ theme: "desk" }), JSON.stringify({ theme: "desk", appearance: "sepia" }), JSON.stringify("desk")]) {
      writeFileSync(join(dir, "appearance.json"), text);
      expect([text, readAppearance(dir)]).toEqual([text, FIRST_RUN]);
    }
    expect(existsSync(join(dir, "appearance.json"))).toBe(true);
  });
});

describe("the window's ground at start", () => {
  // The main process names each ground itself, because it opens the window before any page is drawn. The stylesheet is where the ground is defined.
  const themes = readFileSync(join(__dirname, "..", "src", "renderer", "themes.css"), "utf8");
  const groundOf = (theme: string, appearance: string): string | undefined =>
    new RegExp(`:root\\[data-theme="${theme}"\\]\\[data-appearance="${appearance}"\\]\\s*\\{[^{}]*?--ground:\\s*(#[0-9a-f]{6});`).exec(themes)?.[1];

  it("is the ground the stylesheet gives each theme in each appearance", () => {
    const pairs = THEMES.flatMap((theme) => APPEARANCES.map((appearance) => [theme, appearance] as const));
    expect(pairs.length).toBe(6);
    for (const [theme, appearance] of pairs) {
      expect(groundOf(theme, appearance)).toMatch(/^#[0-9a-f]{6}$/);
      expect([theme, appearance, GROUNDS[theme][appearance]]).toEqual([theme, appearance, groundOf(theme, appearance)]);
    }
  });

  it("is the ground of the chosen theme in the chosen appearance, and under Match the system in the system's", () => {
    expect(groundAtStart({ theme: "night-watch", appearance: "dark" }, false)).toBe(GROUNDS["night-watch"].dark);
    expect(groundAtStart({ theme: "register", appearance: "light" }, true)).toBe(GROUNDS.register.light);
    expect(groundAtStart({ theme: "desk", appearance: "system" }, true)).toBe(GROUNDS.desk.dark);
    expect(groundAtStart({ theme: "desk", appearance: "system" }, false)).toBe(GROUNDS.desk.light);
    expect(new Set([GROUNDS["night-watch"].dark, GROUNDS["night-watch"].light, GROUNDS.desk.dark, GROUNDS.desk.light]).size).toBe(4);
  });
});
