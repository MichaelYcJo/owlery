#!/bin/sh
# The pane's process in the Korean input case. The case starts the app with
# SHELL set to this file, so a shell pane runs it in place of a shell: it
# writes every byte its terminal hands it to the file OWLERY_RECEIVER_FILE
# names, and its process id beside that file, for the case to read it gone.

# The daemon also runs $SHELL with no terminal, to look for `claude`. It
# finds none, unless OWLERY_RECEIVER_CLI names a stand-in for it, as a case
# that signs an account in does: then the lookup answers with that file, a
# PATH of the system's folders and the config folder CLAUDE_CONFIG_DIR names,
# so no CLI of the person's is run and no folder of theirs is read.
if [ ! -t 0 ]; then
  [ -n "${OWLERY_RECEIVER_CLI:-}" ] && printf '\n__owlery_cli=%s\n__owlery_path=%s\n__owlery_config=%s\n' "$OWLERY_RECEIVER_CLI" "/usr/bin:/bin" "${CLAUDE_CONFIG_DIR:-}"
  exit 0
fi
: "${OWLERY_RECEIVER_FILE:?}"
# Raw and without echo: no byte is changed, held back or answered.
stty raw -echo
echo "$$" > "$OWLERY_RECEIVER_FILE.pid"
exec cat > "$OWLERY_RECEIVER_FILE"
