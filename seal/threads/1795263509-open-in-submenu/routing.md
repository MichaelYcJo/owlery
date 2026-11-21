# Routing: 1795263509-open-in-submenu

| Axis | Answer |
|---|---|
| Review | straight to the PR |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | feat/109-a-menu-lists-every-installed-app |

Answered 2026-11-21 by the orchestrator, before the first edit.

## Why this way

The owner answered the routing question `agentic` on 2026-11-19 for the release's remaining issues, and on 2026-11-20 gave the orchestrator the scope of release 0.0.1 for small basics, chose Fable for the framers and crafters and Opus for the proofers and sealers, and agreed that the small items go without review rounds. On 2026-11-21, during the hand check of #24, the owner chose that the Open in items go under a submenu. Judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** the renderer's menus have no submenu, so the issue leaves open how one opens, how the keyboard moves into and out of it, and where it stands near the window's edge. The tree answers these, and a framer reads it.
- **Implementation, crafter:** the work touches the menu builders of `view.ts`, the menu's drawing and keyboard handling in the renderer, and their cases, which is more than the orchestrator should hold beside the owner's hand check.
- **Review, straight to the PR:** the change regroups the items of two menus and adds one level to the menu's drawing, and the sealer's reading of the diff against the issue is the independent reading.
- **Automation, yes:** the menus' entries are functions a case reads, and the window is driven through the debugging port of an app started under `OWLERY_BACKGROUND=1`.
- **Branch:** the pull request merges into `release/v0.0.1` (`docs/roadmap.md` *Releases and the tracker*), by squash.
