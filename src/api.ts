const API_BASE_URL = 'https://npx-railwaycli-up-production.up.railway.app';

export const api = {
  async analyzeBPM(audioFile: File): Promise<{ bpm: number; confidence: number }> {
    const formData = new FormData();
    formData.append('file', audioFile);

    const response = await fetch(`${API_BASE_URL}/api/audio/analyze-bpm`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`BPM analysis failed: ${response.statusText}`);
    }

    return response.json();
  },

  async analyzePitch(audioFile: File): Promise<{ note: string; frequency: number; confidence: number }> {
    const formData = new FormData();
    formData.append('file', audioFile);

    const response = await fetch(`${API_BASE_URL}/api/audio/analyze-pitch`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Pitch analysis failed: ${response.statusText}`);
    }

    return response.json();
  },
};
