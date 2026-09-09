/**
 * Game.js - Main Game Controller
 * Initializes and coordinates all game systems
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.state = 'menu';
        this.clock = new THREE.Clock();

        // Systems
        this.renderer = null;
        this.universe = null;
        this.player = null;
        this.audio = null;
        this.voxelShips = new VoxelShips();

        // Available ships
        this.availableShips = this.voxelShips.getAvailableShips();
        this.selectedShip = 'explorer'; // Default

        // Settings
        this.settings = {
            sound: true,
            music: true,
            invert: false,
            touch: true
        };

        // Gordon fleet (spawned in world)
        this.gordonFleet = [];

        // Bind methods
        this.animate = this.animate.bind(this);

        console.log('[Game] Controller initialized');
        console.log('[Game] Available ships:', this.availableShips.map(s => s.name).join(', '));
    }
    
    async init() {
        console.log('[Game] Initializing...');
        
        // Initialize renderer
        this.renderer = new GameRenderer(this.canvas);
        
        // Initialize audio
        this.audio = new GameAudio();
        await this.audio.init();
        
        // Create universe
        this.universe = new Universe(Math.random() * 100000);
        this.universe.generate();
        
        // Create player
        this.player = new Player(this.renderer.scene, this.renderer.camera);
        
        // Setup UI
        this.setupUI();
        
        // Start loop
        this.animate();
        
        console.log('[Game] Initialization complete');
    }
    
    setupUI() {
        // Menu buttons
        document.querySelector('.menuButton[data-action="new-game"]')?.addEventListener('click', () => {
            this.startGame();
        });
        
        document.querySelector('.menuButton[data-action="settings"]')?.addEventListener('click', () => {
            openSettings();
        });
        
        // Touch controls visibility
        if ('ontouchstart' in window) {
            document.getElementById('touchControls').style.display = 'block';
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                if (this.state === 'playing') {
                    this.pauseGame();
                } else if (this.state === 'paused') {
                    this.resumeGame();
                }
            }
            if (e.key.toLowerCase() === 'm') {
                this.toggleMap();
            }
        });
    }
    
    startGame() {
        console.log('[Game] Starting...');
        
        // Hide menu
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('loading').style.display = 'flex';
        
        // Update loading progress
        const progress = document.getElementById('loadingProgress');
        const loadingText = document.getElementById('loadingText');
        
        // Simulate loading
        let loadProgress = 0;
        const loadingInterval = setInterval(() => {
            loadProgress += 10;
            progress.style.width = loadProgress + '%';
            
            if (loadProgress === 30) {
                loadingText.textContent = 'Generating solar system...';
            } else if (loadProgress === 60) {
                loadingText.textContent = 'Spawning player ship...';
            } else if (loadProgress === 90) {
                loadingText.textContent = 'Spawning Gordon fleet...';

                // Spawn Gordon ships in the universe
                this.spawnGordonFleet();
            }

            if (loadProgress >= 100) {
                clearInterval(loadingInterval);
                
                // Hide loading, show HUD
                document.getElementById('loading').style.display = 'none';
                document.getElementById('hud').style.display = 'block';
                
                // Lock pointer
                this.canvas.requestPointerLock();
                
                // Set state
                this.state = 'playing';
                
                // Update system info
                this.updateSystemInfo();
                
                console.log('[Game] Started');
            }
        }, 100);
        
        // Play music
        if (this.settings.music) {
            this.audio.playMusic('space');
        }
    }
    
    pauseGame() {
        document.getElementById('mainMenu').style.display = 'flex';
        document.getElementById('hud').style.display = 'none';
        document.exitPointerLock();
        this.state = 'paused';
    }
    
    resumeGame() {
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('hud').style.display = 'block';
        this.canvas.requestPointerLock();
        this.state = 'playing';
    }
    
    toggleMap() {
        const map = document.getElementById('miniMap');
        map.style.display = map.style.display === 'none' ? 'block' : 'none';
    }
    
    updateSystemInfo() {
        const system = this.universe.getCurrentSystem();
        if (!system) return;
        
        document.getElementById('systemName').textContent = 
            `System-${system.seed.toString(36).substr(2, 6).toUpperCase()}`;
        document.getElementById('starType').textContent = system.star.name;
        document.getElementById('planetCount').textContent = system.planets.length;
        document.getElementById('universeType').textContent = this.universe.type.name;
    }
    
    updateHUD() {
        if (!this.player) return;
        
        const stats = this.player.getStats();
        
        document.getElementById('velocity').textContent = stats.velocity;
        document.getElementById('altitude').textContent = stats.altitude;
        document.getElementById('fuel').textContent = stats.fuel;
        document.getElementById('shield').textContent = stats.shield;
        document.getElementById('coords').textContent = stats.coords;
    }
    
    animate() {
        requestAnimationFrame(this.animate);
        
        const deltaTime = Math.min(this.clock.getDelta(), 0.1);
        
        if (this.state === 'playing') {
            // Update player
            if (this.player) {
                this.player.update(deltaTime);
                this.player.updateProjectiles(deltaTime);
                
                // Handle firing
                if (this.player.input.fire) {
                    this.player.fire();
                }
            }
            
            // Update renderer
            this.renderer.updateWarp(deltaTime);
            this.renderer.render();
            
            // Update mini map
            if (this.player && this.universe) {
                this.renderer.updateMiniMap(
                    this.player.position,
                    this.universe.getCurrentSystem()?.planets || []
                );
            }
            
            // Update HUD
            this.updateHUD();

            // Update Gordon fleet animation
            this.updateGordonFleet(deltaTime);
        }
    }

    /**
     * Spawn the Gordon fleet in the universe
     */
    spawnGordonFleet() {
        if (!this.voxelShips || !this.renderer) return;

        console.log('[Game] Spawning Gordon fleet...');

        // Spawn fleet near player but offset
        const playerPos = this.player ? this.player.position : new THREE.Vector3(0, 100, 500);
        const fleetCenter = playerPos.clone().add(new THREE.Vector3(500, 100, -300));

        this.gordonFleet = this.voxelShips.spawnGordonFleet(
            this.renderer.scene,
            5, // 5 Gordon ships
            fleetCenter
        );

        console.log(`[Game] Gordon fleet spawned: ${this.gordonFleet.length} ships`);
    }

    /**
     * Update Gordon fleet animations
     */
    updateGordonFleet(deltaTime) {
        this.gordonFleet.forEach((ship, index) => {
            if (!ship) return;

            // Gentle bobbing motion
            const time = Date.now() * 0.001;
            const offset = index * 1.5;

            ship.position.y += Math.sin(time + offset) * 0.5;

            // Slow rotation
            ship.rotation.y += deltaTime * 0.1;

            // Animate thruster glows
            if (ship.userData.thrusterGlows) {
                ship.userData.thrusterGlows.forEach(glow => {
                    const intensity = 0.5 + Math.sin(time * 3 + offset) * 0.2;
                    glow.material.opacity = intensity;
                    glow.scale.setScalar(1 + Math.sin(time * 2) * 0.1);
                });
            }
        });
    }

    saveGame() {
        const saveData = {
            timestamp: Date.now(),
            player: this.player.serialize(),
            universe: this.universe.serialize(),
            settings: this.settings
        };
        
        localStorage.setItem('nog_save', JSON.stringify(saveData));
        console.log('[Game] Saved');
    }
    
    loadGame() {
        const saveData = localStorage.getItem('nog_save');
        if (!saveData) return false;
        
        try {
            const data = JSON.parse(saveData);
            // Restore player position, resources, etc.
            console.log('[Game] Loaded');
            return true;
        } catch (e) {
            console.error('[Game] Load failed:', e);
            return false;
        }
    }
}

/**
 * GameAudio - Audio manager
 */
class GameAudio {
    constructor() {
        this.context = null;
        this.sounds = {};
        this.music = null;
        this.enabled = true;
    }
    
    async init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
            
            // Generate procedural sounds
            this.generateSounds();
            
            console.log('[Audio] Initialized');
        } catch (e) {
            console.error('[Audio] Init failed:', e);
        }
    }
    
    generateSounds() {
        // Laser sound
        this.sounds['laser'] = this.createTone(800, 0.1, 'sawtooth');
        
        // Engine sound
        this.sounds['engine'] = this.createNoise(0.3, 'lowpass');
        
        // Explosion
        this.sounds['explosion'] = this.createNoise(0.5, 'lowpass', true);
        
        // UI click
        this.sounds['click'] = this.createTone(1000, 0.05, 'sine');
    }
    
    createTone(freq, duration, type = 'sine') {
        return () => {
            if (!this.context) return;
            
            const osc = this.context.createOscillator();
            const gain = this.context.createGain();
            
            osc.type = type;
            osc.frequency.setValueAtTime(freq, this.context.currentTime);
            
            gain.gain.setValueAtTime(0.3, this.context.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
            
            osc.connect(gain);
            gain.connect(this.context.destination);
            
            osc.start();
            osc.stop(this.context.currentTime + duration);
        };
    }
    
    createNoise(duration, filterType = 'lowpass', fade = true) {
        return () => {
            if (!this.context) return;
            
            const bufferSize = this.context.sampleRate * duration;
            const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
            const data = buffer.getChannelData(0);
            
            for (let i = 0; i < bufferSize; i++) {
                data[i] = Math.random() * 2 - 1;
            }
            
            const noise = this.context.createBufferSource();
            noise.buffer = buffer;
            
            const filter = this.context.createBiquadFilter();
            filter.type = filterType;
            filter.frequency.value = 1000;
            
            const gain = this.context.createGain();
            gain.gain.value = 0.3;
            
            if (fade) {
                gain.gain.setValueAtTime(0.3, this.context.currentTime);
                gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
            }
            
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.context.destination);
            
            noise.start();
        };
    }
    
    play(soundName) {
        if (!this.enabled || !this.sounds[soundName]) return;
        this.sounds[soundName]();
    }
    
    playMusic(trackName) {
        // Procedural ambient music could go here
        console.log('[Audio] Playing music:', trackName);
    }
    
    stopMusic() {
        // Stop music
    }
}

// Initialize game on load
let game;
window.addEventListener('load', () => {
    game = new Game();
    
    // Auto-start if user clicks
    document.addEventListener('click', () => {
        if (!game.renderer) {
            game.init();
        }
    }, { once: true });
});

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Game, GameAudio };
}
