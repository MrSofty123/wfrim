import {mainEvent} from '../eventHandler'
import fs from 'fs';
import axios from 'axios';
import { config } from './config';
import { appFolder } from '../directories';

var pushRelicDBTimer:ReturnType<typeof setTimeout>;
pushRelicDBTimer = setTimeout(pushRelicDB, 10000);

fs.watchFile(appFolder + 'relicsDB.json', (curr, prev) => {
    clearTimeout(pushRelicDBTimer)
    pushRelicDBTimer = setTimeout(pushRelicDB, 10000);
})

function pushRelicDB() {
    console.log('pushRelicDB called')
    if (!config.username) return
    var relicsDB = JSON.parse(fs.readFileSync(appFolder + 'relicsDB.json').toString())
    axios.post('https://gauss-prime-api.up.railway.app/api/wfrim/uploadrelicsdb',{username: config.username, data: relicsDB}).then(console.log).catch(console.error)
}

itemsListFetch()
function itemsListFetch() {
    console.log('itemsListFetch')
    axios.get('https://gauss-prime-api.up.railway.app/api/database/items/fetch', {maxContentLength: Infinity, maxBodyLength: Infinity})
    .then((res) => {
        const data = res.data
        console.log('itemsListFetch received api response')
        const filepath = appFolder + 'items_list.json'
        fs.writeFile( filepath, JSON.stringify(data), (err) => {
            if (err) emitError(`Error writing to file ${filepath}`,err)
        });
        mainEvent.emit('itemsListFetch', data)
    }).catch(console.error)
}

function emitError(title:string,err:any) {
    mainEvent.emit('error', {title: title, text: typeof err == 'object' ? (err.stack ? JSON.stringify(err.stack):JSON.stringify(err)) : err})
}