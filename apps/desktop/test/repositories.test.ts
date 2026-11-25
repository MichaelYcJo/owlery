import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { RepositoryStore } from "../src/daemon/repositories";
import type { Chain, PullRequest, WorktreeSetup } from "../src/shared/protocol";
import { git, temporaryRepository } from "./repositories";

const cleanups: (() => void)[] = [];
afterEach(() => {
  for (const cleanup of cleanups.splice(0).reverse()) cleanup();
});

function runDir(): string {
  const dir = mkdtempSync(join(tmpdir(), "owlery-run-"));
  cleanups.push(() => rmSync(dir, { recursive: true, force: true }));
  return dir;
}

/** What a creation hands the store: the repository's folder, and the work item's own fields. */
const PLACE = { title: "Fix the login bug", repo: "/r/project", branch: "owlery/fix-the-login-bug", ownsBranch: true, worktree: "/w/project/fix-the-login-bug", baseCommit: "c".repeat(40), baseBranch: "main" };
const { repo: _repo, ...OWN } = PLACE;
/** A work item's fields as a build wrote them before Owlery kept whether it made the branch. */
const { ownsBranch: _owns, ...CUT } = PLACE;
/** What a work item holds of the fields set after its creation, by a person, by its setup, by its chain or by its pull request stage, before any is set. */
const UNSET = { pinned: false, muted: false, groupId: null, archivedAt: null, setup: null, chain: null, pullRequest: null, accountId: null, worktreeSize: null };
/** What a repository holds of the fields a person sets, before any is set. */
const PLAIN = { name: null, icon: null, defaultBase: null, hidden: false, paneChain: null, groups: [], accountId: null };
/** The setup of a work item's worktree, as the daemon records one that ended. */
const SETUP: WorktreeSetup = { copied: [".env"], copiedCount: 1, failedCopies: [{ path: ".env.secret", why: "EACCES: permission denied" }], command: "pnpm install\n", paneId: 3, state: "failed", exitCode: 0, failure: null, startedAt: 1, endedAt: 2 };
/** An entry of `work-items.json`, as a build before the repositories wrote it. */
const OLD = { id: 1, ...CUT, createdAt: 1 };

/** The repositories `repositories.json` holds, and the three counts beside them: the next id of a work item, of a repository and of a group. */
const whole = (dir: string): { repositories: unknown; nextWorkItemId: unknown; nextRepositoryId: unknown; nextGroupId: unknown } => JSON.parse(readFileSync(join(dir, "repositories.json"), "utf8"));
const file = (dir: string): unknown => whole(dir).repositories;
const counts = (dir: string): unknown[] => [whole(dir).nextWorkItemId, whole(dir).nextRepositoryId, whole(dir).nextGroupId];

describe("RepositoryStore", () => {
  it("gives each work item the next id and the time it was made, under the repository of its folder, which it adds first", () => {
    const store = new RepositoryStore(runDir(), () => 1234);
    const first = store.addWorkItem(PLACE);
    const second = store.addWorkItem({ ...PLACE, title: "Another" });
    expect(first.item).toEqual({ id: 1, ...OWN, createdAt: 1234, ...UNSET });
    expect(second.item.id).toBe(2);
    expect(store.repositories()).toEqual([{ id: 1, folder: "/r/project", ...PLAIN, addedAt: 1234, workItems: [first.item, second.item] }]);
    expect(first.repository).toBe(store.repositories()[0]);
    expect(store.workItems()).toEqual([first, second]);
    expect(store.workItem(2)).toEqual(second);
    expect(store.workItem(3)).toBeUndefined();
  });

  it("gives a work item an id no work item of another repository bears, and each repository an id of its own", () => {
    const store = new RepositoryStore(runDir(), () => 1);
    store.addWorkItem(PLACE);
    const elsewhere = store.addWorkItem({ ...PLACE, repo: "/r/docs" });
    const back = store.addWorkItem(PLACE);
    expect([elsewhere.item.id, back.item.id]).toEqual([2, 3]);
    expect(store.repositories().map(({ id, folder, workItems }) => [id, folder, workItems.map((item) => item.id)])).toEqual([
      [1, "/r/project", [1, 3]],
      [2, "/r/docs", [2]],
    ]);
  });

  it("adds a repository with no work item, once: a second add of its folder adds none and changes nothing", () => {
    const dir = runDir();
    const store = new RepositoryStore(dir, () => 7);
    const added = store.addRepository("/r/project");
    expect(added).toEqual({ repository: { id: 1, folder: "/r/project", ...PLAIN, addedAt: 7, workItems: [] }, changed: true });
    expect(file(dir)).toEqual([added.repository]);
    const written = statSync(join(dir, "repositories.json")).ino;
    expect(store.addRepository("/r/project")).toEqual({ repository: added.repository, changed: false });
    expect(store.repositories()).toHaveLength(1);
    // Nothing changed, so nothing was written: a write replaces the file by a new one.
    expect(statSync(join(dir, "repositories.json")).ino).toBe(written);
  });

  it("shows a hidden repository again when its folder is added, and when a work item is made in it", () => {
    const dir = runDir();
    const hidden = { id: 1, folder: "/r/project", ...PLAIN, hidden: true, addedAt: 1, workItems: [] };
    writeFileSync(join(dir, "repositories.json"), JSON.stringify([hidden]));
    expect(new RepositoryStore(dir).repositories()[0]?.hidden).toBe(true);
    const added = new RepositoryStore(dir).addRepository("/r/project");
    expect(added).toMatchObject({ repository: { id: 1, hidden: false }, changed: true });
    expect(file(dir)).toEqual([{ ...hidden, hidden: false }]);
    writeFileSync(join(dir, "repositories.json"), JSON.stringify([hidden]));
    const made = new RepositoryStore(dir, () => 2).addWorkItem(PLACE);
    expect(made.repository).toMatchObject({ id: 1, hidden: false });
    expect(file(dir)).toEqual([{ ...hidden, hidden: false, workItems: [made.item] }]);
  });

  it("sets what a person sets on a work item, its title and its branch among it, writes the store, and says whether anything is another than it was", () => {
    const dir = runDir();
    const store = new RepositoryStore(dir, () => 1);
    const { item } = store.addWorkItem(PLACE);
    expect(store.setWorkItem(item.id, { pinned: true })).toBe(true);
    expect(store.setWorkItem(item.id, { pinned: true })).toBe(false);
    expect(store.setWorkItem(item.id, { muted: true, title: "Another name", branch: "owlery/another-name" })).toBe(true);
    expect(store.workItem(item.id)?.item).toEqual({ id: 1, ...OWN, createdAt: 1, ...UNSET, pinned: true, muted: true, title: "Another name", branch: "owlery/another-name" });
    expect(store.setWorkItem(item.id, { pinned: false })).toBe(true);
    expect(store.setWorkItem(item.id, {})).toBe(false);
    // Each change was written: a store read from the file holds the last of them.
    expect(new RepositoryStore(dir).workItem(item.id)?.item).toEqual({ id: 1, ...OWN, createdAt: 1, ...UNSET, muted: true, title: "Another name", branch: "owlery/another-name" });
    expect(store.setWorkItem(9, { pinned: true })).toBeUndefined();
    // A set that changes nothing writes nothing.
    rmSync(join(dir, "repositories.json"));
    expect(store.setWorkItem(item.id, { muted: true })).toBe(false);
    expect(existsSync(join(dir, "repositories.json"))).toBe(false);
  });

  it("archives a work item by setting the time of its archive, restores it by setting none, and writes each", () => {
    const dir = runDir();
    const store = new RepositoryStore(dir, () => 1);
    const { item } = store.addWorkItem(PLACE);
    expect(store.setWorkItem(item.id, { archivedAt: 50 })).toBe(true);
    expect(store.setWorkItem(item.id, { archivedAt: 50 })).toBe(false);
    expect(store.workItem(item.id)?.item.archivedAt).toBe(50);
    expect(new RepositoryStore(dir).workItem(item.id)?.item).toEqual({ id: 1, ...OWN, createdAt: 1, ...UNSET, archivedAt: 50 });
    // A set that names no archive leaves the one the work item has, and null takes it away.
    expect(store.setWorkItem(item.id, { pinned: true })).toBe(true);
    expect(store.workItem(item.id)?.item.archivedAt).toBe(50);
    expect(store.setWorkItem(item.id, { archivedAt: null })).toBe(true);
    expect(new RepositoryStore(dir).workItem(item.id)?.item).toEqual({ id: 1, ...OWN, createdAt: 1, ...UNSET, pinned: true });
  });

  it("keeps the setup of a work item's worktree, writes it, and reads a work item written before the setup was recorded with none", () => {
    const dir = runDir();
    const store = new RepositoryStore(dir, () => 1);
    const { item } = store.addWorkItem(PLACE);
    expect(store.setWorkItem(item.id, { setup: SETUP })).toBe(true);
    expect(store.setWorkItem(item.id, { setup: store.workItem(item.id)?.item.setup ?? null })).toBe(false);
    // The pane did not outlive the daemon that started it, so the next daemon reads none.
    expect(new RepositoryStore(dir).workItem(item.id)?.item).toEqual({ id: 1, ...OWN, createdAt: 1, ...UNSET, setup: { ...SETUP, paneId: null } });
    const { setup: _none, ...before } = { id: 1, ...OWN, createdAt: 1, ...UNSET };
    writeFileSync(join(dir, "repositories.json"), JSON.stringify({ nextWorkItemId: 2, nextRepositoryId: 2, nextGroupId: 1, repositories: [{ id: 1, folder: "/r/project", ...PLAIN, addedAt: 1, workItems: [before] }] }));
    expect(new RepositoryStore(dir).workItem(1)?.item).toEqual({ ...before, setup: null });
  });

  it("keeps the size of a work item's worktree in kilobytes with the time it was measured, writes it, and reads a work item written before sizes were kept with none (scenario 13)", () => {
    const dir = runDir();
    const store = new RepositoryStore(dir, () => 1);
    const { item } = store.addWorkItem(PLACE);
    expect(item.worktreeSize).toBeNull();
    const size = { kilobytes: 429_688, measuredAt: 5 };
    expect(store.setWorkItem(item.id, { worktreeSize: size })).toBe(true);
    expect(store.setWorkItem(item.id, { worktreeSize: store.workItem(item.id)?.item.worktreeSize ?? null })).toBe(false);
    expect(new RepositoryStore(dir).workItem(item.id)?.item).toEqual({ id: 1, ...OWN, createdAt: 1, ...UNSET, worktreeSize: size });
    const { worktreeSize: _none, ...before } = { id: 1, ...OWN, createdAt: 1, ...UNSET };
    writeFileSync(join(dir, "repositories.json"), JSON.stringify({ nextWorkItemId: 2, nextRepositoryId: 2, nextGroupId: 1, repositories: [{ id: 1, folder: "/r/project", ...PLAIN, addedAt: 1, workItems: [before] }] }));
    expect(new RepositoryStore(dir).workItem(1)?.item).toEqual({ ...before, worktreeSize: null });
    // A size that is no number of kilobytes with its time is no store's.
    writeFileSync(join(dir, "repositories.json"), JSON.stringify({ nextWorkItemId: 2, nextRepositoryId: 2, nextGroupId: 1, repositories: [{ id: 1, folder: "/r/project", ...PLAIN, addedAt: 1, workItems: [{ ...before, worktreeSize: { kilobytes: "429688", measuredAt: 5 } }] }] }));
    expect(new RepositoryStore(dir).repositories()).toEqual([]);
  });

  it("reads a setup that was running when the daemon stopped as failed, and says why, keeps one that ended as it ended, and names the pane of neither", () => {
    const dir = runDir();
    const running: WorktreeSetup = { ...SETUP, state: "running", exitCode: null, endedAt: null };
    const workItems = [{ id: 1, ...OWN, createdAt: 1, ...UNSET, setup: running }, { id: 2, ...OWN, createdAt: 1, ...UNSET, setup: SETUP }];
    writeFileSync(join(dir, "repositories.json"), JSON.stringify({ nextWorkItemId: 3, nextRepositoryId: 2, nextGroupId: 1, repositories: [{ id: 1, folder: "/r/project", ...PLAIN, addedAt: 1, workItems }] }));
    const store = new RepositoryStore(dir);
    expect(store.workItem(1)?.item.setup).toEqual({ ...running, paneId: null, state: "failed", failure: "The daemon stopped before the setup command ended." });
    expect(store.workItem(2)?.item.setup).toEqual({ ...SETUP, paneId: null });
  });

  it("keeps a work item's chain: a second store reads it with each stage naming no headless session, reads a work item a build before the chain wrote with none, reads a chain that was running when the daemon ended as stopped, and reads a chain an earlier build stored as reviewed or as sealed as none, with every repository and work item of the file kept", () => {
    const dir = runDir();
    const store = new RepositoryStore(dir, () => 1);
    const { item } = store.addWorkItem(PLACE);
    const stage = { kind: "round", round: 1, state: "finished", failure: null, startedAt: 1, endedAt: 2, headlessId: 4, refusals: 0, gate: null } as const;
    const chain: Chain = { state: "rested", says: "The sealer sealed ccccccc, after round 1.", stages: [stage], since: 3 };
    expect(store.setWorkItem(item.id, { chain })).toBe(true);
    expect(store.setWorkItem(item.id, { chain })).toBe(false);
    expect(new RepositoryStore(dir).workItem(item.id)?.item).toEqual({ id: 1, ...OWN, createdAt: 1, ...UNSET, chain: { ...chain, stages: [{ ...stage, headlessId: null }] } });
    const { chain: _none, ...before } = { id: 1, ...OWN, createdAt: 1, ...UNSET };
    const file = (workItem: object): string => JSON.stringify({ nextWorkItemId: 2, nextRepositoryId: 2, nextGroupId: 1, repositories: [{ id: 1, folder: "/r/project", ...PLAIN, addedAt: 1, workItems: [workItem] }] });
    writeFileSync(join(dir, "repositories.json"), file(before));
    expect(new RepositoryStore(dir).workItem(1)?.item).toEqual({ ...before, chain: null });
    writeFileSync(join(dir, "repositories.json"), file({ ...before, chain: { state: "running", says: "Review round 1 is running.", reviewedAt: null, since: 3, stages: [{ ...stage, state: "working", endedAt: null }] } }));
    expect(new RepositoryStore(dir, () => 7).workItem(1)?.item.chain).toEqual({ state: "stopped", says: "The daemon ended while review round 1 ran.", since: 7, stages: [{ ...stage, state: "failed", failure: "the daemon ended while the stage ran", endedAt: null, headlessId: null }] });
    // A build before the seal rested a chain `reviewed`, with the head it rested at or, in a file written by hand, without, and an earlier build of this release rested one `sealed`: the file's guard takes each, so the store holds the file's repository and its work item, and the chain is read as none.
    for (const reviewed of [{ state: "reviewed", says: "The review rounds settled at ccccccc, after round 1.", reviewedAt: "c".repeat(40), since: 3, stages: [stage] }, { state: "reviewed", says: "The review rounds settled.", stages: [] }, { state: "sealed", says: "The sealer sealed ccccccc, after round 1.", since: 3, stages: [stage] }]) {
      writeFileSync(join(dir, "repositories.json"), file({ ...before, chain: reviewed }));
      const read = new RepositoryStore(dir);
      expect([read.repositories().map(({ folder }) => folder), read.workItem(1)?.item], JSON.stringify(reviewed)).toEqual([["/r/project"], { ...before, chain: null }]);
    }
    // A chain a build before the time of its state wrote is read as in its state since its newest stage ended.
    const { since: _since, ...written } = chain;
    writeFileSync(join(dir, "repositories.json"), file({ ...before, chain: written }));
    expect(new RepositoryStore(dir).workItem(1)?.item.chain).toEqual({ ...chain, since: 2, stages: [{ ...stage, headlessId: null }] });
    // A stage a build before the broad gate wrote holds no run of one, and a gate's stage is read with its run.
    const { gate: _gate, ...old } = stage;
    const gate = { ...stage, kind: "gate", headlessId: null, gate: { command: "pnpm -r run check", exitCode: 3, output: true } };
    writeFileSync(join(dir, "repositories.json"), file({ ...before, chain: { ...chain, stages: [old, gate] } }));
    expect(new RepositoryStore(dir).workItem(1)?.item.chain).toEqual({ ...chain, stages: [{ ...stage, headlessId: null }, gate] });
    expect(new RepositoryStore(dir).repositories()).toHaveLength(1);
    // A file whose chain is none of a chain's states is read as no repository, as a file whose setup is none is.
    writeFileSync(join(dir, "repositories.json"), file({ ...before, chain: { ...chain, state: "reviewing" } }));
    expect(new RepositoryStore(dir).repositories()).toEqual([]);
  });

  it("keeps a work item's pull request: a second store reads it with only a pull request's fields, reads a work item a build before the pull request wrote with none, and reads a file whose pull request is none as no repository", () => {
    const dir = runDir();
    const store = new RepositoryStore(dir, () => 1);
    const { item } = store.addWorkItem(PLACE);
    expect(item.pullRequest).toBeNull();
    const pullRequest: PullRequest = { number: 12, url: "https://github.com/owner/project/pull/12", state: "open", head: "c".repeat(40), pushed: "c".repeat(40), checks: "failed", list: [{ name: "build", state: "failed", link: "https://github.com/owner/project/actions/runs/1" }], listCount: 1, readAt: 5, failure: null };
    expect(store.setWorkItem(item.id, { pullRequest })).toBe(true);
    expect(store.setWorkItem(item.id, { pullRequest })).toBe(false);
    expect(new RepositoryStore(dir).workItem(item.id)?.item).toEqual({ id: 1, ...OWN, createdAt: 1, ...UNSET, pullRequest });
    const { pullRequest: _none, ...before } = { id: 1, ...OWN, createdAt: 1, ...UNSET };
    const file = (workItem: object): string => JSON.stringify({ nextWorkItemId: 2, nextRepositoryId: 2, nextGroupId: 1, repositories: [{ id: 1, folder: "/r/project", ...PLAIN, addedAt: 1, workItems: [workItem] }] });
    writeFileSync(join(dir, "repositories.json"), file(before));
    expect(new RepositoryStore(dir).workItem(1)?.item).toEqual({ ...before, pullRequest: null });
    writeFileSync(join(dir, "repositories.json"), file({ ...before, pullRequest: { ...pullRequest, extra: 1, list: [{ ...pullRequest.list[0], extra: 1 }] } }));
    expect(new RepositoryStore(dir).workItem(1)?.item.pullRequest).toEqual(pullRequest);
    for (const wrong of ["open", { ...pullRequest, state: "draft" }, { ...pullRequest, checks: "skipped" }, { ...pullRequest, pushed: null }, { ...pullRequest, list: [{ name: "build", state: "neutral", link: null }] }]) {
      writeFileSync(join(dir, "repositories.json"), file({ ...before, pullRequest: wrong }));
      expect(new RepositoryStore(dir).repositories(), JSON.stringify(wrong)).toEqual([]);
    }
  });

  it("adds a group to a repository under an id no group bears, after the groups it has, writes the store, and gives a group's id to no group made after, though its repository was removed", () => {
    const dir = runDir();
    const store = new RepositoryStore(dir, () => 1);
    store.addRepository("/r/project");
    store.addRepository("/r/docs");
    expect(store.addGroup(1, "Later")).toEqual({ id: 1, name: "Later" });
    expect(store.addGroup(2, "Drafts")).toEqual({ id: 2, name: "Drafts" });
    // Two groups of one repository may bear one name: each has its own id.
    expect(store.addGroup(1, "Later")).toEqual({ id: 3, name: "Later" });
    expect(store.addGroup(9, "Nowhere")).toBeUndefined();
    expect(store.repositories().map(({ id, groups }) => [id, groups])).toEqual([
      [1, [{ id: 1, name: "Later" }, { id: 3, name: "Later" }]],
      [2, [{ id: 2, name: "Drafts" }]],
    ]);
    expect(counts(dir)).toEqual([1, 3, 4]);
    expect(new RepositoryStore(dir).repositories().map(({ groups }) => groups)).toEqual(store.repositories().map(({ groups }) => groups));
    // The repository with the highest group's id leaves the store, and a store read from the file goes on from the count.
    store.removeRepository(1);
    expect(new RepositoryStore(dir).addGroup(2, "Next")).toEqual({ id: 4, name: "Next" });
  });

  it("sets the group a work item stands in, and none at null, writes each, and leaves the group at a set that names none", () => {
    const dir = runDir();
    const store = new RepositoryStore(dir, () => 1);
    const { item } = store.addWorkItem(PLACE);
    const group = store.addGroup(1, "Later");
    expect(store.setWorkItem(item.id, { groupId: group?.id })).toBe(true);
    expect(store.setWorkItem(item.id, { groupId: 1 })).toBe(false);
    expect(new RepositoryStore(dir).workItem(item.id)?.item).toEqual({ id: 1, ...OWN, createdAt: 1, ...UNSET, groupId: 1 });
    expect(store.setWorkItem(item.id, { pinned: true })).toBe(true);
    expect(store.workItem(item.id)?.item.groupId).toBe(1);
    expect(store.setWorkItem(item.id, { groupId: null })).toBe(true);
    expect(new RepositoryStore(dir).workItem(item.id)?.item).toEqual({ id: 1, ...OWN, createdAt: 1, ...UNSET, pinned: true });
  });

  it("sets what a person sets on a repository, its name, its icon, its base and whether it is hidden, writes the store, and says whether anything is another than it was", () => {
    const dir = runDir();
    const store = new RepositoryStore(dir, () => 1);
    const { repository } = store.addRepository("/r/project");
    expect(store.repository(repository.id)).toBe(repository);
    expect(store.repository(9)).toBeUndefined();
    expect(store.setRepository(1, { name: "The project" })).toBe(true);
    expect(store.setRepository(1, { name: "The project" })).toBe(false);
    expect(store.setRepository(1, { icon: "P", defaultBase: "develop", hidden: true })).toBe(true);
    expect(store.repositories()).toEqual([{ id: 1, folder: "/r/project", name: "The project", icon: "P", defaultBase: "develop", hidden: true, paneChain: null, addedAt: 1, groups: [], workItems: [], accountId: null }]);
    // A field that is not given is left, and null takes a name, an icon and a base away.
    expect(store.setRepository(1, { name: null, icon: null, defaultBase: null })).toBe(true);
    expect(store.setRepository(1, {})).toBe(false);
    expect(new RepositoryStore(dir).repositories()).toEqual([{ id: 1, folder: "/r/project", ...PLAIN, hidden: true, addedAt: 1, workItems: [] }]);
    expect(store.setRepository(9, { hidden: false })).toBeUndefined();
    // A set that changes nothing writes nothing.
    rmSync(join(dir, "repositories.json"));
    expect(store.setRepository(1, { hidden: true })).toBe(false);
    expect(existsSync(join(dir, "repositories.json"))).toBe(false);
  });

  it("keeps the account set on a repository and on a work item, null for none, writes each, says whether anything is another than it was, and reads a repository and a work item written before accounts were kept with none", () => {
    const dir = runDir();
    const store = new RepositoryStore(dir, () => 1);
    const { item } = store.addWorkItem(PLACE);
    expect(store.setRepository(1, { accountId: 2 })).toBe(true);
    expect(store.setRepository(1, { accountId: 2 })).toBe(false);
    expect(store.setWorkItem(item.id, { accountId: 0 })).toBe(true);
    expect(store.setWorkItem(item.id, { accountId: 0 })).toBe(false);
    const read = new RepositoryStore(dir);
    expect(read.repository(1)?.accountId).toBe(2);
    expect(read.workItem(item.id)?.item.accountId).toBe(0);
    // A field that is not given is left, and null clears the setting.
    expect(store.setRepository(1, { name: "The project" })).toBe(true);
    expect(store.setWorkItem(item.id, { pinned: true })).toBe(true);
    expect(store.repository(1)?.accountId).toBe(2);
    expect(store.workItem(item.id)?.item.accountId).toBe(0);
    expect(store.setRepository(1, { accountId: null })).toBe(true);
    expect(store.setWorkItem(item.id, { accountId: null })).toBe(true);
    expect(new RepositoryStore(dir).repositories()).toEqual([{ id: 1, folder: "/r/project", ...PLAIN, name: "The project", addedAt: 1, workItems: [{ id: 1, ...OWN, createdAt: 1, ...UNSET, pinned: true }] }]);
    const { accountId: _repositoryAccount, ...repositoryBefore } = { id: 1, folder: "/r/project", ...PLAIN, addedAt: 1 };
    const { accountId: _itemAccount, ...itemBefore } = { id: 1, ...OWN, createdAt: 1, ...UNSET };
    writeFileSync(join(dir, "repositories.json"), JSON.stringify({ nextWorkItemId: 2, nextRepositoryId: 2, nextGroupId: 1, repositories: [{ ...repositoryBefore, workItems: [itemBefore] }] }));
    expect(new RepositoryStore(dir).repositories()).toEqual([{ ...repositoryBefore, accountId: null, workItems: [{ ...itemBefore, accountId: null }] }]);
    // A setting that is no id and not null is no store's.
    writeFileSync(join(dir, "repositories.json"), JSON.stringify({ nextWorkItemId: 2, nextRepositoryId: 2, nextGroupId: 1, repositories: [{ ...repositoryBefore, accountId: "2", workItems: [] }] }));
    expect(new RepositoryStore(dir).repositories()).toEqual([]);
    writeFileSync(join(dir, "repositories.json"), JSON.stringify({ nextWorkItemId: 2, nextRepositoryId: 2, nextGroupId: 1, repositories: [{ ...repositoryBefore, workItems: [{ ...itemBefore, accountId: "0" }] }] }));
    expect(new RepositoryStore(dir).repositories()).toEqual([]);
  });

  it("keeps the chain a person chose for a repository's Claude Code panes, which outlives the daemon, takes it away at null, and reads a file an earlier build wrote, which holds none, as no answer", () => {
    const dir = runDir();
    const store = new RepositoryStore(dir, () => 1);
    store.addRepository("/r/project");
    expect(store.repository(1)?.paneChain).toBeNull();
    expect(store.setRepository(1, { paneChain: "owlery" })).toBe(true);
    expect(store.setRepository(1, { paneChain: "owlery" })).toBe(false);
    // Another field set leaves the answer as it is.
    expect(store.setRepository(1, { name: "The project" })).toBe(true);
    expect(new RepositoryStore(dir).repository(1)?.paneChain).toBe("owlery");
    expect(store.setRepository(1, { paneChain: "plugin" })).toBe(true);
    expect(new RepositoryStore(dir).repository(1)?.paneChain).toBe("plugin");
    expect(store.setRepository(1, { paneChain: null })).toBe(true);
    expect(new RepositoryStore(dir).repository(1)?.paneChain).toBeNull();
    // A file of an earlier build holds no such field, and its repository is read with the rest it holds.
    const { paneChain: _, ...earlier } = { id: 1, folder: "/r/project", ...PLAIN, name: "Earlier", addedAt: 1, workItems: [] };
    writeFileSync(join(dir, "repositories.json"), JSON.stringify({ nextWorkItemId: 1, nextRepositoryId: 2, nextGroupId: 1, repositories: [earlier] }));
    expect(new RepositoryStore(dir).repositories()).toEqual([{ id: 1, folder: "/r/project", ...PLAIN, name: "Earlier", addedAt: 1, workItems: [] }]);
    // A file whose field names neither chain is read as no repository, as any file of another shape is.
    writeFileSync(join(dir, "repositories.json"), JSON.stringify({ nextWorkItemId: 1, nextRepositoryId: 2, nextGroupId: 1, repositories: [{ ...earlier, paneChain: "both" }] }));
    expect(new RepositoryStore(dir).repositories()).toEqual([]);
  });

  it("removes a repository with its work items, the others left as they were, and writes the store", () => {
    const dir = runDir();
    const store = new RepositoryStore(dir, () => 1);
    store.addWorkItem(PLACE);
    const kept = store.addWorkItem({ ...PLACE, repo: "/r/docs" });
    store.addWorkItem(PLACE);
    expect(store.removeRepository(9)).toBeUndefined();
    const removed = store.removeRepository(1);
    expect([removed?.folder, removed?.workItems.map((item) => item.id)]).toEqual(["/r/project", [1, 3]]);
    expect(store.repositories()).toEqual([kept.repository]);
    expect(store.workItems()).toEqual([kept]);
    expect([store.workItem(1), store.workItem(3), store.repository(1)]).toEqual([undefined, undefined, undefined]);
    expect(file(dir)).toEqual([kept.repository]);
    expect(new RepositoryStore(dir).repositories()).toEqual([kept.repository]);
  });

  it("removes one work item and leaves its repository, the repository's other work items and every other repository as they were, writes the store, and gives the removed id to no work item made after", () => {
    const dir = runDir();
    const store = new RepositoryStore(dir, () => 1);
    store.addWorkItem(PLACE);
    const other = store.addWorkItem({ ...PLACE, repo: "/r/docs" });
    const last = store.addWorkItem({ ...PLACE, title: "Another" });
    const first = { ...store.workItem(1)?.item };
    expect(store.removeWorkItem(9)).toBeUndefined();
    expect(file(dir)).toMatchObject([{ workItems: [{ id: 1 }, { id: 3 }] }, { workItems: [{ id: 2 }] }]);
    expect(store.removeWorkItem(1)).toEqual(first);
    expect(store.workItems().map(({ repository, item }) => [repository.id, item.id])).toEqual([[1, 3], [2, 2]]);
    expect(store.workItem(1)).toBeUndefined();
    expect(file(dir)).toMatchObject([{ id: 1, workItems: [last.item] }, { id: 2, workItems: [other.item] }]);
    // A repository whose last work item is removed stays, with none.
    store.removeWorkItem(2);
    expect(new RepositoryStore(dir).repositories().map((repository) => [repository.id, repository.workItems.map((item) => item.id)])).toEqual([[1, [3]], [2, []]]);
    expect(new RepositoryStore(dir).addWorkItem(PLACE).item.id).toBe(4);
  });

  it("gives no id twice, to a work item or to a repository, though the one that bore it was removed, and keeps the next id of each kind in its file", () => {
    const dir = runDir();
    const store = new RepositoryStore(dir, () => 1);
    store.addWorkItem(PLACE);
    store.addWorkItem({ ...PLACE, repo: "/r/docs" });
    expect(counts(dir)).toEqual([3, 3, 1]);
    // The repository and the work item with the highest ids leave the store.
    store.removeRepository(2);
    expect(counts(dir)).toEqual([3, 3, 1]);
    const again = store.addWorkItem({ ...PLACE, repo: "/r/docs" });
    expect([again.repository.id, again.item.id]).toEqual([3, 3]);
    store.removeRepository(3);
    store.removeRepository(1);
    expect(file(dir)).toEqual([]);
    // A store read from the file goes on from the counts, and not from the ids it holds, which are none.
    const later = new RepositoryStore(dir, () => 2);
    const made = later.addWorkItem(PLACE);
    expect([made.repository.id, made.item.id]).toEqual([4, 4]);
    expect(later.addRepository("/r/third").repository.id).toBe(5);
    expect(counts(dir)).toEqual([5, 6, 1]);
  });

  it("reads a file that holds the list of repositories alone, as a build before the counts wrote it, with each count one past the highest id of its kind, and reads no count as lower than an id the file holds", () => {
    const dir = runDir();
    const item = { id: 7, ...OWN, createdAt: 1, ...UNSET };
    const repository = { id: 4, folder: "/r/project", ...PLAIN, groups: [{ id: 9, name: "Later" }], addedAt: 1, workItems: [item] };
    writeFileSync(join(dir, "repositories.json"), JSON.stringify([repository, { ...repository, id: 2, folder: "/r/docs", groups: [], workItems: [] }]));
    const store = new RepositoryStore(dir, () => 1);
    expect(store.repositories().map(({ id }) => id)).toEqual([4, 2]);
    expect(store.addWorkItem(PLACE).item.id).toBe(8);
    expect(store.addRepository("/r/third").repository.id).toBe(5);
    expect(counts(dir)).toEqual([9, 6, 10]);
    // Counts a hand wrote below the ids beside them give no id twice either.
    writeFileSync(join(dir, "repositories.json"), JSON.stringify({ nextWorkItemId: 1, nextRepositoryId: 1, nextGroupId: 1, repositories: [repository] }));
    const lowered = new RepositoryStore(dir, () => 1);
    expect(lowered.addWorkItem(PLACE).item.id).toBe(8);
    expect(lowered.addRepository("/r/third").repository.id).toBe(5);
    expect(counts(dir)).toEqual([9, 6, 10]);
  });

  it("keeps a work item with no branch and whether Owlery made a work item's branch, writes both, sets both where a branch is made for a work item that had none, and reads a work item written before that was kept as one whose branch Owlery made", () => {
    const dir = runDir();
    const store = new RepositoryStore(dir, () => 1);
    store.addWorkItem({ ...PLACE, branch: null, ownsBranch: false });
    store.addWorkItem({ ...PLACE, branch: "feature", ownsBranch: false });
    store.addWorkItem(PLACE);
    const made = store.addWorkItem({ ...PLACE, branch: null, ownsBranch: false }).item.id;
    expect(store.setWorkItem(made, { branch: "owlery/made", ownsBranch: true })).toBe(true);
    expect(store.setWorkItem(made, { branch: "owlery/made", ownsBranch: true })).toBe(false);
    expect(store.setWorkItem(made, { ownsBranch: false })).toBe(true);
    expect(store.setWorkItem(made, { ownsBranch: true })).toBe(true);
    expect(new RepositoryStore(dir).workItems().map(({ item }) => [item.branch, item.ownsBranch])).toEqual([
      [null, false],
      ["feature", false],
      [PLACE.branch, true],
      ["owlery/made", true],
    ]);
    const repository = { id: 1, folder: "/r/project", ...PLAIN, addedAt: 1 };
    const { ownsBranch: _kept, ...before } = { id: 1, ...OWN, createdAt: 1, ...UNSET };
    writeFileSync(join(dir, "repositories.json"), JSON.stringify({ nextWorkItemId: 2, nextRepositoryId: 2, nextGroupId: 1, repositories: [{ ...repository, workItems: [before] }] }));
    expect(new RepositoryStore(dir).repositories()).toEqual([{ ...repository, workItems: [{ ...before, ownsBranch: true }] }]);
    // A branch that is no name and not null, and an answer that is no boolean, is no store's.
    for (const written of [{ ...before, branch: 3 }, { ...before, ownsBranch: "yes" }]) {
      writeFileSync(join(dir, "repositories.json"), JSON.stringify({ nextWorkItemId: 2, nextRepositoryId: 2, nextGroupId: 1, repositories: [{ ...repository, workItems: [written] }] }));
      expect(new RepositoryStore(dir).repositories()).toEqual([]);
    }
  });

  it("writes repositories.json in the run directory, readable by the user alone", () => {
    const dir = runDir();
    new RepositoryStore(dir).addWorkItem(PLACE);
    expect(statSync(join(dir, "repositories.json")).mode & 0o777).toBe(0o600);
  });

  it("reads at start the store an earlier daemon wrote, and goes on from its last ids", () => {
    const dir = runDir();
    const earlier = new RepositoryStore(dir, () => 1);
    earlier.addWorkItem(PLACE);
    earlier.addRepository("/r/docs");
    const later = new RepositoryStore(dir, () => 2);
    expect(later.repositories()).toEqual(earlier.repositories());
    expect(later.addWorkItem({ ...PLACE, title: "Another" }).item.id).toBe(2);
    expect(later.addRepository("/r/third").repository.id).toBe(3);
    expect(file(dir)).toEqual(later.repositories());
  });

  it("reads only the fields of the store, whatever else the file's entries carry", () => {
    const dir = runDir();
    const item = { id: 4, ...OWN, createdAt: 1, ...UNSET, pinned: true, muted: true, groupId: 2, archivedAt: 9, setup: SETUP };
    const repository = { id: 3, folder: "/r/project", name: "The project", icon: "P", defaultBase: "origin/main", hidden: true, addedAt: 5, groups: [{ id: 2, name: "Later" }], workItems: [item], accountId: null };
    const carried = { ...SETUP, extra: 1, failedCopies: [{ ...SETUP.failedCopies[0], code: "EACCES" }] };
    writeFileSync(join(dir, "repositories.json"), JSON.stringify([{ ...repository, note: "x", groups: [{ id: 2, name: "Later", colour: "red" }], workItems: [{ ...item, repo: "/r/project", setup: carried }] }]));
    // A setup is read naming no pane, as every setup at a daemon's start is, and the file names no chain of the repository's panes, which is read as no answer.
    expect(new RepositoryStore(dir).repositories()).toEqual([{ ...repository, paneChain: null, workItems: [{ ...item, setup: { ...SETUP, paneId: null } }] }]);
  });

  it("starts empty where the file is not a list of repositories, and does not read work-items.json in its place", () => {
    const dir = runDir();
    writeFileSync(join(dir, "work-items.json"), JSON.stringify([OLD]));
    const repository = { id: 1, folder: "/r/project", ...PLAIN, addedAt: 1, workItems: [{ id: 1, ...OWN, createdAt: 1, ...UNSET }] };
    const read = (value: unknown): unknown => {
      writeFileSync(join(dir, "repositories.json"), typeof value === "string" ? value : JSON.stringify(value));
      return new RepositoryStore(dir).repositories();
    };
    expect(read("{ not json")).toEqual([]);
    // The repositories without the three counts, and with a count that is no number.
    expect(read({ repositories: [repository] })).toEqual([]);
    const COUNTS = { nextWorkItemId: 2, nextRepositoryId: 2, nextGroupId: 1 };
    for (const wrong of [{ nextWorkItemId: "2" }, { nextRepositoryId: null }, { nextGroupId: undefined }, { repositories: {} }, { repositories: [{ ...repository, id: "1" }] }]) {
      expect(read({ ...COUNTS, repositories: [repository], ...wrong })).toEqual([]);
    }
    expect(read({ ...COUNTS, repositories: [repository] })).toEqual([repository]);
    for (const wrong of [{ id: "1" }, { folder: 3 }, { name: 3 }, { icon: 3 }, { defaultBase: 3 }, { hidden: "no" }, { addedAt: "1" }, { groups: {} }, { groups: [{ id: "2", name: "Later" }] }, { groups: [{ id: 2 }] }, { workItems: {} }, { workItems: [null] }]) {
      expect(read([{ ...repository, ...wrong }])).toEqual([]);
    }
    for (const wrong of [{ id: "1" }, { title: 3 }, { branch: 3 }, { worktree: 3 }, { createdAt: "1" }, { baseCommit: 7 }, { baseBranch: 7 }, { pinned: "no" }, { muted: 1 }, { groupId: "2" }, { archivedAt: "9" }, { setup: "running" }, { setup: { ...SETUP, state: "done" } }, { setup: { ...SETUP, copied: [1] } }, { setup: { ...SETUP, failedCopies: [{ path: ".env" }] } }, { setup: { ...SETUP, endedAt: undefined } }]) {
      expect(read([{ ...repository, workItems: [{ ...repository.workItems[0], ...wrong }] }])).toEqual([]);
    }
    for (const absent of ["baseCommit", "baseBranch", "pinned", "muted", "groupId", "archivedAt"]) {
      expect(read([{ ...repository, workItems: [{ ...repository.workItems[0], [absent]: undefined }] }])).toEqual([]);
    }
    // The file as the cases above would have it read, so the reader is the one under test.
    expect(read([repository])).toEqual([repository]);
  });

  it("throws where the rename fails, and removes the partial file it wrote", () => {
    const dir = runDir();
    // A folder stands where the file goes, so the partial file is written and its rename refused.
    mkdirSync(join(dir, "repositories.json"));
    expect(() => new RepositoryStore(dir).addWorkItem(PLACE)).toThrow(/rename/);
    expect(readdirSync(dir)).toEqual(["repositories.json"]);
    // What stands there cannot be read, and is not read as absent: the store does not start from work-items.json.
    writeFileSync(join(dir, "work-items.json"), JSON.stringify([OLD]));
    expect(new RepositoryStore(dir).repositories()).toEqual([]);
    rmSync(join(dir, "work-items.json"));
    expect(statSync(join(dir, "repositories.json")).isDirectory()).toBe(true);
  });

  it("keeps the store in memory alone where it is given no run directory", () => {
    // Where a store with no run directory would write, were it to write at all.
    const stray = join(process.cwd(), "repositories.json");
    cleanups.push(() => rmSync(stray, { force: true }));
    const store = new RepositoryStore(undefined);
    expect(store.addWorkItem(PLACE).item.id).toBe(1);
    expect(store.workItems()).toHaveLength(1);
    expect(existsSync(stray)).toBe(false);
  });
});

describe("RepositoryStore, started from work-items.json", () => {
  const SEARCH = { ...OLD, id: 2, title: "Speed up search", branch: "owlery/speed-up-search", worktree: "/w/project/speed-up-search", createdAt: 3 };
  const DOCS = { ...OLD, id: 5, title: "Write the guide", repo: "/r/docs", branch: "owlery/write-the-guide", worktree: "/w/docs/write-the-guide", createdAt: 2 };
  // A build before the repositories made every work item's branch.
  const own = ({ repo: _folder, ...item }: typeof OLD) => ({ ...item, ownsBranch: true, ...UNSET });

  it("starts as one repository for each distinct folder, in the order of each one's first work item, every work item under its own with its id and nothing set", () => {
    const dir = runDir();
    // The second repository's work item stands between the two of the first.
    writeFileSync(join(dir, "work-items.json"), JSON.stringify([OLD, DOCS, SEARCH]));
    const store = new RepositoryStore(dir, () => 99);
    expect(store.repositories()).toEqual([
      { id: 1, folder: "/r/project", ...PLAIN, addedAt: 1, workItems: [own(OLD), own(SEARCH)] },
      { id: 2, folder: "/r/docs", ...PLAIN, addedAt: 2, workItems: [own(DOCS)] },
    ]);
    expect(store.workItem(5)).toEqual({ repository: store.repositories()[1], item: own(DOCS) });
    // The start alone writes nothing.
    expect(readdirSync(dir)).toEqual(["work-items.json"]);
  });

  it("writes them to repositories.json at the first change, goes on from the highest id, and leaves work-items.json the bytes it held", () => {
    const dir = runDir();
    const bytes = JSON.stringify([OLD, DOCS, SEARCH]);
    writeFileSync(join(dir, "work-items.json"), bytes);
    const store = new RepositoryStore(dir, () => 99);
    const made = store.addWorkItem({ ...PLACE, repo: "/r/docs", title: "Another" });
    expect(made.item.id).toBe(6);
    expect(made.repository.id).toBe(2);
    expect(file(dir)).toEqual(store.repositories());
    expect(store.repositories().map((repository) => repository.workItems.map((item) => item.id))).toEqual([[1, 2], [5, 6]]);
    // Each count is one past the highest id of its kind the old file gave.
    expect(counts(dir)).toEqual([7, 3, 1]);
    expect(readFileSync(join(dir, "work-items.json"), "utf8")).toBe(bytes);
  });

  it("puts a work item whose folder is a linked worktree's under the repository of its main checkout, and one whose folder git cannot read under the folder the file holds", () => {
    const dir = runDir();
    const made = temporaryRepository();
    cleanups.push(made.remove);
    const linked = join(made.base, "linked");
    git(made.repo, "worktree", "add", "--quiet", "-b", "side", linked);
    const missing = join(made.base, "missing");
    const items = [
      { ...OLD, id: 1, repo: missing, createdAt: 5 },
      { ...OLD, id: 2, repo: linked, createdAt: 6 },
      { ...OLD, id: 3, repo: made.repo, createdAt: 7 },
      { ...OLD, id: 4, repo: join(linked, "nowhere"), createdAt: 8 },
    ];
    const bytes = JSON.stringify(items);
    writeFileSync(join(dir, "work-items.json"), bytes);
    const store = new RepositoryStore(dir, () => 99);
    // The linked worktree's folder and the main checkout's name one repository, added when the first work item of either was made.
    expect(store.repositories().map(({ id, folder, addedAt, workItems }) => [id, folder, addedAt, workItems.map((item) => item.id)])).toEqual([
      [1, missing, 5, [1]],
      [2, made.repo, 6, [2, 3]],
      [3, join(linked, "nowhere"), 8, [4]],
    ]);
    // Every start before the first change gives the same store, and writes nothing.
    expect(new RepositoryStore(dir, () => 100).repositories()).toEqual(store.repositories());
    expect(readdirSync(dir)).toEqual(["work-items.json"]);
    store.setWorkItem(2, { pinned: true });
    expect(file(dir)).toEqual(store.repositories());
    expect(readFileSync(join(dir, "work-items.json"), "utf8")).toBe(bytes);
  });

  it("reads each distinct folder of work-items.json once, through the reader it is handed", () => {
    const dir = runDir();
    writeFileSync(join(dir, "work-items.json"), JSON.stringify([OLD, DOCS, SEARCH]));
    const read: string[] = [];
    const store = new RepositoryStore(dir, () => 1, (folder) => {
      read.push(folder);
      return folder === "/r/docs" ? "/r/project" : null;
    });
    expect(read).toEqual(["/r/project", "/r/docs"]);
    expect(store.repositories().map(({ id, folder, workItems }) => [id, folder, workItems.map((item) => item.id)])).toEqual([[1, "/r/project", [1, 5, 2]]]);
  });

  it("reads repositories.json alone once it exists, whatever work-items.json holds", () => {
    const dir = runDir();
    writeFileSync(join(dir, "work-items.json"), JSON.stringify([OLD]));
    new RepositoryStore(dir, () => 1).addRepository("/r/docs");
    writeFileSync(join(dir, "work-items.json"), JSON.stringify([OLD, DOCS, SEARCH]));
    expect(new RepositoryStore(dir).workItems().map(({ item }) => item.id)).toEqual([1]);
    expect(new RepositoryStore(dir).repositories().map((repository) => repository.folder)).toEqual(["/r/project", "/r/docs"]);
  });

  it("reads a work item written before the base commit was recorded with none", () => {
    const dir = runDir();
    const { baseCommit: _none, ...before } = OLD;
    writeFileSync(join(dir, "work-items.json"), JSON.stringify([before]));
    expect(new RepositoryStore(dir).workItems().map(({ item }) => item)).toEqual([{ ...own(OLD), baseCommit: null }]);
  });

  it("reads a work item written before the base branch was recorded with none, and keeps one that was cut from no branch", () => {
    const dir = runDir();
    const { baseBranch: _none, ...before } = OLD;
    writeFileSync(join(dir, "work-items.json"), JSON.stringify([before, { ...before, id: 2, baseBranch: null }]));
    const store = new RepositoryStore(dir);
    expect(store.workItems().map(({ item }) => item)).toEqual([{ ...own(OLD), baseBranch: null }, { ...own(OLD), id: 2, baseBranch: null }]);
    const cut = store.addWorkItem({ ...PLACE, baseBranch: null });
    expect(new RepositoryStore(dir).workItem(cut.item.id)?.item).toEqual(cut.item);
  });

  it("starts empty where work-items.json is not a list of work items", () => {
    const dir = runDir();
    const read = (text: string): unknown => {
      writeFileSync(join(dir, "work-items.json"), text);
      return new RepositoryStore(dir).repositories();
    };
    expect(read("{ not json")).toEqual([]);
    expect(read(JSON.stringify([{ id: "1", title: 3 }]))).toEqual([]);
    expect(read(JSON.stringify([{ ...OLD, baseCommit: 7 }]))).toEqual([]);
    expect(read(JSON.stringify([{ ...OLD, baseBranch: 7 }]))).toEqual([]);
    expect(read(JSON.stringify([{ ...OLD, repo: 7 }]))).toEqual([]);
    expect(read(JSON.stringify([OLD]))).toHaveLength(1);
  });
});
