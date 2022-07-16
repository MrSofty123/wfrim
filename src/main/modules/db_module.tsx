import { PoolClient } from 'pg';
import database_connection from './database_connection'
import {mainEvent} from '../eventHandler'
import fs from 'fs';
import Os from 'os';
import {config} from './config'

let pool: PoolClient | null = null;
const appFolder = Os.homedir() + '/Documents/WFRIM/'


database_connection().then(res => pool=(res as PoolClient)).catch(err => emitError('Database connection failure', err))

var pushRelicDBTimer:ReturnType<typeof setTimeout>;
pushRelicDBTimer = setTimeout(pushRelicDB, 300000);

fs.watchFile(appFolder + 'relicsDB.json', (curr, prev) => {
    clearTimeout(pushRelicDBTimer)
    pushRelicDBTimer = setTimeout(pushRelicDB, 300000);
})

function pushRelicDB() {
    if (!pool) {
        setTimeout(pushRelicDB, 1000);
        console.log('db not ready yet')
        return;
    } 
    (pool as PoolClient).connect((err: any, client:PoolClient, release:any) => {
        if (err) {
            emitError('Error database connection', err.stack)
            setTimeout(pushRelicDB, 1000);
            release()
        } else {
            client.query(`DO $$ BEGIN
                            IF NOT EXISTS (SELECT * FROM wfrim_db WHERE device_id = '${(config as any).device_id}') THEN
                                INSERT INTO wfrim_db (device_id) VALUES ('${(config as any).device_id}');
                            END IF;
                        END $$;`, (err, res) => {
                if (err) {
                    emitError('DB Query Error', err.stack)
                    release()
                    return release();
                }
                var relic_db = ''
                var runs_log = {
                    mission_initialize: [] as Array<any>,
                    trades: [] as Array<any>
                }
                try {
                    relic_db = fs.readFileSync(appFolder + 'relicsDB.json','utf-8').replace(/^\uFEFF/, '')
                    const filenames = fs.readdirSync(appFolder + 'logs');
                    filenames.forEach(file => {
                        const filecontent = JSON.parse(fs.readFileSync(appFolder + 'logs/' + file,'utf-8').replace(/^\uFEFF/, ''));
                        filecontent.mission_initialize.forEach((mission:any) => {
                            runs_log.mission_initialize.push(mission)
                        });
                        filecontent.trades.forEach((trade:any) => {
                            runs_log.trades.push(trade)
                        })
                    });
                } catch (err) {
                    emitError('error pushing db', err)
                    release()
                    return release()
                }
                client.query(`UPDATE wfrim_db SET relics='${relic_db.replace(/'/g,`''`)}', timestamp=${new Date().getTime()}, runs_log='${JSON.stringify(runs_log).replace(/'/g,`''`)}', username='${(config as any).username}' WHERE device_id='${(config as any).device_id}'`, (err,res) => {
                    release()
                    if (err) {
                        emitError('DB Query Error', err.stack)
                        return release();
                    }
                })
            })
        }
    })
}

itemsListFetch()
function itemsListFetch() {
    console.log('itemsListFetch')
    if (!pool) {
        setTimeout(itemsListFetch, 1000);
        console.log('db not ready yet')
        return;
    }
    (pool as PoolClient).connect((err:any, client:PoolClient, release:any) => {
        if (err) {
            emitError('Error database connection', err.stack)
            setTimeout(itemsListFetch, 1000);
            release()
            return
        }
        client.query(`SELECT * from items_list`, (err, res) => {
            release()
            if (err) {
                emitError('DB Query Error', err.stack)
                return;
            }
            const filepath = appFolder + 'items_list.json'
            fs.writeFile( filepath, JSON.stringify(res.rows), (err) => {
                if (err) emitError(`Error writing to file ${filepath}`,err)
            });
            mainEvent.emit('itemsListFetch', res.rows)
        })
    })
}

function emitError(title:string,err:any) {
    mainEvent.emit('error', {title: title, text: typeof err == 'object' ? (err.stack ? JSON.stringify(err.stack):JSON.stringify(err)) : err})
}