// The menus in the built app. It starts the app once, in the background, on a
// temporary clone with two work items, and drives the window through
// Electron's debugging port: a work item's menu from the right button and
// from the keyboard, its pin and its mute, and the rename dialog; then a
// repository's menu, the form's choice to register a repository alone, and
// a repository's settings, its icon, hiding it and removing it. No case
// presses an "Open in" item or a "Copy" item: each acts on the desktop and
// the clipboard of whoever runs the suite.
import { existsSync, readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { installedApps } from "../src/main/openers";
import { NEW_WORK_ITEM_SAYS, REGISTER_ONLY_SAYS, rowButtons } from "../src/renderer/view";
import { BuiltApp, buildApp } from "./built-app";
import { RECEIVER } from "./korean-pane";
import { git, temporaryClone, temporaryRepository } from "./repositories";

describe("the menus in the built app", { timeout: 30_000 }, () => {
  let app: BuiltApp;
  let clone: ReturnType<typeof temporaryClone>;
  /** A second repository, which the form registers with no work item. */
  let second: ReturnType<typeof temporaryRepository>;

  const SIDEBAR = "#repositories";
  const INBOX = "#inbox-lines";
  const line = (within: string, id: number): string => `${within} button[data-work-item="${id}"]`;
  const MENU = `[role="menu"]`;
  /** The items a work item's menu holds on this Mac: the apps are the ones the main process finds installed. */
  const items = (pin = "Pin", mute = "Mute notifications"): string[] => ["Rename", "Open in Finder", ...installedApps(existsSync, homedir()).map(({ name }) => `Open in ${name}`), "Copy path", "Copy branch name", pin, mute];

  /** The items a repository's menu holds on this Mac. */
  const repositoryItems = (): string[] => ["Settings", "Change icon", "Show archived work items", "New group", "Open in Finder", ...installedApps(existsSync, homedir()).map(({ name }) => `Open in ${name}`), "Copy path", "Hide from sidebar", "Remove"];
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

  /** Types a text over what a field holds, as a person who selected it all does. */
  async function typeOver(id: string, text: string): Promise<void> {
    await app.click(`#${id}`);
    await app.evaluate(`document.getElementById(${JSON.stringify(id)}).select()`);
    await app.cdp("Input.insertText", { text });
  }

  const dialogOpen = (id: string): Promise<void> => app.until(`document.getElementById(${JSON.stringify(id)}).open`, `the dialog ${id}`);
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
    second = temporaryRepository("second");
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

  it("removes a repository with no work item from its menu, after a dialog that says nothing on disk is removed, and leaves the repository as git held it", async () => {
    const before = [held(second.repo), readFileSync(join(second.repo, "README.md"), "utf8")];
    await fromMenu(2, "Remove");
    await dialogOpen("remove-dialog");
    expect(await value<string>(`document.getElementById("remove-head").textContent`)).toBe("Remove Docs site from Owlery");
    expect(await value<string>(`document.getElementById("remove-says").textContent`)).toContain("Nothing on disk is removed");
    expect(await value<boolean[]>(`[document.getElementById("remove-work-items").hidden, document.getElementById("remove-sessions").hidden]`)).toEqual([true, true]);
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
    expect(await listed("remove-sessions")).toEqual(["Shell in Renamed here", "Shell in Third name"]);
    await app.click("#remove-submit");
    await dialogClosed("remove-dialog");
    await app.until(`document.querySelectorAll('${SIDEBAR} section').length === 0`, "no repository in the sidebar");
    expect(await order(SIDEBAR)).toEqual([]);
    expect(await order(INBOX)).toEqual([]);
    expect(await value<string>(`document.getElementById("status").textContent`)).not.toContain("since you looked");
    expect(held(clone.repo)).toEqual(before);
    expect([existsSync(join(clone.root, "project", "first-item", "README.md")), existsSync(join(clone.root, "project", "second-item", "README.md"))]).toEqual([true, true]);
  });
});
