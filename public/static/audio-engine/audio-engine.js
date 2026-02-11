/**
 * SHRED UP - Audio Engine (Entry Point)
 * Phase 2A - Audio Scaffolding
 * 
 * Main orchestrator for audio pipeline
 * Coordinates all modules
 * Manages lifecycle
 * Provides unified API
 * 
 * NO DSP INTELLIGENCE (Phase 3)
 * Pipeline scaffolding only
 */

class AudioEngine {
    constructor() {
        this.isInitialized = false;
        this.isRunning = false;
        this.startTime = 0;
    }

    /**
     * Initialize audio engine
     * Sets up all modules in correct order
     */
    async init() {
        try {
            logger.info('AUDIO-ENGINE', '═══════════════════════════════════');
            logger.info('AUDIO-ENGINE', 'SHRED UP - Audio Engine Phase 2A');
            logger.info('AUDIO-ENGINE', 'Audio Scaffolding Initialization');
            logger.info('AUDIO-ENGINE', '═══════════════════════════════════');

            // Step 1: Initialize frame buffer
            logger.info('AUDIO-ENGINE', 'Step 1/4: Initializing frame buffer...');
            frameBuffer.init();

            // Step 2: Initialize audio capture
            logger.info('AUDIO-ENGINE', 'Step 2/4: Initializing audio capture...');
            const captureInit = await audioCapture.init();
            if (!captureInit) {
                throw new Error('Audio capture initialization failed');
            }

            // Step 3: Initialize timing sync (with metronome adapter)
            logger.info('AUDIO-ENGINE', 'Step 3/4: Initializing timing sync...');
            const timingInit = await timingSync.init();
            if (!timingInit) {
                throw new Error('Timing sync initialization failed');
            }

            // Step 4: Mark as initialized
            this.isInitialized = true;

            logger.success('AUDIO-ENGINE', '═══════════════════════════════════');
            logger.success('AUDIO-ENGINE', 'Audio Engine Initialized Successfully');
            logger.success('AUDIO-ENGINE', '═══════════════════════════════════');

            return true;
        } catch (error) {
            logger.error('AUDIO-ENGINE', 'Initialization failed', error);
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Start audio engine
     * Begins audio capture and processing
     */
    async start() {
        if (!this.isInitialized) {
            logger.error('AUDIO-ENGINE', 'Cannot start: not initialized');
            return false;
        }

        if (this.isRunning) {
            logger.warn('AUDIO-ENGINE', 'Already running');
            return false;
        }

        try {
            logger.info('AUDIO-ENGINE', '───────────────────────────────────');
            logger.info('AUDIO-ENGINE', 'Starting Audio Engine...');
            logger.info('AUDIO-ENGINE', '───────────────────────────────────');

            // Start audio capture
            const captureStarted = await audioCapture.startCapture();
            if (!captureStarted) {
                throw new Error('Failed to start audio capture');
            }

            this.isRunning = true;
            this.startTime = performance.now();

            logger.success('AUDIO-ENGINE', '───────────────────────────────────');
            logger.success('AUDIO-ENGINE', 'Audio Engine Running');
            logger.success('AUDIO-ENGINE', '───────────────────────────────────');

            // Log initial status
            this.logStatus();

            return true;
        } catch (error) {
            logger.error('AUDIO-ENGINE', 'Failed to start', error);
            this.isRunning = false;
            return false;
        }
    }

    /**
     * Stop audio engine
     */
    stop() {
        if (!this.isRunning) {
            logger.warn('AUDIO-ENGINE', 'Not running');
            return false;
        }

        try {
            logger.info('AUDIO-ENGINE', 'Stopping audio engine...');

            // Stop audio capture
            audioCapture.stopCapture();

            this.isRunning = false;

            logger.success('AUDIO-ENGINE', 'Audio engine stopped');

            // Log final status
            this.logStatus();

            return true;
        } catch (error) {
            logger.error('AUDIO-ENGINE', 'Failed to stop', error);
            return false;
        }
    }

    /**
     * Get comprehensive status of all modules
     */
    getStatus() {
        return {
            engine: {
                initialized: this.isInitialized,
                running: this.isRunning,
                uptime: this.isRunning ? (performance.now() - this.startTime).toFixed(0) : 0
            },
            audioCapture: audioCapture.getStatus(),
            frameBuffer: frameBuffer.getStatus(),
            timingSync: timingSync.getStatus()
        };
    }

    /**
     * Log current status (for debugging)
     */
    logStatus() {
        const status = this.getStatus();
        
        logger.status('AUDIO-ENGINE', 'full-status', status);

        // Formatted summary
        console.log('─────────────────────────────────');
        console.log('AUDIO ENGINE STATUS SUMMARY');
        console.log('─────────────────────────────────');
        console.log(`Engine:        ${status.engine.running ? '✅ Running' : '○ Stopped'}`);
        console.log(`Microphone:    ${status.audioCapture.capturing ? '● Connected' : '○ Disconnected'}`);
        console.log(`Frame Buffer:  ${status.frameBuffer.healthy ? '✓ Healthy' : '✗ Degraded'}`);
        console.log(`Clock Sync:    ${status.timingSync.synced ? '✓ Synced' : '✗ Not Synced'}`);
        console.log('─────────────────────────────────');
        console.log(`Frames:        ${status.frameBuffer.frameCount} (dropped: ${status.frameBuffer.droppedFrames})`);
        console.log(`Tempo:         ${status.timingSync.tempo} BPM`);
        console.log(`Sample Rate:   ${status.audioCapture.sampleRate} Hz`);
        console.log('─────────────────────────────────');
    }

    /**
     * Shutdown audio engine
     * Cleanup all resources
     */
    shutdown() {
        logger.info('AUDIO-ENGINE', '═══════════════════════════════════');
        logger.info('AUDIO-ENGINE', 'Shutting down Audio Engine...');
        logger.info('AUDIO-ENGINE', '═══════════════════════════════════');

        // Stop if running
        if (this.isRunning) {
            this.stop();
        }

        // Shutdown all modules
        timingSync.shutdown();
        audioCapture.shutdown();
        frameBuffer.shutdown();

        this.isInitialized = false;
        this.isRunning = false;

        logger.success('AUDIO-ENGINE', '═══════════════════════════════════');
        logger.success('AUDIO-ENGINE', 'Audio Engine Shutdown Complete');
        logger.success('AUDIO-ENGINE', '═══════════════════════════════════');
    }
}

// Create singleton instance
const audioEngine = new AudioEngine();

// Make available globally for testing
if (typeof window !== 'undefined') {
    window.audioEngine = audioEngine;
}

// Export pour utilisation dans autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = audioEngine;
}
