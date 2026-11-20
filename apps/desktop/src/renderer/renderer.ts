// The window: its connection to the daemon, which of its four screens is in
// front, the keys it reads, and the "New work item" form with the plan it
// asks the daemon for. The theme and its control are ./theme, and the choice
// of when the Mac is kept awake with its control is ./keep-awake. The sidebar,
// the list with its preview, a work item's view and the summary are a module
// each, and what each says and decides is a function of ./view.
import type { OwleryApi } from "../shared/ipc";
import { generateName } from "../shared/names";
import type { AgentState, ClientMessage, ServerMessage, SessionInfo, WorkItem } from "../shared/protocol";
import { listScreen, type ListScreen } from "./list";
import { initKeepAwake, showKeepAwake } from "./keep-awake";
import { byId, connected, connectedBy, held, request, send } from "./shared";
import { focusSearch, initSidebar, showSidebar, showStatus, tell, untell, type Front } from "./sidebar";
import { initSummary, pressMain, showSummary } from "./summary";
import { initTheme } from "./theme";
import { agentKind, baseMenu, changesSince, commandKey, inboxKey, notificationFor, notificationOpens, planAnswer, planLine, workItemFields, type BaseChoice, type FormPlan, type PlanAnswered, type StateFilter } from "./view";
import { closeFront, detachUnshown, dropClosed, enterView, initView, leaveView, onStage, requestRefused, showPaneButtons, showTerminalColours, showView, startSize, takeHeadless, takeStarted, write } from "./work-item-view";

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
// How long the form waits after a key before it asks for a plan. A plan took 28 ms in a clone of one branch and 130 ms beside 2,000 more, so keys closer together than this ask once, after the last of them.
const PLAN_WAIT_MS = 150;

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

/** Whether a dialog of the page is open, the "New work item" form or the question before a working pane closes, or a menu stands in the page, as a pane's does while it is open (./work-item-view). The window reads none of its keys then. */
function dialogOpen(): boolean {
  return document.querySelector('dialog[open], [role="menu"]') !== null;
}

/** Acts on a key pressed with the Command key, on every screen: K puts the focus in the search field, N opens the "New work item" form, and W closes the pane in front. The key is kept from the terminal whatever it did. */
function onCommandKey(event: KeyboardEvent): void {
  const key = commandKey({ code: event.code, meta: event.metaKey, ctrl: event.ctrlKey, alt: event.altKey, shift: event.shiftKey }, { mac: MAC, dialogOpen: dialogOpen() });
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

/** Takes the daemon's lists at an `inbox`: notifies of each state that changed, with a notification that answers a click, drops the closed panes, and redraws the sidebar and the screen in front. */
function takeLists(next: { sessions: SessionInfo[]; workItems: WorkItem[] }): void {
  const before = new Map<number, AgentState | null>(held.sessions.map((session) => [session.id, session.state]));
  held.sessions = next.sessions;
  held.workItems = next.workItems;
  for (const session of held.sessions) {
    // A pane on the stage of a focused window is one the person is looking at, whether or not it has the keyboard.
    const inFront = onStage(session.id) && document.hasFocus();
    const notification = notificationFor(before.get(session.id) ?? null, session, inFront, held.workItems, held.paneKinds);
    if (!notification) continue;
    new Notification(notification.title, { body: notification.body }).onclick = () => onNotificationClick(session);
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
      held.headless = message.headless;
      // A daemon of an earlier build sends no look.
      held.lastLook = message.lastLook ?? null;
      // A daemon of an earlier build, and one that can hold nothing, send no such choice, and the control is then hidden.
      held.keepAwake = message.keepAwake ?? null;
      showKeepAwake();
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
    case "keepAwake":
      // The daemon's choice changed, here or in another client, or its hold began or ended.
      held.keepAwake = message.keepAwake;
      showKeepAwake();
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
initView(() => openList("inbox"), MAC, openView);
initKeepAwake();
const THEME_NOT_SAVED = "The theme could not be saved.";
initTheme(window.owlery.appearance, {
  save: (choice) => window.owlery.saveAppearance(choice),
  changed: showTerminalColours,
  saved: () => untell(THEME_NOT_SAVED),
  notSaved: () => tell(THEME_NOT_SAVED),
});
// The keys pressed with the Command key are read before a terminal that has the focus reads them.
document.addEventListener("keydown", onCommandKey, { capture: true });
document.addEventListener("keydown", onKey);
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
workItemForm.addEventListener("submit", (event) => {
  event.preventDefault();
  createWorkItem();
});

void connect();
