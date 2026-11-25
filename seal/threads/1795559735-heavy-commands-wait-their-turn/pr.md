Closes #134.

- "The pull request's title takes `feat:`, and the kind that came closest is `fix:`." (`frame/plan.md` *Judgments of the run*, 2026-11-25)
- "A repository names its heavy commands in its records root's `config.json`." (`frame/design.md` *Scope*, item 1)
- "The limit's default comes from the reading of the machine, which issue #32 builds." (`frame/design.md` *Scope*, item 2)
- "The daemon gives turns: at most as many heavy commands run at once as the limit says, across every work item and every repository." (`frame/design.md` *Scope*, item 3)
- "Any session takes a turn through one command, the runner." (`frame/design.md` *Scope*, item 5)
- "A work item's line says "Waiting for the machine" while a heavy command of it waits for its turn." (`frame/design.md` *Scope*, item 8)
- "A broad gate whose command failed by itself while the machine was over its load is run once more, alone, before it counts as failed." (`frame/design.md` *Scope*, item 9)
- "While a heavy command runs, the daemon keeps the display awake, and wakes it at the command's start." (`frame/design.md` *Scope*, item 12)
- "The Machine dialog, which #32 builds, gains this work's rows." (`frame/design.md` *Scope*, item 13)

- "Does a work item's line say that its broad gate's second run waits for the load to come down?" (`frame/questions.md` Q17, *Question*)
- "No. The line shows the gate as the chain's running stage, as for any gate, and the work item's view carries the chain's sentence, "The broad gate failed while the machine was over its load, and runs once more, alone." Phase 5 adds no words." (`frame/questions.md` Q17, the default (a))
