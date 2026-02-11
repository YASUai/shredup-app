/**
 * SHRED UP - Low Frequency Specialist Mode
 * Post-processing layer for frequencies < 70 Hz
 * 
 * Purpose: Correct harmonic dominance instability for A1 (55 Hz) detection
 * Baseline: YIN 2048 samples @ 48 kHz
 * 
 * Architecture:
 * 1. Activation: frequency < 70 Hz only
 * 2. Structural analysis: Compare CMND at lag, lag×2, lag×3, lag×4
 * 3. Harmonic correction: Detect and correct to fundamental
 * 4. Temporal smoothing: 5-frame median filter
 * 
 * Performance: < 0.5 ms overhead
 * Impact: Zero impact on frequencies ≥ 70 Hz (6-string baseline)
 */

class LowFrequencySpecialist {
    constructor() {
        this.SAMPLE_RATE = 48000;
        this.MIN_FREQUENCY = 50;
        this.MAX_FREQUENCY = 1200;
        this.ACTIVATION_THRESHOLD = 70; // Hz
        
        // Temporal smoothing buffer (5 frames for median filter)
        this.historyBuffer = [];
        this.HISTORY_SIZE = 5;
        
        this.isInitialized = false;
        
        console.log('[LOW-FREQ-SPECIALIST] Initializing...');
        console.log('[LOW-FREQ-SPECIALIST] Activation threshold: < 70 Hz');
        console.log('[LOW-FREQ-SPECIALIST] Harmonic analysis: lag, lag×2, lag×3, lag×4');
        console.log('[LOW-FREQ-SPECIALIST] Temporal smoothing: 5-frame median');
    }
    
    init() {
        this.historyBuffer = [];
        this.isInitialized = true;
        console.log('[LOW-FREQ-SPECIALIST] ✅ Initialized');
        return true;
    }
    
    /**
     * Process YIN result for low frequency correction
     * @param {number} frequency - Detected frequency (Hz)
     * @param {number} confidence - Detection confidence (0-1)
     * @param {Float32Array} cmndf - CMND function from YIN
     * @returns {Object} { frequency, confidence, corrected }
     */
    process(frequency, confidence, cmndf) {
        if (!this.isInitialized) {
            return { frequency, confidence, corrected: false };
        }
        
        // Only process frequencies < 70 Hz
        if (!frequency || frequency >= this.ACTIVATION_THRESHOLD) {
            return { frequency, confidence, corrected: false };
        }
        
        const startTime = performance.now();
        
        // Step 1: Structural harmonic analysis
        const harmonicAnalysis = this.analyzeHarmonicStructure(frequency, cmndf);
        
        let correctedFreq = frequency;
        let correctedConf = confidence;
        let wasCorrected = false;
        
        // Step 2: Apply correction if harmonic detected
        if (harmonicAnalysis.isHarmonic && harmonicAnalysis.fundamentalFreq) {
            correctedFreq = harmonicAnalysis.fundamentalFreq;
            correctedConf = harmonicAnalysis.fundamentalConf;
            wasCorrected = true;
            
            console.log(`[LOW-FREQ] Harmonic detected: ${frequency.toFixed(1)} Hz → ${correctedFreq.toFixed(1)} Hz (${harmonicAnalysis.harmonicOrder}× harmonic)`);
        }
        
        // Step 3: Temporal smoothing (5-frame median)
        const smoothedFreq = this.applyMedianSmoothing(correctedFreq);
        
        const processingTime = performance.now() - startTime;
        
        if (wasCorrected || Math.abs(smoothedFreq - correctedFreq) > 0.1) {
            console.log(`[LOW-FREQ] Correction applied: ${frequency.toFixed(1)} Hz → ${smoothedFreq.toFixed(1)} Hz | Proc: ${processingTime.toFixed(2)}ms`);
        }
        
        return {
            frequency: smoothedFreq,
            confidence: correctedConf,
            corrected: wasCorrected,
            processingTime: processingTime
        };
    }
    
    /**
     * Analyze CMND structure to detect harmonic dominance
     * Compare CMND values at lag, lag×2, lag×3, lag×4
     * 
     * @param {number} frequency - Current detected frequency
     * @param {Float32Array} cmndf - CMND function
     * @returns {Object} { isHarmonic, fundamentalFreq, fundamentalConf, harmonicOrder }
     */
    analyzeHarmonicStructure(frequency, cmndf) {
        if (!cmndf || cmndf.length === 0) {
            return { isHarmonic: false };
        }
        
        const lag_f = Math.round(this.SAMPLE_RATE / frequency);
        const minLag = Math.round(this.SAMPLE_RATE / this.MAX_FREQUENCY);
        const maxLag = Math.round(this.SAMPLE_RATE / this.MIN_FREQUENCY);
        
        // Check if current lag is valid
        if (lag_f < minLag || lag_f >= maxLag || lag_f >= cmndf.length) {
            return { isHarmonic: false };
        }
        
        const cmnd_f = cmndf[lag_f];
        
        // Test for 2×, 3×, 4× harmonics (subharmonics at lag×2, lag×3, lag×4)
        const harmonics = [
            { order: 2, lag: lag_f * 2, freq: frequency / 2 },
            { order: 3, lag: lag_f * 3, freq: frequency / 3 },
            { order: 4, lag: lag_f * 4, freq: frequency / 4 }
        ];
        
        let bestSubharmonic = null;
        let bestRatio = Infinity;
        
        for (const harmonic of harmonics) {
            const lag_sub = Math.round(harmonic.lag);
            
            // Check if subharmonic lag is valid
            if (lag_sub < minLag || lag_sub >= maxLag || lag_sub >= cmndf.length) {
                continue;
            }
            
            const cmnd_sub = cmndf[lag_sub];
            
            // Compare CMND values: if subharmonic has better (lower) CMND, it's likely the fundamental
            // Threshold: cmnd_sub < cmnd_f * 0.85 (subharmonic must be clearly better)
            const ratio = cmnd_sub / cmnd_f;
            
            if (ratio < 0.85 && ratio < bestRatio) {
                bestRatio = ratio;
                bestSubharmonic = {
                    freq: harmonic.freq,
                    conf: Math.max(0, 1 - cmnd_sub),
                    order: harmonic.order,
                    ratio: ratio
                };
            }
        }
        
        // If a clear subharmonic is found, correct to it
        if (bestSubharmonic && bestSubharmonic.freq >= this.MIN_FREQUENCY) {
            return {
                isHarmonic: true,
                fundamentalFreq: bestSubharmonic.freq,
                fundamentalConf: bestSubharmonic.conf,
                harmonicOrder: bestSubharmonic.order,
                cmndRatio: bestSubharmonic.ratio
            };
        }
        
        return { isHarmonic: false };
    }
    
    /**
     * Apply 5-frame median smoothing for temporal stability
     * @param {number} frequency - Current frequency
     * @returns {number} Smoothed frequency
     */
    applyMedianSmoothing(frequency) {
        if (!frequency) {
            return frequency;
        }
        
        // Add to history
        this.historyBuffer.push(frequency);
        
        // Keep only last 5 frames
        if (this.historyBuffer.length > this.HISTORY_SIZE) {
            this.historyBuffer.shift();
        }
        
        // Need at least 3 frames for meaningful median
        if (this.historyBuffer.length < 3) {
            return frequency;
        }
        
        // Compute median
        const sorted = [...this.historyBuffer].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        
        const median = sorted.length % 2 === 0
            ? (sorted[mid - 1] + sorted[mid]) / 2
            : sorted[mid];
        
        return median;
    }
    
    /**
     * Reset temporal smoothing buffer
     */
    reset() {
        this.historyBuffer = [];
        console.log('[LOW-FREQ-SPECIALIST] Buffer reset');
    }
    
    /**
     * Get module status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            activationThreshold: this.ACTIVATION_THRESHOLD,
            historySize: this.historyBuffer.length,
            maxHistory: this.HISTORY_SIZE
        };
    }
    
    /**
     * Shutdown and cleanup
     */
    shutdown() {
        this.historyBuffer = [];
        this.isInitialized = false;
        console.log('[LOW-FREQ-SPECIALIST] Shutdown complete');
    }
}

// Export for both browser and Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LowFrequencySpecialist;
}
