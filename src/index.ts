import { app, BrowserWindow } from 'electron';
import Configs from "./configs";
import AppWindow from "./app/app-window";
import YoutubeInterface from './app/youtube-interface';
import * as Store from 'electron-store';


class AppCore {

  public readonly configs: Configs;
  public store: Store;
  public window: AppWindow;
  public youtubeInterface: YoutubeInterface;

  constructor() {
    this.configs = new Configs();
    this.store = new Store();

    this.window = new AppWindow(this.configs.WindowProperties, this.store);
    this.youtubeInterface = new YoutubeInterface();

    //

    this.window.loadContent();
    this.window.registerHandlers();
    // this.youtubeInterface.test();
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
