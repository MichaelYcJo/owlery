# Changelog: the records folder is agentory/, and the plugin keeps its name agentic

Issue #344. The build of #322 named a connected repository's records folder after the method, `iadd/`, and its documents said that the AgenticSeal plugin would become the plugin `iadd`. On 2026-11-28 the owner set that IADD is the method, that a product only expresses it, and that no product takes its name.

- **A connected repository's records stand under `agentory/`.** The folder's `README.md` opens with `# What IADD keeps in agentory/`. Connecting a repository writes that folder, the move from the earlier form moves the records there, and the pull request check reads them there. No release wrote `iadd/`, so nothing reads it as an earlier form. A repository connected by a build of this release's branch before this change holds an `iadd/`, which is moved by hand: `git mv iadd agentory`, then the README's first line set to `# What IADD keeps in agentory/`.
- **The method keeps IADD's names.** The trailers `IADD-Routing:` and `IADD-Built-By:`, the inspection and its states, and the opener `iadd` of a record's block are unchanged.
- **The documents say that the AgenticSeal plugin keeps its name `agentic` and its command `agentic`.** `docs/iadd.md` states the rule that no product takes the method's name, why the records folder is named `agentory/`, and the names set aside for it.
