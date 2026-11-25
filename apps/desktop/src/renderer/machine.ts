// The Machine dialog the sidebar's foot opens: what the daemon read of the
// machine, and a row for each cap it keeps there. The caps are the daemon's
// state and not the window's, so the dialog draws what the daemon last said,
// a Save sends what the person changed, and the daemon's `machine` is what
// the dialog then draws. Against a daemon that keeps no cap the button that
// opens it is hidden.
import type { Cap } from "../shared/protocol";
import { byId, held, send } from "./shared";
import { capChanges, type CapRow, heavyQueue, heavyRanRows, machineDialog, machineQueue } from "./view";

const button = byId<HTMLButtonElement>("machine-button");
const dialog = byId<HTMLDialogElement>("machine-dialog");
const readingPlace = byId("machine-reading");
const capsPlace = byId("machine-caps");
const refusal = byId("machine-error");

// The rows as the dialog last drew them, and what the person did to each field since the dialog opened: typed in it, or pressed "Use the default" after it.
let drawn: CapRow[] = [];
const typed = new Set<Cap>();
const toDefault = new Set<Cap>();

/** The field of a cap's row. */
function fieldOf(cap: Cap): HTMLInputElement | null {
  return capsPlace.querySelector<HTMLInputElement>(`[data-cap="${cap}"] input`);
}

/** Shows the button that opens the dialog where the daemon keeps caps, and hides it against a daemon that sends none. */
export function showMachineEntry(): void {
  button.hidden = machineDialog(held.machine) === null;
}

/** The text a field shows of a value, empty for none. */
function textOf(value: number | null): string {
  return value === null ? "" : String(value);
}

/** Makes a cap's row, empty: its name, its field with "Use the default" beside it, and the place of its default's sentence. The row's values are `showMachine`'s to fill. */
function capPart(cap: Cap): HTMLElement {
  const part = document.createElement("div");
  part.className = "cap";
  part.dataset.cap = cap;
  const label = document.createElement("label");
  label.htmlFor = `machine-${cap}`;
  const line = document.createElement("span");
  line.className = "row";
  const field = document.createElement("input");
  field.id = `machine-${cap}`;
  field.inputMode = "numeric";
  field.autocomplete = "off";
  const use = document.createElement("button");
  use.type = "button";
  use.className = "quiet";
  use.textContent = "Use the default";
  use.addEventListener("click", () => {
    typed.delete(cap);
    toDefault.add(cap);
    field.value = textOf(drawn.find((row) => row.cap === cap)?.proposed ?? null);
    use.disabled = true;
  });
  field.addEventListener("input", () => {
    typed.add(cap);
    toDefault.delete(cap);
    use.disabled = false;
  });
  line.append(field, use);
  const says = document.createElement("p");
  says.className = "cap-says";
  part.append(label, line, says);
  return part;
}

/**
 * Draws the dialog from what the daemon last said: the reading in its sentence,
 * and for each cap its name, its field, "Use the default" and the sentence of
 * its default. The rows are made once for each opening and filled in place
 * afterwards, so a `machine` that arrives while a person types takes no
 * field from under them. A field the person typed in keeps what they typed,
 * and one they returned to the default shows the proposal. "Use the default"
 * is offered where the field would not follow the default after a Save.
 * Under the agent row stand the sessions that wait for the machine, under
 * the label "Waiting for the machine", in the order they start, each by its
 * work item's title and, on the line under it, what it waits to run. Where
 * none waits, neither the label nor any session stands there. Under the
 * limit on heavy commands stand, in the same form, the heavy commands that
 * run and wait under "Running and waiting", and what each command of each
 * repository took under "What ran", as the daemon last answered a
 * `readHeavyRuns`.
 */
export function showMachine(): void {
  const shown = machineDialog(held.machine);
  if (shown === null) {
    if (dialog.open) dialog.close();
    return;
  }
  readingPlace.textContent = shown.reading;
  drawn = shown.rows;
  for (const row of shown.rows) {
    const part = capsPlace.querySelector<HTMLElement>(`[data-cap="${row.cap}"]`) ?? capsPlace.appendChild(capPart(row.cap));
    const label = part.querySelector("label");
    if (label) label.textContent = row.label;
    const field = fieldOf(row.cap);
    if (field && !typed.has(row.cap)) field.value = textOf(toDefault.has(row.cap) ? row.proposed : row.value);
    const use = part.querySelector("button");
    if (use) use.disabled = toDefault.has(row.cap) || (row.isDefault && !typed.has(row.cap));
    const says = part.querySelector(".cap-says");
    if (says) says.textContent = row.says;
  }
  const agents = capsPlace.querySelector<HTMLElement>('[data-cap="agents"]');
  // The label is made before the list, so it stands over it.
  const head = agents?.querySelector<HTMLElement>(".cap-queue-head") ?? agents?.appendChild(Object.assign(document.createElement("p"), { id: "machine-queue-head", className: "cap-queue-head caption", textContent: "Waiting for the machine" }));
  const queue = agents?.querySelector<HTMLUListElement>(".cap-queue") ?? agents?.appendChild(Object.assign(document.createElement("ul"), { className: "cap-queue named" }));
  queue?.setAttribute("aria-labelledby", "machine-queue-head");
  const waiting = machineQueue(held.machine, held.headless, held.workItems);
  if (head) head.hidden = waiting.length === 0;
  queue?.replaceChildren(
    ...waiting.map(({ title, waits }) => {
      const entry = document.createElement("li");
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = title;
      const what = document.createElement("span");
      what.className = "detail";
      what.textContent = waits;
      entry.append(name, what);
      return entry;
    }),
  );
  const heavy = capsPlace.querySelector<HTMLElement>('[data-cap="heavyCommands"]');
  if (heavy) {
    listUnder(heavy, "heavy-queue", "machine-heavy-head", "Running and waiting", heavyQueue(held.machine, held.workItems, Date.now()));
    listUnder(heavy, "heavy-ran", "machine-ran-head", "What ran", heavyRanRows(held.heavyRan));
  }
}

/**
 * Draws a list of records at the end of a cap's row under its label, both
 * made once and filled in place: each entry its name and, on the line under
 * it, its detail. Where the list holds none, neither the label nor any entry
 * stands there.
 */
function listUnder(part: HTMLElement, kind: string, headId: string, label: string, entries: readonly { title: string; detail: string }[]): void {
  const head = document.getElementById(headId) ?? part.appendChild(Object.assign(document.createElement("p"), { id: headId, className: "cap-queue-head caption", textContent: label }));
  const list = part.querySelector<HTMLUListElement>(`.${kind}`) ?? part.appendChild(Object.assign(document.createElement("ul"), { className: `${kind} named` }));
  list.setAttribute("aria-labelledby", headId);
  head.hidden = entries.length === 0;
  list.replaceChildren(
    ...entries.map(({ title, detail }) => {
      const entry = document.createElement("li");
      const name = document.createElement("span");
      name.className = "name";
      name.textContent = title;
      const what = document.createElement("span");
      what.className = "detail";
      what.textContent = detail;
      entry.append(name, what);
      return entry;
    }),
  );
}

/** Draws the dialog the caller just opened on what the daemon last said, with no field touched, and has the daemon read the load and the free disk again, and what each heavy command took. */
export function openMachine(): void {
  typed.clear();
  toDefault.clear();
  capsPlace.replaceChildren();
  showMachine();
  send({ type: "readMachine" });
  send({ type: "readHeavyRuns" });
}

/** Wires the dialog's two buttons. A Save sends the caps the person changed through `save`, says a value the daemon would refuse in the dialog, and closes the dialog where nothing changed. */
export function initMachine(save: (caps: Partial<Record<Cap, number | null>>) => void): void {
  byId("machine-cancel").addEventListener("click", () => dialog.close());
  byId<HTMLFormElement>("machine-form").addEventListener("submit", (event) => {
    event.preventDefault();
    const fields = Object.fromEntries(drawn.map(({ cap }) => [cap, { text: fieldOf(cap)?.value ?? "", toDefault: toDefault.has(cap) }])) as Record<Cap, { text: string; toDefault: boolean }>;
    const changes = capChanges(drawn, fields, held.machine?.reading.cores);
    if ("refusal" in changes) {
      refusal.textContent = changes.refusal;
      return;
    }
    if (Object.keys(changes.caps).length === 0) {
      dialog.close();
      return;
    }
    save(changes.caps);
  });
}
