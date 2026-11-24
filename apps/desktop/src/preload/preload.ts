import { contextBridge, ipcRenderer, webUtils } from "electron";
import { appearanceFor, lookChoice } from "../shared/appearance";
import { Channel, type OwleryApi } from "../shared/ipc";

// The saved choice is read before the page exists, and its theme and its
// appearance put on the page's root as soon as the parser makes it, so no
// element is ever drawn in another. The page's own module changes them
// afterwards (src/renderer/theme.ts).
const appearance = lookChoice(ipcRenderer.sendSync(Channel.appearance));

function showTheme(): boolean {
  const root = document.documentElement;
  if (!root) return false;
  root.dataset.theme = appearance.theme;
  root.dataset.appearance = appearanceFor(appearance.appearance, window.matchMedia("(prefers-color-scheme: dark)").matches);
  return true;
}
if (!showTheme()) {
  new MutationObserver((_records, observer) => {
    if (showTheme()) observer.disconnect();
  }).observe(document, { childList: true });
}

const api: OwleryApi = {
  daemon: () => ipcRenderer.invoke(Channel.daemon),
  pickFolder: () => ipcRenderer.invoke(Channel.pickFolder),
  appearance,
  saveAppearance: (choice) => ipcRenderer.invoke(Channel.saveAppearance, choice),
  installedApps: () => ipcRenderer.invoke(Channel.installedApps),
  openFolder: (folder, app) => ipcRenderer.invoke(Channel.openFolder, folder, app),
  trashFolder: (folder) => ipcRenderer.invoke(Channel.trashFolder, folder),
  openLink: (url) => ipcRenderer.invoke(Channel.openLink, url),
  pathsOf: (worktree, texts) => ipcRenderer.invoke(Channel.pathsOf, worktree, texts),
  showInFinder: (path) => ipcRenderer.invoke(Channel.showInFinder, path),
  copyText: (text) => ipcRenderer.invoke(Channel.copyText, text),
  clipboardText: () => ipcRenderer.invoke(Channel.clipboardText),
  pathOf: (file) => webUtils.getPathForFile(file),
  comeForward: () => ipcRenderer.invoke(Channel.comeForward),
  endDaemon: (then) => ipcRenderer.invoke(Channel.endDaemon, then),
  onDaemonMenu: (listener) => {
    ipcRenderer.on(Channel.daemonMenu, (_event, chosen: unknown) => {
      if (chosen === "restart" || chosen === "quit") listener(chosen);
    });
  },
  onAccountsMenu: (listener) => {
    ipcRenderer.on(Channel.accountsMenu, () => listener());
  },
};

contextBridge.exposeInMainWorld("owlery", api);
