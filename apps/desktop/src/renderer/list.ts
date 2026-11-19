// A list of work items' lines beside the preview of the selected one: the
// inbox screen, and the history screen over the work items whose agent
// finished. Each is a copy of the page's `list-screen` template.
import { byId, changedSince, dot, entries, held, marked, sealPlace, stateClass, titleClass } from "./shared";
import {
  emptyList,
  filterChoices,
  historyLines,
  inboxGroups,
  inboxSummary,
  lastHere,
  markRanges,
  matchSentence,
  matchWorkItems,
  moveSelection,
  selectedLine,
  stateHeading,
  type Entry,
  type StateFilter,
} from "./view";

export interface ListScreen {
  /** Draws the head, the lines the search and the filter leave, and the preview. */
  show(): void;
  /** Selects a work item's line where it is displayed, and the first line otherwise, and shows the selected one in the preview. */
  select(workItemId: number | undefined): void;
  /** Puts the keyboard on a work item's line, where it is displayed. */
  focusLine(workItemId: number | undefined): void;
  /** Moves the selection one line, as J and K do. */
  move(key: "next" | "previous"): void;
  selected(): number | undefined;
}

export interface ListActions {
  openView(workItemId: number): void;
  /** Takes the state chosen in the head's filter. */
  filter(state: StateFilter): void;
}

export function listScreen(name: "inbox" | "history", actions: ListActions): ListScreen {
  const root = byId(`${name}-screen`);
  root.append(byId<HTMLTemplateElement>("list-screen").content.cloneNode(true));
  // Each part takes the screen's name before its own as its id.
  for (const element of root.querySelectorAll<HTMLElement>("[data-part]")) element.id = `${name}-${element.dataset.part}`;
  const piece = <E extends HTMLElement = HTMLElement>(of: string) => byId<E>(`${name}-${of}`);
  const sentence = piece("summary");
  const lastLooked = piece("last-here");
  const match = piece("match");
  const filter = piece<HTMLSelectElement>("filter");
  const lines = piece("lines");
  const empty = piece("empty");
  const legend = piece("legend");
  const previewContent = piece("preview-content");
  const previewState = piece("preview-state");
  const previewTitle = piece("preview-title");
  const previewBranch = piece("preview-branch");
  const previewCommits = piece("preview-commits");
  // The work items in the order their lines are displayed, and the one whose line is selected: the preview shows it, and J, K and Enter act on it.
  let displayed: number[] = [];
  let selected: number | undefined;

  piece("word").textContent = name === "inbox" ? "Inbox" : "History";
  piece("list").setAttribute("aria-label", name === "inbox" ? "Inbox" : "History");
  piece("preview-seal").replaceWith(sealPlace());
  filter.replaceChildren(...filterChoices().map(({ value, label }) => new Option(label, value)));
  filter.addEventListener("change", () => actions.filter(filter.value as StateFilter));
  piece("open-work-item").addEventListener("click", () => {
    if (selected !== undefined) actions.openView(selected);
  });

  function lineButton(workItemId: number): HTMLElement | null {
    return lines.querySelector<HTMLElement>(`button[data-work-item="${workItemId}"]`);
  }

  function showPreview(): void {
    const entry = entries().find(({ workItem }) => workItem.id === selected);
    previewContent.hidden = !entry;
    if (!entry) return;
    previewState.textContent = stateHeading(entry.line.state);
    previewState.className = `caption state ${stateClass(entry.line.state)}`;
    previewTitle.textContent = entry.line.title;
    previewBranch.textContent = entry.line.branch;
    previewCommits.textContent = entry.line.commits;
  }

  /** The lines are not drawn again, so the keyboard keeps its place. */
  function select(workItemId: number | undefined): void {
    selected = selectedLine(displayed, workItemId);
    for (const button of lines.querySelectorAll<HTMLElement>("button[data-work-item]")) {
      const isSelected = button.dataset.workItem === String(selected);
      button.classList.toggle("selected", isSelected);
      if (isSelected) button.setAttribute("aria-current", "true");
      else button.removeAttribute("aria-current");
    }
    showPreview();
  }

  function lineElement({ workItem, line }: Entry): HTMLElement {
    const button = document.createElement("button");
    button.className = "line";
    button.title = workItem.worktree;
    button.dataset.workItem = String(workItem.id);
    const text = document.createElement("span");
    text.className = "text";
    const meta = document.createElement("span");
    meta.className = "meta";
    const commits = document.createElement("span");
    commits.className = "commits";
    commits.textContent = line.commits;
    meta.append(marked("branch", line.branch, markRanges(line.branch, held.query)), commits);
    text.append(marked(titleClass(workItem.id), line.title, markRanges(line.title, held.query)), meta);
    button.append(dot(line.state, held.lastLook ? changedSince(workItem.id) : undefined), text, sealPlace());
    button.addEventListener("click", () => actions.openView(workItem.id));
    // The keyboard's place on a line is the selection, so the preview shows the line a person tabbed to.
    button.addEventListener("focus", () => {
      if (selected !== workItem.id) select(workItem.id);
    });
    const item = document.createElement("li");
    item.append(button);
    return item;
  }

  function listOf(shown: readonly Entry[]): HTMLElement {
    const list = document.createElement("ul");
    list.append(...shown.map(lineElement));
    return list;
  }

  function show(): void {
    const all = entries();
    // The screen's own work items, and of them the ones the search and the filter leave.
    const own = name === "inbox" ? all : historyLines(all);
    const shown = matchWorkItems(own, held.query, held.filter);
    filter.value = held.filter;
    // The inbox's sentence counts every work item, whatever is typed or chosen.
    const said = name === "inbox" ? inboxSummary(all.map(({ line }) => line)) : "";
    sentence.textContent = said;
    sentence.hidden = said === "";
    const looked = name === "inbox" ? held.lastLook : null;
    lastLooked.textContent = looked ? lastHere(looked.at, Date.now()) : "";
    lastLooked.hidden = !looked;
    match.textContent = held.query === "" ? "" : matchSentence(shown.length, own.length, held.query);
    match.hidden = held.query === "";
    empty.textContent = emptyList(name, own.length, shown.length);
    empty.hidden = empty.textContent === "";
    // The dots mark a change only where a look is recorded to measure it from.
    legend.hidden = !looked || shown.length === 0;
    if (name === "inbox") {
      const groups = inboxGroups(shown);
      lines.replaceChildren(
        ...groups.flatMap((group) => {
          const heading = document.createElement("h2");
          heading.className = `caption state ${stateClass(group.state)}`;
          heading.textContent = group.heading;
          return [heading, listOf(group.entries)];
        }),
      );
      displayed = groups.flatMap((group) => group.entries).map(({ workItem }) => workItem.id);
    } else {
      // The history's lines stand in one list, the one that finished last first, under no heading.
      lines.replaceChildren(...(shown.length > 0 ? [listOf(shown)] : []));
      displayed = shown.map(({ workItem }) => workItem.id);
    }
    select(selected);
  }

  return {
    show,
    select,
    focusLine(workItemId) {
      if (workItemId !== undefined) lineButton(workItemId)?.focus();
    },
    move(key) {
      const next = moveSelection(displayed, selected, key);
      if (next === undefined) return;
      // Where the keyboard is on a line it moves with the selection, so Enter there opens the selected one.
      const onLine = document.activeElement instanceof HTMLElement && lines.contains(document.activeElement);
      select(next);
      const button = lineButton(next);
      if (onLine) button?.focus();
      button?.scrollIntoView({ block: "nearest" });
    },
    selected: () => selected,
  };
}
