// 🎵 Tappy's Online Music Player
// Autoplay at low volume with user controls

const TappyMusicPlayer = {
  audio: null,
  ctx: null,
  
  tracks: [
    // Ronstrapp — House Band (song catalog)
    { name: 'Velvet Cabaret', url: '/music/tracks/velvet-cabaret.mp3' },
    { name: 'Cold Brew Conspiracy', url: '/music/tracks/cold-brew-conspiracy.mp3' },
    { name: 'Curdistan', url: '/music/tracks/curdistan.mp3' },
    { name: 'Falling Through the Blue', url: '/music/tracks/falling-through-the-blue.mp3' },
    { name: 'Quantum Antenna Power Up', url: '/music/tracks/quantum-antenna-power-up.mp3' },
    { name: 'Quantum Antenna Power Up (Edit)', url: '/music/tracks/quantum-antenna-power-up-edit.mp3' },
    { name: 'Quantum Antenna Power Up (Extended)', url: '/music/tracks/quantum-antenna-power-up-extended.mp3' },
    // Miles — Stand-Up Sets
    { name: 'Miles — Routine 5: Idle Hands, No Mouse', url: '/music/tracks/miles-routine-5-idle-hands-no-mouse.mp3' },
    { name: "Miles — First Set (Live at Tappy's)", url: '/music/tracks/miles-first-set.mp3' },
    // Tappy's Online Open Mic Night
    { name: 'Open Mic Night — Pt 1', url: '/music/tracks/open-mic-night-01.mp3' },
    { name: 'Open Mic Night — Pt 2', url: '/music/tracks/open-mic-night-02.mp3' },
    { name: 'Open Mic Night — Pt 3', url: '/music/tracks/open-mic-night-03.mp3' },
    { name: 'Open Mic Night — Pt 4', url: '/music/tracks/open-mic-night-04.mp3' },
    { name: 'Open Mic Night — Pt 5', url: '/music/tracks/open-mic-night-05.mp3' },
    { name: 'Open Mic Night — Close', url: '/music/tracks/open-mic-close.mp3' }
  ],
  
  currentTrack: 0,
  isPlaying: false,
  volume: 20, // Default 20% (not too loud)
  isGenerative: false, // Ronstrapp tracks ready — Operation Heartcast

  init() {
    this.createPlayerHTML();
    this.setupEventListeners();
    
    // Try to initialize generative or file audio
    if (this.isGenerative) {
      this.initGenerativeAudio();
    } else {
      this.initFileAudio();
    }
    
    console.log('🎵 TappyMusicPlayer initialized');
  },

  createPlayerHTML() {
    const player = document.createElement('div');
    player.id = 'tappy-music-player';
    player.className = 'music-player';
    player.innerHTML = `
      <div class="player-controls">
        <button id="tappy-prev-btn" class="player-btn" title="Previous">⏮️</button>
        <button id="tappy-play-btn" class="player-btn" title="Play/Pause">▶️</button>
        <button id="tappy-next-btn" class="player-btn" title="Next">⏭️</button>
        <span id="tappy-track-name">🎵 Ronstrapp Radio</span>
        <div class="visualizer" id="visualizer">
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
          <div class="bar"></div>
        </div>
        <input type="range" id="tappy-volume" min="0" max="100" value="20" title="Volume">
        <span id="tappy-volume-label">20%</span>
      </div>
    `;
    document.body.appendChild(player);
  },

  setupEventListeners() {
    const playBtn = document.getElementById('tappy-play-btn');
    const prevBtn = document.getElementById('tappy-prev-btn');
    const nextBtn = document.getElementById('tappy-next-btn');
    const volumeSlider = document.getElementById('tappy-volume');
    
    if (playBtn) {
      playBtn.addEventListener('click', () => this.toggle());
    }
    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prev());
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.next());
    }
    
    if (volumeSlider) {
      volumeSlider.addEventListener('input', (e) => this.setVolume(e.target.value));
    }
  },

  // Generative Web Audio API music (until Ronstrapp tracks ready)
  initGenerativeAudio() {
    try {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Create ambient generative music
      this.createAmbientDrone();
      
      // Update UI
      document.getElementById('tappy-track-name').textContent = '🎵 Tappy Ambient';
      
      // Try autoplay (may be blocked)
      this.playGenerative();
      
    } catch(e) {
      console.log('Web Audio not supported:', e);
    }
  },

  createAmbientDrone() {
    if (!this.ctx) return;
    
    // Create multiple oscillators for ambient sound
    const freqs = [110, 164.81, 220, 277.18]; // A2, E3, A3, C#4 (minor chord)
    const oscillators = [];
    const gainNodes = [];
    
    freqs.forEach((freq, i) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      // Very low volume per oscillator
      gain.gain.value = (this.volume / 100) * 0.03;
      
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      
      oscillators.push(osc);
      gainNodes.push(gain);
      
      osc.start();
    });
    
    this.generativeOscs = oscillators;
    this.generativeGains = gainNodes;
    
    // Slowly modulate for ambience
    this.modulateAmbient();
  },

  modulateAmbient() {
    if (!this.ctx || !this.generativeOscs) return;
    
    setInterval(() => {
      if (!this.isPlaying) return;
      
      this.generativeOscs.forEach((osc, i) => {
        const baseFreq = [110, 164.81, 220, 277.18][i];
        const variation = (Math.random() - 0.5) * 5;
        osc.frequency.setTargetAtTime(baseFreq + variation, this.ctx.currentTime, 3);
      });
    }, 5000);
  },

  playGenerative() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isPlaying = true;
    this.updateUI();
    this.startVisualizer();
  },

  pauseGenerative() {
    this.isPlaying = false;
    this.updateUI();
    this.stopVisualizer();
  },

  initFileAudio() {
    this.audio = new Audio();
    this.audio.loop = false;
    this.audio.preload = 'auto';
    this.audio.volume = this.volume / 100;
    this.audio.addEventListener('ended', () => this.next());
    
    this.loadTrack(this.currentTrack);
    
    // Try autoplay (may be blocked by browser). Do NOT flip isPlaying on block.
    this.audio.play().then(() => {
      this.isPlaying = true;
      this.updateUI();
      this.startVisualizer();
    }).catch(() => {
      console.log('Autoplay blocked - waiting for user interaction');
      this.isPlaying = false;
      this.updateUI();
    });
  },

  loadTrack(index) {
    this.currentTrack = (index + this.tracks.length) % this.tracks.length;
    const track = this.tracks[this.currentTrack];
    this.audio.src = track.url;
    document.getElementById('tappy-track-name').textContent = track.name;
  },

  next() {
    this.loadTrack(this.currentTrack + 1);
    if (this.isPlaying) this.audio.play();
  },

  prev() {
    this.loadTrack(this.currentTrack - 1);
    if (this.isPlaying) this.audio.play();
  },

  toggle() {
    if (this.isGenerative) {
      this.isPlaying ? this.pauseGenerative() : this.playGenerative();
    } else {
      if (this.isPlaying) {
        this.audio.pause();
        this.isPlaying = false;
      } else {
        this.audio.play().then(() => {
          this.isPlaying = true;
        }).catch((e) => {
          console.log('Play failed:', e);
          this.isPlaying = false;
        });
      }
    }
    this.updateUI();
  },

  setVolume(percent) {
    this.volume = parseInt(percent);
    
    // Update generative volume
    if (this.isGenerative && this.generativeGains) {
      const vol = (this.volume / 100) * 0.03;
      this.generativeGains.forEach(gain => {
        gain.gain.setTargetAtTime(vol, this.ctx.currentTime, 0.1);
      });
    }
    
    // Update file audio volume
    if (this.audio) {
      this.audio.volume = this.volume / 100;
    }
    
    // Update UI
    const label = document.getElementById('tappy-volume-label');
    if (label) label.textContent = `${this.volume}%`;
    
    const slider = document.getElementById('tappy-volume');
    if (slider) slider.value = this.volume;
  },

  updateUI() {
    const btn = document.getElementById('tappy-play-btn');
    if (btn) btn.textContent = this.isPlaying ? '⏸️' : '▶️';
    
    if (this.isPlaying) {
      this.startVisualizer();
    } else {
      this.stopVisualizer();
    }
  },

  startVisualizer() {
    const bars = document.querySelectorAll('#visualizer .bar');
    bars.forEach(bar => {
      bar.style.animationPlayState = 'running';
    });
  },

  stopVisualizer() {
    const bars = document.querySelectorAll('#visualizer .bar');
    bars.forEach(bar => {
      bar.style.animationPlayState = 'paused';
    });
  },

  // Load Ronstrapp tracks when available
  loadTracks(trackList) {
    this.tracks = trackList;
    this.isGenerative = false;
    
    if (this.generativeOscs) {
      this.generativeOscs.forEach(osc => osc.stop());
    }
    
    this.initFileAudio();
  }
};

// Auto-init when DOM ready
document.addEventListener('DOMContentLoaded', () => {
  TappyMusicPlayer.init();
});

// Expose to window for debugging
window.TappyMusicPlayer = TappyMusicPlayer;
