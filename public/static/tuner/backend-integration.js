// Backend API Integration for Tuner
const API_BASE_URL = 'https://npx-railwaycli-up-production.up.railway.app';

class BackendAudioAnalyzer {
  constructor() {
    this.audioContext = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
    this.isRecording = false;
  }

  async initAudioContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      this.mediaRecorder = new MediaRecorder(stream);
      this.audioChunks = [];

      this.mediaRecorder.ondataavailable = (event) => {
        this.audioChunks.push(event.data);
      };

      this.mediaRecorder.start();
      this.isRecording = true;
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }

  async stopRecording() {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error('Not recording'));
        return;
      }

      this.mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });
        this.isRecording = false;
        
        // Stop all tracks
        this.mediaRecorder.stream.getTracks().forEach(track => track.stop());
        
        resolve(audioBlob);
      };

      this.mediaRecorder.stop();
    });
  }

  async analyzePitch(audioBlob) {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');

    const response = await fetch(`${API_BASE_URL}/api/audio/analyze-pitch`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Pitch analysis failed: ${response.statusText}`);
    }

    return response.json();
  }

  async analyzeBPM(audioBlob) {
    const formData = new FormData();
    formData.append('file', audioBlob, 'audio.webm');

    const response = await fetch(`${API_BASE_URL}/api/audio/analyze-bpm`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`BPM analysis failed: ${response.statusText}`);
    }

    return response.json();
  }

  async recordAndAnalyzePitch(durationMs = 1000) {
    await this.startRecording();
    await new Promise(resolve => setTimeout(resolve, durationMs));
    const audioBlob = await this.stopRecording();
    return await this.analyzePitch(audioBlob);
  }

  async recordAndAnalyzeBPM(durationMs = 3000) {
    await this.startRecording();
    await new Promise(resolve => setTimeout(resolve, durationMs));
    const audioBlob = await this.stopRecording();
    return await this.analyzeBPM(audioBlob);
  }
}

// Export for use in tuner
window.BackendAudioAnalyzer = BackendAudioAnalyzer;
