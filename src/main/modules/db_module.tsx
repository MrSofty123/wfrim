import { PoolClient } from 'pg';
import database_connection from './database_connection'
import {mainEvent} from '../eventHandler'
import fs from 'fs';
import Os from 'os'

interface Iconfig {
    device_id: string
}
var config: Iconfig | null = null
let pool: PoolClient | null = null;
const appFolder = Os.homedir() + '/Documents/WFRIM/'


database_connection().then(res => pool=(res as PoolClient)).catch(err => emitError('Database connection failure', err))

setInterval(pushRelicDB, 180000);
setImmediate(pushRelicDB)

function pushRelicDB() {
    console.log('pushRelicDB')
    if (!pool) {
        setTimeout(pushRelicDB, 1000);
        console.log('db not ready yet')
        return;
    } 
    const filepath = appFolder + 'config.json'
    fs.readFile(filepath,'utf8',(err,data) => {
        if (err) emitError(`Error reading file ${filepath}`,err)
        config = JSON.parse(data)
    })
    if (!config) {
        setTimeout(pushRelicDB, 1000);
        console.log('config var not set')
        return;
    }
    (pool as PoolClient).connect((err:any, client:PoolClient, release:any) => {
        if (err) {
            emitError('Error database connection', err)
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
                        emitError('Error database backup', err)
                        return;
                    }
                })
            })
        })
    })
}

function emitError(title:string,err:any) {
    mainEvent.emit('error', {title: title, text: JSON.stringify(err)})
}