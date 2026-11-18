import { contextBridge, ipcRenderer } from "electron";
import { Channel, type OwleryApi } from "../shared/ipc";

const api: OwleryApi = {
  daemon: () => ipcRenderer.invoke(Channel.daemon),
  pickFolder: () => ipcRenderer.invoke(Channel.pickFolder),
};

contextBridge.exposeInMainWorld("owlery", api);
