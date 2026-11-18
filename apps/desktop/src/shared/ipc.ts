// The channels between the window and the main process. The renderer never
// reaches Node: it sees only the API the preload exposes over these channels.
export const Channel = {
  start: "terminal:start",
  input: "terminal:input",
  resize: "terminal:resize",
  data: "terminal:data",
  exit: "terminal:exit",
  hook: "terminal:hook",
} as const;

/** What a pane runs: the user's login shell, or Claude Code with Owlery's hooks. */
export type PaneKind = "shell" | "claude";

/** A hook event as the window shows it. Only the fields the list draws cross the bridge. */
export interface HookNotice {
  paneId: number;
  name: string;
  sessionId?: string;
  toolName?: string;
  at: number;
}

export interface TerminalApi {
  /** Opens a pane of that kind and returns its id. */
  start(kind: PaneKind, cols: number, rows: number): Promise<number>;
  input(id: number, data: string): void;
  resize(id: number, cols: number, rows: number): void;
  onData(listener: (id: number, data: string) => void): void;
  onExit(listener: (id: number, exitCode: number) => void): void;
  onHook(listener: (notice: HookNotice) => void): void;
}
