// 🎵 Tappy's Online Music Player
// Autoplay at low volume with user controls

const TappyMusicPlayer = {
  audio: null,
  ctx: null,
  
  // Placeholder until Ronstrapp tracks are ready
  // Will be replaced with actual MP3 URLs
  tracks: [
    { name: 'Loading...', url: null }
  ],
  
  currentTrack: 0,
  isPlaying: false,
  volume: 20, // Default 20% (not too loud)
  isGenerative: true, // Use generative audio until tracks available

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
        <button id="tappy-play-btn" class="player-btn" title="Play/Pause">▶️</button>
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
    const volumeSlider = document.getElementById('tappy-volume');
    
    if (playBtn) {
      playBtn.addEventListener('click', () => this.toggle());
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
    this.audio.loop = true;
    this.audio.volume = this.volume / 100;
    
    if (this.tracks[0].url) {
      this.audio.src = this.tracks[0].url;
      document.getElementById('tappy-track-name').textContent = this.tracks[0].name;
    }
    
    // Try autoplay (may be blocked by browser)
    this.audio.play().catch(() => {
      console.log('Autoplay blocked - waiting for user interaction');
      this.isPlaying = false;
    }).then(() => {
      this.isPlaying = true;
      this.updateUI();
      this.startVisualizer();
    });
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
