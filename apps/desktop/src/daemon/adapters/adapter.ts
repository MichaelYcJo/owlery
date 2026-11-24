// The one connector the daemon reaches role sessions through. Each vendor's
// agent has an adapter of this shape, and the events are neutral: nothing an
// adapter reports names its vendor (docs/architecture.md, "Agent adapters" and
// "Rules that keep it portable").

import type { RoleStage, Usage } from "../../shared/protocol";

/** What a call does, as its adapter reads it: it reads or writes the file at a path, runs a command, or does something else. */
export type PermissionAction = "read" | "write" | "run" | "other";

export type RoleEvent =
  // The session's own id, as its agent names it, and the model that answers, or null where the agent named none. Reported once at most, before the session's first `text`, and never by a session whose agent names no id. The id holds no white space and no comma.
  | { type: "session"; id: string; model: string | null }
  // A piece of the agent's answer, in order.
  | { type: "text"; text: string }
  // The end of the turn: the whole answer, or the error's text where `isError`; what the turn used, and null where the agent reported neither a cost nor a model's tokens.
  | { type: "result"; text: string; isError: boolean; usage: Usage | null }
  // The agent's process ended. `errorOutput` is the last of what it printed on its error stream, and empty where it printed nothing there. Nothing follows it.
  | { type: "exit"; exitCode: number; errorOutput: string }
  // The agent asks to make one call, and makes none of it before `RoleRun.answer` is called with this `id`. `path` is the file a read or a write names, and null otherwise. `text` is what a person reads of the call: the path, the command, or the call's input, 2,000 characters at most, and a cut text ends with a mark that says so.
  | { type: "permission"; id: string; tool: string; action: PermissionAction; path: string | null; text: string }
  // The agent no longer waits for an answer to the request `id`.
  | { type: "permission-withdrawn"; id: string };

export interface RoleRun {
  /**
   * Ends the agent's process if it is still running. The promise settles once
   * the process has exited, and a second call returns the same promise.
   */
  stop(): Promise<void>;
  /** Answers the request `id`: the call runs, or the agent is told `reason`. An id the run does not wait on is ignored. */
  answer(id: string, answer: { allow: true } | { allow: false; reason: string }): void;
}

/** A feature an adapter can declare: it sets a session's tools by its role, it reports permission requests and takes their answers, and it launches a session under the account whose config folder it is given. */
export type RoleFeature = "role-tools" | "permission-requests" | "accounts";

export interface RoleAdapter {
  readonly name: string;
  /** The features this adapter supports. The daemon starts a role session only through an adapter that declares `role-tools` and `permission-requests`, and a session with no role through any; `accounts` decides only whether a session is given its account's folder. */
  readonly features: readonly RoleFeature[];
  /**
   * Starts one session that answers `prompt` in the folder `cwd`, and reports
   * its events to `listener`, none of them before the promise resolves. With
   * `role`, the session is launched as that role at that stage, with whatever
   * the adapter's agent takes a role through; without it the session has no
   * role. With `accountDir`, which the daemon gives only an adapter that
   * declares `accounts`, the session runs under the login that config folder
   * holds. The promise rejects, with a message a person can read, where no
   * session started.
   */
  start(options: { prompt: string; cwd: string; role?: RoleStage; accountDir?: string }, listener: (event: RoleEvent) => void): Promise<RoleRun>;
  /**
   * What a person should know of the adapter's agent before any session
   * starts, as a sentence a window shows as it is, or null where there is
   * nothing to say. It is read anew at each call, and it does not reject.
   */
  notice(): Promise<string | null>;
  /**
   * The config folder the agent's default login lives in, which a session
   * given no account's folder runs under, as the adapter last found it, or
   * null where it has found none yet. It answers at once and starts no
   * search: the daemon reads it where it launches a pane and where it reads
   * a repository's settings, and asks `notice` at its start, which has the
   * adapter look its agent up. An adapter with no such answer is read as one
   * that has found none.
   */
  defaultLoginFolder?(): string | null;
}
