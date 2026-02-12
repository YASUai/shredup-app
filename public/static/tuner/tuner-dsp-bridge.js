/**
 * SHRED UP - Tuner DSP Bridge
 * 
 * Connects Phase 3 Pitch Detection to Tuner UI
 * Converts raw frequency → Note name + Cents offset
 * 
 * 7-String Guitar (A1-D4): A1, D2, G2, C3, F3, A3, D4
 */

class TunerDSPBridge {
    constructor() {
        this.isInitialized = false;
        this.isRunning = false;
        
        // 7-string guitar tuning (A1→D4)
        this.REFERENCE_NOTES = [
            { name: 'A1', freq: 55.00, string: 1 },
            { name: 'D2', freq: 73.42, string: 2 },
            { name: 'G2', freq: 98.00, string: 3 },
            { name: 'C3', freq: 130.81, string: 4 },
            { name: 'F3', freq: 174.61, string: 5 },
            { name: 'A3', freq: 220.00, string: 6 },
            { name: 'D4', freq: 293.66, string: 7 }
        ];
        
        // Last detection result
        this.lastDetection = {
            frequency: null,
            note: null,
            cents: null,
            string: null,
            confidence: null,
            timestamp: null
        };
        
        // Audio engine reference (will be set after init)
        this.audioEngine = null;
        
        // Pitch consumer interval
        this.pitchConsumerInterval = null;
    }
    
    /**
     * Initialize DSP bridge and audio engine
     */
    async init() {
        try {
            console.log('[TUNER-DSP] Initializing audio engine...');
            
            // Check if audio engine is available
            if (typeof AudioEngine === 'undefined') {
                throw new Error('AudioEngine not loaded');
            }
            
            // Create and initialize audio engine
            this.audioEngine = new AudioEngine();
            const initSuccess = await this.audioEngine.init();
            
            if (!initSuccess) {
                throw new Error('Audio engine initialization failed');
            }
            
            this.isInitialized = true;
            console.log('[TUNER-DSP] ✓ Initialized');
            
            return true;
        } catch (error) {
            console.error('[TUNER-DSP] Initialization failed:', error);
            this.isInitialized = false;
            return false;
        }
    }
    
    /**
     * Start audio capture and pitch detection
     */
    async start() {
        if (!this.isInitialized) {
            console.error('[TUNER-DSP] Not initialized');
            return false;
        }
        
        if (this.isRunning) {
            console.warn('[TUNER-DSP] Already running');
            return false;
        }
        
        try {
            console.log('[TUNER-DSP] Starting audio capture...');
            
            // Start audio engine
            const startSuccess = await this.audioEngine.start();
            if (!startSuccess) {
                throw new Error('Audio engine start failed');
            }
            
            // Start pitch consumer (reads from pitchDetection)
            this.startPitchConsumer();
            
            this.isRunning = true;
            console.log('[TUNER-DSP] ✓ Running');
            
            return true;
        } catch (error) {
            console.error('[TUNER-DSP] Start failed:', error);
            this.isRunning = false;
            return false;
        }
    }
    
    /**
     * Stop audio capture and pitch detection
     */
    async stop() {
        if (!this.isRunning) {
            return;
        }
        
        console.log('[TUNER-DSP] Stopping...');
        
        // Stop pitch consumer
        if (this.pitchConsumerInterval) {
            clearInterval(this.pitchConsumerInterval);
            this.pitchConsumerInterval = null;
        }
        
        // Stop audio engine
        if (this.audioEngine) {
            await this.audioEngine.stop();
        }
        
        this.isRunning = false;
        
        // Reset last detection
        this.lastDetection = {
            frequency: null,
            note: null,
            cents: null,
            string: null,
            confidence: null,
            timestamp: null
        };
        
        console.log('[TUNER-DSP] ✓ Stopped');
    }
    
    /**
     * Start pitch consumer loop
     * Reads pitch detection results and converts to musical data
     * TUNER MODE: Reads raw detections (bypasses validation state machine)
     */
    startPitchConsumer() {
        this.pitchConsumerInterval = setInterval(() => {
            // TUNER MODE: Read raw detections from global variable
            // This bypasses the validation state machine for instant response
            if (typeof window !== 'undefined' && window._pitchDetectionRaw) {
                const raw = window._pitchDetectionRaw;
                
                if (raw.hasDetection && raw.frequency) {
                    // Convert frequency to musical data
                    const musical = this.frequencyToMusical(raw.frequency);
                    
                    // Update even with low confidence (tuner needs continuous feedback)
                    if (musical.note) {
                        this.lastDetection = {
                            frequency: raw.frequency,
                            note: musical.note,
                            cents: musical.cents,
                            string: musical.string,
                            confidence: raw.confidence,
                            timestamp: performance.now()
                        };
                        
                        // Debug log occasionally
                        if (Math.random() < 0.025) { // ~every 1s
                            console.log(`[TUNER-DSP] ${musical.note} | ${raw.frequency.toFixed(2)} Hz | ${musical.cents >= 0 ? '+' : ''}${musical.cents} cents | Conf: ${raw.confidence.toFixed(2)}`);
                        }
                    }
                } else {
                    // Clear detection if no valid signal
                    // Keep last detection for max 150ms to avoid flicker
                    if (this.lastDetection.timestamp && 
                        (performance.now() - this.lastDetection.timestamp) > 150) {
                        this.lastDetection = {
                            frequency: null,
                            note: null,
                            cents: null,
                            string: null,
                            confidence: null,
                            timestamp: null
                        };
                    }
                }
            }
        }, 20); // 50 Hz update rate
    }
    
    /**
     * Convert frequency (Hz) to musical data (note, cents, string)
     * @param {number} frequency - Detected frequency in Hz
     * @returns {object} { note, cents, string, closestFreq }
     */
    frequencyToMusical(frequency) {
        if (!frequency || frequency < 50 || frequency > 350) {
            return { note: null, cents: null, string: null, closestFreq: null };
        }
        
        // Find closest reference note
        let closestNote = null;
        let minDiff = Infinity;
        
        for (const ref of this.REFERENCE_NOTES) {
            const diff = Math.abs(frequency - ref.freq);
            if (diff < minDiff) {
                minDiff = diff;
                closestNote = ref;
            }
        }
        
        if (!closestNote) {
            return { note: null, cents: null, string: null, closestFreq: null };
        }
        
        // Calculate cents offset
        // Formula: cents = 1200 * log2(f_detected / f_reference)
        const cents = Math.round(1200 * Math.log2(frequency / closestNote.freq));
        
        // Only accept notes within ±50 cents
        if (Math.abs(cents) > 50) {
            return { note: null, cents: null, string: null, closestFreq: null };
        }
        
        return {
            note: closestNote.name,
            cents: cents,
            string: closestNote.string,
            closestFreq: closestNote.freq
        };
    }
    
    /**
     * Get last detection result
     * @returns {object} { frequency, note, cents, string, confidence, timestamp }
     */
    getLastDetection() {
        return { ...this.lastDetection };
    }
    
    /**
     * Get current cents offset
     * @returns {number|null} Cents offset (-50 to +50)
     */
    getCentOffset() {
        return this.lastDetection.cents;
    }
    
    /**
     * Get current detected note
     * @returns {string|null} Note name (e.g., "A1", "D2")
     */
    getCurrentNote() {
        return this.lastDetection.note;
    }
    
    /**
     * Get current detected frequency
     * @returns {number|null} Frequency in Hz
     */
    getCurrentFrequency() {
        return this.lastDetection.frequency;
    }
    
    /**
     * Get current string number
     * @returns {number|null} String number (1-7)
     */
    getCurrentString() {
        return this.lastDetection.string;
    }
    
    /**
     * Get detection confidence
     * @returns {number|null} Confidence (0-1)
     */
    getConfidence() {
        return this.lastDetection.confidence;
    }
    
    /**
     * Check if currently detecting a note
     * @returns {boolean}
     */
    isDetecting() {
        if (!this.lastDetection.timestamp) {
            return false;
        }
        
        // Consider detection stale after 100ms
        const age = performance.now() - this.lastDetection.timestamp;
        return age < 100 && this.lastDetection.frequency !== null;
    }
}

// Global instance
const tunerDSP = new TunerDSPBridge();
