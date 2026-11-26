# Closing memo: 1795710118-291-292-295-three-cases-hold-under-load

## Scope confirmation

Three cases of the desktop suite, `daemon.test.ts` › the inbox › "reads no count while no client is connected, …" (#291), `daemon.test.ts` › repositories › "removes a repository whose work item has a running pane only where …" (#292) and `chain.test.ts` › the pull request stage › "stops the chain where the stage fails, …" (#295), hold under load and assert what they asserted before, with no change to the product.

## Not verified

| Item | Who must answer |
|---|---|
| closed The broad gate at the work item's last commit, `daemon.test.ts` and `chain.test.ts` whole among it. The phase ran only the cases it changed. | answered: the broad gate passed at `2cb7a448`, the last run of this work item's `trail/gate.md`, after which only the work item's records changed (`git diff --name-only 2cb7a448 3a9d2dbe` outside its directory prints nothing); the `check` workflow passed on pull request #297 at `3a9d2dbe`, the head it merged from |
| closed The `check` job on GitHub's runner, where #291 and #295 failed. The load runs were on this Mac. | answered: the `check` workflow passed on GitHub's runner on pull request #297 at `3a9d2dbe`, and on #298, #299 and #301 after it |

## Not done

`daemon.test.ts` › "calls gh for no work item while no client is connected, nor once its client left, nor for an archived work item" waits a fixed 300 ms after its client's close before it takes the count of `gh` calls it compares 400 ms later. A watch turn already under way at the close could put a call in that second window under load, as #291's read did. It has not failed in any run named in the issues, and the spawn narrowed this work to the three cases. The method was a read of each `socket.close()` in `daemon.test.ts` followed by a fixed `pause`: it found this case and the idle case "holds under `always` with no session, …", which waits for a timer and counts no call. For #292's cause, each `onDisk(` call in `daemon.test.ts` was read for a work item with no branch and a commit made before the snapshot, and only the case fixed here has one. The others' work items get their branch by a rename first, or have no commit made in them, as the work item "Beside it" has, or the case has no work item.

No case of `chain.test.ts` other than #295's was timed against its 60 s limit. A list of the cases near it needs the file's times from a whole run, which is the broad gate's.
