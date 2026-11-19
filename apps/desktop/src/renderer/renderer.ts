// The window: its connection to the daemon, which of its four screens is in
// front, the keys it reads, and the "New work item" form. The theme and its
// control are ./theme. The sidebar, the
// list with its preview, a work item's view and the summary are a module
// each, and what each says and decides is a function of ./view.
import type { OwleryApi } from "../shared/ipc";
import type { AgentState, ClientMessage, ServerMessage, SessionInfo, WorkItem } from "../shared/protocol";
import { listScreen, type ListScreen } from "./list";
import { byId, connected, connectedBy, held, request, send } from "./shared";
import { focusSearch, initSidebar, showSidebar, tell, untell, type Front } from "./sidebar";
import { initSummary, pressMain, showSummary } from "./summary";
import { initTheme } from "./theme";
import { agentKind, changesSince, commandKey, inboxKey, notificationFor, workItemFields, type StateFilter } from "./view";
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
  const key = commandKey({ code: event.code, meta: event.metaKey, ctrl: event.ctrlKey, alt: event.altKey, shift: event.shiftKey }, { mac: MAC, dialogOpen: workItemDialog.open });
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
      dialogOpen: workItemDialog.open,
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

/** Takes the daemon's lists at an `inbox`: notifies of each state that changed, drops the closed panes, and redraws the sidebar and the screen in front. */
function takeLists(next: { sessions: SessionInfo[]; workItems: WorkItem[] }): void {
  const before = new Map<number, AgentState | null>(held.sessions.map((session) => [session.id, session.state]));
  held.sessions = next.sessions;
  held.workItems = next.workItems;
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
  formError.textContent = "";
  createButton.disabled = false;
  workItemDialog.showModal();
  (repoField.value ? titleField : repoField).focus();
}

function createWorkItem(): void {
  const fields = workItemFields(repoField.value, titleField.value);
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
    case "asked":
      takeHeadless(message.headless, message.requestId);
      return;
    case "headless":
      takeHeadless(message.headless);
      return;
    case "error":
      // Nothing was created or started.
      requestRefused(message.requestId);
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
initView(() => openList("inbox"));
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
    if (folder) repoField.value = folder;
  });
});
workItemForm.addEventListener("submit", (event) => {
  event.preventDefault();
  createWorkItem();
});

void connect();
