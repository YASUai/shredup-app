/**
 * SHRED UP - Pitch Detection Module
 * Phase 3 - Pitch Detection Only
 * 
 * FFT-based autocorrelation pitch detection
 * Input: 2048-sample windows (50% overlap)
 * Output: Frequency (Hz) + Confidence (0-1)
 * 
 * NO musical interpretation (note names, cents)
 * NO metronome synchronization
 * Pure frequency detection only
 */

class PitchDetection {
    constructor() {
        this.SAMPLE_RATE = 48000;
        this.WINDOW_SIZE = 2048;
        this.HOP_SIZE = 1024; // 50% overlap
        this.MIN_FREQUENCY = 73;    // Hz (low D for 7-string guitar)
        this.MAX_FREQUENCY = 1200;  // Hz (high frets)
        
        this.isInitialized = false;
        
        // Pre-allocated buffers
        this.windowBuffer = new Float32Array(this.WINDOW_SIZE);
        this.hannWindow = new Float32Array(this.WINDOW_SIZE);
        this.fftOutput = new Float32Array(this.WINDOW_SIZE * 2); // Complex
        this.powerSpectrum = new Float32Array(this.WINDOW_SIZE * 2);
        this.autocorr = new Float32Array(this.WINDOW_SIZE * 2);
        
        // Performance tracking
        this.windowCount = 0;
        this.totalProcessingTime = 0;
        this.maxProcessingTime = 0;
        
        // Frame accumulator for 50% overlap
        this.frameAccumulator = [];
        this.currentFrameIndex = 0;
    }

    /**
     * Initialize pitch detection module
     */
    init() {
        try {
            logger.info('PITCH-DETECTION', 'Initializing pitch detection...');
            
            // Pre-compute Hann window
            for (let i = 0; i < this.WINDOW_SIZE; i++) {
                this.hannWindow[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (this.WINDOW_SIZE - 1)));
            }
            
            this.isInitialized = true;
            
            logger.success('PITCH-DETECTION', `Initialized (window: ${this.WINDOW_SIZE}, hop: ${this.HOP_SIZE})`);
            logger.info('PITCH-DETECTION', `Frequency range: ${this.MIN_FREQUENCY}-${this.MAX_FREQUENCY} Hz`);
            logger.info('PITCH-DETECTION', `Expected latency: ~55-60ms total`);
            
            return true;
        } catch (error) {
            logger.error('PITCH-DETECTION', 'Initialization failed', error);
            this.isInitialized = false;
            return false;
        }
    }

    /**
     * Process frames from frame buffer
     * Called by audio engine consumer loop
     */
    processFrames() {
        if (!this.isInitialized) {
            return null;
        }

        // Check if we have at least 4 frames for one window
        const availableFrames = frameBuffer.getBufferSize();
        
        if (availableFrames < 4) {
            // Not enough frames, skip silently
            return null;
        }

        // Read 4 frames (2048 samples) from buffer
        const frames = [];
        for (let i = 0; i < 4; i++) {
            const frame = frameBuffer.getNextFrame();
            if (!frame) {
                // Frame missing, skip this cycle
                return null;
            }
            frames.push(frame);
        }

        // Combine 4 frames into window buffer
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 512; j++) {
                this.windowBuffer[i * 512 + j] = frames[i].data[j];
            }
        }

        // Detect pitch
        const result = this.detectPitch(frames[0].timestamp, frames[0].frameNumber);

        return result;
    }

    /**
     * Detect pitch from current window buffer
     * @param {number} timestamp - AudioContext time (seconds)
     * @param {number} frameNumber - Frame number from first frame
     * @returns {Object} PitchResult { frequency, confidence, timestamp, frameNumber, processingTime }
     */
    detectPitch(timestamp, frameNumber) {
        const startTime = performance.now();

        try {
            // Apply Hann window
            for (let i = 0; i < this.WINDOW_SIZE; i++) {
                this.windowBuffer[i] *= this.hannWindow[i];
            }

            // FFT-based autocorrelation
            const frequency = this.autocorrelationFFT(this.windowBuffer);
            const confidence = this.calculateConfidence(this.autocorr, frequency);

            const processingTime = performance.now() - startTime;

            // Update performance stats
            this.windowCount++;
            this.totalProcessingTime += processingTime;
            this.maxProcessingTime = Math.max(this.maxProcessingTime, processingTime);

            // Log every 100 windows
            if (this.windowCount % 100 === 0) {
                const avgTime = this.totalProcessingTime / this.windowCount;
                logger.info('PITCH-DETECTION', `Avg processing: ${avgTime.toFixed(2)}ms | Max: ${this.maxProcessingTime.toFixed(2)}ms`);
                
                // Warn if processing too slow
                if (avgTime > 15) {
                    logger.warn('PITCH-DETECTION', `⚠️  Processing time (${avgTime.toFixed(2)}ms) exceeds 15ms threshold`);
                }
            }

            // Build result
            const result = {
                frequency: frequency,
                confidence: confidence,
                timestamp: timestamp,
                frameNumber: frameNumber,
                processingTime: processingTime
            };

            // Log pitch detection
            if (frequency && confidence >= 0.5) {
                logger.info('PITCH-DETECTION', `Frame ${frameNumber} | ${frequency.toFixed(1)} Hz | Conf: ${confidence.toFixed(2)} | Proc: ${processingTime.toFixed(1)}ms`);
            }

            // VALIDATION MODE: Log validation data if window.validationStats exists
            if (typeof window !== 'undefined' && window.validationStats && window.validationStats.expectedFreq) {
                const expected = window.validationStats.expectedFreq;
                
                if (frequency && confidence >= 0.5) {
                    // Record detection for statistics
                    window.validationStats.detections.push({
                        frequency: frequency,
                        confidence: confidence,
                        timestamp: timestamp,
                        frameNumber: frameNumber
                    });
                    
                    // Calculate validation metrics
                    const absError = frequency - expected;
                    const relError = (absError / expected) * 100;
                    const isOctave = window.isOctaveError ? window.isOctaveError(frequency, expected) : false;
                    
                    // Log validation line (every detection)
                    console.log(`[VALIDATION] Expected ${expected.toFixed(2)} Hz | Detected ${frequency.toFixed(2)} Hz | Error ${absError >= 0 ? '+' : ''}${absError.toFixed(2)} Hz (${relError >= 0 ? '+' : ''}${relError.toFixed(2)}%) ${isOctave ? '⚠️ OCTAVE' : ''}`);
                }
            }

            return result;

        } catch (error) {
            logger.error('PITCH-DETECTION', 'Pitch detection failed', error);
            return {
                frequency: null,
                confidence: 0,
                timestamp: timestamp,
                frameNumber: frameNumber,
                processingTime: performance.now() - startTime
            };
        }
    }

    /**
     * FFT-based autocorrelation
     * @param {Float32Array} signal - Windowed input signal
     * @returns {number|null} Detected frequency (Hz) or null
     */
    autocorrelationFFT(signal) {
        // 1. Compute FFT
        fft2048.realTransform(signal, this.fftOutput);

        // 2. Compute power spectrum (magnitude squared)
        for (let i = 0; i < this.WINDOW_SIZE; i++) {
            const real = this.fftOutput[i * 2];
            const imag = this.fftOutput[i * 2 + 1];
            this.powerSpectrum[i * 2] = real * real + imag * imag;
            this.powerSpectrum[i * 2 + 1] = 0;
        }

        // 3. Inverse FFT to get autocorrelation
        fft2048.inverseTransform(this.powerSpectrum, this.autocorr);

        // 4. Find peak in autocorrelation (ignoring DC component)
        const minLag = Math.floor(this.SAMPLE_RATE / this.MAX_FREQUENCY);
        const maxLag = Math.floor(this.SAMPLE_RATE / this.MIN_FREQUENCY);

        let maxValue = -Infinity;
        let peakLag = 0;

        for (let lag = minLag; lag < maxLag && lag < this.WINDOW_SIZE; lag++) {
            const value = this.autocorr[lag * 2]; // Real part only
            if (value > maxValue) {
                maxValue = value;
                peakLag = lag;
            }
        }

        // 5. Convert lag to frequency
        if (peakLag > 0 && maxValue > 0) {
            const frequency = this.SAMPLE_RATE / peakLag;
            
            // Validate frequency range
            if (frequency >= this.MIN_FREQUENCY && frequency <= this.MAX_FREQUENCY) {
                return frequency;
            }
        }

        return null;
    }

    /**
     * Calculate confidence score
     * @param {Float32Array} autocorr - Autocorrelation function
     * @param {number|null} frequency - Detected frequency
     * @returns {number} Confidence (0-1)
     */
    calculateConfidence(autocorr, frequency) {
        if (!frequency) {
            return 0;
        }

        // Simple confidence: ratio of peak to DC component
        const lag = Math.round(this.SAMPLE_RATE / frequency);
        const peakValue = Math.abs(autocorr[lag * 2]);
        const dcValue = Math.abs(autocorr[0]);

        if (dcValue === 0) {
            return 0;
        }

        const confidence = Math.min(peakValue / dcValue, 1.0);

        return confidence;
    }

    /**
     * Get module status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            windowSize: this.WINDOW_SIZE,
            hopSize: this.HOP_SIZE,
            frequencyRange: [this.MIN_FREQUENCY, this.MAX_FREQUENCY],
            sampleRate: this.SAMPLE_RATE,
            windowCount: this.windowCount,
            avgProcessingTime: this.windowCount > 0 ? (this.totalProcessingTime / this.windowCount).toFixed(2) : 0,
            maxProcessingTime: this.maxProcessingTime.toFixed(2)
        };
    }

    /**
     * Shutdown module
     */
    shutdown() {
        logger.info('PITCH-DETECTION', 'Shutting down...');
        
        this.isInitialized = false;
        this.windowCount = 0;
        this.totalProcessingTime = 0;
        this.maxProcessingTime = 0;
        
        logger.info('PITCH-DETECTION', 'Shutdown complete');
    }
}

// Singleton instance
const pitchDetection = new PitchDetection();

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = pitchDetection;
}
