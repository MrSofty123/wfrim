
import { randomUUID } from 'crypto';
import fs from 'fs';
import Os from 'os'
import { mainEvent } from '../eventHandler';
import { ipcMain } from 'electron';
const appFolder = Os.homedir() + '/Documents/WFRIM/'

interface Iconfig {
    device_id: string,
    showDropsonHover: boolean,
    inv_upths_val: number,
    inv_loths_val: number,
    inv_upths_col: string,
    inv_loths_col: string,
    startUpOnBoot: boolean
}

const config_default:Iconfig = {
    device_id: randomUUID(),
    showDropsonHover: true,
    inv_upths_val: 10,
    inv_loths_val: 0,
    inv_upths_col: '#43e6a2',
    inv_loths_col: '#4783ad',
    startUpOnBoot: false
}
var config:Iconfig= config_default

async function getConfig() {
    return new Promise((resolve,reject) => {
        fs.readFile(appFolder + 'config.json','utf8',(err,data) => {
            if (err) {
                emitError(`Error reading file ${appFolder + 'config.json'}`,err)
                config = config_default;
            } else {
                config = JSON.parse(data)
                var writeFile = false
                for (const prop in config_default) {
                    if (!config.hasOwnProperty(prop)) {
                        (config[prop as keyof Iconfig] as any) = config_default[prop as keyof Iconfig] as any;
                        writeFile = true
                    }
                }
                if (writeFile) {
                    fs.writeFile( appFolder + 'config.json', JSON.stringify(config), (err) => {
                        if (err) emitError(`Error creating directory ${appFolder + 'config.json'}`,err)
                    });
                }
            }
            resolve('gotConfig')
        })
    })
}

ipcMain.on('postConfig', (event,data) => {
    if (typeof data == 'string')
        data = JSON.parse(data)
    config = data
    fs.writeFile(appFolder + 'config.json',JSON.stringify(config), (err) => {
        if (err) emitError(`Error saving changes ${appFolder + 'config.json'}`,err)
    })
    mainEvent.emit('configFetch',config)
})
//

getConfig().then(() => {mainEvent.emit('configFetch',config)}).catch(err => mainEvent.emit('error',{title: 'Error in getConfig()', text: JSON.stringify(err.stack)}))

function emitError(title:string,err:any) {
    mainEvent.emit('error', {title: title, text: JSON.stringify(err)})
}

export {
    config
}