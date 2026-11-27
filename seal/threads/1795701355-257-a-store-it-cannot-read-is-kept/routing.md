# Routing: 1795701355-257-a-store-it-cannot-read-is-kept

| Axis | Answer |
|---|---|
| Review | through the review chain |
| Destination | open the pull request |
| Planning | framer |
| Implementation | crafter |
| Automation | yes |
| Branch | fix/257-a-daemon-that-cannot-read-its-repositories-file-writes-over-it |

Answered 2026-11-26 by the orchestrator, before the first edit.

## Why this way

The issue is in the milestone `release: 0.1.0`, the minimum for Owlery to be published on Sunday 2026-11-29. The owner asked to declare the routing of the remaining items first ("routing먼저 해놓자 그럼") and said they are all agentic ("다 agentic이긴할거야"); every row is the orchestrator's, judged against the plugin's `skills/implement/orchestration.md` *Under agentic*.

- **Planning, framer:** where the store is read and written (`repositories.ts`, the daemon's start), what the moved-aside file is named, and where a person is told, are choices the framer settles against the tree.
- **Implementation, crafter:** the daemon's read and write of the store, a notice the window shows, and a case that starts a daemon on a file it refuses.
- **Review, through the review chain:** a store written over is every repository and work item a person had, gone; the review reads every path that writes the file.
- **Automation, yes:** the questions foreseen have defaults the tree or the framer can give; a person's question is recorded with its default and the build proceeds on it.
- **Branch:** cut from `release/v0.0.5` at `f683c693`; release 0.0.5 shipped without it, and the branch merged `release/v0.1.0` at `e7737b7e` (`61361a38`), so the pull request merges into `release/v0.1.0` by squash, and it takes its turn in the one-at-a-time tail.
