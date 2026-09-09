/**
 * SpaceBattle v2.0 - Epic Space Combat with 100x100x100 Grid Universe
 * Features: Voxel ships, AI combatants, solar systems per grid, collision detection
 */

class SpaceBattle {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        
        this.clock = new THREE.Clock();
        this.state = 'menu';
        
        // 100x100x100 Grid System
        this.gridSize = 100; // units per cell
        this.grid = new Map(); // Key: "x,y,z", Value: SolarSystem
        this.currentGridPos = { x: 50, y: 50, z: 50 }; // Start at center
        
        // Game entities
        this.player = null;
        this.aiShips = [];
        this.asteroids = [];
        this.celestialBodies = []; // Suns, planets, moons
        this.bullets = [];
        this.particles = [];
        this.starField = null;
        
        // Camera views: 'first', 'third', 'top'
        this.cameraMode = 'third';
        this.cameraOffset = { first: { x: 0, y: 2, z: 5 }, third: { x: 0, y: 15, z: 40 }, top: { x: 0, y: 80, z: 0 } };
        
        // Game state
        this.score = 0;
        this.kills = 0;
        this.wave = 1;
        this.gameTime = 0;
        this.startTime = 0;
        
        // Input
        this.keys = {};
        this.mouse = { x: 0, y: 0, dx: 0, dy: 0 };
        this.joystick = { active: false, x: 0, y: 0 };
        
        // Audio
        this.audioContext = null;
        this.sounds = {};
        
        this.setupInput();
        this.initAudio();
    }
    
    initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.generateSounds();
        } catch(e) {
            console.warn('Audio not available');
        }
    }
    
    generateSounds() {
        // Laser sound
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
        
        // Engine
        this.sounds.engine = () => {
            if (!this.audioContext) return;
            // Continuous engine hum managed elsewhere
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
    }
    
    async init() {
        // Setup renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x000005);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Create starfield background
        this.createStarField();
        
        // Add ambient light so ships are visible even in shadow
        this.ambientLight = new THREE.AmbientLight(0x333344, 0.4);
        this.scene.add(this.ambientLight);
        
        // Initialize grid at current position
        this.generateGridCell(this.currentGridPos.x, this.currentGridPos.y, this.currentGridPos.z);
        
        // Create player with voxel ship
        this.player = new PlayerShip(this.scene, this);
        
        // Spawn AI ships
        this.spawnAIShips(5);
        
        // Setup camera
        this.camera.position.set(0, 50, 100);
        
        // Resize handler
        window.addEventListener('resize', () => this.onResize());
        
        // Simulate loading
        await this.simulateLoading();
    }
    
    createStarField() {
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        const sizes = [];
        
        for (let i = 0; i < 8000; i++) {
            const x = (Math.random() - 0.5) * 10000;
            const y = (Math.random() - 0.5) * 10000;
            const z = (Math.random() - 0.5) * 10000;
            positions.push(x, y, z);
            
            // Star colors
            const temp = Math.random();
            if (temp < 0.7) {
                colors.push(1, 0.95, 0.9); // White
            } else if (temp < 0.9) {
                colors.push(1, 0.7, 0.5); // Orange
            } else {
                colors.push(0.7, 0.7, 1); // Blue
            }
            
            sizes.push(Math.random() * 2 + 0.5);
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.Float32BufferAttribute(sizes, 1));
        
        // Use ShaderMaterial for better star rendering
        const material = new THREE.ShaderMaterial({
            uniforms: {
                pointSize: { value: 2.0 }
            },
            vertexShader: `
                attribute float size;
                varying vec3 vColor;
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    gl_PointSize = size * (300.0 / -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                void main() {
                    float dist = length(gl_PointCoord - vec2(0.5));
                    if (dist > 0.5) discard;
                    float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            vertexColors: true,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        this.starField = new THREE.Points(geometry, material);
        this.starField.name = 'starField';
        this.scene.add(this.starField);
        
        // Ensure stars render before other objects
        this.starField.renderOrder = -1000;
        
        // Store reference for camera-relative positioning
        this.starField.userData.isBackground = true;
    }
    
    // Generate solar system for a grid cell
    generateGridCell(gx, gy, gz) {
        const key = `${gx},${gy},${gz}`;
        if (this.grid.has(key)) return this.grid.get(key);
        
        // Create seeded random based on grid position
        const seed = gx * 73856093 ^ gy * 19349663 ^ gz * 83492791;
        const rng = new SeededRandom(seed);
        
        const system = new GridSolarSystem(gx, gy, gz, rng, this.scene, this);
        this.grid.set(key, system);
        
        // Add celestial bodies to tracking
        this.celestialBodies.push(system.sun);
        system.planets.forEach(p => {
            this.celestialBodies.push(p);
            p.moons.forEach(m => this.celestialBodies.push(m));
        });
        system.asteroids.forEach(a => this.asteroids.push(a));
        
        return system;
    }
    
    spawnAIShips(count) {
        const shipTypes = ['gordon', 'fighter', 'interceptor'];
        
        for (let i = 0; i < count; i++) {
            const type = shipTypes[Math.floor(Math.random() * shipTypes.length)];
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * 200,
                (Math.random() - 0.5) * 100,
                (Math.random() - 0.5) * 200
            );
            const ai = new AIShip(this.scene, this, type, offset);
            this.aiShips.push(ai);
        }
    }
    
    async simulateLoading() {
        const progress = document.getElementById('loadingProgress');
        for (let i = 0; i <= 100; i += 5) {
            progress.style.width = i + '%';
            await new Promise(r => setTimeout(r, 50));
        }
        document.getElementById('loading').style.display = 'none';
    }
    
    start() {
        this.state = 'playing';
        this.startTime = Date.now();
        document.getElementById('mainMenu').style.display = 'none';
        document.getElementById('hud').style.display = 'block';
        this.canvas.requestPointerLock();
        this.animate();
    }
    
    setupInput() {
        // Keyboard
        document.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space') e.preventDefault();
            
            // Camera cycle key
            if (e.code === 'KeyV' && this.state === 'playing') {
                this.cycleCameraMode();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
        });
        
        // Mouse
        document.addEventListener('mousemove', (e) => {
            if (document.pointerLockElement === this.canvas) {
                this.mouse.dx = e.movementX * 0.002;
                this.mouse.dy = e.movementY * 0.002;
            }
        });
        
        document.addEventListener('mousedown', () => {
            if (this.state === 'playing' && this.player) {
                this.player.fire();
            }
        });
        
        // Touch controls
        this.setupTouchControls();
    }
    
    setupTouchControls() {
        const joystickZone = document.getElementById('joystickZone');
        const joystickKnob = document.getElementById('joystickKnob');
        const fireButton = document.getElementById('fireButton');
        
        let joystickStart = { x: 0, y: 0 };
        
        joystickZone.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            const rect = joystickZone.getBoundingClientRect();
            joystickStart.x = rect.left + rect.width / 2;
            joystickStart.y = rect.top + rect.height / 2;
            this.joystick.active = true;
        });
        
        joystickZone.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.joystick.active) return;
            const touch = e.touches[0];
            const dx = (touch.clientX - joystickStart.x) / 35;
            const dy = (touch.clientY - joystickStart.y) / 35;
            this.joystick.x = Math.max(-1, Math.min(1, dx));
            this.joystick.y = Math.max(-1, Math.min(1, dy));
            joystickKnob.style.transform = `translate(${dx * 35}px, ${dy * 35}px)`;
        });
        
        joystickZone.addEventListener('touchend', () => {
            this.joystick.active = false;
            this.joystick.x = 0;
            this.joystick.y = 0;
            joystickKnob.style.transform = 'translate(0, 0)';
        });
        
        fireButton.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.state === 'playing' && this.player) {
                this.player.fire();
            }
        });
    }
    
    update(delta) {
        if (this.state !== 'playing') return;
        
        this.gameTime = (Date.now() - this.startTime) / 1000;
        
        // Update grid - check if player moved to new cell
        this.updateGridPosition();
        
        // Update celestial bodies (orbital motion)
        this.celestialBodies.forEach(body => body.update(delta));
        
        // Apply gravity to player
        if (this.player) {
            const gravity = this.calculateGravity(this.player.mesh.position);
            this.player.applyGravity(gravity, delta);
            this.player.update(delta, this.keys, this.mouse, this.joystick);
            this.checkPlayerCollisions();
        }
        
        // Apply gravity and update AI ships
        this.aiShips.forEach(ai => {
            const gravity = this.calculateGravity(ai.mesh.position);
            ai.applyGravity(gravity, delta);
            ai.update(delta, this.player);
            this.checkAICollisions(ai);
        });
        
        // Update bullets
        this.updateBullets(delta);
        
        // Update particles
        this.updateParticles(delta);
        
        // Update HUD
        this.updateHUD();
        
        // Reset mouse delta
        this.mouse.dx = 0;
        this.mouse.dy = 0;
    }
    
    updateGridPosition() {
        if (!this.player) return;
        
        const newGx = Math.floor(this.player.mesh.position.x / this.gridSize);
        const newGy = Math.floor(this.player.mesh.position.y / this.gridSize);
        const newGz = Math.floor(this.player.mesh.position.z / this.gridSize);
        
        if (newGx !== this.currentGridPos.x || 
            newGy !== this.currentGridPos.y || 
            newGz !== this.currentGridPos.z) {
            
            this.currentGridPos = { x: newGx, y: newGy, z: newGz };
            
            // Generate adjacent cells
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dz = -1; dz <= 1; dz++) {
                        this.generateGridCell(newGx + dx, newGy + dy, newGz + dz);
                    }
                }
            }
        }
    }
    
    calculateGravity(position) {
        const G = 800; // Gravitational constant scaled for game
        const totalGravity = new THREE.Vector3();
        
        this.celestialBodies.forEach(body => {
            if (body.type === 'sun' || body.type === 'planet') {
                const toBody = body.mesh.position.clone().sub(position);
                const distSq = toBody.lengthSq();
                const dist = Math.sqrt(distSq);
                
                if (dist > body.radius + 10) { // Don't apply inside body
                    const mass = body.type === 'sun' ? 5000 : 800;
                    const force = G * mass / distSq;
                    toBody.normalize().multiplyScalar(force);
                    totalGravity.add(toBody);
                }
            }
        });
        
        return totalGravity;
    }
    
    checkPlayerCollisions() {
        if (!this.player) return;
        const playerPos = this.player.mesh.position;
        
        // Check sun collision = instant death
        this.celestialBodies.forEach(body => {
            if (body.type === 'sun') {
                const dist = playerPos.distanceTo(body.mesh.position);
                if (dist < body.radius + 5) {
                    this.player.takeDamage(this.player.hull + this.player.shield); // Kill
                    this.createExplosion(playerPos, 0xff6600, 50);
                }
            }
        });
        
        // Check asteroid collisions
        this.asteroids.forEach(asteroid => {
            const dist = playerPos.distanceTo(asteroid.mesh.position);
            if (dist < asteroid.radius + 3) {
                // Bounce off
                const bounceDir = playerPos.clone().sub(asteroid.mesh.position).normalize();
                this.player.velocity.add(bounceDir.multiplyScalar(50));
                this.player.takeDamage(10);
                this.sounds.shieldHit?.();
            }
        });
        
        // Check planet collision = bounce
        this.celestialBodies.forEach(body => {
            if (body.type === 'planet') {
                const dist = playerPos.distanceTo(body.mesh.position);
                if (dist < body.radius + 5) {
                    const bounceDir = playerPos.clone().sub(body.mesh.position).normalize();
                    this.player.velocity.add(bounceDir.multiplyScalar(100));
                    this.player.takeDamage(15);
                }
            }
        });
    }
    
    checkAICollisions(ai) {
        // AI vs asteroids
        this.asteroids.forEach(asteroid => {
            const dist = ai.mesh.position.distanceTo(asteroid.mesh.position);
            if (dist < asteroid.radius + 3) {
                const bounceDir = ai.mesh.position.clone().sub(asteroid.mesh.position).normalize();
                ai.velocity.add(bounceDir.multiplyScalar(30));
            }
        });
    }
    
    updateBullets(delta) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const bullet = this.bullets[i];
            bullet.update(delta);
            
            // Check lifetime
            if (bullet.life <= 0) {
                bullet.destroy();
                this.bullets.splice(i, 1);
                continue;
            }
            
            // Check collisions
            let hit = false;
            
            // Player bullets hit AI
            if (bullet.isPlayer) {
                for (let j = this.aiShips.length - 1; j >= 0; j--) {
                    const ai = this.aiShips[j];
                    if (bullet.mesh.position.distanceTo(ai.mesh.position) < 5) {
                        ai.takeDamage(bullet.damage);
                        hit = true;
                        
                        if (ai.hull <= 0) {
                            this.createExplosion(ai.mesh.position, 0xff4400, 30);
                            this.sounds.explosion?.();
                            ai.destroy();
                            this.aiShips.splice(j, 1);
                            this.score += ai.scoreValue;
                            this.kills++;
                        }
                        break;
                    }
                }
            } else {
                // AI bullets hit player
                if (this.player && bullet.mesh.position.distanceTo(this.player.mesh.position) < 5) {
                    this.player.takeDamage(bullet.damage);
                    hit = true;
                    this.sounds.shieldHit?.();
                }
            }
            
            if (hit) {
                bullet.destroy();
                this.bullets.splice(i, 1);
            }
        }
    }
    
    updateParticles(delta) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.update(delta);
            if (p.life <= 0) {
                p.destroy();
                this.particles.splice(i, 1);
            }
        }
    }
    
    createExplosion(position, color, count = 20) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(this.scene, position, color));
        }
    }
    
    updateHUD() {
        if (!this.player) return;
        
        document.getElementById('score').textContent = this.score.toLocaleString();
        document.getElementById('kills').textContent = this.kills;
        document.getElementById('gameTime').textContent = this.formatTime(this.gameTime);
        document.getElementById('shieldBar').style.width = (this.player.shield / this.player.maxShield * 100) + '%';
        document.getElementById('hullBar').style.width = (this.player.hull / this.player.maxHull * 100) + '%';
        document.getElementById('gridPos').textContent = `${this.currentGridPos.x},${this.currentGridPos.y},${this.currentGridPos.z}`;
        document.getElementById('systemsVisited').textContent = this.grid.size;
        
        if (this.player.hull <= 0) {
            this.gameOver();
        }
    }
    
    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    
    gameOver() {
        this.state = 'gameover';
        document.exitPointerLock();
        document.getElementById('gameOver').style.display = 'flex';
        document.getElementById('finalScore').textContent = `Final Score: ${this.score.toLocaleString()}`;
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        const delta = Math.min(this.clock.getDelta(), 0.1);
        this.update(delta);
        
        // Camera follow player with 3 view modes
        if (this.player) {
            this.updateCamera();
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    updateCamera() {
        const playerPos = this.player.mesh.position.clone();
        const playerRot = this.player.mesh.rotation.clone();
        
        let targetPos, lookAtPos;
        
        switch(this.cameraMode) {
            case 'first': // First person - behind cockpit
                const fpOffset = new THREE.Vector3(0, 3, 8);
                fpOffset.applyEuler(playerRot);
                targetPos = playerPos.clone().add(fpOffset);
                lookAtPos = playerPos.clone().add(new THREE.Vector3(0, 0, -50).applyEuler(playerRot));
                break;
                
            case 'top': // Top down view
                targetPos = playerPos.clone().add(new THREE.Vector3(0, 100, 0));
                lookAtPos = playerPos.clone();
                break;
                
            case 'third': // Third person chase view (default)
            default:
                const tpOffset = new THREE.Vector3(0, 20, 50);
                tpOffset.applyEuler(playerRot);
                targetPos = playerPos.clone().add(tpOffset);
                lookAtPos = playerPos.clone();
                break;
        }
        
        this.camera.position.lerp(targetPos, 0.08);
        this.camera.lookAt(lookAtPos);
    }
    
    cycleCameraMode() {
        const modes = ['third', 'first', 'top'];
        const currentIndex = modes.indexOf(this.cameraMode);
        this.cameraMode = modes[(currentIndex + 1) % modes.length];
        
        // Update HUD
        const modeNames = { 'third': '3RD PERSON', 'first': 'FIRST PERSON', 'top': 'TOP DOWN' };
        const el = document.getElementById('cameraMode');
        if (el) el.textContent = modeNames[this.cameraMode];
        
        console.log('Camera mode:', this.cameraMode);
    }
}

// Grid Solar System Class
class GridSolarSystem {
    constructor(gx, gy, gz, rng, scene, game) {
        this.gridPos = { x: gx, y: gy, z: gz };
        this.rng = rng;
        this.scene = scene;
        this.game = game;
        
        // Center position in world space
        this.worldPos = new THREE.Vector3(
            gx * 100 + 50,
            gy * 100 + 50,
            gz * 100 + 50
        );
        
        this.sun = null;
        this.planets = [];
        this.asteroids = [];
        
        this.generate();
    }
    
    generate() {
        // Generate sun
        this.sun = new Sun(this.worldPos, this.rng, this.scene);
        
        // Generate planets
        const numPlanets = this.rng.int(2, 6);
        for (let i = 0; i < numPlanets; i++) {
            const planet = new Planet(this.worldPos, i, numPlanets, this.rng, this.scene);
            this.planets.push(planet);
        }
        
        // Generate asteroid belt
        const numAsteroids = this.rng.int(15, 40);
        for (let i = 0; i < numAsteroids; i++) {
            const asteroid = new Asteroid(this.worldPos, this.rng, this.scene);
            this.asteroids.push(asteroid);
        }
    }
}

// Sun Class
class Sun {
    constructor(centerPos, rng, scene) {
        this.type = 'sun';
        this.scene = scene;
        
        const types = [
            { name: "Red Dwarf", color: 0xff4444, radius: 8, intensity: 1 },
            { name: "Yellow Dwarf", color: 0xffff44, radius: 12, intensity: 1.5 },
            { name: "Blue Giant", color: 0x4444ff, radius: 20, intensity: 2 },
            { name: "White Dwarf", color: 0xffffff, radius: 6, intensity: 1.2 }
        ];
        
        const sunType = types[rng.int(0, types.length)];
        this.radius = sunType.radius;
        this.color = sunType.color;
        
        // Create sun mesh
        const geometry = new THREE.SphereGeometry(this.radius, 32, 32);
        const material = new THREE.MeshBasicMaterial({ 
            color: this.color,
            emissive: this.color,
            emissiveIntensity: 0.8
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(centerPos);
        scene.add(this.mesh);
        
        // Add light
        this.light = new THREE.PointLight(this.color, sunType.intensity * 2, 500);
        this.light.position.copy(centerPos);
        this.light.castShadow = true;
        scene.add(this.light);
        
        // Add corona glow
        const glowGeo = new THREE.SphereGeometry(this.radius * 1.5, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: this.color,
            transparent: true,
            opacity: 0.3
        });
        this.glow = new THREE.Mesh(glowGeo, glowMat);
        this.glow.position.copy(centerPos);
        scene.add(this.glow);
    }
    
    update(delta) {
        this.mesh.rotation.y += delta * 0.1;
        this.glow.rotation.y -= delta * 0.05;
    }
}

// Planet Class
class Planet {
    constructor(centerPos, index, total, rng, scene) {
        this.type = 'planet';
        this.scene = scene;
        
        // Orbit parameters
        this.orbitRadius = 30 + (index + 1) * 25;
        this.orbitSpeed = 0.1 / (index + 1);
        this.orbitAngle = rng.range(0, Math.PI * 2);
        
        // Planet properties
        const types = [
            { name: "Rocky", color: 0x884422, radius: 4 },
            { name: "Gas Giant", color: 0xddaa66, radius: 12 },
            { name: "Ice", color: 0xaaddff, radius: 5 },
            { name: "Volcanic", color: 0xff4422, radius: 4 },
            { name: "Toxic", color: 0x44ff44, radius: 6 }
        ];
        
        const planetType = types[rng.int(0, types.length)];
        this.radius = planetType.radius;
        this.color = planetType.color;
        
        // Create mesh
        const geometry = new THREE.SphereGeometry(this.radius, 24, 24);
        const material = new THREE.MeshPhongMaterial({ 
            color: this.color,
            shininess: 50
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);
        
        // Generate moons
        this.moons = [];
        const numMoons = rng.int(0, 4);
        for (let i = 0; i < numMoons; i++) {
            this.moons.push(new Moon(this, i, rng, scene));
        }
        
        this.centerPos = centerPos;
    }
    
    update(delta) {
        this.orbitAngle += this.orbitSpeed * delta;
        this.mesh.position.x = this.centerPos.x + Math.cos(this.orbitAngle) * this.orbitRadius;
        this.mesh.position.z = this.centerPos.z + Math.sin(this.orbitAngle) * this.orbitRadius;
        this.mesh.position.y = this.centerPos.y;
        this.mesh.rotation.y += delta * 0.2;
        
        // Update moons
        this.moons.forEach(moon => moon.update(delta, this.mesh.position));
    }
}

// Moon Class
class Moon {
    constructor(planet, index, rng, scene) {
        this.type = 'moon';
        this.scene = scene;
        
        this.orbitRadius = planet.radius + 8 + index * 5;
        this.orbitSpeed = 0.5 / (index + 1);
        this.orbitAngle = rng.range(0, Math.PI * 2);
        this.radius = planet.radius * 0.3;
        
        const geometry = new THREE.SphereGeometry(this.radius, 16, 16);
        const material = new THREE.MeshPhongMaterial({ color: 0x888888 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);
    }
    
    update(delta, planetPos) {
        this.orbitAngle += this.orbitSpeed * delta;
        this.mesh.position.x = planetPos.x + Math.cos(this.orbitAngle) * this.orbitRadius;
        this.mesh.position.z = planetPos.z + Math.sin(this.orbitAngle) * this.orbitRadius;
        this.mesh.position.y = planetPos.y;
    }
}

// Asteroid Class
class Asteroid {
    constructor(centerPos, rng, scene) {
        this.scene = scene;
        this.radius = rng.range(1, 4);
        
        // Random position in asteroid belt
        const angle = rng.range(0, Math.PI * 2);
        const dist = rng.range(60, 90);
        this.mesh = new THREE.Mesh(
            new THREE.DodecahedronGeometry(this.radius, 0),
            new THREE.MeshPhongMaterial({ color: 0x666666 })
        );
        
        this.mesh.position.set(
            centerPos.x + Math.cos(angle) * dist,
            centerPos.y + rng.range(-10, 10),
            centerPos.z + Math.sin(angle) * dist
        );
        
        this.mesh.rotation.set(
            rng.range(0, Math.PI),
            rng.range(0, Math.PI),
            rng.range(0, Math.PI)
        );
        
        this.rotationSpeed = {
            x: rng.range(-0.5, 0.5),
            y: rng.range(-0.5, 0.5),
            z: rng.range(-0.5, 0.5)
        };
        
        scene.add(this.mesh);
    }
    
    update(delta) {
        this.mesh.rotation.x += this.rotationSpeed.x * delta;
        this.mesh.rotation.y += this.rotationSpeed.y * delta;
        this.mesh.rotation.z += this.rotationSpeed.z * delta;
    }
}

// Seeded Random Generator
class SeededRandom {
    constructor(seed) {
        this.seed = seed;
    }
    
    next() {
        this.seed = (this.seed * 9301 + 49297) % 233280;
        return this.seed / 233280;
    }
    
    range(min, max) {
        return min + this.next() * (max - min);
    }
    
    int(min, max) {
        return Math.floor(this.range(min, max));
    }
}

// Player Ship Class with Voxel Design
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
        
        this.velocity = new THREE.Vector3();
        this.maxSpeed = 80;
        this.acceleration = 40;
        this.rotationSpeed = 2;
        
        this.mesh = this.createVoxelShip();
        scene.add(this.mesh);
        
        // Engine trail particles
        this.engineParticles = [];
    }
    
    createVoxelShip() {
        const group = new THREE.Group();
        
        // Main hull - voxel style
        const hullMat = new THREE.MeshPhongMaterial({ 
            color: 0x4488ff,
            emissive: 0x112244,
            shininess: 100
        });
        
        // Central body (blocky)
        const body = new THREE.Mesh(new THREE.BoxGeometry(4, 3, 8), hullMat);
        group.add(body);
        
        // Cockpit
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
        
        // Side engines (voxel blocks)
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
        
        // Wings
        const wingMat = new THREE.MeshPhongMaterial({ color: 0x3366aa });
        const wings = new THREE.Mesh(new THREE.BoxGeometry(12, 0.5, 4), wingMat);
        wings.position.set(0, 0, 1);
        group.add(wings);
        
        // Engine glow
        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(2, 8, 8),
            new THREE.MeshBasicMaterial({ 
                color: 0x4488ff,
                transparent: true,
                opacity: 0.4
            })
        );
        glow.position.set(0, 0, 5);
        group.add(glow);
        this.engineGlow = glow;
        
        // Point light
        const light = new THREE.PointLight(0x4488ff, 1, 30);
        light.position.set(0, 0, 5);
        group.add(light);
        
        return group;
    }
    
    update(delta, keys, mouse, joystick) {
        // Rotation
        this.mesh.rotation.y -= mouse.dx * 2;
        this.mesh.rotation.x = Math.max(-0.5, Math.min(0.5, this.mesh.rotation.x + mouse.dy));
        
        // Thrust
        let thrust = 0;
        if (keys['KeyW'] || (joystick.active && joystick.y < -0.3)) thrust = 1;
        if (keys['KeyS'] || (joystick.active && joystick.y > 0.3)) thrust = -0.5;
        
        // Roll
        if (keys['KeyA'] || (joystick.active && joystick.x < -0.3)) {
            this.mesh.rotation.z += delta * this.rotationSpeed;
        }
        if (keys['KeyD'] || (joystick.active && joystick.x > 0.3)) {
            this.mesh.rotation.z -= delta * this.rotationSpeed;
        }
        
        // Apply thrust
        if (thrust !== 0) {
            const forward = new THREE.Vector3(0, 0, -1);
            forward.applyQuaternion(this.mesh.quaternion);
            this.velocity.add(forward.multiplyScalar(this.acceleration * thrust * delta));
            
            // Engine effect
            this.engineGlow.scale.setScalar(1 + thrust * 0.3 + Math.random() * 0.1);
        } else {
            this.engineGlow.scale.setScalar(1);
        }
        
        // Apply velocity with drag
        this.velocity.multiplyScalar(0.98);
        const speed = this.velocity.length();
        if (speed > this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }
        
        this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));
        
        // Regenerate shield
        if (this.shield < this.maxShield) {
            this.shield += delta * 5;
            if (this.shield > this.maxShield) this.shield = this.maxShield;
        }
        
        // Weapon cooldown
        if (this.weaponHeat > 0) {
            this.weaponHeat -= delta * 50;
            if (this.weaponHeat < 0) this.weaponHeat = 0;
        }
    }
    
    fire() {
        if (this.weaponHeat >= 100) return;
        if (Date.now() - this.lastFireTime < this.fireRate) return;
        
        this.lastFireTime = Date.now();
        this.weaponHeat += 15;
        
        // Get bullet spawn position
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
        } else {
            this.hull -= amount;
        }
    }
    
    applyGravity(gravity, delta) {
        // Apply gravitational acceleration to velocity
        this.velocity.add(gravity.multiplyScalar(delta));
    }
}

// AI Ship Class
class AIShip {
    constructor(scene, game, type, offset) {
        this.scene = scene;
        this.game = game;
        this.type = type;
        this.scoreValue = type === 'gordon' ? 500 : type === 'fighter' ? 200 : 300;
        
        this.maxShield = type === 'gordon' ? 150 : 75;
        this.maxHull = type === 'gordon' ? 200 : 100;
        this.shield = this.maxShield;
        this.hull = this.maxHull;
        
        this.velocity = new THREE.Vector3();
        this.maxSpeed = type === 'fighter' ? 90 : 70;
        this.acceleration = 30;
        
        this.lastFireTime = 0;
        this.fireRate = type === 'gordon' ? 400 : 800;
        this.lastDecisionTime = 0;
        this.decisionCooldown = 500;
        this.targetOffset = offset.clone();
        
        this.mesh = this.createVoxelShip(type);
        this.mesh.position.copy(offset);
        scene.add(this.mesh);
    }
    
    createVoxelShip(type) {
        const group = new THREE.Group();
        
        if (type === 'gordon') {
            // Gordon ship (industrial orange)
            const hullMat = new THREE.MeshPhongMaterial({ color: 0x8B7355 });
            const accentMat = new THREE.MeshPhongMaterial({ 
                color: 0xFF6600,
                emissive: 0xFF2200,
                emissiveIntensity: 0.3
            });
            
            // Fuselage
            group.add(new THREE.Mesh(new THREE.BoxGeometry(6, 4, 24), hullMat));
            
            // Side pods
            const podGeo = new THREE.CylinderGeometry(2.5, 2.5, 16, 8);
            podGeo.rotateZ(Math.PI / 2);
            const leftPod = new THREE.Mesh(podGeo, accentMat);
            leftPod.position.set(-6, 0, 4);
            group.add(leftPod);
            
            const rightPod = new THREE.Mesh(podGeo, accentMat);
            rightPod.position.set(6, 0, 4);
            group.add(rightPod);
            
        } else if (type === 'fighter') {
            // Red fighter
            const mat = new THREE.MeshPhongMaterial({ 
                color: 0xCC0000,
                emissive: 0x440000
            });
            
            group.add(new THREE.Mesh(new THREE.ConeGeometry(3, 12, 4), mat));
            const wings = new THREE.Mesh(new THREE.BoxGeometry(8, 0.5, 4), mat);
            group.add(wings);
            
        } else {
            // Interceptor
            const mat = new THREE.MeshPhongMaterial({ color: 0x00CCCC });
            group.add(new THREE.Mesh(new THREE.ConeGeometry(2, 10, 6), mat));
        }
        
        return group;
    }
    
    update(delta, player) {
        if (!player) return;
        
        const time = Date.now();
        
        // AI Decision making
        if (time - this.lastDecisionTime > this.decisionCooldown) {
            this.lastDecisionTime = time;
            
            const distToPlayer = this.mesh.position.distanceTo(player.mesh.position);
            
            // Chase player
            const direction = new THREE.Vector3();
            direction.subVectors(player.mesh.position, this.mesh.position).normalize();
            
            // Move toward player
            this.velocity.add(direction.multiplyScalar(this.acceleration * delta));
            
            // Face player
            this.mesh.lookAt(player.mesh.position);
            
            // Fire if in range
            if (distToPlayer < 150 && this.canFire()) {
                this.fire();
            }
        }
        
        // Apply velocity with drag
        this.velocity.multiplyScalar(0.95);
        if (this.velocity.length() > this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }
        this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));
        
        // Regenerate shield
        if (this.shield < this.maxShield) {
            this.shield += delta * 3;
        }
    }
    
    canFire() {
        return Date.now() - this.lastFireTime > this.fireRate;
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
    
    takeDamage(amount) {
        if (this.shield > 0) {
            this.shield -= amount;
            if (this.shield < 0) {
                this.hull += this.shield;
                this.shield = 0;
            }
        } else {
            this.hull -= amount;
        }
    }
    
    applyGravity(gravity, delta) {
        // AI ships also affected by gravity
        this.velocity.add(gravity.multiplyScalar(delta * 0.7)); // Slightly less affected
    }
    
    destroy() {
        this.scene.remove(this.mesh);
    }
}

// Bullet Class
class Bullet {
    constructor(scene, position, quaternion, speed, damage, isPlayer) {
        this.scene = scene;
        this.speed = speed;
        this.damage = damage;
        this.isPlayer = isPlayer;
        this.life = 3;
        
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.6, 8, 8),
            new THREE.MeshBasicMaterial({ 
                color: isPlayer ? 0x00ffff : 0xff0044,
                emissive: isPlayer ? 0x00ffff : 0xff0044,
                emissiveIntensity: 0.5
            })
        );
        
        this.mesh.position.copy(position);
        this.mesh.quaternion.copy(quaternion);
        
        // Add glow
        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(1.2, 8, 8),
            new THREE.MeshBasicMaterial({
                color: isPlayer ? 0x00ffff : 0xff0044,
                transparent: true,
                opacity: 0.3
            })
        );
        this.mesh.add(glow);
        
        scene.add(this.mesh);
        
        // Initial velocity
        this.velocity = new THREE.Vector3(0, 0, -speed);
        this.velocity.applyQuaternion(quaternion);
    }
    
    update(delta) {
        this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));
        this.life -= delta;
    }
    
    destroy() {
        this.scene.remove(this.mesh);
    }
}

// Particle System
class Particle {
    constructor(scene, position, color) {
        this.scene = scene;
        this.life = 1 + Math.random();
        this.decay = 0.5 + Math.random() * 0.5;
        
        this.velocity = new THREE.Vector3(
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 40,
            (Math.random() - 0.5) * 40
        );
        
        this.mesh = new THREE.Mesh(
            new THREE.SphereGeometry(0.5 + Math.random() * 0.5, 6, 6),
            new THREE.MeshBasicMaterial({
                color: color,
                transparent: true,
                opacity: 1
            })
        );
        this.mesh.position.copy(position);
        scene.add(this.mesh);
    }
    
    update(delta) {
        this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));
        this.life -= delta * this.decay;
        this.mesh.material.opacity = this.life;
        this.mesh.scale.multiplyScalar(0.97);
    }
    
    destroy() {
        this.scene.remove(this.mesh);
    }
}

// Initialize game when page loads
let game;

function startGame() {
    document.getElementById('mainMenu').style.display = 'none';
    document.getElementById('loading').style.display = 'flex';
    
    game = new SpaceBattle();
    game.init().then(() => {
        game.start();
    });
}

function showControls() {
    alert(`SPACEBATTLE CONTROLS

KEYBOARD:
W/S - Thrust Forward/Back
A/D - Roll Left/Right
Mouse - Aim
Click/Space - Fire

TOUCH:
Left Joystick - Move
Right Button - Fire

OBJECTIVE:
Destroy enemy ships!
Avoid crashing into suns!
Explore the 100x100x100 grid universe!`);
}

function restartGame() {
    document.getElementById('gameOver').style.display = 'none';
    game.restart?.() || location.reload();
}

function returnToMenu() {
    document.getElementById('gameOver').style.display = 'none';
    document.getElementById('hud').style.display = 'none';
    document.getElementById('mainMenu').style.display = 'flex';
    if (game) game.cleanup?.();
}

// Show touch controls on mobile
if ('ontouchstart' in window) {
    document.getElementById('touchControls').style.display = 'block';
}
