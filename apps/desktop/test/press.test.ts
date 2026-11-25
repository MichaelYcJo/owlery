import { describe, expect, it } from "vitest";
import { drawHold, holdDraws } from "../src/renderer/press";

/** A scheduler that keeps each task until the case runs it, as a later task of the page would run. */
function tasks(): { schedule: (run: () => void) => void; run: () => void; count: () => number } {
  const queued: (() => void)[] = [];
  return {
    schedule: (run) => queued.push(run),
    run: () => {
      for (const task of queued.splice(0)) task();
    },
    count: () => queued.length,
  };
}

/** A stand-in for the window: an event target that records which types were listened to in the capture phase, and fires an event with the button it names. */
function windowLike(): { target: Pick<EventTarget, "addEventListener">; fire: (type: string, button?: number) => void; captured: Set<string> } {
  const target = new EventTarget();
  const captured = new Set<string>();
  return {
    target: {
      addEventListener(type: string, listener: EventListenerOrEventListenerObject | null, options?: boolean | AddEventListenerOptions) {
        if (options === true || (typeof options === "object" && options.capture === true)) captured.add(type);
        target.addEventListener(type, listener, options);
      },
    },
    fire: (type, button) => target.dispatchEvent(Object.assign(new Event(type), button === undefined ? {} : { button })),
    captured,
  };
}

describe("drawHold", () => {
  it("runs a draw asked for where no press is held at once, and schedules nothing", () => {
    const later = tasks();
    const hold = drawHold(later.schedule);
    const drawn: string[] = [];
    hold.draw(() => drawn.push("lists"));
    expect(drawn).toEqual(["lists"]);
    expect(later.count()).toBe(0);
  });

  it("keeps a draw asked for during a press until the release, and runs it in a later task, once however often it was asked", () => {
    const later = tasks();
    const hold = drawHold(later.schedule);
    const drawn: string[] = [];
    const lists = (): number => drawn.push("lists");
    hold.press();
    hold.draw(lists);
    hold.draw(lists);
    expect(drawn).toEqual([]);
    hold.release();
    // The release itself draws nothing: the click that follows it reaches the element that was pressed first.
    expect(drawn).toEqual([]);
    later.run();
    expect(drawn).toEqual(["lists"]);
    // A second release, with nothing kept, schedules nothing.
    hold.release();
    expect(later.count()).toBe(0);
  });

  it("runs each of two draws kept during one press once, in the order they were first asked for", () => {
    const later = tasks();
    const hold = drawHold(later.schedule);
    const drawn: string[] = [];
    const lists = (): number => drawn.push("lists");
    const view = (): number => drawn.push("view");
    hold.press();
    hold.draw(lists);
    hold.draw(view);
    hold.draw(lists);
    hold.release();
    later.run();
    expect(drawn).toEqual(["lists", "view"]);
  });

  it("keeps the draws waiting where a press begins before the release's task runs, until that press is released", () => {
    const later = tasks();
    const hold = drawHold(later.schedule);
    const drawn: string[] = [];
    hold.press();
    hold.draw(() => drawn.push("lists"));
    hold.release();
    hold.press();
    later.run();
    expect(drawn).toEqual([]);
    hold.release();
    later.run();
    expect(drawn).toEqual(["lists"]);
  });

  it("runs a draw asked for between the release and its task at once, and not again in the task", () => {
    const later = tasks();
    const hold = drawHold(later.schedule);
    const drawn: string[] = [];
    const lists = (): number => drawn.push("lists");
    hold.press();
    hold.draw(lists);
    hold.release();
    hold.draw(lists);
    expect(drawn).toEqual(["lists"]);
    later.run();
    expect(drawn).toEqual(["lists"]);
  });
});

describe("holdDraws", () => {
  it("listens for the pointer's press, release and cancel in the capture phase, so an element that stops the event does not hide it", () => {
    const page = windowLike();
    holdDraws(page.target, tasks().schedule);
    expect([...page.captured].sort()).toEqual(["pointercancel", "pointerdown", "pointerup"]);
  });

  it("holds the draws from a press of the main button to its release, and draws in a later task", () => {
    const page = windowLike();
    const later = tasks();
    const hold = holdDraws(page.target, later.schedule);
    const drawn: string[] = [];
    page.fire("pointerdown", 0);
    hold.draw(() => drawn.push("lists"));
    expect(drawn).toEqual([]);
    page.fire("pointerup", 0);
    later.run();
    expect(drawn).toEqual(["lists"]);
  });

  it("holds nothing at a press of another button, and ends no hold at the release of another button", () => {
    const page = windowLike();
    const later = tasks();
    const hold = holdDraws(page.target, later.schedule);
    const drawn: string[] = [];
    page.fire("pointerdown", 2);
    hold.draw(() => drawn.push("at once"));
    expect(drawn).toEqual(["at once"]);
    page.fire("pointerdown", 0);
    hold.draw(() => drawn.push("kept"));
    page.fire("pointerup", 2);
    later.run();
    expect(drawn).toEqual(["at once"]);
  });

  it.each(["pointercancel", "blur"])("ends the hold at a %s, as at a release, and draws at once after it", (ending) => {
    const page = windowLike();
    const later = tasks();
    const hold = holdDraws(page.target, later.schedule);
    const drawn: string[] = [];
    page.fire("pointerdown", 0);
    hold.draw(() => drawn.push("kept"));
    page.fire(ending);
    later.run();
    expect(drawn).toEqual(["kept"]);
    hold.draw(() => drawn.push("at once"));
    expect(drawn).toEqual(["kept", "at once"]);
  });
});
