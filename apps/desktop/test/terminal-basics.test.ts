// layer: app
// What a terminal pane and the window around it do for a person, read in the
// built app: the window stays on its own page, the menu leaves the page its
// keys, the Command key with W closes the pane in front, a pane whose
// session is working asks before it closes, a press of the right button on
// a pane's tab opens the tab's menu, whose items close that pane, the other
// panes or the panes to its right and ask once before a close of several
// where one is working, a file dropped on a pane types
// its path, a link opens at a click with the Command key, Shift+Enter
// sends a line feed, a path a pane printed is a link where something stands
// at it, a file's link opens in the editor the person chose at the line the
// pane printed, a link under the pointer shows a card of what a click does,
// a paste of an image hands the pane a file's path, Control+V stays the
// program's, a press of the right button on a pane opens the pane's menu, the left
// arrow, the right arrow and Backspace with the Command key are the editing
// keys of macOS, a pane's terminal holds the lines of history the scrollback
// names, and holds them again once it came back onto the stage, and the find
// bar searches them.
// One start of the app serves every case, so the cases run in the order
// they stand in. No case opens the system's browser, Finder or an editor:
// the app is started with `OWLERY_OPENER` naming a program that notes the
// address or the path it was handed. No case reads or writes the system's
// clipboard: the app starts in the background, where it keeps a clipboard
// of its own.
import { execFileSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { installedApps } from "../src/main/openers";
import { CARD_LEAVE_MS, CARD_SHOW_MS, deleteSays } from "../src/renderer/view";
import { alive, atRestAfterFailure, BuiltApp, buildApp, formPlanOf, untilGone } from "./built-app";
import { openReceiverPane, Received } from "./korean-pane";
import { temporaryRepository } from "./repositories";

/** The panes' process: `SHELL` for the app the cases start. */
const SHELL = join(__dirname, "fixtures", "basics-shell.sh");

/** The Command key's place in a key event of the debugging port, and the Control key's where the keyboard has no Command key. */
const COMMAND = process.platform === "darwin" ? 4 : 2;
/** The Option key's place there, and the Shift key's. */
const OPTION = 1;
const SHIFT = 8;

/** A paste as a pane's process receives it where it asked for pastes in brackets, which a shell pane of these cases does (./fixtures/basics-shell.sh). */
const pasted = (text: string): string => `\u001b[200~${text}\u001b[201~`;

/** The two links a shell pane prints (./fixtures/basics-shell.sh): the address on its first row, and the address the name on its second row carries. */
const PRINTED = "https://example.com/owlery-basics";
const NAMED = "https://example.com/owlery-named";

const TABS = `[...document.querySelectorAll("#tabs .tab .label")].map((label) => label.textContent)`;
const TAB_IN_FRONT = `document.querySelector("#tabs .tab.active .label")?.textContent`;
const PANE_HAS_KEYBOARD = `document.activeElement === document.querySelector("#stage .pane:not([hidden]) .xterm-helper-textarea")`;
const DIALOG_OPEN = `document.getElementById("close-pane-dialog")?.open === true`;
const CARD_SHOWN = `document.getElementById("link-card")?.hidden === false`;
/** The first tile of the stage that is not hidden: the pane in front, where the stage shows one pane. */
const FIRST_TILE = `document.querySelector("#stage .pane:not([hidden])")`;
/** Whether the terminal of a tile, which an expression of the page gives, has the pointer over a link. */
const overLink = (tile: string): string => `(${tile}).querySelector(".xterm-cursor-pointer") !== null`;
const OVER_LINK = overLink(FIRST_TILE);
/** The keys a card's row names for a click with the key that opens a link, and for one with the Shift key as well. */
const KEY_CLICK = process.platform === "darwin" ? "\u2318 Click" : "Ctrl Click";
const SHIFT_KEY_CLICK = process.platform === "darwin" ? "\u21e7 \u2318 Click" : "Shift Ctrl Click";
/** The editors of the main process's list this Mac holds, which the Settings dialog offers. */
const EDITORS = installedApps(existsSync, homedir()).flatMap(({ name, kind }) => (kind === "editor" ? [name] : []));
/** The rows of a file's card before an editor is chosen: the first asks for one on a Mac that holds an editor of the list, and a file's card is a path's on one that holds none. */
const FILE_ROWS =
  EDITORS.length > 0
    ? [
        ["Open in an editor…", KEY_CLICK],
        ["Show in Finder", SHIFT_KEY_CLICK],
        ["Copy path", ""],
      ]
    : [
        ["Show in Finder", KEY_CLICK],
        ["Copy path", ""],
      ];
const SETTINGS_OPEN = `document.getElementById("app-settings-dialog")?.open === true`;
/** A row of the screen no case prints on, where the pointer is over no link. */
const EMPTY_ROW = 15;
const SCREEN_IN_FRONT = `["summary-screen", "inbox-screen", "history-screen", "work-item-view"].find((id) => document.getElementById(id)?.hidden === false)`;

/** One entry of the application menu, as Electron built it. */
interface Built {
  /** The labels from the menu bar down to the entry. */
  path: string;
  role: string;
  accelerator: string;
}

/** An accelerator's key and its modifier keys, the names Electron takes for the Command key as one. */
function keyOf(accelerator: string): { key: string; modifiers: string[] } {
  const parts = accelerator.split("+");
  const modifiers = parts.slice(0, -1).map((part) => (["command", "cmd", "commandorcontrol", "cmdorctrl"].includes(part.toLowerCase()) ? "command" : part.toLowerCase()));
  return { key: (parts.at(-1) ?? "").toUpperCase(), modifiers: modifiers.sort() };
}

describe("a terminal pane's basics in the built app", { timeout: 30_000 }, () => {
  let app: BuiltApp;
  let repository: ReturnType<typeof temporaryRepository>;
  let receivedFile: string;
  /** The bytes the first pane's process was handed. */
  let received: Received;
  /** The file the opener writes each address and each path it was handed to, a line each. */
  let openedFile: string;
  /** The file whose lines a shell pane prints under its two links as it starts (./fixtures/basics-shell.sh). */
  let linesFile: string;
  /** The panes the cases opened so far. A daemon numbers the panes it starts from 1. */
  let panes = 0;
  /** The panes `openPane` opened so far. */
  const openedPanes: number[] = [];

  /** The file the shell pane with a number writes its process id to. */
  const pidFile = (pane: number): string => `${receivedFile}-${pane}.pid`;

  beforeAll(async () => {
    buildApp();
    repository = temporaryRepository("terminal-basics");
    receivedFile = join(repository.base, "received");
    // The program that stands for the system's opener: it adds each argument it was started with to a file, on a line of its own.
    openedFile = join(repository.base, "opened");
    const opener = join(repository.base, "opener.sh");
    writeFileSync(opener, `#!/bin/sh\nprintf '%s\\n' "$@" >> '${openedFile}'\n`);
    chmodSync(opener, 0o755);
    linesFile = join(repository.base, "lines");
    app = await BuiltApp.start({ SHELL, OWLERY_WORKTREES: repository.root, OWLERY_RECEIVER_FILE: receivedFile, OWLERY_STAND_IN_NODE: process.execPath, OWLERY_OPENER: opener, OWLERY_BASICS_LINES: linesFile }, { inspectMain: true });
    // The app starts in the background, and the page of a window without the system's focus reports none.
    await app.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
    await openReceiverPane(app, repository.repo, `${receivedFile}-1`);
    panes = 1;
    received = new Received(`${receivedFile}-1`);
  }, 120_000);

  afterAll(async () => {
    await app?.stop();
    repository?.remove();
  }, 30_000);

  /** The process id of a shell pane's process, once the pane has started it. */
  async function pidOf(pane: number): Promise<number> {
    const deadline = Date.now() + 15_000;
    while (!existsSync(pidFile(pane))) {
      if (Date.now() >= deadline) throw new Error(`pane ${pane} did not start its process`);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    return Number(readFileSync(pidFile(pane), "utf8"));
  }

  /** Presses the view's button that opens a pane of a kind, and waits for its tab. It answers with the pane's number. */
  async function openPane(label: "Shell" | "Claude Code"): Promise<number> {
    const before = await app.evaluate<string[]>(TABS);
    const button = (await app.evaluate<string[]>(`[...document.querySelectorAll("#pane-buttons button")].map((button) => button.textContent)`)).indexOf(`+ ${label}`);
    await app.click(`#pane-buttons button:nth-child(${button + 1})`);
    await app.until(`${TABS}.length === ${before.length + 1}`, `a tab more than ${before.join(", ") || "none"}`);
    panes += 1;
    openedPanes.push(panes);
    return panes;
  }

  /** A press and a release of a letter's key with the Command key, and the Shift key as well where `shift`, sent to the page as a person's key arrives there. */
  async function command(letter: "W" | "N" | "F" | "G", shift = false): Promise<void> {
    const key = { modifiers: COMMAND | (shift ? SHIFT : 0), windowsVirtualKeyCode: letter.charCodeAt(0), code: `Key${letter}`, key: shift ? letter : letter.toLowerCase() };
    await app.cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", ...key });
    await app.cdp("Input.dispatchKeyEvent", { type: "keyUp", ...key });
  }

  /** Has a client of the daemon other than the window close the panes among `asked` that the daemon holds, as a second window of the app would, and answers with the panes it closed. */
  async function closeFromElsewhere(...asked: number[]): Promise<number[]> {
    const { port, token } = JSON.parse(readFileSync(join(app.userData, "run", "daemon.json"), "utf8")) as { port: number; token: string };
    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    const ready = await new Promise<{ sessions: { id: number }[] }>((resolve, reject) => {
      socket.addEventListener("error", () => reject(new Error("the daemon refused a second client")), { once: true });
      // The daemon answers a hello it takes with `ready`, which lists the panes it holds, and a close sent before that is no client's.
      socket.addEventListener("message", (event) => resolve(JSON.parse(String(event.data)) as { sessions: { id: number }[] }), { once: true });
      socket.addEventListener("open", () => socket.send(JSON.stringify({ type: "hello", token })), { once: true });
    });
    const held = asked.filter((pane) => ready.sessions.some((session) => session.id === pane));
    for (const pane of held) socket.send(JSON.stringify({ type: "close", id: pane }));
    socket.close();
    return held;
  }

  // A case that fails stops at its failing line, and leaves the panes it opened and "Side by side" as they were there. The cases after it start from one tab, the first pane's, with "Side by side" off. A case that passes leaves what the case after it reads: it closes its panes itself, or hands its pane on, as the case "makes a path a pane printed a link…" hands its pane to the case after it. So this acts after a case that failed alone. It is bounded as a case is, since its wait for one tab is the 15 seconds of `BuiltApp.until`, past Vitest's 10-second bound for a hook.
  afterEach(async ({ task }) => {
    if (task.result?.state !== "fail") return;
    const left = await closeFromElsewhere(...openedPanes);
    if (left.length > 0) await app.until(`${TABS}.length === 1`, "one tab, once the panes the failed case left are closed");
    // The button is pressed from the page, since a case that failed may have left another screen in front of the view that holds it.
    await app.evaluate(`void (document.getElementById("side-by-side").getAttribute("aria-pressed") === "true" && document.getElementById("side-by-side").click())`);
  }, 30_000);
  // The cases share one app, so a dialog or a menu a failed case leaves open would keep every later case from opening one.
  afterEach(atRestAfterFailure(() => app));

  /** Puts the one work item's view in front from another screen, by its line in the sidebar. */
  async function openView(): Promise<void> {
    await app.click("#repositories [data-work-item]");
    try {
      await app.until(`!document.getElementById("work-item-view").hidden && ${PANE_HAS_KEYBOARD}`, "the work item's view with the keyboard in its pane");
    } catch (error) {
      const found = await app.evaluate<string>(`JSON.stringify({ front: ${SCREEN_IN_FRONT}, tabs: ${TABS}, active: document.activeElement?.outerHTML.slice(0, 200), items: document.querySelectorAll("#repositories [data-work-item]").length, status: document.getElementById("status").textContent })`);
      throw new Error(`${(error as Error).message}; the page holds ${found}`);
    }
  }

  it("has a menu that leaves the page its keys, and closes the window on Shift+Command+W", async () => {
    const built = await app.evaluateMain<Built[] | null>(`(() => {
      const walk = (menu, above) => menu.items.flatMap((item) => [
        { path: [...above, item.label].join(" / "), role: item.role ?? "", accelerator: item.accelerator ?? "" },
        ...(item.submenu ? walk(item.submenu, [...above, item.label]) : []),
      ]);
      const menu = electron.Menu.getApplicationMenu();
      return menu ? walk(menu, []) : null;
    })()`);
    expect(built, "the app has no application menu").not.toBeNull();
    const entries = built as Built[];
    // The keys the page reads with the Command key (src/renderer/view.ts, `commandKey`), G with the Shift key as well among them, and the three a pane reads with it (`paneKey`). A menu entry on one of them takes the key before the page sees it.
    const taken = entries.filter(({ accelerator }) => {
      const { key, modifiers } = keyOf(accelerator);
      return (["K", "N", "W", "F", "G", "LEFT", "RIGHT", "BACKSPACE"].includes(key) && modifiers.join("+") === "command") || (key === "G" && modifiers.join("+") === "command+shift");
    });
    expect(taken.map(({ path, accelerator }) => `${path}: ${accelerator}`)).toEqual([]);
    const closeWindow = entries.find(({ path }) => path === "File / Close Window");
    expect(closeWindow?.role).toBe("close");
    expect(keyOf(closeWindow?.accelerator ?? "")).toEqual({ key: "W", modifiers: ["command", "shift"] });
    const roles = entries.map(({ role }) => role);
    expect(roles).toEqual(expect.arrayContaining(["copy", "paste", "quit"]));
    if (process.platform === "darwin") expect(entries.map(({ path }) => path)).toEqual(expect.arrayContaining(["Owlery / About Owlery", "Owlery / Hide Owlery", "Owlery / Quit Owlery"]));
  });

  it("opens no window the page asks for", async () => {
    const other = join(repository.base, "other.html");
    writeFileSync(other, "<title>not Owlery</title>");
    const opened = await app.evaluate<boolean>(`window.open(${JSON.stringify(pathToFileURL(other).href)}) !== null`);
    expect(opened).toBe(false);
    // A window that opened is listed a moment after the call.
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(await app.pages()).toHaveLength(1);
  });

  it("stays on its own page where the page asks to leave, and loads again where the page reloads", async () => {
    const own = await app.evaluate<string>("location.href");
    const other = join(repository.base, "other.html");
    writeFileSync(other, "<title>not Owlery</title>");
    await app.evaluate(`void (location.href = ${JSON.stringify(pathToFileURL(other).href)})`);
    // A navigation that is let through has replaced the page by then.
    await new Promise((resolve) => setTimeout(resolve, 1_000));
    expect(await app.evaluate<string>("location.href")).toBe(own);
    expect(await app.evaluate<string[]>(TABS)).toEqual(["Shell"]);

    // The mark is the page's own, so it is gone once the page has loaded again.
    await app.evaluate(`void (window.__beforeReload = true, location.reload())`);
    await app.until(`window.__beforeReload === undefined && ${SCREEN_IN_FRONT} !== undefined`, "the page loaded again, with a screen in front");
    // A page that loaded shows no card of a link before the pointer rested on one.
    expect(await app.evaluate<boolean>(CARD_SHOWN)).toBe(false);
    expect(await app.evaluate<string>("location.href")).toBe(own);
    expect(await app.pages()).toEqual([own]);
  });

  it("does nothing on Command+W where no pane is in front, and keeps the window", async () => {
    // The pane was in front in the view, and is in front of nothing once the view is left.
    await openView();
    await app.click("#nav-inbox");
    await app.until(`document.getElementById("inbox-screen").hidden === false`, "the inbox screen");
    const pid = await pidOf(1);
    await command("W");
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(await app.pages()).toHaveLength(1);
    expect(await app.evaluate<string | undefined>(SCREEN_IN_FRONT)).toBe("inbox-screen");
    expect(alive(pid)).toBe(true);
    await openView();
    expect(await app.evaluate<string[]>(TABS)).toEqual(["Shell"]);
  });

  it('closes a shell pane at the first press of its "×", and asks nothing', async () => {
    const pane = await openPane("Shell");
    const pid = await pidOf(pane);
    expect(await app.evaluate<string[]>(TABS)).toEqual(["Shell 1", "Shell 2"]);
    expect(await app.evaluate<string>(TAB_IN_FRONT)).toBe("Shell 2");
    await app.click("#tabs .tab.active .close");
    expect(await app.evaluate<boolean>(DIALOG_OPEN)).toBe(false);
    await app.until(`${TABS}.length === 1`, "one tab");
    expect(await app.evaluate<boolean>(DIALOG_OPEN)).toBe(false);
    expect(await untilGone([pid], 5_000)).toEqual([]);
  });

  it("closes the pane in front on Command+W, puts the other pane in front and keeps the window", async () => {
    const first = await pidOf(1);
    const pane = await openPane("Shell");
    const pid = await pidOf(pane);
    expect(await app.evaluate<string>(TAB_IN_FRONT)).toBe("Shell 2");
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the new pane");
    await command("W");
    await app.until(`${TABS}.length === 1`, "one tab");
    expect(await untilGone([pid], 5_000)).toEqual([]);
    expect(alive(first)).toBe(true);
    expect(await app.evaluate<string>(TAB_IN_FRONT)).toBe("Shell");
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the pane that is left");
    expect(await app.pages()).toHaveLength(1);
  });

  it("asks before a pane whose session is working closes, and closes it only on \"Close pane\"", async () => {
    await openPane("Claude Code");
    await app.until(`document.getElementById("strip-state").textContent.startsWith("Working")`, "the new pane's session as working");
    expect(await app.evaluate<string[]>(TABS)).toEqual(["Shell", "Claude Code"]);
    const sentence = `document.getElementById("close-pane-sentence")?.textContent`;
    const hasKeyboard = (id: string): Promise<boolean> => app.evaluate<boolean>(`document.activeElement === document.getElementById(${JSON.stringify(id)})`);

    await app.click("#tabs .tab.active .close");
    await app.until(DIALOG_OPEN, "the dialog that asks before the close");
    expect(await app.evaluate<string>(sentence)).toBe("Claude Code is working. Closing the pane ends its session.");
    expect(await hasKeyboard("close-pane-cancel")).toBe(true);
    expect(await app.evaluate<string[]>(TABS)).toEqual(["Shell", "Claude Code"]);

    await app.click("#close-pane-cancel");
    expect(await app.evaluate<boolean>(DIALOG_OPEN)).toBe(false);
    // The daemon would have taken the pane off its lists by then.
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(await app.evaluate<string[]>(TABS)).toEqual(["Shell", "Claude Code"]);
    expect(await app.evaluate<boolean>(PANE_HAS_KEYBOARD)).toBe(true);

    await command("W");
    await app.until(DIALOG_OPEN, "the dialog again, at Command+W");
    expect(await hasKeyboard("close-pane-cancel")).toBe(true);
    // While the dialog is open the window reads none of its keys: N with the Command key would open the "New work item" form over it.
    await command("N");
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(await app.evaluate<boolean>(`document.getElementById("work-item-dialog").open`)).toBe(false);
    await app.cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", windowsVirtualKeyCode: 27, code: "Escape", key: "Escape" });
    await app.cdp("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: 27, code: "Escape", key: "Escape" });
    await app.until(`!(${DIALOG_OPEN})`, "the dialog closed at Escape");
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(await app.evaluate<string[]>(TABS)).toEqual(["Shell", "Claude Code"]);

    await command("W");
    await app.until(DIALOG_OPEN, "the dialog a third time");
    await app.click("#close-pane-confirm");
    await app.until(`${TABS}.length === 1`, "one tab");
    expect(await app.evaluate<string[]>(TABS)).toEqual(["Shell"]);
    expect(await app.evaluate<boolean>(DIALOG_OPEN)).toBe(false);
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the pane that is left");
  });

  it("names the pane by its tab's label, and closes the dialog where its pane is gone while it asks", async () => {
    // The strip reads the newest live pane of a kind that reports state, which is the pane just opened (src/renderer/view.ts, `lineSession`).
    const working = (): Promise<void> => app.until(`document.getElementById("strip-state").textContent.startsWith("Working")`, "the newest pane's session as working");
    const first = await openPane("Claude Code");
    await working();
    const second = await openPane("Claude Code");
    await working();
    // Two panes of one kind, so each tab's label carries its place and differs from the kind's label (src/renderer/view.ts, `tabLabel`).
    expect(await app.evaluate<string[]>(TABS)).toEqual(["Shell", "Claude Code 1", "Claude Code 2"]);
    expect(await app.evaluate<string>(TAB_IN_FRONT)).toBe("Claude Code 2");
    await command("W");
    await app.until(DIALOG_OPEN, "the dialog that asks before the close");
    expect(await app.evaluate<string>(`document.getElementById("close-pane-sentence")?.textContent`)).toBe("Claude Code 2 is working. Closing the pane ends its session.");
    await closeFromElsewhere(second);
    await app.until(`${TABS}.length === 2`, "two tabs");
    expect(await app.evaluate<boolean>(DIALOG_OPEN)).toBe(false);
    await closeFromElsewhere(first);
    await app.until(`${TABS}.length === 1`, "one tab");
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the pane that is left");
  });

  /** The menu a press of the right button on a pane's tab opens (src/renderer/menu.ts), while it is open. */
  const TAB_MENU = `document.querySelector('.menu[role="menu"]')`;
  /** The words of each item of the open tab's menu, from its top. */
  const TAB_MENU_ITEMS = `[...${TAB_MENU}.querySelectorAll('[role="menuitem"]')].map((item) => item.textContent)`;

  /** Opens the menu of the tab at a place of the strip, from 1, by a press of the right button in the middle of its label, and waits for it. */
  async function openTabMenu(place: number): Promise<void> {
    const at = await app.evaluate<{ x: number; y: number }>(`(() => { const box = document.querySelector("#tabs .tab:nth-child(${place}) .label").getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; })()`);
    await rightPress(at);
    await app.until(`${TAB_MENU} !== null`, `the menu of the tab at place ${place}`);
  }

  /** Presses the item of the open tab's menu with these words, as a person's press arrives, and waits until the menu is gone. */
  async function pressTabMenuItem(text: string): Promise<void> {
    const at = await app.evaluate<{ x: number; y: number }>(`(() => { const box = [...${TAB_MENU}.querySelectorAll('[role="menuitem"]')].find((item) => item.textContent === ${JSON.stringify(text)}).getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; })()`);
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", ...at });
    await app.cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...at, button: "left", clickCount: 1 });
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...at, button: "left", clickCount: 1 });
    await app.until(`${TAB_MENU} === null`, `the tab's menu closed at "${text}"`);
  }

  it("opens a tab's menu at a press of the right button, with \"Rename…\" and the close items the tab's place leaves, and closes the panes an item names at once where none is working", async () => {
    const first = await pidOf(1);
    const second = await pidOf(await openPane("Shell"));
    const third = await pidOf(await openPane("Shell"));
    expect(await app.evaluate<string[]>(TABS)).toEqual(["Shell 1", "Shell 2", "Shell 3"]);
    await app.evaluate(`void document.addEventListener("contextmenu", (event) => { window.__tabMenuDefault = !event.defaultPrevented; }, { once: true })`);
    await openTabMenu(2);
    // The system's own menu is kept from opening.
    expect(await app.evaluate<boolean>("window.__tabMenuDefault")).toBe(false);
    expect(await app.evaluate<string | null>(`${TAB_MENU}.getAttribute("aria-label")`)).toBe("Menu of Shell 2");
    expect(await app.evaluate<string[]>(TAB_MENU_ITEMS)).toEqual(["Rename…", "Close Pane", "Close Other Panes", "Close Panes to the Right"]);
    await pressTabMenuItem("Close Panes to the Right");
    await app.until(`${TABS}.length === 2`, "two tabs");
    expect(await app.evaluate<boolean>(DIALOG_OPEN)).toBe(false);
    expect(await untilGone([third], 5_000)).toEqual([]);
    expect(await app.evaluate<string[]>(TABS)).toEqual(["Shell 1", "Shell 2"]);

    // No tab stands after the last one.
    await openTabMenu(2);
    expect(await app.evaluate<string[]>(TAB_MENU_ITEMS)).toEqual(["Rename…", "Close Pane", "Close Other Panes"]);
    await press("Escape", 27);
    await app.until(`${TAB_MENU} === null`, "the tab's menu closed at Escape");
    expect(await app.evaluate<string[]>(TABS)).toEqual(["Shell 1", "Shell 2"]);

    // A close that leaves the pane in front leaves it the keyboard, though the press was on the menu.
    await app.click("#tabs .tab:nth-child(1) .label");
    await app.until(`${TAB_IN_FRONT} === "Shell 1"`, "the first pane in front");
    await openTabMenu(1);
    await pressTabMenuItem("Close Other Panes");
    await app.until(`${TABS}.length === 1`, "one tab");
    expect(await app.evaluate<boolean>(DIALOG_OPEN)).toBe(false);
    expect(await untilGone([second], 5_000)).toEqual([]);
    expect(alive(first)).toBe(true);
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the pane that is left");

    // The one tab of a work item has no other pane to close.
    await openTabMenu(1);
    expect(await app.evaluate<string[]>(TAB_MENU_ITEMS)).toEqual(["Rename…", "Close Pane"]);
    await press("Escape", 27);
    await app.until(`${TAB_MENU} === null`, "the tab's menu closed at Escape");
  });

  it("asks once before closing the other panes where one of them is working, names that one, and closes them only at the dialog's main button", async () => {
    await openPane("Claude Code");
    await app.until(`document.getElementById("strip-state").textContent.startsWith("Working")`, "the new pane's session as working");
    const shell = await pidOf(await openPane("Shell"));
    expect(await app.evaluate<string[]>(TABS)).toEqual(["Shell 1", "Claude Code", "Shell 2"]);
    const hasKeyboard = (id: string): Promise<boolean> => app.evaluate<boolean>(`document.activeElement === document.getElementById(${JSON.stringify(id)})`);

    await openTabMenu(1);
    await pressTabMenuItem("Close Other Panes");
    await app.until(DIALOG_OPEN, "the dialog that asks before the close");
    expect(await app.evaluate<string>(`document.getElementById("close-pane-sentence")?.textContent`)).toBe("Claude Code is working. Closing 2 panes ends its session.");
    expect(await app.evaluate<string>(`document.getElementById("close-pane-confirm")?.textContent`)).toBe("Close 2 panes");
    expect(await hasKeyboard("close-pane-cancel")).toBe(true);
    await app.click("#close-pane-cancel");
    expect(await app.evaluate<boolean>(DIALOG_OPEN)).toBe(false);
    // The daemon would have taken the panes off its lists by then.
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(await app.evaluate<string[]>(TABS)).toEqual(["Shell 1", "Claude Code", "Shell 2"]);
    expect(alive(shell)).toBe(true);

    await openTabMenu(1);
    await pressTabMenuItem("Close Other Panes");
    await app.until(DIALOG_OPEN, "the dialog again");
    await app.click("#close-pane-confirm");
    await app.until(`${TABS}.length === 1`, "one tab");
    expect(await app.evaluate<string[]>(TABS)).toEqual(["Shell"]);
    expect(await untilGone([shell], 5_000)).toEqual([]);
    expect(await app.evaluate<boolean>(DIALOG_OPEN)).toBe(false);
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the pane that is left");
  });

  it("closes the dialog of a close of several panes where the daemon stops listing one of them, and closes none of the others", async () => {
    const claude = await openPane("Claude Code");
    await app.until(`document.getElementById("strip-state").textContent.startsWith("Working")`, "the new pane's session as working");
    const pane = await openPane("Shell");
    const shell = await pidOf(pane);
    expect(await app.evaluate<string[]>(TABS)).toEqual(["Shell 1", "Claude Code", "Shell 2"]);
    await openTabMenu(1);
    await pressTabMenuItem("Close Other Panes");
    await app.until(DIALOG_OPEN, "the dialog that asks before the close");
    await closeFromElsewhere(claude);
    await app.until(`${TABS}.length === 2`, "two tabs");
    expect(await app.evaluate<boolean>(DIALOG_OPEN)).toBe(false);
    // A close the dialog sent would have reached the daemon by then.
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(await app.evaluate<string[]>(TABS)).toEqual(["Shell 1", "Shell 2"]);
    expect(alive(shell)).toBe(true);
    await closeFromElsewhere(pane);
    await app.until(`${TABS}.length === 1`, "one tab");
    expect(await untilGone([shell], 5_000)).toEqual([]);
  });

  /** Whether the dialog that renames a pane's tab is open. */
  const NAME_DIALOG_OPEN = `document.getElementById("pane-name-dialog")?.open === true`;
  /** What the delete dialog of the one work item names under "Running sessions that end", once it is open with as many lines as `count`. */
  async function deleteDialogSessions(count: number): Promise<string[]> {
    const at = await app.evaluate<{ x: number; y: number }>(`(() => { const box = document.querySelector("#repositories [data-work-item]").getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; })()`);
    await rightPress(at);
    await app.until(`document.querySelector('[role="menu"]')`, "the work item's menu");
    await app.evaluate(`(() => { for (const item of document.querySelectorAll('[role="menu"] [role="menuitem"]')) item.toggleAttribute("data-pressed-here", item.textContent === "Delete"); })()`);
    await app.click(`[role="menu"] [role="menuitem"][data-pressed-here]`);
    await app.until(`document.getElementById("delete-dialog").open && document.querySelectorAll("#delete-sessions li").length === ${count}`, `the delete dialog with ${count} running sessions`);
    const named = await app.evaluate<string[]>(`[...document.querySelectorAll("#delete-sessions li")].map((item) => item.textContent)`);
    // The dialog asks what a delete would lose as it opens, and the loss it draws above the buttons moves Cancel down: Cancel is pressed once the loss stands.
    await app.until(`document.getElementById("delete-says").textContent !== ${JSON.stringify(deleteSays(null))}`, "the loss in the delete dialog");
    await app.click("#delete-cancel");
    await app.until(`!document.getElementById("delete-dialog").open`, "the delete dialog closed");
    return named;
  }

  it("renames a pane at \"Rename…\" of its tab's menu, in a dialog that holds the tab's label selected: the new name stands on its tab and in the delete dialog, the other tabs keep their numbers, an empty name names the pane by its kind again, a Save of the untouched field names nothing, so the tab is numbered again once a pane before it closes, and the dialog closes, naming nothing, where its pane is gone", async () => {
    const second = await openPane("Shell");
    const third = await openPane("Shell");
    expect(await app.evaluate<string[]>(TABS)).toEqual(["Shell 1", "Shell 2", "Shell 3"]);
    const field = `document.getElementById("pane-name-field")`;
    await openTabMenu(2);
    await pressTabMenuItem("Rename…");
    await app.until(NAME_DIALOG_OPEN, "the rename dialog");
    expect(await app.evaluate<unknown[]>(`[document.getElementById("pane-name-head").textContent, ${field}.value, document.activeElement === ${field}, ${field}.selectionStart, ${field}.selectionEnd, ${field}.maxLength]`)).toEqual(["Rename Shell 2", "Shell 2", true, 0, 7, 60]);
    // What is typed takes the place of the label, which is selected whole.
    await app.cdp("Input.insertText", { text: "  build " });
    await app.click("#pane-name-submit");
    await app.until(`!(${NAME_DIALOG_OPEN})`, "the rename dialog closed once the daemon kept the name");
    await app.until(`JSON.stringify(${TABS}) === ${JSON.stringify(JSON.stringify(["Shell 1", "build", "Shell 3"]))}`, "the renamed tab between the two that keep their numbers");
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the pane in front once the dialog closed");
    expect(await deleteDialogSessions(3)).toEqual(["Shell 1", "build", "Shell 3"]);

    // An empty name gives the tab its kind's label back, and the dialog's close gives the keyboard back to the pane in front, which the delete dialog's close left on the work item's line.
    await openTabMenu(2);
    await pressTabMenuItem("Rename…");
    await app.until(NAME_DIALOG_OPEN, "the rename dialog again");
    expect(await app.evaluate<unknown[]>(`[document.getElementById("pane-name-head").textContent, ${field}.value]`)).toEqual(["Rename build", "build"]);
    await press("Backspace", 8);
    expect(await app.evaluate<string>(`${field}.value`)).toBe("");
    await app.click("#pane-name-submit");
    await app.until(`!(${NAME_DIALOG_OPEN})`, "the rename dialog closed at the empty name");
    await app.until(`JSON.stringify(${TABS}) === ${JSON.stringify(JSON.stringify(["Shell 1", "Shell 2", "Shell 3"]))}`, "the tab named by its kind again");
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the pane in front once the dialog closed again");

    // A Save of the field as it opened, the kind's label, gives the third pane no name.
    await openTabMenu(3);
    await pressTabMenuItem("Rename…");
    await app.until(NAME_DIALOG_OPEN, "the rename dialog of the third tab");
    expect(await app.evaluate<string>(`${field}.value`)).toBe("Shell 3");
    await app.click("#pane-name-submit");
    await app.until(`!(${NAME_DIALOG_OPEN})`, "the rename dialog closed at the untouched name");
    expect(await app.evaluate<string[]>(TABS)).toEqual(["Shell 1", "Shell 2", "Shell 3"]);

    // The pane the dialog names is closed by another client while the dialog is open. The third pane, which holds no name, is then the second of its kind.
    await openTabMenu(2);
    await pressTabMenuItem("Rename…");
    await app.until(NAME_DIALOG_OPEN, "the rename dialog of the second tab");
    await closeFromElsewhere(second);
    await app.until(`!(${NAME_DIALOG_OPEN})`, "the rename dialog closed with its pane");
    await app.until(`JSON.stringify(${TABS}) === ${JSON.stringify(JSON.stringify(["Shell 1", "Shell 2"]))}`, "the third pane numbered as the second of its kind");
    await closeFromElsewhere(third);
    await app.until(`${TABS}.length === 1`, "one tab");
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the pane that is left");
  });

  it("colours a tab from the row of its menu: the row's swatches follow \"Rename…\" for the arrow keys, a swatch draws a bar 2px high in its colour's token along the tab's bottom edge and ends the tab's tooltip and name with the colour's word, it is checked at the next opening, and No colour takes the bar off", async () => {
    const pane = await openPane("Shell");
    expect(await app.evaluate<string[]>(TABS)).toEqual(["Shell 1", "Shell 2"]);
    const SWATCHES = `[...${TAB_MENU}.querySelectorAll('[role="menuitemradio"]')].map((item) => [item.getAttribute("aria-label"), item.getAttribute("aria-checked")])`;
    const tab = `document.querySelector("#tabs .tab:nth-child(2)")`;
    /** Presses the swatch of the open tab's menu with these words, as a person's press arrives, and waits until the menu is gone. */
    const pressSwatch = async (words: string): Promise<void> => {
      const at = await app.evaluate<{ x: number; y: number }>(`(() => { const box = ${TAB_MENU}.querySelector('[role="menuitemradio"][aria-label=${JSON.stringify(words)}]').getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; })()`);
      await app.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", ...at });
      await app.cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...at, button: "left", clickCount: 1 });
      await app.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...at, button: "left", clickCount: 1 });
      await app.until(`${TAB_MENU} === null`, `the tab's menu closed at the swatch ${words}`);
    };

    await openTabMenu(2);
    expect(await app.evaluate<string[][]>(SWATCHES)).toEqual([["Green", "false"], ["Blue", "false"], ["Pink", "false"], ["No colour", "true"]]);
    expect(await app.evaluate<string | null>(`document.activeElement?.textContent`)).toBe("Rename…");
    await press("ArrowDown", 40);
    expect(await app.evaluate<string | null>(`document.activeElement?.getAttribute("aria-label")`)).toBe("Green");
    await pressSwatch("Blue");
    await app.until(`${tab}.dataset.colour === "blue"`, "the second tab marked blue");
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the pane in front once the swatch was pressed");
    // The bar's colour is the token's, as the page resolves it.
    const blue = await app.evaluate<string>(`(() => { const probe = document.createElement("span"); probe.style.color = "var(--tab-blue)"; document.body.append(probe); const got = getComputedStyle(probe).color; probe.remove(); return got; })()`);
    expect(await app.evaluate<string[]>(`(() => { const bar = getComputedStyle(${tab}, "::after"); return [bar.height, bar.backgroundColor, bar.bottom, bar.left, bar.right, String(bar.width === getComputedStyle(${tab}).width)]; })()`)).toEqual(["2px", blue, "0px", "0px", "0px", "true"]);
    expect(await app.evaluate<(string | null)[]>(`[${tab}.querySelector(".label").title, ${tab}.querySelector(".label").getAttribute("aria-label")]`)).toEqual(["Shell 2, Blue", "Shell 2, Blue"]);

    await openTabMenu(2);
    expect(await app.evaluate<string[][]>(SWATCHES)).toEqual([["Green", "false"], ["Blue", "true"], ["Pink", "false"], ["No colour", "false"]]);
    await pressSwatch("No colour");
    await app.until(`${tab}.dataset.colour === undefined`, "the second tab with no colour");
    expect(await app.evaluate<(string | null)[]>(`[getComputedStyle(${tab}, "::after").content, ${tab}.querySelector(".label").getAttribute("title"), ${tab}.querySelector(".label").getAttribute("aria-label")]`)).toEqual(["none", null, null]);
    await closeFromElsewhere(pane);
    await app.until(`${TABS}.length === 1`, "one tab");
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the pane that is left");
  });

  // The cases below read the first pane, which is the one tab, in front, with the keyboard.

  /** The middle of a cell of the screen of a tile, the first tile not hidden where none is named, by its column and its row, each from 0. The strip says how many of each the screen of the pane in front holds, and two tiles side by side are of one size. */
  function cell(column: number, row: number, tile = FIRST_TILE): Promise<{ x: number; y: number }> {
    return app.evaluate(`(() => {
      const box = (${tile}).querySelector(".xterm-screen").getBoundingClientRect();
      const [columns, rows] = document.getElementById("strip-size").textContent.split("×").map(Number);
      return { x: box.x + (box.width / columns) * ${column + 0.5}, y: box.y + (box.height / rows) * ${row + 0.5} };
    })()`);
  }

  /** Brings the pointer to a cell of a tile, the first tile not hidden where none is named, as a person's pointer arrives there. */
  async function pointAt(column: number, row: number, modifiers = 0, tile = FIRST_TILE): Promise<{ x: number; y: number }> {
    const at = await cell(column, row, tile);
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", ...at, modifiers });
    return at;
  }

  /** Takes the pointer to a row of a tile, the first tile not hidden where none is named, that holds no link, and waits until the terminal has it over none and the card of the link it was on is gone: a card stands over the rows under its link, and the pointer would come onto it and not onto a link there. */
  async function pointAway(tile = FIRST_TILE): Promise<void> {
    await pointAt(9, EMPTY_ROW, 0, tile);
    await app.until(`!(${overLink(tile)}) && !(${CARD_SHOWN})`, "no link under the pointer, and no card");
  }

  /**
   * Brings the pointer onto a cell of a tile, the first tile not hidden where
   * none is named, from a row with no link, until `expression` holds there,
   * and answers where the pointer is.
   * The terminal looks for the links of a row as the pointer comes onto it,
   * and not again while the pointer stays on it, so a row drawn after the
   * pointer came holds no link under it. The output of a pane that has just
   * started, and the replay of a pane whose view has just come in front,
   * can arrive after the case's pointer (#117). So the pointer comes again
   * each two seconds, from the row with no link, until `what` shows, fifteen
   * seconds at most.
   */
  async function comeOnto(column: number, row: number, expression: string, what: string, modifiers = 0, tile = FIRST_TILE): Promise<{ x: number; y: number }> {
    const deadline = Date.now() + 15_000;
    for (;;) {
      await pointAway(tile);
      const at = await pointAt(column, row, modifiers, tile);
      const again = Date.now() + 2_000;
      do {
        if (await app.evaluate<boolean>(expression)) return at;
        await new Promise((resolve) => setTimeout(resolve, 50));
      } while (Date.now() < again);
      if (Date.now() >= deadline) throw new Error(`the window never showed ${what}`);
    }
  }

  /**
   * Waits until the link on the first row of a tile, the first tile not
   * hidden where none is named, is drawn again, and takes the pointer off
   * it. A pane that came back onto the stage is sent nothing until its
   * terminal has drawn its replay (src/renderer/view.ts, `screenTurns`), and
   * a shell pane asks for pastes in brackets in the `printf` that prints that
   * link, the mode first (./fixtures/basics-shell.sh). So a key or a drop
   * after this reaches the pane, a paste in brackets. It presses nothing,
   * and gives no pane the keyboard.
   */
  async function untilReplayDrawn(tile = FIRST_TILE): Promise<void> {
    await comeOnto(9, 0, overLink(tile), "the link on the pane's first row, drawn again from its replay", 0, tile);
    await pointAway(tile);
  }

  /** A click on the link of a row of the pane in front, with the modifier keys held, as a person's click arrives: the pointer comes over the link first. Afterwards the pointer is over no link. */
  async function clickLink(row: number, modifiers: number, column = 9): Promise<void> {
    const at = await comeOnto(column, row, OVER_LINK, `a link under the pointer on row ${row + 1}`, modifiers);
    await app.cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...at, button: "left", clickCount: 1, modifiers });
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...at, button: "left", clickCount: 1, modifiers });
    await pointAway();
  }

  /** Whether the terminal finds a link under the pointer at a cell of the pane in front. The pointer comes from a row with no link, and a link that asks the main process is there within the second this waits. */
  async function linkAt(column: number, row: number): Promise<boolean> {
    await pointAway();
    await pointAt(column, row);
    const deadline = Date.now() + 1_000;
    while (Date.now() < deadline) {
      if (await app.evaluate<boolean>(OVER_LINK)) return true;
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return false;
  }

  /** Rests the pointer on a cell of the pane in front until the link's card shows, and answers where the pointer is. The pointer comes from a row with no link, so the link is one the pointer newly came over. */
  function restOn(column: number, row: number): Promise<{ x: number; y: number }> {
    return comeOnto(column, row, CARD_SHOWN, `the card of the link on row ${row + 1}`);
  }

  /** Notes, by the page's clock, in `window.__card`: when the pointer next moves, read before the terminal reads the move, and when the card next shows or leaves. */
  function timeTheCard(): Promise<unknown> {
    return app.evaluate(`void (() => {
      const times = (window.__card = {});
      const moved = () => {
        times.moved = performance.now();
        document.removeEventListener("mousemove", moved, true);
      };
      document.addEventListener("mousemove", moved, true);
      const card = document.getElementById("link-card");
      const was = card.hidden;
      const changed = new MutationObserver(() => {
        if (card.hidden === was) return;
        times.changed = performance.now();
        changed.disconnect();
      });
      changed.observe(card, { attributes: true, attributeFilter: ["hidden"] });
    })()`);
  }

  /** How long, by the page's clock, the card took to show or to leave after the move `timeTheCard` noted. */
  const cardChangedAfter = (): Promise<number> => app.evaluate<number>("window.__card.changed - window.__card.moved");

  /**
   * Has the pointer move to each cell in turn, in one task of the page, as
   * the moves of a person's pointer arrive there, and answers where it is at
   * the last. No timer of the page runs between the moves, however long the
   * page takes to answer the debugging port: each move through that port
   * waits on an answer, and moves sent at once reach the page as one. The
   * debugging port's own pointer stays where it was, so the case brings it
   * to the last cell afterwards.
   */
  function movesInOneTask(cells: readonly (readonly [number, number])[]): Promise<{ x: number; y: number }> {
    return app.evaluate(`(() => {
      const box = document.querySelector("#stage .pane:not([hidden]) .xterm-screen").getBoundingClientRect();
      const [columns, rows] = document.getElementById("strip-size").textContent.split("×").map(Number);
      let at;
      for (const [column, row] of ${JSON.stringify(cells)}) {
        at = { x: box.x + (box.width / columns) * (column + 0.5), y: box.y + (box.height / rows) * (row + 0.5) };
        document.elementFromPoint(at.x, at.y).dispatchEvent(new MouseEvent("mousemove", { bubbles: true, cancelable: true, composed: true, view: window, clientX: at.x, clientY: at.y }));
      }
      return at;
    })()`);
  }

  /** What the card says: its first line, and each row's words with the keys at its end. */
  function card(): Promise<{ title: string; rows: string[][] }> {
    return app.evaluate(`(() => {
      const card = document.getElementById("link-card");
      return { title: card.querySelector(".target").textContent, rows: [...card.querySelectorAll("button")].map((row) => [...row.children].map((part) => part.textContent)) };
    })()`);
  }

  /** The middle of a row of the card, the first being 0. */
  function cardRow(row: number): Promise<{ x: number; y: number }> {
    return app.evaluate(`(() => { const box = document.querySelectorAll("#link-card button")[${row}].getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; })()`);
  }

  /** A press of a row of the card, as a person's arrives: the pointer comes onto the row first. */
  async function pressCardRow(row: number): Promise<void> {
    const at = await cardRow(row);
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", ...at });
    await app.cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...at, button: "left", clickCount: 1 });
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...at, button: "left", clickCount: 1 });
  }

  /** The text the app's clipboard holds, as the window reads it. The app started in the background, so the clipboard is its own. */
  const clipboard = (): Promise<string> => app.evaluate<string>("window.owlery.clipboardText()");

  /** Puts the view of the work item with a title in front, by its line in the sidebar. */
  async function viewOf(title: string): Promise<void> {
    const id = await app.evaluate<string>(`[...document.querySelectorAll("#repositories [data-work-item]")].find((line) => line.textContent.includes(${JSON.stringify(title)})).dataset.workItem`);
    await app.click(`#repositories [data-work-item="${id}"]`);
    await app.until(`document.getElementById("view-title").textContent === ${JSON.stringify(title)} && ${PANE_HAS_KEYBOARD}`, `the view of "${title}" with the keyboard in its pane`);
  }

  /** The addresses the opener was handed so far: it waits until `count` of them are there, five seconds at most, and then a moment longer, in which one more would have arrived. A case that expects no address more gives the count there was. */
  async function opened(count: number): Promise<string[]> {
    const lines = (): string[] => (existsSync(openedFile) ? readFileSync(openedFile, "utf8").split("\n").filter(Boolean) : []);
    const deadline = Date.now() + 5_000;
    while (lines().length < count && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 50));
    await new Promise((resolve) => setTimeout(resolve, 500));
    return lines();
  }

  /** The bytes the first pane's process was handed, in hex, in the moment after something that should hand it none. A dropped path arrives in less. */
  async function handedMeanwhile(): Promise<string> {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return (await received.next(0)).toString("hex");
  }

  /** A press and a release of Enter in the pane in front, with the modifier keys held. */
  async function enter(modifiers: number): Promise<void> {
    const key = { windowsVirtualKeyCode: 13, code: "Enter", key: "Enter", modifiers };
    await app.cdp("Input.dispatchKeyEvent", { type: "keyDown", ...key, text: "\r" });
    await app.cdp("Input.dispatchKeyEvent", { type: "keyUp", ...key });
  }

  /** Drops files on the element an expression of the page gives, as a drag from another app arrives: it enters, it is over the element, and it is dropped. */
  async function drop(element: string, files: string[]): Promise<void> {
    const at = await app.evaluate<{ x: number; y: number }>(`(() => { const box = (${element}).getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; })()`);
    // The mask's 1 is a copy, the one thing a drag of files from another app allows.
    const data = { items: [], files, dragOperationsMask: 1 };
    for (const type of ["dragEnter", "dragOver", "drop"]) await app.cdp("Input.dispatchDragEvent", { type, ...at, data });
  }

  it("sends a line feed for Shift+Enter, and what the terminal sends for Enter and for Option+Enter", async () => {
    // The case before closed the pane in front, and the first pane came back onto the stage.
    await untilReplayDrawn();
    await received.next(0);
    await enter(SHIFT);
    expect((await received.next(1)).toString("hex")).toBe("0a");
    // The press is the window's whole: the field the terminal types in took no line break of its own.
    expect(await app.evaluate<string>(`document.querySelector("#stage .pane:not([hidden]) .xterm-helper-textarea").value`)).toBe("");
    await enter(0);
    expect((await received.next(1)).toString("hex")).toBe("0d");
    await enter(OPTION);
    expect((await received.next(2)).toString("hex")).toBe("1b0d");
  });

  it("types the path of a file dropped on a pane, gives that pane the keyboard, and stays on its own page", async () => {
    const own = await app.evaluate<string>("location.href");
    // The temporary folder's own path holds nothing a shell reads, so the name alone is escaped.
    expect(repository.base).toMatch(/^[A-Za-z0-9/._-]+$/);
    const file = join(repository.base, "shot 한 it's.png");
    writeFileSync(file, "");
    // The drop is a paste, and arrives in brackets once the replay has set the mode the pane's program asked for.
    await untilReplayDrawn();
    await received.next(0);
    await app.evaluate("document.activeElement.blur()");
    expect(await app.evaluate<boolean>(PANE_HAS_KEYBOARD)).toBe(false);
    await drop(`document.querySelector("#stage .pane:not([hidden])")`, [file]);
    const text = pasted(`${repository.base}/shot\\ 한\\ it\\'s.png `);
    expect((await received.next(Buffer.byteLength(text))).toString("utf8")).toBe(text);
    expect(await app.evaluate<boolean>(PANE_HAS_KEYBOARD)).toBe(true);
    expect(await app.pages()).toEqual([own]);
  });

  it("types two dropped files' paths into the pane that took the drop, and puts that pane in front of the one that was", async () => {
    const files = [join(repository.base, "one.png"), join(repository.base, "two.png")];
    for (const file of files) writeFileSync(file, "");
    const second = await openPane("Shell");
    await pidOf(second);
    await app.click("#side-by-side");
    await app.until(`document.getElementById("stage").dataset.tiles === "2"`, "two panes side by side");
    await app.until(`document.activeElement?.classList.contains("xterm-helper-textarea")`, "the keyboard in the pane in front");
    expect(await app.evaluate<string>(TAB_IN_FRONT)).toBe("Shell 2");
    // The tile of the pane that is not in front: the one without the keyboard. "Side by side" brought the first pane back onto the stage there.
    const notInFront = `[...document.querySelectorAll("#stage .pane:not([hidden])")].find((tile) => !tile.contains(document.activeElement))`;
    await untilReplayDrawn(notInFront);
    await received.next(0);
    await drop(notInFront, files);
    const text = pasted(`${files[0]} ${files[1]} `);
    expect((await received.next(Buffer.byteLength(text))).toString("utf8")).toBe(text);
    expect(readFileSync(`${receivedFile}-${second}`, "utf8")).toBe("");
    await app.until(`${TAB_IN_FRONT} === "Shell 1"`, "the pane that took the drop in front");
    await app.click("#side-by-side");
    await closeFromElsewhere(second);
    await app.until(`${TABS}.length === 1`, "one tab");
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the pane that is left");
  });

  it("types nothing, not an empty paste either, where the one file dropped has a control character in its name", async () => {
    const file = join(repository.base, "a\tb.png");
    writeFileSync(file, "");
    await received.next(0);
    await drop(`document.querySelector("#stage .pane:not([hidden])")`, [file]);
    expect(await handedMeanwhile()).toBe("");
  });

  it("takes no drag that carries a text and no file", async () => {
    await received.next(0);
    await app.evaluate("document.activeElement.blur()");
    const at = await app.evaluate<{ x: number; y: number }>(`(() => { const box = document.querySelector("#stage .pane:not([hidden])").getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; })()`);
    const data = { items: [{ mimeType: "text/plain", data: "dragged text" }], dragOperationsMask: 1 };
    for (const type of ["dragEnter", "dragOver", "drop"]) await app.cdp("Input.dispatchDragEvent", { type, ...at, data });
    expect(await handedMeanwhile()).toBe("");
    // A pane that took the drop would have taken the keyboard.
    expect(await app.evaluate<boolean>(PANE_HAS_KEYBOARD)).toBe(false);
    await app.click("#stage .pane:not([hidden])");
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the pane, at a click");
  });

  it("types nothing where a file is dropped outside a pane", async () => {
    const file = join(repository.base, "elsewhere.png");
    writeFileSync(file, "");
    await received.next(0);
    await drop(`document.getElementById("view-title")`, [file]);
    expect(await handedMeanwhile()).toBe("");
    expect(await app.pages()).toHaveLength(1);
  });

  it("opens a link a pane printed in the system's opener, at a click with the Command key held", async () => {
    const own = await app.evaluate<string>("location.href");
    expect(await opened(0)).toEqual([]);
    await clickLink(0, COMMAND);
    expect(await opened(1)).toEqual([PRINTED]);
    expect(await app.pages()).toEqual([own]);
  });

  it("opens nothing at a click on a link without the Command key", async () => {
    await clickLink(0, 0);
    await clickLink(0, SHIFT);
    expect(await opened(1)).toEqual([PRINTED]);
  });

  it("opens a link that a name carries under the same rule, and asks nothing", async () => {
    // The terminal's own way with such a link is the browser's question. Should it ask, the answer is no and the case says so.
    await app.evaluate(`void (window.confirm = () => { window.__asked = true; return false; })`);
    await clickLink(1, 0);
    expect(await opened(1)).toEqual([PRINTED]);
    await clickLink(1, COMMAND);
    expect(await opened(2)).toEqual([PRINTED, NAMED]);
    expect(await app.evaluate<boolean>("window.__asked === undefined")).toBe(true);
    expect(await app.pages()).toHaveLength(1);
  });

  it("shows a card under a link the pointer rests on, with what a click does, and copies the address from its row", async () => {
    const before = await opened(2);
    expect(before).toEqual([PRINTED, NAMED]);
    // The clipboard of an app started in the background is its own, and starts empty.
    expect(await clipboard()).toBe("");
    await pointAway();
    await timeTheCard();
    const at = await pointAt(9, 0);
    await app.until(OVER_LINK, "a link under the pointer");
    await app.until(CARD_SHOWN, "the card of the address");
    // The card waits until the pointer has rested on the link, as the page's own clock times it, which rounds to a part of a millisecond.
    expect(await cardChangedAfter()).toBeGreaterThanOrEqual(CARD_SHOW_MS - 1);
    // The pause's own length, so a pause shortened where it is named fails here as well as one shortened where its timer starts.
    expect(CARD_SHOW_MS).toBe(300);
    expect(await card()).toEqual({
      title: PRINTED,
      rows: [
        ["Open in browser", KEY_CLICK],
        ["Copy link", ""],
      ],
    });
    // It stands under the row the pointer is on, with its left edge at the pointer.
    const rowHeight = (await cell(9, 1)).y - (await cell(9, 0)).y;
    const box = await app.evaluate<{ left: number; top: number }>(`(() => { const box = document.getElementById("link-card").getBoundingClientRect(); return { left: box.left, top: box.top }; })()`);
    expect(Math.abs(box.left - at.x)).toBeLessThan(1);
    expect(Math.abs(box.top - (at.y + rowHeight / 2))).toBeLessThan(1.5);
    // The pointer may move along the link while it rests there, and the card shows where the pointer then is. The two moves reach the page in one of its tasks, so the pause does not run out between them.
    await pointAway();
    const moved = await movesInOneTask([
      [9, 0],
      [14, 0],
    ]);
    await app.until(CARD_SHOWN, "the card of the address, again");
    expect(Math.abs((await app.evaluate<number>(`document.getElementById("link-card").getBoundingClientRect().left`)) - moved.x)).toBeLessThan(1);
    await pointAt(14, 0);

    // The card of a link behind a name says the address, not the name.
    await restOn(3, 1);
    expect((await card()).title).toBe(NAMED);
    await pressCardRow(1);
    expect(await app.evaluate<boolean>(CARD_SHOWN)).toBe(false);
    expect(await clipboard()).toBe(NAMED);
    // The press took nothing from the terminal, and opened nothing.
    expect(await app.evaluate<boolean>(PANE_HAS_KEYBOARD)).toBe(true);
    expect(await opened(2)).toEqual(before);

    // The pointer goes from the link onto the card, and the card stays under it.
    await restOn(9, 0);
    const shownAt = await app.evaluate<number>(`document.getElementById("link-card").getBoundingClientRect().left`);
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", ...(await cardRow(0)) });
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(await app.evaluate<boolean>(CARD_SHOWN)).toBe(true);
    // Back on its link, at another cell, the card is the one that was there and stays where it was.
    await pointAt(14, 0);
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(await app.evaluate<boolean>(CARD_SHOWN)).toBe(true);
    expect(await app.evaluate<number>(`document.getElementById("link-card").getBoundingClientRect().left`)).toBe(shownAt);
    // It leaves once the pointer is on neither, and not at once: the pointer has a moment to reach the card across what lies between, as the page's own clock times it.
    await timeTheCard();
    await pointAway();
    expect(await cardChangedAfter()).toBeGreaterThanOrEqual(CARD_LEAVE_MS - 1);
    expect(CARD_LEAVE_MS).toBe(200);

    // A modifier key pressed by itself leaves the card as it is: a person who reads "⌘ Click" on a row holds the key and then clicks.
    await restOn(9, 0);
    await received.next(0);
    for (const [key, code, virtualKey, modifiers] of [
      ["Meta", "MetaLeft", 91, 4],
      ["Shift", "ShiftLeft", 16, SHIFT],
      ["Control", "ControlLeft", 17, 2],
      ["Alt", "AltLeft", 18, OPTION],
    ] as const) {
      await app.cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", windowsVirtualKeyCode: virtualKey, code, key, modifiers });
      expect(await app.evaluate<boolean>(CARD_SHOWN), `the card after a press of ${key} by itself`).toBe(true);
      await app.cdp("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: virtualKey, code, key });
    }
    expect(await handedMeanwhile()).toBe("");
    expect(await app.evaluate<boolean>(CARD_SHOWN)).toBe(true);
    // Any other key pressed in the pane takes the card away at once, and the pane's process still receives it.
    await app.cdp("Input.dispatchKeyEvent", { type: "keyDown", windowsVirtualKeyCode: 65, code: "KeyA", key: "a", text: "a" });
    expect(await app.evaluate<boolean>(CARD_SHOWN)).toBe(false);
    await app.cdp("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: 65, code: "KeyA", key: "a" });
    expect((await received.next(1)).toString("utf8")).toBe("a");

    // So does a press of the mouse outside the card, on the link itself too.
    const on = await restOn(9, 0);
    await app.cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...on, button: "left", clickCount: 1 });
    expect(await app.evaluate<boolean>(CARD_SHOWN)).toBe(false);
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...on, button: "left", clickCount: 1 });
    await pointAway();
    expect(await opened(2)).toEqual(before);
  });

  /** The worktree of the work item whose view is in front, as the strip says it. */
  const worktreeInFront = (): Promise<string> => app.evaluate<string>(`document.getElementById("strip-worktree").textContent`);
  /** The path a case prints in a pane: a file of the first work item's worktree, written from the worktree. */
  const PRINTED_PATH = "notes/owlery-path.txt";
  /** A whole path that takes twenty cells more than the screen is wide, so the terminal wraps it onto a second row. */
  let wrapped: string;

  it("makes a path a pane printed a link only where a file or a folder stands at it, after wide characters and over two rows as well", async () => {
    const worktree = await worktreeInFront();
    mkdirSync(join(worktree, "notes"));
    writeFileSync(join(worktree, PRINTED_PATH), "");
    const columns = Number((await app.evaluate<string>(`document.getElementById("strip-size").textContent`)).split("×")[0]);
    const folder = "w".repeat(columns + 20 - `${repository.base}//wrapped.txt`.length);
    expect(folder.length).toBeGreaterThan(0);
    wrapped = join(repository.base, folder, "wrapped.txt");
    expect(wrapped).toHaveLength(columns + 20);
    mkdirSync(join(repository.base, folder));
    writeFileSync(wrapped, "");
    writeFileSync(join(worktree, "notes", "메모"), "");
    // Under the two links the pane prints on its first two rows: the path, the path after two syllables that are each two cells wide, the path that wraps, a path nothing stands at, and a path that ends in two such syllables.
    writeFileSync(linesFile, `${PRINTED_PATH}\n한글 ${PRINTED_PATH}\n${wrapped}\nnotes/no-such-file.txt\nnotes/메모\n`);
    const pane = await openPane("Shell");
    await pidOf(pane);
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the new pane");
    // The window draws what the pane printed in the order it was printed, so once the last line's link is found every row a cell is read on below is drawn.
    await comeOnto(9, 7, OVER_LINK, "the link of the pane's last line");

    const last = PRINTED_PATH.length - 1;
    expect(await linkAt(0, 2)).toBe(true);
    expect(await linkAt(last, 2)).toBe(true);
    expect(await linkAt(last + 1, 2)).toBe(false);
    // The two syllables take four cells and the space after them the fifth, so the path starts at the sixth.
    expect(await linkAt(4, 3)).toBe(false);
    expect(await linkAt(5, 3)).toBe(true);
    expect(await linkAt(5 + last, 3)).toBe(true);
    expect(await linkAt(5 + last + 1, 3)).toBe(false);
    expect(await linkAt(0, 4)).toBe(true);
    expect(await linkAt(columns - 1, 4)).toBe(true);
    expect(await linkAt(0, 5)).toBe(true);
    expect(await linkAt(19, 5)).toBe(true);
    expect(await linkAt(20, 5)).toBe(false);
    expect(await linkAt(3, 6)).toBe(false);
    // The link ends with the second cell of its last syllable: six cells of `notes/`, and four of the two syllables.
    expect(await linkAt(9, 7)).toBe(true);
    expect(await linkAt(10, 7)).toBe(false);
    // The links of the first two rows are still found, beside the paths'.
    expect(await linkAt(9, 0)).toBe(true);
    expect(await linkAt(3, 1)).toBe(true);
  });

  it("shows a path's file in Finder at a click with the Command and the Shift keys held, and copies the whole path from its card (scenario C2)", async () => {
    const file = join(await worktreeInFront(), PRINTED_PATH);
    const before = await opened(2);
    await clickLink(2, COMMAND | SHIFT);
    expect(await opened(3)).toEqual([...before, file]);
    await clickLink(2, 0);
    await clickLink(2, SHIFT);
    expect(await opened(3)).toEqual([...before, file]);
    // The second row of the path that wraps is the same link.
    await clickLink(5, COMMAND | SHIFT, 3);
    expect(await opened(4)).toEqual([...before, file, wrapped]);

    await restOn(9, 3);
    expect(await card()).toEqual({ title: file, rows: FILE_ROWS });
    await pressCardRow(FILE_ROWS.length - 1);
    expect(await app.evaluate<boolean>(CARD_SHOWN)).toBe(false);
    expect(await clipboard()).toBe(file);
    expect(await opened(4)).toHaveLength(4);
    await restOn(9, 2);
    await pressCardRow(FILE_ROWS.length - 2);
    expect(await app.evaluate<boolean>(CARD_SHOWN)).toBe(false);
    expect(await opened(5)).toEqual([...before, file, wrapped, file]);
    expect(await app.evaluate<boolean>(PANE_HAS_KEYBOARD)).toBe(true);

    // A card that would pass the window's right edge is moved to stand inside it.
    // The view's right column (`--facts-width`) is wider than a card at its widest (`--link-card-width`), so a card at the pane's last column ends inside the window as the tokens stand. The case lets this card grow 200px past the room right of the pane, so that it would pass the edge.
    const columns = Number((await app.evaluate<string>(`document.getElementById("strip-size").textContent`)).split("×")[0]);
    // The card's own width is given back however the part ends, so a failure here fails no later case through it.
    await app.evaluate(`void (document.getElementById("link-card").style.maxWidth = (window.innerWidth - document.querySelector("#stage .pane:not([hidden]) .xterm-screen").getBoundingClientRect().right + 200) + "px")`);
    try {
      const cardBox = `(() => { const box = document.getElementById("link-card").getBoundingClientRect(); return { left: box.left, right: box.right, inner: window.innerWidth }; })()`;
      // The same link's card where the window has room for it, at the link's tenth column, is read for its width before it stands at the pane's last column: a card placed at the pointer is laid out in the room right of it, so its width there would say nothing of the condition.
      await restOn(9, 4);
      const roomy = await app.evaluate<{ left: number; right: number; inner: number }>(cardBox);
      const at = await restOn(columns - 1, 4);
      // The card is wider than the room right of the pointer, by more than the margin below: placed at the pointer, it would pass the edge.
      expect(roomy.right - roomy.left).toBeGreaterThan(roomy.inner - at.x + 10);
      expect((await card()).title).toBe(wrapped);
      const box = await app.evaluate<{ left: number; right: number; inner: number }>(cardBox);
      // Its left edge stands well left of the pointer, by more than the part of a cell a pointer's place is rounded by.
      expect(at.x - box.left).toBeGreaterThan(10);
      expect(box.right).toBeLessThanOrEqual(box.inner);
      await pointAway();
    } finally {
      await app.evaluate(`void document.getElementById("link-card").style.removeProperty("max-width")`);
    }

    const pane = panes;
    await closeFromElsewhere(pane);
    await app.until(`${TABS}.length === 1`, "one tab");
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the pane that is left");
  });

  it("shows the card above a link that stands at the foot of the window, where no room is under it", async () => {
    const [, rows] = (await app.evaluate<string>(`document.getElementById("strip-size").textContent`)).split("×").map(Number) as [number, number];
    // A screen of rows, and the path under them: it stands on the row above the last, where the cursor is.
    writeFileSync(linesFile, `${"-\n".repeat(rows)}${PRINTED_PATH}\n`);
    const pane = await openPane("Shell");
    await pidOf(pane);
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the new pane");
    const at = await restOn(9, rows - 2);
    expect((await card()).title).toBe(join(await worktreeInFront(), PRINTED_PATH));
    const rowHeight = (await cell(9, 1)).y - (await cell(9, 0)).y;
    const box = await app.evaluate<{ bottom: number; inner: number }>(`(() => { const box = document.getElementById("link-card").getBoundingClientRect(); return { bottom: box.bottom, inner: window.innerHeight }; })()`);
    expect(Math.abs(box.bottom - (at.y - rowHeight / 2))).toBeLessThan(1.5);
    await pointAway();
    await closeFromElsewhere(pane);
    await app.until(`${TABS}.length === 1`, "one tab");
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the pane that is left");
  });

  it("puts another work item's view in front at a click on its worktree with the Command key held, and shows the folder in Finder with the Shift key as well", async () => {
    const first = await worktreeInFront();
    await app.click("#new-work-item");
    await app.until(`document.getElementById("work-item-dialog").open`, 'the "New work item" form');
    // The page loaded again since the first work item, so the form holds no folder.
    expect(await app.evaluate<string>(`document.getElementById("work-item-repo").value`)).toBe("");
    await app.click("#work-item-repo");
    await app.cdp("Input.insertText", { text: repository.repo });
    await app.click("#work-item-title");
    await app.cdp("Input.insertText", { text: "Second item" });
    await app.evaluate(`document.getElementById("work-item-kind").value = "shell"`);
    // Create creates nothing before the form shows the plan of its folder. The press waits for the plan of the name typed (`built-app.ts#formPlanOf`).
    await app.until(formPlanOf("Second item"), "the plan of the folder for Second item");
    await app.click("#work-item-create");
    await app.until(`document.getElementById("view-title").textContent === "Second item" && ${PANE_HAS_KEYBOARD}`, "the second work item's view");
    panes += 1;
    await pidOf(panes);
    const second = await worktreeInFront();
    expect(second).not.toBe(first);

    await viewOf("Korean input");
    writeFileSync(linesFile, `${second}\n${first}\n`);
    const pane = await openPane("Shell");
    await pidOf(pane);
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the new pane");

    await restOn(9, 2);
    expect(await card()).toEqual({
      title: second,
      rows: [
        ["Open work item", KEY_CLICK],
        ["Open in Finder", SHIFT_KEY_CLICK],
      ],
    });
    // The worktree of the view on screen is a folder as any other. It stands under the rows the first path takes, which wraps where it is longer than the screen is wide.
    const columns = Number((await app.evaluate<string>(`document.getElementById("strip-size").textContent`)).split("×")[0]);
    const ownRow = 2 + Math.ceil(second.length / columns);
    await restOn(9, ownRow);
    expect(await card()).toEqual({
      title: first,
      rows: [
        ["Show in Finder", KEY_CLICK],
        ["Copy path", ""],
      ],
    });
    await pointAway();

    const before = await opened(5);
    await clickLink(2, COMMAND);
    await app.until(`document.getElementById("view-title").textContent === "Second item"`, "the second work item's view, at the click");
    expect(await opened(before.length)).toEqual(before);

    await viewOf("Korean input");
    await clickLink(2, COMMAND | SHIFT);
    expect(await opened(before.length + 1)).toEqual([...before, second]);
    expect(await app.evaluate<string>(`document.getElementById("view-title").textContent`)).toBe("Korean input");
    // The row of the card does what the click it names does.
    await restOn(9, 2);
    await pressCardRow(0);
    await app.until(`document.getElementById("view-title").textContent === "Second item"`, "the second work item's view, at the card's row");
    expect(await opened(before.length + 1)).toHaveLength(before.length + 1);
    await viewOf("Korean input");
    await restOn(9, 2);
    await pressCardRow(1);
    expect(await opened(before.length + 2)).toEqual([...before, second, second]);
    await clickLink(ownRow, COMMAND);
    expect(await opened(before.length + 3)).toEqual([...before, second, second, first]);

    await closeFromElsewhere(pane);
    await app.until(`${TABS}.length === 1`, "one tab");
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the pane that is left");
  });

  /** The editor "Open files in" holds in the Settings dialog. */
  const editorField = (): Promise<string> => app.evaluate<string>(`document.getElementById("app-settings-editor").value`);
  /** Chooses an editor, or "finder", in the open Settings dialog and presses Save, and waits until the dialog has closed. */
  async function saveEditor(chosen: string): Promise<void> {
    await app.evaluate(`void (document.getElementById("app-settings-editor").value = ${JSON.stringify(chosen)})`);
    await app.click("#app-settings-submit");
    await app.until(`!(${SETTINGS_OPEN})`, "the Settings dialog closed at Save");
  }
  /** What `editor.json` of the app's user data folder holds, or null where it stands nowhere. */
  const keptEditor = (): unknown => (existsSync(join(app.userData, "editor.json")) ? JSON.parse(readFileSync(join(app.userData, "editor.json"), "utf8")) : null);

  it.runIf(EDITORS.length > 0)("asks for an editor at the first click on a file with the Command key, keeps the one chosen, opens the file in it at the line and the column the pane printed, and shows it in Finder with the Shift key as well (scenarios C1, C2 and C3)", async () => {
    const file = join(await worktreeInFront(), PRINTED_PATH);
    writeFileSync(linesFile, `${PRINTED_PATH}:12:5\n`);
    const pane = await openPane("Shell");
    await pidOf(pane);
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the new pane");
    await comeOnto(9, 2, OVER_LINK, "the link of the file the pane printed");
    // The link is the path, and the line and the column after it are not.
    expect(await linkAt(PRINTED_PATH.length - 1, 2)).toBe(true);
    expect(await linkAt(PRINTED_PATH.length, 2)).toBe(false);
    expect(keptEditor()).toBeNull();
    await restOn(9, 2);
    expect(await card()).toEqual({ title: file, rows: FILE_ROWS });
    await pointAway();
    const before = await opened(0);

    // No editor is chosen, so the click asks, and opens nothing.
    await clickLink(2, COMMAND);
    await app.until(SETTINGS_OPEN, "the Settings dialog, at the first click on a file");
    expect(await app.evaluate<string[]>(`[...document.getElementById("app-settings-editor").options].map((option) => option.textContent)`)).toEqual([...EDITORS, "Show in Finder"]);
    expect(await editorField()).toBe(EDITORS[0]);
    await app.click("#app-settings-cancel");
    await app.until(`!(${SETTINGS_OPEN})`, "the Settings dialog closed at Cancel");
    expect(keptEditor()).toBeNull();
    expect(await opened(before.length)).toEqual(before);

    // A Save that names an editor keeps it and opens the file, at its line and its column, in the stand-in the start runs in the editor's place.
    const chosen = EDITORS.at(-1) ?? "";
    await clickLink(2, COMMAND);
    await app.until(SETTINGS_OPEN, "the Settings dialog, at the click again");
    await saveEditor(chosen);
    expect(keptEditor()).toEqual({ editor: chosen });
    expect(await opened(before.length + 1)).toEqual([...before, `${file}:12:5`]);
    // The next click opens the file and asks nothing.
    await clickLink(2, COMMAND);
    expect(await app.evaluate<boolean>(SETTINGS_OPEN)).toBe(false);
    expect(await opened(before.length + 2)).toEqual([...before, `${file}:12:5`, `${file}:12:5`]);
    await restOn(9, 2);
    expect(await card()).toEqual({
      title: file,
      rows: [
        [`Open in ${chosen}`, KEY_CLICK],
        ["Show in Finder", SHIFT_KEY_CLICK],
        ["Copy path", ""],
      ],
    });
    await pressCardRow(0);
    expect(await opened(before.length + 3)).toEqual([...before, `${file}:12:5`, `${file}:12:5`, `${file}:12:5`]);
    await clickLink(2, COMMAND | SHIFT);
    expect(await opened(before.length + 4)).toEqual([...before, `${file}:12:5`, `${file}:12:5`, `${file}:12:5`, file]);

    // "Settings…" of the application menu opens the dialog on the choice kept. A Save of Finder gives the file a path's card and clicks.
    await app.evaluateMain(`electron.Menu.getApplicationMenu().getMenuItemById("settings").click()`);
    await app.until(SETTINGS_OPEN, 'the Settings dialog, at "Settings…" of the menu');
    expect(await editorField()).toBe(chosen);
    await saveEditor("finder");
    expect(keptEditor()).toEqual({ editor: "finder" });
    expect(await opened(before.length + 4)).toHaveLength(before.length + 4);
    await restOn(9, 2);
    expect(await card()).toEqual({
      title: file,
      rows: [
        ["Show in Finder", KEY_CLICK],
        ["Copy path", ""],
      ],
    });
    await pointAway();
    await clickLink(2, COMMAND);
    expect(await opened(before.length + 5)).toEqual([...before, `${file}:12:5`, `${file}:12:5`, `${file}:12:5`, file, file]);

    await closeFromElsewhere(pane);
    await app.until(`${TABS}.length === 1`, "one tab");
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the pane that is left");
  });

  it.runIf(process.platform === "darwin")("sends Control+A, Control+E and Control+U for the left arrow, the right arrow and Backspace with the Command key, and nothing else", async () => {
    // The case before closed the pane in front, and the first pane came back onto the stage.
    await untilReplayDrawn();
    await received.next(0);
    for (const [key, virtualKey, byte] of [
      ["ArrowLeft", 37, "01"],
      ["ArrowRight", 39, "05"],
      ["Backspace", 8, "15"],
    ] as const) {
      await app.cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", windowsVirtualKeyCode: virtualKey, code: key, key, modifiers: COMMAND });
      await app.cdp("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: virtualKey, code: key, key, modifiers: COMMAND });
      expect((await received.next(1)).toString("hex"), `${key} with the Command key`).toBe(byte);
    }
  });

  const MENU_OPEN = `document.getElementById("pane-menu") !== null`;

  /** A press and a release of the right button at a place in the window, as a person's arrives: the pointer comes there first. */
  async function rightPress(at: { x: number; y: number }): Promise<void> {
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", ...at });
    await app.cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...at, button: "right", clickCount: 1 });
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...at, button: "right", clickCount: 1 });
  }

  /** Opens the menu of the pane in front by a press of the right button on a cell of its screen, and answers where the press was. */
  async function openMenu(column = 9, row = EMPTY_ROW): Promise<{ x: number; y: number }> {
    const at = await cell(column, row);
    await rightPress(at);
    await app.until(MENU_OPEN, "the pane's menu");
    return at;
  }

  /** What the menu holds, from its top: an item's words and its keys, or "-" for a rule. */
  function menu(): Promise<(string[] | string)[]> {
    return app.evaluate(`[...document.getElementById("pane-menu").children].map((child) => (child.getAttribute("role") === "menuitem" ? [...child.children].map((part) => part.textContent) : child.getAttribute("role") === "separator" ? "-" : child.outerHTML))`);
  }

  /** The middle of the menu's item with these words. */
  function menuItem(text: string): Promise<{ x: number; y: number }> {
    return app.evaluate(`(() => { const box = [...document.querySelectorAll("#pane-menu [role=menuitem]")].find((item) => item.firstChild.textContent === ${JSON.stringify(text)}).getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; })()`);
  }

  /** Opens the menu of the pane in front and presses its item with these words, as a person's press arrives. Afterwards the menu is gone. */
  async function pressMenuItem(text: string): Promise<void> {
    await openMenu();
    const at = await menuItem(text);
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", ...at });
    await app.cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...at, button: "left", clickCount: 1 });
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...at, button: "left", clickCount: 1 });
    await app.until(`!(${MENU_OPEN})`, `the menu closed at "${text}"`);
  }

  /** A press and a release of a key that types nothing, sent to whatever has the keyboard. */
  async function press(key: "Escape" | "ArrowDown" | "ArrowUp" | "Backspace", virtualKey: number): Promise<void> {
    await app.cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", windowsVirtualKeyCode: virtualKey, code: key, key });
    await app.cdp("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: virtualKey, code: key, key });
  }

  const FOCUSED_ITEM = `document.activeElement?.getAttribute("role") === "menuitem" ? document.activeElement.firstChild.textContent : null`;

  it("opens a pane's menu at a press of the right button, with the pane in front and the window's keys unread while it is open", async () => {
    // A pane that prints its two links and nothing under them.
    writeFileSync(linesFile, "");
    const pane = await openPane("Shell");
    const pid = await pidOf(pane);
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the new pane");
    expect(await app.evaluate<string>(TAB_IN_FRONT)).toBe("Shell 2");
    const handed = new Received(`${receivedFile}-${pane}`);

    // The press reaches the pane that is not in front, and that pane is in front once its menu is open.
    await app.click("#side-by-side");
    await app.until(`document.getElementById("stage").dataset.tiles === "2"`, "two panes side by side");
    await app.until(`document.activeElement?.classList.contains("xterm-helper-textarea")`, "the keyboard in the pane in front");
    await app.evaluate(`void document.addEventListener("contextmenu", (event) => { window.__menuDefault = !event.defaultPrevented; })`);
    const other = await app.evaluate<{ x: number; y: number }>(`(() => { const box = [...document.querySelectorAll("#stage .pane:not([hidden])")].find((tile) => !tile.contains(document.activeElement)).getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; })()`);
    await rightPress(other);
    await app.until(MENU_OPEN, "the menu of the pane that was not in front");
    expect(await app.evaluate<string>(TAB_IN_FRONT)).toBe("Shell 1");
    // The system's own menu is kept from opening.
    expect(await app.evaluate<boolean>("window.__menuDefault")).toBe(false);
    // Its corner stands at the pointer.
    const corner = await app.evaluate<{ left: number; top: number }>(`(() => { const box = document.getElementById("pane-menu").getBoundingClientRect(); return { left: box.left, top: box.top }; })()`);
    expect(Math.abs(corner.left - other.x)).toBeLessThan(1);
    expect(Math.abs(corner.top - other.y)).toBeLessThan(1);
    expect(await menu()).toEqual([["Copy", "\u2318C"], ["Paste", "\u2318V"], ["Select All", ""], ["Find\u2026", "\u2318F"], "-", ["Clear Screen", ""], ["Reset Terminal", ""], "-", ["Close Pane", "\u2318W"]].map((item) => (process.platform === "darwin" || typeof item === "string" ? item : [item[0], ""])));
    expect(await app.evaluate<string | null>(`document.getElementById("pane-menu").getAttribute("role")`)).toBe("menu");
    // Nothing is selected in a pane whose empty row was pressed, so there is nothing to copy.
    expect(await app.evaluate<string[]>(`[...document.querySelectorAll("#pane-menu [role=menuitem]")].filter((item) => item.disabled).map((item) => item.firstChild.textContent)`)).toEqual(["Copy"]);

    // While the menu is open the window reads none of its keys: W with the Command key would close the pane, and N would open the "New work item" form.
    await command("W");
    await command("N");
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(await app.evaluate<string[]>(TABS)).toEqual(["Shell 1", "Shell 2"]);
    expect(await app.evaluate<boolean>(`document.getElementById("work-item-dialog").open`)).toBe(false);
    expect(await app.evaluate<boolean>(MENU_OPEN)).toBe(true);

    // The arrows move through the items that can be pressed, and Escape closes the menu and gives the pane the keyboard.
    await press("ArrowDown", 40);
    expect(await app.evaluate<string | null>(FOCUSED_ITEM)).toBe("Paste");
    await press("ArrowDown", 40);
    expect(await app.evaluate<string | null>(FOCUSED_ITEM)).toBe("Select All");
    await press("ArrowUp", 38);
    await press("ArrowUp", 38);
    expect(await app.evaluate<string | null>(FOCUSED_ITEM)).toBe("Close Pane");
    await received.next(0);
    await press("Escape", 27);
    expect(await app.evaluate<boolean>(MENU_OPEN)).toBe(false);
    expect(await app.evaluate<boolean>(`document.activeElement?.classList.contains("xterm-helper-textarea") === true`)).toBe(true);
    expect(await app.evaluate<string>(TAB_IN_FRONT)).toBe("Shell 1");
    // No key pressed in the menu reached the pane's process.
    expect(await handedMeanwhile()).toBe("");
    await app.click("#side-by-side");
    await app.click("#tabs .tab:nth-child(2) .label");
    await app.until(`${TAB_IN_FRONT} === "Shell 2" && ${PANE_HAS_KEYBOARD}`, "the new pane in front again");
    // The pane came back onto the stage, and "Select All" below reads its screen, which its replay draws again.
    await untilReplayDrawn();

    // A press outside the menu closes it, and so does a second press of the right button, which opens the menu where it was pressed.
    await openMenu();
    await app.click("#view-title");
    expect(await app.evaluate<boolean>(MENU_OPEN)).toBe(false);
    await openMenu();
    const [, rows] = (await app.evaluate<string>(`document.getElementById("strip-size").textContent`)).split("×").map(Number) as [number, number];
    // At the screen's last row the menu would pass the window's foot, and is moved to stand inside the window.
    const low = await openMenu(9, rows - 1);
    expect(await app.evaluate<number>(`document.querySelectorAll("[role=menu]").length`)).toBe(1);
    const moved = await app.evaluate<{ left: number; top: number; bottom: number; inner: number }>(`(() => { const box = document.getElementById("pane-menu").getBoundingClientRect(); return { left: box.left, top: box.top, bottom: box.bottom, inner: window.innerHeight }; })()`);
    expect(Math.abs(moved.left - low.x)).toBeLessThan(1);
    expect(moved.top).toBeLessThan(low.y - 10);
    expect(moved.bottom).toBeLessThanOrEqual(moved.inner);
    // A press of the right button on the menu itself closes it, and presses no item.
    await rightPress(await menuItem("Close Pane"));
    expect(await app.evaluate<boolean>(MENU_OPEN)).toBe(false);
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(await app.evaluate<string[]>(TABS)).toEqual(["Shell 1", "Shell 2"]);

    // "Select All" and then "Copy": the clipboard holds what the pane printed, its first row first.
    await pressMenuItem("Select All");
    expect(await app.evaluate<boolean>(PANE_HAS_KEYBOARD)).toBe(true);
    await openMenu();
    expect(await app.evaluate<string[]>(`[...document.querySelectorAll("#pane-menu [role=menuitem]")].filter((item) => item.disabled).map((item) => item.firstChild.textContent)`)).toEqual([]);
    // From the menu itself the up arrow goes to the last item, and the down arrow goes on from there to the first, which "Copy" now is.
    await press("ArrowUp", 38);
    expect(await app.evaluate<string | null>(FOCUSED_ITEM)).toBe("Close Pane");
    await press("ArrowDown", 40);
    expect(await app.evaluate<string | null>(FOCUSED_ITEM)).toBe("Copy");
    await press("Escape", 27);
    await pressMenuItem("Copy");
    expect((await clipboard()).trimEnd()).toBe(`${PRINTED}\na named link`);

    // "Paste" hands the pane the clipboard's text as a paste, and nothing where the clipboard is empty.
    await app.evaluate(`window.owlery.copyText("")`);
    await handed.next(0);
    await pressMenuItem("Paste");
    expect((await handed.next(0)).toString("utf8")).toBe("");
    await app.evaluate(`window.owlery.copyText("from the clipboard")`);
    await pressMenuItem("Paste");
    const inBrackets = pasted("from the clipboard");
    expect((await handed.next(inBrackets.length)).toString("utf8")).toBe(inBrackets);

    /** Has the pane leave the stage and come back: the first pane's tab is pressed, and then this pane's. The terminal is then drawn from the daemon's replay alone. */
    const leavesAndReturns = async (): Promise<void> => {
      await app.click("#tabs .tab:nth-child(1) .label");
      await app.until(`${TAB_IN_FRONT} === "Shell 1" && ${PANE_HAS_KEYBOARD}`, "the first pane in front");
      await app.click("#tabs .tab:nth-child(2) .label");
      await app.until(`${TAB_IN_FRONT} === "Shell 2" && ${PANE_HAS_KEYBOARD}`, "the pane of the menu in front again");
    };
    /** Presses the menu's "Paste" after the pane came back, and answers what the pane's process was handed. The screen of a pane that came back sends it nothing until its terminal has drawn the pane's replay (src/renderer/view.ts, `screenTurns`), so a press made before that hands the process nothing. The press is made again after a second without a byte, until fifteen seconds have passed, the bound `BuiltApp.until` waits. */
    const pasteOnceBack = async (): Promise<string> => {
      const deadline = Date.now() + 15_000;
      for (;;) {
        await pressMenuItem("Paste");
        for (let reads = 0; reads < 5; reads++) {
          const got = (await handed.next(0)).toString("utf8");
          // A moment more for what follows the first bytes.
          if (got !== "") return got + (await handed.next(0)).toString("utf8");
        }
        if (Date.now() >= deadline) return "";
      }
    };

    // "Clear Screen" empties the terminal, and keeps the modes the pane's program set: a paste still arrives in brackets.
    expect(await linkAt(9, 0)).toBe(true);
    await pressMenuItem("Clear Screen");
    expect(await linkAt(9, 0)).toBe(false);
    await pressMenuItem("Paste");
    expect((await handed.next(inBrackets.length)).toString("utf8")).toBe(inBrackets);

    // The daemon forgot what the pane printed and kept the modes, so once the pane left the stage and came back it is still empty, and a paste still arrives in brackets.
    await leavesAndReturns();
    expect(await pasteOnceBack()).toBe(inBrackets);
    // The paste arrived, so the terminal has drawn the replay (`pasteOnceBack`), and the two rows are read from it and not from a screen the replay has yet to reach. The pane's process echoes nothing, so the paste draws nothing there.
    expect(await linkAt(9, 0)).toBe(false);
    expect(await linkAt(3, 1)).toBe(false);

    // "Reset Terminal" ends those modes: the same paste arrives as typed text.
    await pressMenuItem("Reset Terminal");
    await pressMenuItem("Paste");
    expect((await handed.next("from the clipboard".length)).toString("utf8")).toBe("from the clipboard");

    // The daemon kept no mode at the reset, so the paste arrives as typed text once the pane left the stage and came back as well.
    await leavesAndReturns();
    expect(await pasteOnceBack()).toBe("from the clipboard");

    // "Close Pane" closes the pane as a press of its tab's "×" does.
    await pressMenuItem("Close Pane");
    await app.until(`${TABS}.length === 1`, "one tab");
    expect(await untilGone([pid], 5_000)).toEqual([]);
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the pane that is left");
  });

  it("closes a pane's menu when its pane is closed from elsewhere, so no item acts on the pane that takes its screen", async () => {
    const second = await openPane("Shell");
    await pidOf(second);
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the new pane");
    await openMenu();
    await closeFromElsewhere(second);
    await app.until(`${TABS}.length === 1`, "one tab");
    await app.until(`!(${MENU_OPEN})`, "the menu closed with its pane");
    // The menu had the keyboard, and the pane that is left has it now.
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the pane that is left");
  });

  /** Dispatches a paste into the terminal of the pane in front, or into the element an expression of the page gives, holding the text given and an image file with no path where `image`, as a paste of a screenshot arrives. */
  function pasteInto(text: string | null, image: boolean, into = `document.querySelector("#stage .pane:not([hidden]) .xterm-helper-textarea")`): Promise<unknown> {
    return app.evaluate(`void (() => {
      const data = new DataTransfer();
      if (${JSON.stringify(text)} !== null) data.setData("text/plain", ${JSON.stringify(text)});
      if (${image}) data.items.add(new File([new Uint8Array([137, 80, 78, 71])], "image.png", { type: "image/png" }));
      (${into}).dispatchEvent(new ClipboardEvent("paste", { clipboardData: data, bubbles: true, cancelable: true }));
    })()`);
  }

  it('pastes the path of the file the main process writes for an image with no text, at a paste and at "Paste" of the pane\'s menu, leaves a text to the terminal, leaves Control+V to the pane\'s program, and hands the path to no pane that took the screen while the file was written (scenarios D1, D2 and D5)', async () => {
    await untilReplayDrawn();
    await received.next(0);
    // An app started in the background reads no image of the system's clipboard, so the main process's answer to the window is replaced, and counts the window's requests. No case after this one pastes.
    const image = join(repository.base, "pasted shot.png");
    writeFileSync(image, "");
    await app.evaluateMain(`void (() => {
      globalThis.__pasted = 0;
      electron.ipcMain.removeHandler("owlery:pasted-image");
      electron.ipcMain.handle("owlery:pasted-image", () => {
        globalThis.__pasted += 1;
        return ${JSON.stringify(image)};
      });
    })()`);
    const path = pasted(`${repository.base}/pasted\\ shot.png `);

    await pasteInto(null, true);
    expect((await received.next(Buffer.byteLength(path))).toString("utf8")).toBe(path);
    expect(await app.evaluateMain<number>("globalThis.__pasted")).toBe(1);
    // Text beside an image is the terminal's own paste, and the main process writes no file for it.
    await pasteInto("owl text", true);
    expect((await received.next(Buffer.byteLength(pasted("owl text")))).toString("utf8")).toBe(pasted("owl text"));
    expect(await app.evaluateMain<number>("globalThis.__pasted")).toBe(1);
    // A paste of nothing hands nothing, not an empty paste either.
    await pasteInto(null, false);
    expect(await handedMeanwhile()).toBe("");
    expect(await app.evaluateMain<number>("globalThis.__pasted")).toBe(1);
    // A paste into the field of the find bar, which stands in the pane's screen, is the field's.
    await command("F");
    await app.until(`document.activeElement === document.getElementById("find-field")`, "the find bar with the keyboard in its field");
    await pasteInto(null, true, `document.getElementById("find-field")`);
    expect(await handedMeanwhile()).toBe("");
    expect(await app.evaluateMain<number>("globalThis.__pasted")).toBe(1);
    await press("Escape", 27);
    await app.until(`document.getElementById("find-bar").hidden && ${PANE_HAS_KEYBOARD}`, "the find bar closed, with the keyboard in the pane");

    // "Paste" of the menu: the clipboard holds no text, so the pane is handed the image's path.
    await app.evaluate(`window.owlery.copyText("")`);
    await pressMenuItem("Paste");
    expect((await received.next(Buffer.byteLength(path))).toString("utf8")).toBe(path);
    expect(await app.evaluateMain<number>("globalThis.__pasted")).toBe(2);

    // Control+V reaches the program as its byte, and the window does nothing else with it.
    await app.cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", windowsVirtualKeyCode: 86, code: "KeyV", key: "v", modifiers: 2 });
    await app.cdp("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: 86, code: "KeyV", key: "v", modifiers: 2 });
    expect((await received.next(1)).toString("hex")).toBe("16");
    expect(await handedMeanwhile()).toBe("");
    expect(await app.evaluateMain<number>("globalThis.__pasted")).toBe(2);

    // The main process holds its answer while the screen of the pane pasted into passes to another pane: the path is handed to neither.
    await app.evaluateMain(`void (() => {
      electron.ipcMain.removeHandler("owlery:pasted-image");
      electron.ipcMain.handle("owlery:pasted-image", () => {
        globalThis.__pasted += 1;
        return new Promise((resolve) => {
          globalThis.__release = () => resolve(${JSON.stringify(image)});
        });
      });
    })()`);
    const second = await openPane("Shell");
    await pidOf(second);
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the second pane");
    // The screen the second pane took is marked, so the step reads that the third pane takes that same screen.
    await app.evaluate(`document.activeElement.closest(".pane").dataset.pastedInto = ""`);
    await pasteInto(null, true, "document.activeElement");
    for (const deadline = Date.now() + 5_000; (await app.evaluateMain<number>("globalThis.__pasted")) !== 3; await new Promise((resolve) => setTimeout(resolve, 50))) {
      if (Date.now() >= deadline) throw new Error("the window never asked the main process for the image's path");
    }
    await closeFromElsewhere(second);
    await app.until(`${TABS}.length === 1`, "one tab");
    // A pane that comes on takes the first free screen, which is the one the second pane gave back.
    const third = await openPane("Shell");
    await pidOf(third);
    await app.until(`${PANE_HAS_KEYBOARD} && document.activeElement.closest(".pane[data-pasted-into]") !== null`, "the keyboard in the third pane, on the screen the second pane held");
    const thirdHanded = new Received(`${receivedFile}-${third}`);
    await thirdHanded.next(0);
    await app.evaluateMain("globalThis.__release()");
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect((await thirdHanded.next(0)).toString("hex")).toBe("");
    expect(await handedMeanwhile()).toBe("");
    await app.evaluate(`delete document.querySelector(".pane[data-pasted-into]").dataset.pastedInto`);
    await closeFromElsewhere(third);
    await app.until(`${TABS}.length === 1`, "one tab");
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the pane that is left");
  });

  /** The numbered lines a pane is to print under its links, `line-0001` and on. */
  const numbered = (count: number): string[] => Array.from({ length: count }, (_, index) => `line-${String(index + 1).padStart(4, "0")}`);
  /** The numbered lines the terminal of the pane in front holds, its history among them, read by "Select All" and "Copy" of its menu, once the last of `count` is there, fifteen seconds at most. A press of the right button inside the selection keeps it. */
  async function heldLines(count: number): Promise<string[]> {
    const last = numbered(count).at(-1);
    const deadline = Date.now() + 15_000;
    for (;;) {
      await pressMenuItem("Select All");
      await pressMenuItem("Copy");
      const held = (await clipboard()).split("\n").filter((line) => /^line-\d+$/.test(line.trimEnd()));
      if (held.at(-1) === last || Date.now() >= deadline) return held;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  /** Has a client of the daemon other than the window set the scrollback, as a second window's Machine dialog would, and waits for the daemon's answer. */
  async function setScrollbackFromElsewhere(lines: number | null): Promise<void> {
    const { port, token } = JSON.parse(readFileSync(join(app.userData, "run", "daemon.json"), "utf8")) as { port: number; token: string };
    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    await new Promise<void>((resolve, reject) => {
      socket.addEventListener("error", () => reject(new Error("the daemon refused a second client")), { once: true });
      socket.addEventListener("message", (event) => {
        const message = JSON.parse(String(event.data)) as { type: string; requestId?: number };
        if (message.type === "ready") socket.send(JSON.stringify({ type: "setCaps", requestId: 1, scrollback: lines }));
        if (message.type === "done" && message.requestId === 1) resolve();
      });
      socket.addEventListener("open", () => socket.send(JSON.stringify({ type: "hello", token })), { once: true });
    });
    socket.close();
  }

  it("holds 5,000 lines of history in a pane's terminal where no person set the scrollback, and as many as a person sets once the daemon says another (scenarios B1 and B2)", async () => {
    writeFileSync(linesFile, `${numbered(6000).join("\n")}\n`);
    await openPane("Shell");
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the new pane");
    const [, rows] = (await app.evaluate<string>(`document.getElementById("strip-size").textContent`)).split("×").map(Number) as [number, number];
    const held = await heldLines(6000);
    // The terminal holds the scrollback's lines and the screen's rows, the last of them the cursor's.
    expect(held.length).toBeGreaterThanOrEqual(5000);
    expect(held.length).toBeLessThan(5000 + rows);
    expect(held.at(-1)).toBe("line-6000");
    // A smaller scrollback set elsewhere reaches the terminal that stands, which drops its oldest lines.
    await setScrollbackFromElsewhere(1000);
    try {
      // The daemon answers `done` before it tells the window the machine, so the window may still hold the 5,000 lines at the first reading.
      let fewer = await heldLines(6000);
      for (const deadline = Date.now() + 10_000; fewer.length >= 1000 + rows && Date.now() < deadline; ) fewer = await heldLines(6000);
      expect(fewer.length).toBeGreaterThanOrEqual(1000);
      expect(fewer.length).toBeLessThan(1000 + rows);
      expect(fewer.at(-1)).toBe("line-6000");
    } finally {
      await setScrollbackFromElsewhere(null);
    }
    await pressMenuItem("Close Pane");
    await app.until(`${TABS}.length === 1`, "one tab");
  });

  it("holds again the 3,000 lines a pane printed once it left the stage and came back, drawn from the daemon's replay (scenario B4, and the time of the return for Q2)", async () => {
    writeFileSync(linesFile, `${numbered(3000).join("\n")}\n`);
    const pane = await openPane("Shell");
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the new pane");
    expect(await heldLines(3000)).toHaveLength(3000);
    await app.click("#tabs .tab:nth-child(1) .label");
    await app.until(`${TAB_IN_FRONT} === "Shell 1" && ${PANE_HAS_KEYBOARD}`, "the first pane in front");
    // The screen of a pane that came back sends nothing a person types until its terminal has drawn the replay (src/renderer/view.ts, `screenTurns`), so the first key the pane's process receives marks the return.
    const handed = `${receivedFile}-${String(pane)}`;
    const before = readFileSync(handed).length;
    const clicked = Date.now();
    await app.click("#tabs .tab:nth-child(2) .label");
    await app.until(PANE_HAS_KEYBOARD, "the pane back in front");
    while (readFileSync(handed).length === before) {
      if (Date.now() - clicked > 15_000) throw new Error("the pane that came back took no key in 15 seconds");
      await app.cdp("Input.insertText", { text: "." });
      await new Promise((resolve) => setTimeout(resolve, 25));
    }
    // Written to the run's own output: the suite's runner shows nothing a case hands to `console.log`.
    process.stdout.write(`\nA pane of 3,000 lines took a key ${String(Date.now() - clicked)} ms after the click that brought it back.\n`);
    const held = await heldLines(3000);
    expect(held).toEqual(numbered(3000));
    // The find bar, opened from the pane's menu, finds the first line in the history the replay drew.
    await pressMenuItem("Find…");
    await app.until(`${FIND_OPEN} && ${FIELD_HAS_KEYBOARD}`, "the find bar with the keyboard in its field");
    await app.cdp("Input.insertText", { text: "line-0001" });
    await app.until(`${FIND_COUNT} === "1 of 1"`, "the one match of the first line");
    expect(await selected()).toBe("line-0001");
    await pressMenuItem("Close Pane");
    await app.until(`${TABS}.length === 1`, "one tab");
  });

  const FIND_OPEN = `document.getElementById("find-bar")?.hidden === false`;
  const FIELD_HAS_KEYBOARD = `document.activeElement === document.getElementById("find-field")`;
  const FIND_COUNT = `document.getElementById("find-count").textContent`;
  /** A column of the screen that no line of these cases reaches. */
  const PAST_THE_LINES = 60;

  /**
   * What the terminal of the pane in front holds selected, read by its
   * menu's "Copy", or null where "Copy" cannot be pressed, since nothing is
   * selected. The menu opens at a press of the right button on a cell no line
   * reaches: on a Mac such a press selects the word under it, and an empty
   * cell holds none, so the press keeps a selection and makes none. The
   * terminal has the keyboard afterwards.
   */
  async function selected(): Promise<string | null> {
    await openMenu(PAST_THE_LINES, EMPTY_ROW);
    const copies = await app.evaluate<boolean>(`[...document.querySelectorAll("#pane-menu [role=menuitem]")].some((item) => item.firstChild.textContent === "Copy" && !item.disabled)`);
    if (!copies) {
      await press("Escape", 27);
      await app.until(`!(${MENU_OPEN})`, "the menu closed");
      return null;
    }
    const at = await menuItem("Copy");
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", ...at });
    await app.cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...at, button: "left", clickCount: 1 });
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...at, button: "left", clickCount: 1 });
    await app.until(`!(${MENU_OPEN})`, `the menu closed at "Copy"`);
    return clipboard();
  }

  /**
   * The marks the find bar's search draws on the screen of the pane in
   * front, from its top: each mark's top in the window, and the ink of its
   * outline, `strong` for `--terminal-strong`, `ink` for `--terminal-ink`
   * and the colour itself for any other. The match in front carries a mark
   * of its own over the mark every match carries.
   */
  function marks(): Promise<{ top: number; outline: string }[]> {
    return app.evaluate(`(() => {
      const colour = (property) => {
        const probe = document.createElement("span");
        probe.style.color = getComputedStyle(document.documentElement).getPropertyValue(property).trim();
        document.body.append(probe);
        const read = getComputedStyle(probe).color;
        probe.remove();
        return read;
      };
      const strong = colour("--terminal-strong");
      const ink = colour("--terminal-ink");
      return [...document.querySelectorAll("#stage .pane:not([hidden]) .xterm-find-result-decoration")]
        .filter((mark) => mark.style.display !== "none")
        .map((mark) => {
          const outline = getComputedStyle(mark).outlineColor;
          return { top: Math.round(mark.getBoundingClientRect().top), outline: outline === strong ? "strong" : outline === ink ? "ink" : outline };
        })
        .sort((one, other) => one.top - other.top);
    })()`);
  }

  /**
   * Which of the matches the marks of the screen in front draw is the match
   * in front, counted from the top of the screen, or -1 where none is. The
   * terminal draws its marks at its next frame, after the count changed, so
   * the read waits up to five seconds for `expected` and then answers what it
   * read last.
   */
  async function frontMatch(expected: number): Promise<number> {
    const deadline = Date.now() + 5_000;
    for (;;) {
      const drawn = await marks();
      const front = drawn.find((mark) => mark.outline === "strong");
      const index = front === undefined ? -1 : drawn.filter((mark) => mark.outline === "ink").findIndex((mark) => mark.top === front.top);
      if (index === expected || Date.now() >= deadline) return index;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /** The inks of the marks the screen in front draws, in their order on the screen, once the terminal has drawn `count` of them, or what it drew after five seconds. */
  async function marksDrawn(count: number): Promise<string[]> {
    const deadline = Date.now() + 5_000;
    for (;;) {
      const drawn = await marks();
      if (drawn.length === count || Date.now() >= deadline) return drawn.map((mark) => mark.outline);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }

  /** Opens a shell pane that prints `lines` under its two links, waits until the keyboard is in it, and answers with the bytes its process is handed from then on. */
  async function paneWith(lines: string[]): Promise<Received> {
    writeFileSync(linesFile, `${lines.join("\n")}\n`);
    const pane = await openPane("Shell");
    await pidOf(pane);
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the new pane");
    const handed = new Received(`${receivedFile}-${pane}`);
    await handed.next(0);
    return handed;
  }

  /** Replaces what the find bar's field holds with `text`: ⌘F selects what the field holds, and the text is typed over it. */
  async function findText(text: string): Promise<void> {
    await command("F");
    await app.until(`${FIND_OPEN} && ${FIELD_HAS_KEYBOARD} && document.getElementById("find-field").selectionEnd - document.getElementById("find-field").selectionStart === document.getElementById("find-field").value.length`, "the find bar's field with what it holds selected");
    await app.cdp("Input.insertText", { text });
  }

  /** Closes the pane in front from its menu and waits for the one tab that is left. */
  async function closeThePane(): Promise<void> {
    await pressMenuItem("Close Pane");
    await app.until(`${TABS}.length === 1`, "one tab");
  }

  it.runIf(process.platform === "darwin")("finds a line past the first screen at Command+F, selects the match in front, scrolls up to it, and outlines it in the terminal's strong ink (scenario A1)", async () => {
    await paneWith(["a haystack-owlneedle-haystack", ...numbered(200)]);
    await command("F");
    await app.until(`${FIND_OPEN} && ${FIELD_HAS_KEYBOARD}`, "the find bar with the keyboard in its field");
    // It stands over the top right corner of the pane's screen.
    const placed = await app.evaluate<{ top: number; right: number }>(`(() => { const bar = document.getElementById("find-bar").getBoundingClientRect(); const pane = document.querySelector("#stage .pane:not([hidden])").getBoundingClientRect(); return { top: Math.round(bar.top - pane.top), right: Math.round(pane.right - bar.right) }; })()`);
    expect(placed).toEqual({ top: 0, right: 0 });
    await app.cdp("Input.insertText", { text: "owlneedle" });
    await app.until(`${FIND_COUNT} === "1 of 1"`, "the one match");
    // The terminal scrolled up from the end of its output to the match.
    expect(await app.evaluate<boolean>(`(() => { const bar = document.querySelector("#stage .pane:not([hidden]) .xterm-scrollable-element > .scrollbar.vertical"); const slider = bar?.querySelector(".slider"); return slider !== undefined && slider !== null && slider.offsetTop + slider.offsetHeight < bar.clientHeight - 1; })()`)).toBe(true);
    // The match carries the mark of every match, and the mark of the match in front over it.
    expect((await marksDrawn(2)).sort()).toEqual(["ink", "strong"]);
    expect(await selected()).toBe("owlneedle");
    await closeThePane();
  });

  it.runIf(process.platform === "darwin")("goes to the next older match at Enter and back at Shift+Enter in its field, and at Command+G and Shift+Command+G from the terminal (scenario A2)", async () => {
    await paneWith(["owltriple one", "between", "owltriple two", "between", "owltriple three"]);
    await findText("owltriple");
    // The match in front is the newest, the lowest of the three.
    await app.until(`${FIND_COUNT} === "1 of 3"`, "the first of three matches");
    expect(await frontMatch(2)).toBe(2);
    await enter(0);
    await app.until(`${FIND_COUNT} === "2 of 3"`, "the second match");
    expect(await frontMatch(1)).toBe(1);
    await enter(0);
    await app.until(`${FIND_COUNT} === "3 of 3"`, "the third match");
    expect(await frontMatch(0)).toBe(0);
    await enter(SHIFT);
    await app.until(`${FIND_COUNT} === "2 of 3"`, "the second match again");
    expect(await frontMatch(1)).toBe(1);
    // Each wraps: past the newest is the oldest.
    await enter(SHIFT);
    await enter(SHIFT);
    await app.until(`${FIND_COUNT} === "3 of 3"`, "the oldest match, after the newest");
    expect(await frontMatch(0)).toBe(0);
    // The keyboard goes to the terminal without a press on it, which would end the selection the bar steps from.
    await app.evaluate(`document.querySelector("#stage .pane:not([hidden]) .xterm-helper-textarea").focus()`);
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the terminal");
    await command("G", true);
    await app.until(`${FIND_COUNT} === "2 of 3"`, "the second match at Shift+Command+G");
    expect(await frontMatch(1)).toBe(1);
    await command("G");
    await app.until(`${FIND_COUNT} === "3 of 3"`, "the third match at Command+G");
    expect(await frontMatch(0)).toBe(0);
    expect(await app.evaluate<boolean>(PANE_HAS_KEYBOARD)).toBe(true);
    // The bar's buttons take the same steps: "Next match" wraps from the oldest to the newest, and "Previous match" back.
    await app.click("#find-next");
    await app.until(`${FIND_COUNT} === "1 of 3"`, 'the newest match at "Next match", after the oldest');
    expect(await frontMatch(2)).toBe(2);
    await app.click("#find-previous");
    await app.until(`${FIND_COUNT} === "3 of 3"`, 'the oldest match at "Previous match", after the newest');
    expect(await frontMatch(0)).toBe(0);
    await closeThePane();
  });

  it.runIf(process.platform === "darwin")("counts the matches the pane printed after the search at each step, while the pane keeps printing (scenario A2)", async () => {
    writeFileSync(linesFile, "owlprinted one\nbetween\nowlprinted two\n");
    const pane = await openPane("Shell");
    // The pane's process prints only the lines above, so the case prints into its terminal itself.
    const terminal = `/dev/${execFileSync("ps", ["-o", "tty=", "-p", String(await pidOf(pane))], { encoding: "utf8" }).trim()}`;
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the new pane");
    await findText("owlprinted");
    await app.until(`${FIND_COUNT} === "1 of 2"`, "the newer of two matches");
    // A match printed after the search, then lines with none more often than the add-on's wait of 200 ms, so the add-on does not count again on its own. Where a stall of the printing lets it count all the same, each step below reads the same count, so no assertion rests on the gaps between the lines.
    writeFileSync(terminal, "owlprinted three\r\n");
    const printing = setInterval(() => writeFileSync(terminal, "-\r\n"), 50);
    try {
      // The lines reach the terminal through the daemon, so each step waits for them to be drawn.
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      // A step onto the match printed since counts it.
      await enter(SHIFT);
      await app.until(`${FIND_COUNT} === "1 of 3"`, "the match printed after the search, counted with the others", 5_000);
      // A step onto a match counted before a fourth was printed counts the fourth too.
      writeFileSync(terminal, "owlprinted four\r\n");
      await new Promise((resolve) => setTimeout(resolve, 1_000));
      await enter(0);
      await app.until(`${FIND_COUNT} === "3 of 4"`, "the next older match, counted with the match printed since", 5_000);
    } finally {
      clearInterval(printing);
    }
    await closeThePane();
  });

  it.runIf(process.platform === "darwin")('counts one spelling with "Match case", searches no pattern that is no regular expression and throws nothing, and says where it stops counting (scenario A3)', async () => {
    await paneWith(["an Error here", "an error there", ...Array.from({ length: 1001 }, (_, index) => `owlmany ${String(index)}`)]);
    await app.evaluate(`void (window.__findErrors = [], window.addEventListener("error", (event) => window.__findErrors.push(String(event.message))))`);
    await findText("Error");
    await app.until(`${FIND_COUNT} === "1 of 2"`, "both spellings");
    await app.click("#find-case");
    await app.until(`${FIND_COUNT} === "1 of 1" && document.getElementById("find-case").getAttribute("aria-pressed") === "true"`, "one spelling with the case matched");
    // The press left the keyboard in the field.
    expect(await app.evaluate<boolean>(FIELD_HAS_KEYBOARD)).toBe(true);
    await app.click("#find-case");
    await app.click("#find-regex");
    await findText("err(or");
    await app.until(`${FIND_COUNT} === "Not a regular expression"`, "the refusal of the pattern");
    expect(await marksDrawn(0)).toEqual([]);
    expect(await app.evaluate<boolean>(`document.getElementById("find-next").disabled && document.getElementById("find-previous").disabled`)).toBe(true);
    await findText("err(or)?");
    await app.until(`${FIND_COUNT} === "1 of 2"`, "both spellings, read as a regular expression");
    await app.click("#find-regex");
    // The add-on counts one past 1,000, so the bar tells 1,000 matches from more, at the newest and at the one before it.
    await findText("owlmany");
    await app.until(`${FIND_COUNT} === "More than 1,000 matches"`, "the count past the limit");
    await enter(0);
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(await app.evaluate<string>(FIND_COUNT)).toBe("More than 1,000 matches");
    expect(await app.evaluate<string[]>("window.__findErrors")).toEqual([]);
    await press("Escape", 27);
    await closeThePane();
  });

  it.runIf(process.platform === "darwin")("closes at Escape in its field with its marks and its selection, and gives the program the keyboard, where Escape in the terminal stays the program's (scenario A4)", async () => {
    const handed = await paneWith(["owlescape here", "owlescape there"]);
    await findText("owlescape");
    await app.until(`${FIND_COUNT} === "1 of 2"`, "the two matches");
    // The selection is read before any key reaches the terminal, since a key typed there ends the terminal's selection itself.
    await press("Escape", 27);
    await app.until(`!(${FIND_OPEN})`, "the bar closed");
    expect(await app.evaluate<boolean>(PANE_HAS_KEYBOARD)).toBe(true);
    expect(await marksDrawn(0)).toEqual([]);
    expect(await app.evaluate<number>(`document.querySelectorAll("#stage .xterm-find-result-decoration").length`)).toBe(0);
    expect(await selected()).toBeNull();
    // The Escape in the field reached no program, and the next key typed does.
    expect((await handed.next(0)).toString("hex")).toBe("");
    await app.cdp("Input.insertText", { text: "k" });
    expect((await handed.next(1)).toString("utf8")).toBe("k");
    // With the keyboard in the terminal, Escape is the program's, and the bar stays.
    await command("F");
    await app.until(`${FIND_OPEN} && ${FIELD_HAS_KEYBOARD}`, "the find bar open again");
    await app.evaluate(`document.querySelector("#stage .pane:not([hidden]) .xterm-helper-textarea").focus()`);
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the terminal");
    await press("Escape", 27);
    expect((await handed.next(1)).toString("hex")).toBe("1b");
    expect(await app.evaluate<boolean>(FIND_OPEN)).toBe(true);
    await closeThePane();
  });

  it("leaves with its pane and keeps nothing typed in it, opens from the pane's menu, and closes at its button (scenario A5)", async () => {
    await paneWith(["owlleaves here"]);
    await pressMenuItem("Find…");
    await app.until(`${FIND_OPEN} && ${FIELD_HAS_KEYBOARD}`, "the find bar from the menu");
    await app.cdp("Input.insertText", { text: "owlleaves" });
    await app.until(`${FIND_COUNT} === "1 of 1"`, "the one match");
    // A press of the right button on the bar opens no menu.
    await rightPress(await app.evaluate<{ x: number; y: number }>(`(() => { const box = document.getElementById("find-count").getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; })()`));
    await new Promise((resolve) => setTimeout(resolve, 300));
    expect(await app.evaluate<boolean>(MENU_OPEN)).toBe(false);
    // Side by side, a press in the bar's field over the pane not in front puts that pane in front, and the field keeps the keyboard.
    await app.click("#side-by-side");
    await app.until(`document.getElementById("stage").dataset.tiles === "2"`, "two panes side by side");
    await app.click(`#stage .pane[data-tile="1"] .xterm-screen`);
    await app.until(`${TAB_IN_FRONT} === "Shell 1"`, "the first pane in front");
    expect(await app.evaluate<boolean>(FIND_OPEN)).toBe(true);
    await app.click("#find-field");
    await app.until(`${TAB_IN_FRONT} === "Shell 2"`, "the bar's pane in front");
    expect(await app.evaluate<boolean>(FIELD_HAS_KEYBOARD)).toBe(true);
    await app.click("#side-by-side");
    await app.until(`document.getElementById("stage").dataset.tiles === "1" && ${FIND_OPEN}`, "the bar's pane alone on the stage, with its bar");
    await app.click("#tabs .tab:nth-child(1) .label");
    await app.until(`${TAB_IN_FRONT} === "Shell 1" && ${PANE_HAS_KEYBOARD}`, "the first pane in front");
    expect(await app.evaluate<boolean>(FIND_OPEN)).toBe(false);
    await app.click("#tabs .tab:nth-child(2) .label");
    await app.until(`${TAB_IN_FRONT} === "Shell 2" && ${PANE_HAS_KEYBOARD}`, "the pane back in front");
    expect(await app.evaluate<boolean>(FIND_OPEN)).toBe(false);
    await untilReplayDrawn();
    await pressMenuItem("Find…");
    await app.until(`${FIND_OPEN} && ${FIELD_HAS_KEYBOARD}`, "the find bar from the menu again");
    expect(await app.evaluate<string>(`document.getElementById("find-field").value`)).toBe("");
    expect(await app.evaluate<string>(FIND_COUNT)).toBe("");
    await app.click("#find-close");
    await app.until(`!(${FIND_OPEN}) && ${PANE_HAS_KEYBOARD}`, "the bar closed and the keyboard in the terminal");
    await closeThePane();
  });
});
