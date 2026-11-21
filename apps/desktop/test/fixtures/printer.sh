#!/bin/sh
# The pane's process in the memory measurement. The measurement starts the app
# with SHELL set to this file, so a shell pane runs it in place of a shell: it
# prints about 300 lines a second of text with colour escapes until its
# terminal is gone: 33 lines, then a sleep of a tenth of a second, which took
# 111 ms a round where it was measured.

# The daemon also runs $SHELL with no terminal, to look for `claude`.
[ -t 0 ] || exit 0
n=0
while :; do
  i=0
  while [ "$i" -lt 33 ]; do
    n=$((n + 1))
    c=$((n % 7 + 1))
    # A line that cannot be written has no terminal left to go to.
    printf '\033[3%dm%08d\033[0m the quick brown fox jumps over the lazy dog \033[1;4%dmowlery\033[0m\n' "$c" "$n" "$c" || exit 0
    i=$((i + 1))
  done
  sleep 0.1
done
