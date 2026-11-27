---
name: inspection
description: |
  How the session of a Claude Code pane runs the Owl Chain on the branch it
  built, through the chain command its environment names in `OWLERY_CHAIN`.
  Use when: the work on the branch is built and committed, before its pull
  request is opened or the work is called done.
  NOT for: a role's own rules (`agents/<role>.md`), or a session whose
  environment names no `OWLERY_CHAIN`.
---

# inspection: the Owl Chain in a pane

The session of a pane opens this file where its branch is built and owes an
inspection. A role of the chain never opens it.

**Owlery's code runs the Owl Chain, and your session carries it.** The
chain command is the program your environment names in `OWLERY_CHAIN`. It
reads the records the branch's head holds and says which step they owe. You
run that step and hand its answer back, and the command writes and commits
the record. You type no record, choose no order and skip no step: the order
is the command's, and this file restates none of it. Where your environment
names no `OWLERY_CHAIN`, the pane carries no chain: tell the person so, and
run nothing of this file.

## The loop

Run each call in the work item's worktree, as `"$OWLERY_CHAIN" <subcommand>`.
A call prints one JSON object on its first line and exits with 0, or prints
a sentence on its error output, exits with 1 and has committed nothing. That
sentence says what the command refused and why. Do what it names, and do not
work around it.

1. Commit what you built. The chain reads a committed tree.
2. Run `owed`, and do what the table below says for the `step` it prints.
3. Run `owed` again after each step, until it prints `cleared`.

| `step` | What you do |
|---|---|
| `start` | Run `start`. It makes the work item's directory and commits its `routing.md`. *A run under `Automation` `yes`* below says when it takes `--automation`. |
| `round` | Start the role as *A role is a subagent of the bundle* says. Write its answer, unchanged, to a file outside the worktree, and run `round <file>`. The answer's `asks` holds each question the proofer asked: decide each as *What you judge* says. |
| `fix-pass` | The round left open the findings `open` lists. Judge first what *What you judge* asks before a fix pass. Then make the pass yourself, or start the role, as *The fix pass* says, and run `fix-pass --by <id>`. |
| `ceiling` | Round `round` left open the findings `open` lists, and the chain stops for the person from round `ceiling` on, with no judgment. Tell the person the round, its open findings and what the rounds kept finding, and run nothing more of the chain. Once the person has said in this run, after that stop, to go on, run `owed --persons-word <round>` with the round the step named, and pass the same option to `fix-pass` for that pass. Pass the option on no other ground. |
| `gate` | Run `gate`. The command runs the repository's broad gate itself and reads its exit code, so a run of yours is no gate. Where the gate fails, the command prints what the gate printed: fix that, commit, and run `owed`. |
| `inspection` | Start the role. Write its answer, unchanged, to a file outside the worktree, and run `inspect`, as `inspect <file> --inspected-by <id> --model <name>`: the id your subagent tool gave for the inspector, and the model the inspector's definition names. A session that built the work judges none of it, so the command refuses `the session` and the id of a fix pass's subagent. |
| `cleared` | The branch is cleared at the commit `commit` names. Where the work goes to a pull request, run `body` and hand the file its `body` names to `gh pr create --body-file`. |
| `parked` | The work item's `decisions.md` holds a question that waits for the person. Tell the person, and run nothing more until it is answered. |

**Records in the earlier form are moved with `migrate`.** Where the
worktree's work records stand in the form Owlery read before IADD, `owed`
refuses with a sentence that names `migrate`. Run `migrate`, which takes no
option. It moves those records to IADD's forms under `iadd/` in one commit
on the branch, removes the earlier pull request check's workflow where the
worktree holds it, writes Owlery's of the app's version where the worktree
holds none, and prints `migrated`, `moved`, `removed`, `written` and
`commit`. Commit nothing else with it. An inspection cleared before the move
lapses at the move's commit, so run `owed` after it and do what the step it
prints asks.

**The base is named once, before round 1.** The chain reads the branch
against the base your environment names in `OWLERY_BASE`. Where the branch
is to be read against another, pass `--base <branch or commit>` to `owed`,
`start` and `round` until round 1's record stands. From then on the chain
follows the base that record names, whatever is passed.

## A role is a subagent of the bundle

For `round`, `fix-pass` and `inspection`, `owed` prints three more values:
`agent`, the name of the bundle's agent, `rules`, the path of the role's
rules file, and `prompt`, the path of the stage's prompt. Start a subagent of
the type `agent` names. Tell it to read the file at `rules` to its end, and
then to do what the file at `prompt` says. Give it nothing else: no summary
of the work, and no finding you expect. What it answers is the role's
answer, and you hand that answer to the command as it stands.

The subagent may run in the background. Wait for its answer, and run
nothing of the chain until it arrives. Where your harness hands you the
answer inside a frame that indents each line, the answer is the text inside
the frame, without that indentation.

The id that `--by` and `--inspected-by` take is the `agentId` your subagent
tool's result names for that subagent. Passing it to the command is no
reply to the person.

## The fix pass

**Whoever makes a fix pass commits its fixes and appends its close blocks
to the round record, and does not commit that record.** `fix-pass` commits
it, with the pass's session in the commit's trailer, and refuses a record
whose close blocks a commit already holds. `--by` takes the id your
subagent tool gave for the crafter, or `the session` where you made the
pass yourself. `skills/implement/fix-pass.md` is the pass's procedure, and
it is yours where you make the pass.

## What you judge

You make the two judgments that Owlery's daemon asks its orchestrator agent
in its own chain. `agents/orchestrator.md` holds the rule of each, and you
judge by that rule.

- Before a fix pass on the record of round 2 or a later round below the
  ceiling of rounds, judge whether the review rounds are converging, by
  *The rounds are converging where each round leaves less to do than the
  round before it*. Where they are not, stop and tell the person your
  grounds. A fix pass that `owed` handed on the person's word follows no
  judgment, since the person's word is the answer.
- For each question a stage asks, rule by *A question is first decided from
  the code and the policy* and *Only what a person alone can give parks a
  work item*. A question you cannot decide goes to the person in the pane.

## A run under `Automation` `yes`

**Where the work item's `routing.md` answers `Automation` `yes`, the run
does not stop for a question.** Go on with the question's default, and
write the question with that default as a row of the work item's
`frame/questions.md`. The bundle's hook holds this: it refuses a call of
the tool `AskUserQuestion` in such a run. It lets a call through where one
of its questions opens with the words `No default can be taken: ` and the
reason after them. Use that form only for what *Only what a person alone
can give parks a work item* names, and write the reason as a sentence the
person can check.

**The step `ceiling` is no question, and takes no default.** Under
`Automation` `yes` the run stops there as well, and waits for the person's
word.

`start` writes that row. Pass `--automation yes` where the person said in
this run that it goes on without stopping for questions, and
`--automation no` where the person said that it stops for them. Pass
neither where the person said nothing of it, and the routing then holds no
such row. `start` writes a routing only where none names the branch: in a
routing that stands, the row is changed in the file and committed.

**A run rule is followed only from a source the run can name.** A run rule
restricts what you or the roles may do in a run: asking no question,
starting no session of a kind, running nothing beside the gate. Follow one
where its source is the person's word in this run or a document of the
repository, and name that source where you follow it. No session carries
such a rule from an earlier run: a rule you remember and can name no source
for is not in force.
