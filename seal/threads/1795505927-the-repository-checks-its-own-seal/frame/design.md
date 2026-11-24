# Design: the repository checks its own seal (#146)

## Grounding

The tree as read at `87201ce`, the commit of this work item's `routing.md` on `18f9158` of `release/v0.0.3`. The ticket is issue #146, read with `gh issue view 146 --json title,body,comments` (executed). Its body folds the owner's three decisions of 2026-11-24. Its one comment records the move to `release: 0.0.3` and changes nothing of the request. `routing.md` of this work item was read first. `seal/follow-up.md` does not exist at this commit. `seal/threads/` holds two other work items, #183's and #182's. The first states no rule change. The second states operations on `docs/architecture.md` *Overall layout* and `docs/product.md` *Foundation*, sections this work does not touch. The note of the latest GitHub Release, `v0.0.2`, holds no `Process changes` heading (executed: `gh release view --json tagName,body`), and neither changelog fragment under `seal/threads/` holds one (read).

| Policy clause | What it fixes for this work |
|---|---|
| The issue's body, *Decided by the owner, 2026-11-24* (read) | The check is named `seal`, and its title says the state and that the owl chain gave it. Owlery's chain is the owl chain, apart from AgenticSeal's. This repository's pull requests move from `hygiene.yml` to Owlery's own check once #181 and this issue land |
| `docs/architecture.md` *Compatibility with AgenticSeal* (read) | It says that the plugin's check and Owlery's both read this repository's records until Owlery seals its own pull requests. This work ends that, and the issue's *Done when* asks the section to say where it ended |
| `docs/architecture.md` *Records are committed to the repository*, "When a repository is first connected", the sentence "A file that is committed is kept as it is" (read) | The app never rewrites a committed workflow. So this repository's workflow is written by a pull request, and a later version reaches it only through another pull request |
| The same section, "The PR check runs on GitHub without the app" (read) | The workflow fetches `pr-check/` at the tag of the release that wrote it, and at the release's branch until the tag exists. So the check that judges a pull request is the release branch's, and never the pull request's own copy |
| The same section, "The check posts its verdict", the sentence "A posted check may end as neutral, which a job cannot" (read) | The job and the posted check stay two checks. Release 0.0.2 argued that through (`seal/threads/1795395059-pull-request-and-seal-check/frame/plan.md` at `4a0aa93`, read), and this frame does not argue it again. Two checks on one commit need two names |
| The same section, "Whether a seal holds", its last two sentences, and `docs/product.md` *The seal* item 2, its last two sentences (read) | The app and the check are held to one answer for a seal Owlery gave, and may answer apart on records another tool wrote. So the check does not say that the owl chain gave a seal whose record the owl chain did not write |
| `docs/product.md` *The seal* item 2, and `README.md` *The seal check on GitHub* (read) | Both name the check `Owlery seal`. `docs/architecture.md` hands the check's name, its results and how it is made required to the `README.md` section |
| `docs/roadmap.md` *Why this order*, ground 4, its last sentence (read) | It says that issue #146 moves this repository's check. After this work the sentence states a thing done |
| The plugin's `skills/core/SKILL.md`, the paragraph under the invariants' table (read) | Before the pull request, the plugin's four invariants are held by its sealer's first step and by the orchestrator, with or without a workflow. So the plugin's process keeps its holds in this repository after `hygiene.yml` goes |
| The plugin's `skills/implement/SKILL.md` *Document layout — two roots, three lifetimes* (read) | The framer judges the work item's subject. *Scope* states the judgment |

What the code holds, each read at `87201ce`:

- `.github/workflows/hygiene.yml` clones the AgenticSeal plugin at `v0.38.4` and runs two steps: the plugin's `chain_check.py` against the base branch, and `seal mode --check`. Its pin was moved by hand in pull request #156 (executed: `git log --oneline -- .github/workflows/hygiene.yml`).
- `.github/workflows/` holds no `owlery-seal.yml`. `apps/desktop/src/daemon/records-place.ts#workflowText` composes that file for a version: the workflow `seal`, one job with the id `seal`, a clone of Owlery's repository at `v<version>` or at `release/v<version>`, and `chain_check.py` run with `--post`. `apps/desktop/package.json` gives the version `0.0.3`.
- `pr-check/skills/code-review/scripts/chain_check.py` posts the check under `CHECK_NAME`, `"Owlery seal"`, and `#outcome` gives its title from seven constants. Its first paragraph says that `.github/workflows/hygiene.yml` runs it.
- `pr-check/lib/fields.py` reads `built-by:`, `judged-by:`, `model:` and `rules:` in a verdict block, each at most once, so the owned check reads the keys issue #42 added and passes a block that holds none of them. The value of `rules:` reads `owlery <version>`.
- `apps/desktop/src/daemon/github.ts#sealSection` writes the body's seal section under the heading `## Owlery seal`, with a sentence that names the check. The check reads the verdict block between the two marker lines and no heading.
- `apps/desktop/src/renderer/view.ts#requiredCheck` gives the dialog's sentence on the check by the workflow's path, and names the check three times.
- The cases of `apps/desktop/test/pr-check.test.ts` build every routing with `Planning | the session`. None builds a routing that names a framer, and none reads a body the plugin composed.

Executed at `87201ce`:

- **The owned check passes the records the plugin's process wrote.** From a `git clone --no-local` of this worktree under the framer's scratch directory, `python3 <clone>/pr-check/skills/code-review/scripts/chain_check.py --baseline <the merge commit's first parent>` ran on the head commits of the merged pull requests #190, #189, #177 and #174, each fetched from `refs/pull/<N>/head`, with `GITHUB_EVENT_PATH` naming a payload of a ready pull request that held the body `gh pr view <N> --json body` gave. Each run exited with 0 and printed two lines: that it judged a ready pull request, and that it did not read the body, which holds no `<!-- owlery:seal -->` line. The probe passed no `--post` and sent nothing.
- `git grep -n -w -e 'Owlery seal' 87201ce -- . ':!seal/threads'` printed 58 lines, in the files *Removes* row 2 lists. The same search without `-w` printed four more, each the words "Owlery seals", which name no check. Scenario 9 states the search.
- The same search with `':!docs' ':!README.md' ':!README.ko.md' ':!pr-check/README.md'` added printed lines of files under `apps/desktop/` and of `chain_check.py` alone. `frame/plan.md` phase 2 states that search.
- `git ls-files .github/workflows` printed `check.yml` and `hygiene.yml`.
- `git ls-remote --tags --heads origin` printed the tags `v0.0.1` and `v0.0.2` and the branch `release/v0.0.3`, and no tag `v0.0.3`. So the workflow of version `0.0.3` fetches the check from the branch `release/v0.0.3` today.
- `gh api repos/MichaelYcJo/owlery/rules/branches/main` and the same for `release/v0.0.3` each printed one rule, of the type `pull_request`. No rule of this repository requires a status check.
- The plugin's reader of rule changes (`skills/settle/scripts/rule_changes.py#parse`, with the policy root `docs`) read *Rule changes* of this file with no operation, no error and no unread line.
- `grep` for `built-by` and `judged-by` in `lib/fields.py` of the installed plugin, 0.38.7, printed nothing. The plugin's reader refuses a line of a block that it does not know, so its check refuses a verdict block the owl chain wrote, as the issue says.

The frame of #181, read with `git show` at `fec88dc` of its branch: its *Scope* item 1 reads a folder as on the owl chain where `.github/workflows/owlery-seal.yml` stands in it. Its *Out of scope* leaves this repository's check and *Compatibility with AgenticSeal* to this work. Its pull request edits `docs/` directly. Its *Scope* item 15 rewrites `docs/product.md` *The seal* item 2 and item 17 rewrites `docs/roadmap.md` *Why this order* ground 4, in a phase not built at that commit. Its plan says that #181 merges before #146. At `fec88dc` its branch removed `apps/desktop/test/get-a-seal.test.ts`, added one line that names the section's heading in `apps/desktop/test/chain-command.test.ts`, and changed one hunk of `chain_check.py`, the refusal in `#guarantee`.

Not run, and nobody's finding yet:

- How GitHub reads two check runs of one name on one commit where a rule requires that name. No probe can run without posting a check on GitHub. The design gives the two checks two names and rests nothing on the answer.
- That the workflow, run by GitHub on a pull request of this repository, fetches the check, passes this work item's records and posts the check. No workflow of Owlery's has run on a pull request of this repository. `frame/questions.md` Q2 holds it.

## Scope

**The subject of this work item is the check's name in every text that states it, and this repository's own workflow. Its pull request edits `docs/` directly.** The issue's *Done when* asks that no line names `Owlery seal` as the check and that *Compatibility with AgenticSeal* says where the compatibility ended, and the sealer reads both against the tree. #181 edits the same documents directly in this release, and the owner's walk (#184) reads them before any settle. So *Rule changes* holds the no-change block.

**The owned check reads both forms of record: the owl chain's and the plugin's process's.** The plugin's process builds this work item and may build later ones, and the pane's choice of #181 lets a person keep the plugin for a repository. The check already reads both (*Grounding*, the first executed bullet), so this work changes no reader and adds the case of item 10.

**"The first pull request Owlery's daemon seals" in the issue's *Done when* is the first pull request the owl chain seals.** #181 leaves no client that starts the daemon's chain until issue #55, so the first seal Owlery's code gives a pull request of this repository is the chain command's, in a pane. #181's `docs/roadmap.md` text names that pull request as #176's. The switch lands before it by the merge order of `frame/plan.md` *Overlap with the release*: #181, then #146, then #176.

In scope:

1. **The check `--post` sends is named `seal`.** `chain_check.py#CHECK_NAME` reads `"seal"`. The two sentences the check prints about the post, and each docstring that names the check, follow the constant.
2. **The posted title names the owl chain where the record says the owl chain gave the seal.** A verdict block that holds a `rules:` line is one the owl chain wrote. Where every block the title names holds that line, the title of a seal reads `Sealed by the owl chain at <commits>` and the title of a broken seal reads `Seal of the owl chain broken: a commit landed after <commits>`. Where a block the title names holds no `rules:` line, the two titles stay `Sealed at <commits>` and `Seal broken: a commit landed after <commits>`. The other five titles stay as they are, since each names a state no chain gave.
3. **The workflow's job is named `records`.** `records-place.ts#workflowText` writes the job's id as `records`, and its opening comment names the posted check `seal` and says of the file only what holds both where Owlery wrote it at a connection and where a pull request committed it, as in this repository (`trail/phases/phase-1.md`): that the file fetches the check at one release, and that the version line moves when the file is written again. The workflow's name stays `seal` and its file stays `.github/workflows/owlery-seal.yml`. `frame/questions.md` Q1 holds the name.
4. **The body's seal section names the check `seal`.** `github.ts#sealSection` writes the heading `## Seal` and the sentence with the check's new name. The two marker lines stay, so a body an earlier build wrote is still read and still replaced.
5. **The dialog "Records and check" names the check `seal`.** `view.ts#requiredCheck` says `seal` in the sentence for Owlery's workflow and in the sentence for AgenticSeal's `hygiene.yml`.
6. **The check's opening paragraph names the workflow that runs it.** `chain_check.py` says that `.github/workflows/owlery-seal.yml` runs it.
7. **Every case that pins the name, a title, the heading or the job's id pins the new one.** The files are those of *Removes* rows 2 and 3 under `apps/desktop/test/`. The screenshot run's list of checks names `records` and `seal`.
8. **This repository's workflow is the one Owlery writes for its own version.** `.github/workflows/owlery-seal.yml` holds what `workflowText` gives for the version of `apps/desktop/package.json`. A case of `apps/desktop/test/records-place.test.ts` reads the file and the function and fails where they differ, so the pull request that moves the version rewrites the file.
9. **`.github/workflows/hygiene.yml` goes whole.**
10. **A case holds the reading of the plugin's form.** A case of `apps/desktop/test/pr-check.test.ts` builds a branch as the plugin's process leaves one: a routing that names `framer` and `crafter`, `frame/design.md` with the framer's mark and a `## Rule changes` section, `frame/plan.md`, a round record, a gate record, and a guarantee whose verdict block holds `target:` and `Verdict:` alone. The check passes it as a ready pull request whose body holds no seal section, and posts it under the title `Sealed at <commit>`.
11. **`README.md` and `README.ko.md` state the new names.** *The seal check on GitHub* names the check `seal`, gives the two titles of item 2 in the rows of a seal and of a broken seal, names the job `records`, and says that an administrator requires `seal`.
12. **`pr-check/README.md` names the check `seal`.**
13. **`docs/product.md` and `docs/product.ko.md`, *The seal* item 2, name the check `seal`.** The work changes the name alone in the sentences #181 leaves there.
14. **`docs/architecture.md` and `docs/architecture.ko.md`, *Compatibility with AgenticSeal*, say where the compatibility ended.** The section keeps its heading and its first two sentences. It then states five things. From the pull request of issue #146 on, this repository's pull requests are checked by Owlery's own workflow, and the plugin's check reads none of them. The plugin's check refuses the lines the owl chain writes into a verdict block, which is why the two do not run side by side. This repository's workflow is the one Owlery writes for the app's version, and the pull request that moves the version rewrites it. Owlery's check still reads a work item's records in the form the plugin's process writes, which this repository's work items carry while that process builds them. It reads no body the plugin composes. The section's check line names `apps/desktop/test/pr-check.test.ts` and `apps/desktop/test/records-place.test.ts`.
15. **`docs/roadmap.md` and `docs/roadmap.ko.md`, *Why this order* ground 4, state the move as done.** The sentence that issue #146 moves the check becomes one that says this repository's pull requests are checked by Owlery's own check from the pull request of issue #146 on, with a link to *Compatibility with AgenticSeal*.

Out of scope, each with its reason:

- **The release's settle.** `docs/roadmap.md` *Releases and the tracker* says that this repository settles with AgenticSeal's settle. Release 0.0.3 holds designs whose `## Rule changes` that settle writes, so the sentence stays true and the command stays.
- **The refusals of the check's other arms.** They still name `seal` commands and AgenticSeal's templates. `pr-check/README.md` gives each to the issue that builds its stage.
- **`seal/README.md` and the `Mode` key of `seal/config.json`.** Both are the plugin's, and the plugin's process still runs here. No workflow reads the key after this work.
- **The file's name `owlery-seal.yml`, the markers `<!-- owlery:seal -->`, and the check's `User-Agent`.** None is the check's name. #181 reads the file's path.
- **A workflow an earlier release committed in another repository.** The app rewrites no committed file. `frame/plan.md` *Operational impact* says what the changelog fragment tells such a repository's owner.
- **Requiring the check on this repository.** It is a setting on GitHub, and Owlery changes none.
- **The version.** It is `0.0.3` since #183.

## User scenarios & acceptance *(mandatory)*

No case starts the app for this work beyond what a file's existing cases already do, and none starts a real `claude`. Each built-app start sets `OWLERY_BACKGROUND=1`.

| Scenario | Given / When / Then | Verifiable how |
|---|---|---|
| 1. The posted check is named `seal` | Given a sealed branch and a stand-in for GitHub. When the check runs with `--post`. Then the one request names the check `seal`, and the printed line says `posted` with that name | `apps/desktop/test/pr-check.test.ts`, the cases that post |
| 2. The title names the owl chain only for its own seal | Given a verdict block with a `rules:` line. Then the titles of a seal and of a broken seal are those of *Scope* item 2 that name the owl chain. Given a block with no such line. Then the two titles name no chain. And every other title reads as at `87201ce` | The same file |
| 3. The workflow's job is `records` | When `workflowText` composes a workflow. Then it holds the job id `records`, no job id `seal`, the workflow name `seal`, and a comment that names the posted check `seal` | `apps/desktop/test/records-place.test.ts` |
| 4. This repository's workflow is its version's | Then `.github/workflows/owlery-seal.yml` holds the text `workflowText` gives for the version of `apps/desktop/package.json`. The case is shown red once with one line of the file changed | A case of `apps/desktop/test/records-place.test.ts` |
| 5. The plugin's workflow is gone | Then `.github/workflows/` holds two files | `git ls-files .github/workflows` prints `check.yml` and `owlery-seal.yml`. At `87201ce` it printed `check.yml` and `hygiene.yml`: *Removes* row 1 takes the second out and *Scope* item 8 adds the other |
| 6. The check reads the plugin's form | Given the branch of *Scope* item 10. When the check runs on it as a ready pull request with a body that holds no seal section. Then it exits with 0, refuses no line, names the body as not read, and with `--post` sends a success titled `Sealed at <commit>` | A case of `apps/desktop/test/pr-check.test.ts` |
| 7. The body's section | When the daemon composes a seal section. Then its heading is `## Seal`, its sentence names the check `seal`, and a body that holds a section under the earlier heading is rewritten to the new one | `apps/desktop/test/pull-request.test.ts` and `apps/desktop/test/chain.test.ts` |
| 8. The dialog | Then the dialog's sentence for Owlery's workflow and its sentence for AgenticSeal's `hygiene.yml` name the check `seal` | `apps/desktop/test/view.test.ts` and `apps/desktop/test/records-dialog.test.ts` |
| 9. No line names the earlier name | When the build is done and `release/v0.0.3` with #181 is merged into the branch. Then the search of the cell beside prints nothing | `git grep -n -w -e 'Owlery seal' -- . ':!seal/threads'` prints nothing. Every line it printed at `87201ce` is in a file *Removes* row 2 names. The pathspec leaves out `seal/threads/`, where this frame and #181's records quote the name |
| 10. The documents state the names and the end of the compatibility, in both editions | Then each section *Scope* items 11 to 15 name states what its item says, and each English document and its Korean edition hold the same count of headings and of table rows | Review reads the sections. The count is the broad gate's, which the orchestrator runs |
| 11. The workflow judges this work item's own pull request | When the pull request of this work item is opened and made ready. Then GitHub runs the workflow `seal`, its job `records` passes, and no run of `hygiene` appears | The orchestrator reads the pull request's checks (`frame/questions.md` Q2). The check that runs there is the one of `release/v0.0.3`, so it still posts under the earlier name on this one pull request |

## Data & interfaces

**The posted check** (`chain_check.py#post`): the request's `name` is `seal`. Its titles:

| Outcome | Title |
|---|---|
| A seal at the head, each named block with a `rules:` line | `Sealed by the owl chain at <commits>` |
| A seal at the head, a named block with no `rules:` line | `Sealed at <commits>` |
| A broken seal, each named block with a `rules:` line | `Seal of the owl chain broken: a commit landed after <commits>` |
| A broken seal, a named block with no `rules:` line | `Seal broken: a commit landed after <commits>` |
| Every other outcome | As at `87201ce` |

**The workflow** (`records-place.ts#workflowText`): `name: seal`, and under `jobs:` the one id `records`. Its events, its permissions, its clone and its step stay.

**This repository's workflow**: `.github/workflows/owlery-seal.yml`, the bytes of `workflowText("0.0.3")` while the version is `0.0.3`.

**The body's seal section** (`github.ts#sealSection`): the opening marker, `## Seal`, a blank line, the sentence that names the record and the check `seal`, a blank line, the verdict block, the closing marker.

The protocol, the store and the records' grammar do not change.

## Rule changes

- nothing
  why: The subject of this work item is the check's name in every text that states it, and this repository's workflow. Its pull request edits `docs/product.md`, `docs/architecture.md`, `docs/roadmap.md` and their Korean editions directly, as *Scope* items 13 to 15 state. It moves no section and no document, and no unsettled design under `seal/threads/` names a section it changes.

## Removes

| Removes | Coordinate | Where it lands, or why it can go |
|---|---|---|
| 1. The plugin's workflow, with the pin of the plugin's release that a person moved by hand | `.github/workflows/hygiene.yml` | `.github/workflows/owlery-seal.yml` runs the chain check, and the case of *Scope* item 8 holds its version. Two things the file alone answered go with it. The first is that a pull request's body is what `seal pr-body` composes: the plugin's sealer and orchestrator hold that before the pull request opens, and nothing reads a later edit of the body. The second is that the `Mode` key agrees with where the root sits: Owlery has one place for records and nothing reads the key |
| 2. The name `Owlery seal`, in every line that holds it | `README.md` and `README.ko.md`; `pr-check/README.md`; `docs/product.md` and `docs/product.ko.md`; `pr-check/skills/code-review/scripts/chain_check.py`; under `apps/desktop/src/`, `daemon/github.ts`, `daemon/records-place.ts` and `renderer/view.ts`; under `apps/desktop/test/`, `chain.test.ts`, `daemon.test.ts`, `fixtures/sample-gh/gh`, `get-a-seal.test.ts`, `pr-check.test.ts`, `pull-request.test.ts`, `records-dialog.test.ts`, `records-place.test.ts`, `screenshots.test.ts` and `view.test.ts` | Each line names the check `seal`, or the heading `## Seal`. #181 removes `get-a-seal.test.ts` and rewrites `fixtures/sample-gh/gh`, so the lines to rename are those the merged tree holds, and the line #181 adds in `apps/desktop/test/chain-command.test.ts` is one of them |
| 3. The job's id `seal` | `apps/desktop/src/daemon/records-place.ts#workflowText`; the sentence on the workflow's own job in `README.md` and `README.ko.md` *The seal check on GitHub*; the pin in `apps/desktop/test/records-place.test.ts`; the list of checks in `apps/desktop/test/screenshots.test.ts` | The id `records`, so the job and the posted check bear two names |
| 4. The rule that both checks read this repository's records until Owlery seals its own pull requests, and the sentence on what the plugin's check answers with and without `decisions.md` | `docs/architecture.md` *Compatibility with AgenticSeal* and `docs/architecture.ko.md` *AgenticSeal과의 호환* | *Scope* item 14 states what holds now. The second sentence can go because the plugin's check runs on no pull request of this repository |
| 5. The sentence that issue #146 moves this repository's check | `docs/roadmap.md` *Why this order*, ground 4, and `docs/roadmap.ko.md` *이 순서인 까닭*, the fourth ground | *Scope* item 15 |

This work adds three mechanisms and takes one out for each. The workflow `owlery-seal.yml` comes in for `hygiene.yml`, row 1. The case that holds this repository's workflow to its version comes in for the pin a person moved by hand, whose record is pull request #156, opened to move that one line. The case of the plugin's form comes in for the plugin's own check of those records, which ran from `hygiene.yml`. The condition of the title is a sentence of the outcome and no mechanism.

Framed 2026-11-24 by framer, before the build.
