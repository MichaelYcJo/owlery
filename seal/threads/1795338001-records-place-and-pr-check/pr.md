Part of #40. The issue closes when `release/v0.0.2` reaches `main`.

A person pointed Owlery at a folder and got work items, and nothing was created in the repository: no place for work records, and no check that reads them outside the app. A later seal would have had no committed grounds, and a colleague without the app no verdict.

| Done when | What holds now |
|---|---|
| Connecting a repository creates the place for work records and the workflow of the PR check in one step, as a change the person reads before it is committed | When you register a repository that lacks a part of the place, a dialog opens. It lists each file Owlery would write with its whole text, the commit's subject and the branch the commit lands on. Nothing is written until you press "Set up and commit". The commit holds `seal/README.md`, `seal/config.json` and `.github/workflows/owlery-seal.yml`, made with your git identity and hooks, and nothing is pushed. The repository's menu entry "Records and check…" opens the dialog again |
| A repository that already holds AgenticSeal records and its check is connected without either being overwritten | What the repository has committed is kept. A repository that already holds an AgenticSeal records root and AgenticSeal's `hygiene.yml` gets no file, and the dialog says what it holds. A workflow of your own that happens to be named `hygiene.yml` is not taken for the check: Owlery tells AgenticSeal's by the script it runs, and writes its own workflow beside yours. Where the repository keeps a `seal/` folder of its own, Owlery's root is `agentic-seal/` |
| The broad gate command is set at the same time, and the app shows where it is kept | The dialog holds a field for it and writes it as the `Broad gate` key of the root's `config.json`. Owlery proposes a command from your `package.json`, its `check` script or else its `test` script |
| The check runs on GitHub without the app, and a pull request that declares no work item passes it unjudged | The workflow `seal` fetches the check's scripts from Owlery's repository at the tag of the release that wrote it and runs them on Python 3.12 or newer. A pull request whose branch no work item's records name is not judged and passes |
| The app says, before anything is written, that a repository that cannot keep work records in its tree is out of scope | The dialog's first sentences: "Owlery commits work records to this repository. A repository that cannot keep work records in its tree is out of scope for Owlery." |
| The choice between adapting AgenticSeal's scripts and rewriting them is written into `docs/architecture.md` | The check's 19 scripts stand in `pr-check/`, started from AgenticSeal 0.38.4 under its MIT License, and are Owlery's to change. `docs/architecture.md` says Owlery follows no release of AgenticSeal and names this choice in place of "not decided" |

**The check is named `seal`, and both language keys are written `English`** (#40's Q1 and Q2 at their defaults, decided under `agentic`).

**A work item's records now have a place for its decisions and its questions**, `decisions.md`, one fenced block of fixed fields each. Nothing in the app writes or shows them yet: the daemon gains the code that reads and writes the file, and #119 builds the inbox on it.

**The setup's commit is local until you push it.** A work item cut from the remote's base before that push holds no place for records, and nothing in the app says so yet (#137).

🤖 Generated with [Claude Code](https://claude.com/claude-code)
