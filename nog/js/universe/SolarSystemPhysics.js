/**
 * SolarSystemPhysics.js - Physics Integration for Solar Systems
 * Adds collision detection, gravity, landing, and star death to N'og nog
 */

// Solar System Manager for 100x100x100 voxel coordinates
class SolarSystemVoxelManager {
    constructor(scene) {
        this.scene = scene;
        this.systems = new Map(); // key: "x,y,z" (voxel coords), value: SolarSystemData
        this.voxelSize = 100; // Each voxel is 100 units
        this.activeSystems = new Set();
        this.player = null;
        
        // Physics constants (scaled for gameplay)
        this.G = 6.674e-11;
        this.STAR_DEATH_RADIUS = 30; // Game units
        this.LANDING_DISTANCE = 50;
        this.LANDING_SPEED = 100;
        this.SLINGSHOT_MIN_DIST = 100;
        this.SLINGSHOT_MAX_DIST = 300;
        
        // Collision data
        this.colliders = [];
    }
    
    setPlayer(player) {
        this.player = player;
    }
    
    /**
     * Get or create solar system at a voxel coordinate
     */
    getSystemAt(voxelX, voxelY, voxelZ) {
        const key = `${voxelX},${voxelY},${voxelZ}`;
        
        if (!this.systems.has(key)) {
            const worldX = voxelX * this.voxelSize;
            const worldY = voxelY * this.voxelSize;
            const worldZ = voxelZ * this.voxelSize;
            
            const system = this.generateSolarSystem(worldX, worldY, worldZ);
            this.systems.set(key, system);
            
            // Add to scene if within range
            this.spawnSystemVisuals(system);
        }
        
        return this.systems.get(key);
    }
    
    /**
     * Generate a solar system at world coordinates
     */
    generateSolarSystem(x, y, z) {
        const seed = Math.abs((x * 73856093) ^ (y * 19349663) ^ (z * 83492791));
        const rng = {
            seed: seed,
            next: function() {
                this.seed = (this.seed * 9301 + 49297) % 233280;
                return this.seed / 233280;
            },
            range: function(min, max) {
                return min + this.next() * (max - min);
            },
            int: function(min, max) {
                return Math.floor(this.range(min, max));
            }
        };
        
        // Star types
        const starTypes = [
            { name: "Red Dwarf", color: 0xff4444, temp: 3000, mass: 0.5, radius: 20, luminosity: 0.01, lightColor: 0xff6644 },
            { name: "Yellow Dwarf", color: 0xffff88, temp: 5700, mass: 1.0, radius: 25, luminosity: 1.0, lightColor: 0xffffcc },
            { name: "Blue Giant", color: 0x8888ff, temp: 30000, mass: 20.0, radius: 50, luminosity: 10000, lightColor: 0xaaaaff },
            { name: "White Dwarf", color: 0xffffff, temp: 10000, mass: 1.4, radius: 10, luminosity: 0.1, lightColor: 0xffffff },
            { name: "Red Giant", color: 0xff6644, temp: 3500, mass: 1.5, radius: 80, luminosity: 500, lightColor: 0xffaa66 },
            { name: "Neutron Star", color: 0xaaaaff, temp: 600000, mass: 1.4, radius: 5, luminosity: 0.5, lightColor: 0xccccff }
        ];
        
        const starType = starTypes[rng.int(0, starTypes.length)];
        
        const system = {
            seed: seed,
            position: new THREE.Vector3(x, y, z),
            star: {
                ...starType,
                mass: starType.mass * 1e30, // Solar mass in kg
                worldPosition: new THREE.Vector3(x, y, z),
                pulsePhase: 0
            },
            planets: [],
            moons: [],
            asteroids: [],
            meshes: [],
            lastUpdate: 0
        };
        
        // Generate planets
        const numPlanets = rng.int(3, 10);
        let orbitDistance = rng.range(80, 150);
        
        const planetTypes = [
            { name: "Rocky", color: 0x8B7355, size: 1.0, canLand: true },
            { name: "Metallic", color: 0x708090, size: 0.8, canLand: true },
            { name: "Crystalline", color: 0x9370DB, size: 0.9, canLand: true },
            { name: "Glacial", color: 0xB0E0E6, size: 1.1, canLand: true },
            { name: "Gaia", color: 0x228B22, size: 1.0, canLand: true },
            { name: "Volcanic", color: 0xFF4500, size: 1.0, canLand: false },
            { name: "Gas Giant", color: 0xDAA520, size: 4.0, canLand: false },
            { name: "Ice Giant", color: 0x00CED1, size: 3.5, canLand: false },
            { name: "Desert", color: 0xEDC9AF, size: 0.9, canLand: true },
            { name: "Toxic", color: 0x9ACD32, size: 0.95, canLand: false }
        ];
        
        for (let i = 0; i < numPlanets; i++) {
            const type = planetTypes[rng.int(0, planetTypes.length)];
            const planetRadius = type.size * rng.range(12, 18);
            
            const planet = {
                name: `Planet ${String.fromCharCode(97 + i)}`,
                type: type.name,
                color: type.color,
                radius: planetRadius,
                mass: planetRadius * planetRadius * planetRadius * 1000,
                distance: orbitDistance,
                angle: rng.range(0, Math.PI * 2),
                orbitalSpeed: rng.range(0.0002, 0.0008),
                rotationSpeed: rng.range(0.001, 0.01),
                axialTilt: rng.range(-0.5, 0.5),
                canLand: type.canLand,
                moons: [],
                seed: rng.next() * 100000
            };
            
            system.planets.push(planet);
            
            // Generate moons for larger planets
            if (type.size > 1.5 && rng.next() > 0.3) {
                const numMoons = rng.int(1, 4);
                let moonDistance = planetRadius * 3;
                
                for (let m = 0; m < numMoons; m++) {
                    const moon = {
                        name: `${planet.name}-${m + 1}`,
                        radius: planetRadius * rng.range(0.15, 0.35),
                        mass: planet.mass * 0.01,
                        distance: moonDistance,
                        angle: rng.range(0, Math.PI * 2),
                        speed: rng.range(0.005, 0.02),
                        parent: planet,
                        seed: rng.next() * 100000
                    };
                    
                    planet.moons.push(moon);
                    system.moons.push(moon);
                    moonDistance *= 1.6;
                }
            }
            
            orbitDistance *= rng.range(1.4, 2.0);
        }
        
        // Generate asteroid belt
        if (rng.next() > 0.3) {
            const beltRadius = system.planets.length > 2 ? 
                (system.planets[1].distance + system.planets[2].distance) / 2 :
                300;
            
            const numAsteroids = rng.int(30, 80);
            for (let a = 0; a < numAsteroids; a++) {
                system.asteroids.push({
                    distance: beltRadius + rng.range(-50, 50),
                    angle: rng.range(0, Math.PI * 2),
                    size: rng.range(2, 8),
                    speed: rng.range(0.0001, 0.0004),
                    rotationSpeed: rng.range(0.001, 0.01)
                });
            }
        }
        
        return system;
    }
    
    /**
     * Create Three.js meshes for the solar system
     */
    spawnSystemVisuals(system) {
        // Create star
        const starGeo = new THREE.SphereGeometry(system.star.radius, 32, 32);
        
        // Custom shader for pulsing star
        const starMat = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(system.star.color) },
                time: { value: 0 }
            },
            vertexShader: `
                varying vec3 vNormal;
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform float time;
                varying vec3 vNormal;
                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
                    vec3 glow = color * intensity * 3.0;
                    gl_FragColor = vec4(color + glow, 1.0);
                }
            `
        });
        
        const starMesh = new THREE.Mesh(starGeo, starMat);
        starMesh.position.copy(system.position);
        this.scene.add(starMesh);
        system.star.mesh = starMesh;
        system.meshes.push(starMesh);
        
        // Star glow
        const glowGeo = new THREE.SphereGeometry(system.star.radius * 1.5, 32, 32);
        const glowMat = new THREE.MeshBasicMaterial({
            color: system.star.color,
            transparent: true,
            opacity: 0.2
        });
        const glowMesh = new THREE.Mesh(glowGeo, glowMat);
        glowMesh.position.copy(system.position);
        this.scene.add(glowMesh);
        system.meshes.push(glowMesh);
        
        // Star light
        const light = new THREE.PointLight(system.star.lightColor, 1, 1000);
        light.position.copy(system.position);
        this.scene.add(light);
        system.star.light = light;
        
        // Create planets
        system.planets.forEach(planet => {
            // Planet geometry with terrain
            const planetGeo = new THREE.IcosahedronGeometry(planet.radius, 24);
            
            // Generate terrain
            const positions = planetGeo.attributes.position;
            for (let i = 0; i < positions.count; i++) {
                const px = positions.getX(i);
                const py = positions.getY(i);
                const pz = positions.getZ(i);
                
                // Simple noise-based terrain
                const noise = this.getTerrainNoise(
                    px * 0.1 + planet.seed,
                    py * 0.1 + planet.seed,
                    pz * 0.1 + planet.seed
                );
                
                const displacement = noise * planet.radius * 0.1;
                const len = Math.sqrt(px*px + py*py + pz*pz);
                const scale = (len + displacement) / len;
                
                positions.setXYZ(i, px * scale, py * scale, pz * scale);
            }
            planetGeo.computeVertexNormals();
            
            const planetMat = new THREE.MeshStandardMaterial({
                color: planet.color,
                roughness: 0.8,
                metalness: 0.2
            });
            
            const planetMesh = new THREE.Mesh(planetGeo, planetMat);
            planetMesh.castShadow = true;
            planetMesh.receiveShadow = true;
            planet.mesh = planetMesh;
            this.scene.add(planetMesh);
            system.meshes.push(planetMesh);
            
            // Atmosphere
            if (planet.canLand || planet.type === "Gas Giant" || planet.type === "Ice Giant") {
                const atmoGeo = new THREE.SphereGeometry(planet.radius * 1.15, 32, 32);
                const atmoMat = new THREE.MeshBasicMaterial({
                    color: planet.color,
                    transparent: true,
                    opacity: 0.15,
                    side: THREE.BackSide
                });
                const atmoMesh = new THREE.Mesh(atmoGeo, atmoMat);
                planetMesh.add(atmoMesh);
                planet.atmosphere = atmoMesh;
            }
            
            // Orbit ring
            const orbitGeo = new THREE.RingGeometry(
                planet.distance - 1,
                planet.distance + 1,
                64
            );
            const orbitMat = new THREE.MeshBasicMaterial({
                color: 0x444444,
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            const orbit = new THREE.Mesh(orbitGeo, orbitMat);
            orbit.rotation.x = Math.PI / 2;
            orbit.position.copy(system.position);
            this.scene.add(orbit);
            system.meshes.push(orbit);
            
            // Create moons
            planet.moons.forEach(moon => {
                const moonGeo = new THREE.SphereGeometry(moon.radius, 16, 16);
                const moonMat = new THREE.MeshStandardMaterial({
                    color: 0x888888,
                    roughness: 0.9
                });
                const moonMesh = new THREE.Mesh(moonGeo, moonMat);
                moonMesh.castShadow = true;
                moonMesh.receiveShadow = true;
                moon.mesh = moonMesh;
                this.scene.add(moonMesh);
                system.meshes.push(moonMesh);
            });
        });
        
        // Create asteroid belt
        if (system.asteroids.length > 0) {
            const asteroidGeo = new THREE.DodecahedronGeometry(1, 0);
            const asteroidMat = new THREE.MeshStandardMaterial({
                color: 0x666666,
                roughness: 0.9
            });
            
            system.asteroids.forEach((asteroid, idx) => {
                // Create instanced mesh for performance
                const size = asteroid.size;
                const mesh = new THREE.Mesh(asteroidGeo, asteroidMat);
                mesh.scale.set(size, size * 0.8, size * 0.9);
                
                // Randomize rotation
                mesh.rotation.set(
                    Math.random() * Math.PI,
                    Math.random() * Math.PI,
                    Math.random() * Math.PI
                );
                
                asteroid.mesh = mesh;
                this.scene.add(mesh);
                system.meshes.push(mesh);
            });
        }
    }
    
    /**
     * Simple terrain noise function
     */
    getTerrainNoise(x, y, z) {
        // Simplex-like noise
        return Math.sin(x) * Math.cos(y) * Math.sin(z) +
               Math.sin(x * 2.3) * Math.cos(y * 2.1) * Math.sin(z * 2.7) * 0.5 +
               Math.sin(x * 4.7) * Math.cos(y * 4.3) * Math.sin(z * 5.1) * 0.25;
    }
    
    /**
     * Update all active solar systems
     */
    update(deltaTime, playerPosition) {
        // Determine which systems should be active based on player position
        const playerVoxelX = Math.floor(playerPosition.x / this.voxelSize);
        const playerVoxelY = Math.floor(playerPosition.y / this.voxelSize);
        const playerVoxelZ = Math.floor(playerPosition.z / this.voxelSize);
        
        // Generate nearby systems
        for (let x = playerVoxelX - 1; x <= playerVoxelX + 1; x++) {
            for (let y = playerVoxelY - 1; y <= playerVoxelY + 1; y++) {
                for (let z = playerVoxelZ - 1; z <= playerVoxelZ + 1; z++) {
                    this.getSystemAt(x, y, z);
                }
            }
        }
        
        const time = Date.now() * 0.001;
        
        // Update all systems
        this.systems.forEach(system => {
            // Check if system should be active (within 2 voxel radius)
            const dx = Math.abs(Math.floor(system.position.x / this.voxelSize) - playerVoxelX);
            const dy = Math.abs(Math.floor(system.position.y / this.voxelSize) - playerVoxelY);
            const dz = Math.abs(Math.floor(system.position.z / this.voxelSize) - playerVoxelZ);
            
            if (dx > 2 || dy > 2 || dz > 2) {
                // Hide meshes for distant systems
                system.meshes.forEach(mesh => {
                    if (mesh.visible !== false) mesh.visible = false;
                });
                return;
            }
            
            // Show meshes
            system.meshes.forEach(mesh => {
                if (mesh.visible !== true) mesh.visible = true;
            });
            
            // Update star shader
            if (system.star.mesh && system.star.mesh.material.uniforms) {
                system.star.mesh.material.uniforms.time.value = time;
            }
            
            // Update planets
            system.planets.forEach(planet => {
                // Orbit
                planet.angle += planet.orbitalSpeed * deltaTime;
                
                const px = system.position.x + Math.cos(planet.angle) * planet.distance;
                const pz = system.position.z + Math.sin(planet.angle) * planet.distance;
                const py = system.position.y + Math.sin(planet.angle * 0.5) * planet.distance * 0.1;
                
                planet.mesh.position.set(px, py, pz);
                planet.mesh.rotation.y += planet.rotationSpeed * deltaTime;
                
                // Update moons
                planet.moons.forEach(moon => {
                    moon.angle += moon.speed * deltaTime;
                    
                    const mx = px + Math.cos(moon.angle) * moon.distance;
                    const mz = pz + Math.sin(moon.angle) * moon.distance;
                    const my = py + Math.sin(moon.angle * 2) * moon.distance * 0.1;
                    
                    moon.mesh.position.set(mx, my, mz);
                });
            });
            
            // Update asteroids
            system.asteroids.forEach(asteroid => {
                asteroid.angle += asteroid.speed * deltaTime;
                
                const ax = system.position.x + Math.cos(asteroid.angle) * asteroid.distance;
                const az = system.position.z + Math.sin(asteroid.angle) * asteroid.distance;
                const ay = system.position.y + Math.sin(asteroid.angle * 3) * 10;
                
                asteroid.mesh.position.set(ax, ay, az);
                asteroid.mesh.rotation.x += asteroid.rotationSpeed * deltaTime;
                asteroid.mesh.rotation.z += asteroid.rotationSpeed * 0.7 * deltaTime;
            });
        });
    }
    
    /**
     * Calculate gravitational forces on player
     */
    calculateGravity(playerPosition, playerMass = 1) {
        let totalForce = new THREE.Vector3(0, 0, 0);
        let nearestStar = null;
        let minStarDist = Infinity;
        
        this.systems.forEach(system => {
            // Star gravity
            const starDist = playerPosition.distanceTo(system.position);
            if (starDist > 0) {
                const starForce = (this.G * system.star.mass * playerMass) / (starDist * starDist);
                const direction = new THREE.Vector3()
                    .subVectors(system.position, playerPosition)
                    .normalize();
                totalForce.add(direction.multiplyScalar(starForce * 1e-5)); // Scaled
                
                if (starDist < minStarDist) {
                    minStarDist = starDist;
                    nearestStar = system.star;
                }
            }
            
            // Planet gravity
            system.planets.forEach(planet => {
                const dist = playerPosition.distanceTo(planet.mesh.position);
                if (dist > planet.radius) {
                    const force = (this.G * planet.mass * playerMass) / (dist * dist);
                    const direction = new THREE.Vector3()
                        .subVectors(planet.mesh.position, playerPosition)
                        .normalize();
                    totalForce.add(direction.multiplyScalar(force * 1e-5));
                }
            });
        });
        
        return {
            force: totalForce,
            starDistance: minStarDist,
            nearestStar: nearestStar,
            inDeathZone: minStarDist < this.STAR_DEATH_RADIUS
        };
    }
    
    /**
     * Check for collisions
     */
    checkCollisions(playerPosition, playerRadius = 10) {
        const collisions = [];
        
        this.systems.forEach(system => {
            // Star collision
            const starDist = playerPosition.distanceTo(system.position);
            if (starDist < system.star.radius + playerRadius) {
                collisions.push({
                    type: 'star',
                    fatal: true,
                    body: system.star,
                    distance: starDist
                });
            }
            
            // Planet collisions
            system.planets.forEach(planet => {
                const dist = playerPosition.distanceTo(planet.mesh.position);
                if (dist < planet.radius + playerRadius) {
                    const normal = new THREE.Vector3()
                        .subVectors(playerPosition, planet.mesh.position)
                        .normalize();
                    
                    collisions.push({
                        type: 'planet',
                        body: planet,
                        distance: dist,
                        canLand: planet.canLand,
                        normal: normal
                    });
                }
                
                // Moon collisions
                planet.moons.forEach(moon => {
                    const moonDist = playerPosition.distanceTo(moon.mesh.position);
                    if (moonDist < moon.radius + playerRadius) {
                        const normal = new THREE.Vector3()
                            .subVectors(playerPosition, moon.mesh.position)
                            .normalize();
                        
                        collisions.push({
                            type: 'moon',
                            body: moon,
                            distance: moonDist,
                            canLand: true,
                            normal: normal
                        });
                    }
                });
            });
            
            // Asteroid collisions
            system.asteroids.forEach(asteroid => {
                const dist = playerPosition.distanceTo(asteroid.mesh.position);
                if (dist < asteroid.size + playerRadius) {
                    collisions.push({
                        type: 'asteroid',
                        body: asteroid,
                        distance: dist,
                        damage: 15,
                        fatal: false
                    });
                }
            });
        });
        
        return collisions;
    }
    
    /**
     * Get landing target
     */
    getLandingTarget(playerPosition, maxDist = this.LANDING_DISTANCE) {
        let bestTarget = null;
        let bestDist = maxDist;
        
        this.systems.forEach(system => {
            // Check planets
            system.planets.forEach(planet => {
                if (!planet.canLand) return;
                
                const dist = playerPosition.distanceTo(planet.mesh.position);
                const surfaceDist = dist - planet.radius;
                
                if (surfaceDist < bestDist && surfaceDist > 0) {
                    bestDist = surfaceDist;
                    const normal = new THREE.Vector3()
                        .subVectors(playerPosition, planet.mesh.position)
                        .normalize();
                    
                    bestTarget = {
                        type: 'planet',
                        body: planet,
                        distance: surfaceDist,
                        position: planet.mesh.position.clone(),
                        normal: normal,
                        landingPoint: planet.mesh.position.clone().add(
                            normal.clone().multiplyScalar(planet.radius)
                        )
                    };
                }
            });
            
            // Check moons
            system.moons.forEach(moon => {
                const dist = playerPosition.distanceTo(moon.mesh.position);
                const surfaceDist = dist - moon.radius;
                
                if (surfaceDist < bestDist && surfaceDist > 0) {
                    bestDist = surfaceDist;
                    const normal = new THREE.Vector3()
                        .subVectors(playerPosition, moon.mesh.position)
                        .normalize();
                    
                    bestTarget = {
                        type: 'moon',
                        body: moon,
                        distance: surfaceDist,
                        position: moon.mesh.position.clone(),
                        normal: normal,
                        landingPoint: moon.mesh.position.clone().add(
                            normal.clone().multiplyScalar(moon.radius)
                        )
                    };
                }
            });
        });
        
        return bestTarget;
    }
    
    /**
     * Check for slingshot opportunity
     */
    checkSlingshot(playerPosition, playerVelocity) {
        let bestSlingshot = { available: false };
        
        this.systems.forEach(system => {
            const dist = playerPosition.distanceTo(system.position);
            
            if (dist < this.SLINGSHOT_MAX_DIST && dist > this.SLINGSHOT_MIN_DIST) {
                const toStar = new THREE.Vector3().subVectors(system.position, playerPosition).normalize();
                const velDir = playerVelocity.clone().normalize();
                
                // Calculate perpendicular direction
                const slingshotDir = new THREE.Vector3().crossVectors(toStar, velDir).normalize();
                
                // Efficiency based on distance
                const efficiency = 1 - (dist - this.SLINGSHOT_MIN_DIST) / 
                    (this.SLINGSHOT_MAX_DIST - this.SLINGSHOT_MIN_DIST);
                
                if (efficiency > bestSlingshot.efficiency || !bestSlingshot.available) {
                    bestSlingshot = {
                        available: true,
                        direction: slingshotDir,
                        efficiency: efficiency,
                        boost: efficiency * 500
                    };
                }
            }
        });
        
        return bestSlingshot;
    }
    
    /**
     * Get mini map data
     */
    getMiniMapData(playerPosition, range = 500) {
        const bodies = [];
        
        this.systems.forEach(system => {
            const systemDist = playerPosition.distanceTo(system.position);
            if (systemDist < range * 3) {
                // Star
                bodies.push({
                    type: 'star',
                    x: (system.position.x - playerPosition.x) * 0.5,
                    z: (system.position.z - playerPosition.z) * 0.5,
                    color: system.star.color,
                    size: 8
                });
                
                // Planets
                system.planets.forEach(planet => {
                    const px = (planet.mesh.position.x - playerPosition.x) * 0.5;
                    const pz = (planet.mesh.position.z - playerPosition.z) * 0.5;
                    
                    if (Math.abs(px) < 100 && Math.abs(pz) < 100) {
                        bodies.push({
                            type: 'planet',
                            x: px,
                            z: pz,
                            color: planet.color,
                            size: Math.max(3, planet.radius * 0.2)
                        });
                    }
                });
            }
        });
        
        return bodies;
    }
}

// Export for use in game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SolarSystemVoxelManager;
}
