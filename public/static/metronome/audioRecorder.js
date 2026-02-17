/**
 * AudioRecorder - Lightweight audio recording module for ShredUp
 * Records microphone/guitar input and provides WAV download
 * 
 * @class AudioRecorder
 */
class AudioRecorder {
  constructor(audioContext) {
    this.audioContext = audioContext;
    this.mediaStream = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
    this.recordingStartTime = null;
    this.recordingDuration = 0;
    
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
      
      const constraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
          sampleRate: options.sampleRate || 44100,
          channelCount: options.channelCount || 1
        }
      };
      
      this.mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('[AUDIO RECORDER] ✅ Microphone access granted');
      
      // Create MediaRecorder
      const mimeType = this._getSupportedMimeType();
      console.log('[AUDIO RECORDER] Using MIME type:', mimeType);
      
      this.mediaRecorder = new MediaRecorder(this.mediaStream, {
        mimeType: mimeType,
        audioBitsPerSecond: options.bitrate || 128000
      });
      
      // Event handlers
      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data);
          if (this.onDataAvailable) {
            this.onDataAvailable(event.data);
          }
        }
      };
      
      this.mediaRecorder.onstart = () => {
        console.log('[AUDIO RECORDER] ✅ Recording started');
        this.isRecording = true;
        this.recordingStartTime = Date.now();
        if (this.onRecordingStart) {
          this.onRecordingStart();
        }
      };
      
      this.mediaRecorder.onstop = () => {
        console.log('[AUDIO RECORDER] ✅ Recording stopped');
        this.isRecording = false;
        this.recordingDuration = Date.now() - this.recordingStartTime;
        if (this.onRecordingStop) {
          this.onRecordingStop(this.recordingDuration);
        }
      };
      
      this.mediaRecorder.onerror = (error) => {
        console.error('[AUDIO RECORDER] ❌ Error:', error);
        if (this.onError) {
          this.onError(error);
        }
      };
      
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
   * @param {number} timeslice - Optional timeslice in ms (for streaming)
   */
  startRecording(timeslice) {
    if (!this.mediaRecorder) {
      console.error('[AUDIO RECORDER] ❌ Recorder not initialized');
      return false;
    }
    
    if (this.isRecording) {
      console.warn('[AUDIO RECORDER] ⚠️ Already recording');
      return false;
    }
    
    this.audioChunks = [];
    
    if (timeslice) {
      this.mediaRecorder.start(timeslice);
    } else {
      this.mediaRecorder.start();
    }
    
    return true;
  }
  
  /**
   * Stop recording
   * @returns {Promise<Blob>} - Recorded audio blob
   */
  stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.isRecording) {
        console.warn('[AUDIO RECORDER] ⚠️ Not recording');
        reject(new Error('Not recording'));
        return;
      }
      
      this.mediaRecorder.onstop = () => {
        console.log('[AUDIO RECORDER] ✅ Recording stopped');
        this.isRecording = false;
        this.recordingDuration = Date.now() - this.recordingStartTime;
        
        // Create blob from chunks
        const mimeType = this.mediaRecorder.mimeType;
        const audioBlob = new Blob(this.audioChunks, { type: mimeType });
        
        console.log('[AUDIO RECORDER] Audio blob created:', {
          size: audioBlob.size,
          type: audioBlob.type,
          duration: this.recordingDuration
        });
        
        if (this.onRecordingStop) {
          this.onRecordingStop(this.recordingDuration);
        }
        
        resolve(audioBlob);
      };
      
      this.mediaRecorder.stop();
    });
  }
  
  /**
   * Download recorded audio as file
   * @param {Blob} audioBlob - Audio blob to download
   * @param {string} filename - Optional filename
   */
  downloadRecording(audioBlob, filename) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const finalFilename = filename || `shredup-recording-${timestamp}.webm`;
    
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
    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
    
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    this.audioChunks = [];
    this.isRecording = false;
    
    console.log('[AUDIO RECORDER] ✅ Cleaned up');
  }
  
  /**
   * Get supported MIME type for MediaRecorder
   * @private
   * @returns {string} - Supported MIME type
   */
  _getSupportedMimeType() {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/mp4',
      'audio/wav'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        return type;
      }
    }
    
    // Fallback to default
    return 'audio/webm';
  }
  
  /**
   * Get recording state
   * @returns {Object} - Current state
   */
  getState() {
    return {
      isRecording: this.isRecording,
      duration: this.isRecording ? this.getCurrentDuration() : this.recordingDuration,
      chunksCount: this.audioChunks.length,
      mimeType: this.mediaRecorder ? this.mediaRecorder.mimeType : null
    };
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AudioRecorder;
}
