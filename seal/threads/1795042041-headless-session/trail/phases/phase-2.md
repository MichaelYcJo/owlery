# Phase 2: 1795042041-headless-session

## What this phase found

**The frame holds.** `apps/desktop/src/renderer/` holds `renderer.ts`, `view.ts` and `index.html`, as `frame/plan.md` *Technical context* says, and `apps/desktop/src/shared/protocol.ts` at `2fcfebb` states the protocol as `trail/phases/phase-1.md` gives it. Scenario 8's search already printed nothing at `2fcfebb`, before this phase wrote anything.

**What the window now holds.** The side panel has a section "Ask" between the inbox and the hook events: one text field, the "Ask" button, and the list of headless sessions. The decisions are four functions of `src/renderer/view.ts`, and `renderer.ts` only draws what they return.

- `workItemInFront` gives the work item of the pane in front. It gives none where no pane is in front, the pane was opened without a work item, or the window does not hold the pane or the work item.
- `askButton` gives whether the button can be pressed, and its title. With no work item the title is "Bring a work item's pane to the front to ask in it.". With a field that is empty or holds white space alone it is "Type what to ask.". Otherwise it is "Ask in" and the work item's title.
- `withHeadless` puts a session the daemon sent in place of the one of the same id, or after the others.
- `headlessLines` gives each session's prompt, state and text, the most recent first. The text is the answer, or the error where the session failed.

**Decisions the frame left to the build, each with its grounds.**

- *The list shows the most recent session first.* `frame/design.md` *Scope* item 5 names the list and not its order. The side panel is 260 px wide, and the session just asked sits directly under the field, where the person is looking.
- *Where both reasons hold, the title names the missing work item.* A person who then types a prompt would still find the button disabled. Judged against *Scope* item 5, which names the two reasons and not which wins.
- *A pane whose process has exited still counts as in front.* Its work item's worktree is still there, and the daemon asks in the worktree, not in the pane.
- *The field keeps its prompt until the daemon answers `asked`, and a second press before that answer sends nothing.* A refused `ask` leaves the prompt in the field for the person to send again, and its message shows in the status line, where every refused request already shows. A second press would otherwise ask the same prompt twice, and each ask draws on the person's own limit (`frame/plan.md` *Operational impact*).
- *The prompt is sent as typed.* The button is disabled on white space alone, which the daemon also refuses; the spaces around a prompt are not removed.
- *The answer is set as text, never as markup,* and the style `white-space: pre-wrap` keeps its line breaks (*Scope* item 5, "plain text with its line breaks kept").
- *The button's state is set again at each `inbox`.* After a work item is created, the window holds the new pane's session only once the `inbox` that follows arrives, so the button turns on at that message and not at the answer to the creation.

**Scenario 1, executed in the built app at the tree `18cfe3c` holds.** The app was built with `node build.mjs` and started with `electron . --remote-debugging-port=9347 --user-data-dir=<dir>`, with `OWLERY_WORKTREES` and `OWLERY_CWD` under the scratch directory. A script drove the window once through the debugging port. It created a work item titled "Headless probe" with a shell pane through the "+ Work item" form, in a temporary git repository under the scratch directory, typed "Reply with the single word owl", and pressed "Ask". The build was made before the commit, from the working tree the commit then took unchanged.

- Before the work item existed, with the first shell pane in front, the button was disabled with the title "Bring a work item's pane to the front to ask in it.", with the field empty and with the prompt typed.
- With the work item's pane in front the button was enabled with the title "Ask in Headless probe", and disabled with "Type what to ask." while the field held three spaces.
- 1 ms after the press the list held one line: the prompt, `working`, an empty answer, and the field was empty. At 2,674 ms the answer was `owl`, still `working`. At 2,684 ms the state was `finished` and the answer `owl`.
- The status line stayed empty, and the section's markup held no vendor's name.

**The line of `src/daemon/main.ts` that passes the adapter ran.** While the session worked, the script read the process table for the children of the daemon the app had started. They were the login shell's lookup (`/bin/zsh -l -i -c` with the two marked lines), and then the user's `claude` 2.1.327 with `-p --input-format stream-json --output-format stream-json --verbose --setting-sources "" --settings {"disableAllHooks":true,"autoMemoryEnabled":false} --strict-mcp-config --permission-mode default --add-dir <the work item's worktree>`. The environment of that process, read with `ps eww`, held the five names `CLAUDE_CODE_ADDITIONAL_DIRECTORIES_CLAUDE_MD`, `HOME`, `LANG`, `PATH` and `USER`, and no other. This closes the row of `gaps.md` that phase 1 opened for that line.

**The `system` line was not read in this run.** Scenario 4 of `frame/design.md` has the real run of scenario 1 read `permissionMode`, `mcp_servers` and `plugins` from it. The daemon drops that line and writes it nowhere, so a run of the app cannot show it. The arguments and the environment read from the process table are what the launch gave the CLI, and phase 1's probe read the three fields for the same arguments. `gaps.md` holds the row.

**Two things about running the app that the handoff and the frame did not say.**

- *The app does not read `OWLERY_RUN_DIR`.* `src/main/main.ts` sets it for the daemon from Electron's user data folder, so a run directory of the probe's own is chosen with `--user-data-dir`. The daemon's files were then under `<dir>/run`, and nothing was written to the user's own application support folder or to `~/.owlery`; both were listed before and after.
- *The daemon does not start where the run directory's path is long.* The first start used a link to a folder under the scratch directory. Electron resolved the link, and the daemon exited at once: `listen EINVAL` on `<run directory>/hooks.sock`, because that path was longer than the 104 bytes macOS gives a socket's path. The window then waits 10 seconds and shows nothing. The second start used a folder of its own with a short path, outside the scratch directory, which was removed after the run, its `daemon.log` and `work-items.json` copied to the scratch directory first. The same failure meets a person whose user data path is long, a long account name among the causes. It predates this work and is a follow-up, named in the hand-back.

**Scenario 8, executed.** `git grep -n -i -e claude -- apps/desktop/src/renderer` printed nothing and exited 1 at `18cfe3c`. The same pattern over `apps/desktop/src/shared` and `apps/desktop/src/daemon/pane-kinds.ts` printed three matches, so the pattern finds what is there.

**Seen red.** The 13 new cases of `test/view.test.ts` were written before the four functions, and all 13 failed against `view.ts` as it stood at `2fcfebb`, each with "is not a function"; the 25 existing cases passed. With the functions written, all 38 passed. That red names no guard, so each new case was also shown red against one unit broken, below.

**`seal mutate`, at `18cfe3c`.** `src/renderer/view.ts` against `test/view.test.ts`: 14 mutants, 14 red, first in one call and then each alone, so that the cases each one turned red could be read.

- `workItemInFront`: the pane matched by any other id turned red four of its five cases; the work item matched by any other id turned red four, "gives nothing where the pane in front was opened without a work item" among them. Each of the five cases went red under one of the two.
- `askButton`: the button enabled without a work item turned red "is disabled, and says why, while the pane in front belongs to no work item". The button enabled on an empty field, and white space counted as a prompt, each turned red "is disabled, and says why, while the field is empty or holds white space alone". The work item's reason given only where a prompt is typed turned red "names the missing work item first where the field is empty as well". The button disabled with both present, and the title naming the branch, each turned red "is enabled, and says where it asks".
- `withHeadless`: a new session put first, and a new session never recognised as held, each turned red "adds a headless session the window did not hold, after the others"; the held session kept in place of the changed one turned red "replaces the session the window holds under the same id, in its place".
- `headlessLines`: the oldest first turned red the first case; the error shown for a finished session turned red both; the answer shown for a failed session turned red "shows a failed session's error in place of its answer".

**What the cases and the drive do not reach.** `renderer.ts` has no case, as before this work: the drive is what ran it. The drive saw one good session. It did not see a failed session's line, a refused `ask`, an answer of several lines, the list at a reconnect, or a second window, and it pressed the button through script and not through a pointer. `gaps.md` holds a row for each.
