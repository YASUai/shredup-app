/**
 * PHASE 5A.3 – AUDIO THREAD VALIDATION (CORRECTED)
 * 
 * AudioWorklet Processor to capture REAL click onset timing
 * Measures ONLY the frames where clicks actually start
 * NOT continuous buffer processing
 */

class TimingValidationProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // Storage for click onset measurements
    this.onsetMeasurements = [];
    this.isCapturing = false;
    this.expectedFrameDelta = 0;
    this.sampleRate = 0;
    this.scheduledFrames = []; // Expected click frames
    this.nextScheduledIndex = 0;
    
    // Onset detection parameters
    this.threshold = 0.01; // Amplitude threshold for click detection
    this.lastSample = 0;
    this.onsetCooldown = 0; // Prevent multiple detections for same click
    this.cooldownFrames = 2205; // ~50ms @ 44.1kHz
    
    // Listen for messages from main thread
    this.port.onmessage = (event) => {
      const { type, data } = event.data;
      
      if (type === 'start') {
        // Start capturing click onsets
        this.isCapturing = true;
        this.expectedFrameDelta = data.expectedFrameDelta;
        this.sampleRate = data.sampleRate;
        this.scheduledFrames = data.scheduledFrames; // Array of expected frames
        this.onsetMeasurements = [];
        this.nextScheduledIndex = 0;
        this.onsetCooldown = 0;
        
        console.log('[AUDIO THREAD] Started onset capture');
        console.log('[AUDIO THREAD] Expecting', this.scheduledFrames.length, 'clicks');
        console.log('[AUDIO THREAD] Expected delta:', this.expectedFrameDelta, 'frames');
      } else if (type === 'stop') {
        // Stop capturing and send results
        this.isCapturing = false;
        
        this.port.postMessage({
          type: 'results',
          measurements: this.onsetMeasurements,
          sampleRate: this.sampleRate,
          expectedCount: this.scheduledFrames.length,
          actualCount: this.onsetMeasurements.length
        });
        
        console.log('[AUDIO THREAD] Stopped capture');
        console.log('[AUDIO THREAD] Expected clicks:', this.scheduledFrames.length);
        console.log('[AUDIO THREAD] Detected clicks:', this.onsetMeasurements.length);
      }
    };
  }
  
  process(inputs, outputs, parameters) {
    if (!this.isCapturing || this.nextScheduledIndex >= this.scheduledFrames.length) {
      return true;
    }
    
    const input = inputs[0];
    if (!input || !input[0]) {
      return true;
    }
    
    const samples = input[0]; // First channel
    const currentFrame = currentFrame; // Global frame counter
    
    // Decrement cooldown
    if (this.onsetCooldown > 0) {
      this.onsetCooldown -= samples.length;
    }
    
    // Scan samples for onset (amplitude spike)
    for (let i = 0; i < samples.length; i++) {
      const sample = samples[i];
      const frameSample = currentFrame + i;
      
      // Detect onset: sharp increase in amplitude
      const delta = Math.abs(sample - this.lastSample);
      
      if (delta > this.threshold && this.onsetCooldown <= 0) {
        // Onset detected!
        const scheduledFrame = this.scheduledFrames[this.nextScheduledIndex];
        const actualFrame = frameSample;
        const error = actualFrame - scheduledFrame;
        const errorMs = (error / this.sampleRate) * 1000.0;
        
        this.onsetMeasurements.push({
          clickIndex: this.nextScheduledIndex,
          scheduledFrame: scheduledFrame,
          actualFrame: actualFrame,
          error: error,
          errorMs: errorMs
        });
        
        this.nextScheduledIndex++;
        this.onsetCooldown = this.cooldownFrames;
        
        // Stop if all clicks detected
        if (this.nextScheduledIndex >= this.scheduledFrames.length) {
          break;
        }
      }
      
      this.lastSample = sample;
    }
    
    // Keep processor alive
    return true;
  }
}

registerProcessor('timing-validation-processor', TimingValidationProcessor);
