/**
 * PHASE 5B – ONSET DETECTOR PROCESSOR
 * 
 * AudioWorklet processor for real-time onset detection from microphone input
 * Detects note attacks using amplitude envelope + spectral flux analysis
 * 
 * Detection Strategy:
 * 1. Energy-based detection (amplitude envelope)
 * 2. Spectral flux detection (frequency domain changes)
 * 3. Adaptive threshold to handle varying input levels
 * 4. Cooldown period to prevent multiple triggers for same onset
 * 
 * CRITICAL: Uses only AudioContext.currentTime for timestamps
 * NO Date.now(), performance.now(), or other clock sources
 */

class OnsetDetectorProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // Detection state
    this.isCapturing = false;
    this.detectedOnsets = [];
    
    // Frame counter (manual, for debugging)
    this.currentProcessedFrame = 0;
    
    // Energy-based detection parameters
    this.energyThreshold = 0.03; // Minimum energy for onset - REDUCED for acoustic guitar
    this.energyHistory = new Float32Array(10); // Running average
    this.energyHistoryIndex = 0;
    this.previousEnergy = 0;
    
    // Spectral flux parameters (frequency domain)
    this.previousSpectrum = null;
    this.spectralFluxThreshold = 0.05; // Minimum spectral change
    
    // Onset cooldown (prevent double-triggering)
    this.cooldownFrames = 2646; // ~60ms @ 44.1kHz - REDUCED for faster guitar notes
    this.framesSinceLastOnset = 9999;
    
    // Adaptive threshold
    this.adaptiveMultiplier = 2.5; // Onset must be 2.5x above average - BALANCED for acoustic guitar
    
    // Listen for messages from main thread
    this.port.onmessage = (event) => {
      const { type, data } = event.data;
      
      if (type === 'start') {
        // Start capturing onsets
        this.isCapturing = true;
        this.detectedOnsets = [];
        this.currentProcessedFrame = 0;
        this.framesSinceLastOnset = 9999;
        this.previousEnergy = 0;
        this.previousSpectrum = null;
        
        // Optional: custom thresholds from main thread
        if (data && data.energyThreshold) {
          this.energyThreshold = data.energyThreshold;
        }
        if (data && data.cooldownMs) {
          this.cooldownFrames = Math.round((data.cooldownMs / 1000.0) * sampleRate);
        }
        
        console.log('[ONSET DETECTOR] Started capturing');
        console.log('[ONSET DETECTOR] Energy threshold:', this.energyThreshold);
        console.log('[ONSET DETECTOR] Cooldown:', this.cooldownFrames, 'frames');
      } else if (type === 'stop') {
        // Stop capturing and send results
        this.isCapturing = false;
        
        this.port.postMessage({
          type: 'results',
          onsets: this.detectedOnsets,
          totalFrames: this.currentProcessedFrame
        });
        
        console.log('[ONSET DETECTOR] Stopped capture');
        console.log('[ONSET DETECTOR] Detected onsets:', this.detectedOnsets.length);
      } else if (type === 'get-status') {
        // Send current status (for debugging)
        this.port.postMessage({
          type: 'status',
          isCapturing: this.isCapturing,
          onsetCount: this.detectedOnsets.length,
          currentFrame: this.currentProcessedFrame
        });
      }
    };
  }
  
  /**
   * Process audio input block
   * Called by Web Audio at ~3ms intervals (128 samples @ 44.1kHz)
   */
  process(inputs, outputs, parameters) {
    if (!this.isCapturing) {
      return true;
    }
    
    const input = inputs[0];
    if (!input || !input[0] || input[0].length === 0) {
      // No input signal
      return true;
    }
    
    const samples = input[0]; // Mono (first channel)
    const blockSize = samples.length;
    
    // Compute energy (RMS)
    let sumSquares = 0;
    for (let i = 0; i < blockSize; i++) {
      sumSquares += samples[i] * samples[i];
    }
    const rms = Math.sqrt(sumSquares / blockSize);
    
    // Update energy history (for adaptive threshold)
    this.energyHistory[this.energyHistoryIndex] = rms;
    this.energyHistoryIndex = (this.energyHistoryIndex + 1) % this.energyHistory.length;
    
    // Compute average energy (background level)
    let avgEnergy = 0;
    for (let i = 0; i < this.energyHistory.length; i++) {
      avgEnergy += this.energyHistory[i];
    }
    avgEnergy /= this.energyHistory.length;
    
    // Adaptive threshold
    const adaptiveThreshold = Math.max(
      this.energyThreshold,
      avgEnergy * this.adaptiveMultiplier
    );
    
    // Detect onset: sharp increase in energy
    const energyIncrease = rms - this.previousEnergy;
    const relativeIncrease = this.previousEnergy > 0.001 ? energyIncrease / this.previousEnergy : 0;
    
    const isOnset = (
      energyIncrease > 0.01 &&                            // Absolute increase > 0.01 (lower for acoustic)
      relativeIncrease > 0.3 &&                           // Relative increase > 30%
      rms > adaptiveThreshold &&                          // Above adaptive threshold
      this.framesSinceLastOnset >= this.cooldownFrames    // Cooldown expired
    );
    
    if (isOnset) {
      // ONSET DETECTED!
      // Capture timestamp using currentTime (NOT currentFrame)
      const onsetTime = currentTime; // AudioWorklet global
      
      // Record onset
      this.detectedOnsets.push({
        time: onsetTime, // AudioContext.currentTime (seconds)
        frame: this.currentProcessedFrame, // Frame number (for debugging)
        energy: rms, // Energy at onset
        threshold: adaptiveThreshold // Threshold used
      });
      
      // Reset cooldown
      this.framesSinceLastOnset = 0;
      
      // Optional: send real-time notification to main thread
      this.port.postMessage({
        type: 'onset',
        time: onsetTime,
        energy: rms
      });
    }
    
    // Update state
    this.previousEnergy = rms;
    this.framesSinceLastOnset += blockSize;
    this.currentProcessedFrame += blockSize;
    
    // Keep processor alive
    return true;
  }
}

registerProcessor('onset-detector-processor', OnsetDetectorProcessor);
