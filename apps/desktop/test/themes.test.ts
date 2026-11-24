import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { APPEARANCES, appearanceFor, lookChoice, THEME_CHOICES, THEMES } from "../src/shared/appearance";

// The rules of the page's look that hold as text: a theme in an appearance is
// one block of src/renderer/themes.css, each theme the window can draw in has
// one for each appearance, red stands on the seal alone, a theme changes no
// measure, a block holds a mark for every state and the page draws a mark
// from the block's shapes, the words, the marks and the ring of the keyboard's
// focus stand apart from the ground under them, and the page names no colour,
// writes no shadow, gradient or corner outside a theme, and names no theme and
// no appearance.
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

/** A colour: its red, green and blue of 255, and how much of what lies under it it covers, from 0 to 1. */
type Colour = [number, number, number, number];

/** The colour a value names, in one of the forms a block writes a colour in: six hexadecimal digits, `rgb()` or `rgba()` with commas, or `transparent`. */
function colourOf(value: string): Colour {
  if (value === "transparent") return [0, 0, 0, 0];
  const digits = /^#([0-9a-f]{6})$/i.exec(value)?.[1];
  if (digits) return [Number.parseInt(digits.slice(0, 2), 16), Number.parseInt(digits.slice(2, 4), 16), Number.parseInt(digits.slice(4, 6), 16), 1];
  const parts = /^rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)$/.exec(value);
  if (parts) return [Number(parts[1]), Number(parts[2]), Number(parts[3]), parts[4] === undefined ? 1 : Number(parts[4])];
  throw new Error(`a colour is in no form this file reads: ${value}`);
}

/** What a property of a block holds, once every `var()` it is written as is followed to a value. */
function held(properties: [string, string][], name: string): string {
  let value = properties.find(([defined]) => defined === name)?.[1];
  for (let followed = 0; followed < 8; followed++) {
    const read = /^var\((--[a-z0-9-]+)\)$/.exec(value ?? "")?.[1];
    if (read === undefined) break;
    value = properties.find(([defined]) => defined === read)?.[1];
  }
  if (value === undefined) throw new Error(`the block defines no ${name}`);
  return value;
}

/** One colour laid over another. */
function over(top: Colour, under: Colour): Colour {
  const mixed = (at: 0 | 1 | 2) => top[at] * top[3] + under[at] * (1 - top[3]);
  return [mixed(0), mixed(1), mixed(2), 1];
}

/** The colour a person sees on a ground: its tokens laid over one another, the first at the bottom. */
function laid(properties: [string, string][], ground: string[]): Colour {
  return ground.map((name) => colourOf(held(properties, name))).reduce((under, top) => over(top, under));
}

/** The relative luminance of a colour, as WCAG 2 defines it. */
function luminance([red, green, blue]: Colour): number {
  const linear = (channel: number) => (channel / 255 <= 0.03928 ? channel / 255 / 12.92 : ((channel / 255 + 0.055) / 1.055) ** 2.4);
  return 0.2126 * linear(red) + 0.7152 * linear(green) + 0.0722 * linear(blue);
}

/** The contrast ratio of a token against a ground, as WCAG 2 defines it: from 1, the same colour, to 21, black on white. */
function contrast(properties: [string, string][], token: string, ground: string[]): number {
  const under = laid(properties, ground);
  const [light, dark] = [luminance(over(colourOf(held(properties, token)), under)), luminance(under)].sort((a, b) => b - a) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

// The floors of docs/design.md, Principles: words at 4.5 to 1 against the ground under them, and a mark or the ring of the keyboard's focus at 3 to 1.
// Words of 24px or more need 3 to 1 alone, and no token sets such words only, so every token that sets words is held to 4.5.
const WORDS_FLOOR = 4.5;
const MARK_FLOOR = 3;

// A ground is what is drawn under a word or a mark: tokens laid over one another, the first at the bottom.
// Which word stands on which ground is the layout's, which no style sheet says in a form a text reads, so the lists below say it, and the cases hold that no token that sets words is left out of them.
const WINDOW = "--ground";
const SIDE = "--ground-side";
const COLUMN = "--ground-column";
const CARD = "--ground-raised";
const FIELD = "--ground-sunken";
const TERMINAL = "--terminal-ground";
/** The grounds of the window's parts at rest: the window, the sidebar, a view's right column, a card, a field, a group's head and what an agent says. */
const AT_REST = [[WINDOW], [SIDE], [COLUMN], [CARD], [FIELD], [WINDOW, "--group-ground"], [WINDOW, "--said-ground"], [COLUMN, "--said-ground"]];
/** The grounds of a line, a sidebar's item and a menu's item under the pointer. */
const UNDER_THE_POINTER = [[WINDOW, "--hover"], [SIDE, "--hover"], [CARD, "--hover"]];
/** The grounds of the selected line and of the sidebar's item of what is in front. */
const SELECTED = [[WINDOW, "--selected"], [SIDE, "--selected"]];
/** The grounds under the letters a search matched, in a line and in a sidebar's item. */
const MATCHED = [[WINDOW], [SIDE], [WINDOW, "--hover"], [SIDE, "--hover"], ...SELECTED].map((ground) => [...ground, "--mark"]);
/** Each token that sets words, with the grounds its words stand on. A ground under a press lasts as long as the press, and is in no list. */
const WORDS: Record<string, string[][]> = {
  "--ink-strong": [...AT_REST, ...UNDER_THE_POINTER, ...SELECTED, ...MATCHED],
  "--ink": [...AT_REST, ...UNDER_THE_POINTER, ...SELECTED],
  // The key that puts the keyboard in the search field is in the muted ink on a badge, over the field.
  "--ink-muted": [...AT_REST, ...UNDER_THE_POINTER, ...SELECTED, [FIELD, "--badge"]],
  // On a selected ground an age and a count are in the muted ink, which the first case below holds, so the faint ink sets no word there.
  "--ink-faint": [...AT_REST, ...UNDER_THE_POINTER],
  // A state's words stand in the preview and under a view's panes, on the window's ground, and in a view's right column.
  "--state-waiting": [[WINDOW], [COLUMN]],
  "--state-working": [[WINDOW], [COLUMN]],
  "--state-finished": [[WINDOW], [COLUMN]],
  "--state-no-agent": [[WINDOW], [COLUMN]],
  // A failure's colour also sets the sidebar's notice, what a dialog refuses, and a line's "Setup failed", on a line at rest, under the pointer and selected.
  "--state-failed": [[WINDOW], [COLUMN], [SIDE], [CARD], [WINDOW, "--hover"], [WINDOW, "--selected"]],
  "--added": [[WINDOW], [COLUMN]],
  "--removed": [[WINDOW], [COLUMN]],
  "--on-main": [
    [WINDOW, "--main"],
    [WINDOW, "--main-hover"],
  ],
  "--badge-ink": [
    [WINDOW, "--badge"],
    [WINDOW, "--hover", "--badge"],
    [WINDOW, "--selected", "--badge"],
  ],
  "--terminal-ink": [[TERMINAL]],
  "--terminal-strong": [[TERMINAL]],
};
/** The grounds around a state's mark: in a line, in a sidebar's item and in a view's right column, at rest, under the pointer and selected. */
const AROUND_A_MARK = [[WINDOW], [SIDE], [COLUMN], [WINDOW, "--hover"], [SIDE, "--hover"], ...SELECTED];
/** The grounds around the ring of the keyboard's focus: the ring stands inside the edge of a button, an icon's button, a line, an item and a field, and outside the edge of the main button. */
const AROUND_THE_RING = [...AT_REST, [WINDOW, "--control"], [COLUMN, "--control"], [CARD, "--control"], ...UNDER_THE_POINTER, ...SELECTED];

/** Each pair of a token and a ground that stands under a floor, in every block, as one line that names the block, the pair and its ratio. */
function under(floor: number, pairs: (properties: [string, string][]) => [string, string[][]][]): string[] {
  return themeBlocks().flatMap(({ theme, properties }) =>
    pairs(properties).flatMap(([token, grounds]) =>
      grounds
        .map((ground) => ({ ground, ratio: contrast(properties, token, ground) }))
        .filter(({ ratio }) => ratio < floor)
        .map(({ ground, ratio }) => `${theme} ${token} on ${ground.join(" under ")}: ${ratio.toFixed(2)} to 1`),
    ),
  );
}

/** The declarations of the rule of the page's style whose selector is exactly this one. */
function ruled(selector: string): [string, string][] {
  const bodies = [...pageParts().style.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter((match) => (match[1] ?? "").trim() === selector).map((match) => match[2] ?? "");
  if (bodies.length !== 1) throw new Error(`the page's style holds ${bodies.length} rules for ${selector}`);
  return declarations(bodies[0] ?? "");
}

/** The colour a state's mark is seen by, in a block: the state's own where the mark has a line, and the colour of its fill where it is a filled shape alone. */
function markColour(properties: [string, string][], state: string): string {
  const lined = properties.some(([name, value]) => shapeOf(state, name) && !name.endsWith("-fill") && value !== "none");
  const fill = `--state-${state}-fill`;
  return !lined && properties.some(([name]) => name === fill) ? fill : `--state-${state}`;
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

describe("what a theme draws can be seen", () => {
  it("sets every word at 4.5 to 1 or more against each ground it stands on, in every block, a ground under the pointer and a selected one among them", () => {
    // The tokens the page's style sets words in: each a `color` reads, and through `--state` the colour of each state.
    const { style } = pageParts();
    const all = caught(style, /\{([^{}]*)\}/g).flatMap(declarations);
    const read = all.filter(([name]) => name === "color").flatMap(([, value]) => caught(value, /var\((--[a-z0-9-]+)/g));
    const states = all.filter(([name]) => name === "--state").flatMap(([, value]) => caught(value, /var\((--[a-z0-9-]+)/g));
    expect(states.length).toBe(markedStates().length);
    expect([...new Set([...read.filter((token) => token !== "--state"), ...states])].sort()).toEqual(Object.keys(WORDS).sort());
    // An age and a count on a selected ground are in the muted ink, and the letters a search matched in the strong one: the lists above stand on both.
    expect(ruled(".line.selected .age, .side-item[aria-current] .age, .side-item[aria-current] .count")).toEqual([["color", "var(--ink-muted)"]]);
    // So is a line's count of the decisions made without asking.
    expect(ruled(".line.selected .decided")).toEqual([["color", "var(--ink-muted)"]]);
    // The option chosen among a question's is marked in the strong ink, and not in the system's accent, which is a blue in every theme.
    expect(ruled('#questions input[type="radio"]')).toContainEqual(["accent-color", "var(--ink-strong)"]);
    expect(ruled("mark")).toContainEqual(["color", "var(--ink-strong)"]);
    // The close mark of a tab on the terminal's ground is in the terminal's inks, and never in an ink of the window's.
    expect(ruled("#tabs .tab.shown .close")).toEqual([["color", "var(--terminal-ink)"]]);
    expect(under(WORDS_FLOOR, () => Object.entries(WORDS))).toEqual([]);
  });

  it("draws every state's mark at 3 to 1 or more against each ground around it, in every block, and the marks of a selected line too", () => {
    const states = markedStates();
    expect(states.length).toBeGreaterThan(0);
    expect(under(MARK_FLOOR, (properties) => states.map((state): [string, string[][]] => [markColour(properties, state), AROUND_A_MARK]))).toEqual([]);
    // The marks of a pin and of muted notifications are in the faint ink, on a selected line as on any other.
    expect(under(MARK_FLOOR, () => [["--ink-faint", SELECTED]])).toEqual([]);
  });

  it("draws the ring of the keyboard's focus at 3 to 1 or more against each ground around it, in every block, and outside the edge of the main button, whose fill would hide it", () => {
    const { style } = pageParts();
    // Every ring the page draws is in `--focus`, but for the ring of a tab on the terminal's ground, which is dark in both appearances and takes the terminal's strong ink.
    const rings = caught(style, /\{([^{}]*)\}/g)
      .flatMap(declarations)
      .filter(([name]) => name === "outline" || name === "outline-color")
      .flatMap(([, value]) => caught(value, /var\((--[a-z0-9-]+)/g));
    expect([...new Set(rings)].sort()).toEqual(["--focus", "--terminal-strong"]);
    expect(ruled("button:focus-visible, input:focus-visible, select:focus-visible")).toContainEqual(["outline", "2px solid var(--focus)"]);
    expect(ruled("#tabs .tab.shown button:focus-visible")).toEqual([["outline-color", "var(--terminal-strong)"]]);
    expect(under(MARK_FLOOR, () => [
      ["--focus", AROUND_THE_RING],
      ["--terminal-strong", [[TERMINAL]]],
    ])).toEqual([]);
    // The main button is filled, in Night watch with the ring's own colour, so its ring stands outside its edge, on the ground around it.
    const offset = ruled(".primary:focus-visible").find(([name]) => name === "outline-offset")?.[1] ?? "";
    expect(offset).toMatch(/^\d+px$/);
    expect(Number.parseInt(offset, 10)).toBeGreaterThan(0);
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
