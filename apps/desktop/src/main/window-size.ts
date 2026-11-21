// The size the app makes its window at, which is the size the screens are
// drawn for. The suite's built app checks that its window's page has this
// size (test/built-app.ts, `BuiltApp.start`).

/** The window's width and height, in the points of the screen. */
export const WINDOW_SIZE = { width: 1440, height: 900 } as const;
