/**
 * Portal System for N'og nog v1
 * Connects regions of the 100x100x100 voxel universe
 */

class PortalSystem {
    constructor(universe) {
        this.universe = universe;
        this.portals = new Map();
        this.activeTeleports = new Set();
        this.portalEffects = [];
        
        // Portal configuration
        this.config = {
            cooldownMs: 3000,
            activationDistance: 50,
            effectDuration: 2000
        };
        
        this.initDefaultPortals();
    }
    
    initDefaultPortals() {
        // Connect opposite corners of the universe
        this.createPortal('alpha', [500, 200, 500], [9500, 200, 9500], 'center-to-edge');
        this.createPortal('beta', [9500, 200, 9500], [500, 200, 500], 'edge-to-center');
        
        // Vertical portals (surface to deep space)
        this.createPortal('ascension', [5000, 200, 5000], [5000, 8000, 5000], 'surface-to-orbit');
        this.createPortal('descension', [5000, 8000, 5000], [5000, 200, 5000], 'orbit-to-surface');
        
        // Cross-region portals
        this.createPortal('gamma', [2000, 200, 8000], [8000, 200, 2000], 'sector-swap');
        this.createPortal('delta', [8000, 200, 2000], [2000, 200, 8000], 'sector-swap-return');
        
        // Deep space portal (for agent exploration)
        this.createPortal('void', [5000, 9000, 5000], [5000, 200, 5000], 'deep-space');
        
        console.log(`[PortalSystem] Initialized ${this.portals.size} portals`);
    }
    
    createPortal(id, position, destination, type = 'standard') {
        const portal = {
            id,
            position: new THREE.Vector3(...position),
            destination: new THREE.Vector3(...destination),
            type,
            cooldown: 0,
            active: true,
            lastUsed: 0,
            useCount: 0
        };
        
        this.portals.set(id, portal);
        this.createVisualEffect(portal);
        
        return portal;
    }
    
    createVisualEffect(portal) {
        // Create swirling portal visual
        const geometry = new THREE.RingGeometry(40, 60, 32);
        const material = new THREE.MeshBasicMaterial({
            color: this.getPortalColor(portal.type),
            transparent: true,
            opacity: 0.7,
            side: THREE.DoubleSide
        });
        
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(portal.position);
        mesh.userData = { portalId: portal.id };
        
        this.portalEffects.push({
            mesh,
            portal,
            rotationSpeed: 0.02 + Math.random() * 0.02
        });
        
        return mesh;
    }
    
    getPortalColor(type) {
        const colors = {
            'center-to-edge': 0x00ff88,
            'edge-to-center': 0x88ff00,
            'surface-to-orbit': 0x00ccff,
            'orbit-to-surface': 0xff8800,
            'sector-swap': 0xff00ff,
            'deep-space': 0x8800ff,
            'standard': 0xffffff
        };
        return colors[type] || colors.standard;
    }
    
    update(deltaTime) {
        const now = Date.now();
        
        // Update cooldowns
        for (const portal of this.portals.values()) {
            if (portal.cooldown > 0) {
                portal.cooldown = Math.max(0, portal.cooldown - deltaTime * 1000);
            }
        }
        
        // Animate portal effects
        this.portalEffects.forEach(effect => {
            effect.mesh.rotation.z += effect.rotationSpeed;
            effect.mesh.rotation.x = Math.sin(now * 0.001) * 0.2;
            
            // Pulse effect
            const scale = 1 + Math.sin(now * 0.003) * 0.1;
            effect.mesh.scale.set(scale, scale, scale);
        });
    }
    
    checkTeleport(entity) {
        const entityPos = entity.position || entity.mesh?.position;
        if (!entityPos) return null;
        
        for (const portal of this.portals.values()) {
            if (!portal.active || portal.cooldown > 0) continue;
            
            const distance = entityPos.distanceTo(portal.position);
            
            if (distance < this.config.activationDistance) {
                return this.teleport(entity, portal);
            }
        }
        
        return null;
    }
    
    teleport(entity, portal) {
        const now = Date.now();
        
        // Check cooldown
        if (now - portal.lastUsed < this.config.cooldownMs) {
            return { success: false, reason: 'cooldown' };
        }
        
        // Perform teleport
        const oldPos = entity.position?.clone() || entityPos.clone();
        
        if (entity.position) {
            entity.position.copy(portal.destination);
        } else if (entity.mesh) {
            entity.mesh.position.copy(portal.destination);
        }
        
        // Update portal stats
        portal.lastUsed = now;
        portal.cooldown = this.config.cooldownMs;
        portal.useCount++;
        
        // Create teleport effect
        this.createTeleportEffect(oldPos, portal.destination);
        
        const result = {
            success: true,
            portalId: portal.id,
            from: oldPos.toArray(),
            to: portal.destination.toArray(),
            type: portal.type,
            timestamp: now
        };
        
        // Notify bridge if available
        if (window.brainBridge) {
            window.brainBridge.sendEvent('portal_used', result);
        }
        
        console.log(`[PortalSystem] Teleport: ${portal.id} ${portal.type}`);
        
        return result;
    }
    
    createTeleportEffect(from, to) {
        // Flash effect at both locations
        [from, to].forEach(pos => {
            const flash = new THREE.PointLight(0xffffff, 2, 200);
            flash.position.copy(pos);
            
            if (window.gameScene) {
                window.gameScene.add(flash);
                
                // Fade out
                let intensity = 2;
                const fade = setInterval(() => {
                    intensity -= 0.1;
                    flash.intensity = intensity;
                    if (intensity <= 0) {
                        clearInterval(fade);
                        window.gameScene.remove(flash);
                    }
                }, 50);
            }
        });
    }
    
    getPortalStatus() {
        const status = {};
        for (const [id, portal] of this.portals) {
            status[id] = {
                type: portal.type,
                active: portal.active,
                cooldown: portal.cooldown,
                useCount: portal.useCount,
                position: portal.position.toArray(),
                destination: portal.destination.toArray()
            };
        }
        return status;
    }
    
    // Agent decision support
    findNearestPortal(position) {
        let nearest = null;
        let minDist = Infinity;
        
        for (const portal of this.portals.values()) {
            if (!portal.active) continue;
            const dist = position.distanceTo(portal.position);
            if (dist < minDist) {
                minDist = dist;
                nearest = portal;
            }
        }
        
        return { portal: nearest, distance: minDist };
    }
    
    shouldUsePortal(entity, targetPosition) {
        const currentPos = entity.position || entity.mesh?.position;
        if (!currentPos) return false;
        
        const directDist = currentPos.distanceTo(targetPosition);
        
        // Check if any portal provides shortcut
        for (const portal of this.portals.values()) {
            if (!portal.active || portal.cooldown > 0) continue;
            
            const distToPortal = currentPos.distanceTo(portal.position);
            const distFromDest = portal.destination.distanceTo(targetPosition);
            const portalRoute = distToPortal + distFromDest;
            
            // Use portal if it saves 30%+ distance
            if (portalRoute < directDist * 0.7) {
                return {
                    shouldUse: true,
                    portal: portal,
                    savings: directDist - portalRoute
                };
            }
        }
        
        return { shouldUse: false };
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PortalSystem;
}
