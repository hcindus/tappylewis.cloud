/**
 * CrewVisuals.js - 3D Voxel Crew Members
 * Renders N'og nog's persistent crew as voxel avatars
 */

class CrewVisuals {
    constructor() {
        this.crewData = null;
        this.crewMeshes = new Map();
    }

    /**
     * Create a voxel crew member based on role
     */
    createCrewMember(name, role) {
        const group = new THREE.Group();
        group.name = name;

        // Role-based colors
        const roleColors = {
            'PILOT': 0x4488FF,      // Blue
            'ENGINEER': 0xFFAA00,   // Orange
            'SCIENTIST': 0xAA44FF,  // Purple
            'COMBAT': 0xFF4444,     // Red
            'MEDIC': 0x44FF88,      // Green
            'TRADER': 0xFFDD00      // Yellow
        };

        const color = roleColors[role] || 0x888888;
        const skinColor = 0xFFCCAA;

        // Materials
        const suitMat = new THREE.MeshPhongMaterial({ 
            color: color,
            shininess: 60 
        });
        const skinMat = new THREE.MeshPhongMaterial({ 
            color: skinColor,
            shininess: 30 
        });
        const detailMat = new THREE.MeshPhongMaterial({ 
            color: 0x333333,
            shininess: 40 
        });
        const visorMat = new THREE.MeshPhongMaterial({ 
            color: 0x111111,
            shininess: 100,
            emissive: color,
            emissiveIntensity: 0.3
        });

        // Body (space suit torso) - 3x4x2 voxels
        const torsoGeo = new THREE.BoxGeometry(3, 4, 2);
        const torso = new THREE.Mesh(torsoGeo, suitMat);
        torso.position.set(0, 6, 0);
        group.add(torso);

        // Chest detail
        const chestGeo = new THREE.BoxGeometry(1.5, 1.5, 0.3);
        const chest = new THREE.Mesh(chestGeo, detailMat);
        chest.position.set(0, 6.5, 1.1);
        group.add(chest);

        // Role badge
        const badgeGeo = new THREE.BoxGeometry(0.8, 0.8, 0.2);
        const badge = new THREE.Mesh(badgeGeo, new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
        badge.position.set(0, 6.5, 1.25);
        group.add(badge);

        // Head - 2x2x2 voxels
        const headGeo = new THREE.BoxGeometry(2, 2, 2);
        const head = new THREE.Mesh(headGeo, skinMat);
        head.position.set(0, 9.5, 0);
        group.add(head);

        // Helmet
        const helmetGeo = new THREE.BoxGeometry(2.4, 2.4, 2.4);
        const helmet = new THREE.Mesh(helmetGeo, new THREE.MeshPhongMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.9
        }));
        helmet.position.set(0, 9.5, 0);
        group.add(helmet);

        // Visor
        const visorGeo = new THREE.BoxGeometry(1.8, 0.8, 0.2);
        const visor = new THREE.Mesh(visorGeo, visorMat);
        visor.position.set(0, 9.7, 1.2);
        group.add(visor);

        // Arms - 1x3x1 each
        const armGeo = new THREE.BoxGeometry(1, 3, 1);
        
        const leftArm = new THREE.Mesh(armGeo, suitMat);
        leftArm.position.set(-2.2, 6.5, 0);
        group.add(leftArm);

        const rightArm = new THREE.Mesh(armGeo, suitMat);
        rightArm.position.set(2.2, 6.5, 0);
        group.add(rightArm);

        // Hands
        const handGeo = new THREE.BoxGeometry(1.2, 1.2, 1.2);
        const leftHand = new THREE.Mesh(handGeo, detailMat);
        leftHand.position.set(-2.2, 4.5, 0);
        group.add(leftHand);

        const rightHand = new THREE.Mesh(handGeo, detailMat);
        rightHand.position.set(2.2, 4.5, 0);
        group.add(rightHand);

        // Legs - 1.2x4x1.2 each
        const legGeo = new THREE.BoxGeometry(1.2, 4, 1.2);
        
        const leftLeg = new THREE.Mesh(legGeo, suitMat);
        leftLeg.position.set(-1, 2, 0);
        group.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeo, suitMat);
        rightLeg.position.set(1, 2, 0);
        group.add(rightLeg);

        // Boots
        const bootGeo = new THREE.BoxGeometry(1.4, 1, 1.6);
        const leftBoot = new THREE.Mesh(bootGeo, detailMat);
        leftBoot.position.set(-1, 0.5, 0.2);
        group.add(leftBoot);

        const rightBoot = new THREE.Mesh(bootGeo, detailMat);
        rightBoot.position.set(1, 0.5, 0.2);
        group.add(rightBoot);

        // Role-specific accessories
        if (role === 'PILOT') {
            // Jetpack
            const jetpackGeo = new THREE.BoxGeometry(2, 3, 1);
            const jetpack = new THREE.Mesh(jetpackGeo, detailMat);
            jetpack.position.set(0, 6, -1.5);
            group.add(jetpack);
        } else if (role === 'ENGINEER') {
            // Tool belt
            const beltGeo = new THREE.BoxGeometry(3.2, 0.5, 2.2);
            const belt = new THREE.Mesh(beltGeo, detailMat);
            belt.position.set(0, 4.5, 0);
            group.add(belt);

            // Wrench
            const wrenchGeo = new THREE.BoxGeometry(0.3, 1.5, 0.3);
            const wrench = new THREE.Mesh(wrenchGeo, new THREE.MeshPhongMaterial({ color: 0xCCCCCC }));
            wrench.position.set(2.5, 4.5, 0.5);
            group.add(wrench);
        } else if (role === 'SCIENTIST') {
            // Scanner on back
            const scannerGeo = new THREE.BoxGeometry(1.5, 2, 0.5);
            const scanner = new THREE.Mesh(scannerGeo, new THREE.MeshBasicMaterial({ color: 0x00FFFF }));
            scanner.position.set(0, 7, -1.3);
            group.add(scanner);
        } else if (role === 'COMBAT') {
            // Shoulder pads
            const padGeo = new THREE.BoxGeometry(1.5, 1, 1.5);
            const leftPad = new THREE.Mesh(padGeo, detailMat);
            leftPad.position.set(-2, 8, 0);
            group.add(leftPad);

            const rightPad = new THREE.Mesh(padGeo, detailMat);
            rightPad.position.set(2, 8, 0);
            group.add(rightPad);
        } else if (role === 'MEDIC') {
            // Medkit
            const kitGeo = new THREE.BoxGeometry(1.5, 1.5, 0.8);
            const kit = new THREE.Mesh(kitGeo, new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
            kit.position.set(-2.2, 5, -0.5);
            group.add(kit);

            // Red cross
            const crossGeo = new THREE.BoxGeometry(0.8, 0.8, 0.1);
            const cross = new THREE.Mesh(crossGeo, new THREE.MeshBasicMaterial({ color: 0xFF0000 }));
            cross.position.set(-2.2, 5, -0.91);
            group.add(cross);
        }

        // Name label floating above
        const labelGeo = new THREE.PlaneGeometry(4, 0.8);
        const labelMat = new THREE.MeshBasicMaterial({ 
            color: 0x000000,
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        const label = new THREE.Mesh(labelGeo, labelMat);
        label.position.set(0, 12, 0);
        label.lookAt(0, 12, 10);
        group.add(label);

        // Store metadata
        group.userData = {
            type: 'crew',
            name: name,
            role: role,
            animation: {
                baseY: 0,
                phase: Math.random() * Math.PI * 2
            }
        };

        return group;
    }

    /**
     * Spawn the current N'og nog crew
     */
    spawnNogCrew(scene, centerPosition = new THREE.Vector3(0, 50, 0)) {
        const crew = [
            { name: 'Vex', role: 'PILOT' },
            { name: 'Nyx', role: 'ENGINEER' },
            { name: 'Jax', role: 'SCIENTIST' },
            { name: 'Luna', role: 'COMBAT' },
            { name: 'Aria', role: 'MEDIC' }
        ];

        const spawned = [];
        const spacing = 15;

        crew.forEach((member, index) => {
            const offset = new THREE.Vector3(
                (index - 2) * spacing + (Math.random() - 0.5) * 5,
                0,
                (Math.random() - 0.5) * 10
            );
            const pos = centerPosition.clone().add(offset);
            
            const mesh = this.createCrewMember(member.name, member.role);
            mesh.position.copy(pos);
            mesh.rotation.y = Math.random() * Math.PI * 2;
            
            scene.add(mesh);
            spawned.push(mesh);
            
            console.log(`[CrewVisuals] Spawned ${member.name} (${member.role}) at ${pos.x.toFixed(1)}, ${pos.y.toFixed(1)}, ${pos.z.toFixed(1)}`);
        });

        return spawned;
    }

    /**
     * Update crew animations
     */
    updateCrew(crewMembers, deltaTime) {
        const time = Date.now() * 0.001;

        crewMembers.forEach(member => {
            if (!member || !member.userData) return;

            // Idle bobbing
            const bobHeight = Math.sin(time * 2 + member.userData.animation.phase) * 0.5;
            member.position.y += bobHeight * 0.1;

            // Look around occasionally
            member.rotation.y += Math.sin(time * 0.5 + member.userData.animation.phase) * 0.01;

            // Update label to face camera
            const label = member.children.find(c => c.geometry && c.geometry.type === 'PlaneGeometry');
            if (label && window.camera) {
                label.lookAt(window.camera.position);
            }
        });
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CrewVisuals;
}
