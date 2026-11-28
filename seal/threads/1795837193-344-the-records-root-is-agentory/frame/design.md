# Design: 1795837193-344-the-records-root-is-agentory

## Grounding

The tree as read at `078b3630`.

| Policy clause | What it fixes for this work |
|---|---|
| Issue #344 *The names* and *Scope* (the ticket) | The method stays IADD: the marker's first line, the trailers `IADD-Routing:` and `IADD-Built-By:`, inspector, inspection, cleared / lapsed / not cleared. The plugin stays `agentic`, with skills `agentic:*` and the command `agentic`. The place is `agentory/`, whose `README.md` opens with `# What IADD keeps in agentory/`. No release shipped `iadd/`, so nothing reads it as an earlier form. The routing answer `agentic` is unchanged |
| Issue #322 *Names revised by the owner on 2026-11-28* | #322 merged with `iadd/` as built, and this item renames the root before the tag `v0.2.0`. The concept, the roles, `inspection`, the trailers and the routing answer are unchanged |
| Issue #322 *When it lands*, step 4, and `docs/architecture.md` *Where Owlery started* | This repository keeps its records under `seal/` in the plugin's forms, and `.github/workflows/owlery-seal.yml` keeps its pin at `v0.1.0`, until the plugin takes IADD's names. Neither moves here |
| AgenticSeal#1658 *The names* (read) | The plugin's side of the same three layers. Its table keeps the trailer, inspector, inspection, `inspection.md`, the verdict lines, the check states and the mark keys unchanged, and names no other record-form spelling. The plugin's frame for #1658 was not committed when read (E7) |
| AgenticSeal#1659 points 1, 2 and 3 (read) | Point 1: the acceptance is `git grep` diffed against `frame/keep.txt`, and the census is never copied into `plan.md`. Point 2: each plan row's *Verified by* names the command of every suite that owns a test file the phase changes. Point 3: the name families of one rename stay phases of one work item |
| `docs/iadd.md` *Names* and *The records* | The document this work edits for the names. It keeps its file name, because it is the method's definition |
| `docs/architecture.md` *Measure before building* | A built-app file is a test file that imports `buildApp` from `apps/desktop/test/built-app.ts`. An agent runs all the built-app files in one batch, `OWLERY_BACKGROUND=1 pnpm run test:app` in `apps/desktop`, when a phase ends |
| `docs/architecture.md` *A repository names its heavy commands* | A session runs each command that `Heavy commands` of `seal/config.json` names through the runner its environment names in `OWLERY_RUN` |
| `seal/config.json` `Broad gate` | Every `docs/*.md` and `README.md` keeps a `.ko.md` twin with as many headings and as many table rows, and no `도장` stands in `docs/` or the READMEs. Each sentence this work rewrites in English is rewritten in its Korean twin |
| `CLAUDE.md` *Framing and research* | The frame holds a short part headed *What the daemon could do beyond the issue* |
| The plugin's `skills/core/SKILL.md` *The rule a mechanism is kept against* | A fact has one source. This work adds no gate, check, hook or mark. `frame/keep.txt` is a record of this work item and leaves with its directory |

### What was run and read at `078b3630`

Each fact below is `executed` unless it says `read`.

- **E1, the census.** `git grep -i -P 'iadd' -- . ':!seal/threads/1795837193-344-the-records-root-is-agentory'` printed 1435 lines. 245 of them stand in the records of #322 and #323 (`seal/threads/1795797447-322-workflows-compose-around-iadd/`, `seal/threads/1795797648-323-the-rules-live-in-the-repository/`), the binary `screenshots/register-light-inbox.png` among them, and 1190 stand outside `seal/`.
- **E2, the classes.** A generator under the framer's scratch read each occurrence of `iadd` in E1's output with its context and gave it one layer by the rules of *Data & interfaces*. Each line then took one class: `history` (another work item's records, 245 lines), `keep` (every occurrence is the method's, 442), `mixed` (the method's and a place's, 52), `place` (a place's alone, 687) and `rewritten` (a product's spelling, so the build rewrites the sentence, 9). The classes were read against the context of every place and mixed occurrence that is not a path.
- **E3, `frame/keep.txt`.** The generator wrote each `history` and `keep` line as E1 printed it, and each `mixed` line with its place occurrences renamed. It wrote each `rewritten` line that still holds IADD as the sentence of *Scope* item 5, and the new paragraph of *Scope* item 5 in its place in each twin. Two lines then took the form *Scope* item 1 gives them: `MARKER`'s declaration moved to `apps/desktop/src/shared/protocol.ts`, and `renderer/view.ts`'s move sentence reads `${ROOT}`. E1's output diffed against it prints 748 lines that the build removes or changes (`<`) and 60 that it writes (`>`). 752 of those 808 lines are under `apps/` and `pr-check/`.
- **E4, the place's own census.** `git grep -n -i agentory -- . ':!seal/threads/1795837193-344-the-records-root-is-agentory'` printed one line, `seal/threads/1795797447-322-workflows-compose-around-iadd/guarantee.md:42`.
- **E5, the rename's word check.** In a `git clone --no-local` of the worktree under the framer's scratch, a rename of `"iadd` to `"agentory` in `apps/desktop/test/records-dialog.test.ts` that also dropped the key `"Broad gate":` from a JSON string made `git diff --word-diff=porcelain --word-diff-regex='[A-Za-z]+' -- apps pr-check | grep -E '^[-+]' | grep -v -E '^(---|\+\+\+) ' | grep -v -x -E '[-+](iadd|Iadd|agentory|Agentory|agentic)'` print `-Broad gate`. The same rename without the drop made it print nothing (exit 1).
- **E6, the plugin's fence.** `gh api repos/MichaelYcJo/AgenticSeal/contents/lib/fields.py?ref=feat/1658-the-plugin-stays-agentic`, read on 2026-11-28, holds `INFO = "iadd"`.
- **E7, the plugin's frame.** On 2026-11-28 the branch `feat/1658-the-plugin-stays-agentic` of AgenticSeal held one commit above #1656's merge, `1790fab774`, which adds only its `routing.md`.
- **E8, the suites.** The rule of `apps/desktop/vitest.config.ts` (a test file that imports `buildApp` from `./built-app`), applied with `grep`, splits the test files the census names into the unit files and the built-app files that *Data & interfaces* lists. No test file opens `docs/*.md` or the READMEs (`grep` on the documents' paths).
- **E9, the pull requests.** `gh pr list --state open` printed none on 2026-11-28.
- **Read.** `routing.md`; issues #344, #322, AgenticSeal#1658 and AgenticSeal#1659; `apps/desktop/src/daemon/records-place.ts` (`MARKER`, `ROOT`, `rootOf`, `readmeText`, `workflowText`, `planRecords`); `records-migration.ts` (`EARLIER_ROOTS`, `EARLIER_MARKER`, the plan and the commit); `chain-command.ts#run`; `renderer/view.ts#recordsDialog`; `adapters/claude-roles.ts#rulesHead`; `pr-check/lib/optin.py`; `chain_check.py#root_name`; `.github/scripts/rules.py#records_root`; the cases of `apps/desktop/test/role-bundle.test.ts`, `pane-chain.test.ts`, `heavy-run.test.ts` and `records-place.test.ts` named below; `docs/iadd.md` and `docs/iadd.ko.md` whole; `docs/architecture.md` *Where Owlery started* and *Measure before building*; `CLAUDE.md`. No `seal/follow-up.md` and no `seal/parity.json` stand. The latest GitHub Release's body holds no `### Process changes` table.

## Scope

1. **The place, in the app's code.** The root's name and the marker are declared once, in `apps/desktop/src/shared/protocol.ts` beside `RecordsPlace`, as the lines `export const MARKER = "# What IADD keeps in agentory/";` and `export const ROOT = "agentory";`, each with the docstring it has in `records-place.ts` today. `apps/desktop/src/daemon/records-place.ts` re-exports both from there, so its importers keep their imports. Each literal copy of the root's name in `apps/desktop/src` reads `ROOT` instead: the fallback of `chain-command.ts#run`'s refusal (`root ?? "iadd"`), the blocked message of `records-place.ts#planRecords` (`iadd/ holds something of this repository's own`), and the move's sentence of `renderer/view.ts#recordsDialog`, whose line `frame/keep.txt` holds with ``The commit moves each file to \`${ROOT}/\` ``. Every other place occurrence in `apps/desktop/src`, comments and docstrings among them, becomes `agentory`.
2. **The place, in the pull request check.** `pr-check/lib/optin.py#HOME` becomes `"agentory"`, and `#MARKER` becomes `"# What IADD keeps in agentory/"`. Every place occurrence under `pr-check/` becomes `agentory`: `optin.py`'s docstrings and the local mode's `<git-common-dir>/agentory`, `chain_check.py#root_name`, `.github/scripts/rules.py#records_root`, `lib/config.py`, `lib/routing.py`, `lib/gate.py`, `lib/blocks.py`, `lib/fields.py`, `skills/settle/scripts/rule_changes.py` and `pr-check/README.md`. The fence's word in `lib/fields.py` stays (*Data & interfaces*, kind K3).
3. **The cases.** Every place occurrence under `apps/desktop/test` becomes `agentory`, and `Iadd/` in `records-place.test.ts` becomes `Agentory/`, so the case of a folder whose name differs from the root's in case alone keeps its meaning. Three product lines change. `pane-chain.test.ts`'s comment says that the folder's settings enable the AgenticSeal plugin. Its fixture's `enabledPlugins` drops `"iadd@iadd": true` and keeps `"agentic@agenticseal": true`. `record-blocks.test.ts`'s case *rules of another product* reads `rules: agentic 0.0.2`. One case is added beside `records-place.test.ts`'s check that `optin.py` holds the app's `MARKER`: it checks that `optin.py` holds `` `\nHOME = ${JSON.stringify(ROOT)}\n` ``, and it is seen red with `HOME` left `"iadd"`.
4. **The role bundle.** Every place occurrence under `apps/desktop/role-bundle` becomes `agentory`: the paths `agentory/threads/…`, `agentory/config.json`, `agentory/follow-up.md`, `agentory/parity.json` and `agentory/pact.md`, `skills/core/SKILL.md`'s *the directory named `agentory`*, and the heading of `skills/agent-contract/SKILL.md`'s rule 11. The fence's word `iadd` and every sentence about an `iadd` block stay (K3).
5. **The documents.** Every place occurrence in `docs/` and the READMEs becomes `agentory`, in each English document and its Korean twin, `agentory/workflows/`, `agentory/inspectors/` and `agentory/threads/` among them. These sentences are rewritten, each line exactly as `frame/keep.txt` holds it:
   - `README.md` and `README.ko.md`, the paragraph that opens *Owlery started from AgenticSeal*: on 2026-11-28 the owner set that IADD is the method and a product only expresses it, that the plugin keeps its name `agentic`, and that both tools keep their records under `agentory/` (MichaelYcJo/AgenticSeal#1651, MichaelYcJo/AgenticSeal#1658).
   - `docs/architecture.md` and its twin, the first paragraph of *Where Owlery started*: the owner set on 2026-11-28 that the plugin keeps its name `agentic` and its command `agentic`, and takes IADD's names for the method and its records, under the root `agentory/`.
   - `docs/name.md` and its twin, the bullet *IADD is the method, and Owlery is one tool that runs it*: the method and its records carry IADD's name, and no product takes it.
   - `docs/iadd.md` and its twin, *The rule the names follow*, gain a second paragraph that opens **IADD is the higher concept, and a product only expresses it.** It states the owner's rule of 2026-11-28 (issue #344), the plugin's name `agentic`, and why the records folder is `agentory/`.
   - `docs/iadd.md` and its twin, *Names set aside*, gain a last bullet, which holds neither `iadd` nor `IADD` and so has no line in `keep.txt`: **For the records folder:** the method's own name, since a method holds no folder and its acronym is hard for a newcomer to read as one, and each of these for a collision: `agentics` (githubnext/agentics), `agency` (agency-agents, Agency Swarm), `agents`, `agentworks`, `agentarium`, `ai-trail`, `inspections` and `iagentics`. The Korean bullet opens **기록 폴더의 이름으로:** and says the same.

   No heading and no table row is added or removed, so each Korean twin keeps the broad gate's counts.

**Out of scope.**

- **This repository's own records and pin.** `seal/`, `seal/README.md`'s marker and `.github/workflows/owlery-seal.yml` at `v0.1.0` stay, as #322 *When it lands* step 4 states.
- **The records of #322 and #323 under `seal/threads/`.** They are other work items' records, which the settle after the release removes. `frame/keep.txt` holds their lines as E1 printed them.
- **Reading `iadd/` as an earlier form.** Issue #344 *Scope* item 1 says no release shipped it. `records-migration.ts#EARLIER_ROOTS` stays `seal` and `agentic-seal`.
- **The bundle's `seal <subcommand>` mentions**, such as AgenticSeal's `seal mutate` in `agents/crafter.md` and `seal unverified .` in `skills/verify/SKILL.md`. They hold no `iadd`. They name the CLI of AgenticSeal 0.39.x, which the bundle's documents were taken from, as `claude-roles.ts#rulesHead`'s docstring says. Their move to `agentic <subcommand>` names the plugin's release that carries #1658, which has not shipped (`plan.md` *Alternatives considered*).
- **The file names `docs/iadd.md` and `docs/iadd.ko.md`.** They are the method's definition.
- **Line 273 of `role-bundle/skills/writing-style/SKILL.md`**, which calls `iadd` the example of the section *여럿이 가질 수 있는 것은 누구 것인지 밝힌다*, whose table shows *the inspection*. The mismatch stood before this work: #322's rename turned the plugin's `seal` there into `iadd`. The line holds the method's name, kind K5.

### What the daemon could do beyond the issue

- **Name a root folder that opens with another build's marker.** The daemon reads every connected repository's main checkout. A folder whose `README.md` opens with a marker of an earlier build, such as `# What IADD keeps in iadd/` from a build of the release branch, could be named in the repository's row rather than passed over as a project's own folder. Not taken: issue #344 *Scope* item 1 says nothing reads `iadd/`, and no release wrote it.
- **Say which root the pinned check reads.** The workflow pins a version of the check, and a check of another version may read another root. The daemon could read the pinned version against its own and say in the records dialog which root that check finds. `records-place.ts#readRecordsPlace` already offers the move of the pin, so this would add a sentence and no decision. Not taken: it is a feature of the records dialog, outside a rename.

## User scenarios & acceptance *(mandatory)*

Each `\|` inside a command in the table below is a `|` escaped for the table, and is typed as `|`.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| A new repository is connected | Given a repository with no records root, when the person confirms the setup, then the commit writes `agentory/README.md`, whose first line is `# What IADD keeps in agentory/`, and `agentory/config.json` | `apps/desktop/test/records-place.test.ts` and `records-dialog.test.ts`, whose cases name `agentory/README.md` and the marker letter by letter |
| A repository in the earlier form moves | Given a repository whose records stand under `seal/` with `# What AgenticSeal maintains in seal/`, when the person confirms the move, then the commit moves each file to `agentory/` in IADD's forms, each block's opener `iadd`, and writes `.github/workflows/owlery-inspection.yml` | `records-migration.test.ts`, the case that opens *makes the one commit the plan names*; `records-dialog.test.ts`; `view.test.ts` |
| The pull request check judges a work item | Given a pull request whose branch `agentory/threads/<id>/routing.md` names, when the check runs, then it reads the records under `agentory/` and posts `inspection` | `pr-check.test.ts`; the case *Scope* item 3 adds, which reads `HOME` in `optin.py` |
| A project's own folder of the root's name | Given a repository that holds an `agentory/` of its own without the marker, when the setup is planned, then it is refused with a sentence that names `agentory/` | `records-place.test.ts`, the cases built on `OWN` and on `says` |
| A pane carries the chain | Given a folder whose settings enable `agentic@agenticseal`, when a pane opens there with Owlery's workflow, then it carries the chain | `pane-chain.test.ts` |
| The census | When the work is done, `git grep -i -P 'iadd' -- . ':!seal/threads/1795837193-344-the-records-root-is-agentory' \| diff - seal/threads/1795837193-344-the-records-root-is-agentory/frame/keep.txt` prints nothing | The command. Run at `078b3630`, it prints the 808 lines of E3, each a line the build changes. The pathspec leaves out this work item's own directory, whose frame quotes the patterns |
| The place's spelling | When the work is done, `git grep -h -o -i -P '\w*agentor\w*' -- . ':!seal/threads/1795837193-344-the-records-root-is-agentory' \| sort -u` prints `Agentory` and `agentory` and nothing else, and `git grep -n -P 'Agentory' -- . ':!seal/threads/1795837193-344-the-records-root-is-agentory'` prints lines of `apps/desktop/test/records-place.test.ts` alone | The commands. Run at `078b3630`, the first prints `agentory`, from E4's line, and the second prints nothing. The build writes `agentory` and `Agentory` and no other spelling of the place |
| The Korean twins | When the work is done, each `docs/*.md` and `README.md` holds as many headings and table rows as its `.ko.md`, and no `도장` stands there | The documents' part of `seal/config.json`'s `Broad gate`, which the orchestrator's broad run holds |

## Data & interfaces

### Three layers, one spelling each

| Layer | Spelling after this work | Where the census meets it |
|---|---|---|
| The method | `IADD`; `IADD-Routing:` and `IADD-Built-By:`; the fence's word `iadd`; `docs/iadd.md` | the kinds K1 to K6 below, every line of which `frame/keep.txt` holds |
| The product, the plugin | `agentic`, `agentic@agenticseal`, the command `agentic` | the sentences of *Scope* item 5 and the three lines of *Scope* item 3 |
| The place | `agentory`, `agentory/`, `<git-common-dir>/agentory/`, the marker `# What IADD keeps in agentory/` | every other occurrence |

`RecordsPlace.root` in `apps/desktop/src/shared/protocol.ts` carries `"agentory"` where a root stands. The daemon stores no root's name: it reads the main checkout at each call (`records-place.ts#rootOf`).

### How an occurrence is classed

An occurrence of `iadd`, in any case, is the method's where it is one of these kinds, and each kind's reason is why the design keeps it:

- **K1, `IADD` in capitals.** The method's name, its line *Zero Self-Approval*, the phrases *IADD's forms*, *IADD's root* and *IADD's marker*, which name the method's records, and the trailers `IADD-Routing:` and `IADD-Built-By:`. Issue #344's table keeps all of these, and a committed trailer cannot be rewritten.
- **K2, `docs/iadd.md` and `docs/iadd.ko.md`**, and every link to them, `iadd.md#…` among them. The method's definition keeps its name.
- **K3, the fence's word.** The opener of a record's block, written `` ```iadd ``, `~~~iadd`, `${F}iadd`, `${FENCE}iadd`, `${fence}iadd`, `F + "iadd`, or with escaped backticks; `INFO = "iadd"` in `record-blocks.ts` and `lib/fields.py`, and `OPENER` in both; and every sentence about it, such as *an `iadd` block*, *`iadd` alone on the line*, *three backticks and `iadd`*, *a fence of tildes named iadd*, *a word after iadd* and *each block's opener to `iadd`*. The opener is a record form's spelling, the layer of the trailer and the verdict lines that issue #344 and AgenticSeal#1658 keep, and the plugin's reader spells it `iadd` (E6). The migration's writes of the opener in place of the earlier `seal` fence are of this kind too.
- **K4, the name's search.** *Lowercase `iadd` is Python's in-place add* in `docs/iadd.md` *Names set aside*, and its Korean sentence.
- **K5, the writing style's example**, line 273 of `role-bundle/skills/writing-style/SKILL.md` (*Scope*, out of scope).
- **K6, the history.** Every line of #322's and #323's records under `seal/threads/`, the binary file's line among them.

An occurrence is the product's where it names the AgenticSeal plugin or its command: *the plugin `iadd`*, *becomes `iadd`*, *플러그인 `iadd`*, *`iadd`가 되는*, `iadd@iadd` and `rules: iadd`. Every other occurrence is a place. A line whose occurrences are all the method's stands in `frame/keep.txt` as E1 prints it. A line that also holds a place stands there with the place renamed, so the build leaves it as `keep.txt` holds it. A line with a product's spelling is rewritten (*Scope* items 3 and 5).

### The readers that read a name letter by letter, and the case that goes red for each

A reader that keeps the old name finds no root and reports *no work item*, and nothing raises. Each reader below has a case that fails where the reader keeps `iadd`, and the case spells the new name literally, not through the constant it tests.

| Reader | The case that goes red | What the red shows |
|---|---|---|
| `records-place.ts#ROOT`, `#MARKER` and `#rootOf`, read by `chain-command.ts`, `daemon.ts`, `decision-record.ts`, `settle.ts`, `stage-records.ts` and `records-migration.ts` | `records-place.test.ts`'s `readRecordsPlace(…).root` cases expect `"agentory"`. `chain-command.test.ts`'s case *refuses every subcommand of the chain in a worktree whose records root is in the earlier form alone* expects the first line `# What IADD keeps in agentory/`. `daemon.test.ts`, `decision-record.test.ts`, `settle.test.ts` and `chain-records.test.ts` write their roots at `agentory/` | `rootOf` finds no root under the fixtures' `agentory/`, so each case that expects a work item fails |
| The copies that *Scope* item 1 replaces with `ROOT` | `heavy-run.test.ts`'s refusals expect `agentory/config.json`. `records-place.test.ts`'s `OWN` and `records-migration.test.ts`'s blocked plan expect `agentory/ holds something of this repository's own`. `view.test.ts` expects ``The commit moves each file to \`agentory/\` `` | the sentence differs |
| The migration's target and the workflow it writes | `records-migration.test.ts`, *makes the one commit the plan names*, expects every moved path under `agentory/`, the README's first line, and `.github/workflows/owlery-inspection.yml` | the moved paths differ |
| `pr-check/lib/optin.py#HOME`, `#MARKER` and `#home_at`, read by `chain_check.py#root_name` and `rules.py#records_root` | `records-place.test.ts`'s check that `optin.py` holds `MARKER`, and the check *Scope* item 3 adds, that it holds `HOME = ${JSON.stringify(ROOT)}`. `pr-check.test.ts`'s literal `MARKER` and its judged cases under `agentory/threads/` | the check judges no work item, so each case that expects a refusal or `cleared` fails |
| The bundle's sentences that a case reads letter by letter | `role-bundle.test.ts` expects `` the repository's `agentory/config.json` `` in `skills/agent-contract/SKILL.md`, and `` `agentory/threads/<id>/trail/rounds/round-N.md` `` in `docs/forms/the-round-record.md` | the sentence is missing |
| The bundle's text that names the plugin's command | none to write: the bundle names no plugin command as `iadd`, as E1 shows, and its `seal <subcommand>` mentions are out of scope | — |
| Page-evaluated strings in built-app cases | `records-dialog.test.ts` expects `["agentory/README.md", "agentory/config.json", WORKFLOW]` and ``"Records: \`agentory/\`"`` from the page. `work-item-menu.test.ts` expects `agentory/README.md` from the page. `tsc` reads neither the evaluated code nor the expected strings, so E5's word check is what shows a key dropped inside them | the page's text differs; a dropped key shows in the word check before any run |

The built-app files the census names are `approval-line`, `decisions-and-questions`, `inspection-sheet-view`, `machine-dialog`, `pane-session`, `records-dialog`, `role-bundle`, `screenshots` and `work-item-menu`, each `apps/desktop/test/<name>.test.ts`. `screenshots.test.ts`'s renamed lines run only under `OWLERY_SCREENSHOTS=1`. `pane-session.test.ts`'s run only under `OWLERY_PANE_RUN=1`, which starts a real Claude Code session on the person's login. The helpers `apps/desktop/test/chain-run.ts` and `chain-command-run.ts` change too, and the built-app file `daemon-restart.test.ts` imports `chain-run.ts`.

## Rule changes

- nothing
  why: this work item's subject includes the policy root's own text, the names `docs/iadd.md` defines, so it writes each sentence it changes into `docs/` in its pull request, as *Scope* item 5 states and as #322 did. A rule left for the settle would leave `docs/iadd.md` naming `iadd/` in the release that ships `agentory/`.

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| The fixture's `"iadd@iadd": true` | `apps/desktop/test/pane-chain.test.ts`, the case that opens *gives the chain in a folder on the owl chain whatever plugins* | The plugin is not registered anew (AgenticSeal#1658), so no plugin `iadd@iadd` exists. `"agentic@agenticseal": true` stays in the fixture |
| The literal copies of the root's name | `apps/desktop/src/daemon/chain-command.ts#run`, `records-place.ts#planRecords`, `apps/desktop/src/renderer/view.ts#recordsDialog` | `ROOT` in `apps/desktop/src/shared/protocol.ts` (*Scope* item 1) |
| The sentences that say the plugin becomes `iadd` | `README.md` and `README.ko.md`; `docs/architecture.md` *Where Owlery started* and its twin; `docs/name.md` and its twin | The sentences *Scope* item 5 gives |
| No mechanism is added | — | `frame/keep.txt` and the commands of *User scenarios & acceptance* are this work item's record and checks, which leave with its directory at the settle. No gate, check, hook, CI step or mark is added |

Framed 2026-11-28 by framer, before the build.
