import { config as loadDotenv } from 'dotenv';
loadDotenv();

import { app, BrowserWindow } from 'electron';
import Configs from "./configs";
import AppWindow from "./app/app-window";
import * as Store from 'electron-store';


class AppCore {

  public readonly configs: Configs;
  public store: Store;
  public window: AppWindow;

  constructor() {
    this.configs = new Configs();
    this.store = new Store();

    this.window = new AppWindow(this.configs.WindowProperties, this.store);

    //

    this.window.registerHandlers();
    this.window.loadContent();
  }

}

app.whenReady().then(() => Core = new AppCore());
export let Core: AppCore;

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin')
    app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0)
    Core.window = new AppWindow(Core.configs.WindowProperties, Core.store);
});
