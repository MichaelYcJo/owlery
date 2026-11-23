Closes #164.

| Done when | What holds now |
|---|---|
| The cause is found and stated: what the cases depend on that changed between the passing runs and the failing ones | The displays: every display of the Mac slept from 11:55, and a page of a window started in the background then draws no frame, so the change of `prefers-color-scheme` never reaches it. The second case only inherits the first one's dark appearance |
| The cases hold whatever the machine's own appearance is, or the issue states why they cannot and what they read instead | The window started in the background keeps drawing at each page it loads, so the change reaches the page whether the displays sleep or not; the machine's appearance was never the cause |
| (found on the way) Three cases of the unit project timed out at 5 seconds in this fix's first broad gate, with the 5-minute load average at 18 | Every case of the unit project has 20 seconds (`d318715`), and the per-case 20 seconds of #161 are gone |
| The whole suite passes at the branch's head on the owner's Mac | The broad gate's run at the head, below, with the displays asleep |

🤖 Generated with [Claude Code](https://claude.com/claude-code)
