import {mainEvent} from '../eventHandler'
import fs, { PathOrFileDescriptor } from 'fs'
import Os from 'os'
import path from 'path'
import { ipcMain } from 'electron';
//import {config} from './config'
import lang from './lang.json'

const eeLogPath = Os.homedir() + '/AppData/Local/Warframe/EE.log'
const appFolder = Os.homedir() + '/Documents/WFRIM/'

var eeLogContents = ''

interface Iitems_list {
    [key: string]: {
        item_url: string,
        sell_price: string,
        rewards: {
            common: Array<string>,
            uncommon: Array<string>,
            rare: Array<string>,
        },
        relics: Array<{link: string, name: string}>,
        tags: Array<string>,
        vault_status: string,
        items_in_set: Array<{url_name: string, quantity_for_set: number}>,
    }
}

var items_list:Iitems_list = {
}

mainEvent.on('itemsListFetch', (data) => {
    // convert into keys for faster access
    data.forEach((item:any) => {
        items_list[item.item_url as keyof Iitems_list] = item
    })
})

/*******************timerVars********************/
var getStatisticsTimer:ReturnType<typeof setTimeout>;
var logReadTimer:ReturnType<typeof setTimeout>;
getStatisticsTimer = setTimeout(getStatistics, 500)
logReadTimer = setTimeout(logRead, 500)
/***********************************************/

// watch ee.log
//console.log('Watching file: ' + eeLogPath)
/*
const eeLogWatcher = fs.watch(eeLogPath,(event,filename) => {
    if (event == 'change') {
        console.log('file changed: ', eeLogPath)
        logRead()
    }
})
*/

/************************* Fast reader for EElog ***********************/
const byte_size = 100000
var readbytes = 0
var eeLogFD:any
var logPrefix:string = ''
var client_lang:string = ''
var defaultStartDate:number = 1364169600000
var startDate:number = defaultStartDate
var endDate:number|null = null
mainEvent.on('statisticsDateUpdate', (data) => {
    startDate = new Date(data.startDate).getTime()
    endDate = data.endDate == null ? null : new Date(data.endDate).getTime() + 86400000
    console.log(startDate,' ',endDate)
    clearTimeout(getStatisticsTimer)
    getStatisticsTimer = setTimeout(getStatistics, 10)
})

var getEELogFDTimer:ReturnType<typeof setTimeout>;
getEELogFDTimer = setTimeout(getEELogFD, 50)
function getEELogFD() {
    fs.open(eeLogPath, 'r', function(err, fd) { 
        eeLogFD = fd;
        readsome(); 
    });
}

function readsome() {
    var stats = fs.fstatSync(eeLogFD); // yes sometimes async does not make sense!
    if(stats.size<readbytes+1) {
        if (new Date().getTime() - new Date(stats.mtime).getTime() > 60000) { // no changes in past 2m look for new file stream
            console.log(`eeLog descripter possibly closed. watch for new file change. Path: ${eeLogPath}`)
            eeLogContents = fs.readFileSync(eeLogPath,'utf-8').replace(/^\uFEFF/, '')
            logRead()  // perform logRead one last time
            // reset vars states
            try {
                fs.close(eeLogFD)
                logPrefix = ''
                eeLogContents = ''
                readbytes = 0
                client_lang = ''
                const eeLogWatcher = fs.watch(eeLogPath,(event,filename) => {
                    if (event == 'change' || event == 'rename') {
                        console.log('eeLog has changed. Opening new descripter')
                        clearTimeout(getEELogFDTimer)
                        getEELogFDTimer = setTimeout(getEELogFD, 500)
                        eeLogWatcher.close()
                    }
                })
            } catch (err) {
                emitError('Error in log reader', err)
            }
        } else {
            eeLogContents = eeLogContents.substring(eeLogContents.length - 200000) // strip old data from var
            if (client_lang != 'en')
                if ((lang as any)[client_lang]) 
                    (lang as any)[client_lang].forEach((obj:any) => eeLogContents=eeLogContents.replace(obj.match,obj.replace))  // translate from other languages
            setTimeout(readsome, 3000);
        }
    } else fs.read(eeLogFD, new Buffer(byte_size), 0, byte_size, readbytes, processsome);
}

function processsome(err:any, bytecount:number, buff:any) {
    console.log('Read', bytecount, 'and will process it now.');

    // Here we will process our incoming data:
        // Do whatever you need. Just be careful about not using beyond the bytecount in buff.
        //console.log(buff.toString('utf-8', 0, bytecount));
        eeLogContents += buff.toString('utf-8', 0, bytecount)
        console.log('eeLogContents: ' + eeLogContents.length)

    if (client_lang == '') {
        const logArr = eeLogContents.split('\r\n')
        for (const [index,val] of logArr.entries()) {
            const line = val.replace(/\[/g, '').replace(/]/g, '')
            if (line.match(`-language:en`)) client_lang = 'en'
            if (line.match(`-language:zh`)) client_lang = 'zh'
            if (line.match(`-language:tc`)) client_lang = 'tc'
            if (line.match(`-language:fr`)) client_lang = 'fr'
        }
        if (client_lang == '') {
            emitError('No language support', 'Sorry your client language is not supported for automatic log reading for now. Please contact the developer MrSofty#7926 on Discord or open issue request on GitHub https://github.com/MrSofty123/wfrim/issues')
            console.log('shutting down log reader')
            return
        }
    }
    if (logPrefix == '') { // update logPrefix
        const logArr = eeLogContents.split('\r\n')
        for (const [index,val] of logArr.entries()) {
            const line = val.replace(/\[/g, '').replace(/]/g, '')
            if (line.match(`Diag: Current time:`)) {
                const temp = line.split('UTC:')
                logPrefix = temp[1].replace(/ /g,'').replace(/\:/g,'')
                break
            }
        }
    }
    // So we continue reading from where we left:
    readbytes+=bytecount;
    process.nextTick(readsome);
    clearTimeout(logReadTimer)
    logReadTimer = setTimeout(logRead, 500);
}
/************************************************/

const logsWatcher = fs.watch(appFolder + 'logs',(event,filename) => {
    if (event == 'change') {
        console.log('file changed: ', appFolder + 'logs/' + filename)
        clearTimeout(getStatisticsTimer)
        getStatisticsTimer = setTimeout(getStatistics, 500)
    }
})
mainEvent.on('closeFileWatchers', () => {
    //console.log('Closing file watcher: eeLogWatcher')
    //eeLogWatcher.close()
    console.log('Closing file watcher: logsWatcher')
    logsWatcher.close()
})
/*
function watchLogs() {
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
}
*/
//watchLogs()
var combineFiles = false
var logPrefix = ''

function logRead() {
    if (logPrefix == '') { //current time not written yet
        console.log('logPrefix not written yet')
        return
    }
    if (!combineFiles) combineFilesFunc()
    getFile(appFolder + `logs/${logPrefix}_log.json`).then(data => {
        //console.log(JSON.stringify(data))
        var logfile:any = typeof data == 'object' ? data:JSON.parse((data as string).replace(/^\uFEFF/, ''))
        const logArr = eeLogContents.split('\r\n')  // eeLogContents is a global variable, ee.log contents are continuously logged in here, see above
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
            //translates.forEach(obj => line=line.replace(obj.match,obj.replace))  // translate from other languages
            //if (line.match('Script Info: Dialog.lua: Dialog::CreateOkCanceldescription=')) console.log(line)
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
                for (var i=index1+1; i<=index1+200; i++) {
                    if (!logArr[i]) {   // not logged yet
                        tradeSuccess = false
                        break
                    }
                    var temp = logArr[i].replace(/\[/g, '').replace(/]/g, '').replace(/\(/g, '').replace(/\)/g, '')
                    //translates.forEach(obj => temp=temp.replace(obj.match,obj.replace))  // translate from other languages
                    if (temp.match('Script Info: Dialog.lua: Dialog::CreateOkdescription=The trade was successful!, leftItem=\/Menu\/Confirm_Item_Ok')) {
                        tradeSuccess = true
                        complete_seq = "s_" + (temp.split(' '))[0]
                        break
                    }
                }
                if (!tradeSuccess) continue
                console.log('trade was successful ' + complete_seq)
                // Trade is successful. Retrieve trade detail
                var allItems = []
                for (var i=index1+1; i<=index1+200; i++) {
                    if (!logArr[i]) {   // not logged yet
                        tradeSuccess = false
                        break
                    }
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
                if (!tradeSuccess) continue
                var receiveFlag = 0
                allItems.forEach(item => {
                    //translates.forEach(obj => item=item.replace(obj.match,obj.replace))  // translate from other languages
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

                logfile.trades.push({log_seq: log_seq, complete_seq: complete_seq,client_lang: client_lang, trader: trader, offeringItems: offeringItems, receivingItems: receivingItems, status: "successful", timestamp: new Date()})
                wfTradeHandler(offeringItems,receivingItems)
                continue
                //wfTradeHandler(log_seq,complete_seq,trader,offeringItems,receivingItems,"successful")
                //gosub filterRelics
                //SetTimer, updateWFLoggerInfo, -2000
            }
            eventHandled = false
            var equipSuccess:boolean = false
            var relicEquipped = ""
            var refinement = ""
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
                for (var i=index1+1; i<=index1+20; i++) {    //Confirmation must be in next 20 lines
                    if (!logArr[i]) {   // not logged yet
                        equipSuccess = false
                        break
                    }
                    const temp = logArr[i].replace(/\[/g, '').replace(/]/g, '').replace(/\(/g, '').replace(/\)/g, '')
                    if (temp.match('Script Info: Dialog.lua: Dialog::SendResult4')) {
                        equipSuccess = true
                        complete_seq = "N/A Yet"
                        break
                    }
                }
                if (!equipSuccess) continue
                logChanged = true
                console.log('found relic squad at '+ log_seq)
                // Check if any other unhandled event(s) before and discard
                for (const [index,val] of logfile.mission_initialize.entries()) {
                    if (val.complete_seq == "N/A Yet")
                        logfile.mission_initialize[index].complete_seq = 'discarded'
                }
                // Retrieve relic being equipped
                const temp = line.toLowerCase().split(' ')
                relicEquipped = temp[11] + "_" + temp[12] + "_relic"
                refinement = line.toLowerCase().match('radiant') ? 'radiant' : (line.toLowerCase().match('flawless') ? 'flawless' : (line.toLowerCase().match('exceptional') ? 'exceptional':'intact'))
                // Commit event to file
                logfile.mission_initialize.push({log_seq: log_seq, complete_seq: complete_seq,client_lang: client_lang, relicEquipped: relicEquipped, refinement: refinement, fissureNode: {seq: 'N/A yet', mission: {}}, status: "unsuccessful", timestamp: new Date(), complete_timestamp: -1})
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
                console.log('found gotRewards at '+ complete_seq)
                // Find the recent unsuccessful event
                for (const [index,mission] of logfile.mission_initialize.entries()) {
                    if (mission.complete_seq=="N/A Yet") {      
                        logfile.mission_initialize[index].complete_seq = complete_seq
                        logfile.mission_initialize[index].complete_timestamp = new Date()
                        logfile.mission_initialize[index].status = "successful"
                        // Retrieve info for event handle
                        relicEquipped = logfile.mission_initialize[index].relicEquipped
                        break
                    }
                }
                wfMissionHandler(relicEquipped)
                //gosub filterRelics
                //SetTimer, updateWFLoggerInfo, -2000
                continue
            }
            eventHandled = false
            var fissureNode = {seq: 'N/A yet', mission: {}}
            if (line.match('Sys Info: Client loaded')) {
                fissureNode.seq = "s_" + (line.split(' '))[0]
                for (const [index,val] of logfile.mission_initialize.entries()) {
                    if (val.fissureNode.seq==fissureNode.seq) {       // Event already handled
                        eventHandled = true
                        break
                    }
                }
                if (eventHandled) continue
                logChanged = true
                console.log('found mission loading at '+ fissureNode.seq)
                fissureNode.mission = JSON.parse((line.split(' '))[5])
                // Find the recent unsuccessful event
                for (const [index,mission] of logfile.mission_initialize.entries()) {
                    if (mission.complete_seq=="N/A Yet") {
                        logfile.mission_initialize[index].fissureNode = fissureNode
                        break
                    }
                }
                continue
            }
        }
        //console.log(JSON.stringify(logfile))
        if (logChanged) {
            fs.writeFile(appFolder + `logs/${logPrefix}_log.json`, JSON.stringify(logfile), (err) => {
                if (err) emitError('Error writing log file', err.stack)
            });
        }
    }).catch(err => {emitError('error getting log file ' + appFolder + `logs/${logPrefix}_log.json`, err.stack? err.stack:err)})
}

function combineFilesFunc() {
    fs.readdir(appFolder + 'logs', (err,files) => {
        if (err) emitError('Error getting dir files', err.stack)
        else {
            getFile(appFolder + `logs/full_log.json`).then(data => {
                var full_log = typeof data == 'object' ? data:JSON.parse((data as string).replace(/^\uFEFF/, ''))
                var log_change = false
                for (const [index,filename] of files.entries()) {
                    if (filename.match(logPrefix) || filename == 'full_log.json' || filename == 'gdpr_log.json') continue
                    log_change = true
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
                if (log_change) {
                    fs.writeFile(appFolder + `logs/full_log.json`, JSON.stringify(full_log), (err) => {
                        if (err) emitError('Error writing log file', err.stack)
                        else {
                            for (const [index,filename] of files.entries()) {
                                if (filename.match(logPrefix) || filename == 'full_log.json' || filename == 'gdpr_log.json') continue
                                fs.unlinkSync(appFolder + 'logs/' + filename)
                            }
                            combineFiles = true
                        }
                    });
                }
            }).catch(err => emitError('Error reading full_log.json',err.stack? err.stack:err))
        }
    })
}

function wfTradeHandler(offeringItems:Array<string>,receivingItems:Array<string>)
{
    const relicsDB = JSON.parse((fs.readFileSync(appFolder + 'relicsDB.json','utf-8')).replace(/^\uFEFF/, ''))

    offeringItems.forEach(item => {
        const relicName = convertUpper(item.toLowerCase().replace('_relic_[radiant]','').replace('_relic_[exceptional]','').replace('_relic_[flawless]','').replace('_relic',''))
        relicsDB.map((relic:any,index:any) => {
            if (relic.name == relicName) relicsDB[index].quantity--
        })
    })

    receivingItems.forEach(item => {
        const relicName = convertUpper(item.toLowerCase().replace('_relic_[radiant]','').replace('_relic_[exceptional]','').replace('_relic_[flawless]','').replace('_relic',''))
        relicsDB.map((relic:any,index:any) => {
            if (relic.name == relicName) relicsDB[index].quantity++
        })
    })
    
    fs.writeFileSync(appFolder+'relicsDB.json',JSON.stringify(relicsDB))
}
function wfMissionHandler(relicEquipped:string)
{
    const relicsDB = JSON.parse((fs.readFileSync(appFolder + 'relicsDB.json','utf-8')).replace(/^\uFEFF/, ''))
    const relicName = convertUpper(relicEquipped.toLowerCase().replace('_relic',''))
    relicsDB.map((relic:any,index:number) => {
        if (relic.name == relicName) {
            relicsDB[index].quantity--
            console.log(JSON.stringify(relicsDB[index]))
        }
    })
    fs.writeFileSync(appFolder+'relicsDB.json',JSON.stringify(relicsDB))
}


function getStatistics() {
    if (Object.keys(items_list).length == 0) {
        clearTimeout(getStatisticsTimer)
        getStatisticsTimer = setTimeout(getStatistics, 500)
        return
    }
    fs.readdir(appFolder + 'logs', (err,files) => {
        if (err) emitError('Error getting files', err.stack)
        else {
            if (files.length <= 0) return
            var rawStatistics = {mission_initialize: [], trades: []}
            for (const filename of files) {
                var fileContent;
                try {
                    fileContent = JSON.parse((fs.readFileSync(appFolder + 'logs/' + filename,'utf-8')).replace(/^\uFEFF/, ''))
                } catch (e:any) {emitError('Error reading file ' + appFolder + 'logs/' + filename, e.stack? e.stack:e)}
                try {
                    fileContent.mission_initialize.forEach((mission:object) => (rawStatistics.mission_initialize as Array<object>).push(mission))
                } catch (e) {}
                try {
                    fileContent.trades.forEach((trade:object) => (rawStatistics.trades as Array<object>).push(trade))
                } catch (e) {}
            }
            console.log('Emitting: statisticsFetch' )
            mainEvent.emit('statisticsFetch', computeStats(rawStatistics))
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
        var data = {mission_initialize: [], trades: []}
        if (!fs.existsSync(filepath)) fs.writeFileSync(filepath,JSON.stringify(data))
        else data = JSON.parse((fs.readFileSync(filepath,'utf-8')).replace(/^\uFEFF/, ''))
        resolve(data)
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

function getRelicUrl(str:string) {
    str = str.toLowerCase().replace(/ /g,'_')
    return (str.split('_'))[0] + '_' + (str.split('_'))[1] + '_relic'
}


ipcMain.on('importGDPRRequest', (event,file_paths:Array<string>) => {
    console.log('importGDPRRequest: request received')
    var gdpr_log:any = {mission_initialize: [], trades: []}
    var plat_spent:number = 0
    var plat_received:number = 0
    var last_trade_timestamp = 0
    const localeOffset = new Date().getTimezoneOffset() * 60 * 1000 * -1
    console.log('localeOffset: ' + localeOffset)
    file_paths.forEach((file_path:string) => {
        if (!file_path.match('GDPR_Trades_Warframe')) return
        const filecontentArr = (fs.readFileSync(file_path,'utf-8')).replace(/^\uFEFF/, '').split('\r\n\r\n')
        var trades = []
        var store_purchases = []
        for (var transaction of filecontentArr) {
            transaction = transaction.trim().toLowerCase()
            if (transaction.match('traded items given')) trades.push(transaction)
            if (transaction.match('store purchase')) store_purchases.push(transaction)
        }
        // Get store purchase plat amount
        var store_plat:number = 0
        store_purchases.forEach((purchase:string) => {
            var temp = purchase.split('\r\n')
            store_plat += Number((temp[2].split('platinum : '))[1])
        })
        console.log('store plat: ' + store_plat)
        plat_spent += store_plat
        gdpr_log.trades.push({
            complete_seq: "N/A",
            log_seq: "N/A",
            offeringItems: ["platinum_x_" + store_plat],
            receivingItems: ["platinum_x_0"],
            status: "successful",
            timestamp: new Date(),
            trader: "N/A",
            category: "store_purchases"
        })
        trades.forEach((trade:string) => {
            const lineArr = trade.split('\r\n')
            var receiveFlag = false
            var receivingItems:Array<string> = []
            var offeringItems:Array<string> = []
            lineArr.forEach((line:string) => {
                if (line.match('credits')) return
                if (line.match('traded items recieved')) receiveFlag = true
                if (line.match('\t\t')) {
                    if (line.match('platinum')) {
                        const plat_str = 'platinum_x_' + Math.abs(Number(((line.split(':'))[1]).trim()))
                        if (receiveFlag) {
                            receivingItems.push(plat_str)
                            plat_received += Number(plat_str.replace("platinum_x_", ""))
                        } else {
                            offeringItems.push(plat_str)
                            plat_spent += Number(plat_str.replace("platinum_x_", ""))
                        }
                    } else {
                        var items = []
                        if (!line.match(':')) line += ' : 1'
                        const quantity = Math.abs(Number(((line.split(':'))[1]).trim()))
                        var item_str = ((line.split(':'))[0]).replace(/\t/g,'').trim().replace(/ /g,'_')
                        if (item_str.match(/_prime$/) || item_str.match(/_chassis$/) || item_str.match(/_systems$/) || item_str.match(/_neuroptics$/)) item_str += '_blueprint'
                        for (var i=1; i<=quantity; i++) {
                            items.push(item_str)
                            if (item_str.match("platinum"))
                                break
                        }
                        items.forEach(item => {
                            if (receiveFlag) receivingItems.push(item)
                            else offeringItems.push(item)
                        })
                    }
                }
            })
            // convert trade time
            var trade_time = new Date(lineArr[0].replace(/\t/g,'').trim()).getTime() + localeOffset
            if (trade_time > last_trade_timestamp)
                last_trade_timestamp = trade_time
            gdpr_log.trades.push({
                complete_seq: "N/A",
                log_seq: "N/A",
                offeringItems: offeringItems,
                receivingItems: receivingItems,
                status: "successful",
                timestamp: new Date(trade_time),
                trader: "N/A"
            })
        })
    })
    if (gdpr_log.trades.length > 0) {
        // write to gdpr_log.json
        fs.writeFileSync(appFolder + 'logs/gdpr_log.json',JSON.stringify(gdpr_log))
        // deprecate EE.log trades
        fs.readdir(appFolder + 'logs', (err,files) => {
            if (err) emitError('Error reading files', err.stack? err.stack:err)
            else {
                for (const file_name of files) {
                    if (file_name == 'gdpr_log.json') continue
                    const logFile = JSON.parse(fs.readFileSync(appFolder + 'logs/' + file_name,'utf-8').replace(/^\uFEFF/, ''))
                    logFile.trades.forEach((trade:any,index:number) => {
                        trade.timestamp = new Date(trade.timestamp).getTime()
                        if (!trade.timestamp || (trade.timestamp <= last_trade_timestamp))
                            logFile.trades[index].deprecated = true
                        else logFile.trades[index].deprecated = false
                    })
                    fs.writeFileSync(appFolder + 'logs/' + file_name,JSON.stringify(logFile))
                }
                mainEvent.emit('importGDPRResponse', {
                    data: {}, 
                    message: {
                        title: 'IMPORT GDPR',
                        content: `Successfully processed file. Details:\r\nTotal plat spent: ${plat_spent}p\r\nTotal plat gained: ${plat_received}p\r\nTotal trades: ${gdpr_log.trades.length}\r\nLast logged trade: ${new Date(last_trade_timestamp)}`
                    }
                })
            }
        })
    } else {
        mainEvent.emit('importGDPRResponse',{
            data: {}, 
            message: {
            title: 'IMPORT GDPR Error',
            content: `Some unexpected error occured`
        }})
    }
})

ipcMain.on('importSRBRequest', (event,file_paths:any) => {
    mainEvent.emit('importSRBResponse',{
        data: {}, 
        message: {
        title: 'IMPORT SRB',
        content: `Fetching data, please wait...`
    }})
    // unwatch all files
    //mainEvent.emit('closeFileWatchers')
    // write to relicsDB.json
    fs.writeFileSync(appFolder + 'relicsDB.json', (fs.readFileSync(file_paths.relicsDB, 'utf-8')).replace(/^\uFEFF/, ''))
    // fetch logs
    var full_log:any = {mission_initialize: [], trades: []}
    for (const filepath of file_paths.log_files) {
        const logFile = JSON.parse((fs.readFileSync(filepath, 'utf-8')).replace(/^\uFEFF/, ''))
        if (logFile.mission_initialize && logFile.mission_initialize.length) {
            logFile.mission_initialize.forEach((mission:any) => {
                if (!mission.timestamp) mission.timestamp = Math.round(fs.statSync(filepath).birthtimeMs)  // get file creation time if timestamp is not registered
                if (!mission.complete_timestamp) mission.complete_timestamp = 0
                mission.timestamp = String(mission.timestamp).length == 10 ? Number(mission.timestamp)*1000:Number(mission.timestamp)
                // fix timezone issue from srb
                mission.timestamp = mission.timestamp + (new Date().getTimezoneOffset() * 60 * 1000)
                mission.timestamp = new Date(mission.timestamp)
                mission.complete_timestamp = new Date(mission.complete_timestamp)
                full_log.mission_initialize.push(mission)
            })
        }
        if (logFile.trades && logFile.trades.length) {
            logFile.trades.forEach((trade:any) => {
                if (!trade.timestamp) trade.timestamp = Math.round(fs.statSync(filepath).birthtimeMs)  // get file creation time if timestamp is not registered
                trade.timestamp = String(trade.timestamp).length == 10 ? Number(trade.timestamp)*1000:Number(trade.timestamp)
                // fix timezone issue from srb
                trade.timestamp = trade.timestamp + (new Date().getTimezoneOffset() * 60 * 1000)
                trade.timestamp = new Date(trade.timestamp)
                full_log.trades.push(trade)
            })
        }
    }
    fs.writeFileSync(appFolder + 'logs/full_log.json', JSON.stringify(full_log))
    mainEvent.emit('importSRBResponse',{
        data: {}, 
        message: {
        title: 'IMPORT SRB',
        content: `All data imported.`
    }})
})


function computeStats(rawStatistics:any) {
    interface Istatistics {
        relics: {
            opened: {
                total: {
                    all_time: number,
                    today: number,
                    daily_avg: number
                    runsPerDay: {[key: string]: Array<object>},
                    runsDistr: Array<{
                        timestamp: Date,
                        total: number,
                        moving_avg: number,
                        avg: number,
                    }>
                },
                vaulted: {
                    all_time: number,
                    today: number,
                    daily_avg: number
                    runsPerDay: {[key: string]: Array<object>},
                    runsDistr: Array<{
                        timestamp: Date,
                        total: number,
                        moving_avg: number,
                        avg: number,
                    }>
                },
                tracked: {
                    all_time: number,
                    today: number,
                    daily_avg: number
                    runsPerDay: {[key: string]: Array<object>},
                    runsDistr: Array<{
                        timestamp: Date,
                        total: number,
                        moving_avg: number,
                        avg: number,
                    }>
                }
            },
            opened_distr: {[key: string]: {opened: 0}},
            opened_sorted: string[]
        },
        trades: {
            plat: {
                spent: {
                    all_time: number,
                    today: number,
                    daily_avg: number,
                    spentPerDay: {[key: string]: number}
                },
                gained: {
                    all_time: number,
                    today: number,
                    daily_avg: number,
                    gainedPerDay: {[key: string]: number}
                }
            },
            items: {
                sold: {[key: string]: number},
                bought: {[key: string]: number},
                sets_sold: {[key: string]: number},
            }
        }
    }
    var statistics:Istatistics = {
        relics: {
            opened: {
                total: {
                    all_time: 0,
                    today: 0,
                    daily_avg: 0,
                    runsPerDay: {},
                    runsDistr: []
                },
                vaulted: {
                    all_time: 0,
                    today: 0,
                    daily_avg: 0,
                    runsPerDay: {},
                    runsDistr: []
                },
                tracked: {
                    all_time: 0,
                    today: 0,
                    daily_avg: 0,
                    runsPerDay: {},
                    runsDistr: []
                }
            },
            opened_distr: {},
            opened_sorted: []
        },
        trades: {
            plat: {
                spent: {
                    all_time: 0,
                    today: 0,
                    daily_avg: 0,
                    spentPerDay: {}
                },
                gained: {
                    all_time: 0,
                    today: 0,
                    daily_avg: 0,
                    gainedPerDay: {}
                }
            },
            items: {
                sold: {},
                bought: {},
                sets_sold: {}
            }
        }
    }
    var min_timestamp = new Date().getTime()
    rawStatistics.mission_initialize.forEach((mission:any,index:number) => {
        if (mission.status == 'successful') {
            mission.relicEquipped = mission.relicEquipped.toLowerCase()
            mission.timestamp = new Date(mission.timestamp).getTime()
            if (min_timestamp > mission.timestamp) min_timestamp = mission.timestamp
            if (!(mission.timestamp >= startDate) || !(mission.timestamp <= (endDate == null ? new Date().getTime() : endDate))) return
            // opened_distr
            if (!statistics.relics.opened_distr[getRelicUrl(mission.relicEquipped)]) statistics.relics.opened_distr[getRelicUrl(mission.relicEquipped)] = {opened: 0}
            statistics.relics.opened_distr[getRelicUrl(mission.relicEquipped)].opened++
            // Total Opened 
                // all time
                statistics.relics.opened.total.all_time++
                // today
                if (mission.timestamp >= new Date().setHours(0,0,0,0)) statistics.relics.opened.total.today++
                // runsPerDay
                if (mission.timestamp > 100000) {
                    if (!statistics.relics.opened.total.runsPerDay[String(new Date(mission.timestamp).setHours(0,0,0,0))]) statistics.relics.opened.total.runsPerDay[String(new Date(mission.timestamp).setHours(0,0,0,0))] = []
                    statistics.relics.opened.total.runsPerDay[String(new Date(mission.timestamp).setHours(0,0,0,0))].push(mission)
                }
            // Vaulted Opened
            const vault_status = items_list[getRelicUrl(mission.relicEquipped)]?.vault_status
            if (vault_status == 'V' || vault_status == 'B' || vault_status == 'P') {
                // all time
                statistics.relics.opened.vaulted.all_time++
                // today
                if (mission.timestamp >= new Date().setHours(0,0,0,0)) statistics.relics.opened.vaulted.today++
                // runsPerDay
                if (mission.timestamp > 100000) {
                    if (!statistics.relics.opened.vaulted.runsPerDay[String(new Date(mission.timestamp).setHours(0,0,0,0))]) statistics.relics.opened.vaulted.runsPerDay[String(new Date(mission.timestamp).setHours(0,0,0,0))] = []
                    statistics.relics.opened.vaulted.runsPerDay[String(new Date(mission.timestamp).setHours(0,0,0,0))].push(mission)
                }
            }
            // Tracked Opened
            const relicsDB = JSON.parse((fs.readFileSync(appFolder + 'relicsDB.json','utf-8')).replace(/^\uFEFF/, ''))
            for (const relic of relicsDB) {
                if (getRelicUrl(relic.name) == getRelicUrl(mission.relicEquipped)) {
                    // all time
                    statistics.relics.opened.tracked.all_time++
                    // today
                    if (mission.timestamp >= new Date().setHours(0,0,0,0)) statistics.relics.opened.tracked.today++
                    // runsPerDay
                    if (mission.timestamp > 100000) {
                        if (!statistics.relics.opened.tracked.runsPerDay[String(new Date(mission.timestamp).setHours(0,0,0,0))]) statistics.relics.opened.tracked.runsPerDay[String(new Date(mission.timestamp).setHours(0,0,0,0))] = []
                        statistics.relics.opened.tracked.runsPerDay[String(new Date(mission.timestamp).setHours(0,0,0,0))].push(mission)
                    }
                    break
                }
            }
        }
    })
    // Total - daily_avg
        /*
    var past_runs: Array<number> = []
    dayDistr.forEach((key) => {
        /*
        if (statistics.relics.opened.total.runsPerDay[key]) {
            past_runs.push(statistics.relics.opened.total.runsPerDay[key].length)
            statistics.relics.opened.total.runsDistr.push({
                    timestamp: new Date(key),
                    total: statistics.relics.opened.total.runsPerDay[key].length,
                    moving_avg: (statistics.relics.opened.total.runsDistr.length > 0 ? (statistics.relics.opened.total.runsDistr[statistics.relics.opened.total.runsDistr.length - 1].avg + statistics.relics.opened.total.runsPerDay[key].length) / 2:statistics.relics.opened.total.runsPerDay[key].length),
                    avg: past_runs.reduce( ( p, c ) => p + c, 0 ) / past_runs.length
            })
        }
        else {
            statistics.relics.opened.total.runsDistr.push({
                    timestamp: new Date(key),
                    total: 0,
                    moving_avg: statistics.relics.opened.total.runsDistr.length > 0 ? statistics.relics.opened.total.runsDistr[statistics.relics.opened.total.runsDistr.length - 1].avg:0,
                    avg: past_runs.reduce( ( p, c ) => p + c, 0 ) / past_runs.length
            })
        }
        */
        /*
        if (statistics.relics.opened.total.runsPerDay[key]) past_runs.push(statistics.relics.opened.total.runsPerDay[key].length)
        statistics.relics.opened.total.runsDistr.push({
                timestamp: new Date(key),
                total: statistics.relics.opened.total.runsPerDay[key]? statistics.relics.opened.total.runsPerDay[key].length:0,
                moving_avg: movingAvg(past_runs, 5, null),
                avg: past_runs.reduce( ( p, c ) => p + c, 0 ) / past_runs.length
        })
    })
    // Vaulted - daily_avg
    var past_runs: Array<number> = []
    dayDistr.forEach((key) => {
        /*
        if (statistics.relics.opened.vaulted.runsPerDay[key]) {
            past_runs.push(statistics.relics.opened.vaulted.runsPerDay[key].length)
            statistics.relics.opened.vaulted.runsDistr.push({
                    timestamp: new Date(key),
                    total: statistics.relics.opened.vaulted.runsPerDay[key].length,
                    moving_avg: (statistics.relics.opened.vaulted.runsDistr.length > 0 ? (statistics.relics.opened.vaulted.runsDistr[statistics.relics.opened.vaulted.runsDistr.length - 1].avg + statistics.relics.opened.vaulted.runsPerDay[key].length) / 2:statistics.relics.opened.vaulted.runsPerDay[key].length),
                    avg: past_runs.reduce( ( p, c ) => p + c, 0 ) / past_runs.length
            })
        }
        else {
            statistics.relics.opened.vaulted.runsDistr.push({
                    timestamp: new Date(key),
                    total: 0,
                    moving_avg: statistics.relics.opened.vaulted.runsDistr.length > 0 ? statistics.relics.opened.vaulted.runsDistr[statistics.relics.opened.vaulted.runsDistr.length - 1].avg:0,
                    avg: past_runs.reduce( ( p, c ) => p + c, 0 ) / past_runs.length
            })
        }
        */
        /*
        if (statistics.relics.opened.vaulted.runsPerDay[key]) past_runs.push(statistics.relics.opened.vaulted.runsPerDay[key].length)
        statistics.relics.opened.vaulted.runsDistr.push({
                timestamp: new Date(key),
                total: statistics.relics.opened.vaulted.runsPerDay[key]? statistics.relics.opened.vaulted.runsPerDay[key].length:0,
                moving_avg: movingAvg(past_runs, 5, null),
                avg: past_runs.reduce( ( p, c ) => p + c, 0 ) / past_runs.length
        })
    })
    // Tracked - daily_avg
    */
    const dayDistr = stepFunc(new Date(min_timestamp).setHours(0,0,0,0), 86400000, new Date().setHours(0,0,0,0))
    var t_past_runs: Array<number> = []
    var v_past_runs: Array<number> = []
    var tr_past_runs: Array<number> = []
    dayDistr.forEach((key) => {
        if (statistics.relics.opened.total.runsPerDay[key]) t_past_runs.push(statistics.relics.opened.total.runsPerDay[key].length)
        statistics.relics.opened.total.runsDistr.push({
                timestamp: new Date(key),
                total: statistics.relics.opened.total.runsPerDay[key]? statistics.relics.opened.total.runsPerDay[key].length:0,
                moving_avg: statistics.relics.opened.total.runsPerDay[key] ?
                (statistics.relics.opened.total.runsDistr.length > 0 ? (statistics.relics.opened.total.runsDistr[statistics.relics.opened.total.runsDistr.length - 1].moving_avg + statistics.relics.opened.total.runsPerDay[key].length) / 2:statistics.relics.opened.total.runsPerDay[key].length):
                statistics.relics.opened.total.runsDistr.length > 0 ? statistics.relics.opened.total.runsDistr[statistics.relics.opened.total.runsDistr.length - 1].moving_avg:0,
                avg: t_past_runs.reduce( ( p, c ) => p + c, 0 ) / t_past_runs.length
        })

        if (statistics.relics.opened.vaulted.runsPerDay[key]) v_past_runs.push(statistics.relics.opened.vaulted.runsPerDay[key].length)
        statistics.relics.opened.vaulted.runsDistr.push({
                timestamp: new Date(key),
                total: statistics.relics.opened.vaulted.runsPerDay[key]? statistics.relics.opened.vaulted.runsPerDay[key].length:0,
                moving_avg: statistics.relics.opened.vaulted.runsPerDay[key] ?
                (statistics.relics.opened.vaulted.runsDistr.length > 0 ? (statistics.relics.opened.vaulted.runsDistr[statistics.relics.opened.vaulted.runsDistr.length - 1].moving_avg + statistics.relics.opened.vaulted.runsPerDay[key].length) / 2:statistics.relics.opened.vaulted.runsPerDay[key].length):
                statistics.relics.opened.vaulted.runsDistr.length > 0 ? statistics.relics.opened.vaulted.runsDistr[statistics.relics.opened.vaulted.runsDistr.length - 1].moving_avg:0,
                avg: v_past_runs.reduce( ( p, c ) => p + c, 0 ) / v_past_runs.length
        })

        if (statistics.relics.opened.tracked.runsPerDay[key]) tr_past_runs.push(statistics.relics.opened.tracked.runsPerDay[key].length)
        statistics.relics.opened.tracked.runsDistr.push({
                timestamp: new Date(key),
                total: statistics.relics.opened.tracked.runsPerDay[key]? statistics.relics.opened.tracked.runsPerDay[key].length:0,
                moving_avg: statistics.relics.opened.tracked.runsPerDay[key] ?
                (statistics.relics.opened.tracked.runsDistr.length > 0 ? (statistics.relics.opened.tracked.runsDistr[statistics.relics.opened.tracked.runsDistr.length - 1].moving_avg + statistics.relics.opened.tracked.runsPerDay[key].length) / 2:statistics.relics.opened.tracked.runsPerDay[key].length):
                statistics.relics.opened.tracked.runsDistr.length > 0 ? statistics.relics.opened.tracked.runsDistr[statistics.relics.opened.tracked.runsDistr.length - 1].moving_avg:0,
                avg: tr_past_runs.reduce( ( p, c ) => p + c, 0 ) / tr_past_runs.length
        })
    })
    statistics.relics.opened.total.daily_avg = Number((t_past_runs.reduce( ( p, c ) => p + c, 0 ) / t_past_runs.length).toFixed(1))
    statistics.relics.opened.tracked.daily_avg = Number((v_past_runs.reduce( ( p, c ) => p + c, 0 ) / v_past_runs.length).toFixed(1))
    statistics.relics.opened.vaulted.daily_avg = Number((tr_past_runs.reduce( ( p, c ) => p + c, 0 ) / tr_past_runs.length).toFixed(1))

    statistics.relics.opened_sorted = Object.keys(statistics.relics.opened_distr).sort(function(a,b){return statistics.relics.opened_distr[b].opened-statistics.relics.opened_distr[a].opened})

    rawStatistics.trades.forEach((trade:any) => {
        trade.timestamp = new Date(trade.timestamp).getTime()
        if (!(trade.timestamp >= startDate) || !(trade.timestamp <= (endDate == null ? new Date().getTime() : endDate))) return
        if (trade.status == 'successful' && !trade.deprecated) {
            try {
                trade.offeringItems.forEach((item:string) => {
                    item = item.toLowerCase().replace('_chassis_blueprint', '_chassis').replace('_systems_blueprint', '_systems').replace('_neuroptics_blueprint', '_neuroptics').replace('_wings_blueprint', '_wings').replace('_harness_blueprint', '_harness')
                    if (item.match('platinum')) {
                        // all time
                        statistics.trades.plat.spent.all_time += Number((item.split('_'))[2])
                        // today
                        if (trade.timestamp >= new Date().setHours(0,0,0,0)) statistics.trades.plat.spent.today += Number((item.split('_'))[2])
                        // tradesPerDay
                        if (trade.timestamp > 100000) {
                            if (!statistics.trades.plat.spent.spentPerDay[String(new Date(trade.timestamp).setHours(0,0,0,0))]) statistics.trades.plat.spent.spentPerDay[String(new Date(trade.timestamp).setHours(0,0,0,0))] = 0
                            statistics.trades.plat.spent.spentPerDay[String(new Date(trade.timestamp).setHours(0,0,0,0))] += Number((item.split('_'))[2])
                        }
                    }
                    // items quantity sold
                    if (!item.match('platinum')) {
                        if (!statistics.trades.items.sold[item]) statistics.trades.items.sold[item] = 0
                        statistics.trades.items.sold[item]++
                        // check if full set being sold
                        if (item.match(/_blueprint$/)) {
                            // get list of components
                            var items_in_set:any = {}
                            if (items_list[item]?.items_in_set.length > 0) {
                                items_list[item].items_in_set.forEach(component => {
                                    if (!component.url_name.match(/_set$/)) {
                                        items_in_set[component.url_name] = {
                                            url_name: component.url_name,
                                            quantity_for_set: component.quantity_for_set,
                                            quantity_traded: 0
                                        }
                                    }
                                })
                            }
                            // verify all quantities
                            trade.offeringItems.forEach((item1:string) => {
                                item1 = item1.toLowerCase().replace('_chassis_blueprint', '_chassis').replace('_systems_blueprint', '_systems').replace('_neuroptics_blueprint', '_neuroptics')
                                items_in_set[item1]? items_in_set[item1].quantity_traded++:false
                            })
                            var setTraded = true
                            for (const key in items_in_set) {
                                if (items_in_set[key].quantity_traded != items_in_set[key].quantity_for_set)
                                    setTraded = false
                            }
                            if (setTraded) {
                                var str = item.replace(/_blueprint$/, '_set')
                                if (!statistics.trades.items.sets_sold[str]) statistics.trades.items.sets_sold[str] = 0
                                statistics.trades.items.sets_sold[str]++
                            }
                        }
                    }
                })
            } catch (e) {}
            try {
                trade.receivingItems.forEach((item:string) => {
                    item = item.toLowerCase().replace('_chassis_blueprint', '_chassis').replace('_systems_blueprint', '_systems').replace('_neuroptics_blueprint', '_neuroptics')
                    if (item.match('platinum')) {
                        // all time
                        statistics.trades.plat.gained.all_time += Number((item.split('_'))[2])
                        // today
                        if (trade.timestamp >= new Date().setHours(0,0,0,0)) statistics.trades.plat.gained.today += Number((item.split('_'))[2])
                        // tradesPerDay
                        if (trade.timestamp > 100000) {
                            if (!statistics.trades.plat.gained.gainedPerDay[String(new Date(trade.timestamp).setHours(0,0,0,0))]) statistics.trades.plat.gained.gainedPerDay[String(new Date(trade.timestamp).setHours(0,0,0,0))] = 0
                            statistics.trades.plat.gained.gainedPerDay[String(new Date(trade.timestamp).setHours(0,0,0,0))] += Number((item.split('_'))[2])
                        }
                    }
                    // items quantity bought
                    if (!item.match('platinum')) {
                        if (!statistics.trades.items.bought[item]) statistics.trades.items.bought[item] = 0
                        statistics.trades.items.bought[item]++
                    }
                })
            } catch (e) {}
        }
    })
    //console.log(JSON.stringify(statistics.trades.items.sets_sold))

    // Plat Spent - daily_avg
    var avg = 0
    for (const key in statistics.trades.plat.spent.spentPerDay) {
        avg += statistics.trades.plat.spent.spentPerDay[key]
    }
    statistics.trades.plat.spent.daily_avg = Number((avg / Object.keys(statistics.trades.plat.spent.spentPerDay).length).toFixed(1))
    // Plat Gained - daily_avg
    var avg = 0
    for (const key in statistics.trades.plat.gained.gainedPerDay) {
        avg += statistics.trades.plat.gained.gainedPerDay[key]
    }
    statistics.trades.plat.gained.daily_avg = Number((avg / Object.keys(statistics.trades.plat.gained.gainedPerDay).length).toFixed(1))
    const relicsDB = JSON.parse((fs.readFileSync(appFolder + 'relicsDB.json','utf-8')).replace(/^\uFEFF/, ''))
    relicsDB.forEach((relic:any,index:number) => {
        if (statistics.relics.opened_distr[getRelicUrl(relic.name)]) relicsDB[index].opened =  statistics.relics.opened_distr[getRelicUrl(relic.name)].opened
        else relicsDB[index].opened = 0
    })
    fs.writeFileSync(appFolder+'relicsDB.json',JSON.stringify(relicsDB))
    //console.log(JSON.stringify(sortObject(statistics.trades.items.sold)))
    return statistics
}

function stepFunc(start:number, step:number, end:number) {
    const arrayLength = Math.floor(((end - start) / step)) + 1;
    const range = [...Array(arrayLength).keys()].map(x => (x * step) + start);
    return range
}

/**
* returns an array with moving average of the input array
* @param array - the input array
* @param count - the number of elements to include in the moving average calculation
* @param qualifier - an optional function that will be called on each 
*  value to determine whether it should be used
*/
function movingAvg(array:Array<number>, count:number, qualifier:any){
    // calculate average for subarray
    var avg = function(array:Array<number>, qualifier:any) {

        var sum = 0, count = 0, val;
        for (var i in array){
            val = array[i];
            if (!qualifier || qualifier(val)){
                sum += val;
                count++;
            }
        }

        return sum / count;
    };

    var result = [], val;

    // pad beginning of result with null values
    for (var i=0; i < count-1; i++)
        result.push(0);

    // calculate average for each subarray and add to result
    for (var i=0, len=array.length - count; i <= len; i++) {

        val = avg(array.slice(i, i + count), qualifier);
        if (isNaN(val))
            result.push(0);
        else
            result.push(val);
    }

    return (result.reduce( ( p, c ) => p + c, 0 ) / result.length);
}