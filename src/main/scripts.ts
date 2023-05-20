import os from 'os'
import fs from 'fs'

const newAppFolder = process.env.LOCALAPPDATA + '/WFRIM/'
// --Backwards compatibility
const oldAppFolder = os.homedir() + '/Documents/WFRIM/'
if (fs.existsSync(oldAppFolder) && !fs.existsSync(oldAppFolder + 'deprecateDir')) {
    try {
        fs.mkdirSync(newAppFolder);
        } catch (e) {}
    try {
        fs.mkdirSync(newAppFolder + 'logs');
    } catch (e) {}
    [{
        oldPath: oldAppFolder + 'relicsDB.json',
        newPath: newAppFolder + 'relicsDB.json'
    },{
        oldPath: oldAppFolder + 'items_list.json',
        newPath: newAppFolder + 'items_list.json'
    },{
        oldPath: oldAppFolder + 'config.json',
        newPath: newAppFolder + 'config.json'
    },{
        oldPath: oldAppFolder + 'logs/full_log.json',
        newPath: newAppFolder + 'logs/full_log.json'
    },{
        oldPath: oldAppFolder + 'logs/gdpr_log.json',
        newPath: newAppFolder + 'logs/gdpr_log.json'
    }].forEach(o => {
        readAndWriteSync(o.oldPath,o.newPath)
    })
    fs.writeFileSync(oldAppFolder + 'deprecateDir','')
}
// Backwards compatibility--

function readAndWriteSync(path1:string,path2:string) {
    const fileContent = fs.readFileSync(path1,'utf-8')
    fs.writeFileSync(path2,fileContent)
}