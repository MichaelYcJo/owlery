import { contextBridge, ipcRenderer } from "electron";
import { themeChoice, themeFor } from "../shared/appearance";
import { Channel, type OwleryApi } from "../shared/ipc";

// The saved choice is read before the page exists, and its theme put on the
// page's root as soon as the parser makes it, so no element is ever drawn in
// another theme. The page's own module changes the theme afterwards
// (src/renderer/theme.ts).
const appearance = themeChoice(ipcRenderer.sendSync(Channel.appearance));

function showTheme(): boolean {
  const root = document.documentElement;
  if (!root) return false;
  root.dataset.theme = themeFor(appearance, window.matchMedia("(prefers-color-scheme: dark)").matches);
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
  copyText: (text) => ipcRenderer.invoke(Channel.copyText, text),
  trashFolder: (folder) => ipcRenderer.invoke(Channel.trashFolder, folder),
  comeForward: () => ipcRenderer.invoke(Channel.comeForward),
};

contextBridge.exposeInMainWorld("owlery", api);
