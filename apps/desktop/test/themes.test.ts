import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { THEMES } from "../src/shared/appearance";

// The rules of the page's look that hold as text: a theme is one block of
// src/renderer/themes.css, each theme the window can draw in has one, red
// stands on the seal alone, a theme changes no measure, and the page names no
// colour and writes no shadow, gradient or corner outside a theme. The files
// are read as text; no case loads the page.
const renderer = join(__dirname, "..", "src", "renderer");
const themes = readFileSync(join(renderer, "themes.css"), "utf8");
const page = readFileSync(join(renderer, "index.html"), "utf8");

const withoutComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, "");
const BLOCK = /:root\[data-theme="([^"]+)"\]\s*\{([^{}]*)\}/g;

/** The texts a pattern's first group catches. */
function caught(text: string, pattern: RegExp): string[] {
  return [...text.matchAll(pattern)].map((match) => match[1] ?? "");
}

/** The declarations of a rule's body, each as its name and its value. */
function declarations(body: string): [string, string][] {
  return body
    .split(";")
    .map((declaration) => declaration.trim())
    .filter((declaration) => declaration !== "")
    .map((declaration) => {
      const colon = declaration.indexOf(":");
      return [declaration.slice(0, colon).trim(), declaration.slice(colon + 1).trim()];
    });
}

/** The theme blocks, each with the properties it defines. */
function themeBlocks(): { theme: string; properties: [string, string][] }[] {
  return [...withoutComments(themes).matchAll(BLOCK)].map((match) => ({ theme: match[1] ?? "", properties: declarations(match[2] ?? "") }));
}

const HEX = /#([0-9a-f]{8}|[0-9a-f]{6}|[0-9a-f]{3,4})(?![0-9a-z_-])/gi;
const FUNCTION = /\b(?:rgba?|hsla?)\(([^)]*)\)/gi;

/** The red, green and blue of every colour a value names as a hexadecimal number or as `rgb()`. */
function colours(value: string): [number, number, number][] {
  const found: [number, number, number][] = [];
  for (const digits of caught(value, HEX)) {
    const pairs = digits.length <= 4 ? [...digits.slice(0, 3)].map((digit) => digit + digit) : [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 6)];
    found.push(pairs.map((pair) => Number.parseInt(pair, 16)) as [number, number, number]);
  }
  for (const match of value.matchAll(FUNCTION)) {
    if (!match[0].toLowerCase().startsWith("rgb")) continue;
    const [red = 0, green = 0, blue = 0] = (match[1] ?? "").trim().split(/[\s,/]+/).map(Number);
    found.push([red, green, blue]);
  }
  return found;
}

// The reds of AgenticSeal's wax, as the drawings and the mockups hold them.
const SEAL_REDS = ["c41a1e", "9e1016", "e8463c", "d83a31", "b3211f", "c92c27", "8e0c12", "e8302c"];
// A colour is a red where its red exceeds its green and its blue by more than this, of 255. The themes' ochre for a failure exceeds its green by 54 and 66, and the faintest red of the seal's light by 105.
const RED_MARGIN = 80;

function isRed(value: string): boolean {
  const lower = value.toLowerCase();
  return SEAL_REDS.some((red) => lower.includes(`#${red}`)) || colours(value).some(([red, green, blue]) => red - green > RED_MARGIN && red - blue > RED_MARGIN);
}

/** Whether a text names a colour of its own, as a hexadecimal number or a colour function. */
function namesColour(text: string): boolean {
  return [...text.matchAll(HEX)].length > 0 || [...text.matchAll(FUNCTION)].length > 0;
}

/** The page's own style sheet, and the page without it. */
function pageParts(): { style: string; markup: string } {
  const match = /<style>([\s\S]*?)<\/style>/.exec(page);
  if (!match) throw new Error("the page holds no style element");
  return { style: withoutComments(match[1] ?? ""), markup: page.replace(match[0], "") };
}

describe("themes.css", () => {
  it("holds one block for each theme the window can draw in, Night desk and Letter, and nothing else", () => {
    expect(themeBlocks().map(({ theme }) => theme)).toEqual([...THEMES]);
    expect([...THEMES]).toEqual(["night-desk", "letter"]);
    expect(withoutComments(themes).replace(BLOCK, "").trim()).toBe("");
  });

  it("holds a red in no property but the seal's", () => {
    const reds = themeBlocks().flatMap(({ theme, properties }) => properties.filter(([, value]) => isRed(value)).map(([name]) => `${theme} ${name}`));
    // The seal's light is a red in both themes, so the reading finds one where there is one.
    expect(reds).toContain("night-desk --seal-light");
    expect(reds).toContain("letter --seal-light");
    expect(reds.filter((name) => !name.includes(" --seal-"))).toEqual([]);
  });

  it("defines the same names in every block", () => {
    const blocks = themeBlocks().map(({ theme, properties }) => ({ theme, names: properties.map(([name]) => name).sort() }));
    expect(blocks.length).toBe(2);
    const first = blocks[0]?.names ?? [];
    for (const { names } of blocks) expect(new Set(names).size).toBe(names.length);
    for (const other of blocks) expect(other).toEqual({ theme: other.theme, names: first });
  });

  it("defines no width, no height, no spacing and no size of type", () => {
    const measures = themeBlocks().flatMap(({ theme, properties }) =>
      properties.filter(([name, value]) => /(^--|-)(w|h|width|height|size|space|gap|pad|padding)(-|$)/.test(name) || (name.startsWith("--font-") && /\d(px|pt|em|rem|%)/.test(value))).map(([name]) => `${theme} ${name}`),
    );
    expect(measures).toEqual([]);
  });

  it("defines only custom properties", () => {
    expect(themeBlocks().flatMap(({ properties }) => properties.map(([name]) => name).filter((name) => !name.startsWith("--")))).toEqual([]);
  });
});

describe("the page", () => {
  it("names no colour of its own in its style, its markup or its modules", () => {
    const { style, markup } = pageParts();
    // In the style a colour stands in a declaration's value; a selector may hold an id that reads as a hexadecimal number.
    const inStyle = caught(style, /\{([^{}]*)\}/g)
      .flatMap(declarations)
      .filter(([, value]) => namesColour(value));
    expect(inStyle).toEqual([]);
    const inMarkup = caught(markup, /="([^"]*)"/g).filter(namesColour);
    expect(inMarkup).toEqual([]);
    const modules = readdirSync(renderer).filter((file) => file.endsWith(".ts"));
    expect(modules.length).toBeGreaterThan(0);
    const inModules = modules.filter((file) => {
      const text = readFileSync(join(renderer, file), "utf8");
      return /["'`]#(?:[0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})["'`]/i.test(text) || [...text.matchAll(FUNCTION)].length > 0;
    });
    expect(inModules).toEqual([]);
  });

  it("writes no shadow, no light, no gradient and no corner of its own in its style", () => {
    const { style } = pageParts();
    const blocks = themeBlocks();
    const themed = (name: string) => blocks.every(({ properties }) => properties.some(([defined]) => defined === name));
    // No shadow, no light, no corner and a circle are shapes the same in every theme.
    const SHAPES = ["none", "0", "50%"];
    const written = caught(style, /\{([^{}]*)\}/g)
      .flatMap(declarations)
      .filter(([name, value]) => {
        if (value.includes("gradient(")) return true;
        if (!/(?:^|-)(?:shadow|filter|radius)$/.test(name) || SHAPES.includes(value)) return false;
        // What is left of the value once the theme's properties are taken out of it is the page's own.
        return value.replace(/var\((--[a-z0-9-]+)\)/g, (read, property: string) => (themed(property) ? "" : read)).replace(/[\s,]/g, "") !== "";
      })
      .map(([name, value]) => `${name}: ${value}`);
    expect(written).toEqual([]);
  });

  it("reads no property that neither its own block nor every theme defines", () => {
    const { style } = pageParts();
    const layout = /(?:^|\})\s*:root\s*\{([^{}]*)\}/.exec(style);
    if (!layout) throw new Error("the page's style holds no :root block");
    const own = new Set(declarations(layout[1] ?? "").map(([name]) => name));
    const blocks = themeBlocks();
    const themed = (name: string) => blocks.every(({ properties }) => properties.some(([defined]) => defined === name));
    // A property a rule sets for its own elements, as a state's colour is set, is defined where it is read.
    const local = new Set(caught(style, /(?:^|[;{\s])(--[a-z0-9-]+)\s*:/g));
    const read = [...new Set(caught(`${style}\n${withoutComments(themes)}`, /var\((--[a-z0-9-]+)/g))];
    expect(read.length).toBeGreaterThan(0);
    expect(read.filter((name) => !own.has(name) && !local.has(name) && !themed(name))).toEqual([]);
    // No theme defines a name the page's own block defines: a measure has one home.
    expect(blocks.flatMap(({ properties }) => properties.map(([name]) => name)).filter((name) => own.has(name))).toEqual([]);
  });
});
