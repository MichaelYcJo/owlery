Part of #96. The issue closes when `release/v0.0.1` reaches `main`.

A work item that started from a remote's branch, such as `origin/main`, started from wherever the clone last fetched that branch, and nothing said so. After another work item merged into the release branch, a new work item still started from the old commit. Owlery now fetches that one branch before it cuts the work item, and the form says what it starts from.

| Before | After |
|---|---|
| `origin/main` meant the commit the clone last fetched | Owlery fetches `main` from `origin` first, and the work item starts at the remote's commit |
| The form said nothing about the base's freshness | Under "Starts from" the form reads "Fetching origin/main…", then "Fetched: origin/main is at 1a2b3c4." |
| Offline, the work item silently started from the old commit | The form says the fetch failed, with git's first line, and that it starts as last fetched, at the commit the clone holds and for how long it has held it. Create still works |

**What a fetch touches.** One fetch asks one remote for one branch. It moves the clone's `refs/remotes/<remote>/<branch>` and nothing else: no local branch, no tag, no other branch of the remote, and no file of the person's checkout. A configured refspec that would move a local branch is overridden for this fetch.

**When it fetches.**

- **A local base fetches nothing.** A work item from the local `main` starts where `main` stands.
- **The form asks once for each remote's branch it shows**, each time it opens. Typing a name asks nothing.
- **Create does not wait for the form.** A creation within a minute of the form's fetch uses that result, so it starts where the form said. Later, it fetches again. Where a failure arrives only after Create was pressed, the status line says the same sentence.
- **A remote gets ten seconds.** After that the daemon ends git and every process git started, and the work item starts as last fetched. A remote that needs a typed password or passphrase fails the same way, because the daemon has no terminal.

**What the form cannot say.** The issue asked for when the clone last fetched. Git records that time in no place the clone's worktrees share, so the form says how long the clone has held the commit, which git does record.

**A daemon from an earlier build** answers no fetch. The form clears its line after twelve seconds, and a work item created against that daemon starts as last fetched, as before.

Not verified, for the owner's hand run of #24:

- **The owner's own remotes.** Whether the daemon's fetch reaches them with the app started from Finder and through `pnpm`, with the keys and stored passwords of the owner's Mac.
- **A real `ssh` that does not answer.** Whether a fetch the daemon gives up also ends it.
- **How the line under "Starts from" looks**, a failure's sentence over three lines among them.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
