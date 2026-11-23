<p align="center"><img src="apps/desktop/assets/icon/app-icon.svg" width="200" alt="Owlery's emblem: a warm white owl on a black rounded square"></p>

# Owlery

*English · [한국어](./README.ko.md)*

**Answer once, and come back to a pull request sealed by a party that did not build it.**

Owlery (OWL-er-ee) is a desktop app, built on AgenticSeal's workflow, that puts a seal on agent work, and the seal breaks. A party independent of the one that built the work judges it and binds the seal to one commit. If even one commit lands after that, the seal breaks, and everyone looking at the PR sees it. A person answers the questions about one issue once and walks away. Design, implementation, review rounds and the verdict then follow without a person, and a PR comes back carrying the seal.

An owlery is a place where owls live. The owls are the agents. Owlery's emblem is the owl without the wax, and the owl on a wax seal stays AgenticSeal's mark of a guarantee. The details are in [docs/name.md](docs/name.md).

## Run it

Release 0.0.1 runs this much. The window opens on the inbox. A work item gets a branch and a worktree of its own, terminal panes open in that worktree, and one question can be put to a headless Claude session. No seal exists yet: the review rounds and the seal come with milestone 2 of the [roadmap](docs/roadmap.md#milestones).

You need macOS, Node.js and pnpm 10.33.0. The commands below were run with Node.js 26.13.1. Run them from the top of the repository:

```
pnpm install
pnpm --filter @owlery/desktop start
```

The first start downloads Electron's binary, and then the window opens.

## The seal check on GitHub

When a repository is connected, Owlery commits a workflow to it, `.github/workflows/owlery-seal.yml`. On each pull request the workflow runs Owlery's pull request check, which reads the records the work item committed. The check posts its verdict as a GitHub check named `Owlery seal` on the pull request's head commit. The workflow's own job, `seal`, fails where `Owlery seal` fails and passes where it passes or is neutral. A person without the app reads the verdict there, and in the seal section at the top of the pull request's body, which is a copy of the newest verdict block of the work item's `guarantee.md`. A commit pushed after the seal fails the check until a new seal is given.

| Result of `Owlery seal` | Title | When |
|---|---|---|
| Passed | "Sealed at" and the sealed commit | A ready pull request whose head commit carries a seal, and a draft that would pass once ready |
| Failed | "Seal broken: a commit landed after" and the sealed commit | A ready pull request whose head commit holds a seal that a later commit broke, a merge of the base among them |
| Failed | "No seal at the head commit" | A ready pull request whose head commit holds no seal |
| Failed | "The records are refused" | A ready pull request whose records fail another part of the check |
| Neutral | "Draft: judged when it is ready" | A draft that would be refused once ready |
| Passed | "Not judged: no work item is declared" | A pull request that declares no work item |
| Failed | "The seal check could not run" | The check could not read the checkout or the base branch it is judged against |

**An administrator of the repository makes the check required.** In the repository's rules for the base branch on GitHub, under the rule that requires status checks to pass, the administrator adds `Owlery seal`. Owlery changes no setting of the repository, and the app's dialog "Records and check" says the same. A pull request from a fork gets no `Owlery seal` check, because GitHub gives its workflow run a token that cannot write one, so a required check holds that pull request until an administrator lets it through. A repository that keeps AgenticSeal's `hygiene.yml` in place of Owlery's workflow posts no `Owlery seal` check.

**The verdict is a check, and never an approving review.** Owlery writes no review and merges nothing. The person merges.

## Documents

| Document | What it holds |
|---|---|
| [docs/product.md](docs/product.md) | The promise, who it is for, the three places the seal is shown, performance hypotheses and the benchmark plan, what we deliberately don't do, the first session |
| [docs/architecture.md](docs/architecture.md) | How the app, the daemon, the agent adapters and the AgenticSeal process fit together, what we take from AgenticSeal, how order and judgment are split, the rule for the first milestone's shape and what follows v0.1, memory design, the screen framework, what to measure before building |
| [docs/roadmap.md](docs/roadmap.md) | What each version builds, in what order, and when it is done: the five milestones of v0.1, the grounds for their order, the done criteria, and the decisions left open |
| [docs/name.md](docs/name.md) | The meaning and origin of the name, its pronunciation, what to keep in mind, and the emblem |
| [docs/design.md](docs/design.md) | How the window looks and speaks: its principles, the three themes and every value each draws with, the forms of its parts and their states, the voice of its words, what it stays clear of, and the screenshots a pull request that changes the window carries |

## Relationship to AgenticSeal

AgenticSeal is the original Owlery draws on, and Owlery is the product that extends it. Owlery does not run on the AgenticSeal plugin. It takes the principles, invariants, roles and record format and makes them its own; the app's code runs the order; and the roles' agent definitions and skills ship inside the app as the defaults. AgenticSeal plugin users keep using it in Claude Code as they do now. What was taken where, and the compatibility of the record format, are in [docs/architecture.md](docs/architecture.md).

## License

Apache License 2.0. Why, and how code from other projects is taken, is in [docs/architecture.md](docs/architecture.md#license-and-code-from-other-projects). The Owlery and AgenticSeal names and the owl emblem are not under that license, and [TRADEMARKS.md](TRADEMARKS.md) states what they are under.
