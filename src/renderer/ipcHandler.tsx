
import {event} from './eventHandler'
var mainReady = 0

// calling IPC exposed from preload script
window.electron.ipcRenderer.sendMain('rendererReady', []);
window.electron.ipcRenderer.on('mainReady', (arg) => mainReady = 1)
//-----

window.electron.ipcRenderer.on('relicDBFetch', (data) => {
    //console.log(JSON.stringify(data))
    event.emit('relicDBFetch', data)
});

event.on('postRelicDB', (arg) => {
    window.electron.ipcRenderer.sendMain('postRelicDB', arg);
})

window.electron.ipcRenderer.on('itemsListFetch', (arg) => {
    //console.log(JSON.stringify(arg))
    event.emit('itemsListFetch', arg)
});

window.electron.ipcRenderer.once('error', (arg) => {
    console.log('Render response: error')
    if (arg.data)
        event.emit('error', JSON.parse(arg.data))
});