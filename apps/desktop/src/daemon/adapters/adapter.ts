// The one connector the daemon reaches role sessions through. Each vendor's
// agent has an adapter of this shape, and the events are neutral: nothing an
// adapter reports names its vendor (docs/architecture.md, "Agent adapters" and
// "Rules that keep it portable").

import type { RoleStage } from "../../shared/protocol";

export type RoleEvent =
  // A piece of the agent's answer, in order.
  | { type: "text"; text: string }
  // The end of the turn: the whole answer, or the error's text where `isError`; the cost in US dollars where the agent reports one.
  | { type: "result"; text: string; isError: boolean; costUsd: number | null }
  // The agent's process ended. `errorOutput` is the last of what it printed on its error stream, and empty where it printed nothing there. Nothing follows it.
  | { type: "exit"; exitCode: number; errorOutput: string };

export interface RoleRun {
  /**
   * Ends the agent's process if it is still running. The promise settles once
   * the process has exited, and a second call returns the same promise.
   */
  stop(): Promise<void>;
}

export interface RoleAdapter {
  readonly name: string;
  /** The features this adapter supports, for a client to show or hide a control by; no adapter declares one yet. */
  readonly features: readonly string[];
  /**
   * Starts one session that answers `prompt` in the folder `cwd`, and reports
   * its events to `listener`, none of them before the promise resolves. With
   * `role`, the session is launched as that role at that stage, with whatever
   * the adapter's agent takes a role through; without it the session has no
   * role. The promise rejects, with a message a person can read, where no
   * session started.
   */
  start(options: { prompt: string; cwd: string; role?: RoleStage }, listener: (event: RoleEvent) => void): Promise<RoleRun>;
}
