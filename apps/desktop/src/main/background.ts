// The switch under which the app starts in the background, for a start that
// a test or an agent makes on a machine a person is working at, and what the
// main process decides from it. It imports nothing of Electron, so the cases
// read it without the app.

/**
 * True where the app starts in the background: `OWLERY_BACKGROUND` is `1` in
 * the environment. The app then takes neither the system's focus nor, on
 * macOS, a place in the Dock, and its window opens without the keyboard.
 * Absent, empty or any other value, the app starts as it ships.
 */
export function startsInBackground(env: NodeJS.ProcessEnv): boolean {
  return env.OWLERY_BACKGROUND === "1";
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
