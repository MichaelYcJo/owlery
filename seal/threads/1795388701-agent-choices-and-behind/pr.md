Part of #27. The issue closes when `release/v0.0.2` reaches `main`.

When an agent in a work item's pane asked the person a question, its line said "Working" until Claude Code sent a permission request or a notification, and then said "Asks to use AskUserQuestion" or the notification's sentence, never the question. A work item said how many commits its branch was ahead of its base branch, and not whether the base had moved on.

| Done when | What holds now |
|---|---|
| A waiting line and the preview show the choices an agent offers with its question, read from the hook's payload and never from the terminal | The work item waits under "Needs you" from the moment its agent calls the question tool, and its line reads, for example, "Which library formats the dates? date-fns · dayjs". The preview and the view show the card "Claude Code asks", with each question and a numbered list of its choices, each with what it leads to. The card holds no button and no field: the person answers in the agent's own pane |
| A work item carries how many commits its branch is behind its base branch, and the preview and the view's facts show it beside "ahead" | The preview says "6 commits ahead of main, 2 behind", and the view's facts say "main · 6 ahead · 2 behind". Both counts come from one git command against the base as the clone holds it; no remote is asked |
| No new protocol field names a vendor | The two new fields are `stateQuestions` and `behindBase`. The question tool's name and its input's field names stand in the daemon alone, and neither the protocol nor the window names them |

**The order of Claude Code's events around a question** (Q1) stands at its default: the build reads the question tool's `PreToolUse` and `PermissionRequest` as Claude Code's hooks reference gives their shape. It has not been seen from a real session; one run at the built app with `OWLERY_DEBUG_HOOKS=1` answers it, and either other answer changes one module in a follow-up issue.

### Screenshots

A work item whose agent asks a question with two choices, in the inbox's preview and in the work item's view:

![Night watch dark, the inbox](../blob/19f32f84cd8e971a3065fa1c284cb36e4353d7ff/seal/threads/1795388701-agent-choices-and-behind/screenshots/night-watch-dark-inbox.png?raw=true)
![Night watch dark, the work item's view](../blob/19f32f84cd8e971a3065fa1c284cb36e4353d7ff/seal/threads/1795388701-agent-choices-and-behind/screenshots/night-watch-dark-view.png?raw=true)
![Night watch light, the inbox](../blob/19f32f84cd8e971a3065fa1c284cb36e4353d7ff/seal/threads/1795388701-agent-choices-and-behind/screenshots/night-watch-light-inbox.png?raw=true)
![Night watch light, the work item's view](../blob/19f32f84cd8e971a3065fa1c284cb36e4353d7ff/seal/threads/1795388701-agent-choices-and-behind/screenshots/night-watch-light-view.png?raw=true)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
