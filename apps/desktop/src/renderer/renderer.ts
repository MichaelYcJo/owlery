// The window: its connection to the daemon, which of its four screens is in
// front, the keys it reads, the "New work item" form with the plan it asks
// the daemon for, and a work item's menu with what the press of each item
// does, the rename dialog among it. How a menu is drawn is ./menu. The theme
// and its control are ./theme. The sidebar, the list with its preview, a
// work item's view and the summary are a module each, and what each says and
// decides is a function of ./view.
import type { OwleryApi } from "../shared/ipc";
import { generateName } from "../shared/names";
import type { AgentState, ClientMessage, Repository, ServerMessage, SessionInfo, WorkItem } from "../shared/protocol";
import { listScreen, type ListScreen } from "./list";
import { menuOpen, openMenu } from "./menu";
import { byId, connected, connectedBy, held, request, send } from "./shared";
import { focusSearch, initSidebar, showSidebar, tell, untell, type Front } from "./sidebar";
import { initSummary, pressMain, showSummary } from "./summary";
import { initTheme } from "./theme";
import {
  agentKind,
  baseMenu,
  changesSince,
  commandKey,
  daemonLists,
  inboxKey,
  menuKey,
  menuTarget,
  notificationFor,
  planAnswer,
  planLine,
  renameChoice,
  workItemFields,
  workItemMenu,
  type BaseChoice,
  type FormPlan,
  type MenuAction,
  type PlanAnswered,
  type RenamePlanned,
  type StateFilter,
} from "./view";
import { detachUnshown, dropClosed, enterView, initView, leaveView, onStage, requestRefused, showPaneButtons, showTerminalColours, showView, startSize, takeHeadless, takeStarted, write } from "./work-item-view";

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
  view: byId("work-item-view"),
};
const workItemDialog = byId<HTMLDialogElement>("work-item-dialog");
const workItemForm = byId<HTMLFormElement>("work-item-form");
const repoField = byId<HTMLInputElement>("work-item-repo");
const titleField = byId<HTMLInputElement>("work-item-title");
const planPlace = byId("work-item-plan");
const branchPlace = byId("work-item-branch");
const worktreePlace = byId("work-item-worktree");
const baseField = byId<HTMLSelectElement>("work-item-base");
const kindField = byId<HTMLSelectElement>("work-item-kind");
const formError = byId("work-item-error");
const createButton = byId<HTMLButtonElement>("work-item-create");
const renameDialog = byId<HTMLDialogElement>("rename-dialog");
const renameField = byId<HTMLInputElement>("rename-title");
const renameBranch = byId<HTMLInputElement>("rename-branch");
const renamePlanPlace = byId("rename-plan");
const renameError = byId("rename-error");
const renameButton = byId<HTMLButtonElement>("rename-submit");

/** Whether a dialog of the window is open, the form or any other. */
function dialogOpen(): boolean {
  return document.querySelector("dialog[open]") !== null;
}

const lists: Record<"inbox" | "history", ListScreen> = {
  inbox: listScreen("inbox", { openView, filter }, MAC),
  history: listScreen("history", { openView, filter }, MAC),
};

/** The list on screen, where the inbox screen or the history screen is in front. */
function listInFront(): ListScreen | undefined {
  return front === "inbox" || front === "history" ? lists[front] : undefined;
}

/** Shows one of the four screens beside the sidebar, hides the other three, and has the sidebar mark it. */
function bringToFront(screen: Exclude<Front, null>): void {
  front = screen;
  for (const [name, element] of Object.entries(screens)) element.hidden = name !== screen;
  showSidebar(front);
}

/** Puts a work item's view in front: of any screen, the view of another work item among them. */
function openView(workItemId: number): void {
  enterView(workItemId);
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

/** Acts on a key pressed with the Command key, on every screen: K puts the focus in the search field, and N opens the "New work item" form. */
function onCommandKey(event: KeyboardEvent): void {
  const key = commandKey({ code: event.code, meta: event.metaKey, ctrl: event.ctrlKey, alt: event.altKey, shift: event.shiftKey }, { mac: MAC, dialogOpen: dialogOpen(), menuOpen: menuOpen() });
  if (key === null) return;
  event.preventDefault();
  event.stopPropagation();
  if (key === "search") focusSearch();
  else openWorkItemForm();
}

/**
 * Acts on a key of a list. On the inbox screen and the history screen J and K
 * move the selection and Enter opens the selected work item's view. On the
 * summary screen Enter presses the main control, read under the same
 * conditions, and J and K do nothing.
 */
function onKey(event: KeyboardEvent): void {
  const target = event.target instanceof Element ? event.target : null;
  const key = inboxKey(
    { code: event.code, modified: event.ctrlKey || event.metaKey || event.altKey || event.shiftKey },
    {
      inboxInFront: front === "summary" || front === "inbox" || front === "history",
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
  else if (list.selected() !== undefined) openView(list.selected() as number);
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
      send({ type: "setWorkItem", requestId: request(), id: action.id, pinned: action.pinned, muted: action.muted });
      return;
  }
}

/** Opens a work item's menu with its corner at `at`. The keyboard returns to the work item's line under `within`, though the line was drawn anew meanwhile. */
function openWorkItemMenu(workItemId: number, at: { x: number; y: number }, within: Element): void {
  const workItem = held.workItems.find((known) => known.id === workItemId);
  if (!workItem) return;
  openMenu(`Menu of ${workItem.title}`, workItemMenu(workItem, held.apps), at, pressMenu, () => lineIn(within, workItemId));
}

/** Opens the menu of a work item's line at a press of the right button on it, and at a press with the Control key, which raises the same event. */
function onContextMenu(event: MouseEvent): void {
  const on = lineOf(event.target instanceof Element ? event.target : null);
  if (!on) return;
  event.preventDefault();
  openWorkItemMenu(on.workItemId, { x: event.clientX, y: event.clientY }, on.within);
}

/**
 * Opens a menu at its key: for the line the keyboard is on, and otherwise
 * for the selected line of the list in front. The menu opens under the
 * line. A repository's row has no menu yet, so the key opens none there.
 */
function onMenuKey(event: KeyboardEvent): void {
  const target = event.target instanceof Element ? event.target : null;
  const pressed = { code: event.code, shift: event.shiftKey, modified: event.ctrlKey || event.metaKey || event.altKey };
  // A terminal reads its keys in a field of its own.
  if (!menuKey(pressed, { dialogOpen: dialogOpen(), menuOpen: menuOpen(), inField: target?.closest("input, textarea, select, [contenteditable]") != null })) return;
  const on = lineOf(target);
  const row = target?.closest<HTMLElement>(".repository-row")?.parentElement;
  const of = menuTarget({ workItem: on?.workItemId, repository: row?.dataset.repository === undefined ? undefined : Number(row.dataset.repository) }, listInFront()?.selected());
  if (of === null || !("workItem" in of)) return;
  const list = front === "inbox" || front === "history" ? screens[front] : null;
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

/** Takes the repositories and the archived work items of a `ready` or an `inbox`, and what the status line has to say of the daemon that sent it. */
function takeRepositories(message: { repositories?: Repository[]; archived?: WorkItem[] }): void {
  const lists = daemonLists(message);
  held.repositories = lists.repositories;
  held.archived = lists.archived;
  held.daemonNotice = lists.notice;
}

/** Takes the daemon's lists at an `inbox`: notifies of each state that changed, drops the closed panes, and redraws the sidebar and the screen in front. */
function takeLists(next: { sessions: SessionInfo[]; workItems: WorkItem[]; repositories?: Repository[]; archived?: WorkItem[] }): void {
  const before = new Map<number, AgentState | null>(held.sessions.map((session) => [session.id, session.state]));
  held.sessions = next.sessions;
  held.workItems = next.workItems;
  takeRepositories(next);
  for (const session of held.sessions) {
    // A pane on the stage of a focused window is one the person is looking at, whether or not it has the keyboard.
    const inFront = onStage(session.id) && document.hasFocus();
    const notification = notificationFor(before.get(session.id) ?? null, session, inFront, held.workItems, held.paneKinds);
    if (notification) new Notification(notification.title, { body: notification.body });
  }
  dropClosed(new Set(held.sessions.map((session) => session.id)));
  showSidebar();
  listInFront()?.show();
  if (front === "view") showView();
}

/** Opens the "New work item" form, with `folder` as its repository where one is given. Before the daemon's `ready` the form has no kind of pane to offer, so it does not open. */
function openWorkItemForm(folder?: string): void {
  if (!held.ready || workItemDialog.open) return;
  // The folder stays from the last time, because the next work item is often of the same repository.
  if (folder !== undefined) repoField.value = folder;
  titleField.value = "";
  formName = generateName();
  titleField.placeholder = formName;
  // Each opening starts from the repository's default base and from no answer.
  baseChoice = null;
  formPlan = null;
  formError.textContent = "";
  createButton.disabled = false;
  workItemDialog.showModal();
  (repoField.value ? titleField : repoField).focus();
  askPlan();
}

/** Draws what the form holds of its plan: the branch and the folder under the name, or the plan's error in their place, and the menu of bases. */
function showPlan(): void {
  const line = planLine(formPlan, repoField.value);
  branchPlace.textContent = line.branch;
  worktreePlace.textContent = line.worktree;
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
  const kind = held.paneKinds.find((offered) => offered.kind === kindField.value);
  if (!kind) return;
  const requestId = request();
  formRequest = requestId;
  formError.textContent = "";
  // One creation per answer: the button stays off until the daemon answers.
  createButton.disabled = true;
  send({ type: "createWorkItem", requestId, ...fields, kind: kind.kind, ...startSize() });
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
      // The counts of this `ready` were read from git at this window's hello, so the changes are worked out here, once.
      held.changes = held.lastLook ? changesSince(held.lastLook, held.workItems, held.sessions, held.paneKinds) : [];
      showPaneButtons();
      // The form's choice among the kinds of pane, the first that reports its agent's state chosen.
      const preferred = agentKind(held.paneKinds);
      kindField.replaceChildren(...held.paneKinds.map(({ kind, label }) => new Option(label, kind, kind === preferred, kind === preferred)));
      // The app opens on the summary where a work item changed since the person last looked, and on the inbox otherwise.
      if (held.changes.length > 0) openSummary();
      else openList("inbox");
      return;
    }
    case "inbox":
      takeLists(message);
      return;
    case "started":
      tell("");
      takeStarted(message.session);
      detachUnshown(message.session.id);
      return;
    case "workItemCreated": {
      // The view is drawn from the list, and the `inbox` that carries the new work item comes after this answer.
      if (!held.workItems.some((known) => known.id === message.workItem.id)) held.workItems = [...held.workItems, message.workItem];
      tell("");
      if (message.requestId === formRequest) {
        formRequest = undefined;
        // Closed before the pane is shown, so the keyboard goes to the pane.
        if (workItemDialog.open) workItemDialog.close();
      }
      takeStarted(message.session);
      openView(message.workItem.id);
      return;
    }
    case "workItemPlan":
      takePlan(message.requestId, { branch: message.branch, worktree: message.worktree, localBases: message.localBases, remoteBases: message.remoteBases, defaultBase: message.defaultBase });
      return;
    case "renamePlan":
      takeRenamePlan(message.requestId, { branch: message.branch, blocked: message.blocked });
      return;
    case "done":
      // What the request changed arrives in the `inbox` that follows.
      tell("");
      if (message.requestId === renameRequest) {
        renameRequest = undefined;
        if (renameDialog.open) renameDialog.close();
      }
      return;
    case "asked":
      takeHeadless(message.headless, message.requestId);
      return;
    case "headless":
      takeHeadless(message.headless);
      return;
    case "error":
      // Nothing was created or started.
      requestRefused(message.requestId);
      // A plan's refusal is the form's to show, under the name, and an earlier plan's is shown nowhere.
      if (takePlan(message.requestId, { error: message.message })) return;
      // So is the refusal of a rename's plan the rename dialog's, and the refusal of the rename itself.
      if (takeRenamePlan(message.requestId, { error: message.message })) return;
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
    pickFolder: () => window.owlery.pickFolder(),
    addRepository: (folder) => send({ type: "addRepository", requestId: request(), folder }),
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
initView(() => openList("inbox"));
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
});
// A closed form asks for no plan.
workItemDialog.addEventListener("close", () => clearTimeout(planTimer));
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
  createWorkItem();
});

void connect();
