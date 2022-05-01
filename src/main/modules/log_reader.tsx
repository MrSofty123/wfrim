import {mainEvent} from '../eventHandler'
import fs from 'fs'
import Os from 'os'
import path from 'path'
//import {config} from './config'

const eeLogPath = Os.homedir() + '/AppData/Local/Warframe/EE.log'
const appFolder = Os.homedir() + '/Documents/WFRIM/'
// watch ee.log
console.log('Watching file: ' + eeLogPath)
fs.watchFile(eeLogPath,(currStat,prevStat) => {
    if (currStat.mtime != prevStat.mtime) {
        console.log('file changed: ', eeLogPath)
        logRead()
    }
})
// watch logs files
fs.readdir(appFolder + 'logs', (err,files) => {
    if (err) emitError('Error getting files', err.stack)
    else {
        for (const filename of files) {
            console.log('Watching file: ' + appFolder + 'logs/' + filename)
            fs.watchFile(appFolder + 'logs/' + filename,(currStat,prevStat) => {
                if (currStat.mtime != prevStat.mtime) {
                    console.log('file changed: ', appFolder + 'logs/' + filename)
                    getStatistics()
                }
            })
        }
    }
})
getStatistics()
var combineFiles = false

function logRead () {
    // check filesize
        fs.readFile(eeLogPath,'utf-8',(err,data) => {
            if (err) emitError('Error reading' + eeLogPath, err.stack)
            else {
                var logPrefix = ''
                const logArr = data.split('\r\n')
                for (const [index,val] of logArr.entries()) {
                    const line = val.replace(/\[/g, '').replace(/]/g, '')
                    if (line.match(`Diag: Current time:`)) {
                        const temp = line.split('UTC:')
                        logPrefix = temp[1].replace(/ /g,'').replace(/\:/g,'')
                        break
                    }
                }
                if (logPrefix == '') return //current time not written yet
                if (!combineFiles) combineFilesFunc(logPrefix)
                getFile(appFolder + `logs/${logPrefix}_log.json`).then(data => {
                    //console.log(JSON.stringify(data))
                    var logfile:any = typeof data == 'object' ? data:JSON.parse((data as string).replace(/^\uFEFF/, ''))
                    var logChanged = false
                    for (const [index1,val] of logArr.entries()) {
                        var eventHandled:boolean = false
                        var tradeSuccess:boolean = false
                        var offeringItems:Array<string> = []
                        var receivingItems:Array<string> = []
                        var trader:string = ""
                        var log_seq:string = ""
                        var complete_seq:string = ""
                        const line = val.replace(/\[/g, '').replace(/]/g, '').replace(/\(/g, '').replace(/\)/g, '')
                        if (line.match('Script Info: Dialog.lua: Dialog::CreateOkCanceldescription=Are you sure you want to accept this trade')) {
                            log_seq = "s_" + (line.split(' '))[0]
                            for (const [index,val] of logfile.trades.entries()) {
                                if (val.log_seq==log_seq) {       // Event already handled
                                    eventHandled = true
                                    break
                                }
                            }
                            if (eventHandled) continue
                            logChanged = true
                            console.log('found trade at '+ log_seq)
                            for (var i=index1+1; i<=i+200; i++) {
                                const temp = logArr[i].replace(/\[/g, '').replace(/]/g, '').replace(/\(/g, '').replace(/\)/g, '')
                                if (temp.match('Script Info: Dialog.lua: Dialog::CreateOkdescription=The trade was successful!, leftItem=\/Menu\/Confirm_Item_Ok')) {
                                    //console.log('hiiii')
                                    tradeSuccess = true
                                    complete_seq = "s_" + (temp.split(' '))[0]
                                    break
                                }
                            }
                            if (!tradeSuccess)
                                continue
                            console.log('trade was successful ' + complete_seq)
                            // Trade is successful. Retrieve trade detail
                            var allItems = []
                            for (var i=index1+1; i<=i+200; i++) {
                                const temp = logArr[i].trim()
                                if (temp.match('leftItem=/Menu/Confirm_Item_Ok, rightItem=/Menu/Confirm_Item_Cancel'))
                                {
                                    var temp1 = temp.split(',')
                                    allItems.push(temp1[0])
                                    break
                                }
                                if (temp != '')
                                    allItems.push(temp)
                            }
                            var receiveFlag = 0
                            allItems.forEach(item => {
                                if (item.match('and will receive from')) {
                                    receiveFlag = 1
                                    trader = (item.split(' '))[4]
                                } else {
                                    if (receiveFlag) receivingItems.push(item.replace(/ /g,'_'))
                                    else offeringItems.push(item.replace(/ /g,'_'))
                                }
                            })
                            //console.log(JSON.stringify(offeringItems))
                            //console.log(JSON.stringify(receivingItems))

                            logfile.trades.push({log_seq: log_seq, complete_seq: complete_seq, trader: trader, offeringItems: offeringItems, receivingItems: receivingItems, status: "successful", timestamp: new Date().getTime()})
                            wfTradeHandler(offeringItems,receivingItems)
                            continue
                            //wfTradeHandler(log_seq,complete_seq,trader,offeringItems,receivingItems,"successful")
                            //gosub filterRelics
                            //SetTimer, updateWFLoggerInfo, -2000
                        }
                        eventHandled = false
                        var equipSuccess:boolean = false
                        var relicEquipped = ""
                        log_seq = ""
                        complete_seq = ""
                        if (line.match('Script Info: Dialog.lua: Dialog::CreateOkCanceldescription=Are you sure you want to equip')) {
                            log_seq = "s_" + (line.split(' '))[0]
                            for (const [index,val] of logfile.mission_initialize.entries()) {
                                if (val.log_seq==log_seq) {       // Event already handled
                                    eventHandled = true
                                    break
                                }
                            }
                            if (eventHandled) continue
                            logChanged = true
                            console.log('found relic squad at '+ log_seq)
                            for (var i=index1+1; i<=i+20; i++) {    //Confirmation must be in next 20 lines
                                const temp = logArr[i].replace(/\[/g, '').replace(/]/g, '').replace(/\(/g, '').replace(/\)/g, '')
                                if (temp.match('Script Info: Dialog.lua: Dialog::SendResult4')) {
                                    equipSuccess = true
                                    complete_seq = "N/A Yet"
                                    break
                                }
                            }
                            if (!equipSuccess) continue
                            // Check if any other unhandled event(s) before and discard
                            for (const [index,val] of logfile.mission_initialize.entries()) {
                                if (val.complete_seq == "N/A Yet")
                                    logfile.mission_initialize.splice(index,1)
                            }
                            // Retrieve relic being equipped
                            const temp = line.toLowerCase().split(' ')
                            relicEquipped = temp[11] + "_" + temp[12] + "_" + temp[13]
                            // Commit event to file
                            logfile.mission_initialize.push({log_seq: log_seq, complete_seq: complete_seq, relicEquipped: relicEquipped, status: "unsuccessful", timestamp: new Date().getTime()})
                            continue
                        }
                        eventHandled = false
                        log_seq = ""
                        relicEquipped = ""
                        complete_seq = ""
                        if (line.match('Script Info: ProjectionRewardChoice.lua: Got rewards')) {
                            complete_seq = "s_" + (line.split(' '))[0]
                            for (const [index,val] of logfile.mission_initialize.entries()) {
                                if (val.complete_seq==complete_seq) {       // Event already handled
                                    eventHandled = true
                                    break
                                }
                            }
                            if (eventHandled) continue
                            logChanged = true
                            console.log('found gotRewards at '+ log_seq)
                            // Find the recent unsuccessful event
                            for (const [index,mission] of logfile.mission_initialize.entries()) {
                                if (mission.complete_seq=="N/A Yet") {       // Event already handled
                                    logfile.mission_initialize[index].complete_seq = complete_seq
                                    logfile.mission_initialize[index].status = "successful"
                                    // Retrieve info for event handle
                                    log_seq = logfile.mission_initialize[index].log_seq
                                    relicEquipped = logfile.mission_initialize[index].relicEquipped
                                    break
                                }
                            }
                            wfMissionHandler(relicEquipped)
                            //gosub filterRelics
                            //SetTimer, updateWFLoggerInfo, -2000
                            continue
                        }
                    }
                    //console.log(JSON.stringify(logfile))
                    if (logChanged) {
                        fs.writeFile(appFolder + `logs/${logPrefix}_log.json`, JSON.stringify(logfile), (err) => {
                            if (err) emitError('Error writing log file', err.stack)
                        });
                    }
                }).catch(err => emitError('Error getting log file', err.stack? err.stack:err))
            }
        })
}

function combineFilesFunc(logPrefix:string) {
    fs.readdir(appFolder + 'logs', (err,files) => {
        if (err) emitError('Error getting dir files', err.stack)
        else {
            console.log(JSON.stringify(files))
            getFile(appFolder + `logs/full_log.json`).then(data => {
                var full_log = typeof data == 'object' ? data:JSON.parse((data as string).replace(/^\uFEFF/, ''))
                for (const [index,filename] of files.entries()) {
                    if (filename.match(logPrefix) || filename == 'full_log.json' || filename.toLowerCase().match('gdpr_trades')) continue
                    console.log('reading ' + filename)
                    const fileContent = JSON.parse((fs.readFileSync(appFolder + 'logs/' + filename,'utf-8')).replace(/^\uFEFF/, ''))
                    try {
                        for (const [index,newMission] of fileContent.mission_initialize.entries()) {
                            var logExists = false
                            for (const [index,prevMission] of full_log.mission_initialize.entries()) {
                                if (JSON.stringify(prevMission) == JSON.stringify(newMission)) {
                                    logExists = true
                                    break
                                }
                            }
                            if (!logExists) full_log.mission_initialize.push(newMission)
                        }
                    } catch (e) {}
                    try {
                        for (const [index,newMission] of fileContent.trades.entries()) {
                            var logExists = false
                            for (const [index,prevMission] of full_log.trades.entries()) {
                                if (JSON.stringify(prevMission) == JSON.stringify(newMission)) {
                                    logExists = true
                                    break
                                }
                            }
                            if (!logExists) full_log.trades.push(newMission)
                        }
                    } catch (e) {}
                }
                fs.writeFile(appFolder + `logs/full_log.json`, JSON.stringify(full_log), (err) => {
                    if (err) emitError('Error writing log file', err.stack)
                    else {
                        for (const [index,filename] of files.entries()) {
                            if (filename.match(logPrefix) || filename == 'full_log.json' || filename.toLowerCase().match('gdpr_trades')) continue
                            fs.unlinkSync(appFolder + 'logs/' + filename)
                        }
                        combineFiles = true
                    }
                });
            }).catch(err => emitError('Error reading full_log',err.stack? err.stack:err))
        }
    })
}

function wfTradeHandler(offeringItems:Array<string>,receivingItems:Array<string>)
{
    fs.readFile(appFolder + 'relicsDB.json','utf-8',(err,data) => {
        if (err) emitError('Error reading file', err.stack)
        else {
            var relicDB:Array<any> = JSON.parse(data.replace(/^\uFEFF/, ''))

            offeringItems.forEach(item => {
                const relicName = convertUpper(item.toLowerCase().replace('_relic_[radiant]','').replace('_relic_[exceptional]','').replace('_relic_[flawless]','').replace('_relic',''))
                console.log(relicName)
                relicDB.map((relic,index) => {
                    if (relic.name == relicName) {
                        relicDB[index].quantity--
                    }
                })
            })

            receivingItems.forEach(item => {
                const relicName = convertUpper(item.toLowerCase().replace('_relic_[radiant]','').replace('_relic_[exceptional]','').replace('_relic_[flawless]','').replace('_relic',''))
                console.log(relicName)
                relicDB.map((relic,index) => {
                    if (relic.name == relicName) {
                        relicDB[index].quantity++
                    }
                })
            })
            fs.writeFile(appFolder + 'relicsDB.json', JSON.stringify(relicDB), (err) => {
                if (err) emitError('Error writing log file', err.stack)
            });
        }
    })
}
function wfMissionHandler(relicEquipped:string)
{
    fs.readFile(appFolder + 'relicsDB.json','utf-8',(err,data) => {
        if (err) emitError('Error reading file', err.stack)
        else {
            var relicDB:Array<any> = JSON.parse(data.replace(/^\uFEFF/, ''))
            const relicName = convertUpper(relicEquipped.toLowerCase().replace('_relic',''))
            console.log(relicName)
            relicDB.map((relic,index) => {
                if (relic.name == relicName) {
                    relicDB[index].quantity = relicDB[index].quantity - 1
                    console.log(JSON.stringify(relicDB[index]))
                }
            })
            fs.writeFile(appFolder + 'relicsDB.json', JSON.stringify(relicDB), (err) => {
                if (err) emitError('Error writing log file', err.stack)
            });
        }
    })
}


function getStatistics() {
    fs.readdir(appFolder + 'logs', (err,files) => {
        if (err) emitError('Error getting files', err.stack)
        else {
            var rawStatistics = {mission_initialize: [], trades: []}
            for (const filename of files) {
                const fileContent = JSON.parse((fs.readFileSync(appFolder + 'logs/' + filename,'utf-8')).replace(/^\uFEFF/, ''))
                try {
                    fileContent.mission_initialize.forEach((mission:object) => (rawStatistics.mission_initialize as Array<object>).push(mission))
                } catch (e) {}
                try {
                    fileContent.trades.forEach((trade:object) => (rawStatistics.trades as Array<object>).push(trade))
                } catch (e) {}
            }
            console.log('Emitting: statisticsFetch' )
            mainEvent.emit('statisticsFetch', rawStatistics)
        }
    })
}

function emitError(title:string,err:any) {
    console.log('Emitting: error' )
    mainEvent.emit('error', {title: title, text: typeof err === 'object' ? JSON.stringify(err):err})
}

async function getFile(filepath:string) {
    return new Promise((resolve,reject) => {
        ensureDirectoryExistence(filepath)
        fs.open(filepath,'r',function(notexists, f) {
            if (notexists) {
                const obj = {mission_initialize: [], trades: []}
                fs.writeFile(filepath, JSON.stringify(obj), (err) => {
                    if (err) reject(err.stack)
                    else resolve(obj)
                });
            } else {
                fs.readFile(filepath,'utf-8',(err,data) => {
                    if (err) reject(err.stack)
                    else resolve(JSON.parse(data.replace(/^\uFEFF/, '')))
                })
            }
        });
    })
}

function ensureDirectoryExistence(filePath:string) {
    var dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        ensureDirectoryExistence(dirname);
        fs.mkdirSync(dirname);
    }
}

function convertUpper(str:string) {
    return str.replace(/_/g, " ").replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())
}
