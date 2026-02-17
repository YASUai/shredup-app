/**
 * AudioRecorderProcessor - AudioWorklet processor for high-quality recording
 * Runs in separate audio thread (no glitches, no dropouts)
 */
class AudioRecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this.isRecording = false;
    this.bufferSize = 128; // Smaller = lower latency, no glitches
    
    // Listen for commands from main thread
    this.port.onmessage = (event) => {
      if (event.data.command === 'START') {
        this.isRecording = true;
        console.log('[RECORDER WORKLET] Recording started');
      } else if (event.data.command === 'STOP') {
        this.isRecording = false;
        console.log('[RECORDER WORKLET] Recording stopped');
      }
    };
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    
    if (!this.isRecording || !input || !input[0]) {
      return true; // Keep processor alive
    }
    
    const inputChannel = input[0]; // Mono (first channel)
    
    if (inputChannel.length === 0) {
      return true;
    }
    
    // Clone buffer (important: copy data, don't reference)
    const buffer = new Float32Array(inputChannel.length);
    buffer.set(inputChannel);
    
    // Send audio data to main thread
    this.port.postMessage({
      type: 'audiodata',
      buffer: buffer,
      timestamp: currentTime
    });
    
    return true; // Keep processor alive
  }
}

registerProcessor('audio-recorder-processor', AudioRecorderProcessor);
