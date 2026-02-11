/**
 * SHRED UP - Metronome Adapter (BLACK BOX)
 * Phase 2A - Audio Scaffolding
 * 
 * CRITICAL RULE: METRONOME IS LOCKED
 * This adapter provides READ-ONLY access to metronome timing
 * No modifications to metronome internals allowed
 * No state changes allowed
 * No timing modifications allowed
 * 
 * The metronome is the MASTER clock reference
 */

class MetronomeAdapter {
    constructor() {
        this.metronomeIframe = null;
        this.isConnected = false;
        this.lastTempo = 120; // Default fallback
        this.lastBeatPosition = 0;
        this.lastTimestamp = 0;
    }

    /**
     * Initialize connection to metronome iframe
     * READ-ONLY connection
     * Falls back to standalone mode if metronome not found
     */
    async connect() {
        try {
            // Find metronome iframe (in SHRED UP or test page)
            this.metronomeIframe = document.querySelector('.metronome-iframe');
            
            if (!this.metronomeIframe) {
                logger.warn('METRONOME-ADAPTER', 'Metronome iframe not found - running in STANDALONE mode');
                logger.warn('METRONOME-ADAPTER', 'Using fallback tempo: 120 BPM');
                this.isConnected = false; // Not connected, but functional
                return true; // Return true to allow audio engine to continue
            }

            // Listen to metronome clock updates (if metronome exposes them)
            // For now, we'll implement a polling mechanism
            this.isConnected = true;
            
            logger.success('METRONOME-ADAPTER', 'Connected to metronome (READ-ONLY)');
            
            return true;
        } catch (error) {
            logger.warn('METRONOME-ADAPTER', 'Connection error - falling back to STANDALONE mode', error);
            this.isConnected = false;
            return true; // Return true to allow audio engine to continue
        }
    }

    /**
     * Get current tempo (BPM)
     * READ-ONLY
     */
    getTempo() {
        // Return fallback tempo (no warning spam)
        if (!this.isConnected) {
            return this.lastTempo;
        }

        // TODO Phase 2A: Implement actual metronome BPM reading
        // For now, return fallback
        // In future, we might add postMessage communication if needed
        
        return this.lastTempo;
    }

    /**
     * Get current beat position (0-based)
     * READ-ONLY
     */
    getBeatPosition() {
        if (!this.isConnected) {
            return this.lastBeatPosition;
        }

        // TODO Phase 2A: Implement actual beat position reading
        // For now, return fallback
        
        return this.lastBeatPosition;
    }

    /**
     * Get high-resolution timestamp reference
     * READ-ONLY
     * Returns performance.now() aligned with metronome timing
     */
    getTimestamp() {
        // Use performance.now() as high-resolution clock
        // This is the same clock the metronome uses internally
        return performance.now();
    }

    /**
     * Get timing interval for current tempo (milliseconds per beat)
     * READ-ONLY calculation
     */
    getBeatInterval() {
        const tempo = this.getTempo();
        return 60000 / tempo; // ms per beat
    }

    /**
     * Check if metronome is playing
     * READ-ONLY
     */
    isPlaying() {
        if (!this.isConnected) {
            return false;
        }

        // TODO Phase 2A: Implement actual play state reading
        // For now, assume not playing
        
        return false;
    }

    /**
     * Get adapter status
     * READ-ONLY
     */
    getStatus() {
        return {
            connected: this.isConnected,
            tempo: this.getTempo(),
            beatPosition: this.getBeatPosition(),
            beatInterval: this.getBeatInterval(),
            timestamp: this.getTimestamp(),
            playing: this.isPlaying()
        };
    }

    /**
     * Disconnect from metronome
     */
    disconnect() {
        this.isConnected = false;
        this.metronomeIframe = null;
        logger.info('METRONOME-ADAPTER', 'Disconnected from metronome');
    }
}

// Singleton instance
const metronomeAdapter = new MetronomeAdapter();

// Export pour utilisation dans autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = metronomeAdapter;
}
