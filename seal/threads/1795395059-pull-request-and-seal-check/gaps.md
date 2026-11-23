# Closing memo: 1795395059-pull-request-and-seal-check

## Not verified

| Item | Who must answer |
|---|---|
| The whole suite and the project's typecheck at phase 1's commits. Phase 1 ran the phase boundary set its record names and the project's typecheck of the files it changed | The orchestrator's broad gate, after the review rounds |
| The test files that start the built app and that phase 1 did not run. Phase 1 changed `records-place.ts#workflowText` alone of the app's code, and ran `test/records-dialog.test.ts`, which reads the workflow's text in the dialog, with one start of the built app. The other files that start the app import `records-place.ts` for `MARKER` or `SUBJECT` and read no workflow text | The orchestrator's broad gate, which runs the `app` project |
| Whether a run's token posts `Owlery seal` on a real pull request's head commit, whether GitHub offers it under that name as a required check, and whether its title and summary read as the cases' server received them. Every post of the cases went to a server on the loopback address | The first real chain of a branch of Owlery's own that ends in a pull request (`frame/questions.md` Q2) |
| Whether GitHub's body of a real pull request edited in a browser keeps the marker lines alone on their lines. The cases write the body, with LF and with CRLF endings | The same first real chain (`frame/questions.md` Q2) |
| The whole suite at phase 2's commits. Phase 2 ran the phase boundary set its record names, and the project's typecheck, `tsc --noEmit`, at `fdc4c5b` | The orchestrator's broad gate, after the review rounds |
| The test files of the `app` project, none of which phase 2 ran. Each builds the sources phase 2 changed, and `test/role-bundle.test.ts`, `test/role-session.test.ts`, `test/terminal-basics.test.ts` and `test/work-item-menu.test.ts` import a changed module. No `app` case reaches a sealed chain, so none runs the pull request stage | The orchestrator's broad gate, which runs the `app` project |
| Whether the person's git and `gh`, started by the daemon with no terminal and the login shell's `PATH`, push to a real remote and open, edit and read a real pull request with the login they hold, and whether a real `gh pr create` prints the pull request's address as the last address it prints. Every case pushed to a bare repository in a temporary folder and called a stand-in for `gh` | The first real chain of a branch of Owlery's own that ends in a pull request (`frame/questions.md` Q2) |
| Whether a push that would ask for a credential fails rather than waits, under `GIT_TERMINAL_PROMPT=0`. The cases' bare remote asks nothing, and no case or mutant watches the variable | The same first real chain (`frame/questions.md` Q2) |
| The arms of the stage that no case reaches, each read and not mutated: a `gh` that does not start, a `gh` call that a signal ends by itself, an entry of `gh pr list` with no number or no address, a file named `gh` on the `PATH` that the user may not run, and the body's file in the system's temporary folder for a daemon given no run folder. The method was taking `github.ts` apart into its functions and `daemon.ts#runPullRequest` into its branches, and mutating each | The review rounds |

## Not done

`lib/lines.py#sections`, `lib/lines.py#is_separator` and `lib/console.py#to_utf8` lost their last caller in `pr-check/` when `pr_body.py`, `lib/gaps.py` and `.github/scripts/close_issues_on_release.py` left. Executed: `git grep -n -w` of each name over `pr-check/` prints its definition and its docstring's mention alone. They stand as part of the shared readers' interface, which `frame/design.md` *Scope* item 23 does not name; removing them is a change of those modules the frame did not ask for. A reviewer who weighs them as dead code decides.

The arm compares a section's verdict block with the newest verdict block of each judged work item by keys and values. It does not compare the heading or the fixed sentence above the block, since *Scope* item 22 reads the block alone. A section whose sentence names another record's path passes.
