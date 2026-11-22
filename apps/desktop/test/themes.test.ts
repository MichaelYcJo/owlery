import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { APPEARANCES, appearanceFor, lookChoice, THEME_CHOICES, THEMES } from "../src/shared/appearance";

// The rules of the page's look that hold as text: a theme in an appearance is
// one block of src/renderer/themes.css, each theme the window can draw in has
// one for each appearance, red stands on the seal alone, a theme changes no
// measure, a block holds a mark for every state and the page draws a mark
// from the block's shapes, and the page names no colour, writes no shadow,
// gradient or corner outside a theme, and names no theme and no appearance.
// The values are the
// ones docs/design.md states, in both its editions: a block and the page's
// `:root` hold what its tables of tokens name, and nothing else. The files
// are read as text; no case loads the page.
const renderer = join(__dirname, "..", "src", "renderer");
const themes = readFileSync(join(renderer, "themes.css"), "utf8");
const page = readFileSync(join(renderer, "index.html"), "utf8");
const docs = join(__dirname, "..", "..", "..", "docs");
/** The editions of the document that is the source of every token's value. */
const EDITIONS = ["design.md", "design.ko.md"];

const withoutComments = (css: string): string => css.replace(/\/\*[\s\S]*?\*\//g, "");
const BLOCK = /:root\[data-theme="([^"]+)"\]\[data-appearance="([^"]+)"\]\s*\{([^{}]*)\}/g;

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

/** The theme blocks, each named by its theme and its appearance, with the properties it defines. */
function themeBlocks(): { theme: string; properties: [string, string][] }[] {
  return [...withoutComments(themes).matchAll(BLOCK)].map((match) => ({ theme: `${match[1] ?? ""} ${match[2] ?? ""}`, properties: declarations(match[3] ?? "") }));
}

/** Every theme in every appearance, as a block is named, in the order the blocks stand in. */
const PAIRS = THEMES.flatMap((theme) => APPEARANCES.map((appearance) => `${theme} ${appearance}`));

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

/** Whether a text names a colour of its own, as a hexadecimal number or with `rgb()`, `rgba()`, `hsl()` or `hsla()`. */
function namesColour(text: string): boolean {
  return [...text.matchAll(HEX)].length > 0 || [...text.matchAll(FUNCTION)].length > 0;
}

/** The page's own style sheet, and the page without it. */
function pageParts(): { style: string; markup: string } {
  const match = /<style>([\s\S]*?)<\/style>/.exec(page);
  if (!match) throw new Error("the page holds no style element");
  return { style: withoutComments(match[1] ?? ""), markup: page.replace(match[0], "") };
}

/** The measures the page's own `:root` block defines, each as its name and its value. */
function layoutMeasures(): [string, string][] {
  const layout = /(?:^|\})\s*:root\s*\{([^{}]*)\}/.exec(pageParts().style);
  if (!layout) throw new Error("the page's style holds no :root block");
  return declarations(layout[1] ?? "");
}

/** The states a mark is drawn for, as the classes the page's style gives a state's colour to name them. */
function markedStates(): string[] {
  return caught(pageParts().style, /\.state\.([a-z-]+)\s*\{/g);
}

/** Whether a property is a shape of this state's mark: `--shape-<state>`, or that name with a part's after it. */
function shapeOf(state: string, name: string): boolean {
  return name === `--shape-${state}` || name.startsWith(`--shape-${state}-`);
}

// A row of a table of tokens: the token's name, then its values, each in backticks in a cell of its own.
const TOKEN_ROW = /^\| `--[^`]*`(?: \| `[^`]*`)+ \|$/;

/** The tables of tokens a document holds, each with the heading it stands under and its rows, a row as the token's name and then its values. */
function tokenTables(text: string): { heading: string; rows: string[][] }[] {
  const tables: { heading: string; rows: string[][] }[] = [];
  let heading = "";
  let open: { heading: string; rows: string[][] } | undefined;
  for (const line of text.split("\n")) {
    if (/^#+ /.test(line)) heading = line.replace(/^#+ /, "");
    if (line.startsWith("| `--")) {
      if (!TOKEN_ROW.test(line)) throw new Error(`a row of tokens is in no form this file reads: ${line}`);
      if (!open) {
        open = { heading, rows: [] };
        tables.push(open);
      }
      open.rows.push(caught(line, /`([^`]*)`/g));
    } else if (!line.startsWith("|")) open = undefined;
  }
  return tables;
}

/** Where what a document names and what the style holds are not the same properties with the same values, one line for each difference, opening with `where`. */
function differences(where: string, named: [string, string][], held: [string, string][]): string[] {
  const found: string[] = [];
  for (const [name, value] of named) {
    const values = held.filter(([defined]) => defined === name).map(([, defined]) => defined);
    if (values.length === 0) found.push(`${where} ${name}: the document names it and the style holds none`);
    for (const other of values) if (other !== value) found.push(`${where} ${name}: the document says ${value} and the style holds ${other}`);
  }
  for (const [name] of held) if (!named.some(([token]) => token === name)) found.push(`${where} ${name}: the style holds it and the document does not name it`);
  return found;
}

describe("themes.css", () => {
  it("holds one block for each theme in each appearance, Night watch, Register and Desk in the dark and the light, and nothing else", () => {
    expect(themeBlocks().map(({ theme }) => theme)).toEqual(PAIRS);
    expect(PAIRS).toEqual(["night-watch dark", "night-watch light", "register dark", "register light", "desk dark", "desk light"]);
    expect(withoutComments(themes).replace(BLOCK, "").trim()).toBe("");
  });

  it("holds a red in no property but the seal's", () => {
    const reds = themeBlocks().flatMap(({ theme, properties }) => properties.filter(([, value]) => isRed(value)).map(([name]) => `${theme} ${name}`));
    // The seal's light is a red in every block, so the reading finds one where there is one.
    for (const pair of PAIRS) expect(reds).toContain(`${pair} --seal-light`);
    expect(reds.filter((name) => !name.includes(" --seal-"))).toEqual([]);
  });

  it("defines the same names in every block", () => {
    const blocks = themeBlocks().map(({ theme, properties }) => ({ theme, names: properties.map(([name]) => name).sort() }));
    expect(blocks.length).toBe(6);
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

  it("holds a mark for every state in every block: each shape is one state's, and a path or nothing, and no state is left with nothing", () => {
    const states = markedStates();
    expect(states).toEqual(["waiting", "working", "finished", "no-agent", "failed"]);
    const blocks = themeBlocks().map(({ theme, properties }) => ({ theme, shapes: properties.filter(([name]) => name.startsWith("--shape-")) }));
    for (const { shapes } of blocks) expect(shapes.length).toBeGreaterThan(0);
    const named = blocks.flatMap(({ theme, shapes }) => shapes.map(([name, value]) => ({ name: `${theme} ${name}`, value, state: states.find((state) => shapeOf(state, name)) })));
    expect(named.filter(({ state }) => state === undefined).map(({ name }) => name)).toEqual([]);
    expect(named.filter(({ value }) => value !== "none" && !/^path\("[^"]+"\)$/.test(value)).map(({ name }) => name)).toEqual([]);
    const unmarked = blocks.flatMap(({ theme, shapes }) => states.filter((state) => !shapes.some(([name, value]) => shapeOf(state, name) && value !== "none")).map((state) => `${theme} ${state}`));
    expect(unmarked).toEqual([]);
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
    const own = new Set(layoutMeasures().map(([name]) => name));
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

  it("draws a state's mark from the theme: its style reads every shape a block defines, and the fill of a wait and of a failure", () => {
    const { style } = pageParts();
    const shapes = [...new Set(themeBlocks().flatMap(({ properties }) => properties.map(([name]) => name).filter((name) => name.startsWith("--shape-"))))];
    expect(shapes.length).toBeGreaterThan(0);
    expect([...shapes, "--state-waiting-fill", "--state-failed-fill"].filter((name) => !style.includes(`var(${name})`))).toEqual([]);
  });

  it("carries the first run's theme and appearance in its markup, which the preload replaces with the saved choice before the page is drawn", () => {
    const first = lookChoice(undefined);
    expect(caught(page, /<html ([^>]*)>/g)).toEqual([`lang="en" data-theme="${first.theme}" data-appearance="${appearanceFor(first.appearance, true)}"`]);
  });

  it("names no theme and no appearance in a selector of its style or in a module", () => {
    // A theme is its blocks alone: a rule or a module that named one would draw a difference no block holds.
    const SELECTOR = /\[data-(?:theme|appearance)/;
    expect(SELECTOR.test(themes)).toBe(true);
    expect(SELECTOR.test(pageParts().style)).toBe(false);
    const modules = readdirSync(renderer).filter((file) => file.endsWith(".ts"));
    expect(modules.length).toBeGreaterThan(0);
    const NAMED = new RegExp(`["'\`](?:${[...THEMES, ...APPEARANCES].join("|")})["'\`]`);
    expect(NAMED.test(`"${THEMES[0]}"`)).toBe(true);
    expect(modules.filter((file) => SELECTOR.test(readFileSync(join(renderer, file), "utf8")) || NAMED.test(readFileSync(join(renderer, file), "utf8")))).toEqual([]);
  });
});

describe("docs/design.md", () => {
  it("names every property of every block and every measure of the page's :root with the value the style holds, in both editions, and no other token", () => {
    const blocks = themeBlocks();
    const measures = layoutMeasures();
    const labels = THEMES.map((theme) => THEME_CHOICES.find(({ value }) => value === theme)?.label);
    const found: string[] = [];
    for (const edition of EDITIONS) {
      const [layout, ...tables] = tokenTables(readFileSync(join(docs, edition), "utf8"));
      // The first table is the layout's measures, and then each theme has one under its own name, in the themes' order.
      expect(tables.map(({ heading }) => heading)).toEqual(labels);
      // A row of the measures holds one value, and a row of a theme one for each appearance, in the appearances' order.
      expect((layout?.rows ?? []).filter((row) => row.length !== 2)).toEqual([]);
      expect(tables.flatMap(({ rows }) => rows).filter((row) => row.length !== 1 + APPEARANCES.length)).toEqual([]);
      found.push(...differences(`${edition}, the page's :root,`, (layout?.rows ?? []).map(([name = "", value = ""]) => [name, value]), measures));
      THEMES.forEach((theme, at) => {
        APPEARANCES.forEach((appearance, column) => {
          const pair = `${theme} ${appearance}`;
          const named = (tables[at]?.rows ?? []).map((row): [string, string] => [row[0] ?? "", row[column + 1] ?? ""]);
          found.push(...differences(`${edition}, ${pair},`, named, blocks.find((block) => block.theme === pair)?.properties ?? []));
        });
      });
    }
    expect(found).toEqual([]);
  });
});
