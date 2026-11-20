// The menus in the built app. It starts the app once, in the background, on a
// temporary clone with two work items, and drives the window through
// Electron's debugging port: a work item's menu from the right button and
// from the keyboard, its pin and its mute, and the rename dialog. No case
// presses an "Open in" item or a "Copy" item: each acts on the desktop and
// the clipboard of whoever runs the suite.
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { installedApps } from "../src/main/openers";
import { BuiltApp, buildApp } from "./built-app";
import { RECEIVER } from "./korean-pane";
import { git, temporaryClone } from "./repositories";

describe("the menus in the built app", { timeout: 30_000 }, () => {
  let app: BuiltApp;
  let clone: ReturnType<typeof temporaryClone>;

  const SIDEBAR = "#repositories";
  const INBOX = "#inbox-lines";
  const line = (within: string, id: number): string => `${within} button[data-work-item="${id}"]`;
  const MENU = `[role="menu"]`;
  /** The items a work item's menu holds on this Mac: the apps are the ones the main process finds installed. */
  const items = (pin = "Pin", mute = "Mute notifications"): string[] => ["Rename", "Open in Finder", ...installedApps(existsSync, homedir()).map(({ name }) => `Open in ${name}`), "Copy path", "Copy branch name", pin, mute];

  const value = <T>(expression: string): Promise<T> => app.evaluate<T>(expression);
  const menuItems = (): Promise<string[]> => value(`[...document.querySelectorAll('${MENU} [role="menuitem"]')].map((item) => item.textContent)`);
  const menuLabel = (): Promise<string | null> => value(`document.querySelector('${MENU}')?.getAttribute("aria-label") ?? null`);
  const menuShown = (): Promise<void> => app.until(`document.querySelector('${MENU}')`, "a menu");
  const menuGone = (): Promise<void> => app.until(`!document.querySelector('${MENU}')`, "the menu closed");
  /** The words of the item of the open menu the keyboard is on. */
  const itemInFocus = (): Promise<string | null> => value(`document.activeElement?.closest('${MENU}') ? document.activeElement.textContent : null`);
  /** The work items of the lines under an element, in the order they are drawn. */
  const order = (within: string): Promise<number[]> => value(`[...document.querySelectorAll('${within} button[data-work-item]')].map((button) => Number(button.dataset.workItem))`);
  /** The words of the marks a work item's line carries after its title. */
  const marks = (within: string, id: number): Promise<string[]> => value(`[...document.querySelectorAll('${line(within, id)} .line-mark')].map((mark) => mark.getAttribute("aria-label"))`);
  const title = (within: string, id: number): Promise<string> => value(`document.querySelector('${line(within, id)} .title').textContent`);

  /** Waits until an element says a text, and says what it says instead where it never does. */
  async function says(id: string, text: string): Promise<void> {
    try {
      await app.until(`document.getElementById(${JSON.stringify(id)}).textContent === ${JSON.stringify(text)}`, `"${text}" in ${id}`);
    } catch (error) {
      throw new Error(`${(error as Error).message}; it says: ${JSON.stringify(await value<string>(`document.getElementById(${JSON.stringify(id)}).textContent`))}, the name is ${JSON.stringify(await value<string>(`document.getElementById("rename-title").value`))}, and the status line says ${JSON.stringify(await value<string>(`document.getElementById("status").textContent`))}`);
    }
  }

  async function middleOf(expression: string): Promise<{ x: number; y: number }> {
    return value(`(() => { const box = (${expression}).getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + box.height / 2 }; })()`);
  }

  /** A press of the right button in the middle of the element a selector finds, as a person's press arrives. */
  async function rightPress(selector: string): Promise<void> {
    const at = await middleOf(`document.querySelector(${JSON.stringify(selector)})`);
    await app.cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...at, button: "right", clickCount: 1 });
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...at, button: "right", clickCount: 1 });
  }

  /** A click on the item of the open menu that says `label`. */
  async function pressItem(label: string): Promise<void> {
    const at = await middleOf(`[...document.querySelectorAll('${MENU} [role="menuitem"]')].find((item) => item.textContent === ${JSON.stringify(label)})`);
    await app.cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...at, button: "left", clickCount: 1 });
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...at, button: "left", clickCount: 1 });
  }

  /** A key pressed and let go, with the Shift key held where `shift` says so. It types nothing. */
  async function press(code: string, virtualKey: number, shift = false): Promise<void> {
    const key = { code, key: code.startsWith("Key") ? code.slice(3).toLowerCase() : code, windowsVirtualKeyCode: virtualKey, modifiers: shift ? 8 : 0 };
    await app.cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", ...key });
    await app.cdp("Input.dispatchKeyEvent", { type: "keyUp", ...key });
  }
  const escape = (): Promise<void> => press("Escape", 27);

  /** Creates a work item through the form, with a pane of the shell kind, and waits for its view. */
  async function create(name: string, repo?: string): Promise<void> {
    await app.click("#new-work-item");
    await app.until(`document.getElementById("work-item-dialog").open`, 'the "New work item" form');
    if (repo !== undefined) {
      await app.click("#work-item-repo");
      await app.cdp("Input.insertText", { text: repo });
    }
    await app.click("#work-item-title");
    await app.cdp("Input.insertText", { text: name });
    await app.evaluate(`document.getElementById("work-item-kind").value = "shell"`);
    await app.click("#work-item-create");
    await app.until(`!document.getElementById("work-item-view").hidden && document.getElementById("view-title").textContent === ${JSON.stringify(name)}`, `the view of ${name}`);
  }

  /** Opens the rename dialog of a work item from its menu in the sidebar, and types a name over the one it holds. */
  async function renameTo(id: number, name: string): Promise<void> {
    await rightPress(line(SIDEBAR, id));
    await menuShown();
    await pressItem("Rename");
    await app.until(`document.getElementById("rename-dialog").open`, "the rename dialog");
    await app.evaluate(`document.getElementById("rename-title").select()`);
    if (name === "") {
      // The name is emptied with a key, as a person empties it.
      await app.cdp("Input.dispatchKeyEvent", { type: "keyDown", windowsVirtualKeyCode: 8, code: "Backspace", key: "Backspace" });
      await app.cdp("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: 8, code: "Backspace", key: "Backspace" });
      return;
    }
    await app.cdp("Input.insertText", { text: name });
  }

  beforeAll(async () => {
    buildApp();
    clone = temporaryClone();
    // The pane's process is the receiver, so no shell of the person's and no agent starts.
    app = await BuiltApp.start({ SHELL: RECEIVER, OWLERY_WORKTREES: clone.root, OWLERY_RECEIVER_FILE: join(clone.base, "received") });
    // The app starts in the background, and the page of a window without the system's focus reports none.
    await app.cdp("Emulation.setFocusEmulationEnabled", { enabled: true });
    await app.until(`["summary-screen", "inbox-screen", "history-screen"].some((id) => document.getElementById(id)?.hidden === false)`, "a screen in front");
    await create("First item", clone.repo);
    await create("Second item");
    await app.until(`document.querySelectorAll('${SIDEBAR} button[data-work-item]').length === 2`, "both work items in the sidebar");
  }, 120_000);

  afterAll(async () => {
    await app?.stop();
    clone?.remove();
  }, 30_000);

  it("opens a work item's menu at a press of the right button on its line in the sidebar, with its items in order and the keyboard on the first, moves through them with the arrows, and closes at Escape", async () => {
    expect(await order(SIDEBAR)).toEqual([1, 2]);
    await rightPress(line(SIDEBAR, 1));
    await menuShown();
    expect(await menuLabel()).toBe("Menu of First item");
    expect(await menuItems()).toEqual(items());
    expect(await itemInFocus()).toBe("Rename");
    await press("ArrowDown", 40);
    expect(await itemInFocus()).toBe("Open in Finder");
    await press("ArrowUp", 38);
    await press("ArrowUp", 38);
    expect(await itemInFocus()).toBe("Rename");
    await escape();
    await menuGone();
    // The view of the second work item is still in front: the press opened no view.
    expect(await value<string>(`document.getElementById("view-title").textContent`)).toBe("Second item");
  });

  it("opens the menu at the same press on a line of the inbox, and at a press outside it closes", async () => {
    await app.click("#nav-inbox");
    await app.until(`!document.getElementById("inbox-screen").hidden`, "the inbox");
    await rightPress(line(INBOX, 2));
    await menuShown();
    expect(await menuLabel()).toBe("Menu of Second item");
    expect(await menuItems()).toEqual(items());
    await app.click("#inbox-word");
    await menuGone();
    expect(await value<boolean>(`document.getElementById("inbox-screen").hidden`)).toBe(false);
  });

  it("opens the menu of the selected line at the key M where the keyboard is on no line, reads no other key of the window while it is open, and names the key under the preview", async () => {
    expect(await value<string>(`document.getElementById("inbox-preview-keys").textContent`)).toContain("M opens the menu");
    await app.evaluate(`document.activeElement?.blur()`);
    const selected = (): Promise<number> => value(`Number(document.querySelector('${INBOX} button.selected').dataset.workItem)`);
    // The inbox opened on the line of the view it was opened from, the second, and K selects the line before it.
    await press("KeyK", 75);
    expect(await selected()).toBe(1);
    await press("KeyM", 77);
    await menuShown();
    expect(await menuLabel()).toBe("Menu of First item");
    // J moves the selection while no menu is open, and not now.
    await press("KeyJ", 74);
    expect(await selected()).toBe(1);
    // A second M opens no second menu.
    await press("KeyM", 77);
    expect(await value<number>(`document.querySelectorAll('${MENU}').length`)).toBe(1);
    await escape();
    await menuGone();
    await press("KeyJ", 74);
    expect(await selected()).toBe(2);
  });

  it("opens the menu of the line the keyboard is on at F10 with Shift, whatever line is selected, returns the keyboard to that line at Escape, and reads the key in no field", async () => {
    await app.evaluate(`document.querySelector('${line(SIDEBAR, 1)}').focus()`);
    await press("F10", 121, true);
    await menuShown();
    expect(await menuLabel()).toBe("Menu of First item");
    await escape();
    await menuGone();
    expect(await value<boolean>(`document.activeElement === document.querySelector('${line(SIDEBAR, 1)}')`)).toBe(true);
    await app.click("#search-field");
    await press("KeyM", 77);
    await press("F10", 121, true);
    expect(await value<number>(`document.querySelectorAll('${MENU}').length`)).toBe(0);
    await app.evaluate(`document.activeElement?.blur()`);
  });

  it("pins a work item from its menu: its line carries the mark and stands first in the sidebar and in the inbox, and the menu then offers Unpin", async () => {
    await rightPress(line(SIDEBAR, 2));
    await menuShown();
    await pressItem("Pin");
    await menuGone();
    await app.until(`document.querySelector('${line(SIDEBAR, 2)} .line-mark')`, "the pin's mark in the sidebar");
    expect(await marks(SIDEBAR, 2)).toEqual(["Pinned"]);
    expect(await marks(INBOX, 2)).toEqual(["Pinned"]);
    expect(await marks(SIDEBAR, 1)).toEqual([]);
    expect(await order(SIDEBAR)).toEqual([2, 1]);
    expect(await order(INBOX)).toEqual([2, 1]);
    await rightPress(line(INBOX, 2));
    await menuShown();
    expect(await menuItems()).toEqual(items("Unpin"));
    await pressItem("Unpin");
    await app.until(`!document.querySelector('${line(SIDEBAR, 2)} .line-mark')`, "the pin's mark gone");
    expect(await order(SIDEBAR)).toEqual([1, 2]);
    expect(await order(INBOX)).toEqual([1, 2]);
  });

  it("mutes a work item's notifications from its menu: its line carries the mark, and the menu then offers Unmute notifications", async () => {
    await rightPress(line(SIDEBAR, 1));
    await menuShown();
    await pressItem("Mute notifications");
    await app.until(`document.querySelector('${line(SIDEBAR, 1)} .line-mark')`, "the mute's mark in the sidebar");
    expect(await marks(SIDEBAR, 1)).toEqual(["Notifications muted"]);
    expect(await marks(INBOX, 1)).toEqual(["Notifications muted"]);
    await rightPress(line(SIDEBAR, 1));
    await menuShown();
    expect(await menuItems()).toEqual(items("Pin", "Unmute notifications"));
    await escape();
    await menuGone();
  });

  it("renames a work item in the rename dialog: an empty name is refused there, and a name changes the line's title and leaves the branch", async () => {
    await renameTo(1, "");
    expect(await value<string>(`document.getElementById("rename-title").value`)).toBe("");
    await app.click("#rename-submit");
    await says("rename-error", "Give the work item a name.");
    expect(await value<boolean>(`document.getElementById("rename-dialog").open`)).toBe(true);
    await app.click("#rename-cancel");
    await app.until(`!document.getElementById("rename-dialog").open`, "the rename dialog closed");
    expect(await title(SIDEBAR, 1)).toBe("First item");

    await renameTo(1, "Renamed here");
    await says("rename-plan", "The branch becomes owlery/renamed-here.");
    expect(await value<boolean[]>(`[document.getElementById("rename-branch").disabled, document.getElementById("rename-branch").checked]`)).toEqual([false, false]);
    await app.click("#rename-submit");
    await app.until(`!document.getElementById("rename-dialog").open`, "the rename dialog closed");
    await app.until(`document.querySelector('${line(SIDEBAR, 1)} .title').textContent === "Renamed here"`, "the new title in the sidebar");
    expect(await title(INBOX, 1)).toBe("Renamed here");
    expect(git(clone.repo, "branch", "--list", "owlery/*").split("\n").map((name) => name.trim()).filter(Boolean)).toEqual(["+ owlery/first-item", "+ owlery/second-item"]);
  });

  it("renames the branch too where the dialog's choice is taken, and says why the choice cannot be taken for the name the branch already has", async () => {
    await renameTo(2, "Second item");
    await says("rename-plan", "The branch is already owlery/second-item.");
    expect(await value<boolean>(`document.getElementById("rename-branch").disabled`)).toBe(true);
    await app.evaluate(`document.getElementById("rename-title").select()`);
    await app.cdp("Input.insertText", { text: "Third name" });
    await says("rename-plan", "The branch becomes owlery/third-name.");
    await app.click("#rename-branch");
    expect(await value<boolean>(`document.getElementById("rename-branch").checked`)).toBe(true);
    await app.click("#rename-submit");
    await app.until(`!document.getElementById("rename-dialog").open`, "the rename dialog closed");
    await app.until(`document.querySelector('${line(SIDEBAR, 2)} .title').textContent === "Third name"`, "the new title in the sidebar");
    expect(git(clone.repo, "branch", "--list", "owlery/*").split("\n").map((name) => name.trim()).filter(Boolean)).toEqual(["+ owlery/first-item", "+ owlery/third-name"]);
    expect(git(join(clone.root, "project", "second-item"), "symbolic-ref", "HEAD").trim()).toBe("refs/heads/owlery/third-name");
  });
});
