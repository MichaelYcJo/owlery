// What a terminal pane and the window around it do for a person, read in the
// built app: the window stays on its own page, the menu leaves the page its
// keys, the Command key with W closes the pane in front, a pane whose
// session is working asks before it closes, a file dropped on a pane types
// its path, a link opens at a click with the Command key, and Shift+Enter
// sends a line feed. One start of the app serves every case, so the cases
// run in the order they stand in. No case opens the system's browser: the
// app is started with `OWLERY_OPENER` naming a program that notes the
// address it was handed.
import { chmodSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
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

/** The two links a shell pane prints (./fixtures/basics-shell.sh): the address on its first row, and the address the name on its second row carries. */
const PRINTED = "https://example.com/owlery-basics";
const NAMED = "https://example.com/owlery-named";

const TABS = `[...document.querySelectorAll("#tabs .tab .label")].map((label) => label.textContent)`;
const TAB_IN_FRONT = `document.querySelector("#tabs .tab.active .label")?.textContent`;
const PANE_HAS_KEYBOARD = `document.activeElement === document.querySelector("#stage .pane:not([hidden]) .xterm-helper-textarea")`;
const DIALOG_OPEN = `document.getElementById("close-pane-dialog")?.open === true`;
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
  /** The file the opener writes each address it was handed to, a line each. */
  let openedFile: string;
  /** The panes the cases opened so far. A daemon numbers the panes it starts from 1. */
  let panes = 0;

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
    app = await BuiltApp.start({ SHELL, OWLERY_WORKTREES: repository.root, OWLERY_RECEIVER_FILE: receivedFile, OWLERY_STAND_IN_NODE: process.execPath, OWLERY_OPENER: opener }, { inspectMain: true });
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
    return panes;
  }

  /** A press and a release of a letter's key with the Command key, sent to the page as a person's key arrives there. */
  async function command(letter: "W" | "N"): Promise<void> {
    const key = { modifiers: COMMAND, windowsVirtualKeyCode: letter.charCodeAt(0), code: `Key${letter}`, key: letter.toLowerCase() };
    await app.cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", ...key });
    await app.cdp("Input.dispatchKeyEvent", { type: "keyUp", ...key });
  }

  /** Has a client of the daemon other than the window close a pane, as a second window of the app would. */
  async function closeFromElsewhere(pane: number): Promise<void> {
    const { port, token } = JSON.parse(readFileSync(join(app.userData, "run", "daemon.json"), "utf8")) as { port: number; token: string };
    const socket = new WebSocket(`ws://127.0.0.1:${port}`);
    await new Promise<void>((resolve, reject) => {
      socket.addEventListener("error", () => reject(new Error("the daemon refused a second client")), { once: true });
      // The daemon answers a hello it takes with `ready`, and a close sent before that is no client's.
      socket.addEventListener("message", () => resolve(), { once: true });
      socket.addEventListener("open", () => socket.send(JSON.stringify({ type: "hello", token })), { once: true });
    });
    socket.send(JSON.stringify({ type: "close", id: pane }));
    socket.close();
  }

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
    // The keys the page reads with the Command key (src/renderer/view.ts, `commandKey`). A menu entry on one of them takes the key before the page sees it.
    const taken = entries.filter(({ accelerator }) => {
      const { key, modifiers } = keyOf(accelerator);
      return ["K", "N", "W"].includes(key) && modifiers.join("+") === "command";
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

  /** A click on the link of a row of the pane in front, with the modifier keys held, as a person's click arrives: the pointer comes over the link first. Afterwards the pointer is over no link. */
  async function clickLink(row: number, modifiers: number): Promise<void> {
    const overLink = `document.querySelector("#stage .pane:not([hidden]) .xterm-cursor-pointer") !== null`;
    const at = await cell(9, row);
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", ...at, modifiers });
    await app.until(overLink, `a link under the pointer on row ${row + 1}`);
    await app.cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...at, button: "left", clickCount: 1, modifiers });
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...at, button: "left", clickCount: 1, modifiers });
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", ...(await cell(9, 5)) });
    await app.until(`!(${overLink})`, "no link under the pointer");
  }

  /** The addresses the opener was handed so far, once it was handed `count` of them, or after a moment in which one more would have arrived. */
  async function opened(count: number): Promise<string[]> {
    const lines = (): string[] => (existsSync(openedFile) ? readFileSync(openedFile, "utf8").split("\n").filter(Boolean) : []);
    const deadline = Date.now() + 5_000;
    while (lines().length < count && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 50));
    await new Promise((resolve) => setTimeout(resolve, 500));
    return lines();
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
    const text = `${repository.base}/shot\\ 한\\ it\\'s.png `;
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
    const text = `${files[0]} ${files[1]} `;
    expect((await received.next(Buffer.byteLength(text))).toString("utf8")).toBe(text);
    expect(readFileSync(`${receivedFile}-${second}`, "utf8")).toBe("");
    await app.until(`${TAB_IN_FRONT} === "Shell 1"`, "the pane that took the drop in front");
    await app.click("#side-by-side");
    await closeFromElsewhere(second);
    await app.until(`${TABS}.length === 1`, "one tab");
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the pane that is left");
  });

  it("types nothing where a file is dropped outside a pane", async () => {
    const file = join(repository.base, "elsewhere.png");
    writeFileSync(file, "");
    await received.next(0);
    await drop(`document.getElementById("view-title")`, [file]);
    expect((await received.next(1)).toString("utf8")).toBe("");
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
    expect(await opened(2)).toEqual([PRINTED]);
  });

  it("opens a link that a name carries under the same rule, and asks nothing", async () => {
    // The terminal's own way with such a link is the browser's question. Should it ask, the answer is no and the case says so.
    await app.evaluate(`void (window.confirm = () => { window.__asked = true; return false; })`);
    await clickLink(1, 0);
    expect(await opened(2)).toEqual([PRINTED]);
    await clickLink(1, COMMAND);
    expect(await opened(2)).toEqual([PRINTED, NAMED]);
    expect(await app.evaluate<boolean>("window.__asked === undefined")).toBe(true);
    expect(await app.pages()).toHaveLength(1);
  });
});
