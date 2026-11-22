#!/bin/sh
# The stand-in for the `claude` CLI in the screenshot run, which
# sample-pane.sh names to the daemon. It asks no model anything: it prints a
# version where it is asked for one, and fails every prompt at once, so the
# view's screenshot shows a prompt that failed.
if [ "$*" = "--version" ]; then
  echo '2.1.330 (Claude Code)'
  exit 0
fi
printf 'error: the stand-in of the screenshot run asks no model\n' >&2
exit 1
