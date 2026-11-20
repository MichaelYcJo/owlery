#!/bin/sh
# The pane's process in the terminal basics cases. The cases start the app
# with SHELL set to this file, so every pane runs it in place of a shell.
#
# A shell pane writes every byte its terminal hands it to a file of its own,
# and its process id beside that file, for a case to read it gone: the file
# is the one OWLERY_RECEIVER_FILE names with the pane's number after it.
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
echo "$$" > "$OWLERY_RECEIVER_FILE-$OWLERY_PANE_ID.pid"
exec cat > "$OWLERY_RECEIVER_FILE-$OWLERY_PANE_ID"
