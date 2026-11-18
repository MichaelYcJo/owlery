import { contextBridge, ipcRenderer } from "electron";
import { Channel, type OwleryApi } from "../shared/ipc";

const api: OwleryApi = {
  daemon: () => ipcRenderer.invoke(Channel.daemon),
};

contextBridge.exposeInMainWorld("owlery", api);
