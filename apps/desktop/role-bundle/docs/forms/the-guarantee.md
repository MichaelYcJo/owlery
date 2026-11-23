# The sealer's verdict

The sealer answers with this verdict, the daemon writes it, and the pull
request check reads it.

## The guarantee

**The sealer is the final, independent guarantor**, and what it verifies
against is `agents/sealer.md` *Job*'s. The daemon launches it after the
review rounds settle and the daemon's own run of the repository's broad
gate has written `trail/gate.md`. It reads that record and runs nothing,
and its order of work is `agents/sealer.md`'s. Where a later commit broke
an earlier seal, the sealer's prompt hands it the part that changed since
that seal's commit, it stands on the earlier run's section for the rest,
and its verdict still covers the whole branch against its base.

**It checks a claim against the tree, and the parties against each other.**
The acts are `agents/sealer.md` step 2's and step 3's, and this section
names none of them, so the list has one home. Each act is one row of
`### Claims checked by reading` or `### The parties` in its run's section
of `guarantee.md`. It does not re-judge the design or the code's quality.

**Its answer is its run's section of `guarantee.md`, from `templates/records/sdd-guarantee.md`**: the heading `## Run <N>`, the claims checked by reading and the parties compared, in tables for people, and one `seal` block. The daemon appends the section below the sections of earlier runs, under the file's heading `# Guarantee: <work item>`, and no section is edited after its run. The sealer's block holds `target: <sha> against <base>`, each one word, as its prompt gave the line, and one `Verdict:` line, `sealed`, `withheld reason: <the claim, its party, its coordinate>` or `undecided question: <the question>`, written exactly so. The daemon writes four lines more into the block, before its closing fence: `built-by:`, each session that built the work, `judged-by:`, the session that judged it, `model:`, the judging model, and `rules:`, the version of Owlery. A session that built the work gives no verdict: the daemon writes none where the judging session is one of the builders. The last block is the newest run. A guarantee with no verdict block, or with a line of a block that does not parse, is refused naming the file and the line.

**The verdict decides what the chain does next.** A `sealed` verdict rests the chain. A `withheld` verdict stops it with the reason on the work item's line, and the person fixes what the reason names and starts "Get a seal" again. The question of an `undecided` verdict is first decided by the orchestrator from the code and the policy and recorded in `decisions.md`, and one they cannot answer parks the work item until the person answers it in Owlery. The daemon's broad gate and the sealer then run on the new head, and each appends its block.

**A ready pull request passes only where the newest verdict block of `guarantee.md` reads `sealed` and names a commit that only the closing records follow.** The closing records are `trail/gate.md`, `guarantee.md` and `trail/refusals.md`:
every other file on the branch is one the sealer audited, and the rows `trail/refusals.md` gains with the verdict are the daemon's account of the sealer's own stage. A newest block reading `withheld` or `undecided`, one whose `judged-by:` session is one of its `built-by:` sessions, an unfilled template, a block that does not parse or a stale commit each fail naming the file; a draft prints them.
check: ready-needs-sealed

**How it errs.** It reads and runs nothing, so a claim that only a run
would refute passes: a case that was never red, a command that does not
pass. Each row says what was read, so the miss can be found afterwards.
Whether the parties' stories agree is a judgment, so a disagreement it does
not see is missed.
