/**
 * SHRED UP - Low Frequency Enhancer
 * Phase 3 - Low Frequency Specialist Mode (A1 Fix)
 * 
 * ARCHITECTURE: Post-detection correction layer
 * - Applied ONLY when detected frequency < 70 Hz
 * - Uses structural harmonic validation (CMND curve inspection)
 * - Applies local median smoothing (5-frame buffer)
 * - Zero impact on frequencies ≥ 70 Hz
 * 
 * CRITICAL: This module does NOT modify YIN core algorithm
 * CRITICAL: This module does NOT modify global window size
 * CRITICAL: This module is a pure post-processing layer
 * 
 * Baseline Protected: pitch-yin-stable-v1
 */

class LowFrequencyEnhancer {
    constructor(sampleRate = 48000) {
        this.SAMPLE_RATE = sampleRate;
        this.ACTIVATION_THRESHOLD = 70;  // Hz - activate below this frequency
        this.MIN_FREQUENCY = 40;          // Hz - reject candidates below this
        this.CMND_AMPLITUDE_THRESHOLD = 0.20;  // 20% amplitude difference threshold
        
        // Local median smoothing buffer (5 frames for < 70 Hz only)
        this.lowFreqBuffer = [];
        this.BUFFER_SIZE = 5;
        
        // Statistics
        this.correctionCount = 0;
        this.totalCorrections = 0;
        
        this.isInitialized = false;
    }
    
    /**
     * Initialize the enhancer
     */
    init() {
        console.log('[LOW-FREQ-ENHANCER] Initializing low frequency enhancer...');
        console.log('[LOW-FREQ-ENHANCER] Activation threshold:', this.ACTIVATION_THRESHOLD, 'Hz');
        console.log('[LOW-FREQ-ENHANCER] CMND amplitude threshold:', this.CMND_AMPLITUDE_THRESHOLD);
        console.log('[LOW-FREQ-ENHANCER] Median buffer size:', this.BUFFER_SIZE);
        
        this.isInitialized = true;
        return true;
    }
    
    /**
     * Main entry point: enhance low frequency detection
     * 
     * @param {number} detectedFreq - Frequency detected by YIN
     * @param {number} confidence - YIN confidence
     * @param {Float32Array} cmndf - YIN's cumulative mean normalized difference function
     * @returns {Object} - { frequency, wasEnhanced, method }
     */
    enhance(detectedFreq, confidence, cmndf) {
        if (!this.isInitialized) {
            return { frequency: detectedFreq, wasEnhanced: false, method: null };
        }
        
        // Only activate for frequencies < 70 Hz
        if (detectedFreq >= this.ACTIVATION_THRESHOLD) {
            return { frequency: detectedFreq, wasEnhanced: false, method: null };
        }
        
        // Step 1: Structural harmonic validation
        const correctedFreq = this.applyStructuralValidation(detectedFreq, cmndf);
        
        // Step 2: Local median smoothing
        const smoothedFreq = this.applyMedianSmoothing(correctedFreq);
        
        // Determine if enhancement occurred
        const wasEnhanced = Math.abs(smoothedFreq - detectedFreq) > 0.5;
        
        if (wasEnhanced) {
            this.correctionCount++;
            this.totalCorrections++;
            console.log(`[LOW-FREQ] Correction applied | ${detectedFreq.toFixed(2)} Hz → ${smoothedFreq.toFixed(2)} Hz`);
        }
        
        return {
            frequency: smoothedFreq,
            wasEnhanced: wasEnhanced,
            method: wasEnhanced ? 'structural-validation+median' : null
        };
    }
    
    /**
     * Structural harmonic validation using CMND curve inspection
     * 
     * Instead of simple f/2 division, we inspect YIN's CMND curve
     * to determine if a subharmonic (f/2 or f/3) is structurally more stable
     * 
     * @param {number} detectedFreq - Detected frequency
     * @param {Float32Array} cmndf - YIN's CMND buffer
     * @returns {number} - Corrected frequency
     */
    applyStructuralValidation(detectedFreq, cmndf) {
        // Generate subharmonic candidates
        const f = detectedFreq;
        const f2 = f / 2;
        const f3 = f / 3;
        
        // Reject candidates below minimum frequency
        const candidates = [f, f2, f3].filter(freq => freq >= this.MIN_FREQUENCY);
        
        if (candidates.length === 1) {
            return f;  // No valid subharmonics
        }
        
        // Convert frequencies to lag values (τ = sample_rate / frequency)
        const lags = candidates.map(freq => Math.round(this.SAMPLE_RATE / freq));
        
        // Inspect CMND at each lag
        const cmndValues = lags.map(lag => {
            if (lag < 0 || lag >= cmndf.length) {
                return 1.0;  // Invalid lag → worst score
            }
            return cmndf[lag];
        });
        
        // Find the candidate with the lowest CMND (deepest minimum = most stable)
        let bestIdx = 0;
        let bestCmnd = cmndValues[0];
        
        for (let i = 1; i < cmndValues.length; i++) {
            // Prefer subharmonic only if its CMND is significantly better
            if (cmndValues[i] < bestCmnd * (1 - this.CMND_AMPLITUDE_THRESHOLD)) {
                bestIdx = i;
                bestCmnd = cmndValues[i];
            }
        }
        
        return candidates[bestIdx];
    }
    
    /**
     * Apply local median smoothing (5-frame buffer)
     * Applied ONLY for frequencies < 70 Hz
     * 
     * @param {number} freq - Frequency to smooth
     * @returns {number} - Smoothed frequency
     */
    applyMedianSmoothing(freq) {
        // Add to buffer
        this.lowFreqBuffer.push(freq);
        
        // Maintain buffer size
        if (this.lowFreqBuffer.length > this.BUFFER_SIZE) {
            this.lowFreqBuffer.shift();
        }
        
        // Return median if buffer has enough samples
        if (this.lowFreqBuffer.length >= 3) {
            return this.median(this.lowFreqBuffer);
        }
        
        return freq;  // Not enough data yet
    }
    
    /**
     * Calculate median of an array
     * 
     * @param {Array<number>} arr - Array of numbers
     * @returns {number} - Median value
     */
    median(arr) {
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        
        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        }
        
        return sorted[mid];
    }
    
    /**
     * Get statistics
     */
    getStats() {
        return {
            correctionCount: this.correctionCount,
            totalCorrections: this.totalCorrections,
            bufferSize: this.lowFreqBuffer.length
        };
    }
    
    /**
     * Reset buffer (called when pitch detection stops)
     */
    reset() {
        this.lowFreqBuffer = [];
        this.correctionCount = 0;
    }
    
    /**
     * Shutdown
     */
    shutdown() {
        this.reset();
        this.isInitialized = false;
    }
}

// Create singleton instance
const lowFrequencyEnhancer = new LowFrequencyEnhancer();

// Export for use in pitch-detection.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = lowFrequencyEnhancer;
}
