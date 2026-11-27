# The sealer's verdict

The sealer answers with this verdict, Owlery writes it, and the pull
request check reads it. Owlery is the daemon in a chain the daemon runs,
and the chain command in a chain a pane's session runs.

## The guarantee

**The sealer is the final, independent guarantor**, and what it verifies
against is `agents/sealer.md` *Job*'s. Its stage is owed after the
review rounds settle and Owlery's own run of the repository's broad
gate has written `trail/gate.md`. It reads that record and never runs the
broad gate itself, and its order of work and where its commands run are
`agents/sealer.md`'s. Where a later commit broke
an earlier seal, the sealer's prompt hands it the part that changed since
that seal's commit, it stands on the earlier run's section for the rest,
and its verdict still covers the whole branch against its base.

**It checks a claim against the tree, and the parties against each other.**
The acts are `agents/sealer.md` step 2's and step 3's, and this section
names none of them, so the list has one home. Each act is one row of
`### Claims checked by reading` or `### The parties` in its run's section
of `guarantee.md`. It does not re-judge the design or the code's quality.

**Its answer is its run's section of `guarantee.md`, from `templates/records/sdd-guarantee.md`**: the heading `## Run <N>`, the claims checked by reading and the parties compared, in tables for people, and one `seal` block. Owlery appends the section below the sections of earlier runs, under the file's heading `# Guarantee: <work item>`, and no section is edited after its run. The sealer's block holds `target: <sha> against <base>`, each one word, as its prompt gave the line, and one `Verdict:` line, `sealed`, `withheld reason: <the claim, its party, its coordinate>` or `undecided question: <the question>`, written exactly so. Owlery writes four lines more into the block, before its closing fence: `built-by:`, each session that built the work, `judged-by:`, the session that judged it, `model:`, the judging model, and `rules:`, the version of Owlery. A session that built the work gives no verdict: Owlery writes none where the judging session is one of the builders. The last block is the newest run. A guarantee with no verdict block, or with a line of a block that does not parse, is refused naming the file and the line.

**The verdict decides what the chain does next.** A `sealed` verdict rests the chain. A `withheld` verdict stops it with the reason. What the reason names is fixed, and the chain is started again on the fixed head, in the pane's session or by Owlery's daemon. The question of an `undecided` verdict is first decided from the code and the policy, by Owlery's orchestrator agent in the daemon's own run, which records the decision in `decisions.md`, and by the pane's session in a pane. One they cannot answer waits for the person. The broad gate and the sealer then run on the new head, and each appends its block.

**A ready pull request passes only where the newest verdict block of `guarantee.md` reads `sealed` and names a commit that only the closing records follow.** The closing records are `trail/gate.md`, `guarantee.md` and `trail/refusals.md`:
every other file on the branch is one the sealer audited, and the rows `trail/refusals.md` gains with the verdict are Owlery's account of the sealer's own stage. A newest block reading `withheld` or `undecided`, one whose `judged-by:` session is one of its `built-by:` sessions, an unfilled template, a block that does not parse or a stale commit each fail naming the file; a draft prints them.
check: ready-needs-sealed

**How it errs.** It checks each claim by reading, so a claim that only a
run would refute passes: a case that was never red, a command that does
not pass. Each row says what was read, so the miss can be found afterwards.
Whether the parties' stories agree is a judgment, so a disagreement it does
not see is missed.
