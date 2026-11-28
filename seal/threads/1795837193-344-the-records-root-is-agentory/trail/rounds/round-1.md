# Review round 1: 1795837193-344-the-records-root-is-agentory

```seal
target: 22d62f00 against origin/release/v0.2.0
```

This is the first round, so no earlier round's coordinates were carried. The round reviewed phase 1, `66425d6d` to `0e130869`, and the orchestrator's fold `22d62f00`, in a `git clone --no-local` under the proofer's scratch, checked out at `22d62f00`. The base `origin/release/v0.2.0` is `7413b3f0`, the merge base of the branch. Read whole at the target: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md` and `trail/phases/phase-1.md`. `frame/keep.txt` was read through the census command (a). No `changelog.md`, `pr.md` or `pr.<lang>.md` stands at the target, and none is owed yet: `pr.md` is written once the build's last phase closes, and phase 2 is open. `seal/config.json` sets both language keys to English. No `seal/parity.json` is declared. The diff read is `fcac90fd..22d62f00`, the frame's commit to the target, for `apps/`, `pr-check/` and the work item's records.

The orchestrator's prompt restricted the runs to commands (a) to (c) of plan row 1, and ruled out vitest, the build and the built-app files, because the crafter is running phase 2 on the same machine. The round followed that narrowing (contract rule 3). So every claim of a suite's result below is the crafter's account, labelled as such.

**How the `apps/desktop/test/` hunks were read (`gaps.md` *Not done*).** The method was whole by character. For each of the 54 files the diff changes under `apps/` and `pr-check/`, the round took the file at `22d62f00` and turned `agentory` back into `iadd` and `Agentory` back into `Iadd`. It then diffed the result against the file at `fcac90fd`. At `fcac90fd`, no file under `apps/` or `pr-check/` holds `agentory` in any case, so the reverse map is exact. Of the 54 files, 44 come back identical. Each change in them is the case-kept rename and nothing else, a dropped key or quote included. The 19 hunks that stay are in 10 files: `chain-command.ts`, `records-place.ts`, `renderer/view.ts`, `shared/protocol.ts`, `chain-command.test.ts`, `chain.test.ts`, `pane-chain.test.ts`, `record-blocks.test.ts`, `records-place.test.ts` and `optin.py`. Every one of those hunks is a change *Scope* items 1 and 3 name, or one of `25b30400`'s sort-order assertions. That settles character by character whether the rename in the test hunks is clean. What it cannot show is a case whose meaning hung on a property of the name. So the round searched the added test lines for assertions sensitive to length or order (`length`, `slice(`, `PROMPT_DIFF_CHARS`, `.sort(`, `localeCompare`), and for list assertions that mix `agentory/` with a top-level path from `b` to `h`. That search is a sample. Apart from `25b30400`'s cases, it found no assertion whose meaning changed with the name. The gap's count, 1231 changed lines at `e1d0414a`, is 1232 by `git diff --numstat fcac90fd e1d0414a -- apps/desktop/test` (618 added, 614 removed). The round opens no finding for that.

Two sentences of `trail/phases/phase-1.md` describe the frame as it stood before the fold. Line 10 says "as the plan writes it" and line 11 says "which says it writes its roots at `agentory/`". The round read both as the phase's departures, dated to the phase, which `22d62f00` folded. Neither is a finding.

## Findings

### 1. The design's acceptance row for the place's spelling keeps the pattern that prints `tagentory`, which the fold changed in the plan alone

```seal
severity: should
location: `seal/threads/1795837193-344-the-records-root-is-agentory/frame/design.md:77`
evidence: executed `git grep -h -o -i -P '\w*agentor\w*' -- . ':!seal/threads/1795837193-344-the-records-root-is-agentory' | sort -u` at 22d62f00, `git grep -h -o -i -P '(?<![\\\w])\w*agentor\w*' -- . ':!seal/threads/1795837193-344-the-records-root-is-agentory' | sort -u` at 22d62f00 and at 078b3630, `git grep -n -F 'agentor\w*' -- seal/threads/1795837193-344-the-records-root-is-agentory`; read `seal/threads/1795837193-344-the-records-root-is-agentory/trail/phases/phase-1.md:10`, `seal/threads/1795837193-344-the-records-root-is-agentory/frame/plan.md:39-40`
```

Why it matters: the row *The place's spelling* of *User scenarios & acceptance* says that, when the work is done, `git grep -h -o -i -P '\w*agentor\w*' … | sort -u` prints `Agentory` and `agentory` and nothing else. Phase 1 found that this pattern also takes the `t` of the escape `\t` in six paths of `records-migration.test.ts` (`phase-1.md:10`). At the target the command prints `agentory`, `Agentory` and `tagentory`. The fold `22d62f00` added the lookbehind `(?<![\\\w])` to plan rows 1 and 2 (b), but left this row as it was. The row says what the work concludes, so it is read against the target, and the target contradicts it. The sealer and the crafter of phase 2 read this row as the acceptance. Taken as written, it fails on a tree that holds no misspelling.

`git grep -n -F 'agentor\w*'` over the work item's directory prints four lines: `frame/design.md:77`, `frame/plan.md:39`, `frame/plan.md:40` and `trail/phases/phase-1.md:10`. The two plan rows already carry the lookbehind. `phase-1.md:10` states what the phase found at its commit, and stays. That search is a sample: a statement of the pattern in other words would escape it. With the lookbehind, the command prints `agentory` at `078b3630`, so the third cell's sentence about `078b3630` still holds.

In `frame/design.md:77`, replace the first command of the second cell:

```markdown
| The place's spelling | When the work is done, `git grep -h -o -i -P '(?<![\\\w])\w*agentor\w*' -- . ':!seal/threads/1795837193-344-the-records-root-is-agentory' \| sort -u` prints `Agentory` and `agentory` and nothing else, and `git grep -n -P 'Agentory' -- . ':!seal/threads/1795837193-344-the-records-root-is-agentory'` prints lines of `apps/desktop/test/records-place.test.ts` alone. The lookbehind leaves out a word that an escape such as `\t` runs into | The commands. Run at `078b3630`, the first prints `agentory`, from E4's line, and the second prints nothing. The build writes `agentory` and `Agentory` and no other spelling of the place |
```

```seal
verdict: fixed f1102bd0
answer: The paste-ready fix was read against plan rows 1 and 2 (b) and applied as given to `frame/design.md:77`. At `f1102bd0` the row's command prints `agentory` and `Agentory` alone. `git grep -n -F 'agentor\w*' -- seal/threads/1795837193-344-the-records-root-is-agentory` run again prints `frame/design.md:77`, `frame/plan.md:39` and `:40`, which now all carry the lookbehind. It also prints `trail/phases/phase-1.md:10`, which states what phase 1 found and stays, `trail/phases/phase-1.md:34`, which names this finding's correction, and lines of this round record, which are the proofer's.
```

### 2. *Scope* item 2 names three files of `pr-check/` as holding place occurrences, and they hold none

```seal
severity: should
location: `seal/threads/1795837193-344-the-records-root-is-agentory/frame/design.md:39`
evidence: executed `git grep -n -i iadd fcac90fd -- pr-check/README.md pr-check/lib/blocks.py pr-check/lib/fields.py`, `git diff --stat 078b3630 fcac90fd -- apps pr-check`, `git diff --stat fcac90fd 22d62f00`, `git grep -n -F -e 'lib/blocks.py' -e 'pr-check/README.md' -e 'lib/fields.py' -- seal/threads/1795837193-344-the-records-root-is-agentory`
```

Why it matters: *Scope* item 2 says "Every place occurrence under `pr-check/` becomes `agentory`", then lists the files, among them `lib/blocks.py`, `lib/fields.py` and `pr-check/README.md`. At `fcac90fd` those three files hold `iadd` only as the fence's word (`` `iadd` block ``, `INFO = "iadd"`, kind K3), the link `docs/iadd.md` (kind K2) and `IADD`. `apps/` and `pr-check/` are the same at `078b3630`, since `git diff --stat 078b3630 fcac90fd -- apps pr-check` prints nothing. `frame/keep.txt:471-485` keeps each of their lines unchanged, and the diff to the target leaves all three files untouched. That matches the census, but it contradicts the item's list. A sealer who checks *Scope* item 2 against the diff finds three named files unchanged, and has to work out for itself that nothing was missed. The phase record does not name this departure.

`git grep -n -F` for the three paths over the work item's directory prints `frame/design.md:39`, `:30` (E6, about the plugin's `lib/fields.py`), `:98` (kind K3) and `keep.txt`'s lines. Only `:39` states the list. That search is a sample.

Replace the list in `frame/design.md:39`:

```markdown
2. **The place, in the pull request check.** `pr-check/lib/optin.py#HOME` becomes `"agentory"`, and `#MARKER` becomes `"# What IADD keeps in agentory/"`. Every place occurrence under `pr-check/` becomes `agentory`: `optin.py`'s docstrings and the local mode's `<git-common-dir>/agentory`, `chain_check.py#root_name`, `.github/scripts/rules.py#records_root`, `lib/config.py`, `lib/routing.py`, `lib/gate.py` and `skills/settle/scripts/rule_changes.py`. `lib/blocks.py`, `lib/fields.py` and `pr-check/README.md` hold no place occurrence: their `iadd` is the fence's word (*Data & interfaces*, kind K3) or the link to `docs/iadd.md` (kind K2), and they stay as they are.
```

```seal
verdict: fixed f1102bd0
answer: The finding holds: `git diff --stat fcac90fd HEAD -- pr-check .github/scripts` lists seven files, the item's list without the three. The paste-ready fix was applied as given to `frame/design.md:39`. `git grep -n -F -e 'lib/blocks.py' -e 'pr-check/README.md' -e 'lib/fields.py' -- seal/threads/1795837193-344-the-records-root-is-agentory` run again prints, outside `frame/keep.txt` and this round record, `frame/design.md:30` (E6, the plugin's `lib/fields.py`), `:39` (now the corrected list), `:98` (kind K3), `frame/plan.md:20` (the fence's two readers) and `trail/phases/phase-1.md:34` (which names this correction). None of them lists files with place occurrences, so each stands.
```

### 3. The phase record describes its range read in words, quotes no command of it, and missed two frame statements the target contradicts

```seal
severity: should
location: `seal/threads/1795837193-344-the-records-root-is-agentory/trail/phases/phase-1.md:3-23`, `seal/threads/1795837193-344-the-records-root-is-agentory/gaps.md:12`
evidence: read `seal/threads/1795837193-344-the-records-root-is-agentory/trail/phases/phase-1.md:1-23`, `seal/threads/1795837193-344-the-records-root-is-agentory/gaps.md:10-12`, the plugin's `skills/implement/SKILL.md:276-306`; executed the commands of findings 1 and 2
```

Why it matters: the plugin's `skills/implement/SKILL.md` *The account of that read quotes its commands and describes no read in other words* sets out what the account of the builder's read of its range must give. It names the commit the read ran at and quotes the `seal range` line as typed, with the lines it printed. It quotes each `git grep` of the sample and lists each statement left standing. The orchestrator writes that account into `trail/phases/phase-N.md`. `phase-1.md` holds no `seal range` line, no commit for the read and no printed lines. Its one quoted `git grep`, at line 12, is the search for `optin.py`'s citation. `gaps.md:12` gives the read only in words: it "read every section of `seal range`'s output but the hunks of `apps/desktop/test/`". The read the account describes also missed two statements in frame lines the builder does not write, which the same section asks the crafter to name in its hand-back for the orchestrator to fold:

- `frame/design.md:77` (finding 1). The crafter named plan row 2's pattern (`phase-1.md:10`) but not the acceptance row that states the same command. The fold followed the account and changed the plan alone.
- `frame/design.md:39` (finding 2).

Both were fixed above as instances. This finding is on the method, and stands even after both are fixed. The next phase's account is written in the same form unless this one is corrected. A sealer cannot run a read again from words.

Add to `phase-1.md` `## What this phase found` the account as the section gives it, from the crafter's hand-back, where it holds the account. Where it does not, rerun the read at `25b30400` and write it out:

```markdown
**The read of the range against HEAD**, at `<the commit the read ran at>`:

    <the `seal range` line, as typed>
    <each line it printed>

<each `git grep` of the sample, as typed, with what it printed>

Statements HEAD contradicts in frame lines the builder does not write, for the orchestrator to fold: `frame/design.md:77`, whose pattern `\w*agentor\w*` prints `tagentory` (the departure on check (b) above); `frame/design.md:39`, which names `lib/blocks.py`, `lib/fields.py` and `pr-check/README.md` among the files with place occurrences, though they hold none.
```

```seal
verdict: fixed f1102bd0
answer: `trail/phases/phase-1.md` ends with *The read of the range against HEAD*, at `e1d0414a`. It is labelled as the phase 1 builder's account from its hand-back, copied by this fix pass. It quotes the `seal range` line as typed and the three lines it printed, the `awk` that took out the sections not under `apps/desktop/test/`, and the 2,444 lines read. It names the sample's one `git grep`, and the two frame statements the read missed, which findings 1 and 2 corrected. `gaps.md:12` was answered in place in `53178246`: it now cites that account, and round 1's whole read by character of the `apps/desktop/test/` hunks, in place of describing the read in words. No rerun at `25b30400` was made, since the hand-back held the account.
```

### 4. The phase record counts five sort-order assertions where `25b30400` changes eight

```seal
severity: should
location: `seal/threads/1795837193-344-the-records-root-is-agentory/trail/phases/phase-1.md:9`
evidence: executed `git show 25b30400 | grep -c -E '^\+\s*expect\('` and `git show 25b30400 | grep -c -E '^-\s*expect\('`, which print 8 and 8; read `apps/desktop/test/chain.test.ts:1143`, `:1151`, `:1164-1165`, `:1255`, `:3307-3308`, `apps/desktop/test/chain-command.test.ts:519`
```

Why it matters: `phase-1.md:9` opens "Five assertions depended on the root sorting after `feature.txt`". It then lists two full lists, the inspection diff's opening line and "the rest" turned into regular expressions. `25b30400` changes eight `expect` lines in four cases: one in `chain-command.test.ts`, at `:519`, and seven in `chain.test.ts`, at `:1143`, `:1151`, `:1164`, `:1165`, `:1255`, `:3307` and `:3308`. Of those, two are the full lists, one is the diff's opening line, and five are regular expressions. The record's own breakdown adds up to eight. A sealer who checks the account against the commit finds a count it cannot match. `25b30400`'s commit message carries the same count, and stays as it is, since a commit is not rewritten.

In `phase-1.md:9`, replace the opening clause:

```markdown
- **Eight assertions in four cases depended on the root sorting after `feature.txt`** (judged against …
```

```seal
verdict: fixed f1102bd0
answer: `git show 25b30400 | grep -c -E '^\+\s*expect\('` and the same for `^-` run again print 8 and 8. `trail/phases/phase-1.md:9` now opens with "Eight assertions in four cases", as the paste-ready fix gives it, and the rest of the line is unchanged.
```

## Confirmations

What matched: acceptance (a) of plan row 1, executed at `22d62f00`. The census diff prints no `<` or `>` line under `apps/` or `pr-check/`. The 56 lines it prints in all stand in `README.md`, `docs/architecture.md`, `docs/iadd.md`, `docs/name.md`, `docs/roadmap.md` and their Korean twins, which are phase 2's.

What matched: acceptance (b) of plan row 1, executed: it prints `Agentory` and `agentory` alone. Without the lookbehind it prints `tagentory` as well, as `phase-1.md:10` states.

What matched: acceptance (c) of plan row 1, executed against `fcac90fd`, the commit that adds `keep.txt`. It prints 83 lines, the count `phase-1.md:16` gives. The round read all 83. Each is one of the kinds the record lists: the move and re-export of `MARKER` and `ROOT`, `ROOT` with its imports, the `pane-chain.test.ts` comment and the dropped `"iadd@iadd": true`, six pairs of `-tiadd`/`+tagentory`, the joined `"iadd", 13, "iadd` renames, the new case, `optin.py`'s citation, and `25b30400`'s assertion words. The character-by-character reverse diff in the prose above confirms that nothing else changed: no key, quote or word inside a string or a page-evaluated script was dropped.

What matched: the method's spellings stay. Under `apps/` and `pr-check/`, the opener `` ```iadd `` and the trailers `IADD-Routing` and `IADD-Built-By` occur 156 times at `fcac90fd` and 156 times at `22d62f00` (executed, `git grep -o -P`). `INFO = "iadd"` stands in `pr-check/lib/fields.py:69` and `apps/desktop/src/daemon/record-blocks.ts:26` (read). A search for `agentory.md`, `agentory-`, `-agentory` and `agentory@` outside `seal/` prints nothing (executed), so no link to `docs/iadd*.md` and no trailer was renamed. The census (a) holds every K1 to K6 line under `apps/` and `pr-check/` as `keep.txt` gives it.

What matched: *Scope* item 1, read. `MARKER` and `ROOT` are declared once, at `apps/desktop/src/shared/protocol.ts:73-76`, with the docstrings they had. `records-place.ts:14` and `:18-19` import and re-export them. `chain-command.ts:720`, `records-place.ts:499` and `renderer/view.ts:2865` read `ROOT`. Under `apps/desktop/src`, `git grep -n -i agentory` (executed) prints only comments, docstrings and `protocol.ts`'s two declarations. The `iadd` left in `src`, outside comments, is the fence's word or `IADD` alone.

What matched: the readers that read the name letter by letter. `rootOf` (`records-place.ts:184-186`), `planRecords`, the migration's target (`records-migration.ts:317`, `${ROOT}/${renamed}`, and `:414`, `:429`, `:436`, `:474`, `:480`, `:515`), `heavyCommandsOf`, and `optin.py#HOME` and `#MARKER` (`:32`, `:62`) all read the one declaration of their language. `chain_check.py#root_name` and `rules.py#records_root` reach `HOME` through `optin`. A search for root paths built from a literal `threads` (executed) found none outside a reader of `ROOT` or `home`. The cases spell the new name literally, for example `daemon.test.ts:2100`, `records-place.test.ts:107`, `pr-check.test.ts:225`, `records-migration.test.ts:326` and `settle.test.ts:67` (read). So a reader left on `iadd` finds no root, and a case that expects a work item fails rather than passing as "no work item". The red runs that show this, `phase-1.md:21`, are the crafter's executed claim, which this round did not rerun.

What matched: the case *Scope* item 3 adds (`records-place.test.ts:1046-1048`) covers what its group does not. `pr-check.test.ts` pins `HOME` through the literal `agentory/` fixtures, and the app's cases pin `ROOT` the same way. A later rename that moves one side together with that side's cases passes both groups, and only this tie fails. Its seen-red, with `HOME` set back to `"iadd"` alone (`phase-1.md:20`), is the crafter's executed claim.

What matched: `25b30400`'s sort-order changes still assert what they asserted. `feature.txt` sorted first only by accident of the old name. Each regular expression for a path list (`chain-command.test.ts:519`, `chain.test.ts:3307`) allows only list-item lines, `` - `…` ``, between the heading and `` - `feature.txt` ``, so the path must still stand in that same list. Each regular expression for a diff (`chain.test.ts:1143`, `:1255`, `:3308`) finds `diff --git a/feature.txt b/feature.txt` after `Their diff:`. The diff is the tail of the prompt (`apps/desktop/src/daemon/chain.ts:611-619`), so the match cannot land outside it. `not.toContain("on-main.txt")` still holds the exclusion. The two full lists (`chain.test.ts:1151`, `:1164`) list the paths in byte order, `agentory/…` before `feature.txt`, which is git's order. `:1165` still pins the listed prompt followed by the diff, now opening with `${directory}/routing.md`, while `+A greeting.\n` holds that `feature.txt`'s change is in the diff.

What matched: the three product lines of *Scope* item 3, read. `pane-chain.test.ts:113-115` drops `"iadd@iadd": true` and keeps `"agentic@agenticseal": true`, as *Removes* states. `record-blocks.test.ts:78` reads `rules: agentic 0.0.2`.

What matched: *Scope* item 4, read through the role bundle's word diff. Every changed word under `apps/desktop/role-bundle` is `iadd/` turned into `agentory/`, including `skills/core/SKILL.md`'s *the directory named `agentory`* and the heading of `skills/agent-contract/SKILL.md` rule 11. Each fence word and each sentence about an `iadd` block stays.

What matched: the fold `22d62f00` drops `chain-records.test.ts` from the first reader row, which `phase-1.md:11` supports. It adds the paragraph on sort order, which matches `25b30400`. It changes plan rows 1 and 2 (b) to the lookbehind pattern. Finding 1 is the one statement of that pattern it left.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Whether plan row 1's (d) unit command, (e) built-app batch and (f) screenshots run passed at `25b30400`. `phase-1.md` gives the first failing run of (d) at `66425d6d` and the red runs against the old code, but no result for (d), (e) or (f) at the commit the Status cell names, and `gaps.md` *Not verified* does not list them. Where (f) did not run, it is a row of that table | `seal/threads/1795837193-344-the-records-root-is-agentory/trail/phases/phase-1.md`, `seal/threads/1795837193-344-the-records-root-is-agentory/frame/plan.md:39` | the orchestrator, who holds the crafter's hand-back |
| The crafter's seen-red runs (`phase-1.md:20-21`), which the spawn's narrowing kept this round from rerunning | `seal/threads/1795837193-344-the-records-root-is-agentory/trail/phases/phase-1.md:18-21` | the orchestrator; the broad run holds the green half |
| The suite, the typecheck and `pane-session.test.ts`, labelled `unverified` | `seal/threads/1795837193-344-the-records-root-is-agentory/gaps.md:7-8` | the orchestrator, at the broad gate |

## Probes

| Command | Result |
|---|---|
| `git grep -i -P 'iadd' -- . ':!seal/threads/1795837193-344-the-records-root-is-agentory' \| diff - seal/threads/1795837193-344-the-records-root-is-agentory/frame/keep.txt \| grep -E '^[<>] (apps\|pr-check)/'` | nothing; the diff's 56 lines all stand in `docs/` and the READMEs |
| `git grep -h -o -i -P '(?<![\\\w])\w*agentor\w*' -- apps pr-check \| sort -u` | `agentory`, `Agentory` |
| `git diff --word-diff=porcelain --word-diff-regex='[A-Za-z]+' fcac90fd -- apps pr-check \| grep -E '^[-+]' \| grep -v -E '^(---\|\+\+\+) ' \| grep -v -x -E '[-+](iadd\|Iadd\|agentory\|Agentory\|agentic)'` | 83 lines, each of a kind `phase-1.md:16` names |
| For each file `git diff --name-only fcac90fd 22d62f00 -- apps pr-check` lists: `git show 22d62f00:<f> \| sed -e 's/agentory/iadd/g' -e 's/Agentory/Iadd/g'` diffed against `git show fcac90fd:<f>` | 19 hunks in 10 files, each a change *Scope* items 1 and 3 name or a `25b30400` assertion; the other 44 files come back identical |
| `git grep -h -o -i -P '\w*agentor\w*' -- . ':!seal/threads/1795837193-344-the-records-root-is-agentory' \| sort -u` | `agentory`, `Agentory`, `tagentory` (finding 1) |
