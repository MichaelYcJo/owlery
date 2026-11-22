#!/bin/sh
# The pane's process in the screenshot run. The run starts the app with SHELL
# set to this file, so a pane runs it in place of a shell and in place of
# `claude`: it prints a few lines in the terminal's own colours, for a
# screenshot to show them, and then waits. The lines are invented examples.

# The daemon also runs $SHELL with no terminal, to look for `claude`, and is
# told of the stand-in beside this file, so no CLI of the person's is run.
if [ ! -t 0 ]; then
  printf '\n__owlery_cli=%s\n__owlery_path=%s\n' "${0%/*}/sample-cli.sh" '/usr/bin:/bin'
  exit 0
fi
printf '$ git status --short\r\n'
printf ' \033[31mM\033[0m src/login.ts\r\n'
printf '\033[31m??\033[0m src/login.test.ts\r\n'
printf '$ pnpm test\r\n'
printf ' \033[32m✓\033[0m login.test.ts \033[2m(4 tests)\033[0m\r\n'
printf ' \033[33m!\033[0m redirect.test.ts \033[2m(1 skipped)\033[0m\r\n'
printf ' \033[1mTest Files\033[0m  \033[32m2 passed\033[0m\r\n'
printf '\033[34m~/project\033[0m $ '
# Without echo, so nothing the terminal answers is drawn after the lines.
stty -echo
exec cat > /dev/null
