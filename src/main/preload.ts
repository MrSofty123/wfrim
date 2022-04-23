import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    myPing() {
      ipcRenderer.send('ipc-example', 'ping');
    },
    sendMain(channel: string, args: object) {
      ipcRenderer.send(channel, args);
    },
    on(channel: string, func: (...args: object[]) => void) {
      //const validChannels = ['ipc-example','getRelicDB','getItemsList','itemsListFetch','rendererReady','mainReady'];
      //if (validChannels.includes(channel)) {
        const subscription = (_event: IpcRendererEvent, ...args: object[]) =>
          func(...args);
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, subscription);

        return () => ipcRenderer.removeListener(channel, subscription);
      //}

      return undefined;
    },
    once(channel: string, func: (...args: unknown[]) => void) {
      //const validChannels = ['ipc-example','getRelicDB','getItemsList','itemsListFetch','rendererReady','mainReady'];
      //if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.once(channel, (_event, ...args) => func(...args));
      //}
    },
  },
});