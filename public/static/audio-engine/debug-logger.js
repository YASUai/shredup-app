/**
 * SHRED UP - Audio Engine Debug Logger
 * Phase 2A - Audio Scaffolding
 * 
 * Logs structurés et détaillés pour debugging
 * Console logs uniquement (pas de visualisation)
 */

class DebugLogger {
    constructor() {
        this.enabled = true;
        this.prefix = '[AUDIO ENGINE]';
    }

    info(module, message, data = null) {
        if (!this.enabled) return;
        
        const timestamp = new Date().toISOString().substr(11, 12);
        const log = `${this.prefix} [${timestamp}] [${module}] ${message}`;
        
        if (data) {
            console.log(log, data);
        } else {
            console.log(log);
        }
    }

    error(module, message, error = null) {
        if (!this.enabled) return;
        
        const timestamp = new Date().toISOString().substr(11, 12);
        const log = `${this.prefix} [${timestamp}] [${module}] ❌ ERROR: ${message}`;
        
        if (error) {
            console.error(log, error);
        } else {
            console.error(log);
        }
    }

    warn(module, message, data = null) {
        if (!this.enabled) return;
        
        const timestamp = new Date().toISOString().substr(11, 12);
        const log = `${this.prefix} [${timestamp}] [${module}] ⚠️  WARNING: ${message}`;
        
        if (data) {
            console.warn(log, data);
        } else {
            console.warn(log);
        }
    }

    success(module, message, data = null) {
        if (!this.enabled) return;
        
        const timestamp = new Date().toISOString().substr(11, 12);
        const log = `${this.prefix} [${timestamp}] [${module}] ✅ ${message}`;
        
        if (data) {
            console.log(log, data);
        } else {
            console.log(log);
        }
    }

    // Status monitoring logs
    status(module, status, details = {}) {
        if (!this.enabled) return;
        
        const timestamp = new Date().toISOString().substr(11, 12);
        console.log(`${this.prefix} [${timestamp}] [${module}] STATUS:`, {
            status,
            ...details
        });
    }

    // Frame processing logs
    frame(frameNumber, data) {
        if (!this.enabled) return;
        
        // Log every 100 frames to avoid spam
        if (frameNumber % 100 === 0) {
            console.log(`${this.prefix} [FRAME] #${frameNumber}`, data);
        }
    }

    enable() {
        this.enabled = true;
        console.log(`${this.prefix} Debug logging ENABLED`);
    }

    disable() {
        this.enabled = false;
        console.log(`${this.prefix} Debug logging DISABLED`);
    }
}

// Singleton instance
const logger = new DebugLogger();

// Export pour utilisation dans autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = logger;
}
