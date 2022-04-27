
import { ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import Os from 'os'
import { mainEvent } from './eventHandler';
import './modules/db_module'

const appFolder = Os.homedir() + '/Documents/WFRIM/'
preprocessor()


function preprocessor() {
    ensureDirectoryExistence(appFolder)
    // relicsDB.json
    var filepath = appFolder + 'relicsDB.json'
    fs.open(filepath,'r',function(notexists, f) {
        if (notexists) {
            var filepath = appFolder + 'relicsDB.json'
            fs.writeFile( filepath, "[]", (err) => {
                if (err) emitError(`Error creating directory ${filepath}`,err)
                else mainEvent.emit('relicDBFetch', [])
            });
        } else {
            var filepath = appFolder + 'relicsDB.json'
            fs.readFile(filepath,'utf8',(err,data) => {
                if (err) emitError(`Error reading file ${filepath}`,err)
                else {
                    try {
                        data = JSON.parse(data)
                    } catch (err) {
                        emitError(`Error parsing data ${filepath}`,err)
                        return;
                    }
                    mainEvent.emit('relicDBFetch', data)
                }
            })
        }
    });
    // items_list.json
    var filepath = appFolder + 'items_list.json'
    fs.open(filepath,'r',function(notexists, f) {
        if (notexists) {
            var filepath = appFolder + 'items_list.json'
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