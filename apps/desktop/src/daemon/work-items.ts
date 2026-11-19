import { readFileSync, renameSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import type { WorkItem } from "../shared/protocol";

const FILE = "work-items.json";

/** A work item as the list keeps it: without what the daemon reads from git at each read, and without the name its repository's folder gives. */
export type StoredWorkItem = Omit<WorkItem, "repoName" | "aheadOfBase" | "newCommits" | "commits" | "changes">;

/** An entry of the file. One written before the base commit was recorded has no `baseCommit`, and one written before the base branch was has no `baseBranch`. */
function isStored(value: unknown): value is Omit<StoredWorkItem, "baseCommit" | "baseBranch"> & { baseCommit?: string | null; baseBranch?: string | null } {
  const item = value as Partial<StoredWorkItem> | null;
  return (
    typeof item === "object" &&
    item !== null &&
    typeof item.id === "number" &&
    typeof item.title === "string" &&
    typeof item.repo === "string" &&
    typeof item.branch === "string" &&
    typeof item.worktree === "string" &&
    typeof item.createdAt === "number" &&
    (item.baseCommit === undefined || item.baseCommit === null || typeof item.baseCommit === "string") &&
    (item.baseBranch === undefined || item.baseBranch === null || typeof item.baseBranch === "string")
  );
}

/**
 * The daemon's list of work items. It is the daemon's state, not the
 * repository's: it lives in `work-items.json` in the run directory, readable
 * by the user alone, and is read at start, so the list outlives the daemon.
 * Given no run directory, the list is kept in memory alone.
 */
export class WorkItemList {
  private readonly items: StoredWorkItem[] = [];
  private readonly file: string | undefined;

  constructor(
    runDir: string | undefined,
    private readonly now: () => number = Date.now,
  ) {
    this.file = runDir === undefined ? undefined : join(runDir, FILE);
    if (this.file === undefined) return;
    try {
      const value: unknown = JSON.parse(readFileSync(this.file, "utf8"));
      if (Array.isArray(value) && value.every(isStored)) {
        // Only the fields of a work item, whatever else the file's entries carry.
        for (const { id, title, repo, branch, worktree, createdAt, baseCommit, baseBranch } of value) this.items.push({ id, title, repo, branch, worktree, createdAt, baseCommit: baseCommit ?? null, baseBranch: baseBranch ?? null });
      }
    } catch {
      // No daemon has written here, or the file is not ours.
    }
  }

  all(): StoredWorkItem[] {
    return [...this.items];
  }

  get(id: number): StoredWorkItem | undefined {
    return this.items.find((item) => item.id === id);
  }

  add(place: Pick<StoredWorkItem, "title" | "repo" | "branch" | "worktree" | "baseCommit" | "baseBranch">): StoredWorkItem {
    const id = this.items.reduce((highest, item) => Math.max(highest, item.id), 0) + 1;
    const item: StoredWorkItem = { id, title: place.title, repo: place.repo, branch: place.branch, worktree: place.worktree, createdAt: this.now(), baseCommit: place.baseCommit, baseBranch: place.baseBranch };
    this.items.push(item);
    this.write();
    return item;
  }

  private write(): void {
    if (this.file === undefined) return;
    const partial = `${this.file}.${process.pid}`;
    writeFileSync(partial, JSON.stringify(this.items), { mode: 0o600 });
    // A daemon that starts meanwhile never reads a half-written file.
    renameSync(partial, this.file);
  }
}
