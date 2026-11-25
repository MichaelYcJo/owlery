// The hold on the window's draws while a press lasts. A draw replaces every
// line and button it draws, and Chromium sends no click at all for a press
// whose element left the page before the release. So while the mouse's main
// button is held down anywhere in the window, a draw the daemon's lists ask
// for waits, and runs once in a task after the release, by which time the
// click has reached the element that was pressed. A task and not a microtask:
// a microtask queued at the release runs before the click is sent. The module
// touches no page when it is imported, so the unit project imports it.

/** Runs a function in a later task of the page. */
export type Schedule = (run: () => void) => void;

/** The hold: what a press, its end and a request to draw do. */
export interface DrawHold {
  /** The main button went down. */
  press(): void;
  /** The press ended, by a release, a cancel or the window's loss of the focus. Each draw kept during it runs once, in a later task. */
  release(): void;
  /** Runs `draw` at once where no press is held. During a press it keeps `draw` for the release, once however often it is asked for. */
  draw(draw: () => void): void;
}

/** A hold that schedules the kept draws with `schedule`. */
export function drawHold(schedule: Schedule): DrawHold {
  let pressed = false;
  /** The draws asked for during the press, each once, in the order they were first asked for. */
  const kept = new Set<() => void>();
  /** Whether a task that runs the kept draws is scheduled. */
  let scheduled = false;
  const runKept = (): void => {
    scheduled = false;
    // A press that began after the release keeps the draws waiting until its own release.
    if (pressed) return;
    const draws = [...kept];
    kept.clear();
    for (const draw of draws) draw();
  };
  return {
    press() {
      pressed = true;
    },
    release() {
      if (!pressed) return;
      pressed = false;
      if (kept.size === 0 || scheduled) return;
      scheduled = true;
      schedule(runKept);
    },
    draw(draw) {
      if (pressed) {
        kept.add(draw);
        return;
      }
      // A draw kept for a task that has not run yet is drawn now, and that task does not draw it again.
      kept.delete(draw);
      draw();
    },
  };
}

/**
 * A hold wired to the window: a `pointerdown` of the main button begins it,
 * and a `pointerup` of that button, a `pointercancel` and the window's `blur`
 * end it. The pointer's events are read in the capture phase, before any
 * element of the page can stop them.
 */
export function holdDraws(target: Pick<EventTarget, "addEventListener">, schedule: Schedule = (run) => setTimeout(run)): DrawHold {
  const hold = drawHold(schedule);
  const main = (event: Event): boolean => (event as PointerEvent).button === 0;
  target.addEventListener("pointerdown", (event) => main(event) && hold.press(), true);
  target.addEventListener("pointerup", (event) => main(event) && hold.release(), true);
  target.addEventListener("pointercancel", () => hold.release(), true);
  target.addEventListener("blur", () => hold.release());
  return hold;
}
