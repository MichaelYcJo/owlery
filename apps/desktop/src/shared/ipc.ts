// The channels between the window and the main process. The renderer never
// reaches Node: it sees only the API the preload exposes over these channels.
export const Channel = {
  start: "terminal:start",
  input: "terminal:input",
  resize: "terminal:resize",
  data: "terminal:data",
  exit: "terminal:exit",
} as const;

export interface TerminalApi {
  /** Opens the user's login shell in a new pane and returns the pane's id. */
  start(cols: number, rows: number): Promise<number>;
  input(id: number, data: string): void;
  resize(id: number, cols: number, rows: number): void;
  onData(listener: (id: number, data: string) => void): void;
  onExit(listener: (id: number, exitCode: number) => void): void;
}
