// The summary screen: what changed since the person last looked, in one
// sentence and one line per changed work item, with no terminal on it.
import { byId, held, part, sealPlace, stateIcon } from "./shared";
import { ageOf, lastHere, summaryControls, summaryHead } from "./view";

export interface SummaryActions {
  openInbox(): void;
  openView(workItemId: number): void;
}

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
  main.addEventListener("click", () => open(summaryControls(held.changes).main.opens));
  second.addEventListener("click", () => actions.openInbox());
}

/** Presses the main control, as Enter does on the summary screen. */
export function pressMain(): void {
  open(summaryControls(held.changes).main.opens);
}

/**
 * Draws the summary screen from the changes worked out at `ready`, which it
 * shows at every opening until the next load. Where no look is recorded, or
 * no work item changed, it says so and holds no line.
 */
export function showSummary(): void {
  const look = held.lastLook;
  heading.textContent = summaryHead(look !== null, held.changes);
  lastLooked.textContent = look ? lastHere(look.at, Date.now()) : "";
  lastLooked.hidden = !look;
  lines.replaceChildren(
    ...held.changes.map(({ workItem, line, session, sentence }) => {
      const button = document.createElement("button");
      button.dataset.workItem = String(workItem.id);
      // The age is of the state the sentence opens with, as the pane carried it at this load.
      button.append(stateIcon(line.state), part("title", line.title), part("change", sentence), part("age", ageOf(session?.stateSince, Date.now())), sealPlace("line"));
      button.addEventListener("click", () => actions.openView(workItem.id));
      const item = document.createElement("li");
      item.append(button);
      return item;
    }),
  );
  lines.hidden = held.changes.length === 0;
  const controls = summaryControls(held.changes);
  main.textContent = controls.main.label;
  second.textContent = controls.second?.label ?? "";
  second.hidden = controls.second === null;
  hint.textContent = controls.hint;
  // The keyboard starts on the main control.
  main.focus();
}
