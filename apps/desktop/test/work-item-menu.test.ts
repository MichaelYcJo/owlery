// The menus in the built app. It starts the app once, in the background, on a
// temporary clone with two work items, and drives the window through
// Electron's debugging port: a work item's menu from the right button and
// from the keyboard, its pin and its mute, and the rename dialog; then a
// repository's menu, the form's choice to register a repository alone, and
// a repository's settings, its icon and hiding it; then a work item's
// archive, the screen of a repository's archived work items and a restore;
// then a work item's delete, and the delete of a work item whose commits
// are more than its dialog's list shows at once; a repository's new group, and a work item's
// move into it and out of it; and a removal that deletes a repository's work
// items from disk, and one that is refused after its first delete; then
// a repository's removal that leaves everything on disk; and last a delete
// that leaves a search and a chosen state no repository, which the sidebar
// says above the button of a repository it hides, and the press that shows
// every work item again. Among the first
// cases stand the ones of the "Open in" submenu: its keys, the pointer, its
// place at the window's edge, and a press of its Finder item on a folder the
// case moved aside. No case presses an item of that submenu on a folder that
// stands, or a "Copy" item, and none checks the choice that moves a
// repository's folder to the Trash: each acts on the desktop, the clipboard
// and the Trash of whoever runs the suite.
import { appendFileSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { installedApps } from "../src/main/openers";
import { SUBMENU_LEAVE_MS } from "../src/renderer/menu";
import { NEW_WORK_ITEM_SAYS, REGISTER_ONLY_SAYS, rowButtons } from "../src/renderer/view";
import { BuiltApp, buildApp } from "./built-app";
import { RECEIVER } from "./korean-pane";
import { commitFile, git, temporaryClone, temporaryRepository } from "./repositories";

describe("the menus in the built app", { timeout: 30_000 }, () => {
  let app: BuiltApp;
  let clone: ReturnType<typeof temporaryClone>;
  /** A second repository, which the form registers with no work item. */
  let second: ReturnType<typeof temporaryRepository>;
  /** A third repository, whose removal deletes its one work item from disk. */
  let third: ReturnType<typeof temporaryRepository>;
  /** A fourth repository, whose removal deletes one of its two work items and is refused at the other. */
  let fourth: ReturnType<typeof temporaryRepository>;
  /** Two repositories the last case registers, each with one work item: its search leaves the work item of `lone`, and no other. */
  let kept: ReturnType<typeof temporaryRepository>;
  let lone: ReturnType<typeof temporaryRepository>;
  /** A third repository the last case registers and hides, so the hidden repositories' button stands under the sidebar's sentence. */
  let aside: ReturnType<typeof temporaryRepository>;

  const SIDEBAR = "#repositories";
  const INBOX = "#inbox-lines";
  /** The lines of the screen that lists a repository's archived work items. */
  const ARCHIVED = "#archived-lines";
  const line = (within: string, id: number): string => `${within} button[data-work-item="${id}"]`;
  /** Any menu the window draws, the open submenu among them: a case that reads a menu's items through it reads them while no submenu is open. */
  const MENU = `[role="menu"]`;
  /** The open "Open in" submenu, which stands in the page only while it is open. */
  const SUBMENU = `[role="menu"][aria-label="Open in"]`;
  /** The item of a menu that opens the submenu. */
  const OPENER = `[role="menuitem"][aria-haspopup="menu"]`;
  /** The items a work item's menu holds. */
  const items = (pin = "Pin", mute = "Mute notifications", moves: string[] = []): string[] => ["Rename", "Open in", "Copy path", "Copy branch name", pin, mute, ...moves, "Archive", "Delete"];
  /** The items the menu of an archived work item holds. */
  const archivedItems = (): string[] => ["Restore", "Open in", "Copy path", "Copy branch name", "Delete"];
  /** The items a repository's menu holds. */
  const repositoryItems = (): string[] => ["Settings", "Change icon", "Records and check…", "Show archived work items", "New group", "Open in", "Copy path", "Hide from sidebar", "Remove"];
  /** The items the "Open in" submenu holds on this Mac: the apps are the ones the main process finds installed. */
  const openInItems = (): string[] => ["Finder", ...installedApps(existsSync, homedir()).map(({ name }) => name)];
  /** A repository's part of the sidebar, by the repository's id. */
  const repository = (id: number): string => `${SIDEBAR} section[data-repository="${id}"]`;
  /** The words of a repository's row: its icon, its name and how many work items stand under it. */
  const rowWords = (id: number): Promise<string[]> => value(`[...document.querySelectorAll('${repository(id)} .fold > span')].map((part) => part.textContent)`);
  /** What git holds of a repository: its branches and its worktrees. */
  const held = (repo: string): string[] => [git(repo, "for-each-ref"), git(repo, "worktree", "list", "--porcelain")];

  const value = <T>(expression: string): Promise<T> => app.evaluate<T>(expression);
  const menuItems = (): Promise<string[]> => value(`[...document.querySelectorAll('${MENU} [role="menuitem"]')].map((item) => item.textContent)`);
  const menuLabel = (): Promise<string | null> => value(`document.querySelector('${MENU}')?.getAttribute("aria-label") ?? null`);
  const menuShown = (): Promise<void> => app.until(`document.querySelector('${MENU}')`, "a menu");
  const menuGone = (): Promise<void> => app.until(`!document.querySelector('${MENU}')`, "the menu closed");
  const submenuItems = (): Promise<string[]> => value(`[...document.querySelectorAll('${SUBMENU} [role="menuitem"]')].map((item) => item.textContent)`);
  const submenuStands = (): Promise<boolean> => value(`document.querySelector('${SUBMENU}') !== null`);
  const submenuShown = (): Promise<void> => app.until(`document.querySelector('${SUBMENU}')`, "the Open in submenu");
  const submenuGone = (): Promise<void> => app.until(`!document.querySelector('${SUBMENU}')`, "the Open in submenu closed");
  /** What the item that opens the submenu says of itself: whether it opens a menu, whether that menu is open, and whether it has a description that is not its label. */
  const opener = (): Promise<(string | boolean | null)[]> => value(`(() => { const item = document.querySelector('${OPENER}'); return [item.textContent, item.getAttribute("aria-haspopup"), item.getAttribute("aria-expanded"), item.title.trim() !== "" && item.title !== item.textContent]; })()`);
  /** The pointer brought to a place with no press. */
  const pointerTo = (at: { x: number; y: number }): Promise<unknown> => app.cdp("Input.dispatchMouseEvent", { type: "mouseMoved", ...at });
  /** The middle of the item that says `label`, of any menu that is open. */
  const itemAt = (label: string): Promise<{ x: number; y: number }> => middleOf(`[...document.querySelectorAll('${MENU} [role="menuitem"]')].find((item) => item.textContent === ${JSON.stringify(label)})`);
  /**
   * Has the pointer come from the submenu's Finder item onto the menu's
   * "Copy path" and back onto Finder, in one task of the page, and answers
   * whether the submenu stood on "Copy path" and whether it stands back on
   * Finder. Each arrival is the `pointerenter` a person's pointer raises on
   * what it comes onto. No turn of the pause's timer falls between the two
   * arrivals, however long the page takes to answer: two moves through the
   * debugging port wait on an answer each, and on GitHub's runner the second
   * has come after the pause ran out (#117). Two moves sent at once reach
   * the page as one, which crosses nothing.
   */
  const crossToCopyPathAndBack = (): Promise<{ onCopyPath: boolean; back: boolean }> =>
    value(`(() => {
      const item = (label) => [...document.querySelectorAll('${MENU} [role="menuitem"]')].find((item) => item.textContent === label);
      const arrive = (element) => element.dispatchEvent(new PointerEvent("pointerenter", { pointerType: "mouse" }));
      arrive(item("Copy path"));
      const onCopyPath = document.querySelector('${SUBMENU}') !== null;
      if (!onCopyPath) return { onCopyPath, back: false };
      arrive(document.querySelector('${SUBMENU}'));
      arrive(item("Finder"));
      return { onCopyPath, back: document.querySelector('${SUBMENU}') !== null };
    })()`);
  /** Notes, by the page's clock, when the pointer next comes onto "Copy path" and when the submenu next closes, in `window.__close`. The pointer's arrival is read before the item reads it. */
  const timeTheClose = (): Promise<unknown> =>
    value(`void (() => {
      const times = (window.__close = {});
      const came = (event) => {
        if (event.target.getAttribute?.("role") !== "menuitem" || event.target.textContent !== "Copy path") return;
        times.came = performance.now();
        document.removeEventListener("pointerenter", came, true);
      };
      document.addEventListener("pointerenter", came, true);
      const closed = new MutationObserver((changes) => {
        if (!changes.some((change) => [...change.removedNodes].some((node) => node.getAttribute?.("aria-label") === "Open in"))) return;
        times.closed = performance.now();
        closed.disconnect();
      });
      closed.observe(document.body, { childList: true });
    })()`);
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

  /** A click on the item of the open menu that says `label`, which nothing of the window stands over: a press in its middle is the item's. */
  async function pressItem(label: string): Promise<void> {
    const item = `[...document.querySelectorAll('${MENU} [role="menuitem"]')].find((item) => item.textContent === ${JSON.stringify(label)})`;
    const at = await middleOf(item);
    expect(await value<string>(`(() => { const top = document.elementFromPoint(${at.x}, ${at.y}); return top === (${item}) ? "the item" : (top?.className || top?.id || top?.tagName || "nothing"); })()`), `what stands at the middle of the item ${label}`).toBe("the item");
    await app.cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...at, button: "left", clickCount: 1 });
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...at, button: "left", clickCount: 1 });
  }

  /** A key pressed and let go, with the Shift key held where `shift` says so. It types nothing. */
  async function press(code: string, virtualKey: number, shift = false): Promise<void> {
    const key = { code, key: code.startsWith("Key") ? code.slice(3).toLowerCase() : code === "Space" ? " " : code, windowsVirtualKeyCode: virtualKey, modifiers: shift ? 8 : 0 };
    await app.cdp("Input.dispatchKeyEvent", { type: "rawKeyDown", ...key });
    await app.cdp("Input.dispatchKeyEvent", { type: "keyUp", ...key });
  }
  const escape = (): Promise<void> => press("Escape", 27);

  /** Types a text over what a field holds, as a person who selected it all does. */
  async function typeOver(id: string, text: string): Promise<void> {
    await app.click(`#${id}`);
    await app.evaluate(`document.getElementById(${JSON.stringify(id)}).select()`);
    await app.cdp("Input.insertText", { text });
  }

  /** Waits until a dialog is open, and says what the window shows instead where it never is. */
  async function dialogOpen(id: string): Promise<void> {
    try {
      await app.until(`document.getElementById(${JSON.stringify(id)}).open`, `the dialog ${id}`);
    } catch (error) {
      throw new Error(`${(error as Error).message}; the open dialogs are ${await value<string>(`JSON.stringify([...document.querySelectorAll("dialog[open]")].map((dialog) => dialog.id))`)}, a menu is ${(await value<boolean>(`document.querySelector('${MENU}') !== null`)) ? "open" : "not open"}, and the status line says ${JSON.stringify(await value<string>(`document.getElementById("status").textContent`))}`);
    }
  }
  const dialogClosed = (id: string): Promise<void> => app.until(`!document.getElementById(${JSON.stringify(id)}).open`, `the dialog ${id} closed`);

  /** Opens a repository's menu from its "…" button, and presses the item that says `label`. */
  async function fromMenu(id: number, label: string): Promise<void> {
    await app.click(`${repository(id)} .repository-menu`);
    await menuShown();
    await pressItem(label);
    await menuGone();
  }

  /** Creates a work item through the form, with a pane of the shell kind, and waits for its view. */
  async function create(name: string, repo?: string): Promise<void> {
    await app.click("#new-work-item");
    await app.until(`document.getElementById("work-item-dialog").open`, 'the "New work item" form');
    if (repo !== undefined) {
      // Typed over the folder the form last held.
      await app.click("#work-item-repo");
      await app.evaluate(`document.getElementById("work-item-repo").select()`);
      await app.cdp("Input.insertText", { text: repo });
    }
    await app.click("#work-item-title");
    await app.cdp("Input.insertText", { text: name });
    await app.evaluate(`document.getElementById("work-item-kind").value = "shell"`);
    // Create creates nothing before the form shows the plan of its folder.
    await app.until(`document.getElementById("work-item-branch").textContent !== ""`, "the plan of the folder");
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
    second = temporaryRepository("second");
    third = temporaryRepository("third");
    fourth = temporaryRepository("fourth");
    kept = temporaryRepository("kept");
    lone = temporaryRepository("lone");
    aside = temporaryRepository("aside");
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
    second?.remove();
    third?.remove();
    fourth?.remove();
    kept?.remove();
    lone?.remove();
    aside?.remove();
  }, 30_000);

  it("opens a work item's menu at a press of the right button on its line in the sidebar, with its items in order and the keyboard on the first, moves through them with the arrows, and closes at Escape", async () => {
    expect(await order(SIDEBAR)).toEqual([1, 2]);
    await rightPress(line(SIDEBAR, 1));
    await menuShown();
    expect(await menuLabel()).toBe("Menu of First item");
    expect(await menuItems()).toEqual(items());
    // One item opens the folder's submenu, which is not in the page until it is opened.
    expect(await opener()).toEqual(["Open in", "menu", "false", true]);
    expect(await submenuStands()).toBe(false);
    expect(await itemInFocus()).toBe("Rename");
    await press("ArrowDown", 40);
    expect(await itemInFocus()).toBe("Open in");
    await press("ArrowUp", 38);
    await press("ArrowUp", 38);
    expect(await itemInFocus()).toBe("Rename");
    await escape();
    await menuGone();
    // The view of the second work item is still in front: the press opened no view.
    expect(await value<string>(`document.getElementById("view-title").textContent`)).toBe("Second item");
  });

  it("keeps the keyboard in the menu after a press inside it on no item, its rule, so the arrows still move from there and Escape still closes it", async () => {
    await rightPress(line(SIDEBAR, 1));
    await menuShown();
    const at = await middleOf(`document.querySelector('${MENU} [role="separator"]')`);
    await app.cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...at, button: "left", clickCount: 1 });
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...at, button: "left", clickCount: 1 });
    expect(await value<boolean>(`document.activeElement?.closest('${MENU}') != null`)).toBe(true);
    await press("ArrowDown", 40);
    expect(await itemInFocus()).toBe("Rename");
    await escape();
    await menuGone();
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
    // The sidebar draws its lines anew while the menu is open, as it does at each of the daemon's lists, and the keyboard returns to the line drawn in the old one's place.
    await press("F10", 121, true);
    await menuShown();
    await app.evaluate(`(() => { const field = document.getElementById("search-field"); field.value = "item"; field.dispatchEvent(new Event("input")); })()`);
    await app.until(`document.querySelector('${line(SIDEBAR, 1)} mark')`, "the sidebar drawn anew, with the search's marks");
    await escape();
    await menuGone();
    expect(await value<boolean>(`document.activeElement === document.querySelector('${line(SIDEBAR, 1)}')`)).toBe(true);
    await app.evaluate(`(() => { const field = document.getElementById("search-field"); field.value = ""; field.dispatchEvent(new Event("input")); })()`);
    await app.click("#search-field");
    await press("KeyM", 77);
    await press("F10", 121, true);
    expect(await value<number>(`document.querySelectorAll('${MENU}').length`)).toBe(0);
    await app.evaluate(`document.activeElement?.blur()`);
  });

  it("opens the Open in submenu at ArrowRight, at Enter and at Space with the keyboard on its item, lists Finder and then each installed app there with the keyboard on Finder, stops the arrows at each end, and at ArrowLeft and at Escape closes the submenu alone and returns the keyboard to its item", async () => {
    await app.evaluate(`document.querySelector('${line(SIDEBAR, 1)}').focus()`);
    await press("F10", 121, true);
    await menuShown();
    await press("ArrowDown", 40);
    expect(await itemInFocus()).toBe("Open in");
    await press("ArrowRight", 39);
    await submenuShown();
    expect(await submenuItems()).toEqual(openInItems());
    expect(await itemInFocus()).toBe("Finder");
    expect(await opener()).toEqual(["Open in", "menu", "true", true]);
    // The submenu is a second menu of the page, drawn after the first, and every item of it says on hover what its press does.
    expect(await value<(string | null)[]>(`[...document.querySelectorAll('${MENU}')].map((menu) => menu.getAttribute("aria-label"))`)).toEqual(["Menu of First item", "Open in"]);
    expect(await value<boolean>(`[...document.querySelectorAll('${SUBMENU} [role="menuitem"]')].every((item) => item.title.trim() !== "" && item.title !== item.textContent)`)).toBe(true);
    await press("ArrowUp", 38);
    expect(await itemInFocus()).toBe("Finder");
    const last = openInItems().at(-1);
    for (let at = 0; at < openInItems().length; at++) await press("ArrowDown", 40);
    expect(await itemInFocus()).toBe(last);
    await press("ArrowLeft", 37);
    await submenuGone();
    expect(await menuLabel()).toBe("Menu of First item");
    expect(await itemInFocus()).toBe("Open in");
    expect(await opener()).toEqual(["Open in", "menu", "false", true]);
    await press("Enter", 13);
    await submenuShown();
    expect(await itemInFocus()).toBe("Finder");
    await escape();
    await submenuGone();
    expect(await menuLabel()).toBe("Menu of First item");
    expect(await itemInFocus()).toBe("Open in");
    await press("Space", 32);
    await submenuShown();
    expect(await itemInFocus()).toBe("Finder");
    // The Tab key leaves the keyboard where it is.
    await press("Tab", 9);
    expect(await itemInFocus()).toBe("Finder");
    await press("ArrowLeft", 37);
    await submenuGone();
    // The keyboard on another item of the menu closes a submenu that is open, at once.
    await press("ArrowRight", 39);
    await submenuShown();
    await app.evaluate(`document.querySelector('${OPENER}').focus()`);
    expect(await submenuStands()).toBe(true);
    await press("ArrowDown", 40);
    expect(await itemInFocus()).toBe("Copy path");
    expect(await submenuStands()).toBe(false);
    await escape();
    await menuGone();
    expect(await value<boolean>(`document.activeElement === document.querySelector('${line(SIDEBAR, 1)}')`)).toBe(true);
    await app.evaluate(`document.activeElement?.blur()`);
  });

  it("opens the submenu when the pointer comes onto Open in, keeps it while the pointer is on an item of it or reaches one within the pause, closes it after the pause where the pointer rests on another item of the menu, keeps the menu and the submenu at a press of Open in and at a press inside the submenu on no item, and closes both at a press outside them", async () => {
    await app.click(`${repository(1)} .repository-menu`);
    await menuShown();
    expect(await submenuStands()).toBe(false);
    await pointerTo(await itemAt("Open in"));
    await submenuShown();
    expect(await submenuItems()).toEqual(openInItems());
    expect(await opener()).toEqual(["Open in", "menu", "true", true]);
    // The pointer opened it, and the keyboard stays where it was.
    expect(await itemInFocus()).toBe("Settings");
    await pointerTo(await itemAt("Finder"));
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(await submenuStands()).toBe(true);
    // On its way to a lower item of the submenu the pointer crosses the menu's next item, and the submenu waits for it.
    expect(await crossToCopyPathAndBack()).toEqual({ onCopyPath: true, back: true });
    await new Promise((resolve) => setTimeout(resolve, 500));
    expect(await submenuStands()).toBe(true);
    // Where the pointer rests on another item of the menu, the submenu closes once the pause has run out, as the page's own clock times it, which rounds to a part of a millisecond.
    await timeTheClose();
    await pointerTo(await itemAt("Copy path"));
    await submenuGone();
    expect(await value<number>(`window.__close.closed - window.__close.came`)).toBeGreaterThanOrEqual(SUBMENU_LEAVE_MS - 1);
    // The pause's own length, so a pause shortened where it is named fails here as well as one shortened where its timer starts.
    expect(SUBMENU_LEAVE_MS).toBe(300);
    expect(await menuLabel()).toBe("Menu of project");
    expect(await opener()).toEqual(["Open in", "menu", "false", true]);
    // The keyboard on another item closes the submenu under a pointer that rests on Open in. The pointer then comes onto nothing, and a press of Open in opens the submenu and closes nothing.
    await pointerTo(await itemAt("Open in"));
    await submenuShown();
    await press("ArrowDown", 40);
    expect(await itemInFocus()).toBe("Change icon");
    expect(await submenuStands()).toBe(false);
    await pressItem("Open in");
    await submenuShown();
    expect(await menuLabel()).toBe("Menu of project");
    // A press inside the submenu on no item, its edge, leaves both open with the keyboard on the submenu, where the arrows are still read.
    const edge = await value<{ x: number; y: number }>(`(() => { const box = document.querySelector('${SUBMENU}').getBoundingClientRect(); return { x: box.x + box.width / 2, y: box.y + 1 }; })()`);
    await app.cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...edge, button: "left", clickCount: 1 });
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...edge, button: "left", clickCount: 1 });
    expect(await value<boolean>(`document.activeElement === document.querySelector('${SUBMENU}')`)).toBe(true);
    expect(await value<number>(`document.querySelectorAll('${MENU}').length`)).toBe(2);
    await press("ArrowDown", 40);
    expect(await itemInFocus()).toBe("Finder");
    await app.click("#inbox-word");
    await menuGone();
  });

  it("closes the submenu and the menu at a press of the submenu's Finder item, and says in the status line that the folder is gone where the work item's folder was moved aside", async () => {
    const worktree = join(clone.root, "project", "first-item");
    const aside = `${worktree}.aside`;
    // Nothing stands at the path, so the main process answers before it reaches Finder, and nothing opens on the desktop.
    renameSync(worktree, aside);
    try {
      await rightPress(line(SIDEBAR, 1));
      await menuShown();
      await pointerTo(await itemAt("Open in"));
      await submenuShown();
      await pressItem("Finder");
      await menuGone();
      await app.until(`document.getElementById("status").textContent === ${JSON.stringify(`${worktree} is gone.`)}`, "the status line saying the folder is gone");
    } finally {
      renameSync(aside, worktree);
    }
    expect(existsSync(join(worktree, "README.md"))).toBe(true);
  });

  it("draws the submenu inside the window and to the left of the menu where the menu stands at the window's right edge", async () => {
    // A line of the inbox ends at the list's edge, far from the window's. The page is made narrower, so that a press near the line's right end is a press near the window's right edge, and the menu's own place is moved to that edge.
    const at = await value<{ x: number; y: number }>(`(() => { const box = document.querySelector('${line(INBOX, 2)}').getBoundingClientRect(); return { x: Math.round(box.right - 6), y: box.y + box.height / 2 }; })()`);
    const width = at.x + 100;
    await app.cdp("Emulation.setDeviceMetricsOverride", { width, height: 0, deviceScaleFactor: 0, mobile: false });
    try {
      await app.until(`window.innerWidth === ${width}`, "the narrower page");
      // The list keeps its width, so the line's right end stands where it stood.
      expect(await value<number>(`Math.round(document.querySelector('${line(INBOX, 2)}').getBoundingClientRect().right - 6)`)).toBe(at.x);
      await app.cdp("Input.dispatchMouseEvent", { type: "mousePressed", ...at, button: "right", clickCount: 1 });
      await app.cdp("Input.dispatchMouseEvent", { type: "mouseReleased", ...at, button: "right", clickCount: 1 });
      await menuShown();
      await press("ArrowDown", 40);
      await press("ArrowRight", 39);
      await submenuShown();
      const boxes = await value<{ menu: { left: number; right: number }; item: { top: number }; submenu: { left: number; right: number; top: number; bottom: number }; window: { width: number; height: number } }>(
        `(() => { const box = (selector) => { const { left, right, top, bottom } = document.querySelector(selector).getBoundingClientRect(); return { left, right, top, bottom }; }; return { menu: box('${MENU}'), item: box('${OPENER}'), submenu: box('${SUBMENU}'), window: { width: window.innerWidth, height: window.innerHeight } }; })()`,
      );
      // The case's premise: the menu stands at the window's right edge, so the submenu has no room at its right.
      expect(boxes.menu.right).toBeCloseTo(boxes.window.width, 0);
      expect(boxes.submenu.right).toBeCloseTo(boxes.menu.left, 0);
      expect(boxes.submenu.top).toBeCloseTo(boxes.item.top, 0);
      expect([boxes.submenu.left >= 0, boxes.submenu.right <= boxes.window.width, boxes.submenu.top >= 0, boxes.submenu.bottom <= boxes.window.height]).toEqual([true, true, true, true]);
      await escape();
      await escape();
      await menuGone();
    } finally {
      await app.cdp("Emulation.clearDeviceMetricsOverride");
    }
    await app.until(`window.innerWidth !== ${width}`, "the page at the window's width again");
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

  it("holds no button that adds a repository, and says on hover what the button at the sidebar's top and a repository's two buttons do, each named apart from what it says", async () => {
    expect(await value<boolean>(`document.getElementById("add-repository") === null`)).toBe(true);
    const said = (selector: string): Promise<(string | null)[]> => value(`(() => { const button = document.querySelector(${JSON.stringify(selector)}); return [button.getAttribute("aria-label"), button.title]; })()`);
    expect(await said("#new-work-item")).toEqual(["New work item", NEW_WORK_ITEM_SAYS]);
    const row = rowButtons("project");
    expect(await said(`${repository(1)} .repository-add`)).toEqual([row.add.name, row.add.says]);
    expect(await said(`${repository(1)} .repository-menu`)).toEqual([row.menu.name, row.menu.says]);
  });

  it("opens a repository's menu at a press of the right button on its row, at its … button and at the key M with the keyboard on the row, with its items in order, and returns the keyboard at Escape", async () => {
    await rightPress(`${repository(1)} .fold`);
    await menuShown();
    expect(await menuLabel()).toBe("Menu of project");
    expect(await menuItems()).toEqual(repositoryItems());
    expect(await opener()).toEqual(["Open in", "menu", "false", true]);
    expect(await submenuStands()).toBe(false);
    expect(await itemInFocus()).toBe("Settings");
    await escape();
    await menuGone();
    // The press of the right button folded nothing.
    expect(await value<string | null>(`document.querySelector('${repository(1)} .fold').getAttribute("aria-expanded")`)).toBe("true");
    await app.click(`${repository(1)} .repository-menu`);
    await menuShown();
    expect(await menuLabel()).toBe("Menu of project");
    expect(await menuItems()).toEqual(repositoryItems());
    await escape();
    await menuGone();
    expect(await value<boolean>(`document.activeElement === document.querySelector('${repository(1)} .repository-menu')`)).toBe(true);
    await app.evaluate(`document.querySelector('${repository(1)} .fold').focus()`);
    await press("KeyM", 77);
    await menuShown();
    expect(await menuLabel()).toBe("Menu of project");
    await escape();
    await menuGone();
    expect(await value<boolean>(`document.activeElement === document.querySelector('${repository(1)} .fold')`)).toBe(true);
  });

  it("gives every button that shows an icon or a mark alone, and every item of a work item's menu and of a repository's, a description on hover", async () => {
    // A button that holds a drawing or a mark, and no letter, says nothing of itself but through its title.
    const bare = await value<[string, string][]>(`[...document.querySelectorAll("button")].filter((button) => (button.querySelector("svg") || button.textContent.trim() !== "") && !/\\p{L}/u.test(button.textContent)).map((button) => [button.id || button.className, button.title])`);
    expect(bare.map(([name]) => name)).toEqual(expect.arrayContaining(["bell", "new-work-item", "icon-button repository-add", "icon-button repository-menu"]));
    expect(bare.filter(([, title]) => title.trim() === "")).toEqual([]);
    const titles = (): Promise<[string, string][]> => value(`[...document.querySelectorAll('${MENU} [role="menuitem"]')].map((item) => [item.textContent, item.title])`);
    await rightPress(line(SIDEBAR, 1));
    await menuShown();
    const ofWorkItem = await titles();
    await escape();
    await menuGone();
    await app.click(`${repository(1)} .repository-menu`);
    await menuShown();
    const ofRepository = await titles();
    await escape();
    await menuGone();
    expect([ofWorkItem.length, ofRepository.length]).toEqual([items().length, repositoryItems().length]);
    for (const [label, title] of [...ofWorkItem, ...ofRepository]) {
      expect(title.trim(), label).not.toBe("");
      expect(title, label).not.toBe(label);
    }
  });

  it("registers a repository alone through the form's choice: the name, the base and the kind are off, the button reads Register, a refusal is shown in the form, and the repository then stands in the sidebar with no work item, as git held it", async () => {
    const before = held(second.repo);
    await app.click("#new-work-item");
    await dialogOpen("work-item-dialog");
    const form = (): Promise<unknown[]> => value(`[document.getElementById("work-item-register-only").checked, document.getElementById("work-item-title").disabled, document.getElementById("work-item-base").disabled, document.getElementById("work-item-kind").disabled, document.getElementById("work-item-create").textContent]`);
    // The plan of the folder the form last held has arrived, so the menu of bases is on.
    await app.until(`document.getElementById("work-item-branch").textContent !== ""`, "the plan of the last folder");
    expect(await form()).toEqual([false, false, false, false, "Create"]);
    expect(await value<string>(`document.getElementById("work-item-register-only").closest("label").title`)).toBe(REGISTER_ONLY_SAYS);
    await app.click("#work-item-register-only");
    expect(await form()).toEqual([true, true, true, true, "Register"]);
    expect(await value<string[]>(`[document.getElementById("work-item-branch").textContent, document.getElementById("work-item-worktree").textContent]`)).toEqual(["", ""]);
    // A folder outside any repository is refused by the daemon, in the form.
    await typeOver("work-item-repo", clone.base);
    await app.click("#work-item-create");
    await says("work-item-error", `${clone.base} is not inside a git repository`);
    expect(await value<boolean>(`document.getElementById("work-item-dialog").open`)).toBe(true);
    await typeOver("work-item-repo", second.repo);
    // The plan of the folder typed arrives while the choice is taken, and the form shows none of it.
    await new Promise((resolve) => setTimeout(resolve, 600));
    expect(await value<string[]>(`[document.getElementById("work-item-branch").textContent, document.getElementById("work-item-worktree").textContent]`)).toEqual(["", ""]);
    expect(await form()).toEqual([true, true, true, true, "Register"]);
    await app.click("#work-item-create");
    await dialogClosed("work-item-dialog");
    await app.until(`document.querySelector('${repository(2)}')`, "the registered repository's row");
    // The repository holds no place for work records, so the dialog of the records place opens, and "Not now" writes nothing.
    await dialogOpen("records-dialog");
    expect(await value<string>(`document.getElementById("records-head").textContent`)).toBe("Records and check: second");
    await app.click("#records-cancel");
    await dialogClosed("records-dialog");
    expect(git(second.repo, "status", "--porcelain=v1", "--untracked-files=all")).toBe("");
    expect(await rowWords(2)).toEqual(["second", "0"]);
    expect(await value<number>(`document.querySelectorAll('${repository(2)} button[data-work-item]').length`)).toBe(0);
    expect(await order(SIDEBAR)).toEqual([1, 2]);
    // No work item, no branch and no worktree was made.
    expect(held(second.repo)).toEqual(before);
    expect(existsSync(join(clone.root, "second"))).toBe(false);
    // The choice is not taken at the next opening.
    await app.click("#new-work-item");
    await dialogOpen("work-item-dialog");
    expect((await form()).filter((_, at) => at !== 2)).toEqual([false, false, false, "Create"]);
    await app.click("#work-item-cancel");
    await dialogClosed("work-item-dialog");
  });

  it("opens the form at a repository's + button with that repository's folder in its field", async () => {
    // The form keeps the folder it last held, which is another one here.
    await app.evaluate(`document.getElementById("work-item-repo").value = "/elsewhere"`);
    await app.click(`${repository(1)} .repository-add`);
    await dialogOpen("work-item-dialog");
    expect(await value<string>(`document.getElementById("work-item-repo").value`)).toBe(clone.repo);
    await app.click("#work-item-cancel");
    await dialogClosed("work-item-dialog");
  });

  it("changes a repository's name on its row and the base of its new work items in the settings dialog, which then holds both", async () => {
    await fromMenu(2, "Settings");
    await dialogOpen("settings-dialog");
    expect(await value<string[]>(`[document.getElementById("settings-name").value, document.getElementById("settings-name").placeholder]`)).toEqual(["", "second"]);
    await app.until(`[...document.getElementById("settings-base").options].some((option) => option.value === "main")`, "the repository's bases in the settings");
    expect(await value<string[]>(`[...document.getElementById("settings-base").options].map((option) => option.textContent)`)).toEqual(["The repository's default branch", "main"]);
    expect(await value<string>(`document.getElementById("settings-base").value`)).toBe("");
    await typeOver("settings-name", "Docs site");
    await app.evaluate(`document.getElementById("settings-base").value = "main"`);
    await app.click("#settings-submit");
    await dialogClosed("settings-dialog");
    await app.until(`document.querySelector('${repository(2)} .fold .word').textContent === "Docs site"`, "the new name on the row");
    expect(await value<string>(`document.querySelector('${repository(2)} .repository-menu').getAttribute("aria-label")`)).toBe("Menu of Docs site");
    await fromMenu(2, "Settings");
    await dialogOpen("settings-dialog");
    await app.until(`document.getElementById("settings-base").options.length === 2`, "the repository's bases in the settings");
    expect(await value<string[]>(`[document.getElementById("settings-name").value, document.getElementById("settings-base").value]`)).toEqual(["Docs site", "main"]);
    await app.click("#settings-cancel");
    await dialogClosed("settings-dialog");
  });

  it("shows before a repository's name the one character its icon dialog takes, and refuses two there", async () => {
    await fromMenu(2, "Change icon");
    await dialogOpen("icon-dialog");
    await typeOver("icon-field", "ab");
    await app.click("#icon-submit");
    await says("icon-error", "An icon is one character.");
    expect(await value<boolean>(`document.getElementById("icon-dialog").open`)).toBe(true);
    await typeOver("icon-field", "\u{1F989}");
    await app.click("#icon-submit");
    await dialogClosed("icon-dialog");
    await app.until(`document.querySelector('${repository(2)} .repository-icon')`, "the icon on the row");
    expect(await rowWords(2)).toEqual(["\u{1F989}", "Docs site", "0"]);
    expect(await rowWords(1)).toEqual(["project", "2"]);
  });

  it("hides a repository from its menu: its row leaves the sidebar, a button under the repositories says one is hidden, and its dialog brings the row back", async () => {
    expect(await value<boolean>(`document.getElementById("hidden-repositories") === null`)).toBe(true);
    await fromMenu(2, "Hide from sidebar");
    await app.until(`!document.querySelector('${repository(2)}')`, "the hidden repository's row gone");
    expect(await value<string>(`document.getElementById("hidden-repositories").textContent`)).toBe("1 hidden repository");
    await app.click("#hidden-repositories");
    await dialogOpen("hidden-dialog");
    expect(await value<string[][]>(`[...document.querySelectorAll("#hidden-list li")].map((item) => [...item.children].map((part) => part.textContent))`)).toEqual([["Docs site", "Show"]]);
    await app.click("#hidden-list button");
    await app.until(`document.querySelector('${repository(2)}')`, "the row back in the sidebar");
    // No repository is hidden any more, so the dialog has nothing to list and the button nothing to say.
    await dialogClosed("hidden-dialog");
    expect(await value<boolean>(`document.getElementById("hidden-repositories") === null`)).toBe(true);
    expect(await rowWords(2)).toEqual(["\u{1F989}", "Docs site", "0"]);
  });

  it("archives a work item from its menu after a dialog that names the session the archive ends: its line leaves the sidebar and the inbox and nothing on disk changes; lists it on the screen that Show archived work items opens, under a head that names the repository, where a press of its line opens no view and its menu is an archived work item's; and brings it back at Restore", async () => {
    const before = held(clone.repo);
    const listed = (): Promise<string[]> => value(`[...document.querySelectorAll("#sessions-list li")].map((item) => item.textContent)`);
    const archive = async (): Promise<void> => {
      await rightPress(line(SIDEBAR, 2));
      await menuShown();
      await pressItem("Archive");
      await menuGone();
    };
    await archive();
    await dialogOpen("sessions-dialog");
    expect(await value<string>(`document.getElementById("sessions-head").textContent`)).toBe("Archive Third name");
    expect(await listed()).toEqual(["Shell"]);
    // The keyboard starts on the button that ends nothing.
    expect(await value<string>(`document.activeElement.id`)).toBe("sessions-cancel");
    await app.click("#sessions-cancel");
    await dialogClosed("sessions-dialog");
    expect(await order(SIDEBAR)).toEqual([1, 2]);
    await archive();
    await dialogOpen("sessions-dialog");
    await app.click("#sessions-submit");
    await dialogClosed("sessions-dialog");
    await app.until(`!document.querySelector('${line(SIDEBAR, 2)}')`, "the archived work item's line gone from the sidebar");
    expect(await order(SIDEBAR)).toEqual([1]);
    expect(await order(INBOX)).toEqual([1]);
    expect(await rowWords(1)).toEqual(["project", "1"]);
    expect(await value<string>(`document.getElementById("status").textContent`)).not.toContain("since you looked");
    // The archive changed nothing on disk: the branch and the worktree's folder stand.
    expect(held(clone.repo)).toEqual(before);
    expect(existsSync(join(clone.root, "project", "second-item", "README.md"))).toBe(true);

    await fromMenu(1, "Show archived work items");
    await app.until(`!document.getElementById("archived-screen").hidden`, "the screen of the archived work items");
    expect(await value<boolean>(`document.getElementById("inbox-screen").hidden`)).toBe(true);
    expect(await value<string>(`document.getElementById("archived-word").textContent`)).toBe("Archived in project");
    expect(await order(ARCHIVED)).toEqual([2]);
    expect(await title(ARCHIVED, 2)).toBe("Third name");
    // A press of the line selects it and opens no view.
    await app.click(line(ARCHIVED, 2));
    expect(await value<boolean[]>(`[document.getElementById("archived-screen").hidden, document.getElementById("work-item-view").hidden]`)).toEqual([false, true]);
    expect(await value<string[]>(`[document.getElementById("archived-preview-title").textContent, document.getElementById("archived-open-work-item").textContent]`)).toEqual(["Third name", "Restore"]);
    await rightPress(line(ARCHIVED, 2));
    await menuShown();
    expect(await menuLabel()).toBe("Menu of Third name");
    expect(await menuItems()).toEqual(archivedItems());
    expect(await opener()).toEqual(["Open in", "menu", "false", true]);
    expect(await submenuStands()).toBe(false);
    expect(await value<boolean>(`[...document.querySelectorAll('${MENU} [role="menuitem"]')].every((item) => item.title.trim() !== "" && item.title !== item.textContent)`)).toBe(true);
    await escape();
    await menuGone();
    await app.click("#archived-open-work-item");
    await app.until(`document.querySelector('${line(SIDEBAR, 2)}')`, "the restored work item's line in the sidebar");
    expect(await order(SIDEBAR)).toEqual([1, 2]);
    expect(await order(ARCHIVED)).toEqual([]);
    expect(await value<string>(`document.getElementById("archived-empty").textContent`)).toBe("No work item of this repository is archived.");
  });

  it("archives a work item none of whose sessions runs at the menu's press, with no dialog, opens the menu of an archived line at the key M, and restores the work item from that menu", async () => {
    // The archive before ended the work item's one pane, and the screen of the archived work items is still in front.
    await rightPress(line(SIDEBAR, 2));
    await menuShown();
    await pressItem("Archive");
    await menuGone();
    await app.until(`document.querySelector('${line(ARCHIVED, 2)}')`, "the archived work item's line on the archived screen");
    expect(await value<boolean>(`document.getElementById("sessions-dialog").open`)).toBe(false);
    expect(await order(SIDEBAR)).toEqual([1]);
    await app.evaluate(`document.activeElement?.blur()`);
    await press("KeyM", 77);
    await menuShown();
    expect(await menuLabel()).toBe("Menu of Third name");
    await pressItem("Restore");
    await menuGone();
    await app.until(`document.querySelector('${line(SIDEBAR, 2)}')`, "the restored work item's line in the sidebar");
    expect(await order(ARCHIVED)).toEqual([]);
    // The inbox lists it again.
    await app.click("#nav-inbox");
    await app.until(`!document.getElementById("inbox-screen").hidden`, "the inbox");
    expect(await value<boolean>(`document.getElementById("archived-screen").hidden`)).toBe(true);
    expect(await order(INBOX)).toEqual([1, 2]);
  });

  /** What a dialog names of a loss under an element: each heading with the rows under it, each row by its parts, a commit's hash and subject or a path. */
  const lossIn = (id: string): Promise<[string, string[][]][]> => value(`[...document.querySelectorAll("#${id} section")].map((section) => [section.querySelector("h3").textContent, [...section.querySelectorAll("li")].map((item) => [...item.children].map((part) => part.textContent))])`);
  /** What a token resolves to in the delete dialog, read off a part that takes it for a property, as the browser computes the property. */
  const RESOLVED = `((property, token) => { const probe = document.createElement("span"); probe.style.setProperty(property, "var(" + token + ")"); document.getElementById("delete-dialog").append(probe); const got = getComputedStyle(probe).getPropertyValue(property); probe.remove(); return got; })`;

  it("names in the delete dialog the branch, the folder, the commit no other branch holds by its hash and its subject apart, the untracked file and the ignored file, each under a heading that counts them, on rows of one height, and the session the delete ends, with its lead in the ink of what is read and Delete off until Force delete is checked; shows a refusal there and reads the loss again; and after Delete the line is gone from the sidebar and from the inbox, and the clone holds no such branch and no such folder", async () => {
    await create("Doomed");
    const worktree = join(clone.root, "project", "doomed");
    // Ignored by the clone's own list, so no commit of the branch holds the rule.
    appendFileSync(join(clone.repo, ".git", "info", "exclude"), ".env\n");
    const commit = git(clone.repo, "rev-parse", "--short", commitFile(worktree, "work.txt")).trim();
    writeFileSync(join(worktree, "notes.txt"), "kept by no commit\n");
    writeFileSync(join(worktree, ".env"), "SECRET=1\n");
    await rightPress(line(SIDEBAR, 3));
    await menuShown();
    expect(await menuItems()).toEqual(items());
    await pressItem("Delete");
    await menuGone();
    await dialogOpen("delete-dialog");
    expect(await value<string>(`document.getElementById("delete-head").textContent`)).toBe("Delete Doomed");
    // The keyboard starts on the button that deletes nothing.
    expect(await value<string>(`document.activeElement.id`)).toBe("delete-cancel");
    await app.until(`document.querySelector("#delete-loss section")`, "the loss in the delete dialog");
    const named: [string, string[][]][] = [
      ["The branch and the folder removed from disk", [["owlery/doomed"], [worktree]]],
      ["1 commit no other branch, no remote and no tag holds", [[commit, "add work.txt"]]],
      ["1 untracked file", [["notes.txt"]]],
      ["1 ignored file or folder, which goes with the folder", [[".env"]]],
    ];
    expect(await lossIn("delete-loss")).toEqual(named);
    // The hash in the fixed-width face and the muted ink, the subject on one line cut with an ellipsis, a path in the fixed-width face, and each row's tooltip with the whole text.
    expect(
      await value(`(() => {
        const resolved = ${RESOLVED};
        const commit = document.querySelector("#delete-loss li:has(.hash)");
        const hash = getComputedStyle(commit.querySelector(".hash"));
        const subject = getComputedStyle(commit.querySelector(".subject"));
        const path = document.querySelector("#delete-loss li .path");
        return {
          hash: [hash.fontFamily === resolved("font-family", "--font-mono"), hash.color === resolved("color", "--ink-muted"), hash.fontSize === resolved("font-size", "--size-caption")],
          subject: [subject.whiteSpace, subject.textOverflow, subject.overflow, subject.color === resolved("color", "--ink"), subject.fontSize === resolved("font-size", "--size-second")],
          path: [getComputedStyle(path).fontFamily === resolved("font-family", "--font-mono"), getComputedStyle(path).whiteSpace, getComputedStyle(path).textOverflow, getComputedStyle(path).color === resolved("color", "--ink"), getComputedStyle(path).fontSize === resolved("font-size", "--size-caption")],
          titles: [...document.querySelectorAll("#delete-loss li")].map((item) => item.title),
        };
      })()`),
    ).toEqual({ hash: [true, true, true], subject: ["nowrap", "ellipsis", "hidden", true, true], path: [true, "nowrap", "ellipsis", true, true], titles: ["owlery/doomed", worktree, "add work.txt", "notes.txt", ".env"] });
    // Every row of every list is one line of one height, whether its text is cut or not.
    expect(await value<number[]>(`[...new Set([...document.querySelectorAll("#delete-loss li")].map((item) => item.offsetHeight))]`)).toEqual([Number.parseFloat(await value<string>(`${RESOLVED}("min-height", "--detail-line")`))]);
    expect(await value<string[]>(`[...document.querySelectorAll("#delete-sessions li")].map((item) => item.textContent)`)).toEqual(["Shell"]);
    expect(await value<string[]>(`[document.getElementById("delete-says").textContent, document.getElementById("delete-remote").textContent]`)).toEqual(["A delete would lose the work named below. It runs only with Force delete checked.", "Nothing on a remote is removed."]);
    // The first sentence is the dialog's lead, in the ink of what is read, and the sentence on the remote stays a muted note.
    expect(await value<boolean[]>(`(() => { const resolved = ${RESOLVED}; const lead = getComputedStyle(document.getElementById("delete-says")); return [lead.color === resolved("color", "--ink"), lead.fontSize === resolved("font-size", "--size-text"), getComputedStyle(document.getElementById("delete-remote")).color === resolved("color", "--ink-muted")]; })()`)).toEqual([true, true, true]);
    const controls = (): Promise<boolean[]> => value(`[document.getElementById("delete-force-label").hidden, document.getElementById("delete-force").checked, document.getElementById("delete-submit").disabled]`);
    expect(await controls()).toEqual([false, false, true]);
    await app.click("#delete-force");
    expect(await controls()).toEqual([false, true, false]);
    // A file that arrives after the dialog was drawn is one the person has not read: the delete is refused, and the dialog reads the loss again.
    writeFileSync(join(worktree, "later.txt"), "arrived since\n");
    await app.click("#delete-submit");
    await says("delete-error", "What the delete would remove has changed. Read it again.");
    await app.until(`[...document.querySelectorAll("#delete-loss li")].some((item) => item.textContent === "later.txt")`, "the loss read again, with the new file");
    expect((await lossIn("delete-loss"))[2]).toEqual(["2 untracked files", [["later.txt"], ["notes.txt"]]]);
    expect(await controls()).toEqual([false, false, true]);
    expect([existsSync(join(worktree, "notes.txt")), git(clone.repo, "branch", "--list", "owlery/doomed").trim()]).toEqual([true, "+ owlery/doomed"]);
    await app.click("#delete-force");
    await app.click("#delete-submit");
    await dialogClosed("delete-dialog");
    await app.until(`!document.querySelector('${line(SIDEBAR, 3)}')`, "the deleted work item's line gone from the sidebar");
    expect(await order(SIDEBAR)).toEqual([1, 2]);
    await app.click("#nav-inbox");
    await app.until(`!document.getElementById("inbox-screen").hidden`, "the inbox");
    expect(await order(INBOX)).toEqual([1, 2]);
    expect(await value<string>(`document.getElementById("status").textContent`)).not.toContain("since you looked");
    expect([existsSync(worktree), git(clone.repo, "branch", "--list", "owlery/doomed"), existsSync(join(clone.repo, "README.md"))]).toEqual([false, "", true]);
  });

  it("shows in the delete dialog a list of more commits than ten rows as ten whole rows, counts every commit in its heading, keeps a row one line high where its subject or its path is longer than the dialog, and comes to rest on whole rows after a turn of the wheel", async () => {
    await create("Long list");
    const id = await value<number>(`Number([...document.querySelectorAll('${SIDEBAR} button[data-work-item]')].find((button) => button.querySelector(".title").textContent === "Long list").dataset.workItem)`);
    const worktree = join(clone.root, "project", "long-list");
    for (let n = 1; n <= 11; n += 1) commitFile(worktree, `file-${n}.txt`);
    const long = "change a subject much longer than one row of the dialog holds, so that the row cuts it at its edge";
    writeFileSync(join(worktree, "long.txt"), "long\n");
    git(worktree, "add", "long.txt");
    git(worktree, "commit", "--quiet", "-m", long);
    const deep = join("a-folder-whose-name-is-long", "and-another-folder-under-it", "and-a-file-whose-name-is-longer-still.txt");
    mkdirSync(join(worktree, dirname(deep)), { recursive: true });
    writeFileSync(join(worktree, deep), "untracked\n");
    await rightPress(line(SIDEBAR, id));
    await menuShown();
    await pressItem("Delete");
    await menuGone();
    await dialogOpen("delete-dialog");
    const COMMITS = `[...document.querySelectorAll("#delete-loss section")].find((section) => section.querySelector("h3").textContent === "12 commits no other branch, no remote and no tag holds").querySelector("ul")`;
    await app.until(`[...document.querySelectorAll("#delete-loss h3")].some((head) => head.textContent === "12 commits no other branch, no remote and no tag holds")`, "the heading that counts the twelve commits");
    const row = Number.parseFloat(await value<string>(`${RESOLVED}("min-height", "--detail-line")`));
    // Ten rows of the twelve show, whole, and every row of every list is of one height.
    expect(await value<number[]>(`(() => { const list = ${COMMITS}; return [list.children.length, list.clientHeight, list.scrollHeight]; })()`)).toEqual([12, 10 * row, 12 * row]);
    expect(await value<number[]>(`[...new Set([...document.querySelectorAll("#delete-loss li")].map((item) => item.offsetHeight))]`)).toEqual([row]);
    // Every subject starts at one place past the widest hash.
    expect(await value<[number, boolean]>(`(() => { const list = ${COMMITS}; const starts = new Set([...list.querySelectorAll(".subject")].map((words) => words.getBoundingClientRect().left)); const widest = Math.max(...[...list.querySelectorAll(".hash")].map((hash) => hash.getBoundingClientRect().right)); return [starts.size, [...starts][0] > widest]; })()`)).toEqual([1, true]);
    // The hashes stand in one column of the list: a hash longer than the others widens it for every row, so every subject still starts at one place past the widest hash. Git gives every hash of the case's clone seven characters, so the longer hash is written into the drawn row.
    expect(await value<[number, boolean]>(`(() => { const list = ${COMMITS}; list.querySelector(".hash").textContent = "0123456789abcdef"; const starts = new Set([...list.querySelectorAll(".subject")].map((words) => words.getBoundingClientRect().left)); const widest = Math.max(...[...list.querySelectorAll(".hash")].map((hash) => hash.getBoundingClientRect().right)); return [starts.size, [...starts][0] > widest]; })()`)).toEqual([1, true]);
    // The long subject and the long path are cut at the row's edge, and each row's tooltip holds the whole text.
    const cut = (text: string, part: string): Promise<[boolean, string]> => value(`(() => { const item = [...document.querySelectorAll("#delete-loss li")].find((item) => item.title === ${JSON.stringify(text)}); const words = item.querySelector(${JSON.stringify(part)}); return [words.scrollWidth > words.clientWidth, words.textContent]; })()`);
    expect(await cut(long, ".subject")).toEqual([true, long]);
    expect(await cut(deep, ".path")).toEqual([true, deep]);
    // A turn of the wheel, as a person scrolls, comes to rest with no row cut at the list's top or its foot.
    await value(`void (() => { const list = ${COMMITS}; window.__rested = null; list.addEventListener("scrollend", () => { window.__rested = list.scrollTop; }); })()`);
    await app.cdp("Input.dispatchMouseEvent", { type: "mouseWheel", ...(await middleOf(COMMITS)), deltaX: 0, deltaY: 37 });
    await app.until(`window.__rested !== null`, "the commits' list at rest after the wheel");
    const rested = await value<number>(`window.__rested`);
    expect([rested > 0, rested % row]).toEqual([true, 0]);
    await app.click("#delete-cancel");
    await dialogClosed("delete-dialog");
    // The work item leaves as the delete before left, so the cases after this one meet the lists they met before it.
    await rightPress(line(SIDEBAR, id));
    await menuShown();
    await pressItem("Delete");
    await menuGone();
    await dialogOpen("delete-dialog");
    await app.until(`!document.getElementById("delete-force-label").hidden`, "the choice to force the delete");
    await app.click("#delete-force");
    await app.click("#delete-submit");
    await dialogClosed("delete-dialog");
    await app.until(`!document.querySelector('${line(SIDEBAR, id)}')`, "the deleted work item's line gone from the sidebar");
    expect(await order(SIDEBAR)).toEqual([1, 2]);
  });

  it("makes a group at New group on a repository's menu, in a dialog that shows the refusal of an empty name: the group's heading stands under the repository's ungrouped work items, Move to on a work item's menu puts its line under the heading, and Move out of puts it back, and the inbox shows no group", async () => {
    const headings = (): Promise<string[][]> => value(`[...document.querySelectorAll('${repository(1)} .group-head')].map((head) => [...head.children].map((part) => part.textContent))`);
    const under = (group: number): Promise<number[]> => order(`${repository(1)} ul[data-group="${group}"]`);
    const ungrouped = (): Promise<number[]> => order(`${repository(1)} ul:not([data-group])`);
    /** The description on hover of the item of the open menu that says `label`. */
    const said = (label: string): Promise<string> => value(`[...document.querySelectorAll('${MENU} [role="menuitem"]')].find((item) => item.textContent === ${JSON.stringify(label)}).title`);
    await fromMenu(1, "New group");
    await dialogOpen("group-dialog");
    expect(await value<string[]>(`[document.getElementById("group-head").textContent, document.activeElement.id, document.getElementById("group-name").value]`)).toEqual(["New group in project", "group-name", ""]);
    await app.click("#group-submit");
    await says("group-error", "Give the group a name.");
    expect(await value<boolean>(`document.getElementById("group-dialog").open`)).toBe(true);
    expect(await headings()).toEqual([]);
    await typeOver("group-name", "Later");
    await app.click("#group-submit");
    await dialogClosed("group-dialog");
    await app.until(`document.querySelector('${repository(1)} .group-head')`, "the group's heading under the repository");
    // A group with no work item is listed, after the ungrouped work items.
    expect(await headings()).toEqual([["Later", "0"]]);
    expect([await ungrouped(), await under(1), await order(SIDEBAR)]).toEqual([[1, 2], [], [1, 2]]);
    expect(await value<boolean>(`document.querySelector('${repository(1)} ul:not([data-group])').compareDocumentPosition(document.querySelector('${repository(1)} .group-head')) === Node.DOCUMENT_POSITION_FOLLOWING`)).toBe(true);
    // The heading stands right above its group's list, and a folded repository shows neither.
    const drawn = (): Promise<unknown[]> => value(`(() => { const head = document.querySelector('${repository(1)} .group-head'); return [head.nextElementSibling.dataset.group, getComputedStyle(head).display === "none", getComputedStyle(head.nextElementSibling).display === "none"]; })()`);
    expect(await drawn()).toEqual(["1", false, false]);
    await app.click(`${repository(1)} .fold`);
    expect(await drawn()).toEqual(["1", true, true]);
    await app.click(`${repository(1)} .fold`);
    expect(await drawn()).toEqual(["1", false, false]);
    // The dialog holds no name of the opening before.
    await fromMenu(1, "New group");
    await dialogOpen("group-dialog");
    expect(await value<string[]>(`[document.getElementById("group-name").value, document.getElementById("group-error").textContent]`)).toEqual(["", ""]);
    await app.click("#group-cancel");
    await dialogClosed("group-dialog");

    await rightPress(line(SIDEBAR, 1));
    await menuShown();
    expect(await menuItems()).toEqual(items("Pin", "Unmute notifications", ["Move to Later"]));
    const moveSays = await said("Move to Later");
    expect([moveSays.trim() === "", moveSays === "Move to Later"]).toEqual([false, false]);
    await pressItem("Move to Later");
    await menuGone();
    await app.until(`document.querySelector('${repository(1)} ul[data-group="1"] button[data-work-item="1"]')`, "the work item's line under the group's heading");
    expect([await ungrouped(), await under(1), await order(SIDEBAR)]).toEqual([[2], [1], [2, 1]]);
    expect(await headings()).toEqual([["Later", "1"]]);
    // The repository's row counts the work items in its groups too, and the inbox shows no group.
    expect(await rowWords(1)).toEqual(["project", "2"]);
    expect([await order(INBOX), await value<number>(`document.querySelectorAll("#inbox-screen .group-head").length`)]).toEqual([[1, 2], 0]);

    await rightPress(line(SIDEBAR, 1));
    await menuShown();
    expect(await menuItems()).toEqual(items("Pin", "Unmute notifications", ["Move out of Later"]));
    const outSays = await said("Move out of Later");
    expect([outSays.trim() === "", outSays === "Move out of Later"]).toEqual([false, false]);
    await pressItem("Move out of Later");
    await menuGone();
    await app.until(`document.querySelector('${repository(1)} ul:not([data-group]) button[data-work-item="1"]')`, "the work item's line among the ungrouped again");
    expect([await ungrouped(), await under(1), await headings()]).toEqual([[1, 2], [], [["Later", "0"]]]);
  });

  it("deletes a repository's work items from disk at its removal where the dialog's choice is taken: it names each work item's loss under it, turns the Trash's choice on, and after Remove the branch and the worktree are gone and the repository's folder stands", async () => {
    await create("In third", third.repo);
    const worktree = join(clone.root, "third", "in-third");
    expect(existsSync(join(worktree, "README.md"))).toBe(true);
    await fromMenu(3, "Remove");
    await dialogOpen("remove-dialog");
    const choices = (): Promise<boolean[]> => value(`[document.getElementById("remove-delete-label").hidden, document.getElementById("remove-delete").checked, document.getElementById("remove-trash").disabled, document.getElementById("remove-trash").checked, document.getElementById("remove-force-label").hidden, document.getElementById("remove-submit").disabled]`);
    // Both choices are open, and the Trash's cannot be taken while the work item keeps its worktree.
    expect(await choices()).toEqual([false, false, true, false, true, false]);
    expect(await value<boolean>(`document.getElementById("remove-losses").hidden`)).toBe(true);
    await app.click("#remove-delete");
    await app.until(`document.querySelector("#remove-losses section")`, "the work item's loss in the removal's dialog");
    expect(await value<string[]>(`[...document.querySelectorAll("#remove-losses h3.work-item")].map((head) => head.textContent)`)).toEqual(["In third"]);
    expect(await lossIn("remove-losses")).toEqual([["The branch and the folder removed from disk", [["owlery/in-third"], [worktree]]]]);
    // The removal's dialog draws each loss in the delete dialog's form: paths on rows of one line, in a list of its own.
    expect(await value<[string, string, string][]>(`[...document.querySelectorAll("#remove-losses li")].map((item) => [item.parentElement.className, item.title, getComputedStyle(item.firstElementChild).whiteSpace])`)).toEqual([
      ["loss", "owlery/in-third", "nowrap"],
      ["loss", worktree, "nowrap"],
    ]);
    expect(await choices()).toEqual([false, true, false, false, true, false]);
    // A choice that is not offered is not drawn either.
    expect(await value<string[]>(`["remove-force-label", "remove-delete-label"].map((id) => getComputedStyle(document.getElementById(id)).display)`)).toEqual(["none", "flex"]);
    expect(await value<string>(`document.getElementById("remove-says").textContent`)).toBe("Owlery will no longer list the repository or its work items. Each work item's worktree and local branch are deleted, as named below. The repository's folder stays, and nothing on a remote is removed.");
    expect(await value<string[]>(`[...document.querySelectorAll("#remove-sessions li")].map((item) => item.textContent)`)).toEqual(["Shell in In third"]);
    await app.click("#remove-submit");
    await dialogClosed("remove-dialog");
    await app.until(`!document.querySelector('${repository(3)}')`, "the removed repository's row gone");
    expect(await value<string>(`document.getElementById("status").textContent`)).not.toContain("Read it again");
    expect([existsSync(worktree), git(third.repo, "branch", "--list", "owlery/*"), git(third.repo, "worktree", "list", "--porcelain").split("\n\n").filter((block) => block.trim() !== "").length]).toEqual([false, "", 1]);
    // The Trash's choice was not taken, and the repository's folder stands as it was.
    expect([readFileSync(join(third.repo, "README.md"), "utf8"), git(third.repo, "status", "--porcelain")]).toEqual(["a repository\n", ""]);
  });

  it("keeps in the removal's dialog the refusal of a removal that deleted one work item and stopped at the next, after the losses are read again: the dialog then names the work item that is left, with what its delete would lose, and Remove with Force delete checked deletes it", async () => {
    await create("A item", fourth.repo);
    await create("B item");
    const [first, second] = [join(clone.root, "fourth", "a-item"), join(clone.root, "fourth", "b-item")];
    await fromMenu(4, "Remove");
    await dialogOpen("remove-dialog");
    const named = (): Promise<string[]> => value(`[...document.querySelectorAll("#remove-losses h3.work-item")].map((head) => head.textContent)`);
    const controls = (): Promise<boolean[]> => value(`[document.getElementById("remove-force-label").hidden, document.getElementById("remove-force").checked, document.getElementById("remove-submit").disabled]`);
    await app.click("#remove-delete");
    await app.until(`document.querySelectorAll("#remove-losses section").length === 2`, "both work items' losses in the removal's dialog");
    expect(await named()).toEqual(["A item", "B item"]);
    expect(await controls()).toEqual([true, false, false]);
    // A file that arrives in the second worktree after the dialog named both losses: the first delete runs, and the second is refused.
    writeFileSync(join(second, "arrived.txt"), "arrived since\n");
    await app.click("#remove-submit");
    await app.until(`[...document.querySelectorAll("#remove-losses li")].some((item) => item.textContent === "arrived.txt")`, "the loss of the work item that is left read again, with the new file");
    // The read of the work item the removal deleted is answered "no work item", which is not what the dialog says.
    expect(await value<string>(`document.getElementById("remove-error").textContent`)).toBe("B item: What the delete would remove has changed. Read it again.");
    expect(await named()).toEqual(["B item"]);
    expect(await value<string[]>(`[...document.querySelectorAll("#remove-work-items li")].map((item) => item.textContent)`)).toEqual(["B item"]);
    expect(await value<boolean>(`document.getElementById("remove-dialog").open`)).toBe(true);
    // The work item deleted before the refusal stays deleted, and the one refused stands.
    expect([existsSync(first), existsSync(join(second, "arrived.txt")), git(fourth.repo, "branch", "--list", "owlery/*").trim()]).toEqual([false, true, "+ owlery/b-item"]);
    // What is left would lose a file, so Remove waits for Force delete.
    expect(await controls()).toEqual([false, false, true]);
    await app.click("#remove-force");
    expect(await controls()).toEqual([false, true, false]);
    await app.click("#remove-submit");
    await dialogClosed("remove-dialog");
    await app.until(`!document.querySelector('${repository(4)}')`, "the removed repository's row gone");
    expect([existsSync(second), git(fourth.repo, "branch", "--list", "owlery/*"), existsSync(join(fourth.repo, "README.md"))]).toEqual([false, "", true]);
  });

  it("removes a repository with no work item from its menu, after a dialog that says nothing on disk is removed, and leaves the repository as git held it", async () => {
    const before = [held(second.repo), readFileSync(join(second.repo, "README.md"), "utf8")];
    await fromMenu(2, "Remove");
    await dialogOpen("remove-dialog");
    expect(await value<string>(`document.getElementById("remove-head").textContent`)).toBe("Remove Docs site from Owlery");
    expect(await value<string>(`document.getElementById("remove-says").textContent`)).toContain("Nothing on disk is removed");
    expect(await value<boolean[]>(`[document.getElementById("remove-work-items").hidden, document.getElementById("remove-sessions").hidden]`)).toEqual([true, true]);
    // It holds no work item to delete, and its folder can go to the Trash, which nothing here chooses.
    expect(await value<boolean[]>(`[document.getElementById("remove-delete-label").hidden, document.getElementById("remove-trash").disabled, document.getElementById("remove-trash").checked]`)).toEqual([true, false, false]);
    // The keyboard starts on the button that removes nothing.
    expect(await value<string>(`document.activeElement.id`)).toBe("remove-cancel");
    await app.click("#remove-cancel");
    await dialogClosed("remove-dialog");
    expect(await value<boolean>(`document.querySelector('${repository(2)}') !== null`)).toBe(true);
    await fromMenu(2, "Remove");
    await dialogOpen("remove-dialog");
    await app.click("#remove-submit");
    await dialogClosed("remove-dialog");
    await app.until(`!document.querySelector('${repository(2)}')`, "the removed repository's row gone");
    expect(await value<boolean>(`document.getElementById("hidden-repositories") === null`)).toBe(true);
    expect([held(second.repo), readFileSync(join(second.repo, "README.md"), "utf8")]).toEqual(before);
  });

  it("names in the removal's dialog each work item of the repository and each running session, ends those sessions at Remove, and leaves every worktree's folder and every branch on disk", async () => {
    const before = held(clone.repo);
    await fromMenu(1, "Remove");
    await dialogOpen("remove-dialog");
    const listed = (id: string): Promise<string[]> => value(`[...document.querySelectorAll("#${id} li")].map((item) => item.textContent)`);
    expect(await listed("remove-work-items")).toEqual(["Renamed here", "Third name"]);
    // The pane of the second work item ended at its archive, and is no running session after the restore.
    expect(await listed("remove-sessions")).toEqual(["Shell in Renamed here"]);
    // The choice to delete is taken and taken back: the Trash's choice goes off with it, and the removal that follows deletes nothing.
    await app.click("#remove-delete");
    await app.until(`document.querySelectorAll("#remove-losses h3.work-item").length === 2 && !document.getElementById("remove-trash").disabled`, "both work items' losses, and the Trash's choice on");
    await app.click("#remove-delete");
    expect(await value<boolean[]>(`[document.getElementById("remove-delete").checked, document.getElementById("remove-trash").disabled, document.getElementById("remove-trash").checked, document.getElementById("remove-losses").hidden]`)).toEqual([false, true, false, true]);
    expect(await value<string>(`document.getElementById("remove-says").textContent`)).toContain("Nothing on disk is removed");
    await app.click("#remove-submit");
    await dialogClosed("remove-dialog");
    await app.until(`document.querySelectorAll('${SIDEBAR} section').length === 0`, "no repository in the sidebar");
    expect(await order(SIDEBAR)).toEqual([]);
    expect(await order(INBOX)).toEqual([]);
    expect(await value<string>(`document.getElementById("status").textContent`)).not.toContain("since you looked");
    expect(held(clone.repo)).toEqual(before);
    expect([existsSync(join(clone.root, "project", "first-item", "README.md")), existsSync(join(clone.root, "project", "second-item", "README.md"))]).toEqual([true, true]);
  });

  it("says in the sidebar, after a delete of the one work item a search and a chosen state leave, what left no repository and how many repositories it does not list, keeps the filter's mark on, and at Show every work item lists them all again with the filter at All, the search field empty, the mark off and the keyboard on the first repository's row", async () => {
    await create("Kept elsewhere", kept.repo);
    await create("Filtered away", lone.repo);
    await create("Set aside", aside.repo);
    const asideId = await value<number>(`Number(document.querySelector('${SIDEBAR} button.fold[data-repo=${JSON.stringify(aside.repo)}]').closest("section").dataset.repository)`);
    await fromMenu(asideId, "Hide from sidebar");
    await app.until(`!document.querySelector('${repository(asideId)}') && document.getElementById("hidden-repositories")`, "the third repository hidden, and the button that says so");
    const rows =(): Promise<number> => value(`document.querySelectorAll('${SIDEBAR} section.repository').length`);
    // The rows the sidebar lists before anything narrows it, which the sentence counts. Earlier cases remove repositories, and the case may run alone, so it counts them.
    const listed = await rows();
    expect(listed).toBeGreaterThan(1);
    // Whether the filter's control is on, what it says to a pointer, and whether it stands inside the edge: on is a shape as well as an ink.
    const mark = (): Promise<[boolean, string, boolean]> =>
      value(`(() => { const control = document.getElementById("sidebar-filter-control"); return [control.classList.contains("on"), control.title, getComputedStyle(control).boxShadow === ${RESOLVED}("box-shadow", "--on-edge")]; })()`);
    expect(await mark()).toEqual([false, "Showing: All", false]);
    // The inbox is the list in front, which the search and the filter narrow with the sidebar.
    await app.click("#nav-inbox");
    await app.until(`!document.getElementById("inbox-screen").hidden`, "the inbox");
    const lines = (await order(INBOX)).length;
    await typeOver("search-field", "Filtered away");
    // The state is chosen as a person's choice arrives at the select.
    await value(`void (() => { const filter = document.getElementById("sidebar-filter"); filter.value = "none"; filter.dispatchEvent(new Event("change")); })()`);
    await app.until(`document.querySelectorAll('${SIDEBAR} section.repository').length === 1`, "one repository under the search and the state");
    expect(await mark()).toEqual([true, 'Showing: Asleep, matching "Filtered away"', true]);
    const loneId = await value<number>(`Number(document.querySelector('${SIDEBAR} section.repository').dataset.repository)`);
    const workItem = await value<number>(`Number(document.querySelector('${SIDEBAR} button[data-work-item]').dataset.workItem)`);
    await rightPress(line(SIDEBAR, workItem));
    await menuShown();
    await pressItem("Delete");
    await menuGone();
    await dialogOpen("delete-dialog");
    await app.until(`document.querySelector("#delete-loss section") && !document.getElementById("delete-submit").disabled`, "the loss in the delete dialog, and Delete on");
    await app.click("#delete-submit");
    await dialogClosed("delete-dialog");
    const sentence = `No work item under "Asleep" matches "Filtered away", so the sidebar lists none of its ${listed} repositories.`;
    await app.until(`document.getElementById("sidebar-empty")?.textContent === ${JSON.stringify(sentence)}`, `"${sentence}" in the sidebar`);
    expect(await rows()).toBe(0);
    expect(await mark()).toEqual([true, 'Showing: Asleep, matching "Filtered away"', true]);
    // The sentence in the muted ink at the second size, and the button in the form of a button that is not the main one.
    expect(await value<boolean[]>(`(() => { const resolved = ${RESOLVED}; const words = getComputedStyle(document.getElementById("sidebar-empty")); return [words.color === resolved("color", "--ink-muted"), words.fontSize === resolved("font-size", "--size-second")]; })()`)).toEqual([true, true]);
    // The hidden repositories' button stands under the sentence and the press that shows every work item.
    expect(await value<string[]>(`[...document.querySelectorAll('${SIDEBAR} > *')].map((element) => element.id)`)).toEqual(["sidebar-empty", "show-every", "hidden-repositories"]);
    expect(await value<[string, boolean]>(`(() => { const every = document.getElementById("show-every"); return [every.textContent, every.classList.contains("quiet")]; })()`)).toEqual(["Show every work item", true]);
    await app.click("#show-every");
    await app.until(`document.querySelectorAll('${SIDEBAR} section.repository').length === ${listed}`, "every repository in the sidebar again");
    expect((await rowWords(loneId)).at(-1)).toBe("0");
    // The press widens the list in front too: every line but the deleted one's.
    expect(await order(INBOX)).toHaveLength(lines - 1);
    expect(await mark()).toEqual([false, "Showing: All", false]);
    expect(await value<[string, string, boolean, boolean]>(`[document.getElementById("sidebar-filter").value, document.getElementById("search-field").value, document.getElementById("sidebar-empty") === null, document.activeElement === document.querySelector('${SIDEBAR} button.fold')]`)).toEqual(["all", "", true, true]);
  });
});
