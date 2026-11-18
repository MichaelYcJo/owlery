# Changelog: the v0.1 scope and its milestones

Issue #1. The scope of v0.1 stood only in the owner's private notes, so a reader of the repository could not tell what the first version is, in what order it is built, or when it is done.

- **`docs/roadmap.md` and its Korean edition `docs/roadmap.ko.md` are new.** The document holds one section for each version, and v0.1 is the only one filled. That section states the goal, five milestones in order with what each builds and when each is done, the grounds for the order, the done criteria of v0.1, and a table of the decisions left open. The scope of later versions is not decided, and their section holds links only.
- **Each milestone of v0.1 ships in a release of its own.** One `release: <version>` milestone on GitHub tracks each, and the release that closes the fifth milestone is 0.1.0.
- **`docs/architecture.md` *Build order* no longer holds the stage table.** The section keeps its heading, the rule that the shell is an end-to-end skeleton, and what is built after v0.1, and it links to the roadmap for the order of v0.1. The stage names "port stage" and "extension stage" are gone, and the text says "in v0.1" and "after v0.1".
- **Owlery sends Anthropic no inquiry about headless launches.** `docs/architecture.md` judges headless role sessions against Anthropic's two published documents, named by title with the date they were read, and judges again when either changes. The rows of *Open decisions* on headless launches and on reading usage limits name the same criterion. No milestone of v0.1 waits on Anthropic.
- **The README pair lists the roadmap** in its *Documents* table, and `docs/architecture.ko.md` holds every change above in Korean.
