import type { PaneKindInfo } from "../shared/protocol";

/**
 * The kinds of pane the daemon offers, in the order a client shows them. A
 * client reads the label, whether the kind reports its agent's state and
 * whether a pane of it can start on the latest conversation of its folder
 * from here, and names no kind itself (docs/architecture.md, "Rules that keep
 * it portable").
 */
export const PANE_KINDS: readonly PaneKindInfo[] = [
  { kind: "shell", label: "Shell", reportsState: false, continues: false },
  { kind: "claude", label: "Claude Code", reportsState: true, continues: true },
];
