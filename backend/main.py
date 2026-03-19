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
    timing: float       # 0-100 : per-note deviation vs reference
    articulation: float # 0-100 : % of reference notes detected in recording
    accuracy: float     # 0-100 : mean(timing, articulation)
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
    Reference-based comparison:
      - Timing    : per-note deviation between recording onsets and aligned reference onsets
      - Articulation : coverage — fraction of reference notes detected in recording
    """
    try:
        import librosa
        import numpy as np

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

        # ── Low-pass filter for recording only ────────────────────────────────
        # Metronome clicks use ~1200-1800 Hz sine tones; guitar/bass fundamentals
        # are mostly below 1000 Hz.  Filtering removes click transients from the
        # recording's onset detection WITHOUT touching the reference (which has no
        # clicks).  We keep y_rec intact for any other use.
        try:
            from scipy import signal as scipy_signal
            cutoff_hz = 1000.0
            nyq = sr / 2.0
            b, a = scipy_signal.butter(4, cutoff_hz / nyq, btype='low')
            y_rec_lp = scipy_signal.filtfilt(b, a, y_rec)
            print(f"[FILTER] Low-pass {cutoff_hz:.0f}Hz applied to recording (sr={sr})", flush=True)
        except Exception as _fe:
            y_rec_lp = y_rec
            print(f"[FILTER] Low-pass unavailable: {_fe}", flush=True)

        hop_length  = 256                                        # 11.6ms resolution at 22050Hz (was 512=23.2ms)
        cluster_gap = min(0.05, (60.0 / max(bpm, 60)) / 8)   # ≤ 50ms, ≤ ½ 16th note
        peak_win    = max(2, int(sr * 0.09 / hop_length))      # 90ms window

        # ── Shared onset pipeline ──────────────────────────────────────────────
        def get_onsets(y):
            # Restrict spectral flux to 0-1000 Hz band to further suppress clicks
            n_fft   = 2048
            fmax_hz = 1000.0
            fmax_bin = int(np.round(fmax_hz * n_fft / sr)) + 1
            S = np.abs(librosa.stft(y, n_fft=n_fft, hop_length=hop_length))
            S_low = S[:fmax_bin, :]
            env = librosa.onset.onset_strength(S=librosa.amplitude_to_db(S_low, ref=np.max),
                                               sr=sr, hop_length=hop_length)

            raw = librosa.onset.onset_detect(
                y=y, sr=sr, units='time',
                onset_envelope=env, backtrack=True,
                pre_max=3, post_max=3, pre_avg=3, post_avg=5,
                delta=0.07, wait=4
            )

            # Cluster nearby onsets
            if len(raw) == 0:
                return np.array([]), env
            clusters = [[raw[0]]]
            for t in raw[1:]:
                if t - clusters[-1][-1] < cluster_gap:
                    clusters[-1].append(t)
                else:
                    clusters.append([t])
            times_c = np.array([float(np.mean(c)) for c in clusters])

            # Measure onset strength at each onset
            frames = np.clip(
                librosa.time_to_frames(times_c, sr=sr, hop_length=hop_length),
                0, len(env) - 1
            ).astype(int)
            strengths = np.array([
                float(np.max(env[f:min(len(env), f + peak_win)])) if f < len(env) else 0.0
                for f in frames
            ])

            # Filter false-positives: noise + 0.3 × IQR of onset strengths
            env_noise = float(np.percentile(env, 10))
            iqr = float(np.percentile(strengths, 75) - np.percentile(strengths, 25)) \
                  if len(strengths) >= 4 else 0.5
            thresh = env_noise + 0.3 * max(iqr, 0.1)
            mask = strengths >= thresh

            return times_c[mask], env

        onset_times_ref, onset_env_ref = get_onsets(y_ref)
        onset_times_rec, onset_env_rec = get_onsets(y_rec_lp)

        print(f"[INPUT] bpm={bpm:.1f} exercise='{exercise_name}'", flush=True)
        print(f"[DETECT] ref={len(onset_times_ref)}, rec={len(onset_times_rec)}", flush=True)

        # ── Temporal alignment: first-note anchor (no cross-correlation) ─────────
        # The recording always starts with a 2-measure (8-beat) countdown at the
        # chosen BPM, then the exercise begins.  We find the first recording onset
        # that falls AFTER the countdown ends and align it to the first reference note.
        # This is deterministic and immune to false correlation peaks caused by the
        # countdown clicks having the same BPM as the exercise.
        beat_s      = 60.0 / max(bpm, 40)
        countdown_s = 8.0 * beat_s          # 2 measures × 4 beats

        # Allow the user to start up to 2 beats early (slight anticipation)
        search_from = max(0.0, countdown_s - 2.0 * beat_s)

        offset = countdown_s               # fallback: nominal countdown duration
        onset_times_ref_aligned = onset_times_ref.copy()

        if len(onset_times_ref) > 0 and len(onset_times_rec) > 0:
            rec_post = onset_times_rec[onset_times_rec >= search_from]
            if len(rec_post) > 0:
                # Initial estimate from first note
                initial_offset = float(rec_post[0]) - float(onset_times_ref[0])

                # Refine: median over first min(8, N) anchor pairs
                # Each reference note is matched to its nearest recording note
                # near the expected position → reduces single-note detection noise
                refined = []
                for i in range(min(8, len(onset_times_ref))):
                    expected = float(onset_times_ref[i]) + initial_offset
                    nearby = onset_times_rec[np.abs(onset_times_rec - expected) < beat_s * 0.5]
                    if len(nearby) > 0:
                        nearest = float(nearby[np.argmin(np.abs(nearby - expected))])
                        refined.append(nearest - float(onset_times_ref[i]))

                offset = float(np.median(refined)) if refined else initial_offset
                onset_times_ref_aligned = onset_times_ref + offset

        print(f"[ALIGN] countdown={countdown_s:.2f}s | offset={offset:.3f}s | "
              f"ref[0]→{float(onset_times_ref_aligned[0]) if len(onset_times_ref_aligned)>0 else '?':.3f}s "
              f"| rec_post[0]={float(onset_times_rec[onset_times_rec>=search_from][0]) if len(onset_times_rec[onset_times_rec>=search_from])>0 else '?':.3f}s",
              flush=True)

        # ── 1. TIMING — per-note deviation from aligned reference ─────────────
        # Gaussian: 5ms→99%  10ms→97%  20ms→88%  30ms→75%  40ms→60%  60ms→30%
        # sigma=40ms accounts for hop_length=256 quantization (11.6ms) + human natural spread
        SIGMA_MS  = 40.0
        timing_score = 50.0   # default if no data

        if len(onset_times_ref_aligned) > 0 and len(onset_times_rec) > 0:
            t_scores = []
            for ref_t in onset_times_ref_aligned:
                diffs_ms = np.abs(onset_times_rec - ref_t) * 1000
                min_diff = float(np.min(diffs_ms))
                t_scores.append(100.0 * float(np.exp(-(min_diff ** 2) / (2 * SIGMA_MS ** 2))))
            timing_score = float(np.mean(t_scores))

            devs = [
                round(float(np.min(np.abs(onset_times_rec - ref_t) * 1000)), 1)
                for ref_t in onset_times_ref_aligned[:8]
            ]
            print(f"[TIMING] {len(onset_times_ref_aligned)} ref notes | "
                  f"devs(ms): {devs} | score: {timing_score:.1f}%", flush=True)

        elif len(onset_times_rec) >= 2 and bpm > 0:
            # Fallback: IOI method (no reference available)
            beat_s       = 60.0 / bpm
            subdivisions = [1/6, 1/4, 1/3, 1/2, 2/3, 3/4, 1, 3/2, 2, 3, 4]
            iois         = np.diff(onset_times_rec)
            f_scores     = []
            for ioi in iois:
                min_dev = min(abs(ioi - s * beat_s) * 1000 for s in subdivisions)
                f_scores.append(100.0 * float(np.exp(-(min_dev ** 2) / (2 * SIGMA_MS ** 2))))
            timing_score = float(np.mean(f_scores))
            print(f"[TIMING][IOI-fallback] score: {timing_score:.1f}%", flush=True)

        # ── 2. ARTICULATION — note coverage ───────────────────────────────────
        # "Did you play every note in the reference?"
        # Each reference note is matched if a recording onset falls within ±WINDOW_MS.
        # A perfectly articulated performance → 100 %.
        # Missing / inaudible notes lower the score proportionally.
        MATCH_WINDOW_MS = min(80.0, (60.0 / bpm) * 1000 / 3)   # ≤ 80 ms, ≤ ⅓ beat

        matched = 0
        if len(onset_times_ref_aligned) > 0 and len(onset_times_rec) > 0:
            matched = sum(
                1 for ref_t in onset_times_ref_aligned
                if float(np.min(np.abs(onset_times_rec - ref_t) * 1000)) <= MATCH_WINDOW_MS
            )
            articulation_score = float(matched / len(onset_times_ref_aligned) * 100)
        elif len(onset_times_rec) > 0:
            articulation_score = 75.0   # no reference — neutral
        else:
            articulation_score = 0.0

        print(f"[ARTICU] {matched}/{len(onset_times_ref_aligned)} ref notes matched "
              f"(window={MATCH_WINDOW_MS:.0f}ms) | score: {articulation_score:.1f}%", flush=True)

        # ── 3. ACCURACY ───────────────────────────────────────────────────────
        accuracy_score = round((timing_score + articulation_score) / 2, 1)

        # ── 4. FEEDBACK ───────────────────────────────────────────────────────
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
        raise HTTPException(status_code=500, detail=f"Audio comparison failed: {str(e)}")


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
