// The sign-in pane of the Accounts dialog: one terminal under the dialog's
// list that draws the pane in which the agent's own sign-in runs for an
// account (frame of #160, scope item 5), or for the folder "Add an account"
// made, which is an account only once that sign-in ends with a login (frame
// of #218, scope items 1 and 8). The daemon sends the pane's output to the
// window that started it from its start on, so the terminal writes it as it
// arrives and asks for no replay. A pane another window started is not
// drawn here.
import { Terminal } from "@xterm/xterm";
import type { SessionInfo } from "../shared/protocol";
import { accountName } from "./view";
import { byId, held, send } from "./shared";
import { look, terminalColours } from "./work-item-view";

/** The size the sign-in pane starts at and keeps: the dialog's terminal does not change its size. */
export const SIGN_IN_SIZE = { cols: 80, rows: 12 };

// The sign-in this window asked for and the daemon has not answered yet: an account's, or null for the one an add starts.
let asked: { requestId: number; accountId: number | null } | undefined;
// The sign-in pane the dialog draws, once the daemon started it for this window, with the id it signs in and whether that id is an add's.
let shown: { id: number; accountId: number; adding: boolean } | undefined;
// The dialog's terminal, made at the first sign-in this window starts.
let term: Terminal | undefined;

const section = byId("accounts-sign-in");
const addButton = byId<HTMLButtonElement>("accounts-add");

/** Notes the request that asks for a sign-in pane, an account's or, with null, the one an add starts, so its answer is drawn in the dialog. */
export function askedSignIn(requestId: number, accountId: number | null): void {
  asked = { requestId, accountId };
  showSignIn();
}

/** Takes the daemon's `started` where it answers this window's sign-in request: the dialog's terminal is emptied and draws the new pane. It answers whether the answer was the sign-in's. */
export function takeSignInStarted(requestId: number, session: SessionInfo): boolean {
  if (asked?.requestId !== requestId) return false;
  const adding = asked.accountId === null;
  shown = { id: session.id, accountId: asked.accountId ?? session.signsIn ?? session.id, adding };
  asked = undefined;
  if (term === undefined) {
    term = new Terminal({ ...SIGN_IN_SIZE, scrollback: 1000, fontFamily: look("--font-terminal"), fontSize: Number.parseFloat(look("--size-terminal")), theme: terminalColours(), cursorBlink: true });
    term.open(byId("accounts-terminal"));
    term.onData((data) => {
      if (shown !== undefined) send({ type: "input", id: shown.id, data });
    });
  }
  term.reset();
  showSignIn();
  term.focus();
  return true;
}

/** Forgets the sign-in request this window asked where the daemon refused it. */
export function signInRefused(requestId: number): void {
  if (asked?.requestId !== requestId) return;
  asked = undefined;
  showSignIn();
}

/** Writes what the sign-in pane printed into the dialog's terminal; the output of every other pane is no business of the dialog's. */
export function writeSignIn(id: number, data: string): void {
  if (shown?.id === id) term?.write(data);
}

/**
 * Shows the sign-in section while the daemon lists the pane it draws, named
 * by the account it signs in or as a new account's, and hides it once the
 * pane is closed here or elsewhere. "Add an account" is disabled while this
 * window's add waits for its pane or its pane's sign-in runs.
 */
export function showSignIn(): void {
  if (shown !== undefined && !held.sessions.some((session) => session.id === shown?.id)) shown = undefined;
  const alive = shown !== undefined && held.sessions.some((session) => session.id === shown?.id && session.alive);
  addButton.disabled = asked?.accountId === null || (shown?.adding === true && alive);
  section.hidden = shown === undefined;
  if (shown === undefined || held.accounts === null) return;
  if (shown.adding) {
    byId("accounts-sign-in-head").textContent = alive ? "Signing in to a new account" : "The sign-in of a new account has ended";
    return;
  }
  const name = accountName(held.accounts, shown.accountId);
  byId("accounts-sign-in-head").textContent = alive ? `Signing in to ${name}` : `The sign-in of ${name} has ended`;
}

/** Closes the sign-in pane the dialog draws, which ends its process where it still runs, and hides the section. */
export function closeSignIn(): void {
  if (shown === undefined) return;
  send({ type: "close", id: shown.id });
  shown = undefined;
  showSignIn();
}
