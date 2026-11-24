// A work item's view: its header, its tabs with the terminals of the panes
// on the stage, or the back of its seal in the stage's place behind a tab of
// its own, and the strip under them, and its right column, which says what the
// daemon sends of the work item, the questions it is parked with, which it
// answers there, and the decisions made for it without asking among it,
// above the "Ask" section, where the calls its headless sessions ask the
// person to allow are answered, and the seal's place with "Get a seal",
// which starts the work item's chain, with the work item's pull request
// under it. The pool of terminal screens the window holds lives here, and so
// do the card of the link under the pointer and the menu of a pane.
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { WebglAddon } from "@xterm/addon-webgl";
import { type ILink, Terminal } from "@xterm/xterm";
import type { HeadlessInfo, LedgerEntry, PaneKind, SealRecords, SessionInfo, WorkItem } from "../shared/protocol";
import { backParts, byId, detail, drawSeal, entries, headlessIcon, held, part, request, row, sealPlace, send, showState, stateClass } from "./shared";
import {
  answersFor,
  askButton,
  askedSection,
  BACK_READING,
  BACK_TAB,
  backKey,
  backShown,
  CARD_LEAVE_MS,
  CARD_SHOW_MS,
  cardStaysAt,
  closeAsks,
  droppedText,
  GATE_HEAD,
  GATE_OUTPUT_SHOWS,
  type GateLine,
  type GateOutput,
  gateLine,
  hasBack,
  headlessKey,
  headlessLines,
  type LinkAct,
  linkCard,
  linkClick,
  type LinkTarget,
  lineSince,
  opensToBack,
  PANE_KEY_BYTES,
  paneChoices,
  paneKey,
  paneMenu,
  type PaneMenuAct,
  paneTabs,
  pathCandidates,
  pullRequestFacts,
  pathTarget,
  recentKept,
  refusedSeal,
  replayStep,
  repoNameOf,
  screenMoves,
  sealButton,
  type SealRefusal,
  sealShown,
  type ScreenTurns,
  screenTurns,
  stageOf,
  stateWithAge,
  tabLabel,
  tellsSize,
  viewFacts,
  webTarget,
  withHeadless,
  withoutHeadless,
} from "./view";

/** A terminal screen: one terminal with its element under the stage. It holds a pane while that pane is on the stage, and is free otherwise. */
interface Screen {
  term: Terminal;
  fit: FitAddon;
  element: HTMLElement;
  /** The pane on the screen, and the pane that what the terminal hands the window goes to. */
  turns: ScreenTurns;
}

// The size a pane's process starts at where no terminal is on screen to measure: xterm's own default.
const DEFAULT_SIZE = { cols: 80, rows: 24 };

// The terminal screens this window holds. One is made only where a pane comes onto the stage and none is free, and a free one stays, hidden, for the window's life. A pane that is not on the stage holds none: the daemon keeps its output (docs/architecture.md, Memory design).
const pool: Screen[] = [];
// The replays this window asked for and has not received, by pane. A pane that left the stage may still have one on its way.
const awaited = new Map<number, number>();
// The panes whose output this window has drawn from a replay once since it loaded.
const replayed = new Set<number>();
// The pane in front of the view on screen, which has the keyboard. No pane is in front on another screen.
let front: number | undefined;
// The panes that were in front in each work item's view since the window loaded, the most recent first. A closed pane stays only where it is the first.
const recent = new Map<number, number[]>();
// Whether "Side by side" is pressed: the window's own state, one for every view, off at each load.
let sideBySide = false;
// The work item whose view the "Ask" field's prompt was typed in.
let askingIn: number | undefined;
// The request the "Ask" field is waiting on: the field keeps its prompt until the daemon has taken it.
let askRequest: number | undefined;
// The key of the section of questions as it is drawn (./view, `askedSection`). The section is drawn again only where the key differs, so what a person chose and typed in it stays through the lists the daemon sends meanwhile.
let questionsDrawn: string | undefined;
// The key of the "Ask" section's lines as they are drawn (./view, `headlessKey`). They are drawn again only where the key differs, so a button the keyboard is on stays through the lists the daemon sends meanwhile.
let askDrawn: string | undefined;
// The request the section's answers are waiting on: "Send answers" stays off until the daemon answers.
let answersRequest: number | undefined;
// The address of the pull request the view shows, which a press of its row opens.
let pullRequestUrl: string | undefined;
// The request a press of "Get a seal" is waiting on, with its work item: the button stays off until the daemon answers.
let sealRequest: { requestId: number; workItemId: number } | undefined;
// What the window last read of a broad gate's output (./view, `GateOutput`), which stands under the line of the run it was read of.
let gateRead: GateOutput | null = null;
// The request a press of "Show output" is waiting on, with the work item and the run whose line was pressed.
let gateRequest: { requestId: number; workItemId: number; startedAt: number } | undefined;
// The daemon's refusal of the last "Get a seal", and the work item it refused it for.
let sealRefused: { workItemId: number; refusal: SealRefusal } | undefined;
// Whether the back of the seal is in front in the view on screen, in place of the panes. It is decided where the view is entered and by a press of a tab, and by no later list.
let backFront = false;
// What the back's place last drew, so a list that changes nothing of it draws nothing again and a selection in it stays.
let backDrawn: string | undefined;
// What the back asked the daemon while it is in front, and the answers: the work item, the key it was asked at (./view, `backKey`), each request, each answer, and the daemon's refusal of either. The answers are let go when a pane comes in front or the view is left.
let backAsked: { workItemId: number; key: string; recordsRequest: number; ledgerRequest: number; records: SealRecords | null; ledger: { entries: LedgerEntry[]; unread: number } | null; refusal: string | null } | undefined;
// What the view does where its work item is no longer listed: another screen takes its place.
let leave: () => void = () => {};
// The pane the dialog that asks before a working pane closes asked about last. Nothing reads it once that dialog has closed.
let asking: number | undefined;
// Whether the keyboard is a Mac's, which has the Command key.
let mac = false;
// What puts a work item's view in front, for a click on a link that is another work item's worktree.
let openWorkItem: (workItemId: number) => void = () => {};
// What a press of "Reverse" on a decision of the view's work item does: it opens the dialog that takes the message.
let reverseDecision: (workItemId: number, decisionId: number) => void = () => {};
// The target of the link the pointer is on, for the card that shows once the pointer has rested there.
let cardFor: LinkTarget | undefined;
// Where the pointer is in the window, as its last move said. The card shows at it.
let pointer = { x: 0, y: 0 };
let cardShowTimer: ReturnType<typeof setTimeout> | undefined;
let cardLeaveTimer: ReturnType<typeof setTimeout> | undefined;
// The menu of a pane, while it is open, and the terminal of the pane it is for, which takes the keyboard back when the menu closes.
let paneMenuElement: HTMLElement | undefined;
let paneMenuTerm: Terminal | undefined;

const viewTitle = byId("view-title");
const viewBranch = byId("view-branch");
const viewRepo = byId("view-repo");
const viewFactsTitle = byId("view-facts-title");
const viewState = byId("view-state");
const viewFactList = byId("view-fact-list");
const viewDetail = byId("view-detail");
const stripSize = byId("strip-size");
const stripWorktree = byId("strip-worktree");
const stripState = byId("strip-state");
const tabs = byId("tabs");
const paneButtons = byId("pane-buttons");
const noPanes = byId("no-panes");
const stage = byId("stage");
const back = byId("back");
const sideBySideButton = byId<HTMLButtonElement>("side-by-side");
const askForm = byId<HTMLFormElement>("ask-form");
const askField = byId<HTMLInputElement>("ask-prompt");
const askSubmit = byId<HTMLButtonElement>("ask-submit");
const headlessList = byId<HTMLUListElement>("headless");
const questionsSection = byId("questions");
const questionsHead = byId("questions-head");
const questionsAge = byId("questions-age");
const questionsList = byId("questions-list");
const questionsError = byId("questions-error");
const questionsSubmit = byId<HTMLButtonElement>("questions-submit");
const getSeal = byId<HTMLButtonElement>("get-seal");
const sealHead = byId("view-seal-head");
const sealWhy = byId("view-seal-why");
// The seal's place at the view's foot is made once, and drawn again for each work item the view shows.
const viewSeal = sealPlace("view", null);
const sealSays = byId("seal-says");
const sealRefusal = byId("seal-refusal");
const pullRequestSection = byId("view-pull-request");
const pullRequestList = byId("pull-request-list");
const closeDialog = byId<HTMLDialogElement>("close-pane-dialog");
const closeSentence = byId("close-pane-sentence");
const linkCardElement = byId("link-card");

/** The work item whose view is on screen, where the window holds it. */
function viewed(): WorkItem | undefined {
  return held.workItems.find((item) => item.id === held.viewing);
}

/** A value of the page's look: a custom property of the theme in use or of the layout, which the terminal takes its colours, its typeface and its size from. */
function look(property: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
}

/** The colours a terminal draws its own text and ground in, as the theme in use has them. */
function terminalColours(): { background: string; foreground: string; cursor: string } {
  return { background: look("--terminal-ground"), foreground: look("--terminal-ink"), cursor: look("--terminal-ink") };
}

/** Gives every screen of the pool the colours of the theme now in use, after the theme or the appearance changed. */
export function showTerminalColours(): void {
  for (const screen of pool) screen.term.options.theme = terminalColours();
}

/** Notes that a pane is in front in its work item's view, so it is the most recent of that view. */
function broughtToFront(workItemId: number, pane: number): void {
  recent.set(workItemId, [pane, ...(recent.get(workItemId) ?? []).filter((id) => id !== pane)]);
}

/** The screen a pane is on, or nothing for a pane that is not on the stage. */
function screenOf(pane: number | undefined): Screen | undefined {
  return pane === undefined ? undefined : pool.find((screen) => screen.turns.pane === pane);
}

/** Does with a link's target what a click or a row of the card chose (./view, `LinkAct`). The main process decides whether an address is one it opens, and reads the disk again before it shows a path. */
function act(chosen: LinkAct, target: LinkTarget): void {
  if (chosen === "copy") void window.owlery.copyText(target.kind === "web" ? target.address : target.path);
  else if (target.kind === "web") void window.owlery.openLink(target.address);
  else if (chosen === "workItem" && target.kind === "workItem") openWorkItem(target.workItemId);
  else void window.owlery.showInFinder(target.path);
}

/** Answers a click on a link the terminal found as an address, printed as text or behind a name: it opens outside Owlery where the click held the key that opens one (./view, `linkClick`). An address that is no web address is handed on as it is, and the main process opens nothing for it. */
function clickAddress(event: MouseEvent, address: string): void {
  if (linkClick("web", { meta: event.metaKey, ctrl: event.ctrlKey, shift: event.shiftKey }, mac) === "browser") void window.owlery.openLink(address);
}

/** Takes the card away at once, and forgets the link it was for. */
function hideCard(): void {
  clearTimeout(cardShowTimer);
  clearTimeout(cardLeaveTimer);
  cardFor = undefined;
  linkCardElement.hidden = true;
}

/** Has the card leave once the pointer has been on neither the link nor the card for `CARD_LEAVE_MS`. A card that only waits to show does not show. */
function cardLeaves(): void {
  clearTimeout(cardShowTimer);
  clearTimeout(cardLeaveTimer);
  cardLeaveTimer = setTimeout(hideCard, CARD_LEAVE_MS);
}

/**
 * Draws the card of a link's target (./view, `linkCard`) under the row of
 * the terminal the pointer is on, with its left edge at the pointer, and
 * moved to stand inside the window where it would pass an edge. Each row is
 * a button that does what it names and takes the card away.
 */
function showCard(target: LinkTarget, term: Terminal): void {
  const { title, rows } = linkCard(target, mac);
  linkCardElement.replaceChildren(
    part("target", title),
    ...rows.map(({ text, keys, act: chosen }) => {
      const button = document.createElement("button");
      button.append(part("does", text), part("keys", keys));
      button.addEventListener("click", () => {
        hideCard();
        act(chosen, target);
      });
      return button;
    }),
  );
  linkCardElement.hidden = false;
  const screen = (term.element?.querySelector(".xterm-screen") ?? term.element)?.getBoundingClientRect();
  const rowHeight = screen ? screen.height / term.rows : 0;
  // The row the pointer is on, by its top and its bottom in the window.
  const rowTop = screen ? screen.top + Math.floor((pointer.y - screen.top) / rowHeight) * rowHeight : pointer.y;
  const card = linkCardElement.getBoundingClientRect();
  const under = rowTop + rowHeight;
  linkCardElement.style.left = `${Math.max(0, Math.min(pointer.x, window.innerWidth - card.width))}px`;
  // Above the row where the window has no room under it.
  linkCardElement.style.top = `${under + card.height > window.innerHeight ? Math.max(0, rowTop - card.height) : under}px`;
}

/** Notes that the pointer came over a link with `target`, or over one with none: the card of a target shows once the pointer has rested there for `CARD_SHOW_MS`, and a link with no target has no card. */
function overLink(target: LinkTarget | null, term: Terminal): void {
  clearTimeout(cardShowTimer);
  if (target === null) return;
  clearTimeout(cardLeaveTimer);
  // The card of this very link is still there: the pointer came back from the card.
  if (!linkCardElement.hidden && cardFor !== undefined && JSON.stringify(cardFor) === JSON.stringify(target)) return;
  cardShowTimer = setTimeout(() => {
    cardFor = target;
    showCard(target, term);
  }, CARD_SHOW_MS);
}

/**
 * The text of the line a row of a terminal belongs to, read whole where the
 * terminal wrapped it over several rows, and for each character of the text
 * the cell it stands in: the cell's column and row, both from 1 as the
 * terminal counts them for a link, and its width, which is 2 for a wide
 * character such as a Korean syllable.
 */
function wholeLine(term: Terminal, row: number): { text: string; cells: { x: number; y: number; width: number }[] } {
  const buffer = term.buffer.active;
  let first = row - 1;
  while (first > 0 && buffer.getLine(first)?.isWrapped) first -= 1;
  let last = row - 1;
  while (buffer.getLine(last + 1)?.isWrapped) last += 1;
  let text = "";
  const cells: { x: number; y: number; width: number }[] = [];
  for (let y = first; y <= last; y += 1) {
    const line = buffer.getLine(y);
    for (let x = 0; line && x < Math.min(line.length, term.cols); x += 1) {
      const cell = line.getCell(x);
      const width = cell?.getWidth() ?? 0;
      // The second cell of a wide character holds nothing of its own.
      if (width === 0) continue;
      const characters = cell?.getChars() || " ";
      text += characters;
      for (let unit = 0; unit < characters.length; unit += 1) cells.push({ x: x + 1, y: y + 1, width });
    }
  }
  return { text, cells };
}

/**
 * Has a terminal find the paths a pane printed, beside the addresses the
 * link add-on finds. For the line under the pointer, the main process is
 * asked once what stands at each candidate of the line (./view,
 * `pathCandidates`), read from the worktree of the pane's work item, and a
 * candidate is a link only where a file or a folder stands there. Nothing
 * is kept between two requests. A click does what `linkClick` answers for
 * the path's target, and the pointer's rest on the link shows its card.
 */
function findsPaths(term: Terminal, turns: ScreenTurns): void {
  term.registerLinkProvider({
    provideLinks(row, callback) {
      const { text, cells } = wholeLine(term, row);
      const candidates = pathCandidates(text);
      const pane = turns.pane;
      const session = held.sessions.find((listed) => listed.id === pane);
      if (candidates.length === 0 || !session) {
        callback(undefined);
        return;
      }
      const worktree = held.workItems.find((item) => item.id === session.workItemId)?.worktree ?? null;
      void window.owlery
        .pathsOf(
          worktree,
          candidates.map((candidate) => candidate.text),
        )
        .then((found) => {
          // The screen went to another pane while the main process read the disk.
          if (turns.pane !== pane) return callback(undefined);
          const links: ILink[] = [];
          candidates.forEach((candidate, index) => {
            const stands = found[index];
            const start = cells[candidate.start];
            const end = cells[candidate.end - 1];
            if (!stands || !start || !end) return;
            // What the path leads to is read from the window's lists at the moment it is asked for.
            const target = (): LinkTarget => pathTarget(stands.path, held.workItems, held.viewing);
            links.push({
              range: { start: { x: start.x, y: start.y }, end: { x: end.x + end.width - 1, y: end.y } },
              text: candidate.text,
              activate(event) {
                const chosen = linkClick(target().kind, { meta: event.metaKey, ctrl: event.ctrlKey, shift: event.shiftKey }, mac);
                if (chosen !== null) act(chosen, target());
              },
              hover: () => overLink(target(), term),
              leave: cardLeaves,
            });
          });
          callback(links.length > 0 ? links : undefined);
        });
    },
  });
}

/** Closes the pane's menu where it is open. The terminal of the pane it was for takes the keyboard back, unless `giveKeyboard` is false, as where that pane leaves the stage. */
function closeMenu(giveKeyboard = true): void {
  if (!paneMenuElement) return;
  paneMenuElement.remove();
  paneMenuElement = undefined;
  if (giveKeyboard) paneMenuTerm?.focus();
  paneMenuTerm = undefined;
}

/**
 * Does what an item of a pane's menu names, for the pane a screen holds.
 * The clipboard is the main process's (src/main/clipboard.ts). A paste is
 * handed to the terminal as a dropped path is, so a program that asked for
 * pastes in brackets receives one, and an empty clipboard pastes nothing.
 * Before the terminal is cleared or reset the daemon is told to forget what
 * the pane printed: its replay draws the pane each time it comes onto the
 * stage, and would draw again what the person cleared. A clear asks the
 * daemon to keep the modes the pane's program set, such as pastes in
 * brackets, so the pane has them again when it comes back onto the stage,
 * as the cleared terminal has them now. A reset asks it to keep nothing,
 * since the reset ends those modes in the terminal.
 */
function menuAct(chosen: PaneMenuAct, { term, turns }: Screen): void {
  const pane = turns.pane;
  if (pane === undefined) return;
  if (chosen === "copy") void window.owlery.copyText(term.getSelection());
  else if (chosen === "paste")
    void window.owlery.clipboardText().then((text) => {
      // The screen may have gone to another pane while the main process answered.
      if (text !== "" && turns.pane === pane) term.paste(text);
    });
  else if (chosen === "selectAll") term.selectAll();
  else if (chosen === "close") {
    const session = held.sessions.find((listed) => listed.id === pane);
    if (session) closePane(session);
  } else if (chosen === "clear") {
    send({ type: "forget", id: pane, keepModes: true });
    term.clear();
  } else {
    send({ type: "forget", id: pane });
    term.reset();
  }
}

/**
 * Opens the menu of the pane a screen holds, with its corner at a place in
 * the window, moved to stand inside the window where it would pass an edge.
 * Its items are `paneMenu`'s (./view). The menu takes the keyboard: the up
 * and down arrows move through the items that can be pressed, and Escape
 * closes it. A press of an item closes the menu, gives the keyboard back to
 * the terminal and does what the item names. No menu is open when this is
 * called: the press that asks for a menu is a press outside the open one,
 * which closed it.
 */
function openMenu(screen: Screen, at: { x: number; y: number }): void {
  const menu = document.createElement("div");
  menu.id = "pane-menu";
  menu.setAttribute("role", "menu");
  menu.tabIndex = -1;
  const buttons: HTMLButtonElement[] = [];
  for (const item of paneMenu(mac, screen.term.hasSelection())) {
    if (item === null) {
      const rule = document.createElement("div");
      rule.setAttribute("role", "separator");
      menu.append(rule);
      continue;
    }
    const button = document.createElement("button");
    button.setAttribute("role", "menuitem");
    button.disabled = !item.enabled;
    button.append(part("does", item.text), part("keys", item.keys));
    button.addEventListener("click", () => {
      closeMenu();
      menuAct(item.act, screen);
    });
    if (item.enabled) buttons.push(button);
    menu.append(button);
  }
  menu.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
    else if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      // From the menu itself, where the keyboard starts, down goes to the first item and up to the last.
      const from = buttons.indexOf(document.activeElement as HTMLButtonElement);
      const down = event.key === "ArrowDown";
      const next = from === -1 ? (down ? 0 : buttons.length - 1) : (from + (down ? 1 : -1) + buttons.length) % buttons.length;
      buttons[next]?.focus();
    } else return;
    event.preventDefault();
  });
  // A press of the right button on the menu closes it, and the system's own menu stays away.
  menu.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    closeMenu();
  });
  document.body.append(menu);
  paneMenuElement = menu;
  paneMenuTerm = screen.term;
  const box = menu.getBoundingClientRect();
  menu.style.left = `${Math.max(0, Math.min(at.x, window.innerWidth - box.width))}px`;
  menu.style.top = `${Math.max(0, Math.min(at.y, window.innerHeight - box.height))}px`;
  menu.focus();
}

/**
 * Has an element take the files a person drops on it, for the terminal of
 * the screen it holds: the terminal is handed the files' paths as a paste
 * (./view, `droppedText`), so a program that asked for pastes in brackets
 * receives one, and it takes the keyboard, so its pane is in front. A drag
 * that carries no file is not taken, and neither is a drop anywhere else in
 * the window. The drop's own default is left alone: Electron starts no
 * navigation for a dropped file while `navigateOnDragDrop` is false, its
 * default, which src/main/main.ts does not change.
 */
function takesDrops(element: HTMLElement, term: Terminal): void {
  element.addEventListener("dragover", (event) => {
    // An element takes a drop only where it answered the drag.
    if (event.dataTransfer?.types.includes("Files")) event.preventDefault();
  });
  element.addEventListener("drop", (event) => {
    const text = droppedText([...(event.dataTransfer?.files ?? [])].map((file) => window.owlery.pathOf(file)));
    term.focus();
    // An empty paste would still send its brackets.
    if (text !== "") term.paste(text);
  });
}

/**
 * Adds a screen to the pool, for a pane that comes onto the stage where no
 * screen is free. The view is on screen then, so the terminal opens in an
 * element that is displayed. Each size the screen takes goes to the pane
 * that holds it at that moment where that pane's process runs, and a free
 * screen sends nothing. What a person types and what the terminal answers
 * go where the screen's turns say (./view, `screenTurns`), and so do the
 * line feed of Shift+Enter, the bytes of the three editing keys and the
 * paths of dropped files. A press inside
 * the screen gives its pane the keyboard, so that pane is in front. A link
 * the pane printed opens outside Owlery at a click with the Command key,
 * a path it printed is a link where something stands at it (`findsPaths`),
 * and the pointer's rest on either shows the link's card. A press of the
 * right button opens the pane's menu (`openMenu`).
 */
function newScreen(): Screen {
  const element = document.createElement("div");
  element.className = "pane";
  stage.appendChild(element);
  const term = new Terminal({
    // The UI keeps 1,000 lines; older output stays with the daemon (docs/architecture.md, Memory design).
    scrollback: 1000,
    fontFamily: look("--font-terminal"),
    fontSize: Number.parseFloat(look("--size-terminal")),
    theme: terminalColours(),
    cursorBlink: true,
    macOptionIsMeta: true,
    allowProposedApi: true,
    // A link a program printed behind a name (the OSC 8 sequence). Without a handler the terminal asks through the browser's own question and opens a window.
    linkHandler: { activate: clickAddress, hover: (_event, address) => overLink(webTarget(address), term), leave: cardLeaves },
  });
  const fit = new FitAddon();
  term.loadAddon(fit);
  // An address a program printed as plain text.
  term.loadAddon(new WebLinksAddon(clickAddress, { hover: (_event, address) => overLink(webTarget(address), term), leave: cardLeaves }));
  term.open(element);
  try {
    const webgl = new WebglAddon();
    // On a lost GPU context the screen falls back to the DOM renderer.
    webgl.onContextLoss(() => webgl.dispose());
    term.loadAddon(webgl);
  } catch {
    // No WebGL: the DOM renderer stays.
  }
  const turns = screenTurns(term);
  const screen: Screen = { term, fit, element, turns };
  // What a person types and what the terminal answers a program's question with arrive here alike.
  term.onData((data) => {
    const id = turns.receiver();
    if (id !== undefined) send({ type: "input", id, data });
  });
  // Read before the terminal reads the key. Where it is the window's, the terminal sends nothing for the press, and the key's byte goes the way a typed key goes: a line feed, or the byte of an editing key (./view, `paneKey`).
  term.attachCustomKeyEventHandler((event) => {
    const key = paneKey({ key: event.key, shift: event.shiftKey, ctrl: event.ctrlKey, alt: event.altKey, meta: event.metaKey, isComposing: event.isComposing, keyCode: event.keyCode }, mac);
    if (key === null) return true;
    // The terminal hands this each event of the press. Without the default, the hidden field the terminal types in takes no line break.
    event.preventDefault();
    if (event.type === "keydown") term.input(PANE_KEY_BYTES[key]);
    return false;
  });
  takesDrops(element, term);
  findsPaths(term, turns);
  // A press of the right button, and a press with the Control key, ask for a menu. The pane's own opens in place of the system's. The terminal has read the press by then: it took the keyboard, so the pane is the one in front, and on a Mac it selected the word under the pointer.
  element.addEventListener("contextmenu", (event) => {
    event.preventDefault();
    openMenu(screen, { x: event.clientX, y: event.clientY });
  });
  term.onResize(({ cols, rows }) => {
    if (turns.pane === undefined) return;
    if (tellsSize(held.sessions, turns.pane)) send({ type: "resize", id: turns.pane, cols, rows });
    showSize();
  });
  element.addEventListener("focusin", () => {
    if (turns.pane === undefined || turns.pane === front || held.viewing === undefined) return;
    broughtToFront(held.viewing, turns.pane);
    showView();
  });
  pool.push(screen);
  return screen;
}

/**
 * Puts a pane on a free screen that stands at its place on the stage: the
 * screen is fitted to that place, the process is told the size where it
 * runs, and the window asks for the pane's output so far, which is written
 * into the emptied terminal when it arrives.
 */
function take(screen: Screen, pane: number): void {
  // Fitted while the screen is still free, so the size is sent once, below, whether or not the fit changed it.
  screen.fit.fit();
  screen.turns.take(pane);
  // An exited pane's pseudo-terminal is closed, and a daemon an earlier build left running fails on a size sent for it.
  if (tellsSize(held.sessions, pane)) send({ type: "resize", id: pane, cols: screen.term.cols, rows: screen.term.rows });
  // The replay holds everything the pane printed, a pane this window started a moment ago included.
  awaited.set(pane, (awaited.get(pane) ?? 0) + 1);
  send({ type: "attach", id: pane });
}

/** Takes a screen back from the pane on it, as the pane leaves the stage: the daemon is told to send this window no more of the pane's output, and the screen is emptied and hidden. */
function giveBack(screen: Screen): void {
  if (screen.turns.pane === undefined) return;
  // A menu open for this pane closes as the pane leaves the stage: the screen goes to the next pane that comes, and the menu's items would act on that one. The terminal is not given the keyboard, since its pane is leaving.
  if (paneMenuTerm === screen.term) closeMenu(false);
  send({ type: "detach", id: screen.turns.pane });
  screen.turns.giveBack();
  screen.element.hidden = true;
}

/**
 * Has the stage show `shown`, in that order, and no other pane: a pane that
 * left gives its screen back, and a pane that came takes a free screen, or a
 * new one where none is free. Each screen stands at its pane's place among
 * the tiles before it is fitted, and a screen whose pane stays is fitted
 * again, since its tile may have changed its size.
 */
function stageShows(shown: readonly number[]): void {
  const moves = screenMoves(
    pool.map((screen) => screen.turns.pane),
    shown,
  );
  for (const { screen } of moves.back) giveBack(pool[screen] as Screen);
  const taken = moves.taken.map(({ screen, pane }) => ({ screen: pool[screen] ?? newScreen(), pane }));
  // The page's style reads both: how many tiles the stage holds, and which of them a screen is.
  stage.dataset.tiles = String(shown.length);
  const placed = (screen: Screen, pane: number): void => {
    screen.element.dataset.tile = String(shown.indexOf(pane) + 1);
    screen.element.hidden = false;
  };
  for (const screen of pool) if (screen.turns.pane !== undefined) placed(screen, screen.turns.pane);
  for (const { screen, pane } of taken) placed(screen, pane);
  for (const screen of pool) if (screen.turns.pane !== undefined) screen.fit.fit();
  for (const { screen, pane } of taken) take(screen, pane);
}

/** Whether a pane is on the stage of the view on screen. No pane is on another screen. */
export function onStage(pane: number): boolean {
  return screenOf(pane) !== undefined;
}

/** Takes back the screen of each pane the daemon no longer lists, awaits no replay of it, and counts it no longer among the panes that were in front, unless it was the most recent of them. */
export function dropClosed(listed: ReadonlySet<number>): void {
  for (const screen of pool) {
    const pane = screen.turns.pane;
    if (pane === undefined || listed.has(pane)) continue;
    if (front === pane) front = undefined;
    giveBack(screen);
  }
  // The pane the dialog asks about was closed some other way, so nothing is left to ask. Closing a dialog that is not open does nothing.
  if (asking !== undefined && !listed.has(asking)) closeDialog.close();
  // The closed pane that was in front stays as the last in front, so the live pane with the highest id follows it, and with "Side by side" pressed the live one with the highest id of the first four panes of the stage order, which hold tabs never in front where fewer than four of the tabs were in front, or the one of the four with the highest id where none of them runs (./view, `recentKept` and `stageOf`).
  for (const [workItemId, panes] of recent) recent.set(workItemId, recentKept(panes, listed));
  for (const pane of [...awaited.keys()]) if (!listed.has(pane)) awaited.delete(pane);
  for (const pane of [...replayed]) if (!listed.has(pane)) replayed.delete(pane);
}

/** The size a new pane's process starts at: that of the screen of the pane in front, or the default where no pane is on the stage. The pane's own screen sends its size once the pane takes it. */
export function startSize(): { cols: number; rows: number } {
  const screen = screenOf(front);
  return screen ? { cols: screen.term.cols, rows: screen.term.rows } : DEFAULT_SIZE;
}

/** Says in the strip the columns and rows of the screen of the pane in front, or nothing where the view shows none. */
function showSize(): void {
  const screen = screenOf(front);
  stripSize.textContent = screen ? `${screen.term.cols} \u00d7 ${screen.term.rows}` : "";
}

/** Starts a pane of `kind` in the work item whose view is on screen, on the latest conversation of its worktree where `continueLatest`. */
function start(kind: PaneKind, continueLatest: boolean): void {
  if (held.viewing === undefined) return;
  send({ type: "start", kind, ...startSize(), requestId: request(), workItemId: held.viewing, ...(continueLatest ? { continueLatest: true } : {}) });
}

/** Builds, once per connection, the view's button for each choice the kinds of pane the daemon offers give. */
export function showPaneButtons(): void {
  paneButtons.replaceChildren(
    ...paneChoices(held.paneKinds).map(({ kind, text, hint, continueLatest }) => {
      const button = document.createElement("button");
      button.textContent = text;
      if (hint !== null) button.title = hint;
      button.addEventListener("click", () => start(kind, continueLatest));
      return button;
    }),
  );
}

/** Sets the "Ask" button for the view's work item and the field as they are now. */
function showAsk(workItem: WorkItem): void {
  const button = askButton(askField.value, workItem);
  askSubmit.disabled = !button.enabled;
  askSubmit.title = button.title;
}

/** One of the two buttons of a call a session asks the person to allow, which sends the person's answer to the request `id` of the work item. `data-answer` names the request and the answer, so a redraw finds the same button again. */
function answerButton(workItemId: number, id: number, allow: boolean): HTMLButtonElement {
  const button = document.createElement("button");
  button.className = "quiet";
  button.textContent = allow ? "Allow" : "Refuse";
  button.title = allow ? "Allow this one call" : "Refuse this call: the agent is told the person refused it";
  button.dataset.answer = `${id}:${allow ? "allow" : "refuse"}`;
  button.addEventListener("click", () => send({ type: "answerPermission", requestId: request(), workItemId, id, allow }));
  return button;
}

/** The broad gate's line of the "Ask" section, in the form of a headless session's line: the mark and the word of its state, the words "Broad gate" with the command, "Stop" while the command runs, "Show output" where the daemon kept what it printed, the failure of a gate that failed, and what the window last read of this run's output. */
function gateItem(workItemId: number, line: GateLine): HTMLLIElement {
  const item = document.createElement("li");
  item.className = "gate";
  const prompt = part("prompt", `${GATE_HEAD} `);
  // The command is plain text, never markup.
  prompt.append(part("command", line.command));
  const head = row(headlessIcon(line.state, line.words), prompt, part(`state ${line.state}`, line.words));
  if (line.stop) {
    const stop = document.createElement("button");
    stop.className = "quiet";
    stop.textContent = "Stop";
    stop.title = "Stop the broad gate's command";
    stop.dataset.answer = "gate:stop";
    stop.addEventListener("click", () => send({ type: "stopGate", requestId: request(), workItemId }));
    head.append(stop);
  }
  if (line.output) {
    const show = document.createElement("button");
    show.className = "quiet";
    show.textContent = GATE_OUTPUT_SHOWS;
    show.title = "Show what the broad gate's command printed";
    show.dataset.answer = "gate:output";
    show.addEventListener("click", () => {
      gateRequest = { requestId: request(), workItemId, startedAt: line.startedAt };
      send({ type: "readGateOutput", requestId: gateRequest.requestId, workItemId });
    });
    head.append(show);
  }
  item.append(head, part("answer", line.text));
  if (line.printed) {
    if (line.printed.note) item.append(part("output-note", line.printed.note));
    // What the command printed is plain text, never markup, whole, with its line breaks kept by the style.
    item.append(part("error-output", line.printed.text));
  }
  return item;
}

/**
 * Takes what the daemon answered a press of "Show output" with, and answers
 * whether the request was that press's: the text stands under the line of
 * the run whose line was pressed, where the view still draws that run.
 */
export function takeGateOutput(requestId: number, output: { text: string; cut: boolean }): boolean {
  if (requestId !== gateRequest?.requestId) return false;
  gateRead = { workItemId: gateRequest.workItemId, startedAt: gateRequest.startedAt, ...output };
  gateRequest = undefined;
  showAskSection();
  return true;
}

/**
 * Draws the "Ask" section of the view on screen: the button as the field
 * stands, the line of the work item's newest broad gate, first, and the
 * work item's headless sessions. The line of a working session offers
 * "Stop", which asks the daemon to stop it; the daemon answers
 * `done`, and the `headless` that follows carries the session as failed. A
 * session that waits for the person to allow a call says "Needs you" with
 * the waiting mark, and shows each call it waits on as a card with "Allow"
 * and "Refuse"; the daemon answers `done`, and the `inbox` that follows
 * carries the work item without the request. The lines are drawn again only
 * where the section's key is another (./view, `headlessKey`), so every
 * `inbox` that changes nothing they show leaves them, and the keyboard, as
 * they are. Where they are drawn again while the keyboard is on a request's
 * button or on a button of the gate's line, the same button takes it back,
 * where it is still drawn.
 */
function showAskSection(): void {
  const workItem = viewed();
  if (!workItem) return;
  showAsk(workItem);
  const lines = headlessLines(held.headless, workItem);
  const gate = gateLine(workItem, gateRead);
  const key = headlessKey(workItem.id, lines, gate);
  if (key === askDrawn) return;
  askDrawn = key;
  const focused = document.activeElement;
  const kept = focused instanceof HTMLElement && headlessList.contains(focused) ? focused.dataset.answer : undefined;
  headlessList.replaceChildren(
    ...(gate ? [gateItem(workItem.id, gate)] : []),
    ...lines.map((line) => {
      const item = document.createElement("li");
      const head = row(headlessIcon(line.mark, line.words), part("prompt", line.prompt), part(`state ${line.mark}`, line.words));
      if (line.stop) {
        const stop = document.createElement("button");
        stop.className = "quiet";
        stop.textContent = "Stop";
        stop.title = "Stop this session";
        stop.addEventListener("click", () => send({ type: "stopHeadless", requestId: request(), id: line.id }));
        head.append(stop);
      }
      item.append(head);
      for (const ask of line.asks) {
        const card = document.createElement("section");
        card.className = "permission";
        const asks = document.createElement("h3");
        asks.textContent = ask.head;
        const answers = part("answers", "");
        answers.append(answerButton(workItem.id, ask.id, true), answerButton(workItem.id, ask.id, false));
        // The call's text is plain text, never markup, whole, with its line breaks kept by the style.
        card.append(asks, part("call", ask.text), answers);
        item.append(card);
      }
      // The answer and the error output are plain text, never markup, and their line breaks are kept by the style.
      item.append(part("answer", line.text));
      if (line.errorOutput) item.append(part("error-output", line.errorOutput));
      return item;
    }),
  );
  if (kept !== undefined) headlessList.querySelector<HTMLElement>(`button[data-answer="${kept}"]`)?.focus();
}

/**
 * Draws the section that holds the questions the view's work item is parked
 * with: every question at once, each with who asks where the record says
 * it, its grounds, its options as radio buttons, what each implies, and a
 * field for another answer, the question's default chosen. A question that
 * names no option has the field alone. While the work item is parked the
 * section carries the class of what needs the person, and the theme gives
 * it that edge. After the answer the section lists each question with its
 * answer, until the look the window holds has each as answered. It is
 * hidden from then on, and for a work item that never was parked. The age
 * is said anew at each call. The questions are drawn again only where the
 * section's key is another, so a choice and a typed answer stay, with the
 * keyboard and a composition under way, through every `inbox` that arrives
 * meanwhile.
 */
function showQuestions(workItem: WorkItem): void {
  const section = askedSection(workItem, Date.now(), held.lastLook);
  questionsSection.hidden = !section;
  if (!section) {
    questionsDrawn = undefined;
    questionsList.replaceChildren();
    return;
  }
  questionsSection.classList.toggle("waiting", section.parked);
  questionsHead.textContent = section.head;
  questionsAge.textContent = section.age;
  if (section.key === questionsDrawn) return;
  questionsDrawn = section.key;
  answersRequest = undefined;
  questionsError.textContent = "";
  questionsSubmit.hidden = !section.parked;
  questionsSubmit.disabled = false;
  questionsList.replaceChildren(
    ...section.questions.map((question) => {
      // A question's text, an option and an answer are plain text, never markup.
      if (!section.parked) {
        const answered = document.createElement("div");
        answered.className = "question";
        answered.append(part("asks", question.asks), part("answer", question.answer ?? ""));
        return answered;
      }
      const field = document.createElement("fieldset");
      field.className = "question";
      field.dataset.question = String(question.id);
      const asks = document.createElement("legend");
      asks.className = "asks";
      asks.textContent = question.asks;
      const other = document.createElement("input");
      other.className = "other-answer";
      other.autocomplete = "off";
      other.setAttribute("aria-label", `Another answer to: ${question.asks}`);
      const choice = (value: string, checked: boolean, ...words: HTMLElement[]): HTMLElement => {
        const label = document.createElement("label");
        label.className = "option";
        const radio = document.createElement("input");
        radio.type = "radio";
        radio.name = `question-${question.id}`;
        radio.value = value;
        radio.checked = checked;
        label.append(radio, ...words);
        return label;
      };
      // Who asks and why the question is the person's are plain text, never markup.
      field.append(asks, part("by", question.by), part("grounds", question.grounds), ...question.options.map((option, index) => choice(String(index), index === question.chosen, part("label", option.label), part("mark", option.mark), part("implies", option.implies))));
      if (question.options.length > 0) {
        field.append(choice("other", false, part("label", "Another answer")));
        // Words typed as another answer choose it.
        other.addEventListener("input", () => {
          const radio = field.querySelector<HTMLInputElement>('input[type="radio"][value="other"]');
          if (radio) radio.checked = true;
        });
      }
      field.append(other);
      return field;
    }),
  );
}

/**
 * Sends the answers of the section as "Send answers" asks: for each
 * question the option chosen or the words typed as another answer. The
 * daemon writes them into the work item's record, which ends the park, and
 * the `inbox` after its `done` carries the questions as answered. It refuses
 * an empty answer, and the section shows its refusal.
 */
function sendAnswers(): void {
  const workItem = viewed();
  const section = workItem && askedSection(workItem, Date.now(), held.lastLook);
  // One request per answer: a second press before the daemon has answered would send the answers twice.
  if (!workItem || !section?.parked || answersRequest !== undefined) return;
  const fields = section.questions.map((question) => questionsList.querySelector<HTMLElement>(`[data-question="${question.id}"]`));
  const choices = fields.map((field) => {
    // A question that names no option has the field alone, whose words are its answer.
    if (!field?.querySelector('input[type="radio"]')) return "other";
    const chosen = field.querySelector<HTMLInputElement>('input[type="radio"]:checked');
    return chosen ? (chosen.value === "other" ? "other" : Number(chosen.value)) : null;
  });
  const typed = fields.map((field) => field?.querySelector<HTMLInputElement>("input.other-answer")?.value ?? "");
  answersRequest = request();
  questionsError.textContent = "";
  questionsSubmit.disabled = true;
  send({ type: "answerQuestions", requestId: answersRequest, workItemId: workItem.id, answers: answersFor(section.questions, choices, typed) });
}

/**
 * Draws the view's foot for the view's work item: the seal's place and its
 * words for the seal its branch's head holds (./view, `sealShown`), with
 * the seal's sentence under its head where the seal is broken, and
 * "Get a seal" (./view, `sealButton`): the button where the daemon sent the
 * work item's chain, in its words for that seal, the chain's sentence above
 * it and the daemon's refusal of the last press under it, while the chain
 * stands as it stood at that refusal.
 */
function showSeal(workItem: WorkItem): void {
  drawSeal(viewSeal, workItem.seal);
  const shown = sealShown(workItem.seal);
  sealHead.textContent = shown.words;
  // The daemon's sentence is plain text, never markup.
  sealWhy.textContent = shown.why;
  const button = sealButton(workItem, sealRequest?.workItemId === workItem.id, sealRefused?.workItemId === workItem.id ? sealRefused.refusal : null);
  getSeal.textContent = button.words;
  getSeal.hidden = !button.offered;
  getSeal.disabled = !button.enabled;
  getSeal.title = button.title;
  sealSays.textContent = button.says;
  sealRefusal.textContent = button.refusal;
}

/**
 * Draws the view's work item's pull request under the seal's place (./view,
 * `pullRequestFacts`), or hides the section where it has none: its number
 * and its state on a row that opens it, the result of its checks, a row for
 * each check, which opens the check where GitHub gave it an address, how
 * many more checks GitHub listed, and why the last read failed. Each address
 * goes to the main process, which opens an `http` or `https` one alone, and
 * none in an app started in the background.
 */
function showPullRequest(workItem: WorkItem): void {
  const facts = pullRequestFacts(workItem);
  pullRequestSection.hidden = facts === null;
  pullRequestUrl = facts?.url;
  if (facts === null) {
    pullRequestList.replaceChildren();
    return;
  }
  byId("pull-request-number").textContent = facts.head;
  byId("pull-request-state").textContent = facts.state;
  byId("pull-request-open").title = `Open ${facts.head} on GitHub`;
  byId("pull-request-checks").textContent = facts.checks;
  pullRequestList.replaceChildren(
    ...facts.rows.map(({ name, mark, words, link }) => {
      const item = document.createElement("li");
      const check = document.createElement(link === null ? "div" : "button");
      check.className = "row check";
      // A check's name is plain text, never markup.
      check.append(headlessIcon(mark, words), part("name", name), part(`words state ${mark}`, words));
      if (link !== null) {
        (check as HTMLButtonElement).type = "button";
        check.title = `Open the check ${name} on GitHub`;
        check.addEventListener("click", () => void window.owlery.openLink(link));
      }
      item.append(check);
      return item;
    }),
  );
  byId("pull-request-more").textContent = facts.foot;
  byId("pull-request-failure").textContent = facts.failure;
}

/** Asks the daemon to start the chain of the work item whose view is on screen, as a press of "Get a seal" does. The daemon answers `done` once the chain has started, and the `inbox` that follows carries it. */
function askSeal(): void {
  const workItem = viewed();
  // One request per answer: a second press before the daemon has answered would ask for a second start.
  if (!workItem || sealRequest !== undefined || !sealButton(workItem, false, null).enabled) return;
  sealRequest = { requestId: request(), workItemId: workItem.id };
  send({ type: "getSeal", requestId: sealRequest.requestId, workItemId: workItem.id });
  showSeal(workItem);
}

/**
 * Takes the daemon's answer to a press of "Get a seal", `refusal` being its
 * refusal or null for `done`, and answers whether the request was that
 * press's. A refusal is shown under the button, with the button on again,
 * and is kept with the chain as the window holds it at the answer.
 */
export function takeSeal(requestId: number, refusal: string | null): boolean {
  if (requestId !== sealRequest?.requestId) return false;
  const { workItemId } = sealRequest;
  sealRefused = refusal === null ? undefined : { workItemId, refusal: refusedSeal(held.workItems.find((item) => item.id === workItemId), refusal) };
  sealRequest = undefined;
  const workItem = viewed();
  if (workItem) showSeal(workItem);
  return true;
}

/**
 * Takes the daemon's answer to the section's request, `refusal` being its
 * refusal or null for `done`, and answers whether the request was the
 * section's. A refusal is shown in the section, with "Send answers" on
 * again. After `done` the keyboard goes back to the pane in front, since
 * the `inbox` that follows takes the section's controls away.
 */
export function takeAnswers(requestId: number, refusal: string | null): boolean {
  if (requestId !== answersRequest) return false;
  answersRequest = undefined;
  questionsSubmit.disabled = false;
  questionsError.textContent = refusal ?? "";
  if (refusal === null) screenOf(front)?.term.focus();
  return true;
}

/**
 * Closes a pane, as a press of its tab's "×" asks. The daemon ends the
 * process and takes the session off its lists, and the tab goes at the
 * `inbox` that follows. A pane whose session is working (./view,
 * `closeAsks`) is not closed here: a dialog names it and asks, with the
 * keyboard on "Cancel", and only its "Close pane" sends the close.
 */
function closePane(session: SessionInfo): void {
  if (!closeAsks(session)) {
    send({ type: "close", id: session.id });
    return;
  }
  const workItem = held.workItems.find((item) => item.id === session.workItemId);
  asking = session.id;
  closeSentence.textContent = `${tabLabel(session, workItem ? paneTabs(workItem, held.sessions) : [session], held.paneKinds, workItem?.setup?.paneId ?? null)} is working. Closing the pane ends its session.`;
  // The keyboard starts on "Cancel", the dialog's first button.
  closeDialog.showModal();
}

/** Closes the pane in front, as a press of its tab's "×" does. Where no pane is in front, which is so on every screen but a work item's view and in a view whose back is in front, it does nothing. */
export function closeFront(): void {
  const session = held.sessions.find((listed) => listed.id === front);
  if (session) closePane(session);
}

/** A pane's tab among `listed`, its work item's tabs, marked where its pane is on the stage, `shown`, and where it is the one in front, `active`. `setupPane` is the pane the work item's setup names, whose tab reads "Setup". */
function tabElement(session: SessionInfo, listed: readonly SessionInfo[], active: boolean, shown: boolean, setupPane: number | null): HTMLElement {
  const tab = document.createElement("span");
  tab.className = `tab${shown ? " shown" : ""}${active ? " active" : ""}`;
  const label = document.createElement("button");
  label.className = "label";
  label.textContent = tabLabel(session, listed, held.paneKinds, setupPane);
  const close = document.createElement("button");
  close.className = "close";
  close.textContent = "×";
  // The button shows a mark alone: a screen reader is told its name, and a pointer that rests on it what a press does.
  close.setAttribute("aria-label", `Close ${label.textContent}`);
  close.title = `End ${label.textContent} and close its tab.`;
  label.addEventListener("click", () => {
    if (held.viewing === undefined) return;
    backFront = false;
    broughtToFront(held.viewing, session.id);
    showView();
  });
  close.addEventListener("click", () => closePane(session));
  tab.append(label, close);
  return tab;
}

/** The back's tab, first in the strip and with no close mark, marked where the back is in front, `active`. A press puts the back in front. */
function backTab(active: boolean): HTMLElement {
  const tab = document.createElement("span");
  tab.className = `tab back${active ? " active" : ""}`;
  const label = document.createElement("button");
  label.className = "label";
  label.textContent = BACK_TAB;
  label.addEventListener("click", () => {
    if (held.viewing === undefined) return;
    backFront = true;
    showView();
  });
  tab.append(label);
  return tab;
}

/**
 * Draws the back of the seal of the view's work item in the back's place
 * (./view, `backShown`; ./shared, `backParts`), and asks the daemon for its
 * records and its ledger, both at once, where nothing was asked for this
 * work item yet or a later list gives another key. While a second ask waits,
 * the back drawn from the first answers stays, and a list that changes
 * nothing the back draws draws nothing again.
 */
function showBack(workItem: WorkItem): void {
  const key = backKey(workItem);
  if (backAsked?.workItemId !== workItem.id || backAsked.key !== key) {
    backAsked = { workItemId: workItem.id, key, recordsRequest: request(), ledgerRequest: request(), records: null, ledger: null, refusal: null };
    send({ type: "readSealRecords", requestId: backAsked.recordsRequest, workItemId: workItem.id });
    send({ type: "readLedger", requestId: backAsked.ledgerRequest, workItemId: workItem.id });
  }
  const shown = backShown(backAsked);
  if (shown === BACK_READING && back.dataset.workItem === String(workItem.id) && back.childElementCount > 0) return;
  const drawn = JSON.stringify([workItem.id, shown, workItem.seal ?? null]);
  if (drawn === backDrawn) return;
  backDrawn = drawn;
  back.dataset.workItem = String(workItem.id);
  back.replaceChildren(...backParts(shown, workItem.seal));
}

/** Lets the back's answers go and empties its place, as when a pane comes in front or the view is left. */
function dropBack(): void {
  backAsked = undefined;
  backDrawn = undefined;
  delete back.dataset.workItem;
  back.replaceChildren();
}

/** Takes an answer the back asked for and draws the back again where it is in front, and answers whether the request was the back's. */
function takeBackAnswer(requestId: number, took: (asked: NonNullable<typeof backAsked>) => void): boolean {
  if (backAsked === undefined || (requestId !== backAsked.recordsRequest && requestId !== backAsked.ledgerRequest)) return false;
  took(backAsked);
  const workItem = viewed();
  if (backFront && workItem?.id === backAsked.workItemId) showBack(workItem);
  return true;
}

/** Takes the daemon's `sealRecords`, and answers whether it answered the back. */
export function takeSealRecords(requestId: number, records: SealRecords): boolean {
  return takeBackAnswer(requestId, (asked) => {
    if (requestId === asked.recordsRequest) asked.records = records;
  });
}

/** Takes the daemon's `ledger`, and answers whether it answered the back. */
export function takeLedger(requestId: number, ledger: { entries: LedgerEntry[]; unread: number }): boolean {
  return takeBackAnswer(requestId, (asked) => {
    if (requestId === asked.ledgerRequest) asked.ledger = ledger;
  });
}

/** Takes the daemon's refusal of either of the back's requests, which the back's place then says, and answers whether the request was the back's. */
export function takeBackRefusal(requestId: number, refusal: string): boolean {
  return takeBackAnswer(requestId, (asked) => {
    asked.refusal = refusal;
  });
}

/**
 * Draws the view of the work item on screen: its header, its tabs, the
 * panes on the stage, each on a screen of the pool, with the strip under
 * them, its right column, the questions it is parked with among it, and its
 * "Ask" section. The stage holds the pane in
 * front, or up to four panes as tiles where "Side by side" is pressed, and
 * gives way to the back of the seal while the back's tab is in front. It
 * starts no process.
 */
export function showView(): void {
  const entry = entries().find((listed) => listed.workItem.id === held.viewing);
  if (!entry) {
    leave();
    return;
  }
  const { workItem, line } = entry;
  const now = Date.now();
  const since = lineSince(workItem, entry.session);
  const state = stateWithAge(line.state, since, now);
  viewTitle.textContent = line.title;
  viewBranch.textContent = line.branch;
  viewRepo.textContent = repoNameOf(workItem);
  viewFactsTitle.textContent = line.title;
  showState(viewState, line.state, since);
  viewFactList.replaceChildren(
    ...viewFacts(entry, held.paneKinds, now).flatMap(({ label, value }) => {
      const term = document.createElement("dt");
      term.textContent = label;
      const said = document.createElement("dd");
      said.textContent = value;
      return [term, said];
    }),
  );
  showQuestions(workItem);
  showSeal(workItem);
  showPullRequest(workItem);
  viewDetail.replaceChildren(...detail(entry, 0, { reverse: (decisionId) => reverseDecision(workItem.id, decisionId), runSetup: (command) => runSetup(workItem.id, command) }));
  stripWorktree.textContent = workItem.worktree;
  stripState.textContent = state;
  stripState.className = `state ${stateClass(line.state)}`;
  const listed = paneTabs(workItem, held.sessions);
  const backed = hasBack(workItem);
  if (!backed) backFront = false;
  // With the back in front no pane is on the stage, and the stage gives way to the back's place.
  const { front: target, shown } = backFront ? { front: undefined, shown: [] } : stageOf(listed, recent.get(workItem.id) ?? [], sideBySide);
  tabs.replaceChildren(...(backed ? [backTab(backFront)] : []), ...listed.map((session) => tabElement(session, listed, session.id === target, shown.includes(session.id), workItem.setup?.paneId ?? null)));
  noPanes.hidden = listed.length > 0 || backFront;
  stage.hidden = backFront;
  back.hidden = !backFront;
  if (backFront) showBack(workItem);
  else dropBack();
  stageShows(shown);
  if (target !== front) {
    front = target;
    if (target !== undefined) {
      broughtToFront(workItem.id, target);
      screenOf(target)?.term.focus();
    }
  }
  showSize();
  showAskSection();
}

/** Makes a work item the one whose view is drawn, before the view is put in front. Where `pane` is given, that pane is the one in front when the view is drawn, as after a press of its tab. */
export function enterView(workItemId: number, pane?: number): void {
  // A prompt typed for one work item is not asked in another.
  if (askingIn !== workItemId) askField.value = "";
  askingIn = workItemId;
  // A press whose answer never came, as where the daemon ended first, holds the button off no longer.
  sealRequest = undefined;
  held.viewing = workItemId;
  front = undefined;
  // A view entered with no pane opens to the back where the work item holds a seal (./view, `opensToBack`).
  backFront = opensToBack(held.workItems.find((item) => item.id === workItemId), pane);
  if (backAsked?.workItemId !== workItemId) dropBack();
  if (pane !== undefined) broughtToFront(workItemId, pane);
}

/** Leaves the view for another screen, and gives the work item that was on screen. Every pane leaves the stage, and its screen goes back to the pool. */
export function leaveView(): number | undefined {
  const left = held.viewing;
  held.viewing = undefined;
  front = undefined;
  backFront = false;
  dropBack();
  stageShows([]);
  return left;
}

/** Takes a pane this window started: it is in front the next time its work item's view is drawn, which is now where that view is on screen. */
export function takeStarted(session: SessionInfo): void {
  // The `inbox` that lists the pane comes after the answer that carries it.
  if (!held.sessions.some((known) => known.id === session.id)) held.sessions = [...held.sessions, session];
  if (session.workItemId === null) return;
  broughtToFront(session.workItemId, session.id);
  if (held.viewing !== session.workItemId) return;
  // A pane started in the view on screen comes in front, in place of the back.
  backFront = false;
  showView();
}

/** Asks the daemon for no more output of a pane this window started, where the pane did not come onto the stage: the daemon sends a pane's output to the window that started it. */
export function detachUnshown(id: number): void {
  if (!screenOf(id)) send({ type: "detach", id });
}

/** Asks the daemon to run a work item's setup again, as the view's "Run setup again" does, with the command the view named, which the daemon runs only where `.worktreesetup` still holds it: its answer, `started`, puts the new setup pane in front, and its refusal is said in the status line. */
function runSetup(workItemId: number, command: string | null): void {
  send({ type: "runSetup", requestId: request(), workItemId, ...startSize(), setupCommand: command });
}

/** Asks the field's prompt in the work item whose view is on screen. */
function ask(): void {
  const workItem = viewed();
  // One ask per answer: a second press before the daemon has taken the first would ask the same prompt twice.
  if (askRequest !== undefined || !workItem || !askButton(askField.value, workItem).enabled) return;
  askRequest = request();
  send({ type: "ask", requestId: askRequest, workItemId: workItem.id, prompt: askField.value });
}

/** Takes a headless session the daemon sent, `requestId` being the request it answers where it answers one. */
export function takeHeadless(headless: HeadlessInfo, requestId?: number): void {
  // The daemon took the prompt, so the field is free for the next one, unless it now holds a prompt for another work item.
  if (requestId !== undefined && requestId === askRequest) {
    askRequest = undefined;
    if (askingIn === headless.workItemId) askField.value = "";
  }
  held.headless = withHeadless(held.headless, headless);
  showAskSection();
}

/** Takes a headless session the daemon took off its list, as its bound keeps the sessions that ended last, out of the window's sessions and the "Ask" section. */
export function dropHeadless(id: number): void {
  held.headless = withoutHeadless(held.headless, id);
  showAskSection();
}

/** Takes the daemon's refusal of a request: where it was the "Ask" field's, the field may ask again, and where it was a press of "Show output", no answer is waited for. */
export function requestRefused(requestId: number): void {
  if (requestId === askRequest) askRequest = undefined;
  if (requestId === gateRequest?.requestId) gateRequest = undefined;
}

/**
 * Writes what a pane printed into the screen the pane is on: the last replay
 * this window asked for, and the output after it. A pane that is not on the
 * stage has no screen, and what arrives of it is dropped.
 *
 * A replay holds the questions the pane's program asked its terminal, such
 * as where the cursor is, and the terminal that draws it answers each again.
 * The answers to the first replay the window draws of a pane are sent, since
 * that replay may hold a question no terminal answered yet. The answers to a
 * later one are not: the program has them, and each would arrive as if typed.
 */
export function write(id: number, kind: "replay" | "output", data: string): void {
  const step = replayStep(awaited.get(id) ?? 0, kind);
  if (step.awaited > 0) awaited.set(id, step.awaited);
  else awaited.delete(id);
  const screen = screenOf(id);
  if (!step.write || !screen) return;
  // The screen sends nothing until the terminal has drawn a later replay. What a person types in that moment is not sent either.
  const answered = kind === "output" || !replayed.has(id);
  if (kind === "replay") replayed.add(id);
  screen.turns.write(data, answered);
}

export function initView(onLeave: () => void, isMac: boolean, openView: (workItemId: number) => void, reverse: (workItemId: number, decisionId: number) => void): void {
  leave = onLeave;
  mac = isMac;
  openWorkItem = openView;
  reverseDecision = reverse;
  // The card stays while the pointer is on it, and leaves a moment after the pointer left it for somewhere that is not its link.
  linkCardElement.addEventListener("mouseenter", () => clearTimeout(cardLeaveTimer));
  linkCardElement.addEventListener("mouseleave", cardLeaves);
  // A press on the card does not take the keyboard from the terminal.
  linkCardElement.addEventListener("mousedown", (event) => event.preventDefault());
  document.addEventListener(
    "mousemove",
    (event) => {
      pointer = { x: event.clientX, y: event.clientY };
    },
    { capture: true, passive: true },
  );
  // A key, and a press of the mouse anywhere but on the card, take the card away at once. Every dialog of the page opens at one of the two. A modifier key pressed by itself is no such key (./view, `cardStaysAt`): the card's rows name clicks made with one held.
  document.addEventListener(
    "keydown",
    (event) => {
      if (!cardStaysAt(event.key)) hideCard();
    },
    { capture: true },
  );
  document.addEventListener(
    "mousedown",
    (event) => {
      if (!(event.target instanceof Node && linkCardElement.contains(event.target))) hideCard();
      // A press outside a pane's menu closes the menu.
      if (!(event.target instanceof Node && paneMenuElement?.contains(event.target))) closeMenu();
    },
    { capture: true },
  );
  byId("view-seal-place").replaceWith(viewSeal);
  getSeal.addEventListener("click", askSeal);
  byId("pull-request-open").addEventListener("click", () => {
    if (pullRequestUrl !== undefined) void window.owlery.openLink(pullRequestUrl);
  });
  askField.addEventListener("input", () => {
    const workItem = viewed();
    if (workItem) showAsk(workItem);
  });
  askForm.addEventListener("submit", (event) => {
    event.preventDefault();
    ask();
  });
  byId<HTMLFormElement>("questions-form").addEventListener("submit", (event) => {
    event.preventDefault();
    sendAnswers();
  });
  byId("close-pane-cancel").addEventListener("click", () => closeDialog.close());
  byId("close-pane-confirm").addEventListener("click", () => {
    if (asking !== undefined) send({ type: "close", id: asking });
    closeDialog.close();
  });
  // However the dialog closed, by a button, by Escape or because its pane is gone, the keyboard goes back to the pane in front.
  closeDialog.addEventListener("close", () => screenOf(front)?.term.focus());
  sideBySideButton.addEventListener("click", () => {
    sideBySide = !sideBySide;
    // The panes come in front, side by side or not, in place of the back.
    backFront = false;
    sideBySideButton.setAttribute("aria-pressed", String(sideBySide));
    if (held.viewing === undefined) return;
    showView();
    // The press took the keyboard to the button, and it goes back to the pane in front.
    screenOf(front)?.term.focus();
  });
  new ResizeObserver(() => {
    // Every screen on the stage is fitted, and each fit that changes a size tells its pane's process.
    for (const screen of pool) if (screen.turns.pane !== undefined) screen.fit.fit();
  }).observe(stage);
}
