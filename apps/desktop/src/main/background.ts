// The switch under which the app starts in the background, for a start that
// a test or an agent makes on a machine a person is working at. It imports
// nothing of Electron, so the cases read it without the app.

/**
 * True where the app starts in the background: `OWLERY_BACKGROUND` is `1` in
 * the environment. The app then takes neither the system's focus nor, on
 * macOS, a place in the Dock, and its window opens without the keyboard.
 * Absent, empty or any other value, the app starts as it ships.
 */
export function startsInBackground(env: NodeJS.ProcessEnv): boolean {
  return env.OWLERY_BACKGROUND === "1";
}
