# Review round 2: 1795837193-344-the-records-root-is-agentory

```seal
target: f4f72e1e against origin/release/v0.2.0
```

The round reviewed `22d62f00..f4f72e1e` in a `git clone --no-local` of the worktree under the proofer's scratch, checked out at `f4f72e1e`. The base `origin/release/v0.2.0` is `7413b3f0`, the merge base of the branch. The range holds phase 2 (`16628034`, `3b9a04fd`, `aeb7bebb`), which no round had read, round 1's record (`b8ce87f8`), the fold `53178246`, round 1's fix pass `f1102bd0`, its closes (`be7b4a5f`) and the orchestrator's frame fold `f4f72e1e`. `git diff --stat 22d62f00 f4f72e1e -- apps pr-check .github` prints nothing, so the range changes no code, no case and no workflow. The round read `22d62f00`'s fold again because the spawn asked. Round 1 had reviewed it as its own target, and this round found nothing more in it.

Read whole at the target: `routing.md`, `frame/design.md`, `frame/plan.md`, `frame/questions.md`, `gaps.md`, `changelog.md`, `trail/phases/phase-1.md`, `trail/phases/phase-2.md` and `trail/rounds/round-1.md`. No `pr.md` and no `pr.<lang>.md` stands at the target. `seal/config.json` sets both language keys to English, and no `seal/parity.json` is declared. `frame/keep.txt` was read through the census (a) and through the diff `53178246` makes to it. Every hunk the range makes to `README.md`, `README.ko.md` and `docs/` was read with its paragraph, in both editions: README lines 49, 63 and 80; `docs/architecture.md` lines 199 to 236, 273, 275 and 289; `docs/iadd.md` lines 25 to 80, 110, 112 and 135; `docs/name.md:15`; `docs/roadmap.md:90`, and the Korean twin of each. The other paragraphs of those documents were not read. `seal/threads/1795797447-322-workflows-compose-around-iadd/changelog.md` was read whole.

The round carried these facts from round 1 rather than establishing them again. The rename under `apps/` and `pr-check/` is clean by character (round 1's reverse map). `MARKER` and `ROOT` are declared once, at `apps/desktop/src/shared/protocol.ts:74-76`. The readers that read the name letter by letter read that declaration. Round 1's confirmations of plan row 1 (a) to (c) still hold, since no code changed after them.

The spawn ruled out vitest, the build and the built-app files, because the orchestrator runs the broad gate next. The round followed that narrowing (contract rule 3). The results of plan row 2 (d), the suite and the typecheck are therefore `unverified` here, and the orchestrator answers them (`## Not judged`).

The `gaps.md` diff in the range was read for anything that left without the word `closed`. `## Not verified` keeps both of its rows. `53178246` removes one paragraph of `## Not done`, the one `aeb7bebb` added on #322's three bullets, which left the rewrite to the orchestrator. That decision was made in the same commit, which rewrote the bullets. It now stands in `frame/design.md:54` and `trail/phases/phase-2.md:14`, so the paragraph went with its item done and its decision recorded. The round opens no finding for it.

## Findings

### 1. The frame still says that the plugin's release carrying #1658 has not shipped, and that the bundle was taken from 0.39.x

```seal
severity: should
location: `seal/threads/1795837193-344-the-records-root-is-agentory/frame/design.md:56`, `seal/threads/1795837193-344-the-records-root-is-agentory/frame/plan.md:31`
evidence: executed `gh release view v0.40.0 -R MichaelYcJo/AgenticSeal --json tagName,publishedAt,isDraft,isPrerelease,body`, `gh issue view 1658 -R MichaelYcJo/AgenticSeal --json state,closedAt`, `git grep -n -F -e 'not shipped' -e '#1658 ships' -e 'has not shipped' -- seal/threads/1795837193-344-the-records-root-is-agentory`, `git grep -n -E 'AgenticSeal [0-9]|0\.39\.' -- apps/desktop/role-bundle/README.md`; read `seal/threads/1795837193-344-the-records-root-is-agentory/frame/design.md:44`, `apps/desktop/src/daemon/adapters/claude-roles.ts:70-82`, `apps/desktop/role-bundle/README.md:27`
```

Why it matters: the out-of-scope bullet at `frame/design.md:56` ends "Their move to `agentic <subcommand>` names the plugin's release that carries #1658, which has not shipped". `plan.md:31` says the bundle "would name commands of a plugin release that has not shipped", and that "the orchestrator decides whether an issue carries them once the plugin's release with #1658 ships". AgenticSeal `v0.40.0` was published on 2026-11-28 at 04:31 UTC, as neither a draft nor a prerelease. Its body says "Every party runs the command `agentic`" and its feature line "closes #1658", and the issue closed at 04:31:27 UTC. The fold `f4f72e1e` rewrote `frame/design.md:44` to say that "from its release 0.40.0 it runs the command `agentic`". It left `:56` saying the opposite, three bullets lower in the same section. Neither section is dated to the framer's commit. The sentence states a release that was still open as not shipped, and the release has since shipped (contract rule 19). The sealer reads the bullet as the reason the bundle's mentions stay. The plan row hands the orchestrator a decision whose condition it says has not been met, but the condition has been met.

The same two lines say the bundle's documents "were taken from AgenticSeal 0.39.x". `design.md:56` adds "as `claude-roles.ts#rulesHead`'s docstring says". The docstring (`claude-roles.ts:70-82`) names no version: it says "The taken documents still name AgenticSeal's commands and scripts". `apps/desktop/role-bundle/README.md:27` says the files under `agents/`, `skills/`, `docs/` and `templates/` "started from AgenticSeal 0.38.4". The plugin's command was `seal` in 0.38.4 as well, so the reason for keeping the mentions still holds once the version is corrected.

The `git grep` printed `frame/design.md:56`, `frame/plan.md:31` and `trail/phases/phase-2.md:13`. `phase-2.md:13` reports what the design said when phase 2 read it, and it stays. That search is a sample, since a statement of the fact in other words escapes it. `frame/design.md:12` and `plan.md:13` say #1658's frame was uncommitted when the framer read it, which is a claim dated to that read, and they stay.

In `frame/design.md:56`, replace the bullet:

```markdown
- **The bundle's `seal <subcommand>` mentions**, such as AgenticSeal's `seal mutate` in `agents/crafter.md` and `seal unverified .` in `skills/verify/SKILL.md`. They hold no `iadd`. They name the CLI of AgenticSeal 0.38.4, which the bundle's documents started from (`apps/desktop/role-bundle/README.md`), and which the bundle does not ship, as `claude-roles.ts#rulesHead`'s docstring says. AgenticSeal 0.40.0, published on 2026-11-28, carries #1658 and runs `agentic <subcommand>`. Owlery follows no AgenticSeal release (`docs/architecture.md` *Where Owlery started*), so whether an issue of Owlery's moves them is the orchestrator's to decide, outside this item (`plan.md` *Alternatives considered*).
```

In `frame/plan.md:31`, replace the row:

```markdown
| Rename the bundle's `seal <subcommand>` mentions to `agentic <subcommand>` now | The bundle's documents started from AgenticSeal 0.38.4, whose command is `seal`, and would then name the commands of 0.40.0 inside documents of the earlier release | Rejected for this item. They hold no `iadd`, and the spawn scopes the product's rename to the places that name the plugin `iadd`. AgenticSeal 0.40.0, which carries #1658, was published on 2026-11-28, and the orchestrator decides whether an issue of Owlery's carries the mentions |
```

```seal
verdict: fixed 0b33a780
answer: the orchestrator applied the round's paste-ready text to frame/design.md:56 and frame/plan.md:31; the census diff prints nothing and the twins' heading and table-row counts match.
```

### 2. *Where Owlery started* says the plugin runs `agentic` from 0.40.0, and the rest of the section still describes it in the present tense by its `seal` names

```seal
severity: should
location: `docs/architecture.md:203`, `docs/architecture.md:206`, `docs/architecture.md:222`, `docs/architecture.ko.md:203`, `docs/architecture.ko.md:206`, `docs/architecture.ko.md:222`, `seal/threads/1795837193-344-the-records-root-is-agentory/frame/keep.txt:398`, `seal/threads/1795837193-344-the-records-root-is-agentory/frame/keep.txt:412`
evidence: executed `git grep -n -o -P '.{0,80}`seal[ `].{0,60}' -- docs/architecture.md docs/architecture.ko.md`, `git grep -n -E "AgenticSeal|the plugin" -- 'docs/*.md' README.md ':!docs/*.ko.md'` filtered to lines naming `seal`, the sealer or `guarantee.md`, and `gh release view v0.40.0 -R MichaelYcJo/AgenticSeal --json body`; read `docs/architecture.md:199-236`, `docs/architecture.ko.md:199-236`, `seal/threads/1795837193-344-the-records-root-is-agentory/trail/phases/phase-2.md:13`
```

Why it matters: `53178246` made `docs/architecture.md:201` say "From its release 0.40.0 the plugin runs the command `agentic`, where it was `seal`, and keeps its records under the root `agentory/`", and the Korean twin says the same. The rest of the section and its subsection still describe the plugin in the present tense, by names that release 0.40.0 replaced:

- `:203` says "This repository is built with the plugin, which writes its records under `seal/`". The paragraph just above has the same plugin keeping its records under `agentory/`.
- The table "What AgenticSeal has" (`:209-218`) lists the role "sealer", "the `seal` block in `guarantee.md`", "Scripts behind the `seal` commands" and "the Stop hook that draws the seal". The 0.40.0 release body names the inspector, `inspection.md`, the fence `iadd` and the command `agentic`.
- `:222` says the plugin's means include "the `seal` command". The table under it (`:229`, `:230`, `:233`) says "The orchestrator calls `seal pr-wait`", that "`seal cost` reads the transcript files" and that records are exchanged "with `seal export` and `seal import`".

A reader of the section is told both that the command is `agentic` and that it is `seal`. The section also says "no table maps one tool's names onto the other's". Phase 2 reported this at `trail/phases/phase-2.md:13` ("The same section still says *the `seal` command*"), and the fold rewrote `:201` alone. No policy document says these rows stay as they are. The spawn says the sentences about this repository's own process stay in the plugin's 0.39 forms, and the fix below keeps `seal/` and every `seal` command. It only names the releases those words belong to, so `:203` still describes this repository's process in those forms.

The fix keeps the rows as the record of what Owlery took, and dates them. In `docs/architecture.md`:

- `:203`, replace "This repository is built with the plugin, which writes its records under `seal/` in the earlier form," with "This repository is built with a release of the plugin before 0.40.0, which writes its records under `seal/` in the earlier form,".
- `:206`, after its last sentence ("Each folder of taken files keeps AgenticSeal's licence text and a notice of where its files started."), add the sentence below.
- `:222`, replace "and the `seal` command." with "and its command, `seal` before its release 0.40.0 and `agentic` from it.", and "The table below maps one onto the other." with "The table below maps one onto the other, and names the plugin's commands as they read before 0.40.0.".

```markdown
The table below names AgenticSeal's parts in the words of its releases before 0.40.0, from which Owlery took them: the sealer, `guarantee.md`, the seal the Stop hook draws and the `seal` commands.
```

In `docs/architecture.ko.md`:

- `:203`, replace "이 저장소는 그 플러그인으로 만들고, 플러그인은 기록을 `seal/` 아래에 예전 형식으로 씁니다." with "이 저장소는 그 플러그인의 0.40.0 전 릴리스로 만들고, 그 릴리스는 기록을 `seal/` 아래에 예전 형식으로 씁니다.".
- `:206`, after its last sentence ("가져온 파일을 둔 폴더마다 AgenticSeal의 라이선스 전문과, 그 파일이 어디서 출발했는지 밝히는 고지를 둡니다."), add the sentence below.
- `:222`, replace "그리고 `seal` 명령입니다." with "그리고 0.40.0 전에는 `seal`이고 0.40.0부터는 `agentic`인 명령입니다.", and "아래 표는 그 옮김입니다." with "아래 표는 그 옮김이고, 플러그인의 명령은 0.40.0 전의 이름으로 적습니다.".

```markdown
아래 표는 AgenticSeal의 각 부분을 Owlery가 가져온 0.40.0 전 릴리스의 말로 적습니다. sealer, `guarantee.md`, Stop 훅이 그리는 인장, `seal` 명령이 그렇습니다.
```

The lines at `:203` of both editions hold `IADD`, so `frame/keep.txt:398` and `:412` take the rewritten lines as the documents hold them, and the census (a) must again print nothing. Neither `:206` nor `:222` holds `iadd` in any case, so `keep.txt` holds neither line. No heading or table row changes. The two searches are a sample. This fix leaves four places as they are. `docs/architecture.md:309` dates its `seal pr-wait` to 0.38.0. `:532-533` measure this repository's sessions with `seal payload` and `seal cost`, which is its own process. `docs/roadmap.md:90` is this repository's settle, and `docs/iadd.md:75` and `docs/architecture.md:275` say in the past tense what the plugin wrote. The Korean twin of each stays too.

```seal
verdict: fixed 0b33a780
answer: the orchestrator applied the round's paste-ready text to docs/architecture.md :203, :206 and :222 and their Korean twins, and moved keep.txt's two lines with them; the census diff prints nothing and the twins' heading and table-row counts match.
```

## Confirmations

```seal
confirms: round-1#1
```
What holds: `frame/design.md:77` carries `(?<![\\\w])\w*agentor\w*` and the sentence on the lookbehind, as do `frame/plan.md:39` and `:40` (read). Round 1's evidence, run again at `f4f72e1e`, came back as follows. `git grep -n -F 'agentor\w*'` over the work item prints `design.md:77`, `plan.md:39`, `plan.md:40`, `phase-1.md:10`, `phase-1.md:34` and lines of `round-1.md`, and no other statement of the pattern. The row's command prints `agentory` and `Agentory` alone (executed).

```seal
confirms: round-1#2
```
What holds: `frame/design.md:39` names the seven files `git diff --stat fcac90fd f4f72e1e -- pr-check .github/scripts` lists, and says that `lib/blocks.py`, `lib/fields.py` and `pr-check/README.md` hold no place occurrence (executed). `git grep -n -i iadd f4f72e1e` over those three files prints only the fence's word, `INFO = "iadd"` and the `IADD` and `docs/iadd.md` of `pr-check/README.md:3`, kinds K3, K1 and K2 (executed).

```seal
confirms: round-1#3
```
What holds: `trail/phases/phase-1.md:25-34` gives the read of the range at `e1d0414a`. It quotes the `seal range` line as typed, with the three lines it printed, and the `awk` that took the `apps/desktop/test/` sections out. It names the sample's one `git grep` (`:12`) and the two frame statements the read missed (read). The record labels the account as the builder's hand-back, copied by the fix pass, so the 2,444 lines and the 16,770-line range are the builder's executed claim, which this round did not rerun. `gaps.md:12` now cites that account and round 1's read by character, in place of words (read). The method finding is answered: the account is now in the record, where a sealer can rerun it.

```seal
confirms: round-1#4
```
What holds: `git show 25b30400 | grep -c -E '^\+\s*expect\('` and the same for `^-` print 8 and 8 (executed). `trail/phases/phase-1.md:9` opens "Eight assertions in four cases" (read). The commit message of `25b30400` still says "Five", and it stays, since a commit is not rewritten.

What matched: plan row 2 (a), executed at `f4f72e1e`. `git grep -i -P 'iadd' -- . ':!seal/threads/1795837193-344-the-records-root-is-agentory' | diff - seal/threads/1795837193-344-the-records-root-is-agentory/frame/keep.txt` prints nothing (exit 0). So every line of kinds K1 to K6 in `docs/` and the READMEs stands as `keep.txt` holds it: the method's name, the trailers, the fence's word, the links to `docs/iadd.md` and K4's sentence on Python's in-place add. Each rewritten sentence of *Scope* item 5 stands as well.

What matched: plan row 2 (b), executed. The lookbehind pattern over the tree outside the work item prints `agentory` and `Agentory`. `git grep -n -P 'Agentory'` prints `apps/desktop/test/records-place.test.ts:726` and `:727` alone, which is where `phase-2.md:16` puts them.

What matched: plan row 2 (c), executed. The `for` loop of `seal/config.json`'s `Broad gate`, run alone from the clone's top, exits 0. `git grep -n -e '도장' -- docs README.md README.ko.md` prints nothing (exit 1). The range adds one paragraph and one bullet to each edition of `docs/iadd.md`, and no heading or table row (read).

What matched: each English and Korean pair the range writes says the same thing (read). README line 80: the English says "the owner set" three things. The Korean says the owner set the first, and "그래서" the other two followed. That is the same rule in the order `docs/iadd.md`'s new paragraph gives it in both editions, and the facts agree. `docs/architecture.md:201` and its twin agree on the plugin's name, on 0.40.0, on `agentic` in place of `seal` and on `agentory/`. `docs/name.md:15` and its twin agree. Both editions of the new paragraph of *The rule the names follow* give the same reasons: no IADD name paired with a product, the plugin's name `agentic`, `agentory/` formed like *directory* and *repository*, and the acronym that is hard to read as a folder. Both editions of the last bullet of *Names set aside* list the same eight names, with the same reason for the method's own name. Every other hunk of the range is `iadd/` turned into `agentory/` and nothing else (executed, word diff `22d62f00..f4f72e1e` over `README.md`, `README.ko.md` and `docs/`). Each renamed place is the product's: a connected repository's root, its threads, workflows, inspectors and `parity.json` (read).

What matched: the sentences about this repository's own process still name the plugin's 0.39 forms (read). `docs/architecture.md:203` and its twin keep `seal/`, `owlery-seal.yml`, the check `seal` and the pin 0.1.0. `docs/roadmap.md:90` keeps `seal settle --apply` and `seal/`, and says that Owlery's settle reads `agentory/` alone. `seal/config.json` and the `seal` blocks of these records are unchanged. Finding 2's fix keeps each of these words.

What matched: the fold's claim about AgenticSeal 0.40.0, executed. `gh release view v0.40.0 -R MichaelYcJo/AgenticSeal` shows the release published on 2026-11-28 at 04:31:38 UTC, not a draft and not a prerelease. Its body says "Every party runs the command `agentic`, keeps the records under `agentory/`", and its feature line closes #1658. At that tag, the plugin's `lib/optin.py` holds `HOME = "agentory"` and `MARKER = "# What IADD keeps in agentory/"`, and its `lib/fields.py` holds `INFO = "iadd"` (executed, `gh api …/contents/…?ref=v0.40.0`). Each equals Owlery's own `pr-check/lib/optin.py:32` and `:62`, `pr-check/lib/fields.py:69` and `protocol.ts:74-76`. So the failure scenario of `plan.md:13`, in which the plugin spells the fence or the root another way, did not happen at 0.40.0. `docs/architecture.md:201`'s "one records folder" holds at the root and the marker.

What matched: `53178246`'s rewrite of #322's three bullets (read). `seal/threads/1795797447-322-workflows-compose-around-iadd/changelog.md:6`, `:7` and `:11` name `agentory/`, `agentory/` and `agentory/threads/`, and no other word of theirs changed. `docs/roadmap.md:96` asks for exactly this. `frame/keep.txt` follows. Bullets 6 and 7 keep their `IADD's forms` with the place renamed, and bullet 11, now without any `iadd`, left `keep.txt`, which the census (a) confirms. No other bullet of #322's or #323's fragment names the plugin `iadd` or the root `iadd/` (executed, `git grep` over both fragments). `frame/design.md:54` and `:101` state the exception.

What matched: `changelog.md` tells a person what ships, truthfully (read). The first bullet's hand move is complete. In the build of `7413b3f0`, a root's `README.md` names the root only in its first line (`records-place.ts#readmeText`), and the workflow fetches the check at the release's branch until the tag exists, so `git mv iadd agentory` and the marker line are all a repository on such a build needs. The second bullet's names stand unchanged in the tree (census). The third bullet says what `docs/architecture.md:201` and `docs/iadd.md:33` and `:61` now say. The opening sentence's account of #322's documents matches the word diff, whose removed text holds "becomes `iadd`".

What matched: the claims of `trail/phases/phase-2.md`, read and where marked executed. The census diff at `22d62f00` prints 89 lines, 56 of them `<` or `>` lines, all in `docs/` and the READMEs (executed). So the phase's 89 and round 1's 56 count different lines of one output, and both hold. The 63 distinct `check:` paths under `docs/` each exist at `f4f72e1e` (executed). The plugin at 0.39.3 has `bin/seal` and the name `agentic` in `.claude-plugin/plugin.json` (executed). `3b9a04fd` puts the bullet's reason in parentheses in both editions (read). The crafter's script and its assertions are the crafter's claim, and the census (a) shows the result they claim.

What matched: the fold `f4f72e1e` (read). `frame/design.md:44` now gives the sentence the documents and `keep.txt` hold. `:54` and `:101` state the exception for #322's three bullets. `phase-2.md:14` says the fix pass after round 1 rewrote them in `53178246`, which the range shows.

## Not judged

| What | Location | Who answers |
|---|---|---|
| Plan row 2 (d), the built-app batch after `node build.mjs`. `phase-2.md:18` says its runs "are in the hand-back", and the record gives no result. The spawn ruled out the batch for this round | `seal/threads/1795837193-344-the-records-root-is-agentory/trail/phases/phase-2.md:18`, `seal/threads/1795837193-344-the-records-root-is-agentory/frame/plan.md:40` | the orchestrator, who holds the hand-back and runs the broad gate next |
| The suite, the typecheck and `pane-session.test.ts`, labelled `unverified` | `seal/threads/1795837193-344-the-records-root-is-agentory/gaps.md:7-8` | the orchestrator, at the broad gate |
| Plan row 1 (d) to (f) at `25b30400`, carried from round 1's row. The range adds no result for them | `seal/threads/1795837193-344-the-records-root-is-agentory/trail/phases/phase-1.md`, `seal/threads/1795837193-344-the-records-root-is-agentory/frame/plan.md:39` | the orchestrator |

## Probes

| Command | Result |
|---|---|
| `git grep -i -P 'iadd' -- . ':!seal/threads/1795837193-344-the-records-root-is-agentory' \| diff - seal/threads/1795837193-344-the-records-root-is-agentory/frame/keep.txt` at `f4f72e1e` | nothing, exit 0 |
| `git grep -h -o -i -P '(?<![\\\w])\w*agentor\w*' -- . ':!seal/threads/1795837193-344-the-records-root-is-agentory' \| sort -u` | `agentory`, `Agentory` |
| `git grep -n -P 'Agentory' -- . ':!seal/threads/1795837193-344-the-records-root-is-agentory'` | `apps/desktop/test/records-place.test.ts:726`, `:727` |
| The `for` loop of `seal/config.json`'s `Broad gate`, alone, then `git grep -n -e '도장' -- docs README.md README.ko.md` | exit 0; nothing, exit 1 |
| `git grep -i -P 'iadd' 22d62f00 -- . ':!seal/threads/1795837193-344-the-records-root-is-agentory'`, its revision prefix taken off, diffed against `keep.txt` at `22d62f00` | 89 lines, 56 of them `<` or `>`, all in `docs/` and the READMEs |
| `gh release view v0.40.0 -R MichaelYcJo/AgenticSeal --json tagName,publishedAt,isDraft,isPrerelease,body`; `gh issue view 1658 -R MichaelYcJo/AgenticSeal --json state,closedAt` | published 2026-11-28T04:31:38Z, not a draft or prerelease, command `agentic`, root `agentory/`, closes #1658; #1658 closed 04:31:27Z |
| `gh api 'repos/MichaelYcJo/AgenticSeal/contents/lib/optin.py?ref=v0.40.0'` and `…/lib/fields.py?ref=v0.40.0`, decoded | `HOME = "agentory"`, `MARKER = "# What IADD keeps in agentory/"`, `INFO = "iadd"` |
| For each `check:` path under `docs/*.md`, `test -e` | 63 distinct paths, none missing |
| `git show 25b30400 \| grep -c -E '^\+\s*expect\('` and `'^-\s*expect\('` | 8 and 8 |
| `git diff --stat 22d62f00 f4f72e1e -- apps pr-check .github` | nothing |
