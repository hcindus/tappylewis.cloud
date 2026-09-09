/**
 * VoxelShips.js - Procedural and Named Voxel Ships
 * Includes the legendary Gordon spacecraft and other craftable vessels
 */

class VoxelShips {
    constructor() {
        // Ship templates database
        this.templates = {
            gordon: this.createGordonShip.bind(this),
            explorer: this.createExplorerShip.bind(this),
            fighter: this.createFighterShip.bind(this),
            miner: this.createMinerShip.bind(this),
            shuttle: this.createShuttleShip.bind(this)
        };
    }

    /**
     * Create the legendary Gordon ship
     * A robust industrial vessel with distinctive orange and grey styling
     */
    createGordonShip() {
        const group = new THREE.Group();
        group.name = "Gordon";

        // Materials
        const hullMat = new THREE.MeshPhongMaterial({ 
            color: 0x8B7355, // Industrial brown-grey
            shininess: 60 
        });
        const accentMat = new THREE.MeshPhongMaterial({ 
            color: 0xFF6600, // Gordon orange
            emissive: 0xFF2200,
            emissiveIntensity: 0.2,
            shininess: 80 
        });
        const detailMat = new THREE.MeshPhongMaterial({ 
            color: 0x333333,
            shininess: 40 
        });
        const windowMat = new THREE.MeshPhongMaterial({ 
            color: 0x88CCFF,
            transparent: true,
            opacity: 0.8,
            shininess: 100
        });
        const glowMat = new THREE.MeshBasicMaterial({ 
            color: 0xFF6600,
            transparent: true,
            opacity: 0.6
        });

        // Main fuselage - elongated box (the "Gordon sausage")
        const fuselageGeo = new THREE.BoxGeometry(6, 4, 24);
        const fuselage = new THREE.Mesh(fuselageGeo, hullMat);
        fuselage.position.set(0, 0, 0);
        group.add(fuselage);

        // Forward command module (tapered front)
        const noseGeo = new THREE.ConeGeometry(3, 8, 8);
        noseGeo.rotateX(Math.PI / 2);
        const nose = new THREE.Mesh(noseGeo, accentMat);
        nose.position.set(0, 0, -16);
        group.add(nose);

        // Cockpit canopy
        const canopyGeo = new THREE.BoxGeometry(4, 2, 8);
        const canopy = new THREE.Mesh(canopyGeo, windowMat);
        canopy.position.set(0, 2.5, -8);
        group.add(canopy);

        // Upper deck/bridge
        const bridgeGeo = new THREE.BoxGeometry(5, 1, 6);
        const bridge = new THREE.Mesh(bridgeGeo, detailMat);
        bridge.position.set(0, 2.5, -8);
        group.add(bridge);

        // Side pods (fuel/cargo tanks) - Gordon's signature feature
        const podGeo = new THREE.CylinderGeometry(2.5, 2.5, 16, 8);
        podGeo.rotateZ(Math.PI / 2);
        
        const leftPod = new THREE.Mesh(podGeo, accentMat);
        leftPod.position.set(-6, 0, 4);
        group.add(leftPod);

        const rightPod = new THREE.Mesh(podGeo, accentMat);
        rightPod.position.set(6, 0, 4);
        group.add(rightPod);

        // Pod caps
        const podCapGeo = new THREE.SphereGeometry(2.5, 8, 8);
        
        const leftCapFront = new THREE.Mesh(podCapGeo, hullMat);
        leftCapFront.position.set(-6, 0, -4);
        group.add(leftCapFront);

        const leftCapBack = new THREE.Mesh(podCapGeo, hullMat);
        leftCapBack.position.set(-6, 0, 12);
        group.add(leftCapBack);

        const rightCapFront = new THREE.Mesh(podCapGeo, hullMat);
        rightCapFront.position.set(6, 0, -4);
        group.add(rightCapFront);

        const rightCapBack = new THREE.Mesh(podCapGeo, hullMat);
        rightCapBack.position.set(6, 0, 12);
        group.add(rightCapBack);

        // Engine section (rear)
        const engineGeo = new THREE.BoxGeometry(7, 5, 6);
        const engine = new THREE.Mesh(engineGeo, detailMat);
        engine.position.set(0, 0, 15);
        group.add(engine);

        // Main thrusters (3 large engines)
        const thrusterGeo = new THREE.CylinderGeometry(2, 1.5, 4, 8);
        thrusterGeo.rotateX(Math.PI / 2);

        const centerThruster = new THREE.Mesh(thrusterGeo, accentMat);
        centerThruster.position.set(0, 0, 20);
        group.add(centerThruster);

        const leftThruster = new THREE.Mesh(thrusterGeo, accentMat);
        leftThruster.position.set(-3, 0, 19);
        group.add(leftThruster);

        const rightThruster = new THREE.Mesh(thrusterGeo, accentMat);
        rightThruster.position.set(3, 0, 19);
        group.add(rightThruster);

        // Thruster glows
        const glowGeo = new THREE.ConeGeometry(2.5, 8, 8);
        glowGeo.rotateX(-Math.PI / 2);

        this.thrusterGlows = [];
        const positions = [[0, 0, 22], [-3, 0, 21], [3, 0, 21]];
        positions.forEach(pos => {
            const glow = new THREE.Mesh(glowGeo, glowMat.clone());
            glow.position.set(...pos);
            group.add(glow);
            this.thrusterGlows.push(glow);
        });

        // Wing stabilizers (small)
        const wingGeo = new THREE.BoxGeometry(3, 0.5, 8);
        
        const leftWing = new THREE.Mesh(wingGeo, accentMat);
        leftWing.position.set(-4.5, 0, 10);
        group.add(leftWing);

        const rightWing = new THREE.Mesh(wingGeo, accentMat);
        rightWing.position.set(4.5, 0, 10);
        group.add(rightWing);

        // Vertical stabilizer
        const stabilizerGeo = new THREE.BoxGeometry(0.5, 4, 6);
        const stabilizer = new THREE.Mesh(stabilizerGeo, accentMat);
        stabilizer.position.set(0, 4, 14);
        group.add(stabilizer);

        // Antenna array
        const antennaGeo = new THREE.CylinderGeometry(0.1, 0.1, 8);
        const antenna = new THREE.Mesh(antennaGeo, detailMat);
        antenna.position.set(0, 6, 8);
        group.add(antenna);

        // Dish on top
        const dishGeo = new THREE.CylinderGeometry(2, 0.5, 1, 16);
        const dish = new THREE.Mesh(dishGeo, accentMat);
        dish.position.set(0, 6, 8);
        dish.rotation.x = 0.3;
        group.add(dish);

        // Point lights
        const mainLight = new THREE.PointLight(0xFF6600, 1, 50);
        mainLight.position.set(0, 0, 25);
        group.add(mainLight);

        const cockpitLight = new THREE.PointLight(0x88CCFF, 0.5, 20);
        cockpitLight.position.set(0, 3, -8);
        group.add(cockpitLight);

        // Store reference for animation
        group.userData = {
            type: 'gordon',
            name: 'Gordon',
            thrusterGlows: this.thrusterGlows,
            stats: {
                maxSpeed: 4000,
                acceleration: 150,
                rotationSpeed: 1.5,
                cargo: 200,
                fuel: 150
            }
        };

        return group;
    }

    /**
     * Create standard explorer ship
     */
    createExplorerShip() {
        const group = new THREE.Group();
        group.name = "Explorer";

        // Sleek green design (default player ship style)
        const hullMat = new THREE.MeshPhongMaterial({ 
            color: 0x00FF88,
            emissive: 0x004400,
            shininess: 100 
        });
        const cockpitMat = new THREE.MeshPhongMaterial({ 
            color: 0x88CCFF,
            transparent: true,
            opacity: 0.7
        });

        // Main hull
        const hull = new THREE.Mesh(
            new THREE.ConeGeometry(5, 20, 8),
            hullMat
        );
        hull.rotateX(Math.PI / 2);
        group.add(hull);

        // Cockpit
        const cockpit = new THREE.Mesh(
            new THREE.BoxGeometry(3, 2, 4),
            cockpitMat
        );
        cockpit.position.set(0, 2, -2);
        group.add(cockpit);

        // Wings
        const wings = new THREE.Mesh(
            new THREE.BoxGeometry(30, 1, 8),
            new THREE.MeshPhongMaterial({ color: 0x008866 })
        );
        wings.position.set(0, 0, 5);
        group.add(wings);

        // Engines
        const engineGeo = new THREE.CylinderGeometry(2, 3, 6, 8);
        engineGeo.rotateX(Math.PI / 2);
        
        const leftEngine = new THREE.Mesh(engineGeo, new THREE.MeshPhongMaterial({ 
            color: 0xFF6600, emissive: 0xFF2200 
        }));
        leftEngine.position.set(-8, 0, 10);
        group.add(leftEngine);

        const rightEngine = new THREE.Mesh(engineGeo, new THREE.MeshPhongMaterial({ 
            color: 0xFF6600, emissive: 0xFF2200 
        }));
        rightEngine.position.set(8, 0, 10);
        group.add(rightEngine);

        // Glow
        const glow = new THREE.Mesh(
            new THREE.SphereGeometry(4, 8, 8),
            new THREE.MeshBasicMaterial({ 
                color: 0x00FF88, transparent: true, opacity: 0.3 
            })
        );
        glow.position.set(0, 0, 15);
        group.add(glow);
        group.userData.glow = glow;

        group.userData = {
            type: 'explorer',
            name: 'Explorer',
            stats: {
                maxSpeed: 5000,
                acceleration: 200,
                rotationSpeed: 2.0,
                cargo: 100,
                fuel: 100
            }
        };

        return group;
    }

    /**
     * Create a compact fighter
     */
    createFighterShip() {
        const group = new THREE.Group();
        group.name = "Fighter";

        const hullMat = new THREE.MeshPhongMaterial({ 
            color: 0xCC0000,
            emissive: 0x440000,
            shininess: 90
        });

        // Aggressive wedge shape
        const hull = new THREE.Mesh(
            new THREE.ConeGeometry(4, 18, 4),
            hullMat
        );
        hull.rotateX(Math.PI / 2);
        group.add(hull);

        // Swept wings
        const wingShape = new THREE.Shape();
        wingShape.moveTo(0, 0);
        wingShape.lineTo(15, -8);
        wingShape.lineTo(12, 2);
        wingShape.lineTo(0, 4);

        const wingGeo = new THREE.ExtrudeGeometry(wingShape, { depth: 0.5, bevelEnabled: false });
        
        const leftWing = new THREE.Mesh(wingGeo, hullMat);
        leftWing.position.set(-4, 0, 2);
        leftWing.rotation.y = Math.PI;
        group.add(leftWing);

        const rightWing = new THREE.Mesh(wingGeo, hullMat);
        rightWing.position.set(4, 0, 2);
        group.add(rightWing);

        // Twin engines
        const engineGeo = new THREE.CylinderGeometry(1.5, 2, 4, 8);
        engineGeo.rotateX(Math.PI / 2);

        const leftEngine = new THREE.Mesh(engineGeo, new THREE.MeshPhongMaterial({ 
            color: 0xFF4444, emissive: 0xFF0000 
        }));
        leftEngine.position.set(-3, 0, 10);
        group.add(leftEngine);

        const rightEngine = new THREE.Mesh(engineGeo, new THREE.MeshPhongMaterial({ 
            color: 0xFF4444, emissive: 0xFF0000 
        }));
        rightEngine.position.set(3, 0, 10);
        group.add(rightEngine);

        group.userData = {
            type: 'fighter',
            name: 'Fighter',
            stats: {
                maxSpeed: 7000,
                acceleration: 300,
                rotationSpeed: 3.0,
                cargo: 50,
                fuel: 80
            }
        };

        return group;
    }

    /**
     * Create a bulky mining vessel
     */
    createMinerShip() {
        const group = new THREE.Group();
        group.name = "Miner";

        const hullMat = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
        const drillMat = new THREE.MeshPhongMaterial({ 
            color: 0x666666,
            shininess: 120
        });

        // Boxy main body
        const body = new THREE.Mesh(
            new THREE.BoxGeometry(10, 8, 16),
            hullMat
        );
        group.add(body);

        // Mining drill (front)
        const drillGeo = new THREE.ConeGeometry(3, 10, 8);
        drillGeo.rotateX(-Math.PI / 2);
        const drill = new THREE.Mesh(drillGeo, drillMat);
        drill.position.set(0, 0, -13);
        group.add(drill);

        // Drill rotation animation reference
        group.userData.drill = drill;

        // Cargo containers (sides)
        const containerGeo = new THREE.BoxGeometry(3, 4, 8);
        
        const leftContainer = new THREE.Mesh(containerGeo, new THREE.MeshPhongMaterial({ color: 0x228822 }));
        leftContainer.position.set(-7, 0, 2);
        group.add(leftContainer);

        const rightContainer = new THREE.Mesh(containerGeo, new THREE.MeshPhongMaterial({ color: 0x228822 }));
        rightContainer.position.set(7, 0, 2);
        group.add(rightContainer);

        // Heavy engines
        const engineGeo = new THREE.BoxGeometry(3, 3, 4);
        const engineMat = new THREE.MeshPhongMaterial({ color: 0x444444 });
        
        const leftEngine = new THREE.Mesh(engineGeo, engineMat);
        leftEngine.position.set(-3, 0, 10);
        group.add(leftEngine);

        const rightEngine = new THREE.Mesh(engineGeo, engineMat);
        rightEngine.position.set(3, 0, 10);
        group.add(rightEngine);

        group.userData = {
            type: 'miner',
            name: 'Miner',
            stats: {
                maxSpeed: 2500,
                acceleration: 100,
                rotationSpeed: 1.0,
                cargo: 400,
                fuel: 200
            }
        };

        return group;
    }

    /**
     * Create a small shuttle
     */
    createShuttleShip() {
        const group = new THREE.Group();
        group.name = "Shuttle";

        const hullMat = new THREE.MeshPhongMaterial({ 
            color: 0xEEEEEE,
            shininess: 80
        });

        // Small rounded body
        const body = new THREE.Mesh(
            new THREE.CapsuleGeometry(3, 8, 4, 8),
            hullMat
        );
        body.rotateX(Math.PI / 2);
        group.add(body);

        // Small wings
        const wingGeo = new THREE.BoxGeometry(10, 0.5, 4);
        const wings = new THREE.Mesh(wingGeo, new THREE.MeshPhongMaterial({ color: 0xCCCCCC }));
        wings.position.set(0, 0, 2);
        group.add(wings);

        // Single rear engine
        const engine = new THREE.Mesh(
            new THREE.CylinderGeometry(1.5, 2, 3, 8),
            new THREE.MeshPhongMaterial({ color: 0x4488FF, emissive: 0x2244AA })
        );
        engine.rotateX(Math.PI / 2);
        engine.position.set(0, 0, 7);
        group.add(engine);

        group.userData = {
            type: 'shuttle',
            name: 'Shuttle',
            stats: {
                maxSpeed: 3500,
                acceleration: 180,
                rotationSpeed: 2.5,
                cargo: 40,
                fuel: 60
            }
        };

        return group;
    }

    /**
     * Spawn a ship in the scene
     */
    spawnShip(type, scene, position = new THREE.Vector3(0, 100, 500)) {
        const shipCreator = this.templates[type] || this.templates.explorer;
        const ship = shipCreator();
        
        ship.position.copy(position);
        scene.add(ship);
        
        console.log(`[VoxelShips] Spawned ${ship.name} at ${position.x}, ${position.y}, ${position.z}`);
        return ship;
    }

    /**
     * Get list of available ship types
     */
    getAvailableShips() {
        return Object.keys(this.templates).map(key => ({
            id: key,
            name: key.charAt(0).toUpperCase() + key.slice(1),
            description: this.getShipDescription(key)
        }));
    }

    getShipDescription(type) {
        const descriptions = {
            gordon: "Industrial heavy-lift vessel with distinctive orange pods",
            explorer: "Versatile exploration ship with balanced capabilities",
            fighter: "Fast and agile combat vessel",
            miner: "Bulk cargo carrier with mining equipment",
            shuttle: "Compact personnel transport"
        };
        return descriptions[type] || "Unknown vessel";
    }

    /**
     * Create a fleet formation of Gordon ships
     */
    spawnGordonFleet(scene, count = 5, centerPosition = new THREE.Vector3(0, 200, 0)) {
        const ships = [];
        const spacing = 50;
        
        for (let i = 0; i < count; i++) {
            const offset = new THREE.Vector3(
                (Math.random() - 0.5) * spacing * 3,
                (Math.random() - 0.5) * spacing,
                (Math.random() - 0.5) * spacing * 2
            );
            const pos = centerPosition.clone().add(offset);
            const ship = this.spawnShip('gordon', scene, pos);
            ship.rotation.y = Math.random() * Math.PI * 2;
            ships.push(ship);
        }
        
        console.log(`[VoxelShips] Spawned Gordon fleet: ${count} ships`);
        return ships;
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VoxelShips;
}
