
import { ipcMain, ipcRenderer } from 'electron';
import path from 'path';
import fs from 'fs';
import Os from 'os'
import { mainEvent } from './eventHandler';
import { randomUUID } from 'crypto';
import './modules/db_module'

const appFolder = Os.homedir() + '/Documents/WFRIM/'
preprocessor()


function preprocessor() {
    ensureDirectoryExistence(appFolder)
    // relicsDB.json
    var filepath = appFolder + 'relicsDB.json'
    fs.open(filepath,'r',function(notexists, f) {
        if (notexists) {
            fs.writeFile( filepath, "[]", (err) => {
                if (err) emitError(`Error creating directory ${filepath}`,err)
            });
        }
    });
    // config.json
    var filepath = appFolder + 'config.json'
    fs.open(filepath,'r',function(notexists, f) {
        if (notexists) {
            var config = {device_id: randomUUID()}
            fs.writeFile( filepath, JSON.stringify(config), (err) => {
                if (err) emitError(`Error creating directory ${filepath}`,err)
            });
        } else {
            //any new changes
        }
    });
    // items_list.json
    var filepath = appFolder + 'items_list.json'
    fs.open(filepath,'r',function(notexists, f) {
        if (notexists) {
            fs.writeFile( filepath, "[]", (err) => {
                if (err) emitError(`Error creating directory ${filepath}`,err)
            });
        }
    });
}

ipcMain.on('postRelicDB', (event,arg) => {
    console.log('Main request: postRelicDB')
    updateRelicDB(arg)
})

function updateRelicDB(relicDB:Array<object>) {
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

ipcMain.on('getRelicDB', (event,arg) => {
    console.log('Main request: getRelicDB')

    const filepath = appFolder + 'relicsDB.json'
    fs.readFile(filepath,'utf8',(err,data) => {
        if (err) emitError(`Error reading file ${filepath}`,err)
        event.reply('getRelicDB', err ? {data: err, success:false}:{data: data.replace(/^\uFEFF/, ''), success:true});
        mainEvent.emit('test', JSON.stringify(data))
    })
})

function ensureDirectoryExistence(filePath:string) {
    var dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        ensureDirectoryExistence(dirname);
        fs.mkdirSync(dirname);
    }
}

function emitError(title:string,err:any) {
    mainEvent.emit('error', {title: title, text: JSON.stringify(err)})
}

var items_list:Array<object> = []

mainEvent.on('fetchItemsList', (arg) => {
    items_list = arg
})

ipcMain.on('getItemsList', (event,arg) => {
    console.log('Main request: getItemsList')
    event.reply('getItemsList', items_list);
})

export {
}