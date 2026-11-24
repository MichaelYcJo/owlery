Part of #22. The issue closes when `release/v0.0.2` reaches `main`.

Before this work the summary that greets a person who comes back said what changed while they were away and nothing of seals. A seal given or broken in the meantime did not open it. Each line also kept what the window read when it loaded, so a line could show a lit seal after the seal broke.

| Done when | What holds now |
|---|---|
| A change to sealed or broken since the person last looked opens the summary, as a new waiting state does since #18 | The daemon's record of the person's last look now keeps each work item's seal as the daemon sent it. When the window loads, a work item whose seal was given or broke since that look joins the summary and opens it. A seal the daemon reads only after the window loaded, as just after the daemon starts, joins the summary once when it is read; the screen in front stays, and the count beside "Summary" grows. A work item whose branch the daemon has not read yet carries no seal, so it counts as no change. A seal that broke after the work item's pull request merged is not said |
| The summary names how many work items were sealed and broke since the last look, each line with its seal | The sentence counts the seals first and each work item once, for example "2 sealed, 1 seal broken, 1 needs you, 1 working". The sealed lines come first, then the broken ones, then the rest in the inbox's order. A sealed line reads "Sealed at 1a2b3c4 after 2 review rounds." and a broken one "Seal broken." with the seal's own sentence, and each line carries the work item's seal. Each line and the sentence are worked out again each time the summary is drawn, so a seal that breaks while the person reads the summary turns its line in place |

The main control now says why its work item waits. "Answer the first question" opens the first line that waits on a question, a call to allow or its agent's own question. Where none does and a line waits for another reason, such as a broken seal, it reads "Open the first that needs you".

When the summary opens by itself, and what counts as the person's last look, stay as #18 built them. They are the owner's to decide (`frame/questions.md` Q1 and Q2, open). Which of the window's events carries a look is measured in the hand walk of #48 (Q3). The sealed work item's view with the large seal and the back of the seal is #47's.

`pnpm run screenshots` now captures the summary as an eighth view.

### Screenshots

The summary, leading with a seal given and a seal broken since the last look:

![Night watch dark, the summary](../blob/5f487258d49ec89c3709fcabbe5855373f65d91d/seal/threads/1795397381-summary-of-seals/screenshots/night-watch-dark-summary.png?raw=true)
![Night watch light, the summary](../blob/5f487258d49ec89c3709fcabbe5855373f65d91d/seal/threads/1795397381-summary-of-seals/screenshots/night-watch-light-summary.png?raw=true)
![Register dark, the summary](../blob/5f487258d49ec89c3709fcabbe5855373f65d91d/seal/threads/1795397381-summary-of-seals/screenshots/register-dark-summary.png?raw=true)
![Register light, the summary](../blob/5f487258d49ec89c3709fcabbe5855373f65d91d/seal/threads/1795397381-summary-of-seals/screenshots/register-light-summary.png?raw=true)
![Desk dark, the summary](../blob/5f487258d49ec89c3709fcabbe5855373f65d91d/seal/threads/1795397381-summary-of-seals/screenshots/desk-dark-summary.png?raw=true)
![Desk light, the summary](../blob/5f487258d49ec89c3709fcabbe5855373f65d91d/seal/threads/1795397381-summary-of-seals/screenshots/desk-light-summary.png?raw=true)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
