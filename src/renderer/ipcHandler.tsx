
import {event} from './eventHandler'
var mainReady = 0

// calling IPC exposed from preload script
window.electron.ipcRenderer.sendMain('rendererReady', []);
window.electron.ipcRenderer.on('mainReady', (arg) => mainReady = 1)
//-----

window.electron.ipcRenderer.on('relicDBFetch', (data) => {
    //console.log(JSON.stringify(data))
    console.log('renderer: relicDBFetch')
    event.emit('relicDBFetch', data)
});

window.electron.ipcRenderer.on('itemsListFetch', (arg) => {
    //console.log(JSON.stringify(arg))
    console.log('renderer: itemsListFetch')
    event.emit('itemsListFetch', arg)
});
window.electron.ipcRenderer.on('configFetch', (arg) => {
    //console.log(JSON.stringify(arg))
    console.log('renderer: configFetch')
    event.emit('configFetch', arg)
});
window.electron.ipcRenderer.on('statisticsFetch', (arg) => {
    //console.log(JSON.stringify(arg))
    console.log('renderer: statisticsFetch')
    event.emit('statisticsFetch', arg)
});

window.electron.ipcRenderer.once('error', (arg) => {
    console.log('Render response: error')
    if (arg.data)
        event.emit('error', JSON.parse(arg.data))
});

event.on('postRelicDB', (data) => {
    window.electron.ipcRenderer.sendMain('postRelicDB', data);
})
event.on('postConfig', (data) => {
    window.electron.ipcRenderer.sendMain('postConfig', data);
})