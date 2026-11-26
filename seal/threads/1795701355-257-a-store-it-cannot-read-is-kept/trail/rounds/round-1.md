# Review round 1: 1795701355-257-a-store-it-cannot-read-is-kept

```seal
target: 20d87d48 against origin/release/v0.0.5
```

The round read the branch at `20d87d48` against `c80b900a`, the head of `origin/release/v0.0.5` that the branch merged at `86c1fa18`. It read the diff `git diff c80b900a...HEAD` whole, and every record of the work item whole at the target: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `trail/phases/phase-1.md` and `trail/phases/phase-2.md`. No `pr.md` stands yet. No earlier round stands, so no fact was carried and every verdict here was reached at the target. The caller ruled out every test run in this round, since a broad gate runs alone on this Mac. So every claim below is `read` or rests on a `git` or `grep` command, and each run of a case named here is the crafters' recorded run, cited as theirs and labelled so. The suite is `unverified`, and the orchestrator answers it at the broad gate.

The axes of this change, beyond the table: every path that writes `repositories.json` after a refusal; what a daemon start meets after a set-aside where no change followed, a crash between the rename and the first write among them; a second start that finds a kept file; the state the daemon keeps on disk under a work item's id, which outlives the store's file; the window's two lines that no case runs; and two daemons on one run folder.

## Findings

### 1. A store that refused its file gives ids from 1 again, so the daemon deletes the gate output and the record times that the refused file's work items keep under those ids, and the ledger reads another work item's costs as theirs

```seal
severity: should
location: `apps/desktop/src/daemon/repositories.ts:303-307`, `apps/desktop/src/daemon/daemon.ts:1024-1028`, `apps/desktop/src/daemon/daemon.ts:1637-1638`
evidence: read `apps/desktop/src/daemon/repositories.ts:180-182`, `apps/desktop/src/daemon/repositories.ts:303-308`, `apps/desktop/src/daemon/daemon.ts:1023-1028`, `apps/desktop/src/daemon/daemon.ts:1637-1638`, `apps/desktop/src/daemon/daemon.ts:4136-4137`, `apps/desktop/src/daemon/daemon.ts:4165-4174`, `apps/desktop/src/daemon/ledger.ts:135-136`; executed `git grep -n -F "loses nothing that file still holds"` and `git grep -n -F "ids begin again"` at `20d87d48`, each printing `apps/desktop/src/daemon/daemon.ts:1024` alone
```

Why it matters: the issue's point is that a person's repositories and work items are never written over. The file itself is now kept, but some of what belongs to its work items is still deleted, and it is deleted by the first work item a person makes. That includes the mode whose notice says "The file stays as it is".

The grounds, each at its coordinate:

- The refusal branch returns before the counts are read (`repositories.ts:304-307`; the counts are set at `:308`, after it). So the store gives the next work item id 1, whatever ids the refused file gave. The issue's own case is a store a later build wrote, and that file carries its three counts in the shape `isStored` tests (`repositories.ts:180-182`). Only its work items' shape is refused.
- `createWorkItem` drops what the daemon keeps under the new id: `this.times.drop([stored.item.id])` and `this.flushTimes()` rewrite `record-times.json` without that id, and `this.dropGateOutput(stored.item.id)` removes `gate-output/<id>.txt` from the run folder with `rmSync` (`daemon.ts:1025-1028`, `:4136-4137`, `:4165-4171`). Neither file is the store's, so neither is held back by the memory-only fallback, which sets only the store's `file` to `undefined` (`repositories.ts:342`).
- `readLedger` reads a work item's entries "from the work item's creation on" (`daemon.ts:1637-1638`; `ledger.ts:136` filters on `workItemId` and `startedAt >= since`). A work item of the refused file was created before the refusing daemon's work item of the same id. So once a build that reads the file reads it again, that work item counts the refusing daemon's work item's costs as its own.
- Both later reads are reached on paths this work ships. In the memory-only case, `repositories.json` stays where it was, and the next daemon of a build that reads it reads it at its next start. In the kept case, `changelog.md:8` tells a person to rename the kept file back.
- The comment this diff rewrote now says what the code does not do: "Where that file was lost or kept aside, its ids begin again ... so a start that misreads `repositories.json` loses nothing that file still holds" (`daemon.ts:1024`). A kept file, and a file that could not be moved, still hold the work item whose gate output is removed here. The search for the fact's words printed this line alone. It is a sample under contract rule 12, since another statement of the fact in other words would escape it.

The fix keeps the refused file's counts where it states them, so an id given after a refusal is none of that file's. It reaches a refused file whose three counts read as numbers. That covers the issue's case, a later build's store. A file that is no JSON, one that cannot be opened and a list of repositories alone state no counts, and the fix leaves them as they are. The rewritten comment says so, so the sentence no longer promises what the code does not do.

```ts
// apps/desktop/src/daemon/repositories.ts, beside isStored. NAME NOT IN TREE: isCounted.
/** Whether a value holds the three counts of a store, whatever its repositories hold. */
function isCounted(value: unknown): value is Counts {
  return isRecord(value) && typeof value.nextWorkItemId === "number" && typeof value.nextRepositoryId === "number" && typeof value.nextGroupId === "number";
}

// apps/desktop/src/daemon/repositories.ts, the refusal branch in the constructor
    if (!Array.isArray(repositories) || !repositories.every(isStoredRepository)) {
      // The ids a refused file gave stay given where it states its counts, so no work item made now takes one of them, and nothing the daemon keeps under such an id is dropped or read as the new work item's.
      if (isCounted(value)) this.counts = { nextWorkItemId: value.nextWorkItemId, nextRepositoryId: value.nextRepositoryId, nextGroupId: value.nextGroupId };
      this.keepAside(runDir, this.file);
      return;
    }

// apps/desktop/src/daemon/daemon.ts:1024, the comment
            // The times of the records are keyed by a work item's id, which `repositories.json` gives. Where that file was lost, or was refused and stated no counts, its ids begin again, so what the store holds under the id given now was an earlier work item's. It is dropped here, as the id is given, and not at the daemon's start. A refused file that states its counts keeps them (`repositories.ts#RepositoryStore`), so no id given after it is one of that file's.
```

The fix pass owes the other statements this changes, which the snippet does not reach. The `RepositoryStore` docstring (`repositories.ts:249-259`) gains the sentence on the counts. `frame/design.md:36` *Scope* item 2 ("The store then starts empty") gains it too. Two expectations hold the old counts: `apps/desktop/test/daemon.test.ts:1484`, where `nextRepositoryId: 2` and `id: 1` become `3` and `2`, and `apps/desktop/test/repositories.test.ts:506`, whose `whole(dir)` expectation differs for the two kinds built from `LATER`. A case that a store refusing `LATER` gives its next work item id 2 pins the guard, shown red with the `isCounted` line removed.

### 2. A daemon that stops before its first change after a set-aside leaves no `repositories.json`, so the next start reads `work-items.json` in its place and says nothing of the kept file

```seal
severity: should
location: `apps/desktop/src/daemon/repositories.ts:335-345`, `apps/desktop/src/daemon/repositories.ts:298-302`, `apps/desktop/src/daemon/repositories.ts:253-255`, `seal/threads/1795701355-257-a-store-it-cannot-read-is-kept/frame/design.md:36`, `seal/threads/1795701355-257-a-store-it-cannot-read-is-kept/frame/design.md:62`, `seal/threads/1795701355-257-a-store-it-cannot-read-is-kept/changelog.md:5`, `apps/desktop/test/repositories.test.ts:506-517`
evidence: read `apps/desktop/src/daemon/repositories.ts:298-302`, `apps/desktop/src/daemon/repositories.ts:335-345`, `apps/desktop/src/daemon/repositories.ts:493-509`, `apps/desktop/src/daemon/daemon.ts:607-638`, `apps/desktop/test/repositories.test.ts:517`; executed `git grep -n -F "first change" -- apps/desktop/src apps/desktop/test seal/threads/1795701355-257-a-store-it-cannot-read-is-kept` at `20d87d48`, and `git tag --contains` on the commit that added `OLD_FILE` to `repositories.ts`, which prints `v0.0.1` first
```

Why it matters: *Scope* item 2 says the refusing store "does not read `work-items.json` in its place". That holds for the daemon that renamed the file. It does not hold for the next daemon. Once the rename has succeeded, nothing stands at `repositories.json` until the first change (`repositories.ts:339`; `keepAside` writes nothing). The daemon makes no write at its start on an empty store (`daemon.ts:607-638`). So each of these leaves the run folder with the kept file and no `repositories.json`: a daemon that crashes between the rename and the first write; a person who reads the notice and quits with "Quit Owlery Completely…"; and a restart before any change. The next start reads `readJson` as `undefined` and starts from `work-items.json` (`repositories.ts:298-302`, `:493-509`). On a machine that still holds that file, a list that predates `v0.0.1` comes back into the sidebar. That start also has no `setAside()`, so no window says where the person's store was kept. The first change of that daemon then writes the stale list as the new store.

Where `work-items.json` does not stand, the next start shows an empty store with no notice, which `frame/questions.md` Q1's default (a) accepts. The defect is the other read. It contradicts *Scope* item 2, and the frame's own acceptance row 2 pins the absence that causes it ("`repositories.json` does not stand until the first change", `frame/design.md:62`). So the finding is located in the frame as well as in the code.

The fix writes the empty store at once after the rename. Every later start then reads an empty store, never `work-items.json`. The window left for a crash shrinks from the daemon's whole life to the time between two system calls. The precondition: the rename and the write both act in `runDir`, a folder the rename has just shown is writable. A write that fails there leaves the kept file whole, and the next start then meets what it meets today.

```ts
  /** Renames the refused `file` to a name nothing stands at in `runDir`, and writes the empty store in its place, so the next start reads that store and not `work-items.json`. Where the rename fails, the store keeps no file, so nothing writes over the one it refused. */
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
    if (keptAs === null) return;
    try {
      this.write();
    } catch {
      // The kept file is whole either way. The next change writes again, and throws what refuses it, as any change does.
    }
  }
```

The fix pass owes the statements this changes, which the search on "first change" printed. The `RepositoryStore` docstring's "writes a new `repositories.json` at its first change" (`repositories.ts:254-255`) becomes "writes a new `repositories.json`, with no repository, at once". The same change goes to `frame/design.md:36` *Scope* item 2 ("its first change writes a new `repositories.json`"), to `frame/design.md:62` ("`repositories.json` does not stand until the first change"), and to `changelog.md:5` ("its first change writes a new `repositories.json` beside the kept file"). The case at `apps/desktop/test/repositories.test.ts:506` changes its name and its line `:517`, `expect(existsSync(refused)).toBe(false)`, to the empty store standing at the old path. A case pins the read: a second store on the same run folder, with `work-items.json` holding `OLD`, holds no repository. It is shown red against `20d87d48`. The lines `repositories.test.ts:616` and `:653` and the comment at `repositories.ts:503` name the `work-items.json` start and stay as they are. The rule-change text at `frame/design.md:82` and `:87` says nothing of the first change and stays. The search is a sample under contract rule 12.

### 3. No case sees the window's status line say the store's notice

```seal
severity: should
location: `apps/desktop/src/renderer/sidebar.ts:89`, `apps/desktop/src/renderer/renderer.ts:1901`, `apps/desktop/test/role-bundle.test.ts`
evidence: read `apps/desktop/src/renderer/sidebar.ts:89`, `apps/desktop/src/renderer/renderer.ts:1901`, `apps/desktop/test/role-bundle.test.ts:495-540`, `apps/desktop/test/built-app.ts:199-207`, `seal/threads/1795701355-257-a-store-it-cannot-read-is-kept/gaps.md:11`, `seal/threads/1795701355-257-a-store-it-cannot-read-is-kept/gaps.md:15`, `seal/threads/1795701355-257-a-store-it-cannot-read-is-kept/trail/phases/phase-2.md:35`
```

Why it matters: *Scope* item 6 is the change a person sees, the status line saying where their store was kept. The two lines that carry the notice there, `held.storeNotice = message.storeNotice ?? null` (`renderer.ts:1901`) and the third argument of `statusNotice` in `showStatus` (`sidebar.ts:89`), are run by no case. The account says so (`gaps.md:11`, `phase-2.md:35`). Either line could pass `null` and every case would stay green: `view.test.ts` pins `statusNotice`'s order, and `daemon.test.ts:1484` pins the key in `ready`. Neither loads the window. This round read both lines and found them right (see *Confirmations*). A read holds them at this commit only, and the next edit of `showStatus` is read by nobody. The *Regression test* row of `skills/code-review/SKILL.md` makes a changed behaviour that no case holds a `should`. `gaps.md:15` puts the question to the orchestrator, and this finding answers it: the case is owed.

The harness the case needs already stands. `BuiltApp.start` takes `writeRun`, which writes into the run folder before the daemon starts (`built-app.ts:199-207`). `role-bundle.test.ts:495-540` reads the status line the same way. The case runs in the batch of built-app cases at the end of the fix pass, not on its own.

```ts
// apps/desktop/test/role-bundle.test.ts, after "the built app's notice of an old CLI". It uses only what the file imports.
describe("the built app's notice of a kept repositories file", { timeout: 120_000 }, () => {
  it("says in the status line, drawn as a notice, where the daemon kept a `repositories.json` it could not read", async () => {
    buildApp();
    const app = await BuiltApp.start({}, { writeRun: (runDir) => writeFileSync(join(runDir, "repositories.json"), "{ not json", { mode: 0o600 }) });
    try {
      // The stamp is the daemon's own clock, so the sentence is matched up to the kept file's name.
      const opening = `Owlery could not read its list of repositories, so it kept the file as ${join(app.userData, "run", "repositories-unread-")}`;
      await app.until(`document.getElementById("status")?.textContent?.startsWith(${JSON.stringify(opening)}) === true`, "the notice of the kept file");
      const said = await app.evaluate(`({ notice: document.getElementById("status").classList.contains("notice"), kept: document.getElementById("status").textContent.endsWith(".json and started with none. Nothing in that file was changed.") })`);
      expect(said).toEqual({ notice: true, kept: true });
    } finally {
      await app.stop();
    }
  });
});
```

It is shown red with `held.storeNotice` replaced by `null` at `sidebar.ts:89`, and again with the line at `renderer.ts:1901` removed. `app.userData` is the harness's `readonly userData` (`built-app.ts:165`). Whether `app.stop()`'s answer is checked here, as the case at `:495` checks `left`, follows that case.

## Confirmations

What matched: every path that writes the store's file after a refusal. `write()` is the store's one writer of `repositories.json` (`repositories.ts:512-515`), and no other module names the file as a path it writes (executed: `git grep -n "repositories\.json"` over `apps/desktop/src` at `20d87d48`, which prints only comments and the store's `FILE` constant at `repositories.ts:10`). After a rename that succeeded, `write()` writes a new file at the old path and the kept name is never written. After a rename that failed, `file` is `undefined` and `write()` returns at once (`repositories.ts:341-343`, `:513`). The daemon makes no store write at its start on an empty store (`daemon.ts:607-638`, read). Read.

What matched: a second start that finds a kept file. The store never reads or lists a `repositories-unread-*.json`. A new refusal takes a new stamp, or the next free number after it, tested with `lstatSync(path, { throwIfNoEntry: false })`, so a dangling link counts as taken too (`repositories.ts:215-222`). The crafter's recorded run of the case at `apps/desktop/test/repositories.test.ts:529` passed at `a1e6a960` and was red before the change (`phase-1/green.txt` and `phase-1/red.txt` under the crafters' scratch directory, executed by the crafter, read here).

What matched: the window's two lines, which `gaps.md:11` hands to this round. `held.storeNotice = message.storeNotice ?? null` (`renderer.ts:1901`) is set before the handler draws the window at `openSummary` or `openList` (`renderer.ts:1912-1913`). Both reach `bringToFront` (`renderer.ts:308-311`), whose `showSidebar` (`sidebar.ts:137`) ends in `showStatus` (`sidebar.ts:235`), which passes `held.storeNotice` in the third place (`sidebar.ts:89`). A closed socket reloads the page (`renderer.ts:2131-2135`), so a notice of an earlier daemon never outlives that daemon in a window. `showStatus` sets `textContent`, so a path in the sentence is never read as markup. Read, not run. Finding 3 is the case that would run it.

What matched: *Data & interfaces* against the code. `SetAside`, `setAside()`, `setAsideNotice`, `storeNotice?: string`, `held.storeNotice` and the form of four arguments of `statusNotice` are at `repositories.ts:202-213`, `:329-332`, `protocol.ts:958`, `shared.ts:26` and `view.ts:925`. The two sentences of `setAsideNotice` are character for character the two of *Scope* item 4. The stamp at `repositories.ts:217` gives `20261126T123005Z` for `Date.UTC(2026, 10, 26, 12, 30, 5)`, which the cases pin. Read.

What matched: *Scope* item 1's line between refused and read. `null`, a folder, a text that is no JSON and a value that is neither shape all reach `keepAside`. `[]` and a store holding no repository do not (`repositories.ts:224-237`, `:303-305`). Read.

What matched: the phase records' runs. Phase 1's 8 red cases and its 11 mutants red, and phase 2's daemon case red against both earlier stores and its 6 mutants red, are in the crafters' recorded output (`phase-1/red.txt`, `phase-1/mutate.txt`, `phase-2/red-old.txt`, `phase-2/red-head.txt`, `phase-2/mutate-daemon.txt`, `phase-2/mutate-view.txt`, executed by the crafter, read here). Phase 2's boundary runs printed 1170 and 24 passed (`phase-2/boundary-1.txt`, `phase-2/boundary-2.txt`). Phase 1's `chain.test.ts:3500` time-out is in `phase-1/boundary.txt`, and its pass in phase 2 matches `gaps.md:9`, which closes the row in place and does not remove it.

What matched: the frame's rule changes against the other frames of the release that change *State lives in three places*. Those frames are #224, #218 and #217 (executed: `grep -ln -F 'State lives in three places' seal/threads/*/frame/design.md`). None of them touches the repositories paragraph. #217's design names this work as a follow-up (`seal/threads/1795610869-217-a-new-work-item-picks-its-branch/frame/design.md:199`) and agrees with it. Read.

What matched: each new case against its group. Each of the four store cases holds a fact of an acceptance row that no earlier case of `repositories.test.ts` holds. The rewritten `throws where the rename fails` case gave its folder half to the `a folder` kind of `:506`, which also pins that `work-items.json` is not read. The daemon case is the one that sends `storeNotice`. `view.test.ts` extends the order case in place, and phase 2 says why no case of the store's notice alone was added. No `seal layout --pairs` run was made, since the caller ruled out runs: each case was read against the cases of the same function in its own file. Read.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate: every other file that loads `daemon.ts` or `view.ts`, the built-app files, the typecheck of the package, and the `docs/` heading and row counts. This round ran nothing, by the caller's word. | `gaps.md:7`, `gaps.md:10` | the orchestrator, at the broad gate |
| The cases of a file of mode `000` and a folder of mode `0500`, which fail when run as root; no CI run of them has been seen. | `gaps.md:8`, `apps/desktop/test/repositories.test.ts:506`, `apps/desktop/test/repositories.test.ts:549` | the orchestrator, from the CI's run of the pull request |
| `frame/questions.md` Q1 and Q2 stand `open`, the build stands on their defaults, and `frame/plan.md` *Judgments of the run* holds no row recording that the defaults were taken under agentic routing. Under the default of Q1, a restart before any change clears the notice, and the next daemon names the kept file nowhere. | `frame/questions.md:13-14`, `frame/plan.md:61` | the orchestrator, before the seal |
| Two daemons on one run folder at once: between `keptPath`'s `lstatSync` and `renameSync`, a second store could make the same name, and `renameSync` replaces what stands. Whether "Restart Daemon…" waits for the old daemon to exit before it starts the new one was not read. A refusing daemon that starts while the old one still writes would meet that write. | `apps/desktop/src/daemon/repositories.ts:215-222`, `apps/desktop/src/main/daemon-client.ts:42-73` | the orchestrator, as a follow-up issue where it holds |

## Probes

| Command | Result |
|---|---|
| none | No probe was written or run: the caller ruled out test runs in this round, and every claim above is read, or rests on the `git` and `grep` commands its `evidence:` line names. |
