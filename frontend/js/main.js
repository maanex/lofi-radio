
const ipcRenderer = require('electron').ipcRenderer;


let app;
app = new Vue({
  el: '#app',
  data: {
    index: 0,
    currentSong: undefined,
    mirror: 'https://mp3.chillhop.com/',
    tracklist: [],
    playing: false,
    player: new Audio(''),
    progress: 0,
    volume: 1,
    volumeMomentum: 0,
    volumeChanged: false,
    inMenu: false,
    lastPlayed: [],
    settings: {
      ontop: false,
      shuffle: true,
      darktheme: true,
      color: 0
    },
    colors: [
      '#e0be72',
      '#62cc95',
      '#5d9dd9',
      '#af73eb',
      'var(--text)'
    ]
  },
  computed: {
    audioUrl() {
      return `${this.mirror}serve.php/?mp3=${this.currentSong?.mp3_file_id ?? ''}`;
    },
    thumbnailUrl() {
      return this.currentSong?.img ?? '';
    },
    title() {
      return this.currentSong?.title ?? '';
    },
    artists() {
      return this.currentSong?.artists.map(a => a.name).join(', ') || '';
    }
  },
  watch: {
    currentSong() {
      this.player = new Audio(this.audioUrl);
      this.player.onpaused = () => this.pause = true;
      this.player.onplaying = () => this.pause = false;
      ipcRenderer.send('title', this.title);
    },
    volume(value) {
      this.player.volume = value;
      ipcRenderer.send('setting', 'volume', value);
    }
  },
  methods: {
    async uiPlayPause() {
      if (!this.currentSong) await this.nextTrack();
      if (this.playing) this.player.pause();
      else this.player.play();
      this.playing = !this.playing;
    },
    async uiSkip() {
      await this.player.pause();
      await this.nextTrack(1);
      if (this.playing) this.player.play();
      else this.player.pause();
    },
    async uiBack() {
      if (this.player.currentTime < 3) {
        await this.player.pause();
        await this.nextTrack(-1);
        if (this.playing) this.player.play();
        else this.player.pause();
      } else {
        this.player.currentTime = 0;
      }
    },
    async uiClose() {
      ipcRenderer.send('exit');
    },
    async uiMenu(open) {
      this.inMenu = !!open;
    },
    async uiSetting(name, value) {
      if (value == undefined) value = !this.settings[name];
      this.settings[name] = value;
      ipcRenderer.send('setting', name, value);
    },
    async uiSeek(e) {
      const width = document.querySelector('.progress').getBoundingClientRect().width;
      const pos = e.offsetX;
      this.player.currentTime = this.player.duration / width * pos;
    },
    async uiLinkExt(url) {
      ipcRenderer.send('extlink', url);
    },
    async nextTrack(direction = 1) {
      if (direction > 0) this.lastPlayed.push(this.index);

      if (this.settings.shuffle) {
        this.loadTracklist();
        if (direction > 0) {
          const nono = this.lastPlayed.slice(this.lastPlayed.length - Math.min(this.lastPlayed.length / 2, this.tracklist.length / 2));
          let selection;
          do selection = Math.floor(Math.random() * this.tracklist.length);
          while (nono.includes(selection));
          this.index = selection;
        } else {
          this.index = this.lastPlayed.splice(this.lastPlayed.length - 1, 1)[0];
        }
      } else {
        this.index += direction;
      }

      if (this.index >= this.tracklist.length)
        await this.loadTracklist();
      if (this.index >= this.tracklist.length)
        this.index = 0;
      if (this.index < 0)
        this.index = this.tracklist.length - 1;

      this.currentSong = this.tracklist[this.index];
    },
    async loadTracklist() {
      const res = await fetch('https://chillhop.com/wp-admin/admin-ajax.php?player_get_track_list', {
        method: 'POST',
        body: `action=player_get_track_list&uri=&offset=${this.tracklist.length}`,
        headers: {
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8'
        }
      });

      if (!res.ok) return;
      const obj = await res.json();
      
      this.tracklist.push(...obj.tracks);
      this.mirror = obj.mirror || this.mirror;
    }
  }
});

setInterval(async () => {
  if (app.player) {
    app.progress = app.player.currentTime / app.player.duration;
    if (app.progress == 1) {
      await app.nextTrack();
      app.player.play();
    }
  }
}, 200);


ipcRenderer.on('loadSettings', (e, settings) => {
  if (!settings) return;
  for (const key in settings) {
    Vue.set(app.settings, key, settings[key]);
  }
});

(async () => {
  ipcRenderer.send('init');
  await app.loadTracklist();
  await app.loadTracklist();
  await app.nextTrack();
  app.player.pause();
})();


const el = document.getElementById('thumbnail');
el.addEventListener('mousedown', (e) => {
  const mouseX = e.clientX;  
  const mouseY = e.clientY;
  ipcRenderer.send('startWindowMove', mouseX, mouseY);
});

el.addEventListener('mouseup', (e) => {
  ipcRenderer.send('stopWindowMove');
});

let momentumChangeInterval;
el.addEventListener('wheel', (e) => {
  app.volumeChanged = true;
  const delta = -e.deltaY / Math.abs(e.deltaY) * .005;

  if (e.shiftKey) {
    app.volume += delta;
    setTimeout(() => app.volumeChanged = false, 1000);
  } else {
    app.volumeMomentum += delta;
    if (!momentumChangeInterval) {
      momentumChangeInterval = setInterval(() => {
        app.volume += app.volumeMomentum;
        if (app.volume < 0) app.volume = 0;
        if (app.volume > 1) app.volume = 1;
        
        app.volumeMomentum *= .9;
        if (Math.abs(app.volumeMomentum) < .001) {
          app.volumeChanged = false;
          clearInterval(momentumChangeInterval);
          momentumChangeInterval = undefined;
        }
      }, 10);
    }
  }
});