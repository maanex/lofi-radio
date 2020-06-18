import * as ytdl from 'ytdl-core';
import * as fs from 'fs';


export default class YoutubeInterface {

  constructor() {
  }

  public test() {
    ytdl('https://www.youtube.com/watch?v=r9ssRb_tOF0', {
        filter: "audioonly",
        quality: "highestaudio"
      })
      .pipe(fs.createWriteStream('test.mp3'));
  }

}