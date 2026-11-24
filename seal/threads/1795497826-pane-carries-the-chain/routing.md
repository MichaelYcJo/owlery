# Routing: 1795497826-pane-carries-the-chain

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/181-a-claude-code-pane-carries-none-of-owlerys-chain |

Answered 2026-11-24 by the orchestrator, before the first edit.

## Why this way

On 2026-11-24 the owner answered question 1 with `agentic` for every issue of release 0.0.3 (#181, #182, #176, #183, #146, #110, #184, #185, and #160, framed before), after asking to "proceed" with 0.0.3. The same day the owner decided the direction this work item builds (folded into the body of #181): Owlery's chain rides on the Claude Code session a pane runs, by default; another chain is detected and the person chooses; "Get a seal" is removed. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the issue leaves open how the role bundle becomes a plugin a pane loads for one session, how another chain is detected and how the repository's own check settles which chain runs (the owner's remark and the orchestrator's reading in the issue's comment of 2026-11-24), what of the daemon's press path goes and what milestone 3 keeps, and it changes a rule several documents state (docs/product.md, docs/architecture.md, docs/roadmap.md in both editions).
- **Implementation, crafter:** the pane's launch, the bundle's packaging, the detection and the choice in the window, the removal of the button and its path, and the documents.
- **Review, through the review chain:** a defect here either touches the person's own Claude Code settings or leaves a pane with two chains or none, and neither shows until a person works in a pane.
- **Automation, yes:** every question foreseen has a default the tree or the framer can give; the cases launch panes with a stand-in CLI and read what it was given; no case starts a real `claude`.
- **Branch:** cut from `release/v0.0.3` at `c82c611`; the pull request merges into `release/v0.0.3` by squash.
