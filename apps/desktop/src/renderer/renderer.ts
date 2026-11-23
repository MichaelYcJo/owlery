// The window: its connection to the daemon, which of its five screens is in
// front, the keys it reads, the "New work item" form with the plan and the
// fetch of a base it asks the daemon for and its choice to register a
// repository alone, and the
// menus of a work item and of a repository with what the press of each item
// does: the rename dialog, a work item's archive with the dialog that names
// the sessions it ends, its restore, its delete with the dialog that names
// what would be lost, its move into a group and out of it, and a
// repository's settings, its icon, the dialog of its new group, the list of
// the hidden ones, the screen of its archived work items and its removal,
// with its two choices to delete from disk, and the dialog that asks before
// the daemon ends, for a restart or for a complete quit, at a choice of the
// application menu. How a menu is drawn is ./menu. The theme, the appearance
// and their two controls are ./theme, and the choice of when the Mac is kept awake
// with its control is ./keep-awake. The sidebar, the list with its preview, a
// work item's view and the summary are a module each, and what each says and
// decides is a function of ./view.
import type { DaemonEnd, OwleryApi } from "../shared/ipc";
import { generateName } from "../shared/names";
import type { AgentState, ClientMessage, HeadlessInfo, Repository, ServerMessage, SessionInfo, WorkItem, WorkItemLoss } from "../shared/protocol";
import { listScreen, type ListScreen } from "./list";
import { initKeepAwake, showKeepAwake } from "./keep-awake";
import { menuOpen, openMenu } from "./menu";
import { byId, connected, connectedBy, held, request, send } from "./shared";
import { focusSearch, initSidebar, showSidebar, showStatus, tell, untell, type Front } from "./sidebar";
import { initSummary, pressMain, showSummary } from "./summary";
import { initTheme } from "./theme";
import {
  agentKind,
  archivalOf,
  asksFetch,
  BASE_ANSWER_MS,
  baseKey,
  baseMenu,
  baseSays,
  changesSince,
  commandKey,
  daemonEnding,
  daemonLists,
  daemonNotice,
  decisionLines,
  deleteChoice,
  deleteSays,
  deletionOf,
  hiddenRepositories,
  inboxKey,
  lateSays,
  lacksRecords,
  lossSections,
  menuKey,
  menuTarget,
  chainNotifications,
  notificationFor,
  parkNotifications,
  permissionNotifications,
  notificationOpens,
  PLAN_AWAITED,
  planAnswer,
  planLine,
  REGISTER_ONLY_SAYS,
  recordsDialog,
  recordsOf,
  registered,
  registerFields,
  removalChoice,
  removalOf,
  renameChoice,
  repositoryMenu,
  runningSessions,
  settingsBases,
  settingsFields,
  shownSetup,
  workItemFields,
  workItemMenu,
  unanswered,
  type BaseAnswer,
  type BaseChoice,
  type FormPlan,
  type MenuAction,
  type PlanAnswered,
  type RecordsPlanned,
  type Removal,
  type RenamePlanned,
  type StateFilter,
} from "./view";
import { closeFront, detachUnshown, dropClosed, dropHeadless, enterView, initView, leaveView, onStage, requestRefused, showPaneButtons, showTerminalColours, showView, startSize, takeAnswers, takeHeadless, takeSeal, takeStarted, write } from "./work-item-view";

declare global {
  interface Window {
    owlery: OwleryApi;
  }
}

// The Command key's place is the Control key's where the keyboard has none.
const MAC = navigator.platform.startsWith("Mac");

// The screen in front. None is before the daemon's `ready`, and it is kept nowhere else, so a reload opens on the summary or on the inbox.
let front: Front = null;
// The request the "New work item" form is waiting on.
let formRequest: number | undefined;
// The name the window generated when the form last opened. It names the work item where the name field leaves no letter or digit to name it by.
let formName = "";
// The form's latest plan: its request, the repository's text it was asked for, and what the daemon answered, or null until it answers. A daemon of an earlier build never answers.
let planRequest: number | undefined;
let planRepo = "";
let formPlan: FormPlan | null = null;
// The plans the daemon has not answered, so the error of one a later plan overtook stays out of the status line.
const plansAsked = new Set<number>();
// The base the person chose in the menu since the form opened.
let baseChoice: BaseChoice | null = null;
let planTimer: ReturnType<typeof setTimeout> | undefined;
// The bases the form asked the daemon to fetch since it opened, each under its `baseKey`: the base, the request, and what the form holds of the fetch, null once the wait for an answer has passed with none.
const baseAnswers = new Map<string, { base: string; requestId: number; answer: BaseAnswer | null }>();
// The fetches the daemon has not answered, of this opening and of the ones before, so the refusal of one stays out of the status line.
const basesAsked = new Set<number>();
// The waits for the answers of this opening's fetches.
const baseTimers = new Set<ReturnType<typeof setTimeout>>();
// The key of the base the person pressed Create with, and what the status line says, once the creation is answered, of a fetch of that base that was answered after the press.
let createdBase: string | undefined;
let createdSays = "";
// How long the form waits after a key before it asks for a plan. A plan took 28 ms in a clone of one branch and 130 ms beside 2,000 more, so keys closer together than this ask once, after the last of them. The rename dialog waits as long.
const PLAN_WAIT_MS = 150;
// The request of the rename the rename dialog is waiting on, and the work item the dialog is open on.
let renameRequest: number | undefined;
let renaming: number | undefined;
// The dialog's latest plan of the branch's rename: its request, and what the daemon answered, or null until it answers. The plans the daemon has not answered are kept as the form's are.
let renamePlanRequest: number | undefined;
let renamePlan: RenamePlanned | null = null;
const renamePlansAsked = new Set<number>();
let renamePlanTimer: ReturnType<typeof setTimeout> | undefined;

const screens: Record<Exclude<Front, null>, HTMLElement> = {
  summary: byId("summary-screen"),
  inbox: byId("inbox-screen"),
  history: byId("history-screen"),
  archived: byId("archived-screen"),
  view: byId("work-item-view"),
};
const workItemDialog = byId<HTMLDialogElement>("work-item-dialog");
const workItemForm = byId<HTMLFormElement>("work-item-form");
const repoField = byId<HTMLInputElement>("work-item-repo");
const titleField = byId<HTMLInputElement>("work-item-title");
const planPlace = byId("work-item-plan");
const branchPlace = byId("work-item-branch");
const worktreePlace = byId("work-item-worktree");
const setupPlace = byId("work-item-setup");
const baseField = byId<HTMLSelectElement>("work-item-base");
const baseStatePlace = byId("work-item-base-state");
const kindField = byId<HTMLSelectElement>("work-item-kind");
const formError = byId("work-item-error");
const createButton = byId<HTMLButtonElement>("work-item-create");
const renameDialog = byId<HTMLDialogElement>("rename-dialog");
const renameField = byId<HTMLInputElement>("rename-title");
const renameBranch = byId<HTMLInputElement>("rename-branch");
const renamePlanPlace = byId("rename-plan");
const renameError = byId("rename-error");
const renameButton = byId<HTMLButtonElement>("rename-submit");
const registerOnly = byId<HTMLInputElement>("work-item-register-only");
const settingsDialog = byId<HTMLDialogElement>("settings-dialog");
const settingsName = byId<HTMLInputElement>("settings-name");
const settingsBase = byId<HTMLSelectElement>("settings-base");
const iconDialog = byId<HTMLDialogElement>("icon-dialog");
const iconField = byId<HTMLInputElement>("icon-field");
const groupDialog = byId<HTMLDialogElement>("group-dialog");
const groupName = byId<HTMLInputElement>("group-name");
const reverseDialog = byId<HTMLDialogElement>("reverse-dialog");
const reverseMessage = byId<HTMLInputElement>("reverse-message");
const hiddenDialog = byId<HTMLDialogElement>("hidden-dialog");
const removeDialog = byId<HTMLDialogElement>("remove-dialog");
const sessionsDialog = byId<HTMLDialogElement>("sessions-dialog");
const deleteDialog = byId<HTMLDialogElement>("delete-dialog");
const daemonDialog = byId<HTMLDialogElement>("daemon-dialog");
const deleteForce = byId<HTMLInputElement>("delete-force");
const removeDelete = byId<HTMLInputElement>("remove-delete");
const removeForce = byId<HTMLInputElement>("remove-force");
const removeTrash = byId<HTMLInputElement>("remove-trash");
const recordsPlaceDialog = byId<HTMLDialogElement>("records-dialog");
const recordsGate = byId<HTMLInputElement>("records-gate");

/** A dialog that waits on the daemon's answer to one request: where its refusal is shown, and the button that sent it. */
interface Asking {
  dialog: HTMLDialogElement;
  error: HTMLElement;
  button: HTMLButtonElement;
}
const FORM: Asking = { dialog: workItemDialog, error: formError, button: createButton };
const SETTINGS: Asking = { dialog: settingsDialog, error: byId("settings-error"), button: byId<HTMLButtonElement>("settings-submit") };
const ICON: Asking = { dialog: iconDialog, error: byId("icon-error"), button: byId<HTMLButtonElement>("icon-submit") };
const GROUP: Asking = { dialog: groupDialog, error: byId("group-error"), button: byId<HTMLButtonElement>("group-submit") };
const REVERSE: Asking = { dialog: reverseDialog, error: byId("reverse-error"), button: byId<HTMLButtonElement>("reverse-submit") };
const REMOVE: Asking = { dialog: removeDialog, error: byId("remove-error"), button: byId<HTMLButtonElement>("remove-submit") };
const SESSIONS: Asking = { dialog: sessionsDialog, error: byId("sessions-error"), button: byId<HTMLButtonElement>("sessions-submit") };
const DELETE: Asking = { dialog: deleteDialog, error: byId("delete-error"), button: byId<HTMLButtonElement>("delete-submit") };
const RECORDS: Asking = { dialog: recordsPlaceDialog, error: byId("records-error"), button: byId<HTMLButtonElement>("records-submit") };
// The dialog that asks before the daemon ends waits on the main process's answer, not on the daemon's: the main process is the one that stops the daemon.
const DAEMON: Asking = { dialog: daemonDialog, error: byId("daemon-error"), button: byId<HTMLButtonElement>("daemon-submit") };
// The requests a dialog waits on, each with its dialog. An opening forgets the requests of the opening before it, so an answer that arrives late closes no dialog that opened since.
const asking = new Map<number, Asking>();
// The repository the settings dialog, the icon's dialog, the dialog of a new group and the removal's dialog are each open on.
let settingsOf: number | undefined;
let iconOf: number | undefined;
let groupOf: number | undefined;
// The decision the dialog that reverses one was opened on, with its work item.
let reversing: { workItemId: number; decisionId: number } | undefined;
let removing: number | undefined;
// What the removal's dialog names, which is what its request tells the daemon the person was told of.
let removal: Removal | undefined;
// The work item the dialog before an archive is open on, and the running sessions the dialog names, which is what its request tells the daemon the person was told of.
let archiving: number | undefined;
let archival: ReturnType<typeof archivalOf> | undefined;
// The losses the removal's dialog read, of the repository's work items, by each one's id, while its choice to delete them is taken, and the reads the daemon has not answered, each with its work item.
const removeLosses = new Map<number, WorkItemLoss>();
const removeLossAsked = new Map<number, number>();
// The removal whose answer moves the repository's folder to the Trash: its request, and the folder the dialog was open on.
let trashing: { requestId: number; folder: string } | undefined;
// The work item the delete dialog is open on, the loss the daemon answered with, or null until it answers, the read it waits on, and the running sessions the dialog names.
let deleting: number | undefined;
let deleteLoss: WorkItemLoss | null = null;
let deleteLossRequest: number | undefined;
let deletion: ReturnType<typeof archivalOf> | undefined;
// The repository the dialog of the records place is open on, and the broad gate command the person typed or the daemon proposed, which the field shows while a setup would write a `config.json`.
let recordsRepository: number | undefined;
let recordsCommand = "";
// Whether the person typed in the field since the dialog opened: a command the daemon proposes fills only a field nobody typed in.
let recordsTyped = false;
// The dialog's latest plan: its request and the command it was asked for, what the daemon answered, or null until it answers, and the command that answer is of. The plan the files were last drawn from is kept, so a key in the field redraws none of them.
let recordsPlanRequest: number | undefined;
let recordsAskedFor = "";
let recordsPlan: RecordsPlanned | null = null;
let recordsPlannedFor: string | null = null;
let recordsDrawn: RecordsPlanned | null | undefined;
let recordsPlanTimer: ReturnType<typeof setTimeout> | undefined;
// The registration the form waits on, with the folder it named, and the registration whose repository the lists did not hold when it was answered, with the repositories they held then and the time until which the `inbox` that follows the answer is awaited: that `inbox` lists the repository, and an answer that changed nothing is followed by none.
let registering: { requestId: number; folder: string } | undefined;
let registeredLate: { folder: string; before: readonly Repository[]; until: number } | undefined;
// How long after a registration's answer an `inbox` is read as the one that follows it. The daemon sends the two one after the other.
const REGISTERED_WAIT_MS = 1000;
// What the dialog that asks before the daemon ends is open for: a restart, or a complete quit.
let ending: DaemonEnd | undefined;
// The plan the settings dialog asked for, to list the repository's bases: its request, and what the daemon answered.
let settingsPlanRequest: number | undefined;
let settingsPlan: PlanAnswered | null = null;

const lists: Record<"inbox" | "history" | "archived", ListScreen> = {
  inbox: listScreen("inbox", { openView, filter, restore }, MAC),
  history: listScreen("history", { openView, filter, restore }, MAC),
  archived: listScreen("archived", { openView, filter, restore }, MAC),
};

/** The list on screen, where the inbox screen, the history screen or the archived screen is in front. */
function listInFront(): ListScreen | undefined {
  return front === "inbox" || front === "history" || front === "archived" ? lists[front] : undefined;
}

/** Shows one of the five screens beside the sidebar, hides the other four, and has the sidebar mark it. */
function bringToFront(screen: Exclude<Front, null>): void {
  front = screen;
  for (const [name, element] of Object.entries(screens)) element.hidden = name !== screen;
  showSidebar(front);
}

/** Puts a work item's view in front: of any screen, the view of another work item among them. Where `pane` is given, that pane is the one in front of the view. */
function openView(workItemId: number, pane?: number): void {
  enterView(workItemId, pane);
  bringToFront("view");
  showView();
}

/** Puts the inbox screen or the history screen in front. A work item whose view the person leaves is the selected one, and the keyboard is on its line. */
function openList(screen: "inbox" | "history"): void {
  const left = leaveView();
  bringToFront(screen);
  lists[screen].show();
  if (left === undefined) return;
  lists[screen].select(left);
  lists[screen].focusLine(lists[screen].selected());
}

/** Puts the screen of a repository's archived work items in front, the one archived last first. */
function openArchived(repositoryId: number): void {
  if (!repositoryOf(repositoryId)) return;
  leaveView();
  held.archivedOf = repositoryId;
  bringToFront("archived");
  lists.archived.show();
}

/** Puts the summary screen in front, with the changes of this load. */
function openSummary(): void {
  leaveView();
  bringToFront("summary");
  showSummary();
}

function openScreen(screen: "summary" | "inbox" | "history"): void {
  // The sidebar is displayed before the daemon's `ready`, and no screen is.
  if (!held.ready) return;
  if (screen === "summary") openSummary();
  else openList(screen);
}

/** Draws again what the search and the filter narrow: the sidebar's work items and the list in front. */
function showNarrowed(): void {
  showSidebar();
  listInFront()?.show();
}

function filter(state: StateFilter): void {
  held.filter = state;
  showNarrowed();
}

/** Whether a dialog of the page is open, any of them, or a menu stands in the page: a repository's or a work item's (./menu), or a pane's while it is open (./work-item-view). The window reads none of its keys then. */
function dialogOpen(): boolean {
  return document.querySelector('dialog[open], [role="menu"]') !== null;
}

/** Acts on a key pressed with the Command key, on every screen: K puts the focus in the search field, N opens the "New work item" form, and W closes the pane in front. The key is kept from the terminal whatever it did. */
function onCommandKey(event: KeyboardEvent): void {
  const key = commandKey({ code: event.code, meta: event.metaKey, ctrl: event.ctrlKey, alt: event.altKey, shift: event.shiftKey }, { mac: MAC, dialogOpen: dialogOpen(), menuOpen: menuOpen() });
  if (key === null) return;
  event.preventDefault();
  event.stopPropagation();
  if (key === "search") focusSearch();
  else if (key === "new") openWorkItemForm();
  else closeFront();
}

/**
 * Acts on a key of a list. On the inbox screen and the history screen J and K
 * move the selection and Enter opens the selected work item's view. On the
 * archived screen J and K move the selection and Enter does nothing: an
 * archived work item has no view. On the summary screen Enter presses the
 * main control, read under the same conditions, and J and K do nothing.
 */
function onKey(event: KeyboardEvent): void {
  const target = event.target instanceof Element ? event.target : null;
  const key = inboxKey(
    { code: event.code, modified: event.ctrlKey || event.metaKey || event.altKey || event.shiftKey },
    {
      inboxInFront: front === "summary" || front === "inbox" || front === "history" || front === "archived",
      dialogOpen: dialogOpen(),
      menuOpen: menuOpen(),
      inField: target?.closest("input, textarea, select, [contenteditable]") != null,
      onControl: target?.closest("button, a") != null,
    },
  );
  if (key === null) return;
  if (front === "summary") {
    if (key !== "open") return;
    event.preventDefault();
    pressMain();
    return;
  }
  const list = listInFront();
  if (!list) return;
  event.preventDefault();
  if (key !== "open") list.move(key);
  else if (front !== "archived" && list.selected() !== undefined) openView(list.selected() as number);
}

function forget(dialog: HTMLDialogElement): void {
  for (const [requestId, known] of asking) if (known.dialog === dialog) asking.delete(requestId);
}

/** Opens a dialog that waits on a request, with no refusal shown and its button on. Nothing opens over another dialog. */
function opened(of: Asking): boolean {
  if (dialogOpen()) return false;
  forget(of.dialog);
  of.error.textContent = "";
  of.button.disabled = false;
  of.dialog.showModal();
  return true;
}

/** Sends a dialog's request. One request per answer: the dialog's button stays off until the daemon answers. */
function ask(of: Asking, message: (requestId: number) => ClientMessage): void {
  const requestId = request();
  forget(of.dialog);
  asking.set(requestId, of);
  of.error.textContent = "";
  of.button.disabled = true;
  send(message(requestId));
}

/** Takes the daemon's answer to a dialog's request: `done` closes the dialog, and a refusal is shown in it. It answers whether the dialog took the answer: one that closed meanwhile takes none. */
function answered(requestId: number, refusal: string | null): boolean {
  const of = asking.get(requestId);
  if (!of) return false;
  asking.delete(requestId);
  if (!of.dialog.open) return false;
  if (refusal === null) {
    of.dialog.close();
  } else {
    of.error.textContent = refusal;
    of.button.disabled = false;
  }
  return true;
}

/** Whether a dialog's request is with the daemon, unanswered. Its button stays off meanwhile, whatever the dialog's own choices say. */
function waiting(of: Asking): boolean {
  return [...asking.values()].includes(of);
}

/** The lines a dialog names, each whole on a line of a list. */
function namedLines(lines: readonly string[], whole = false): HTMLUListElement {
  const list = document.createElement("ul");
  list.className = whole ? "named whole" : "named";
  list.append(
    ...lines.map((line) => {
      const item = document.createElement("li");
      const words = document.createElement("span");
      words.textContent = line;
      item.append(words);
      return item;
    }),
  );
  return list;
}

/** What a dialog draws of a loss: a section for each kind of thing it names, with its heading, its lines, each read whole, and how many more there are where the list is cut. */
function lossParts(loss: WorkItemLoss): HTMLElement[] {
  return lossSections(loss).map(({ caption, lines, more }) => {
    const section = document.createElement("section");
    const head = document.createElement("h3");
    head.className = "caption";
    head.textContent = caption;
    section.append(head, namedLines(lines, true));
    if (more !== "") {
      const rest = document.createElement("p");
      rest.className = "more";
      rest.textContent = more;
      section.append(rest);
    }
    return section;
  });
}

function repositoryOf(id: number | undefined): Repository | undefined {
  return held.repositories.find((known) => known.id === id);
}

/** A button of a repository's row in the sidebar, as it is drawn now: the one that folds it, its "+" or its "…". */
function rowButton(repositoryId: number, selector: ".fold" | ".repository-add" | ".repository-menu"): HTMLElement | null {
  return document.querySelector<HTMLElement>(`#repositories section[data-repository="${repositoryId}"] ${selector}`);
}

/** The repository's row an element is inside, where it is inside one: the repository's id, and which of the row's buttons the element is. */
function rowOf(element: Element | null): { repositoryId: number; button: ".fold" | ".repository-add" | ".repository-menu" } | null {
  const row = element?.closest<HTMLElement>(".repository-row");
  const id = row?.parentElement?.dataset.repository;
  if (!row || id === undefined) return null;
  const button = element?.closest(".repository-add") ? ".repository-add" : element?.closest(".repository-menu") ? ".repository-menu" : ".fold";
  return { repositoryId: Number(id), button };
}

/** The line of a work item under an element, where one is drawn there: in the sidebar's repositories, or in a list. */
function lineIn(within: Element, workItemId: number): HTMLElement | null {
  return within.querySelector<HTMLElement>(`button[data-work-item="${workItemId}"]`);
}

/** The line of the sidebar or of a list that an element is, or is inside. A line of the summary screen is none: it has no menu. */
function lineOf(element: Element | null): { line: HTMLElement; within: Element; workItemId: number } | null {
  const line = element?.closest<HTMLElement>("button[data-work-item]") ?? null;
  const within = line?.closest("#repositories, .lines") ?? null;
  return line && within ? { line, within, workItemId: Number(line.dataset.workItem) } : null;
}

/** Does what the press of a menu's item says. An opening that fails is said in the status line. */
function pressMenu(action: MenuAction): void {
  switch (action.do) {
    case "rename":
      openRename(action.id);
      return;
    case "open":
      void window.owlery.openFolder(action.folder, action.app).then((failure) => {
        if (failure !== null) tell(failure);
      });
      return;
    case "copy":
      void window.owlery.copyText(action.text);
      return;
    case "set":
      send({ type: "setWorkItem", requestId: request(), id: action.id, pinned: action.pinned, muted: action.muted, groupId: action.groupId });
      return;
    case "settings":
      openSettings(action.id);
      return;
    case "icon":
      openIcon(action.id);
      return;
    case "records":
      openRecords(action.id);
      return;
    case "hide":
      send({ type: "setRepository", requestId: request(), id: action.id, hidden: true });
      return;
    case "remove":
      openRemove(action.id);
      return;
    case "archive":
      archive(action.id);
      return;
    case "delete":
      openDelete(action.id);
      return;
    case "restore":
      restore(action.id);
      return;
    case "archived":
      openArchived(action.id);
      return;
    case "group":
      openGroup(action.id);
      return;
  }
}

/** Opens a repository's menu with its corner at `at`. The keyboard returns to the button of the repository's row it was on, as `back` finds it once the sidebar drew the row anew. */
function openRepositoryMenu(repositoryId: number, at: { x: number; y: number }, back: () => HTMLElement | null): void {
  const repository = repositoryOf(repositoryId);
  if (!repository) return;
  openMenu(`Menu of ${repository.name}`, repositoryMenu(repository, held.apps), at, pressMenu, back);
}

/** Opens a work item's menu with its corner at `at`: the menu of an archived work item for a line of the archived screen. The keyboard returns to the work item's line under `within`, though the line was drawn anew meanwhile. */
function openWorkItemMenu(workItemId: number, at: { x: number; y: number }, within: Element): void {
  const workItem = [...held.workItems, ...held.archived].find((known) => known.id === workItemId);
  if (!workItem) return;
  openMenu(`Menu of ${workItem.title}`, workItemMenu(workItem, held.apps, repositoryOf(workItem.repoId)?.groups ?? []), at, pressMenu, () => lineIn(within, workItemId));
}

/** Opens the menu of a work item's line, or of a repository's row, at a press of the right button on it, and at a press with the Control key, which raises the same event. */
function onContextMenu(event: MouseEvent): void {
  const target = event.target instanceof Element ? event.target : null;
  const at = { x: event.clientX, y: event.clientY };
  const on = lineOf(target);
  if (on) {
    event.preventDefault();
    openWorkItemMenu(on.workItemId, at, on.within);
    return;
  }
  const row = rowOf(target);
  if (!row) return;
  event.preventDefault();
  openRepositoryMenu(row.repositoryId, at, () => rowButton(row.repositoryId, row.button));
}

/**
 * Opens a menu at its key: for the line or the repository's row the
 * keyboard is on, and otherwise for the selected line of the list in front.
 * The menu opens under the line or the row.
 */
function onMenuKey(event: KeyboardEvent): void {
  const target = event.target instanceof Element ? event.target : null;
  const pressed = { code: event.code, shift: event.shiftKey, modified: event.ctrlKey || event.metaKey || event.altKey };
  // A terminal reads its keys in a field of its own.
  if (!menuKey(pressed, { dialogOpen: dialogOpen(), menuOpen: menuOpen(), inField: target?.closest("input, textarea, select, [contenteditable]") != null })) return;
  const on = lineOf(target);
  const row = rowOf(target);
  const of = menuTarget({ workItem: on?.workItemId, repository: row?.repositoryId }, listInFront()?.selected());
  if (of === null) return;
  if ("repository" in of) {
    const button = row?.button ?? ".fold";
    const box = rowButton(of.repository, ".fold")?.getBoundingClientRect();
    if (!box) return;
    event.preventDefault();
    openRepositoryMenu(of.repository, { x: box.left + box.height, y: box.bottom }, () => rowButton(of.repository, button));
    return;
  }
  const list = front === "inbox" || front === "history" || front === "archived" ? screens[front] : null;
  const within = on?.within ?? list;
  const line = on?.line ?? listInFront()?.line(of.workItem);
  if (!within || !line) return;
  event.preventDefault();
  const box = line.getBoundingClientRect();
  openWorkItemMenu(of.workItem, { x: box.left + box.height, y: box.bottom }, within);
}

/** Draws what the rename dialog holds of its plan: whether the branch can be renamed too, and the branch it would get or why it keeps its name. */
function showRenamePlan(): void {
  const choice = renameChoice(renamePlan);
  renameBranch.disabled = !choice.enabled;
  if (!choice.enabled) renameBranch.checked = false;
  renamePlanPlace.textContent = choice.says;
}

/** Asks the daemon what a rename of the branch after the name typed would give, now. With no name it asks nothing. */
function askRenamePlan(): void {
  clearTimeout(renamePlanTimer);
  renamePlanTimer = undefined;
  renamePlan = null;
  if (renaming === undefined || renameField.value.trim() === "") {
    renamePlanRequest = undefined;
  } else {
    renamePlanRequest = request();
    renamePlansAsked.add(renamePlanRequest);
    send({ type: "planRename", requestId: renamePlanRequest, id: renaming, title: renameField.value });
  }
  showRenamePlan();
}

/** Takes the daemon's answer to a rename's plan, or its refusal, where it answers the dialog's latest plan. It answers whether the message was of such a plan at all. */
function takeRenamePlan(requestId: number, answered: RenamePlanned): boolean {
  const of = planAnswer(renamePlanRequest, renamePlansAsked, requestId);
  renamePlansAsked.delete(requestId);
  if (of === "latest") {
    renamePlan = answered;
    showRenamePlan();
  }
  return of !== "other";
}

/** Opens the rename dialog on a work item, with its name selected in the field. */
function openRename(workItemId: number): void {
  const workItem = held.workItems.find((known) => known.id === workItemId);
  if (!workItem || dialogOpen()) return;
  renaming = workItemId;
  renameRequest = undefined;
  renameField.value = workItem.title;
  renameBranch.checked = false;
  renameError.textContent = "";
  renameButton.disabled = false;
  renameDialog.showModal();
  renameField.select();
  askRenamePlan();
}

/** Sends the rename the dialog holds: the name typed, and whether the branch is renamed too. The daemon refuses an empty name. */
function rename(): void {
  if (renaming === undefined) return;
  renameRequest = request();
  renameError.textContent = "";
  // One rename per answer: the button stays off until the daemon answers.
  renameButton.disabled = true;
  send({ type: "renameWorkItem", requestId: renameRequest, id: renaming, title: renameField.value, branch: renameBranch.checked && !renameBranch.disabled });
}

/** The last part of a folder's path, which names a repository a person gave no name. */
function lastPart(folder: string): string {
  return folder.split("/").filter(Boolean).at(-1) ?? folder;
}

/** Draws the settings dialog's menu of bases, from the plan the dialog holds, with `value` chosen where the menu lists it. */
function showSettingsBases(value: string): void {
  const menu = settingsBases(settingsPlan, repositoryOf(settingsOf)?.defaultBase ?? null);
  const options = (bases: readonly string[]): HTMLOptionElement[] => bases.map((base) => new Option(base, base));
  const group = (label: string, bases: readonly string[]): HTMLOptGroupElement[] => {
    if (bases.length === 0) return [];
    const element = document.createElement("optgroup");
    element.label = label;
    element.append(...options(bases));
    return [element];
  };
  settingsBase.replaceChildren(new Option("The repository's default branch", ""), ...group("Local", menu.local), ...group("Remote", menu.remote));
  settingsBase.value = ["", ...menu.local, ...menu.remote].includes(value) ? value : menu.value;
}

/** Opens a repository's settings: the name a person gave it, and the base of its new work items, in a menu of the bases the daemon is asked for. */
function openSettings(repositoryId: number): void {
  const repository = repositoryOf(repositoryId);
  if (!repository || !opened(SETTINGS)) return;
  settingsOf = repositoryId;
  settingsName.value = repository.customName ?? "";
  // An empty name gives the repository the last part of its folder as its name.
  settingsName.placeholder = lastPart(repository.folder);
  settingsPlan = null;
  showSettingsBases(repository.defaultBase ?? "");
  settingsName.select();
  // A plan lists the repository's bases as the form's menu lists them, and creates nothing.
  settingsPlanRequest = request();
  send({ type: "planWorkItem", requestId: settingsPlanRequest, repo: repository.folder, title: "" });
}

/** Takes the daemon's answer to the settings dialog's plan, or its refusal, which the dialog shows. It answers whether the message was of that plan. */
function takeSettingsPlan(requestId: number, plan: PlanAnswered): boolean {
  if (requestId !== settingsPlanRequest) return false;
  settingsPlanRequest = undefined;
  if (!settingsDialog.open) return true;
  settingsPlan = plan;
  // The base a person chose while the daemon was asked stays chosen.
  showSettingsBases(settingsBase.value);
  if ("error" in plan) SETTINGS.error.textContent = plan.error;
  return true;
}

/** Sends what the settings dialog changed, and closes it where it changed nothing. */
function saveSettings(): void {
  const repository = repositoryOf(settingsOf);
  if (!repository) return;
  const fields = settingsFields(repository, settingsName.value, settingsBase.value);
  if (Object.keys(fields).length === 0) settingsDialog.close();
  else ask(SETTINGS, (requestId) => ({ type: "setRepository", requestId, id: repository.id, ...fields }));
}

/** Opens the dialog that takes a repository's icon, with the one it has selected in the field. */
function openIcon(repositoryId: number): void {
  const repository = repositoryOf(repositoryId);
  if (!repository || !opened(ICON)) return;
  iconOf = repositoryId;
  iconField.value = repository.icon ?? "";
  iconField.select();
}

/** Draws the list of the hidden repositories, each with the button that shows it again, and closes the dialog where none is hidden any more. */
function showHidden(): void {
  const { hidden } = hiddenRepositories(held.repositories);
  if (hidden.length === 0 && hiddenDialog.open) hiddenDialog.close();
  byId("hidden-list").replaceChildren(
    ...hidden.map((repository) => {
      const name = document.createElement("span");
      name.textContent = repository.name;
      // Two repositories of one name are told apart by their folders.
      name.title = repository.folder;
      const show = document.createElement("button");
      show.type = "button";
      show.className = "quiet";
      show.textContent = "Show";
      show.addEventListener("click", () => send({ type: "setRepository", requestId: request(), id: repository.id, hidden: false }));
      const item = document.createElement("li");
      item.append(name, show);
      return item;
    }),
  );
}

/** Opens the dialog that takes the name of a repository's new group, with an empty field. */
function openGroup(repositoryId: number): void {
  const repository = repositoryOf(repositoryId);
  if (!repository || !opened(GROUP)) return;
  groupOf = repositoryId;
  byId("group-head").textContent = `New group in ${repository.name}`;
  groupName.value = "";
  groupName.focus();
}

/**
 * Opens the dialog that takes the message a person reverses a decision
 * with, as a press of "Reverse" on the decision's line in its work item's
 * view asks. The dialog names the decision, and its field is empty. Nothing
 * opens for a decision the window no longer lists as standing.
 */
function openReverse(workItemId: number, decisionId: number): void {
  const workItem = held.workItems.find((item) => item.id === workItemId);
  const line = workItem && decisionLines(workItem, Date.now()).find((listed) => listed.id === decisionId);
  if (!line || line.reversed !== null || !opened(REVERSE)) return;
  reversing = { workItemId, decisionId };
  byId("reverse-decision").textContent = `${line.kind}: ${line.says}`;
  reverseMessage.value = "";
  reverseMessage.focus();
}

function openHidden(): void {
  if (dialogOpen()) return;
  showHidden();
  hiddenDialog.showModal();
}

/**
 * Draws what the removal's dialog names, from the daemon's lists as they are
 * now: the repository, each work item it holds and each running session,
 * and its two choices as ./view's `removalChoice` has them. Where the
 * choice to delete the work items is taken, it asks the daemon for the loss
 * of each work item it holds none of, and names each loss under its work
 * item. It closes the dialog where the daemon no longer keeps the
 * repository.
 */
function showRemove(): void {
  const repository = repositoryOf(removing);
  if (!repository) {
    if (removeDialog.open) removeDialog.close();
    return;
  }
  removal = removalOf(repository, held.workItems, held.archived, held.sessions, held.headless, held.paneKinds);
  byId("remove-head").textContent = `Remove ${repository.name} from Owlery`;
  const list = (id: string, lines: readonly string[]): void => {
    const section = byId(id);
    section.hidden = lines.length === 0;
    section.querySelector("ul")?.replaceChildren(
      ...lines.map((line) => {
        const item = document.createElement("li");
        const words = document.createElement("span");
        words.textContent = line;
        item.append(words);
        return item;
      }),
    );
  };
  list("remove-work-items", removal.workItems.map(({ title, archived }) => (archived ? `${title} (archived)` : title)));
  list("remove-sessions", removal.sessions);
  const deletes = removeDelete.checked && removal.workItems.length > 0;
  if (deletes) {
    for (const { id } of removal.workItems) {
      if (removeLosses.has(id) || [...removeLossAsked.values()].includes(id)) continue;
      const requestId = request();
      removeLossAsked.set(requestId, id);
      send({ type: "readLoss", requestId, id });
    }
  }
  const losses = removal.workItems.map(({ id }) => removeLosses.get(id));
  // A choice that cannot be taken is not taken.
  if (!removalChoice(removal.workItems.length, deletes, false, losses, false).trashEnabled) removeTrash.checked = false;
  const choice = removalChoice(removal.workItems.length, deletes, removeTrash.checked, losses, removeForce.checked);
  byId("remove-says").textContent = choice.says;
  byId("remove-delete-label").hidden = !choice.deleteShown;
  byId("remove-force-label").hidden = !choice.forceShown;
  removeTrash.disabled = !choice.trashEnabled;
  REMOVE.button.disabled = !choice.enabled || waiting(REMOVE);
  const named = byId("remove-losses");
  named.hidden = !deletes;
  named.replaceChildren(
    ...(deletes ? removal.workItems : []).flatMap(({ id, title }) => {
      const head = document.createElement("h3");
      head.className = "work-item";
      head.textContent = title;
      const loss = removeLosses.get(id) ?? null;
      const says = document.createElement("p");
      says.className = "says";
      says.textContent = deleteSays(loss);
      return [head, says, ...(loss === null ? [] : lossParts(loss))];
    }),
  );
}

/** Forgets the losses the removal's dialog read, and its choice to force, so each is read and chosen anew. */
function forgetRemoveLosses(): void {
  removeLosses.clear();
  removeLossAsked.clear();
  removeForce.checked = false;
}

/** Takes the daemon's answer to a read the removal's dialog asked for: a loss, which the dialog then names, or a refusal, which it shows. A read of a work item the dialog no longer names, such as one a removal deleted before it was refused, is dropped: its answer is "no work item", which would take the place of the removal's own refusal. It answers whether the read was the dialog's. */
function takeRemoveLoss(requestId: number, answered: { loss: WorkItemLoss } | { error: string }): boolean {
  const id = removeLossAsked.get(requestId);
  if (id === undefined) return false;
  removeLossAsked.delete(requestId);
  if (!removeDialog.open || !removeDelete.checked || !removal?.workItems.some((workItem) => workItem.id === id)) return true;
  if ("error" in answered) {
    REMOVE.error.textContent = answered.error;
    return true;
  }
  removeLosses.set(id, answered.loss);
  showRemove();
  return true;
}

/** Opens the dialog of a repository's removal, with the keyboard on the button that removes nothing. */
function openRemove(repositoryId: number): void {
  if (!repositoryOf(repositoryId) || !opened(REMOVE)) return;
  removing = repositoryId;
  // Both choices are open at each opening, and no loss is held from the one before.
  removeDelete.checked = false;
  removeTrash.checked = false;
  forgetRemoveLosses();
  showRemove();
  byId("remove-cancel").focus();
}

/**
 * Sends the removal the dialog holds, with the work items and the running
 * sessions it named, so the daemon removes and ends what the person read
 * and nothing else. Where the choice to delete the work items is taken, it
 * carries the stamp of each loss the dialog named and whether the deletes
 * are forced. Where the Trash's choice is taken, the repository's folder is
 * moved there once the daemon answers that the repository is removed, and
 * not before.
 */
function remove(): void {
  const told = removal;
  const id = removing;
  const folder = repositoryOf(id)?.folder;
  if (told === undefined || id === undefined || folder === undefined) return;
  const workItems = told.workItems.map((workItem) => workItem.id);
  const chosen = removeDelete.checked && workItems.length > 0 ? { delete: deletionOf(workItems, removeLosses, removeForce.checked) } : {};
  const trash = removeTrash.checked && !removeTrash.disabled;
  ask(REMOVE, (requestId) => {
    trashing = trash ? { requestId, folder } : undefined;
    return { type: "removeRepository", requestId, id, workItems, running: told.running, ...chosen };
  });
}

/**
 * Draws the delete dialog, from the daemon's lists as they are now and from
 * the loss the daemon answered with: the work item, what ./view's
 * `deleteSays` says of the loss, each thing the loss names, each running
 * session, and the two controls as `deleteChoice` has them. It closes the
 * dialog where the window's lists no longer hold the work item.
 */
function showDelete(): void {
  const workItem = [...held.workItems, ...held.archived].find((known) => known.id === deleting);
  if (!workItem) {
    if (deleteDialog.open) deleteDialog.close();
    return;
  }
  deletion = archivalOf(workItem, held.sessions, held.headless, held.paneKinds);
  byId("delete-head").textContent = `Delete ${workItem.title}`;
  byId("delete-says").textContent = deleteSays(deleteLoss);
  byId("delete-loss").replaceChildren(...(deleteLoss === null ? [] : lossParts(deleteLoss)));
  const section = byId("delete-sessions");
  section.hidden = deletion.sessions.length === 0;
  section.querySelector("ul")?.replaceWith(namedLines(deletion.sessions));
  const choice = deleteChoice(deleteLoss, deleteForce.checked);
  byId("delete-force-label").hidden = !choice.forceShown;
  DELETE.button.disabled = !choice.enabled || waiting(DELETE);
}

/** Asks the daemon what a delete of the dialog's work item would lose. Until it answers the dialog names no loss, its choice to force is not taken, and its button is off. */
function readDeleteLoss(): void {
  const id = deleting;
  if (id === undefined) return;
  deleteLoss = null;
  deleteForce.checked = false;
  deleteLossRequest = request();
  send({ type: "readLoss", requestId: deleteLossRequest, id });
  showDelete();
}

/** Takes the daemon's answer to the read the delete dialog waits on: a loss, which the dialog then names, or a refusal, which it shows. It answers whether the read was the dialog's. */
function takeDeleteLoss(requestId: number, answered: { loss: WorkItemLoss } | { error: string }): boolean {
  if (requestId !== deleteLossRequest) return false;
  deleteLossRequest = undefined;
  if (!deleteDialog.open) return true;
  if ("error" in answered) {
    DELETE.error.textContent = answered.error;
    return true;
  }
  deleteLoss = answered.loss;
  showDelete();
  return true;
}

/** Opens the delete dialog of a work item, archived or not, with the keyboard on the button that deletes nothing, and asks the daemon what the delete would lose. */
function openDelete(workItemId: number): void {
  if (![...held.workItems, ...held.archived].some((known) => known.id === workItemId) || !opened(DELETE)) return;
  deleting = workItemId;
  readDeleteLoss();
  byId("delete-cancel").focus();
}

/** Sends the delete the dialog holds, with the stamp of the loss it names, whether "Force delete" is checked, and the running sessions it named, so the daemon deletes what the person read and nothing else. */
function deleteNamed(): void {
  const told = deletion;
  const id = deleting;
  const loss = deleteLoss;
  if (told === undefined || id === undefined || loss === null) return;
  const force = deleteChoice(loss, deleteForce.checked).forceShown && deleteForce.checked;
  ask(DELETE, (requestId) => ({ type: "deleteWorkItem", requestId, id, stamp: loss.stamp, force, running: told.running }));
}

/**
 * Draws the dialog of the records place, from the daemon's lists as they are
 * now and from the plan the daemon answered with, in the words of ./view's
 * `recordsDialog`: what is out of scope, the commit, each file with its
 * text, the field of the broad gate command, and the buttons. It closes the
 * dialog where the window's lists no longer hold the repository.
 */
function showRecords(): void {
  const repository = repositoryOf(recordsRepository);
  if (!repository) {
    if (recordsPlaceDialog.open) recordsPlaceDialog.close();
    return;
  }
  const words = recordsDialog(repository, recordsPlan, recordsCommand, recordsPlannedFor);
  const say = (id: string, text: string): void => {
    byId(id).textContent = text;
    byId(id).hidden = text === "";
  };
  byId("records-head").textContent = words.head;
  byId("records-scope").textContent = words.scope;
  say("records-commit", words.commit);
  say("records-blocked", words.blocked);
  byId("records-holds").hidden = words.holds.length === 0;
  byId("records-holds").querySelector("ul")?.replaceWith(namedLines(words.holds, true));
  if (recordsDrawn !== recordsPlan) {
    recordsDrawn = recordsPlan;
    byId("records-files").replaceChildren(
      ...words.files.map((file) => {
        const part = document.createElement(file.text === null ? "p" : "section");
        if (file.text === null) {
          part.className = "says";
          part.textContent = file.says;
          return part;
        }
        const path = document.createElement("span");
        path.className = "path";
        path.textContent = file.path;
        const text = document.createElement("pre");
        text.textContent = file.text;
        part.append(path, text);
        return part;
      }),
    );
  }
  byId("records-gate-label").hidden = !words.gate.shown;
  byId("records-gate-name").textContent = words.gate.label;
  recordsGate.disabled = !words.gate.enabled;
  // The field keeps what the person types, and shows the key's own value where the file stands.
  if (recordsGate.value !== words.gate.value) recordsGate.value = words.gate.value;
  say("records-gate-says", words.gate.shown ? words.gate.says : "");
  RECORDS.button.hidden = !words.submit.shown;
  RECORDS.button.textContent = words.submit.label;
  RECORDS.button.disabled = !words.submit.enabled || waiting(RECORDS);
  byId("records-cancel").textContent = words.cancel;
}

/** Asks the daemon what a setup of the dialog's repository would write, with the command the dialog holds. Until it answers, the plan the dialog shows is of another command, and its button is off. */
function askRecordsPlan(): void {
  const id = recordsRepository;
  if (id === undefined) return;
  recordsPlanRequest = request();
  recordsAskedFor = recordsCommand;
  send({ type: "planRecords", requestId: recordsPlanRequest, id, broadGate: recordsCommand });
}

/**
 * Takes the daemon's answer to the plan the dialog of the records place
 * waits on: a plan, which the dialog then shows, or a refusal. A command the
 * daemon proposes fills the field where the person typed none, and the plan
 * is asked again for it. It answers whether the plan was the dialog's.
 */
function takeRecordsPlan(requestId: number, answered: RecordsPlanned): boolean {
  if (requestId !== recordsPlanRequest) return false;
  recordsPlanRequest = undefined;
  if (!recordsPlaceDialog.open) return true;
  recordsPlan = answered;
  recordsPlannedFor = recordsAskedFor;
  if (!("error" in answered) && answered.proposedBroadGate !== null && !recordsTyped && recordsCommand === "") {
    recordsCommand = answered.proposedBroadGate;
    askRecordsPlan();
  }
  showRecords();
  return true;
}

/** Opens the dialog of the records place on a repository, with the keyboard on the button that writes nothing, and asks the daemon for the plan. A repository of a daemon of an earlier build has no such dialog. */
function openRecords(repositoryId: number): void {
  const repository = repositoryOf(repositoryId);
  if (!repository || recordsOf(repository) === null || !opened(RECORDS)) return;
  recordsRepository = repositoryId;
  recordsCommand = "";
  recordsTyped = false;
  recordsPlan = null;
  recordsPlannedFor = null;
  recordsDrawn = undefined;
  askRecordsPlan();
  showRecords();
  byId("records-cancel").focus();
}

/** Sends the setup the dialog holds, with the stamp of the plan it shows, so the daemon writes what the person read and nothing else. */
function setUpRecordsPlace(): void {
  const repository = repositoryOf(recordsRepository);
  const plan = recordsPlan;
  if (!repository || plan === null || "error" in plan || !recordsDialog(repository, plan, recordsCommand, recordsPlannedFor).submit.enabled) return;
  const command = recordsCommand;
  ask(RECORDS, (requestId) => ({ type: "setUpRecords", requestId, id: repository.id, broadGate: command, stamp: plan.stamp }));
}

/** Opens the dialog of the records place for the repository a registration was answered for, where it lacks a part of the place. Where the lists hold no repository at the folder typed, the `inbox` that follows the answer lists the one the daemon added, and `takeLists` opens the dialog then. */
function afterRegistration(folder: string): void {
  const found = registered(folder, held.repositories, held.repositories);
  if (!found) registeredLate = { folder, before: held.repositories, until: Date.now() + REGISTERED_WAIT_MS };
  else if (lacksRecords(found)) openRecords(found.id);
}

/** After a refusal of what a dialog sent: the delete dialog and the removal's dialog each read anew what a delete would lose, since a refusal says the loss the person read may no longer stand. The dialog of the records place asks for its plan anew, for the same reason. */
function readAgain(): void {
  if (recordsPlaceDialog.open) askRecordsPlan();
  if (deleteDialog.open) readDeleteLoss();
  if (removeDialog.open) {
    forgetRemoveLosses();
    showRemove();
  }
}

/** Draws what the dialog before an archive names, from the daemon's lists as they are now: the work item, and each of its running sessions. It closes the dialog where the window's list no longer holds the work item. */
function showArchive(): void {
  const workItem = held.workItems.find((known) => known.id === archiving);
  if (!workItem) {
    if (sessionsDialog.open) sessionsDialog.close();
    return;
  }
  archival = archivalOf(workItem, held.sessions, held.headless, held.paneKinds);
  byId("sessions-head").textContent = `Archive ${workItem.title}`;
  const section = byId("sessions-list");
  section.hidden = archival.sessions.length === 0;
  section.querySelector("ul")?.replaceChildren(
    ...archival.sessions.map((line) => {
      const item = document.createElement("li");
      const words = document.createElement("span");
      words.textContent = line;
      item.append(words);
      return item;
    }),
  );
}

/**
 * Archives a work item, at the press of its menu's item. Where none of its
 * sessions runs, the archive is sent at once: a restore undoes it. Where one
 * does, a dialog names each first, with the keyboard on the button that
 * ends nothing.
 */
function archive(workItemId: number): void {
  const workItem = held.workItems.find((known) => known.id === workItemId);
  if (!workItem) return;
  const told = archivalOf(workItem, held.sessions, held.headless, held.paneKinds);
  if (told.sessions.length === 0) {
    send({ type: "archiveWorkItem", requestId: request(), id: workItemId, running: told.running });
    return;
  }
  if (!opened(SESSIONS)) return;
  archiving = workItemId;
  showArchive();
  byId("sessions-cancel").focus();
}

/** Sends the archive the dialog holds, with the running sessions it named, so the daemon ends the sessions the person read and no other. */
function archiveNamed(): void {
  const told = archival;
  const id = archiving;
  if (told === undefined || id === undefined) return;
  ask(SESSIONS, (requestId) => ({ type: "archiveWorkItem", requestId, id, running: told.running }));
}

/** Draws the dialog that asks before the daemon ends, from the daemon's lists as they are now: its words for a restart or for a complete quit, and every running session the window holds. The list is hidden where none runs. */
function showDaemonEnding(): void {
  if (ending === undefined) return;
  const words = daemonEnding(ending);
  byId("daemon-head").textContent = words.head;
  byId("daemon-says").textContent = words.says;
  DAEMON.button.textContent = words.button;
  const sessions = runningSessions(held.workItems, held.archived, held.sessions, held.headless, held.paneKinds);
  const section = byId("daemon-sessions");
  section.hidden = sessions.length === 0;
  section.querySelector("ul")?.replaceWith(namedLines(sessions));
}

/**
 * Opens the dialog that asks before the daemon ends, at a person's choice
 * of "Restart Daemon…" or "Quit Owlery Completely…" in the application
 * menu, with the keyboard on the button that ends nothing. It opens over no
 * other dialog and over no menu.
 */
function openDaemonEnding(chosen: DaemonEnd): void {
  if (!opened(DAEMON)) return;
  ending = chosen;
  showDaemonEnding();
  byId("daemon-cancel").focus();
}

/**
 * Asks the main process to end the daemon, at the press of the dialog's
 * button, which stays off until the answer. A refusal is shown in the
 * dialog. After a restart the window reloads at once: the load finds no
 * daemon and starts the one of the running build. After a complete quit the
 * app quits, and the window with it.
 */
function endDaemon(): void {
  const then = ending;
  if (then === undefined) return;
  DAEMON.error.textContent = "";
  DAEMON.button.disabled = true;
  void window.owlery.endDaemon(then).then((refusal) => {
    if (refusal === null) {
      if (then === "restart") window.location.reload();
      return;
    }
    DAEMON.error.textContent = refusal;
    DAEMON.button.disabled = false;
  });
}

/** Restores an archived work item. A refusal is said in the status line. */
function restore(workItemId: number): void {
  send({ type: "restoreWorkItem", requestId: request(), id: workItemId });
}

/** Takes a headless session the daemon sent, and names it in the removal's dialog, in the dialog before an archive, in the delete dialog and in the dialog that asks before the daemon ends, where one is open: a session that started or ended is one the dialog has to say. */
function takeHeadlessSession(headless: HeadlessInfo, requestId?: number): void {
  takeHeadless(headless, requestId);
  if (removeDialog.open) showRemove();
  if (sessionsDialog.open) showArchive();
  if (deleteDialog.open) showDelete();
  if (daemonDialog.open) showDaemonEnding();
}

/** Takes the repositories and the archived work items of a `ready` or an `inbox`. */
function takeRepositories(message: { repositories?: Repository[]; archived?: WorkItem[] }): void {
  const lists = daemonLists(message);
  held.repositories = lists.repositories;
  held.archived = lists.archived;
}

/**
 * Answers a person's click on the notification of a session: the window asks
 * the main process to bring it forward, and puts the session's work item's
 * view in front, with the session's pane in front of it, as the lists stand
 * at the click (./view, `notificationOpens`). Where the click opens no view
 * the screen in front stays. The "New work item" form stays open over it.
 */
function onNotificationClick(session: Pick<SessionInfo, "id" | "workItemId">): void {
  void window.owlery.comeForward();
  const opens = notificationOpens(session, held.workItems, held.sessions);
  if (opens) openView(opens.workItemId, opens.pane ?? undefined);
}

/** Takes the daemon's lists at an `inbox`: notifies of each state that changed, of each work item that was parked with questions, of each call a headless session began to wait for the person to allow and of each chain that stopped, with a notification that answers a click, drops the closed panes, and redraws the sidebar and the screen in front. */
function takeLists(next: { sessions: SessionInfo[]; workItems: WorkItem[]; repositories?: Repository[]; archived?: WorkItem[] }): void {
  const before = new Map<number, AgentState | null>(held.sessions.map((session) => [session.id, session.state]));
  const heldBefore = [...held.workItems, ...held.archived];
  held.sessions = next.sessions;
  held.workItems = next.workItems;
  takeRepositories(next);
  for (const session of held.sessions) {
    // A pane on the stage of a focused window is one the person is looking at, whether or not it has the keyboard.
    const inFront = onStage(session.id) && document.hasFocus();
    const notification = notificationFor(before.get(session.id) ?? null, session, inFront, held.workItems, held.paneKinds, held.archived);
    if (!notification) continue;
    new Notification(notification.title, { body: notification.body }).onclick = () => onNotificationClick(session);
  }
  // A work item whose view is in front of a focused window is one the person is looking at. A click on a park's notification, on a request's or on a stopped chain's brings the window forward and opens the work item's view, where its questions and its requests are answered and its chain is started again, where the lists still hold it.
  const looking = front === "view" && document.hasFocus() ? held.viewing : undefined;
  for (const told of [...parkNotifications(heldBefore, held.workItems, looking), ...permissionNotifications(heldBefore, held.workItems, looking), ...chainNotifications(heldBefore, held.workItems, looking)]) {
    new Notification(told.title, { body: told.body }).onclick = () => {
      void window.owlery.comeForward();
      if (held.workItems.some((workItem) => workItem.id === told.workItemId)) openView(told.workItemId);
    };
  }
  dropClosed(new Set(held.sessions.map((session) => session.id)));
  showSidebar();
  // The archived screen lists the archived work items of a repository the daemon keeps.
  if (front === "archived" && !repositoryOf(held.archivedOf)) openList("inbox");
  else listInFront()?.show();
  if (front === "view") showView();
  // A dialog that names what the daemon lists says the lists as they are now.
  if (hiddenDialog.open) showHidden();
  if (removeDialog.open) showRemove();
  if (sessionsDialog.open) showArchive();
  if (deleteDialog.open) showDelete();
  if (daemonDialog.open) showDaemonEnding();
  if (recordsPlaceDialog.open) showRecords();
  // The repository a registration added is in these lists, and not in the ones its answer found.
  const late = registeredLate;
  registeredLate = undefined;
  if (late && Date.now() <= late.until) {
    const found = registered(late.folder, late.before, held.repositories);
    if (found && lacksRecords(found)) openRecords(found.id);
  }
}

/** Draws the form as its choice "Register the repository only" has it: with the choice taken, the name, the base and the kind of pane are off, the form shows no plan, and its button reads "Register". */
function showFormMode(): void {
  const only = registerOnly.checked;
  titleField.disabled = only;
  kindField.disabled = only;
  createButton.textContent = only ? "Register" : "Create";
  showPlan();
}

/** Opens the "New work item" form, with `folder` as its repository where one is given. Before the daemon's `ready` the form has no kind of pane to offer, so it does not open. */
function openWorkItemForm(folder?: string): void {
  if (!held.ready || workItemDialog.open) return;
  // The folder stays from the last time, because the next work item is often of the same repository.
  if (folder !== undefined) repoField.value = folder;
  titleField.value = "";
  formName = generateName();
  titleField.placeholder = formName;
  // Each opening starts from the repository's default base and from no answer, and creates a work item.
  baseChoice = null;
  formPlan = null;
  forgetBases();
  formError.textContent = "";
  createButton.disabled = false;
  forget(workItemDialog);
  registerOnly.checked = false;
  showFormMode();
  workItemDialog.showModal();
  (repoField.value ? titleField : repoField).focus();
  askPlan();
}

/** Draws what the form holds of its plan: the branch, the folder and the setup under the name, or the plan's error in their place, and the menu of bases. Where the form registers a repository alone, it shows none of the plan and the menu is off. */
function showPlan(): void {
  if (registerOnly.checked) {
    branchPlace.textContent = "";
    worktreePlace.textContent = "";
    setupPlace.textContent = "";
    planPlace.classList.remove("failed");
    baseField.disabled = true;
    baseStatePlace.textContent = "";
    return;
  }
  const line = planLine(formPlan, repoField.value);
  branchPlace.textContent = line.branch;
  worktreePlace.textContent = line.worktree;
  setupPlace.textContent = line.setup;
  planPlace.classList.toggle("failed", line.failed);
  const menu = baseMenu(formPlan, baseChoice, repoField.value);
  const options = (bases: readonly string[]): HTMLOptionElement[] => bases.map((base) => new Option(base, base));
  const group = (label: string, bases: readonly string[]): HTMLOptGroupElement[] => {
    if (bases.length === 0) return [];
    const element = document.createElement("optgroup");
    element.label = label;
    element.append(...options(bases));
    return [element];
  };
  baseField.replaceChildren(...options(menu.first === null ? [] : [menu.first]), ...group("Local", menu.local), ...group("Remote", menu.remote));
  baseField.disabled = menu.value === null;
  if (menu.value !== null) baseField.value = menu.value;
  showBase();
}

/** Forgets the fetches the form asked for, so the next opening asks again. An answer that arrives for one of them is shown nowhere. */
function forgetBases(): void {
  for (const timer of baseTimers) clearTimeout(timer);
  baseTimers.clear();
  baseAnswers.clear();
  createdBase = undefined;
  createdSays = "";
}

/** Asks the daemon to fetch the base the menu holds, where `asksFetch` says so, and draws under the menu what the form holds of that base's fetch. */
function showBase(): void {
  const base = baseMenu(formPlan, baseChoice, repoField.value).value;
  if (base !== null && asksFetch(formPlan, base, repoField.value, registerOnly.checked, baseAnswers)) {
    const asked = { base, requestId: request(), answer: "awaited" as BaseAnswer | null };
    baseAnswers.set(baseKey(repoField.value, base), asked);
    basesAsked.add(asked.requestId);
    send({ type: "fetchBase", requestId: asked.requestId, repo: repoField.value.trim(), base });
    // A daemon of an earlier build ignores the message, so the form stops saying that it fetches. An answer that comes later is shown.
    const timer = setTimeout(() => {
      baseTimers.delete(timer);
      asked.answer = unanswered(asked.answer);
      showBase();
    }, BASE_ANSWER_MS);
    baseTimers.add(timer);
  }
  baseStatePlace.textContent = registerOnly.checked ? "" : baseSays(base, base === null ? null : baseAnswers.get(baseKey(repoField.value, base))?.answer, Date.now());
}

/** Takes the daemon's answer to a fetch the form asked for, or its refusal. An answer of this opening is shown under the menu, and one that came after the person pressed Create is kept for the status line. It answers whether the message was of such a fetch at all. */
function takeBase(requestId: number, answer: BaseAnswer): boolean {
  if (!basesAsked.delete(requestId)) return false;
  for (const [key, asked] of baseAnswers) {
    if (asked.requestId !== requestId) continue;
    asked.answer = answer;
    if (key === createdBase) createdSays = lateSays(asked.base, answer, Date.now());
    if (workItemDialog.open) showBase();
  }
  return true;
}

/** Asks the daemon what a creation with the form's fields would give, now. With no repository folder it asks nothing, and the form shows no plan. */
function askPlan(): void {
  clearTimeout(planTimer);
  planTimer = undefined;
  const fields = workItemFields(repoField.value, titleField.value, formName, null);
  if ("error" in fields) {
    planRequest = undefined;
    formPlan = null;
  } else {
    planRequest = request();
    planRepo = fields.repo;
    plansAsked.add(planRequest);
    send({ type: "planWorkItem", requestId: planRequest, ...fields });
  }
  showPlan();
}

/** Asks for a plan once the person has typed nothing for `PLAN_WAIT_MS`. Until its answer the form shows the plan it holds. */
function askPlanSoon(): void {
  clearTimeout(planTimer);
  planTimer = setTimeout(askPlan, PLAN_WAIT_MS);
}

/** Takes the daemon's answer to a plan, or its refusal, where it answers the form's latest plan. It answers whether the message was of a plan at all. */
function takePlan(requestId: number, answered: PlanAnswered): boolean {
  const of = planAnswer(planRequest, plansAsked, requestId);
  plansAsked.delete(requestId);
  if (of === "latest") {
    formPlan = { repo: planRepo, ...answered };
    showPlan();
  }
  return of !== "other";
}

function createWorkItem(): void {
  const fields = workItemFields(repoField.value, titleField.value, formName, baseMenu(formPlan, baseChoice, repoField.value).value);
  if ("error" in fields) {
    formError.textContent = fields.error;
    return;
  }
  // The daemon runs the setup command only as the form named it, so nothing is created before the plan of this folder has answered.
  const shown = shownSetup(formPlan, repoField.value);
  if (shown === null) {
    formError.textContent = PLAN_AWAITED;
    return;
  }
  const kind = held.paneKinds.find((offered) => offered.kind === kindField.value);
  if (!kind) return;
  const requestId = request();
  formRequest = requestId;
  formError.textContent = "";
  // The button did not wait for the base's fetch. Where its answer is still to come, the daemon cuts the work item after that fetch, and the status line says what a failed one gave.
  createdBase = fields.base === undefined ? undefined : baseKey(fields.repo, fields.base);
  createdSays = "";
  // One creation per answer: the button stays off until the daemon answers.
  createButton.disabled = true;
  send({ type: "createWorkItem", requestId, ...fields, kind: kind.kind, ...startSize(), setupCommand: shown.setupCommand });
}

/** Registers the repository of the form's folder, with no work item: the daemon's answer closes the form, and its refusal is shown in it, as a creation's is. */
function registerRepository(): void {
  const fields = registerFields(repoField.value);
  if ("error" in fields) {
    formError.textContent = fields.error;
    return;
  }
  ask(FORM, (requestId) => {
    registering = { requestId, folder: fields.folder };
    return { type: "addRepository", requestId, folder: fields.folder };
  });
}

function onMessage(message: ServerMessage): void {
  switch (message.type) {
    case "ready": {
      // The states as the window finds them, so no notification. Nothing is attached and nothing started.
      held.ready = true;
      held.paneKinds = message.paneKinds;
      held.sessions = message.sessions;
      held.workItems = message.workItems;
      takeRepositories(message);
      held.headless = message.headless;
      // A daemon of an earlier build sends no look.
      held.lastLook = message.lastLook ?? null;
      // A daemon of an earlier build, and one that can hold nothing, send no such choice, and the control is then hidden.
      held.keepAwake = message.keepAwake ?? null;
      showKeepAwake();
      // A daemon of an earlier build sends no notice of its agent.
      held.agentNotice = message.agentNotice ?? null;
      // The counts of this `ready` were read from git at this window's hello, so the changes are worked out here, once.
      held.changes = held.lastLook ? changesSince(held.lastLook, held.workItems, held.sessions, held.paneKinds) : [];
      showPaneButtons();
      // The form's choice among the kinds of pane, the first that reports its agent's state chosen.
      const preferred = agentKind(held.paneKinds);
      kindField.replaceChildren(...held.paneKinds.map(({ kind, label }) => new Option(label, kind, kind === preferred, kind === preferred)));
      // The app opens on the summary where a work item changed since the person last looked, and on the inbox otherwise.
      if (held.changes.length > 0) openSummary();
      else openList("inbox");
      // The dialog that asks before the daemon ends can be open before the lists are here, in a window the menu's click made.
      if (daemonDialog.open) showDaemonEnding();
      return;
    }
    case "inbox":
      takeLists(message);
      return;
    case "keepAwake":
      // The daemon's choice changed, here or in another client, or its hold began or ended.
      held.keepAwake = message.keepAwake;
      showKeepAwake();
      showStatus();
      return;
    case "agentNotice":
      // The adapter's notice changed: the daemon asked it at its start, or again as a window connected.
      held.agentNotice = message.notice;
      showStatus();
      return;
    case "started":
      tell("");
      takeStarted(message.session);
      detachUnshown(message.session.id);
      return;
    case "workItemCreated": {
      // The view is drawn from the list, and the `inbox` that carries the new work item comes after this answer.
      if (!held.workItems.some((known) => known.id === message.workItem.id)) held.workItems = [...held.workItems, message.workItem];
      // A base that could not be fetched, where the form said so only after the person pressed Create, is said here: the work item was cut where the clone held that base.
      tell(message.requestId === formRequest ? createdSays : "");
      if (message.requestId === formRequest) {
        formRequest = undefined;
        // Closed before the pane is shown, so the keyboard goes to the pane.
        if (workItemDialog.open) workItemDialog.close();
      }
      takeStarted(message.session);
      // The setup pane's output is sent to this window too, and drawn only once its tab is pressed, from the replay.
      const setupPane = message.workItem.setup?.paneId ?? null;
      if (setupPane !== null) detachUnshown(setupPane);
      openView(message.workItem.id);
      return;
    }
    case "workItemPlan": {
      // A daemon of an earlier build names no setup.
      const plan = { branch: message.branch, worktree: message.worktree, localBases: message.localBases, remoteBases: message.remoteBases, defaultBase: message.defaultBase, setupCommand: message.setupCommand ?? null, includes: message.includes ?? false };
      if (!takeSettingsPlan(message.requestId, plan)) takePlan(message.requestId, plan);
      return;
    }
    case "baseFetched":
      takeBase(message.requestId, { base: message.base, commit: message.commit, fetch: message.fetch, failure: message.failure, since: message.since });
      return;
    case "renamePlan":
      takeRenamePlan(message.requestId, { branch: message.branch, blocked: message.blocked });
      return;
    case "recordsPlan":
      takeRecordsPlan(message.requestId, message.plan);
      return;
    case "workItemLoss":
      if (!takeDeleteLoss(message.requestId, { loss: message.loss })) takeRemoveLoss(message.requestId, { loss: message.loss });
      return;
    case "done":
      // What the request changed arrives in the `inbox` that follows.
      tell("");
      if (trashing?.requestId === message.requestId) {
        // The daemon no longer keeps the repository, so its folder goes to the Trash now, as the person chose. A failure is said in the status line.
        const { folder } = trashing;
        trashing = undefined;
        void window.owlery.trashFolder(folder).then((failure) => {
          if (failure !== null) tell(failure);
        });
      }
      if (registering?.requestId === message.requestId) {
        // The form closes first, and the dialog of the records place then opens for a repository that lacks a part of it.
        const { folder } = registering;
        registering = undefined;
        if (answered(message.requestId, null)) afterRegistration(folder);
        return;
      }
      if (answered(message.requestId, null)) return;
      // The answers a person sent to a parked work item's questions were taken.
      if (takeAnswers(message.requestId, null)) return;
      // The chain a press of "Get a seal" asked for has started.
      if (takeSeal(message.requestId, null)) return;
      if (message.requestId === renameRequest) {
        renameRequest = undefined;
        if (renameDialog.open) renameDialog.close();
      }
      return;
    case "asked":
      takeHeadlessSession(message.headless, message.requestId);
      return;
    case "headless":
      takeHeadlessSession(message.headless);
      return;
    case "headlessDropped":
      // The daemon drops only a session that ended, so no dialog that names the running sessions changes.
      dropHeadless(message.id);
      return;
    case "error":
      // Nothing was created or started.
      requestRefused(message.requestId);
      // A plan's refusal is the form's to show, under the name, and an earlier plan's is shown nowhere.
      if (takePlan(message.requestId, { error: message.message })) return;
      // The refusal of a base's fetch is the form's to show, under the menu.
      if (takeBase(message.requestId, { error: message.message })) return;
      // So is the refusal of a rename's plan the rename dialog's, and the refusal of the rename itself.
      if (takeRenamePlan(message.requestId, { error: message.message })) return;
      // The refusal of the plan that lists a repository's bases is the settings dialog's, and so is a refusal of what a dialog sent that dialog's.
      if (takeSettingsPlan(message.requestId, { error: message.message })) return;
      // A read of a loss that was refused is its dialog's to show.
      if (takeDeleteLoss(message.requestId, { error: message.message }) || takeRemoveLoss(message.requestId, { error: message.message })) return;
      // The refusal of the answers to a parked work item's questions is its view's section's to show.
      if (takeAnswers(message.requestId, message.message)) return;
      // The refusal of a chain's start is its view's to show, under "Get a seal".
      if (takeSeal(message.requestId, message.message)) return;
      // A refused plan of the records place is its dialog's to show.
      if (takeRecordsPlan(message.requestId, { error: message.message })) return;
      if (registering?.requestId === message.requestId) registering = undefined;
      // A removal that was refused moves no folder to the Trash.
      if (trashing?.requestId === message.requestId) trashing = undefined;
      if (answered(message.requestId, message.message)) {
        readAgain();
        return;
      }
      if (message.requestId === renameRequest && renameDialog.open) {
        renameRequest = undefined;
        renameError.textContent = message.message;
        renameButton.disabled = false;
        return;
      }
      if (message.requestId === formRequest && workItemDialog.open) {
        formRequest = undefined;
        formError.textContent = message.message;
        createButton.disabled = false;
      } else {
        tell(message.message);
      }
      return;
    case "replay":
    case "output":
      write(message.id, message.type, message.data);
      return;
    case "exit":
      // The window draws nothing for it: the session's output ends with the exit line, and the `inbox` that follows lists the pane as ended.
      return;
    case "agent":
      // The window draws nothing for a hook event. Its state arrives in the lists of the `inbox` that follows.
      return;
  }
}

/** Tells the daemon that the person looked at what the window shows, as the window stops being in front of them. The daemon keeps the look. */
function looked(): void {
  if (connected()) send({ type: "looked" });
}

async function connect(): Promise<void> {
  const answer = await window.owlery.daemon();
  if ("error" in answer) {
    // No daemon to reach: the status line says why, and stays until the person starts the app again.
    tell(answer.error);
    return;
  }
  const { url, token } = answer;
  // Said in the status line from the socket's opening on, in place of the daemon's state, until a restart replaces the daemon and the window loads again.
  held.daemonNotice = daemonNotice(answer.otherBuild);
  const ws = new WebSocket(url);
  connectedBy(ws);
  ws.addEventListener("open", () => {
    tell("");
    ws.send(JSON.stringify({ type: "hello", token } satisfies ClientMessage));
  });
  ws.addEventListener("message", (event) => onMessage(JSON.parse(String(event.data)) as ServerMessage));
  ws.addEventListener("close", () => {
    // The daemon went away: reload, which finds or starts it again and opens as any load does.
    tell("Reconnecting to the daemon…");
    setTimeout(() => window.location.reload(), 1000);
  });
}

initSidebar(
  {
    openScreen,
    openView,
    openForm: openWorkItemForm,
    openRepositoryMenu(repositoryId, from) {
      const box = from.getBoundingClientRect();
      openRepositoryMenu(repositoryId, { x: box.left, y: box.bottom }, () => rowButton(repositoryId, ".repository-menu"));
    },
    openHidden,
    search(query) {
      held.query = query;
      showNarrowed();
    },
    filter,
    leaveSearch() {
      const list = listInFront();
      if (list) list.focusLine(list.selected());
      // Where no list is in front the keyboard leaves the field for the page.
      if (document.activeElement === byId("search-field")) byId("search-field").blur();
    },
  },
  MAC,
);
initSummary({ openInbox: () => openList("inbox"), openView });
initView(() => openList("inbox"), MAC, openView, openReverse);
initKeepAwake();
const THEME_NOT_SAVED = "The theme could not be saved.";
initTheme(window.owlery.appearance, {
  save: (choice) => window.owlery.saveAppearance(choice),
  changed: showTerminalColours,
  saved: () => untell(THEME_NOT_SAVED),
  notSaved: () => tell(THEME_NOT_SAVED),
});
// The editors and the terminals the Mac holds, which a menu offers to open a folder in. Until the answer a menu offers Finder alone.
void window.owlery.installedApps().then((apps) => {
  held.apps = apps;
});
// The keys pressed with the Command key are read before a terminal that has the focus reads them.
document.addEventListener("keydown", onCommandKey, { capture: true });
// The menu's key is read before a list's keys, which a menu that just opened no longer lets through.
document.addEventListener("keydown", onMenuKey);
document.addEventListener("keydown", onKey);
document.addEventListener("contextmenu", onContextMenu);
window.addEventListener("blur", looked);
window.addEventListener("pagehide", looked);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) looked();
});
byId("work-item-cancel").addEventListener("click", () => workItemDialog.close());
byId("work-item-browse").addEventListener("click", () => {
  void window.owlery.pickFolder().then((folder) => {
    if (!folder) return;
    repoField.value = folder;
    askPlan();
  });
});
repoField.addEventListener("input", () => {
  askPlanSoon();
  // The plan the form holds is of the text the field held before, so its branch and its bases leave the form now.
  showPlan();
});
titleField.addEventListener("input", askPlanSoon);
baseField.addEventListener("change", () => {
  baseChoice = { repo: repoField.value.trim(), base: baseField.value };
  showBase();
});
// A closed form asks for no plan, and waits for no answer to say that it fetches.
workItemDialog.addEventListener("close", () => {
  clearTimeout(planTimer);
  for (const timer of baseTimers) clearTimeout(timer);
  baseTimers.clear();
});
byId("rename-cancel").addEventListener("click", () => renameDialog.close());
renameField.addEventListener("input", () => {
  clearTimeout(renamePlanTimer);
  renamePlanTimer = setTimeout(askRenamePlan, PLAN_WAIT_MS);
  // The plan the dialog holds is of the name the field held before, so the choice is off until the daemon answers for this one.
  renamePlan = null;
  renamePlanRequest = undefined;
  showRenamePlan();
});
// A closed dialog asks for no plan, and no answer is its own any more. The event of a close can arrive after the dialog opened again, on another work item, and that opening's plan is not this close's to end.
renameDialog.addEventListener("close", () => {
  if (renameDialog.open) return;
  clearTimeout(renamePlanTimer);
  renaming = undefined;
  renamePlanRequest = undefined;
});
byId<HTMLFormElement>("rename-form").addEventListener("submit", (event) => {
  event.preventDefault();
  rename();
});
workItemForm.addEventListener("submit", (event) => {
  event.preventDefault();
  if (registerOnly.checked) registerRepository();
  else createWorkItem();
});
registerOnly.closest("label")?.setAttribute("title", REGISTER_ONLY_SAYS);
registerOnly.addEventListener("change", showFormMode);
byId("settings-cancel").addEventListener("click", () => settingsDialog.close());
byId<HTMLFormElement>("settings-form").addEventListener("submit", (event) => {
  event.preventDefault();
  saveSettings();
});
byId("icon-cancel").addEventListener("click", () => iconDialog.close());
byId<HTMLFormElement>("icon-form").addEventListener("submit", (event) => {
  event.preventDefault();
  // The daemon takes one character, or none, and refuses more.
  const id = iconOf;
  if (id !== undefined) ask(ICON, (requestId) => ({ type: "setRepository", requestId, id, icon: iconField.value }));
});
byId("group-cancel").addEventListener("click", () => groupDialog.close());
byId<HTMLFormElement>("group-form").addEventListener("submit", (event) => {
  event.preventDefault();
  // The daemon stores the name without the white space at its ends, and refuses an empty one.
  const repoId = groupOf;
  if (repoId !== undefined) ask(GROUP, (requestId) => ({ type: "addGroup", requestId, repoId, name: groupName.value }));
});
byId("reverse-cancel").addEventListener("click", () => reverseDialog.close());
byId<HTMLFormElement>("reverse-form").addEventListener("submit", (event) => {
  event.preventDefault();
  // The daemon stores the message without the white space at its ends, and refuses an empty one. Its `done` closes the dialog, and the `inbox` after it carries the decision as reversed.
  const of = reversing;
  if (of !== undefined) ask(REVERSE, (requestId) => ({ type: "reverseDecision", requestId, ...of, message: reverseMessage.value }));
});
byId("hidden-close").addEventListener("click", () => hiddenDialog.close());
byId("remove-cancel").addEventListener("click", () => removeDialog.close());
byId<HTMLFormElement>("remove-form").addEventListener("submit", (event) => {
  event.preventDefault();
  remove();
});
removeDelete.addEventListener("change", () => {
  // The losses are read when the choice is taken, and not kept once it is taken back.
  forgetRemoveLosses();
  showRemove();
});
removeForce.addEventListener("change", showRemove);
removeTrash.addEventListener("change", showRemove);
byId("delete-cancel").addEventListener("click", () => deleteDialog.close());
deleteForce.addEventListener("change", showDelete);
byId<HTMLFormElement>("delete-form").addEventListener("submit", (event) => {
  event.preventDefault();
  deleteNamed();
});
byId("records-cancel").addEventListener("click", () => recordsPlaceDialog.close());
recordsGate.addEventListener("input", () => {
  recordsCommand = recordsGate.value;
  recordsTyped = true;
  showRecords();
  // Keys closer together than the wait ask once, after the last of them, as the form's plan does.
  clearTimeout(recordsPlanTimer);
  recordsPlanTimer = setTimeout(askRecordsPlan, PLAN_WAIT_MS);
});
recordsPlaceDialog.addEventListener("close", () => {
  if (recordsPlaceDialog.open) return;
  clearTimeout(recordsPlanTimer);
  recordsRepository = undefined;
  recordsPlanRequest = undefined;
});
byId<HTMLFormElement>("records-form").addEventListener("submit", (event) => {
  event.preventDefault();
  setUpRecordsPlace();
});
byId("sessions-cancel").addEventListener("click", () => sessionsDialog.close());
byId<HTMLFormElement>("sessions-form").addEventListener("submit", (event) => {
  event.preventDefault();
  archiveNamed();
});
byId("daemon-cancel").addEventListener("click", () => daemonDialog.close());
byId<HTMLFormElement>("daemon-form").addEventListener("submit", (event) => {
  event.preventDefault();
  endDaemon();
});
window.owlery.onDaemonMenu(openDaemonEnding);

void connect();
