// The sidebar, which stands at the left of every screen: the search field,
// the three screens it opens, the repositories with their work items, and the
// status line at its foot.
import { byId, changedSince, CHEVRON, entries, held, icon, marked, narrowed, part, stateIcon, titleClass } from "./shared";
import { ageOf, daemonStatus, filterChoices, matchCount, noticeWithout, sidebarTree, summaryCount, type StateFilter } from "./view";

/** The screen in front, or null before the daemon's `ready`. */
export type Front = "summary" | "inbox" | "history" | "view" | null;

export interface SidebarActions {
  openScreen(screen: "summary" | "inbox" | "history"): void;
  openView(workItemId: number): void;
  /** Opens the "New work item" form, with `folder` as its repository where one is given. It does not open before the daemon's `ready`. */
  openForm(folder?: string): void;
  pickFolder(): Promise<string | null>;
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
// The repositories a person folded, by their folders. None is folded at load, and the fold is kept nowhere.
const folded = new Set<string>();
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
    // Before the daemon's `ready` the form does not open, so neither does the folder dialog.
    if (!held.ready) return;
    // The repository stands in the sidebar once the form made a work item in it: the daemon keeps work items and no list of repositories.
    void actions.pickFolder().then((folder) => {
      if (folder) actions.openForm(folder);
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

/** Draws the status line: the notice where there is one, and otherwise the daemon's state, once the daemon said it. */
export function showStatus(): void {
  status.textContent = notice || (held.ready ? daemonStatus(held.sessions, held.paneKinds, held.keepAwake?.held ?? false) : "");
  status.classList.toggle("notice", notice !== "");
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
 * each repository that has a work item the search and the filter leave, with
 * those work items under it. The search field is the person's and is left as
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
    ...sidebarTree(held.workItems, held.sessions, held.paneKinds, held.query, held.filter).map((repository) => {
      const isFolded = folded.has(repository.repo);
      const section = document.createElement("section");
      section.className = "repository";
      const head = document.createElement("button");
      head.className = "side-item fold";
      // Two repositories of one name are told apart by their folders.
      head.title = repository.repo;
      head.dataset.repo = repository.repo;
      head.setAttribute("aria-expanded", String(!isFolded));
      head.append(icon(CHEVRON), part("word", repository.name), part("count", String(repository.count)));
      head.addEventListener("click", () => {
        if (!folded.delete(repository.repo)) folded.add(repository.repo);
        showSidebar();
        repositories.querySelector<HTMLElement>(`button[data-repo="${CSS.escape(repository.repo)}"]`)?.focus();
      });
      const list = document.createElement("ul");
      list.hidden = isFolded;
      list.append(...repository.entries.map(({ workItem, line, session, marks }) => workItemElement(workItem.id, line.title, marks, line.state, session?.stateSince)));
      section.append(head, list);
      return section;
    }),
  );
  showStatus();
}
