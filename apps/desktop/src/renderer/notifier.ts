// Who raises the page's notifications for this start of the app. It imports
// nothing of the browser, and the system's notification is passed in, so the
// cases read it without the app and never raise one over the screen of the
// person at the machine.

/** What the page sets a click's handler on: the system's notification, or an entry the page kept. The system's calls its handler with the click's event, which the page's handlers do not read. */
export interface Raised {
  onclick: ((...event: never[]) => unknown) | null;
}

/** A notification the page kept in place of the system's, where the app started in the background. */
export interface Kept extends Raised {
  title: string;
  body: string;
}

/** Raises the page's notifications, and holds the ones it kept. */
export interface Notifier {
  /** Raises a notification with `title` and `body`, and returns what a click's handler is set on. Every notification the page raises goes through it. */
  raise(title: string, body: string): Raised;
  /** The notifications kept in the background, in the order they were raised. Empty in any other start. */
  kept: Kept[];
}

/**
 * The notifier for this start of the app. An app started in the background
 * hands nothing to `system`: it keeps each notification's title and body,
 * with a handler that starts empty, as one entry of `kept`, and returns that
 * entry, so a start a test or an agent makes raises nothing over the screen
 * of the person at the machine, and its cases read what the page would have
 * raised. Any other start hands each notification to `system` and keeps
 * nothing.
 */
export function chooseNotifier(background: boolean, system: (title: string, body: string) => Raised): Notifier {
  const kept: Kept[] = [];
  return {
    raise(title, body) {
      if (!background) return system(title, body);
      const entry: Kept = { title, body, onclick: null };
      kept.push(entry);
      return entry;
    },
    kept,
  };
}
