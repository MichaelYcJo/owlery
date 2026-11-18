import type { PaneKindInfo } from "../shared/protocol";

/**
 * The kinds of pane the daemon offers, in the order a client shows them. A
 * client reads the label and whether the kind reports its agent's state from
 * here, and names no kind itself (docs/architecture.md, "Rules that keep it
 * portable").
 */
export const PANE_KINDS: readonly PaneKindInfo[] = [
  { kind: "shell", label: "Shell", reportsState: false },
  { kind: "claude", label: "Claude Code", reportsState: true },
];
