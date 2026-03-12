"""
Audio Analysis Functions
Precision analysis with tempo-agnostic comparison
"""

import librosa
import numpy as np
import soundfile as sf
from scipy import signal
from dtaidistance import dtw
import io
from typing import Dict, List, Tuple, Any
# import aubio  # Removed - deployment issues, using Librosa instead

# Analysis parameters
SR = 22050  # Sample rate for analysis
HOP_LENGTH = 512  # Hop length for onset detection
ONSET_THRESHOLD = 0.3  # Threshold for onset detection

async def analyze_with_reference(
    user_audio_data: bytes,
    reference_audio_data: bytes,
    exercise_name: str
) -> Dict[str, Any]:
    """
    Main analysis function comparing user audio with reference
    
    Returns comprehensive metrics:
    - Tempo analysis
    - Onset timing precision
    - Pitch accuracy
    - Rhythmic pattern similarity (tempo-agnostic)
    - Overall score
    """
    
    try:
        # Load audio files
        user_y, user_sr = load_audio_from_bytes(user_audio_data)
        ref_y, ref_sr = load_audio_from_bytes(reference_audio_data)
        
        # Resample to consistent sample rate
        if user_sr != SR:
            user_y = librosa.resample(user_y, orig_sr=user_sr, target_sr=SR)
        if ref_sr != SR:
            ref_y = librosa.resample(ref_y, orig_sr=ref_sr, target_sr=SR)
        
        # 1. TEMPO ANALYSIS
        tempo_results = analyze_tempo(user_y, ref_y)
        
        # 2. ONSET DETECTION (timing precision)
        onset_results = analyze_onsets(user_y, ref_y)
        
        # 3. RHYTHMIC PATTERN COMPARISON (tempo-agnostic with DTW)
        rhythm_results = analyze_rhythm_pattern(user_y, ref_y)
        
        # 4. PITCH ANALYSIS
        pitch_results = analyze_pitch(user_y, ref_y)
        
        # 5. CALCULATE OVERALL SCORE
        overall_score = calculate_overall_score(
            tempo_results,
            onset_results,
            rhythm_results,
            pitch_results
        )
        
        return {
            "exercise_name": exercise_name,
            "status": "success",
            "overall_score": overall_score,
            "tempo": tempo_results,
            "timing": onset_results,
            "rhythm": rhythm_results,
            "pitch": pitch_results,
            "metadata": {
                "user_duration": float(len(user_y) / SR),
                "reference_duration": float(len(ref_y) / SR),
                "sample_rate": SR
            }
        }
    
    except Exception as e:
        return {
            "exercise_name": exercise_name,
            "status": "error",
            "error": str(e)
        }

async def analyze_solo(audio_data: bytes) -> Dict[str, Any]:
    """
    Analyze single audio file without reference
    Returns basic metrics only
    """
    
    try:
        # Load audio
        y, sr = load_audio_from_bytes(audio_data)
        
        # Resample if needed
        if sr != SR:
            y = librosa.resample(y, orig_sr=sr, target_sr=SR)
        
        # Detect tempo
        tempo, beats = librosa.beat.beat_track(y=y, sr=SR)
        
        # Detect onsets
        onset_frames = librosa.onset.onset_detect(y=y, sr=SR, hop_length=HOP_LENGTH)
        onset_times = librosa.frames_to_time(onset_frames, sr=SR, hop_length=HOP_LENGTH)
        
        # Extract pitch (basic)
        pitches, magnitudes = librosa.piptrack(y=y, sr=SR)
        
        return {
            "status": "success",
            "tempo": float(tempo),
            "duration": float(len(y) / SR),
            "onset_count": len(onset_times),
            "onset_times": onset_times.tolist()[:50],  # Limit to first 50
            "sample_rate": SR
        }
    
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }

def load_audio_from_bytes(audio_bytes: bytes) -> Tuple[np.ndarray, int]:
    """Load audio from bytes (MP3/WAV/FLAC support)"""
    audio_io = io.BytesIO(audio_bytes)
    y, sr = librosa.load(audio_io, sr=None, mono=True)
    return y, sr

def analyze_tempo(user_y: np.ndarray, ref_y: np.ndarray) -> Dict[str, Any]:
    """
    Analyze tempo of both recordings
    """
    
    # Detect tempo for user audio
    user_tempo, user_beats = librosa.beat.beat_track(y=user_y, sr=SR)
    
    # Detect tempo for reference audio
    ref_tempo, ref_beats = librosa.beat.beat_track(y=ref_y, sr=SR)
    
    # Calculate tempo difference
    tempo_diff = abs(float(user_tempo) - float(ref_tempo))
    tempo_diff_percent = (tempo_diff / float(ref_tempo)) * 100
    
    return {
        "user_bpm": float(user_tempo),
        "reference_bpm": float(ref_tempo),
        "difference_bpm": float(tempo_diff),
        "difference_percent": float(tempo_diff_percent),
        "score": max(0, 100 - tempo_diff_percent * 2)  # Penalty for tempo difference
    }

def analyze_onsets(user_y: np.ndarray, ref_y: np.ndarray) -> Dict[str, Any]:
    """
    Detect note onsets with high precision (±1-2ms target)
    Using Librosa onset detection (Aubio removed for deployment compatibility)
    """
    
    # Librosa onset detection with optimized parameters
    user_onsets = librosa.onset.onset_detect(
        y=user_y,
        sr=SR,
        hop_length=HOP_LENGTH,
        backtrack=True,
        units='time'
    )
    
    ref_onsets = librosa.onset.onset_detect(
        y=ref_y,
        sr=SR,
        hop_length=HOP_LENGTH,
        backtrack=True,
        units='time'
    )
    
    # Calculate timing precision
    timing_errors = calculate_timing_errors(user_onsets, ref_onsets)
    
    return {
        "user_onset_count": len(user_onsets),
        "reference_onset_count": len(ref_onsets),
        "user_onsets": user_onsets.tolist()[:50],  # Limit for response size
        "reference_onsets": ref_onsets.tolist()[:50],
        "timing_errors_ms": timing_errors,
        "mean_error_ms": float(np.mean(np.abs(timing_errors))) if len(timing_errors) > 0 else 0,
        "std_error_ms": float(np.std(timing_errors)) if len(timing_errors) > 0 else 0,
        "score": calculate_timing_score(timing_errors)
    }

def detect_onsets_aubio(y: np.ndarray, sr: int) -> np.ndarray:
    """
    DEPRECATED - Aubio removed for deployment compatibility
    Using Librosa onset detection instead
    """
    # Use Librosa instead
    onset_frames = librosa.onset.onset_detect(
        y=y,
        sr=sr,
        hop_length=HOP_LENGTH,
        backtrack=True
    )
    return librosa.frames_to_time(onset_frames, sr=sr, hop_length=HOP_LENGTH)

def calculate_timing_errors(user_onsets: np.ndarray, ref_onsets: np.ndarray) -> List[float]:
    """
    Calculate timing errors between user and reference onsets
    Returns errors in milliseconds
    """
    
    if len(user_onsets) == 0 or len(ref_onsets) == 0:
        return []
    
    # Match each user onset to nearest reference onset
    errors = []
    
    for user_onset in user_onsets:
        # Find nearest reference onset
        distances = np.abs(ref_onsets - user_onset)
        nearest_idx = np.argmin(distances)
        nearest_ref = ref_onsets[nearest_idx]
        
        # Calculate error in milliseconds
        error_ms = (user_onset - nearest_ref) * 1000
        
        # Only count if within reasonable range (< 500ms)
        if abs(error_ms) < 500:
            errors.append(error_ms)
    
    return errors

def calculate_timing_score(timing_errors: List[float]) -> float:
    """
    Calculate timing score based on errors
    Target: ±1-2ms precision = 100 points
    """
    
    if len(timing_errors) == 0:
        return 0.0
    
    mean_error = np.mean(np.abs(timing_errors))
    
    # Score calculation
    # 0-2ms = 100 points
    # 2-5ms = 90-100 points
    # 5-10ms = 70-90 points
    # 10-20ms = 50-70 points
    # >20ms = <50 points
    
    if mean_error <= 2:
        score = 100
    elif mean_error <= 5:
        score = 100 - (mean_error - 2) * 3.33
    elif mean_error <= 10:
        score = 90 - (mean_error - 5) * 4
    elif mean_error <= 20:
        score = 70 - (mean_error - 10) * 2
    else:
        score = max(0, 50 - (mean_error - 20))
    
    return float(score)

def analyze_rhythm_pattern(user_y: np.ndarray, ref_y: np.ndarray) -> Dict[str, Any]:
    """
    Compare rhythmic patterns using DTW (tempo-agnostic)
    Normalizes IOIs (Inter-Onset Intervals) for comparison
    """
    
    # Detect onsets
    user_onsets = librosa.onset.onset_detect(y=user_y, sr=SR, hop_length=HOP_LENGTH, units='time')
    ref_onsets = librosa.onset.onset_detect(y=ref_y, sr=SR, hop_length=HOP_LENGTH, units='time')
    
    if len(user_onsets) < 2 or len(ref_onsets) < 2:
        return {
            "status": "insufficient_data",
            "score": 0
        }
    
    # Calculate IOIs (Inter-Onset Intervals)
    user_iois = np.diff(user_onsets)
    ref_iois = np.diff(ref_onsets)
    
    # Normalize IOIs (make tempo-agnostic)
    user_iois_norm = user_iois / np.mean(user_iois)
    ref_iois_norm = ref_iois / np.mean(ref_iois)
    
    # Calculate DTW distance
    dtw_distance = dtw.distance(user_iois_norm, ref_iois_norm)
    
    # Calculate rhythm similarity score
    # Lower DTW distance = higher similarity
    max_expected_distance = 2.0  # Tune based on testing
    rhythm_score = max(0, 100 - (dtw_distance / max_expected_distance) * 100)
    
    return {
        "dtw_distance": float(dtw_distance),
        "user_ioi_count": len(user_iois),
        "reference_ioi_count": len(ref_iois),
        "score": float(rhythm_score),
        "tempo_agnostic": True
    }

def analyze_pitch(user_y: np.ndarray, ref_y: np.ndarray) -> Dict[str, Any]:
    """
    Analyze pitch accuracy (target: ±1-2 cents precision)
    Uses pYIN algorithm for high precision
    """
    
    # Extract pitch using pYIN (more accurate than piptrack)
    user_f0 = librosa.pyin(
        user_y,
        fmin=librosa.note_to_hz('C2'),
        fmax=librosa.note_to_hz('C7'),
        sr=SR
    )[0]
    
    ref_f0 = librosa.pyin(
        ref_y,
        fmin=librosa.note_to_hz('C2'),
        fmax=librosa.note_to_hz('C7'),
        sr=SR
    )[0]
    
    # Remove NaN values
    user_f0_clean = user_f0[~np.isnan(user_f0)]
    ref_f0_clean = ref_f0[~np.isnan(ref_f0)]
    
    if len(user_f0_clean) == 0 or len(ref_f0_clean) == 0:
        return {
            "status": "no_pitch_detected",
            "score": 0
        }
    
    # Calculate pitch differences in cents
    # Align sequences using DTW
    min_len = min(len(user_f0_clean), len(ref_f0_clean))
    user_f0_aligned = user_f0_clean[:min_len]
    ref_f0_aligned = ref_f0_clean[:min_len]
    
    # Convert to cents difference
    cents_diff = 1200 * np.log2(user_f0_aligned / ref_f0_aligned)
    cents_diff = cents_diff[np.isfinite(cents_diff)]
    
    if len(cents_diff) == 0:
        return {
            "status": "pitch_comparison_failed",
            "score": 0
        }
    
    mean_cents_error = float(np.mean(np.abs(cents_diff)))
    std_cents_error = float(np.std(cents_diff))
    
    # Score calculation
    # 0-2 cents = 100 points
    # 2-5 cents = 90-100 points
    # 5-10 cents = 70-90 points
    # >10 cents = <70 points
    
    if mean_cents_error <= 2:
        pitch_score = 100
    elif mean_cents_error <= 5:
        pitch_score = 100 - (mean_cents_error - 2) * 3.33
    elif mean_cents_error <= 10:
        pitch_score = 90 - (mean_cents_error - 5) * 4
    else:
        pitch_score = max(0, 70 - (mean_cents_error - 10) * 2)
    
    return {
        "mean_error_cents": mean_cents_error,
        "std_error_cents": std_cents_error,
        "max_error_cents": float(np.max(np.abs(cents_diff))),
        "pitch_detected_frames": len(cents_diff),
        "score": float(pitch_score)
    }

def calculate_overall_score(
    tempo_results: Dict,
    onset_results: Dict,
    rhythm_results: Dict,
    pitch_results: Dict
) -> Dict[str, float]:
    """
    Calculate weighted overall score
    """
    
    # Weights (can be adjusted)
    weights = {
        "tempo": 0.15,
        "timing": 0.35,
        "rhythm": 0.30,
        "pitch": 0.20
    }
    
    scores = {
        "tempo": tempo_results.get("score", 0),
        "timing": onset_results.get("score", 0),
        "rhythm": rhythm_results.get("score", 0),
        "pitch": pitch_results.get("score", 0)
    }
    
    # Calculate weighted average
    overall = sum(scores[key] * weights[key] for key in weights.keys())
    
    return {
        "total": float(overall),
        "breakdown": scores,
        "weights": weights
    }
