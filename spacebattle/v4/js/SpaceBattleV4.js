/**
 * SpaceBattle v4.0 - Universal Explorer
 * Features: Solar System Generation, Terrain, Physics, Landing, Enhanced Minimap
 * Based on: SpaceBattle v3 architecture with N'og nog style voxel universe
 */

class SpaceBattleV4 {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.clock = new THREE.Clock();
        
        this.state = 'menu';
        
        // 100x100x100 Grid Universe
        this.gridSize = 100;
        this.grid = new Map();
        this.currentGridPos = { x: 50, y: 50, z: 50 };
        this.universeSeed = Math.random() * 100000;
        
        // Entities
        this.player = null;
        this.aiShips = [];
        this.celestialBodies = [];
        this.bullets = [];
        this.particles = [];
        this.asteroids = [];
        this.starField = null;
        
        // Camera
        this.cameraMode = 'third';
        
        // Game state
        this.score = 0;
        this.kills = 0;
        this.wave = 1;
        this.startTime = 0;
        
        // Input
        this.keys = {};
        this.mouse = { x: 0, y: 0, dx: 0, dy: 0 };
        this.joystick = { active: false, x: 0, y: 0 };
        
        // Audio
        this.audioContext = null;
        this.sounds = {};
        this.engineOscillator = null;
        this.engineGain = null;
        
        this.setupInput();
        this.initAudio();
        
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000005);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.generateSounds();
            this.initEngineSound();
        } catch(e) {
            console.warn('Audio not available');
        }
    }
    
    generateSounds() {
        // Laser
        this.sounds.laser = () => {
            if (!this.audioContext) return;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.1);
            gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.1);
        };
        
        // Explosion
        this.sounds.explosion = () => {
            if (!this.audioContext) return;
            const bufferSize = this.audioContext.sampleRate * 0.3;
            const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
            const data = buffer.getChannelData(0);
            for (let i = 0; i < bufferSize; i++) {
                data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
            }
            const noise = this.audioContext.createBufferSource();
            noise.buffer = buffer;
            const filter = this.audioContext.createBiquadFilter();
            filter.type = 'lowpass';
            filter.frequency.value = 1000;
            const gain = this.audioContext.createGain();
            gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            noise.connect(filter);
            filter.connect(gain);
            gain.connect(this.audioContext.destination);
            noise.start();
        };
        
        // Shield hit
        this.sounds.shieldHit = () => {
            if (!this.audioContext) return;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(400, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.15);
            gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.15);
        };
        
        // Thrust burst
        this.sounds.thrust = () => {
            if (!this.audioContext) return;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            const filter = this.audioContext.createBiquadFilter();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(80, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(60, this.audioContext.currentTime + 0.1);
            filter.type = 'lowpass';
            filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
            gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            osc.connect(filter);
            filter.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.1);
        };
        
        // Slingshot boost
        this.sounds.slingshot = () => {
            if (!this.audioContext) return;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(200, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(600, this.audioContext.currentTime + 0.3);
            gain.gain.setValueAtTime(0.4, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.5);
        };
        
        // Landing sound
        this.sounds.landing = () => {
            if (!this.audioContext) return;
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
            osc.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.3);
            gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
            osc.connect(gain);
            gain.connect(this.audioContext.destination);
            osc.start();
            osc.stop(this.audioContext.currentTime + 0.3);
        };
    }
    
    initEngineSound() {
        if (!this.audioContext) return;
        this.engineOscillator = this.audioContext.createOscillator();
        this.engineGain = this.audioContext.createGain();
        const filter = this.audioContext.createBiquadFilter();
        
        this.engineOscillator.type = 'sawtooth';
        this.engineOscillator.frequency.value = 40;
        filter.type = 'lowpass';
        filter.frequency.value = 200;
        this.engineGain.gain.value = 0;
        
        this.engineOscillator.connect(filter);
        filter.connect(this.engineGain);
        this.engineGain.connect(this.audioContext.destination);
        this.engineOscillator.start();
    }
    
    updateEngineSound(thrust) {
        if (!this.engineGain) return;
        const targetVolume = thrust > 0 ? 0.1 : 0.02;
        this.engineGain.gain.setTargetAtTime(targetVolume, this.audioContext.currentTime, 0.1);
    }
    
    setupInput() {
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space' && this.player) this.player.fire();
            if (e.code === 'KeyL') this.player?.toggleLanding();
            if (e.code === 'KeyV') this.toggleCamera();
            if (e.code === 'KeyM') this.toggleMap();
            if (e.code === 'KeyQ' && this.player) this.player.rollLeft = true;
            if (e.code === 'KeyE') this.player?.rollRight = true;
            if (e.code === 'Escape') this.togglePause();
        });
        
        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            if (e.code === 'KeyQ') this.player && (this.player.rollLeft = false);
            if (e.code === 'KeyE') this.player && (this.player.rollRight = false);
        });
        
        window.addEventListener('mousemove', (e) => {
            this.mouse.dx = (e.clientX / window.innerWidth) * 2 - 1 - this.mouse.x;
            this.mouse.dy = (e.clientY / window.innerHeight) * 2 - 1 - this.mouse.y;
            this.mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = (e.clientY / window.innerHeight) * 2 - 1;
        });
        
        window.addEventListener('resize', () => this.onResize());
    }
    
    async start() {
        document.getElementById('landingPage').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        document.getElementById('hud').style.display = 'block';
        
        this.createStarField();
        
        // Setup Dual Systems lighting (preserved from v3)
        this.setupLighting();
        
        // Generate universe
        this.generateGridCell(this.currentGridPos.x, this.currentGridPos.y, this.currentGridPos.z);
        
        // Create player
        this.player = new PlayerShip(this.scene, this);
        
        // Spawn enemies
        this.spawnAIShips(5);
        
        this.startTime = Date.now();
        this.state = 'playing';
        
        if (this.audioContext?.state === 'suspended') {
            await this.audioContext.resume();
        }
        
        this.animate();
    }
    
    createStarField() {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        
        for (let i = 0; i < 8000; i++) {
            const x = (Math.random() - 0.5) * 10000;
            const y = (Math.random() - 0.5) * 10000;
            const z = (Math.random() - 0.5) * 10000;
            positions.push(x, y, z);
            
            const temp = Math.random();
            if (temp < 0.6) {
                colors.push(1, 1, 0.95);
            } else if (temp < 0.8) {
                colors.push(1, 0.8, 0.6);
            } else if (temp < 0.95) {
                colors.push(0.7, 0.8, 1);
            } else {
                colors.push(1, 0.9, 0.7);
            }
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: true
        });
        
        this.starField = new THREE.Points(geometry, material);
        this.starField.renderOrder = -1000;
        this.scene.add(this.starField);
    }
    
    setupLighting() {
        // Ambient (preserved from v3)
        this.ambientLight = new THREE.AmbientLight(0x111122, 0.3);
        this.scene.add(this.ambientLight);
        
        // Sun 1 - Warm (preserved from v3)
        this.sun1Light = new THREE.PointLight(0xffaa44, 2, 2000);
        this.sun1Light.position.set(-400, 200, -400);
        this.sun1Light.castShadow = true;
        this.scene.add(this.sun1Light);
        
        // Sun 2 - Cool (preserved from v3)
        this.sun2Light = new THREE.PointLight(0x44aaff, 1.5, 2000);
        this.sun2Light.position.set(400, -100, 400);
        this.sun2Light.castShadow = true;
        this.scene.add(this.sun2Light);
    }
    
    generateGridCell(gx, gy, gz) {
        const key = `${gx},${gy},${gz}`;
        if (this.grid.has(key)) return this.grid.get(key);
        
        const seed = gx * 73856093 ^ gy * 19349663 ^ gz * 83492791;
        const rng = new SeededRandom(seed);
        
        const system = new GridSolarSystem(gx, gy, gz, rng, this.scene, this);
        this.grid.set(key, system);
        
        this.celestialBodies.push(system.sun);
        system.planets.forEach(p => {
            this.celestialBodies.push(p);
            p.moons.forEach(m => this.celestialBodies.push(m));
        });
        system.asteroids.forEach(a => {
            this.celestialBodies.push(a);
            this.asteroids.push(a);
        });
        
        return system;
    }
    
    spawnAIShips(count) {
        for (let i = 0; i < count; i++) {
            const types = ['fighter', 'heavy', 'gordon'];
            const type = types[Math.floor(Math.random() * types.length)];
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 200 - 100
            );
            const ai = new AIShip(this.scene, this, type, offset);
            this.aiShips.push(ai);
        }
    }
    
    animate() {
        if (this.state !== 'playing') return;
        
        requestAnimationFrame(() => this.animate());
        
        const delta = Math.min(this.clock.getDelta(), 0.1);
        
        // Update celestial bodies (orbits)
        this.celestialBodies.forEach(body => {
            if (body.updateOrbit) body.updateOrbit(delta);
        });
        
        // Update player
        if (this.player) {
            const thrust = this.player.update(delta, this.keys, this.mouse, this.joystick);
            this.updateEngineSound(thrust);
            this.updateCamera();
            this.updateHUD();
            this.updateMinimap();
        }
        
        // Update AI ships
        this.aiShips.forEach(ai => ai.update(delta, this.player));
        this.aiShips = this.aiShips.filter(ai => ai.hull > 0);
        
        // Update bullets
        this.bullets.forEach(b => b.update(delta));
        this.bullets = this.bullets.filter(b => b.life > 0);
        
        // Update particles
        this.particles.forEach(p => p.update(delta));
        this.particles = this.particles.filter(p => p.life > 0);
        
        // Check wave completion
        if (this.aiShips.length === 0) {
            this.wave++;
            this.spawnAIShips(3 + this.wave * 2);
        }
        
        this.renderer.render(this.scene, this.camera);
        
        this.mouse.dx = 0;
        this.mouse.dy = 0;
    }
    
    updateCamera() {
        if (!this.player) return;
        
        const targetPos = this.player.mesh.position.clone();
        let offset;
        
        switch(this.cameraMode) {
            case 'first':
                offset = new THREE.Vector3(0, 2, 5);
                break;
            case 'top':
                offset = new THREE.Vector3(0, 80, 0);
                break;
            default: // third
                offset = new THREE.Vector3(0, 15, 40);
        }
        
        offset.applyQuaternion(this.player.mesh.quaternion);
        this.camera.position.lerp(targetPos.clone().add(offset), 0.1);
        this.camera.lookAt(targetPos);
    }
    
    updateHUD() {
        if (!this.player) return;
        
        // Sector
        document.getElementById('sectorDisplay').textContent = `${this.currentGridPos.x}-${this.currentGridPos.y}-${this.currentGridPos.z}`;
        
        // Coords
        const pos = this.player.mesh.position;
        document.getElementById('coordsDisplay').textContent = `${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)}`;
        
        // Velocity
        const speed = Math.round(this.player.velocity.length());
        const velEl = document.getElementById('velocityDisplay');
        velEl.textContent = `${speed} m/s`;
        velEl.className = speed > 1 ? 'hudValue good' : 'hudValue';
        
        // Slingshot efficiency
        const slingEl = document.getElementById('slingshotDisplay');
        if (slingEl) {
            const eff = Math.round(this.player.slingshotEfficiency);
            slingEl.textContent = `SLING: ${eff}%`;
            slingEl.style.display = eff > 0 ? 'block' : 'none';
        }
        
        // Landing status
        const landEl = document.getElementById('landingDisplay');
        if (landEl) {
            landEl.textContent = this.player.landed ? 'LANDED' : 'FLIGHT';
            landEl.className = this.player.landed ? 'hudValue good' : 'hudValue';
        }
        
        // Time
        const elapsed = Math.floor((Date.now() - this.startTime) / 1000);
        const mins = Math.floor(elapsed / 60).toString().padStart(2, '0');
        const secs = (elapsed % 60).toString().padStart(2, '0');
        document.getElementById('timeDisplay').textContent = `${mins}:${secs}`;
        
        // Score
        document.getElementById('scoreDisplay').textContent = this.score;
        document.getElementById('killsDisplay').textContent = this.kills;
        document.getElementById('waveDisplay').textContent = this.wave;
        
        // Bars
        document.getElementById('shieldBar').style.width = `${(this.player.shield / this.player.maxShield) * 100}%`;
        document.getElementById('shieldValue').textContent = `${Math.round((this.player.shield / this.player.maxShield) * 100)}%`;
        
        document.getElementById('hullBar').style.width = `${(this.player.hull / this.player.maxHull) * 100}%`;
        document.getElementById('hullValue').textContent = `${Math.round((this.player.hull / this.player.maxHull) * 100)}%`;
        
        document.getElementById('heatBar').style.width = `${this.player.weaponHeat}%`;
        document.getElementById('heatValue').textContent = `${Math.round(this.player.weaponHeat)}%`;
        
        // Fuel bar
        const fuelBar = document.getElementById('fuelBar');
        const fuelValue = document.getElementById('fuelValue');
        if (fuelBar && fuelValue) {
            fuelBar.style.width = `${(this.player.fuel / this.player.maxFuel) * 100}%`;
            fuelValue.textContent = `${Math.round((this.player.fuel / this.player.maxFuel) * 100)}%`;
        }
    }
    
    updateMinimap() {
        const canvas = document.getElementById('miniMapCanvas');
        if (!canvas || canvas.style.display === 'none') return;
        
        const ctx = canvas.getContext('2d');
        const w = canvas.width = canvas.clientWidth;
        const h = canvas.height = canvas.clientHeight;
        
        // Clear
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, w, h);
        
        // Draw suns with glow
        this.celestialBodies.forEach(body => {
            if (body.type === 'star') {
                const x = w/2 + (body.mesh.position.x - this.player.mesh.position.x) * 0.02;
                const y = h/2 + (body.mesh.position.z - this.player.mesh.position.z) * 0.02;
                
                // Glow effect
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, 15);
                gradient.addColorStop(0, body.glowColor || '#ffaa44');
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, 15, 0, Math.PI*2);
                ctx.fill();
                
                // Core
                ctx.fillStyle = body.color || '#ffaa44';
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, Math.PI*2);
                ctx.fill();
            }
        });
        
        // Draw planets
        this.celestialBodies.forEach(body => {
            if (body.type === 'planet') {
                const x = w/2 + (body.mesh.position.x - this.player.mesh.position.x) * 0.05;
                const y = h/2 + (body.mesh.position.z - this.player.mesh.position.z) * 0.05;
                ctx.fillStyle = body.minimapColor || '#88ccff';
                ctx.beginPath();
                ctx.arc(x, y, 3, 0, Math.PI*2);
                ctx.fill();
            }
        });
        
        // Draw moons (smaller)
        this.celestialBodies.forEach(body => {
            if (body.type === 'moon') {
                const x = w/2 + (body.mesh.position.x - this.player.mesh.position.x) * 0.08;
                const y = h/2 + (body.mesh.position.z - this.player.mesh.position.z) * 0.08;
                ctx.fillStyle = '#aaaaaa';
                ctx.beginPath();
                ctx.arc(x, y, 1.5, 0, Math.PI*2);
                ctx.fill();
            }
        });
        
        // Draw enemies (red)
        this.aiShips.forEach(ai => {
            const x = w/2 + (ai.mesh.position.x - this.player.mesh.position.x) * 0.1;
            const y = h/2 + (ai.mesh.position.z - this.player.mesh.position.z) * 0.1;
            ctx.fillStyle = '#ff4444';
            ctx.beginPath();
            ctx.arc(x, y, 3, 0, Math.PI*2);
            ctx.fill();
        });
        
        // Draw player (green) - center
        ctx.fillStyle = '#00ff88';
        ctx.beginPath();
        ctx.arc(w/2, h/2, 4, 0, Math.PI*2);
        ctx.fill();
        
        // Draw player direction
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w/2, h/2);
        ctx.lineTo(
            w/2 - Math.sin(this.player.mesh.rotation.y) * 10,
            h/2 - Math.cos(this.player.mesh.rotation.y) * 10
        );
        ctx.stroke();
    }
    
    toggleCamera() {
        const modes = ['third', 'first', 'top'];
        const labels = ['3RD', '1ST', 'TOP'];
        const idx = modes.indexOf(this.cameraMode);
        this.cameraMode = modes[(idx + 1) % modes.length];
        
        const camDisplay = document.getElementById('cameraDisplay');
        if (camDisplay) camDisplay.textContent = labels[(idx + 1) % modes.length];
    }
    
    toggleMap() {
        const map = document.getElementById('miniMap');
        map.style.display = map.style.display === 'none' ? 'block' : 'none';
    }
    
    togglePause() {
        this.state = this.state === 'playing' ? 'paused' : 'playing';
        if (this.state === 'playing') this.animate();
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

// Seeded Random
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
}

// Simplex-like Noise for terrain
class SimplexNoise {
    constructor(seed = 0) {
        this.p = new Uint8Array(256);
        this.perm = new Uint8Array(512);
        this.permMod12 = new Uint8Array(512);
        for (let i = 0; i < 256; i++) this.p[i] = i;
        
        // Shuffle with seed
        let s = seed;
        for (let i = 255; i > 0; i--) {
            s = (s * 16807) % 2147483647;
            const j = s % (i + 1);
            [this.p[i], this.p[j]] = [this.p[j], this.p[i]];
        }
        
        for (let i = 0; i < 512; i++) {
            this.perm[i] = this.p[i & 255];
            this.permMod12[i] = this.perm[i] % 12;
        }
    }
    
    noise3D(x, y, z) {
        // Simplified 3D noise
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;
        
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);
        
        const u = x * x * (3 - 2 * x);
        const v = y * y * (3 - 2 * y);
        const w = z * z * (3 - 2 * z);
        
        const A = this.perm[X] + Y;
        const AA = this.perm[A] + Z;
        const AB = this.perm[A + 1] + Z;
        const B = this.perm[X + 1] + Y;
        const BA = this.perm[B] + Z;
        const BB = this.perm[B + 1] + Z;
        
        return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.perm[AA], x, y, z),
            this.grad(this.perm[BA], x - 1, y, z)),
            this.lerp(u, this.grad(this.perm[AB], x, y - 1, z),
            this.grad(this.perm[BB], x - 1, y - 1, z))),
            this.lerp(v, this.lerp(u, this.grad(this.perm[AA + 1], x, y, z - 1),
            this.grad(this.perm[BA + 1], x - 1, y, z - 1)),
            this.lerp(u, this.grad(this.perm[AB + 1], x, y - 1, z - 1),
            this.grad(this.perm[BB + 1], x - 1, y - 1, z - 1))));
    }
    
    lerp(t, a, b) { return a + t * (b - a); }
    grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
}

// Player Ship
class PlayerShip {
    constructor(scene, game) {
        this.scene = scene;
        this.game = game;
        
        this.maxShield = 100;
        this.maxHull = 100;
        this.shield = 100;
        this.hull = 100;
        this.weaponHeat = 0;
        this.lastFireTime = 0;
        this.fireRate = 150;
        
        // Fuel system
        this.maxFuel = 100;
        this.fuel = 100;
        this.fuelConsumption = 5;
        
        this.velocity = new THREE.Vector3();
        this.maxSpeed = 80;
        this.acceleration = 40;
        this.rotationSpeed = 2;
        
        this.thrustPlaying = false;
        this.rollLeft = false;
        this.rollRight = false;
        
        // Landing system
        this.landed = false;
        this.landedBody = null;
        this.landingOffset = new THREE.Vector3();
        
        // Slingshot
        this.slingshotEfficiency = 0;
        this.nearStar = false;
        
        // Dual Systems gravity sources
        this.gravitySources = [
            { position: new THREE.Vector3(-400, 200, -400), strength: 50000, radius: 50 },
            { position: new THREE.Vector3(400, -100, 400), strength: 35000, radius: 40 }
        ];
        
        this.mesh = this.createVoxelShip();
        scene.add(this.mesh);
    }
    
    createVoxelShip() {
        const group = new THREE.Group();
        
        const hullMat = new THREE.MeshPhongMaterial({ 
            color: 0x4488ff,
            emissive: 0x112244,
            shininess: 100
        });
        
        const body = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 8), hullMat);
        group.add(body);
        
        const cockpit = new THREE.Mesh(
            new THREE.BoxGeometry(2.5, 1.5, 3),
            new THREE.MeshPhongMaterial({ 
                color: 0x88ccff,
                transparent: true,
                opacity: 0.7
            })
        );
        cockpit.position.set(0, 2, -1);
        group.add(cockpit);
        
        const engineMat = new THREE.MeshPhongMaterial({ 
            color: 0xff6600,
            emissive: 0xff2200,
            emissiveIntensity: 0.5
        });
        
        const leftEngine = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 4), engineMat);
        leftEngine.position.set(-3, 0, 2);
        group.add(leftEngine);
        
        const rightEngine = new THREE.Mesh(new THREE.BoxGeometry(2, 2, 4), engineMat);
        rightEngine.position.set(3, 0, 2);
        group.add(rightEngine);
        
        const wingMat = new THREE.MeshPhongMaterial({ color: 0x3366aa });
        const wings = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 4), wingMat);
        wings.position.set(0, 0, 1);
        group.add(wings);
        
        this.engineGlow = new THREE.Mesh(
            new THREE.SphereGeometry(2, 8, 8),
            new THREE.MeshBasicMaterial({ 
                color: 0x4488ff,
                transparent: true,
                opacity: 0.4
            })
        );
        this.engineGlow.position.set(0, 0, 5);
        group.add(this.engineGlow);
        
        return group;
    }
    
    update(delta, keys, mouse, joystick) {
        if (this.landed) {
            // Handle landed state
            if (keys['KeyL']) {
                this.takeOff();
            }
            // Regenerate fuel while landed
            if (this.fuel < this.maxFuel) {
                this.fuel += delta * 10;
            }
            return 0;
        }
        
        // Rotation
        this.mesh.rotation.y -= mouse.dx * 2;
        this.mesh.rotation.x = Math.max(-0.5, Math.min(0.5, this.mesh.rotation.x + mouse.dy));
        
        // Roll with Q/E
        if (this.rollLeft) {
            this.mesh.rotation.z += delta * this.rotationSpeed;
        }
        if (this.rollRight) {
            this.mesh.rotation.z -= delta * this.rotationSpeed;
        }
        
        // Thrust
        let thrust = 0;
        if (keys['KeyW'] || (joystick.active && joystick.y < -0.3)) thrust = 1;
        if (keys['KeyS'] || (joystick.active && joystick.y > 0.3)) thrust = -0.5;
        
        // Boost with Shift (slingshot)
        let boost = 1;
        if (keys['ShiftLeft'] || keys['ShiftRight']) {
            boost = this.checkSlingshot();
        } else {
            this.slingshotEfficiency = 0;
        }
        
        // Apply thrust
        if (thrust !== 0 && this.fuel > 0) {
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyQuaternion(this.mesh.quaternion);
            this.velocity.add(forward.multiplyScalar(this.acceleration * thrust * boost * delta));
            this.engineGlow.scale.setScalar(1 + thrust * 0.3 + Math.random() * 0.1);
            this.fuel -= this.fuelConsumption * thrust * delta;
            
            if (!this.thrustPlaying && this.game.sounds.thrust) {
                this.game.sounds.thrust();
                this.thrustPlaying = true;
                setTimeout(() => { this.thrustPlaying = false; }, 150);
            }
        } else {
            this.engineGlow.scale.setScalar(1);
            this.thrustPlaying = false;
        }
        
        // Apply drag
        this.velocity.multiplyScalar(0.98);
        
        // Max speed cap
        const speed = this.velocity.length();
        if (speed > this.maxSpeed * boost) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed * boost);
        }
        
        // Gravity and collision
        this.applyGravity(delta);
        this.checkCollisions();
        
        // Move
        this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));
        
        // Check grid boundaries
        this.checkGridTransition();
        
        // Landing check
        if (keys['KeyL']) {
            this.attemptLanding();
        }
        
        // Regenerate shield
        if (this.shield < this.maxShield) {
            this.shield += delta * 5;
        }
        
        // Cool weapon
        if (this.weaponHeat > 0) {
            this.weaponHeat -= delta * 50;
        }
        
        return thrust;
    }
    
    checkSlingshot() {
        let maxEfficiency = 0;
        this.gravitySources.forEach(source => {
            const dist = this.mesh.position.distanceTo(source.position);
            const starRadius = source.radius || 50;
            if (dist < starRadius * 8 && dist > starRadius * 1.5) {
                // Calculate efficiency based on proximity and velocity angle
                const toStar = source.position.clone().sub(this.mesh.position).normalize();
                const velocityDir = this.velocity.clone().normalize();
                const dot = toStar.dot(velocityDir);
                // Best efficiency when flying tangent to star (perpendicular)
                const efficiency = Math.abs(dot) < 0.5 ? (1 - dist / (starRadius * 8)) * 100 : 0;
                maxEfficiency = Math.max(maxEfficiency, efficiency);
                
                if (efficiency > 50) {
                    // Apply slingshot boost
                    const boostDir = velocityDir.clone().add(toStar.clone().multiplyScalar(0.5)).normalize();
                    this.velocity.add(boostDir.multiplyScalar(50 * delta));
                    this.game.sounds.slingshot?.();
                }
            }
        });
        this.slingshotEfficiency = maxEfficiency;
        return maxEfficiency > 50 ? 2 : 1;
    }
    
    applyGravity(delta) {
        // Star gravity
        this.gravitySources.forEach(source => {
            const dist = this.mesh.position.distanceTo(source.position);
            if (dist < 800) {
                const force = source.strength / (dist * dist);
                const dir = source.position.clone().sub(this.mesh.position).normalize();
                this.velocity.add(dir.multiplyScalar(force * delta * 0.1));
            }
        });
        
        // Planet gravity
        this.game.celestialBodies.forEach(body => {
            if (body.type === 'planet' || body.type === 'moon') {
                const dist = this.mesh.position.distanceTo(body.mesh.position);
                const radius = body.mesh.geometry.parameters.radius;
                if (dist < radius * 10) {
                    const mass = radius * radius * radius * 0.01;
                    const force = mass / (dist * dist);
                    const dir = body.mesh.position.clone().sub(this.mesh.position).normalize();
                    this.velocity.add(dir.multiplyScalar(force * delta * 0.5));
                }
            }
        });
    }
    
    checkCollisions() {
        // Star death
        this.gravitySources.forEach(source => {
            const dist = this.mesh.position.distanceTo(source.position);
            if (dist < (source.radius || 50)) {
                this.hull = 0;
                this.game.sounds.explosion?.();
            }
        });
        
        // Planet/Moon collision
        this.game.celestialBodies.forEach(body => {
            if (body.type === 'planet' || body.type === 'moon') {
                const dist = this.mesh.position.distanceTo(body.mesh.position);
                const radius = body.mesh.geometry.parameters.radius;
                if (dist < radius + 5) {
                    const speed = this.velocity.length();
                    if (speed > 50) {
                        // Bounce
                        const normal = this.mesh.position.clone().sub(body.mesh.position).normalize();
                        this.velocity.reflect(normal).multiplyScalar(0.5);
                        this.takeDamage(speed * 0.5);
                    }
                }
            }
        });
        
        // Asteroid collision
        this.game.asteroids.forEach(asteroid => {
            const dist = this.mesh.position.distanceTo(asteroid.mesh.position);
            if (dist < 8) {
                const normal = this.mesh.position.clone().sub(asteroid.mesh.position).normalize();
                this.velocity.add(normal.multiplyScalar(20));
                this.takeDamage(10);
            }
        });
    }
    
    attemptLanding() {
        // Find nearest planet/moon
        let nearest = null;
        let nearestDist = Infinity;
        
        this.game.celestialBodies.forEach(body => {
            if (body.type === 'planet' || body.type === 'moon') {
                const dist = this.mesh.position.distanceTo(body.mesh.position);
                if (dist < nearestDist) {
                    nearestDist = dist;
                    nearest = body;
                }
            }
        });
        
        if (nearest) {
            const radius = nearest.mesh.geometry.parameters.radius;
            const speed = this.velocity.length();
            
            // Landing requirements: within 50 units of surface and under 50 m/s
            if (nearestDist < radius + 50 && nearestDist > radius + 5 && speed < 50) {
                this.land(nearest);
            }
        }
    }
    
    land(body) {
        this.landed = true;
        this.landedBody = body;
        this.velocity.set(0, 0, 0);
        
        // Calculate landing offset from body center
        this.landingOffset = this.mesh.position.clone().sub(body.mesh.position);
        
        // Align to surface normal
        const normal = this.landingOffset.clone().normalize();
        const up = new THREE.Vector3(0, 1, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(up, normal);
        this.mesh.quaternion.copy(quaternion);
        
        this.game.sounds.landing?.();
    }
    
    takeOff() {
        this.landed = false;
        this.landedBody = null;
        // Push up from surface
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.mesh.quaternion);
        this.velocity.add(up.multiplyScalar(30));
        this.game.sounds.thrust?.();
    }
    
    toggleLanding() {
        if (this.landed) {
            this.takeOff();
        } else {
            this.attemptLanding();
        }
    }
    
    checkGridTransition() {
        const threshold = 450;
        let dx = 0, dy = 0, dz = 0;
        
        if (this.mesh.position.x > threshold) dx = 1;
        else if (this.mesh.position.x < -threshold) dx = -1;
        
        if (this.mesh.position.y > threshold) dy = 1;
        else if (this.mesh.position.y < -threshold) dy = -1;
        
        if (this.mesh.position.z > threshold) dz = 1;
        else if (this.mesh.position.z < -threshold) dz = -1;
        
        if (dx !== 0 || dy !== 0 || dz !== 0) {
            this.game.currentGridPos.x += dx;
            this.game.currentGridPos.y += dy;
            this.game.currentGridPos.z += dz;
            
            this.game.generateGridCell(
                this.game.currentGridPos.x,
                this.game.currentGridPos.y,
                this.game.currentGridPos.z
            );
            
            this.mesh.position.x -= dx * threshold * 2;
            this.mesh.position.y -= dy * threshold * 2;
            this.mesh.position.z -= dz * threshold * 2;
            
            this.game.aiShips.forEach(ai => {
                this.game.scene.remove(ai.mesh);
            });
            this.game.aiShips = [];
            this.game.spawnAIShips(5);
        }
    }
    
    fire() {
        if (this.weaponHeat >= 100) return;
        if (Date.now() - this.lastFireTime < this.fireRate) return;
        
        this.lastFireTime = Date.now();
        this.weaponHeat += 15;
        
        const pos = this.mesh.position.clone();
        pos.y += 1;
        
        const bullet = new Bullet(this.scene, pos, this.mesh.quaternion, 200, 25, true);
        this.game.bullets.push(bullet);
        this.game.sounds.laser?.();
    }
    
    takeDamage(amount) {
        if (this.shield > 0) {
            this.shield -= amount;
            if (this.shield < 0) {
                this.hull += this.shield;
                this.shield = 0;
            }
            this.game.sounds.shieldHit?.();
        } else {
            this.hull -= amount;
        }
    }
}

// AI Ship
class AIShip {
    constructor(scene, game, type, offset) {
        this.scene = scene;
        this.game = game;
        this.type = type;
        
        this.maxShield = type === 'gordon' ? 150 : type === 'fighter' ? 75 : 100;
        this.maxHull = type === 'gordon' ? 200 : type === 'fighter' ? 100 : 150;
        this.shield = this.maxShield;
        this.hull = this.maxHull;
        
        this.velocity = new THREE.Vector3();
        this.maxSpeed = type === 'fighter' ? 90 : 70;
        this.acceleration = 30;
        
        this.lastFireTime = 0;
        this.fireRate = type === 'gordon' ? 400 : 800;
        
        this.mesh = this.createShip();
        this.mesh.position.copy(offset);
        scene.add(this.mesh);
    }
    
    createShip() {
        const group = new THREE.Group();
        
        const colors = {
            fighter: 0xff4444,
            heavy: 0xff8800,
            gordon: 0xff00ff
        };
        
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2, 6),
            new THREE.MeshPhongMaterial({ color: colors[this.type] || 0xff4444 })
        );
        group.add(body);
        
        return group;
    }
    
    update(delta, player) {
        if (!player || this.hull <= 0) return;
        
        const toPlayer = player.mesh.position.clone().sub(this.mesh.position);
        const dist = toPlayer.length();
        
        if (dist > 50) {
            toPlayer.normalize().multiplyScalar(this.acceleration * delta);
            this.velocity.add(toPlayer);
        }
        
        if (dist < 300 && Date.now() - this.lastFireTime > this.fireRate) {
            this.fire();
        }
        
        if (this.velocity.length() > this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }
        
        this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));
        this.mesh.lookAt(player.mesh.position);
    }
    
    fire() {
        this.lastFireTime = Date.now();
        const bullet = new Bullet(
            this.scene,
            this.mesh.position.clone(),
            this.mesh.quaternion,
            150,
            15,
            false
        );
        this.game.bullets.push(bullet);
    }
}

// Bullet
class Bullet {
    constructor(scene, position, quaternion, speed, damage, isPlayer) {
        this.scene = scene;
        this.velocity = new THREE.Vector3(0, 0, -speed);
        this.velocity.applyQuaternion(quaternion);
        this.damage = damage;
        this.isPlayer = isPlayer;
        this.life = 3;
        
        const geometry = new THREE.SphereGeometry(0.5, 8, 8);
        const material = new THREE.MeshBasicMaterial({ 
            color: isPlayer ? 0x00ff00 : 0xff0000 
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
        scene.add(this.mesh);
    }
    
    update(delta) {
        this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));
        this.life -= delta;
        
        if (this.life <= 0) {
            this.scene.remove(this.mesh);
        }
    }
}

// Grid Solar System with full features
class GridSolarSystem {
    constructor(gx, gy, gz, rng, scene, game) {
        this.gridPos = { x: gx, y: gy, z: gz };
        this.scene = scene;
        this.rng = rng;
        this.noise = new SimplexNoise(gx * 10000 + gy * 100 + gz);
        
        // Create sun with type
        this.createSun();
        
        // Create planets
        this.planets = [];
        this.asteroids = [];
        const planetCount = Math.floor(rng.next() * 5) + 2;
        for (let i = 0; i < planetCount; i++) {
            this.planets.push(this.createPlanet(i, planetCount));
        }
        
        // Create asteroid belts
        this.createAsteroidBelts();
    }
    
    createSun() {
        // 6 Star Types
        const types = ['red_dwarf', 'yellow_dwarf', 'blue_giant', 'white_dwarf', 'red_giant', 'neutron'];
        const type = types[Math.floor(this.rng.next() * types.length)];
        
        const configs = {
            red_dwarf: { color: 0xff4444, size: 20, glow: '#ff4444', strength: 30000 },
            yellow_dwarf: { color: 0xffaa44, size: 30, glow: '#ffaa44', strength: 50000 },
            blue_giant: { color: 0x4488ff, size: 60, glow: '#4488ff', strength: 150000 },
            white_dwarf: { color: 0xffffff, size: 15, glow: '#ffffff', strength: 20000 },
            red_giant: { color: 0xff6644, size: 80, glow: '#ff6644', strength: 80000 },
            neutron: { color: 0x88ccff, size: 10, glow: '#88ccff', strength: 100000 }
        };
        
        const config = configs[type];
        
        const geometry = new THREE.SphereGeometry(config.size, 32, 32);
        const material = new THREE.MeshBasicMaterial({ 
            color: config.color,
            emissive: config.color,
            emissiveIntensity: 0.8
        });
        
        this.sun = new THREE.Mesh(geometry, material);
        this.sun.position.set(
            (this.rng.next() - 0.5) * 200,
            (this.rng.next() - 0.5) * 100,
            (this.rng.next() - 0.5) * 200
        );
        this.sun.type = 'star';
        this.sun.color = '#' + config.color.toString(16).padStart(6, '0');
        this.sun.glowColor = config.glow;
        
        // Add to game's gravity sources
        game.gravitySources.push({
            position: this.sun.position,
            strength: config.strength,
            radius: config.size
        });
        
        this.scene.add(this.sun);
    }
    
    createPlanet(index, total) {
        // 10 Planet Types
        const types = ['rocky', 'metallic', 'crystalline', 'glacial', 'gaia', 
                       'volcanic', 'gas_giant', 'ice_giant', 'desert', 'toxic'];
        const type = types[Math.floor(this.rng.next() * types.length)];
        
        const distance = 80 + (index / total) * 150 + this.rng.next() * 50;
        const size = type === 'gas_giant' || type === 'ice_giant' ? 15 + this.rng.next() * 10 : 5 + this.rng.next() * 8;
        
        // Create terrain-colored material
        const material = this.createPlanetMaterial(type, size);
        
        const geometry = new THREE.SphereGeometry(size, 32, 32);
        const planet = new THREE.Mesh(geometry, material);
        
        const angle = index / total * Math.PI * 2;
        planet.position.copy(this.sun.position).add(new THREE.Vector3(
            Math.cos(angle) * distance,
            (this.rng.next() - 0.5) * 20,
            Math.sin(angle) * distance
        ));
        
        planet.type = 'planet';
        planet.planetType = type;
        planet.minimapColor = this.getPlanetColor(type);
        
        this.scene.add(planet);
        
        // Create moons for larger planets
        const moons = [];
        const moonCount = size > 12 ? Math.floor(this.rng.next() * 3) + 1 : 0;
        for (let m = 0; m < moonCount; m++) {
            moons.push(this.createMoon(planet, m, moonCount));
        }
        
        return { 
            mesh: planet, 
            orbitDistance: distance, 
            orbitSpeed: 0.1 / distance, 
            angle: angle, 
            moons: moons,
            updateOrbit: (delta) => {
                planet.angle += planet.orbitSpeed * delta;
                planet.position.copy(this.sun.position).add(new THREE.Vector3(
                    Math.cos(planet.angle) * planet.orbitDistance,
                    planet.position.y - this.sun.position.y,
                    Math.sin(planet.angle) * planet.orbitDistance
                ));
                // Update moons
                moons.forEach(moon => {
                    moon.angle += moon.orbitSpeed * delta;
                    moon.mesh.position.copy(planet.position).add(new THREE.Vector3(
                        Math.cos(moon.angle) * moon.orbitDistance,
                        0,
                        Math.sin(moon.angle) * moon.orbitDistance
                    ));
                });
            }
        };
    }
    
    createPlanetMaterial(type, size) {
        const colors = {
            rocky: { base: 0x887766, height: 0x554433 },
            metallic: { base: 0x888899, height: 0x444455 },
            crystalline: { base: 0x88ccff, height: 0x4488cc },
            glacial: { base: 0xaaddff, height: 0xffffff },
            gaia: { base: 0x44aa44, height: 0x226622 },
            volcanic: { base: 0x662211, height: 0xff4400 },
            gas_giant: { base: 0xcc8866, height: 0x884422 },
            ice_giant: { base: 0x66aacc, height: 0x336699 },
            desert: { base: 0xccaa66, height: 0x886633 },
            toxic: { base: 0x66cc44, height: 0x336622 }
        };
        
        const c = colors[type];
        
        // Create vertex colors based on noise
        const geometry = new THREE.SphereGeometry(size, 32, 32);
        const positions = geometry.attributes.position.array;
        const colors = [];
        
        for (let i = 0; i < positions.length; i += 3) {
            const x = positions[i];
            const y = positions[i + 1];
            const z = positions[i + 2];
            
            // Multi-octave noise for terrain
            let noise = 0;
            let amp = 1;
            let freq = 0.1;
            for (let o = 0; o < 4; o++) {
                noise += this.noise.noise3D(x * freq, y * freq, z * freq) * amp;
                amp *= 0.5;
                freq *= 2;
            }
            
            // Color based on height
            const t = (noise + 1) * 0.5;
            const base = new THREE.Color(c.base);
            const height = new THREE.Color(c.height);
            const final = base.lerp(height, t);
            
            colors.push(final.r, final.g, final.b);
        }
        
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        return new THREE.MeshPhongMaterial({ 
            vertexColors: true,
            shininess: type === 'crystalline' ? 100 : 30
        });
    }
    
    getPlanetColor(type) {
        const colors = {
            rocky: '#887766',
            metallic: '#888899',
            crystalline: '#88ccff',
            glacial: '#aaddff',
            gaia: '#44aa44',
            volcanic: '#662211',
            gas_giant: '#cc8866',
            ice_giant: '#66aacc',
            desert: '#ccaa66',
            toxic: '#66cc44'
        };
        return colors[type] || '#88ccff';
    }
    
    createMoon(planet, index, total) {
        const size = 1 + this.rng.next() * 2;
        const distance = planet.geometry.parameters.radius + 10 + index * 8;
        
        const geometry = new THREE.SphereGeometry(size, 16, 16);
        const material = new THREE.MeshPhongMaterial({ 
            color: 0xaaaaaa 
        });
        
        const moon = new THREE.Mesh(geometry, material);
        moon.type = 'moon';
        
        const angle = index / total * Math.PI * 2;
        moon.position.copy(planet.position).add(new THREE.Vector3(
            Math.cos(angle) * distance,
            0,
            Math.sin(angle) * distance
        ));
        
        this.scene.add(moon);
        
        return {
            mesh: moon,
            angle: angle,
            orbitDistance: distance,
            orbitSpeed: 0.2 / distance
        };
    }
    
    createAsteroidBelts() {
        const beltCount = Math.floor(this.rng.next() * 3) + 1;
        
        for (let b = 0; b < beltCount; b++) {
            const innerRadius = 60 + b * 80 + this.rng.next() * 20;
            const outerRadius = innerRadius + 20;
            const asteroidCount = 20 + Math.floor(this.rng.next() * 30);
            
            for (let i = 0; i < asteroidCount; i++) {
                const angle = this.rng.next() * Math.PI * 2;
                const dist = innerRadius + this.rng.next() * (outerRadius - innerRadius);
                const size = 0.5 + this.rng.next() * 2;
                
                const geometry = new THREE.DodecahedronGeometry(size, 0);
                const material = new THREE.MeshPhongMaterial({ 
                    color: 0x666666 
                });
                
                const asteroid = new THREE.Mesh(geometry, material);
                asteroid.position.copy(this.sun.position).add(new THREE.Vector3(
                    Math.cos(angle) * dist,
                    (this.rng.next() - 0.5) * 10,
                    Math.sin(angle) * dist
                ));
                
                asteroid.rotation.set(
                    this.rng.next() * Math.PI,
                    this.rng.next() * Math.PI,
                    this.rng.next() * Math.PI
                );
                
                this.asteroids.push({
                    mesh: asteroid,
                    angle: angle,
                    orbitDistance: dist,
                    orbitSpeed: 0.05 / dist,
                    updateOrbit: (delta) => {
                        asteroid.angle += asteroid.orbitSpeed * delta;
                        asteroid.mesh.position.copy(this.sun.position).add(new THREE.Vector3(
                            Math.cos(asteroid.angle) * asteroid.orbitDistance,
                            asteroid.position.y - this.sun.position.y,
                            Math.sin(asteroid.angle) * asteroid.orbitDistance
                        ));
                        asteroid.mesh.rotation.x += delta * 0.1;
                        asteroid.mesh.rotation.y += delta * 0.15;
                    }
                });
                
                this.scene.add(asteroid);
            }
        }
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.game = new SpaceBattleV4();
    initLandingAnimation();
});

function initLandingAnimation() {
    const canvas = document.getElementById('landing-canvas');
    if (!canvas) return;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    for (let i = 0; i < 1000; i++) {
        positions.push((Math.random() - 0.5) * 50);
        positions.push((Math.random() - 0.5) * 50);
        positions.push((Math.random() - 0.5) * 50);
    }
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    
    const material = new THREE.PointsMaterial({
        size: 0.1,
        color: 0x00ff88,
        transparent: true,
        opacity: 0.6
    });
    
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);

    camera.position.z = 15;

    function animate() {
        requestAnimationFrame(animate);
        particles.rotation.y += 0.001;
        particles.rotation.x += 0.0005;
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// ==================== GAME STATE MANAGEMENT ====================

SpaceBattleV4.prototype.saveGame = function() {
    const gameState = {
        currentGridPos: this.currentGridPos,
        universeSeed: this.universeSeed,
        score: this.score,
        kills: this.kills,
        wave: this.wave,
        startTime: this.startTime,
        playerHealth: this.player?.health || 100,
        playerShield: this.player?.shield || 100,
        timestamp: Date.now()
    };

    try {
        localStorage.setItem('spacebattle_v4_save', JSON.stringify(gameState));
        this.showNotification('Game Saved! 💾', '#00ff88');
        return true;
    } catch (e) {
        console.warn('Failed to save game:', e);
        this.showNotification('Save Failed!', '#ff4444');
        return false;
    }
};

SpaceBattleV4.prototype.loadGame = function() {
    try {
        const saved = localStorage.getItem('spacebattle_v4_save');
        if (!saved) {
            this.showNotification('No Save Found', '#ffaa00');
            return false;
        }

        const gameState = JSON.parse(saved);

        // Restore state
        this.currentGridPos = gameState.currentGridPos || { x: 50, y: 50, z: 50 };
        this.universeSeed = gameState.universeSeed || Math.random() * 100000;
        this.score = gameState.score || 0;
        this.kills = gameState.kills || 0;
        this.wave = gameState.wave || 1;
        this.startTime = gameState.startTime || Date.now();

        if (this.player) {
            this.player.health = gameState.playerHealth || 100;
            this.player.shield = gameState.playerShield || 100;
        }

        this.showNotification('Game Loaded! 📂', '#00ff88');
        return true;
    } catch (e) {
        console.warn('Failed to load game:', e);
        this.showNotification('Load Failed!', '#ff4444');
        return false;
    }
};

SpaceBattleV4.prototype.showNotification = function(message, color = '#00ff88') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 0, 0, 0.9);
        border: 2px solid ${color};
        color: ${color};
        padding: 1rem 2rem;
        font-family: 'Orbitron', sans-serif;
        font-size: 1.2rem;
        border-radius: 0.5rem;
        z-index: 10000;
        text-align: center;
        pointer-events: none;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s';
        setTimeout(() => notification.remove(), 500);
    }, 2000);
};

SpaceBattleV4.prototype.toggleSound = function() {
    if (!this.audioContext) {
        this.initAudio();
    }

    if (this.audioContext) {
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
            this.showNotification('Sound Enabled 🔊', '#00ff88');
        } else {
            this.audioContext.suspend();
            this.showNotification('Sound Disabled 🔇', '#ff4444');
        }
    }
};

SpaceBattleV4.prototype.setupMobileControls = function() {
    // Touch joystick setup
    const joystick = document.getElementById('moveJoystick');
    const knob = joystick?.querySelector('.joystick-knob');

    if (!joystick || !knob) return;

    let touching = false;
    const center = { x: 60, y: 60 };

    joystick.addEventListener('touchstart', (e) => {
        touching = true;
        updateJoystick(e.touches[0]);
    });

    joystick.addEventListener('touchmove', (e) => {
        e.preventDefault();
        if (touching) updateJoystick(e.touches[0]);
    });

    joystick.addEventListener('touchend', () => {
        touching = false;
        this.joystick.active = false;
        knob.style.transform = 'translate(-50%, -50%)';
    });

    const updateJoystick = (touch) => {
        const rect = joystick.getBoundingClientRect();
        const x = touch.clientX - rect.left - rect.width / 2;
        const y = touch.clientY - rect.top - rect.height / 2;

        const maxDist = 40;
        const dist = Math.min(Math.sqrt(x * x + y * y), maxDist);
        const angle = Math.atan2(y, x);

        const clampedX = Math.cos(angle) * dist;
        const clampedY = Math.sin(angle) * dist;

        knob.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;

        this.joystick.active = true;
        this.joystick.x = clampedX / maxDist;
        this.joystick.y = -clampedY / maxDist; // Invert Y
    };

    // Mobile action buttons
    const mobileFire = document.getElementById('mobileFire');
    const mobileBoost = document.getElementById('mobileBoost');
    const mobileLand = document.getElementById('mobileLand');

    mobileFire?.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.keys[' '] = true;
        this.fire();
    });

    mobileFire?.addEventListener('touchend', () => {
        this.keys[' '] = false;
    });

    mobileBoost?.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.keys['Shift'] = true;
    });

    mobileBoost?.addEventListener('touchend', () => {
        this.keys['Shift'] = false;
    });

    mobileLand?.addEventListener('touchstart', (e) => {
        e.preventDefault();
        this.land();
    });
};

SpaceBattleV4.prototype.updateFPS = function() {
    const fpsCounter = document.getElementById('fpsCounter');
    if (!fpsCounter) return;

    let frameCount = 0;
    let lastTime = performance.now();

    const countFrame = () => {
        frameCount++;
        const now = performance.now();
        const elapsed = now - lastTime;

        if (elapsed >= 1000) {
            const fps = Math.round((frameCount * 1000) / elapsed);
            fpsCounter.textContent = `${fps} FPS`;
            fpsCounter.style.color = fps >= 50 ? '#00ff88' : fps >= 30 ? '#ffaa00' : '#ff4444';
            frameCount = 0;
            lastTime = now;
        }

        if (this.state === 'playing') {
            requestAnimationFrame(countFrame);
        }
    };

    requestAnimationFrame(countFrame);
};

// ==================== ENHANCED GAME METHODS ====================

const originalStart = SpaceBattleV4.prototype.start;
SpaceBattleV4.prototype.start = function() {
    originalStart.call(this);

    // Setup mobile controls
    this.setupMobileControls();

    // Start FPS counter
    this.updateFPS();

    // Setup button event listeners
    document.getElementById('saveBtn')?.addEventListener('click', () => this.saveGame());
    document.getElementById('loadBtn')?.addEventListener('click', () => this.loadGame());
    document.getElementById('soundBtn')?.addEventListener('click', () => this.toggleSound());

    // Keyboard shortcuts for save/load
    document.addEventListener('keydown', (e) => {
        if (e.key === 'p' || e.key === 'P') {
            e.preventDefault();
            this.saveGame();
        }
        if (e.key === 'o' || e.key === 'O') {
            e.preventDefault();
            this.loadGame();
        }
    });
};

function enterUniverse() {
    window.game.start();
}

function showControls() {
    alert(`Controls:
W/S - Thrust forward/back
A/D - Yaw left/right
Q/E - Roll
Arrow Keys - Pitch
L - Land / Take off
Shift - Boost (hold for slingshot)
V - Change camera view
Space - Fire
M - Map
P - Save Game
O - Load Game
ESC - Pause`);
}
