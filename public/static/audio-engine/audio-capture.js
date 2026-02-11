/**
 * SHRED UP - Audio Capture
 * Phase 2A - Audio Scaffolding
 * 
 * Web Audio API capture
 * Low-latency configuration
 * AudioWorklet connection
 * Status monitoring
 */

class AudioCapture {
    constructor() {
        this.audioContext = null;
        this.mediaStream = null;
        this.sourceNode = null;
        this.workletNode = null;
        
        this.isInitialized = false;
        this.isCapturing = false;
        this.sampleRate = 48000; // Default, will be set by AudioContext
    }

    /**
     * Initialize Audio Context and request microphone permission
     */
    async init() {
        try {
            logger.info('AUDIO-CAPTURE', 'Initializing Audio Context...');

            // Create AudioContext with low-latency configuration
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                latencyHint: 'interactive', // Low latency
                sampleRate: 48000 // Preferred sample rate
            });

            this.sampleRate = this.audioContext.sampleRate;

            logger.success('AUDIO-CAPTURE', `AudioContext created (sampleRate: ${this.sampleRate} Hz)`);

            // Load AudioWorklet processor
            await this.loadWorklet();

            this.isInitialized = true;

            logger.success('AUDIO-CAPTURE', 'Initialization complete');

            return true;
        } catch (error) {
            logger.error('AUDIO-CAPTURE', 'Initialization failed', error);
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Load AudioWorklet processor
     */
    async loadWorklet() {
        try {
            logger.info('AUDIO-CAPTURE', 'Loading AudioWorklet processor...');

            await this.audioContext.audioWorklet.addModule('/static/audio-engine/audio-worklet.js');

            logger.success('AUDIO-CAPTURE', 'AudioWorklet processor loaded');

            return true;
        } catch (error) {
            logger.error('AUDIO-CAPTURE', 'Failed to load AudioWorklet processor', error);
            throw error;
        }
    }

    /**
     * Request microphone permission and start capture
     */
    async startCapture() {
        if (!this.isInitialized) {
            throw new Error('Audio capture not initialized');
        }

        if (this.isCapturing) {
            logger.warn('AUDIO-CAPTURE', 'Already capturing');
            return false;
        }

        try {
            logger.info('AUDIO-CAPTURE', 'Requesting microphone permission...');

            // Request microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false, // Disable for music input
                    noiseSuppression: false, // Disable for music input
                    autoGainControl: false,  // Disable for music input
                    latency: 0 // Request lowest latency
                }
            });

            logger.success('AUDIO-CAPTURE', 'Microphone permission granted');

            // Create source node from media stream
            this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);

            // Create AudioWorklet node
            this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-engine-processor');

            // Setup message handler
            this.setupWorkletMessageHandler();

            // Connect: Microphone → Worklet
            this.sourceNode.connect(this.workletNode);

            // Important: Worklet node must be connected to destination or it won't process
            // We can connect to a GainNode with gain=0 to avoid audio feedback
            const silentGain = this.audioContext.createGain();
            silentGain.gain.value = 0;
            this.workletNode.connect(silentGain);
            silentGain.connect(this.audioContext.destination);

            this.isCapturing = true;

            logger.success('AUDIO-CAPTURE', 'Audio capture started');

            return true;
        } catch (error) {
            logger.error('AUDIO-CAPTURE', 'Failed to start capture', error);
            this.isCapturing = false;
            return false;
        }
    }

    /**
     * Setup AudioWorklet message handler
     */
    setupWorkletMessageHandler() {
        this.workletNode.port.onmessage = (event) => {
            if (event.data.type === 'audioFrame') {
                // Forward frame to frame buffer
                frameBuffer.addFrame(event.data.frameData, event.data.timestamp);
            }
        };

        logger.info('AUDIO-CAPTURE', 'Worklet message handler setup complete');
    }

    /**
     * Stop audio capture
     */
    stopCapture() {
        if (!this.isCapturing) {
            logger.warn('AUDIO-CAPTURE', 'Not capturing');
            return false;
        }

        try {
            logger.info('AUDIO-CAPTURE', 'Stopping audio capture...');

            // Disconnect nodes
            if (this.sourceNode) {
                this.sourceNode.disconnect();
                this.sourceNode = null;
            }

            if (this.workletNode) {
                this.workletNode.disconnect();
                this.workletNode = null;
            }

            // Stop media stream
            if (this.mediaStream) {
                this.mediaStream.getTracks().forEach(track => track.stop());
                this.mediaStream = null;
            }

            this.isCapturing = false;

            logger.success('AUDIO-CAPTURE', 'Audio capture stopped');

            return true;
        } catch (error) {
            logger.error('AUDIO-CAPTURE', 'Failed to stop capture', error);
            return false;
        }
    }

    /**
     * Get capture status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            capturing: this.isCapturing,
            sampleRate: this.sampleRate,
            audioContextState: this.audioContext ? this.audioContext.state : 'null',
            mediaStreamActive: this.mediaStream ? this.mediaStream.active : false
        };
    }

    /**
     * Shutdown audio capture
     */
    shutdown() {
        logger.info('AUDIO-CAPTURE', 'Shutting down...');

        this.stopCapture();

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        this.isInitialized = false;

        logger.info('AUDIO-CAPTURE', 'Shutdown complete');
    }
}

// Singleton instance
const audioCapture = new AudioCapture();

// Export pour utilisation dans autres modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = audioCapture;
}
