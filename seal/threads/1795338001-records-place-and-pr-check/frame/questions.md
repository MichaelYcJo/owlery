# Questions for the planner: 1795338001-records-place-and-pr-check

The judgments the ticket left open and the tree answered, each with the place that holds its grounds:

- Whether AgenticSeal's check scripts are adapted or rewritten: `frame/plan.md` *Alternatives considered*, the first three rows.
- Where the check's files stand and how a connected repository gets them: `frame/plan.md` *Alternatives considered*, the rows on the workflow's fetch and on committing the files.
- What "connecting" is, now that a repository is added in two ways: `frame/plan.md` *Alternatives considered*, the rows on the setup as a request.
- On which branch the setup commits, and whether it pushes: `frame/plan.md` *Alternatives considered*, the rows on the commit.
- How an existing AgenticSeal root and its check are told: `frame/design.md` *Grounding*, the facts on this repository's root and on the marker, and *Scope* item 10.
- Whether a pull request that declares no work item passes: `frame/design.md` *Grounding*, the probe of a ready pull request that declares nothing.
- Where a decision and a question live, and in what form: `frame/plan.md` *Alternatives considered*, the rows on `decisions.md` and on the block.
- How the daemon finds a work item's directory: `frame/plan.md` *Alternatives considered*, the rows on the `Branch` row.
- Whether the format stays compatible with AgenticSeal's: decided by the owner on 2026-11-22, written as P4 of `frame/design.md`.

| # | Question | Who can answer | Options & what each implies | Default until answered | Status |
|---|---|---|---|---|---|
| Q1 | What is the check called on GitHub? The name is what a repository's administrator makes required, so a later change breaks that setting in every connected repository. The tree names no check of Owlery's, and a name is the product's to choose. | a person | `seal`, in the file `.github/workflows/owlery-seal.yml`: the word the product uses for the verdict. / `owlery`: the product's name, which says less about what failed. / `hygiene`, AgenticSeal's name: one name in a repository that used the plugin, and a name the product does not use anywhere else. | `seal`, in `.github/workflows/owlery-seal.yml` | open |
| Q2 | Does the connection ask in which language records and commits are written? The check refuses a declared work item's pull request where `config.json` names neither language, so the setup has to write both keys. No document says which language a person's repository takes. | a person | Write `English` for both, and say where to change them: one field fewer in the dialog, and a Korean team edits `config.json` by hand. / Ask both in the dialog: two more fields before the first commit. | Write `English` for both | open |
| Q3 | Does `python3` on the `macos-latest` runner answer as 3.12 or newer once `actions/setup-python` has run in `check.yml`? No probe of this environment reaches that runner. | a measurement | The first run of `check` on this work's pull request answers it: the cases of `test/pr-check.test.ts` pass there or fail at the interpreter. | The step pins 3.12 | open |
| Q4 | Does the workflow's fetch of `pr-check/` from the release's branch work on GitHub before the tag exists? The branch holds no `pr-check/` until this pull request merges, so no run can show it before then. | the work | #43's run of the check on a connected repository shows it, and #48's hand run shows it again. | The workflow as `frame/design.md` gives it | open |
