// layer: logic
import { describe, expect, it } from "vitest";
import type { ClientMessage } from "../src/shared/protocol";
import { NO_ANSWER_SAYS, REFRESH_ANSWER_MS, refresher } from "../src/renderer/refresh";
import { daemonNotice } from "../src/renderer/view";

/** A stand-in for the window around the refresh: what it sent, the forms it drew the button in, what it told the status line, and each wait it was asked for, which runs only when the case runs it. `notice` is the notice of a daemon of another build the window holds. */
function windowLike(ready = true, notice = "") {
  const sent: ClientMessage[] = [];
  const shown: boolean[] = [];
  const told: string[] = [];
  const waits: { ms: number; run: () => void; stopped: boolean }[] = [];
  let next = 7;
  const refresh = refresher({
    ready: () => ready,
    request: () => next++,
    send: (message) => sent.push(message),
    after(ms, run) {
      const wait = { ms, run, stopped: false };
      waits.push(wait);
      return () => {
        wait.stopped = true;
      };
    },
    show: (working) => shown.push(working),
    tell: (text) => told.push(text),
    daemonNotice: () => notice,
  });
  return { refresh, sent, shown, told, waits };
}

describe("refresher", () => {
  it("sends one readLists at a press, works until its done, and sends nothing for a second press while the answer is on its way", () => {
    const { refresh, sent, shown, waits } = windowLike();
    refresh.press();
    refresh.press();
    expect(sent).toEqual([{ type: "readLists", requestId: 7 }]);
    expect(shown).toEqual([true]);
    // A done of another request is not this one's.
    expect(refresh.answered(6)).toBe(false);
    expect(shown).toEqual([true]);
    expect(refresh.answered(7)).toBe(true);
    expect(shown).toEqual([true, false]);
    // The answer stopped the wait, so it tells nothing later.
    expect(waits.map(({ stopped }) => stopped)).toEqual([true]);
    // A press after the answer sends a new request.
    refresh.press();
    expect(sent).toEqual([
      { type: "readLists", requestId: 7 },
      { type: "readLists", requestId: 8 },
    ]);
  });

  it("does nothing at a press before the daemon's ready", () => {
    const { refresh, sent, shown, waits } = windowLike(false);
    refresh.press();
    expect([sent, shown, waits.length]).toEqual([[], [], 0]);
  });

  it("ends at the error of its request, and says the daemon's sentence in the status line as the daemon sent it", () => {
    const { refresh, shown, told } = windowLike();
    refresh.press();
    // An error of another request is not this one's to say.
    expect(refresh.refused(6, "The base was not fetched.")).toBe(false);
    expect([shown, told]).toEqual([[true], []]);
    expect(refresh.refused(7, "The work items were not read again: the records place could not be read.")).toBe(true);
    expect(shown).toEqual([true, false]);
    expect(told).toEqual(["The work items were not read again: the records place could not be read."]);
  });

  it("stops working after 15 seconds with no answer, says that the daemon did not answer, and takes a late done as no answer of its own", () => {
    const { refresh, sent, shown, told, waits } = windowLike();
    refresh.press();
    expect(REFRESH_ANSWER_MS).toBe(15_000);
    expect(waits.map(({ ms }) => ms)).toEqual([15_000]);
    for (const { run } of waits) run();
    expect(shown).toEqual([true, false]);
    expect(told).toEqual(["The daemon did not answer in 15 seconds, so the lists stand as they were."]);
    expect(NO_ANSWER_SAYS).toBe(told[0]);
    // The answer that comes after the wait ends nothing, and the window draws its lists as any `inbox`.
    expect(refresh.answered(7)).toBe(false);
    expect(shown).toEqual([true, false]);
    // A press after the wait sends a new request.
    refresh.press();
    expect(sent.map((message) => (message as { requestId: number }).requestId)).toEqual([7, 8]);
  });

  it("keeps the notice of a daemon of another build after the sentence of no answer, so the press does not take Restart Daemon out of the status line", () => {
    const { refresh, told, waits } = windowLike(true, daemonNotice(true));
    refresh.press();
    for (const { run } of waits) run();
    expect(told).toEqual([
      `The daemon did not answer in 15 seconds, so the lists stand as they were. Owlery's background process is from another build. Choose "Restart Daemon…" from the menu to replace it.`,
    ]);
  });
});
