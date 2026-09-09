/**
 * BrainBridge Integration for N'og nog
 * Connects game to AOS Brain via WebSocket
 */

class BrainBridge {
    constructor(url = 'ws://localhost:8765') {
        this.url = url;
        this.ws = null;
        this.connected = false;
        this.messageQueue = [];
        this.reconnectDelay = 5000;
        
        this.connect();
    }
    
    connect() {
        try {
            this.ws = new WebSocket(this.url);
            
            this.ws.onopen = () => {
                console.log('[BrainBridge] Connected to AOS Brain');
                this.connected = true;
                
                // Send queued messages
                while (this.messageQueue.length > 0) {
                    const msg = this.messageQueue.shift();
                    this.send(msg);
                }
                
                // Register as game client
                this.send({
                    type: 'register',
                    clientType: 'game',
                    timestamp: Date.now()
                });
            };
            
            this.ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleMessage(data);
                } catch (e) {
                    console.error('[BrainBridge] Parse error:', e);
                }
            };
            
            this.ws.onclose = () => {
                console.log('[BrainBridge] Disconnected');
                this.connected = false;
                setTimeout(() => this.connect(), this.reconnectDelay);
            };
            
            this.ws.onerror = (error) => {
                console.error('[BrainBridge] Error:', error);
            };
            
        } catch (e) {
            console.error('[BrainBridge] Connection failed:', e);
            setTimeout(() => this.connect(), this.reconnectDelay);
        }
    }
    
    send(data) {
        if (this.connected && this.ws.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(data));
        } else {
            this.messageQueue.push(data);
        }
    }
    
    sendEvent(eventType, data) {
        this.send({
            type: 'event',
            event: eventType,
            data: data,
            timestamp: Date.now()
        });
    }
    
    sendGameState(player, portals) {
        if (!player) return;
        
        this.send({
            type: 'game_state',
            data: {
                position: [
                    player.mesh.position.x,
                    player.mesh.position.y,
                    player.mesh.position.z
                ],
                velocity: player.velocity ? [
                    player.velocity.x,
                    player.velocity.y,
                    player.velocity.z
                ] : [0, 0, 0],
                health: player.health || 100,
                fuel: player.fuel || 100,
                nearbyPortals: portals || []
            },
            timestamp: Date.now()
        });
    }
    
    handleMessage(data) {
        switch (data.type) {
            case 'action':
                this.handleAction(data.action, data.params);
                break;
            case 'decision':
                console.log('[BrainBridge] Decision:', data.decision);
                break;
            case 'ping':
                this.send({ type: 'pong', timestamp: Date.now() });
                break;
            default:
                console.log('[BrainBridge] Message:', data);
        }
    }
    
    handleAction(action, params) {
        console.log('[BrainBridge] Action:', action, params);
        
        // Dispatch to game
        if (window.game && window.game.player) {
            switch (action) {
                case 'move':
                    // Apply movement input
                    break;
                case 'use_portal':
                    if (window.portalSystem && params.portalId) {
                        const portal = window.portalSystem.portals.get(params.portalId);
                        if (portal) {
                            window.portalSystem.teleport(window.game.player, portal);
                        }
                    }
                    break;
                case 'explore':
                    // Set exploration target
                    break;
            }
        }
    }
    
    // Portal-related methods
    reportPortalProximity(portalId, distance) {
        this.sendEvent('portal_nearby', { portalId, distance });
    }
    
    requestPortalDecision(portal, playerPos, targetPos) {
        this.send({
            type: 'decision_request',
            context: 'portal_usage',
            data: {
                portal: {
                    id: portal.id,
                    type: portal.type,
                    position: portal.position.toArray(),
                    destination: portal.destination.toArray()
                },
                player: {
                    position: playerPos.toArray()
                },
                target: targetPos ? targetPos.toArray() : null
            }
        });
    }
}

// Global instance
window.BrainBridge = BrainBridge;
