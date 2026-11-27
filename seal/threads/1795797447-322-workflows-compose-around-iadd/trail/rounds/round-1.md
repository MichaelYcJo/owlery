# Review round 1: 1795797447-322-workflows-compose-around-iadd

```seal
target: f12a45ab against origin/release/v0.2.0
```

This is the first round, so no earlier round's coordinates were carried, and every fact below was established at the target. The round read a clone of the branch at `f12a45ab`, made under the proofer's scratch directory, and never the branch's worktree. The base is `origin/release/v0.2.0` at `a75f4581`, which is also the merge base, since `505892e7` merged that commit. No `seal/parity.json` is declared, so no parity comparison is owed. `seal/config.json` sets `Record language` and `Commit and pull request language` to English. The work item holds no `changelog.md`, `pr.md` or `pr.<lang>.md` at the target.

Read whole at the target: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md` and `trail/phases/phase-1.md`. Read whole in the diff `a75f4581..f12a45ab`: every file under `apps/desktop/src/` (daemon, shared, renderer), every file under `pr-check/`, `docs/` and `apps/desktop/package.json`. Read in the merge `505892e7`: its combined diff (`git show --cc`), which holds one resolved file, `apps/desktop/test/records-place.test.ts`, and the text it brought in from #323 that this work item's records meet: `CLAUDE.md`, the changed paragraphs of `docs/architecture.md`, `docs/roadmap.md` and `docs/name.md`, and `seal/threads/1795797648-323-the-rules-live-in-the-repository/gaps.md` and `routing.md`. Sampled: the role bundle's diff, read through its added lines; the test diff, read whole for `record-blocks.test.ts`, `ledger.test.ts`, the resolved case and the heavy commands case of `records-place.test.ts`, and `inspection-records.test.ts` against `seal-records.test.ts` at the base, and read by search elsewhere: the cases that pin the earlier trailers, the stored chain case of `chain.test.ts`, and the fixture fixes of `f12a45ab`. The rest of the test diff is unread. `## Not judged` names it.

The axes walked, beyond the table of `skills/code-review/SKILL.md`: stored state written by an earlier build (the chain store, the look and the ledger), the one-spelling rule of the forms with the history's trailers as its exception, this repository's own records and workflow, the merge's resolution and the merged tree, and the window's words that phase 2 takes.

## Findings

### 1. A stored stage or ledger line whose kind is a member name of `Object.prototype`, such as `constructor`, now reads as a stage of the chain, where the base refused it

```seal
severity: should
location: `apps/desktop/src/daemon/chain.ts:1165-1172`, `apps/desktop/src/daemon/ledger.ts:40-46`, `apps/desktop/test/chain.test.ts:811-815`, `apps/desktop/test/ledger.test.ts:141-160`
evidence: executed the probe `test_tmp_stored_kind.test.ts` of `## Probes`, and `node -e` over the object literal `{ seal: "inspection" }`; read `apps/desktop/src/daemon/chain.ts:1166-1171`, `apps/desktop/src/daemon/chain.ts:1180-1193`, `apps/desktop/src/daemon/chain.ts:1239-1246`, `apps/desktop/src/daemon/ledger.ts:41-46`
```

Why it matters: the stored chain of `repositories.json` and of the look, and each line of the cost ledger, pass a guard before the daemon reads them. At the base the guard of a stage's kind was `CHAIN_STAGE_KINDS.includes(value.kind)`. Now it is `storedKind(value.kind) !== undefined`, and `storedKind` falls back to `EARLIER_KINDS[value]`, a plain object literal. A lookup on a plain object returns the members it inherits. So `storedKind("constructor")` and `storedKind("toString")` give a function, and `storedKind("__proto__")` gives an object. The probe showed `isChain` accepting a chain whose stage names the kind `constructor`, `chainOf` giving that stage a function as its kind, and the stage's JSON, as a window is sent it, carrying no `kind` at all. `ledger.ts#chainOf` reads through the same function, so a ledger line with such a kind is taken as an entry. The phase record claims the grounds of *Stored state and the protocol*, that a store an earlier build wrote is read and not refused (`trail/phases/phase-1.md:10`). No build wrote these values, and the change reads them where the base refused them. A `Map` reads only its own keys. A case beside the earlier kind's case pins the refusal.

```ts
// apps/desktop/src/daemon/chain.ts, in place of lines 1165-1172
/** The kinds a build before the rename to IADD stored a stage under, by the kind this build names: `seal` is the stage `inspection`. A map, so a member name of `Object.prototype`, such as `constructor`, names no kind. */
const EARLIER_KINDS: ReadonlyMap<string, ChainStageKind> = new Map([["seal", "inspection"]]);

/** The kind of `CHAIN_STAGE_KINDS` a stored value names: one of them, or an earlier kind (`EARLIER_KINDS`); nothing where it names none. The cost ledger reads a stage's kind with it too. */
export function storedKind(value: unknown): ChainStageKind | undefined {
  if (typeof value !== "string") return undefined;
  return CHAIN_STAGE_KINDS.includes(value as ChainStageKind) ? (value as ChainStageKind) : EARLIER_KINDS.get(value);
}

// apps/desktop/test/chain.test.ts, after the case at line 811
  it("reads no chain whose stage names a kind no build stored, a member name of Object.prototype among them", () => {
    for (const kind of ["constructor", "toString", "__proto__", "sealed"]) expect(isChain({ ...chain(), stages: [{ ...stage(), kind }] }), kind).toBe(false);
  });

// apps/desktop/test/ledger.test.ts, one more entry of the list of lines that read as no entry, beside `{ ...good, stage: { role: "proofer", stage: "inspection" } }`
      { ...good, chain: { kind: "constructor", round: 2 } },
```

The fix pass shows each new case red against `EARLIER_KINDS[value]` before it commits it.

### 2. An app built from this release runs no heavy command in this repository, whose `seal/` root the frame keeps, while the merged `CLAUDE.md` sends sessions to `Heavy commands` in `seal/config.json`

```seal
severity: should
location: `apps/desktop/src/daemon/records-place.ts:194-196`, `apps/desktop/src/daemon/records-place.ts:253-258`, `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/plan.md:69`, `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/questions.md:29`, `seal/threads/1795797447-322-workflows-compose-around-iadd/trail/phases/phase-1.md:30`
evidence: read `apps/desktop/src/daemon/records-place.ts:194-196`, `apps/desktop/src/daemon/records-place.ts:253-258`, `apps/desktop/src/daemon/chain-command.ts:687-697`, `apps/desktop/src/daemon/hooks.ts:173`, `apps/desktop/src/daemon/pane-chain.ts:29`, `apps/desktop/test/records-place.test.ts:247-248`, `CLAUDE.md:8`, `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/plan.md:17`, `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/plan.md:69`; executed `python3 -c` reading `Heavy commands` of `seal/config.json`, which printed `test`, `test:app` and `install`
```

Why it matters: `rootOf` now reads `iadd/README.md` alone, and this repository's root stays `seal/` under the plugin's marker, by `frame/plan.md:69` *This repository does not move*. So `readHeavyCommands` gives this repository nothing. The crafter pinned exactly that in the heavy commands case of `records-place.test.ts` ("This repository's own root stays `seal/`, in AgenticSeal's form, so the daemon reads no heavy command of it"). The chain command's `run`, which `OWLERY_RUN` names in every shell and Claude Code pane (`hooks.ts:173`, `pane-chain.ts:29`), then refuses every name in this repository with "The repository names no heavy command "test" under "Heavy commands" of iadd/config.json. It names none." That sentence names a file this repository does not hold. `seal/config.json` names `test`, `test:app` and `install`. `CLAUDE.md:8`, which the merge `505892e7` brought in from #323, tells every session here that heavy commands take their turn on the machine by `Heavy commands` in `seal/config.json`. So from the first app built from this release until step 4 of the issue's *When it lands*, Owlery's own repository loses the turn that keeps one broad gate on the machine at a time. The merged-in text is not at fault: it states the process this repository runs. The defect is in this work's unit and in its records. `trail/phases/phase-1.md:30` records the test's change ("The case beside it no longer reads this repository's own heavy commands") as a fact of the case and not as a consequence for this repository. `frame/plan.md:17` names, as the third risk, that the app offers this repository the move and the owner declines it. That covers the records and the offered move, and not the runner. `frame/plan.md` *Operational impact* names the check's pin and the root, and not the runner either. This is a design decision. Under `Automation` `yes` the orchestrator takes it, and the fix pass writes it down for the orchestrator to answer. The first block is a row of `frame/questions.md`, after Q11:

```markdown
| Q12 | Does an app built from this work run this repository's heavy commands while its root stays `seal/` under the plugin's marker? `records-place.ts#readHeavyCommands` reads `iadd/config.json` alone, so the runner that `OWLERY_RUN` names refuses every command here, while `CLAUDE.md` sends sessions to `Heavy commands` in `seal/config.json`. | the orchestrator | Read `Heavy commands` from a root in the earlier form too, in `records-migration.ts`, the one module that holds the earlier spellings: the runner keeps its turn here until step 4, and the earlier root is still never read as records. Leave it: sessions in this repository run heavy commands with no turn until step 4, and `CLAUDE.md` says so. | Read `Heavy commands` from a root in the earlier form, in phase 3, with the heavy commands case of `records-place.test.ts` reading this repository's commands again. | open |
```

The second block is a bullet of `frame/plan.md` *Operational impact*, after *This repository does not move*:

```markdown
- **This repository's heavy commands.** An app built from phase 1 on reads this repository's `seal/` as no root, so its runner runs no heavy command here until `frame/questions.md` Q12 is answered and built.
```

### 3. The phase record's list of what the frame leaves out misses a record form that carries the role's name, and says the acceptance search allows every earlier spelling of stored state, which it does not for `ledger.test.ts`

```seal
severity: should
location: `seal/threads/1795797447-322-workflows-compose-around-iadd/trail/phases/phase-1.md:10-12`, `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/design.md:110`, `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:3-9`
evidence: executed `git grep -n -E '"sealer"|"seal"' -- apps/desktop/src apps/desktop/test`, and `grep -n -E 'refused.role|by:' apps/desktop/src/daemon/chain.ts apps/desktop/src/daemon/decision-record.ts`; read `apps/desktop/src/daemon/decision-record.ts:400-414`, `apps/desktop/src/daemon/daemon.ts:4083`, `apps/desktop/src/renderer/view.ts:754`, `apps/desktop/src/daemon/chain.ts:974-999`, `apps/desktop/test/ledger.test.ts:203-207`, `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/design.md:110`
```

Why it matters: the orchestrator asked this round to judge the crafter's list of frame gaps, and the orchestrator and phase 3's crafter act on that list. Two parts of it do not hold.

First, the record forms. `phase-1.md:12` names one form the frame does not list: the stage cell of `trail/refusals.md`. The list was built from that one instance. Listed instead from the writers that put a role or a stage kind into a record's text, the class has three members. The stage cell of `trail/refusals.md` is the one named. The second cell of the same row names the role (`chain.ts#refusalsText`). The `by:` line of a question in `decisions.md` names the asking role (`decision-record.ts:400-414`), and the inspector's park now writes `inspector` there (`daemon.ts:4083`) where earlier records hold `sealer`. The window places an open question on the approval line's place whose role equals `by` exactly (`renderer/view.ts:754`). So an open question that an earlier build parked from the sealer shows on no place, unless phase 3's migration rewrites that line too. No reader decides anything on the refusals row's role cell, so that cell is a stale word and not a refusal.

Second, the acceptance search. `phase-1.md:10` says "The earlier spellings stand in `chain.ts`, which the acceptance search of `frame/design.md` *User scenarios & acceptance* already allows for the earlier `Seal-Built-By`." The search command printed them in `chain.ts`, in the stored chain case of `chain.test.ts:812`, and in the earlier line case of `ledger.test.ts:205`. The acceptance row (`frame/design.md:110`) names `chain.ts` and `chain.test.ts` for the earlier trailer alone, and it does not name `ledger.test.ts`. So that row's search prints `ledger.test.ts` at the last phase, and the frame's row needs the file and its reason before then. That edit to the frame is the orchestrator's. The fix pass corrects the record and hands the frame's row on. The first block takes the place of the last sentence of the paragraph at `phase-1.md:10`:

```markdown
The earlier spellings stand in `chain.ts`, in the stored chain case of `chain.test.ts` and in the earlier line case of `ledger.test.ts`. The acceptance search of `frame/design.md` *User scenarios & acceptance* names `chain.ts` and `chain.test.ts` for the earlier `Seal-Built-By` trailer alone and names no `ledger.test.ts`, so `gaps.md` hands that row to the orchestrator.
```

The second block takes the place of the paragraph at `phase-1.md:12`:

```markdown
**Record forms the frame does not list.** Three cells of the records name a stage kind or a role. The stage cell of `trail/refusals.md` read `seal 2` and now reads `inspection 2`, and its role cell read `sealer` and now reads `inspector` (`chain.ts#refusalsText`). The `by:` line of a question in `decisions.md` names the asking role (`decision-record.ts`), and the window places an open question on the place whose role that line names (`renderer/view.ts#approvalPlaces`). Phase 3's migration rewrites the three beside the fences. Otherwise a refusals record of a migrated repository names a stage no reader knows, and an open question an earlier build parked from the sealer shows on no place.
```

The third block is a row of `gaps.md` *Not verified*:

```markdown
| The acceptance row "The product holds the seal's vocabulary only where this design keeps it" of `frame/design.md` names no `apps/desktop/test/ledger.test.ts`, whose earlier line case holds `sealer` and `seal` as an earlier build stored them, and gives `chain.ts` and `chain.test.ts` the earlier trailer alone as their reason, though both also hold the stored kinds | the orchestrator, before the last phase runs that search |
```

### 4. Comments of the daemon that phase 1 renamed around still state the fact before the rename: the record `guarantee.md`, a root of several names, and builders read from one trailer

```seal
severity: should
location: `apps/desktop/src/daemon/repository-file.ts:3-5`, `apps/desktop/src/daemon/daemon.ts:4054-4060`
evidence: executed `git grep -n -i -E 'guarantee|each name of|two names|second name' -- apps/desktop/src pr-check`, and `grep -rn -E 'Routing|Built-By' apps/desktop/src`; read `apps/desktop/src/daemon/repository-file.ts:1-8`, `apps/desktop/src/daemon/daemon.ts:4054-4060`, `apps/desktop/src/daemon/stage-records.ts:333-338`, `apps/desktop/src/daemon/stage-records.ts:368`
```

Why it matters: *Scope* item 4 renames the daemon's modules, exports, comments and cases, and it is phase 1's. The next crafter who edits these modules reads these sentences as the code's account of itself. `repository-file.ts:3` says the daemon reads a work item's `guarantee.md`, and the file is `inspection.md` now. `repository-file.ts:5` says the daemon reads "the `README.md` at each name of a records root", and the root has one name now (`records-place.ts#ROOT`). The docstring of `Daemon#runInspection` (`daemon.ts:4054-4060`) says the builders are read from the trailer `IADD-Built-By:`. `recordVerdict` reads both keys (`stage-records.ts:368`), and its own docstring says so (`stage-records.ts:333-338`). The searches are a sample under contract rules 12 and 19: they read the words of these facts, and a statement of them in other words escapes them. Within `apps/desktop/src` they printed these lines, and also `seal-back-records.ts:58-60`, which names "the guarantee" in a module of the back of the seal, which phase 2 takes by `gaps.md` *Not done*, and `renderer/view.ts:2871-2873`, which are the window's words and phase 2's.

```ts
// apps/desktop/src/daemon/repository-file.ts, lines 1-6
// The one way the daemon reads a file of a person's repository whose text it
// acts on, but for the setup's command (below). Eight files are read through it: a work item's `decisions.md`,
// its `trail/gate.md` and its `inspection.md` (`chain-records.ts`), and
// each `routing.md` under `threads/` of its worktree, and, in a repository's
// main checkout, the root's `README.md`, the root's
// `config.json`, `.github/workflows/hygiene.yml`, and `package.json`. The

// apps/desktop/src/daemon/daemon.ts, lines 4054-4058
   * The sessions that built the work are `the session` where the
   * `Implementation` row of the `routing.md` the head holds reads so, then
   * the id of each fix pass's session, read from the trailer
   * `IADD-Built-By:`, and from `Seal-Built-By:` of a commit written before
   * the rename, of the commits on the gate's commit's own line that
```

### 5. `gaps.md` says the last phase's acceptance search reaches the case titles that say "guarantee", and that search greps `seal`, so it reaches none of them

```seal
severity: should
location: `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:17`
evidence: executed `git grep -n -i 'guarantee' -- apps pr-check | grep -v -i seal | cut -d: -f1 | sort | uniq -c`; read `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:17`, `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/design.md:110`
```

Why it matters: `gaps.md:17` reads "The titles of many cases under `apps/desktop/test/` still say seal, sealer or guarantee in their words, and so do several helpers' comments. Their assertions are renamed; their titles are text no reader of the product meets, and the acceptance search of the last phase reaches them." The acceptance search of `frame/design.md:110` is `git grep -n -i 'seal'`, and "guarantee" holds no `seal`. Lines that hold "guarantee" and no "seal" stand at the target in `repository-file.ts` (finding 4), `renderer/view.ts`, the role bundle's `skills/agent-contract/SKILL.md` (its rule 13 on a platform's guarantee, which is no record and stays), and the tests `chain-records.test.ts`, `chain-run.ts`, `chain.test.ts`, `daemon.test.ts`, `inspection-state.test.ts`, `pr-check.test.ts`, `pull-request.test.ts`, `record-blocks.test.ts` and `view.test.ts`. They are case titles, and also helpers' names (`GUARANTEE`, `guaranteeAt`, `guaranteed`, `GUARANTEE_AT`), which the sentence does not mention at all. The last phase's crafter and the orchestrator read this memo to know what the search will catch, and the search will catch none of these. The search names every line that holds "guarantee", and that set is the sample's whole for this word. A title in other words, such as "the verdict's record", escapes it. Whether the acceptance search should also grep `guarantee` is a change of the frame and is the orchestrator's. The memo's sentence is the fix pass's:

```markdown
The titles of many cases under `apps/desktop/test/` still say seal, sealer or guarantee in their words, and so do several helpers' comments and names, such as `GUARANTEE` and `guaranteeAt` of `chain.test.ts` and `guaranteed` of `pr-check.test.ts`. Their assertions are renamed. Their titles are text no reader of the product meets. The acceptance search of the last phase greps `seal`, so it reaches those that say seal or sealer and none that say guarantee alone. `git grep -n -i guarantee -- apps pr-check` lists the latter, and the last phase rewrites each line it prints but the role bundle's rule on a platform's guarantee.
```

### 6. The merged-in records of #323 hand rules 31 to 34 and 39 to this work, and to its `## Rule changes`, which reads `nothing`, and no record of this work item takes them

```seal
severity: should
location: `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/plan.md:60`, `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/design.md:241-244`
evidence: read `seal/threads/1795797648-323-the-rules-live-in-the-repository/gaps.md:21-22`, brought in by `505892e7`, `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/plan.md:56-61`, `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/design.md:241-244`; executed `grep -rn -i -E 'heavy|322' seal/threads/1795797648-323-the-rules-live-in-the-repository/`, and `grep -n -E '#323|rule 3[1-9]' seal/threads/1795797447-322-workflows-compose-around-iadd/frame/*.md seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md seal/threads/1795797447-322-workflows-compose-around-iadd/trail/phases/phase-1.md`
```

Why it matters: this round holds the work item's records against the tree as merged. The merge `505892e7` brought #323's closing memo in. Its *Not done* (`seal/threads/1795797648-323-the-rules-live-in-the-repository/gaps.md:21-22`) gives rules 31 and 32 of #323's merged list, "composable workflows and the method the chain follows, homed in `docs/product.md`", to "#322's `## Rule changes`". It gives rule 33, the 2026-11-28 part of rule 34 and the missing part of rule 39 to "#322". This work item's `## Rule changes` reads `nothing`, because the work writes the policy root in its own pull request (`frame/design.md:241-244`). Its *Overlap with the release* row for #323 (`frame/plan.md:60`) was written before #323 merged, and says only that phase 5 rewrites the documents with #323's text in them. No record of this work item names those rules, so the last phase's crafter has no coordinate that would bring them into `docs/`, and the settle reads no `## Rule changes` that holds them. The rules' text stands in issue #323's merged list, outside the tree. The finding is located in this work item's records, and the merged-in text is named on `evidence:` above. Phase 5 has not run, so no rule is missing from `docs/` yet. The defect is that nothing points phase 5 at them. The fix pass rewrites the row:

```markdown
| #323, the rules of this repository, merged into the release branch by pull request #341 and brought onto this branch by `505892e7` | The rules #323 wrote name the check `seal`, the commands of the plugin and this repository's own `seal/` root, in `CLAUDE.md`, `docs/roadmap.md`, `docs/architecture.md` and `docs/name.md`, which *Scope* item 12 rewrites. #323's `gaps.md` *Not done* hands this work rules 31 and 32 of its merged list (composable workflows and the method the chain follows, homed in `docs/product.md`), rule 33, the 2026-11-28 part of rule 34 and the missing part of rule 39. | #323 | Phase 5 writes each rule #323 handed here into the documents of *Scope* items 1 and 12, read from issue #323's merged list, since this design's `## Rule changes` reads `nothing`. It keeps each sentence that states this repository's own process in the plugin's names. |
```

## Confirmations

What matched: this repository's own records and workflow do not move. `git diff --stat a75f4581 f12a45ab -- seal/README.md seal/config.json .github CLAUDE.md` printed nothing. Under `seal/threads/` the diff adds this work item's directory alone. `.github/workflows/owlery-seal.yml` still clones `pr-check/` at `--branch v0.1.0` (line 36), executed. Every commit of the range carries the plugin's `Seal-Routing:` trailer, executed with `git log --format='%h %s%n%(trailers)'`.

What matched: the merge's resolution keeps #323's guard. In `apps/desktop/test/records-place.test.ts:1113-1126` at the target, while `seal/README.md` opens with `PLUGIN_ROOT_MARKER`, the case holds the pin of `.github/workflows/owlery-seal.yml`, read by its own name, at `PIN_HELD_FOR_THE_PLUGIN` (`0.1.0`). Otherwise it holds `iadd/README.md` to `MARKER` and `.github/workflows/owlery-inspection.yml` to `workflowText(version)`, both with `toBe`, so the new form is checked whole. Read with `git show --cc 505892e7`, which shows no other resolved file. The phase record says the pin's assertion was shown red with the held version changed. That was not run here.

What matched: nothing reads two spellings of a record form, except the history's trailers, which the frame allows (`frame/design.md:65-66`, `frame/plan.md:29`). The readers and writers of the forms read `iadd`, `inspection.md`, `Verdict: cleared`, `inspected-by:` and the `owlery:inspection` markers alone: read in the whole diff of `apps/desktop/src/daemon` and `pr-check`, and executed with `git grep -n -i -E 'guarantee|owlery-seal|seal/threads|agentic-seal|judged-by|SECOND_HOME'` over the sources, which printed comments and the window's words alone. The two exceptions are `chain_check.py#TRAILERS` (line 2164), read through git's trailer parser with both `key=` options, and `stage-records.ts:368`, which passes both builder keys to `worktrees.ts#trailerValues`. Both have cases: `pr-check.test.ts:134` and `chain.test.ts:3102`. The earlier `seal` fence reads as no block and as no fence like one in both readers (`record-blocks.test.ts`, the fixture "a block whose fence is seal, the earlier form"). The daemon's reader and the check's reader agree on the dotless i, since JavaScript's lower case and Python's `casefold` keep it alike. The earlier spellings that `chain.ts` reads (`storedKind`, `storedRoleStage`, `WRITTEN_STATES`) are stored state of the daemon and no record form, under *Stored state and the protocol*. Finding 1 holds their one defect.

What matched: stored state written by an earlier build still reads, for the values an earlier build wrote. A chain with a stage of kind `seal` reads as `inspection` (`chain.test.ts:811-815`). A ledger line of `sealer` at `seal` with the chain's stage `seal` reads as the inspector's (`ledger.test.ts:203-207`). Both were executed in the narrow run of `## Probes`, and `storedRoleStage` was executed in the probe. The look reads its chain through `chain.ts#isChain` and `#chainOf` (`last-look.ts:128`, `last-look.ts:193`), and it stores no `recorded` and no `paneStage`, read.

What matched: the phase's own acceptance search holds. `git grep -n -i 'seal' -- pr-check apps/desktop/role-bundle`, with the lines that hold `agenticseal` in any case taken out, printed lines of `pr-check/skills/code-review/scripts/chain_check.py` alone (lines 13, 2163 and 2185, the earlier `Seal-Routing` trailer), executed.

What matched: every `check:` line under `docs/`, `README.md`, `README.ko.md`, `apps/` and `pr-check/` that names a path of this repository resolves at the target. The ones that do not resolve name the plugin's own tests, in the role bundle's copied skills, and those stood at the base too. Executed with a loop over `git grep -h -o 'check: .*'` and `git grep -l 'check: .*tests/' a75f4581 -- apps/desktop/role-bundle`.

What matched: the removals the frame does not name have no caller. `rule_changes.py`'s `order`, `merge_order`, `group`, `unordered`, `place`, `where`, `overlapping` and `gitcmd` are called nowhere under `pr-check/` or `apps/`, executed with `git grep -n -E` on their call forms.

What matched: *Scope* items 3, 6 and 8 as phase 1 holds them. The check posts `inspection` (`chain_check.py#CHECK_NAME`). Its titles are those of `frame/design.md` *The check's titles*, and `by_owl_chain` reads `workflow: owl-chain` and no `rules:` line. Owlery writes `workflow:` and `inspector:` after `rules:` and reads them back before it commits (`inspection-records.ts#inspectionText`). The root has one name in the daemon (`records-place.ts#ROOT`) and in the check (`optin.py#HOME`, with no `SECOND_HOME`). A project's own unmarked `iadd/` blocks the plan with a sentence that says so (`records-place.ts:511`). The setup writes `.github/workflows/owlery-inspection.yml` with `name: inspection`. All read in the diff.

What matched: the window's old words remain where phase 2 takes them, and the protocol's role and stage values moved in this phase as `phase-1.md:14` says. The renderer keeps "Sealer, verdict", the role `sealer` of the approval line, "Sealed", "Seal broken" and the back of the seal. The protocol keeps `Seal`, `WorkItem.seal` and `SealRecord`, and `inspection-state.ts` still returns `state: "sealed"`. Read, and executed with `git grep -n -i -E 'guarantee|owlery-seal|seal/threads|sealer' -- apps/desktop/src/renderer apps/desktop/src/shared apps/desktop/src/main apps/desktop/src/preload`. No record form is read there. The renderer's one place that names a form's value is `renderer/view.ts:754`, which compares a question's `by` with the window's role names, and finding 3 covers it.

What matched: the phase record's account of the mutations, by reading, for the guards a reading can judge. Emptying `EARLIER_KINDS`, or dropping the sealer's earlier pair, makes the stored chain case and the ledger's earlier line case fail. Reading the builders from `IADD-Built-By:` alone makes the `Seal-Built-By:` case fail. Reading the title from `rules:` makes the case at `pr-check.test.ts:513` fail, since its block holds `rules:` and no `workflow:`. The bullet of `record-blocks.ts` names its first mutant as "lower case in place of Python's fold". The code is lower case now, so the mutant that the dotless-i fixture turns red is upper case and back in place of lower case. The bullet reads the other way round. That is a wording slip, and no finding. No mutation was run here.

A gap in a case, with no finding: the guard `newest.workflow !== OWL_CHAIN || newest.inspector !== OWL_CHAIN` of `inspection-records.ts#inspectionText`, the read-back of the two new lines, has no case that makes it refuse, since the lines are constants of the same module (`apps/desktop/test/inspection-records.test.ts`).

A note on the records, with no finding: the `gaps.md:8` row says the built-app files it lists were "each edited by reading alone". `f12a45ab` then ran five of them green in one built-app run (`phase-1.md:48`). The row still holds for the other six, and it errs toward running more.

A note on the phase cut, with no finding: the policy documents still state the earlier facts that phase 1 changed in code. For example, `docs/architecture.md:167` says a folder is on the owl chain where `owlery-seal.yml` stands. *Scope* item 12 and the plan's phase 5 rewrite them in the same pull request, so this is no finding of phase 1. The sealer reads them at the end.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate at `f12a45ab`: the whole suite, the typecheck and the documents' editions. The suite is `unverified` | the repository's `Broad gate` key of `seal/config.json` | the orchestrator, in the broad gate it runs alone once the rounds settle |
| The built-app files of `gaps.md:8` that the batch at `505892e7` did not run: `daemon-restart.test.ts`, `decisions-and-questions.test.ts`, `pane-session.test.ts`, `records-dialog.test.ts`, `role-session.test.ts` and `work-item-menu.test.ts` | `apps/desktop/test/` | the orchestrator, in the built-app batch at the end of phase 2 |
| The test diff outside what the round read (the opening paragraph names it): among them `chain.test.ts` beyond its earlier trailer, stored chain and title cases, `daemon.test.ts`, `chain-command.test.ts`, `settle.test.ts`, `worktrees.test.ts`, `view.test.ts`, `pull-request.test.ts` and the built-app files, read for whether each renamed assertion still pins what it pinned | `apps/desktop/test/` | the next round, where the orchestrator judges that a read is owed, and otherwise the broad gate for whether they pass |
| The role bundle's diff, read through its added lines and not against each removed line, for a rule whose meaning the rename changed | `apps/desktop/role-bundle/` | the next round, where the orchestrator judges that a read is owed |
| The mutation runs the phase record claims, and the red run of the resolved pin's assertion: read, not run | `seal/threads/1795797447-322-workflows-compose-around-iadd/trail/phases/phase-1.md:38-46`, `seal/threads/1795797447-322-workflows-compose-around-iadd/trail/phases/phase-1.md:32` | the orchestrator, who decides whether the account stands |
| Whether the frame's acceptance search should also grep `guarantee`, and should name `ledger.test.ts` (findings 3 and 5) | `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/design.md:110` | the orchestrator, who owns a change of the frame |

## Probes

| Command | Result |
|---|---|
| `node -e` that looks up `constructor`, `toString`, `__proto__` and `hasOwnProperty` on the object literal `{ seal: "inspection" }` | each lookup gave a value that is not `undefined`: a function, a function, an object and a function |
| `node node_modules/vitest/vitest.mjs run test/test_tmp_stored_kind.test.ts --project unit`, in `apps/desktop/` of the clone at `f12a45ab`, with the main checkout's node modules linked into the clone | the first run printed no console output that could be read, and the probe was rewritten as assertions and run again: 2 passed. `storedKind` gives a function for `constructor` and `toString` and an object for `__proto__`. `isChain` accepts a chain whose stage's kind is `constructor`. `chainOf` gives that stage a function as its kind, and its JSON holds no `kind`. `storedRoleStage({ role: "sealer", stage: "seal" })` gives the inspector's pair |
| `node node_modules/vitest/vitest.mjs run test/record-blocks.test.ts test/ledger.test.ts test/inspection-records.test.ts --project unit`, in the same place | 3 files, 62 cases passed: a narrow run of the slices the findings touch, and no gate |
