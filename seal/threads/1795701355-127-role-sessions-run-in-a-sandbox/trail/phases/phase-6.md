# Phase 6: 1795701355-127-role-sessions-run-in-a-sandbox

## What this phase found

This is work after review round 2, for round 3 to read. It measured `frame/questions.md` Q8 and corrected the statements that the fold after round 2's fix pass (`7a6c8c74`) made stale in files a crafter writes. It builds no *Scope* item, so `frame/plan.md`'s Phases table holds no row for it.

**The frame holds for this measurement (read).** Q8's row names the probe: the stand-in case of `apps/desktop/test/role-session.test.ts` for one pair, with the config folder's `shell-snapshots` made a link to a folder outside the run folder. The tree holds what the row relies on. `claude.ts#claudeAdapter`'s `start` adds `shell-snapshots` of the config folder's real path to `allowRead`, which is the link's own path. `claude-accounts.ts#LINKED_NAMES` holds `shell-snapshots`, so an account's folder that Owlery made holds it as a link where the person's folder holds one.

**Q8: a session of an account whose folder Owlery made starts its commands from the person's shell setup, on 2.1.332 and on 2.1.329 (executed).** The probe was a `test_tmp_*` copy of the stand-in case, for a proofer at a round. Before the session started, the copy made `person/shell-snapshots` in the case's own folder, outside the run folder, and made the config folder's `shell-snapshots` a symbolic link to it. The stand-in's command also ran `ls -la` of the config folder's `shell-snapshots/` and `ls` of the folder the link leads to, before it called the home's function. The probe ran once on the installed 2.1.332 and once with `OWLERY_ROLE_CLI` at `~/.local/share/claude/versions/2.1.329`, each through the shared lock, each 1 passed and 1 skipped. On both versions the result was the same:

- The `--settings` value the CLI was given named, in `allowRead`, the scratch folder and `<run>/config/shell-snapshots`, the link's own path.
- Claude Code wrote its snapshot through the link: each `ls` listed one `snapshot-zsh-*.sh`, through the link and in the folder it leads to.
- The command printed the line of `owlery_shell_setup`, the function of the home's `.zshrc`, so the command started from the snapshot.
- The `cat` of `<run>/daemon.json` was refused with `Operation not permitted`, the file tools' four reads were asked of the daemon and refused, and no tool result held the token. The case's other assertions passed as in its committed form.
- After the session the folder the link leads to held no file, and the config folder's `shell-snapshots` was still a link.

Judged against Q8's options: "The function's line is printed", where the bound holds as built for both kinds of account folder. So Claude Code did not resolve the link in the entry into a path the sandbox then refused. Whether it writes the entry as given or adds the resolved path beside it, the run does not show, and the bound does not depend on which.

**Nothing of the launch changed.** The spawn of this work asked for a second `allowRead` entry, the link's resolved path, only where the line was not printed, and it was printed. So no code changed but the comment below, and no case was added or changed. Q8's first option says the case may keep the link. The committed case keeps a config folder whose `shell-snapshots` is a folder of its own, since the spawn asked for no committed change where the answer held. `gaps.md` *Not verified* names what that leaves unpinned.

**A control was not run.** No run removed the entry with the link in place, so no run of Claude Code's sandbox shows that the read through the link is refused without the entry. The framer's `sandbox-exec` probe showed that with a profile of the framer's (`frame/design.md` *Grounding*, the probe's row read at `cff01936`). A third and fourth run of the probe file would break contract rule 7, which runs a probe once, and the answer to Q8 does not depend on it. `gaps.md` *Not verified* names it, with the orchestrator as who answers.

**The probe left nothing outside the phase's scratch directory.** The copy was moved out of `apps/desktop/test/` after its two runs, and the two folders it kept under the system's temporary folder were removed by their paths. Each run's output is kept in the phase's scratch directory.

**The stale statements of the fold (read, then edited).** The fold wrote Q8 into the frame, and four texts a crafter writes spoke of an added account's folder as if its `shell-snapshots` were a folder of its own, or as if every added account's folder stood in the run folder. A folder the person hands over stands where it stood (`docs/architecture.md` *Agent adapters*).

- `changelog.md:9` now says the run folder holds the folders Owlery makes for added accounts, that `shell-snapshots` in such a folder is a link where the person's folder holds one, and that a command reads the snapshot through it. Its bold sentence said a command reads no file of the run folder, which the same bullet contradicted for the scratch folder and the snapshots, and it now names both.
- The comment of `claude.ts#claudeAdapter`'s `start` now says the folder the daemon makes stands in the run folder, that `shell-snapshots` there is a link where the person's folder holds one, and that 2.1.329 and 2.1.332 each ran a command from the snapshot through the entry, which names the link's own path.
- The head of `role-session.test.ts` now says the case's config folder holds `shell-snapshots` as a folder Claude Code makes there, and that the linked form of an account Owlery made is not tried. The comment of the `SETUP_RAN` assertion says the same of the case's folder.
- `gaps.md` *Not verified* gains Q8's row as closed, and a row on the control and the linked form that no committed case tries.

The docs of `adapter.ts#RoleAdapter.start`, `claude.ts#launchOf` and `#sandboxOf`, and `daemon.ts#commandsOf` say "the session's config folder" with no word on what `shell-snapshots` is inside it, and hold for both forms as measured, so they stand. The comment of `claude-adapter.test.ts`'s case of each role's bound gives the account's folder through a link to the folder, not a link of `shell-snapshots`, and states nothing this phase contradicts. These were found by `git grep -n -i -e "snapshot" -e "added account"` over `apps/desktop/src`, `apps/desktop/test` and `apps/desktop/package.json`, a sample of spellings.

**Checks before the commit.** The code changed in comments alone, `claude.ts` and `role-session.test.ts`, so no narrow case, no mutation run and no typecheck is owed. The package configures no formatter or linter (`trail/phases/phase-4.md`).
