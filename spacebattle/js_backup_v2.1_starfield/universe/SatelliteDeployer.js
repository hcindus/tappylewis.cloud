/**
 * SatelliteDeployer.js - Deployable Photo Satellites
 * Players can place satellites in the universe for crew photography
 */

class SatelliteDeployer {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.deployedSatellites = [];
        this.selectedSatellite = null;
        this.deployRange = 200; // Max distance from player
        
        // Deployment cost
        this.costs = {
            basic: { energy: 50, materials: 10 },
            advanced: { energy: 100, materials: 25 },
            comm: { energy: 150, materials: 40 }
        };
    }

    /**
     * Create a deployable satellite model
     */
    createSatelliteModel(type = 'basic') {
        const group = new THREE.Group();
        
        const configs = {
            basic: {
                bodyColor: 0xDDDDDD,
                panelColor: 0x2222AA,
                size: 1.0,
                panelSize: { w: 40, h: 20 }
            },
            advanced: {
                bodyColor: 0xEEEEEE,
                panelColor: 0x3333CC,
                size: 1.3,
                panelSize: { w: 60, h: 30 },
                hasDish: true
            },
            comm: {
                bodyColor: 0xFFFFFF,
                panelColor: 0x4444DD,
                size: 1.5,
                panelSize: { w: 80, h: 40 },
                hasDish: true,
                hasAntennas: true
            }
        };
        
        const config = configs[type] || configs.basic;
        const s = config.size;

        // Main body
        const bodyGeo = new THREE.CylinderGeometry(8 * s, 8 * s, 20 * s, 6);
        const bodyMat = new THREE.MeshPhongMaterial({ 
            color: config.bodyColor,
            shininess: 80
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);

        // Solar panels
        const panelGeo = new THREE.BoxGeometry(config.panelSize.w, 0.5, config.panelSize.h);
        const panelMat = new THREE.MeshPhongMaterial({ 
            color: config.panelColor,
            shininess: 100,
            emissive: config.panelColor,
            emissiveIntensity: 0.1
        });
        
        const leftPanel = new THREE.Mesh(panelGeo, panelMat);
        leftPanel.position.set(-(config.panelSize.w/2 + 8*s), 0, 0);
        group.add(leftPanel);

        const rightPanel = new THREE.Mesh(panelGeo, panelMat);
        rightPanel.position.set(config.panelSize.w/2 + 8*s, 0, 0);
        group.add(rightPanel);

        // Panel supports
        const supportGeo = new THREE.BoxGeometry(4, 1, 4);
        const supportMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
        
        const leftSupport = new THREE.Mesh(supportGeo, supportMat);
        leftSupport.position.set(-(8*s + 2), 0, 0);
        group.add(leftSupport);

        const rightSupport = new THREE.Mesh(supportGeo, supportMat);
        rightSupport.position.set(8*s + 2, 0, 0);
        group.add(rightSupport);

        // Communication dish (for advanced/comm types)
        if (config.hasDish) {
            const dishGeo = new THREE.SphereGeometry(6 * s, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
            const dishMat = new THREE.MeshPhongMaterial({ 
                color: 0xCCCCCC,
                shininess: 100,
                side: THREE.DoubleSide
            });
            const dish = new THREE.Mesh(dishGeo, dishMat);
            dish.position.set(0, 8 * s, 8 * s);
            dish.rotation.x = -Math.PI / 4;
            group.add(dish);

            // Dish support
            const dishSupportGeo = new THREE.CylinderGeometry(1, 1, 6 * s);
            const dishSupport = new THREE.Mesh(dishSupportGeo, supportMat);
            dishSupport.position.set(0, 6 * s, 6 * s);
            dishSupport.rotation.x = -Math.PI / 4;
            group.add(dishSupport);
        }

        // Antenna array (for comm type)
        if (config.hasAntennas) {
            const antennaGeo = new THREE.CylinderGeometry(0.3, 0.3, 15 * s);
            const antennaMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
            
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const antenna = new THREE.Mesh(antennaGeo, antennaMat);
                antenna.position.set(
                    Math.cos(angle) * 4 * s,
                    15 * s,
                    Math.sin(angle) * 4 * s
                );
                group.add(antenna);
            }
        }

        // Status lights
        const lightGeo = new THREE.SphereGeometry(1 * s, 8, 8);
        const lightMat = new THREE.MeshBasicMaterial({ 
            color: 0x00FF00,
            transparent: true,
            opacity: 0.9
        });
        const statusLight = new THREE.Mesh(lightGeo, lightMat);
        statusLight.position.set(0, 11 * s, 0);
        group.add(statusLight);
        group.userData.statusLight = statusLight;

        // Interaction zone (invisible)
        const zoneGeo = new THREE.SphereGeometry(50 * s, 8, 8);
        const zoneMat = new THREE.MeshBasicMaterial({ 
            color: 0x00FF88,
            transparent: true,
            opacity: 0.0,
            wireframe: true
        });
        const zone = new THREE.Mesh(zoneGeo, zoneMat);
        zone.name = 'interactionZone';
        group.add(zone);

        // Store metadata
        group.userData = {
            type: 'satellite',
            satelliteType: type,
            id: `sat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            deployed: false,
            status: 'active',
            config: config,
            creationTime: Date.now()
        };

        return group;
    }

    /**
     * Deploy a satellite at a position
     */
    deploy(type = 'basic', position = null) {
        // Get deploy position
        let deployPos = position;
        if (!deployPos && this.player) {
            // Deploy in front of player
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(this.player.quaternion);
            deployPos = this.player.position.clone().add(forward.multiplyScalar(50));
            deployPos.y = Math.max(deployPos.y, 20); // Minimum height
        }

        if (!deployPos) {
            console.error('[Satellite] No deploy position available');
            return null;
        }

        // Create satellite
        const satellite = this.createSatelliteModel(type);
        satellite.position.copy(deployPos);
        
        // Random initial rotation
        satellite.rotation.y = Math.random() * Math.PI * 2;
        
        // Add to scene
        this.scene.add(satellite);
        
        // Track deployment
        satellite.userData.deployed = true;
        satellite.userData.deployPosition = deployPos.clone();
        this.deployedSatellites.push(satellite);

        console.log(`[Satellite] Deployed ${type} satellite at ${deployPos.x.toFixed(1)}, ${deployPos.y.toFixed(1)}, ${deployPos.z.toFixed(1)}`);
        
        // Play deploy sound if available
        if (window.gameAudio) {
            window.gameAudio.play('deploy');
        }

        return satellite;
    }

    /**
     * Check if player is near a satellite for interaction
     */
    checkInteraction() {
        if (!this.player || this.deployedSatellites.length === 0) return null;

        const playerPos = this.player.position;
        let nearest = null;
        let nearestDist = Infinity;

        this.deployedSatellites.forEach(sat => {
            const dist = sat.position.distanceTo(playerPos);
            if (dist < 100 && dist < nearestDist) {
                nearest = sat;
                nearestDist = dist;
            }
        });

        return nearest;
    }

    /**
     * Activate photo mode with a satellite
     */
    activatePhotoMode(satellite, crewMembers) {
        if (!satellite || !window.ScreenshotSystem) {
            console.error('[Satellite] Cannot activate photo mode');
            return;
        }

        console.log('[Satellite] Activating photo mode...');

        // Create screenshot system
        const ss = new ScreenshotSystem(
            this.scene.userData.renderer || window.renderer,
            this.scene,
            this.scene.userData.camera || window.camera
        );

        // Use satellite as backdrop
        const result = ss.setupPhotoSceneWithSatellite(satellite, crewMembers);
        
        return result;
    }

    /**
     * Update all deployed satellites
     */
    update(deltaTime) {
        const time = Date.now() * 0.001;

        this.deployedSatellites.forEach((sat, index) => {
            if (!sat) return;

            // Gentle rotation
            sat.rotation.y += deltaTime * 0.05;

            // Bobbing motion
            sat.position.y = sat.userData.deployPosition.y + Math.sin(time + index) * 2;

            // Blink status light
            if (sat.userData.statusLight) {
                const intensity = 0.5 + Math.sin(time * 3 + index) * 0.4;
                sat.userData.statusLight.material.opacity = intensity;
            }

            // Check interaction proximity
            if (this.player) {
                const dist = sat.position.distanceTo(this.player.position);
                sat.userData.inRange = dist < 100;
                
                // Visual indicator when in range
                const zone = sat.getObjectByName('interactionZone');
                if (zone) {
                    zone.material.opacity = sat.userData.inRange ? 0.1 : 0.0;
                }
            }
        });
    }

    /**
     * Get list of deployed satellites
     */
    getDeployedSatellites() {
        return this.deployedSatellites.filter(s => s && s.userData.deployed);
    }

    /**
     * Remove a satellite
     */
    undeploy(satellite) {
        const index = this.deployedSatellites.indexOf(satellite);
        if (index > -1) {
            this.scene.remove(satellite);
            this.deployedSatellites.splice(index, 1);
            console.log('[Satellite] Removed from deployment');
            return true;
        }
        return false;
    }

    /**
     * Serialize satellite data for save games
     */
    serialize() {
        return this.deployedSatellites.map(sat => ({
            id: sat.userData.id,
            type: sat.userData.satelliteType,
            position: {
                x: sat.position.x,
                y: sat.position.y,
                z: sat.position.z
            },
            rotation: sat.rotation.y,
            creationTime: sat.userData.creationTime
        }));
    }

    /**
     * Load satellites from save data
     */
    load(data) {
        if (!Array.isArray(data)) return;

        data.forEach(satData => {
            const satellite = this.deploy(satData.type, new THREE.Vector3(
                satData.position.x,
                satData.position.y,
                satData.position.z
            ));
            
            if (satellite) {
                satellite.rotation.y = satData.rotation || 0;
                satellite.userData.creationTime = satData.creationTime;
            }
        });
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SatelliteDeployer;
}
