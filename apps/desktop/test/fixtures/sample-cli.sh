#!/bin/sh
# The stand-in for the `claude` CLI in the screenshot run, which
# sample-pane.sh names to the daemon. It asks no model anything: it prints a
# version where it is asked for one. The adapter writes its handshake and
# then the prompt. A prompt that asks to run the tests of the redirect is
# held: the stand-in asks the host to allow one command, as Claude Code asks
# with `--permission-prompt-tool stdio`, and waits, so the view's screenshot
# shows a session that waits for the person. The stages of the chain of the
# work item the run parks are answered, so that chain passes its broad gate
# and parks: its review round with a record that holds no finding, its seal
# with a run's section whose verdict asks a question, and the ruling on that
# question with a park. Every other review round's prompt is held, with
# nothing printed, so the round of a chain the run starts stays at work and
# the screenshots show a stage that runs. Every other prompt fails at once,
# so the view's screenshot shows a prompt that failed.
if [ "$*" = "--version" ]; then
  echo '2.1.330 (Claude Code)'
  exit 0
fi
read -r handshake
read -r prompt

# What the prompt gave between two backquotes after a list item's name, as
# `- Your record's heading: ...`. The name is a pattern of sed, so a dot
# stands for the apostrophe.
given() {
  printf '%s' "$prompt" | sed -n "s/.*- $1: \`\\([^\`]*\\)\`.*/\\1/p"
}

# The first line of a role's session, as the CLI writes one: the session's
# own id, its model, and the role's agent among the agents it holds.
session() {
  printf '{"type":"system","subtype":"init","session_id":"stand-in-%s","model":"stand-in","agents":["owlery:%s"]}\n' "$1" "$1"
}

# A seal's prompt carries the branch's diff, which holds the round record's
# heading, so the seal's case stands before the round's.
case "$prompt" in
  *'Run the tests of the redirect'*)
    printf '%s\n' '{"type":"control_request","request_id":"ask-1","request":{"subtype":"can_use_tool","tool_name":"Bash","input":{"command":"pnpm test -- redirect.test.ts"},"tool_use_id":"tool-1"}}'
    # No answer comes before the run ends, and the end of the input ends the stand-in.
    exec cat > /dev/null
    ;;
  *'Who asks: the sealer'*)
    session orchestrator
    printf '%s\n' '{"type":"result","result":"```seal\nrules: 1 park\ngrounds: No document names the base of a hotfix, and the choice decides which release ships it.\n```\n","is_error":false}'
    exit 0
    ;;
  *'of the sealer on the work item'*)
    session sealer
    printf '{"type":"result","result":"%s\\n\\n### Claims checked by reading\\n\\n| Claim | Source | Read at | Result |\\n|---|---|---|---|\\n| Round 1 left no finding | `trail/rounds/round-1.md` | `hotfix.ts` | holds |\\n\\n### The parties\\n\\n| Party | Says | Agrees with | Disagrees with |\\n|---|---|---|---|\\n| the build | The branch adds the hotfix | round 1 | none |\\n\\n```seal\\n%s\\nVerdict: undecided question: Which base does the hotfix merge into?\\n```\\n","is_error":false}\n' "$(given 'Your section.s heading')" "$(given 'Your verdict.s target line')"
    exit 0
    ;;
  *'Review round '*'choose-the-base-of-the-hotfix'*)
    session proofer
    printf '{"type":"result","result":"%s\\n\\n```seal\\n%s\\n```\\n\\n## Findings\\n","is_error":false}\n' "$(given 'Your record.s heading')" "$(given 'Your record.s target line')"
    exit 0
    ;;
  *'Review round '*)
    # No answer is written, and the end of the input ends the stand-in.
    exec cat > /dev/null
    ;;
esac
printf 'error: the stand-in of the screenshot run asks no model\n' >&2
exit 1
