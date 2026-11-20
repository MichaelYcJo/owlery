// The application menu. It imports nothing of Electron, so the cases read
// the template without the app, and the main process builds the menu from it.

/** One entry of the menu, in the fields of Electron's menu template this menu uses. */
export interface MenuEntry {
  label?: string;
  role?: string;
  accelerator?: string;
  type?: "separator";
  submenu?: MenuEntry[];
}

const SEPARATOR: MenuEntry = { type: "separator" };

// The role closes the window, and brings Command+W with it where the entry names no key of its own. The window reads that key in its page, to close the pane in front.
const CLOSE_WINDOW: MenuEntry = { label: "Close Window", role: "close", accelerator: "Shift+CommandOrControl+W" };

/**
 * The application menu's template for a platform. No entry is bound to a key
 * the window reads in its page with the Command key (src/renderer/view.ts,
 * `commandKey`): a menu takes its key before the page sees it, so an entry
 * on such a key would end what the page does with it.
 *
 * On macOS it is the menu Electron gives an app that sets none, with two
 * differences: the app's menu says "Owlery" where Electron would write the
 * package's name, and "Close Window" is on Shift+Command+W. Another platform
 * has no app menu, so "Quit" stands under "File". Its "Window" menu is
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
          SEPARATOR,
          { role: "services" },
          SEPARATOR,
          { label: "Hide Owlery", role: "hide" },
          { role: "hideOthers" },
          { role: "unhide" },
          SEPARATOR,
          { label: "Quit Owlery", role: "quit" },
        ],
      },
      { label: "File", submenu: [CLOSE_WINDOW] },
      { role: "editMenu" },
      { role: "viewMenu" },
      { role: "windowMenu" },
    ];
  }
  return [{ label: "File", submenu: [CLOSE_WINDOW, SEPARATOR, { role: "quit" }] }, { role: "editMenu" }, { role: "viewMenu" }, { label: "Window", submenu: [{ role: "minimize" }, { role: "zoom" }] }];
}
