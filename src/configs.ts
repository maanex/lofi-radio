import config from "window-properties.json";



export default class Configs {

  public readonly WindowProperties: config;

  constructor() {
    this.WindowProperties = require('../resources/config/window-properties.json');
  }

}
