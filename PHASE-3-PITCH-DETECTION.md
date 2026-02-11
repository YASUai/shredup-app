# PHASE 3 - PITCH DETECTION IMPLEMENTATION

**Status:** Desktop Validated  
**Date:** 2026-02-11  
**Branch:** `phase-3-pitch-detection`  
**NOT MERGED TO MAIN**

---

## 1. Architecture Overview

### 1.1 Pipeline Structure

```
AudioWorklet (512 samples)
    ↓
Frame Buffer (FIFO, max 100 frames)
    ↓
Pitch Detection Consumer
    ├── Accumulates 4 frames → 2048 samples
    ├── 50% overlap (hop 1024 samples)
    └── FFT-based autocorrelation
    ↓
Console Output: Frequency (Hz) + Confidence (0-1)
```

### 1.2 Module Separation

**Phase 2A Modules (UNCHANGED):**
- `audio-capture.js` - Web Audio API capture
- `audio-worklet.js` - AudioWorklet processor (512 samples)
- `frame-buffer.js` - FIFO buffer (max 100 frames)
- `timing-sync.js` - Clock synchronization
- `metronome-adapter.js` - BLACK BOX metronome interface
- `debug-logger.js` - Structured logging

**Phase 3 Modules (NEW):**
- `dsp/fft.js` - Radix-2 FFT implementation (MIT License, 3.6 KB)
- `dsp/pitch-detection.js` - Autocorrelation pitch detector (9.4 KB)
- `audio-engine-phase3.js` - Consumer loop orchestrator (9.1 KB)

### 1.3 Frame Accumulation Strategy

**AudioWorklet Frame:**
- Size: 512 samples
- Duration: 10.67 ms @ 48 kHz
- Rate: 93.75 frames/sec

**DSP Window:**
- Size: 2048 samples (4 frames)
- Duration: 42.67 ms @ 48 kHz
- Hop: 1024 samples (2 frames)
- Overlap: 50%
- Update Rate: 46.88 Hz

**Buffer Logic:**
- Process only when ≥ 4 contiguous frames available
- Advance by 2 frames after processing
- Skip cycle if insufficient frames
- No frame recovery on drops
- No blocking behavior

---

## 2. DSP Configuration

### 2.1 Window Parameters

| Parameter | Value | Justification |
|-----------|-------|---------------|
| **Window Size** | 2048 samples | 3.51 periods for E2 (82.41 Hz); adequate frequency resolution (23.44 Hz) |
| **Hop Size** | 1024 samples | 50% overlap; balance between latency and stability |
| **Window Function** | Hann | Standard for pitch detection; smooth spectral leakage reduction |
| **Sample Rate** | 48000 Hz | AudioContext default; no resampling overhead |

### 2.2 Frequency Range

- **Minimum:** 73 Hz (≈ D2, lowest guitar note with margin)
- **Maximum:** 1200 Hz (≈ D6, high guitar range + harmonics)
- **Target Range:** E2 (82.41 Hz) to E4 (329.63 Hz) - standard guitar tuning

### 2.3 Autocorrelation Parameters

```javascript
minLag = floor(SAMPLE_RATE / MAX_FREQUENCY) = floor(48000 / 1200) = 40 samples
maxLag = floor(SAMPLE_RATE / MIN_FREQUENCY) = floor(48000 / 73) = 657 samples
```

**Search Range:** 40–657 samples  
**Method:** FFT-based autocorrelation (O(N log N) complexity)  
**Peak Detection:** Maximum value in autocorrelation function (lag > minLag)

### 2.4 Latency Breakdown

| Component | Duration | Notes |
|-----------|----------|-------|
| **AudioWorklet Frame** | 10.67 ms | Hardware buffer (512 samples) |
| **Frame Accumulation** | 21.33 ms | Wait for 2 additional frames (1024 samples) |
| **Window Duration** | 42.67 ms | Full 2048-sample window |
| **Processing Time** | 0.17 ms | Average FFT + autocorrelation time |
| **Total Latency** | ~55–60 ms | Acceptable for practice tool |

---

## 3. Measured Performance (Desktop Validation)

### 3.1 Test Environment

**Hardware:** Sandbox Environment (Desktop-class CPU)  
**Browser:** Chrome (latest)  
**Test Duration:** ~6 seconds  
**Input:** Ambient noise (no guitar input)

### 3.2 Processing Metrics

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| **Avg Processing Time** | 0.17 ms | < 15 ms | ✅ PASS (88× margin) |
| **Max Processing Time** | 1.00 ms | < 15 ms | ✅ PASS (15× margin) |
| **Frame Duration** | 21.33 ms | N/A | Reference |
| **CPU Usage (avg)** | 0.8% | N/A | Per window |
| **CPU Usage (max)** | 4.7% | N/A | Peak |

### 3.3 Buffer Health

| Metric | Value | Notes |
|--------|-------|-------|
| **Frames Processed** | 576 | ~6 seconds of audio |
| **Frames Dropped** | 0 | 0.00% drop rate |
| **Pitch Windows** | 164 | ~3.5 frames per window |
| **Buffer Overflows** | 0 | No queue saturation |
| **Buffer Underflows** | 0 | No starvation events |

### 3.4 Frequency Detection

**Sample Outputs (Ambient Noise):**
```
Frame 516 | 750.0 Hz | Conf: 0.68 | Proc: 0.1ms
Frame 520 | 300.0 Hz | Conf: 0.71 | Proc: 0.2ms
Frame 524 | 750.0 Hz | Conf: 0.68 | Proc: 0.1ms
Frame 528 | 136.0 Hz | Conf: 0.72 | Proc: 0.1ms
```

**Observations:**
- Frequency Range Detected: 125–750 Hz
- Confidence Range: 0.51–0.72
- No systematic failures or crashes
- **NOTE:** Ambient noise is not musical; guitar validation required

---

## 4. Current Limitations

### 4.1 No Harmonic Rejection

**Problem:** Autocorrelation detects harmonic peaks as strongly as fundamental frequency.

**Example:**
- Fundamental: 150 Hz (≈ D3)
- 2nd Harmonic: 300 Hz (detected as 300 Hz, not 150 Hz)
- 5th Harmonic: 750 Hz (detected as 750 Hz, not 150 Hz)

**Impact:** Octave errors common; unreliable for musical mapping.

**Not Implemented:**
- Harmonic Product Spectrum (HPS)
- Cepstral analysis
- Subharmonic summation

### 4.2 No Octave Correction

**Problem:** No logic to choose between fundamental and harmonics.

**Example:**
- Input: E2 (82.41 Hz)
- May detect: E3 (164.82 Hz), E4 (329.63 Hz), or E5 (659.26 Hz)

**Impact:** Unreliable for tuning or scoring applications.

### 4.3 No Temporal Smoothing

**Problem:** Frame-to-frame frequency jumps not filtered.

**Example:**
```
Frame 100 | 440 Hz
Frame 101 | 880 Hz  ← Octave jump
Frame 102 | 220 Hz  ← Sub-octave jump
```

**Impact:** Jittery output; difficult to extract stable pitch.

**Not Implemented:**
- Median filter
- Kalman filter
- Exponential moving average
- Hysteresis logic

### 4.4 No Musical Mapping

**Current Output:** Raw frequency (Hz) + confidence (0-1)

**NOT Implemented:**
- Note name conversion (e.g., 440 Hz → "A4")
- Cents deviation (e.g., 445 Hz → "A4 +19¢")
- Musical context (key, scale, chord)
- MIDI note number

**Impact:** Console logs only; no user-facing pitch display.

### 4.5 No Confidence Thresholding

**Problem:** Low-confidence detections reported without filtering.

**Example:**
```
Frame 560 | 136.8 Hz | Conf: 0.57  ← Marginal confidence
Frame 564 | 125.0 Hz | Conf: 0.51  ← Low confidence
```

**Impact:** Noise may be reported as pitch.

**Not Implemented:**
- Minimum confidence threshold (e.g., 0.7)
- Silence detection
- Noise gate

---

## 5. Known Risks

### 5.1 Harmonic Dominance

**Risk Level:** HIGH

**Description:** Harmonics often stronger than fundamental in guitar signals, especially for low strings (E2, A2).

**Scenario:**
- Play low E2 (82.41 Hz)
- System detects 2nd harmonic (164.82 Hz) → reports E3 instead of E2
- User sees incorrect note

**Mitigation Required (Phase 4):**
- Implement Harmonic Product Spectrum (HPS)
- Cepstral pitch refinement
- Test with real guitar input across all 6 strings

### 5.2 Octave Errors

**Risk Level:** HIGH

**Description:** Without octave correction, system may report pitch 1-2 octaves off.

**Scenario:**
- Play A2 (110 Hz)
- System detects A3 (220 Hz) or A4 (440 Hz)
- Scoring engine fails (wrong note detected)

**Mitigation Required (Phase 4):**
- Implement subharmonic verification
- Cross-check with expected note range
- Add octave preference heuristics

### 5.3 Confidence Instability

**Risk Level:** MODERATE

**Description:** Confidence varies wildly for same input (0.51–0.72 observed in ambient noise).

**Scenario:**
- User plays clean note
- Confidence fluctuates between 0.4 and 0.9
- System cannot determine "good" vs "bad" detection

**Mitigation Required (Phase 4):**
- Temporal smoothing of confidence
- Calibrate confidence threshold with real guitar input
- Distinguish silence vs low-confidence pitch

### 5.4 No Onset Alignment

**Risk Level:** MODERATE

**Description:** Pitch detection runs continuously; no alignment with note onsets.

**Scenario:**
- User plays note at t=0
- Pitch detection reports at t=55ms, t=76ms, t=97ms (arbitrary timing)
- Onset detection (Phase 4) not integrated yet

**Impact:** Cannot align pitch with timing for scoring.

### 5.5 Mobile CPU Risk

**Risk Level:** UNKNOWN (Not Tested)

**Description:** Desktop performance (0.17 ms) may not translate to mobile.

**Scenario:**
- Budget Android: 9× slower than desktop → 1.53 ms (still safe)
- But: Battery drain, thermal throttling, background suspension not tested

**Mitigation Required (Pre-Production):**
- Real device testing (iPhone 13, mid-range Android)
- Measure processing time on mobile hardware
- Implement adaptive frame size if needed (512 → 1024 → 2048)

---

## 6. Phase 4 Readiness

### 6.1 Prerequisites for Next Phase

**Before Phase 4 (Onset Detection + Pitch Stabilization):**

1. **Musical Accuracy Validation**
   - Test with real guitar input (6 strings, E2-E4 range)
   - Compare detected frequency vs tuner app
   - Measure octave error rate
   - Verify confidence thresholds

2. **Harmonic Suppression Decision**
   - Evaluate if HPS is required
   - Benchmark HPS CPU cost on desktop
   - Decide if cepstral analysis needed

3. **Mobile Device Testing**
   - Measure processing time on iPhone 13 / Android
   - Verify drop rate on mobile
   - Test battery impact (30 min session)

4. **Temporal Smoothing Strategy**
   - Define acceptable pitch jitter (e.g., ±5 Hz)
   - Choose filter type (median, Kalman, EMA)
   - Decide filter window size (3–10 frames)

### 6.2 Phase 4 Scope (Proposed)

**IF Phase 3 Validation Passes:**

1. **Harmonic Suppression**
   - Implement HPS (Harmonic Product Spectrum)
   - Add subharmonic verification
   - Test octave error rate reduction

2. **Pitch Stabilization**
   - Implement median filter (5-frame window)
   - Add hysteresis for frequency jumps
   - Smooth confidence values

3. **Onset Detection**
   - Implement energy-based onset detector
   - Align pitch output with note onsets
   - Create onset + pitch data stream

4. **Musical Mapping (Minimal)**
   - Convert Hz → Note Name (e.g., 440 Hz → "A4")
   - Calculate cents deviation
   - No UI yet (console logs only)

**NOT in Phase 4:**
- Scoring engine
- UI integration
- Practice mode logic
- Data persistence

### 6.3 Merge to Main Criteria

**Phase 3 will NOT be merged until:**

1. ✅ Musical accuracy validated with real guitar
2. ✅ Octave error rate < 5% on standard tuning
3. ✅ Mobile performance acceptable (< 5 ms avg on mid-range)
4. ✅ Phase 4 onset detection integrated
5. ✅ Temporal smoothing implemented

**Current Status:**
- ✅ Desktop performance validated (0.17 ms avg)
- ✅ Zero drops over 576 frames
- ❌ Musical accuracy NOT validated (no guitar input)
- ❌ Mobile performance UNKNOWN
- ❌ Harmonic suppression NOT implemented
- ❌ Onset alignment NOT implemented

---

## 7. File Structure

```
webapp/
├── public/static/audio-engine/
│   ├── audio-capture.js          (Phase 2A - unchanged)
│   ├── audio-worklet.js          (Phase 2A - unchanged)
│   ├── frame-buffer.js           (Phase 2A - unchanged)
│   ├── timing-sync.js            (Phase 2A - unchanged)
│   ├── metronome-adapter.js      (Phase 2A - unchanged)
│   ├── debug-logger.js           (Phase 2A - unchanged)
│   ├── audio-engine-phase3.js    (Phase 3 - NEW)
│   └── dsp/
│       ├── fft.js                (Phase 3 - NEW, MIT License)
│       └── pitch-detection.js    (Phase 3 - NEW)
├── src/
│   └── index.tsx                 (Route: /pitch-test added)
├── PHASE-2A-AUDIO-SCAFFOLDING.md (Phase 2A doc)
├── PHASE-3-SIGNAL-THEORY-VALIDATION.md (Phase 3 theory)
└── PHASE-3-PITCH-DETECTION.md    (This document)
```

---

## 8. Deployment Status

**Branch:** `phase-3-pitch-detection`  
**Sandbox URL:** https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai/pitch-test  
**Test Route:** `/pitch-test`  
**GitHub:** https://github.com/YASUai/shredup-app/tree/phase-3-pitch-detection  
**Main Branch:** NOT MERGED  

**Commits:**
```
35af8fe - fix(phase3): fix 'maxLag' redeclaration error
be0909b - fix(phase3): correct script loading order
bfefbd2 - feat(audio): Phase 3 - Pitch Detection Implementation
a03eafe - merge: integrate Phase 2A audio scaffolding into Phase 3 branch
```

---

## 9. Validation Checklist

### Desktop Performance
- [x] Average processing time < 15 ms
- [x] Max processing time < 15 ms
- [x] Drop rate acceptable (0.00%)
- [x] No crashes over 576 frames
- [x] Clean lifecycle (init → start → stop)

### Musical Accuracy (NOT TESTED)
- [ ] Real guitar input tested (E2, A2, D3, G3, B3, E4)
- [ ] Octave error rate measured
- [ ] Confidence threshold calibrated
- [ ] Comparison vs tuner app

### Mobile Performance (NOT TESTED)
- [ ] iPhone 13 processing time measured
- [ ] Mid-range Android processing time measured
- [ ] Battery impact tested (30 min session)
- [ ] Background suspension behavior verified

### Code Quality
- [x] MIT/BSD FFT implementation
- [x] No modifications to Phase 2A modules
- [x] Dependency order correct
- [x] No variable redeclaration errors
- [x] Console logging only (no UI)

---

## 10. Known Issues

### 10.1 Harmonic Peaks Detected as Fundamental

**Evidence from logs:**
```
Frame 516 | 750.0 Hz | Conf: 0.68  ← Likely 5th harmonic of 150 Hz
Frame 520 | 300.0 Hz | Conf: 0.71  ← Likely 2nd harmonic of 150 Hz
```

**Status:** Expected behavior; harmonic suppression not implemented.

### 10.2 Confidence Range Narrow

**Evidence from logs:**
- Range: 0.51–0.72 (ambient noise input)
- No detections below 0.50
- No detections above 0.75

**Status:** Requires calibration with real guitar input.

### 10.3 Frequency Jumps Not Smoothed

**Evidence from logs:**
```
Frame 516 | 750.0 Hz
Frame 520 | 300.0 Hz  ← 450 Hz jump (2.5× frequency change)
```

**Status:** Expected; temporal smoothing not implemented.

---

## Summary

**Phase 3 Status:** Desktop validated, musical accuracy UNKNOWN.

**Performance:** Excellent (0.17 ms avg, 0% drops).

**Limitations:** No harmonic suppression, no octave correction, no smoothing.

**Next Steps:** Musical validation with real guitar input before Phase 4.

**NOT MERGED TO MAIN.**

---

**End of Document**
