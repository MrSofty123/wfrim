
import { ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import Os from 'os'
import { mainEvent } from './eventHandler';

const appFolder = Os.homedir() + '/Documents/WFRIM/'
  
ipcMain.on('postRelicDB', (event,arg) => {
    console.log('Main request: postRelicDB')
    updateRelicDB(arg)
})

function updateRelicDB(relicDB:Array<object>) {
    const filepath = appFolder + 'relicsDB.json'
    fs.writeFile(filepath,JSON.stringify(relicDB), (err) => {
        if (err) emitError(err)
    })
}

ipcMain.on('ipc-example', async (event, arg) => {
    const msgTemplate = (pingPong: string) => `IPC test: ${pingPong}`;
    console.log(msgTemplate(arg));
    event.reply('ipc-example', msgTemplate('pong'));
  });

ipcMain.on('getRelicDB', (event,arg) => {
    console.log('Main request: getRelicDB')

    //fs.readFile(getAssetPath('data/relicDB.json'),'utf8',(err,data) => {
    const filepath = appFolder + 'relicsDB.json'
    fs.open(filepath,'r',function(err, f) {
        if (err) {
            ensureDirectoryExistence(filepath)
            fs.writeFile( filepath, "[]", (err) => {
                if (err) console.error(err)
            });
            event.reply('getRelicDB', {data: "[]", success:true});
        } else {
            fs.readFile(filepath,'utf8',(err,data) => {
                if (err) console.log(err)
                event.reply('getRelicDB', err ? {data: err, success:false}:{data: data.replace(/^\uFEFF/, ''), success:true});
            })
        }
    });
})


function ensureDirectoryExistence(filePath:string) {
    var dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        ensureDirectoryExistence(dirname);
        fs.mkdirSync(dirname);
    }
}

function emitError(err:any) {
    mainEvent.emit('error', err)
}

export {
}