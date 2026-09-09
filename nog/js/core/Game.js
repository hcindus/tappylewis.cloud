/**
 * Game.js - Main Game Controller
 * Initializes and coordinates all game systems with Solar System Physics
 */

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.state = 'menu';
        this.clock = new THREE.Clock();

        // Systems
        this.renderer = null;
        this.universe = null;
        this.solarSystemManager = null;
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

        // Physics
        this.gravityEnabled = true;
        this.collisionEnabled = true;
        this.landingEnabled = true;
        
        // Game state
        this.playerDied = false;
        this.landingTarget = null;
        this.slingshotActive = false;

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
        
        // Create solar system manager for 100x100x100 voxel grid
        this.solarSystemManager = new SolarSystemManager(
            this.renderer.scene, 
            this.universe.seed
        );
        
        // Generate initial system at 0,0,0
        this.solarSystemManager.getSystemAt(0, 0, 0);
        
        // Create player with solar system manager
        this.player = new Player(this.renderer.scene, this.renderer.camera);
        this.player.solarSystemManager = this.solarSystemManager;
        
        // Position player near first planet
        this.player.position.set(400, 50, 0);
        
        // Generate nearby systems for exploration
        this.generateNearbySystems();
        
        // Setup UI
        this.setupUI();
        
        // Start loop
        this.animate();
        
        console.log('[Game] Initialization complete');
        console.log('[Game] Solar systems active at voxel coordinates');
    }
    
    /**
     * Generate solar systems at nearby 100x100x100 voxel coordinates
     */
    generateNearbySystems() {
        // Generate systems in a 3x3x3 grid around origin
        for (let x = -1; x <= 1; x++) {
            for (let y = -1; y <= 1; y++) {
                for (let z = -1; z <= 1; z++) {
                    if (x === 0 && y === 0 && z === 0) continue; // Skip origin (already generated)
                    this.solarSystemManager.getSystemAt(x * 100, y * 100, z * 100);
                }
            }
        }
        console.log('[Game] Generated nearby solar systems');
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
            if (e.key.toLowerCase() === 'l') {
                this.attemptLanding();
            }
            if (e.key.toLowerCase() === 't') {
                this.takeoff();
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
                loadingText.textContent = 'Generating solar systems...';
            } else if (loadProgress === 60) {
                loadingText.textContent = 'Calculating orbital mechanics...';
            } else if (loadProgress === 80) {
                loadingText.textContent = 'Spawning Gordon fleet...';
                this.spawnGordonFleet();
            } else if (loadProgress === 90) {
                loadingText.textContent = 'Initializing physics...';
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
                
                // Show help
                this.showMessage('Welcome to N\'og nog! Press L to land on planets. Avoid stars!', 5000);
                
                console.log('[Game] Started with solar systems and physics');
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
    
    /**
     * Attempt to land on a nearby planet
     */
    attemptLanding() {
        if (this.player.landed) {
            this.showMessage('Already landed. Press T to take off.', 3000);
            return;
        }
        
        const target = this.solarSystemManager.getLandingTarget(this.player.position);
        if (target && target.distance < 30 && this.player.velocity.length() < 50) {
            this.player.land(target);
            this.showMessage(`Landed on ${target.body.name}! Press T to take off.`, 3000);
            this.audio.play('ui_confirm');
        } else if (target) {
            this.showMessage(`Approach ${target.body.name} slowly for landing. Speed: ${Math.round(this.player.velocity.length())}`, 3000);
        } else {
            this.showMessage('No landing zone nearby. Find a planet.', 3000);
        }
    }
    
    /**
     * Take off from planet
     */
    takeoff() {
        if (!this.player.landed) {
            this.showMessage('Not landed on any surface.', 2000);
            return;
        }
        
        this.player.takeoff();
        this.showMessage('Liftoff! Thrusters engaged.', 3000);
        this.audio.play('engine');
    }
    
    /**
     * Show temporary message
     */
    showMessage(text, duration = 3000) {
        const msgDiv = document.createElement('div');
        msgDiv.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(0, 255, 136, 0.9);
            color: #000;
            padding: 20px 40px;
            border-radius: 5px;
            font-family: 'Courier New', monospace;
            font-weight: bold;
            z-index: 1000;
            pointer-events: none;
        `;
        msgDiv.textContent = text;
        document.body.appendChild(msgDiv);
        
        setTimeout(() => msgDiv.remove(), duration);
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
        
        // Check for slingshot opportunity
        const slingshot = this.checkSlingshot();
        if (slingshot && slingshot.available) {
            const indicator = document.getElementById('slingshotIndicator') || this.createSlingshotIndicator();
            indicator.style.display = 'block';
            indicator.textContent = `SLINGSHOT: ${Math.round(slingshot.efficiency * 100)}%`;
        } else {
            const indicator = document.getElementById('slingshotIndicator');
            if (indicator) indicator.style.display = 'none';
        }
    }
    
    createSlingshotIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'slingshotIndicator';
        indicator.style.cssText = `
            position: absolute;
            bottom: 250px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 200, 0, 0.8);
            color: #000;
            padding: 10px 20px;
            border-radius: 20px;
            font-weight: bold;
            display: none;
            z-index: 100;
        `;
        document.getElementById('hud').appendChild(indicator);
        return indicator;
    }
    
    checkSlingshot() {
        let bestSlingshot = null;
        
        this.solarSystemManager.systems.forEach(system => {
            const slingshot = system.calculateSlingshot(this.player.position, this.player.velocity);
            if (slingshot.available && (!bestSlingshot || slingshot.efficiency > bestSlingshot.efficiency)) {
                bestSlingshot = slingshot;
            }
        });
        
        return bestSlingshot;
    }
    
    animate() {
        requestAnimationFrame(this.animate);
        
        const deltaTime = Math.min(this.clock.getDelta(), 0.1);
        
        if (this.state === 'playing') {
            // Update solar systems (orbits, rotations)
            if (this.solarSystemManager) {
                this.solarSystemManager.update(deltaTime);
            }
            
            // Apply physics to player
            if (this.player && !this.player.landed) {
                this.applyPhysics(deltaTime);
                this.checkCollisions();
            }
            
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
            
            // Update mini map with celestial bodies
            if (this.player && this.solarSystemManager) {
                this.updateMiniMap();
            }
            
            // Update HUD
            this.updateHUD();

            // Update Gordon fleet animation
            this.updateGordonFleet(deltaTime);
            
            // Check if player died
            if (this.playerDied) {
                this.handlePlayerDeath();
            }
            
            // Generate new systems as player explores
            this.manageSystemGeneration();
        }
    }
    
    /**
     * Apply physics (gravity) to player
     */
    applyPhysics(deltaTime) {
        if (!this.gravityEnabled || !this.solarSystemManager) return;
        
        const gravity = this.solarSystemManager.calculateGravity(this.player.position, 1);
        
        // Apply gravitational force
        const acceleration = gravity.force.clone().multiplyScalar(deltaTime * 100);
        this.player.velocity.add(acceleration);
        
        // Apply slingshot if available
        if (this.slingshotActive && gravity.starDistance < 200) {
            this.solarSystemManager.systems.forEach(system => {
                const slingshot = system.calculateSlingshot(this.player.position, this.player.velocity);
                if (slingshot.available) {
                    const boost = slingshot.direction.clone().multiplyScalar(slingshot.boost * 500 * deltaTime);
                    this.player.velocity.add(boost);
                }
            });
        }
        
        // Check for star death zone
        if (gravity.inDeathZone) {
            this.playerDied = true;
        }
    }
    
    /**
     * Check for collisions with celestial bodies
     */
    checkCollisions() {
        if (!this.collisionEnabled || !this.solarSystemManager) return;
        
        const collisions = this.solarSystemManager.checkCollisions(this.player.position, 10);
        
        collisions.forEach(collision => {
            if (collision.fatal) {
                // Death by star or other fatal collision
                this.playerDied = true;
                this.showMessage('COLLISION DETECTED - SHIP DESTROYED', 5000);
            } else if (collision.type === 'planet' || collision.type === 'moon') {
                // Can land if slow enough
                if (collision.canLand && this.player.velocity.length() < 100) {
                    // Gentle bounce if not trying to land
                    const normal = collision.normal || new THREE.Vector3(0, 1, 0);
                    const bounce = normal.clone().multiplyScalar(50);
                    this.player.velocity.reflect(normal).multiplyScalar(0.3);
                    this.player.velocity.add(bounce);
                    
                    // Show landing prompt if very close
                    if (collision.distance < collision.body.radius + 30) {
                        this.showMessage(`Press L to land on ${collision.body.name}`, 2000);
                    }
                } else {
                    // Crash landing
                    this.player.shield -= 20;
                    this.player.velocity.reflect(collision.normal || new THREE.Vector3(0, 1, 0)).multiplyScalar(0.5);
                    this.audio.play('explosion');
                }
            } else if (collision.type === 'asteroid') {
                // Asteroid collision
                this.player.shield -= collision.damage || 10;
                const pushDir = new THREE.Vector3()
                    .subVectors(this.player.position, collision.body.mesh.position)
                    .normalize();
                this.player.velocity.add(pushDir.multiplyScalar(100));
                this.audio.play('hit');
            }
        });
        
        // Check shield depletion
        if (this.player.shield <= 0) {
            this.playerDied = true;
        }
    }
    
    /**
     * Handle player death
     */
    handlePlayerDeath() {
        this.playerDied = false;
        this.player.shield = 0;
        
        // Explosion effect
        this.audio.play('explosion');
        
        // Respawn
        setTimeout(() => {
            this.player.position.set(400, 50, 0);
            this.player.velocity.set(0, 0, 0);
            this.player.shield = 100;
            this.player.fuel = 100;
            this.player.landed = false;
            this.showMessage('Ship destroyed! Respawning...', 3000);
        }, 3000);
    }
    
    /**
     * Update mini map with celestial bodies
     */
    updateMiniMap() {
        const mapCanvas = document.getElementById('miniMapCanvas');
        if (!mapCanvas) return;
        
        const ctx = mapCanvas.getContext('2d');
        const w = mapCanvas.width;
        const h = mapCanvas.height;
        const cx = w / 2;
        const cy = h / 2;
        
        // Clear
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, w, h);
        
        // Scale factor
        const scale = 0.05;
        
        // Draw stars (centers of systems)
        this.solarSystemManager.systems.forEach(system => {
            const relX = (system.centerPosition.x - this.player.position.x) * scale;
            const relZ = (system.centerPosition.z - this.player.position.z) * scale;
            
            if (Math.abs(relX) < w/2 && Math.abs(relZ) < h/2) {
                // Star
                ctx.fillStyle = '#' + system.star.color.toString(16).padStart(6, '0');
                ctx.beginPath();
                ctx.arc(cx + relX, cy + relZ, 8, 0, Math.PI * 2);
                ctx.fill();
                
                // Glow
                const gradient = ctx.createRadialGradient(
                    cx + relX, cy + relZ, 2,
                    cx + relX, cy + relZ, 15
                );
                gradient.addColorStop(0, 'rgba(255, 200, 100, 0.5)');
                gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(cx + relX, cy + relZ, 15, 0, Math.PI * 2);
                ctx.fill();
                
                // Draw planets
                system.planets.forEach(planet => {
                    const px = (planet.mesh.position.x - this.player.position.x) * scale;
                    const pz = (planet.mesh.position.z - this.player.position.z) * scale;
                    
                    if (Math.abs(px) < w/2 && Math.abs(pz) < h/2) {
                        ctx.fillStyle = '#' + planet.color.toString(16).padStart(6, '0');
                        ctx.beginPath();
                        ctx.arc(cx + px, cy + pz, Math.max(2, planet.radius * scale * 0.1), 0, Math.PI * 2);
                        ctx.fill();
                    }
                });
            }
        });
        
        // Draw player
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(cx, cy, 4, 0, Math.PI * 2);
        ctx.fill();
        
        // Player direction
        const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.player.quaternion);
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + dir.x * 15, cy + dir.z * 15);
        ctx.stroke();
    }
    
    /**
     * Generate new solar systems as player explores
     */
    manageSystemGeneration() {
        if (!this.solarSystemManager || !this.player) return;
        
        const vx = Math.floor(this.player.position.x / 100);
        const vy = Math.floor(this.player.position.y / 100);
        const vz = Math.floor(this.player.position.z / 100);
        
        // Generate systems in a 2-voxel radius
        for (let x = vx - 2; x <= vx + 2; x++) {
            for (let y = vy - 2; y <= vy + 2; y++) {
                for (let z = vz - 2; z <= vz + 2; z++) {
                    this.solarSystemManager.getSystemAt(x * 100, y * 100, z * 100);
                }
            }
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
        
        // UI confirm
        this.sounds['ui_confirm'] = this.createTone(1500, 0.1, 'sine');
        
        // Hit
        this.sounds['hit'] = this.createNoise(0.1, 'highpass');
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
