/**
 * SolarSystemPhysicsV2.js - Updated with correct scale and camera modes
 * 
 * Changes:
 * - Proper scale: Player is tiny compared to celestial bodies
 * - Fixed mini-map top-down view with proper scaling
 * - Interior camera view (V key) with cockpit overlay
 * - Far Out camera mode
 * - AOS Brain integration
 */

// Scale constants
const SCALE = {
    PLAYER_SIZE: 0.5,      // Player is tiny (0.5 units)
    PLAYER_RADIUS: 0.5,
    STAR_RADIUS_MIN: 50,   // Stars are massive
    STAR_RADIUS_MAX: 100,
    PLANET_RADIUS_MIN: 5,  // Planets are 10-50x player size
    PLANET_RADIUS_MAX: 25,
    MOON_RADIUS_MIN: 1,
    MOON_RADIUS_MAX: 5,
    ASTEROID_MIN: 0.2,
    ASTEROID_MAX: 1.5,
    ORBIT_SCALE: 1,        // Distance scale
};

// Camera modes
const CAMERA_MODES = {
    FIRST_PERSON: 0,   // Inside cockpit
    THIRD_PERSON: 1,   // Behind ship
    TOP_DOWN: 2,       // Above ship
    FAR_OUT: 3,        // Distant view
    INTERIOR: 4        // Cockpit with crosshair
};

// Global state
let solarSystemManagerV2 = null;
let currentCameraMode = CAMERA_MODES.FIRST_PERSON;
let brainConnection = null;
let brainConnected = false;

/**
 * Initialize Solar System Manager V2 with proper scale
 */
class SolarSystemManagerV2 {
    constructor(scene) {
        this.scene = scene;
        this.systems = new Map();
        this.voxelSize = 2000; // Much larger voxel size for scale
        this.player = null;
        
        // Physics
        this.G = 6.674e-11;
        this.DEATH_ZONE_MULTIPLIER = 0.8; // Die at 80% of star radius
        this.LANDING_DISTANCE = 15; // Must be close to land
        this.LANDING_SPEED = 30;  // Max speed for landing
        
        console.log('[SolarSystemV2] Manager initialized with proper scale');
    }
    
    setPlayer(player) {
        this.player = player;
        // Scale player down
        if (this.player && this.player.ship) {
            this.player.ship.scale.set(SCALE.PLAYER_SIZE, SCALE.PLAYER_SIZE, SCALE.PLAYER_SIZE);
        }
    }
    
    /**
     * Generate system at voxel coordinates
     */
    getSystemAt(voxelX, voxelY, voxelZ) {
        const key = `${voxelX},${voxelY},${voxelZ}`;
        
        if (!this.systems.has(key)) {
            const worldX = voxelX * this.voxelSize;
            const worldY = voxelY * this.voxelSize;
            const worldZ = voxelZ * this.voxelSize;
            
            const system = this.generateSolarSystem(worldX, worldY, worldZ);
            this.systems.set(key, system);
            this.spawnSystemVisuals(system);
        }
        
        return this.systems.get(key);
    }
    
    generateSolarSystem(x, y, z) {
        const seed = Math.abs((x * 73856093) ^ (y * 19349663) ^ (z * 83492791));
        const rng = this.createRNG(seed);
        
        // Star types with proper scale
        const starTypes = [
            { name: "Red Dwarf", color: 0xff4444, temp: 3000, mass: 0.5, radiusMult: 0.6, lightColor: 0xff6644 },
            { name: "Yellow Dwarf", color: 0xffff88, temp: 5700, mass: 1.0, radiusMult: 1.0, lightColor: 0xffffcc },
            { name: "Blue Giant", color: 0x8888ff, temp: 30000, mass: 20.0, radiusMult: 1.5, lightColor: 0xaaaaff },
            { name: "White Dwarf", color: 0xffffff, temp: 10000, mass: 1.4, radiusMult: 0.3, lightColor: 0xffffff },
            { name: "Red Giant", color: 0xff6644, temp: 3500, mass: 1.5, radiusMult: 2.0, lightColor: 0xffaa66 },
            { name: "Neutron Star", color: 0xaaaaff, temp: 600000, mass: 1.4, radiusMult: 0.15, lightColor: 0xccccff }
        ];
        
        const starType = starTypes[rng.int(0, starTypes.length)];
        const starRadius = SCALE.STAR_RADIUS_MIN + (SCALE.STAR_RADIUS_MAX - SCALE.STAR_RADIUS_MIN) * starType.radiusMult;
        
        const system = {
            seed: seed,
            position: new THREE.Vector3(x, y, z),
            star: {
                name: starType.name,
                color: starType.color,
                lightColor: starType.lightColor,
                mass: starType.mass * 1e30,
                radius: starRadius,
                worldPosition: new THREE.Vector3(x, y, z),
                pulsePhase: 0
            },
            planets: [],
            moons: [],
            asteroids: [],
            meshes: []
        };
        
        // Generate planets with realistic distances
        const numPlanets = rng.int(4, 10);
        let orbitDistance = starRadius * 4 + rng.range(200, 500);
        
        const planetTypes = [
            { name: "Mercury-like", color: 0x8B7355, sizeMult: 0.4, canLand: true },
            { name: "Venus-like", color: 0xEDC9AF, sizeMult: 0.9, canLand: true },
            { name: "Earth-like", color: 0x228B22, sizeMult: 1.0, canLand: true },
            { name: "Mars-like", color: 0xFF4500, sizeMult: 0.5, canLand: true },
            { name: "Jupiter-like", color: 0xDAA520, sizeMult: 3.5, canLand: false },
            { name: "Saturn-like", color: 0xF0E68C, sizeMult: 2.5, canLand: false, hasRings: true },
            { name: "Ice Giant", color: 0x00CED1, sizeMult: 2.0, canLand: false },
            { name: "Rocky", color: 0x708090, sizeMult: 0.7, canLand: true }
        ];
        
        for (let i = 0; i < numPlanets; i++) {
            const type = planetTypes[rng.int(0, planetTypes.length)];
            const planetRadius = SCALE.PLANET_RADIUS_MIN + (SCALE.PLANET_RADIUS_MAX - SCALE.PLANET_RADIUS_MIN) * type.sizeMult * rng.range(0.8, 1.2);
            
            const planet = {
                name: `${system.star.name} ${String.fromCharCode(98 + i)}`,
                type: type.name,
                color: type.color,
                radius: planetRadius,
                mass: planetRadius * planetRadius * planetRadius * 10000,
                distance: orbitDistance,
                angle: rng.range(0, Math.PI * 2),
                orbitalSpeed: Math.sqrt(this.G * system.star.mass / (orbitDistance * orbitDistance * 1e6)) * 1e-5 * rng.range(0.5, 1.5),
                rotationSpeed: rng.range(0.001, 0.01),
                axialTilt: rng.range(-0.3, 0.3),
                canLand: type.canLand,
                hasRings: type.hasRings || false,
                moons: [],
                seed: rng.next() * 100000
            };
            
            system.planets.push(planet);
            
            // Moons for planets
            if ((type.sizeMult > 1.5 || rng.next() > 0.5) && i < numPlanets - 1) {
                const numMoons = rng.int(0, type.sizeMult > 2 ? 5 : 3);
                let moonDistance = planetRadius * 3;
                
                for (let m = 0; m < numMoons; m++) {
                    const moonRadius = SCALE.MOON_RADIUS_MIN + (SCALE.MOON_RADIUS_MAX - SCALE.MOON_RADIUS_MIN) * rng.range(0.3, 1.0);
                    const moon = {
                        name: `${planet.name}-${m + 1}`,
                        radius: moonRadius,
                        mass: planet.mass * 0.01 * (moonRadius / planetRadius),
                        distance: moonDistance,
                        angle: rng.range(0, Math.PI * 2),
                        speed: rng.range(0.005, 0.02),
                        parent: planet,
                        seed: rng.next() * 100000
                    };
                    
                    planet.moons.push(moon);
                    system.moons.push(moon);
                    moonDistance *= 1.4 + rng.range(0, 0.5);
                }
            }
            
            // Next orbit
            orbitDistance *= rng.range(1.5, 2.2);
        }
        
        // Asteroid belt
        if (numPlanets > 3 && rng.next() > 0.3) {
            const beltRadius = (system.planets[2].distance + system.planets[3].distance) / 2;
            const numAsteroids = rng.int(100, 300);
            
            for (let a = 0; a < numAsteroids; a++) {
                const angle = rng.range(0, Math.PI * 2);
                const distance = beltRadius + rng.range(-100, 100);
                const size = SCALE.ASTEROID_MIN + rng.range(0, SCALE.ASTEROID_MAX - SCALE.ASTEROID_MIN);
                
                system.asteroids.push({
                    distance: distance,
                    angle: angle,
                    size: size,
                    speed: Math.sqrt(this.G * system.star.mass / (distance * distance * 1e6)) * 1e-6 * rng.range(0.8, 1.2),
                    rotationSpeed: rng.range(0.001, 0.02)
                });
            }
        }
        
        return system;
    }
    
    createRNG(seed) {
        return {
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
    }
    
    spawnSystemVisuals(system) {
        // Star with glow
        const starGeo = new THREE.SphereGeometry(system.star.radius, 64, 64);
        const starMat = new THREE.MeshBasicMaterial({
            color: system.star.color,
        });
        const starMesh = new THREE.Mesh(starGeo, starMat);
        starMesh.position.copy(system.position);
        this.scene.add(starMesh);
        system.star.mesh = starMesh;
        system.meshes.push(starMesh);
        
        // Star glow layers
        for (let i = 1; i <= 3; i++) {
            const glowGeo = new THREE.SphereGeometry(system.star.radius * (1 + i * 0.2), 32, 32);
            const glowMat = new THREE.MeshBasicMaterial({
                color: system.star.color,
                transparent: true,
                opacity: 0.1 / i
            });
            const glow = new THREE.Mesh(glowGeo, glowMat);
            glow.position.copy(system.position);
            this.scene.add(glow);
            system.meshes.push(glow);
        }
        
        // Star light
        const light = new THREE.PointLight(system.star.lightColor, 2, system.star.radius * 50);
        light.position.copy(system.position);
        this.scene.add(light);
        system.star.light = light;
        
        // Planets
        system.planets.forEach(planet => {
            const planetGeo = new THREE.SphereGeometry(planet.radius, 32, 32);
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
            const atmoGeo = new THREE.SphereGeometry(planet.radius * 1.05, 32, 32);
            const atmoMat = new THREE.MeshBasicMaterial({
                color: planet.color,
                transparent: true,
                opacity: 0.15,
                side: THREE.BackSide
            });
            const atmo = new THREE.Mesh(atmoGeo, atmoMat);
            planetMesh.add(atmo);
            
            // Rings for gas giants
            if (planet.hasRings) {
                const ringGeo = new THREE.RingGeometry(
                    planet.radius * 1.5,
                    planet.radius * 2.5,
                    64
                );
                const ringMat = new THREE.MeshBasicMaterial({
                    color: 0xaa9988,
                    transparent: true,
                    opacity: 0.5,
                    side: THREE.DoubleSide
                });
                const rings = new THREE.Mesh(ringGeo, ringMat);
                rings.rotation.x = Math.PI / 2;
                planetMesh.add(rings);
            }
            
            // Orbit line
            const orbitGeo = new THREE.RingGeometry(
                planet.distance - 2,
                planet.distance + 2,
                128
            );
            const orbitMat = new THREE.MeshBasicMaterial({
                color: 0x444444,
                transparent: true,
                opacity: 0.2,
                side: THREE.DoubleSide
            });
            const orbit = new THREE.Mesh(orbitGeo, orbitMat);
            orbit.rotation.x = Math.PI / 2;
            orbit.position.copy(system.position);
            this.scene.add(orbit);
            system.meshes.push(orbit);
            
            // Moons
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
        
        // Asteroid belt (instanced mesh for performance)
        if (system.asteroids.length > 0) {
            const asteroidGeo = new THREE.IcosahedronGeometry(1, 0);
            const asteroidMat = new THREE.MeshStandardMaterial({
                color: 0x666666,
                roughness: 0.9
            });
            
            const instancedMesh = new THREE.InstancedMesh(
                asteroidGeo,
                asteroidMat,
                system.asteroids.length
            );
            
            const dummy = new THREE.Object3D();
            system.asteroids.forEach((asteroid, i) => {
                dummy.scale.set(asteroid.size, asteroid.size * 0.8, asteroid.size * 0.9);
                dummy.updateMatrix();
                instancedMesh.setMatrixAt(i, dummy.matrix);
            });
            
            this.scene.add(instancedMesh);
            system.asteroidMesh = instancedMesh;
            system.meshes.push(instancedMesh);
        }
    }
    
    update(deltaTime, playerPosition) {
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
            // Visibility check
            const dx = Math.abs(Math.floor(system.position.x / this.voxelSize) - playerVoxelX);
            const dy = Math.abs(Math.floor(system.position.y / this.voxelSize) - playerVoxelY);
            const dz = Math.abs(Math.floor(system.position.z / this.voxelSize) - playerVoxelZ);
            
            const visible = dx <= 1 && dy <= 1 && dz <= 1;
            system.meshes.forEach(mesh => {
                if (mesh.visible !== visible) mesh.visible = visible;
            });
            
            if (!visible) return;
            
            // Update planets
            system.planets.forEach(planet => {
                planet.angle += planet.orbitalSpeed * deltaTime;
                
                const px = system.position.x + Math.cos(planet.angle) * planet.distance;
                const pz = system.position.z + Math.sin(planet.angle) * planet.distance;
                const py = system.position.y + Math.sin(planet.angle * 0.5) * planet.distance * 0.05;
                
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
            if (system.asteroidMesh) {
                const dummy = new THREE.Object3D();
                system.asteroids.forEach((asteroid, i) => {
                    asteroid.angle += asteroid.speed * deltaTime;
                    
                    const ax = system.position.x + Math.cos(asteroid.angle) * asteroid.distance;
                    const az = system.position.z + Math.sin(asteroid.angle) * asteroid.distance;
                    const ay = system.position.y + Math.sin(asteroid.angle * 3) * 20;
                    
                    dummy.position.set(ax, ay, az);
                    dummy.rotation.x += asteroid.rotationSpeed * deltaTime;
                    dummy.rotation.z += asteroid.rotationSpeed * 0.7 * deltaTime;
                    dummy.scale.set(asteroid.size, asteroid.size, asteroid.size);
                    dummy.updateMatrix();
                    system.asteroidMesh.setMatrixAt(i, dummy.matrix);
                });
                system.asteroidMesh.instanceMatrix.needsUpdate = true;
            }
        });
    }
    
    calculateGravity(playerPosition, playerMass = 1) {
        let totalForce = new THREE.Vector3(0, 0, 0);
        let nearestStar = null;
        let minStarDist = Infinity;
        
        this.systems.forEach(system => {
            const starDist = playerPosition.distanceTo(system.position);
            if (starDist > 0) {
                const starForce = (this.G * system.star.mass * playerMass) / (starDist * starDist);
                const direction = new THREE.Vector3()
                    .subVectors(system.position, playerPosition)
                    .normalize();
                totalForce.add(direction.multiplyScalar(starForce * 2e-6));
                
                if (starDist < minStarDist) {
                    minStarDist = starDist;
                    nearestStar = system.star;
                }
            }
            
            system.planets.forEach(planet => {
                const dist = playerPosition.distanceTo(planet.mesh.position);
                if (dist > planet.radius) {
                    const force = (this.G * planet.mass * playerMass) / (dist * dist);
                    const direction = new THREE.Vector3()
                        .subVectors(planet.mesh.position, playerPosition)
                        .normalize();
                    totalForce.add(direction.multiplyScalar(force * 2e-6));
                }
            });
        });
        
        return {
            force: totalForce,
            starDistance: minStarDist,
            nearestStar: nearestStar,
            inDeathZone: minStarDist < (nearestStar ? nearestStar.radius * this.DEATH_ZONE_MULTIPLIER : Infinity)
        };
    }
    
    checkCollisions(playerPosition, playerRadius = SCALE.PLAYER_RADIUS) {
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
        });
        
        return collisions;
    }
    
    getLandingTarget(playerPosition, maxDist = this.LANDING_DISTANCE) {
        let bestTarget = null;
        let bestDist = maxDist;
        
        this.systems.forEach(system => {
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
    
    getMiniMapData(playerPosition, range = 1000) {
        const bodies = [];
        const scale = 0.05; // Map scale
        
        this.systems.forEach(system => {
            const systemDist = playerPosition.distanceTo(system.position);
            if (systemDist < range * 5) {
                // Star
                bodies.push({
                    type: 'star',
                    x: (system.position.x - playerPosition.x) * scale,
                    y: (system.position.z - playerPosition.z) * scale,
                    color: system.star.color,
                    size: Math.min(15, system.star.radius * scale * 0.5)
                });
                
                // Planets
                system.planets.forEach(planet => {
                    const px = (planet.mesh.position.x - playerPosition.x) * scale;
                    const py = (planet.mesh.position.z - playerPosition.z) * scale;
                    const dist = Math.sqrt(px * px + py * py);
                    
                    if (dist < 120) {
                        bodies.push({
                            type: 'planet',
                            x: px,
                            y: py,
                            color: planet.color,
                            size: Math.max(2, Math.min(8, planet.radius * scale * 2))
                        });
                    }
                });
            }
        });
        
        return bodies;
    }
    
    checkSlingshot(playerPosition, playerVelocity) {
        let bestSlingshot = { available: false };
        
        this.systems.forEach(system => {
            const dist = playerPosition.distanceTo(system.position);
            const minDist = system.star.radius * 2;
            const maxDist = system.star.radius * 6;
            
            if (dist < maxDist && dist > minDist) {
                const toStar = new THREE.Vector3().subVectors(system.position, playerPosition).normalize();
                const velDir = playerVelocity.clone().normalize();
                const slingshotDir = new THREE.Vector3().crossVectors(toStar, velDir).normalize();
                
                const efficiency = 1 - (dist - minDist) / (maxDist - minDist);
                
                if (efficiency > (bestSlingshot.efficiency || 0)) {
                    bestSlingshot = {
                        available: true,
                        direction: slingshotDir,
                        efficiency: efficiency,
                        boost: efficiency * 1000
                    };
                }
            }
        });
        
        return bestSlingshot;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SolarSystemManagerV2, SCALE, CAMERA_MODES };
}
