# Implementation Plan: a daemon that cannot read its repositories file keeps it (#257)

## Technical context

The tree as read at `5370d534`.

The work changes one read and one sentence's road to the window. The read is `RepositoryStore`'s constructor (`apps/desktop/src/daemon/repositories.ts:258-292`): `readJson` (`:203-215`) gives `undefined`, `null` or a value, and the refusal is the early `return` at `:272`. The set-aside goes in that path, before the `return`, and is the only place where the store renames anything. It reads the store's `now` (`:260`) for the stamp, so the cases fix the name. The write stays `writeWholeFile` (`apps/desktop/src/daemon/whole-file.ts:23-36`), and a store whose rename failed sets its `file` to `undefined`, the path a store with no run folder already takes in `write()` (`:459-460`).

The sentence's road is the one `agentNotice` takes, less the message that changes it: the daemon's constructor (`apps/desktop/src/daemon/daemon.ts:604-626`) holds it, `accept`'s `ready` (`:974`) sends it, the window's `ready` handler (`apps/desktop/src/renderer/renderer.ts:1899`) holds it in `held` (`apps/desktop/src/renderer/shared.ts:25-26`), and `showStatus` (`apps/desktop/src/renderer/sidebar.ts:85-89`) draws it through `statusNotice` (`apps/desktop/src/renderer/view.ts:920-922`).

The cases build on the existing harnesses: `runDir()` and the `PLACE`, `OWN`, `UNSET` and `PLAIN` fixtures of `apps/desktop/test/repositories.test.ts:14-37`, and `daemon()`, `client()` and `repository()` of `apps/desktop/test/daemon.test.ts`, with a run folder made as the case at `:886-900` makes one. The `addRepository` message is `{ type: "addRepository"; requestId; folder }` (`shared/protocol.ts:878`).

The failure scenario of the chosen approach, six months on: a person moves between two builds several times. Each start of the earlier build keeps one more `repositories-unread-*.json` in the run folder, and nothing reads any of them. A person who adds repositories before reading the status line has a new store with what that build was given, while the work items of the kept file stand on disk unlisted, their worktrees and branches whole. Getting them back is a rename by hand while the daemon is stopped, which the notice names the path for. *What the daemon could do beyond the issue* in `frame/design.md` names the offer that would make it a press.

## Alternatives considered

| Approach | Failure scenario | Verdict |
|---|---|---|
| Keep the refused file aside under a name of its own, start empty, and say so in the status line | The scenario above: kept files gather in the run folder, and getting one back is by hand. | Chosen. |
| Refuse to start the daemon where the file is refused | The window shows the log's last line as why the daemon did not start (`daemon/main.ts:110-111`), and the person cannot use Owlery at all under that build until they move the file themselves. A downgrade to look at one thing becomes a dead app. | Rejected. |
| Read what the store can of the file, and keep the original aside | The new `repositories.json` holds the repositories whose entries passed and drops the work items that failed, such as each one with no branch. Back on the later build, the person meets a store that lost exactly the work items the later build made, while the kept file holds them. The counts and ids of a part-read file need a rule of their own. The issue's *Done when* says the daemon starts empty. | Rejected. |
| Leave the refused file where it stands and keep the store in memory alone | Nothing a person does under that build outlives the daemon, and every restart refuses the same file again, so the build cannot keep a repository at all. | Rejected as the way, and kept as the fallback where the rename fails (*Scope* item 3), where no other way leaves the file whole. |
| Keep a copy of the previous write at each write, as `repositories.json.bak` | The refusing daemon's first change copies the file it refused, but its second change copies its own empty store over that copy. The loss comes one change later. | Rejected. |
| Write a version number into the file, and have a daemon refuse a file of a later version | Only builds after the number know it, so a file this build cannot read for any other reason still needs the set-aside. It adds a field every later shape change has to keep in step. | Rejected: the set-aside covers the later version and every other refusal at once. |
| Replace the whole-file JSON store with another kind of store, such as SQLite or an append log | A change of format on the week of the release, a migration of every person's file, and the same question for a build that cannot read the new format. The loss is in the refusal path of the read, and not in the format. | Rejected. The premise that keeps the structure, checked: the write is already whole and atomic through `writeWholeFile` (read: `whole-file.ts:17-36`), and the refusal is one `return` (`repositories.ts:272`), which this work replaces. |
| Send the store's notice in the `agentNotice` slot | `readAgentNotice` replaces `this.agentNotice` with the adapter's answer at the daemon's listen and at each window's connection (`daemon.ts:648`, `:935`, `:4651-4660`), so the store's sentence goes at the adapter's first answer. | Rejected. |
| Send `storeNotice: string \| null` in every `ready` | `daemon.test.ts:581` and `:7130` pin the exact keys of `ready`, and #133's branch changes the same two lines and the same `send` line (*Overlap with the release*). An optional key is how `keepAwake` and `machine` are sent (`daemon.ts:974`). | Rejected for an optional `storeNotice?: string`. |
| Say it in a system notification (`renderer/notifier.ts`) | A notification is shown once, while a window is open, and is gone; the daemon starts at a time no window may be open. | Rejected. |

## Phases

| Phase | Delivers | Verified by | Status |
|---|---|---|---|
| 1 | *Scope* items 1, 2, 3 and 4, and item 7's sentence in `repositories.ts`: the store keeps aside a file it refuses, under a name nothing stands at, falls back to memory alone where the rename fails, and answers `setAside()` and `setAsideNotice`. The case of `frame/design.md` *Removes*' first row is rewritten there. | The cases of `frame/design.md` *User scenarios & acceptance* rows 2, 3 and 4 in `apps/desktop/test/repositories.test.ts`, each shown red against `5370d534` as contract rule 15 asks, and the file's other cases unchanged and passing, run by the crafter as the narrow run of that file. | |
| 2 | *Scope* items 5, 6 and 7's other texts: the daemon holds the sentence and sends `storeNotice` in `ready` where it stands, the protocol's comment names it, and the window's status line says it in the order of item 6. | The case of `frame/design.md` *User scenarios & acceptance* row 1 in `apps/desktop/test/daemon.test.ts`, shown red against `5370d534`; the `statusNotice` cases of `apps/desktop/test/view.test.ts` with the store's argument; the key pins at `daemon.test.ts:581` and `:7130` unchanged and passing. The broad gate is the orchestrator's, after the rounds. | |

## Overlap with the release

Each item the spawn names was read on its branch at `origin` after `git fetch` on 2026-11-26, with the diff from its merge base with `origin/release/v0.0.5` (`f683c693`). None of them changes `repositories.ts` or `apps/desktop/test/repositories.test.ts`, so phase 1 meets nothing. Phase 2 meets those that change the daemon, the protocol or the window's files. Every item below stands past its first review round or in its build, and this one is framed alone, so each merges first, and this branch takes their changes in the merge base step of the tail. That costs one short merge of this small diff, where the other order would hand each of them a merge in rounds they have spent.

| Work item | Where both change | Merges first | Grounds |
|---|---|---|---|
| #133, on the combined branch of #215, #216 and #133 (`feat/133-a-daemon-of-another-build-stays-until-a-person-restarts-it`) | `apps/desktop/src/daemon/daemon.ts`, the `ready` send in `accept`, where #133 adds `answersUnknown: true` and this work adds `storeNotice`; `shared/protocol.ts`, the `ready` member and its comment; `renderer/renderer.ts`, the `ready` handler; `renderer/sidebar.ts`, the `view` import line #215 widens; `daemon.test.ts`, the two key pins of `ready`, which #133 changes and this work leaves as they are. | #133 (with #215 and #216) | It stands at review round 2 and its diff is the largest of the release (1,580 lines added in `apps/` from its merge base, executed: `git diff --stat`). This work's lines there are one key in a `send` and one field in a type, so the merge is a line's reconciliation on this side. |
| #132 (`feat/132-an-app-update-leaves-a-connected-repositorys-seal-check-pinned`) | `renderer/sidebar.ts`, the `view` import line, where #132 adds `checkButton`; `daemon.ts`, `protocol.ts`, `renderer.ts`, `view.ts`, `daemon.test.ts` and `view.test.ts` in other places (a repository's `records.olderCheck`). | #132 | It stands at review round 1, and the shared line is one import. |
| #213 (`feat/213-a-panes-tab-has-no-menu`) | `daemon.ts`, `protocol.ts`, `renderer.ts`, `view.ts`, `daemon.test.ts` and `view.test.ts`, in the panes' tabs and their marks, away from the `ready` send, `statusNotice` and the store. | #213 | It stands at review round 2. Both change the same files, and no line of one meets a line of the other (read: the hunks of `git diff` on `daemon.ts`). |
| #223 (`fix/223-the-approval-line-says-not-started-while-a-panes-session-runs-a-stage`) | `daemon.ts`, `daemon/main.ts`, `protocol.ts` and `daemon.test.ts`, in a pane's stage, away from the store and the status line. | #223 | Its first phase is built, and the files are shared without a shared line. |
| #278 (`docs/278-the-roadmap-fixes-each-releases-number-when-its-milestone-opens`) | None. It changes `docs/architecture.md` and `docs/architecture.ko.md` outside *State lives in three places* and keeps every heading (executed: the section and the headings compared between `origin/release/v0.0.5` and its branch). This work writes no policy document: its `## Rule changes` are written at the settle. | either | The two do not meet. |

## Operational impact

- No migration. A file the store reads is read as before, and a file it refuses is renamed, never rewritten.
- `ready` gains an optional `storeNotice`. A window of an earlier build ignores the key. A window of this build on a daemon of an earlier build reads its absence as nothing to say.
- The run folder may gain files named `repositories-unread-<UTC time>[-<n>].json`, readable by the user alone as `repositories.json` was, and the daemon never removes them.
- The protection holds for a move back to this build or a later one alone. `v0.0.4` and earlier builds write over a file they refuse, so #217's way round stands for them: copy `repositories.json` before running such a build (`seal/threads/1795610869-217-a-new-work-item-picks-its-branch/changelog.md`). The changelog fragment of this work says both.
- No new dependency, environment variable or version move.

## Judgments of the run

| Date | Judgment | Grounds | Judged against |
|---|---|---|---|
| | | | |
