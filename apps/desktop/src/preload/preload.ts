import { contextBridge, ipcRenderer } from "electron";
import { Channel, type TerminalApi } from "../shared/ipc";

const api: TerminalApi = {
  start: (cols, rows) => ipcRenderer.invoke(Channel.start, cols, rows),
  input: (id, data) => ipcRenderer.send(Channel.input, id, data),
  resize: (id, cols, rows) => ipcRenderer.send(Channel.resize, id, cols, rows),
  onData: (listener) => {
    ipcRenderer.on(Channel.data, (_event, id: number, data: string) => listener(id, data));
  },
  onExit: (listener) => {
    ipcRenderer.on(Channel.exit, (_event, id: number, exitCode: number) => listener(id, exitCode));
  },
};

contextBridge.exposeInMainWorld("owlery", { terminal: api });
