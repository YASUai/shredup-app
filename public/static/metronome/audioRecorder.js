/**
 * AudioRecorder - Lightweight audio recording module for ShredUp
 * Records microphone/guitar input and provides WAV download (16-bit/44.1kHz)
 * 
 * @class AudioRecorder
 */
class AudioRecorder {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.mediaStream = null;
    this.sourceNode = null;
    this.processorNode = null;
    this.audioChunks = [];
    this.recordedBuffers = [];
    this.isRecording = false;
    this.recordingStartTime = null;
    this.recordingDuration = 0;
    this.sampleRate = 44100;
    this.channelCount = 1;
    
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
          channelCount: this.channelCount
        }
      };
      
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[AUDIO RECORDER] ✅ Microphone access granted');
      console.log('[AUDIO RECORDER] Sample rate:', this.sampleRate, 'Hz');
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
      
      // Create ScriptProcessorNode for raw PCM capture
      const bufferSize = 4096;
      this.processorNode = this.audioContext.createScriptProcessor(bufferSize, this.channelCount, this.channelCount);
      
      // Reset buffers
      this.recordedBuffers = [];
      
      // Process audio chunks
      this.processorNode.onaudioprocess = (e) => {
        if (!this.isRecording) return;
        
        // Get input buffer (mono or first channel)
        const inputBuffer = e.inputBuffer.getChannelData(0);
        
        // Clone the buffer (important: copy the data)
        const buffer = new Float32Array(inputBuffer.length);
        buffer.set(inputBuffer);
        
        this.recordedBuffers.push(buffer);
        
        if (this.onDataAvailable) {
          this.onDataAvailable(buffer);
        }
      };
      
      // Connect nodes
      this.sourceNode.connect(this.processorNode);
      this.processorNode.connect(this.audioContext.destination);
      
      // Start recording
      this.isRecording = true;
      this.recordingStartTime = Date.now();
      
      console.log('[AUDIO RECORDER] ✅ Recording started');
      
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
    
    this.isRecording = false;
    this.recordingDuration = Date.now() - this.recordingStartTime;
    
    // Disconnect nodes
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode.onaudioprocess = null;
      this.processorNode = null;
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
      duration: this.recordingDuration
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
    
    console.log('[AUDIO RECORDER] Total samples:', totalLength);
    console.log('[AUDIO RECORDER] Duration:', (totalLength / this.sampleRate).toFixed(2), 's');
    
    // Convert Float32 [-1, 1] to Int16 [-32768, 32767]
    const int16Buffer = new Int16Array(totalLength);
    for (let i = 0; i < totalLength; i++) {
      const sample = Math.max(-1, Math.min(1, mergedBuffer[i])); // Clamp
      int16Buffer[i] = sample < 0 ? sample * 32768 : sample * 32767;
    }
    
    // Create WAV file
    const wavBuffer = this._createWAVFile(int16Buffer);
    
    return new Blob([wavBuffer], { type: 'audio/wav' });
  }
  
  /**
   * Create WAV file with header
   * @private
   * @param {Int16Array} samples - PCM samples
   * @returns {ArrayBuffer} - Complete WAV file
   */
  _createWAVFile(samples) {
    const numChannels = this.channelCount;
    const sampleRate = this.sampleRate;
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
    
    if (this.processorNode) {
      this.processorNode.disconnect();
      this.processorNode = null;
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
      sampleRate: this.sampleRate,
      channelCount: this.channelCount,
      format: 'WAV 16-bit PCM'
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioRecorder;
}
