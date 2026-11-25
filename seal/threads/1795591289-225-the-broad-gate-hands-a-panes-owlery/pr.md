Closes #225.

- "A pane holds the pane variables, its id, hook socket, runner of heavy commands, chain command and base, only where its own command sets them: `spawnPane` takes them out of the daemon's environment before the command's own go over it." (`frame/design.md` *Scope*, item 1)
- "The broad gate's command holds none of the pane variables of the pane the chain command runs in." (`frame/design.md` *Scope*, item 2)
- "One constant names the pane variables, and `paneCommands`, `setupPaneCommand` and both cuts read their names from it, so a variable a pane's command sets later is cut with the rest." (`frame/design.md` *Scope*, item 3)
- "Out: `OWLERY_RUN_DIR`, `OWLERY_BACKGROUND` and every other variable of Owlery's stay where they are." (`frame/design.md` *Scope*)

Round 6 left one row to the orchestrator: four comments that #134 added say every pane names the runner of heavy commands, and a sign-in pane does not. Those lines come from the base, not from this diff, so they are filed as #237 in release 0.0.5.
