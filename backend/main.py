from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import librosa
import numpy as np
import soundfile as sf
import io
import os
from typing import Optional

app = FastAPI(title="ShredUp Audio Analysis API")

# CORS Configuration
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
CORS_ORIGINS = os.getenv("CORS_ORIGINS", FRONTEND_URL).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class BPMResponse(BaseModel):
    bpm: float
    confidence: float

class PitchResponse(BaseModel):
    note: str
    frequency: float
    confidence: float

@app.get("/health")
async def health_check():
    return {"status": "ok"}

@app.post("/api/audio/analyze-bpm", response_model=BPMResponse)
async def analyze_bpm(file: UploadFile = File(...)):
    """Analyze BPM using Librosa onset detection"""
    try:
        # Read audio file
        audio_data = await file.read()
        y, sr = librosa.load(io.BytesIO(audio_data), sr=None)
        
        # Onset detection
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        tempo, _ = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)
        
        # Convert numpy types to Python native types
        bpm = float(tempo) if isinstance(tempo, np.ndarray) else float(tempo)
        
        return BPMResponse(
            bpm=round(bpm, 2),
            confidence=0.85  # Librosa doesn't provide confidence, use fixed value
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"BPM analysis failed: {str(e)}")

@app.post("/api/audio/analyze-pitch", response_model=PitchResponse)
async def analyze_pitch(file: UploadFile = File(...)):
    """Analyze pitch using Librosa pyin algorithm"""
    try:
        # Read audio file
        audio_data = await file.read()
        y, sr = librosa.load(io.BytesIO(audio_data), sr=None, mono=True)
        
        # Pitch detection using pyin
        f0, voiced_flag, voiced_probs = librosa.pyin(
            y,
            fmin=librosa.note_to_hz('C2'),
            fmax=librosa.note_to_hz('C7'),
            sr=sr
        )
        
        # Filter out unvoiced frames and get median frequency
        voiced_frequencies = f0[voiced_flag]
        
        if len(voiced_frequencies) == 0:
            raise HTTPException(status_code=400, detail="No pitch detected in audio")
        
        frequency = float(np.median(voiced_frequencies))
        confidence = float(np.mean(voiced_probs[voiced_flag]))
        
        # Convert frequency to note
        note = librosa.hz_to_note(frequency)
        
        return PitchResponse(
            note=note,
            frequency=round(frequency, 2),
            confidence=round(confidence, 2)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pitch analysis failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
