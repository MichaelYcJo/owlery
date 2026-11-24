// What a terminal pane and the window around it do for a person, read in the
// built app: the window stays on its own page, the menu leaves the page its
// keys, the Command key with W closes the pane in front, a pane whose
// session is working asks before it closes, a file dropped on a pane types
// its path, a link opens at a click with the Command key, Shift+Enter
// sends a line feed, a path a pane printed is a link where something stands
// at it, a link under the pointer shows a card of what a click does, a
// press of the right button on a pane opens the pane's menu, and the left
// arrow, the right arrow and Backspace with the Command key are the editing
// keys of macOS.
// One start of the app serves every case, so the cases run in the order
// they stand in. No case opens the system's browser or Finder: the app is
// started with `OWLERY_OPENER` naming a program that notes the address or
// the path it was handed. No case reads or writes the system's clipboard:
// the app starts in the background, where it keeps a clipboard of its own.
import { chmodSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { CARD_LEAVE_MS, CARD_SHOW_MS } from "../src/renderer/view";
import { alive, BuiltApp, buildApp, untilGone } from "./built-app";
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
const OVER_LINK = `document.querySelector("#stage .pane:not([hidden]) .xterm-cursor-pointer") !== null`;
/** The keys a card's row names for a click with the key that opens a link, and for one with the Shift key as well. */
const KEY_CLICK = process.platform === "darwin" ? "\u2318 Click" : "Ctrl Click";
const SHIFT_KEY_CLICK = process.platform === "darwin" ? "\u21e7 \u2318 Click" : "Shift Ctrl Click";
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

  /** A press and a release of a letter's key with the Command key, sent to the page as a person's key arrives there. */
  async function command(letter: "W" | "N"): Promise<void> {
    const key = { modifiers: COMMAND, windowsVirtualKeyCode: letter.charCodeAt(0), code: `Key${letter}`, key: letter.toLowerCase() };
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

  // A case that fails stops at its failing line, and leaves the panes it opened and "Side by side" as they were there. The cases after it start from one tab, the first pane's, with "Side by side" off. A case that passes leaves what the case after it reads: it closes its panes itself, or hands its pane on, as the case "makes a path a pane printed a link…" hands its pane to the case after it. So this acts after a case that failed alone.
  afterEach(async ({ task }) => {
    if (task.result?.state !== "fail") return;
    const left = await closeFromElsewhere(...openedPanes);
    if (left.length > 0) await app.until(`${TABS}.length === 1`, "one tab, once the panes the failed case left are closed");
    // The button is pressed from the page, since a case that failed may have left another screen in front of the view that holds it.
    await app.evaluate(`void (document.getElementById("side-by-side").getAttribute("aria-pressed") === "true" && document.getElementById("side-by-side").click())`);
  });

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
    // The keys the page reads with the Command key (src/renderer/view.ts, `commandKey`), and the three a pane reads with it (`paneKey`). A menu entry on one of them takes the key before the page sees it.
    const taken = entries.filter(({ accelerator }) => {
      const { key, modifiers } = keyOf(accelerator);
      return ["K", "N", "W", "LEFT", "RIGHT", "BACKSPACE"].includes(key) && modifiers.join("+") === "command";
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

  // The cases below read the first pane, which is the one tab, in front, with the keyboard.

  /** The middle of a cell of the screen of the pane in front, by its column and its row, each from 0. The strip says how many of each the screen holds. */
  function cell(column: number, row: number): Promise<{ x: number; y: number }> {
    return app.evaluate(`(() => {
      const box = document.querySelector("#stage .pane:not([hidden]) .xterm-screen").getBoundingClientRect();
      const [columns, rows] = document.getElementById("strip-size").textContent.split("×").map(Number);
      return { x: box.x + (box.width / columns) * ${column + 0.5}, y: box.y + (box.height / rows) * ${row + 0.5} };
    })()`);
  }

  /** Brings the pointer to a cell of the pane in front, as a person's pointer arrives there. */
  async function pointAt(column: number, row: number, modifiers = 0): Promise<{ x: number; y: number }> {
    const at = await cell(column, row);
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", ...at, modifiers });
    return at;
  }

  /** Takes the pointer to a row of the pane in front that holds no link, and waits until the terminal has it over none and the card of the link it was on is gone: a card stands over the rows under its link, and the pointer would come onto it and not onto a link there. */
  async function pointAway(): Promise<void> {
    await pointAt(9, EMPTY_ROW);
    await app.until(`!(${OVER_LINK}) && !(${CARD_SHOWN})`, "no link under the pointer, and no card");
  }

  /**
   * Brings the pointer onto a cell of the pane in front, from a row with no
   * link, until `expression` holds there, and answers where the pointer is.
   * The terminal looks for the links of a row as the pointer comes onto it,
   * and not again while the pointer stays on it, so a row drawn after the
   * pointer came holds no link under it. The output of a pane that has just
   * started, and the replay of a pane whose view has just come in front,
   * can arrive after the case's pointer (#117). So the pointer comes again
   * each two seconds, from the row with no link, until `what` shows, fifteen
   * seconds at most.
   */
  async function comeOnto(column: number, row: number, expression: string, what: string, modifiers = 0): Promise<{ x: number; y: number }> {
    const deadline = Date.now() + 15_000;
    for (;;) {
      await pointAway();
      const at = await pointAt(column, row, modifiers);
      const again = Date.now() + 2_000;
      do {
        if (await app.evaluate<boolean>(expression)) return at;
        await new Promise((resolve) => setTimeout(resolve, 50));
      } while (Date.now() < again);
      if (Date.now() >= deadline) throw new Error(`the window never showed ${what}`);
    }
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
    await received.next(0);
    // The tile of the pane that is not in front: the one without the keyboard.
    await drop(`[...document.querySelectorAll("#stage .pane:not([hidden])")].find((tile) => !tile.contains(document.activeElement))`, files);
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

  it("shows a path's file in Finder at a click with the Command key held, and copies the whole path from its card", async () => {
    const file = join(await worktreeInFront(), PRINTED_PATH);
    const before = await opened(2);
    await clickLink(2, COMMAND);
    expect(await opened(3)).toEqual([...before, file]);
    await clickLink(2, 0);
    await clickLink(2, SHIFT);
    expect(await opened(3)).toEqual([...before, file]);
    // The second row of the path that wraps is the same link.
    await clickLink(5, COMMAND | SHIFT, 3);
    expect(await opened(4)).toEqual([...before, file, wrapped]);

    await restOn(9, 3);
    expect(await card()).toEqual({
      title: file,
      rows: [
        ["Show in Finder", KEY_CLICK],
        ["Copy path", ""],
      ],
    });
    await pressCardRow(1);
    expect(await app.evaluate<boolean>(CARD_SHOWN)).toBe(false);
    expect(await clipboard()).toBe(file);
    expect(await opened(4)).toHaveLength(4);
    await restOn(9, 2);
    await pressCardRow(0);
    expect(await app.evaluate<boolean>(CARD_SHOWN)).toBe(false);
    expect(await opened(5)).toEqual([...before, file, wrapped, file]);
    expect(await app.evaluate<boolean>(PANE_HAS_KEYBOARD)).toBe(true);

    // A card that would pass the window's right edge is moved to stand inside it.
    const columns = Number((await app.evaluate<string>(`document.getElementById("strip-size").textContent`)).split("×")[0]);
    const at = await restOn(columns - 1, 4);
    expect((await card()).title).toBe(wrapped);
    const box = await app.evaluate<{ left: number; right: number; inner: number }>(`(() => { const box = document.getElementById("link-card").getBoundingClientRect(); return { left: box.left, right: box.right, inner: window.innerWidth }; })()`);
    // Its left edge stands well left of the pointer, by more than the part of a cell a pointer's place is rounded by.
    expect(at.x - box.left).toBeGreaterThan(10);
    expect(box.right).toBeLessThanOrEqual(box.inner);
    await pointAway();

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
    // Create creates nothing before the form shows the plan of its folder.
    await app.until(`document.getElementById("work-item-branch").textContent !== ""`, "the plan of the folder");
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

  it.runIf(process.platform === "darwin")("sends Control+A, Control+E and Control+U for the left arrow, the right arrow and Backspace with the Command key, and nothing else", async () => {
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
  async function press(key: "Escape" | "ArrowDown" | "ArrowUp", virtualKey: number): Promise<void> {
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
    expect(await menu()).toEqual([["Copy", "\u2318C"], ["Paste", "\u2318V"], ["Select All", ""], "-", ["Clear Screen", ""], ["Reset Terminal", ""], "-", ["Close Pane", "\u2318W"]].map((item) => (process.platform === "darwin" || typeof item === "string" ? item : [item[0], ""])));
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
    await comeOnto(9, 0, OVER_LINK, "the link on the pane's first row, drawn again from its replay");
    await pointAway();

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
});
