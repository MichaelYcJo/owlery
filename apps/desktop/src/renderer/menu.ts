// A menu, drawn in the window: an element with the role `menu` whose items
// have the role `menuitem`, each with the description a pointer over it is
// told. An entry that opens a submenu is an item of it too, and its submenu
// is a second element with the role `menu`, drawn beside the menu while it
// is open. The system draws none of it, so the page's
// themes colour it and a case can read and press it. What a menu holds is a
// function of ./view, one menu is open at a time, and one submenu of it.
import { submenuPlace, type MenuAction, type MenuEntry, type MenuItem, type Submenu } from "./view";

/** How long an open submenu stays once the pointer has come onto another item of the menu. On its way from the submenu's item to a lower item of the submenu the pointer crosses the menu's next items, and the submenu waits for it. */
export const SUBMENU_LEAVE_MS = 300;

/** The open menu: its element, where the keyboard goes when it closes, how each of its items that opens a submenu draws it, and the open submenu with the item it opened from. */
let shown:
  | {
      element: HTMLElement;
      back: () => HTMLElement | null;
      openers: Map<HTMLElement, (withKeyboard: boolean) => void>;
      submenu?: { element: HTMLElement; item: HTMLElement };
    }
  | undefined;
/** The pause before the open submenu closes, while it runs. */
let leaving: ReturnType<typeof setTimeout> | undefined;

/** Whether a menu is open. While one is, the window reads none of its other keys. */
export function menuOpen(): boolean {
  return shown !== undefined;
}

function items(menu: HTMLElement): HTMLElement[] {
  return [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')];
}

/** An element with the role `menu`, named to a screen reader by `says`, with no item yet. */
function menuElement(says: string): HTMLElement {
  const menu = document.createElement("div");
  menu.className = "menu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", says);
  // A press inside the menu that lands on no item puts the keyboard on the menu itself, where its keys are still read. Without it the keyboard falls to the page's body, and Escape no longer closes the menu.
  menu.tabIndex = -1;
  menu.addEventListener("keydown", onKey);
  return menu;
}

/** An item of a menu, with a rule above it where the entry divides. */
function itemElement(menu: HTMLElement, entry: MenuEntry): HTMLElement {
  if (entry.divides) {
    const rule = document.createElement("div");
    rule.setAttribute("role", "separator");
    menu.append(rule);
  }
  const item = document.createElement("button");
  item.type = "button";
  item.setAttribute("role", "menuitem");
  // The arrows move through the items, and the Tab key does not.
  item.tabIndex = -1;
  item.textContent = entry.label;
  // What a press does, which the system shows a pointer that rests on the item.
  item.title = entry.description;
  menu.append(item);
  return item;
}

function stay(): void {
  clearTimeout(leaving);
  leaving = undefined;
}

/** Closes the open submenu and leaves the menu. Where the keyboard was in the submenu, it returns to the item the submenu opened from. */
function closeSubmenu(): void {
  stay();
  const submenu = shown?.submenu;
  if (!shown || !submenu) return;
  shown.submenu = undefined;
  const held = submenu.element.contains(document.activeElement);
  submenu.element.remove();
  submenu.item.setAttribute("aria-expanded", "false");
  if (held) submenu.item.focus();
}

/**
 * Opens the submenu of `entry` beside the menu, at the top edge of `item`,
 * the item it opens from, moved where it would pass the window's edge, as
 * `submenuPlace` says. The keyboard goes to its first item where
 * `withKeyboard` says so, and stays where it is at the pointer's opening. A
 * press of an item closes the submenu and the menu and hands the item's
 * action to `press`. A submenu already open from that item stays as it is,
 * and one open from another item closes first.
 */
function openSubmenu(entry: Submenu, item: HTMLElement, press: (action: MenuAction) => void, withKeyboard: boolean): void {
  if (!shown) return;
  stay();
  if (shown.submenu?.item !== item) {
    closeSubmenu();
    const submenu = menuElement(entry.label);
    for (const inside of entry.opens) pressed(itemElement(submenu, inside), inside, press);
    // The pointer reached the submenu before the pause ran out.
    submenu.addEventListener("pointerenter", stay);
    document.body.append(submenu);
    const menu = shown.element.getBoundingClientRect();
    const size = submenu.getBoundingClientRect();
    const place = submenuPlace(menu, item.getBoundingClientRect().top, size, { width: window.innerWidth, height: window.innerHeight });
    submenu.style.left = `${place.left}px`;
    submenu.style.top = `${place.top}px`;
    item.setAttribute("aria-expanded", "true");
    shown.submenu = { element: submenu, item };
  }
  if (withKeyboard) items(shown.submenu.element)[0]?.focus();
}

/** Has a press of an item close the submenu and the menu, and hand the item's action to `press`. */
function pressed(item: HTMLElement, entry: MenuItem, press: (action: MenuAction) => void): void {
  item.addEventListener("click", () => {
    closeMenu();
    press(entry.action);
  });
}

/**
 * The keys of an open menu and of its submenu: the arrows move through the
 * items of the one the keyboard is in and stop at each end, and the Tab key
 * leaves the keyboard where it is. Enter and Space press the item the
 * keyboard is on, as they press any button. On an item that opens a
 * submenu, ArrowRight, Enter and Space open it and put the keyboard on its
 * first item. In the menu, Escape closes it. In the submenu, ArrowLeft and
 * Escape close the submenu alone and return the keyboard to its item.
 */
function onKey(event: KeyboardEvent): void {
  if (!shown) return;
  const within = event.currentTarget as HTMLElement;
  const inSubmenu = within === shown.submenu?.element;
  if (event.key === "Escape" || (inSubmenu && event.key === "ArrowLeft")) {
    event.preventDefault();
    if (inSubmenu) closeSubmenu();
    else closeMenu();
    return;
  }
  if (event.key === "Tab") {
    event.preventDefault();
    return;
  }
  const opens = shown.openers.get(document.activeElement as HTMLElement);
  if (opens && (event.key === "ArrowRight" || event.key === "Enter" || event.key === " ")) {
    // The key is the item's own here, and raises no press of it.
    event.preventDefault();
    opens(true);
    return;
  }
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  event.preventDefault();
  const all = items(within);
  const at = all.indexOf(document.activeElement as HTMLElement) + (event.key === "ArrowDown" ? 1 : -1);
  all[Math.min(Math.max(at, 0), all.length - 1)]?.focus();
}

/** A press outside the open menu and its submenu closes both. The press goes on to what it was made on, so the keyboard is not returned. A press inside either on no item, on a rule or on an edge, leaves both open with the keyboard on the one pressed. */
function onPress(event: Event): void {
  if (!shown) return;
  const on = event.target;
  if (!(on instanceof Node && (shown.element.contains(on) || shown.submenu?.element.contains(on)))) closeMenu(false);
}

/**
 * Closes the open menu, and its submenu where one is open. The keyboard
 * returns to where it was when the menu opened, or, where that element is no
 * longer drawn, to the one `again` found at the opening, unless `returning`
 * is false.
 */
export function closeMenu(returning = true): void {
  if (!shown) return;
  const { element, back, submenu } = shown;
  shown = undefined;
  stay();
  document.removeEventListener("pointerdown", onPress, true);
  submenu?.element.remove();
  element.remove();
  if (returning) back()?.focus();
}

/**
 * Opens a menu of `entries` with its corner at `at`, moved where it would
 * pass the window's edge, and puts the keyboard on its first item. `says`
 * names the menu to a screen reader. A press of an item closes the menu and
 * hands the item's action to `press`. An entry that opens a submenu is an
 * item whose press closes nothing: its submenu opens at the press and when
 * the pointer comes onto the item, and closes at once when the keyboard
 * moves to another item of the menu, and `SUBMENU_LEAVE_MS` after the
 * pointer came onto another item unless the pointer reaches the submenu or
 * its item first. A menu that is open closes first. `again` finds the
 * element the keyboard returns to where the one it was on has been drawn
 * anew since.
 */
export function openMenu(says: string, entries: readonly MenuEntry[], at: { x: number; y: number }, press: (action: MenuAction) => void, again: () => HTMLElement | null): void {
  closeMenu(false);
  const before = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const menu = menuElement(says);
  const openers = new Map<HTMLElement, (withKeyboard: boolean) => void>();
  for (const entry of entries) {
    const item = itemElement(menu, entry);
    if ("opens" in entry) {
      item.setAttribute("aria-haspopup", "menu");
      item.setAttribute("aria-expanded", "false");
      const opens = (withKeyboard: boolean): void => openSubmenu(entry, item, press, withKeyboard);
      openers.set(item, opens);
      item.addEventListener("click", () => opens(false));
      item.addEventListener("pointerenter", () => opens(false));
    } else {
      pressed(item, entry, press);
      item.addEventListener("pointerenter", () => {
        if (shown?.submenu && leaving === undefined) leaving = setTimeout(closeSubmenu, SUBMENU_LEAVE_MS);
      });
    }
  }
  menu.addEventListener("focusin", (event) => {
    if (shown?.submenu && event.target !== shown.submenu.item && event.target !== menu) closeSubmenu();
  });
  document.body.append(menu);
  const box = menu.getBoundingClientRect();
  menu.style.left = `${Math.max(0, Math.min(at.x, window.innerWidth - box.width))}px`;
  menu.style.top = `${Math.max(0, Math.min(at.y, window.innerHeight - box.height))}px`;
  shown = { element: menu, back: () => (before?.isConnected ? before : again()), openers };
  // Read before the press reaches anything else, so the menu is gone when the element under the press acts.
  document.addEventListener("pointerdown", onPress, true);
  items(menu)[0]?.focus();
}
