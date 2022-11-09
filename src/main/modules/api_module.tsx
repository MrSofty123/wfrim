import {mainEvent} from '../eventHandler'
import fs from 'fs';
import Os from 'os';
import axios from 'axios';

const appFolder = Os.homedir() + '/Documents/WFRIM/'

var pushRelicDBTimer:ReturnType<typeof setTimeout>;
pushRelicDBTimer = setTimeout(pushRelicDB, 300000);

fs.watchFile(appFolder + 'relicsDB.json', (curr, prev) => {
    clearTimeout(pushRelicDBTimer)
    pushRelicDBTimer = setTimeout(pushRelicDB, 300000);
})

function pushRelicDB() {
    return
}

itemsListFetch()
function itemsListFetch() {
    console.log('itemsListFetch')
    axios.get('https://gauss-prime-api.up.railway.app/items/fetch')
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