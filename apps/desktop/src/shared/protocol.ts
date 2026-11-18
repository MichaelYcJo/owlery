// The protocol between the daemon and its clients: the desktop window today,
// the phone later. It carries no vendor-specific field: an agent's own events
// arrive as the neutral AgentEvent values (docs/architecture.md, "Rules that
// keep it portable").

/** What a pane runs: the user's login shell, or Claude Code with Owlery's hooks. */
export type PaneKind = "shell" | "claude";

export type AgentEvent =
  | "session-start"
  | "prompt"
  | "tool-start"
  | "tool-end"
  | "tool-failed"
  | "permission"
  | "notification"
  | "turn-end";

export interface SessionInfo {
  id: number;
  kind: PaneKind;
  alive: boolean;
}

export type ClientMessage =
  | { type: "hello"; token: string }
  | { type: "start"; kind: PaneKind; cols: number; rows: number; requestId: number }
  | { type: "attach"; id: number }
  | { type: "input"; id: number; data: string }
  | { type: "resize"; id: number; cols: number; rows: number };

export type ServerMessage =
  | { type: "ready"; sessions: SessionInfo[] }
  | { type: "started"; requestId: number; session: SessionInfo }
  | { type: "output"; id: number; data: string }
  | { type: "replay"; id: number; data: string }
  | { type: "exit"; id: number; exitCode: number }
  | { type: "agent"; id: number; event: AgentEvent; tool: string | null; at: number };

/** The close code a client receives when it did not present the daemon's token first. */
export const UNAUTHORIZED = 4001;
