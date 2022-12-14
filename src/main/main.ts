/* eslint global-require: off, no-console: off, promise/always-return: off */

/**
 * This module executes inside of electron's main process. You can start
 * electron renderer process from here and communicate with the other processes
 * through IPC.
 *
 * When running `npm run build` or `npm run build:main`, this file is compiled to
 * `./src/main.js` using webpack. This gives us some performance wins.
 */

import path from 'path';
import fs from 'fs';
import Os from 'os'
const appFolder = Os.homedir() + '/Documents/WFRIM/'
/*
ensureDirectoryExistence(appFolder)
ensureDirectoryExistence(appFolder + 'logs')
function ensureDirectoryExistence(filePath:string) {
    var dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        ensureDirectoryExistence(dirname);
        fs.mkdirSync(dirname);
    }
}
*/
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


/***********************Preprocess script*****************/
var change = false
var fileContent = JSON.parse((fs.readFileSync(appFolder + 'relicsDB.json','utf-8')).replace(/^\uFEFF/, ''))
fileContent.forEach((item:any, index:number) => {
  if (!item.hasOwnProperty('display')) {
    change = true
    fileContent[index].display = true
  }
  if (!item.hasOwnProperty('refinement')) {
    change = true
    fileContent[index].refinement = {cycle: '4b4', refinement: 'rad'}
  }
  if (!item.hasOwnProperty('wtb')) {
    change = true
    fileContent[index].wtb = true
  }
  if (!item.hasOwnProperty('buy_price')) {
    change = true
    fileContent[index].buy_price = 5
  }
  if (typeof item.quantity != 'number') {
    change = true
    fileContent[index].quantity = Number(item.quantity)
  }
})
if (change) fs.writeFileSync(appFolder + 'relicsDB.json', JSON.stringify(fileContent))
//
var change = false
var fileContent = JSON.parse((fs.readFileSync(appFolder + 'logs/full_log.json','utf-8')).replace(/^\uFEFF/, ''))
var index = fileContent.mission_initialize.length - 1
while (index >= 0) {
  var item = fileContent.mission_initialize[index]
  if (!item.hasOwnProperty('client_lang')) {
    change = true
    fileContent.mission_initialize[index].client_lang = ''
  }
  if (!item.hasOwnProperty('refinement')) {
    change = true
    fileContent.mission_initialize[index].refinement = ''
  }
  if (!item.hasOwnProperty('fissureNode')) {
    change = true
    fileContent.mission_initialize[index].fissureNode = {seq: '', mission: {}}
  }
  if (item.status == 'unsuccessful') {
    change = true
    fileContent.mission_initialize.splice(index,1)
  }
  index--
}
var index = fileContent.trades.length - 1
while (index >= 0) {
  var item = fileContent.trades[index]
  if (item.status == 'unsuccessful') {
    change = true
    fileContent.trades.splice(index,1)
  }
  index--
}
if (change) fs.writeFileSync(appFolder + 'logs/full_log.json', JSON.stringify(fileContent))
/***************************************************************/

/*
fs.openSync(appFolder + 'relicsDB.json','r',function(notexists, f) {
    if (notexists) fs.writeFileSync(appFolder + 'relicsDB.json', "[]");
});
fs.open(appFolder + 'items_list.json','r',function(notexists, f) {
    if (notexists) fs.writeFileSync( appFolder + 'items_list.json', "[]");
});
fs.open(appFolder + 'config.json','r',function(notexists, f) {
    if (notexists) fs.writeFileSync( appFolder + 'config.json', "[]");
});
*/

import { app, BrowserWindow, shell, dialog, ipcMain, globalShortcut } from 'electron';
import Electron from 'electron'
import { autoUpdater } from 'electron-updater';
import log from 'electron-log';
import MenuBuilder from './menu';
import { resolveHtmlPath } from './util';
import './ipcHandler'
import './modules/log_reader'
import {mainEvent} from './eventHandler'
import './modules/config'

export default class AppUpdater {
  constructor() {
    log.transports.file.level = 'info';
    autoUpdater.logger = log;
    autoUpdater.checkForUpdatesAndNotify();
  }
}

let mainWindow: BrowserWindow | null = null;
var rendererReady = 0
ipcMain.on('rendererReady', (arg) => rendererReady = 1)

if (process.env.NODE_ENV === 'production') {
  const sourceMapSupport = require('source-map-support');
  sourceMapSupport.install();
}

const isDevelopment =
  process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

if (isDevelopment) {
  require('electron-debug')();
}

const installExtensions = async () => {
  const installer = require('electron-devtools-installer');
  const forceDownload = !!process.env.UPGRADE_EXTENSIONS;
  const extensions = ['REACT_DEVELOPER_TOOLS'];

  return installer
    .default(
      extensions.map((name) => installer[name]),
      forceDownload
    )
    .catch(console.log);
};

const createWindow = async () => {
  if (isDevelopment) {
    await installExtensions();
  }

  const RESOURCES_PATH = app.isPackaged
    ? path.join(process.resourcesPath, 'assets')
    : path.join(__dirname, '../../assets');

  const getAssetPath = (...paths: string[]): string => {
    return path.join(RESOURCES_PATH, ...paths);
  };

  const {width, height} = Electron.screen.getPrimaryDisplay().workAreaSize
  mainWindow = new BrowserWindow({
    show: false,
    width: width*0.85,
    height: height*0.90,
    icon: getAssetPath('icon.png'),
    webPreferences: {
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
    title: 'WFRIM'
  });

  mainWindow.loadURL(resolveHtmlPath('index.html'));

  mainWindow.on('ready-to-show', () => {
    if (!mainWindow) {
      throw new Error('"mainWindow" is not defined');
    }
    (mainWindow as BrowserWindow).webContents.send('mainReady', [])
    if (process.env.START_MINIMIZED) {
      mainWindow.minimize();
    } else {
      mainWindow.show();
    }
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  const menuBuilder = new MenuBuilder(mainWindow);
  menuBuilder.buildMenu();

  // Open urls in the user's browser
  mainWindow.webContents.setWindowOpenHandler((edata) => {
    shell.openExternal(edata.url);
    return { action: 'deny' };
  });

  // Remove this if your app does not use auto updates
  // eslint-disable-next-line
  new AppUpdater();

};

/**
 * Add event listeners...
 */

app.on('window-all-closed', () => {
  // Respect the OSX convention of having the application in memory even
  // after all windows have been closed
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (mainWindow === null) createWindow();
    });
  }).catch(console.log);

app.on('will-quit', () => {
  // Unregister all shortcuts.
  globalShortcut.unregisterAll()
})

mainEvent.on('toggleStartUp', (arg) => {
  app.setLoginItemSettings({
    openAtLogin: arg,
    path: app.getPath('exe')
  })
})


//------------------ autoUpdater HANDLES --------------------
//------------------ mainEvent HANDLES --------------------
mainEvent.on('error', (err) => {
  emitError(err.title,err.text)
})

mainEvent.on('itemsListFetch', function itemsListFetch(data) {
  //console.log('************************************************************call itemsListFetch******************************************************************************')
  if (!rendererReady || !mainWindow) setTimeout(itemsListFetch, 1000, data)
  else mainWindow?.webContents.send('itemsListFetch', data)
})
mainEvent.on('relicDBFetch', function relicDBFetch(data) {
  //console.log('************************************************************call itemsListFetch******************************************************************************')
  if (!rendererReady || !mainWindow) setTimeout(relicDBFetch, 1000, data)
  else mainWindow?.webContents.send('relicDBFetch', data)
})
mainEvent.on('configFetch', function configFetch(data) {
  if (!rendererReady || !mainWindow) setTimeout(configFetch, 1000, data)
  else mainWindow?.webContents.send('configFetch', data)
})
mainEvent.on('statisticsFetch', function statisticsFetch(data) {
  //console.log('************************************************************call statisticsFetch******************************************************************************')
  if (!rendererReady || !mainWindow) setTimeout(statisticsFetch, 1000, data)
  else mainWindow?.webContents.send('statisticsFetch', data)
})
mainEvent.on('importGDPRResponse', function importGDPRResponse(data) {
  //console.log('************************************************************call statisticsFetch******************************************************************************')
  if (!rendererReady || !mainWindow) setTimeout(importGDPRResponse, 1000, data)
  else mainWindow?.webContents.send('importGDPRResponse', data)
})
mainEvent.on('importSRBResponse', function importSRBResponse(data) {
  //console.log('************************************************************call statisticsFetch******************************************************************************')
  if (!rendererReady || !mainWindow) setTimeout(importSRBResponse, 1000, data)
  else mainWindow?.webContents.send('importSRBResponse', data)
})

function emitError(title:string, text:string) {
  if (!mainWindow) setTimeout(emitError, 1000, title, text)
  else dialog.showMessageBox((mainWindow as BrowserWindow), { title: title, message: text})
}

/*********************** GLOBAL HOTKEYS ***************************/
var config:any = {}
var seqCounter = 0
mainEvent.on('configFetch',(data:any) => {
  config = data
  globalShortcut.unregisterAll()
  if (config.enableHotkey) globalHotkeys()
})
import {keyboard, Key, getActiveWindow} from "@nut-tree/nut-js"
var all_pastas:Array<string> = []
ipcMain.on('pastasFetch', (e,data) => {
  all_pastas = typeof data == 'object' ? data : JSON.parse(data)
})

function globalHotkeys() {
  keyboard.config.autoDelayMs = 10
  const hotkey = config.tradeHotkeyModifier == 'None' ? config.tradeHotkey : `${config.tradeHotkeyModifier}+${config.tradeHotkey}`
  const ret = globalShortcut.register(hotkey, async () => {
    console.log(`${hotkey} is pressed`)
    if (all_pastas.length > 0) {
      const windowRef = await getActiveWindow()
      const title = await windowRef.title
      console.log(title)
      if (title.toLowerCase().match('warframe')) {
        if (config.hotkeyRandomizer)
          Electron.clipboard.writeText(get_random(all_pastas))
        else if (config.hotkeySequential) {
          Electron.clipboard.writeText(all_pastas[seqCounter])
          seqCounter++;
          if (seqCounter >= all_pastas.length) seqCounter = 0
        }
        await keyboard.pressKey(Key.LeftControl)
        await keyboard.pressKey(Key.V)
        await keyboard.releaseKey(Key.V)
        await keyboard.releaseKey(Key.LeftControl)
        await keyboard.pressKey(Key.Enter)
        await keyboard.releaseKey(Key.Enter)
        setTimeout(() => shell.beep(), 119000);
        setTimeout(async () => {
          await keyboard.pressKey(Key.T)
          await keyboard.releaseKey(Key.T)
          await keyboard.pressKey(Key.Backspace)
          await keyboard.releaseKey(Key.Backspace)
        }, 100);
      }
    }
  })
  if (!ret) {
    emitError('Error registering hotkey',`Could not register hotkey: ${hotkey}`)
  }
  const hotkey2 = `ctrl+num9`
  const ret2 = globalShortcut.register(hotkey2, sendCustomPasta)
  if (!ret2) {
    emitError('Error registering hotkey',`Could not register hotkey: ${hotkey}`)
  }
}

async function sendCustomPasta() {
  Electron.clipboard.writeText(get_random(config.customPasta))
  await keyboard.pressKey(Key.LeftControl)
  await keyboard.pressKey(Key.V)
  await keyboard.releaseKey(Key.V)
  await keyboard.releaseKey(Key.LeftControl)
  await keyboard.pressKey(Key.Enter)
  await keyboard.releaseKey(Key.Enter)
  setTimeout(() => shell.beep(), 119000);
  setTimeout(async () => {
    await keyboard.pressKey(Key.T)
    await keyboard.releaseKey(Key.T)
    await keyboard.pressKey(Key.Backspace)
    await keyboard.releaseKey(Key.Backspace)
  }, 100);
  if (config.autoSpammer) {
    setTimeout(sendCustomPasta, config.autoSpammerTimeout);
  }
}

function get_random (list:Array<any>) {
  return list[Math.floor((Math.random()*list.length))];
}

process.on('uncaughtException', function (err) {
  // Handle the error
  emitError('Uncaught error in main process', err.stack? err.stack:JSON.stringify(err))
})