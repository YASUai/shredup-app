/**
 * SHRED UP - Spectral Analyzer (Lightweight FFT Pre-Analysis)
 * Phase 3 - Dual-Pass YIN Architecture
 * 
 * PURPOSE: Detect low-frequency energy (40-80 Hz) to trigger extended window
 * 
 * ARCHITECTURE:
 * - Lightweight FFT (64 bins) for energy detection
 * - Threshold-based decision: 2048 vs 4096 window
 * - Zero impact on 6-string baseline
 * 
 * USE CASE:
 * - 7-string A1 (55 Hz) requires 4096 window
 * - 6-string E2-E4 (82-330 Hz) uses 2048 window
 * - Pre-analysis decides which path to take
 */

class SpectralAnalyzer {
    constructor(sampleRate = 48000) {
        this.SAMPLE_RATE = sampleRate;
        this.FFT_SIZE = 64;  // Lightweight FFT for energy detection only
        
        // Target frequency range for A1 detection
        this.LOW_FREQ_MIN = 40;   // Hz - below A1 (55 Hz)
        this.LOW_FREQ_MAX = 80;   // Hz - above A1, below E2 (82 Hz)
        
        // Energy threshold (relative to total energy)
        this.ENERGY_THRESHOLD = 0.15;  // 15% of total energy in low band
        
        // Pre-allocated buffers
        this.fftBuffer = new Float32Array(this.FFT_SIZE);
        this.spectrum = new Float32Array(this.FFT_SIZE / 2);
        
        this.isInitialized = false;
    }
    
    /**
     * Initialize spectral analyzer
     */
    init() {
        console.log('[SPECTRAL-ANALYZER] Initializing...');
        console.log('[SPECTRAL-ANALYZER] FFT size:', this.FFT_SIZE);
        console.log('[SPECTRAL-ANALYZER] Target range:', this.LOW_FREQ_MIN, '-', this.LOW_FREQ_MAX, 'Hz');
        console.log('[SPECTRAL-ANALYZER] Energy threshold:', (this.ENERGY_THRESHOLD * 100).toFixed(1), '%');
        
        this.isInitialized = true;
        return true;
    }
    
    /**
     * Analyze signal energy in low frequency band
     * 
     * @param {Float32Array} signal - Audio signal (2048 samples)
     * @returns {Object} - { needsExtendedWindow: boolean, lowFreqEnergy: number, totalEnergy: number }
     */
    analyze(signal) {
        if (!this.isInitialized) {
            return { needsExtendedWindow: false, lowFreqEnergy: 0, totalEnergy: 0 };
        }
        
        // Downsample signal to FFT_SIZE (64 samples)
        // Simple decimation: take every Nth sample
        const decimationFactor = Math.floor(signal.length / this.FFT_SIZE);
        
        for (let i = 0; i < this.FFT_SIZE; i++) {
            this.fftBuffer[i] = signal[i * decimationFactor];
        }
        
        // Compute power spectrum (magnitude squared)
        this.computeSpectrum();
        
        // Calculate energy in low frequency band (40-80 Hz)
        const binResolution = this.SAMPLE_RATE / this.FFT_SIZE;  // Hz per bin
        const lowFreqBinStart = Math.floor(this.LOW_FREQ_MIN / binResolution);
        const lowFreqBinEnd = Math.ceil(this.LOW_FREQ_MAX / binResolution);
        
        let lowFreqEnergy = 0;
        let totalEnergy = 0;
        
        for (let i = 0; i < this.spectrum.length; i++) {
            const energy = this.spectrum[i];
            totalEnergy += energy;
            
            if (i >= lowFreqBinStart && i <= lowFreqBinEnd) {
                lowFreqEnergy += energy;
            }
        }
        
        // Compute energy ratio
        const energyRatio = totalEnergy > 0 ? lowFreqEnergy / totalEnergy : 0;
        
        // Decision: need extended window if low freq energy is significant
        const needsExtendedWindow = energyRatio > this.ENERGY_THRESHOLD;
        
        return {
            needsExtendedWindow: needsExtendedWindow,
            lowFreqEnergy: lowFreqEnergy,
            totalEnergy: totalEnergy,
            energyRatio: energyRatio
        };
    }
    
    /**
     * Compute power spectrum using simple DFT (for 64 bins, fast enough)
     * 
     * Note: We use simple DFT instead of full FFT because:
     * - FFT_SIZE = 64 (very small)
     * - DFT complexity: O(N²) = 64² = 4096 operations (~0.1 ms)
     * - No need for FFT library overhead
     */
    computeSpectrum() {
        const N = this.FFT_SIZE;
        const halfN = N / 2;
        
        // Compute DFT for positive frequencies only
        for (let k = 0; k < halfN; k++) {
            let realSum = 0;
            let imagSum = 0;
            
            for (let n = 0; n < N; n++) {
                const angle = -2 * Math.PI * k * n / N;
                realSum += this.fftBuffer[n] * Math.cos(angle);
                imagSum += this.fftBuffer[n] * Math.sin(angle);
            }
            
            // Power = |X[k]|² = real² + imag²
            this.spectrum[k] = realSum * realSum + imagSum * imagSum;
        }
    }
    
    /**
     * Get status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            fftSize: this.FFT_SIZE,
            targetRange: [this.LOW_FREQ_MIN, this.LOW_FREQ_MAX],
            energyThreshold: this.ENERGY_THRESHOLD
        };
    }
    
    /**
     * Shutdown
     */
    shutdown() {
        this.isInitialized = false;
    }
}

// Create singleton instance
const spectralAnalyzer = new SpectralAnalyzer();

// Export for use in pitch-detection.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = spectralAnalyzer;
}
