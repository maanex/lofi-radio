import { BrowserWindow, ipcMain, app, screen, shell } from 'electron';
import config from 'window-properties.json';
import { Core } from '../index';
import * as Store from 'electron-store';


export default class AppWindow extends BrowserWindow {

  constructor(configs: config, store: Store)
  constructor(width: number, height: number, store: Store)
  constructor(...args) {
    if (!args.length) throw 'Invalid arguments when creating AppWindow';
    let width: number, height: number;
    let store: Store;
    if ('number' == typeof args[0]) {
      width = args[0];
      height = args[1];
      store = args[2];
    } else {
      width = (args[0] as config).startup.width;
      height = (args[0] as config).startup.height;
      store = args[1];
    }

    super({ 
      width,
      height,
      webPreferences: {
        nodeIntegration: true
      },
      frame: false,
      transparent: true,
      resizable: false,
      fullscreenable: false,
      fullscreen: false,
      maximizable: false,
      alwaysOnTop: !!store.get('settings')?.ontop,
      title: 'Lofi Radio'
    });
  }

  public loadContent() {
    this.loadFile('./frontend/index.html');
  }

  public registerHandlers() {
    const win = this;

    ipcMain.on('exit', () => {
      app.quit();
    });

    ipcMain.on('init', (e) => {
      e.sender.send('loadSettings', Core.store.get('settings'));
    });
    
    ipcMain.on('title', (e, title) => {
      win.title = title + Core.configs.WindowProperties.titleSuffix;
    });

    let moveInterval: NodeJS.Timeout;
    ipcMain.on('startWindowMove', (e, mouseX, mouseY) => {
      if (moveInterval)
        clearInterval(moveInterval);
      moveInterval = setInterval(() => {
        const { x, y } = screen?.getCursorScreenPoint();
        this?.setPosition(x - mouseX, y - mouseY);
      }, 10);
    });
    
    ipcMain.on('stopWindowMove', () => {
      clearInterval(moveInterval);
    });
    
    ipcMain.on('setting', (e, name, value) => {
      Core.store.set('settings.' + name, value);

      switch (name) {
        case 'ontop':
          this.setAlwaysOnTop(!!value);
          break;
      }
    });
    
    ipcMain.on('extlink', (e, url) => {
      shell.openExternal(url);
    });
  }

}