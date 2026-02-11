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
        this.FFT_SIZE = 2048;  // Full resolution FFT for accurate 40-80 Hz detection
        
        // Target frequency range for A1 detection
        this.LOW_FREQ_MIN = 40;   // Hz - below A1 (55 Hz)
        this.LOW_FREQ_MAX = 80;   // Hz - above A1, below E2 (82 Hz)
        
        // Energy threshold (relative to total energy)
        this.ENERGY_THRESHOLD = 0.15;  // 15% of total energy in low band
        
        // Pre-allocated buffers
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
     * @returns {Object} - { needsExtendedWindow: boolean, lowFreqEnergy: number, totalEnergy: number, energyRatio: number }
     */
    analyze(signal) {
        if (!this.isInitialized) {
            return { needsExtendedWindow: false, lowFreqEnergy: 0, totalEnergy: 0, energyRatio: 0 };
        }
        
        // Compute power spectrum (full 2048-point FFT)
        this.computeSpectrum(signal);
        
        // Calculate frequency bin resolution
        const binResolution = this.SAMPLE_RATE / this.FFT_SIZE;  // 48000 / 2048 = 23.4 Hz per bin
        
        // Calculate bin indices for 40-80 Hz range
        const lowFreqBinStart = Math.floor(this.LOW_FREQ_MIN / binResolution);  // 40 / 23.4 ≈ bin 1
        const lowFreqBinEnd = Math.ceil(this.LOW_FREQ_MAX / binResolution);      // 80 / 23.4 ≈ bin 3
        
        let lowFreqEnergy = 0;
        let totalEnergy = 0;
        
        // Sum energy across all bins
        for (let i = 0; i < this.spectrum.length; i++) {
            const energy = this.spectrum[i];
            totalEnergy += energy;
            
            // Check if bin is in target range
            if (i >= lowFreqBinStart && i <= lowFreqBinEnd) {
                lowFreqEnergy += energy;
            }
        }
        
        // Compute energy ratio
        const energyRatio = totalEnergy > 0 ? lowFreqEnergy / totalEnergy : 0;
        
        // Decision: need extended window if low freq energy is significant
        const needsExtendedWindow = energyRatio > this.ENERGY_THRESHOLD;
        
        // DEBUG LOG: Always log energy analysis for A1 debugging
        console.log(`[SPECTRAL] Bins ${lowFreqBinStart}-${lowFreqBinEnd} (${this.LOW_FREQ_MIN}-${this.LOW_FREQ_MAX} Hz) | Energy: ${(energyRatio * 100).toFixed(2)}% | Threshold: ${(this.ENERGY_THRESHOLD * 100).toFixed(0)}% | Activate 4096: ${needsExtendedWindow}`);
        
        return {
            needsExtendedWindow: needsExtendedWindow,
            lowFreqEnergy: lowFreqEnergy,
            totalEnergy: totalEnergy,
            energyRatio: energyRatio
        };
    }
    
    /**
     * Compute power spectrum using DFT (2048 points)
     * 
     * Note: We use simple DFT for clarity. For production, could optimize with FFT.
     * Complexity: O(N²) = 2048² = ~4M operations
     * Expected time: ~2-3 ms (acceptable for conditional activation)
     * 
     * @param {Float32Array} signal - Input signal (2048 samples)
     */
    computeSpectrum(signal) {
        const N = this.FFT_SIZE;
        const halfN = N / 2;
        
        // Compute DFT for positive frequencies only (DC to Nyquist)
        for (let k = 0; k < halfN; k++) {
            let realSum = 0;
            let imagSum = 0;
            
            for (let n = 0; n < N; n++) {
                const angle = -2 * Math.PI * k * n / N;
                realSum += signal[n] * Math.cos(angle);
                imagSum += signal[n] * Math.sin(angle);
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
