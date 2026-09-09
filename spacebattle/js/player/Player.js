/**
 * Player.js - Player Controller
 * Handles player movement, physics, camera, and input
 */

class Player {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        
        // Ship properties
        this.position = new THREE.Vector3(0, 100, 500);
        this.velocity = new THREE.Vector3();
        this.rotation = new THREE.Euler(0, 0, 0);
        this.quaternion = new THREE.Quaternion();
        
        // Ship stats
        this.maxSpeed = 5000;
        this.acceleration = 200;
        this.rotationSpeed = 2.0;
        this.thrust = 0;
        
        // Resources
        this.fuel = 100;
        this.maxFuel = 100;
        this.shield = 100;
        this.maxShield = 100;
        this.hull = 100;
        this.maxHull = 100;
        
        // Camera
        this.cameraMode = 0; // 0 = first person, 1 = third person, 2 = top down
        this.cameraOffset = [
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3(0, 30, 60),
            new THREE.Vector3(0, 200, 0)
        ];
        
        // Input state
        this.input = {
            forward: false,
            backward: false,
            left: false,
            right: false,
            up: false,
            down: false,
            rollLeft: false,
            rollRight: false,
            fire: false,
            thrust: false
        };
        
        // Mouse/Touch
        this.mouse = { x: 0, y: 0, dx: 0, dy: 0, sensitivity: 0.002 };
        this.touch = {
            joystick: { active: false, x: 0, y: 0, dx: 0, dy: 0 },
            look: { active: false, dx: 0, dy: 0 }
        };
        
        // Ship model
        this.ship = this.createShip();
        scene.add(this.ship);
        
        // Projectiles
        this.projectiles = [];
        this.lastFireTime = 0;
        this.fireRate = 200; // ms
        
        // Landing
        this.landed = false;
        this.landedPlanet = null;
        
        this.setupInput();
    }
    
    createShip() {
        const group = new THREE.Group();
        
        // Main hull
        const hullGeo = new THREE.ConeGeometry(5, 20, 8);
        hullGeo.rotateX(Math.PI / 2);
        const hullMat = new THREE.MeshPhongMaterial({ 
            color: 0x00ff88,
            emissive: 0x004400,
            shininess: 100
        });
        const hull = new THREE.Mesh(hullGeo, hullMat);
        group.add(hull);
        
        // Cockpit
        const cockpitGeo = new THREE.BoxGeometry(3, 2, 4);
        const cockpitMat = new THREE.MeshPhongMaterial({ 
            color: 0x88ccff,
            transparent: true,
            opacity: 0.7
        });
        const cockpit = new THREE.Mesh(cockpitGeo, cockpitMat);
        cockpit.position.set(0, 2, -2);
        group.add(cockpit);
        
        // Wings
        const wingGeo = new THREE.BoxGeometry(30, 1, 8);
        const wingMat = new THREE.MeshPhongMaterial({ color: 0x008866 });
        const wings = new THREE.Mesh(wingGeo, wingMat);
        wings.position.set(0, 0, 5);
        group.add(wings);
        
        // Engines
        const engineGeo = new THREE.CylinderGeometry(2, 3, 6, 8);
        engineGeo.rotateX(Math.PI / 2);
        const engineMat = new THREE.MeshPhongMaterial({ 
            color: 0xff6600,
            emissive: 0xff2200
        });
        
        const leftEngine = new THREE.Mesh(engineGeo, engineMat);
        leftEngine.position.set(-8, 0, 10);
        group.add(leftEngine);
        
        const rightEngine = new THREE.Mesh(engineGeo, engineMat);
        rightEngine.position.set(8, 0, 10);
        group.add(rightEngine);
        
        // Engine glow
        const glowGeo = new THREE.SphereGeometry(4, 8, 8);
        const glowMat = new THREE.MeshBasicMaterial({ 
            color: 0x00ff88,
            transparent: true,
            opacity: 0.3
        });
        const glow = new THREE.Mesh(glowGeo, glowMat);
        glow.position.set(0, 0, 15);
        group.add(glow);
        this.engineGlow = glow;
        
        // Point light
        const light = new THREE.PointLight(0x00ff88, 1, 100);
        light.position.set(0, 0, 15);
        group.add(light);
        
        return group;
    }
    
    setupInput() {
        // Keyboard
        document.addEventListener('keydown', (e) => this.onKeyDown(e));
        document.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Mouse
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('mousedown', () => this.input.fire = true);
        document.addEventListener('mouseup', () => this.input.fire = false);
        
        // Pointer lock
        document.addEventListener('click', () => {
            if (document.pointerLockElement !== document.body) {
                document.body.requestPointerLock();
            }
        });
        
        // Touch
        document.addEventListener('touchstart', (e) => this.onTouchStart(e));
        document.addEventListener('touchmove', (e) => this.onTouchMove(e));
        document.addEventListener('touchend', (e) => this.onTouchEnd(e));
    }
    
    onKeyDown(e) {
        switch(e.code) {
            case 'KeyW': case 'ArrowUp': this.input.forward = true; break;
            case 'KeyS': case 'ArrowDown': this.input.backward = true; break;
            case 'KeyA': case 'ArrowLeft': this.input.left = true; break;
            case 'KeyD': case 'ArrowRight': this.input.right = true; break;
            case 'KeyQ': this.input.rollLeft = true; break;
            case 'KeyE': this.input.rollRight = true; break;
            case 'Space': this.input.fire = true; break;
            case 'ShiftLeft': case 'ShiftRight': this.input.thrust = true; break;
            case 'KeyV': this.toggleCamera(); break;
        }
    }
    
    onKeyUp(e) {
        switch(e.code) {
            case 'KeyW': case 'ArrowUp': this.input.forward = false; break;
            case 'KeyS': case 'ArrowDown': this.input.backward = false; break;
            case 'KeyA': case 'ArrowLeft': this.input.left = false; break;
            case 'KeyD': case 'ArrowRight': this.input.right = false; break;
            case 'KeyQ': this.input.rollLeft = false; break;
            case 'KeyE': this.input.rollRight = false; break;
            case 'Space': this.input.fire = false; break;
            case 'ShiftLeft': case 'ShiftRight': this.input.thrust = false; break;
        }
    }
    
    onMouseMove(e) {
        if (document.pointerLockElement === document.body) {
            this.mouse.dx += e.movementX * this.mouse.sensitivity;
            this.mouse.dy += e.movementY * this.mouse.sensitivity;
        }
    }
    
    onTouchStart(e) {
        for (let touch of e.touches) {
            // Check which zone
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            if (target) {
                if (target.id === 'joystickZone' || target.id === 'joystickBase') {
                    this.touch.joystick.active = true;
                    this.touch.joystick.startX = touch.clientX;
                    this.touch.joystick.startY = touch.clientY;
                }
                if (target.id === 'lookZone') {
                    this.touch.look.active = true;
                    this.touch.look.id = touch.identifier;
                    this.touch.look.x = touch.clientX;
                    this.touch.look.y = touch.clientY;
                }
                if (target.id === 'fireZone' || target.id === 'fireButton') {
                    this.input.fire = true;
                }
                if (target.id === 'thrustZone' || target.id === 'thrustButton') {
                    this.input.thrust = true;
                }
            }
        }
    }
    
    onTouchMove(e) {
        e.preventDefault();
        for (let touch of e.touches) {
            // Update joystick
            if (this.touch.joystick.active) {
                const dx = touch.clientX - this.touch.joystick.startX;
                const dy = touch.clientY - this.touch.joystick.startY;
                const maxDist = 35;
                const dist = Math.min(Math.sqrt(dx*dx + dy*dy), maxDist);
                const angle = Math.atan2(dy, dx);
                
                this.touch.joystick.dx = (Math.cos(angle) * dist) / maxDist;
                this.touch.joystick.dy = (Math.sin(angle) * dist) / maxDist;
            }
            
            // Update look
            if (this.touch.look.active && touch.identifier === this.touch.look.id) {
                const dx = touch.clientX - this.touch.look.x;
                const dy = touch.clientY - this.touch.look.y;
                this.mouse.dx += dx * 0.005;
                this.mouse.dy += dy * 0.005;
                this.touch.look.x = touch.clientX;
                this.touch.look.y = touch.clientY;
            }
        }
    }
    
    onTouchEnd(e) {
        for (let touch of e.changedTouches) {
            if (this.touch.joystick.active) {
                this.touch.joystick.active = false;
                this.touch.joystick.dx = 0;
                this.touch.joystick.dy = 0;
            }
            if (touch.identifier === this.touch.look.id) {
                this.touch.look.active = false;
            }
            const target = document.elementFromPoint(touch.clientX, touch.clientY);
            if (target && (target.id === 'fireZone' || target.id === 'fireButton')) {
                this.input.fire = false;
            }
            if (target && (target.id === 'thrustZone' || target.id === 'thrustButton')) {
                this.input.thrust = false;
            }
        }
    }
    
    toggleCamera() {
        this.cameraMode = (this.cameraMode + 1) % 3;
        const names = ['First Person', 'Third Person', 'Top Down'];
        console.log(`Camera: ${names[this.cameraMode]}`);
    }
    
    update(deltaTime) {
        if (this.landed) return;
        
        // Apply rotation from mouse/touch
        const yaw = -this.mouse.dx * this.rotationSpeed * deltaTime;
        const pitch = -this.mouse.dy * this.rotationSpeed * deltaTime;
        
        this.rotation.y += yaw;
        this.rotation.x = THREE.MathUtils.clamp(
            this.rotation.x + pitch,
            -Math.PI / 2,
            Math.PI / 2
        );
        
        // Apply joystick rotation
        if (this.touch.joystick.active) {
            this.rotation.y -= this.touch.joystick.dx * this.rotationSpeed * deltaTime;
        }
        
        // Apply roll
        if (this.input.rollLeft) this.rotation.z += this.rotationSpeed * deltaTime;
        if (this.input.rollRight) this.rotation.z -= this.rotationSpeed * deltaTime;
        
        // Apply touch roll from joystick
        if (this.touch.joystick.active) {
            this.rotation.z += this.touch.joystick.dx * this.rotationSpeed * deltaTime;
        }
        
        // Update quaternion from rotation
        this.quaternion.setFromEuler(this.rotation);
        
        // Calculate thrust direction
        const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.quaternion);
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(this.quaternion);
        const up = new THREE.Vector3(0, 1, 0).applyQuaternion(this.quaternion);
        
        // Apply thrust
        const thrustMultiplier = this.input.thrust ? 3 : 1;
        
        if (this.input.forward || (this.touch.joystick.active && this.touch.joystick.dy < -0.3)) {
            this.velocity.add(forward.multiplyScalar(this.acceleration * thrustMultiplier * deltaTime));
        }
        if (this.input.backward || (this.touch.joystick.active && this.touch.joystick.dy > 0.3)) {
            this.velocity.add(forward.multiplyScalar(-this.acceleration * 0.5 * deltaTime));
        }
        if (this.input.left) {
            this.velocity.add(right.multiplyScalar(-this.acceleration * 0.5 * deltaTime));
        }
        if (this.input.right) {
            this.velocity.add(right.multiplyScalar(this.acceleration * 0.5 * deltaTime));
        }
        if (this.input.up) {
            this.velocity.add(up.multiplyScalar(this.acceleration * deltaTime));
        }
        if (this.input.down) {
            this.velocity.add(up.multiplyScalar(-this.acceleration * deltaTime));
        }
        
        // Clamp speed
        const speed = this.velocity.length();
        if (speed > this.maxSpeed) {
            this.velocity.normalize().multiplyScalar(this.maxSpeed);
        }
        
        // Update position
        this.position.add(this.velocity.clone().multiplyScalar(deltaTime));
        
        // Fuel consumption
        if (this.velocity.length() > 1) {
            this.fuel = Math.max(0, this.fuel - deltaTime * 0.1);
        }
        
        // Update ship model
        this.ship.position.copy(this.position);
        this.ship.quaternion.copy(this.quaternion);
        
        // Update camera
        this.updateCamera();
        
        // Reset mouse delta
        this.mouse.dx = 0;
        this.mouse.dy = 0;
        
        // Update engine glow based on thrust
        const thrustIntensity = this.velocity.length() / this.maxSpeed;
        this.engineGlow.material.opacity = 0.3 + thrustIntensity * 0.4;
        this.engineGlow.scale.setScalar(1 + thrustIntensity * 0.5);
    }
    
    updateCamera() {
        const offset = this.cameraOffset[this.cameraMode];
        
        if (this.cameraMode === 0) {
            // First person - camera at ship position
            this.camera.position.copy(this.position);
            this.camera.quaternion.copy(this.quaternion);
        } else if (this.cameraMode === 1) {
            // Third person - camera behind ship
            const camOffset = offset.clone().applyQuaternion(this.quaternion);
            this.camera.position.copy(this.position).add(camOffset);
            this.camera.lookAt(this.position);
        } else {
            // Top down
            this.camera.position.copy(this.position).add(offset);
            this.camera.lookAt(this.position);
        }
    }
    
    fire() {
        const now = Date.now();
        if (now - this.lastFireTime < this.fireRate) return;
        this.lastFireTime = now;
        
        const projectile = {
            position: this.position.clone(),
            velocity: new THREE.Vector3(0, 0, -1)
                .applyQuaternion(this.quaternion)
                .multiplyScalar(2000)
                .add(this.velocity),
            life: 3.0,
            mesh: null
        };
        
        this.projectiles.push(projectile);
        
        // Play sound
        if (window.gameAudio) {
            window.gameAudio.play('laser');
        }
    }
    
    updateProjectiles(deltaTime) {
        for (let i = this.projectiles.length - 1; i >= 0; i--) {
            const p = this.projectiles[i];
            p.position.add(p.velocity.clone().multiplyScalar(deltaTime));
            p.life -= deltaTime;
            
            if (p.life <= 0) {
                this.projectiles.splice(i, 1);
            }
        }
    }
    
    getStats() {
        return {
            velocity: Math.round(this.velocity.length()),
            altitude: Math.round(this.position.y / 1000),
            fuel: Math.round(this.fuel),
            shield: Math.round(this.shield),
            hull: Math.round(this.hull),
            coords: `${Math.round(this.position.x)}, ${Math.round(this.position.y)}, ${Math.round(this.position.z)}`
        };
    }
    
    serialize() {
        return {
            position: { x: this.position.x, y: this.position.y, z: this.position.z },
            velocity: { x: this.velocity.x, y: this.velocity.y, z: this.velocity.z },
            rotation: { x: this.rotation.x, y: this.rotation.y, z: this.rotation.z },
            fuel: this.fuel,
            shield: this.shield,
            hull: this.hull
        };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Player;
}
