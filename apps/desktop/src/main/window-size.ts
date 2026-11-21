// The size the app makes its window at, which is the size the screens are
// drawn for. The suite's built app lays its page out at this size where the
// system's screen holds the window smaller (test/built-app.ts, `atWindowSize`).

/** The window's width and height, in the points of the screen. */
export const WINDOW_SIZE = { width: 1440, height: 900 } as const;
