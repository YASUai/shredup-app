/**
 * AudioRecorder - High-quality audio recording module for ShredUp
 * Records microphone/guitar input and provides WAV download (16-bit/44.1kHz)
 * Uses AudioWorklet for glitch-free recording
 * 
 * @class AudioRecorder
 */
class AudioRecorder {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.mediaStream = null;
    this.sourceNode = null;
    this.workletNode = null;
    this.recordedBuffers = [];
    this.isRecording = false;
    this.recordingStartTime = null;
    this.recordingDuration = 0;
    this.sampleRate = 44100;
    this.channelCount = 1;
    this.workletLoaded = false;
    
    // Callbacks
    this.onRecordingStart = null;
    this.onRecordingStop = null;
    this.onDataAvailable = null;
    this.onError = null;
  }
  
  /**
   * Initialize recorder with microphone access
   * @param {Object} options - Recording options
   * @returns {Promise<void>}
   */
  async init(options = {}) {
    try {
      console.log('[AUDIO RECORDER] Requesting microphone access...');
      
      this.sampleRate = options.sampleRate || 44100;
      this.channelCount = options.channelCount || 1;
      
      const constraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: this.sampleRate,
          channelCount: this.channelCount,
          // High-quality settings
          latency: 0,
          sampleSize: 16
        }
      };
      
      // Add deviceId if specified
      if (options.deviceId) {
        constraints.audio.deviceId = { exact: options.deviceId };
        console.log('[AUDIO RECORDER] Using specific device:', options.deviceId);
      }
      
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[AUDIO RECORDER] ✅ Microphone access granted');
      
      // Log the actual device being used
      const tracks = this.mediaStream.getAudioTracks();
      if (tracks.length > 0) {
        console.log('[AUDIO RECORDER] Device label:', tracks[0].label);
        console.log('[AUDIO RECORDER] Device settings:', tracks[0].getSettings());
      }
      
      // Load AudioWorklet module
      if (!this.workletLoaded) {
        await this.audioContext.audioWorklet.addModule('/static/metronome/audio-recorder-processor.js');
        this.workletLoaded = true;
        console.log('[AUDIO RECORDER] ✅ AudioWorklet loaded');
      }
      
      console.log('[AUDIO RECORDER] Sample rate:', this.audioContext.sampleRate, 'Hz');
      console.log('[AUDIO RECORDER] Channels:', this.channelCount);
      
      return true;
    } catch (error) {
      console.error('[AUDIO RECORDER] ❌ Failed to initialize:', error);
      if (this.onError) {
        this.onError(error);
      }
      throw error;
    }
  }
  
  /**
   * Start recording
   */
  async startRecording() {
    if (!this.mediaStream) {
      console.error('[AUDIO RECORDER] ❌ Recorder not initialized');
      return false;
    }
    
    if (this.isRecording) {
      console.warn('[AUDIO RECORDER] ⚠️ Already recording');
      return false;
    }
    
    try {
      // Create audio nodes
      this.sourceNode = this.audioContext.createMediaStreamSource(this.mediaStream);
      
      // Create AudioWorklet node
      this.workletNode = new AudioWorkletNode(this.audioContext, 'audio-recorder-processor', {
        numberOfInputs: 1,
        numberOfOutputs: 0,
        channelCount: this.channelCount,
        processorOptions: {
          sampleRate: this.sampleRate
        }
      });
      
      // Reset buffers
      this.recordedBuffers = [];
      
      // Handle messages from worklet
      this.workletNode.port.onmessage = (event) => {
        if (event.data.type === 'audiodata') {
          this.recordedBuffers.push(event.data.buffer);
          
          if (this.onDataAvailable) {
            this.onDataAvailable(event.data.buffer);
          }
        }
      };
      
      // Connect nodes (no output to destination = silent monitoring)
      this.sourceNode.connect(this.workletNode);
      
      // Start recording
      this.workletNode.port.postMessage({ command: 'START' });
      
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      
      console.log('[AUDIO RECORDER] ✅ Recording started (AudioWorklet mode)');
      
      if (this.onRecordingStart) {
        this.onRecordingStart();
      }
      
      return true;
    } catch (error) {
      console.error('[AUDIO RECORDER] ❌ Failed to start recording:', error);
      if (this.onError) {
        this.onError(error);
      }
      return false;
    }
  }
  
  /**
   * Stop recording
   * @returns {Promise<Blob>} - Recorded audio blob (WAV format)
   */
  async stopRecording() {
    if (!this.isRecording) {
      console.warn('[AUDIO RECORDER] ⚠️ Not recording');
      return null;
    }
    
    // Stop recording
    if (this.workletNode) {
      this.workletNode.port.postMessage({ command: 'STOP' });
    }
    
    // Wait a bit for last buffers to arrive
    await new Promise(resolve => setTimeout(resolve, 100));
    
    this.isRecording = false;
    this.recordingDuration = Date.now() - this.recordingStartTime;
    
    // Disconnect nodes
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode.port.onmessage = null;
      this.workletNode = null;
    }
    
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    
    console.log('[AUDIO RECORDER] ✅ Recording stopped');
    console.log('[AUDIO RECORDER] Duration:', this.recordingDuration, 'ms');
    console.log('[AUDIO RECORDER] Buffers collected:', this.recordedBuffers.length);
    
    // Convert to WAV
    const wavBlob = this._exportToWAV();
    
    console.log('[AUDIO RECORDER] WAV blob created:', {
      size: wavBlob.size,
      type: wavBlob.type,
      duration: (this.recordingDuration / 1000).toFixed(2) + 's',
      quality: '16-bit/44.1kHz PCM'
    });
    
    if (this.onRecordingStop) {
      this.onRecordingStop(this.recordingDuration);
    }
    
    return wavBlob;
  }
  
  /**
   * Export recorded audio to WAV format (16-bit PCM)
   * @private
   * @returns {Blob} - WAV audio blob
   */
  _exportToWAV() {
    // Merge all buffers into one
    const totalLength = this.recordedBuffers.reduce((acc, buf) => acc + buf.length, 0);
    const mergedBuffer = new Float32Array(totalLength);
    
    let offset = 0;
    for (const buffer of this.recordedBuffers) {
      mergedBuffer.set(buffer, offset);
      offset += buffer.length;
    }
    
    const actualSampleRate = this.audioContext.sampleRate;
    const duration = (totalLength / actualSampleRate).toFixed(2);
    
    console.log('[AUDIO RECORDER] Total samples:', totalLength);
    console.log('[AUDIO RECORDER] Duration:', duration, 's');
    console.log('[AUDIO RECORDER] Sample rate:', actualSampleRate, 'Hz');
    
    // Convert Float32 [-1, 1] to Int16 [-32768, 32767]
    const int16Buffer = new Int16Array(totalLength);
    for (let i = 0; i < totalLength; i++) {
      const sample = Math.max(-1, Math.min(1, mergedBuffer[i])); // Clamp to prevent clipping
      int16Buffer[i] = sample < 0 ? sample * 32768 : sample * 32767;
    }
    
    // Create WAV file with actual sample rate
    const wavBuffer = this._createWAVFile(int16Buffer, actualSampleRate);
    
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }
  
  /**
   * Create WAV file with header
   * @private
   * @param {Int16Array} samples - PCM samples
   * @param {number} sampleRate - Actual sample rate
   * @returns {ArrayBuffer} - Complete WAV file
   */
  _createWAVFile(samples, sampleRate) {
    const numChannels = this.channelCount;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = samples.length * bytesPerSample;
    const fileSize = 44 + dataSize;
    
    const buffer = new ArrayBuffer(fileSize);
    const view = new DataView(buffer);
    
    // RIFF chunk descriptor
    this._writeString(view, 0, 'RIFF');
    view.setUint32(4, fileSize - 8, true); // File size - 8
    this._writeString(view, 8, 'WAVE');
    
    // fmt sub-chunk
    this._writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 = PCM)
    view.setUint16(22, numChannels, true); // NumChannels
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * blockAlign, true); // ByteRate
    view.setUint16(32, blockAlign, true); // BlockAlign
    view.setUint16(34, bitsPerSample, true); // BitsPerSample
    
    // data sub-chunk
    this._writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true); // Subchunk2Size
    
    // Write PCM samples
    let offset = 44;
    for (let i = 0; i < samples.length; i++) {
      view.setInt16(offset, samples[i], true);
      offset += 2;
    }
    
    return buffer;
  }
  
  /**
   * Write string to DataView
   * @private
   */
  _writeString(view, offset, string) {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }
  
  /**
   * Download recorded audio as file
   * @param {Blob} audioBlob - Audio blob to download
   * @param {string} filename - Optional filename
   */
  downloadRecording(audioBlob, filename) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const finalFilename = filename || `shredup-recording-${timestamp}.wav`;
    
    const url = URL.createObjectURL(audioBlob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = finalFilename;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
    
    console.log('[AUDIO RECORDER] ✅ Download initiated:', finalFilename);
  }
  
  /**
   * Get current recording duration (while recording)
   * @returns {number} - Duration in milliseconds
   */
  getCurrentDuration() {
    if (!this.isRecording) return 0;
    return Date.now() - this.recordingStartTime;
  }
  
  /**
   * Clean up resources
   */
  cleanup() {
    if (this.isRecording) {
      this.stopRecording();
    }
    
    if (this.workletNode) {
      this.workletNode.disconnect();
      this.workletNode = null;
    }
    
    if (this.sourceNode) {
      this.sourceNode.disconnect();
      this.sourceNode = null;
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    this.recordedBuffers = [];
    this.isRecording = false;
    
    console.log('[AUDIO RECORDER] ✅ Cleaned up');
  }
  
  /**
   * Get recording state
   * @returns {Object} - Current state
   */
  getState() {
    return {
      isRecording: this.isRecording,
      duration: this.isRecording ? this.getCurrentDuration() : this.recordingDuration,
      buffersCount: this.recordedBuffers.length,
      sampleRate: this.audioContext.sampleRate,
      channelCount: this.channelCount,
      format: 'WAV 16-bit PCM',
      engine: 'AudioWorklet (glitch-free)'
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioRecorder;
}
