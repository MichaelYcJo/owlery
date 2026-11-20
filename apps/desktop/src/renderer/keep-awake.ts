// The control at the sidebar's foot that chooses when the daemon keeps the
// Mac from idle sleep. The choice is the daemon's state and not the window's,
// so the control shows what the daemon last said, a person's choice goes to
// the daemon, and the daemon's `keepAwake` message is what the control then
// shows. Against a daemon that offers no such choice the control is hidden.
import { KEEP_AWAKE_CHOICES } from "../shared/keep-awake";
import type { KeepAwakeChoice } from "../shared/protocol";
import { byId, held, send } from "./shared";
import { keepAwakeControl } from "./view";

const control = byId("keep-awake-control");
const choices = byId<HTMLSelectElement>("keep-awake");

/** Fills the control with the three choices, and sends the one a person chooses to the daemon. The page hides the control until `showKeepAwake` shows it. */
export function initKeepAwake(): void {
  choices.replaceChildren(...KEEP_AWAKE_CHOICES.map(({ value, label }) => new Option(label, value)));
  choices.addEventListener("change", () => send({ type: "setKeepAwake", choice: choices.value as KeepAwakeChoice }));
}

/** Shows the daemon's choice in the control and in its title, or hides the control where the daemon sent none. */
export function showKeepAwake(): void {
  const shown = keepAwakeControl(held.keepAwake);
  control.hidden = shown === null;
  if (!shown) return;
  choices.value = shown.choice;
  control.title = shown.title;
}
