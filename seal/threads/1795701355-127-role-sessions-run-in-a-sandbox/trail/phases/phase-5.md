# Phase 5: 1795701355-127-role-sessions-run-in-a-sandbox

## What this phase found

This is work after review round 1, for round 2 to read. It measured `frame/questions.md` Q7 and corrected the statements that the fold after round 1's fix pass made stale. It builds no *Scope* item, so `frame/plan.md`'s Phases table holds no row for it.

**Q7: Claude Code asks before a file tool reads the run folder, on 2.1.332 and on 2.1.329 (executed).** The probe was a `test_tmp_*` copy of the stand-in case of `apps/desktop/test/role-session.test.ts`, for a proofer at a round. Its stand-in answered with three calls, one per turn: a `Read` of `<run>/daemon.json`, a `Grep` for `token` with the path `<run>`, and a `Glob` of `*.json` with the path `<run>`. The run folder stood outside the worktree and outside every folder after `--add-dir`, as the daemon's does; the session's scratch folder inside it was the one folder after `--add-dir` there. The probe ran once on the installed 2.1.332 and once with `OWLERY_ROLE_CLI` at `~/.local/share/claude/versions/2.1.329`, each through the shared lock, each 1 passed and 1 skipped. On both versions the result was the same:

- The `init` line named the mode `default`.
- Each of the three calls reached the daemon as a `can_use_tool` request, with the reason "Path is outside allowed working directories". Claude Code suggested an allow rule for the run folder for the session, and the daemon added none.
- The daemon refused each call, and the stand-in was told "Owlery's rule for the proofer does not allow this call. Do not work around it: say in your report which step needed it." That sentence is `role-grants.ts#verdictOn`'s for the rule `other`, the branch a `read` action reaches.
- The session's `result` line listed the `Read`, the `Grep` and the `Glob` as denied, and no tool result held the token.
- The session finished with no error.

So Claude Code did not refuse the calls itself and did not read the file; it asked, and the daemon's grant refused. Finding 1 of `trail/rounds/round-1.md` does not stand open by a file tool. Judged against Q7's options: "It asks", where the bound holds as built.

**Nothing of the launch changed.** Neither candidate the binary names was tried: a `Read(...)` deny rule of `permissions`, or `permissions.blockReadsOutsideWorkingDirectories`. The spawn of this work asked for either one only if a version read the file without asking, and no version did. So no case was added, and the committed stand-in case still tries a command's `cat` alone. `gaps.md` *Not done* names what that leaves unpinned.

**The probe left nothing outside the phase's scratch directory.** The copy was moved out of `apps/desktop/test/` after its two runs, and the two folders it kept under the system's temporary folder were removed by their paths. The stand-in case keeps such folders by design, so the case's own runs still leave theirs.

**The stale statements of the fold (read, then edited).** The fold after round 1's fix pass (`01cf053f`) rewrote *Scope* item 4 to say that a command plants no hook through `hooks` or `config`, since the fold's probe had a hook planted by three other routes. Two texts still said that no hook that would run outside the sandbox is planted. They were `changelog.md`, the bullet on a crafter's commands, and the comment of `daemon.ts#commandsOf`. Each now says a command plants no hook through either. `git grep` on the old clause, run before and after the edit, lists one other place: finding 5 of `trail/rounds/round-1.md`, which quotes the text at the round's target and stays. The search is a sample of spellings.

`gaps.md` *Not done*, the paragraph on the worktree's `.git` file and `commondir`, left the deny entries to the framer. It now cites the fold's answer, `frame/plan.md` *Alternatives considered*, the row on deny entries for them: not taken. The *Not verified* row on 2.1.329 and `denyRead` stood open after `frame/plan.md` *Judgments of the run* recorded the orchestrator's runs on 2.1.329. Those runs' outputs were read in the session's scratchpad, and each showed every role's read of `daemon.json` refused, so the row is closed on them. Q7's row is added as closed.

**Checks before the commit.** `tsc --noEmit` over `apps/desktop` ran on the tree with the comment edit (`daemon.ts` changed in a comment alone). The package configures no formatter or linter (`trail/phases/phase-4.md`). No test file changed, so no narrow case and no mutation run is owed.
