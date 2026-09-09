/**
 * SpaceBattle v3.0 - Universal Explorer
 * Combines: N'og nog 100x100x100 voxel universe + Dual Systems combat + v2.2 HUD
 * Features: Gravity, AI combat, unified green HUD, starfield, sounds
 */

class SpaceBattleV3 {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
        this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true });
        this.clock = new THREE.Clock();
        
        this.state = 'menu';
        
        // 100x100x100 Grid Universe (N'og nog style)
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
    }
    
    initEngineSound() {
        if (!this.audioContext) return;
        // Continuous engine hum
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
            if (e.code === 'Space') this.player?.fire();
            if (e.code === 'KeyC') this.toggleCamera();
            if (e.code === 'KeyM') this.toggleMap();
            if (e.code === 'Escape') this.togglePause();
        });
        
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        
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
        
        // Create starfield
        this.createStarField();
        
        // Setup Dual Systems lighting
        this.setupLighting();
        
        // Generate universe
        this.generateGridCell(this.currentGridPos.x, this.currentGridPos.y, this.currentGridPos.z);
        
        // Create player
        this.player = new PlayerShip(this.scene, this);
        
        // Spawn enemies
        this.spawnAIShips(5);
        
        this.startTime = Date.now();
        this.state = 'playing';
        
        // Resume audio context
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
        // Ambient
        this.ambientLight = new THREE.AmbientLight(0x111122, 0.3);
        this.scene.add(this.ambientLight);
        
        // Sun 1 - Warm
        this.sun1Light = new THREE.PointLight(0xffaa44, 2, 2000);
        this.sun1Light.position.set(-400, 200, -400);
        this.sun1Light.castShadow = true;
        this.scene.add(this.sun1Light);
        
        // Sun 2 - Cool
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
        
        // Render
        this.renderer.render(this.scene, this.camera);
        
        // Reset mouse delta
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
        
        // Sector (Grid Cell)
        document.getElementById('sectorDisplay').textContent = `${this.currentGridPos.x}-${this.currentGridPos.y}-${this.currentGridPos.z}`;
        
        // Coords
        const pos = this.player.mesh.position;
        document.getElementById('coordsDisplay').textContent = `${Math.round(pos.x)}, ${Math.round(pos.y)}, ${Math.round(pos.z)}`;
        
        // Velocity - color coded for movement
        const speed = Math.round(this.player.velocity.length());
        const velEl = document.getElementById('velocityDisplay');
        velEl.textContent = `${speed} m/s`;
        velEl.className = speed > 1 ? 'hudValue good' : 'hudValue';
        
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
        
        // Draw suns (yellow)
        this.celestialBodies.forEach(body => {
            if (body.geometry && body.geometry.parameters.radius > 20) {
                const x = w/2 + (body.position.x - this.player.mesh.position.x) * 0.05;
                const y = h/2 + (body.position.z - this.player.mesh.position.z) * 0.05;
                ctx.fillStyle = '#ffaa44';
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, Math.PI*2);
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
        
        // Update HUD
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
        
        this.velocity = new THREE.Vector3();
        this.maxSpeed = 80;
        this.acceleration = 40;
        this.rotationSpeed = 2;
        
        this.thrustPlaying = false;
        
        // N'og nog gravity
        this.gravitySources = [
            { position: new THREE.Vector3(-400, 200, -400), strength: 50000 },
            { position: new THREE.Vector3(400, -100, 400), strength: 35000 }
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
            this.engineGlow.scale.setScalar(1 + thrust * 0.3 + Math.random() * 0.1);
            
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
        if (speed > this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }
        
        // N'og nog gravity
        this.applyGravity(delta);
        
        // Move
        this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));
        
        // Check grid boundaries and transition
        this.checkGridTransition();
        
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
    
    applyGravity(delta) {
        this.gravitySources.forEach(source => {
            const dist = this.mesh.position.distanceTo(source.position);
            if (dist < 800) {
                const force = source.strength / (dist * dist);
                const dir = source.position.clone().sub(this.mesh.position).normalize();
                this.velocity.add(dir.multiplyScalar(force * delta * 0.1));
            }
        });
    }
    
    checkGridTransition() {
        const threshold = 450;
        const gs = this.game.gridSize;
        let dx = 0, dy = 0, dz = 0;
        
        if (this.mesh.position.x > threshold) dx = 1;
        else if (this.mesh.position.x < -threshold) dx = -1;
        
        if (this.mesh.position.y > threshold) dy = 1;
        else if (this.mesh.position.y < -threshold) dy = -1;
        
        if (this.mesh.position.z > threshold) dz = 1;
        else if (this.mesh.position.z < -threshold) dz = -1;
        
        if (dx !== 0 || dy !== 0 || dz !== 0) {
            // Transition to new grid cell
            this.game.currentGridPos.x += dx;
            this.game.currentGridPos.y += dy;
            this.game.currentGridPos.z += dz;
            
            // Generate new cell
            this.game.generateGridCell(
                this.game.currentGridPos.x,
                this.game.currentGridPos.y,
                this.game.currentGridPos.z
            );
            
            // Wrap player position
            this.mesh.position.x -= dx * threshold * 2;
            this.mesh.position.y -= dy * threshold * 2;
            this.mesh.position.z -= dz * threshold * 2;
            
            // Clear enemies and respawn in new sector
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

// AI Ship (Dual Systems style)
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
        
        // AI behavior - move toward player
        const toPlayer = player.mesh.position.clone().sub(this.mesh.position);
        const dist = toPlayer.length();
        
        if (dist > 50) {
            toPlayer.normalize().multiplyScalar(this.acceleration * delta);
            this.velocity.add(toPlayer);
        }
        
        if (dist < 300 && Date.now() - this.lastFireTime > this.fireRate) {
            this.fire();
        }
        
        // Cap speed
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

// Grid Solar System
class GridSolarSystem {
    constructor(gx, gy, gz, rng, scene, game) {
        this.gridPos = { x: gx, y: gy, z: gz };
        this.scene = scene;
        this.rng = rng;
        
        // Create sun
        this.createSun();
        
        // Create planets
        this.planets = [];
        const planetCount = Math.floor(rng.next() * 5) + 2;
        for (let i = 0; i < planetCount; i++) {
            this.planets.push(this.createPlanet(i, planetCount));
        }
    }
    
    createSun() {
        const hue = this.rng.next();
        const color = new THREE.Color().setHSL(hue, 0.8, 0.5);
        
        const geometry = new THREE.SphereGeometry(30 + this.rng.next() * 20, 32, 32);
        const material = new THREE.MeshBasicMaterial({ 
            color: color,
            emissive: color,
            emissiveIntensity: 0.8
        });
        
        this.sun = new THREE.Mesh(geometry, material);
        this.sun.position.set(
            (this.rng.next() - 0.5) * 200,
            (this.rng.next() - 0.5) * 100,
            (this.rng.next() - 0.5) * 200
        );
        this.scene.add(this.sun);
    }
    
    createPlanet(index, total) {
        const distance = 80 + (index / total) * 150 + this.rng.next() * 50;
        const size = 5 + this.rng.next() * 10;
        const hue = this.rng.next();
        
        const geometry = new THREE.SphereGeometry(size, 16, 16);
        const material = new THREE.MeshPhongMaterial({ 
            color: new THREE.Color().setHSL(hue, 0.6, 0.5)
        });
        
        const planet = new THREE.Mesh(geometry, material);
        planet.position.copy(this.sun.position).add(new THREE.Vector3(
            Math.cos(index / total * Math.PI * 2) * distance,
            (this.rng.next() - 0.5) * 20,
            Math.sin(index / total * Math.PI * 2) * distance
        ));
        
        this.scene.add(planet);
        
        return { mesh: planet, orbitDistance: distance, orbitSpeed: 0.1 / distance, angle: index / total * Math.PI * 2, moons: [] };
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.game = new SpaceBattleV3();
    
    // Landing page animation
    initLandingAnimation();
});

function initLandingAnimation() {
    const canvas = document.getElementById('landing-canvas');
    if (!canvas) return;
    
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Particles
    const geometry = new THREE.BufferGeometry();
    const positions = [];
    for (let i = 0; i < 1000; i++) {
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

function enterUniverse() {
    window.game.start();
}

function showControls() {
    alert('Controls:\nW/S - Thrust\nA/D - Roll\nMouse - Pitch/Yaw\nSpace - Fire\nC - Camera\nM - Map\nESC - Pause');
}
