import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { Look, SessionInfo, WorkItem } from "../shared/protocol";

const FILE = "last-look.json";

function isSession(value: unknown): value is SessionInfo {
  const session = value as Partial<SessionInfo> | null;
  return (
    typeof session === "object" &&
    session !== null &&
    typeof session.id === "number" &&
    typeof session.kind === "string" &&
    typeof session.alive === "boolean" &&
    (session.workItemId === null || typeof session.workItemId === "number") &&
    (session.state === null || session.state === "working" || session.state === "waiting" || session.state === "finished")
  );
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
    (item.baseCommit === null || typeof item.baseCommit === "string") &&
    (item.newCommits === null || typeof item.newCommits === "number")
  );
}

function isLook(value: unknown): value is Look {
  const look = value as Partial<Look> | null;
  return typeof look === "object" && look !== null && typeof look.at === "number" && Array.isArray(look.sessions) && look.sessions.every(isSession) && Array.isArray(look.workItems) && look.workItems.every(isWorkItem);
}

/** Only the fields of a look, each entry a copy: what the lists or a file's entries carry beyond them, or become afterwards, is not the look's. */
function lookOf(at: number, sessions: readonly SessionInfo[], workItems: readonly WorkItem[]): Look {
  return {
    at,
    sessions: sessions.map(({ id, kind, alive, workItemId, state }) => ({ id, kind, alive, workItemId, state })),
    workItems: workItems.map(({ id, title, repo, branch, worktree, createdAt, baseCommit, newCommits }) => ({ id, title, repo, branch, worktree, createdAt, baseCommit, newCommits })),
  };
}

/**
 * The daemon's record of when a person last looked: the time, and the
 * sessions and the work items as they were listed then. It is one record,
 * which a later look replaces. Like the list of work items it is the daemon's
 * state: it lives in `last-look.json` in the run directory, readable by the
 * user alone, and is read at start, so the look outlives the daemon. Given no
 * run directory, the look is kept in memory alone.
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
