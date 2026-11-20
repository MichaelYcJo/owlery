import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Group } from "../shared/protocol";
import { writeWholeFile } from "./whole-file";

const FILE = "repositories.json";
/** The list a build before the repositories kept, of work items alone. It is read where `FILE` does not exist, and never written. */
const OLD_FILE = "work-items.json";

/** A work item as the store keeps it, inside its repository: without the repository's folder and name, and without what the daemon reads from git at each read. */
export interface StoredWorkItem {
  id: number;
  title: string;
  branch: string;
  worktree: string;
  createdAt: number;
  baseCommit: string | null;
  baseBranch: string | null;
  pinned: boolean;
  muted: boolean;
  /** The group of its repository it stands in, or null where it stands in none. */
  groupId: number | null;
  /** When it was archived, or null while it is not. */
  archivedAt: number | null;
}

/** A repository as the store keeps it, with its work items inside it. */
export interface StoredRepository {
  id: number;
  /** The repository's top-level folder. */
  folder: string;
  /** The name a person gave it, or null where the last part of its folder names it. */
  name: string | null;
  icon: string | null;
  /** The base a person chose for its new work items, or null for the repository's default base. */
  defaultBase: string | null;
  hidden: boolean;
  addedAt: number;
  groups: Group[];
  workItems: StoredWorkItem[];
}

/** What a creation hands the store: the repository's folder, and what the work item's branch and worktree are. */
export type Place = Pick<StoredWorkItem, "title" | "branch" | "worktree" | "baseCommit" | "baseBranch"> & { repo: string };

/** A stored work item with the repository that holds it. */
export interface Held {
  repository: StoredRepository;
  item: StoredWorkItem;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isTextOrNull = (value: unknown): value is string | null => value === null || typeof value === "string";
const isNumberOrNull = (value: unknown): value is number | null => value === null || typeof value === "number";

function isGroup(value: unknown): value is Group {
  return isRecord(value) && typeof value.id === "number" && typeof value.name === "string";
}

function isStoredWorkItem(value: unknown): value is StoredWorkItem {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.title === "string" &&
    typeof value.branch === "string" &&
    typeof value.worktree === "string" &&
    typeof value.createdAt === "number" &&
    isTextOrNull(value.baseCommit) &&
    isTextOrNull(value.baseBranch) &&
    typeof value.pinned === "boolean" &&
    typeof value.muted === "boolean" &&
    isNumberOrNull(value.groupId) &&
    isNumberOrNull(value.archivedAt)
  );
}

function isStoredRepository(value: unknown): value is StoredRepository {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.folder === "string" &&
    isTextOrNull(value.name) &&
    isTextOrNull(value.icon) &&
    isTextOrNull(value.defaultBase) &&
    typeof value.hidden === "boolean" &&
    typeof value.addedAt === "number" &&
    Array.isArray(value.groups) &&
    value.groups.every(isGroup) &&
    Array.isArray(value.workItems) &&
    value.workItems.every(isStoredWorkItem)
  );
}

/** An entry of `work-items.json`. One written before the base commit was recorded has no `baseCommit`, and one written before the base branch was has no `baseBranch`. */
interface OldWorkItem {
  id: number;
  title: string;
  repo: string;
  branch: string;
  worktree: string;
  createdAt: number;
  baseCommit?: string | null;
  baseBranch?: string | null;
}

function isOldWorkItem(value: unknown): value is OldWorkItem {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.title === "string" &&
    typeof value.repo === "string" &&
    typeof value.branch === "string" &&
    typeof value.worktree === "string" &&
    typeof value.createdAt === "number" &&
    (value.baseCommit === undefined || isTextOrNull(value.baseCommit)) &&
    (value.baseBranch === undefined || isTextOrNull(value.baseBranch))
  );
}

/** What a work item holds of the fields a person sets, before any is set. */
const UNSET = { pinned: false, muted: false, groupId: null, archivedAt: null };

/** The JSON a file holds, or undefined where no file stands there. A file that cannot be read, and one that is no JSON, gives null. */
function readJson(file: string): unknown {
  let text: string;
  try {
    text = readFileSync(file, "utf8");
  } catch (error) {
    return (error as NodeJS.ErrnoException).code === "ENOENT" ? undefined : null;
  }
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

/**
 * The daemon's repositories, each with its work items inside it. It is the
 * daemon's state, not the person's repository's: it lives in
 * `repositories.json` in the run directory, readable by the user alone, is
 * written whole at each change and is read at start, so it outlives the
 * daemon. A file that is not a list of repositories is read as none.
 *
 * Where that file does not exist, the store starts from `work-items.json`,
 * the list a build before the repositories wrote: one repository for each
 * distinct folder of its work items, in the order of each one's first work
 * item, added when that work item was made, with every work item under its
 * own and nothing set on any. That file is never written, so a build before
 * this one, started later, still reads it. Given no run directory, the store
 * is kept in memory alone.
 */
export class RepositoryStore {
  private readonly held: StoredRepository[] = [];
  private readonly file: string | undefined;

  constructor(
    runDir: string | undefined,
    private readonly now: () => number = Date.now,
  ) {
    this.file = runDir === undefined ? undefined : join(runDir, FILE);
    if (this.file === undefined || runDir === undefined) return;
    const value = readJson(this.file);
    if (value === undefined) {
      this.startFrom(readJson(join(runDir, OLD_FILE)));
      return;
    }
    if (!Array.isArray(value) || !value.every(isStoredRepository)) return;
    // Only the fields of the store, whatever else the file's entries carry.
    for (const { id, folder, name, icon, defaultBase, hidden, addedAt, groups, workItems } of value) {
      this.held.push({
        id,
        folder,
        name,
        icon,
        defaultBase,
        hidden,
        addedAt,
        groups: groups.map((group) => ({ id: group.id, name: group.name })),
        workItems: workItems.map(({ id, title, branch, worktree, createdAt, baseCommit, baseBranch, pinned, muted, groupId, archivedAt }) => ({ id, title, branch, worktree, createdAt, baseCommit, baseBranch, pinned, muted, groupId, archivedAt })),
      });
    }
  }

  /** Every repository, the hidden among them, in the order they were added. */
  repositories(): readonly StoredRepository[] {
    return this.held;
  }

  /** Every work item with its repository, the archived among them: repository by repository, and inside one in the order they were made. */
  workItems(): Held[] {
    return this.held.flatMap((repository) => repository.workItems.map((item) => ({ repository, item })));
  }

  workItem(id: number): Held | undefined {
    return this.workItems().find(({ item }) => item.id === id);
  }

  /**
   * Adds the repository of a top-level folder, with no work item. One the
   * store holds is not added twice, and is shown again where it was hidden.
   * `changed` says whether the store is another than it was.
   */
  addRepository(folder: string): { repository: StoredRepository; changed: boolean } {
    const answer = this.shown(folder);
    if (answer.changed) this.write();
    return answer;
  }

  /** Adds a work item to the repository of its folder, which is added first where the store does not hold it and shown again where it was hidden. */
  addWorkItem(place: Place): Held {
    const { repository } = this.shown(place.repo);
    const id = this.workItems().reduce((highest, { item }) => Math.max(highest, item.id), 0) + 1;
    const item: StoredWorkItem = { id, title: place.title, branch: place.branch, worktree: place.worktree, createdAt: this.now(), baseCommit: place.baseCommit, baseBranch: place.baseBranch, ...UNSET };
    repository.workItems.push(item);
    this.write();
    return { repository, item };
  }

  /**
   * Sets on a work item the fields given, of those a person sets: its pin,
   * its mute, its title and its branch. It answers whether the work item is
   * another than it was, and writes the store only where it is. Undefined
   * where no work item has the id.
   */
  setWorkItem(id: number, fields: Partial<Pick<StoredWorkItem, "pinned" | "muted" | "title" | "branch">>): boolean | undefined {
    const item = this.workItem(id)?.item;
    if (!item) return undefined;
    const { pinned = item.pinned, muted = item.muted, title = item.title, branch = item.branch } = fields;
    if (pinned === item.pinned && muted === item.muted && title === item.title && branch === item.branch) return false;
    Object.assign(item, { pinned, muted, title, branch });
    this.write();
    return true;
  }

  /** The repository of a folder, not hidden: the one held, or a new one. Nothing is written here. */
  private shown(folder: string): { repository: StoredRepository; changed: boolean } {
    const known = this.held.find((repository) => repository.folder === folder);
    if (known) {
      const changed = known.hidden;
      known.hidden = false;
      return { repository: known, changed };
    }
    const id = this.held.reduce((highest, repository) => Math.max(highest, repository.id), 0) + 1;
    const repository: StoredRepository = { id, folder, name: null, icon: null, defaultBase: null, hidden: false, addedAt: this.now(), groups: [], workItems: [] };
    this.held.push(repository);
    return { repository, changed: true };
  }

  /** Starts the store from what `work-items.json` holds. A file that is not a list of work items starts it empty. */
  private startFrom(value: unknown): void {
    if (!Array.isArray(value) || !value.every(isOldWorkItem)) return;
    for (const { id, title, repo, branch, worktree, createdAt, baseCommit, baseBranch } of value) {
      let repository = this.held.find((known) => known.folder === repo);
      if (!repository) {
        // The time its first work item was made, so each start before the first change gives the same store.
        repository = { id: this.held.length + 1, folder: repo, name: null, icon: null, defaultBase: null, hidden: false, addedAt: createdAt, groups: [], workItems: [] };
        this.held.push(repository);
      }
      repository.workItems.push({ id, title, branch, worktree, createdAt, baseCommit: baseCommit ?? null, baseBranch: baseBranch ?? null, ...UNSET });
    }
  }

  private write(): void {
    if (this.file === undefined) return;
    // A daemon that starts meanwhile never reads a half-written file, and a write that fails removes its partial file.
    writeWholeFile(this.file, JSON.stringify(this.held));
  }
}
