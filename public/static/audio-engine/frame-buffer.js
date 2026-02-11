/**
 * SHRED UP - Frame Buffer
 * Phase 2A - Audio Scaffolding
 * 
 * Stable frame buffering (512 samples)
 * Gestion de la queue de frames
 * Détection frame drops
 * Monitoring santé pipeline
 */

class FrameBuffer {
    constructor() {
        this.FRAME_SIZE = 512; // Fixed frame size
        this.MAX_BUFFER_SIZE = 100; // Maximum frames in buffer (Phase 2A: no consumer yet)
        
        this.buffer = [];
        this.frameCount = 0;
        this.droppedFrames = 0;
        this.lastProcessTime = 0;
        
        this.isHealthy = true;
        this.healthCheckInterval = null;
    }

    /**
     * Initialize frame buffer
     */
    init() {
        logger.info('FRAME-BUFFER', `Initializing with frame size: ${this.FRAME_SIZE} samples`);
        
        this.buffer = [];
        this.frameCount = 0;
        this.droppedFrames = 0;
        this.isHealthy = true;
        
        // Start health monitoring
        this.startHealthMonitoring();
        
        logger.success('FRAME-BUFFER', 'Initialized successfully');
    }

    /**
     * Add new frame to buffer
     * @param {Float32Array} frameData - Raw audio frame (512 samples)
     * @param {number} timestamp - High-resolution timestamp
     */
    addFrame(frameData, timestamp) {
        // Validate frame size
        if (frameData.length !== this.FRAME_SIZE) {
            logger.error('FRAME-BUFFER', `Invalid frame size: ${frameData.length} (expected ${this.FRAME_SIZE})`);
            return false;
        }

        // Check buffer overflow
        if (this.buffer.length >= this.MAX_BUFFER_SIZE) {
            // Phase 2A: No consumer yet, so overflow is expected
            // Just drop silently without warning
            this.buffer.shift(); // Remove oldest frame
            this.droppedFrames++;
        }

        // Add frame to buffer
        this.buffer.push({
            data: frameData,
            timestamp: timestamp,
            frameNumber: this.frameCount
        });

        this.frameCount++;
        this.lastProcessTime = performance.now();

        // Log every 100 frames
        if (this.frameCount % 100 === 0) {
            logger.frame(this.frameCount, {
                bufferSize: this.buffer.length,
                droppedFrames: this.droppedFrames,
                healthy: this.isHealthy
            });
        }

        return true;
    }

    /**
     * Get next frame from buffer
     * @returns {Object|null} Frame object or null if buffer empty
     */
    getNextFrame() {
        if (this.buffer.length === 0) {
            return null;
        }

        return this.buffer.shift();
    }

    /**
     * Get current buffer size
     */
    getBufferSize() {
        return this.buffer.length;
    }

    /**
     * Get buffer status
     */
    getStatus() {
        return {
            bufferSize: this.buffer.length,
            maxBufferSize: this.MAX_BUFFER_SIZE,
            frameCount: this.frameCount,
            droppedFrames: this.droppedFrames,
            dropRate: this.frameCount > 0 ? (this.droppedFrames / this.frameCount * 100).toFixed(2) : 0,
            healthy: this.isHealthy,
            lastProcessTime: this.lastProcessTime
        };
    }

    /**
     * Start health monitoring
     */
    startHealthMonitoring() {
        // Check health every 1 second
        this.healthCheckInterval = setInterval(() => {
            this.checkHealth();
        }, 1000);
    }

    /**
     * Check buffer health
     */
    checkHealth() {
        const now = performance.now();
        const timeSinceLastFrame = now - this.lastProcessTime;

        // If no frames received in last 2000ms (2s), mark as unhealthy
        // Only check if we've received frames before (frameCount > 0)
        if (timeSinceLastFrame > 2000 && this.frameCount > 0) {
            this.isHealthy = false;
            // Don't spam warnings - only log if health status changed
        } else if (timeSinceLastFrame <= 2000) {
            // Reset health if frames are coming
            this.isHealthy = true;
        }

        // Log status every 10 seconds
        if (this.frameCount > 0 && this.frameCount % 1000 === 0) {
            logger.status('FRAME-BUFFER', 'health-check', this.getStatus());
        }
    }

    /**
     * Stop health monitoring
     */
    stopHealthMonitoring() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }

    /**
     * Clear buffer
     */
    clear() {
        this.buffer = [];
        logger.info('FRAME-BUFFER', 'Buffer cleared');
    }

    /**
     * Shutdown frame buffer
     */
    shutdown() {
        this.stopHealthMonitoring();
        this.clear();
        this.frameCount = 0;
        this.droppedFrames = 0;
        this.isHealthy = false;
        
        logger.info('FRAME-BUFFER', 'Shutdown complete');
    }
}

// Singleton instance
const frameBuffer = new FrameBuffer();

// Export pour utilisation dans autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = frameBuffer;
}
