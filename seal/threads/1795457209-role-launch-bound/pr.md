Closes #171.

| Done when | What holds now |
|---|---|
| The case's bound tells a CLI the adapter stopped from one that ran its 30 seconds, and no longer counts the shell's start against `KILL_AFTER_MS` | The run has to end within 10 seconds of its start; a CLI the adapter did not stop works for 30 |
| The other cases of the file that bound a run by `KILL_AFTER_MS` or a like constant are read for the same count, and each is bounded the same way | The second role launch case that counts from the run's start gets the same bound. The two cases that count from a stop keep `KILL_AFTER_MS`, since they tell a CLI that ended at the signal from one that needed the kill (`seal/threads/1795457209-role-launch-bound/gaps.md` *Not done*) |
| The whole suite passes at the branch's head under the broad gate's load | The broad gate's run at the head, below |

🤖 Generated with [Claude Code](https://claude.com/claude-code)
