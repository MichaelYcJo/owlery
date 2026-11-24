#!/bin/sh
# The pane's process in the screenshot run. The run starts the app with SHELL
# set to this file, so a pane runs it in place of a shell and in place of
# `claude`: it prints a few lines in the terminal's own colours, for a
# screenshot to show them, and then waits. The lines are invented examples.

# The daemon also runs $SHELL with no terminal, to look for `claude` and for
# the PATH a broad gate and `gh` run with, and is told of the stand-in beside
# this file and of a PATH whose first folder holds the stand-in for `gh`
# (sample-gh/gh), so no CLI of the person's is run and nothing reaches
# GitHub. No chain runs in the screenshot run: the daemon calls `gh` to read
# the pull request the run stored for one work item.
if [ ! -t 0 ]; then
  printf '\n__owlery_cli=%s\n__owlery_path=%s\n__owlery_config=%s\n' "${0%/*}/sample-cli.sh" "${0%/*}/sample-gh:/usr/bin:/bin" "${CLAUDE_CONFIG_DIR:-}"
  exit 0
fi
# A setup pane runs `$SHELL -l -i -c <the command .worktreesetup holds>`, and
# a Claude Code pane `$SHELL -l -i -c 'exec claude …'`. The setup's command
# never runs: the pane prints it and a few lines of an install, and then
# waits for the run to type the code the command ends with, on a line.
if [ "$3" = -c ] && [ "${4#exec claude }" = "$4" ]; then
  # Without the line ends the file's command ends with.
  printf '$ %s\r\n' "$(printf '%s' "$4")"
  printf 'Lockfile is up to date, resolution step is skipped\r\n'
  printf 'Progress: resolved \033[1m412\033[0m, reused \033[1m412\033[0m, downloaded 0, added 412\r\n'
  stty -echo
  read -r code
  [ "$code" = 0 ] || printf '\033[31m ERR_PNPM_LIFECYCLE\033[0m  The postinstall script of a dependency exited with 1\r\n'
  exit "$code"
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
