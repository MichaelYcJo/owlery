// The two controls of the sidebar's foot in the built app: the one that
// chooses the theme and the one that chooses the appearance. The app starts
// once, in the background, on a temporary repository with one work item and
// one shell pane, so a case reads a terminal's colours too. The pane's
// process is the receiver, so no shell of the person's and no agent starts.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { GROUNDS } from "../src/main/appearance";
import { BuiltApp, buildApp } from "./built-app";
import { RECEIVER } from "./korean-pane";
import { temporaryRepository } from "./repositories";

/** A colour of six hexadecimal digits as the page's style reads one back. */
function rgb(hex: string): string {
  const [red, green, blue] = [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));
  return `rgb(${red}, ${green}, ${blue})`;
}

/** What the page shows of the look: its two attributes, the two controls, the ground its style resolves, and the ground of the terminal on the stage beside the one the theme's block names for it. */
interface Shown {
  theme: string | undefined;
  appearance: string | undefined;
  themeValue: string;
  themeTitle: string;
  appearanceValue: string;
  appearanceTitle: string;
  ground: string;
  terminalGround: string;
  /** Nothing where no terminal is on the stage: a page loaded again opens on a list. */
  terminal: string | null;
}

describe("the theme and the appearance in the built app", { timeout: 60_000 }, () => {
  let app: BuiltApp;
  let made: ReturnType<typeof temporaryRepository>;

  const shown = (): Promise<Shown> =>
    app.evaluate(
      `(() => { const root = document.documentElement; const style = getComputedStyle(root); return { theme: root.dataset.theme, appearance: root.dataset.appearance, themeValue: document.getElementById("theme").value, themeTitle: document.getElementById("theme-control").title, appearanceValue: document.getElementById("appearance").value, appearanceTitle: document.getElementById("appearance-control").title, ground: style.getPropertyValue("--ground").trim(), terminalGround: style.getPropertyValue("--terminal-ground").trim(), terminal: document.querySelector("#stage .pane .xterm-scrollable-element")?.style.backgroundColor ?? null }; })()`,
    );
  /** A person's choice in one of the two controls. */
  const choose = (control: "theme" | "appearance", choice: string): Promise<void> =>
    app.evaluate(`(() => { const choices = document.getElementById(${JSON.stringify(control)}); choices.value = ${JSON.stringify(choice)}; choices.dispatchEvent(new Event("change", { bubbles: true })); })()`);
  const file = (): string => join(app.userData, "appearance.json");
  /** What the file holds once it holds `wanted`. The main process writes it after the page changed. */
  const saved = async (wanted: { theme: string; appearance: string }): Promise<unknown> => {
    const deadline = Date.now() + 5_000;
    for (;;) {
      const held: unknown = existsSync(file()) ? JSON.parse(readFileSync(file(), "utf8")) : undefined;
      if (JSON.stringify(held) === JSON.stringify(wanted) || Date.now() >= deadline) return held;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  };
  /** The system's appearance as the page reads it, set through the debugging port. */
  const system = (appearance: "dark" | "light"): Promise<unknown> => app.cdp("Emulation.setEmulatedMedia", { features: [{ name: "prefers-color-scheme", value: appearance }] });

  beforeAll(async () => {
    buildApp();
    made = temporaryRepository();
    app = await BuiltApp.start({ SHELL: RECEIVER, OWLERY_WORKTREES: made.root, OWLERY_RECEIVER_FILE: join(made.base, "received") }, { inspectMain: true });
    await app.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");
    await app.click("#new-work-item");
    await app.until(`document.getElementById("work-item-dialog").open`, 'the "New work item" form');
    await app.evaluate(`document.getElementById("work-item-repo").select()`);
    await app.cdp("Input.insertText", { text: made.repo });
    await app.click("#work-item-title");
    await app.cdp("Input.insertText", { text: "Alpha" });
    await app.evaluate(`document.getElementById("work-item-kind").value = "shell"`);
    // Create creates nothing before the form shows the plan of its folder.
    await app.until(`document.getElementById("work-item-branch").textContent !== ""`, "the plan of the folder");
    await app.click("#work-item-create");
    await app.until(`!document.getElementById("work-item-view").hidden && document.querySelector("#stage .pane .xterm-scrollable-element")`, "the view of Alpha with its terminal");
  }, 120_000);

  afterAll(async () => {
    await app?.stop();
    made?.remove();
  }, 30_000);

  it("opens a first run in Night watch, in the dark appearance, on that ground, and offers the three themes and the three choices of appearance", async () => {
    expect(existsSync(file())).toBe(false);
    const first = await shown();
    expect(first).toEqual({
      theme: "night-watch",
      appearance: "dark",
      themeValue: "night-watch",
      themeTitle: "Theme: Night watch",
      appearanceValue: "dark",
      appearanceTitle: "Appearance: Dark",
      ground: GROUNDS["night-watch"].dark,
      terminalGround: first.terminalGround,
      terminal: rgb(first.terminalGround),
    });
    expect(first.terminalGround).toMatch(/^#[0-9a-f]{6}$/);
    // The window itself was opened on that ground, before any page was drawn.
    expect((await app.evaluateMain<string>(`electron.BrowserWindow.getAllWindows()[0].getBackgroundColor()`)).toLowerCase()).toBe(GROUNDS["night-watch"].dark);
    expect(await app.evaluate<[string, string][]>(`[...document.getElementById("theme").options].map((option) => [option.value, option.textContent])`)).toEqual([
      ["night-watch", "Night watch"],
      ["register", "Register"],
      ["desk", "Desk"],
    ]);
    expect(await app.evaluate<[string, string][]>(`[...document.getElementById("appearance").options].map((option) => [option.value, option.textContent])`)).toEqual([
      ["dark", "Dark"],
      ["light", "Light"],
      ["system", "Match the system"],
    ]);
    expect(await app.evaluate<(string | null)[]>(`["theme", "appearance"].map((id) => document.getElementById(id).getAttribute("aria-label"))`)).toEqual(["Theme", "Appearance"]);
  });

  it("follows a choice of theme and a choice of appearance at once, in the page, in the terminal and in the saved file", async () => {
    const before = await shown();

    await choose("theme", "register");
    const register = await shown();
    expect(register).toEqual({ ...before, theme: "register", themeValue: "register", themeTitle: "Theme: Register", ground: GROUNDS.register.dark, terminalGround: register.terminalGround, terminal: rgb(register.terminalGround) });
    expect(register.terminalGround).not.toBe(before.terminalGround);
    expect(await saved({ theme: "register", appearance: "dark" })).toEqual({ theme: "register", appearance: "dark" });

    await choose("theme", "desk");
    expect(await shown()).toEqual({ ...register, theme: "desk", themeValue: "desk", themeTitle: "Theme: Desk", ground: GROUNDS.desk.dark });
    expect(await saved({ theme: "desk", appearance: "dark" })).toEqual({ theme: "desk", appearance: "dark" });

    await choose("appearance", "light");
    const light = await shown();
    expect(light).toEqual({ ...register, theme: "desk", themeValue: "desk", themeTitle: "Theme: Desk", appearance: "light", appearanceValue: "light", appearanceTitle: "Appearance: Light", ground: GROUNDS.desk.light, terminalGround: light.terminalGround, terminal: rgb(light.terminalGround) });
    expect(light.terminalGround).not.toBe(register.terminalGround);
    expect(await saved({ theme: "desk", appearance: "light" })).toEqual({ theme: "desk", appearance: "light" });
  });

  it("opens the next page in the saved choice before its module runs, and under Match the system follows the system's appearance while the window is open", async () => {
    // A page loaded again holds nothing of the page before it, so what it shows is what the main process read from the file.
    // The new page notes its two attributes when its body begins, which is before its own module runs: what stands there then is the preload's. The debugging port runs such a script only once its Page domain is on.
    await app.cdp("Page.enable");
    await app.cdp("Page.addScriptToEvaluateOnNewDocument", {
      source: `new MutationObserver((_records, observer) => { if (!document.body) return; window.__atBody = [document.documentElement.dataset.theme, document.documentElement.dataset.appearance]; observer.disconnect(); }).observe(document, { childList: true, subtree: true });`,
    });
    await app.evaluate(`window.__beforeReload = true`);
    await app.cdp("Page.reload");
    await app.until(`window.__beforeReload === undefined && document.getElementById("theme")?.options.length === 3`, "the page loaded again, with its controls");
    expect(await app.evaluate<string[]>(`window.__atBody`)).toEqual(["desk", "light"]);
    const again = await shown();
    expect(again).toEqual({ theme: "desk", appearance: "light", themeValue: "desk", themeTitle: "Theme: Desk", appearanceValue: "light", appearanceTitle: "Appearance: Light", ground: GROUNDS.desk.light, terminalGround: again.terminalGround, terminal: null });

    await system("dark");
    await choose("appearance", "system");
    const dark = await shown();
    expect(dark).toEqual({ ...again, appearance: "dark", appearanceValue: "system", appearanceTitle: "Appearance: Match the system", ground: GROUNDS.desk.dark, terminalGround: dark.terminalGround });
    expect(await saved({ theme: "desk", appearance: "system" })).toEqual({ theme: "desk", appearance: "system" });

    await system("light");
    await app.until(`document.documentElement.dataset.appearance === "light"`, "the light appearance once the system's turned");
    expect(await shown()).toEqual({ ...again, appearanceValue: "system", appearanceTitle: "Appearance: Match the system" });
    // The system's turning is no choice, so the file still holds the choice to match it.
    expect(JSON.parse(readFileSync(file(), "utf8"))).toEqual({ theme: "desk", appearance: "system" });
  });

  it("draws a line of the inbox, a row of a list of records, a group's head and a count in the form the theme in use gives them", async () => {
    await app.click("#nav-inbox");
    await app.until(`document.querySelector("#inbox-screen .line.selected") && document.querySelector("#inbox-screen .lines h2 .count")`, "the inbox with its selected line and a group's head");
    /** The forms a theme changes, as the page's style resolves them. */
    const forms = (): Promise<{ line: string; corner: string; head: string; headEdge: string; side: string; fact: string; words: string }> =>
      app.evaluate(
        `(() => { const of = (selector) => getComputedStyle(document.querySelector(selector)); return { line: of("#inbox-screen .line.selected").boxShadow, corner: of("#inbox-screen .line.selected").borderRadius, head: of("#inbox-screen .lines h2").backgroundColor, headEdge: of("#inbox-screen .lines h2").boxShadow, side: of("#sidebar").backgroundColor, fact: of("#inbox-screen .lines h2 .count").fontFamily, words: of("#inbox-screen .lines h2 .word").fontFamily }; })()`,
      );
    /** The edge under a row of each list of records, as the page's style resolves it: a commit and a changed file of a work item, a path its setup copied and one it could not, and the term and the value of a fact of a view. Alpha has no commit and no setup of its own, so each row is one this reading puts where the page puts its own, and takes away. */
    const rows = (): Promise<{ commit: string; file: string; copied: string; notCopied: string; term: string; value: string }> =>
      app.evaluate(
        `(() => { const made = []; const edge = (within, tag, name) => { const row = document.createElement(tag); row.className = name; document.querySelector(within).append(row); made.push(row); return getComputedStyle(row).boxShadow; }; const found = { commit: edge("#view-detail", "div", "commit"), file: edge("#view-detail", "div", "file"), copied: edge("#view-detail", "div", "copied"), notCopied: edge("#view-detail", "div", "not-copied"), term: edge("#view-fact-list", "dt", ""), value: edge("#view-fact-list", "dd", "") }; for (const row of made) row.remove(); return found; })()`,
      );
    // Desk: a line is a tile with no edge, a row of a list of records has none either, a group's head stands on no ground, and a count is set as the words are.
    const desk = await forms();
    expect(desk).toEqual({ line: "none", corner: "5px", head: "rgba(0, 0, 0, 0)", headEdge: "none", side: desk.side, fact: desk.words, words: desk.words });
    expect(await rows()).toEqual({ commit: "none", file: "none", copied: "none", notCopied: "none", term: "none", value: "none" });

    // Register: the selected line has the strong rule at its left and the rule under it, a group's head is a ruled band on the sidebar's ground, and a count is in the fixed-width face.
    await choose("theme", "register");
    const register = await forms();
    expect(register.line.match(/inset/g)).toHaveLength(1);
    expect(register.line).toMatch(/0px 1px 0px 0px$/);
    expect(register.corner).toBe("0px");
    expect(register.head).toBe(register.side);
    expect(register.headEdge.match(/inset/g)).toHaveLength(2);
    expect(register.fact).toMatch(/^ui-monospace/);
    expect(register.words).toBe(desk.words);
    // Register rules each row of a list of records as it rules a line at rest: one rule under the row, and no rule at its left.
    const ruled = await rows();
    for (const edge of [ruled.commit, ruled.file, ruled.copied, ruled.notCopied, ruled.term, ruled.value]) {
      expect(edge).toMatch(/0px 1px 0px 0px$/);
      expect(edge).not.toContain("inset");
    }
    // The sidebar's items are navigation, and an item at rest carries no rule in Register.
    expect(await app.evaluate<string>(`getComputedStyle(document.querySelector("#sidebar-nav .side-item:not([aria-current])")).boxShadow`)).toBe("none");

    // A fact's rule is drawn under its term and under its value, so the two end at one height where the value runs to several lines, and the rule runs unbroken. The worktree's folder is such a value.
    await app.click("#repositories [data-work-item]");
    await app.until(`!document.getElementById("work-item-view").hidden && document.querySelector("#view-fact-list dd")`, "the view of Alpha with its facts");
    const facts = await app.evaluate<{ term: string; lines: number; termBottom: number; valueBottom: number }[]>(
      `[...document.querySelectorAll("#view-fact-list dt")].map((term) => { const value = term.nextElementSibling; const text = document.createRange(); text.selectNodeContents(value); return { term: term.textContent, lines: new Set([...text.getClientRects()].map((box) => Math.round(box.top))).size, termBottom: term.getBoundingClientRect().bottom, valueBottom: value.getBoundingClientRect().bottom }; })`,
    );
    expect(facts.filter((fact) => fact.lines > 1).map((fact) => fact.term)).toContain("Worktree");
    for (const fact of facts) expect({ term: fact.term, bottom: fact.termBottom }).toEqual({ term: fact.term, bottom: fact.valueBottom });
  });

  it("draws a path the setup could not copy whole, and under it the error the system gave, whole, wrapped, selectable and in the fixed-width face", async () => {
    await app.click("#repositories [data-work-item]");
    await app.until(`!document.getElementById("work-item-view").hidden && document.querySelector("#view-detail")`, "the view of Alpha");
    // A row built as shared.ts builds it, in a list of the view's detail, with a path and an error longer than the column, neither of which holds a space to break at.
    const row = await app.evaluate<{ pathCut: boolean; whyCut: boolean; below: boolean; face: boolean; selectable: string; kept: string }>(
      `(() => { const list = document.createElement("ul"); const row = document.createElement("li"); row.className = "not-copied"; const path = document.createElement("span"); path.className = "path"; path.textContent = "certs/" + "nested/".repeat(30) + "localhost-key.pem"; const why = document.createElement("span"); why.className = "why"; why.textContent = "EACCES: permission denied, copyfile '" + "/private/var/folders/xc/abc/T/owlery/".repeat(6) + "certs/localhost-key.pem'"; row.append(path, why); list.append(row); document.querySelector("#view-detail").append(list); const style = getComputedStyle(why); const found = { pathCut: path.scrollWidth > path.clientWidth, whyCut: why.scrollWidth > why.clientWidth, below: why.getBoundingClientRect().top >= path.getBoundingClientRect().bottom, face: style.fontFamily === getComputedStyle(path).fontFamily, selectable: style.userSelect, kept: style.whiteSpace }; list.remove(); return found; })()`,
    );
    expect(row).toEqual({ pathCut: false, whyCut: false, below: true, face: true, selectable: "text", kept: "pre-wrap" });
  });

  it("draws each state's mark in the shapes and the fill the theme in use gives the state", async () => {
    await app.click("#nav-inbox");
    await app.until(`document.querySelector("#inbox-lines .state-icon.no-agent path.line")`, "the mark of Alpha's line in the inbox");
    /** A mark's parts as the page draws them, and as the theme's properties give them. The mark of a state no work item is in is a copy of the line's own mark under that state's class. */
    interface Mark {
      line: string;
      fill: string;
      track: string;
      turn: string;
      fillColour: string;
    }
    /** How wide the filled part is across the middle of the mark, in units of the mark's square of 16, and the width and the height of its box. */
    interface Lit {
      across: number;
      width: number;
      height: number;
    }
    const marks = (): Promise<Record<string, { drawn: Mark; themed: Mark; lit: Lit }>> =>
      app.evaluate(
        `(() => {
          const real = document.querySelector("#inbox-lines .state-icon.no-agent");
          const theme = getComputedStyle(document.documentElement);
          // What the engine reads back for a shape or a colour the theme names: a path of the same svg, with nothing but that value.
          const probe = document.createElementNS("http://www.w3.org/2000/svg", "path");
          real.querySelector("svg").append(probe);
          const shape = (name) => { probe.style.setProperty("d", name === null ? "none" : theme.getPropertyValue(name).trim()); return getComputedStyle(probe).getPropertyValue("d"); };
          const colour = (name) => { probe.style.setProperty("fill", theme.getPropertyValue(name).trim()); return getComputedStyle(probe).fill; };
          const found = {};
          for (const state of ["waiting", "working", "finished", "no-agent", "failed"]) {
            // Alpha has no agent, so that state's mark is the line's own, with the classes the page gave it.
            const own = state === "no-agent";
            const mark = own ? real : real.cloneNode(true);
            if (!own) {
              mark.className = "state-icon state " + state;
              mark.querySelector("svg").lastElementChild.remove();
              document.body.append(mark);
            }
            const part = (name) => getComputedStyle(mark.querySelector("path." + name));
            const works = state === "working";
            // The filled part as the engine draws it: the points of the mark's middle row it fills, a tenth of a unit apart, and its box.
            const filled = mark.querySelector("path.fill");
            let across = 0;
            for (let x = 0.05; x < 16; x += 0.1) if (filled.isPointInFill(new DOMPoint(x, 8))) across += 1;
            const box = filled.getBBox();
            found[state] = {
              drawn: { line: part("line").getPropertyValue("d"), fill: part("fill").getPropertyValue("d"), track: part("track").getPropertyValue("d"), turn: part("turn").getPropertyValue("d"), fillColour: part("fill").fill },
              themed: { line: shape("--shape-" + state), fill: shape("--shape-" + state + "-fill"), track: shape(works ? "--shape-working-track" : null), turn: shape(works ? "--shape-working-turn" : null), fillColour: colour(state === "waiting" || state === "failed" ? "--state-" + state + "-fill" : "--state-" + state) },
              lit: { across: across / 10, width: box.width, height: box.height },
            };
            if (!own) mark.remove();
          }
          probe.remove();
          return found;
        })()`,
      );
    const seen: Record<string, Record<string, Mark>> = {};
    const lit: Record<string, Record<string, Lit>> = {};
    for (const [theme, appearance] of [
      ["night-watch", "light"],
      ["register", "dark"],
      ["desk", "dark"],
    ] as const) {
      await choose("theme", theme);
      await choose("appearance", appearance);
      const found = await marks();
      seen[theme] = {};
      lit[theme] = {};
      for (const [state, { drawn, themed, lit: filled }] of Object.entries(found)) {
        expect({ theme, state, ...drawn }).toEqual({ theme, state, ...themed });
        // Every state has a part that is drawn.
        expect([drawn.line, drawn.fill, drawn.track, drawn.turn].filter((part) => part !== "none").length).toBeGreaterThan(0);
        seen[theme][state] = drawn;
        lit[theme][state] = filled;
      }
    }
    // Night watch draws how far work has come as how full the moon is: the filled part, dark or light as the appearance gives the state's colour, is wider across the mark's middle at work than asleep, and wider finished than at work.
    const moon = lit["night-watch"] ?? {};
    expect(moon["no-agent"]?.across).toBeGreaterThan(0);
    expect(moon.working?.across).toBeGreaterThan(moon["no-agent"]?.across ?? Number.POSITIVE_INFINITY);
    expect(moon.finished?.across).toBeGreaterThan(moon.working?.across ?? Number.POSITIVE_INFINITY);
    // Finished is a wholly filled disc: a filled part as wide as it is tall, and no line, no track and no part that turns. At work is a half-filled disc, and nothing of it turns.
    expect(moon.finished?.width).toBeGreaterThan(0);
    expect(moon.finished?.width).toBeCloseTo(moon.finished?.height ?? 0, 2);
    const full = seen["night-watch"]?.finished;
    expect({ line: full?.line, track: full?.track, turn: full?.turn }).toEqual({ line: "none", track: "none", turn: "none" });
    expect({ track: seen["night-watch"]?.working?.track, turn: seen["night-watch"]?.working?.turn }).toEqual({ track: "none", turn: "none" });
    // The comparison reads shapes: a wait is Night watch's eye with its pupil, Register's filled box and Desk's filled disc, and the eye's pupil is filled in a colour of its own in the light appearance.
    expect(seen["night-watch"]?.waiting?.line).toMatch(/^path\(/);
    expect(seen.register?.waiting?.line).toBe("none");
    expect(new Set([seen["night-watch"]?.waiting?.fill, seen.register?.waiting?.fill, seen.desk?.waiting?.fill]).size).toBe(3);
    expect(seen["night-watch"]?.waiting?.fillColour).toBe(rgb("#e9b61a"));
  });
});
