import { describe, expect, it } from "vitest";
import { type MenuEntry, menuTemplate } from "../src/main/menu";

/** Every entry of a template, with the labels of the menus above it. */
function entries(template: readonly MenuEntry[], above: readonly string[] = []): { path: string[]; entry: MenuEntry }[] {
  return template.flatMap((entry) => [{ path: [...above, entry.label ?? entry.role ?? ""], entry }, ...entries(entry.submenu ?? [], [...above, entry.label ?? entry.role ?? ""])]);
}

/** The entries under one menu of the bar. */
function under(template: readonly MenuEntry[], menu: string): MenuEntry[] {
  return template.find((entry) => entry.label === menu)?.submenu ?? [];
}

// The roles that may bring the Command or Control key with W where the entry names no accelerator of its own: a window's close, the "File" menu Electron fills, which holds that close on macOS, and the "Window" menu it fills, which no case has read outside macOS.
const BRING_W = ["close", "fileMenu", "windowMenu"];

describe("menuTemplate", () => {
  it("names the app in the app's menu on macOS, where the app's package name would stand otherwise", () => {
    const labels = (under(menuTemplate("darwin"), "Owlery") as MenuEntry[]).map((entry) => entry.label ?? entry.role ?? entry.type);
    expect(labels).toEqual(["About Owlery", "separator", "Accounts…", "separator", "services", "separator", "Hide Owlery", "hideOthers", "unhide", "separator", "Restart Daemon…", "separator", "Quit Owlery Completely…", "Quit Owlery"]);
  });

  it('closes the window on Shift+Command+W, from "File"', () => {
    expect(under(menuTemplate("darwin"), "File")).toEqual([{ label: "Close Window", role: "close", accelerator: "Shift+CommandOrControl+W" }]);
  });

  it('holds "Quit" under "File" on a platform that has no app menu, and no app menu there', () => {
    const template = menuTemplate("linux");
    expect(template.map((entry) => entry.label ?? entry.role)).toEqual(["File", "editMenu", "viewMenu", "Window"]);
    expect(under(template, "File")).toEqual([
      { label: "Close Window", role: "close", accelerator: "Shift+CommandOrControl+W" },
      { type: "separator" },
      { id: "accounts", label: "Accounts…" },
      { type: "separator" },
      { id: "restart-daemon", label: "Restart Daemon…" },
      { type: "separator" },
      { id: "quit-completely", label: "Quit Owlery Completely…" },
      { role: "quit" },
    ]);
  });

  it.each(["darwin", "linux", "win32"] as const)("gives the entry that opens the Accounts dialog and the two entries that end the daemon an id each on %s, by which the main process gives each its click, and neither a role nor a key", (platform) => {
    const ending = entries(menuTemplate(platform))
      .map(({ entry }) => entry)
      .filter((entry) => entry.id !== undefined);
    expect(ending).toEqual([
      { id: "accounts", label: "Accounts…" },
      { id: "restart-daemon", label: "Restart Daemon…" },
      { id: "quit-completely", label: "Quit Owlery Completely…" },
    ]);
  });

  it.each(["darwin", "linux", "win32"] as const)("names no role on %s that brings the key of a window's close with it", (platform) => {
    const bringing = entries(menuTemplate(platform)).filter(({ entry }) => entry.role !== undefined && BRING_W.includes(entry.role) && entry.accelerator === undefined);
    // On macOS the built menu is read by a case of test/terminal-basics.test.ts, which finds no close in the "Window" menu Electron fills. No case builds the menu on another platform, so none of these roles stands there.
    expect(bringing.map(({ entry }) => entry.role)).toEqual(platform === "darwin" ? ["windowMenu"] : []);
  });
});
