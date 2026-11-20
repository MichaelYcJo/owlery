// What the main process does when the window asks to come forward, after a
// person's click on a notification. The window and the call that makes the
// app the active one are passed in, so the cases run without Electron's.

/** What the function calls of the window that asked. */
export interface ForwardWindow {
  isMinimized(): boolean;
  restore(): void;
  show(): void;
  focus(): void;
}

/**
 * Brings the window that asked in front of the person, and answers whether it
 * did: the window is restored where it is minimized, shown and given the
 * focus, and `activate` makes the app the active one. In an app started in
 * the background nothing is brought forward, so a start a test or an agent
 * makes takes neither the system's focus nor the person's keyboard, and
 * nothing is where the window that asked is gone.
 */
export function comeForward(win: ForwardWindow | null, background: boolean, activate: () => void): boolean {
  if (background || !win) return false;
  if (win.isMinimized()) win.restore();
  win.show();
  win.focus();
  activate();
  return true;
}
