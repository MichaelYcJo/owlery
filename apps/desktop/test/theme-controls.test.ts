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

  it("draws a line of the inbox, a group's head and a count in the form the theme in use gives them", async () => {
    await app.click("#nav-inbox");
    await app.until(`document.querySelector("#inbox-screen .line.selected") && document.querySelector("#inbox-screen .lines h2 .count")`, "the inbox with its selected line and a group's head");
    /** The forms a theme changes, as the page's style resolves them. */
    const forms = (): Promise<{ line: string; corner: string; head: string; headEdge: string; side: string; fact: string; words: string }> =>
      app.evaluate(
        `(() => { const of = (selector) => getComputedStyle(document.querySelector(selector)); return { line: of("#inbox-screen .line.selected").boxShadow, corner: of("#inbox-screen .line.selected").borderRadius, head: of("#inbox-screen .lines h2").backgroundColor, headEdge: of("#inbox-screen .lines h2").boxShadow, side: of("#sidebar").backgroundColor, fact: of("#inbox-screen .lines h2 .count").fontFamily, words: of("#inbox-screen .lines h2 .word").fontFamily }; })()`,
      );
    // Desk: a line is a tile with no edge, a group's head stands on no ground, and a count is set as the words are.
    const desk = await forms();
    expect(desk).toEqual({ line: "none", corner: "5px", head: "rgba(0, 0, 0, 0)", headEdge: "none", side: desk.side, fact: desk.words, words: desk.words });

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
  });
});
