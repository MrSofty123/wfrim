import fs from 'fs';

const appFolder = process.env.LOCALAPPDATA + '/WFRIM/'

try {
    fs.mkdirSync(appFolder);
    } catch (e) {}
try {
    fs.mkdirSync(appFolder + 'logs');
} catch (e) {}
if (!fs.existsSync(appFolder + 'relicsDB.json')) fs.writeFileSync(appFolder + 'relicsDB.json','[]')
if (!fs.existsSync(appFolder + 'items_list.json')) fs.writeFileSync(appFolder + 'items_list.json','[]')
if (!fs.existsSync(appFolder + 'config.json')) fs.writeFileSync(appFolder + 'config.json','{}')
if (!fs.existsSync(appFolder + 'logs/full_log.json')) fs.writeFileSync(appFolder + 'logs/full_log.json',JSON.stringify({mission_initialize: [], trades: []}))
if (!fs.existsSync(appFolder + 'logs/gdpr_log.json')) fs.writeFileSync(appFolder + 'logs/gdpr_log.json',JSON.stringify({mission_initialize: [], trades: []}))

const eeLogPath = process.env.LOCALAPPDATA + '/Warframe/EE.log'

export {
    appFolder,
    eeLogPath
}