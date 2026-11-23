# Closing memo: 1795403562-pages-draw-while-displays-sleep

## Not verified

| Item | Who must answer |
|---|---|
| Whether the cases still pass with the displays awake after the change; the comment of `background.ts` records, from #148's measurement, that a fully transparent window is visible and draws there | The broad gate of each later work item of release 0.0.2, which runs while the displays are awake |
| Whether the cases would fail with the displays asleep and the machine's appearance light; the probe saw no change event in either direction, which reads as the same failure | Not run: it needs the machine's appearance changed, which no agent does |

## Not done

No case was added that fails without the change while the displays are awake: what the change guards against happens only while they sleep, and no case can put the displays to sleep. The first case catches it whenever a run meets sleeping displays.
