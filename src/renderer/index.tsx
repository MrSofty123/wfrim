import { createRoot } from 'react-dom/client';
import App from './App';
import {event} from './eventHandler'

const container = document.getElementById('root')!;
const root = createRoot(container);
root.render(<App />);

// calling IPC exposed from preload script
window.electron.ipcRenderer.once('ipc-example', (arg) => {
  // eslint-disable-next-line no-console
  console.log(arg);
  //event.emit('relicDBFetch', [{name: 'axi_t2', quantity: 999}])
});
window.electron.ipcRenderer.myPing();

window.electron.ipcRenderer.once('getRelicDB', (arg) => {
  // eslint-disable-next-line no-console
  console.log('Render response: getRelicDB')
  if (arg.success)
    event.emit('relicDBFetch', JSON.parse(arg.data))
});
window.electron.ipcRenderer.requestMain('getRelicDB', []);

/*
window.electron.ipcRenderer.send('request-mainprocess-action', {request: 'getRelicDB'});
window.electron.ipcRenderer.receive('mainprocess-response', (args:any) => {
    console.log('Renderer response: getRelicDB, ' + args.success)
    if (args.success)
      event.emit('relicDBFetch', JSON.parse(args.data))
});
*/