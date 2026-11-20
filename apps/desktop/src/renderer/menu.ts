// A menu, drawn in the window: an element with the role `menu` whose items
// have the role `menuitem`. The system draws none of it, so the page's
// themes colour it and a case can read and press it. What a menu holds is a
// function of ./view, and one menu is open at a time.
import type { MenuAction, MenuEntry } from "./view";

/** The open menu: its element, and where the keyboard goes when it closes. */
let shown: { element: HTMLElement; back: () => HTMLElement | null } | undefined;

/** Whether a menu is open. While one is, the window reads none of its other keys. */
export function menuOpen(): boolean {
  return shown !== undefined;
}

function items(menu: HTMLElement): HTMLElement[] {
  return [...menu.querySelectorAll<HTMLElement>('[role="menuitem"]')];
}

/** The keys of an open menu: the arrows move through the items and stop at each end, and Escape closes it. Enter and Space press the item the keyboard is on, as they press any button. The Tab key leaves the keyboard where it is. */
function onKey(event: KeyboardEvent): void {
  if (!shown) return;
  if (event.key === "Escape") {
    event.preventDefault();
    closeMenu();
    return;
  }
  if (event.key === "Tab") {
    event.preventDefault();
    return;
  }
  if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
  event.preventDefault();
  const all = items(shown.element);
  const at = all.indexOf(document.activeElement as HTMLElement) + (event.key === "ArrowDown" ? 1 : -1);
  all[Math.min(Math.max(at, 0), all.length - 1)]?.focus();
}

/** A press outside the open menu closes it. The press goes on to what it was made on, so the keyboard is not returned. */
function onPress(event: Event): void {
  if (shown && !(event.target instanceof Node && shown.element.contains(event.target))) closeMenu(false);
}

/**
 * Closes the open menu. The keyboard returns to where it was when the menu
 * opened, or, where that element is no longer drawn, to the one `again`
 * found at the opening, unless `returning` is false.
 */
export function closeMenu(returning = true): void {
  if (!shown) return;
  const { element, back } = shown;
  shown = undefined;
  document.removeEventListener("pointerdown", onPress, true);
  element.remove();
  if (returning) back()?.focus();
}

/**
 * Opens a menu of `entries` with its corner at `at`, moved where it would
 * pass the window's edge, and puts the keyboard on its first item. `says`
 * names the menu to a screen reader. A press of an item closes the menu and
 * hands the item's action to `press`. A menu that is open closes first.
 * `again` finds the element the keyboard returns to where the one it was on
 * has been drawn anew since.
 */
export function openMenu(says: string, entries: readonly MenuEntry[], at: { x: number; y: number }, press: (action: MenuAction) => void, again: () => HTMLElement | null): void {
  closeMenu(false);
  const before = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  const menu = document.createElement("div");
  menu.className = "menu";
  menu.setAttribute("role", "menu");
  menu.setAttribute("aria-label", says);
  for (const entry of entries) {
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
    item.addEventListener("click", () => {
      closeMenu();
      press(entry.action);
    });
    menu.append(item);
  }
  menu.addEventListener("keydown", onKey);
  document.body.append(menu);
  const box = menu.getBoundingClientRect();
  menu.style.left = `${Math.max(0, Math.min(at.x, window.innerWidth - box.width))}px`;
  menu.style.top = `${Math.max(0, Math.min(at.y, window.innerHeight - box.height))}px`;
  shown = { element: menu, back: () => (before?.isConnected ? before : again()) };
  // Read before the press reaches anything else, so the menu is gone when the element under the press acts.
  document.addEventListener("pointerdown", onPress, true);
  items(menu)[0]?.focus();
}
