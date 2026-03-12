"""
SHRED UP - Backend Python FastAPI
Audio Analysis Service for Precision Practice Feedback
"""

from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from typing import Optional
import os
from datetime import datetime

# Import analysis functions (will be created next)
from audio_analysis import analyze_with_reference

app = FastAPI(
    title="SHRED UP Audio Analysis API",
    description="Precision analysis for music practice with tempo-agnostic comparison",
    version="1.0.0"
)

# CORS configuration - allow frontend to call backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://*.pages.dev",
        "https://*.gensparksite.com",
        "*"  # Allow all origins for development
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "SHRED UP Audio Analysis API",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat()
    }

@app.get("/health")
async def health_check():
    """Detailed health check with library versions"""
    try:
        import librosa
        import aubio
        import numpy as np
        import scipy
        
        return {
            "status": "healthy",
            "libraries": {
                "librosa": librosa.__version__,
                "numpy": np.__version__,
                "scipy": scipy.__version__,
                "aubio": "0.4.9"
            },
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }

@app.post("/api/analyze-with-reference")
async def analyze_audio(
    user_audio: UploadFile = File(..., description="User's recorded audio (MP3/WAV/FLAC)"),
    reference_audio: UploadFile = File(..., description="Reference audio (MP3/WAV/FLAC)"),
    exercise_name: Optional[str] = None
):
    """
    Analyze user audio against reference audio
    
    Returns:
    - Tempo analysis (BPM detection)
    - Onset detection (timing precision ±1-2ms)
    - Pitch analysis (±1-2 cents precision)
    - Rhythmic pattern comparison (tempo-agnostic with DTW)
    - Overall score and detailed metrics
    """
    
    try:
        # Validate file types
        allowed_extensions = ['.mp3', '.wav', '.flac', '.ogg', '.m4a']
        user_ext = os.path.splitext(user_audio.filename)[1].lower()
        ref_ext = os.path.splitext(reference_audio.filename)[1].lower()
        
        if user_ext not in allowed_extensions or ref_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file format. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Read audio files
        user_audio_data = await user_audio.read()
        reference_audio_data = await reference_audio.read()
        
        # Perform analysis
        results = await analyze_with_reference(
            user_audio_data=user_audio_data,
            reference_audio_data=reference_audio_data,
            exercise_name=exercise_name or "Unnamed Exercise"
        )
        
        return JSONResponse(content=results)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

@app.post("/api/analyze-solo")
async def analyze_solo_audio(
    audio: UploadFile = File(..., description="Audio file to analyze (MP3/WAV/FLAC)")
):
    """
    Analyze audio without reference (basic metrics only)
    
    Returns:
    - Detected tempo (BPM)
    - Note onsets
    - Pitch contour
    - Duration
    """
    
    try:
        # Validate file type
        allowed_extensions = ['.mp3', '.wav', '.flac', '.ogg', '.m4a']
        file_ext = os.path.splitext(audio.filename)[1].lower()
        
        if file_ext not in allowed_extensions:
            raise HTTPException(
                status_code=400,
                detail=f"Invalid file format. Allowed: {', '.join(allowed_extensions)}"
            )
        
        # Read audio file
        audio_data = await audio.read()
        
        # Basic analysis (will implement in audio_analysis.py)
        from audio_analysis import analyze_solo
        results = await analyze_solo(audio_data)
        
        return JSONResponse(content=results)
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Analysis failed: {str(e)}"
        )

if __name__ == "__main__":
    # Run with: python main.py
    # Or: uvicorn main:app --reload --host 0.0.0.0 --port 8000
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
