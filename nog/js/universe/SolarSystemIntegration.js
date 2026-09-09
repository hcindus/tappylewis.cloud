/**
 * SolarSystemIntegration.js - Bridge between old system and new physics-based solar systems
 * Adds gravity, collision, landing, and star death mechanics
 */

// Global solar system manager
let solarSystemManager = null;
let playerLanded = false;
let landedBody = null;
let playerDied = false;

/**
 * Initialize the solar system manager with physics
 */
function initSolarSystemPhysics() {
    if (!scene) return;
    
    solarSystemManager = new SolarSystemVoxelManager(scene);
    console.log('[SolarSystem] Physics manager initialized');
}

/**
 * Update solar systems with physics
 */
function updateSolarSystemPhysics(dt) {
    if (!solarSystemManager || !player) return;
    
    // Update systems (orbits, rotations)
    solarSystemManager.update(dt, player.position);
    
    // Skip physics if player is landed
    if (playerLanded) {
        // Keep player at landed position
        if (landedBody) {
            const body = landedBody.body;
            const normal = landedBody.normal;
            
            // Update position to stay on surface as planet rotates
            const landingPos = body.mesh.position.clone().add(
                normal.clone().multiplyScalar(body.radius + 5)
            );
            player.position.copy(landingPos);
            
            // Align with surface
            const up = normal.clone();
            const forward = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
            const right = new THREE.Vector3().crossVectors(forward, up).normalize();
            const newForward = new THREE.Vector3().crossVectors(up, right).normalize();
            
            const alignMatrix = new THREE.Matrix4();
            alignMatrix.makeBasis(right, up, newForward);
            player.quaternion.setFromRotationMatrix(alignMatrix);
        }
        return;
    }
    
    // Calculate gravity
    const gravity = solarSystemManager.calculateGravity(player.position, 1);
    
    // Apply gravitational force
    if (gravity.force.length() > 0) {
        player.velocity.add(gravity.force.clone().multiplyScalar(dt * 100));
    }
    
    // Check for star death
    if (gravity.inDeathZone) {
        playerDied = true;
        handlePlayerDeath();
        return;
    }
    
    // Check for slingshot
    const slingshot = solarSystemManager.checkSlingshot(player.position, player.velocity);
    if (slingshot.available && input.keys['shift']) {
        // Apply slingshot boost when thrusting near star
        const boost = slingshot.direction.clone().multiplyScalar(slingshot.boost * dt);
        player.velocity.add(boost);
        
        // Show slingshot indicator
        showSlingshotIndicator(slingshot.efficiency);
    } else {
        hideSlingshotIndicator();
    }
    
    // Check collisions
    checkPlayerCollisions();
}

/**
 * Check player collisions with celestial bodies
 */
function checkPlayerCollisions() {
    if (!solarSystemManager || !player) return;
    
    const collisions = solarSystemManager.checkCollisions(player.position, 10);
    
    collisions.forEach(collision => {
        if (collision.fatal) {
            playerDied = true;
            handlePlayerDeath();
        } else if (collision.type === 'planet' || collision.type === 'moon') {
            if (collision.canLand) {
                // Bounce
                const bounce = collision.normal.clone().multiplyScalar(50);
                player.velocity.reflect(collision.normal).multiplyScalar(0.3);
                player.velocity.add(bounce);
                
                // Show landing hint
                if (collision.distance < collision.body.radius + 20 && player.velocity.length() < 50) {
                    showMessage(`Press L to land on ${collision.body.name}`, 2000);
                }
            } else {
                // Crash into non-landable body
                player.shield -= 20;
                player.velocity.reflect(collision.normal).multiplyScalar(0.5);
                playSound('explosion');
            }
        } else if (collision.type === 'asteroid') {
            player.shield -= collision.damage || 10;
            const pushDir = new THREE.Vector3()
                .subVectors(player.position, collision.body.mesh.position)
                .normalize();
            player.velocity.add(pushDir.multiplyScalar(100));
            playSound('hit');
        }
    });
    
    // Check shield depletion
    if (player.shield <= 0) {
        playerDied = true;
        handlePlayerDeath();
    }
}

/**
 * Attempt to land on a nearby planet
 */
function attemptLanding() {
    if (!solarSystemManager || !player) return;
    
    if (playerLanded) {
        // Already landed - take off
        takeoff();
        return;
    }
    
    const target = solarSystemManager.getLandingTarget(player.position);
    
    if (target && target.distance < 20 && player.velocity.length() < 50) {
        // Land
        playerLanded = true;
        landedBody = target;
        player.velocity.set(0, 0, 0);
        
        showMessage(`Landed on ${target.body.name}! Press L to take off.`, 3000);
        playSound('ui_confirm');
    } else if (target) {
        showMessage(`Approach ${target.body.name} slowly. Speed: ${Math.round(player.velocity.length())} Distance: ${Math.round(target.distance)}`, 3000);
    } else {
        showMessage('No landing zone nearby. Find a planet.', 3000);
    }
}

/**
 * Take off from landed position
 */
function takeoff() {
    if (!playerLanded) return;
    
    playerLanded = false;
    landedBody = null;
    
    // Initial upward thrust
    const up = player.position.clone().normalize();
    player.velocity.add(up.multiplyScalar(100));
    
    showMessage('Liftoff! Thrusters engaged.', 3000);
    playSound('engine');
}

/**
 * Handle player death
 */
function handlePlayerDeath() {
    if (!playerDied) return;
    
    playerDied = false;
    
    playSound('explosion');
    showMessage('SHIP DESTROYED!', 5000);
    
    // Respawn after delay
    setTimeout(() => {
        player.position.set(400, 50, 0);
        player.velocity.set(0, 0, 0);
        player.shield = 100;
        player.fuel = 100;
        playerLanded = false;
        landedBody = null;
        showMessage('Respawning...', 3000);
    }, 3000);
}

/**
 * Update mini map with celestial bodies
 */
function updateSolarSystemMiniMap() {
    if (!solarSystemManager || !player || !miniMapCtx) return;
    
    const ctx = miniMapCtx;
    const w = miniMapCanvas.width;
    const h = miniMapCanvas.height;
    const cx = w / 2;
    const cy = h / 2;
    
    // Clear
    ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
    ctx.fillRect(0, 0, w, h);
    
    // Get celestial bodies
    const bodies = solarSystemManager.getMiniMapData(player.position, 500);
    
    // Draw bodies
    bodies.forEach(body => {
        const px = cx + body.x * 0.5;
        const py = cy + body.z * 0.5;
        
        if (px >= 0 && px <= w && py >= 0 && py <= h) {
            ctx.fillStyle = '#' + body.color.toString(16).padStart(6, '0');
            ctx.beginPath();
            ctx.arc(px, py, body.size, 0, Math.PI * 2);
            ctx.fill();
            
            // Glow for stars
            if (body.type === 'star') {
                const gradient = ctx.createRadialGradient(px, py, 2, px, py, 15);
                gradient.addColorStop(0, 'rgba(255, 200, 100, 0.5)');
                gradient.addColorStop(1, 'rgba(255, 200, 100, 0)');
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(px, py, 15, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    });
    
    // Draw player
    ctx.fillStyle = '#00ff88';
    ctx.beginPath();
    ctx.arc(cx, cy, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Direction indicator
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(player.quaternion);
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(cx + dir.x * 12, cy + dir.z * 12);
    ctx.stroke();
}

/**
 * Show slingshot efficiency indicator
 */
let slingshotIndicator = null;
function showSlingshotIndicator(efficiency) {
    if (!slingshotIndicator) {
        slingshotIndicator = document.createElement('div');
        slingshotIndicator.style.cssText = `
            position: absolute;
            bottom: 250px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(255, 200, 0, 0.9);
            color: #000;
            padding: 10px 20px;
            border-radius: 20px;
            font-weight: bold;
            font-family: 'Courier New', monospace;
            z-index: 100;
        `;
        document.body.appendChild(slingshotIndicator);
    }
    
    slingshotIndicator.style.display = 'block';
    slingshotIndicator.textContent = `SLINGSHOT: ${Math.round(efficiency * 100)}% - HOLD SHIFT`;
}

function hideSlingshotIndicator() {
    if (slingshotIndicator) {
        slingshotIndicator.style.display = 'none';
    }
}

/**
 * Show temporary message
 */
function showMessage(text, duration = 3000) {
    const msgDiv = document.createElement('div');
    msgDiv.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0, 255, 136, 0.9);
        color: #000;
        padding: 20px 40px;
        border-radius: 5px;
        font-family: 'Courier New', monospace;
        font-weight: bold;
        z-index: 1000;
        pointer-events: none;
        text-align: center;
    `;
    msgDiv.textContent = text;
    document.body.appendChild(msgDiv);
    
    setTimeout(() => msgDiv.remove(), duration);
}

// Hook into existing game loop
// Override updatePlayer to include physics
const originalUpdatePlayer = window.updatePlayer;
window.updatePlayer = function(dt) {
    // Call original
    if (originalUpdatePlayer) originalUpdatePlayer(dt);
    
    // Add solar system physics
    updateSolarSystemPhysics(dt);
};

// Hook into mini map
const originalUpdateMiniMap = window.updateMiniMap;
window.updateMiniMap = function() {
    if (solarSystemManager) {
        updateSolarSystemMiniMap();
    } else if (originalUpdateMiniMap) {
        originalUpdateMiniMap();
    }
};

// Hook into init
const originalInit = window.init;
window.init = function() {
    if (originalInit) originalInit();
    initSolarSystemPhysics();
};

// Add key handler for landing
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'l') {
        attemptLanding();
    }
});

console.log('[SolarSystem] Integration loaded');
