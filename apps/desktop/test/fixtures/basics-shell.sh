#!/bin/sh
# The pane's process in the terminal basics cases. The cases start the app
# with SHELL set to this file, so every pane runs it in place of a shell.
#
# A shell pane writes every byte its terminal hands it to a file of its own,
# and its process id beside that file, for a case to read it gone: the file
# is the one OWLERY_RECEIVER_FILE names with the pane's number after it.
# Before that it asks its terminal for pastes in brackets, as a program
# with a prompt of its own does, so a case tells a paste from typed keys.
# It prints two links for the cases that click one: an address as plain
# text on its first row, and on its second row a name that carries another
# address (the OSC 8 sequence). Under them it prints the lines of the file
# OWLERY_BASICS_LINES names, each on a row of its own, where that file is
# there: a case writes into it the paths it will point at, before it opens
# the pane.
#
# A Claude Code pane has the shell replace itself with `claude`. The folder
# beside this file holds a stand-in of that name, and it is put first on the
# PATH here, so the `claude` of the person at the machine never starts.

# The daemon also runs $SHELL with no terminal, to look for `claude`.
[ -t 0 ] || exit 0
: "${OWLERY_RECEIVER_FILE:?}" "${OWLERY_PANE_ID:?}"
if [ "$3" = "-c" ]; then
  [ -x "${0%/*}/claude-stand-in/claude" ] || exit 1
  PATH="${0%/*}/claude-stand-in:$PATH"
  export PATH
  eval "$4"
  exit
fi
# Raw and without echo: no byte is changed, held back or answered.
stty raw -echo
printf '\033[?2004hhttps://example.com/owlery-basics\r\n\033]8;;https://example.com/owlery-named\033\\a named link\033]8;;\033\\\r\n'
if [ -f "${OWLERY_BASICS_LINES:-}" ]; then
  while IFS= read -r line; do printf '%s\r\n' "$line"; done < "$OWLERY_BASICS_LINES"
fi
echo "$$" > "$OWLERY_RECEIVER_FILE-$OWLERY_PANE_ID.pid"
exec cat > "$OWLERY_RECEIVER_FILE-$OWLERY_PANE_ID"
