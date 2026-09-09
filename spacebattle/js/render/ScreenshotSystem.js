/**
 * ScreenshotSystem.js - 3D Scene Capture for N'og nog
 * Captures crew photos with satellite backdrops
 */

class ScreenshotSystem {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.screenshotQueue = [];
        this.isCapturing = false;
    }

    /**
     * Create a satellite model for photo backdrops
     */
    createSatellite() {
        const group = new THREE.Group();
        group.name = "PhotoSatellite";

        // Main body - hexagonal prism
        const bodyGeo = new THREE.CylinderGeometry(8, 8, 20, 6);
        const bodyMat = new THREE.MeshPhongMaterial({ 
            color: 0xDDDDDD,
            shininess: 80
        });
        const body = new THREE.Mesh(bodyGeo, bodyMat);
        group.add(body);

        // Solar panels (large wings)
        const panelGeo = new THREE.BoxGeometry(60, 0.5, 25);
        const panelMat = new THREE.MeshPhongMaterial({ 
            color: 0x111188,
            shininess: 100,
            emissive: 0x000044,
            emissiveIntensity: 0.2
        });
        
        const leftPanel = new THREE.Mesh(panelGeo, panelMat);
        leftPanel.position.set(-35, 0, 0);
        leftPanel.rotation.z = 0.1;
        group.add(leftPanel);

        const rightPanel = new THREE.Mesh(panelGeo, panelMat);
        rightPanel.position.set(35, 0, 0);
        rightPanel.rotation.z = -0.1;
        group.add(rightPanel);

        // Panel frames
        const frameGeo = new THREE.BoxGeometry(62, 0.8, 27);
        const frameMat = new THREE.MeshPhongMaterial({ color: 0x888888 });
        
        const leftFrame = new THREE.Mesh(frameGeo, frameMat);
        leftFrame.position.set(-35, 0, 0);
        leftFrame.rotation.z = 0.1;
        group.add(leftFrame);

        const rightFrame = new THREE.Mesh(frameGeo, frameMat);
        rightFrame.position.set(35, 0, 0);
        rightFrame.rotation.z = -0.1;
        group.add(rightFrame);

        // Communication dish
        const dishGeo = new THREE.SphereGeometry(6, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2);
        const dishMat = new THREE.MeshPhongMaterial({ 
            color: 0xCCCCCC,
            shininess: 100,
            side: THREE.DoubleSide
        });
        const dish = new THREE.Mesh(dishGeo, dishMat);
        dish.position.set(0, 8, 8);
        dish.rotation.x = -Math.PI / 4;
        group.add(dish);

        // Dish support
        const supportGeo = new THREE.CylinderGeometry(1, 1, 8);
        const support = new THREE.Mesh(supportGeo, frameMat);
        support.position.set(0, 6, 6);
        support.rotation.x = -Math.PI / 4;
        group.add(support);

        // Antenna arrays
        const antennaGeo = new THREE.CylinderGeometry(0.2, 0.2, 12);
        const antennaMat = new THREE.MeshPhongMaterial({ color: 0x333333 });
        
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const antenna = new THREE.Mesh(antennaGeo, antennaMat);
            antenna.position.set(
                Math.cos(angle) * 5,
                14,
                Math.sin(angle) * 5
            );
            group.add(antenna);
        }

        // Thruster nozzles (rear)
        const thrusterGeo = new THREE.CylinderGeometry(2, 3, 4, 8);
        const thrusterMat = new THREE.MeshPhongMaterial({ 
            color: 0x333333,
            emissive: 0xFF4400,
            emissiveIntensity: 0.3
        });
        
        const thruster1 = new THREE.Mesh(thrusterGeo, thrusterMat);
        thruster1.position.set(0, 0, -12);
        thruster1.rotation.x = Math.PI / 2;
        group.add(thruster1);

        // Details - panels and hatches
        const hatchGeo = new THREE.BoxGeometry(4, 0.2, 4);
        const hatchMat = new THREE.MeshPhongMaterial({ color: 0x999999 });
        
        const hatch = new THREE.Mesh(hatchGeo, hatchMat);
        hatch.position.set(0, 10.1, 0);
        group.add(hatch);

        // Solar panel grid lines
        const gridMat = new THREE.LineBasicMaterial({ color: 0x333333 });
        
        // Add some blinking lights
        const lightGeo = new THREE.SphereGeometry(0.5, 8, 8);
        const lightMat = new THREE.MeshBasicMaterial({ 
            color: 0xFF0000,
            transparent: true,
            opacity: 0.8
        });
        const light = new THREE.Mesh(lightGeo, lightMat);
        light.position.set(0, 11, 0);
        group.add(light);
        group.userData.blinkLight = light;

        // Store reference
        group.userData = {
            type: 'satellite',
            blinkPhase: Math.random() * Math.PI * 2
        };

        return group;
    }

    /**
     * Setup a photo scene with crew in front of satellite
     */
    setupPhotoScene(crewMembers) {
        console.log('[Screenshot] Setting up photo scene...');

        // Create satellite
        const satellite = this.createSatellite();
        satellite.position.set(0, 0, -100);
        satellite.rotation.y = Math.PI / 6;
        this.scene.add(satellite);

        // Position crew in front
        const crewGroup = new THREE.Group();
        crewGroup.name = "PhotoCrew";

        if (crewMembers && crewMembers.length > 0) {
            crewMembers.forEach((crew, index) => {
                const clone = crew.clone();
                // Arrange in a semi-circle
                const angle = (index / (crewMembers.length - 1)) * Math.PI - Math.PI / 2;
                const radius = 30;
                clone.position.set(
                    Math.sin(angle) * radius,
                    0,
                    Math.cos(angle) * radius * 0.3
                );
                clone.rotation.y = -angle * 0.5;
                crewGroup.add(clone);
            });
        }

        crewGroup.position.set(0, 20, 50);
        this.scene.add(crewGroup);

        // Position camera for the shot
        this.camera.position.set(0, 30, 150);
        this.camera.lookAt(0, 10, -50);

        // Add photo lighting
        const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.2);
        keyLight.position.set(50, 100, 50);
        this.scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0x88CCFF, 0.5);
        fillLight.position.set(-50, 50, 50);
        this.scene.add(fillLight);

        const rimLight = new THREE.SpotLight(0xFFAA00, 0.8);
        rimLight.position.set(0, 50, -50);
        rimLight.lookAt(0, 0, 0);
        this.scene.add(rimLight);

        return { satellite, crewGroup, lights: [keyLight, fillLight, rimLight] };
    }

    /**
     * Capture the current scene as an image
     */
    capture(filename = 'nog_crew_photo.png') {
        return new Promise((resolve) => {
            // Render the scene
            this.renderer.render(this.scene, this.camera);

            // Get the canvas data
            const canvas = this.renderer.domElement;
            const dataURL = canvas.toDataURL('image/png');

            // Create download link
            const link = document.createElement('a');
            link.download = filename;
            link.href = dataURL;
            
            // Trigger download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            console.log(`[Screenshot] Captured: ${filename}`);
            resolve(dataURL);
        });
    }

    /**
     * Export photo data for game import
     */
    exportPhotoData(crewMembers, metadata = {}) {
        const photoData = {
            timestamp: Date.now(),
            version: '1.0',
            type: 'crew_photo',
            crew: crewMembers.map(c => ({
                name: c.userData?.name || 'Unknown',
                role: c.userData?.role || 'Unknown',
                position: {
                    x: c.position.x,
                    y: c.position.y,
                    z: c.position.z
                },
                rotation: {
                    y: c.rotation.y
                }
            })),
            backdrop: 'satellite',
            metadata: {
                location: 'PRIME Universe',
                system: 'Alpha-1',
                ...metadata
            }
        };

        // Download as JSON
        const dataStr = JSON.stringify(photoData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.download = `nog_crew_export_${Date.now()}.json`;
        link.href = url;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log('[Screenshot] Exported photo data');
        return photoData;
    }

    /**
     * Import photo data back into the game
     */
    importPhotoData(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
            
            if (data.type !== 'crew_photo') {
                console.error('[Screenshot] Invalid photo data type');
                return null;
            }

            console.log(`[Screenshot] Imported photo from ${new Date(data.timestamp).toISOString()}`);
            console.log(`  Crew: ${data.crew.map(c => c.name).join(', ')}`);
            console.log(`  Location: ${data.metadata?.location || 'Unknown'}`);

            return data;
        } catch (err) {
            console.error('[Screenshot] Import failed:', err);
            return null;
        }
    }

    /**
     * Animate satellite lights before capture
     */
    animateSatellite(satellite, duration = 2000) {
        return new Promise((resolve) => {
            const startTime = Date.now();
            const light = satellite.userData.blinkLight;

            const animate = () => {
                const elapsed = Date.now() - startTime;
                const progress = elapsed / duration;

                if (light) {
                    // Blink effect
                    light.material.opacity = 0.5 + Math.sin(elapsed * 0.01) * 0.3;
                }

                // Slow rotation
                satellite.rotation.y += 0.001;

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    resolve();
                }
            };

            animate();
        });
    }

    /**
     * Setup photo scene with an existing deployed satellite
     */
    setupPhotoSceneWithSatellite(satellite, crewMembers) {
        console.log('[Screenshot] Setting up photo scene with deployed satellite...');

        // Create crew group
        const crewGroup = new THREE.Group();
        crewGroup.name = "PhotoCrew";

        // Position crew between camera and satellite
        const satPos = satellite.position.clone();
        const cameraPos = satPos.clone().add(new THREE.Vector3(0, 20, 150));

        if (crewMembers && crewMembers.length > 0) {
            // Arrange in formation facing satellite
            const spacing = 20;
            const totalWidth = (crewMembers.length - 1) * spacing;
            const startX = -totalWidth / 2;

            crewMembers.forEach((crew, index) => {
                const clone = crew.clone();
                clone.position.set(
                    startX + index * spacing,
                    0,
                    0
                );
                clone.rotation.y = Math.PI; // Face satellite
                crewGroup.add(clone);
            });
        }

        // Position crew in front of satellite
        crewGroup.position.copy(satPos).add(new THREE.Vector3(0, 10, 80));
        this.scene.add(crewGroup);

        // Position camera
        this.camera.position.copy(cameraPos);
        this.camera.lookAt(satPos);

        // Add dramatic lighting
        const keyLight = new THREE.DirectionalLight(0xFFFFFF, 1.5);
        keyLight.position.set(30, 50, 50);
        this.scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0x88CCFF, 0.6);
        fillLight.position.set(-30, 30, 50);
        this.scene.add(fillLight);

        const backLight = new THREE.SpotLight(0xFFAA00, 1.0);
        backLight.position.copy(satPos).add(new THREE.Vector3(0, 50, -30));
        backLight.lookAt(crewGroup.position);
        this.scene.add(backLight);

        // Rim light on satellite
        const rimLight = new THREE.SpotLight(0x00FF88, 0.8);
        rimLight.position.set(0, 30, 100);
        rimLight.lookAt(satPos);
        this.scene.add(rimLight);

        return { satellite, crewGroup, lights: [keyLight, fillLight, backLight, rimLight] };
    }

    /**
     * Full photo shoot sequence (with optional satellite)
     */
    async photoShoot(crewMembers, satellite = null) {
        console.log('[Screenshot] Starting photo shoot...');

        let photoSetup;
        
        if (satellite && satellite.userData && satellite.userData.type === 'satellite') {
            // Use deployed satellite
            photoSetup = this.setupPhotoSceneWithSatellite(satellite, crewMembers);
        } else {
            // Create temporary satellite
            photoSetup = this.setupPhotoScene(crewMembers);
        }

        const { crewGroup, lights } = photoSetup;
        const sat = photoSetup.satellite;

        // Animate
        await this.animateSatellite(sat, 3000);

        // Capture
        const imageData = await this.capture(`nog_crew_${Date.now()}.png`);

        // Export data
        const exportData = this.exportPhotoData(crewMembers, {
            photoShoot: true,
            satelliteModel: sat.userData?.satelliteType || 'CommSat-X7',
            satelliteId: sat.userData?.id || 'temp',
            deployed: sat.userData?.deployed || false
        });

        // Cleanup (only remove temporary elements, not deployed satellite)
        this.scene.remove(crewGroup);
        lights.forEach(l => this.scene.remove(l));
        
        // Only remove satellite if it was temporary
        if (!sat.userData?.deployed) {
            this.scene.remove(sat);
        }

        console.log('[Screenshot] Photo shoot complete!');
        return { imageData, exportData };
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ScreenshotSystem;
}
