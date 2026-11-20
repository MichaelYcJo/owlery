import { existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { RepositoryStore } from "../src/daemon/repositories";

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
const PLACE = { title: "Fix the login bug", repo: "/r/project", branch: "owlery/fix-the-login-bug", worktree: "/w/project/fix-the-login-bug", baseCommit: "c".repeat(40), baseBranch: "main" };
const { repo: _repo, ...OWN } = PLACE;
/** What a work item holds of the fields a person sets, before any is set. */
const UNSET = { pinned: false, muted: false, groupId: null, archivedAt: null };
/** What a repository holds of the fields a person sets, before any is set. */
const PLAIN = { name: null, icon: null, defaultBase: null, hidden: false, groups: [] };
/** An entry of `work-items.json`, as a build before the repositories wrote it. */
const OLD = { id: 1, ...PLACE, createdAt: 1 };

const file = (dir: string): unknown => JSON.parse(readFileSync(join(dir, "repositories.json"), "utf8"));

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
    const item = { id: 4, ...OWN, createdAt: 1, ...UNSET, pinned: true, muted: true, groupId: 2, archivedAt: 9 };
    const repository = { id: 3, folder: "/r/project", name: "The project", icon: "P", defaultBase: "origin/main", hidden: true, addedAt: 5, groups: [{ id: 2, name: "Later" }], workItems: [item] };
    writeFileSync(join(dir, "repositories.json"), JSON.stringify([{ ...repository, note: "x", groups: [{ id: 2, name: "Later", colour: "red" }], workItems: [{ ...item, repo: "/r/project" }] }]));
    expect(new RepositoryStore(dir).repositories()).toEqual([repository]);
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
    expect(read({ repositories: [repository] })).toEqual([]);
    for (const wrong of [{ id: "1" }, { folder: 3 }, { name: 3 }, { icon: 3 }, { defaultBase: 3 }, { hidden: "no" }, { addedAt: "1" }, { groups: {} }, { groups: [{ id: "2", name: "Later" }] }, { groups: [{ id: 2 }] }, { workItems: {} }, { workItems: [null] }]) {
      expect(read([{ ...repository, ...wrong }])).toEqual([]);
    }
    for (const wrong of [{ id: "1" }, { title: 3 }, { branch: 3 }, { worktree: 3 }, { createdAt: "1" }, { baseCommit: 7 }, { baseBranch: 7 }, { pinned: "no" }, { muted: 1 }, { groupId: "2" }, { archivedAt: "9" }]) {
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
  const own = ({ repo: _folder, ...item }: typeof OLD) => ({ ...item, ...UNSET });

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
    expect(readFileSync(join(dir, "work-items.json"), "utf8")).toBe(bytes);
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
