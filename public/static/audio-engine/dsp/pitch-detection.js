/**
 * SHRED UP - Pitch Detection Module
 * Phase 3 - Pitch Detection Only (YIN Algorithm)
 * 
 * YIN fundamental frequency estimator
 * Input: 2048-sample windows (50% overlap)
 * Output: Frequency (Hz) + Confidence (0-1)
 * 
 * NO musical interpretation (note names, cents)
 * NO metronome synchronization
 * Pure frequency detection only
 * 
 * Reference: "YIN, a fundamental frequency estimator for speech and music"
 *            de Cheveigné & Kawahara (2002)
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
        
        // YIN-specific buffers
        this.differenceFunction = new Float32Array(this.WINDOW_SIZE / 2); // d(τ)
        this.cmndf = new Float32Array(this.WINDOW_SIZE / 2);              // d'(τ) - CMND
        
        // Performance tracking
        this.windowCount = 0;
        this.totalProcessingTime = 0;
        this.maxProcessingTime = 0;
        
        // Frame accumulator for 50% overlap
        this.frameAccumulator = [];
        this.currentFrameIndex = 0;
        
        // Low Frequency Enhancer (post-detection layer)
        // NOTE: Will be initialized lazily when available
        this.lowFreqEnhancer = null;
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
            
            // Initialize Low Frequency Enhancer (if available)
            if (typeof lowFrequencyEnhancer !== 'undefined') {
                this.lowFreqEnhancer = lowFrequencyEnhancer;
                this.lowFreqEnhancer.init();
                logger.info('PITCH-DETECTION', 'Low Frequency Enhancer: ACTIVE (<70 Hz)');
            } else {
                logger.warn('PITCH-DETECTION', 'Low Frequency Enhancer: NOT LOADED');
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

            // YIN pitch detection
            const yinResult = this.detectPitchYIN(this.windowBuffer);
            let frequency = yinResult.frequency;
            const confidence = yinResult.confidence;
            
            // Apply Low Frequency Enhancement (< 70 Hz only)
            if (this.lowFreqEnhancer && frequency && frequency < 70) {
                const enhanced = this.lowFreqEnhancer.enhance(frequency, confidence, this.cmndf);
                frequency = enhanced.frequency;
            }

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

            // Build result object
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
     * McLeod Pitch Method (MPM) pitch detection
     * @param {Float32Array} signal - Windowed input signal
     * @returns {Object} { frequency: number|null, confidence: number }
     */
    /**
     * YIN pitch detection algorithm
     * @param {Float32Array} signal - Windowed input signal
     * @returns {Object} { frequency: number|null, confidence: number }
     */
    detectPitchYIN(signal) {
        // 1. Compute difference function d(τ)
        this.computeDifferenceFunction(signal);
        
        // 2. Compute cumulative mean normalized difference function d'(τ)
        this.computeCMNDF();
        
        // 3. Absolute threshold: find first τ where d'(τ) < threshold
        const YIN_THRESHOLD = 0.10; // Standard YIN threshold (0.10-0.15)
        const tau = this.absoluteThreshold(YIN_THRESHOLD);
        
        if (tau === -1) {
            return { frequency: null, confidence: 0 };
        }
        
        // 4. Parabolic interpolation for sub-sample accuracy
        const refinedTau = this.parabolicInterpolation(tau);
        
        // 5. Convert tau to frequency
        if (refinedTau > 0) {
            const frequency = this.SAMPLE_RATE / refinedTau;
            
            // Validate frequency range
            if (frequency >= this.MIN_FREQUENCY && frequency <= this.MAX_FREQUENCY) {
                // Confidence = 1 - d'(τ)
                const confidence = Math.max(0, 1 - this.cmndf[tau]);
                
                return {
                    frequency: frequency,
                    confidence: confidence
                };
            }
        }
        
        return { frequency: null, confidence: 0 };
    }
    
    /**
     * Compute difference function d(τ)
     * d(τ) = Σ(x[j] - x[j+τ])² for j = 0 to N-τ-1
     */
    computeDifferenceFunction(signal) {
        const N = signal.length;
        const maxTau = Math.floor(N / 2); // Only compute up to N/2
        
        for (let tau = 0; tau < maxTau; tau++) {
            let sum = 0;
            for (let j = 0; j < N - tau; j++) {
                const delta = signal[j] - signal[j + tau];
                sum += delta * delta;
            }
            this.differenceFunction[tau] = sum;
        }
    }
    
    /**
     * Compute cumulative mean normalized difference function d'(τ)
     * d'(τ) = d(τ) / [(1/τ) * Σd(j)] for j=1 to τ
     * 
     * Special case: d'(0) = 1 by definition
     */
    computeCMNDF() {
        this.cmndf[0] = 1; // Special case for τ=0
        
        let runningSum = 0;
        const maxTau = this.differenceFunction.length;
        
        for (let tau = 1; tau < maxTau; tau++) {
            runningSum += this.differenceFunction[tau];
            
            if (runningSum === 0) {
                this.cmndf[tau] = 1; // Avoid division by zero
            } else {
                // d'(τ) = d(τ) * τ / runningSum
                this.cmndf[tau] = this.differenceFunction[tau] * tau / runningSum;
            }
        }
    }
    
    /**
     * Absolute threshold: find first τ where d'(τ) < threshold
     * Search within valid lag range for target frequency range
     * 
     * @param {number} threshold - YIN threshold (typically 0.10-0.15)
     * @returns {number} τ index, or -1 if not found
     */
    absoluteThreshold(threshold) {
        const minTau = Math.floor(this.SAMPLE_RATE / this.MAX_FREQUENCY);
        const maxTau = Math.min(
            Math.floor(this.SAMPLE_RATE / this.MIN_FREQUENCY),
            this.cmndf.length - 1
        );
        
        // Find first τ > minTau where d'(τ) < threshold
        for (let tau = minTau; tau < maxTau; tau++) {
            if (this.cmndf[tau] < threshold) {
                // Found a candidate, now search for local minimum
                // (YIN paper step 5: choose deepest valley)
                while (tau + 1 < maxTau && this.cmndf[tau + 1] < this.cmndf[tau]) {
                    tau++;
                }
                return tau;
            }
        }
        
        // No valid τ found below threshold
        // Fallback: return global minimum (best available)
        let minValue = this.cmndf[minTau];
        let minTau_fallback = minTau;
        
        for (let tau = minTau + 1; tau < maxTau; tau++) {
            if (this.cmndf[tau] < minValue) {
                minValue = this.cmndf[tau];
                minTau_fallback = tau;
            }
        }
        
        // Only return fallback if it's reasonably good (< 0.5)
        if (minValue < 0.5) {
            return minTau_fallback;
        }
        
        return -1; // No pitch detected
    }
    
    /**
     * Parabolic interpolation for sub-sample accuracy
     * Fits parabola through 3 points: (x-1, y-1), (x, y), (x+1, y+1)
     * Returns refined tau position
     * 
     * Note: For YIN, we interpolate on CMNDF (finding minimum)
     */
    parabolicInterpolation(x) {
        if (x <= 0 || x >= this.cmndf.length - 1) {
            return x; // Can't interpolate at boundaries
        }
        
        const y_minus = this.cmndf[x - 1];
        const y_mid = this.cmndf[x];
        const y_plus = this.cmndf[x + 1];
        
        // Parabola vertex formula: x_vertex = x + 0.5 * (y- - y+) / (y- - 2*y_mid + y+)
        const denominator = y_minus - 2 * y_mid + y_plus;
        
        if (Math.abs(denominator) < 1e-10) {
            return x; // Nearly flat, no interpolation needed
        }
        
        const delta = 0.5 * (y_minus - y_plus) / denominator;
        
        return x + delta;
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
        
        // Reset low frequency enhancer if active
        if (this.lowFreqEnhancer) {
            this.lowFreqEnhancer.reset();
        }
        
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
