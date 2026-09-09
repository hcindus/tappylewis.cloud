/**
 * GameIntegrationV2.js - Updated controls and camera modes
 * 
 * New Features:
 * - Q: Roll left
 * - E: Roll right  
 * - V: Cycle camera modes (First, Third, Top, Far Out, Interior)
 * - Interior view shows cockpit overlay with crosshair
 * - Far Out: Very distant view
 * - AOS Brain integration
 */

// Camera mode names for HUD
const CAMERA_MODE_NAMES = [
    'First Person',
    'Third Person', 
    'Top Down',
    'Far Out',
    'Interior'
];

// Interior cockpit overlay
let cockpitOverlay = null;

/**
 * Initialize cockpit overlay for interior view
 */
function initCockpitOverlay() {
    if (cockpitOverlay) return;
    
    cockpitOverlay = document.createElement('div');
    cockpitOverlay.id = 'cockpitOverlay';
    cockpitOverlay.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        z-index: 15;
        display: none;
    `;
    
    // Top frame
    const top = document.createElement('div');
    top.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 12%;
        background: linear-gradient(180deg, rgba(0, 40, 20, 0.95) 0%, rgba(0, 40, 20, 0.7) 50%, transparent 100%);
        border-bottom: 3px solid rgba(0, 255, 136, 0.5);
    `;
    
    // Left frame
    const left = document.createElement('div');
    left.style.cssText = `
        position: absolute;
        top: 12%;
        left: 0;
        width: 8%;
        height: 76%;
        background: linear-gradient(90deg, rgba(0, 40, 20, 0.95) 0%, rgba(0, 40, 20, 0.6) 50%, transparent 100%);
        border-right: 3px solid rgba(0, 255, 136, 0.4);
    `;
    
    // Right frame
    const right = document.createElement('div');
    right.style.cssText = `
        position: absolute;
        top: 12%;
        right: 0;
        width: 8%;
        height: 76%;
        background: linear-gradient(-90deg, rgba(0, 40, 20, 0.95) 0%, rgba(0, 40, 20, 0.6) 50%, transparent 100%);
        border-left: 3px solid rgba(0, 255, 136, 0.4);
    `;
    
    // Bottom frame
    const bottom = document.createElement('div');
    bottom.style.cssText = `
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        height: 12%;
        background: linear-gradient(0deg, rgba(0, 40, 20, 0.95) 0%, rgba(0, 40, 20, 0.7) 50%, transparent 100%);
        border-top: 3px solid rgba(0, 255, 136, 0.5);
    `;
    
    // Center crosshair (enhanced for interior view)
    const crosshair = document.createElement('div');
    crosshair.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 60px;
        height: 60px;
    `;
    crosshair.innerHTML = `
        <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 2px;
            height: 30px;
            background: #00ff88;
            box-shadow: 0 0 10px #00ff88, 0 0 20px #00ff88;
        "></div>
        <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 30px;
            height: 2px;
            background: #00ff88;
            box-shadow: 0 0 10px #00ff88, 0 0 20px #00ff88;
        "></div>
        <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 50px;
            height: 50px;
            border: 2px solid rgba(0, 255, 136, 0.6);
            border-radius: 50%;
            box-shadow: 0 0 15px rgba(0, 255, 136, 0.3);
        "></div>
        <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 8px;
            height: 8px;
            background: rgba(0, 255, 136, 0.9);
            border-radius: 50%;
            box-shadow: 0 0 10px #00ff88;
        "></div>
    `;
    
    cockpitOverlay.appendChild(top);
    cockpitOverlay.appendChild(left);
    cockpitOverlay.appendChild(right);
    cockpitOverlay.appendChild(bottom);
    cockpitOverlay.appendChild(crosshair);
    
    document.body.appendChild(cockpitOverlay);
}

/**
 * Update camera based on current mode
 */
function updateCameraV2(player, camera) {
    if (!player || !camera) return;
    
    const mode = currentCameraMode;
    
    switch(mode) {
        case CAMERA_MODES.FIRST_PERSON:
            // Standard first person
            camera.position.copy(player.position);
            camera.quaternion.copy(player.quaternion);
            camera.translateZ(-2); // Slightly behind
            if (cockpitOverlay) cockpitOverlay.style.display = 'none';
            break;
            
        case CAMERA_MODES.THIRD_PERSON:
            // Behind and above
            camera.position.copy(player.position);
            camera.quaternion.copy(player.quaternion);
            camera.translateZ(50);
            camera.translateY(20);
            camera.lookAt(player.position);
            if (cockpitOverlay) cockpitOverlay.style.display = 'none';
            break;
            
        case CAMERA_MODES.TOP_DOWN:
            // Directly above, looking down
            camera.position.copy(player.position);
            camera.position.y += 100;
            camera.lookAt(player.position);
            if (cockpitOverlay) cockpitOverlay.style.display = 'none';
            break;
            
        case CAMERA_MODES.FAR_OUT:
            // Very distant view
            camera.position.copy(player.position);
            camera.quaternion.copy(player.quaternion);
            camera.translateZ(500);
            camera.translateY(200);
            camera.lookAt(player.position);
            if (cockpitOverlay) cockpitOverlay.style.display = 'none';
            break;
            
        case CAMERA_MODES.INTERIOR:
            // Cockpit view with overlay
            camera.position.copy(player.position);
            camera.quaternion.copy(player.quaternion);
            camera.translateZ(-1); // Just inside cockpit
            if (cockpitOverlay) cockpitOverlay.style.display = 'block';
            break;
    }
}

/**
 * Initialize AOS Brain connection
 */
function initAOSBrain() {
    // Check if BrainBridge exists
    if (typeof BrainBridge === 'undefined') {
        console.log('[AOS] BrainBridge not available');
        updateAOSStatus(false);
        return;
    }
    
    try {
        brainConnection = new BrainBridge('ws://localhost:8765');
        
        // Connection status
        brainConnection.ws.onopen = function() {
            brainConnected = true;
            updateAOSStatus(true);
            console.log('[AOS] Connected to Brain');
        };
        
        brainConnection.ws.onclose = function() {
            brainConnected = false;
            updateAOSStatus(false);
            console.log('[AOS] Disconnected from Brain');
        };
        
        // Handle messages
        brainConnection.ws.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data);
                handleAOSMessage(data);
            } catch(e) {
                console.error('[AOS] Parse error:', e);
            }
        };
        
    } catch(e) {
        console.error('[AOS] Init error:', e);
        updateAOSStatus(false);
    }
}

/**
 * Handle AOS Brain messages
 */
function handleAOSMessage(data) {
    switch(data.type) {
        case 'command':
            // Execute brain commands
            if (data.action === 'camera_mode' && data.mode !== undefined) {
                currentCameraMode = data.mode % CAMERA_MODES.length;
                updateCameraIndicator();
            }
            break;
            
        case 'status':
            console.log('[AOS] Status:', data.status);
            break;
            
        case 'decision':
            console.log('[AOS] Decision:', data.decision);
            break;
    }
}

/**
 * Send game state to AOS Brain
 */
function sendGameStateToBrain(player) {
    if (!brainConnection || !brainConnected || !player) return;
    
    brainConnection.send({
        type: 'game_state',
        timestamp: Date.now(),
        player: {
            position: [player.position.x, player.position.y, player.position.z],
            velocity: [player.velocity.x, player.velocity.y, player.velocity.z],
            rotation: [player.rotation.x, player.rotation.y, player.rotation.z],
            fuel: player.fuel,
            shield: player.shield,
            cameraMode: currentCameraMode,
            landed: typeof playerLanded !== 'undefined' ? playerLanded : false
        },
        nearestBody: getNearestBody(player.position)
    });
}

/**
 * Get nearest celestial body info
 */
function getNearestBody(playerPosition) {
    if (!solarSystemManagerV2) return null;
    
    let nearest = null;
    let minDist = Infinity;
    
    solarSystemManagerV2.systems.forEach(system => {
        // Check star
        const starDist = playerPosition.distanceTo(system.position);
        if (starDist < minDist) {
            minDist = starDist;
            nearest = { type: 'star', name: system.star.name, distance: starDist };
        }
        
        // Check planets
        system.planets.forEach(planet => {
            const dist = playerPosition.distanceTo(planet.mesh.position);
            if (dist < minDist) {
                minDist = dist;
                nearest = { type: 'planet', name: planet.name, distance: dist };
            }
        });
    });
    
    return nearest;
}

/**
 * Update AOS status indicator
 */
function updateAOSStatus(connected) {
    let indicator = document.getElementById('aosStatus');
    if (!indicator) {
        indicator = document.createElement('div');
        indicator.id = 'aosStatus';
        indicator.style.cssText = `
            position: absolute;
            top: 50%;
            right: 10px;
            transform: translateY(-50%);
            padding: 8px 12px;
            font-size: 10px;
            font-family: 'Courier New', monospace;
            z-index: 100;
            border: 1px solid;
            border-radius: 3px;
        `;
        document.body.appendChild(indicator);
    }
    
    if (connected) {
        indicator.textContent = 'AOS: CONNECTED';
        indicator.style.color = '#00ff88';
        indicator.style.borderColor = '#00ff88';
        indicator.style.background = 'rgba(0, 255, 136, 0.1)';
    } else {
        indicator.textContent = 'AOS: OFFLINE';
        indicator.style.color = '#ff4444';
        indicator.style.borderColor = '#ff4444';
        indicator.style.background = 'rgba(255, 68, 68, 0.1)';
    }
}

/**
 * Update camera mode indicator
 */
function updateCameraIndicator() {
    const indicator = document.getElementById('cameraMode');
    if (indicator) {
        indicator.textContent = CAMERA_MODE_NAMES[currentCameraMode];
    }
}

/**
 * Handle key inputs for new controls
 */
function handleV2KeyDown(e) {
    if (currentState !== GameState.PLAYING) return;
    
    switch(e.key.toLowerCase()) {
        case 'q':
            // Roll left
            if (player) {
                player.rotation.z += 0.3;
                player.quaternion.setFromEuler(player.rotation);
            }
            break;
            
        case 'e':
            // Roll right
            if (player) {
                player.rotation.z -= 0.3;
                player.quaternion.setFromEuler(player.rotation);
            }
            break;
            
        case 'v':
            // Cycle camera modes
            currentCameraMode = (currentCameraMode + 1) % CAMERA_MODES.length;
            updateCameraIndicator();
            console.log('[Camera] Mode:', CAMERA_MODE_NAMES[currentCameraMode]);
            break;
            
        case 'c':
            // Toggle cockpit/interior directly
            currentCameraMode = CAMERA_MODES.INTERIOR;
            updateCameraIndicator();
            initCockpitOverlay();
            break;
            
        case 'm':
            // Toggle mini-map
            const map = document.getElementById('miniMap');
            if (map) {
                map.style.display = map.style.display === 'none' ? 'block' : 'none';
            }
            break;
    }
}

/**
 * Update mini-map with proper scale
 */
function updateMiniMapV2() {
    if (!solarSystemManagerV2 || !player || !miniMapCtx) return;
    
    const ctx = miniMapCtx;
    const w = miniMapCanvas.width;
    const h = miniMapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    
    // Clear with 50% transparent background
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, w, h);
    
    // Get celestial bodies
    const bodies = solarSystemManagerV2.getMiniMapData(player.position, 2000);
    
    // Draw bodies
    bodies.forEach(body => {
        const px = cx + body.x;
        const py = cy + body.y;
        
        if (px >= -50 && px <= w + 50 && py >= -50 && py <= h + 50) {
            const colorHex = '#' + body.color.toString(16).padStart(6, '0');
            
            if (body.type === 'star') {
                // Star with glow
                const gradient = ctx.createRadialGradient(px, py, 2, px, py, body.size + 10);
                gradient.addColorStop(0, colorHex);
                gradient.addColorStop(0.3, colorHex + '88');
                gradient.addColorStop(1, 'transparent');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(px, py, body.size + 10, 0, Math.PI * 2);
                ctx.fill();
            }
            
            ctx.fillStyle = colorHex;
            ctx.beginPath();
            ctx.arc(px, py, body.size, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    
    // Draw player (small dot)
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(cx, cy, 3, 0, Math.PI * 2);
    ctx.fill();
    
    // Player direction
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + dir.x * 15, cy + dir.z * 15);
    ctx.stroke();
    
    // Draw "TOP" label
    ctx.fillStyle = '#00ff88';
    ctx.font = '10px "Courier New"';
    ctx.textAlign = 'center';
    ctx.fillText('TOP', cx, 15);
}

// Hook into existing game
window.addEventListener('keydown', handleV2KeyDown);

// Override update functions
const originalUpdatePlayer = window.updatePlayer;
window.updatePlayer = function(dt) {
    if (originalUpdatePlayer) originalUpdatePlayer(dt);
    
    // Apply gravity from V2 manager
    if (solarSystemManagerV2 && player && !window.playerLanded) {
        const gravity = solarSystemManagerV2.calculateGravity(player.position, 1);
        if (gravity.force.length() > 0) {
            player.velocity.add(gravity.force.clone().multiplyScalar(dt * 50));
        }
        
        if (gravity.inDeathZone) {
            window.playerDied = true;
            if (typeof handlePlayerDeath === 'function') {
                handlePlayerDeath();
            }
        }
    }
    
    // Update camera
    updateCameraV2(player, camera);
    
    // Send to brain
    sendGameStateToBrain(player);
};

const originalUpdateMiniMap = window.updateMiniMap;
window.updateMiniMap = function() {
    if (solarSystemManagerV2) {
        updateMiniMapV2();
    } else if (originalUpdateMiniMap) {
        originalUpdateMiniMap();
    }
};

// Override init
const originalInit = window.init;
window.init = function() {
    if (originalInit) originalInit();
    
    // Init V2 manager
    if (!solarSystemManagerV2 && typeof SolarSystemManagerV2 !== 'undefined') {
        solarSystemManagerV2 = new SolarSystemManagerV2(scene);
        if (player) solarSystemManagerV2.setPlayer(player);
        
        // Generate initial system
        solarSystemManagerV2.getSystemAt(0, 0, 0);
    }
    
    // Init cockpit overlay
    initCockpitOverlay();
    
    // Init AOS Brain
    initAOSBrain();
    
    // Update control hints
    const hints = document.getElementById('controlsHint');
    if (hints) {
        hints.innerHTML = `
            <b>Controls:</b><br>
            <span class="key">W</span><span class="key">S</span> Thrust<br>
            <span class="key">A</span><span class="key">D</span> Yaw<br>
            <span class="key">Q</span><span class="key">E</span> Roll<br>
            <span class="key">Arrows</span> Pitch<br>
            <span class="key">V</span> Camera<br>
            <span class="key">C</span> Cockpit<br>
            <span class="key">M</span> Map<br>
            <span class="key">L</span> Land<br>
            <span class="key">SPACE</span> Fire
        `;
    }
};

// Hook landing function
const originalAttemptLanding = window.attemptLanding;
window.attemptLanding = function() {
    if (solarSystemManagerV2) {
        const target = solarSystemManagerV2.getLandingTarget(player.position);
        if (target && target.distance < 10 && player.velocity.length() < 20) {
            // Land
            window.playerLanded = true;
            window.landedBody = target;
            player.velocity.set(0, 0, 0);
            
            showMessage(`Landed on ${target.body.name}! Press L to take off.`, 3000);
            if (typeof playSound === 'function') playSound('ui_confirm');
        } else if (target) {
            showMessage(`Approach ${target.body.name} slowly. Speed: ${Math.round(player.velocity.length())}`, 3000);
        }
    } else if (originalAttemptLanding) {
        originalAttemptLanding();
    }
};

console.log('[GameIntegrationV2] Loaded with new controls');
console.log('[Controls] Q/E: Roll, V: Camera, C: Cockpit, M: Map');
