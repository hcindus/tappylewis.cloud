/**
 * Renderer.js - Rendering System
 * Handles scene, camera, effects, and rendering pipeline
 */

class GameRenderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x000011, 0.00000005);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 1, 1e15);
        this.camera.position.set(0, 100, 500);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.autoClear = false;
        
        // Post-processing
        this.composer = null;
        this.setupPostProcessing();
        
        // Lighting
        this.setupLighting();
        
        // Star field
        this.starField = this.createStarField();
        this.scene.add(this.starField);
        
        // Mini map
        this.miniMapCanvas = document.getElementById('miniMapCanvas');
        this.miniMapCtx = this.miniMapCanvas.getContext('2d');
        this.miniMapCanvas.width = 200;
        this.miniMapCanvas.height = 200;
        
        // Resize handler
        window.addEventListener('resize', () => this.onResize());
        
        // Visual effects
        this.effects = {
            shake: 0,
            warp: false,
            warpFactor: 0
        };
    }
    
    setupLighting() {
        // Ambient
        this.ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(this.ambientLight);
        
        // Directional (star light)
        this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
        this.sunLight.position.set(0, 1000, 0);
        this.scene.add(this.sunLight);
        
        // Point lights for dynamic objects
        this.pointLights = [];
    }
    
    setupPostProcessing() {
        // Check if EffectComposer is available
        if (typeof THREE.EffectComposer !== 'undefined') {
            this.composer = new THREE.EffectComposer(this.renderer);
            
            const renderPass = new THREE.RenderPass(this.scene, this.camera);
            this.composer.addPass(renderPass);
            
            // Bloom for star glow
            const bloomPass = new THREE.UnrealBloomPass(
                new THREE.Vector2(this.width, this.height),
                1.5, 0.4, 0.85
            );
            this.composer.addPass(bloomPass);
            
            // Film grain
            const filmPass = new THREE.FilmPass(0.35, 0.025, 648, false);
            this.composer.addPass(filmPass);
        }
    }
    
    createStarField() {
        const geometry = new THREE.BufferGeometry();
        const count = 5000;
        const positions = new Float32Array(count * 3);
        const colors = new Float32Array(count * 3);
        const sizes = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            // Random positions in a large sphere
            const r = 1e12;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            
            positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
            positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
            positions[i * 3 + 2] = r * Math.cos(phi);
            
            // Star colors (blue to red)
            const temp = Math.random();
            colors[i * 3] = temp > 0.7 ? 1.0 : temp;
            colors[i * 3 + 1] = temp > 0.3 && temp < 0.7 ? 1.0 : temp * 0.5;
            colors[i * 3 + 2] = temp < 0.3 ? 1.0 : temp * 0.8;
            
            sizes[i] = Math.random() * 2 + 0.5;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        const material = new THREE.PointsMaterial({
            size: 2,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            sizeAttenuation: false
        });
        
        return new THREE.Points(geometry, material);
    }
    
    addObject(object) {
        this.scene.add(object);
    }
    
    removeObject(object) {
        this.scene.remove(object);
    }
    
    setCameraPosition(position) {
        this.camera.position.copy(position);
    }
    
    setCameraRotation(quaternion) {
        this.camera.quaternion.copy(quaternion);
    }
    
    shake(duration = 0.5, intensity = 1) {
        this.effects.shake = intensity;
        setTimeout(() => {
            this.effects.shake = 0;
        }, duration * 1000);
    }
    
    startWarp() {
        this.effects.warp = true;
    }
    
    stopWarp() {
        this.effects.warp = false;
    }
    
    updateWarp(deltaTime) {
        if (this.effects.warp) {
            this.effects.warpFactor = Math.min(this.effects.warpFactor + deltaTime * 2, 1);
        } else {
            this.effects.warpFactor = Math.max(this.effects.warpFactor - deltaTime * 2, 0);
        }
        
        if (this.effects.warpFactor > 0) {
            // Stretch star field
            const scale = 1 + this.effects.warpFactor * 10;
            this.starField.scale.set(1, 1, scale);
            this.starField.material.opacity = 1 - this.effects.warpFactor * 0.5;
        } else {
            this.starField.scale.set(1, 1, 1);
            this.starField.material.opacity = 0.8;
        }
    }
    
    render() {
        // Apply screen shake
        if (this.effects.shake > 0) {
            const shakeX = (Math.random() - 0.5) * this.effects.shake;
            const shakeY = (Math.random() - 0.5) * this.effects.shake;
            this.camera.position.x += shakeX;
            this.camera.position.y += shakeY;
        }
        
        // Render
        if (this.composer) {
            this.composer.render();
        } else {
            this.renderer.clear();
            this.renderer.render(this.scene, this.camera);
        }
    }
    
    updateMiniMap(playerPosition, planets = []) {
        const ctx = this.miniMapCtx;
        const w = 200;
        const h = 200;
        const cx = w / 2;
        const cy = h / 2;
        
        // Clear
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, w, h);
        
        // Grid
        ctx.strokeStyle = '#003322';
        ctx.lineWidth = 1;
        for (let i = 0; i < w; i += 20) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, h);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(w, i);
            ctx.stroke();
        }
        
        // Scale indicator
        const scale = 1e-8; // Convert to map units
        
        // Draw planets
        planets.forEach((planet, i) => {
            const px = cx + Math.cos(planet.angle) * planet.distance * scale;
            const py = cy + Math.sin(planet.angle) * planet.distance * scale;
            
            ctx.beginPath();
            ctx.arc(px, py, 3, 0, Math.PI * 2);
            ctx.fillStyle = i % 2 === 0 ? '#00ff88' : '#0088ff';
            ctx.fill();
        });
        
        // Draw player (center)
        ctx.beginPath();
        ctx.arc(cx, cy, 5, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        
        // Player direction indicator
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.lineTo(cx + 8, cy);
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        
        // Border
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.strokeRect(0, 0, w, h);
    }
    
    onResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        
        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();
        
        this.renderer.setSize(this.width, this.height);
        
        if (this.composer) {
            this.composer.setSize(this.width, this.height);
        }
    }
    
    dispose() {
        this.renderer.dispose();
    }
}

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameRenderer;
}
