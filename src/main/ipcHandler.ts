
import { ipcMain } from 'electron';
import fs from 'fs';
import { mainEvent } from './eventHandler';
import './modules/api_module'
import { appFolder } from './directories';

/*******************timerVars********************/
var relicsDBTimer:ReturnType<typeof setTimeout>;
relicsDBTimer = setTimeout(relicsDBReader, 500)
/************************************************/
const relicsDBWatcher = fs.watch(appFolder + 'relicsDB.json',(event,filename) => {
    if (event == 'change') {
        console.log('file changed: ' + appFolder + 'relicsDB.json')
        clearTimeout(relicsDBTimer)
        relicsDBTimer = setTimeout(relicsDBReader, 1000)
    }
})
mainEvent.on('closeFileWatchers', () => {
    console.log('Closing file watcher: relicsDBWatcher')
    relicsDBWatcher.close()
})

ipcMain.on('postRelicDB', (event,arg) => {
    console.log('Main request: postRelicDB')
    updateRelicDB(arg)
})

ipcMain.on('toggleStartUp', (event,arg) => {
    console.log('Main request: toggleStartUp')
    mainEvent.emit('toggleStartUp', arg)
})

ipcMain.on('statisticsDateUpdate', (event,arg) => {
    console.log('Main request: statisticsDateUpdate')
    mainEvent.emit('statisticsDateUpdate', arg)
})

ipcMain.on('ipc-example', async (event, arg) => {
    const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
    console.log(msgTemplate(arg));
    event.reply('ipc-example', msgTemplate('pong'));
});

function emitError(title:string,err:any) {
    mainEvent.emit('error', {title: title, text: JSON.stringify(err)})
}

function relicsDBReader() {
    fs.readFile(appFolder + 'relicsDB.json','utf8',(err,data) => {
        if (err) emitError(`Error reading file ${appFolder + 'relicsDB.json'}`,err.stack? err.stack:err)
        else {
            console.log('Main emitting: relicDBFetch')
            mainEvent.emit('relicDBFetch', JSON.parse(data.replace(/^\uFEFF/, '')))
        }
    })
}
function updateRelicDB(relicDB:Array<object>) {
    const filepath = appFolder + 'relicsDB.json'
    fs.writeFile(filepath,JSON.stringify(relicDB), (err) => {
        if (err) emitError(`Error saving changes ${filepath}`,err)
    })
}

export {
}