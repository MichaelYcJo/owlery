# Review round 5: 1795797447-322-workflows-compose-around-iadd

```seal
target: 7dd65599 against origin/release/v0.2.0
```

This round does three things. It answers the one finding round 4 closed. It reviews phase 4 (`0541b7b0`, `80602d9b`, `5c923b2e`, `db4b1948`, `a8b2e811`, `011f7298`) and phase 5 (`3daf34f3`, `c2682914`, `88b42a8b`, `bc8c9e0e`), which no round had read. It also reviews the orchestrator's records commits after round 4: `c41f1613`, which closed round 4's finding, `c6212c71`, and `7dd65599`, which folds the plan's sentences on the version move. The round read the branch's worktree at `7dd65599`, with no builder working in it, as the caller allowed. It changed no file there but this record. The base is `origin/release/v0.2.0` at `a75f4581`, and `git fetch` showed the base still at that commit. The range holds no merge of the base. No `seal/parity.json` is declared, so no parity comparison is owed. `seal/config.json` sets `Record language` and `Commit and pull request language` to English. The work item holds `changelog.md` at the target, and no `pr.md` or `pr.<lang>.md`.

Read whole at the target: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `trail/phases/phase-4.md`, `trail/phases/phase-5.md` and `trail/rounds/round-4.md`. `trail/rounds/round-1.md` to `round-3.md` were read for their coordinates: each `target:`, `severity:`, `verdict:` and `confirms:` line, and round 3's opening paragraphs. `trail/phases/phase-1.md` to `phase-3.md` were not opened, since no file of this range changes them. Issue #322's body was read whole (`gh issue view 322`), and issue #323's merged list at rules 31 to 34 and 39 (`gh issue view 323`).

Read whole in the code: `apps/desktop/src/daemon/workflow.ts`, both files of the bundle it reads, and the diff `67902de0..011f7298` of every file under `apps/desktop/src/`, of `apps/desktop/build.mjs`, of the role bundle and of `docs/`. Read in the callers: `apps/desktop/src/daemon/main.ts:27-60` and `:123-127`, and `apps/desktop/src/daemon/adapters/claude-roles.ts:66-103`. Read whole in the tests: `apps/desktop/test/workflow.test.ts`, and the phase-4 diffs of `role-bundle.test.ts`, `chain-command.test.ts` and `chain-command-run.ts`. The diff of `claude-adapter.test.ts` was read to its last hunk but one, which is the renamed case of a missing document that `trail/phases/phase-4.md:34` describes.

Read whole in the documents: `docs/iadd.md` and `docs/iadd.ko.md`; the phase-5 diffs of `README.md`, `TRADEMARKS.md`, `pr-check/README.md` and the bundle's `README.md`; the lines phase 5 added to `README.ko.md`; and the word diffs of `docs/architecture.md`, `docs/product.md`, `docs/roadmap.md`, `docs/name.md` and `docs/design.md`. Some paragraphs of `docs/architecture.md` are one line of more than 1,500 characters, and the word diff was cut there, so those paragraphs were sampled. The Korean editions other than `iadd.ko.md` and the README were sampled: `docs/architecture.ko.md` *Owlery가 출발한 곳* to the first rows of its table, `docs/product.ko.md:11` and `:61-72`, `docs/roadmap.ko.md:22`, `:39`, `:52-56` and `:87`, `docs/name.ko.md:12` and `:15`, and three added lines of `docs/design.ko.md`. For each of the six pairs, the counts of headings, table rows and `check:` lines were taken and match. `## Not judged` names the rest.

Carried from earlier rounds rather than established again: the coordinates of round 4's finding at `gaps.md`, and round 4's search on its words, which this round ran again. No probe of an earlier round was owed. Every verdict below was reached at this target.

The axes walked, beyond the table of `skills/code-review/SKILL.md`: what the Owl Chain did before phase 4 and does after it, in a role session and in a pane, for each of the four pairs; where a null model leads in each launch; where the build's copy and the tree's bundle differ; every coordinate of the constant phase 4 moved; each name of #322's *Concept and names* against `docs/iadd.md`; the sentences on this repository's own process; and each line the two acceptance searches print outside their rows.

## The acceptance searches

Both searches of `frame/design.md` *User scenarios & acceptance* were run at the target. The first prints 820 lines, 224 of them in files its row does not list. The second prints the lines of `records-migration.ts` and two more. The caller asked, for each group, whether the text should change or the row's list should grow. A line stays where it states an earlier form, this repository's own process, a name set aside or the plugin as it is, or where the letters match by accident. Every other line names today's inspection, inspector or their states by the seal's words, and its text should change, which finding 1 holds.

The rows' lists should grow by these, each read in context:

- `apps/desktop/src/daemon/daemon.ts:4058` and `apps/desktop/src/daemon/stage-records.ts:336`, which say that the builders are read from `IADD-Built-By:` and from the earlier `Seal-Built-By:`. Each is true of the code, and `chain.ts` is listed for the same trailer.
- `docs/iadd.md:57` and `docs/iadd.ko.md:57`, whose names set aside hold "Merge on Seal", as #322's body lists it and *Scope* item 1 asks.
- `apps/desktop/src/daemon/adapters/claude-roles.ts:74` and `:101`, on the second search. The taken documents of the bundle still name AgenticSeal's commands, as a `git grep -n -E` over `apps/desktop/role-bundle` for a backtick, then `seal` or `iadd`, a space and a word, printed (`agents/crafter.md:51`, `skills/verify/SKILL.md:68` among them). The head's sentence at `:101` tells a role not to look for that command line. It is true, and the case of `claude-adapter.test.ts` that holds the head word for word pins it.
- Lines that state what an earlier build stored or wrote: `apps/desktop/test/ledger.test.ts:204-206`, `apps/desktop/test/last-look.test.ts:190`, `:341`, `:361-362` and `:385-389`, `apps/desktop/test/repositories.test.ts:183` and `:198-199`, and `apps/desktop/test/chain-records.test.ts:44`, which hands the refused verdict word `sealed`.
- Lines on the earlier root: `apps/desktop/test/view.test.ts:820-822`, `:3535-3538` and `:5400-5431`, and `apps/desktop/test/heavy-run.test.ts:250` and `:256`, which hold `frame/questions.md` Q12's answer.
- `apps/desktop/test/role-bundle.test.ts:275-281` and `:327`, which assert that the bundle names none of the plugin's `seal` commands and no "seal mark".
- `apps/desktop/test/rerun-unstarted.test.ts:144` and `apps/desktop/test/fixtures/rerun-unstarted/github.json:121`, which stand for this repository's own check `seal`, posted by `.github/workflows/owlery-seal.yml`.
- `apps/desktop/test/model-stand-in.ts:119`, where `closeAllConnections` holds the letters of the word.

Those rows list files and not lines. So a file added for one true line hides every other line of it from the search, as `chain.test.ts`, listed for the earlier trailer, hides its 239 other lines. The search is a sample of finding 1's class, and finding 1 states how its list was made.

## Findings

### 1. Case titles, helper names and comments across `apps/desktop/test/` still call today's inspection a seal and the inspector a sealer, which *Scope* item 4 renames and the first acceptance search refuses

```seal
severity: must
location: `apps/desktop/test/chain-run.ts`, `apps/desktop/test/chain-command-run.ts:89-101`, `apps/desktop/test/inspection-state.test.ts`, `apps/desktop/test/inspection-sheet-records.test.ts`, `apps/desktop/test/round-record.test.ts:18-280`, `apps/desktop/test/view.test.ts:1486-2454`, `apps/desktop/test/view.test.ts:5535-5588`, `apps/desktop/test/role-bundle.test.ts:267-362`, `apps/desktop/test/role-bundle.test.ts:520`, `apps/desktop/test/approval-line.test.ts:203-294`, `apps/desktop/test/chain-records.test.ts:3`, `apps/desktop/test/claude-adapter.test.ts:877`, `apps/desktop/test/pane-chain.test.ts:26`, `apps/desktop/test/pull-request.test.ts:152`, `apps/desktop/test/repositories.test.ts:188`, `apps/desktop/test/themes.test.ts:73-79`, `apps/desktop/test/work-item-form.test.ts:162-181`, `apps/desktop/test/last-look.test.ts:31`, `apps/desktop/test/last-look.test.ts:357-358`, `apps/desktop/test/screenshots.test.ts:262-969`, `apps/desktop/test/role-session.test.ts:6-114`, `apps/desktop/test/inspection-sheet-view.test.ts:31-246`, `apps/desktop/test/gate.test.ts:203-241`, `apps/desktop/test/decisions-and-questions.test.ts:56-166`, `apps/desktop/test/decision-record.test.ts:69-120`, `apps/desktop/test/decision-record.test.ts:550`, `apps/desktop/test/chain.test.ts`, `apps/desktop/test/pr-check.test.ts`, `apps/desktop/test/daemon.test.ts`, `apps/desktop/test/chain-command.test.ts`, `apps/desktop/src/daemon/chain.ts:1232-1234`
evidence: executed `git grep -n -i 'seal' -- apps pr-check docs README.md README.ko.md TRADEMARKS.md .github ':!.github/workflows/owlery-seal.yml' | grep -v -i 'agenticseal'`, 820 lines, 224 outside the row's files; executed `git grep -n -i guarantee -- apps pr-check`; read `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/design.md:66`, `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/design.md:110`, `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/plan.md:28`, `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:40-42`, `apps/desktop/test/round-record.test.ts:18-19`, `apps/desktop/test/role-bundle.test.ts:515-521`, `apps/desktop/src/daemon/chain.ts:1195-1240`
```

Why it matters: *Scope* item 4 says that the modules, their exports, their comments and their cases are renamed with the role and the stage (`frame/design.md:66`). The plan rejected leaving the code's identifiers, on the ground that "each later search for the seal's words prints the identifiers, and nobody can tell a leftover form from a leftover name" (`frame/plan.md:28`). The acceptance row "The product holds the seal's vocabulary only where this design keeps it" (`frame/design.md:110`) fails at the target: the search prints 224 lines outside its files. Once the row's list grows by the lines *The acceptance searches* names, 185 remain. Each of them names today's concept by the earlier word.

- Helpers and constants: `sealedBranch` and `unsealed` of `inspection-state.test.ts` and `inspection-sheet-records.test.ts`; `SEALED`, `runsSeal`, `_seal` and `SEAL_PASSED` of `view.test.ts`; `sealsOf` of `approval-line.test.ts`; `SEAL_REDS` of `themes.test.ts`; `heldSeal` of `decisions-and-questions.test.ts`; `AFTER_THE_SEAL`, `unsealed` and `sealOfBroken` of `screenshots.test.ts`; the variable `sealer` of `role-bundle.test.ts:346`; and `seal` of `chain-command-run.ts:99`.
- A helper whose comment is false: `round-record.test.ts:18` says "A `seal` block from its lines", and the helper `sealed` at `:19` writes a fence of info `iadd`.
- Case titles: `claude-adapter.test.ts:877` ("a proofer, a sealer and the orchestrator"), `pane-chain.test.ts:26` ("a branch takes its seal from it"), `role-bundle.test.ts:267`, `:271`, `:288` ("its one seal block"), `:299`, `:331` and `:362`, `round-record.test.ts:103`, and `work-item-form.test.ts:162`.
- Comments and fixture words: `chain-run.ts:4-5`, `:294`, `:382`, `:423`, `:459-496` and `:638`; `chain-command-run.ts:89-91`; `chain-records.test.ts:3`; `pull-request.test.ts:152`; `role-session.test.ts:6`, `:34`, `:43`, `:105` and `:114`; `gate.test.ts:203-241` ("Sealed work" and "the sealer's verdict"); `last-look.test.ts:31` (`by: "sealer"` in today's look) and `:357-358`; `repositories.test.ts:188` ("The sealer sealed"); `decision-record.test.ts:69-120` and `:550`; `role-bundle.test.ts:520`, which writes `name: seal` into the fixture's `owlery-inspection.yml`; and in the product's own code `chain.ts:1232-1234`, "and a seal now is".

The same class stands in the files the row lists for another reason. `chain.test.ts` holds 239 lines of the search that are not the earlier trailer, such as the case at `:186` "is the seal, on the gate's commit" and the constant `NAME` at `:76`. `pr-check.test.ts`, `daemon.test.ts` and `chain-command.test.ts` hold more. The search does not reach the word guarantee, and `git grep -n -i guarantee -- apps pr-check` lists its lines: `GUARANTEE` and `guaranteeAt` of `chain.test.ts`, `guaranteed` of `pr-check.test.ts` and `GUARANTEE` of `inspection-state.test.ts:160` among them (`gaps.md:40`). The list above was made from what the two searches print, so it is a sample: a title that says broken for lapsed escapes both, and the word broken also has meanings that are not the seal's.

`gaps.md:40` leaves this to the orchestrator, on the ground that a title is text no reader of the product meets. The frame answers that ground with its rejected alternative, and the row fails without the rename. The other way out is a fold: the orchestrator changes *Scope* item 4, the plan's rejected row and the acceptance row to keep these names. A fix pass cannot make that change.

The repair renames each instance, runs each changed file, and grows the two rows' lists by the lines *The acceptance searches* names. A rename changes no behaviour, so it owes no new case and no mutation run (`skills/verify/SKILL.md` *The narrow command still has to be able to fail*). The built-app files among the list (`screenshots.test.ts`, `inspection-sheet-view.test.ts`, `decisions-and-questions.test.ts`, `role-session.test.ts`, `approval-line.test.ts`, `work-item-form.test.ts` and the case of `role-bundle.test.ts` that builds the app) run in the one batch the orchestrator runs.

```text
Names, old to new, in every file of the location list and wherever the same name stands:
  sealedBranch -> clearedBranch            unsealed -> uninspected
  SEALED (an Inspection or a WorkItem) -> CLEARED      runsSeal -> runsInspection
  SEAL_PASSED -> INSPECTION_PASSED         _seal -> _inspection
  sealsOf -> inspectionsOf                 SEAL_REDS -> MARK_REDS
  heldSeal -> heldInspection               AFTER_THE_SEAL -> AFTER_THE_INSPECTION
  sealOfBroken -> inspectionOfLapsed       sealer (role-bundle.test.ts:346) -> inspector
  seal (chain-command-run.ts:99, last-look.test.ts:358) -> inspection
  sealed (round-record.test.ts:19) -> block, with its comment "An `iadd` block from its lines"
  GUARANTEE, guaranteeAt, guaranteed -> INSPECTION, inspectionAt, inspected
Words of titles, comments and fixtures:
  "a sealer" / "the sealer" -> "an inspector" / "the inspector"
  "seal" for the inspection, "sealed" for cleared, "broken seal" for a lapsed inspection
    -> "inspection", "cleared", "lapsed inspection"
  "Sealed work" -> "Cleared work";  by: "sealer" -> by: "inspector"
  "The sealer sealed ccccccc" -> "The inspector cleared ccccccc"
  role-bundle.test.ts:520: "name: seal\n" -> "name: inspection\n"
  chain.ts:1232: "and a seal now is" -> "and an inspection now is"
Kept as they stand: the lines listed in this round's section "The acceptance searches".
frame/design.md:110, the first row's list, adds:
  `apps/desktop/src/daemon/daemon.ts` and `apps/desktop/src/daemon/stage-records.ts`, for the earlier
  `Seal-Built-By` trailer; `docs/iadd.md` and `docs/iadd.ko.md`, for the names set aside;
  `apps/desktop/test/ledger.test.ts`, `last-look.test.ts`, `repositories.test.ts` and
  `chain-records.test.ts`, for what an earlier build stored or wrote; `apps/desktop/test/view.test.ts`
  and `heavy-run.test.ts`, for the earlier root; `apps/desktop/test/role-bundle.test.ts`, for the
  plugin's commands the bundle must not name; `apps/desktop/test/rerun-unstarted.test.ts` and its
  fixture, for this repository's own check `seal`; `apps/desktop/test/model-stand-in.ts`, which
  matches by its letters alone.
frame/design.md:111, the second row's list, adds `apps/desktop/src/daemon/adapters/claude-roles.ts`,
  for the taken documents that still name AgenticSeal's commands.
```

```seal
verdict: fixed 8d37e899
answer: The pass renamed by the round's map every line that the first search and `git grep -n -i guarantee -- apps pr-check` printed at the target in the files of `apps/desktop/test/` that `8d37e899` changes, leaving the lines *The acceptance searches* lists, and rewrote `chain.ts#chainOf`'s comment to say a later commit lapsed that inspection. The list was made from the two searches' output and from `git grep -n -i -E 'agentic-?seal' -- apps/desktop/test apps/desktop/src` filtered to lines that also hold a seal word, which found two titles the first search hides because they hold AgenticSeal (`pr-check.test.ts:644` and `:938`), both renamed; it is a sample, since the word broken for a lapsed inspection is outside both searches and the map, and `gaps.md` *Not done* names that part with its command. Beyond the map: `sealing` of `pr-check.test.ts#check` became `inspecting`, the flag it passes; `broken` of `daemon.test.ts`'s inspection cases became `lapsed`; `history`'s option `seal` of `pr-check.test.ts:776` became `inspection`, the key `commitInspection` reads and the histories already passed; the work item title "Sealed work" became "Cleared work", with the names it makes (`1795388700-cleared-work`); "Kept under seal" became "Kept under the earlier root"; `decision-record.test.ts:550` writes "# The project's own notes"; the subcommand in `chain-command.test.ts:322`'s title is `inspect`; `workflowName` in the stand-ins of `chain.test.ts` and `daemon.test.ts` is `inspection`, the workflow's `name:`. The changed TypeScript files passed `tsc` through a scoped `tsconfig` in the builder's scratch, executed. Each changed unit file passed alone under `pnpm --filter @owlery/desktop run test test/<a>.test.ts`: chain-records 4, claude-adapter 107, decision-record 65, gate 18, inspection-sheet-records 7, inspection-state 12, last-look 23, pane-chain 7, pull-request 28, record-blocks 15, repositories 45, round-record 11, themes 17, view 612, chain-command 26, pr-check 26, chain 179, daemon 440 cases, executed; `role-bundle.test.ts` passed 23 of 23 as a built-app file after `node build.mjs`, executed. The other built-app files the pass changed (`approval-line`, `decisions-and-questions`, `inspection-sheet-view`, `role-session`, `screenshots`, `work-item-form`) are unverified, and `gaps.md` names the orchestrator's batch. The first search, run again at `f8c1d3f4`, prints these lines alone, each with its reason: `records-migration.ts` and `records-migration.test.ts`, the earlier forms; the earlier `Seal-Built-By` trailer at `chain.ts:88`, `daemon.ts:4058`, `stage-records.ts:336`, `chain.test.ts:3122` and `:3127`; the earlier `Seal-Routing` trailer at `chain_check.py:13`, `:2163` and `:2185` and `pr-check.test.ts:135`, `:137` and `:144`; what an earlier build stored or wrote at `chain.ts:1165`, `:1166`, `:1174`, `:1176`, `:1198`, `:1201`, `:1203`, `:1205`, `:1206`, `:1211`, `:1231` to `:1233`, `:1239` and `:1256`, `chain.test.ts:811`, `:812`, `:818`, `:879`, `:886` to `:889`, `:3195` and `:3207`, `last-look.test.ts:190`, `:341`, `:361`, `:362`, `:385` and `:389`, `ledger.test.ts:204` and `:206`, `repositories.test.ts:183`, `:198` and `:199`, and `chain-records.test.ts:44`; the fence that is no block at `record-blocks.test.ts:82`; the earlier root at `chain.test.ts:1569` and `:1575`, `chain-command.test.ts:615`, `:624`, `:636`, `:639` and `:641`, `daemon.test.ts:2071`, `:2074` to `:2076`, `:2083`, `:2089`, `:2091` to `:2093`, `:2095` and `:2102`, `pr-check.test.ts:202`, `:203` and `:233`, `records-dialog.test.ts:157`, `:159`, `:161`, `:162`, `:178` and `:181` to `:183`, `records-place.test.ts:20`, `:271`, `:272`, `:1082` and `:1086`, `heavy-run.test.ts:250` and `:256`, and `view.test.ts:820`, `:822`, `:3535`, `:3538`, `:5400`, `:5409`, `:5411` to `:5413`, `:5415`, `:5424` and `:5428` to `:5431`; the plugin's commands no text may name at `role-bundle.test.ts:275`, `:276`, `:281` and `:327` and `pr-check.test.ts:935` and `:958`; this repository's own check `seal` at `rerun-unstarted.test.ts:144` and `fixtures/rerun-unstarted/github.json:121`; the letters alone at `model-stand-in.ts:119`; the names set aside at `docs/iadd.md:57` and `docs/iadd.ko.md:57`; and in the documents the row lists, `docs/roadmap.md:22`, `:52` to `:56` and `:87` and `docs/roadmap.ko.md:22` and `:53`, the releases' rows and this repository's own check's pin, and `docs/architecture.md:167`, `:212`, `:214`, `:217`, `:226`, `:229`, `:230`, `:232`, `:233`, `:292` and `:533` and `docs/architecture.ko.md:167`, `:214`, `:226`, `:229`, `:230`, `:233`, `:292` and `:533`, the skill's name before the rename, the plugin's side of *What we take from AgenticSeal*, the earlier trailer and a measurement dated 2026-11-17, executed. The guarantee search prints the migration's files, the fixtures of the earlier root in `daemon.test.ts`, `pr-check.test.ts:217` and `view.test.ts`, `workflow.test.ts:106`, the agent contract's platform guarantee and the taken `verify/SKILL.md:119`, each of which `gaps.md` *Not done* names as staying, executed. The rows of `frame/design.md:110-111` are the orchestrator's to write.
location: `apps/desktop/test/record-blocks.test.ts`, `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md`
```

### 2. The pane's skill tells the session to start a stage whose model is null on the session's own model, where the frame, the loader and the bundle's README say null is the CLI's default

```seal
severity: should
location: `apps/desktop/role-bundle/skills/inspection/SKILL.md:72-73`, `apps/desktop/test/role-bundle.test.ts:110`, `apps/desktop/src/daemon/chain-command.ts:241`, `apps/desktop/test/chain-command.test.ts:82`
evidence: executed `git grep -n -e "session's own model" -e "session's own" -e "CLI's own default" -e "CLI's default" -- apps/desktop/src apps/desktop/role-bundle docs/iadd.md docs/architecture.md`; executed `git grep -n -F -e "session's own model" -e "null for the session's own" -e "runs on the session's default" -- apps docs README.md`; read `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/design.md:73`, `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/design.md:173`, `apps/desktop/src/daemon/workflow.ts:55`, `apps/desktop/src/daemon/adapters/claude.ts:124`, `apps/desktop/role-bundle/README.md:19`, `docs/iadd.md:97`, `apps/desktop/role-bundle/skills/inspection/SKILL.md:66-76`, `apps/desktop/test/role-bundle.test.ts:108-111`
```

Why it matters: phase 4 made each stage's model a value of the workflow's files, where `null` is "the CLI's default" (`frame/design.md:173`, *A workflow as data*). The loader's docstring (`workflow.ts:55`), the adapter's (`claude.ts:124`), the bundle's README (`README.md:19`) and `docs/iadd.md:97` say the same. Phase 4 also added this sentence to the pane's skill: "Start a subagent of the type `agent` names, on the model `model` names where it names one, and on your session's own model where it is null" (`SKILL.md:72-73`). The pane's session reads that sentence and acts on it. A session that takes it literally names its own model at each spawn of the proofer and the crafter, whose stages name `null`. Before phase 4 the skill named no model, so those subagents ran on the default the subagent tool gives. That default is the session's model only where the person set no default model for subagents. So the sentence can change the model a pane's proofer and crafter run on, and *Scope* item 11 says that what a chain does is unchanged. The docstring of `chain-command.ts#handed` (`:241`) says "null for the session's own", and the comment at `chain-command.test.ts:82` says "the session's default". The case at `role-bundle.test.ts:110` pins the skill's sentence word for word.

The searches above read the fact's words, so they are a sample under contract rules 12 and 19. They printed the four places the repair covers. The other lines they printed say "the CLI's default" and stay. The repair:

```markdown
apps/desktop/role-bundle/skills/inspection/SKILL.md:70-74, in place of "Start a subagent of ... where it is null.":

rules file, and `prompt`, the path of the stage's prompt. Start a subagent of
the type `agent` names, on the model `model` names where it names one, and
with no model where it is null, so that it runs on the model your subagent
tool gives it by default. Tell it to read the file at
```

```ts
// apps/desktop/test/role-bundle.test.ts:110
expect(flat("skills/inspection/SKILL.md")).toContain("Start a subagent of the type `agent` names, on the model `model` names where it names one, and with no model where it is null, so that it runs on the model your subagent tool gives it by default.");

// apps/desktop/src/daemon/chain-command.ts:241, in the docstring of `handed`
 * model the stage names or null for the CLI's default, and the two paths.

// apps/desktop/test/chain-command.test.ts:82
    // The round's stage names no model, so the subagent runs on the default the subagent tool gives.
```

```seal
verdict: fixed 80e8b109
answer: The paste-ready fix was read against `frame/design.md:173` and `:198`, where a stage's `null` model is the CLI's default, and against `workflow.ts:55`, `claude.ts:124` and the bundle's `README.md:19`, which say the same; for a pane's subagent that default is the one its tool gives when the spawn names no model, so the fix was applied as written. `skills/inspection/SKILL.md:72-74` now tells the session to start the subagent with no model where `model` is null, so that it runs on the model the subagent tool gives it by default; the docstring of `chain-command.ts#handed` says "null for the CLI's default", and the comment of `chain-command.test.ts:82` says the subagent runs on the default the subagent tool gives. `role-bundle.test.ts:110` pins the new sentence. It was seen red first: with the new pin and the old sentence, `node build.mjs` then `OWLERY_BACKGROUND=1 pnpm run test:app test/role-bundle.test.ts` in `apps/desktop` failed 1 of 23, at `role-bundle.test.ts:110:48`, executed; with the new sentence the same two commands passed 23 of 23, executed. `pnpm --filter @owlery/desktop run test test/chain-command.test.ts` passed 26 of 26, executed. The finding's two searches, run again after the last fix commit: the second prints nothing; the first prints `chain-command.ts:241`, now "the CLI's default", the lines that say "the CLI's default" (`claude.ts:124`, `role-bundle/README.md:19`, `workflow.ts:55`, `docs/iadd.md:97` and `:103`), which stay, and lines where "the session's own" names a session's own id, account, folder, streams or input, which are another fact and stay, executed.
```

### 3. The pull request check's comment on `OWL_CHAIN` names `inspection-records.ts#OWL_CHAIN`, which phase 4 moved to `workflow.ts`

```seal
severity: should
location: `pr-check/skills/code-review/scripts/chain_check.py:2622-2623`
evidence: executed `git grep -n -e "inspection-records.ts#OWL_CHAIN" -e "inspection-records#OWL_CHAIN"`, which printed `pr-check/skills/code-review/scripts/chain_check.py:2623` alone; executed `git grep -n "OWL_CHAIN" -- apps pr-check`; read `apps/desktop/src/daemon/workflow.ts:31-32`, `apps/desktop/src/daemon/inspection-records.ts:15`, `apps/desktop/src/daemon/inspection-records.ts:26`
```

Why it matters: `0541b7b0` moved `OWL_CHAIN` from `inspection-records.ts` to `workflow.ts` (`trail/phases/phase-4.md:23`). The constant's docstring at `workflow.ts:31` points to `chain_check.py#OWL_CHAIN`, and `inspection-records.ts:15` now names `workflow.ts#OWL_CHAIN`. The check's comment still sends a reader who keeps the two names in step to `inspection-records.ts`, which no longer defines it. Contract rule 19 asks that the commit that moves a fact remove what stood on the old one, a comment among it. The search lists each statement of the old coordinate, and it printed this one alone.

```python
# The name of the Owl Chain's workflow, as a verdict block's `workflow:` line
# names it (`apps/desktop/src/daemon/workflow.ts#OWL_CHAIN`).
OWL_CHAIN = "owl-chain"
```

```seal
verdict: fixed caa37bd0
answer: The comment at `chain_check.py:2623` now names `apps/desktop/src/daemon/workflow.ts#OWL_CHAIN`, where `workflow.ts:31-32` defines the constant. The finding's search `git grep -n -e "inspection-records.ts#OWL_CHAIN" -e "inspection-records#OWL_CHAIN"`, run again after the last fix commit, prints this round record's own finding alone, which stays, executed. `pnpm --filter @owlery/desktop run test test/pr-check.test.ts`, which runs the check, passed 26 of 26, executed.
```

### 4. `docs/iadd.md` names the roles that stay "as before" without the tracer, which #322's names table keeps unchanged

```seal
severity: should
location: `docs/iadd.md:39`, `docs/iadd.ko.md:39`
evidence: executed `gh issue view 322 --json body`, its *Concept and names* table, row "framer, crafter, proofer, orchestrator, tracer"; executed `git grep -n -i "tracer" -- docs README.md apps/desktop/role-bundle`; read `docs/iadd.md:5`, `docs/iadd.md:39`, `docs/iadd.ko.md:39`, `apps/desktop/role-bundle/README.md:38`
```

Why it matters: the caller asked whether `docs/iadd.md` states the concept as #322's *Concept and names* gives it. It does, but for this one row. The issue's names table reads "framer, crafter, proofer, orchestrator, tracer | unchanged". `docs/iadd.md:39` reads "framer, crafter, proofer and orchestrator, as before, and the inspector", and the Korean edition drops the tracer the same way. The words "as before" claim the earlier set, and the earlier set holds the tracer. `docs/iadd.md:5` says that the plugin writes its own definition under the same names and that the owner compares and merges the two. That comparison, step 2 of the issue's *When it lands*, would meet a difference here that nobody decided. The role bundle ships no tracer (`role-bundle/README.md:38`), and that is a fact of the Owl Chain, not of the method's names. Issue #323's rule 34 lists Owlery's roles as framer, crafter, proofer and inspector, and it names no tracer either. That rule states the app's roles, not the method's names. No test pins the row.

```markdown
docs/iadd.md:39
| The roles | framer, crafter, proofer, orchestrator and tracer, as before, and the inspector, the final role, which inspects. Owlery's role bundle holds no tracer |

docs/iadd.ko.md:39
| 역할 | framer, crafter, proofer, orchestrator, tracer는 그대로이고, 마지막 역할은 검수하는 검수자(`inspector`)입니다. Owlery의 역할 묶음에는 tracer가 없습니다 |
```

```seal
verdict: fixed f8c1d3f4
answer: The row at `docs/iadd.md:39` and `docs/iadd.ko.md:39` now names the tracer among the roles that stay as before, and says that Owlery's role bundle holds none, as the paste-ready fix wrote it; the row stays one table row in each edition. The docs leg of the broad gate, the loop over `docs/*.md` and `README.md` that compares each edition's counts of headings and of table rows, then the search for 도장, exited 0 after the last fix commit, executed. The finding's search `git grep -n -i "tracer" -- docs README.md apps/desktop/role-bundle`, run again, prints the two rows, `role-bundle/README.md:38`, which says the bundle ships no tracer definition, and two taken documents of the bundle that name the plugin's tracer, which stay, executed.
```

## Confirmations

```seal
confirms: round-4#1
```
What holds: the paragraph of `gaps.md:36`, which stood at `gaps.md:28` at round 4's target, now carries round 4's paste-ready text word for word, from "What the drop costs:" to "that a person or a session wrote by hand", read. Its last sentence places the open question on issue #343, where the paste-ready text named the orchestrator. `gh issue view 343` shows that issue open, titled "fix: the migration rewrites an example seal block in a hand-written record's prose into a real block", in the milestone `hardening: boundaries and edge cases`, executed. Round 4's evidence search, run again at the target, no longer prints the words "with no entry yet". It prints the paragraph itself, the docstring at `records-migration.ts:327`, the case's comment at `records-migration.test.ts:483`, and the round records, which stay, executed. `c41f1613` changes `gaps.md` alone, read.

What matched: the Owl Chain does what it did before phase 4, read. The documents each stage carries are the rows `AT_THE_STAGE` held at `67902de0` (`git diff 67902de0..011f7298 -- apps/desktop/src/daemon/adapters/claude-roles.ts`), now the `documents` of `workflows/owl-chain.json` and `inspectors/owl-chain.json`. The agent is `owlery:` with the definition's `name:`, and each of the four definitions names its role (`role-bundle/agents/*.md`). The rules head names `stage.agent`, which is `agents/<role>.md` for each pair. The tools still come from the pair's grant (`claude-roles.ts#toolsOf`). The inspector's role session was launched on `--agent owlery:inspector`, whose built definition held `model: opus`. It is now launched with the same agent, whose built definition again holds `model: opus` (`build.mjs:72-82`, `workflow.ts#writeDefinitionModels`), and with `--model opus` on its command line (`claude.ts:116`). The three other stages name `null` and get no `--model`. A pane's inspector subagent finds `model: opus` in the built definition whatever its tool takes, which is `frame/questions.md` Q8's default. `inspect --model` now takes the model `owed` printed, which is `opus` for the inspector, where it took the definition's `opus` before. Finding 2 is the one sentence that can change a pane's proofer and crafter. Q9, whether `--model opus` names the same model in the session's first line, stays open, and `gaps.md` names the orchestrator.

What matched: the loader's four callers are the ones `trail/phases/phase-4.md:10-15` names (`git grep -n "loadWorkflow("`, executed). `main.ts:44` loads the bundle beside the daemon's script before anything is made, and a refusal ends `main` through the `catch` at `:123-127` with its message as the log's last line, read. The plan's search `git grep -n 'AT_THE_STAGE\|^model:' -- apps/desktop/src apps/desktop/role-bundle/agents` printed nothing, executed. The loader refuses each form `frame/design.md` *What this version reads of the model* names: another skeleton, a missing or unknown stage, and an inspector module other than `owl-chain`, read in `workflow.ts:194-208` and held by `workflow.test.ts:56-118`. The decisions `trail/phases/phase-4.md:19-28` declares beyond the frame all narrow what the loader takes. They are the role held to the skeleton, a single check, a single provider, a model with no white space, and a strict form. Each keeps a file from launching a definition under a grant that is not its own, or from naming what no code runs, so each holds against *What holds for every workflow*, read.

What matched: `docs/iadd.md` states #322's *The concept*, its five principles, *How it differs*, the naming rule and every name set aside, word for word or in the same sense, read against the issue's body, but for finding 4. It adds that IADD binds the judgment to one commit anyone reads on the pull request, which the concept's own paragraph states. Issue #323's rules 31 to 34 and 39 stand where `trail/phases/phase-5.md:23-29` says, read: rule 31 at `docs/iadd.md` *Workflows* and `docs/product.md:11`; rule 32 at `docs/iadd.md` *The concept* and *The principles*; rule 33 at `docs/iadd.md` *Names*; the 2026-11-28 part of rule 34 at `docs/name.md:15`; and the missing part of rule 39 at `docs/iadd.md:5` and `docs/architecture.md:201`.

What matched: the sentences on this repository's own process keep the plugin's names, read. `docs/architecture.md:203` keeps `seal/`, `owlery-seal.yml`, the check `seal` and the pin at 0.1.0. `docs/roadmap.md` keeps `seal settle --apply` in its settle bullet, the plugin's seal in ground 4, and the check `seal` in the first done criterion. `.github/workflows/owlery-seal.yml:36` pins `v0.1.0`, executed with `grep`. The rows of `docs/roadmap.md` *Releases and the tracker* for 0.0.1 to 0.1.0 are unchanged in both editions, and so is the row of milestone 2 but for its one link, which now opens *The inspection*, read in the word diff. `docs/product.md:63` says "The inspection's record shows the result as the fields below", where it named the plugin's `seal stamp`. That holds: the inspection sheet shows the inspection's record under the labels Tree, Base, Item, Gate and Rounds (`apps/desktop/src/shared/inspection-sheet.ts:288-292`), read.

What matched: `CLAUDE.md:16` holds at the target. It names the plugin's step "the seal", which this repository's work items still take. The four workflows it names stand under `.github/workflows/`, executed with `ls`. `owlery-seal.yml` starts from a pull request's events, read at `:11-14`. No commit of this branch changes `CLAUDE.md` (`git log -- CLAUDE.md` names `a75f4581` alone), executed.

What matched: `7dd65599` holds. `apps/desktop/package.json` reads 0.2.0 at the target, read. `git log -- apps/desktop/package.json` names `a75f4581`, #323's pull request #341, and the merge `505892e7` that brought it here, executed. The plan's row 5 and *Operational impact* now say so, and `frame/questions.md` Q1's answer says the same, read.

What matched: `changelog.md` tells a person what ships, read against the code and the frame. Each bullet names a behaviour this branch builds. The check's titles match `chain_check.py:2575-2580`. The inspector still runs on `opus`, passed with `--model`, and the daemon's start stops on a refused bundle, as `main.ts:44` and its `catch` do. The settle command no longer takes `--apply`. The last bullet says what stays in this repository, which `docs/architecture.md:203` states.

What matched: each English and Korean pair says the same in what this round read. That is `docs/iadd.md` whole, the README's added lines whole, and the sampled paragraphs above. The Korean editions use Q2's words, and none uses 도장. The anchors `docs/iadd.ko.md` uses (`product.ko.md#검수가-보장하는-것과-보장하지-않는-것`, `README.ko.md` *GitHub의 검수 검사*, `architecture.ko.md#기록은-저장소에-커밋합니다`) open headings that stand, read. Every `check:` line of `docs/` and the READMEs names a file that stands, executed by a loop over the lines.

A case gap, with no finding: `workflow.test.ts:45` asserts that `OWL_CHAIN` and `SKELETON` equal their own literal values, which pins no behaviour the case beside it does not already hold.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate at `7dd65599`: the whole suite, the typecheck and the documents' editions. The suite is `unverified`. This round ran no case | the repository's `Broad gate` key of `seal/config.json` | the orchestrator, in the broad gate it runs alone once the rounds settle |
| The orchestrator's whole built-app run after phase 4, reported as 17 files and 251 cases passed. This round read the claim and ran nothing | `apps/desktop/test/` | the orchestrator, whose run it is |
| `role-bundle.test.ts` and `themes.test.ts` after phase 5, which `gaps.md` names as not run | `apps/desktop/test/` | the orchestrator, in its next run of those files |
| The hand checks of `frame/questions.md` Q8 and Q9, through `pane:run` and `role:run`, which spend the owner's usage | `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/questions.md` | the orchestrator |
| Phase 4's seen-red account and its mutants (`trail/phases/phase-4.md:36-44`), read and not run again | `apps/desktop/src/daemon/workflow.ts` | the orchestrator, who decides whether a run of them is owed |
| The Korean editions of `docs/architecture.md`, `docs/product.md`, `docs/roadmap.md`, `docs/design.md` and `docs/name.md` beyond the paragraphs this round sampled, and the paragraphs of `docs/architecture.md` whose word diff was cut at 1,500 characters | `docs/` | the next round or the inspector, which reads the documents whole |

## Probes

| Command | Result |
|---|---|
| The first acceptance search, `git grep -n -i 'seal' -- apps pr-check docs README.md README.ko.md TRADEMARKS.md .github ':!.github/workflows/owlery-seal.yml' \| grep -v -i 'agenticseal'`, at `7dd65599`, its output kept in the round's scratch directory | 820 lines, 224 in files the row does not list, in 31 files |
| The second acceptance search, `git grep -n -i 'agenticseal\|agentic-seal' -- apps/desktop/src` | 10 lines: 8 in `records-migration.ts`, and `adapters/claude-roles.ts:74` and `:101` |
| `git grep -n 'AT_THE_STAGE\|^model:' -- apps/desktop/src apps/desktop/role-bundle/agents` | no line, exit 1 |
| Round 4's evidence search, run again | the lines named under `## Confirmations`, and no line holding "with no entry yet" |
| A loop over every `check:` line of `docs/`, `README.md` and `README.ko.md` that tests each named file | no file missing |
