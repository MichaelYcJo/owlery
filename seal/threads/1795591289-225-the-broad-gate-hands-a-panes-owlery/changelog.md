# Changelog: a pane and the broad gate take no chain variable of the pane they start in

Issue #225. A pane under the owl chain holds four variables of its own: its id, the hook socket it reports to, the chain command and the work item's base. A daemon or a broad gate started in such a pane inherited them. Every shell, Claude Code pane on no chain and worktree setup pane that daemon opened then named the outer pane's chain command, and the broad gate of this repository failed six cases when the owner sealed a branch from a pane.

- **A pane holds a chain's variables only where its own command sets them.** A daemon started in an Owlery pane, for example by `pnpm start` typed there, gives a shell and a Claude Code pane on no chain no `OWLERY_CHAIN` and no `OWLERY_BASE`, and gives each pane only the id and hook socket its own command sets. The daemon's run folder, `OWLERY_RUN_DIR`, still reaches a shell, a Claude Code pane and a worktree setup pane.
- **The broad gate the chain command runs from a pane holds none of that pane's chain variables.** `OWLERY_RUN_DIR` and Owlery's other variables stay.
