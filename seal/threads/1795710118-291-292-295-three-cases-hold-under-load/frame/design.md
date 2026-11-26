# Design: three cases hold under load

The tree as read at `c80b900a`. Sources: issues #291, #292 and #295, each of which states its cause and its *Done when*.

## Scope

1. **The inbox case of #291 waits for the read under way, not for a fixed time.** `apps/desktop/test/daemon.test.ts` › the inbox › "reads no count while no client is connected, …" waits until the daemon holds no client and then for the read of commits under way, before it counts the `rev-list` calls.
2. **The removal case of #292 reads the disk after the work item has taken up its branch.** `daemon.test.ts` › repositories › "removes a repository whose work item has a running pane only where …" waits for the inbox to carry the branch the daemon takes up, so no read of the daemon's falls between the case's two reads of the worktrees.
3. **The chain case of #295 is split by the shape it holds.** `apps/desktop/test/chain.test.ts` › the pull request stage › "stops the chain where the stage fails, …" becomes one case for each kind of failure, with the same sentences asserted, so none runs near the 60-second limit.

## Out of scope

- Any change of product code. A fix that needs one stops the work and is named in its record.
- Other cases of the same kind (a fixed pause after a close; the time of the other chain cases), which `gaps.md` names.

## Rule changes

- nothing
