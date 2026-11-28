// The summary screen: what changed since the person last looked, in one
// sentence and one line per changed work item, with no terminal on it.
import { byId, changes, held, part, markPlace, stateIcon } from "./shared";
import { ageOf, lastHere, lineSince, summaryControls, summaryHead } from "./view";

export interface SummaryActions {
  openInbox(): void;
  openView(workItemId: number): void;
}

const screen = byId("summary-screen");
const heading = byId("summary-sentence");
const lastLooked = byId("summary-last-here");
const lines = byId<HTMLUListElement>("summary-lines");
const main = byId<HTMLButtonElement>("summary-main");
const second = byId<HTMLButtonElement>("summary-second");
const hint = byId("summary-hint");
let actions: SummaryActions;

function open(target: number | "inbox"): void {
  if (target === "inbox") actions.openInbox();
  else actions.openView(target);
}

export function initSummary(given: SummaryActions): void {
  actions = given;
  main.addEventListener("click", () => open(summaryControls(changes()).main.opens));
  second.addEventListener("click", () => actions.openInbox());
}

/** Presses the main control, as Enter does on the summary screen. */
export function pressMain(): void {
  open(summaryControls(changes()).main.opens);
}

/** Draws the summary screen as it opens, with the keyboard on the main control. */
export function showSummary(): void {
  draw();
  // The keyboard starts on the main control.
  main.focus();
}

/**
 * Draws the summary screen in front again, as the lists change under it,
 * and leaves the keyboard where it was: on the line of the same work item
 * where it was on a line, which the drawing replaced. Where that line or
 * the control it was on is gone, the keyboard goes to the main control.
 */
export function redrawSummary(): void {
  const on = document.activeElement;
  const line = on instanceof HTMLElement && lines.contains(on) ? on.closest<HTMLElement>("button[data-work-item]")?.dataset.workItem : undefined;
  draw();
  if (line !== undefined) (lines.querySelector<HTMLElement>(`button[data-work-item="${line}"]`) ?? main).focus();
  else if (on instanceof HTMLElement && screen.contains(on) && document.activeElement !== on) main.focus();
}

/**
 * Draws the summary screen from the changes the summary lists now: the work
 * items the load chose, each worked out again from the lists the window
 * holds, so a line says the present (`changes`). Where no look is recorded,
 * or no work item changed, it says so and holds no line.
 */
function draw(): void {
  const look = held.lastLook;
  const changed = changes();
  heading.textContent = summaryHead(look !== null, changed);
  lastLooked.textContent = look ? lastHere(look.at, Date.now()) : "";
  lastLooked.hidden = !look;
  lines.replaceChildren(
    ...changed.map(({ workItem, line, session, sentence }) => {
      const button = document.createElement("button");
      button.dataset.workItem = String(workItem.id);
      // The age is of the state the sentence opens with, as the pane carries it now, or of the park for a work item parked with questions. The inspection is the work item's as the lists now give it.
      button.append(stateIcon(line.state), part("title", line.title), part("change", sentence), part("age", ageOf(lineSince(workItem, session), Date.now())), markPlace("line", workItem.inspection));
      button.addEventListener("click", () => actions.openView(workItem.id));
      const item = document.createElement("li");
      item.append(button);
      return item;
    }),
  );
  lines.hidden = changed.length === 0;
  const controls = summaryControls(changed);
  main.textContent = controls.main.label;
  second.textContent = controls.second?.label ?? "";
  second.hidden = controls.second === null;
  hint.textContent = controls.hint;
}
