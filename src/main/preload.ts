import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// White-listed channels.
const ipc = {
  'render': {
      // From render to main.
      'send':<string[]> ['request-mainprocess-action'],
      // From main to render.
      'receive':<string[]> ['mainprocess-response'],
      // From render to main and back again.
      'sendReceive':<string[]> []
  }
};

contextBridge.exposeInMainWorld('electron', {
  ipcRenderer: {
    myPing() {
      ipcRenderer.send('ipc-example', 'ping');
    },
    requestMain(channel: string, args: object) {
      ipcRenderer.send(channel, args);
    },
    on(channel: string, func: (...args: object[]) => void) {
      const validChannels = ['ipc-example','getRelicDB','getItemsList'];
      if (validChannels.includes(channel)) {
        const subscription = (_event: IpcRendererEvent, ...args: object[]) =>
          func(...args);
        // Deliberately strip event as it includes `sender`
        ipcRenderer.on(channel, subscription);

        return () => ipcRenderer.removeListener(channel, subscription);
      }

      return undefined;
    },
    once(channel: string, func: (...args: unknown[]) => void) {
      const validChannels = ['ipc-example','getRelicDB','getItemsList'];
      if (validChannels.includes(channel)) {
        // Deliberately strip event as it includes `sender`
        ipcRenderer.once(channel, (_event, ...args) => func(...args));
      }
    },
    /*
    // From render to main.
    send: (channel: string, args: object) => {
      let validChannels = ipc.render.send;
      if (validChannels.includes(channel)) {
          ipcRenderer.send(channel, args);
      }
    },
    // From main to render.
    receive: (channel: string, listener:any) => {
        let validChannels = ipc.render.receive;
        if (validChannels.includes(channel)) {
  
            // Show me the prototype (use DevTools in the render thread)
            console.log(ipcRenderer);
  
            // Deliberately strip event as it includes `sender`.
            ipcRenderer.on(channel, (event, ...args) => listener(...args));
        }
    },
    // From render to main and back again.
    invoke: (channel: string, args: object) => {
        let validChannels = ipc.render.sendReceive;
        if (validChannels.includes(channel)) {
            return ipcRenderer.invoke(channel, args);
        }
    }
    */
  },
});