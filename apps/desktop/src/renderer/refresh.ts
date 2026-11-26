// The request of the sidebar's refresh button. A press has the daemon read
// again from git and GitHub what it holds of the work items, and send the
// four lists back to this window (the client message `readLists`). One
// request is under way at a time, so a press while its answer is on its way
// sends nothing. The request ends at the daemon's `done` or `error` of its
// id, or after `REFRESH_ANSWER_MS` with no answer: a daemon of an earlier
// build drops the message and answers nothing, so where the window holds the
// notice of a daemon of another build, the sentence of that end keeps the
// notice after it. The answer's lists arrive in
// an `inbox` before the `done`, and the window draws them as any `inbox`. The
// module touches no page when it is imported, so the unit project imports it.
import type { ClientMessage } from "../shared/protocol";

/** How long the window waits for the daemon's answer to a press. */
export const REFRESH_ANSWER_MS = 15_000;
/** What the button says to a pointer and to a screen reader at rest. */
export const REFRESH_SAYS = "Read the work items again from git and GitHub.";
/** What the button says while its answer is on its way. */
export const REFRESHING_SAYS = "Reading the work items again…";
/** What the status line says where no answer came within the wait. Where the window holds the notice of a daemon of another build (`RefreshWorld.daemonNotice`), the notice follows it after one space, so the press does not take "Restart Daemon…" out of the status line. */
export const NO_ANSWER_SAYS = `The daemon did not answer in ${REFRESH_ANSWER_MS / 1000} seconds, so the lists stand as they were.`;

/** What the refresh does in the window around it. */
export interface RefreshWorld {
  /** Whether the daemon's `ready` has arrived. */
  ready(): boolean;
  /** The id of the window's next request. */
  request(): number;
  send(message: ClientMessage): void;
  /** Runs `run` after `ms`, and gives what stops it. */
  after(ms: number, run: () => void): () => void;
  /** Draws the button at rest or working. */
  show(working: boolean): void;
  /** Says a sentence in the status line. */
  tell(text: string): void;
  /** The notice of a daemon of another build that the window holds (./view, `daemonNotice`), or "". */
  daemonNotice(): string;
}

/** The refresh's request: a press, and the two answers that end it. */
export interface Refresh {
  /** Sends one `readLists` where the daemon is ready and none is under way, and does nothing otherwise. */
  press(): void;
  /** Ends the request at the daemon's `done` of `requestId`. Gives whether the id was the request's under way. */
  answered(requestId: number): boolean;
  /** Ends the request at the daemon's `error` of `requestId`, and says the daemon's sentence in the status line. Gives whether the id was the request's under way. */
  refused(requestId: number, message: string): boolean;
}

export function refresher(world: RefreshWorld): Refresh {
  /** The request under way, and what stops its wait. */
  let under: { requestId: number; stop: () => void } | undefined;
  const end = (requestId: number): boolean => {
    if (under?.requestId !== requestId) return false;
    under.stop();
    under = undefined;
    world.show(false);
    return true;
  };
  return {
    press() {
      if (!world.ready() || under) return;
      const requestId = world.request();
      const stop = world.after(REFRESH_ANSWER_MS, () => {
        if (under?.requestId !== requestId) return;
        under = undefined;
        world.show(false);
        const notice = world.daemonNotice();
        world.tell(notice ? `${NO_ANSWER_SAYS} ${notice}` : NO_ANSWER_SAYS);
      });
      under = { requestId, stop };
      world.show(true);
      world.send({ type: "readLists", requestId });
    },
    answered: end,
    refused(requestId, message) {
      if (!end(requestId)) return false;
      world.tell(message);
      return true;
    },
  };
}
