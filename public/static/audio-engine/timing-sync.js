/**
 * SHRED UP - Timing Sync Module
 * Phase 2A - Audio Scaffolding
 * 
 * Synchronization avec horloge métronome
 * Calcul drift / offset
 * Monitoring sync health
 * READ-ONLY access via metronome adapter
 */

class TimingSync {
    constructor() {
        this.isInitialized = false;
        this.isSynced = false;
        
        this.audioContextTime = 0;
        this.metronomeClock = 0;
        this.drift = 0;
        
        this.syncCheckInterval = null;
        this.lastSyncCheck = 0;
    }

    /**
     * Initialize timing sync
     */
    async init() {
        try {
            logger.info('TIMING-SYNC', 'Initializing timing sync...');

            // Connect to metronome adapter (READ-ONLY)
            // Adapter now returns true even in standalone mode
            const connected = await metronomeAdapter.connect();
            
            if (!connected) {
                logger.warn('TIMING-SYNC', 'Metronome adapter connection failed - continuing anyway');
            }

            this.isInitialized = true;

            // Start sync monitoring
            this.startSyncMonitoring();

            if (metronomeAdapter.isConnected) {
                logger.success('TIMING-SYNC', 'Timing sync initialized (connected to metronome)');
            } else {
                logger.success('TIMING-SYNC', 'Timing sync initialized (STANDALONE mode)');
            }

            return true;
        } catch (error) {
            logger.error('TIMING-SYNC', 'Initialization failed', error);
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Start sync monitoring (check every second)
     */
    startSyncMonitoring() {
        this.syncCheckInterval = setInterval(() => {
            this.checkSync();
        }, 1000);
        
        logger.info('TIMING-SYNC', 'Sync monitoring started');
    }

    /**
     * Check synchronization status
     */
    checkSync() {
        if (!this.isInitialized) {
            return;
        }

        // Get current timestamps (with safety check for audioCapture)
        const audioTime = (typeof audioCapture !== 'undefined' && audioCapture.audioContext) ? audioCapture.audioContext.currentTime : 0;
        const metronomeTime = metronomeAdapter.getTimestamp();

        // Calculate drift (difference between audio context time and metronome time)
        // Note: These are different time scales, so drift is informational only
        this.audioContextTime = audioTime;
        this.metronomeClock = metronomeTime;
        
        // Simple sync check: if both clocks are advancing, we're synced
        const audioAdvancing = audioTime > 0;
        const metronomeAdvancing = metronomeTime > this.lastSyncCheck;
        
        this.isSynced = audioAdvancing && metronomeAdvancing;
        
        this.lastSyncCheck = metronomeTime;

        // Log sync status every 10 checks (~10 seconds)
        const checkCount = Math.floor(metronomeTime / 1000);
        if (checkCount % 10 === 0 && checkCount > 0) {
            logger.status('TIMING-SYNC', 'sync-check', this.getStatus());
        }
    }

    /**
     * Get current tempo from metronome (READ-ONLY)
     */
    getTempo() {
        return metronomeAdapter.getTempo();
    }

    /**
     * Get beat interval in milliseconds (READ-ONLY)
     */
    getBeatInterval() {
        return metronomeAdapter.getBeatInterval();
    }

    /**
     * Get current beat position (READ-ONLY)
     */
    getBeatPosition() {
        return metronomeAdapter.getBeatPosition();
    }

    /**
     * Get metronome timestamp (READ-ONLY)
     */
    getMetronomeTimestamp() {
        return metronomeAdapter.getTimestamp();
    }

    /**
     * Get audio context time
     */
    getAudioContextTime() {
        return (typeof audioCapture !== 'undefined' && audioCapture.audioContext) ? audioCapture.audioContext.currentTime : 0;
    }

    /**
     * Check if metronome is playing (READ-ONLY)
     */
    isMetronomePlaying() {
        return metronomeAdapter.isPlaying();
    }

    /**
     * Get timing sync status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            synced: this.isSynced,
            tempo: this.getTempo(),
            beatInterval: this.getBeatInterval(),
            beatPosition: this.getBeatPosition(),
            audioContextTime: this.audioContextTime,
            metronomeTime: this.metronomeClock,
            metronomePlaying: this.isMetronomePlaying(),
            metronomeAdapter: metronomeAdapter.getStatus()
        };
    }

    /**
     * Stop sync monitoring
     */
    stopSyncMonitoring() {
        if (this.syncCheckInterval) {
            clearInterval(this.syncCheckInterval);
            this.syncCheckInterval = null;
        }
        
        logger.info('TIMING-SYNC', 'Sync monitoring stopped');
    }

    /**
     * Shutdown timing sync
     */
    shutdown() {
        logger.info('TIMING-SYNC', 'Shutting down...');

        this.stopSyncMonitoring();
        metronomeAdapter.disconnect();

        this.isInitialized = false;
        this.isSynced = false;

        logger.info('TIMING-SYNC', 'Shutdown complete');
    }
}

// Singleton instance
const timingSync = new TimingSync();

// Export pour utilisation dans autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = timingSync;
}
