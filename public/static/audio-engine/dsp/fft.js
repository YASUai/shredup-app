/**
 * SHRED UP - Minimal FFT Implementation
 * 
 * License: MIT
 * Based on: https://github.com/indutny/fft.js
 * Author: Fedor Indutny
 * 
 * Minimal radix-2 FFT for real-time pitch detection
 * Size: ~3KB minified
 * 
 * Supports power-of-2 sizes only (2048 for guitar pitch detection)
 */

class FFT {
    constructor(size) {
        this.size = size;
        this._csize = size << 1;

        // Tables
        this.table = new Float32Array(this.size * 2);
        
        // Compute twiddle factors
        for (let i = 0; i < this.size; i++) {
            const angle = Math.PI * 2 * i / this.size;
            this.table[i * 2] = Math.cos(angle);
            this.table[i * 2 + 1] = -Math.sin(angle);
        }

        // Reverse table
        this._reverseTable = new Uint32Array(this.size);
        
        let shift = 0;
        let tmp = size;
        while (tmp > 1) {
            shift++;
            tmp >>= 1;
        }
        
        for (let i = 0; i < this.size; i++) {
            this._reverseTable[i] = this._reverse(i, shift);
        }
    }

    _reverse(x, n) {
        let r = 0;
        for (let i = 0; i < n; i++) {
            r <<= 1;
            r |= x & 1;
            x >>= 1;
        }
        return r;
    }

    /**
     * Transform real signal
     * @param {Float32Array} input - Real input signal
     * @param {Float32Array} output - Complex output (size * 2)
     */
    realTransform(input, output) {
        // Copy input to output with bit reversal
        for (let i = 0; i < this.size; i++) {
            const r = this._reverseTable[i];
            output[r * 2] = input[i];
            output[r * 2 + 1] = 0;
        }

        // Radix-2 FFT
        for (let s = 1; s <= Math.log2(this.size); s++) {
            const m = 1 << s;
            const m2 = m >> 1;
            
            for (let k = 0; k < this.size; k += m) {
                for (let j = 0; j < m2; j++) {
                    const idx = k + j;
                    const idx2 = idx + m2;
                    
                    const tIdx = (j * this.size / m) * 2;
                    const wr = this.table[tIdx];
                    const wi = this.table[tIdx + 1];
                    
                    const tr = output[idx2 * 2] * wr - output[idx2 * 2 + 1] * wi;
                    const ti = output[idx2 * 2] * wi + output[idx2 * 2 + 1] * wr;
                    
                    const ar = output[idx * 2];
                    const ai = output[idx * 2 + 1];
                    
                    output[idx * 2] = ar + tr;
                    output[idx * 2 + 1] = ai + ti;
                    output[idx2 * 2] = ar - tr;
                    output[idx2 * 2 + 1] = ai - ti;
                }
            }
        }
    }

    /**
     * Inverse transform (IFFT)
     * @param {Float32Array} input - Complex input (size * 2)
     * @param {Float32Array} output - Complex output (size * 2)
     */
    inverseTransform(input, output) {
        // Conjugate input
        for (let i = 0; i < this.size; i++) {
            output[i * 2] = input[i * 2];
            output[i * 2 + 1] = -input[i * 2 + 1];
        }

        // Forward FFT
        this.realTransform(output, output);

        // Conjugate output and normalize
        for (let i = 0; i < this.size; i++) {
            output[i * 2] /= this.size;
            output[i * 2 + 1] = -output[i * 2 + 1] / this.size;
        }
    }
}

// Singleton instance for 2048-point FFT
const fft2048 = new FFT(2048);

// Export
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FFT, fft2048 };
}
