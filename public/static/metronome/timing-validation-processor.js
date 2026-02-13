/**
 * PHASE 5A.3 – AUDIO THREAD VALIDATION
 * 
 * AudioWorklet Processor to capture REAL audio frame timing
 * Runs in audio rendering thread (not main JavaScript thread)
 */

class TimingValidationProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    
    // Storage for timing measurements
    this.measurements = [];
    this.isCapturing = false;
    this.expectedFrameDelta = 0;
    this.sampleRate = 0;
    
    // Listen for messages from main thread
    this.port.onmessage = (event) => {
      const { type, data } = event.data;
      
      if (type === 'start') {
        // Start capturing timing
        this.isCapturing = true;
        this.expectedFrameDelta = data.expectedFrameDelta;
        this.sampleRate = data.sampleRate;
        this.measurements = [];
        this.lastFrame = null;
        
        console.log('[AUDIO THREAD] Started capturing. Expected delta:', this.expectedFrameDelta, 'frames');
      } else if (type === 'stop') {
        // Stop capturing and send results
        this.isCapturing = false;
        
        this.port.postMessage({
          type: 'results',
          measurements: this.measurements,
          sampleRate: this.sampleRate
        });
        
        console.log('[AUDIO THREAD] Stopped capturing. Total measurements:', this.measurements.length);
      }
    };
  }
  
  process(inputs, outputs, parameters) {
    if (this.isCapturing && currentFrame !== undefined) {
      const frame = currentFrame;
      
      if (this.lastFrame !== null) {
        // Measure actual frame delta
        const actualDelta = frame - this.lastFrame;
        const expectedDelta = this.expectedFrameDelta;
        const error = actualDelta - expectedDelta;
        
        // Convert to milliseconds
        const errorMs = (error / this.sampleRate) * 1000.0;
        
        this.measurements.push({
          frame: frame,
          actualDelta: actualDelta,
          expectedDelta: expectedDelta,
          error: error,
          errorMs: errorMs
        });
      }
      
      this.lastFrame = frame;
    }
    
    // Keep processor alive
    return true;
  }
}

registerProcessor('timing-validation-processor', TimingValidationProcessor);
