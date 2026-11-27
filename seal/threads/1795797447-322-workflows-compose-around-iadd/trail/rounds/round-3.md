# Review round 3: 1795797447-322-workflows-compose-around-iadd

```seal
target: 841519da against origin/release/v0.2.0
```

This round does three things. It answers the three findings round 2 closed. It reviews phase 3 (`b7ec8014`, `35802536`, `3dcffb1f`, `63aca792`, `c445bf2b`, `02e85f05`), which no round had read. It also reviews the orchestrator's frame corrections in `acee1116`, round 2's fix pass (`48dcb809`, `c54b4db7`, `cf5f3953`, `9ff2a3b7`, `e261082d`, `b7830aa2`), the fix pass after the orchestrator's built-app run (`14b201e6`, `f55b93b1`) and the repair `155f7be6`. The round read a `git clone --no-local` of the repository checked out at `841519da`, under the proofer's scratch directory, and never the branch's worktree. The base is `origin/release/v0.2.0` at `a75f4581`. No `seal/parity.json` is declared, so no parity comparison is owed. `seal/config.json` sets `Record language` and `Commit and pull request language` to English. The work item holds no `changelog.md`, `pr.md` or `pr.<lang>.md` at the target.

Carried from earlier rounds rather than established again: the departure that the migration also rewrites the role and stage cells of `trail/refusals.md` and the `by:` line of `decisions.md` (`trail/phases/phase-1.md:12`, which round 1's finding 3 settled), and the coordinates of the stored kinds (`apps/desktop/src/daemon/chain.ts:1166`). Every verdict below was reached at this target.

Read whole at the target: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `trail/phases/phase-3.md` and `trail/rounds/round-2.md`. `trail/rounds/round-1.md` was read for its coordinates: its opening paragraphs, each finding's heading and its `location:` and `verdict:` lines. `trail/phases/phase-1.md` was read at lines 8 to 14, and `trail/phases/phase-2.md` was not opened again. Read whole in the code: `apps/desktop/src/daemon/records-migration.ts` at the target, and the diff `7622b959..841519da` of every file under `apps/desktop/src/` and `docs/`, of `apps/desktop/role-bundle/skills/inspection/SKILL.md`, and of the round records and frame files. That diff prints 5,876 lines. The caller's figure of about 24,000 lines was not reproduced. The figure of 22,409 lines in `gaps.md:16` is the output of `seal range`, which is another measure. Read whole in the tests: the diffs of `chain-command.test.ts`, `chain.test.ts`, `heavy-run.test.ts`, `pr-check.test.ts`, `records-dialog.test.ts`, `decisions-and-questions.test.ts` and `terminal-basics.test.ts`, and `records-migration.test.ts` at lines 1 to 175 and 236 to 438. Sampled: the diffs of `daemon.test.ts`, `view.test.ts`, `records-place.test.ts`, `hooks.test.ts`, `pane-chain.test.ts`, `settle.test.ts`, `repositories.test.ts`, `accounts.test.ts`, `pane-session.test.ts` and `screenshots.test.ts`. Each was read through the titles of the cases it removes and adds and a count of the `expect(` lines it removes and adds, and the removed cases were checked to hold only the removed mechanisms. `records-migration.test.ts` lines 176 to 235 were read through their case titles. `## Not judged` names what stays unread.

The axes walked, beyond the table of `skills/code-review/SKILL.md`: the two places of a root in the earlier form, `seal/` and `agentic-seal/`, and a project's own `seal/` beside the second; a record of IADD's form read for the earlier form; what the move removes beyond the files it names; the agent that runs `migrate` on the sentence's word; this repository's own root and workflow; and whether a case changed to reach its condition still fails without the guard it names.

## Findings

### 1. In a repository whose own `seal/` sent the plugin's records to `agentic-seal/`, `migrate` on a branch that kept its records there moves the project's own `seal/` into `iadd/` and removes it

```seal
severity: must
location: `apps/desktop/src/daemon/records-migration.ts:416`, `apps/desktop/src/daemon/records-migration.ts:421`, `apps/desktop/src/daemon/records-migration.ts:463`, `apps/desktop/src/daemon/records-migration.ts:509`, `apps/desktop/src/daemon/records-migration.ts:335-338`, `apps/desktop/test/records-migration.test.ts`
evidence: executed the probe `test_tmp_round3.test.ts` of `## Probes`, its two cases on a project's own `seal/`; read `apps/desktop/src/daemon/records-migration.ts:32-33`, `apps/desktop/src/daemon/records-migration.ts:131-140`, `apps/desktop/src/daemon/records-migration.ts:411-421`, `apps/desktop/src/daemon/records-migration.ts:463`, `apps/desktop/src/daemon/records-migration.ts:509`, `apps/desktop/src/daemon/records-migration.ts:534`, `apps/desktop/test/records-migration.test.ts:147-153`, `apps/desktop/test/records-migration.test.ts:313-345`, `apps/desktop/role-bundle/skills/inspection/SKILL.md:49-58`
```

Why it matters: `EARLIER_ROOTS` names `agentic-seal` as the root the plugin took "where a project's own `seal/` stood" (`records-migration.ts:32-33`). After the main checkout's move, `agentic-seal/` is gone and `seal/` is the project's own folder. A work item's branch that added `agentic-seal/threads/2-y/` and then merged the moved base keeps that directory, as the probe of `frame/design.md:34` says. `earlierRecordsSays` finds it: it reads each earlier root's `threads/` for a `routing.md` that names the branch (`:131-140`), and its sentence sends the session to `migrate`. The pane's skill tells the session to run it (`skills/inspection/SKILL.md:49-58`). But `planned` takes as the kept root the first of `EARLIER_ROOTS` under which the commit holds anything (`:416`), which is the project's own `seal/`, and moves every file below it (`:421`). The commit then removes the whole folder, since `removed` holds `from` (`:509`, `git rm -r` at `:534`).

The probe built this repository twice. Where the project's `seal/` holds a `README.md` of its own, the plan is blocked with "The commit this checkout stands at holds iadd/README.md already, where the move puts a file of seal/", which names neither the work item's records nor the cause. Where it holds `seal/notes.txt` alone, the plan is not blocked, and the commit is `A iadd/notes.txt` and `D seal/notes.txt`. The work item's `agentic-seal/threads/2-y/` stays where it was, and `earlierRecordsSays` still refuses the chain after the commit. No case holds this: `records-migration.test.ts:147-153` reads only `earlierRootOf` at `agentic-seal/`, and the kept-root case at `:313` uses `seal/`.

The repair has the plan read the kept root as `earlierRecordsSays` reads it, by its `threads/`, move only what stands there, and remove only the files it moves:

```ts
// apps/desktop/src/daemon/records-migration.ts, in planned(), in place of :416-417
// A branch keeps the earlier root's `threads/` alone, as `earlierRecordsSays` reads it, and a project's own `seal/` beside IADD's root is no part of it.
const keptByBranch = rooted ? (EARLIER_ROOTS.find((root) => [...inCommit.keys()].some((held) => held.startsWith(`${root}/threads/`))) ?? null) : null;
const from = whole ?? keptByBranch;
// What the move takes: the whole earlier root, or the `threads/` a branch kept of it.
const moving = from === null ? null : whole === null ? `${from}/threads` : from;

// in place of :421
const below = moving === null ? [] : [...inCommit.keys()].filter((path) => path.startsWith(`${moving}/`));

// in place of the pathspec of :463
const status = await git(folder, ["--no-optional-locks", "status", "--porcelain=v1", "-z", "--no-renames", "--untracked-files=all", "--", ...(moving === null ? [] : [moving]), ROOT, EARLIER_WORKFLOW, WORKFLOW]);
```

```ts
// apps/desktop/src/daemon/records-migration.ts, in migrateRecords(), in place of :508-509
// Each file the plan moves to another path is removed where it stood: each file of the earlier root it moves, and a `guarantee.md` below IADD's root. Nothing else of the earlier root's folder is touched.
const removed = [...plan.moves.filter((move) => move.to !== move.from).map((move) => move.from), ...plan.removes];
```

The same commit rewrites the docstring of `planned` at `:335-338` ("or, where the commit holds IADD's root, the first under which it holds anything") to "or, where the commit holds IADD's root, the first under whose `threads/` it holds a file, of which the plan moves that `threads/` alone", and the docstring of `migrateRecords` at `:481-483` ("each file of the earlier root, each `guarantee.md` below IADD's root and the earlier workflow is removed") to "each file the plan moves to another path and the earlier workflow is removed". The case belongs in `apps/desktop/test/records-migration.test.ts`: a `main` that holds a project's own `seal/` (once with a `README.md` of its own and once without) beside an `agentic-seal/` root, a branch that adds `agentic-seal/threads/2-y/`, the base's move, the branch's merge with `merge.directoryRenames=false`, and then a plan whose `from` is `agentic-seal`, whose moves are the two files of `2-y`, and whose commit leaves the project's `seal/` as it stood.

### 2. A record IADD's form wrote whole, which shows a fence of info `seal` in its prose, reads as a record in the earlier form: the chain refuses the work item with a sentence that says a merge put it there, and `migrate` refuses too

```seal
severity: should
location: `apps/desktop/src/daemon/records-migration.ts:156-164`, `apps/desktop/src/daemon/records-migration.ts:419`, `apps/desktop/src/daemon/records-migration.ts:433`, `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:25`
evidence: executed the probe `test_tmp_round3.test.ts` of `## Probes`, its case of a round record of IADD's form; read `apps/desktop/src/daemon/records-migration.ts:156-164`, `apps/desktop/src/daemon/records-migration.ts:184-191`, `apps/desktop/src/daemon/records-migration.ts:320-329`, `apps/desktop/src/daemon/records-migration.ts:419-442`, `apps/desktop/src/daemon/record-blocks.ts:614-631`, `apps/desktop/test/records-migration.test.ts:249-253`, `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/design.md:34`, `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/design.md:218`, `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:25`
regression: round-2
```

Why it matters: the unit is the reading of a work item's directory under IADD's root for the earlier form, in `earlierRecordsSays` (`:156-164`) and in the plan's `strayed` filter (`:419`, `:433`), which `cf5f3953` of round 2's fix pass added. The frame decides that `migrate` also rewrites records in the earlier form it finds under `iadd/threads/` (`frame/design.md:34`), and says that every reader but the migration reads `iadd/` alone (`:218`). The fix took a record in the earlier form to be any record that `rewrite` changes, and `fencesMoved` changes every fence opener of info `seal` (`:184-191`), which IADD's grammar reads as no block and no notice (`record-blocks.ts:618-631`). So a record of IADD's form that shows an earlier block as an example now reads two ways.

The probe committed, under a moved repository's `iadd/threads/3-z/`, a `routing.md` that names the branch and a round record whose round block opens with `iadd`, and whose prose shows a block of the earlier form in a fence of info `seal`. `earlierRecordsSays` gave "This work item's directory iadd/threads/3-z/ holds records in the form the AgenticSeal plugin wrote, which a merge of a base that moved put there." followed by the sentence that names `migrate`. So `daemon.ts#whyNoChain` and `chain-command.ts#here` refuse the work item. The plan was blocked with "`iadd/threads/3-z/trail/rounds/round-1.md:10`: `Verdict: sealed` opens no `seal` block this record holds". The work item cannot run its chain until a person edits a record that reads right. The `strayed` filter takes every work item's directory under `iadd/threads/`, and not the branch's own alone. So one such record of another work item blocks every branch's `migrate` in the repository. A repository that moved from the earlier form is where its reviewers write about that form. The module already treats the converse as a fault: an earlier record that holds a fence of info `iadd` blocks its plan (`records-migration.test.ts:249-253`). `gaps.md:25` names the mixed record a merge writes, and not this one.

The repair counts a record below IADD's root as the earlier form's only where IADD's grammar reads no block of it and the earlier grammar reads one, beside a `guarantee.md` and a `trail/refusals.md` the move rewrites. A round record and a gate's record of IADD's form open with a block, and one the earlier form wrote holds no block IADD's grammar reads. One function serves both places:

```ts
// apps/desktop/src/daemon/records-migration.ts, after blockKinds
/**
 * Whether a record below IADD's root, by its path below its work item's
 * directory, was written in the earlier form: a `guarantee.md`, a
 * `trail/refusals.md` the move rewrites, or a record of blocks of which
 * IADD's grammar reads none and the earlier grammar reads at least one. A
 * record of IADD's form that shows a fence of info `seal` in its prose reads
 * its own blocks in IADD's grammar, and stays as it is.
 */
function writtenEarlier(inside: string, text: string): boolean {
  if (inside === EARLIER_INSPECTION) return true;
  if (inside === "trail/refusals.md") return refusalsMoved(text) !== text;
  const kinds = blockKinds(inside);
  return kinds !== null && read(text, kinds.now).blocks.length === 0 && readEarlier(text, kinds).got.blocks.length > 0;
}
```

```ts
// apps/desktop/src/daemon/records-migration.ts, earlierRecordsSays, in place of :156-163
// The records the earlier form wrote in the directory, by their path in it; a record IADD's form wrote is not one, whatever fence its prose shows.
const earlier = [EARLIER_INSPECTION, "decisions.md", "trail/gate.md", "trail/refusals.md", ...rounds.map((name) => `trail/rounds/${name}`)].some((inside) => {
  const text = textOf(join(directory, inside));
  return text !== null && writtenEarlier(inside, text);
});

// planned, in place of :432-433
// A file below IADD's root moves only where the earlier form wrote it; the rest is IADD's form.
if (stray && !writtenEarlier(rest.split("/").slice(2).join("/"), before)) continue;
```

The repair changes what `gaps.md:25` says of the mixed record. Its sentence "A `decisions.md`, a gate's run or a round record of that kind blocks the plan with its file named, since the earlier reader reads fewer blocks in it than IADD's does." then reads:

```markdown
A `decisions.md`, a gate's run or a round record of that kind holds blocks IADD's grammar reads, so the move leaves it as it stands and its block in the earlier form stays unread, as an `inspection.md` of that kind does.
```

The docstrings of `earlierRecordsSays` (`:117`) and `planned` (`:343`) say "a record the move rewrites" and "each record there the lines below would rewrite", and the same commit rewrites each to "a record the earlier form wrote (`writtenEarlier`)". The case belongs in `apps/desktop/test/records-migration.test.ts`: a moved repository whose branch commits a round record of IADD's form that shows a fence of info `seal` in its prose, where `earlierRecordsSays` gives null and the plan is blocked with the sentence that there is nothing to move.

### 3. `docs/product.md` and its Korean edition still state the chain choice phase 3 removed, in the bullet on panes and in the row *Plugins on the sealing side*

```seal
severity: should
location: `docs/product.md:24`, `docs/product.md:204`, `docs/product.ko.md:24`, `docs/product.ko.md:204`
evidence: executed `git grep -n -e 'which of the two chains' -e '두 체인 가운데 어느 것을' -e 'enables the AgenticSeal plugin' -e 'AgenticSeal 플러그인을 켜' -- docs README.md README.ko.md TRADEMARKS.md CLAUDE.md apps pr-check`, which printed `docs/product.md:24`, `docs/product.md:204`, `docs/product.ko.md:24`, `docs/product.ko.md:204` and the title of the case `apps/desktop/test/daemon.test.ts:8856`; read `docs/product.md:24`, `docs/product.md:204`, `docs/product.ko.md:24`, `docs/product.ko.md:204`, `seal/threads/1795797447-322-workflows-compose-around-iadd/frame/design.md:251`, `seal/threads/1795797447-322-workflows-compose-around-iadd/trail/phases/phase-3.md:17`, `seal/threads/1795797447-322-workflows-compose-around-iadd/gaps.md:29`
```

Why it matters: `docs/product.md` is a policy document that framers and the orchestrator read for what the product does. Its bullet *The sessions a person drives open in a terminal* still says "One chain seals a repository. So where the person's Claude Code enables the AgenticSeal plugin in a repository on the owl chain, the app asks once for the repository which of the two chains its Claude Code panes run, keeps the answer, and the repository's settings change it." The row *Plugins on the sealing side* of *Open decisions* says "the person chooses which of the two a pane runs, and under the owl chain that one plugin is off in that pane alone". The Korean edition says both at the same lines. Phase 3 removed the question, the setting and the pane's own settings file (`pane-chain.ts#carriedIn` now reads the folder alone). The `## Removes` row names the rule of `docs/architecture.md` *What each session loads* (`frame/design.md:251`), and phase 3 removed that rule in both editions (`phase-3.md:17`). The same fact in `docs/product.md` stayed, and `gaps.md:29`, which hands phase 5 the prose phase 3 left, does not name it. The search reads the choice's own words, so it is a sample under contract rules 12 and 19: a statement of the choice in other words escapes it. The bullet already says "the person's own plugins and skills stay beside it", so the repair removes the sentences of the choice:

```text
docs/product.md:24, remove the two sentences:
  One chain seals a repository. So where the person's Claude Code enables the AgenticSeal plugin in a repository on the owl chain, the app asks once for the repository which of the two chains its Claude Code panes run, keeps the answer, and the repository's settings change it.
docs/product.md:204, remove the sentence:
  One chain seals a repository: where the person's Claude Code enables the AgenticSeal plugin in a repository on the owl chain, the person chooses which of the two a pane runs, and under the owl chain that one plugin is off in that pane alone.
docs/product.ko.md:24, remove the two sentences:
  저장소 하나에 인장을 찍는 체인은 하나입니다. 그래서 owl 체인을 쓰는 저장소에서 사람의 Claude Code가 AgenticSeal 플러그인을 켜 두었으면, 앱은 그 저장소의 Claude Code 칸이 두 체인 가운데 어느 것을 돌릴지를 저장소마다 한 번 묻고 답을 간직하며, 저장소 설정에서 그 답을 바꿉니다.
docs/product.ko.md:204, remove the two sentences:
  저장소 하나에 인장을 찍는 체인은 하나입니다. owl 체인을 쓰는 저장소에서 사람의 Claude Code가 AgenticSeal 플러그인을 켜 두었으면 칸이 둘 가운데 어느 것을 돌릴지를 사람이 고르고, owl 체인을 고르면 그 플러그인 하나만 그 칸에서 꺼집니다.
```

Each removal is inside a bullet or a table cell, so the count of headings and of table rows the broad gate compares across editions stays as it is.

## Confirmations

```seal
confirms: round-2#1
```
What holds: the finding's evidence search, `git grep -n -i -E 'inspections (a|an|in) |verdict inspections|that inspections|case inspections' -- apps`, prints nothing at the target, and `git grep -n 'One chain' -- apps` prints nothing, executed. `git grep -n -i -w inspections -- apps pr-check`, read whole, prints the word as a noun or as the identifier of `daemon-restart.test.ts:412` alone, executed. `48dcb809` writes the round's paste-ready words at `view.ts:683`, `approval-line.test.ts:227` and the five places of `view.test.ts`, read. The chain dialog and `chain-choice.test.ts` are gone with the chain choice, as the close says.

```seal
confirms: round-2#2
```
What holds: `c54b4db7` gives the option's span the class `default` (`apps/desktop/src/renderer/work-item-view.ts:1126`) and the two rules `#questions .option .default` (`apps/desktop/src/renderer/index.html:505-506`), read. The finding's evidence search, `git grep -n -E 'option \.mark|\.option \.mark|"mark", option' -- apps`, prints nothing, executed. The case at `decisions-and-questions.test.ts:224-233` reads the class, the box and the caption's size, read. This round ran no built-app case, so the red the close reports is not re-shown here.

```seal
confirms: round-2#3
```
What holds: the Status cell of Q10 at `frame/questions.md:28` is the round's paste-ready text, word for word, read. The repair `155f7be6` moved the three close blocks under their findings and gave finding 3 its `evidence:` line back. A `diff` of `round-2.md` as `1f9e9d9` recorded it against the target adds the three close blocks and changes no other line, executed.

What matched: this repository's own records and workflow. `git diff --stat a75f4581..841519da -- seal .github ':!seal/threads/1795797447-322-workflows-compose-around-iadd'` prints nothing, executed, and `.github/workflows/owlery-seal.yml:36` still clones the check at `v0.1.0`, read. Every case that calls `planMigration`, `migrateRecords` or the chain command's `migrate` runs in a temporary repository (`temporaryRepository`, `commandOn` or the daemon's own fixtures), executed with `git grep -n 'planMigration\|migrateRecords\|"migrate"' -- apps/desktop/test` and read at each line. The one case that reads this repository's tree is the heavy commands case of `records-place.test.ts:227-232`, which reads `Heavy commands` of its earlier root and writes nothing, read.

What matched: the end of the chain choice, the plugin's detection, `hygiene.yml`'s detection and the settle's `--apply` in the code. `claude-plugins.ts`, `chain-choice.test.ts` and `claude-plugins.test.ts` are removed. The plan's search `git grep -n -i 'hygiene\|paneChain\|ChainChoice\|agentic-seal\|readPlugins\|enabledPlugins' -- apps/desktop/src pr-check` prints `hooks.ts:92`, `:116`, `:167`, `main.ts:13`, `:50`, `pane-chain.ts:15`, `:83`, `:102`, `records-migration.ts:33`, `repositories.ts:115` and `:271`, the lines `frame/plan.md:48` and `phase-3.md:9` name, executed. `git grep -n -i 'seal'` over the renderer, the shared modules, the main process and the preload prints nothing, executed. `pane-chain.ts#carriedIn` reads the folder alone, `hooks.ts#paneCommands` gives every pane the shared settings file, `records-place.ts#checkOf` and `planRecords` take Owlery's workflow alone, and `settle.ts#command` refuses `--apply` and `--released-at` as unknown flags, read. `settle.test.ts` passed, executed. The documents that state the choice are finding 3, and the prose `gaps.md:29` hands to phase 5 (`docs/roadmap.md:90` on `--apply`, `docs/architecture.md:167` on `owlery-seal.yml`) stands as that row says, read.

What matched: the move as one commit the person reads first. The dialog's route is `daemon.ts#migrates`, which offers the move only where the main checkout holds a root in the earlier form and no `iadd/` root; `planRecords` then answers with the move's plan, and `setUpRecords` runs `migrateRecords` with the stamp the person read, read. `migrateRecords` makes the plan again, refuses another stamp and a blocked plan, writes with the `wx` flag, stages and commits the paths it names, and puts back what it removed or wrote over where the commit fails, read. The refusal paths of `planned` (`:355-366`) are each held by a case of `records-migration.test.ts`: nothing to move (`:299`, `:403`), something other than a file below the root (`:272`), a root of the project's own at `iadd/` (`:260`), a path a file moves to (`:336`), a folder at Owlery's workflow (`:282`), a line the earlier grammar refuses and a record that would read otherwise (`:236-253`), a checkout that differs (`:266`), a path git ignores (`:277`), no branch (`:287`), another stamp (`:294`) and a hook that refuses the commit (`:302-311`, `:389-391`), read. `records-migration.test.ts` passed, 11 cases, executed. The plan's refusal on a project's own `seal/` beside `agentic-seal/` is finding 1.

What matched: Q12. `records-migration.ts#heavyCommandsOf` reads `Heavy commands` from the records root and, where none stands, from a root in the earlier form, and reads nothing else of it; `chain-command.ts#run` names the root it read in its refusal, read. `heavy-run.test.ts` and `records-place.test.ts` passed, executed. A root's discovery and its heavy commands look in two places, and no record is read from the earlier root but by the migration, read across every caller of `earlierRootOf`, `earlierRecordsSays` and `heavyCommandsOf` (`git grep` over `apps/desktop/src`, executed). The one reader that reads a record of IADD's root for the earlier spelling is finding 2.

What matched: the lapse sentence round 2's fix pass added. The dialog's move (`view.ts:2865`), the sentence of `earlierRecordsSays` (`records-migration.ts:125`) and the paragraph of `skills/inspection/SKILL.md:49-58` each say that an inspection cleared before the move lapses at the move's commit, read. The case of `pr-check.test.ts:197-239` holds both sides with the check itself, read, and `chain-command.test.ts` passed with the sentence in its refusals, executed. The paragraph `14b201e6` adds names the output keys `chain-command.ts#migrate` returns and the refusal `owed` gives, read.

What matched: the orchestrator's corrections in `acee1116`. The probe row (`frame/design.md:34`), the scenario sentence (`:102`) and the plan's search (`frame/plan.md:48`) each state what the code at the target does, and the search prints what the row says, executed above. Q10's cell is round 2's finding 3.

What matched: the case of scenario C2 in `terminal-basics.test.ts:1059-1080` keeps its force, read and not run. `work-item-view.ts#showCard` measures the card where it last stood and then sets its left edge to the lesser of the pointer and the window's width less the card's (`:327-329`). `pointAway` waits until the card is hidden (`terminal-basics.test.ts:604-607`), so the card is shown again at the last column. The case first asserts that the card, read where it has room, is wider than the room right of the pointer by more than 10px. With the clamp removed, the card stands at the pointer, and the assertion that its left edge stands more than 10px left of the pointer fails. The `max-width` the case sets is given back in its `finally`.

A case gap, with no finding: `records-place.ts#readHeavyCommands` (`apps/desktop/src/daemon/records-place.ts:240`) has no caller in `apps/desktop/src` since `chain-command.ts#run` reads through `heavyCommandsOf`, and only `records-place.test.ts:213-225` reads it. Two coordinates for the last phase's acceptance search, beside `gaps.md:12`: `apps/desktop/src/daemon/daemon.ts:4058` and `apps/desktop/src/daemon/stage-records.ts:336` hold the earlier `Seal-Built-By` trailer, and the row at `frame/design.md:110` names `chain.ts` and `chain.test.ts` alone for it.

## Not judged

| What | Location | Who answers |
|---|---|---|
| The broad gate at `841519da`: the whole suite, the typecheck and the documents' editions. The suite is `unverified` | the repository's `Broad gate` key of `seal/config.json` | the orchestrator, in the broad gate it runs alone once the rounds settle |
| The case of `hooks.test.ts` "leaves the working directory where it was when the listen is refused because the socket's own name is over the cap" timed out at 20s in this round's clone, twice, with the listen not refused. Neither `HookServer.listen` nor that case changed since `a75f4581`, so this round reads it as no part of the diff. Whether it fails in the main checkout is not known | `apps/desktop/test/hooks.test.ts:131-135` | the orchestrator, in the broad gate |
| The built-app files of `gaps.md:14`, `:18` and `:21`, and the red of `decisions-and-questions.test.ts` and of the C2 case of `terminal-basics.test.ts` that the records report. This round ran no built-app case | `apps/desktop/test/` | the orchestrator, in its next whole built-app run |
| The mutation runs `trail/phases/phase-3.md:38-50` reports, read and not run again | `trail/phases/phase-3.md` | the orchestrator, who decides whether a run of them is owed |
| The sampled test diffs that the opening paragraph names, for whether each changed assertion still pins what it pinned, and `records-migration.test.ts:176-235` | `apps/desktop/test/` | the next round, where the orchestrator judges a read is owed, and otherwise the broad gate for whether they pass |

## Probes

| Command | Result |
|---|---|
| `node node_modules/vitest/vitest.mjs run test/records-migration.test.ts --project unit`, in `apps/desktop/` of the clone at `841519da`, with the main checkout's node modules linked into the clone | 1 file, 11 cases passed: a narrow run, and no gate |
| `node node_modules/vitest/vitest.mjs run test/test_tmp_round3.test.ts --project unit`, the probe written in the clone, with three cases: a project's own `seal/` with a `README.md` of its own beside an `agentic-seal/` root, the same with `seal/notes.txt` alone, and a moved repository's round record of IADD's form whose prose shows a fence of info `seal` | The runner showed none of the probe's lines, so the probe was edited to write them to a log in the round's scratch directory and run a second time. First case: the base's plan moved `agentic-seal`, the branch's `earlierRecordsSays` named `agentic-seal/threads/2-y/`, and the branch's plan had `from` `seal` and was blocked on `iadd/README.md`. Second case: the plan had `from` `seal`, its one move `seal/notes.txt` to `iadd/notes.txt`, no block, and the commit was `A iadd/notes.txt` and `D seal/notes.txt`, after which `earlierRecordsSays` still named `agentic-seal/threads/2-y/`. Third case: `earlierRecordsSays` gave the sentence of a directory a merge put records in, and the plan was blocked at `iadd/threads/3-z/trail/rounds/round-1.md:10`. Each case's temporary repository was removed by the case |
| `node node_modules/vitest/vitest.mjs run test/settle.test.ts test/pane-chain.test.ts test/hooks.test.ts test/repositories.test.ts test/records-place.test.ts test/heavy-run.test.ts test/chain-command.test.ts --project unit`, in the same place | 7 files, 170 cases: 169 passed, and the `hooks.test.ts` case of `## Not judged` failed on its 20s timeout. The same case run alone with `-t 'over the cap'` failed the same way |
