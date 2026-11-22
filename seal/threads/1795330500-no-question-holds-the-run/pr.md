Part of #119. The issue closes when `release/v0.0.2` reaches `main`.

Under the routing answer `agentic`, no question holds the run: this is Owlery's identity, in the owner's words of 2026-11-22. A person who hands several work items over and walks away should not come back to a run one question stopped whole, nor find nothing of what was decided for them. This writes the rule into the policy documents and builds the two outlets the daemon's stages will use: a decision made in place of asking, shown on its work item and reversible, and a question that holds its one work item while the others go on.

| Done when | What holds now |
|---|---|
| `docs/product.md` *What we promise* and `docs/architecture.md` *Code runs the order, the orchestrator judges* state the rule, in both languages | Written in this pull request, as a paragraph of its own under the promise (#119's Q2 at its default), and in the sections the frame names, English and Korean |
| A role session that ends asking the person parks its work item, and the daemon goes on | `Daemon#park` holds one work item with its questions: its line stands under "Waiting for you" with its first question, a notification says "Waiting for your answer", and the view answers every question at once by keyboard. Nothing else is held. No stage calls it yet: #41 and #42 do |
| The decisions made without asking show in the inbox, without holding the work | `Daemon#decided` records a decision with its kind and grounds; the line counts them, the preview and the view list them under "Decided without asking", and "Reverse" sends a message that is kept with the work item. Handing a reversal to the next stage comes with #41 |
| The summary of what changed counts decisions apart | "1 waiting for you. 3 decisions made without asking." |
| A request that hands over several work items asks once, and an issue's "a person decides" is checked against the tree first | Stated as the rule; the orchestrator session and the question screen that run it are #50, #51 and #53's, where #119 carried the lines on 2026-11-22 |

**Which runs count as handed over** (#119's Q1) stands at its default: every run the daemon carries, since milestone 2's person presses "Get a seal" and walks away. A reply on #119 reverses it.

**The decisions and the questions are kept** in `decisions.json` and `asked.json` in the daemon's run folder. Deleting a work item or removing its repository removes its entries; archiving keeps them.

Not verified:

- **How the decisions, the questions section and the summary look** in both themes, and the notification raised at a park: the owner, in the running app. One built-app case drives the lines, the view, "Reverse" and the keyboard answers.

🤖 Generated with [Claude Code](https://claude.com/claude-code)
