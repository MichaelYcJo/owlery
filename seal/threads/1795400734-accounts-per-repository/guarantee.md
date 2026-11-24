# Guarantee: 1795400734-accounts-per-repository

## The re-audit at `c46e9ce`

The second run audits `c46e9ce` against `c409dbb`. Three commits follow the first run's target, `95d5f36`. Each one touches this work item's records alone (`git log --no-merges --name-only 95d5f36..HEAD`, executed):

- `17bba09` commits this file.
- `9559f09` changes two sentences of `frame/design.md`.
- `c46e9ce` changes one sentence of `changelog.md`.

`git diff --stat 95d5f36 HEAD -- apps` prints nothing, so no claim about the code moved. The first run's re-runs of the code carry to `c46e9ce` unchanged. This run re-reads only the coordinates the three commits touched (executed).

- **The broad gate still covers HEAD.** `git log --no-merges --name-only cdd38c3..HEAD ^c409dbb` lists `trail/gate.md`, `guarantee.md`, `frame/design.md` and `changelog.md` of this work item, and no other path (executed).
- **The body check passes again.** `seal pr-body seal/threads/1795400734-accounts-per-repository --body <the prompt's body file> --check` exited 0 at `c46e9ce` (executed). `pr.md` is unchanged since `95d5f36` (`git diff --quiet`, exit 0, executed).
- **Both sentences the first run found false now hold.**
  - `changelog.md:7` now reads: "A work item's view always names the account its sessions take where they name none of their own. The inbox names it only where it differs from the one the repository gives, and a pane's tab names it only where it differs from the work item's." That is what the tree does. `view.ts:2829` (`viewAccount`) calls `accountFor(null, …)`. `work-item-view.ts:1263` draws it whenever accounts are offered. `view.ts:2816` (`lineAccount`) names an account only where it differs from the repository's. `view.ts:2835` (`tabAccount`) names one only where it differs from the work item's. The fragment's next sentence, "With System default alone, the window shows none of this", covers the window that offers no accounts (read).
  - `frame/design.md:270` now cites "*Scope* 8's "each session says which account it runs under"", and those words are the heading of scope item 8 at `frame/design.md:161` (read).
- **The narrower point the first run raised on `frame/design.md:163` is corrected too.** The sentence now says that, closed on its first item, the menu shows the work item's prefix and about 18 characters of a name. Closed on another account, it shows that account's name without the prefix, cut at the same width. `view.ts:2947` labels each other account by its name alone. `index.html:512` caps the one select at `--tab-width` (read). The comment at `index.html:511` still speaks of the first choice alone. It is a code comment that no commit since changed, and it states nothing false of that choice.
- **No other copy of the false sentences stands.** `git grep -n -e "Scope\* 10's" -e "view name the account where"` over the work item, outside `trail/` and this file, printed nothing (exit 1, executed).

No party now disagrees with the issue or the tree.

## The first run, at `95d5f36`

The audit read the tree at `95d5f36` against `c409dbb`, the commit `release/v0.0.3@{upstream}` and `origin/release/v0.0.3` resolve to. The local branch `release/v0.0.3` stands at `c82c611`, behind its remote, so it was not used.

`trail/gate.md` names `cdd38c3 against c409dbb`. `cdd38c3` is an ancestor of HEAD, and `git log --no-merges --name-only cdd38c3..HEAD ^c409dbb` lists one commit, `95d5f36`, which touches `trail/gate.md` of this work item alone (executed). `seal pr-body seal/threads/1795400734-accounts-per-repository --body <the prompt's body file> --check` exited 0 (executed). `seal/config.json` names English for both language keys, so no `pr.<lang>.md` is owed. `git ls-files seal/parity.json` printed nothing, so no comparison with an original is owed (executed).

The audit found two sentences that the tree contradicts, both in this work item's records. The code, the cases re-run and every other party agree with the issue and with each other.

- **The changelog fragment says a work item's view names the account only where it differs from the repository's, and the view names it whenever accounts are offered.** `changelog.md:7` reads: "The inbox and a work item's view name the account where it differs from the one the repository gives". `apps/desktop/src/renderer/view.ts:2829` (`viewAccount`) returns the work item's account in every case where the window holds accounts. `apps/desktop/src/renderer/work-item-view.ts:1263` draws it whenever `offersAccounts` holds. `apps/desktop/test/view.test.ts:4214` pins the view naming "Work" for a work item with no setting of its own in a repository set to "Work", which is the case where the two do not differ. `frame/design.md:163` agrees with the tree: "A work item's view names the work item's account". The fragment is the text the release notes are built from, so a person would read the wrong rule there.
- **The orchestrator's judgment on round 3, finding 1, quotes words from scope item 8 and names them as scope item 10's.** `frame/design.md:270`, written at `468bd81`, says the choice was "judged against *Scope* 10's "each session says which account it runs under"". Those words are the heading of scope item 8 (`frame/design.md:161`). Scope item 10 (`frame/design.md:163`) holds no such words. The judgment's ground therefore names a coordinate that does not hold it.

## Claims re-run

Each run below took place in a `git clone --no-local` of the worktree at `95d5f36`, under the sealer's scratch directory, with the worktree's installed packages linked in. The runner was `node scripts/test-in-electron.mjs` in `apps/desktop` with `OWLERY_BACKGROUND=1`, after `pgrep -f 'vites[t]'` found no other run. The tree under audit was not changed. Each guard removed for a run was restored with `git checkout` before the next run.

| Claim | Source | Command | Result |
|---|---|---|---|
| The accounts cases pass at the work item's head | `trail/rounds/round-1.md` and every phase record, which name `accounts.test.ts` in their runs | `node scripts/test-in-electron.mjs test/accounts.test.ts` at `95d5f36` | Holds: 43 passed, exit 0 (executed) |
| An account is read as made only where its folder is `accounts/<id>` of the run folder. Before the fix, the case read `[true, true]` where it asks `[false, true]` | `trail/rounds/round-1.md` finding 3, the close `fixed 73110d3` | At HEAD, with only the comparison `&& folder === madeAt(id)` removed from `apps/desktop/src/daemon/accounts.ts:116`: `test/accounts.test.ts -t "reads an account as made only where"` | Holds: the case failed at `accounts.test.ts:218` with `expected [ true, true ] to deeply equal [ false, true ]`, which is the guard it names (executed, seen red) |
| A sign-in pane runs in its command's environment alone, and no variable of the daemon's own reaches it. Before the fix, the variable was present | `trail/rounds/round-1.md` finding 4, the close `fixed 57981ce` | At HEAD, with only the `inherit` argument at `apps/desktop/src/daemon/daemon.ts:2255` set to `true`: `test/accounts.test.ts -t "signs an account in in a pane of no work item"` | Holds: the case failed at `accounts.test.ts:923`, the line that reads `OWLERY_DAEMON_ONLY` in the stand-in's recorded environment, with `expected [ true, true ] to deeply equal [ true, false ]` (executed, seen red) |
| The six cases of a pane's change of account pass at the work item's head | `trail/phases/phase-4.md` *The phase boundary*, and the round 1 close `fixed 1d9beac` | `test/daemon.test.ts -t "scenario (8\|9)"` at `95d5f36` | Holds: 6 passed, 345 skipped, exit 0 (executed) |
| A second change of a pane while the first waits is refused. Before the fix, it was answered `done` | `trail/rounds/round-1.md` finding 1, the close `fixed 1d9beac` | At HEAD, with only the line `if (session.replacing) throw …` removed from `daemon.ts:1725`: `test/daemon.test.ts -t "a second change of a pane while the first waits"` | Holds: the case failed at `daemon.test.ts:7426` with `expected { type: 'done', requestId: 28 }` where it asks the refusal (executed, seen red) |
| No process starts for a change during which the daemon closed | The same close | At HEAD, with only `this.closed \|\|` removed from the re-check after the wait (`daemon.ts:1742`): `test/daemon.test.ts -t "starts no process for a change whose account was removed"` | Holds: the case failed at `daemon.test.ts:7525`, the assertion on the launches after `d.close()`, with a third launch recorded (executed, seen red) |
| A role session gets the account's folder over the login shell's. The new case failed on `expected undefined to be '/Users/person/accounts/work'` against the source before phase 1 | `trail/phases/phase-1.md` *Seen red* | Phase 1's cases of `f812f82` over `apps/desktop/src` of `0c23013`: `test/claude-adapter.test.ts -t "role session's half of scenario 3"` | Holds: the case failed at `claude-adapter.test.ts:220` with that same sentence (executed, seen red) |
| The pane command, the adapter, the pane's chain, the reader of plugins and the ledger pass at the work item's head | `trail/phases/phase-2.md` and `trail/phases/phase-4.md` *The phase boundary* | `test/hooks.test.ts test/claude-adapter.test.ts test/pane-chain.test.ts test/claude-plugins.test.ts test/ledger.test.ts` in one command at `95d5f36` | Holds: 5 files, 148 passed, exit 0 (executed) |
| Owlery reads no credential, Keychain entry or token variable | `frame/design.md` scenario 12 | `git grep -n -i -e 'credentials' -e 'keychain' -e 'find-generic-password' -e 'OAUTH_TOKEN' -- apps/desktop/src` at `95d5f36` | Holds: printed nothing, exit 1 (executed) |
| Round 5's fix diff changes no code beyond one CSS comment | `trail/rounds/round-5.md` | `git diff --stat b76da02 9a58a55`, and the changed lines under `apps` | Holds: one comment line of `apps/desktop/src/renderer/index.html` changed, beside two records (executed) |
| Each screenshot `pr.md` links stands at the commit that last changed it | `pr.md` *Screenshots* | `git log --format=%h -- <shot>` for each of the ten shots | Holds: the inbox, settings and accounts shots last changed at `9202d1f`, the menu shots at `927f12d` and the view shots at `a91b3d9`, the commits `pr.md` links (executed) |
| Second run: the corrected `changelog.md:7` describes what the view, the inbox and a pane's tab name | `c46e9ce` | `git show c46e9ce` read against `view.ts:2816-2838` and `work-item-view.ts:1263` | Holds (read) |
| Second run: the corrected `frame/design.md:270` cites the scope item that holds its words, and `:163` describes both closed states of the Ask menu | `9559f09` | `git show 9559f09` read against `frame/design.md:161`, `view.ts:2947` and `index.html:512` | Holds (read) |
| Second run: the gate's run still covers HEAD, the body check passes, and no stale copy of either false sentence stands | `trail/gate.md`, the body file, the work item | `git log --no-merges --name-only cdd38c3..HEAD ^c409dbb`; `seal pr-body … --check`; `git grep` for the two old phrasings | Holds: only paths of this work item follow `cdd38c3`, the check exits 0, and the search prints nothing (executed) |
| Each row of `frame/design.md` *Removes* stands no more in the tree | `frame/design.md` *Removes* | Each coordinate opened, with `grep` for each quoted sentence in its file; `git diff --stat c409dbb...HEAD -- docs README.md README.ko.md` | Holds. The five comment sentences are rewritten: `claude.ts:107`, `protocol.ts:530`, `claude-plugins.ts:19-27` with `main.ts:62`, `built-app.ts:160-170` and `screenshots.test.ts:14` with `:575`. `#pane-account` and its part of the rule are gone, so `index.html:512` names `#ask-account` alone, and nothing in `apps/desktop/src` reads a pane-bar select. The three rows that belong to the settle concern the policy root, which the diff does not touch (executed for the searches and the diff, read for the rest) |

These claims were read and not re-run:

- Every `seal mutate` count in the phase records.
- The built-app runs: `theme-controls`, `role-bundle`, `chain-choice`, `work-item-menu` and the screenshot run.
- The measurements of the crops by rounds 3 and 4.

The broad gate is the orchestrator's run that `trail/gate.md` records. This audit ran nothing broad.

## The parties

The rows below are the first run's, at `95d5f36`. At `c46e9ce`, the design's two disagreements, the changelog's one and that of the judgment at `468bd81` are each corrected, as *The re-audit at `c46e9ce`* above reads them. Every other cell carries, because no other coordinate changed.

| Party | Says | Agrees with | Disagrees with |
|---|---|---|---|
| The design (`frame/design.md`, `frame/plan.md`, `frame/questions.md`) | Accounts are config folders. The nearest of session, work item, repository and default wins, and every session launches under its account's folder. Sign-in is the CLI's own. A running Claude Code pane's account can change, and the pane resumes its conversation. A refresh runs only on a press. The policy text reaches `docs/` through *Rule changes*, at the settle | The issue's *Done when*, with Q3, Q5 and Q8 left to the owner's walk (#184) as the issue's run of a resumed conversation. The tree at every coordinate this audit opened | `frame/design.md:270`: the orchestrator's judgment names scope item 10 as holding "each session says which account it runs under", which is scope item 8's heading (`:161`). A narrower point, read: `:163` says the closed Ask menu shows "the work item's prefix and about 18 characters of a name". That holds for the first choice. Another choice is labelled by its name alone (`view.ts:2947`), so the prefix is not shown then |
| The build (the diff and the phase records) | Five phases, each with its record. Phase 4 decides Q4 as the same pane id. Every unit that adds behaviour was shown able to fail | The design. The sampled claims of seen red and executed, each of which held | None found in the sample |
| The last round (`trail/rounds/round-5.md`) | Round 4's one finding is closed by the frame stating the cut and by the rule's comment. Nothing is left open | The fix diff `b76da02..9a58a55`, re-run above. `index.html:511-512` | None. Round 5 holds no `fixed` verdict, so no close falls to the sealer to read |
| The changelog (`changelog.md`) | What a person and a client of the daemon see change | The tree on the accounts, sign-in, change of account, removal, refresh, the three-second wait (`daemon.ts:139`), the one-minute refresh (`daemon.ts:145`), the requests and the fields (`protocol.ts`) | `changelog.md:7`: the view names the account "where it differs from the one the repository gives". The tree names it whenever accounts are offered (`view.ts:2829`, `work-item-view.ts:1263`, `view.test.ts:4214`), as `frame/design.md:163` states |
| The orchestrator's part of the pull request body (`pr.md`) | Part of #160, closed when `release/v0.0.3` reaches `main`. Eight quotes of *Scope*. Five open rows. Ten screenshots | Each quote stands word for word at its coordinate: *Scope* items 1, 3, 5, 6, 7, 9, 13 and 14, and Q3, Q5, Q6, Q8 and Q9. Each row's status and default is that row's in `frame/questions.md`. Each image link is the shot's last commit. The opening line is the form #194's body used. #176 is still open (`gh issue view 176`, executed), so Q6 stands as framed | None. The quotes leave out *Scope* items 2, 4, 8, 10, 11 and 12. That is a choice of what to quote, and no sentence says the list is whole |
| The orchestrator's judgment on round 3, finding 1 (`468bd81`) | The Ask row's select shows its name whole, and the field gives way | The CSS at `index.html:510-512`. Round 4's crops, read and not re-measured | Its cited ground, as in the design's row above |
| The orchestrator's judgment on round 4, finding 1 (`c941013`) | The frame states the cut, and the store gets no limit on a name's length | `index.html:512` and the comment at `:511`. `accounts.ts` is unchanged. The issue asks the line and the view to show the account, not the chooser, and both do | None beyond the narrower point of the design's row |
| `routing.md` | Framer, crafter, review chain, automation yes, the orchestrator's choice under `agentic` | The diff: the launch environment, the adapters, the store and the window. Every phase of `frame/plan.md` whose Status names commits has its `trail/phases/phase-N.md`. No case starts a real `claude` or signs in | None. The Branch row names the merges at `919bb6a` and `f0b7e36` and leaves out `c9ccb11`, which `frame/plan.md` *Overlap with the release* records |

```seal
target: 95d5f36 against c409dbb
Verdict: withheld reason: two sentences of the work item's records do not hold against the tree. The changelog fragment's claim at changelog.md:7 that a work item's view names the account only where it differs from the repository's is contradicted by apps/desktop/src/renderer/view.ts:2829 (viewAccount), work-item-view.ts:1263 and view.test.ts:4214, which name it whenever accounts are offered, as frame/design.md:163 says. The orchestrator's judgment at frame/design.md:270 (468bd81) cites "each session says which account it runs under" as scope item 10's, and those words are scope item 8's heading (frame/design.md:161)
```

```seal
target: c46e9ce against c409dbb
Verdict: sealed
```
