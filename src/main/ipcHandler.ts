
import { ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import Os from 'os'
import { mainEvent } from './eventHandler';
import './modules/db_module'

const appFolder = Os.homedir() + '/Documents/WFRIM/'
//preprocessor()
var relicsDB_ignoreWatch = false
const relicsDBWatcher = fs.watch(appFolder + 'relicsDB.json',(event,filename) => {
    if (event == 'change') {
        console.log('file changed: ' + appFolder + 'relicsDB.json')
        handleChangerelicsDB()
    }
})
fs.readFile(appFolder + 'relicsDB.json','utf8',(err,data) => {
    if (err) emitError(`Error reading file ${appFolder + 'relicsDB.json'}`,err.stack? err.stack:err)
    else {
        try {
            data = JSON.parse(data.replace(/^\uFEFF/, ''))
        } catch (err:any) {
            emitError(`Error parsing data ${appFolder + 'relicsDB.json'}`,err.stack? err.stack:err)
            return;
        }
        mainEvent.emit('relicDBFetch', data)
    }
})
mainEvent.on('closeFileWatchers', () => {
    console.log('Closing file watcher: relicsDBWatcher')
    relicsDBWatcher.close()
})
function handleChangerelicsDB() {
    console.log(relicsDB_ignoreWatch)
    if (relicsDB_ignoreWatch) return
    fs.readFile(appFolder + 'relicsDB.json','utf8',(err,data) => {
        if (err) emitError(`Error reading file ${filepath}`,err)
        else {
            console.log('Emitting: relicDBFetch')
            mainEvent.emit('relicDBFetch', JSON.parse(data.replace(/^\uFEFF/, '')))
        }
    })
    console.log('Emitting: pushRelicDB')
    mainEvent.emit('pushRelicDB', [])
}


ipcMain.on('postRelicDB', (event,arg) => {
    console.log('Main request: postRelicDB')
    updateRelicDB(arg)
})
var to_ignoreWatch:ReturnType<typeof setTimeout>;
function updateRelicDB(relicDB:Array<object>) {
    relicsDB_ignoreWatch = true
    clearTimeout(to_ignoreWatch)
    to_ignoreWatch = setTimeout(() => {relicsDB_ignoreWatch = false;console.log('set relicsDB_ignoreWatch = ' + relicsDB_ignoreWatch);handleChangerelicsDB()}, 10000);
    const filepath = appFolder + 'relicsDB.json'
    fs.writeFile(filepath,JSON.stringify(relicDB), (err) => {
        if (err) emitError(`Error saving changes ${filepath}`,err)
    })
}

ipcMain.on('ipc-example', async (event, arg) => {
    const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
    console.log(msgTemplate(arg));
    event.reply('ipc-example', msgTemplate('pong'));
});



function emitError(title:string,err:any) {
    mainEvent.emit('error', {title: title, text: JSON.stringify(err)})
}

//var items_list:Array<object> = []

/*
mainEvent.on('fetchItemsList', (arg) => {
    items_list = arg
})

ipcMain.on('getItemsList', (event,arg) => {
    console.log('Main request: getItemsList')
    event.reply('getItemsList', items_list);
})
*/

export {
}