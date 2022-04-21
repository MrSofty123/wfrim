
import { ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import Os from 'os'
import { mainEvent } from './eventHandler';
import { randomUUID } from 'crypto';
import axios, { Axios } from 'axios';
import database_connection from './modules/database_connection'
import { PoolClient } from 'pg';
interface Iconfig {
    device_id: string
}
var config: Iconfig | null = null
let pool: PoolClient | null = null;

database_connection().then(res => pool=(res as PoolClient)).catch(err => emitError('Database connection failure', err))

const appFolder = Os.homedir() + '/Documents/WFRIM/'
preprocessor()
setTimeout(pushRelicDB, 180000);
setImmediate(pushRelicDB)

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
            config = {device_id: randomUUID()}
            fs.writeFile( filepath, JSON.stringify(config), (err) => {
                if (err) emitError(`Error creating directory ${filepath}`,err)
            });
        } else {
            //any new changes
            const filepath = appFolder + 'config.json'
            fs.readFile(filepath,'utf8',(err,data) => {
                if (err) emitError(`Error reading file ${filepath}`,err)
                config = JSON.parse(data)
            })
        }
    });
}
function pushRelicDB() {
    if (!pool) {
        setTimeout(pushRelicDB, 1000);
        console.log('db not ready yet')
        return;
    } 
    if (!config) {
        setTimeout(pushRelicDB, 1000);
        console.log('config var not set')
        return;
    }
    (pool as PoolClient).connect((err:any, client:PoolClient, release:any) => {
        if (err) {
            emitError('error', err)
        }
        client.query(`DO $$ BEGIN
                        IF NOT EXISTS (SELECT * FROM wfrim_db WHERE device_id = '${(config as Iconfig).device_id}') THEN
                            INSERT INTO wfrim_db (device_id) VALUES ('${(config as Iconfig).device_id}');
                        END IF;
                    END $$;`, (err, res) => {
            if (err) {
                emitError('error', err)
                release()
                return;
            }
            const filepath = appFolder + 'relicsDB.json'
            fs.readFile(filepath,'utf8',(err,data) => {
                if (err) {
                    emitError(`Error reading file ${filepath}`,err)
                    release()
                    return;
                }
                client.query(`UPDATE wfrim_db SET db='${data.replace(/^\uFEFF/, '')}' WHERE device_id='${(config as Iconfig).device_id}'`, (err,res) => {
                    release()
                    if (err) {
                        emitError('error', err)
                        return;
                    }
                })
            })
        })
    })
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

    //fs.readFile(getAssetPath('data/relicDB.json'),'utf8',(err,data) => {
    const filepath = appFolder + 'relicsDB.json'
    fs.readFile(filepath,'utf8',(err,data) => {
        if (err) emitError(`Error reading file ${filepath}`,err)
        event.reply('getRelicDB', err ? {data: err, success:false}:{data: data.replace(/^\uFEFF/, ''), success:true});
        mainEvent.emit('test', JSON.stringify(data))
    })
    /*
    fs.open(filepath,'r',function(notexists, f) {
        if (notexists) {
            ensureDirectoryExistence(filepath)
            fs.writeFile( filepath, "[]", (err) => {
                if (err) emitError(`Error creating directory ${filepath}`,err)
            });
            event.reply('getRelicDB', {data: "[]", success:true});
        } else {
        }
    });
    */
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

export {
}