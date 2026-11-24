# Closing memo: 1795403562-pages-draw-while-displays-sleep

## Not verified

| Item | Who must answer |
|---|---|
| closed Whether the cases still pass with the displays awake after the change; the comment of `background.ts` records, from #148's measurement, that a fully transparent window is visible and draws there | answered: the broad gates of the release's later work items ran with the displays awake and passed, the last at `d78a8b0` (pull request #177) |
| closed Whether the cases would fail with the displays asleep and the machine's appearance light; the probe saw no change event in either direction, which reads as the same failure | a measurement no record asks for: it needs the machine's appearance changed, which the owner's rule forbids an agent, and the failure it would explain is the one this work item already fixed. Nothing is opened |

## Not done

No case was added that fails without the change while the displays are awake: what the change guards against happens only while they sleep, and no case can put the displays to sleep. The first case catches it whenever a run meets sleeping displays.
