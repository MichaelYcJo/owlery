# Closing memo: 1795697255-278-a-release-takes-its-number-when-it-is-cut

## Not verified

| Item | Who must answer |
|---|---|
| closed How the Korean diagram's line 20 in `docs/architecture.ko.md` draws in the fixed-width font GitHub renders it in. Phase 1 measured it by Unicode East Asian Width alone, and no one looked at the rendered page. | a measurement no record asks for: the answer would decide whether line 20 of the Korean diagram takes another space; no failure or issue names it |
| closed The broad gate at the work item's last commit: the repository's `check` scripts and the documents leg the phase ran by hand. | answered: the broad gate passed at `6cb29a59`, the last run of this work item's `trail/gate.md`, after which only the work item's records changed (`git diff --name-only 6cb29a59 efb63413` outside its directory prints nothing); the `check` workflow passed on pull request #293 at `efb63413`, the head it merged from |

## Not done

The other lines of the Korean diagram in `docs/architecture.ko.md` *전체 구성* measure 28 to 30 columns by East Asian Width, where the box's border measures 28. No *Scope* item names them, and phase 1 changed line 20 alone.

The descriptions of the closed milestones `release: 0.0.1` to `release: 0.0.4` still name the goal v0.1. They describe releases that shipped, and no agent edits the tracker.
