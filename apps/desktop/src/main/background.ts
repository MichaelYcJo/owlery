// The switch under which the app starts in the background, for a start that
// a test or an agent makes on a machine a person is working at, and what the
// main process decides from it. It imports nothing of Electron, so the cases
// read it without the app.

/**
 * True where the app starts in the background: `OWLERY_BACKGROUND` is `1` in
 * the environment. The app then takes neither the system's focus nor, on
 * macOS, a place in the Dock, and its window opens without the keyboard and
 * lets the system's pointer through (`showInBackground`). Absent, empty or
 * any other value, the app starts as it ships.
 */
export function startsInBackground(env: NodeJS.ProcessEnv): boolean {
  return env.OWLERY_BACKGROUND === "1";
}

/**
 * Shows the window of an app started in the background: it lets the
 * system's pointer through to what is under it, and then shows below the
 * window in front, without the keyboard. The system routes the pointer of
 * the person at the machine to the windows under this one, so none of their
 * clicks lands in it. Their pointer passing over the window then moves no
 * pointer in the page either, and a case's pointer, which the debugging port
 * moves, stays where the case put it (#117). The debugging port's input
 * reaches the page as before.
 */
export function showInBackground(win: { setIgnoreMouseEvents(ignore: boolean): void; showInactive(): void }): void {
  win.setIgnoreMouseEvents(true);
  win.showInactive();
}

/**
 * Reads the switch and takes the variable out of `env`, whatever its value,
 * so that the daemon the app starts, and every pane's process that daemon
 * starts, runs without it.
 */
export function takeBackground(env: NodeJS.ProcessEnv): boolean {
  const background = startsInBackground(env);
  delete env.OWLERY_BACKGROUND;
  return background;
}

/**
 * True where the app quits once its last window closes. On macOS the app
 * stays, as a Mac app does, but in the background it has no Dock icon and no
 * menu bar, so with no window nothing would reach it.
 */
export function quitsWithLastWindow(platform: NodeJS.Platform, background: boolean): boolean {
  return platform !== "darwin" || background;
}

/**
 * True where a close of the window hides it and leaves its page loaded: on
 * macOS, in an app that was not started in the background and is not
 * quitting. The page raises the notifications, so a session that begins to
 * wait while the window is closed still notifies, and a click on the Dock
 * icon or on a notification shows the window again. From Quit on, a close
 * closes, so the app ends. An app started in the background has no Dock
 * icon that would bring a hidden window back, and another platform quits
 * with its last window (`quitsWithLastWindow`), so both close the window.
 */
export function closeHides(platform: NodeJS.Platform, background: boolean, quitting: boolean): boolean {
  return platform === "darwin" && !background && !quitting;
}
