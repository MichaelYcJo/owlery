// The screenshot command: `pnpm run screenshots` sets `OWLERY_SCREENSHOTS`
// and this file then starts the built app in the background, on a temporary
// repository with three work items, and writes one PNG file for each view
// (the inbox, a work item's view, a work item's menu and the "New work item"
// form) in each appearance of the theme a first run opens in. With
// `OWLERY_SCREENSHOT_THEMES` it captures other themes too: `all`, or names
// with commas between them. It writes into `screenshots/<the run's start>`
// under the app's folder, or into the folder `OWLERY_SCREENSHOT_DIR` names.
// Without `OWLERY_SCREENSHOTS` the file is the cases of the run's own
// functions, and starts no app. docs/design.md states when a pull request
// carries the files.
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { WINDOW_SIZE } from "../src/main/window-size";
import { BuiltApp, buildApp } from "./built-app";
import { temporaryRepository } from "./repositories";
import { pngSize, runFolder, type Shot, shots, themesAsked, type View } from "./screenshots";

/** The run, started by `pnpm run screenshots`. Without it the file is the cases. */
const RUN = process.env.OWLERY_SCREENSHOTS === "1";

const APP_DIR = join(__dirname, "..");

/** The pane's process of the run. */
const SAMPLE_PANE = join(__dirname, "fixtures", "sample-pane.sh");

/** The work items of the run, which are invented examples. The last one made is the one whose view and menu are captured. */
const WORK_ITEMS = ["Rename the settings file", "Add an export of the history", "Fix the login redirect"];

describe.skipIf(RUN)("the screenshot command, without the app", () => {
  it("captures the theme a first run opens in where no theme is asked for", () => {
    expect(themesAsked(undefined)).toEqual(["night-watch"]);
    expect(themesAsked("")).toEqual(["night-watch"]);
  });

  it("captures every theme where it is asked for all, and a named theme beside the first run's, in the themes' own order", () => {
    expect(themesAsked("all")).toEqual(["night-watch", "register", "desk"]);
    expect(themesAsked("desk")).toEqual(["night-watch", "desk"]);
    expect(themesAsked("desk, register")).toEqual(["night-watch", "register", "desk"]);
    expect(themesAsked("night-watch")).toEqual(["night-watch"]);
  });

  it("refuses a name that is no theme's, and names it", () => {
    expect(() => themesAsked("desk,letter")).toThrow("OWLERY_SCREENSHOT_THEMES names letter, and the themes are night-watch, register, desk, or all");
  });

  it("names one file for each view in each appearance of each theme", () => {
    expect(shots(["night-watch"]).map((shot) => shot.file)).toEqual([
      "night-watch-dark-inbox.png",
      "night-watch-dark-view.png",
      "night-watch-dark-menu.png",
      "night-watch-dark-dialog.png",
      "night-watch-light-inbox.png",
      "night-watch-light-view.png",
      "night-watch-light-menu.png",
      "night-watch-light-dialog.png",
    ]);
    const all = shots(["night-watch", "register", "desk"]);
    expect(all).toHaveLength(24);
    expect(new Set(all.map((shot) => shot.file)).size).toBe(24);
    expect(all[23]).toEqual({ theme: "desk", appearance: "light", view: "dialog", file: "desk-light-dialog.png" });
  });

  it("writes into a folder named by the run's start, or into the folder it is given", () => {
    expect(runFolder(undefined, "/app", new Date(Date.UTC(2026, 10, 22, 9, 15, 0, 123)))).toBe("/app/screenshots/20261122T091500Z");
    expect(runFolder("", "/app", new Date(Date.UTC(2026, 0, 2, 3, 4, 5)))).toBe("/app/screenshots/20260102T030405Z");
    expect(runFolder("/elsewhere/shots", "/app", new Date(0))).toBe("/elsewhere/shots");
    expect(runFolder("shots", "/app", new Date(0))).toBe(resolve("shots"));
  });

  it("reads a PNG file's width and height, and refuses bytes that are not a PNG file's", () => {
    // The first 24 bytes of a PNG file of 1440 by 900: its signature, and the length, the name and the first two fields of its header.
    const head = Buffer.from("89504e470d0a1a0a0000000d49484452000005a000000384", "hex");
    expect(pngSize(head)).toEqual({ width: 1440, height: 900 });
    expect(() => pngSize(Buffer.from("not a PNG file, and long enough to hold a header"))).toThrow("the bytes are not a PNG file's");
    expect(() => pngSize(head.subarray(0, 20))).toThrow("the bytes are not a PNG file's");
    const noHeader = Buffer.from(head);
    noHeader.write("IDAT", 12, "latin1");
    expect(() => pngSize(noHeader)).toThrow("the bytes are not a PNG file's");
  });
});

describe.skipIf(!RUN)("the screenshots of the built app", () => {
  let app: BuiltApp;
  let made: ReturnType<typeof temporaryRepository>;

  const SIDEBAR_LINE = `#repositories button[data-work-item="${WORK_ITEMS.length}"]`;
  const MENU = `[role="menu"]`;

  /** The page at rest: the pointer on nothing, and the one motion of the layout over. */
  const rest = async (): Promise<void> => {
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", x: 1, y: 1 });
    await new Promise((resolve) => setTimeout(resolve, 300));
  };

  /** A person's choice in one of the two controls of the sidebar's foot. */
  const choose = (control: "theme" | "appearance", choice: string): Promise<void> =>
    app.evaluate(`(() => { const choices = document.getElementById(${JSON.stringify(control)}); choices.value = ${JSON.stringify(choice)}; choices.dispatchEvent(new Event("change", { bubbles: true })); })()`);

  /** Opens the "New work item" form with a name typed in it, and waits for the branch the name gets. */
  const openForm = async (name: string): Promise<void> => {
    await app.click("#new-work-item");
    await app.until(`document.getElementById("work-item-dialog").open`, 'the "New work item" form');
    if ((await app.evaluate<string>(`document.getElementById("work-item-repo").value`)) !== made.repo) {
      await app.evaluate(`document.getElementById("work-item-repo").select()`);
      await app.cdp("Input.insertText", { text: made.repo });
    }
    const branch = `document.getElementById("work-item-branch").textContent`;
    await app.until(`${branch}.startsWith("owlery/") && !document.getElementById("work-item-base").disabled`, "the branch and the base of the name the form generated");
    const generated = await app.evaluate<string>(branch);
    await app.click("#work-item-title");
    await app.cdp("Input.insertText", { text: name });
    await app.until(`${branch}.startsWith("owlery/") && ${branch} !== ${JSON.stringify(generated)}`, `the branch of ${name}`);
  };

  /** Brings a view to the front, as a person does, and waits until it is drawn. */
  const show: Record<View, () => Promise<void>> = {
    inbox: async () => {
      await app.click("#nav-inbox");
      await app.until(`!document.getElementById("inbox-screen").hidden && document.querySelectorAll("#inbox-lines button[data-work-item]").length === ${WORK_ITEMS.length}`, "the inbox with its lines");
    },
    view: async () => {
      await app.click(SIDEBAR_LINE);
      await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === ${JSON.stringify(WORK_ITEMS.at(-1))} && document.querySelector("#stage .pane .xterm-scrollable-element")`, "the work item's view with its terminal");
    },
    menu: async () => {
      await show.inbox();
      const at = await app.evaluate<{ x: number; y: number }>(`(() => { const box = document.querySelector(${JSON.stringify(SIDEBAR_LINE)}).getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; })()`);
      await app.cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...at, button: "right", clickCount: 1 });
      await app.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...at, button: "right", clickCount: 1 });
      await app.until(`document.querySelector('${MENU}')`, "the work item's menu");
    },
    dialog: async () => {
      await show.inbox();
      await openForm("Show the seal on a line");
    },
  };

  /** Closes what a view opened over the window, so the next view starts from the window alone. */
  const leave: Partial<Record<View, () => Promise<void>>> = {
    menu: async () => {
      await app.cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", code: "Escape", key: "Escape", windowsVirtualKeyCode: 27 });
      await app.cdp("Input.dispatchKeyEvent", { type: "keyUp", code: "Escape", key: "Escape", windowsVirtualKeyCode: 27 });
      await app.until(`!document.querySelector('${MENU}')`, "the menu closed");
    },
    dialog: async () => {
      await app.click("#work-item-cancel");
      await app.until(`!document.getElementById("work-item-dialog").open`, "the form closed");
    },
  };

  /** The window as it is drawn, as a PNG file of the window's own size on a screen of any density. */
  const capture = async (): Promise<Buffer> => {
    const density = await app.evaluate<number>("window.devicePixelRatio");
    const { data } = await app.cdp<{ data: string }>("Page.captureScreenshot", { format: "png", clip: { x: 0, y: 0, width: WINDOW_SIZE.width, height: WINDOW_SIZE.height, scale: 1 / density } });
    return Buffer.from(data, "base64");
  };

  beforeAll(async () => {
    buildApp();
    made = temporaryRepository();
    app = await BuiltApp.start({ SHELL: SAMPLE_PANE, OWLERY_WORKTREES: made.root });
    // The app starts in the background, and the page of a window without the system's focus draws as one a person has left.
    await app.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
    await app.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");
    for (const name of WORK_ITEMS) {
      await openForm(name);
      await app.evaluate(`document.getElementById("work-item-kind").value = "shell"`);
      await app.click("#work-item-create");
      await app.until(`!document.getElementById("work-item-dialog").open && !document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === ${JSON.stringify(name)}`, `the view of ${name}`);
    }
  }, 120_000);

  afterAll(async () => {
    await app?.stop();
    made?.remove();
  }, 30_000);

  it("writes a PNG file of the window's size for each view, in each appearance of each theme it was asked for", async () => {
    const folder = runFolder(process.env.OWLERY_SCREENSHOT_DIR, APP_DIR, new Date());
    const wanted: Shot[] = shots(themesAsked(process.env.OWLERY_SCREENSHOT_THEMES));
    mkdirSync(folder, { recursive: true });

    for (const shot of wanted) {
      await choose("theme", shot.theme);
      await choose("appearance", shot.appearance);
      await app.until(`document.documentElement.dataset.theme === ${JSON.stringify(shot.theme)} && document.documentElement.dataset.appearance === ${JSON.stringify(shot.appearance)}`, `the window in ${shot.theme}, ${shot.appearance}`);
      await show[shot.view]();
      await rest();
      writeFileSync(join(folder, shot.file), await capture());
      await leave[shot.view]?.();
    }

    console.log(`${wanted.length} screenshots in ${folder}`);
    const written = wanted.map((shot) => readFileSync(join(folder, shot.file)));
    expect(written.map(pngSize)).toEqual(wanted.map(() => ({ width: WINDOW_SIZE.width, height: WINDOW_SIZE.height })));
    // A view that was not drawn, or a theme the page did not take, writes the bytes of the file before it.
    expect(new Set(written.map((bytes) => createHash("sha256").update(bytes).digest("hex"))).size).toBe(wanted.length);
  }, 300_000);
});
