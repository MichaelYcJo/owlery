import { contextBridge, ipcRenderer } from "electron";
import { Channel, type HookNotice, type TerminalApi } from "../shared/ipc";

const api: TerminalApi = {
  start: (kind, cols, rows) => ipcRenderer.invoke(Channel.start, kind, cols, rows),
  input: (id, data) => ipcRenderer.send(Channel.input, id, data),
  resize: (id, cols, rows) => ipcRenderer.send(Channel.resize, id, cols, rows),
  onData: (listener) => {
    ipcRenderer.on(Channel.data, (_event, id: number, data: string) => listener(id, data));
  },
  onExit: (listener) => {
    ipcRenderer.on(Channel.exit, (_event, id: number, exitCode: number) => listener(id, exitCode));
  },
  onHook: (listener) => {
    ipcRenderer.on(Channel.hook, (_event, notice: HookNotice) => listener(notice));
  },
};

contextBridge.exposeInMainWorld("owlery", { terminal: api });
