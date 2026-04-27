from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import io
import os
import tempfile
import logging
from typing import Optional

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

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
        import librosa
        import numpy as np
        audio_data = await file.read()
        y, sr = librosa.load(io.BytesIO(audio_data), sr=None)
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        tempo, _ = librosa.beat.beat_track(onset_envelope=onset_env, sr=sr)
        bpm = float(tempo) if isinstance(tempo, np.ndarray) else float(tempo)
        return BPMResponse(bpm=round(bpm, 2), confidence=0.85)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"BPM analysis failed: {str(e)}")

@app.post("/api/audio/analyze-pitch", response_model=PitchResponse)
async def analyze_pitch(file: UploadFile = File(...)):
    """Analyze pitch using Librosa pyin algorithm"""
    try:
        import librosa
        import numpy as np
        audio_data = await file.read()
        y, sr = librosa.load(io.BytesIO(audio_data), sr=None, mono=True)
        f0, voiced_flag, voiced_probs = librosa.pyin(
            y, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'), sr=sr
        )
        voiced_frequencies = f0[voiced_flag]
        if len(voiced_frequencies) == 0:
            raise HTTPException(status_code=400, detail="No pitch detected in audio")
        frequency = float(np.median(voiced_frequencies))
        confidence = float(np.mean(voiced_probs[voiced_flag]))
        note = librosa.hz_to_note(frequency)
        return PitchResponse(note=note, frequency=round(frequency, 2), confidence=round(confidence, 2))
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Pitch analysis failed: {str(e)}")

class CompareResponse(BaseModel):
    timing: float
    articulation: float
    accuracy: float
    exercise_name: str
    feedback: str

@app.post("/api/audio/compare", response_model=CompareResponse)
async def compare_audio(
    reference: UploadFile = File(...),
    recorded: UploadFile = File(...),
    exercise_name: str = Form(default="Exercise"),
    bpm: float = Form(default=120.0)
):
    """
    Option A — Metronome clicks as timing grid:
      - Extract metronome clicks (900-2500 Hz band) from recording
      - Extract musical notes (low-pass < 900 Hz) from recording
      - TIMING    : deviation of each note from nearest beat subdivision (via clicks)
      - ARTICULATION : coverage of reference notes in recording
    """
    try:
        import librosa
        import numpy as np
        from scipy import signal as scipy_signal

        ref_data = await reference.read()
        rec_data = await recorded.read()

        ref_ext = os.path.splitext(reference.filename or 'ref.webm')[1] or '.webm'
        rec_ext = os.path.splitext(recorded.filename or 'rec.webm')[1] or '.webm'

        def load_audio(data, ext):
            with tempfile.NamedTemporaryFile(suffix=ext, delete=False) as tmp:
                tmp.write(data)
                tmp_path = tmp.name
            try:
                y, sr = librosa.load(tmp_path, sr=22050, mono=True)
            finally:
                os.unlink(tmp_path)
            return y, sr

        y_ref, sr = load_audio(ref_data, ref_ext)
        y_rec, _  = load_audio(rec_data, rec_ext)

        beat_s      = 60.0 / max(bpm, 40)
        countdown_s = 8.0 * beat_s          # 2 measures × 4 beats
        search_from = max(0.0, countdown_s - 2.0 * beat_s)

        hop_length = 256   # 11.6ms resolution at 22050Hz

        # ── Frequency separation ─────────────────────────────────────────────
        # Metronome: pure sine tones at ~1200 Hz (click) and ~1800 Hz (accent)
        # Guitar/bass fundamentals: mostly below 900 Hz
        nyq = sr / 2.0

        # Band-pass 900-2500 Hz → isolates metronome clicks
        b_bp, a_bp = scipy_signal.butter(4, [900.0/nyq, 2500.0/nyq], btype='band')
        y_rec_bp   = scipy_signal.filtfilt(b_bp, a_bp, y_rec)

        # Low-pass < 900 Hz → isolates musical notes
        b_lp, a_lp = scipy_signal.butter(4, 900.0/nyq, btype='low')
        y_rec_lp   = scipy_signal.filtfilt(b_lp, a_lp, y_rec)

        print(f"[INPUT] bpm={bpm:.1f} exercise='{exercise_name}'", flush=True)

        # ── Onset detection ──────────────────────────────────────────────────
        def get_note_onsets(y):
            """Detect musical note onsets from low-passed recording or reference."""
            n_fft    = 2048
            fmax_bin = int(np.round(900.0 * n_fft / sr)) + 1
            S        = np.abs(librosa.stft(y, n_fft=n_fft, hop_length=hop_length))
            S_low    = S[:fmax_bin, :]
            env      = librosa.onset.onset_strength(
                S=librosa.amplitude_to_db(S_low, ref=np.max),
                sr=sr, hop_length=hop_length
            )
            raw = librosa.onset.onset_detect(
                y=y, sr=sr, units='time',
                onset_envelope=env, backtrack=True,
                pre_max=3, post_max=3, pre_avg=3, post_avg=5,
                delta=0.07, wait=4, hop_length=hop_length
            )
            if len(raw) == 0:
                return np.array([])
            # Cluster within cluster_gap
            cluster_gap = min(0.05, beat_s / 8)
            clusters = [[raw[0]]]
            for t in raw[1:]:
                if t - clusters[-1][-1] < cluster_gap:
                    clusters[-1].append(t)
                else:
                    clusters.append([t])
            times_c = np.array([float(np.mean(c)) for c in clusters])
            # Strength filter
            peak_win = max(2, int(sr * 0.09 / hop_length))
            frames   = np.clip(
                librosa.time_to_frames(times_c, sr=sr, hop_length=hop_length),
                0, len(env) - 1
            ).astype(int)
            strengths = np.array([
                float(np.max(env[f:min(len(env), f + peak_win)])) if f < len(env) else 0.0
                for f in frames
            ])
            if len(strengths) >= 4:
                env_noise = float(np.percentile(env, 10))
                iqr       = float(np.percentile(strengths, 75) - np.percentile(strengths, 25))
                thresh    = env_noise + 0.3 * max(iqr, 0.1)
                times_c   = times_c[strengths >= thresh]
            return times_c

        def get_click_onsets(y_bp, beat_s):
            """Detect metronome click onsets from band-passed recording."""
            env = librosa.onset.onset_strength(y=y_bp, sr=sr, hop_length=hop_length)
            # Clicks are sharp, use tight window and generous delta
            min_wait = max(2, int(beat_s * 0.6 * sr / hop_length))
            raw = librosa.onset.onset_detect(
                y=y_bp, sr=sr, units='time',
                onset_envelope=env, backtrack=False,
                pre_max=1, post_max=1, pre_avg=1, post_avg=3,
                delta=0.15, wait=min_wait, hop_length=hop_length
            )
            return raw

        onset_times_ref = get_note_onsets(y_ref)
        onset_times_rec = get_note_onsets(y_rec_lp)
        click_onsets    = get_click_onsets(y_rec_bp, beat_s)

        # Post-countdown subsets
        rec_post    = onset_times_rec[onset_times_rec >= search_from]
        click_post  = click_onsets[click_onsets >= max(0.0, countdown_s - 4.0 * beat_s)]

        print(f"[DETECT] ref={len(onset_times_ref)}, rec={len(onset_times_rec)}, "
              f"clicks={len(click_post)} (post-countdown)", flush=True)

        # ── Align reference to recording (for articulation) ──────────────────
        offset = countdown_s
        onset_times_ref_aligned = onset_times_ref.copy()

        if len(onset_times_ref) > 0 and len(rec_post) > 0:
            initial_offset = float(rec_post[0]) - float(onset_times_ref[0])
            refined = []
            for i in range(min(8, len(onset_times_ref))):
                expected = float(onset_times_ref[i]) + initial_offset
                nearby   = onset_times_rec[np.abs(onset_times_rec - expected) < beat_s * 0.5]
                if len(nearby) > 0:
                    nearest = float(nearby[np.argmin(np.abs(nearby - expected))])
                    refined.append(nearest - float(onset_times_ref[i]))
            offset = float(np.median(refined)) if refined else initial_offset
            onset_times_ref_aligned = onset_times_ref + offset

        print(f"[ALIGN] offset={offset:.3f}s | "
              f"ref[0]→{float(onset_times_ref_aligned[0]) if len(onset_times_ref_aligned)>0 else '?':.3f}s "
              f"| rec[0]={float(rec_post[0]) if len(rec_post)>0 else '?':.3f}s",
              flush=True)

        # ── 1. TIMING ────────────────────────────────────────────────────────
        # Option A: each note's position relative to surrounding clicks → deviation
        # from nearest valid musical subdivision (0, 1/4, 1/3, 1/2, 2/3, 3/4 beat).
        # Option B fallback (no clicks): IOI consistency vs BPM grid.
        SIGMA_TIMING_MS = 20.0
        timing_score    = 50.0

        # Valid subdivisions within one beat (fractions)
        valid_fracs = [0.0, 1/8, 1/6, 1/4, 1/3, 3/8, 1/2, 5/8, 2/3, 3/4, 5/6, 7/8]

        MIN_CLICKS = 4

        if len(click_post) >= MIN_CLICKS and len(rec_post) >= 2:
            # ── Option A ────────────────────────────────────────────────────
            devs_ms = []
            for note_t in rec_post:
                before = click_post[click_post <= note_t]
                after  = click_post[click_post >  note_t]
                if len(before) == 0 or len(after) == 0:
                    continue
                prev_click   = float(before[-1])
                next_click   = float(after[0])
                beat_interval = next_click - prev_click
                if beat_interval <= 0 or beat_interval > beat_s * 2.5:
                    # Skip if interval looks wrong (missed click etc.)
                    continue
                # Note's fractional position in the beat
                frac = (note_t - prev_click) / beat_interval
                # Nearest valid subdivision
                min_dev_frac = min(abs(frac - f) for f in valid_fracs)
                devs_ms.append(min_dev_frac * beat_interval * 1000)

            if len(devs_ms) >= 2:
                t_scores     = [100.0 * float(np.exp(-(d**2) / (2 * SIGMA_TIMING_MS**2)))
                                for d in devs_ms]
                timing_score = float(np.mean(t_scores))
                print(f"[TIMING][CLICKS] {len(devs_ms)} notes vs {len(click_post)} clicks | "
                      f"devs(ms): {[round(d,1) for d in devs_ms[:8]]} | score: {timing_score:.1f}%",
                      flush=True)
            else:
                print(f"[TIMING][CLICKS] not enough valid note-click pairs ({len(devs_ms)}), "
                      f"falling back to IOI", flush=True)
                click_post = np.array([])  # force IOI fallback

        if len(click_post) < MIN_CLICKS or len(rec_post) < 2:
            # ── Option B fallback: IOI ───────────────────────────────────────
            if len(rec_post) >= 2:
                iois = np.diff(rec_post)
                subdivisions_ioi = [1/8, 1/6, 1/4, 1/3, 3/8, 1/2, 2/3, 3/4, 1,
                                    4/3, 3/2, 2, 3, 4]
                ioi_scores = []
                for ioi in iois:
                    min_dev_ms = min(abs(ioi - s * beat_s) * 1000 for s in subdivisions_ioi)
                    ioi_scores.append(100.0 * float(np.exp(
                        -(min_dev_ms**2) / (2 * SIGMA_TIMING_MS**2))))
                timing_score = float(np.mean(ioi_scores))
                sample_iois  = [round(float(v) * 1000, 1) for v in iois[:8]]
                print(f"[TIMING][IOI] {len(iois)} intervals | "
                      f"sample_iois(ms): {sample_iois} | score: {timing_score:.1f}%", flush=True)

        # ── 2. ARTICULATION — note coverage vs reference ─────────────────────
        # Window: up to 1/2 beat, max 120ms
        MATCH_WINDOW_MS = min(120.0, beat_s * 1000 / 2)

        matched = 0
        if len(onset_times_ref_aligned) > 0 and len(onset_times_rec) > 0:
            matched = sum(
                1 for ref_t in onset_times_ref_aligned
                if float(np.min(np.abs(onset_times_rec - ref_t) * 1000)) <= MATCH_WINDOW_MS
            )
            articulation_score = float(matched / len(onset_times_ref_aligned) * 100)
        elif len(onset_times_rec) > 0:
            articulation_score = 75.0
        else:
            articulation_score = 0.0

        print(f"[ARTICU] {matched}/{len(onset_times_ref_aligned)} ref notes matched "
              f"(window={MATCH_WINDOW_MS:.0f}ms) | score: {articulation_score:.1f}%", flush=True)

        # ── 3. ACCURACY ──────────────────────────────────────────────────────
        accuracy_score = round((timing_score + articulation_score) / 2, 1)

        # ── 4. FEEDBACK ──────────────────────────────────────────────────────
        def make_feedback(t, a, acc):
            issues = []
            if t < 70: issues.append("travaille le rythme")
            if a < 70: issues.append("soigne l'articulation")
            if acc >= 90: return "Excellent ! Très proche de la référence."
            elif acc >= 75: return "Bien joué" + (f" — {', '.join(issues)}." if issues else ".")
            elif acc >= 55: return "En progrès" + (f" — {', '.join(issues)}." if issues else ".")
            else: return "Continue à pratiquer" + (f" — {', '.join(issues)}." if issues else ".")

        return CompareResponse(
            timing=round(timing_score, 1),
            articulation=round(articulation_score, 1),
            accuracy=accuracy_score,
            exercise_name=exercise_name,
            feedback=make_feedback(timing_score, articulation_score, accuracy_score)
        )

    except Exception as e:
        import traceback
        print(f"[ERROR] {traceback.format_exc()}", flush=True)
        raise HTTPException(status_code=500, detail=f"Audio comparison failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
