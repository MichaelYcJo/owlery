#!/bin/sh
# The stand-in for the `claude` CLI in the screenshot run, which
# sample-pane.sh names to the daemon. It asks no model anything: it prints a
# version where it is asked for one. The adapter writes its handshake and
# then the prompt, and the stand-in fails every prompt at once. The
# screenshot run and the Machine dialog's case each resume one chain, whose
# first stage waits for the machine and never starts, so the stand-in
# answers no stage of it.
if [ "$*" = "--version" ]; then
  echo '2.1.330 (Claude Code)'
  exit 0
fi
read -r handshake
read -r prompt
printf 'error: the stand-in of the screenshot run asks no model\n' >&2
exit 1
