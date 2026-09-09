/**
 * Component - Base class for all game components
 * Based on Unity's Component architecture and Unreal's UObject system
 */

class Component {
    constructor(name = "Component") {
        this.name = name;
        this.enabled = true;
        this.gameObject = null;
        this.transform = null;
    }
    
    // Lifecycle methods
    awake() {}
    start() {}
    update(deltaTime) {}
    lateUpdate(deltaTime) {}
    fixedUpdate(fixedDeltaTime) {}
    onEnable() {}
    onDisable() {}
    onDestroy() {}
    
    // Component management
    getComponent(type) {
        if (!this.gameObject) return null;
        return this.gameObject.getComponent(type);
    }
    
    getComponents(type) {
        if (!this.gameObject) return [];
        return this.gameObject.getComponents(type);
    }
    
    addComponent(component) {
        if (!this.gameObject) return null;
        return this.gameObject.addComponent(component);
    }
    
    removeComponent(component) {
        if (!this.gameObject) return;
        this.gameObject.removeComponent(component);
    }
    
    // Utility
    sendMessage(methodName, parameter = null) {
        if (!this.gameObject) return;
        this.gameObject.sendMessage(methodName, parameter);
    }
    
    broadcastMessage(methodName, parameter = null) {
        if (!this.gameObject) return;
        this.gameObject.broadcastMessage(methodName, parameter);
    }
    
    // Enable/Disable
    setEnabled(enabled) {
        if (this.enabled === enabled) return;
        this.enabled = enabled;
        if (enabled) {
            this.onEnable();
        } else {
            this.onDisable();
        }
    }
    
    // Compare tag
    compareTag(tag) {
        if (!this.gameObject) return false;
        return this.gameObject.tag === tag;
    }
    
    // Serialization
    serialize() {
        return {
            name: this.name,
            enabled: this.enabled
        };
    }
    
    deserialize(data) {
        this.name = data.name || this.name;
        this.enabled = data.enabled !== undefined ? data.enabled : true;
    }
}

// ComponentRegistry for type-safe component creation
class ComponentRegistry {
    constructor() {
        this.types = new Map();
    }
    
    register(name, componentClass) {
        this.types.set(name, componentClass);
    }
    
    create(name) {
        const ComponentClass = this.types.get(name);
        if (!ComponentClass) {
            console.warn(`Component type "${name}" not registered`);
            return null;
        }
        return new ComponentClass();
    }
    
    has(name) {
        return this.types.has(name);
    }
}

const componentRegistry = new ComponentRegistry();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { Component, ComponentRegistry, componentRegistry };
}
