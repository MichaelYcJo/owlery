import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Changes, CommitInfo, FileChange, Look, SessionInfo, WorkItem } from "../shared/protocol";

const FILE = "last-look.json";

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isTextOrNull = (value: unknown): value is string | null => value === null || typeof value === "string";
const isNumberOrNull = (value: unknown): value is number | null => value === null || typeof value === "number";

function isSession(value: unknown): value is SessionInfo {
  const session = value as Partial<SessionInfo> | null;
  return (
    typeof session === "object" &&
    session !== null &&
    typeof session.id === "number" &&
    typeof session.kind === "string" &&
    typeof session.alive === "boolean" &&
    (session.workItemId === null || typeof session.workItemId === "number") &&
    (session.state === null || session.state === "working" || session.state === "waiting" || session.state === "finished") &&
    isNumberOrNull(session.stateSince) &&
    isTextOrNull(session.stateText) &&
    isTextOrNull(session.stateTool)
  );
}

function isCommit(value: unknown): value is CommitInfo {
  return isRecord(value) && typeof value.hash === "string" && typeof value.subject === "string" && typeof value.at === "number" && isNumberOrNull(value.added) && isNumberOrNull(value.removed);
}

function isFileChange(value: unknown): value is FileChange {
  return isRecord(value) && typeof value.path === "string" && isNumberOrNull(value.added) && isNumberOrNull(value.removed);
}

function isChanges(value: unknown): value is Changes {
  return isRecord(value) && typeof value.files === "number" && typeof value.added === "number" && typeof value.removed === "number" && Array.isArray(value.list) && value.list.every(isFileChange);
}

function isWorkItem(value: unknown): value is WorkItem {
  const item = value as Partial<WorkItem> | null;
  return (
    typeof item === "object" &&
    item !== null &&
    typeof item.id === "number" &&
    typeof item.title === "string" &&
    typeof item.repo === "string" &&
    typeof item.branch === "string" &&
    typeof item.worktree === "string" &&
    typeof item.createdAt === "number" &&
    typeof item.repoName === "string" &&
    isTextOrNull(item.baseCommit) &&
    isTextOrNull(item.baseBranch) &&
    isNumberOrNull(item.newCommits) &&
    (item.commits === null || (Array.isArray(item.commits) && item.commits.every(isCommit))) &&
    (item.changes === null || isChanges(item.changes))
  );
}

function isLook(value: unknown): value is Look {
  const look = value as Partial<Look> | null;
  return typeof look === "object" && look !== null && typeof look.at === "number" && Array.isArray(look.sessions) && look.sessions.every(isSession) && Array.isArray(look.workItems) && look.workItems.every(isWorkItem);
}

/** Only the fields of a look, each entry a copy, its commits and its changes among it: what the lists or a file's entries carry beyond them, or become afterwards, is not the look's. */
function lookOf(at: number, sessions: readonly SessionInfo[], workItems: readonly WorkItem[]): Look {
  return {
    at,
    sessions: sessions.map(({ id, kind, alive, workItemId, state, stateSince, stateText, stateTool }) => ({ id, kind, alive, workItemId, state, stateSince, stateText, stateTool })),
    workItems: workItems.map(({ id, title, repo, repoName, branch, worktree, createdAt, baseCommit, baseBranch, newCommits, commits, changes }) => ({
      id,
      title,
      repo,
      repoName,
      branch,
      worktree,
      createdAt,
      baseCommit,
      baseBranch,
      newCommits,
      commits: commits && commits.map(({ hash, subject, at, added, removed }) => ({ hash, subject, at, added, removed })),
      changes: changes && { files: changes.files, added: changes.added, removed: changes.removed, list: changes.list.map(({ path, added, removed }) => ({ path, added, removed })) },
    })),
  };
}

/**
 * The daemon's record of when a person last looked: the time, and the
 * sessions and the work items as they were listed then. It is one record,
 * which a later look replaces. Like the list of work items it is the daemon's
 * state: it lives in `last-look.json` in the run directory, readable by the
 * user alone, and is read at start, so the look outlives the daemon. A file
 * whose entries lack a field of the protocol's, as one a build before that
 * field wrote, is no look. Given no run directory, the look is kept in
 * memory alone.
 */
export class LastLook {
  private look: Look | null = null;
  private readonly file: string | undefined;

  constructor(runDir: string | undefined) {
    this.file = runDir === undefined ? undefined : join(runDir, FILE);
    if (this.file === undefined) return;
    try {
      const value: unknown = JSON.parse(readFileSync(this.file, "utf8"));
      if (isLook(value)) this.look = lookOf(value.at, value.sessions, value.workItems);
    } catch {
      // No daemon has written here, or the file is not ours.
    }
  }

  /** The look last recorded, or null where none ever was. */
  get(): Look | null {
    return this.look;
  }

  /** Replaces the look. It is held before it is written, so a write that throws leaves the daemon with the look in memory. */
  record(at: number, sessions: readonly SessionInfo[], workItems: readonly WorkItem[]): void {
    this.look = lookOf(at, sessions, workItems);
    if (this.file === undefined) return;
    const partial = `${this.file}.${process.pid}`;
    writeFileSync(partial, JSON.stringify(this.look), { mode: 0o600 });
    // A daemon that starts meanwhile never reads a half-written file.
    renameSync(partial, this.file);
  }
}
