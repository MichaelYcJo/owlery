# Closing memo: 1795610689-214-delete-dialog-lists-read-cleanly

## Not verified

| Item | Who must answer |
|---|---|
| The broad gate: the full suite, the repository-wide typecheck, and the heading and table-row comparison of `docs/design.md` with `docs/design.ko.md` | the orchestrator, by the `Broad gate` command of `seal/config.json` |
| That a commit list's hash column is as wide as the list's widest hash where the hashes differ in length. Every short hash in the case's clone is seven characters, so the long list's case reads one start for every subject past the widest hash, but cannot tell the list's shared column (`grid-template-columns: subgrid` on `dialog .loss li`) from a column per row | the proofer, by reading `dialog .loss` and `dialog .loss li` in `apps/desktop/src/renderer/index.html` |
| That the row "삭제 대화 상자" of `docs/design.ko.md` says what the row "The delete dialog" of `docs/design.md` says | the proofer |
| How the delete dialog looks in each theme and appearance, read against `docs/design.md`: its form against the row "The delete dialog", its values against *Tokens* | the proofer, by reading the six PNG files under `screenshots/` |
| How the removal dialog's loss lists look. No view of the screenshot run opens the removal dialog, so no PNG file shows them. The built-app removal cases of `apps/desktop/test/work-item-menu.test.ts` read their heads, rows and class | the proofer, by reading that `lossParts` in `apps/desktop/src/renderer/renderer.ts` draws both dialogs' lists with one class |
| That the screenshot run's scene and its delete view fail where they draw the wrong scene: a mutant of the 39 commits, of the untracked file and `.env`, or of the delete view's wait. Their one case is the screenshot run, which the phase ran once and did not run against a mutant. The wait for the head "39 commits no other branch, no remote and no tag holds" fails where another number of commits stands. No wait reads the untracked file or `.env` | the proofer, by reading `show.delete` and the scene's commits in `apps/desktop/test/screenshots.test.ts` against the six PNG files |

## Not done

No formatter or linter ran over the commits, because the repository configures none: it has no Prettier, Biome or ESLint configuration and no `lint` script. `tsc --noEmit` over the desktop app ran before each commit.

The screenshot run's scene writes no file with uncommitted changes in the worktree of "Rename the settings file", so the delete dialog's shot shows no list of "files with changes that are not committed". One modified tracked file would add it. It was not taken because `frame/design.md` *Scope* item 9 and the two *Rule changes* operations name the untracked file and `.env` alone, and the settle writes that scene paragraph as the framer worded it. That list draws its paths in the same row form as the untracked files' list, which the shot shows.
