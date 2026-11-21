#!/bin/sh
# The pane's process in the Korean input case. The case starts the app with
# SHELL set to this file, so a shell pane runs it in place of a shell: it
# writes every byte its terminal hands it to the file OWLERY_RECEIVER_FILE
# names, and its process id beside that file, for the case to read it gone.

# The daemon also runs $SHELL with no terminal, to look for `claude`.
[ -t 0 ] || exit 0
: "${OWLERY_RECEIVER_FILE:?}"
# Raw and without echo: no byte is changed, held back or answered.
stty raw -echo
echo "$$" > "$OWLERY_RECEIVER_FILE.pid"
exec cat > "$OWLERY_RECEIVER_FILE"
