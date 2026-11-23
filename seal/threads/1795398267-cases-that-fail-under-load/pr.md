Closes #161.

| Done when | What holds now |
|---|---|
| The settle case has a time limit that fits its seven processes, as the other cases that start several processes have | The case has 20 seconds, as the cases of the Claude adapter that start several processes have |
| The adapter case's bound tells an exit reported without waiting for the child from one that waited for the child's 30 seconds, and no longer counts the shell's start against a second and a half | The exit has to arrive within 10 seconds, and the case has 20; an adapter that waited for the child's 30 seconds still fails it |
| The whole suite passes at the branch's head under the same load | The broad gate's run at the head, below |

🤖 Generated with [Claude Code](https://claude.com/claude-code)
