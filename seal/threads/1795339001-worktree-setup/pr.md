Part of #97. The issue closes when `release/v0.0.2` reaches `main`.

A new work item's worktree held only what git tracks. It had no `node_modules`, no `.env` and no other ignored file its repository needs to run, so a person or the agent installed the dependencies and copied the secrets by hand for each one.

| Done when | What holds now |
|---|---|
| A repository can name the ignored files a new worktree gets copied from its main checkout, and the command a new worktree runs; the place is decided with Orca's `.worktreeinclude` weighed | `.worktreeinclude` holds patterns in the syntax of `.gitignore`, the file Claude Code, Codex, Conductor and Orca read for the same purpose. `.worktreesetup` holds a command, as shell text. Owlery reads both from the main checkout and writes neither |
| A new work item's worktree holds those files, and the command runs in a pane the person can see, with its result in the inbox line | A path is copied where a pattern matches it and git ignores it; on APFS each path is cloned with `/bin/cp -c`, and where the clone fails the bytes are copied. Each path is copied beside its place and then moved in, so a failed copy leaves nothing behind, and no copy writes through a link out of the worktree. The command runs in a pane of the work item through your login shell, its tab reads "Setup", and the line says "Setting up" while it runs |
| A work item whose command fails is still created and usable, and its line says the setup failed | The line says "Setup failed" where a path could not be copied, where the command ended with a code other than 0 or by a signal, and where its pane ended before the command did. The work item's panes, archive and delete work as before, and its view offers "Run setup again", which names the command it runs |
| A repository that names nothing gets the worktree exactly as today | Nothing is copied and no setup pane starts |

**The command runs with your rights and asks nothing first** (#97's Q1 at its default, decided under `agentic`): the "New work item" form names the command under the folder before you press Create, and creates nothing until it does. The command runs only where `.worktreesetup` still holds the text the form showed; where it changed, nothing runs and the line says why. The pane shows it run.

**Owlery's own repository names `pnpm install` in its `.worktreesetup`.**

🤖 Generated with [Claude Code](https://claude.com/claude-code)
