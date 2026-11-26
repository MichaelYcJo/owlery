#!/bin/sh
# The stand-in for the `claude` CLI in the screenshot run, which
# sample-pane.sh names to the daemon. It asks no model anything: it prints a
# version where it is asked for one. The adapter writes its handshake and
# then the prompt, and the stand-in fails every prompt at once. The
# screenshot run and the Machine dialog's case each resume one chain, whose
# first stage waits for the machine and never starts, so the stand-in
# answers no stage of it.
#
# It also answers the CLI's own `auth` commands for the folder
# CLAUDE_CONFIG_DIR names, and keeps a login there as one file, so "Add an
# account" in the run opens no browser and reads no login of the person's.
# `auth login` waits while `sample-cli.hold-login` stands in the daemon's run
# folder, the one that holds the folder the daemon made, as a sign-in waits
# on the browser, so the run captures the sign-in pane while the login runs.
# It then signs the folder in. `auth status` prints JSON and exits 0 where
# the folder is signed in, naming the login by an invented email and giving
# its end 30 days on, and exits 1 where it is not. `auth logout` signs the
# folder out.
if [ "$*" = "--version" ]; then
  echo '2.1.330 (Claude Code)'
  exit 0
fi
if [ "$1" = auth ]; then
  [ -n "${CLAUDE_CONFIG_DIR:-}" ] || exit 64
  login="$CLAUDE_CONFIG_DIR/.sample-login"
  case "$2" in
    login)
      while [ -e "${CLAUDE_CONFIG_DIR%/accounts/*}/sample-cli.hold-login" ]; do sleep 0.1; done
      : > "$login"
      echo "Login successful."
      ;;
    status)
      if [ -e "$login" ]; then
        ends=$(date -u -v+30d +%Y-%m-%dT%H:%M:%S.000Z 2>/dev/null || date -u -d '+30 days' +%Y-%m-%dT%H:%M:%S.000Z)
        printf '{"loggedIn":true,"authMethod":"claude.ai","email":"dana@example.com","configDirectory":"%s","loginExpiresAt":"%s"}\n' "$CLAUDE_CONFIG_DIR" "$ends"
      else
        printf '{"loggedIn":false,"authMethod":"none","configDirectory":"%s","loginExpiresAt":null}\n' "$CLAUDE_CONFIG_DIR"
        exit 1
      fi
      ;;
    logout)
      rm -f "$login"
      echo "Successfully logged out."
      ;;
    *) exit 64 ;;
  esac
  exit 0
fi
read -r handshake
read -r prompt
printf 'error: the stand-in of the screenshot run asks no model\n' >&2
exit 1
