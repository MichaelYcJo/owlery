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
  | { type: "permission-withdrawn"; id: string }
  // What the agent's stream says of the usage limit of the account the session runs under, each value null where the agent gave none: whether the limit is far (`ok`), near or reached, the part of it used as a fraction from 0 to 1, the time in milliseconds since the epoch at which it resets, and the limit's name where the agent names one.
  | { type: "limit"; status: "ok" | "near" | "reached" | null; used: number | null; resetsAt: number | null; window: string | null };

export interface RoleRun {
  /**
   * Ends the agent's process if it is still running. The promise settles once
   * the process has exited, and a second call returns the same promise.
   */
  stop(): Promise<void>;
  /** The id of the agent's own process, which the daemon reads the resident memory of, or none where the adapter runs no process of its own, as the fake adapter does. */
  readonly pid?: number;
  /** Answers the request `id`: the call runs, or the agent is told `reason`. An id the run does not wait on is ignored. */
  answer(id: string, answer: { allow: true } | { allow: false; reason: string }): void;
}

/** A feature an adapter can declare: it sets a session's tools by its role, it reports permission requests and takes their answers, it launches a session under the account whose config folder it is given, and it starts the short session that refreshes an account's usage (`refresh`). */
export type RoleFeature = "role-tools" | "permission-requests" | "accounts" | "limit-refresh";

/** What a session is started with (`RoleAdapter.start`). */
export interface RoleStart {
  prompt: string;
  cwd: string;
  role?: RoleStage;
  accountDir?: string;
  refresh?: true;
  commands?: { write: readonly string[]; refuse: readonly string[] };
  scratch?: string;
}

export interface RoleAdapter {
  readonly name: string;
  /** The features this adapter supports. The daemon starts a role session only through an adapter that declares `role-tools` and `permission-requests`, and starts no session with no role but a refresh; `accounts` decides only whether a session is given its account's folder, and `limit-refresh` whether the daemon starts a refresh through it. */
  readonly features: readonly RoleFeature[];
  /**
   * Starts one session that answers `prompt` in the folder `cwd`, and reports
   * its events to `listener`, none of them before the promise resolves. With
   * `role`, the session is launched as that role at that stage, with whatever
   * the adapter's agent takes a role through; without it the session has no
   * role, which the daemon asks only for a refresh. With `accountDir`, which
   * the daemon gives only an adapter that declares `accounts`, the session
   * runs under the login that config folder holds. With `refresh`, which the
   * daemon gives only an adapter that declares `limit-refresh` and never with
   * a role, the session holds no tool, takes one turn and writes no
   * transcript, and is started only for the `limit` events its stream hands
   * over. `commands`, which the daemon gives with every role and never with
   * a refresh, are the absolute folders the session's commands may write in
   * (`write`) and are refused (`refuse`): an adapter that launches a role
   * runs its commands in the operating system's sandbox, which lets them
   * write in those folders alone, and refuses them the adapter's own
   * folders as well; one that cannot, or that is given a role with no
   * `commands`, starts no session. `scratch`, which the daemon gives where
   * the role's commands write in a scratch folder of the session's own, is
   * that folder, which the session's file tools reach as well. The promise
   * rejects, with a message a person can read, where no session started.
   */
  start(options: RoleStart, listener: (event: RoleEvent) => void): Promise<RoleRun>;
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
  /**
   * The real path of the folder the agent keeps the conversations of the
   * config folder `folder` in, or null where the folder holds none. Two
   * config folders whose answers are one keep the same conversations, so a
   * conversation of one is resumed under the other. It reads the path alone
   * and nothing inside it. An adapter without it keeps no conversation two
   * folders share.
   */
  conversationsOf?(folder: string): string | null;
  /**
   * What the adapter's agent does with an account's config folder: lends a
   * folder the daemon made what belongs to the person, signs a folder in and
   * out, and says whether a login stands in it. The daemon calls it only for
   * an account's folder and reads no file of the folder itself. An adapter
   * without it signs no account in, and the daemon makes no account's folder
   * for it.
   */
  readonly logins?: AccountLogins;
}

/** Whether a login stands in a config folder, the daemon's clock at which it is expected to end, or null where the agent named no end, and the name the agent gives the login, as an email, or null where no login stands or the agent names none. */
export interface LoginStatus {
  signedIn: boolean;
  loginEndsAt: number | null;
  name: string | null;
}

/** The process a sign-in pane runs: the file to execute, its arguments, and the whole environment it is given, to which the terminal adds only its own names. */
export interface LoginCommand {
  command: string;
  args: string[];
  env: Record<string, string>;
}

/** An adapter's part of the accounts the daemon keeps, each named by its config folder. */
export interface AccountLogins {
  /**
   * Gives a folder the daemon made for an account what belongs to the person
   * in the agent's default login, as the adapter's agent shares it, and adds
   * only what the folder lacks. It writes nothing into the default login's
   * folder, does nothing while the adapter has not found that folder, and
   * does not throw: a name it cannot give stays missing until the next call.
   */
  furnish(folder: string): void;
  /** The process of a pane in which the person signs the folder in, through the agent's own sign-in. It rejects, with a sentence a person reads, where the adapter cannot find its agent. */
  signIn(folder: string): Promise<LoginCommand>;
  /** Whether a login stands in the folder, and the name the agent gives it. It rejects, with a sentence a person reads, where the agent could not say. */
  status(folder: string): Promise<LoginStatus>;
  /** Signs the folder out, through the agent's own command. It rejects, with a sentence a person reads, where the agent did not. */
  signOut(folder: string): Promise<void>;
}
