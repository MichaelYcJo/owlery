# Working in this repository

This file holds the rules for how work runs in this repository that every session follows, on whichever machine it runs. A rule whose home is a policy document under `docs/` stands there, and this file links to it rather than restating it. How the AgenticSeal plugin runs a work item is the plugin's own, and this file does not restate it either. The orchestrator these rules name is the session that runs a work item, through the AgenticSeal plugin or in a pane that carries the owl chain. The agents that session starts and the role sessions Owlery's daemon starts read this file too ([docs/architecture.md *Role sessions run detached from the user's environment*](docs/architecture.md#role-sessions-run-detached-from-the-users-environment)), and none of them takes these steps, the orchestrator agent of `apps/desktop/role-bundle/agents/orchestrator.md` among them.

## Where the other rules stand

- Releases, branches, merges, versions, milestones and labels: [docs/roadmap.md *Releases and the tracker*](docs/roadmap.md#releases-and-the-tracker).
- What the orchestrator asks the owner and when, what it decides without asking, and how heavy commands take their turn on the machine: [docs/architecture.md *Code runs the order, the orchestrator judges*](docs/architecture.md#code-runs-the-order-the-orchestrator-judges), and `Heavy commands` in `seal/config.json`.
- How an agent starts the app and runs the built-app files: [docs/architecture.md *Measure before building*](docs/architecture.md#measure-before-building).
- What Owlery spends in memory: [docs/architecture.md *Memory design*](docs/architecture.md#memory-design).
- The name, the icon and how a brand name is searched: [docs/name.md](docs/name.md).

## Work items across sessions and machines

- **Before each next step of a work item, the orchestrator reads the remote.** It runs `git fetch --all --prune`, reads the log of the branch the work item merges into, and lists the pull requests with `gh pr list --state all`. Where another session already has a pull request or a remote branch for the work item or its issue, the orchestrator stops that line of work and reports it. It never pushes a local branch whose name matches a merged remote one. Other sessions, on this machine or another, work on the same release at the same time, and a session that reads only its own worktrees cannot see what they merged.
- **Where `Destination` reads `open the pull request`, the orchestrator pushes a work item's branch to `origin` after every step**: a frame, a phase, a round, a fold, a fix pass, the gate record and the seal. It does not wait for the pull request, so another session or machine can take the work item over from the step it reached. A push to a branch that has no pull request starts none of `check.yml`, `owlery-seal.yml`, `package.yml` and `rerun-unstarted.yml`. The first two start from a pull request's events, and a push to an open pull request's branch is one of them. `package.yml` starts from a tag or a person's dispatch, and `rerun-unstarted.yml` from the run of another workflow.
- **`routing.md` quotes the owner's words that delegate the work, verbatim and with their date, in *Why this way*.** A party that reads the record later then reads the hand-over itself, and not the orchestrator's account of it.

## Framing and research

- **Each framer's spawn prompt asks for a short part of `frame/design.md` headed *What the daemon could do beyond the issue*.** Owlery's daemon outlives the window and sees every work item, record, hook event, cost and check result on the machine, so an issue's literal request seldom uses all it can do. The orchestrator takes the parts that are cheap and inside the issue's scope, files issues for the rest and names them in its report.
- **A comparison with another product inventories every surface a person touches, read from that product's code, with the job the person is doing at each.**
- **A flow a person uses is thought through against the tools that person uses every day before it is framed.** A gap a person reports is filed as an issue, and never answered with a workaround.
