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
# question with a park. So are the stages of the chain of the finished work
# item, which fixes one finding, passes its broad gate and is sealed, so the
# daemon opens its pull request through the stand-in for `gh`
# (sample-gh/gh): its review round 1 with a record that holds one finding at
# `export.ts:1`, its fix pass, which commits a fix of that file and closes
# the finding `fixed` with that commit, its review round 2 with a record that
# holds no finding and confirms the fix, and its seal with a run's section
# whose verdict is `sealed`. Each answered stage's result reports what it
# used, as Claude Code's result line does, and no session names a key, so
# the daemon's ledger holds a converted cost for each. Every other review
# round's prompt is held, with nothing printed, so the round of a chain the
# run starts stays at work and the screenshots show a stage that runs. Every
# other prompt fails at once, so the view's screenshot shows a prompt that
# failed.
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

# What a turn used, as the fields of Claude Code's result line give it: its
# cost in US dollars, then one model's tokens in and out and read from and
# written to the cache. The numbers are invented examples.
used() {
  printf '"total_cost_usd":%s,"modelUsage":{"claude-stand-in":{"inputTokens":%s,"outputTokens":%s,"cacheReadInputTokens":%s,"cacheCreationInputTokens":%s,"costUSD":%s}}' "$1" "$2" "$3" "$4" "$5" "$1"
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
    printf '{"type":"result","result":"```seal\\nrules: 1 park\\ngrounds: No document names the base of a hotfix, and the choice decides which release ships it.\\n```\\n","is_error":false,%s}\n' "$(used 0.06 3100 400 21000 1200)"
    exit 0
    ;;
  *'of the sealer on the work item'*'add-an-export-of-the-history'*)
    session sealer
    printf '{"type":"result","result":"%s\\n\\n### Claims checked by reading\\n\\n| Claim | Source | Read at | Result |\\n|---|---|---|---|\\n| Round 2 confirmed the fix of finding 1 of round 1 | `trail/rounds/round-2.md` | `export.ts:1` | holds |\\n\\n### The parties\\n\\n| Party | Says | Agrees with | Disagrees with |\\n|---|---|---|---|\\n| the build | The branch adds the export of the history | round 2 | none |\\n\\n```seal\\n%s\\nVerdict: sealed\\n```\\n","is_error":false,%s}\n' "$(given 'Your section.s heading')" "$(given 'Your verdict.s target line')" "$(used 0.22 7400 1200 40000 3100)"
    exit 0
    ;;
  *'of the sealer on the work item'*)
    session sealer
    printf '{"type":"result","result":"%s\\n\\n### Claims checked by reading\\n\\n| Claim | Source | Read at | Result |\\n|---|---|---|---|\\n| Round 1 left no finding | `trail/rounds/round-1.md` | `hotfix.ts` | holds |\\n\\n### The parties\\n\\n| Party | Says | Agrees with | Disagrees with |\\n|---|---|---|---|\\n| the build | The branch adds the hotfix | round 1 | none |\\n\\n```seal\\n%s\\nVerdict: undecided question: Which base does the hotfix merge into?\\n```\\n","is_error":false,%s}\n' "$(given 'Your section.s heading')" "$(given 'Your verdict.s target line')" "$(used 0.21 7100 1100 39000 2900)"
    exit 0
    ;;
  *'The fix pass of review round 1 of the work item'*'add-an-export-of-the-history'*)
    # The fix of the finding at `export.ts:1`, committed, and the close block appended under that finding, the record's last, and left uncommitted for the daemon.
    session crafter
    record=$(given 'The round record')
    printf 'export const HEADER = "date,title";\n' > export.ts
    git add export.ts && git commit --quiet -m 'fix: write the header row of the export once' || exit 1
    printf '\n```seal\nverdict: fixed %s\nanswer: The export writes its header row once.\n```\n' "$(git rev-parse HEAD)" >> "$record"
    printf '{"type":"result","result":"The fix pass closed finding 1.","is_error":false,%s}\n' "$(used 0.41 9800 3400 51000 7700)"
    exit 0
    ;;
  *'Review round '*'add-an-export-of-the-history'*)
    # Round 1 leaves one finding at `export.ts:1`, and round 2 none, confirming its fix.
    session proofer
    heading=$(given 'Your record.s heading')
    case "$heading" in
      '# Review round 1: '*)
        said='\n### 1. The export writes the header row twice\n\n```seal\nseverity: must\nlocation: `export.ts:1`\nevidence: read `export.ts:1`\n```\n\nWhy it matters: a spreadsheet reads the second header as a row of data.\n'
        cost=$(used 0.28 12300 2100 48000 9200)
        ;;
      *)
        said='\n## Confirmations\n\n```seal\nconfirms: round-1#1\n```\n\nWhat holds: the header row stands once at `export.ts:1`, read.\n'
        cost=$(used 0.19 8100 900 44000 2000)
        ;;
    esac
    printf '{"type":"result","result":"%s\\n\\n```seal\\n%s\\n```\\n\\n## Findings\\n%s","is_error":false,%s}\n' "$heading" "$(given 'Your record.s target line')" "$said" "$cost"
    exit 0
    ;;
  *'Review round '*'choose-the-base-of-the-hotfix'*)
    session proofer
    printf '{"type":"result","result":"%s\\n\\n```seal\\n%s\\n```\\n\\n## Findings\\n","is_error":false,%s}\n' "$(given 'Your record.s heading')" "$(given 'Your record.s target line')" "$(used 0.17 6900 700 36000 1800)"
    exit 0
    ;;
  *'Review round '*)
    # No answer is written, and the end of the input ends the stand-in.
    exec cat > /dev/null
    ;;
esac
printf 'error: the stand-in of the screenshot run asks no model\n' >&2
exit 1
