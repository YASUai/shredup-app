# PHASE 3 - MUSICAL VALIDATION PROTOCOL

**Status:** Ready for Testing  
**Date:** 2026-02-11  
**URL:** https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai/pitch-test

---

## OBJECTIVE

Quantify musical accuracy of Phase 3 FFT-based pitch detection algorithm.

Measure algorithm as-is. No modifications. Data collection only.

---

## TEST NOTES (STANDARD TUNING)

Test the following notes individually with clean guitar tone:

| String | Note | Frequency (Hz) |
|--------|------|----------------|
| 6 (Low E) | E2 | 82.41 |
| 5 | A2 | 110.00 |
| 4 | D3 | 146.83 |
| 3 | G3 | 196.00 |
| 2 | B3 | 246.94 |
| 1 (High E) | E4 | 329.63 |

---

## TEST PROCEDURE (PER NOTE)

### 1. Setup
1. Open test URL in Chrome/Firefox
2. F12 → Console
3. Click "Initialize Audio Engine"
4. Enter expected frequency in input field (e.g., `82.41` for E2)

### 2. Execute
1. Click "Start Pitch Detection"
2. Allow microphone access
3. Play note cleanly on guitar
4. Sustain for **5 seconds minimum**
5. Aim for **≥100 pitch windows** (check console)
6. Click "Stop Pitch Detection"

### 3. Record
Console will automatically output:

```
[VALIDATION SUMMARY]
════════════════════════════════════════
Expected:          82.41 Hz
Detected Avg:      83.12 Hz
Abs Error:         +0.71 Hz
Rel Error:         +0.86%
Std Dev:           1.8 Hz
Octave Errors:     3/120 (2.5%)
Avg Confidence:    0.81
Sample Count:      120 windows
Duration:          5.2s
════════════════════════════════════════
```

### 4. Reset
Click "Reset Statistics" before testing next note.

---

## VALIDATION METRICS

### Per-Detection Logs
```
[VALIDATION] Expected 82.41 Hz | Detected 83.50 Hz | Error +1.09 Hz (+1.32%)
[VALIDATION] Expected 82.41 Hz | Detected 164.82 Hz | Error +82.41 Hz (+100.00%) ⚠️ OCTAVE
```

### Octave Error Detection
System flags detection as octave error if detected frequency is:
- **0.25× expected** (2 octaves down, ±5% tolerance)
- **0.5× expected** (1 octave down, ±5% tolerance)
- **2.0× expected** (1 octave up, ±5% tolerance)
- **4.0× expected** (2 octaves up, ±5% tolerance)

---

## DATA COLLECTION TEMPLATE

Copy this template for each note tested:

```markdown
### E2 (82.41 Hz)
- **Detected Avg:** ___ Hz
- **Abs Error:** ___ Hz
- **Rel Error:** ___%
- **Std Dev:** ___ Hz
- **Octave Errors:** ___% (___/___ windows)
- **Avg Confidence:** ___
- **Sample Count:** ___ windows
- **Duration:** ___s
- **Notes:** (harmonic dominance, instability, etc.)

### A2 (110.00 Hz)
...
```

---

## EXPECTED OUTPUT

After testing all 6 strings, provide:

### 1. Per-Note Summary Table
| Note | Expected (Hz) | Detected (Hz) | Abs Error (Hz) | Rel Error (%) | Std Dev (Hz) | Octave Errors (%) | Avg Conf | Samples |
|------|---------------|---------------|----------------|---------------|--------------|-------------------|----------|---------|
| E2 | 82.41 | | | | | | | |
| A2 | 110.00 | | | | | | | |
| D3 | 146.83 | | | | | | | |
| G3 | 196.00 | | | | | | | |
| B3 | 246.94 | | | | | | | |
| E4 | 329.63 | | | | | | | |

### 2. Overall Metrics
- **Overall Octave Error Rate:** ___%
- **Overall Avg Relative Error:** ___%
- **Confidence Range:** ___ to ___
- **Observed Dominant Failure Mode:** (harmonic dominance, octave errors, instability, etc.)

### 3. Qualitative Observations
- Specific failure patterns (e.g., "E2 always detected as E3")
- Confidence stability
- Frequency jitter
- Onset behavior
- Sustain stability

---

## CONSTRAINTS

**DO NOT:**
- Modify pitch detection algorithm
- Add smoothing
- Add harmonic suppression
- Change DSP parameters
- Optimize performance
- Polish UI

**ONLY:**
- Measure algorithm as-is
- Collect raw data
- Report findings

---

## VALIDATION COMPLETION CRITERIA

Report back only when:
- ✅ All 6 strings tested
- ✅ Each note sustained ≥5 seconds
- ✅ Each note captured ≥100 windows
- ✅ Per-note summary table completed
- ✅ Overall metrics calculated
- ✅ Dominant failure mode identified

---

**Status:** Awaiting guitar input validation data.

**No recommendations. Data only.**
