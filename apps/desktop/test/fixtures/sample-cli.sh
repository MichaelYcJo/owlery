#!/bin/sh
# The stand-in for the `claude` CLI in the screenshot run, which
# sample-pane.sh names to the daemon. It asks no model anything: it prints a
# version where it is asked for one. The adapter writes its handshake and
# then the prompt. A prompt that asks to run the tests of the redirect is
# held: the stand-in asks the host to allow one command, as Claude Code asks
# with `--permission-prompt-tool stdio`, and waits, so the view's screenshot
# shows a session that waits for the person. Every other prompt fails at
# once, so the view's screenshot shows a prompt that failed.
if [ "$*" = "--version" ]; then
  echo '2.1.330 (Claude Code)'
  exit 0
fi
read -r handshake
read -r prompt
case "$prompt" in
  *'Run the tests of the redirect'*)
    printf '%s\n' '{"type":"control_request","request_id":"ask-1","request":{"subtype":"can_use_tool","tool_name":"Bash","input":{"command":"pnpm test -- redirect.test.ts"},"tool_use_id":"tool-1"}}'
    # No answer comes before the run ends, and the end of the input ends the stand-in.
    exec cat > /dev/null
    ;;
esac
printf 'error: the stand-in of the screenshot run asks no model\n' >&2
exit 1
