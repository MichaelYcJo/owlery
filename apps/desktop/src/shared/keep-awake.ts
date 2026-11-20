// When the daemon keeps the Mac from idle sleep: the three choices a person
// has, and the words each is offered in. The choice is the daemon's state and
// not a client's own, so the daemon, the window and the phone later read it
// here (docs/architecture.md, Overall layout).
import type { KeepAwakeChoice } from "./protocol";

/** The choices in the order the control offers them, each with the words a person reads. */
export const KEEP_AWAKE_CHOICES: readonly { value: KeepAwakeChoice; label: string }[] = [
  { value: "working", label: "While an agent works" },
  { value: "always", label: "Always" },
  { value: "never", label: "Never" },
];

/** The choice of a daemon nobody has told one. */
export const DEFAULT_KEEP_AWAKE: KeepAwakeChoice = "working";

/** Whether a value that came from a file or from another process is one of the three choices. */
export function isKeepAwakeChoice(value: unknown): value is KeepAwakeChoice {
  return KEEP_AWAKE_CHOICES.some((choice) => choice.value === value);
}
