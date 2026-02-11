/**
 * SHRED UP - Pitch Detection Module
 * Phase 3 - Pitch Detection Only (MPM Algorithm)
 * 
 * McLeod Pitch Method (MPM) using NSDF (Normalized Square Difference Function)
 * Input: 2048-sample windows (50% overlap)
 * Output: Frequency (Hz) + Confidence (0-1)
 * 
 * NO musical interpretation (note names, cents)
 * NO metronome synchronization
 * Pure frequency detection only
 * 
 * Reference: "A Smarter Way to Find Pitch" by Philip McLeod & Geoff Wyvill (2005)
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
        
        // MPM-specific buffers
        this.nsdf = new Float32Array(this.WINDOW_SIZE); // NSDF values
        this.acf = new Float32Array(this.WINDOW_SIZE);  // Autocorrelation
        this.m = new Float32Array(this.WINDOW_SIZE);    // Normalization term
        
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

            // MPM pitch detection
            const mpmResult = this.detectPitchMPM(this.windowBuffer);
            const frequency = mpmResult.frequency;
            const confidence = mpmResult.confidence;

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
    detectPitchMPM(signal) {
        // 1. Compute autocorrelation function (ACF)
        this.computeACF(signal);
        
        // 2. Compute normalization term m[tau]
        this.computeNormalization(signal);
        
        // 3. Compute NSDF (Normalized Square Difference Function)
        this.computeNSDF();
        
        // 4. Find key maxima in NSDF
        const peaks = this.findPeaks();
        
        if (peaks.length === 0) {
            return { frequency: null, confidence: 0 };
        }
        
        // 5. Select best peak (highest peak above threshold)
        const bestPeak = peaks[0]; // Already sorted by height
        
        // 6. Parabolic interpolation for sub-sample accuracy
        const refinedLag = this.parabolicInterpolation(bestPeak.lag);
        
        // 7. Convert lag to frequency
        if (refinedLag > 0) {
            const frequency = this.SAMPLE_RATE / refinedLag;
            
            // Validate frequency range
            if (frequency >= this.MIN_FREQUENCY && frequency <= this.MAX_FREQUENCY) {
                return {
                    frequency: frequency,
                    confidence: bestPeak.height // MPM peak clarity metric
                };
            }
        }
        
        return { frequency: null, confidence: 0 };
    }
    
    /**
     * Compute Autocorrelation Function (ACF)
     * ACF[tau] = sum(signal[i] * signal[i + tau]) for i = 0 to N-tau-1
     */
    computeACF(signal) {
        const N = signal.length;
        
        for (let tau = 0; tau < N; tau++) {
            let sum = 0;
            for (let i = 0; i < N - tau; i++) {
                sum += signal[i] * signal[i + tau];
            }
            this.acf[tau] = sum;
        }
    }
    
    /**
     * Compute normalization term m[tau]
     * m[tau] = sum(signal[i]^2) for i=0 to N-tau-1  +  sum(signal[i]^2) for i=tau to N-1
     */
    computeNormalization(signal) {
        const N = signal.length;
        
        // Pre-compute cumulative sum of squared signal
        const cumSum = new Float32Array(N + 1);
        cumSum[0] = 0;
        for (let i = 0; i < N; i++) {
            cumSum[i + 1] = cumSum[i] + signal[i] * signal[i];
        }
        
        // Compute m[tau] = sum(x[0..N-tau-1]^2) + sum(x[tau..N-1]^2)
        for (let tau = 0; tau < N; tau++) {
            const leftSum = cumSum[N - tau];        // sum(x[0..N-tau-1]^2)
            const rightSum = cumSum[N] - cumSum[tau]; // sum(x[tau..N-1]^2)
            this.m[tau] = leftSum + rightSum;
        }
    }
    
    /**
     * Compute NSDF (Normalized Square Difference Function)
     * NSDF[tau] = 2 * ACF[tau] / m[tau]
     */
    computeNSDF() {
        const N = this.WINDOW_SIZE;
        
        for (let tau = 0; tau < N; tau++) {
            if (this.m[tau] === 0) {
                this.nsdf[tau] = 0;
            } else {
                this.nsdf[tau] = 2 * this.acf[tau] / this.m[tau];
            }
        }
    }
    
    /**
     * Find key maxima (peaks) in NSDF
     * Returns peaks sorted by height (descending)
     */
    findPeaks() {
        const minLag = Math.floor(this.SAMPLE_RATE / this.MAX_FREQUENCY);
        const maxLag = Math.floor(this.SAMPLE_RATE / this.MIN_FREQUENCY);
        const MPM_CUTOFF = 0.80; // Lowered for real guitar (0.93 too strict for low strings)
        
        const peaks = [];
        
        // Find zero crossings (positive -> negative)
        let pos = minLag;
        
        while (pos < maxLag && pos < this.WINDOW_SIZE - 1) {
            // Find next positive zero crossing
            while (pos < maxLag && this.nsdf[pos] <= 0) {
                pos++;
            }
            
            if (pos >= maxLag || pos >= this.WINDOW_SIZE - 1) {
                break;
            }
            
            // Find peak in this positive region
            let peakPos = pos;
            let peakValue = this.nsdf[pos];
            
            while (pos < maxLag && pos < this.WINDOW_SIZE - 1 && this.nsdf[pos] > 0) {
                if (this.nsdf[pos] > peakValue) {
                    peakValue = this.nsdf[pos];
                    peakPos = pos;
                }
                pos++;
            }
            
            // Only keep peaks above cutoff threshold
            if (peakValue >= MPM_CUTOFF) {
                peaks.push({
                    lag: peakPos,
                    height: peakValue
                });
            }
        }
        
        // Sort peaks by height (descending)
        peaks.sort((a, b) => b.height - a.height);
        
        return peaks;
    }
    
    /**
     * Parabolic interpolation for sub-sample accuracy
     * Fits parabola through 3 points: (x-1, y-1), (x, y), (x+1, y+1)
     * Returns refined peak position
     */
    parabolicInterpolation(x) {
        if (x <= 0 || x >= this.WINDOW_SIZE - 1) {
            return x; // Can't interpolate at boundaries
        }
        
        const y_minus = this.nsdf[x - 1];
        const y_mid = this.nsdf[x];
        const y_plus = this.nsdf[x + 1];
        
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
