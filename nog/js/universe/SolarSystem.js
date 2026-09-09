/**
 * SolarSystem.js - Full Solar System with Physics
 * Includes star, orbiting planets, moons, gravity, and terrain
 */

class SolarSystemManager {
    constructor(scene, seed = Math.random() * 100000) {
        this.scene = scene;
        this.seed = seed;
        this.rng = new SeededRandom(seed);
        this.systems = new Map(); // Map of "x,y,z" -> SolarSystem
        this.activeSystem = null;
        this.terrainGenerator = new TerrainGenerator(seed);
        
        // Physics constants
        this.G = 6.674e-11; // Gravitational constant (scaled for game)
        this.GAME_SCALE = 1e-8; // Scale factor for game physics
        this.STAR_DEATH_RADIUS = 30; // Distance to star for instant death
        this.LANDING_DISTANCE = 50; // Distance to start landing
        this.LANDING_SPEED = 20; // Max speed for landing
        
        // Collision groups
        this.colliders = [];
    }
    
    /**
     * Generate or retrieve a solar system at specific coordinates
     */
    getSystemAt(x, y, z) {
        const key = `${Math.floor(x/100)},${Math.floor(y/100)},${Math.floor(z/100)}`;
        
        if (!this.systems.has(key)) {
            const systemSeed = this.rng.next() * 100000;
            const system = new SolarSystem(this.scene, x, y, z, systemSeed, this.terrainGenerator);
            system.generate();
            this.systems.set(key, system);
            
            // Add system colliders to global list
            this.colliders.push(...system.getColliders());
        }
        
        return this.systems.get(key);
    }
    
    /**
     * Update all active solar systems
     */
    update(deltaTime) {
        this.systems.forEach(system => {
            system.update(deltaTime);
        });
    }
    
    /**
     * Calculate gravitational forces on a player
     */
    calculateGravity(playerPosition, playerMass = 1) {
        let totalForce = new THREE.Vector3(0, 0, 0);
        let nearStar = null;
        let minStarDist = Infinity;
        
        this.systems.forEach(system => {
            const gravity = system.calculateGravity(playerPosition, playerMass);
            totalForce.add(gravity.force);
            
            if (gravity.starDistance < minStarDist) {
                minStarDist = gravity.starDistance;
                nearStar = system.star;
            }
        });
        
        return {
            force: totalForce,
            starDistance: minStarDist,
            nearStar: nearStar,
            inDeathZone: minStarDist < this.STAR_DEATH_RADIUS
        };
    }
    
    /**
     * Check for collisions with celestial bodies
     */
    checkCollisions(playerPosition, playerRadius = 10) {
        const collisions = [];
        
        this.systems.forEach(system => {
            const systemCollisions = system.checkCollisions(playerPosition, playerRadius);
            collisions.push(...systemCollisions);
        });
        
        return collisions;
    }
    
    /**
     * Get landing target for a planet
     */
    getLandingTarget(playerPosition) {
        let bestTarget = null;
        let bestDist = this.LANDING_DISTANCE;
        
        this.systems.forEach(system => {
            const target = system.getLandingTarget(playerPosition, bestDist);
            if (target && target.distance < bestDist) {
                bestTarget = target;
                bestDist = target.distance;
            }
        });
        
        return bestTarget;
    }
    
    /**
     * Render distant systems as skybox
     */
    renderDistantSystems(cameraPosition, scene) {
        // Implementation for LOD - show distant systems as glowing points
    }
}

class SolarSystem {
    constructor(scene, x, y, z, seed, terrainGenerator) {
        this.scene = scene;
        this.centerPosition = new THREE.Vector3(x, y, z);
        this.seed = seed;
        this.rng = new SeededRandom(seed);
        this.terrainGenerator = terrainGenerator;
        
        this.star = null;
        this.planets = [];
        this.moons = [];
        this.asteroids = [];
        
        this.starMesh = null;
        this.planetMeshes = [];
        this.moonMeshes = [];
        
        this.isGenerated = false;
        
        // Active objects for physics
        this.bodies = [];
    }
    
    generate() {
        if (this.isGenerated) return;
        
        console.log(`[SolarSystem] Generating system at ${this.centerPosition.x}, ${this.centerPosition.y}, ${this.centerPosition.z}`);
        
        // Generate star
        this.generateStar();
        
        // Generate planets
        this.generatePlanets();
        
        // Generate asteroid belt
        this.generateAsteroids();
        
        this.isGenerated = true;
    }
    
    generateStar() {
        const starTypes = [
            { name: "Red Dwarf", color: 0xff4444, temp: 3000, mass: 0.5, radius: 20, luminosity: 0.01, lightColor: 0xff6644 },
            { name: "Yellow Dwarf", color: 0xffff88, temp: 5700, mass: 1.0, radius: 25, luminosity: 1.0, lightColor: 0xffffcc },
            { name: "Blue Giant", color: 0x8888ff, temp: 30000, mass: 20.0, radius: 50, luminosity: 10000, lightColor: 0xaaaaff },
            { name: "White Dwarf", color: 0xffffff, temp: 10000, mass: 1.4, radius: 10, luminosity: 0.1, lightColor: 0xffffff },
            { name: "Red Giant", color: 0xff6644, temp: 3500, mass: 1.5, radius: 80, luminosity: 500, lightColor: 0xffaa66 },
            { name: "Neutron Star", color: 0xaaaaff, temp: 600000, mass: 1.4, radius: 5, luminosity: 0.5, lightColor: 0xccccff },
            { name: "Binary Star", color: 0xffaa44, temp: 6000, mass: 2.5, radius: 35, luminosity: 5.0, lightColor: 0xffdd88 }
        ];
        
        const type = starTypes[this.rng.int(0, starTypes.length)];
        
        this.star = {
            name: type.name,
            color: type.color,
            lightColor: type.lightColor,
            mass: type.mass * 1e30, // Solar masses to kg
            radius: type.radius,
            luminosity: type.luminosity,
            position: this.centerPosition.clone(),
            temperature: type.temp,
            age: this.rng.range(0.1, 13.8),
            pulsing: type.name === "Neutron Star" || type.name === "Red Giant",
            pulsePhase: 0
        };
        
        // Create star mesh
        const geometry = new THREE.SphereGeometry(this.star.radius, 32, 32);
        
        // Custom shader material for star glow
        const material = new THREE.ShaderMaterial({
            uniforms: {
                color: { value: new THREE.Color(type.color) },
                time: { value: 0 },
                pulseSpeed: { value: type.name === "Neutron Star" ? 10.0 : (type.name === "Red Giant" ? 2.0 : 1.0) }
            },
            vertexShader: `
                varying vec3 vNormal;
                varying vec3 vPosition;
                uniform float time;
                uniform float pulseSpeed;
                
                void main() {
                    vNormal = normalize(normalMatrix * normal);
                    vPosition = position;
                    
                    vec3 pos = position;
                    float pulse = sin(time * pulseSpeed) * 0.05;
                    pos *= (1.0 + pulse);
                    
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 color;
                uniform float time;
                varying vec3 vNormal;
                varying vec3 vPosition;
                
                void main() {
                    float intensity = pow(0.7 - dot(vNormal, vec3(0, 0, 1.0)), 2.0);
                    vec3 glow = color * intensity * 2.0;
                    
                    // Core
                    float core = 1.0 - length(vPosition) / 25.0;
                    core = max(0.0, core);
                    
                    gl_FragColor = vec4(color * core + glow, 1.0);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        this.starMesh = new THREE.Mesh(geometry, material);
        this.starMesh.position.copy(this.centerPosition);
        this.scene.add(this.starMesh);
        
        // Add star light
        const light = new THREE.PointLight(type.lightColor, 2, 2000);
        light.position.copy(this.centerPosition);
        light.castShadow = true;
        light.shadow.mapSize.width = 2048;
        light.shadow.mapSize.height = 2048;
        this.scene.add(light);
        this.star.light = light;
        
        // Add corona effect
        const coronaGeo = new THREE.SphereGeometry(this.star.radius * 1.5, 32, 32);
        const coronaMat = new THREE.MeshBasicMaterial({
            color: type.color,
            transparent: true,
            opacity: 0.2,
            side: THREE.BackSide
        });
        this.starCorona = new THREE.Mesh(coronaGeo, coronaMat);
        this.starCorona.position.copy(this.centerPosition);
        this.scene.add(this.starCorona);
        
        // Add to physics bodies
        this.bodies.push({
            type: 'star',
            data: this.star,
            mesh: this.starMesh,
            mass: this.star.mass,
            radius: this.star.radius,
            position: this.star.position
        });
    }
    
    generatePlanets() {
        const numPlanets = this.rng.int(3, 12);
        let orbitDistance = this.rng.range(150, 250);
        
        const planetTypes = [
            { name: "Rocky", size: 1.0, hasAtmosphere: true, canLand: true, color: 0x8B7355 },
            { name: "Metallic", size: 0.8, hasAtmosphere: false, canLand: true, color: 0x708090 },
            { name: "Crystalline", size: 0.9, hasAtmosphere: false, canLand: true, color: 0x9370DB },
            { name: "Glacial", size: 1.1, hasAtmosphere: true, canLand: true, color: 0xB0E0E6 },
            { name: "Gaia", size: 1.0, hasAtmosphere: true, canLand: true, color: 0x228B22 },
            { name: "Volcanic", size: 1.0, hasAtmosphere: true, canLand: false, color: 0xFF4500 },
            { name: "Gas Giant", size: 4.0, hasAtmosphere: true, canLand: false, color: 0xDAA520 },
            { name: "Ice Giant", size: 3.5, hasAtmosphere: true, canLand: false, color: 0x00CED1 },
            { name: "Desert", size: 0.9, hasAtmosphere: true, canLand: true, color: 0xEDC9AF },
            { name: "Toxic", size: 0.95, hasAtmosphere: true, canLand: false, color: 0x9ACD32 }
        ];
        
        for (let i = 0; i < numPlanets; i++) {
            const type = planetTypes[this.rng.int(0, planetTypes.length)];
            const planetRadius = type.size * this.rng.range(15, 25);
            
            const planet = {
                name: `${this.star.name} ${String.fromCharCode(98 + i)}`,
                type: type.name,
                color: type.color,
                radius: planetRadius,
                mass: planetRadius * planetRadius * planetRadius * 1000, // Simplified mass
                distance: orbitDistance,
                angle: this.rng.range(0, Math.PI * 2),
                orbitalSpeed: Math.sqrt(6.674e-11 * this.star.mass / orbitDistance) * 0.0001,
                rotationSpeed: this.rng.range(0.001, 0.01),
                axialTilt: this.rng.range(-0.5, 0.5),
                canLand: type.canLand,
                hasAtmosphere: type.hasAtmosphere,
                moons: [],
                seed: this.rng.next() * 100000
            };
            
            // Generate planet mesh with terrain
            this.generatePlanetMesh(planet);
            
            this.planets.push(planet);
            this.planetMeshes.push(planet.mesh);
            
            // Generate moons
            if (type.size > 1.5 && this.rng.next() > 0.3) {
                this.generateMoons(planet);
            }
            
            // Calculate next orbit distance
            orbitDistance *= this.rng.range(1.4, 2.0);
            
            // Add to physics bodies
            this.bodies.push({
                type: 'planet',
                data: planet,
                mesh: planet.mesh,
                mass: planet.mass,
                radius: planet.radius,
                position: new THREE.Vector3()
            });
        }
    }
    
    generatePlanetMesh(planet) {
        // High detail geometry for close approach
        const geometry = new THREE.IcosahedronGeometry(planet.radius, 32);
        
        // Generate terrain using brain waste noise
        const positions = geometry.attributes.position;
        const colors = [];
        const noiseOffset = planet.seed;
        
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            
            // Get terrain displacement from brain noise
            const noise = this.terrainGenerator.getNoise(x * 0.1 + noiseOffset, y * 0.1 + noiseOffset, z * 0.1 + noiseOffset);
            const displacement = noise * planet.radius * 0.15;
            
            // Apply displacement
            const length = Math.sqrt(x*x + y*y + z*z);
            const scale = (length + displacement) / length;
            
            positions.setXYZ(i, x * scale, y * scale, z * scale);
            
            // Color based on height and noise
            let color = new THREE.Color(planet.color);
            
            if (noise > 0.3) {
                // Mountains - darker
                color.multiplyScalar(0.7);
            } else if (noise < -0.2) {
                // Valleys - lighter or blue (water)
                if (planet.type === "Gaia" || planet.type === "Rocky") {
                    color.setHex(0x0066cc);
                } else {
                    color.multiplyScalar(1.2);
                }
            }
            
            colors.push(color.r, color.g, color.b);
        }
        
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        geometry.computeVertexNormals();
        
        // Material with vertex colors
        const material = new THREE.MeshStandardMaterial({
            vertexColors: true,
            roughness: 0.8,
            metalness: 0.2
        });
        
        planet.mesh = new THREE.Mesh(geometry, material);
        planet.mesh.castShadow = true;
        planet.mesh.receiveShadow = true;
        
        // Add atmosphere if applicable
        if (planet.hasAtmosphere) {
            const atmoGeo = new THREE.SphereGeometry(planet.radius * 1.1, 32, 32);
            const atmoMat = new THREE.ShaderMaterial({
                uniforms: {
                    color: { value: new THREE.Color(planet.color) }
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
                    varying vec3 vNormal;
                    void main() {
                        float intensity = pow(0.6 - dot(vNormal, vec3(0, 0, 1.0)), 3.0);
                        gl_FragColor = vec4(color, intensity * 0.4);
                    }
                `,
                transparent: true,
                blending: THREE.AdditiveBlending,
                side: THREE.BackSide
            });
            
            planet.atmosphere = new THREE.Mesh(atmoGeo, atmoMat);
            planet.mesh.add(planet.atmosphere);
        }
        
        this.scene.add(planet.mesh);
    }
    
    generateMoons(planet) {
        const numMoons = this.rng.int(1, 4);
        let moonOrbitDistance = planet.radius * 3;
        
        for (let m = 0; m < numMoons; m++) {
            const moon = {
                name: `${planet.name}-${m + 1}`,
                radius: planet.radius * this.rng.range(0.2, 0.4),
                mass: planet.mass * 0.01,
                distance: moonOrbitDistance,
                angle: this.rng.range(0, Math.PI * 2),
                orbitalSpeed: this.rng.range(0.002, 0.008),
                seed: this.rng.next() * 100000
            };
            
            // Generate moon mesh
            const geometry = new THREE.IcosahedronGeometry(moon.radius, 16);
            const material = new THREE.MeshStandardMaterial({
                color: 0x888888,
                roughness: 0.9
            });
            
            // Add simple terrain
            const positions = geometry.attributes.position;
            for (let i = 0; i < positions.count; i++) {
                const x = positions.getX(i);
                const y = positions.getY(i);
                const z = positions.getZ(i);
                const noise = this.terrainGenerator.getNoise(x * 0.2 + moon.seed, y * 0.2 + moon.seed, z * 0.2 + moon.seed);
                const scale = 1 + noise * 0.1;
                positions.setXYZ(i, x * scale, y * scale, z * scale);
            }
            geometry.computeVertexNormals();
            
            moon.mesh = new THREE.Mesh(geometry, material);
            moon.mesh.castShadow = true;
            moon.mesh.receiveShadow = true;
            
            this.scene.add(moon.mesh);
            
            planet.moons.push(moon);
            this.moons.push(moon);
            
            moonOrbitDistance *= 1.5;
        }
    }
    
    generateAsteroids() {
        const beltDistance = this.planets.length > 2 ? 
            (this.planets[2].distance + this.planets[3]?.distance || this.planets[2].distance * 2) / 2 : 
            800;
        
        const numAsteroids = this.rng.int(50, 150);
        
        for (let i = 0; i < numAsteroids; i++) {
            const angle = this.rng.range(0, Math.PI * 2);
            const distance = beltDistance + this.rng.range(-100, 100);
            const size = this.rng.range(2, 8);
            
            const geometry = new THREE.DodecahedronGeometry(size, 0);
            
            // Randomize vertices for irregular shape
            const positions = geometry.attributes.position;
            for (let j = 0; j < positions.count; j++) {
                const x = positions.getX(j);
                const y = positions.getY(j);
                const z = positions.getZ(j);
                const jitter = this.rng.range(0.7, 1.3);
                positions.setXYZ(j, x * jitter, y * jitter, z * jitter);
            }
            geometry.computeVertexNormals();
            
            const material = new THREE.MeshStandardMaterial({
                color: 0x666666,
                roughness: 0.9
            });
            
            const asteroid = new THREE.Mesh(geometry, material);
            asteroid.castShadow = true;
            asteroid.receiveShadow = true;
            
            const asteroidData = {
                angle: angle,
                distance: distance,
                orbitalSpeed: this.rng.range(0.0001, 0.0005),
                rotationSpeed: this.rng.range(0.001, 0.01),
                mesh: asteroid,
                radius: size,
                mass: size * size * size
            };
            
            this.asteroids.push(asteroidData);
            this.scene.add(asteroid);
        }
    }
    
    update(deltaTime) {
        const time = Date.now() * 0.001;
        
        // Update star pulse
        if (this.star && this.starMesh) {
            this.starMesh.material.uniforms.time.value = time;
            this.star.pulsePhase = (this.star.pulsePhase + deltaTime * (this.star.pulsing ? 5 : 1)) % (Math.PI * 2);
            
            // Rotate corona
            if (this.starCorona) {
                this.starCorona.rotation.y += deltaTime * 0.1;
            }
        }
        
        // Update planets
        this.planets.forEach(planet => {
            // Orbit around star
            planet.angle += planet.orbitalSpeed * deltaTime;
            
            const x = this.centerPosition.x + Math.cos(planet.angle) * planet.distance;
            const z = this.centerPosition.z + Math.sin(planet.angle) * planet.distance;
            const y = this.centerPosition.y + Math.sin(planet.angle * 0.1) * planet.distance * 0.05;
            
            planet.mesh.position.set(x, y, z);
            
            // Rotate planet
            planet.mesh.rotation.y += planet.rotationSpeed * deltaTime;
            
            // Update physics body position
            const body = this.bodies.find(b => b.data === planet);
            if (body) {
                body.position.copy(planet.mesh.position);
            }
            
            // Update moons
            planet.moons.forEach(moon => {
                moon.angle += moon.orbitalSpeed * deltaTime;
                
                const mx = x + Math.cos(moon.angle) * moon.distance;
                const mz = z + Math.sin(moon.angle) * moon.distance;
                const my = y + Math.sin(moon.angle * 2) * moon.distance * 0.1;
                
                moon.mesh.position.set(mx, my, mz);
                moon.mesh.rotation.y += moon.rotationSpeed * deltaTime;
            });
        });
        
        // Update asteroids
        this.asteroids.forEach(asteroid => {
            asteroid.angle += asteroid.orbitalSpeed * deltaTime;
            
            const x = this.centerPosition.x + Math.cos(asteroid.angle) * asteroid.distance;
            const z = this.centerPosition.z + Math.sin(asteroid.angle) * asteroid.distance;
            
            asteroid.mesh.position.set(x, this.centerPosition.y + this.rng.range(-20, 20), z);
            asteroid.mesh.rotation.x += asteroid.rotationSpeed * deltaTime;
            asteroid.mesh.rotation.z += asteroid.rotationSpeed * 0.5 * deltaTime;
        });
    }
    
    calculateGravity(playerPosition, playerMass) {
        let totalForce = new THREE.Vector3(0, 0, 0);
        let minStarDist = Infinity;
        
        // Star gravity
        const starDist = playerPosition.distanceTo(this.centerPosition);
        minStarDist = Math.min(minStarDist, starDist);
        
        if (starDist > 0) {
            const starForce = (6.674e-11 * this.star.mass * playerMass) / (starDist * starDist);
            const direction = new THREE.Vector3()
                .subVectors(this.centerPosition, playerPosition)
                .normalize();
            totalForce.add(direction.multiplyScalar(starForce * 1e-5)); // Scaled for gameplay
        }
        
        // Planet gravity
        this.planets.forEach(planet => {
            const dist = playerPosition.distanceTo(planet.mesh.position);
            if (dist > planet.radius) {
                const force = (6.674e-11 * planet.mass * playerMass) / (dist * dist);
                const direction = new THREE.Vector3()
                    .subVectors(planet.mesh.position, playerPosition)
                    .normalize();
                totalForce.add(direction.multiplyScalar(force * 1e-5));
            }
        });
        
        return { force: totalForce, starDistance: minStarDist };
    }
    
    checkCollisions(playerPosition, playerRadius) {
        const collisions = [];
        
        // Check star collision (death)
        const starDist = playerPosition.distanceTo(this.centerPosition);
        if (starDist < this.star.radius + playerRadius) {
            collisions.push({
                type: 'star',
                body: this.star,
                distance: starDist,
                fatal: true
            });
        }
        
        // Check planet collisions
        this.planets.forEach(planet => {
            const dist = playerPosition.distanceTo(planet.mesh.position);
            if (dist < planet.radius + playerRadius) {
                collisions.push({
                    type: 'planet',
                    body: planet,
                    distance: dist,
                    canLand: planet.canLand,
                    normal: new THREE.Vector3().subVectors(playerPosition, planet.mesh.position).normalize()
                });
            }
        });
        
        // Check moon collisions
        this.moons.forEach(moon => {
            const dist = playerPosition.distanceTo(moon.mesh.position);
            if (dist < moon.radius + playerRadius) {
                collisions.push({
                    type: 'moon',
                    body: moon,
                    distance: dist,
                    canLand: true,
                    normal: new THREE.Vector3().subVectors(playerPosition, moon.mesh.position).normalize()
                });
            }
        });
        
        // Check asteroid collisions
        this.asteroids.forEach(asteroid => {
            const dist = playerPosition.distanceTo(asteroid.mesh.position);
            if (dist < asteroid.radius + playerRadius) {
                collisions.push({
                    type: 'asteroid',
                    body: asteroid,
                    distance: dist,
                    fatal: false,
                    damage: 20
                });
            }
        });
        
        return collisions;
    }
    
    getLandingTarget(playerPosition, maxDist) {
        // Check planets
        for (const planet of this.planets) {
            if (!planet.canLand) continue;
            
            const dist = playerPosition.distanceTo(planet.mesh.position);
            if (dist < planet.radius + maxDist && dist > planet.radius) {
                return {
                    type: 'planet',
                    body: planet,
                    distance: dist - planet.radius,
                    position: planet.mesh.position.clone(),
                    landingPoint: new THREE.Vector3()
                        .subVectors(playerPosition, planet.mesh.position)
                        .normalize()
                        .multiplyScalar(planet.radius)
                        .add(planet.mesh.position)
                };
            }
        }
        
        // Check moons
        for (const moon of this.moons) {
            const dist = playerPosition.distanceTo(moon.mesh.position);
            if (dist < moon.radius + maxDist && dist > moon.radius) {
                return {
                    type: 'moon',
                    body: moon,
                    distance: dist - moon.radius,
                    position: moon.mesh.position.clone(),
                    landingPoint: new THREE.Vector3()
                        .subVectors(playerPosition, moon.mesh.position)
                        .normalize()
                        .multiplyScalar(moon.radius)
                        .add(moon.mesh.position)
                };
            }
        }
        
        return null;
    }
    
    getColliders() {
        return this.bodies;
    }
    
    /**
     * Get slingshot trajectory around star
     */
    calculateSlingshot(playerPosition, playerVelocity) {
        const starPos = this.centerPosition;
        const dist = playerPosition.distanceTo(starPos);
        
        if (dist < 200 && dist > this.star.radius + 50) {
            // Calculate tangent direction for slingshot
            const toStar = new THREE.Vector3().subVectors(starPos, playerPosition).normalize();
            const velocityDir = playerVelocity.clone().normalize();
            
            // Perpendicular vector for slingshot
            const slingshotDir = new THREE.Vector3().crossVectors(toStar, velocityDir).normalize();
            
            // Boost factor based on how close to star
            const boost = (200 - dist) / 200 * 2;
            
            return {
                available: true,
                boost: boost,
                direction: slingshotDir,
                efficiency: Math.min(1.0, (200 - dist) / 100)
            };
        }
        
        return { available: false };
    }
}

/**
 * Terrain Generator using brain waste noise
 */
class TerrainGenerator {
    constructor(seed) {
        this.seed = seed;
        this.perm = this.generatePermutation();
    }
    
    generatePermutation() {
        const p = [];
        for (let i = 0; i < 256; i++) p[i] = i;
        
        // Shuffle
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [p[i], p[j]] = [p[j], p[i]];
        }
        
        // Duplicate for overflow
        return [...p, ...p];
    }
    
    fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    lerp(t, a, b) {
        return a + t * (b - a);
    }
    
    grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }
    
    noise(x, y, z) {
        // Scale for terrain detail
        x = (x + this.seed) * 0.5;
        y = (y + this.seed) * 0.5;
        z = (z + this.seed) * 0.5;
        
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;
        
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);
        
        const u = this.fade(x);
        const v = this.fade(y);
        const w = this.fade(z);
        
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
    
    /**
     * Multi-octave noise for terrain detail
     */
    getNoise(x, y, z, octaves = 4) {
        let value = 0;
        let amplitude = 1;
        let frequency = 1;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            value += this.noise(x * frequency, y * frequency, z * frequency) * amplitude;
            maxValue += amplitude;
            amplitude *= 0.5;
            frequency *= 2;
        }
        
        return value / maxValue;
    }
}

// Seeded Random (from Universe.js)
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

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { SolarSystemManager, SolarSystem, TerrainGenerator };
}
