// What a terminal pane and the window around it do for a person, read in the
// built app: the window stays on its own page, the menu leaves the page its
// keys, the Command key with W closes the pane in front, and a pane whose
// session is working asks before it closes. One start of the app serves
// every case, so the cases run in the order they stand in.
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { alive, BuiltApp, buildApp, untilGone } from "./built-app";
import { openReceiverPane } from "./korean-pane";
import { temporaryRepository } from "./repositories";

/** The panes' process: `SHELL` for the app the cases start. */
const SHELL = join(__dirname, "fixtures", "basics-shell.sh");

/** The Command key's place in a key event of the debugging port, and the Control key's where the keyboard has no Command key. */
const COMMAND = process.platform === "darwin" ? 4 : 2;

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
  /** The panes the cases opened so far. A daemon numbers the panes it starts from 1. */
  let panes = 0;

  /** The file the shell pane with a number writes its process id to. */
  const pidFile = (pane: number): string => `${receivedFile}-${pane}.pid`;

  beforeAll(async () => {
    buildApp();
    repository = temporaryRepository("terminal-basics");
    receivedFile = join(repository.base, "received");
    app = await BuiltApp.start({ SHELL, OWLERY_WORKTREES: repository.root, OWLERY_RECEIVER_FILE: receivedFile, OWLERY_STAND_IN_NODE: process.execPath }, { inspectMain: true });
    // The app starts in the background, and the page of a window without the system's focus reports none.
    await app.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
    await openReceiverPane(app, repository.repo, `${receivedFile}-1`);
    panes = 1;
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

  it("closes the dialog where its pane is gone while it asks", async () => {
    const pane = await openPane("Claude Code");
    await app.until(`document.getElementById("strip-state").textContent.startsWith("Working")`, "the new pane's session as working");
    await command("W");
    await app.until(DIALOG_OPEN, "the dialog that asks before the close");
    await closeFromElsewhere(pane);
    await app.until(`${TABS}.length === 1`, "one tab");
    expect(await app.evaluate<boolean>(DIALOG_OPEN)).toBe(false);
    await app.until(PANE_HAS_KEYBOARD, "the keyboard in the pane that is left");
  });
});
