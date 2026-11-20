// The sidebar, which stands at the left of every screen: the search field,
// the three screens it opens, the repositories the daemon keeps with their
// work items, and the status line at its foot.
import { byId, changedSince, CHEVRON, DOTS, entries, held, icon, marked, narrowed, part, PLUS, stateIcon, titleClass } from "./shared";
import { ageOf, daemonStatus, filterChoices, matchCount, noticeWithout, sidebarTree, summaryCount, type StateFilter } from "./view";

/** The screen in front, or null before the daemon's `ready`. */
export type Front = "summary" | "inbox" | "history" | "view" | null;

export interface SidebarActions {
  openScreen(screen: "summary" | "inbox" | "history"): void;
  openView(workItemId: number): void;
  /** Opens the "New work item" form, with `folder` as its repository where one is given. It does not open before the daemon's `ready`. */
  openForm(folder?: string): void;
  pickFolder(): Promise<string | null>;
  /** Asks the daemon to keep the repository `folder` is inside, with no work item. */
  addRepository(folder: string): void;
  /** Takes what the search field holds, as it is typed. */
  search(query: string): void;
  filter(state: StateFilter): void;
  /** Returns the keyboard to the list, after Escape emptied the search field. */
  leaveSearch(): void;
}

const searchField = byId<HTMLInputElement>("search-field");
const searchCount = byId("search-count");
const searchKey = byId("search-key");
const navOf = { inbox: byId("nav-inbox"), summary: byId("nav-summary"), history: byId("nav-history") };
const inboxCount = byId("nav-inbox-count");
const summaryNew = byId("nav-summary-count");
const bell = byId<HTMLButtonElement>("bell");
const bellCount = byId("bell-count");
const filterControl = byId("sidebar-filter-control");
const filter = byId<HTMLSelectElement>("sidebar-filter");
const repositories = byId("repositories");
const status = byId("status");
// The repositories a person folded, by their ids. None is folded at load, and the fold is kept nowhere.
const folded = new Set<number>();
// What the status line has to tell in place of the daemon's state: that the window is reconnecting, or a request the daemon refused.
let notice = "";
let front: Front = null;
let actions: SidebarActions;

export function initSidebar(given: SidebarActions, mac: boolean): void {
  actions = given;
  searchKey.textContent = mac ? "⌘K" : "Ctrl K";
  for (const screen of ["inbox", "summary", "history"] as const) navOf[screen].addEventListener("click", () => actions.openScreen(screen));
  searchField.addEventListener("input", () => actions.search(searchField.value));
  searchField.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    searchField.value = "";
    actions.search("");
    actions.leaveSearch();
  });
  filter.replaceChildren(...filterChoices().map(({ value, label }) => new Option(label, value)));
  filter.addEventListener("change", () => actions.filter(filter.value as StateFilter));
  bell.addEventListener("click", () => actions.filter("waiting"));
  byId("new-work-item").addEventListener("click", () => actions.openForm());
  byId("add-repository").addEventListener("click", () => {
    // Before the daemon's `ready` nothing can be asked of it, so the folder dialog does not open.
    if (!held.ready) return;
    // The repository stands in the sidebar once the daemon keeps it, with no work item.
    void actions.pickFolder().then((folder) => {
      if (folder) actions.addRepository(folder);
    });
  });
  showStatus();
}

/** Puts the keyboard in the search field, with what it holds selected. */
export function focusSearch(): void {
  searchField.focus();
  searchField.select();
}

/** Says `text` in the status line, or the daemon's state again where it is empty. */
export function tell(text: string): void {
  notice = text;
  showStatus();
}

/** Takes `text` back from the status line, where the line still says it, and leaves any other notice. */
export function untell(text: string): void {
  tell(noticeWithout(notice, text));
}

function showStatus(): void {
  // The window's own notice first, then what there is to say of the daemon, then the daemon's state.
  const said = notice || held.daemonNotice;
  status.textContent = said || (held.ready ? daemonStatus(held.sessions, held.paneKinds) : "");
  status.classList.toggle("notice", said !== "");
}

/** A button of a repository's row that shows an icon alone, and says what it does to a pointer and to a screen reader. */
function rowButton(className: string, says: string, shapes: Parameters<typeof icon>[0]): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = `icon-button ${className}`;
  button.title = says;
  button.setAttribute("aria-label", says);
  button.append(icon(shapes));
  return button;
}

function workItemElement(workItemId: number, title: string, marks: readonly (readonly [number, number])[], state: Parameters<typeof stateIcon>[0], since: number | null | undefined): HTMLElement {
  const button = document.createElement("button");
  button.className = "side-item";
  button.dataset.workItem = String(workItemId);
  // The sidebar marks the work item whose view is on screen.
  if (workItemId === held.viewing) button.setAttribute("aria-current", "page");
  // The letters of the title that match what is typed in the search field are marked, as a line of the list marks them.
  button.append(stateIcon(state, changedSince(workItemId)), marked(titleClass(workItemId), title, marks), part("age", ageOf(since, Date.now())));
  button.addEventListener("click", () => {
    if (workItemId !== held.viewing) actions.openView(workItemId);
  });
  const item = document.createElement("li");
  item.append(button);
  return item;
}

/**
 * Draws the sidebar: which screen is in front, the counts, the filter, and
 * each repository `sidebarTree` lists, with its work items under it. A
 * repository's row holds the button that folds it, a "+" button that opens
 * the "New work item" form on its folder, and a "…" button for its menu,
 * which opens nothing yet. The search field is the person's and is left as
 * it is.
 */
export function showSidebar(inFront: Front = front): void {
  front = inFront;
  for (const screen of ["inbox", "summary", "history"] as const) {
    if (screen === front) navOf[screen].setAttribute("aria-current", "page");
    else navOf[screen].removeAttribute("aria-current");
  }
  const all = entries();
  const left = narrowed();
  inboxCount.textContent = held.ready ? String(all.length) : "";
  summaryNew.textContent = summaryCount(held.changes.length);
  const waiting = all.filter(({ line }) => line.state === "waiting").length;
  bellCount.textContent = waiting > 0 ? String(waiting) : "";
  bell.classList.toggle("ringing", waiting > 0);
  bell.title = waiting > 0 ? `${waiting} waiting for you. Show them alone.` : "Show the work items that wait for you alone.";
  bell.setAttribute("aria-label", bell.title);
  filter.value = held.filter;
  const chosen = filterChoices().find((choice) => choice.value === held.filter);
  filterControl.title = `Showing: ${chosen ? chosen.label : held.filter}`;
  filterControl.classList.toggle("on", held.filter !== "all");
  searchCount.textContent = held.query === "" ? "" : matchCount(left.length, all.length);
  repositories.replaceChildren(
    ...sidebarTree(held.repositories, held.workItems, held.sessions, held.paneKinds, held.query, held.filter).map((repository) => {
      const isFolded = folded.has(repository.id);
      const section = document.createElement("section");
      section.className = "repository";
      section.dataset.repository = String(repository.id);
      const head = document.createElement("button");
      head.className = "side-item fold";
      // Two repositories of one name are told apart by their folders.
      head.title = repository.repo;
      head.dataset.repo = repository.repo;
      head.setAttribute("aria-expanded", String(!isFolded));
      head.append(icon(CHEVRON), part("word", repository.name), part("count", String(repository.count)));
      head.addEventListener("click", () => {
        if (!folded.delete(repository.id)) folded.add(repository.id);
        showSidebar();
        repositories.querySelector<HTMLElement>(`button[data-repo="${CSS.escape(repository.repo)}"]`)?.focus();
      });
      const add = rowButton("repository-add", `New work item in ${repository.name}`, PLUS);
      add.addEventListener("click", () => actions.openForm(repository.repo));
      const menu = rowButton("repository-menu", `Menu of ${repository.name}`, DOTS);
      menu.setAttribute("aria-haspopup", "menu");
      const row = document.createElement("div");
      row.className = "repository-row";
      row.append(head, add, menu);
      const list = document.createElement("ul");
      list.hidden = isFolded;
      list.append(...repository.entries.map(({ workItem, line, session, marks }) => workItemElement(workItem.id, line.title, marks, line.state, session?.stateSince)));
      section.append(row, list);
      return section;
    }),
  );
  showStatus();
}
