// The one connector the daemon reaches role sessions through. Each vendor's
// agent has an adapter of this shape, and the events are neutral: nothing an
// adapter reports names its vendor (docs/architecture.md, "Agent adapters" and
// "Rules that keep it portable").

export type RoleEvent =
  // A piece of the agent's answer, in order.
  | { type: "text"; text: string }
  // The end of the turn: the whole answer, or the error's text where `isError`; the cost in US dollars where the agent reports one.
  | { type: "result"; text: string; isError: boolean; costUsd: number | null }
  // The agent's process ended. Nothing follows it.
  | { type: "exit"; exitCode: number };

export interface RoleRun {
  /** Ends the agent's process if it is still running. */
  stop(): void;
}

export interface RoleAdapter {
  readonly name: string;
  /** The features this adapter supports, for a client to show or hide a control by; no adapter declares one yet. */
  readonly features: readonly string[];
  /**
   * Starts one session that answers `prompt` in the folder `cwd`, and reports
   * its events to `listener`, none of them before the promise resolves. The
   * promise rejects, with a message a person can read, where no session started.
   */
  start(options: { prompt: string; cwd: string }, listener: (event: RoleEvent) => void): Promise<RoleRun>;
}
