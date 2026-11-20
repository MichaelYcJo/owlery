# Phase 2: 1795180367-fetch-before-cut

## What this phase found

Every path below is under `apps/desktop/` unless it starts with `seal/` or `frame/`.

**The frame holds.** The coordinates `frame/design.md` *Grounding* gives for the form were opened at `13f3ed7`. The merge of #102 moved `src/renderer/renderer.ts` by two lines and `src/renderer/view.ts#ageOf` by a few, and each coordinate still names what the frame says it names. `seal/follow-up.md` does not exist, and no `seal/parity.json` is declared.

### Decisions the code needed and the frame left to the build

Each was judged against `frame/design.md` *Scope*, at the item named.

- **A local branch that bears a remote branch's name asks nothing (item 9).** `view.ts#asksFetch` asks for a base the plan lists among `remoteBases` and not among `localBases`. Item 9 names `remoteBases` alone. The daemon reads such a name as the local branch (`frame/design.md` *Scope* item 4), so its answer would be `none` and the form would say nothing. The second condition saves that request. This is a departure from the wording of item 9, and it keeps its sentence "It asks nothing for a local base".
- **Every failure that arrives after the press is said (item 12).** `renderer.ts#createWorkItem` keeps the base the person pressed Create with, and `takeBase` keeps the sentence of a `kept` answer that arrives for that base afterwards. The first commit, `d2fbda7`, kept the base only where the form still awaited its fetch at the press. That left out a fetch the form had stopped waiting for under item 11 and that was answered after the press, which item 12 covers, so `4ea9bb1` removed the condition. No case holds the difference, and `gaps.md` *Not verified* names it.
- **Where the wait's length stands (item 11).** `view.ts` exports `BASE_ANSWER_MS`, `BASE_FETCH_MS` and two seconds, and `unanswered`, which says what the form holds once the wait has passed. The timer itself is in `renderer.ts#showBase`. The split puts the number and the rule under a case that needs no app.
- **An answer of an earlier opening is shown nowhere (item 9).** Each opening forgets the bases it asked for. The ids of the requests not yet answered are kept across openings, so a refusal of an earlier opening's fetch does not reach the status line, as the form already does for its plans.
- **The line's colour.** The paragraph takes the colour of the dialog's labels for every sentence, a failure's among them. `gaps.md` *Not done* gives the grounds.

### What trying taught

- **The form's own wait can hide a missing line of code.** With the line that empties the paragraph under "Register the repository only" removed, the case still passed: twelve seconds later the wait of item 11 redrew the paragraph, and the case's wait is fifteen. The case gives the emptied paragraph two seconds since `6b3c21c`.
- **A daemon's ten seconds fit in a case.** The last case of `test/work-item-form.test.ts` waits out `BASE_FETCH_MS` against the remote that never answers, so the file runs for about 14 seconds. It asserts that one stand-in started, so the creation joined the form's fetch in the built app too.
- **`seal mutate` with several mutants prints no output of the cases.** A failing line can be read only from a call with one mutant.

### Seen red

`executed`, before any source file was changed, at `13f3ed7` with the cases added: `node scripts/test-in-electron.mjs test/view.test.ts test/work-item-form.test.ts` exited 1 with 21 cases red. The 15 new cases of `test/view.test.ts` failed on a function that did not exist, or on `BASE_ANSWER_MS` being undefined, which shows only that the units did not exist. Their assertions were each shown red by a mutant below. Of the cases of `test/work-item-form.test.ts`, six failed: on the paragraph `work-item-base-state` not being in the page, or after it.

Three cases assert that something is not said or not asked, and each was shown red with its one guard removed, by a call of `seal mutate` with that mutant alone, whose failing line was read:

- "shows the branch of a name as it is typed, and asks the remote nothing for it": a mutant that forgets the bases asked for at each plan's answer failed it at `test/work-item-form.test.ts:127`, where the paragraph held the commit the remote gained after the first fetch.
- The emptied paragraph under "Register the repository only": the mutant without `baseStatePlace.textContent = ""` in `renderer.ts#showPlan` failed at `test/work-item-form.test.ts:115`.
- The empty paragraph for the local `feature`: the mutant without `showBase()` in the menu's listener failed at `test/work-item-form.test.ts:141`.

### Mutation

`executed`, each mutant written alone by `seal mutate` and restored by it. The tree was clean after the last call.

- `src/renderer/view.ts`, 17 mutants against `test/view.test.ts`, at `4ea9bb1`: 16 red and one survivor. The survivor removed `remoteBases.includes(base)` from `asksFetch`: every base of the fixture was local or a remote's, so nothing read that condition. `105f72b` added a case of a base the plan does not list, and the same mutant then failed at `test/view.test.ts:1363`. The 16: the local guard, the asked guard, `only`, the trim of the key, the commit cut to eight, the ellipsis, the `none` answer, the `since` that is null, the age's two times swapped, `lateSays` for a fetched branch, `unanswered` giving the answer back, two seconds made one, a refusal said as nothing, the word "Fetched:", `failure` replaced, and no base in the menu.
- `src/renderer/renderer.ts`, against `test/work-item-form.test.ts`, each run a start of the built app: no `forgetBases()` at the form's opening, red at `105f72b`; `tell("")` for the creation's answer, red at `105f72b`; the three mutants under *Seen red*, red at `6b3c21c`. A sixth, which never records a base as asked, was red at the first sentence the form shows and therefore says nothing of the rule it was aimed at. The mutant that forgets at each plan's answer replaced it.

No mutant and no case reads these units of `renderer.ts`: the timer of item 11, the route of a refused `fetchBase` to the paragraph, the check that the form is open before an answer is drawn, and the end of the timers at the form's close. `gaps.md` *Not verified* names the first two and who reads them.

The built app started 17 times in this phase: once for the red run, once for the first green run, 14 times under `seal mutate`, whose every call runs the cases once before its mutants, and once for the phase boundary. Each start was `BuiltApp.start` under `test/work-item-form.test.ts`, in the background.

### The phase boundary

`executed` at `6b3c21c`, exit 0, 3 files and 380 cases: `node scripts/test-in-electron.mjs test/view.test.ts test/work-item-form.test.ts test/themes.test.ts`, run from `apps/desktop/`. They are the two files the phase changed and `test/themes.test.ts`, which reads `src/renderer/index.html`. `test/navigation.test.ts` writes the page's name in an address and reads no file.

The case files that start the built app read the window this phase changed. The run allowed the one start under `test/work-item-form.test.ts`, so the others did not run, and `gaps.md` names them for the broad gate.

The typecheck of the changed files, `executed` at `6b3c21c`, exit 0: `tsc --noEmit` through a `tsconfig.json` in the phase's scratch that extends the project's and lists `src/renderer/renderer.ts`, `src/renderer/view.ts`, `test/view.test.ts` and `test/work-item-form.test.ts`. `tsc --listFilesOnly` printed 20 files of `src/` and `test/` for it. `src/renderer/index.html` is read by no compiler.

After the runs, `ps` showed no git, no stand-in, no daemon, no app and no `caffeinate` process of the phase.

### Other statements of what the phase changed

`executed`: `git grep -n -i -e 'Starts from' -e 'does not fetch' -e 'nothing is fetched' -e 'last fetch' -- docs README.md README.ko.md apps/desktop/src`. Outside this phase's own lines it printed `src/daemon/worktrees.ts`'s comments on `basesOf` and `readLoss`, which stay true of a plan and of a loss, and `src/shared/protocol.ts`'s comment on `BaseFetch`. No line of `docs/`, `README.md` or `README.ko.md` states whether Owlery fetches. The list is a sample of those words. `seal/threads/1795130485-new-work-item-form/changelog.md` still holds "Owlery does not fetch", which `frame/plan.md` *Operational impact* leaves to the orchestrator.
