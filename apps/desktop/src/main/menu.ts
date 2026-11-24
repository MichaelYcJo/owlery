// The application menu. It imports nothing of Electron, so the cases read
// the template without the app, and the main process builds the menu from it.

/** One entry of the menu, in the fields of Electron's menu template this menu uses. */
export interface MenuEntry {
  /** The name the main process finds the entry's click by. An entry with a role has none: the role is what its click does. */
  id?: string;
  label?: string;
  role?: string;
  accelerator?: string;
  type?: "separator";
  submenu?: MenuEntry[];
}

const SEPARATOR: MenuEntry = { type: "separator" };

// The role closes the window, which on macOS hides it (./background, `closeHides`), and brings Command+W with it where the entry names no key of its own. The window reads that key in its page, to close the pane in front.
const CLOSE_WINDOW: MenuEntry = { label: "Close Window", role: "close", accelerator: "Shift+CommandOrControl+W" };

/** The id of the entry that opens the window's Accounts dialog. The main process gives it its click (./main), which the window takes. */
export const ACCOUNTS = "accounts";

// The entry has no key, and its label ends in an ellipsis, because it opens a dialog.
const OPEN_ACCOUNTS: MenuEntry[] = [SEPARATOR, { id: ACCOUNTS, label: "Accounts…" }];

/** The ids of the two entries that end the daemon. The main process gives each its click (./main), and the window asks the person first. */
export const RESTART_DAEMON = "restart-daemon";
export const QUIT_COMPLETELY = "quit-completely";

// The two entries stand before the plain quit, which leaves the daemon and its sessions running. Neither has a key. Each label ends in an ellipsis, because a dialog asks before anything ends.
const END_DAEMON: MenuEntry[] = [SEPARATOR, { id: RESTART_DAEMON, label: "Restart Daemon…" }, SEPARATOR, { id: QUIT_COMPLETELY, label: "Quit Owlery Completely…" }];

/**
 * The application menu's template for a platform. No entry is bound to a key
 * the window reads in its page with the Command key (src/renderer/view.ts,
 * `commandKey`): a menu takes its key before the page sees it, so an entry
 * on such a key would end what the page does with it.
 *
 * On macOS it is the menu Electron gives an app that sets none, with four
 * differences: the app's menu says "Owlery" where Electron would write the
 * package's name, it holds "Accounts…" after "About Owlery" and the two
 * entries that end the daemon before its quit, and "Close Window" is on
 * Shift+Command+W. Another platform has no app menu, so "Accounts…", those
 * two entries and "Quit" stand under "File". Its "Window" menu is
 * written out entry by entry: no case runs on such a platform to read which
 * keys the menu Electron fills there would bring.
 */
export function menuTemplate(platform: NodeJS.Platform): MenuEntry[] {
  if (platform === "darwin") {
    return [
      {
        label: "Owlery",
        submenu: [
          { label: "About Owlery", role: "about" },
          ...OPEN_ACCOUNTS,
          SEPARATOR,
          { role: "services" },
          SEPARATOR,
          { label: "Hide Owlery", role: "hide" },
          { role: "hideOthers" },
          { role: "unhide" },
          ...END_DAEMON,
          { label: "Quit Owlery", role: "quit" },
        ],
      },
      { label: "File", submenu: [CLOSE_WINDOW] },
      { role: "editMenu" },
      { role: "viewMenu" },
      { role: "windowMenu" },
    ];
  }
  return [{ label: "File", submenu: [CLOSE_WINDOW, ...OPEN_ACCOUNTS, ...END_DAEMON, { role: "quit" }] }, { role: "editMenu" }, { role: "viewMenu" }, { label: "Window", submenu: [{ role: "minimize" }, { role: "zoom" }] }];
}
