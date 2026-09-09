/**
 * Universe.js - Procedural Universe Generation
 * Generates galaxies, solar systems, planets, and celestial objects
 */

class Universe {
    constructor(seed = Math.random() * 100000) {
        this.seed = seed;
        this.rng = new SeededRandom(seed);
        this.galaxies = [];
        this.solarSystems = [];
        this.currentSystem = null;
        
        // Universe types
        this.types = {
            PRIME: { name: "Prime", color: 0x1a1a2e, density: 1.0 },
            VOID: { name: "Void", color: 0x0a0a0a, density: 0.3 },
            NEBULA: { name: "Nebula", color: 0x2e1a3e, density: 1.5 },
            CLUSTER: { name: "Cluster", color: 0x3e2e1a, density: 3.0 }
        };
        
        this.type = this.types.PRIME;
    }
    
    generate() {
        console.log(`[Universe] Generating with seed ${this.seed}...`);
        
        // Generate galaxy clusters
        const numGalaxies = this.rng.int(50, 150);
        for (let i = 0; i < numGalaxies; i++) {
            this.galaxies.push(new Galaxy(
                this.rng.next() * 100000,
                this.rng.range(-1e12, 1e12),
                this.rng.range(-1e11, 1e11),
                this.rng.range(-1e12, 1e12)
            ));
        }
        
        // Generate local solar system
        this.currentSystem = new SolarSystem(this.rng.next() * 100000, 0, 0, 0);
        
        console.log(`[Universe] Generated ${this.galaxies.length} galaxies`);
        return this;
    }
    
    getCurrentSystem() {
        return this.currentSystem;
    }
    
    serialize() {
        return {
            seed: this.seed,
            type: this.type.name,
            galaxies: this.galaxies.map(g => g.serialize()),
            currentSystem: this.currentSystem ? this.currentSystem.serialize() : null
        };
    }
}

class Galaxy {
    constructor(seed, x, y, z) {
        this.seed = seed;
        this.position = new THREE.Vector3(x, y, z);
        this.rng = new SeededRandom(seed);
        this.stars = [];
        
        this.type = this.rng.int(0, 6); // Spiral, Elliptical, Irregular, etc.
        this.size = this.rng.range(1e9, 1e11);
        
        // Generate star positions (lightweight - just metadata)
        const numStars = this.rng.int(1000, 10000);
        for (let i = 0; i < numStars; i++) {
            this.stars.push({
                x: this.rng.range(-1, 1) * this.size,
                y: this.rng.range(-0.1, 0.1) * this.size,
                z: this.rng.range(-1, 1) * this.size,
                brightness: this.rng.range(0.5, 1.0),
                color: this.rng.range(0.4, 0.9)
            });
        }
    }
    
    serialize() {
        return {
            seed: this.seed,
            position: { x: this.position.x, y: this.position.y, z: this.position.z },
            type: this.type,
            size: this.size,
            starCount: this.stars.length
        };
    }
}

class SolarSystem {
    constructor(seed, x, y, z) {
        this.seed = seed;
        this.position = new THREE.Vector3(x, y, z);
        this.rng = new SeededRandom(seed);
        
        this.star = this.generateStar();
        this.planets = [];
        this.asteroids = [];
        this.blackHoles = [];
        
        this.generatePlanets();
    }
    
    generateStar() {
        const types = [
            { name: "Red Dwarf", color: 0xff4444, temp: 3000, mass: 0.5, radius: 0.3, luminosity: 0.01 },
            { name: "Yellow Dwarf", color: 0xffff88, temp: 5700, mass: 1.0, radius: 1.0, luminosity: 1.0 },
            { name: "Blue Giant", color: 0x8888ff, temp: 30000, mass: 20.0, radius: 10.0, luminosity: 10000 },
            { name: "White Dwarf", color: 0xffffff, temp: 10000, mass: 1.4, radius: 0.01, luminosity: 0.1 },
            { name: "Red Giant", color: 0xff6644, temp: 3500, mass: 1.5, radius: 50.0, luminosity: 500 },
            { name: "Neutron Star", color: 0xaaaaff, temp: 600000, mass: 1.4, radius: 0.02, luminosity: 0.5 }
        ];
        
        const type = types[this.rng.int(0, types.length)];
        return {
            ...type,
            age: this.rng.range(0.1, 13.8) // Billion years
        };
    }
    
    generatePlanets() {
        const numPlanets = this.rng.int(3, 12);
        let orbitDistance = this.rng.range(50e6, 100e6); // meters
        
        const planetTypes = [
            { name: "Asteroid", size: 0.1, atmosphere: false, life: false },
            { name: "Rocky", size: 0.8, atmosphere: true, life: false },
            { name: "Radioactive", size: 0.9, atmosphere: true, life: false },
            { name: "Metallic", size: 0.7, atmosphere: false, life: false },
            { name: "Crystalline", size: 0.6, atmosphere: false, life: false },
            { name: "Glacial", size: 1.0, atmosphere: true, life: false },
            { name: "Gaia", size: 1.0, atmosphere: true, life: true },
            { name: "Volcanic", size: 0.9, atmosphere: true, life: false },
            { name: "Gas Giant", size: 5.0, atmosphere: true, life: false },
            { name: "Rogue", size: 0.8, atmosphere: false, life: false }
        ];
        
        for (let i = 0; i < numPlanets; i++) {
            const type = planetTypes[this.rng.int(0, planetTypes.length)];
            
            // Calculate habitable zone
            const habitableInner = Math.sqrt(this.star.luminosity / 1.1);
            const habitableOuter = Math.sqrt(this.star.luminosity / 0.53);
            const distAU = orbitDistance / 1.496e11;
            const inHabitable = distAU >= habitableInner && distAU <= habitableOuter;
            
            this.planets.push({
                name: `Planet ${i + 1}`,
                type: type.name,
                size: type.size,
                distance: orbitDistance,
                angle: this.rng.range(0, Math.PI * 2),
                orbitalSpeed: Math.sqrt(6.674e-11 * this.star.mass * 1.989e30 / orbitDistance) / 1000,
                habitable: inHabitable && type.life,
                moons: this.generateMoons(type.size),
                resources: this.generateResources(type.name)
            });
            
            orbitDistance *= this.rng.range(1.4, 2.0);
        }
    }
    
    generateMoons(planetSize) {
        if (planetSize < 0.5 || this.rng.next() > 0.6) return [];
        
        const numMoons = this.rng.int(0, 5);
        const moons = [];
        
        for (let m = 0; m < numMoons; m++) {
            moons.push({
                size: planetSize * this.rng.range(0.1, 0.3),
                distance: this.rng.range(3, 10),
                angle: this.rng.range(0, Math.PI * 2),
                speed: this.rng.range(0.001, 0.01)
            });
        }
        
        return moons;
    }
    
    generateResources(planetType) {
        const resources = {
            "Asteroid": ["Iron", "Nickel"],
            "Rocky": ["Iron", "Silicate", "Water"],
            "Radioactive": ["Uranium", "Plutonium"],
            "Metallic": ["Titanium", "Platinum", "Gold"],
            "Crystalline": ["Crystal", "Diamond"],
            "Glacial": ["Water", "Hydrogen", "Oxygen"],
            "Gaia": ["Water", "Organics", "Crystal"],
            "Volcanic": ["Magma", "Sulfur", "Obsidian"],
            "Gas Giant": ["Hydrogen", "Helium"],
            "Rogue": ["Dark Matter"]
        };
        
        return resources[planetType] || ["Unknown"];
    }
    
    serialize() {
        return {
            seed: this.seed,
            position: { x: this.position.x, y: this.position.y, z: this.position.z },
            star: this.star,
            planets: this.planets,
            asteroidCount: this.asteroids.length
        };
    }
}

// Seeded Random Number Generator
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
    
    choice(array) {
        return array[this.int(0, array.length)];
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Universe, Galaxy, SolarSystem, SeededRandom };
}
