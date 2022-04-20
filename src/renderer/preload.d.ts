declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        myPing(): void;
        requestMain(channel: string, args: any[]): void;
        on(
          channel: string,
          func: (...args: any[]) => void
        ): (() => void) | undefined;
        once(channel: string, func: (...args: any[]) => void): void;
        //send(channel: string, args: object):any;
        //receive(channel: string, args:object):any;
        //invoke(channel: string, args: object):any;
      };
    };
  }
}

export {};
