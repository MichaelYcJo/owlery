// A list of work items' lines beside the preview of the selected one: the
// inbox screen, the history screen over the work items whose agent
// finished, and the archived screen over the archived work items of one
// repository. Each is a copy of the page's `list-screen` template.
import { byId, changedSince, detail, drawSeal, entries, held, lineMarkIcons, marked, part, sealPlace, showState, stateIcon, titleClass } from "./shared";
import {
  ageOf,
  ahead,
  archivedHead,
  decisionMark,
  archivedIn,
  emptyList,
  filterChoices,
  gainedSince,
  historyLines,
  inboxGroups,
  inboxSummary,
  keyHints,
  lastHere,
  lineBadge,
  lineSince,
  lineAccount,
  lineText,
  machineAhead,
  markRanges,
  matchSentence,
  matchWorkItems,
  moveSelection,
  pinnedFirst,
  repoNameOf,
  sealShown,
  selectedLine,
  setupMark,
  workItemEntries,
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
  /** The line of a work item, where it is displayed. */
  line(workItemId: number): HTMLElement | null;
}

export interface ListActions {
  openView(workItemId: number): void;
  /** Restores an archived work item, at the press of the archived screen's main button. */
  restore(workItemId: number): void;
  /** Takes the state chosen in the head's filter. */
  filter(state: StateFilter): void;
}

export function listScreen(name: "inbox" | "history" | "archived", actions: ListActions, mac: boolean): ListScreen {
  const root = byId(`${name}-screen`);
  root.append(byId<HTMLTemplateElement>("list-screen").content.cloneNode(true));
  // Each part takes the screen's name before its own as its id.
  for (const element of root.querySelectorAll<HTMLElement>("[data-part]")) element.id = `${name}-${element.dataset.part}`;
  const piece = <E extends HTMLElement = HTMLElement>(of: string) => byId<E>(`${name}-${of}`);
  const word = piece("word");
  const sentence = piece("summary");
  const lastLooked = piece("last-here");
  const match = piece("match");
  const filter = piece<HTMLSelectElement>("filter");
  const lines = piece("lines");
  const empty = piece("empty");
  const previewContent = piece("preview-content");
  const previewState = piece("preview-state");
  const previewTitle = piece("preview-title");
  const previewBranch = piece("preview-branch");
  const previewAhead = piece("preview-ahead");
  const previewRepo = piece("preview-repo");
  const previewDetail = piece("preview-detail");
  const previewSealWords = piece("preview-seal-words");
  // The seal's place is made once, and drawn again for each work item the preview shows.
  const previewSeal = sealPlace("preview", null);
  // The work items in the order their lines are displayed, and the one whose line is selected: the preview shows it, and J, K and Enter act on it.
  let displayed: number[] = [];
  let selected: number | undefined;

  piece("preview-seal").replaceWith(previewSeal);
  piece("preview-keys").replaceChildren(...keyHints(name, mac).map((keys) => part("key", keys)));
  filter.replaceChildren(...filterChoices().map(({ value, label }) => new Option(label, value)));
  filter.addEventListener("change", () => actions.filter(filter.value as StateFilter));
  // An archive ends the work item's sessions, so the archived screen offers no choice among the states.
  filter.hidden = name === "archived";
  // An archived work item has no view to open: the main button of its preview restores it.
  if (name === "archived") piece("open-work-item").textContent = "Restore";
  piece("open-work-item").addEventListener("click", () => {
    if (selected === undefined) return;
    if (name === "archived") actions.restore(selected);
    else actions.openView(selected);
  });

  /** The screen's own work items, whatever is typed or chosen: every one on the inbox, the ones whose agent finished on the history, and on the archived screen the archived ones of the repository it was opened on, the one archived last first. */
  function own(): Entry[] {
    if (name === "inbox") return entries();
    if (name === "history") return historyLines(entries());
    return held.archivedOf === undefined ? [] : workItemEntries(archivedIn(held.archivedOf, held.archived), held.sessions, held.paneKinds);
  }

  function lineButton(workItemId: number): HTMLElement | null {
    return lines.querySelector<HTMLElement>(`button[data-work-item="${workItemId}"]`);
  }

  function showPreview(): void {
    const entry = own().find(({ workItem }) => workItem.id === selected);
    previewContent.hidden = !entry;
    if (!entry) return;
    showState(previewState, entry.line.state, lineSince(entry.workItem, entry.session));
    previewTitle.textContent = entry.line.title;
    previewBranch.textContent = entry.line.branch;
    previewAhead.textContent = ahead(entry.workItem).sentence;
    previewRepo.textContent = repoNameOf(entry.workItem);
    drawSeal(previewSeal, entry.workItem.seal);
    previewSealWords.textContent = sealShown(entry.workItem.seal).words;
    // The commits the branch gained since the look carry a dot.
    previewDetail.replaceChildren(...detail(entry, gainedSince(entry.workItem, held.lastLook)));
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

  function lineElement({ workItem, line, session }: Entry): HTMLElement {
    const button = document.createElement("button");
    button.className = "line";
    button.title = workItem.worktree;
    button.dataset.workItem = String(workItem.id);
    const first = part("first", "");
    // A pin and a mute each put a mark after the title.
    // The account stands after the age where the work item's, or a running session's, is another than the one its repository gives.
    const account = lineAccount(workItem, held.repositories.find((repository) => repository.id === workItem.repoId), held.sessions, held.headless, held.accounts);
    first.append(stateIcon(line.state, changedSince(workItem.id)), marked(titleClass(workItem.id), line.title, markRanges(line.title, held.query)), ...lineMarkIcons(workItem), part("age", ageOf(lineSince(workItem, session), Date.now())), ...(account === "" ? [] : [part("account", account)]));
    // The second row's text is the branch while a search is typed, with the letters that match marked. A parked work item's is its first question, otherwise the oldest call its headless sessions ask the person to allow, otherwise the sentence of its chain where the chain stopped, otherwise that a session of it waits for the machine, and otherwise the stage its chain runs, in short.
    const said = lineText(workItem, session, held.query !== "", machineAhead(workItem, held.headless, held.machine));
    const second = part("second", "");
    // After the text, how many decisions made without asking the person has not seen, the look not holding them, and how many reversals wait for a stage; then the setup's words while it runs and where it failed.
    second.append(
      marked(said.says === "branch" ? "says branch" : "says", said.text, said.says === "branch" ? markRanges(said.text, held.query) : []),
      part("decided", decisionMark(workItem, held.lastLook)),
      part(workItem.setup?.state === "failed" ? "setup failed" : "setup", setupMark(workItem)),
      part("badge", lineBadge(workItem, held.lastLook)),
      sealPlace("line", workItem.seal),
    );
    button.append(first, second);
    // A line of the archived screen opens no view: its press selects it.
    button.addEventListener("click", () => (name === "archived" ? select(workItem.id) : actions.openView(workItem.id)));
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
    // The screen's own work items, and of them the ones the search and the filter leave. The filter leaves every archived one.
    const all = own();
    const shown = matchWorkItems(all, held.query, name === "archived" ? "all" : held.filter);
    filter.value = held.filter;
    const head = name === "inbox" ? "Inbox" : name === "history" ? "History" : archivedHead(held.repositories.find((repository) => repository.id === held.archivedOf)?.name ?? "");
    word.textContent = head;
    piece("list").setAttribute("aria-label", head);
    // The inbox's sentence counts every work item, whatever is typed or chosen.
    const said = name === "inbox" ? inboxSummary(all.map(({ line }) => line)) : "";
    sentence.textContent = said;
    sentence.hidden = said === "";
    const looked = name === "inbox" ? held.lastLook : null;
    lastLooked.textContent = looked ? lastHere(looked.at, Date.now()) : "";
    lastLooked.hidden = !looked;
    match.textContent = held.query === "" ? "" : matchSentence(shown.length, all.length, held.query);
    match.hidden = held.query === "";
    empty.textContent = emptyList(name, all.length, shown.length);
    empty.hidden = empty.textContent === "";
    if (name === "inbox") {
      // A pinned work item stands first in its state's group.
      const groups = inboxGroups(pinnedFirst(shown));
      lines.replaceChildren(
        ...groups.flatMap((group) => {
          const heading = document.createElement("h2");
          heading.className = "caption";
          heading.append(part("word", group.heading), part("count", String(group.entries.length)));
          return [heading, listOf(group.entries)];
        }),
      );
      displayed = groups.flatMap((group) => group.entries).map(({ workItem }) => workItem.id);
    } else {
      // The history's lines stand in one list, the pinned ones first and then the one that finished last first, under no heading. So do the archived screen's, the one archived last first.
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
    line: lineButton,
  };
}
