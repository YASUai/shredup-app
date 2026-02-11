/**
 * SHRED UP - AudioWorklet Processor
 * Phase 2A - Audio Scaffolding
 * 
 * Real-time audio processing (512 samples per frame)
 * Extract raw audio buffers
 * Send to frame buffer
 * NO DSP intelligence (Phase 3)
 */

class AudioEngineProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        
        this.FRAME_SIZE = 512;
        this.frameBuffer = new Float32Array(this.FRAME_SIZE);
        this.frameBufferIndex = 0;
        this.frameCount = 0;
        
        // Listen for messages from main thread
        this.port.onmessage = (event) => {
            if (event.data.type === 'ping') {
                this.port.postMessage({ type: 'pong', frameCount: this.frameCount });
            }
        };
    }

    /**
     * Process audio (called automatically by AudioWorklet)
     * @param {Array} inputs - Input audio channels
     * @param {Array} outputs - Output audio channels (unused)
     * @param {Object} parameters - Audio parameters (unused)
     * @returns {boolean} - true to keep processor alive
     */
    process(inputs, outputs, parameters) {
        // Get first input (microphone)
        const input = inputs[0];
        
        if (!input || input.length === 0) {
            // No input available
            return true;
        }

        // Get first channel (mono)
        const inputChannel = input[0];
        
        if (!inputChannel) {
            return true;
        }

        // Process each sample in the input buffer (typically 128 samples)
        for (let i = 0; i < inputChannel.length; i++) {
            // Add sample to frame buffer
            this.frameBuffer[this.frameBufferIndex] = inputChannel[i];
            this.frameBufferIndex++;

            // When frame is complete (512 samples)
            if (this.frameBufferIndex >= this.FRAME_SIZE) {
                // Send frame to main thread
                this.sendFrame();
                
                // Reset frame buffer
                this.frameBufferIndex = 0;
            }
        }

        // Keep processor alive
        return true;
    }

    /**
     * Send complete frame to main thread
     */
    sendFrame() {
        // Get high-resolution timestamp
        const timestamp = this.currentTime; // AudioContext time
        
        // Copy frame data (important: create new array)
        const frameCopy = new Float32Array(this.frameBuffer);
        
        // Send to main thread
        this.port.postMessage({
            type: 'audioFrame',
            frameData: frameCopy,
            timestamp: timestamp,
            frameNumber: this.frameCount,
            frameSize: this.FRAME_SIZE
        }, [frameCopy.buffer]); // Transfer ownership for performance

        this.frameCount++;
    }
}

// Register processor
registerProcessor('audio-engine-processor', AudioEngineProcessor);
