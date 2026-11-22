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
  /** Whether a pane of the kind can start on the latest conversation of its folder. A daemon of an earlier build sends no such field, and a client reads its absence as false. */
  continues: boolean;
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

/** A group of a repository's work items, which the sidebar lists under the group's name. It belongs to one repository, and its id is no other group's. */
export interface Group {
  id: number;
  name: string;
}

/** What a repository's main checkout holds of the place for work records, as the daemon last read its working tree. */
export interface RecordsPlace {
  /** The root's folder from the top of the repository, `seal` or `agentic-seal`, or null where none stands. */
  root: string | null;
  /** The path of the workflow that runs the check, or null where none stands. */
  check: string | null;
  /** The value of the `Broad gate` key of the root's `config.json`, or null where there is no root, no file, or no such key. */
  broadGate: string | null;
}

/** What a setup of the records place would do. */
export interface RecordsPlan {
  /** The branch the commit lands on, or null where the checkout stands on none. */
  branch: string | null;
  /** The commit's subject. */
  subject: string;
  /** Each file of the place in the order README, config, workflow: `text` is what the setup writes, or null for a file the commit holds, which is kept. Where both names of the root are taken, the plan is `blocked` and lists the workflow alone. */
  files: { path: string; text: string | null }[];
  /** Why the setup cannot run, as a sentence the window shows as it is, or null. */
  blocked: string | null;
  /** A command the daemon read from the repository as its likely broad gate, for the window to put in the field before the person types, or null where it read none. It is no part of the stamp. */
  proposedBroadGate: string | null;
  /** A text that differs wherever the commit the checkout stands at, the branch or a file above differs. A setup carries the stamp of the plan the person read. */
  stamp: string;
}

/**
 * A repository the daemon keeps. It is added and removed on its own, and its
 * work items name it by its id. A repository with no work item is one.
 */
export interface Repository {
  id: number;
  /** The top-level folder of the repository's main checkout. A linked worktree's folder is no repository's. */
  folder: string;
  /** The name a person reads: `customName` where one is set, and the last part of `folder` otherwise. */
  name: string;
  /** The name a person gave the repository, or null where they gave none. */
  customName: string | null;
  /** One character the sidebar shows before the name, an emoji among them, or null where a person set none. */
  icon: string | null;
  /** The base a person chose for the repository's new work items, named as `WorkItem.baseBranch` names one, or null for the repository's default base. */
  defaultBase: string | null;
  /** True where the sidebar does not list the repository. Its work items are listed as any others are. */
  hidden: boolean;
  /** In the order they were made. */
  groups: Group[];
  /** What the main checkout holds of the records place. A daemon of an earlier build sends none, and a client reads its absence as a repository it offers no setup for. */
  records: RecordsPlace;
}

/** The running sessions a person was told of before a request that ends them: the panes whose process is alive and the headless sessions that are working, each by its id. */
export interface Running {
  panes: number[];
  headless: number[];
}

/**
 * What deleting a work item would remove, as the daemon reads it from git,
 * so a person reads each thing by name before the delete. Each list holds
 * 500 entries at most, and the count beside it says how many there are in
 * all.
 */
export interface WorkItemLoss {
  /** The work item's local branch, where it exists: a delete removes it with `git branch -D`. */
  branch: string | null;
  /** The worktree's folder, where git lists a linked worktree there: a delete removes it with `git worktree remove`. A folder git lists none at stays on disk. */
  worktree: string | null;
  /** The commits that the branch or the worktree's `HEAD` holds and that no other local branch, no remote's branch as the clone holds it and no tag holds, the newest first. */
  commits: { hash: string; subject: string }[];
  commitCount: number;
  /** The tracked files of the worktree with a change that is not committed, by path. */
  uncommitted: string[];
  uncommittedCount: number;
  /** The untracked files of the worktree, each by its own path. */
  untracked: string[];
  untrackedCount: number;
  /** The files and the folders of the worktree that git ignores, a folder as one name, such as `node_modules/`. The removal of the worktree removes them, and they make no delete a forced one. */
  ignored: string[];
  ignoredCount: number;
  /** Why the delete cannot run, as a sentence the window shows as it is: another worktree has the branch checked out, or the worktree is locked. Null where it can. */
  blocked: string | null;
  /** True where git reads nothing in the repository's folder. A delete then takes the work item off the list and removes nothing on disk. */
  unreachable: boolean;
  /** A text that differs wherever anything above differs, the entries a list leaves out among it. A delete carries the stamp of the loss the person read. */
  stamp: string;
}

/** Whether a delete would lose work: the loss names a commit, a tracked file with a change or an untracked file. Such a delete runs only where the person chose to force it. The ignored files and folders lose none. */
export function losesWork(loss: Pick<WorkItemLoss, "commitCount" | "uncommittedCount" | "untrackedCount">): boolean {
  return loss.commitCount > 0 || loss.uncommittedCount > 0 || loss.untrackedCount > 0;
}

/**
 * What the daemon did to set up a work item's worktree, as the repository's
 * two files named it when the setup began: `.worktreeinclude`, the ignored
 * paths copied from the main checkout, and `.worktreesetup`, the command run
 * in a pane of the work item.
 */
export interface WorktreeSetup {
  /** The ignored paths copied from the main checkout, a folder as one path, such as `node_modules/`, 500 at most. A path that stood in the worktree already is not copied and not listed. */
  copied: string[];
  copiedCount: number;
  /** The paths that could not be copied, each with the error, 500 at most. Where the staging folder of a failed copy could not be removed, the error names that folder, which stays beside the path's place. */
  failedCopies: { path: string; why: string }[];
  /** The command `.worktreesetup` held, whole, or null where it named none. */
  command: string | null;
  /** The pane the command runs in, a pane of the kind `shell`, or null where no command stands, where its pane could not start, and once the daemon that started the pane has stopped, since the next daemon gives its id to another pane. */
  paneId: number | null;
  /** `running` from the pane's start until its process exits. `succeeded` where the command exited with 0 and no signal ended it, or no command stands, and no copy failed, the daemon did not end the pane and `.worktreesetup` held the command shown; `failed` otherwise. A process a signal ended reports the code 0. */
  state: "running" | "succeeded" | "failed";
  /** The code the command's process exited with, or null while it runs and where no process exited. A process a signal ended reports 0, and `failure` names the signal. */
  exitCode: number | null;
  /** Why the setup failed where the exit code does not say it, as a sentence the window shows as it is: the pane ended before its command did, a signal ended the command, the daemon stopped, `.worktreesetup` changed after the setup was shown so no command ran, a git command failed, or the file or the shell could not be read or started. Null otherwise. */
  failure: string | null;
  startedAt: number;
  /** When the setup ended, or null while it runs and where the daemon stopped before it ended. */
  endedAt: number | null;
}

/**
 * One piece of work, in a worktree of its own, of one repository: `repoId` is
 * that repository's id and `repo` its main checkout's top-level folder, `branch` the branch
 * cut for the work item, `worktree` its folder.
 */
export interface WorkItem {
  id: number;
  title: string;
  /** The id of its `Repository`. In a look that a build before the repositories wrote it is 0, which no repository bears. */
  repoId: number;
  repo: string;
  /** Its repository's `name`. */
  repoName: string;
  branch: string;
  worktree: string;
  createdAt: number;
  /** The commit the branch was cut at, or null for a work item made before this was recorded. For a remote's branch it is the commit the remote held when the daemon fetched that branch for the cut, and the commit the clone held where the fetch failed. */
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
  pinned: boolean;
  /** True where the window raises no notification for a session of the work item. */
  muted: boolean;
  /** The group of its repository it stands in, or null where it stands in none. */
  groupId: number | null;
  /** When it was archived, or null while it is not. */
  archivedAt: number | null;
  /** The setup of its worktree, the last one run, or null where its repository named neither file. */
  setup: WorktreeSetup | null;
}

export interface SessionInfo {
  id: number;
  kind: PaneKind;
  alive: boolean;
  /** The work item whose worktree the pane runs in. Null only for a pane that a daemon of a build before 0.0.2 opened without one. */
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
 * its `sessions` and its `workItems`. The daemon keeps one, for whichever client sent `looked` last.
 */
export interface Look {
  at: number;
  sessions: SessionInfo[];
  workItems: WorkItem[];
}

/**
 * The roles a headless session can be launched as, each with the stage it is
 * launched at. The names are neutral: which agent, which rules and which
 * options a pair means is its adapter's (docs/architecture.md, "Rules that
 * keep it portable"). A new stage is one pair here and one row of each
 * adapter's table.
 */
export const ROLE_STAGES = [
  { role: "proofer", stage: "round" },
  { role: "crafter", stage: "fix-pass" },
  { role: "sealer", stage: "seal" },
] as const;

/** One pair of `ROLE_STAGES`. */
export type RoleStage = (typeof ROLE_STAGES)[number];

/** The pair of `ROLE_STAGES` a value names by its `role` and its `stage`; nothing where it names none. */
export function roleStageOf(value: unknown): RoleStage | undefined {
  if (typeof value !== "object" || value === null) return undefined;
  const { role, stage } = value as Record<string, unknown>;
  return ROLE_STAGES.find((pair) => pair.role === role && pair.stage === stage);
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
  /** The last of what the agent's process printed on its error stream, once the process has exited; empty until then and where it printed nothing there. */
  errorOutput: string;
  /** What stopped a `failed` session before it ended by itself: its time limit, or a request, a client's `stopHeadless` or an archive, a delete or a removal that ended it. Null where the session ended by itself or still works. */
  stopped: "limit" | "request" | null;
  /** The role the session was launched as, and null for a session with none. */
  role: RoleStage | null;
}

/**
 * How long, in milliseconds, the daemon gives one fetch of a base before it
 * ends it. A window that waits for a `baseFetched` derives its own wait from
 * this one.
 */
export const BASE_FETCH_MS = 10_000;

/**
 * What the fetch of a base gave. `commit` is the commit the clone's ref of the
 * base holds once the fetch has ended. `fetch` is `none` for a local branch,
 * for which no remote is asked, `fetched` where the remote answered, so the
 * commit is the remote's, and `kept` where the fetch failed or the daemon
 * ended it, so the commit is the one the clone held. `failure` and `since`
 * are null unless `fetch` is `kept`. `failure` then says why: the first line
 * git printed, or the daemon's own sentence. `since` is the time, in
 * milliseconds, at which the clone's ref last moved, which is not the time of
 * the clone's last fetch, or null where git recorded no move of it.
 */
export interface BaseFetch {
  base: string;
  commit: string;
  fetch: "none" | "fetched" | "kept";
  failure: string | null;
  since: number | null;
}

/** When the daemon keeps the machine it runs on from idle sleep: while an agent works, for as long as the daemon runs, or never. */
export type KeepAwakeChoice = "working" | "always" | "never";

/** The daemon's choice of when to keep its machine awake, and whether it holds the machine awake now. */
export interface KeepAwake {
  choice: KeepAwakeChoice;
  held: boolean;
}

export type ClientMessage =
  | { type: "hello"; token: string }
  // A pane opens in a work item's worktree, and the daemon answers a start whose `workItemId` is no number with an `error`. `continueLatest` starts the pane on the latest conversation of that folder. The daemon answers it with an `error` for a kind that does not declare `continues`.
  | { type: "start"; kind: PaneKind; cols: number; rows: number; requestId: number; workItemId: number; continueLatest?: true }
  // `title` may be empty. The work item's branch and folder are named by the title, by `name` where the title leaves no letter or digit of a-z0-9, and by a name the daemon generates where neither does. `base` is the name of the branch the work item starts from, as `WorkItem.baseBranch` names one, and the repository's default base where it is absent. A remote's branch is fetched before the cut, that one branch from that one remote, unless a fetch of it ended in the last minute, and where the fetch fails the work item is cut at the commit the clone holds. A local branch is cut where it stands, and no remote is asked. `repo` is a folder's absolute path, here and in a plan: the daemon refuses any other. Once the worktree is checked out, the daemon reads `.worktreeinclude` and `.worktreesetup` at the top of the repository's main checkout, copies the ignored paths the first names from the main checkout into the worktree, and starts a pane of the kind `shell` that runs the command the second holds, before the pane of `kind`. It runs that command only where it is `setupCommand`, whole, the command a `workItemPlan` named and the client showed the person: where the file holds another, or one where `setupCommand` is null or absent, or none where it is a command, no command runs and the setup fails with a sentence that says so. A repository that holds neither file gets its worktree as git checks it out. A setup that fails refuses nothing: the work item is created either way.
  | { type: "createWorkItem"; requestId: number; repo: string; title: string; name?: string; base?: string; kind: PaneKind; cols: number; rows: number; setupCommand?: string | null }
  // Asks what a creation in `repo` with this title and name would give, and the setup it would run. The daemon creates nothing, and answers with a `workItemPlan`.
  | { type: "planWorkItem"; requestId: number; repo: string; title: string; name?: string }
  // Asks for the fetch of one base of the repository `repo` is inside, named as `WorkItem.baseBranch` names one. For a remote's branch the daemon asks that remote for that branch, and joins a fetch of it that is under way. A local branch asks no remote. The daemon answers with a `baseFetched`, and with an `error` for a folder that is not absolute or inside no repository and for a base that is none of the repository's.
  | { type: "fetchBase"; requestId: number; repo: string; base: string }
  // Adds the repository `folder` is inside, with no work item. `folder` is an absolute path, and the daemon refuses any other. The repository is the one the folder's main checkout names, so a folder inside a linked worktree adds the repository the worktree belongs to, and a folder of a bare repository's worktree is refused, as is a linked worktree of a submodule or of a repository whose git directory stands apart from its checkout. One the daemon already keeps is not added twice, and is shown again where it was hidden. The daemon answers with `done`.
  | { type: "addRepository"; requestId: number; folder: string }
  // Sets on a repository what a person sets: a field that is absent is left as it is. `name` is stored without the white space at its ends, and null or an empty one gives the repository the last part of its folder as its name. `icon` is one character or, null or empty, none, and more than one is refused. `defaultBase` names the base of the repository's new work items, as `WorkItem.baseBranch` names one, and null gives it its default base again. The daemon answers with `done`.
  | { type: "setRepository"; requestId: number; id: number; name?: string | null; icon?: string | null; defaultBase?: string | null; hidden?: boolean }
  // Takes a repository and its work items, the archived among them, off the daemon's lists. `workItems` names the work items the person was told of and `running` the running sessions. Where the repository holds a work item, or a session of one runs, that the message does not name, the daemon refuses and ends nothing. Without `delete` it removes nothing on disk: the repository, each worktree's folder and each branch stay. It ends the sessions named, and refuses where a pane's process has not exited within its wait. With `delete`, which the person chose, it deletes each work item from disk first, one after another, as a `deleteWorkItem` does with the stamp `stamps` holds under that work item's id and with `force`. It refuses before the first delete, and ends nothing, where `stamps` holds no stamp for a work item, where a session runs that the message does not name, and while an archive is ending the sessions of one of the work items. Where one delete is refused or fails, the removal stops there: the refusal opens with that work item's title, the work items deleted before it are gone, and the repository and the others stay. The repository's own folder is never touched. The daemon answers with `done`.
  | { type: "removeRepository"; requestId: number; id: number; workItems: number[]; running: Running; delete?: { stamps: Record<number, string>; force: boolean } }
  // Asks what a setup of the records place in the repository `id` would write and commit, with `broadGate` as the command a new `config.json` holds. The daemon writes nothing, and answers with a `recordsPlan`.
  | { type: "planRecords"; requestId: number; id: number; broadGate: string }
  // Sets up the records place of the repository `id`: the daemon makes the plan again, and refuses where its stamp is not `stamp`, where it is `blocked`, and where it writes a `config.json` and `broadGate` is empty. It creates each file of the plan only where nothing stands at its path, stages those paths alone and commits those paths alone, on the branch the main checkout stands on, with the person's git identity and the repository's hooks, and pushes nothing. Where the commit fails, it unstages those paths, removes the files and the folders this request created, and answers with git's words. A plan that writes no file is answered with no commit. It waits behind the creations, the renames of a branch and the deletes. The daemon answers with `done`.
  | { type: "setUpRecords"; requestId: number; id: number; broadGate: string; stamp: string }
  // Adds a group to a repository, after the groups it has, under `name` without the white space at its ends. An empty name is refused. The daemon answers with `done`.
  | { type: "addGroup"; requestId: number; repoId: number; name: string }
  // Sets a work item's pin, its mute, its group, or several of them: a field that is absent is left as it is. `groupId` is the id of a group of the work item's repository, or null, which takes the work item out of its group. A group of another repository, or one no repository holds, is refused, and nothing of the message is then set. The daemon answers with `done`.
  | { type: "setWorkItem"; requestId: number; id: number; pinned?: boolean; muted?: boolean; groupId?: number | null }
  // Asks what renaming the work item's branch after the name `title` would give. The daemon renames nothing, and answers with a `renamePlan`.
  | { type: "planRename"; requestId: number; id: number; title: string }
  // Gives the work item the name `title`, without the white space at its ends, and where `branch` is true renames its branch to the one a `renamePlan` names. An empty name is refused, and so is a rename of the branch that a plan would answer with `blocked`: nothing is then changed, the name neither. The worktree's folder keeps its name. The daemon answers with `done`.
  | { type: "renameWorkItem"; requestId: number; id: number; title: string; branch: boolean }
  // Archives a work item: it leaves `workItems` for `archived`, and nothing on disk is changed, its worktree's folder and its branch neither. `running` names the running sessions the person was told of. Where a session of the work item runs that the message does not name, the daemon refuses and ends none. Otherwise it ends the sessions named, waits for the panes' processes to exit, as long as it waits at a removal, and archives the work item whether or not each has exited by then. A pane it ended stays listed, as an exited one, and a headless session it stopped as a failed one. The daemon reads git for no archived work item, and starts no pane and no headless session in one. It answers with `done`, and an archive of a work item that is archived changes nothing.
  | { type: "archiveWorkItem"; requestId: number; id: number; running: Running }
  // Restores an archived work item: it stands in `workItems` again, with the panes and the headless sessions the daemon still lists for it, and the daemon reads its branch at once. The daemon answers with `done`, and a restore of a work item that is not archived changes nothing.
  | { type: "restoreWorkItem"; requestId: number; id: number }
  // Asks what deleting the work item would remove. The daemon removes nothing, and answers with a `workItemLoss`.
  | { type: "readLoss"; requestId: number; id: number }
  // Deletes a work item, archived or not: the daemon removes its worktree with `git worktree remove` and its local branch with `git branch -D`, and takes it, its panes and its headless sessions off the lists. It removes no file by itself, pushes nothing, and names no ref of a remote to git. `stamp` is the stamp of the loss the person read, `force` whether they chose to force the delete, and `running` the running sessions they were told of. The daemon reads the loss again and refuses where its stamp is another, where the loss is `blocked`, and where work would be lost and `force` is not true. It then ends the sessions named, as a removal does, and refuses where a session runs that the message does not name or a pane's process has not exited within its wait. It reads the loss once more and refuses in the same ways, so nothing that arrived while the sessions ended is removed unread. Git removes the worktree with `--force` only where `force` is true. Where a step fails, the steps after it do not run and the work item stays listed. Where the loss is `unreachable`, the work item leaves the lists and nothing on disk is removed. While a delete is under way the daemon starts no pane and no headless session in the work item and archives it at no request, and it refuses a delete while an archive of the work item is ending its sessions. The daemon answers with `done`.
  | { type: "deleteWorkItem"; requestId: number; id: number; stamp: string; force: boolean; running: Running }
  // Asks for the session's kept output as a `replay`, and for its output after that.
  | { type: "attach"; id: number }
  // Ends this client's receiving of the session's output until it attaches again. The session and its process are untouched, and the daemon answers nothing.
  | { type: "detach"; id: number }
  // Has the daemon forget the session's kept output, after a person cleared or reset the pane's terminal. Without `keepModes`, which a reset sends, the next `replay` holds only what the session prints afterwards. With it, which a clear sends, the daemon first reads the kept output for the private modes the session's program set or reset (`ESC [ ? Pm h` and `ESC [ ? Pm l`), and the next `replay` opens with one sequence for each mode's last state, before what the session prints afterwards. Where the kept output stopped inside an escape alone or with its intermediate characters, a CSI sequence that holds only parameter characters followed only by intermediate characters, or an OSC string with no end, that unfinished sequence follows the modes, so what the session prints next completes it. The daemon keeps no other unfinished sequence. The daemon answers nothing, and does nothing for an id it does not list.
  | { type: "forget"; id: number; keepModes?: true }
  // Ends the session's process if it is alive, and takes the session off the lists.
  | { type: "close"; id: number }
  // Runs the setup of a work item's worktree again, as its repository's two files name it now, in a pane of the size given. The daemon refuses it with an `error`, and changes nothing, for a work item it does not list, an archived one, one being deleted, one whose setup still runs, and one whose repository holds neither file now. Otherwise it takes the earlier setup pane off the lists, copies the included paths that do not stand in the worktree, starts a new setup pane where a command stands and it is `setupCommand`, whole, the command the client showed the person, records the new setup in place of the old, and answers with `started` and the new pane, whose output the client receives, or with `done` where no pane started. Where the file holds another command than `setupCommand`, or one where it is null or absent, or none where it is a command, no command runs, and the setup records the command the file holds and a sentence that says it did not run, so the client shows that command before the next run.
  | { type: "runSetup"; requestId: number; workItemId: number; cols: number; rows: number; setupCommand?: string | null }
  // Starts a headless session that answers `prompt` in the work item's worktree. The daemon stops it where it still works at its time limit. With `role`, the session is launched as that role at that stage; the daemon answers a pair `ROLE_STAGES` does not list with an `error`, and starts nothing. Without it the session has no role.
  | { type: "ask"; requestId: number; workItemId: number; prompt: string; role?: RoleStage }
  // Stops a headless session that is working: its run is stopped, and it is `failed`, with `stopped` set to `request`. A session that is not working is left as it is. The daemon answers with `done`, and with an `error` for an id it does not list.
  | { type: "stopHeadless"; requestId: number; id: number }
  // Says that a person looked at what the client shows, now. The daemon records the look and answers nothing.
  | { type: "looked" }
  // Sets the daemon's choice of when to keep its machine awake. It has no answer of its own: the `keepAwake` message that follows a change is the answer. The daemon ignores a value that is none of the three, and a daemon that can hold nothing ignores them all.
  | { type: "setKeepAwake"; choice: KeepAwakeChoice }
  | { type: "input"; id: number; data: string }
  | { type: "resize"; id: number; cols: number; rows: number };

export type ServerMessage =
  // `repositories` holds every repository the daemon keeps, the hidden among them, in the order they were added. `workItems` holds the work items that are not archived, and `archived` the archived ones. `lastLook` is the look as it stood when the client said hello, or null where no client ever sent `looked`. A daemon of a build before the repositories sends neither `repositories` nor `archived`. A daemon that can hold nothing, and a daemon of an earlier build, send no `keepAwake`, and a client reads its absence as a daemon that offers no such choice. `agentNotice` is what the adapter last said a person should know of its agent, such as that the installed one is older than the oldest version checked, as a sentence the window shows as it is, or null where it said nothing or has not answered yet. A daemon of an earlier build sends none, and a client reads its absence as null.
  | { type: "ready"; sessions: SessionInfo[]; repositories: Repository[]; workItems: WorkItem[]; archived: WorkItem[]; paneKinds: PaneKindInfo[]; headless: HeadlessInfo[]; lastLook: Look | null; keepAwake?: KeepAwake; agentNotice: string | null }
  // The whole of the four lists, sent to every client whenever one of them changes.
  | { type: "inbox"; sessions: SessionInfo[]; repositories: Repository[]; workItems: WorkItem[]; archived: WorkItem[] }
  | { type: "started"; requestId: number; session: SessionInfo }
  // Answers a creation and carries the pane the creation named, whose output the creating client receives. The setup pane, where the repository names a command, is listed in the inbox and named by `workItem.setup`, and the creating client receives its output too.
  | { type: "workItemCreated"; requestId: number; workItem: WorkItem; session: SessionInfo }
  // Answers a `planWorkItem`: the branch and the folder a creation would get, and the branches a work item of the repository can start from. `localBases` holds the branch the checkout stands on first, then the other local branches, the newest commit first, without a local branch that names another ref, such as an alias `main` of `master`. `remoteBases` holds the remotes' branches, such as `origin/main`, the newest commit first. `defaultBase` is the one of them a creation without a `base` starts from, or null where the repository has none. `setupCommand` is the command the main checkout's `.worktreesetup` holds, whole, or null where it names none, and `includes` whether its `.worktreeinclude` stands. A daemon of an earlier build sends neither, and a client reads their absence as null and false.
  | { type: "workItemPlan"; requestId: number; branch: string; worktree: string; localBases: string[]; remoteBases: string[]; defaultBase: string | null; setupCommand: string | null; includes: boolean }
  // Answers a `fetchBase` with what the fetch gave.
  | ({ type: "baseFetched"; requestId: number } & BaseFetch)
  // Answers a `planRename`. `branch` is the branch a rename would give the work item, `owlery/<slug of the name>` with -2, -3 and so on while another local branch bears the name, or null where the name leaves no slug. `blocked` is why the branch cannot be renamed, as a sentence the window shows as it is, or null where it can: it can where the branch exists, has another name than `branch` and no upstream, and no remote of the clone holds a branch of its name.
  | { type: "renamePlan"; requestId: number; branch: string | null; blocked: string | null }
  // Answers a `readLoss` with what a delete of the work item `id` would remove.
  | { type: "workItemLoss"; requestId: number; id: number; loss: WorkItemLoss }
  // Answers a `planRecords` with what a setup of the repository `id` would do.
  | { type: "recordsPlan"; requestId: number; id: number; plan: RecordsPlan }
  // Answers an `ask` with the headless session it started.
  | { type: "asked"; requestId: number; headless: HeadlessInfo }
  // One headless session whole, sent to every client whenever it changes.
  | { type: "headless"; headless: HeadlessInfo }
  // A headless session that ended left the daemon's list, which keeps the sessions that ended last and every one still working. Sent to every client.
  | { type: "headlessDropped"; id: number }
  // The choice and whether the hold stands, sent to every client whenever either changes.
  | { type: "keepAwake"; keepAwake: KeepAwake }
  // The adapter's notice of its agent, sent to every client whenever it changes: the sentence, or null once there is nothing to say.
  | { type: "agentNotice"; notice: string | null }
  // Answers a request that was carried out and has no other answer, before the `inbox` that carries what it changed.
  | { type: "done"; requestId: number }
  // Answers a request that failed; nothing was created or started.
  | { type: "error"; requestId: number; message: string }
  | { type: "output"; id: number; data: string }
  | { type: "replay"; id: number; data: string }
  // The session's process ended. The session's output already ends with the line that says so, which the daemon wrote.
  | { type: "exit"; id: number; exitCode: number }
  | { type: "agent"; id: number; event: AgentEvent; tool: string | null; at: number };

/** The close code a client receives when it did not present the daemon's token first. */
export const UNAUTHORIZED = 4001;
