declare global {
  interface Window {
    electron: {
      ipcRenderer: {
        myPing(): void;
        sendMain(channel: string, args: any[]): void;
        on(
          channel: string,
          func: (...args: any[]) => void
        ): (() => void) | undefined;
        once(channel: string, func: (...args: any[]) => void): void;
      };
    };
  }
}

export {};
