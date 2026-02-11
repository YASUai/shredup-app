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
        this.WINDOW_SIZE = 2048;  // Baseline window
        this.WINDOW_SIZE_EXTENDED = 4096;  // Extended window for A1
        this.HOP_SIZE = 1024; // 50% overlap
        this.MIN_FREQUENCY = 50;    // Hz (extended to support A1 55 Hz)
        this.MAX_FREQUENCY = 1200;  // Hz (high frets)
        
        this.isInitialized = false;
        
        // Pre-allocated buffers (2048 baseline)
        this.windowBuffer = new Float32Array(this.WINDOW_SIZE);
        this.hannWindow = new Float32Array(this.WINDOW_SIZE);
        
        // Extended buffers (4096 for A1)
        this.windowBufferExtended = new Float32Array(this.WINDOW_SIZE_EXTENDED);
        this.hannWindowExtended = new Float32Array(this.WINDOW_SIZE_EXTENDED);
        
        // YIN-specific buffers (will be sized dynamically)
        this.differenceFunction = new Float32Array(this.WINDOW_SIZE / 2);
        this.cmndf = new Float32Array(this.WINDOW_SIZE / 2);
        
        // Extended YIN buffers
        this.differenceFunctionExtended = new Float32Array(this.WINDOW_SIZE_EXTENDED / 2);
        this.cmndfExtended = new Float32Array(this.WINDOW_SIZE_EXTENDED / 2);
        
        // Performance tracking
        this.windowCount = 0;
        this.totalProcessingTime = 0;
        this.maxProcessingTime = 0;
        
        // Frame accumulator for dual-pass
        this.frameAccumulator = [];
        this.currentFrameIndex = 0;
        
        // Spectral Analyzer (pre-analysis)
        this.spectralAnalyzer = null;
        
        // Extended window state
        this.isWaitingForExtendedFrames = false;
        this.extendedFramesNeeded = 0;
    }

    /**
     * Initialize pitch detection module
     */
    init() {
        try {
            logger.info('PITCH-DETECTION', 'Initializing pitch detection...');
            
            // Pre-compute Hann window (2048)
            for (let i = 0; i < this.WINDOW_SIZE; i++) {
                this.hannWindow[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (this.WINDOW_SIZE - 1)));
            }
            
            // Pre-compute Hann window (4096)
            for (let i = 0; i < this.WINDOW_SIZE_EXTENDED; i++) {
                this.hannWindowExtended[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (this.WINDOW_SIZE_EXTENDED - 1)));
            }
            
            // Initialize Spectral Analyzer
            if (typeof spectralAnalyzer !== 'undefined') {
                this.spectralAnalyzer = spectralAnalyzer;
                this.spectralAnalyzer.init();
                logger.info('PITCH-DETECTION', 'Spectral Analyzer: ACTIVE (40-80 Hz detection)');
                logger.info('PITCH-DETECTION', 'Dual-Pass: 2048 (baseline) | 4096 (A1 mode)');
            } else {
                logger.warn('PITCH-DETECTION', 'Spectral Analyzer: NOT LOADED (2048 only)');
            }
            
            this.isInitialized = true;
            
            logger.success('PITCH-DETECTION', `Initialized (window: ${this.WINDOW_SIZE}/${this.WINDOW_SIZE_EXTENDED}, hop: ${this.HOP_SIZE})`);
            logger.info('PITCH-DETECTION', `Frequency range: ${this.MIN_FREQUENCY}-${this.MAX_FREQUENCY} Hz`);
            logger.info('PITCH-DETECTION', `Expected latency: ~55ms (2048) | ~100ms (4096 conditional)`);
            
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
     * 
     * DUAL-PASS ARCHITECTURE:
     * 1. Read 4 frames (2048 samples)
     * 2. Spectral pre-analysis (40-80 Hz energy)
     * 3. IF low-freq energy detected → wait for 4 more frames (4096 total) → YIN 4096
     * 4. ELSE → YIN 2048 (baseline)
     */
    processFrames() {
        if (!this.isInitialized) {
            return null;
        }

        // Check if we have at least 4 frames for baseline window
        const availableFrames = frameBuffer.getBufferSize();
        
        if (availableFrames < 4) {
            return null;
        }

        // Read 4 frames (2048 samples) from buffer
        const frames = [];
        for (let i = 0; i < 4; i++) {
            const frame = frameBuffer.getNextFrame();
            if (!frame) {
                return null;
            }
            frames.push(frame);
        }

        // Combine 4 frames into baseline window buffer
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 512; j++) {
                this.windowBuffer[i * 512 + j] = frames[i].data[j];
            }
        }

        // SPECTRAL PRE-ANALYSIS: Check for low frequency energy (40-80 Hz)
        let useExtendedWindow = false;
        
        if (this.spectralAnalyzer) {
            const analysis = this.spectralAnalyzer.analyze(this.windowBuffer);
            useExtendedWindow = analysis.needsExtendedWindow;
            
            if (useExtendedWindow) {
                logger.info('PITCH-DETECTION', `[DUAL-PASS] Low-freq energy detected (${(analysis.energyRatio * 100).toFixed(1)}%) → Extended window 4096`);
            }
        }

        // DUAL-PASS DECISION
        if (useExtendedWindow && availableFrames >= 8) {
            // Extended mode: Read 4 more frames (total 8 frames = 4096 samples)
            const extendedFrames = [...frames];
            
            for (let i = 0; i < 4; i++) {
                const frame = frameBuffer.getNextFrame();
                if (!frame) {
                    // Not enough frames available, fall back to 2048
                    logger.warn('PITCH-DETECTION', '[DUAL-PASS] Extended frames unavailable, falling back to 2048');
                    return this.detectPitch(frames[0].timestamp, frames[0].frameNumber, false);
                }
                extendedFrames.push(frame);
            }
            
            // Combine 8 frames into extended window buffer (4096 samples)
            for (let i = 0; i < 8; i++) {
                for (let j = 0; j < 512; j++) {
                    this.windowBufferExtended[i * 512 + j] = extendedFrames[i].data[j];
                }
            }
            
            // Detect with extended window
            return this.detectPitch(extendedFrames[0].timestamp, extendedFrames[0].frameNumber, true);
            
        } else {
            // Baseline mode: Use 2048 window
            return this.detectPitch(frames[0].timestamp, frames[0].frameNumber, false);
        }
    }

    /**
     * Detect pitch from window buffer
     * @param {number} timestamp - AudioContext time (seconds)
     * @param {number} frameNumber - Frame number from first frame
     * @param {boolean} useExtended - Use 4096 extended window (true) or 2048 baseline (false)
     * @returns {Object} PitchResult { frequency, confidence, timestamp, frameNumber, processingTime, windowSize }
     */
    detectPitch(timestamp, frameNumber, useExtended = false) {
        const startTime = performance.now();

        try {
            const windowSize = useExtended ? this.WINDOW_SIZE_EXTENDED : this.WINDOW_SIZE;
            const buffer = useExtended ? this.windowBufferExtended : this.windowBuffer;
            const hannWindow = useExtended ? this.hannWindowExtended : this.hannWindow;
            
            // Apply Hann window
            for (let i = 0; i < windowSize; i++) {
                buffer[i] *= hannWindow[i];
            }

            // YIN pitch detection (with appropriate window size)
            const yinResult = this.detectPitchYIN(buffer, windowSize);
            const frequency = yinResult.frequency;
            const confidence = yinResult.confidence;

            const processingTime = performance.now() - startTime;

            // Update performance stats
            this.windowCount++;
            this.totalProcessingTime += processingTime;
            this.maxProcessingTime = Math.max(this.maxProcessingTime, processingTime);

            // Log every 100 windows
            if (this.windowCount % 100 === 0) {
                const avgTime = this.totalProcessingTime / this.windowCount;
                logger.info('PITCH-DETECTION', `Avg processing: ${avgTime.toFixed(2)}ms | Max: ${this.maxProcessingTime.toFixed(2)}ms`);
                
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
                processingTime: processingTime,
                windowSize: windowSize  // Track which window was used
            };

            // Log pitch detection
            if (frequency && confidence >= 0.5) {
                const windowLabel = useExtended ? '4096' : '2048';
                logger.info('PITCH-DETECTION', `Frame ${frameNumber} | ${frequency.toFixed(1)} Hz | Conf: ${confidence.toFixed(2)} | Win: ${windowLabel} | Proc: ${processingTime.toFixed(1)}ms`);
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
     * @param {Float32Array} signal - Audio signal (2048 or 4096 samples)
     * @param {number} windowSize - Window size (2048 or 4096)
     * @returns {Object} { frequency: number|null, confidence: number }
     */
    detectPitchYIN(signal, windowSize) {
        const useExtended = windowSize === this.WINDOW_SIZE_EXTENDED;
        const diffFunc = useExtended ? this.differenceFunctionExtended : this.differenceFunction;
        const cmndf = useExtended ? this.cmndfExtended : this.cmndf;
        
        // 1. Compute difference function d(τ)
        this.computeDifferenceFunction(signal, diffFunc);
        
        // 2. Compute cumulative mean normalized difference function d'(τ)
        this.computeCMNDF(diffFunc, cmndf);
        
        // 3. Absolute threshold: find first τ where d'(τ) < threshold
        const YIN_THRESHOLD = 0.10; // Standard YIN threshold (0.10-0.15)
        const tau = this.absoluteThreshold(YIN_THRESHOLD, cmndf);
        
        if (tau === -1) {
            return { frequency: null, confidence: 0 };
        }
        
        // 4. Parabolic interpolation for sub-sample accuracy
        const refinedTau = this.parabolicInterpolation(tau, cmndf);
        
        // 5. Convert tau to frequency
        if (refinedTau > 0) {
            const frequency = this.SAMPLE_RATE / refinedTau;
            
            // Validate frequency range
            if (frequency >= this.MIN_FREQUENCY && frequency <= this.MAX_FREQUENCY) {
                // Confidence = 1 - d'(τ)
                const confidence = Math.max(0, 1 - cmndf[tau]);
                
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
    computeDifferenceFunction(signal, diffFunc) {
        const N = signal.length;
        const maxTau = Math.floor(N / 2); // Only compute up to N/2
        
        for (let tau = 0; tau < maxTau; tau++) {
            let sum = 0;
            for (let j = 0; j < N - tau; j++) {
                const delta = signal[j] - signal[j + tau];
                sum += delta * delta;
            }
            diffFunc[tau] = sum;
        }
    }
    
    /**
     * Compute cumulative mean normalized difference function d'(τ)
     * d'(τ) = d(τ) / [(1/τ) * Σd(j)] for j=1 to τ
     * 
     * Special case: d'(0) = 1 by definition
     */
    computeCMNDF(diffFunc, cmndf) {
        cmndf[0] = 1; // Special case for τ=0
        
        let runningSum = 0;
        const maxTau = diffFunc.length;
        
        for (let tau = 1; tau < maxTau; tau++) {
            runningSum += diffFunc[tau];
            
            if (runningSum === 0) {
                cmndf[tau] = 1; // Avoid division by zero
            } else {
                // d'(τ) = d(τ) * τ / runningSum
                cmndf[tau] = diffFunc[tau] * tau / runningSum;
            }
        }
    }
    
    /**
     * Absolute threshold: find first τ where d'(τ) < threshold
     * Search within valid lag range for target frequency range
     * 
     * @param {number} threshold - YIN threshold (typically 0.10-0.15)
     * @param {number} threshold - YIN threshold (0.10)
     * @param {Float32Array} cmndf - CMND buffer to search
     * @returns {number} τ index, or -1 if not found
     */
    absoluteThreshold(threshold, cmndf) {
        const minTau = Math.floor(this.SAMPLE_RATE / this.MAX_FREQUENCY);
        const maxTau = Math.min(
            Math.floor(this.SAMPLE_RATE / this.MIN_FREQUENCY),
            cmndf.length - 1
        );
        
        // Find first τ > minTau where d'(τ) < threshold
        for (let tau = minTau; tau < maxTau; tau++) {
            if (cmndf[tau] < threshold) {
                // Found a candidate, now search for local minimum
                // (YIN paper step 5: choose deepest valley)
                while (tau + 1 < maxTau && cmndf[tau + 1] < cmndf[tau]) {
                    tau++;
                }
                return tau;
            }
        }
        
        // No valid τ found below threshold
        // Fallback: return global minimum (best available)
        let minValue = cmndf[minTau];
        let minTau_fallback = minTau;
        
        for (let tau = minTau + 1; tau < maxTau; tau++) {
            if (cmndf[tau] < minValue) {
                minValue = cmndf[tau];
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
     * @param {number} x - Tau index
     * @param {Float32Array} cmndf - CMND buffer
     */
    parabolicInterpolation(x, cmndf) {
        if (x <= 0 || x >= cmndf.length - 1) {
            return x; // Can't interpolate at boundaries
        }
        
        const y_minus = cmndf[x - 1];
        const y_mid = cmndf[x];
        const y_plus = cmndf[x + 1];
        
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
            windowSizeExtended: this.WINDOW_SIZE_EXTENDED,
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

// Create singleton instance (global for browser)
var pitchDetection = new PitchDetection();

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = pitchDetection;
}
