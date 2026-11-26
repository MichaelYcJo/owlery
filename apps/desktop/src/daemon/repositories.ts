import { lstatSync, readFileSync, renameSync } from "node:fs";
import { join } from "node:path";
import type { Chain, Group, ChainChoice, PullRequest, WorktreeSetup } from "../shared/protocol";
import { type WrittenChain, chainRead, isChain } from "./chain";
import { isPullRequest, pullRequestOf } from "./github";
import { writeWholeFile } from "./whole-file";
import { DAEMON_STOPPED, isWorktreeSetup, setupOf } from "./worktree-setup";
import { repositoryOfSync } from "./worktrees";

const FILE = "repositories.json";
/** The list a build before the repositories kept, of work items alone. It is read where `FILE` does not exist, and never written. */
const OLD_FILE = "work-items.json";

/** A work item as the store keeps it, inside its repository: without the repository's folder and name, and without what the daemon reads from git at each read. */
export interface StoredWorkItem {
  id: number;
  title: string;
  /** The work item's local branch, or null where it has none yet. */
  branch: string | null;
  /** True where Owlery made the branch, and false where the work item has none or its branch is one Owlery did not make. */
  ownsBranch: boolean;
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
  /** The setup of its worktree, the last one run, or null where its repository named neither file. */
  setup: WorktreeSetup | null;
  /** Its chain: where the run `Daemon#startChain` started stands, with the stages of every start, or null where none ran for it. */
  chain: Chain | null;
  /** Its pull request, as GitHub last answered, or null where the daemon opened none for it. */
  pullRequest: PullRequest | null;
  /** The account a person set on it, by its id, or null where none is set there. */
  accountId: number | null;
  /** Its worktree's size, as `du -sk` measured it once after its setup, in kilobytes of 1,024 bytes, with the time of the measure; null until it is measured. */
  worktreeSize: WorktreeSize | null;
}

/** The size of a worktree, measured. */
export interface WorktreeSize {
  kilobytes: number;
  measuredAt: number;
}

/** A repository as the store keeps it, with its work items inside it. */
export interface StoredRepository {
  id: number;
  /** The top-level folder of the repository's main checkout. One started from `work-items.json` whose folder git could not read then has the folder that file held. */
  folder: string;
  /** The name a person gave it, or null where the last part of its folder names it. */
  name: string | null;
  icon: string | null;
  /** The base a person chose for its new work items, or null for the repository's default base. */
  defaultBase: string | null;
  hidden: boolean;
  /** The chain a person chose for its Claude Code panes, or null where they gave no answer. */
  paneChain: ChainChoice | null;
  addedAt: number;
  groups: Group[];
  workItems: StoredWorkItem[];
  /** The account a person set on it, by its id, or null where none is set there. */
  accountId: number | null;
}

/** What a creation hands the store: the repository's folder, and what the work item's branch and worktree are, and whether Owlery made the branch. */
export type Place = Pick<StoredWorkItem, "title" | "branch" | "ownsBranch" | "worktree" | "baseCommit" | "baseBranch"> & { repo: string };

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

/** A stored work item as a file holds one: one written before the setup was recorded has none, one written before a chain was kept has none of that, one written before a pull request was kept has none of that, one written before accounts were kept has no account, one written before worktrees were measured has no size, and one written before Owlery kept whether it made the branch says nothing of that, since Owlery then made every work item's branch. */
type WrittenWorkItem = Omit<StoredWorkItem, "ownsBranch" | "setup" | "chain" | "pullRequest" | "accountId" | "worktreeSize"> & { ownsBranch?: boolean; setup?: WorktreeSetup | null; chain?: WrittenChain | null; pullRequest?: PullRequest | null; accountId?: number | null; worktreeSize?: WorktreeSize | null };

function isWorktreeSize(value: unknown): value is WorktreeSize {
  return isRecord(value) && typeof value.kilobytes === "number" && typeof value.measuredAt === "number";
}

function isStoredWorkItem(value: unknown): value is WrittenWorkItem {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.title === "string" &&
    isTextOrNull(value.branch) &&
    (value.ownsBranch === undefined || typeof value.ownsBranch === "boolean") &&
    typeof value.worktree === "string" &&
    typeof value.createdAt === "number" &&
    isTextOrNull(value.baseCommit) &&
    isTextOrNull(value.baseBranch) &&
    typeof value.pinned === "boolean" &&
    typeof value.muted === "boolean" &&
    isNumberOrNull(value.groupId) &&
    isNumberOrNull(value.archivedAt) &&
    (value.setup === undefined || value.setup === null || isWorktreeSetup(value.setup)) &&
    (value.chain === undefined || value.chain === null || isChain(value.chain)) &&
    (value.pullRequest === undefined || value.pullRequest === null || isPullRequest(value.pullRequest)) &&
    (value.accountId === undefined || isNumberOrNull(value.accountId)) &&
    (value.worktreeSize === undefined || value.worktreeSize === null || isWorktreeSize(value.worktreeSize))
  );
}

const isChainChoice = (value: unknown): value is ChainChoice => value === "owlery" || value === "plugin";

/** A stored repository as a file holds one, its work items as the file holds them: one written before a person's choice of a chain was kept has none, and one written before accounts were kept has no account. */
type WrittenRepository = Omit<StoredRepository, "workItems" | "paneChain" | "accountId"> & { paneChain?: ChainChoice | null; workItems: WrittenWorkItem[]; accountId?: number | null };

function isStoredRepository(value: unknown): value is WrittenRepository {
  return (
    isRecord(value) &&
    typeof value.id === "number" &&
    typeof value.folder === "string" &&
    isTextOrNull(value.name) &&
    isTextOrNull(value.icon) &&
    isTextOrNull(value.defaultBase) &&
    typeof value.hidden === "boolean" &&
    (value.paneChain === undefined || value.paneChain === null || isChainChoice(value.paneChain)) &&
    typeof value.addedAt === "number" &&
    Array.isArray(value.groups) &&
    value.groups.every(isGroup) &&
    Array.isArray(value.workItems) &&
    value.workItems.every(isStoredWorkItem) &&
    (value.accountId === undefined || isNumberOrNull(value.accountId))
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

/** What a work item holds of the fields set after its creation, by a person, by its setup, by its chain, by its pull request stage or by the measure of its worktree, before any is set. */
const UNSET = { pinned: false, muted: false, groupId: null, archivedAt: null, setup: null, chain: null, pullRequest: null, accountId: null, worktreeSize: null };

/** The next id of each kind the store gives. Each only rises, so no id is given twice though the one that bore it was removed. */
interface Counts {
  nextWorkItemId: number;
  nextRepositoryId: number;
  nextGroupId: number;
}

/** What `repositories.json` holds: the three counts and the repositories. */
type Stored = Counts & { repositories: StoredRepository[] };

function isStored(value: unknown): value is Counts & { repositories: WrittenRepository[] } {
  return isRecord(value) && typeof value.nextWorkItemId === "number" && typeof value.nextRepositoryId === "number" && typeof value.nextGroupId === "number" && Array.isArray(value.repositories) && value.repositories.every(isStoredRepository);
}

/** One past the highest of the ids, and 1 where there is none. */
function past(ids: readonly number[]): number {
  return ids.reduce((highest, id) => Math.max(highest, id), 0) + 1;
}

/**
 * A setup as the store reads it at the daemon's start: none where the file
 * held none, a failed one where it was running, and in each case naming no
 * pane: the pane did not outlive the daemon that started it, and the next
 * daemon counts its pane ids from 1 again, so the id would name another
 * pane.
 */
function setupRead(setup: WorktreeSetup | null | undefined): WorktreeSetup | null {
  if (setup === undefined || setup === null) return null;
  const read = { ...setupOf(setup), paneId: null };
  return read.state === "running" ? { ...read, state: "failed", failure: DAEMON_STOPPED } : read;
}

/** What a store did with a `repositories.json` it could not read: the file's path, and the path it kept the file at, or null where the file could not be moved. */
export interface SetAside {
  refused: string;
  keptAs: string | null;
}

/** The sentence a person reads of a file the store set aside. */
export function setAsideNotice({ refused, keptAs }: SetAside): string {
  return keptAs === null
    ? `Owlery could not read its list of repositories at ${refused}, nor move it aside. The file stays as it is, and no change to the repositories is kept once the daemon stops.`
    : `Owlery could not read its list of repositories, so it kept the file as ${keptAs} and started with none. Nothing in that file was changed.`;
}

/** The path in `runDir` a refused file is kept at, for a store started at `time`: `repositories-unread-<YYYYMMDDTHHMMSSZ>.json`, with `-2`, `-3` and on where a file or a folder stands at the name. */
function keptPath(runDir: string, time: number): string {
  const stamp = new Date(time).toISOString().replace(/\.\d{3}Z$/, "Z").replace(/[-:]/g, "");
  for (let n = 1; ; n++) {
    const path = join(runDir, `repositories-unread-${stamp}${n === 1 ? "" : `-${n}`}.json`);
    if (lstatSync(path, { throwIfNoEntry: false }) === undefined) return path;
  }
}

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
 * daemon. The file holds the repositories and, beside them, the next id of
 * a work item, of a repository and of a group. An id is unique over the
 * whole store, and none is given twice: each count only rises, whatever
 * leaves the store. A file that holds the list of repositories alone, which
 * a build before the counts wrote, is read with each count one past the
 * highest id of its kind. A file that is neither is refused, as is one the
 * store cannot open and one that holds no JSON: the store renames it in the
 * run directory to `repositories-unread-<YYYYMMDDTHHMMSSZ>.json`, at the UTC
 * time of its start, with `-2`, `-3` and on where a file or a folder stands
 * at that name, so no file kept earlier is replaced. It then starts with no
 * repository, does not read `work-items.json` in its place, and writes a new
 * `repositories.json` at its first change. Where the rename fails, the file
 * stays as it stands and the store keeps its repositories in memory alone,
 * so nothing writes over the file it refused. `setAside()` answers which it
 * did, and `setAsideNotice` says it to a person. A work item written before
 * the setup was recorded is read with none, and
 * one whose setup was running is read with that setup failed: its pane
 * ended with the daemon that started it. Every setup is read naming no
 * pane, since the next daemon gives that pane's id to another. A work item
 * written before a chain was kept is read with none, and one whose chain was
 * running is read with that chain stopped (`chain.ts#chainRead`). A work
 * item written before a pull request was kept is read with none. A
 * repository written before a person's choice of a chain for its Claude
 * Code panes was kept is read with no answer, and a repository or a work
 * item written before accounts were kept with no account set.
 *
 * Where that file does not exist, the store starts from `work-items.json`,
 * the list a build before the repositories wrote: one repository for each
 * distinct repository its work items' folders name, in the order of each
 * one's first work item, added when that work item was made, with every
 * work item under its own and nothing set on any. `repositoryOfOld` reads
 * the repository of each folder that file holds, as an addition reads it,
 * so a folder that is a linked worktree's gives the main checkout it
 * belongs to. Where it gives null, git cannot read the folder, and the
 * folder stands as the file holds it. The read takes no turn of the event
 * loop: the constructor returns with the store whole, before the daemon
 * listens. That file is never written, so a build before this one, started
 * later, still reads it. Given no run directory, the store is kept in
 * memory alone.
 */
export class RepositoryStore {
  private readonly held: StoredRepository[] = [];
  private file: string | undefined;
  private counts: Counts = { nextWorkItemId: 1, nextRepositoryId: 1, nextGroupId: 1 };
  private setAsideFile: SetAside | null = null;

  constructor(
    runDir: string | undefined,
    private readonly now: () => number = Date.now,
    repositoryOfOld: (folder: string) => string | null = repositoryOfSync,
  ) {
    this.file = runDir === undefined ? undefined : join(runDir, FILE);
    if (this.file === undefined || runDir === undefined) return;
    const value = readJson(this.file);
    if (value === undefined) {
      this.startFrom(readJson(join(runDir, OLD_FILE)), repositoryOfOld);
      this.countPast();
      return;
    }
    const repositories = isStored(value) ? value.repositories : value;
    if (!Array.isArray(repositories) || !repositories.every(isStoredRepository)) {
      this.keepAside(runDir, this.file);
      return;
    }
    if (isStored(value)) this.counts = { nextWorkItemId: value.nextWorkItemId, nextRepositoryId: value.nextRepositoryId, nextGroupId: value.nextGroupId };
    // Only the fields of the store, whatever else the file's entries carry.
    for (const { id, folder, name, icon, defaultBase, hidden, paneChain, addedAt, groups, workItems, accountId } of repositories) {
      this.held.push({
        id,
        folder,
        name,
        icon,
        defaultBase,
        hidden,
        paneChain: paneChain ?? null,
        addedAt,
        groups: groups.map((group) => ({ id: group.id, name: group.name })),
        workItems: workItems.map(({ id, title, branch, ownsBranch, worktree, createdAt, baseCommit, baseBranch, pinned, muted, groupId, archivedAt, setup, chain, pullRequest, accountId, worktreeSize }) => ({ id, title, branch, ownsBranch: ownsBranch ?? true, worktree, createdAt, baseCommit, baseBranch, pinned, muted, groupId, archivedAt, setup: setupRead(setup), chain: chainRead(chain, this.now()), pullRequest: pullRequest ? pullRequestOf(pullRequest) : null, accountId: accountId ?? null, worktreeSize: worktreeSize ? { kilobytes: worktreeSize.kilobytes, measuredAt: worktreeSize.measuredAt } : null })),
        accountId: accountId ?? null,
      });
    }
    // A file with no counts, and one whose counts stand below an id it holds, gives no id twice either.
    this.countPast();
  }

  /** What the store did with a `repositories.json` it could not read at its start, or null where it read its file or found none. */
  setAside(): SetAside | null {
    return this.setAsideFile;
  }

  /** Renames the refused `file` to a name nothing stands at in `runDir`. Where that fails, the store keeps no file, so nothing writes over the one it refused. */
  private keepAside(runDir: string, file: string): void {
    let keptAs: string | null = null;
    try {
      const path = keptPath(runDir, this.now());
      renameSync(file, path);
      keptAs = path;
    } catch {
      this.file = undefined;
    }
    this.setAsideFile = { refused: file, keptAs };
  }

  /** Raises each count that is not past every id of its kind the store holds. None is lowered. */
  private countPast(): void {
    this.counts.nextWorkItemId = Math.max(this.counts.nextWorkItemId, past(this.workItems().map(({ item }) => item.id)));
    this.counts.nextRepositoryId = Math.max(this.counts.nextRepositoryId, past(this.held.map((repository) => repository.id)));
    this.counts.nextGroupId = Math.max(this.counts.nextGroupId, past(this.held.flatMap((repository) => repository.groups.map((group) => group.id))));
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

  repository(id: number): StoredRepository | undefined {
    return this.held.find((repository) => repository.id === id);
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
    const id = this.counts.nextWorkItemId++;
    const item: StoredWorkItem = { id, title: place.title, branch: place.branch, ownsBranch: place.ownsBranch, worktree: place.worktree, createdAt: this.now(), baseCommit: place.baseCommit, baseBranch: place.baseBranch, ...UNSET };
    repository.workItems.push(item);
    this.write();
    return { repository, item };
  }

  /**
   * Adds a group to a repository, after the groups it has, under an id no
   * group of the store bears or bore, and answers with it. Undefined where
   * no repository has the id.
   */
  addGroup(repositoryId: number, name: string): Group | undefined {
    const repository = this.repository(repositoryId);
    if (!repository) return undefined;
    const group: Group = { id: this.counts.nextGroupId++, name };
    repository.groups.push(group);
    this.write();
    return group;
  }

  /**
   * Sets on a work item the fields given, of those a person sets: its pin,
   * its mute, its title, its branch, its group, which is a group's id or
   * null for a work item in none, its archive, which is the time it was
   * archived, or null for a work item that is restored, and its account, an
   * account's id or null for none; and the setup of its
   * worktree, its chain, its pull request, its worktree's size and whether
   * Owlery made its branch, which the daemon sets. It answers whether
   * the work item is another than it was, and writes the store only where
   * it is. Undefined where no work item has the id. Whether a group is one
   * of the work item's repository is the caller's to hold.
   */
  setWorkItem(id: number, fields: Partial<Pick<StoredWorkItem, "pinned" | "muted" | "title" | "branch" | "ownsBranch" | "groupId" | "archivedAt" | "setup" | "chain" | "pullRequest" | "accountId" | "worktreeSize">>): boolean | undefined {
    const item = this.workItem(id)?.item;
    if (!item) return undefined;
    const { pinned = item.pinned, muted = item.muted, title = item.title, branch = item.branch, ownsBranch = item.ownsBranch, groupId = item.groupId, archivedAt = item.archivedAt, setup = item.setup, chain = item.chain, pullRequest = item.pullRequest, accountId = item.accountId, worktreeSize = item.worktreeSize } = fields;
    if (pinned === item.pinned && muted === item.muted && title === item.title && branch === item.branch && ownsBranch === item.ownsBranch && groupId === item.groupId && archivedAt === item.archivedAt && setup === item.setup && chain === item.chain && pullRequest === item.pullRequest && accountId === item.accountId && worktreeSize === item.worktreeSize) return false;
    Object.assign(item, { pinned, muted, title, branch, ownsBranch, groupId, archivedAt, setup, chain, pullRequest, accountId, worktreeSize });
    this.write();
    return true;
  }

  /**
   * Sets on a repository the fields given, of those a person sets: its
   * name, its icon, the base of its new work items, whether it is hidden and
   * the chain of its Claude Code panes, and its account, an account's id or
   * null for none. It answers whether the repository is another than it was,
   * and writes the store only where it is. Undefined where no repository has
   * the id.
   */
  setRepository(id: number, fields: Partial<Pick<StoredRepository, "name" | "icon" | "defaultBase" | "hidden" | "paneChain" | "accountId">>): boolean | undefined {
    const repository = this.repository(id);
    if (!repository) return undefined;
    const { name = repository.name, icon = repository.icon, defaultBase = repository.defaultBase, hidden = repository.hidden, paneChain = repository.paneChain, accountId = repository.accountId } = fields;
    if (name === repository.name && icon === repository.icon && defaultBase === repository.defaultBase && hidden === repository.hidden && paneChain === repository.paneChain && accountId === repository.accountId) return false;
    Object.assign(repository, { name, icon, defaultBase, hidden, paneChain, accountId });
    this.write();
    return true;
  }

  /**
   * Takes a repository and its work items, the archived among them, out of
   * the store, and answers with it. Nothing on disk but the store's file is
   * touched. The ids it and its work items bore are given to nothing after.
   * Undefined where no repository has the id.
   */
  removeRepository(id: number): StoredRepository | undefined {
    const at = this.held.findIndex((repository) => repository.id === id);
    if (at === -1) return undefined;
    const [removed] = this.held.splice(at, 1);
    this.write();
    return removed;
  }

  /**
   * Takes one work item out of the store, and answers with it. Its
   * repository stays, with its other work items, though it holds none after.
   * Nothing on disk but the store's file is touched, and the id it bore is
   * given to nothing after. Undefined where no work item has the id.
   */
  removeWorkItem(id: number): StoredWorkItem | undefined {
    for (const repository of this.held) {
      const at = repository.workItems.findIndex((item) => item.id === id);
      if (at === -1) continue;
      const [removed] = repository.workItems.splice(at, 1);
      this.write();
      return removed;
    }
    return undefined;
  }

  /** The repository of a folder, not hidden: the one held, or a new one. Nothing is written here. */
  private shown(folder: string): { repository: StoredRepository; changed: boolean } {
    const known = this.held.find((repository) => repository.folder === folder);
    if (known) {
      const changed = known.hidden;
      known.hidden = false;
      return { repository: known, changed };
    }
    const id = this.counts.nextRepositoryId++;
    const repository: StoredRepository = { id, folder, name: null, icon: null, defaultBase: null, hidden: false, paneChain: null, addedAt: this.now(), groups: [], workItems: [], accountId: null };
    this.held.push(repository);
    return { repository, changed: true };
  }

  /** Starts the store from what `work-items.json` holds. A file that is not a list of work items starts it empty. */
  private startFrom(value: unknown, repositoryOfOld: (folder: string) => string | null): void {
    if (!Array.isArray(value) || !value.every(isOldWorkItem)) return;
    // The repository of each folder the file holds, read once for each.
    const read = new Map<string, string>();
    for (const { id, title, repo, branch, worktree, createdAt, baseCommit, baseBranch } of value) {
      // Where git cannot read the folder, it stands as the file holds it.
      if (!read.has(repo)) read.set(repo, repositoryOfOld(repo) ?? repo);
      const folder = read.get(repo) ?? repo;
      let repository = this.held.find((known) => known.folder === folder);
      if (!repository) {
        // The time its first work item was made, so each start before the first change gives the same store.
        repository = { id: this.held.length + 1, folder, name: null, icon: null, defaultBase: null, hidden: false, paneChain: null, addedAt: createdAt, groups: [], workItems: [], accountId: null };
        this.held.push(repository);
      }
      // A build before the repositories made every work item's branch.
      repository.workItems.push({ id, title, branch, ownsBranch: true, worktree, createdAt, baseCommit: baseCommit ?? null, baseBranch: baseBranch ?? null, ...UNSET });
    }
  }

  private write(): void {
    if (this.file === undefined) return;
    // A daemon that starts meanwhile never reads a half-written file, and a write that fails removes its partial file.
    writeWholeFile(this.file, JSON.stringify({ ...this.counts, repositories: this.held } satisfies Stored));
  }
}
