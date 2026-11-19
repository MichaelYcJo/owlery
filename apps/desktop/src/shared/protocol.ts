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

/** What a session's agent is doing, as its last event says. `waiting` is also what a pane that sent no event in the time after its start is called. */
export type AgentState = "working" | "waiting" | "finished";

/** A kind of pane the daemon offers: the label a person reads, and whether its panes report an agent's state. */
export interface PaneKindInfo {
  kind: PaneKind;
  label: string;
  reportsState: boolean;
}

/** One commit of a work item's branch. */
export interface CommitInfo {
  /** The commit's hash as git shortens it. */
  hash: string;
  subject: string;
  /** When the commit was made, as the committer's clock had it. */
  at: number;
  /** The lines the commit added and removed, over the files git counts lines of; both null where it changed files and git counts lines of none of them, as for binary files. A merge's lines are those it brought onto the branch: its difference from its first parent. */
  added: number | null;
  removed: number | null;
}

/** One file a work item's branch changed. A file that was moved is two: one removed, one added. */
export interface FileChange {
  /** The file's path from the top of the repository. */
  path: string;
  /** Null where git counts no lines of the file, as for a binary file. */
  added: number | null;
  removed: number | null;
}

/** What a work item's branch changed since `baseCommit`: the count of the files and the sums of their lines, and the first of the files. */
export interface Changes {
  files: number;
  added: number;
  removed: number;
  /** 50 files at most, in git's order of paths. */
  list: FileChange[];
}

/**
 * One piece of work, in a worktree of its own: `repo` is the repository's
 * top-level folder, `branch` the branch cut for it, `worktree` its folder.
 */
export interface WorkItem {
  id: number;
  title: string;
  repo: string;
  /** The last part of `repo`, which a person reads as the repository's name. */
  repoName: string;
  branch: string;
  worktree: string;
  createdAt: number;
  /** The commit the branch was cut at, or null for a work item made before this was recorded. */
  baseCommit: string | null;
  /**
   * The branch the work item's branch was cut at, a local branch or a remote's,
   * named as a person reads it: a local branch by its name, such as `main`, and
   * a remote's branch by the remote's name, a slash and the branch's name, such
   * as `origin/main`. The daemon reads the name as the local branch of that name
   * where one exists, and as the remote's branch otherwise. Null where the
   * branch was cut at the checkout's commit, in a repository with no default
   * base, and for a work item made before this was recorded.
   */
  baseBranch: string | null;
  /** How many commits the branch holds that `baseBranch` does not hold, or null where no base branch is recorded, that branch is gone, or the daemon has read none. A remote's branch is counted as the person's clone holds it, so the count moves at a fetch. A base merged into the branch adds none of its own, and a branch its base took is ahead by none. */
  aheadOfBase: number | null;
  /** How many commits the branch holds after `baseCommit`, the base's own among them once the base was merged in, or null where the daemon has read none. */
  newCommits: number | null;
  /** The commits the branch holds after `baseCommit`, newest first, 20 at most, or null where the daemon has read none. */
  commits: CommitInfo[] | null;
  /** Null where the daemon has read none. */
  changes: Changes | null;
}

export interface SessionInfo {
  id: number;
  kind: PaneKind;
  alive: boolean;
  /** The work item whose worktree the pane runs in, or null for a pane opened without one. */
  workItemId: number | null;
  /** Null until the agent's first event or until the pane has sent no event for the time after its start the daemon allows, whichever comes first, and always for a kind that reports no state. An exited session keeps its last. */
  state: AgentState | null;
  /** The daemon's clock when the session entered `state`, or null where it has none. */
  stateSince: number | null;
  /** The text the event that began `state` carried: what the agent last said or what it tells the person, 2000 characters of it at most. Null where the event carried none, and where no event began the state. */
  stateText: string | null;
  /** The name of the tool the event that began `state` asks for. Null where the event named none, and where no event began the state. */
  stateTool: string | null;
}

/**
 * When a person last looked, and what the daemon listed then: `at` is the
 * time, and the two lists are as an `inbox` sent at that moment would carry
 * them. The daemon keeps one, for whichever client sent `looked` last.
 */
export interface Look {
  at: number;
  sessions: SessionInfo[];
  workItems: WorkItem[];
}

/** What a headless session is doing: `working` until its result, then `finished`, or `failed` where it gave none or an error. */
export type HeadlessState = "working" | "finished" | "failed";

/**
 * One headless session: an agent asked one prompt in a work item's worktree,
 * with no terminal. Its ids are a count of their own, apart from the panes'.
 */
export interface HeadlessInfo {
  id: number;
  workItemId: number;
  prompt: string;
  state: HeadlessState;
  /** The answer as far as it has arrived, and the whole of it once `finished`. */
  answer: string;
  /** Why the session `failed`, and null in the other two states. */
  error: string | null;
  /** What the turn cost in US dollars, or null where the agent reported none. */
  costUsd: number | null;
  startedAt: number;
}

export type ClientMessage =
  | { type: "hello"; token: string }
  | { type: "start"; kind: PaneKind; cols: number; rows: number; requestId: number; workItemId?: number }
  // `title` may be empty. The work item's branch and folder are named by the title, by `name` where the title leaves no letter or digit of a-z0-9, and by a name the daemon generates where neither does. `base` is the name of the branch the work item starts from, as `WorkItem.baseBranch` names one, and the repository's default base where it is absent.
  | { type: "createWorkItem"; requestId: number; repo: string; title: string; name?: string; base?: string; kind: PaneKind; cols: number; rows: number }
  // Asks what a creation in `repo` with this title and name would give. The daemon creates nothing, and answers with a `workItemPlan`.
  | { type: "planWorkItem"; requestId: number; repo: string; title: string; name?: string }
  // Asks for the session's kept output as a `replay`, and for its output after that.
  | { type: "attach"; id: number }
  // Ends this client's receiving of the session's output until it attaches again. The session and its process are untouched, and the daemon answers nothing.
  | { type: "detach"; id: number }
  // Ends the session's process if it is alive, and takes the session off the lists.
  | { type: "close"; id: number }
  // Starts a headless session that answers `prompt` in the work item's worktree.
  | { type: "ask"; requestId: number; workItemId: number; prompt: string }
  // Says that a person looked at what the client shows, now. The daemon records the look and answers nothing.
  | { type: "looked" }
  | { type: "input"; id: number; data: string }
  | { type: "resize"; id: number; cols: number; rows: number };

export type ServerMessage =
  // `lastLook` is the look as it stood when the client said hello, or null where no client ever sent `looked`.
  | { type: "ready"; sessions: SessionInfo[]; workItems: WorkItem[]; paneKinds: PaneKindInfo[]; headless: HeadlessInfo[]; lastLook: Look | null }
  // The whole of both lists, sent to every client whenever either changes.
  | { type: "inbox"; sessions: SessionInfo[]; workItems: WorkItem[] }
  | { type: "started"; requestId: number; session: SessionInfo }
  // Answers a creation and carries the pane it opened, whose output the creating client receives.
  | { type: "workItemCreated"; requestId: number; workItem: WorkItem; session: SessionInfo }
  // Answers a `planWorkItem`: the branch and the folder a creation would get, and the branches a work item of the repository can start from. `localBases` holds the branch the checkout stands on first, then the other local branches, the newest commit first. `remoteBases` holds the remotes' branches, such as `origin/main`, the newest commit first. `defaultBase` is the one of them a creation without a `base` starts from, or null where the repository has none.
  | { type: "workItemPlan"; requestId: number; branch: string; worktree: string; localBases: string[]; remoteBases: string[]; defaultBase: string | null }
  // Answers an `ask` with the headless session it started.
  | { type: "asked"; requestId: number; headless: HeadlessInfo }
  // One headless session whole, sent to every client whenever it changes.
  | { type: "headless"; headless: HeadlessInfo }
  // Answers a request that failed; nothing was created or started.
  | { type: "error"; requestId: number; message: string }
  | { type: "output"; id: number; data: string }
  | { type: "replay"; id: number; data: string }
  // The session's process ended. The session's output already ends with the line that says so, which the daemon wrote.
  | { type: "exit"; id: number; exitCode: number }
  | { type: "agent"; id: number; event: AgentEvent; tool: string | null; at: number };

/** The close code a client receives when it did not present the daemon's token first. */
export const UNAUTHORIZED = 4001;
