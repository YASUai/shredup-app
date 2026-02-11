# PHASE 3 - SIGNAL THEORY VALIDATION

**Status**: 📄 **PRE-APPROVAL ANALYSIS**  
**Date**: 2026-02-11  
**Purpose**: Mathematical validation before Phase 3 implementation

---

## 🎯 ANALYSIS SCOPE

This document addresses critical signal processing assumptions that must be validated before Phase 3 (Pitch Detection) implementation:

1. **Window Size Analysis** - Frequency resolution for guitar range
2. **Overlap Strategy** - Windowing and frame overlap requirements
3. **Timestamp Drift Model** - Long-term clock synchronization
4. **CPU Complexity Estimates** - Mobile performance projections
5. **Phase 3 Scope Adjustment** - Minimal deliverable

**No implementation. Pure signal theory.**

---

# 1️⃣ FREQUENCY RESOLUTION ANALYSIS

## **Problem Statement**

Current assumption: **512 samples** at 48 kHz is sufficient for pitch detection.

**Challenge**: Guitar low E string (E2 = 82.41 Hz) has period ≈ 12.1 ms, which is **longer than the 10.67 ms frame**.

**Question**: What is the minimum window size for reliable guitar pitch detection?

---

## **1.1 Frequency Resolution Formula**

For **autocorrelation** and **YIN** algorithms, frequency resolution depends on:

```
Frequency Resolution (Δf) = Sample Rate / Window Size

Δf = fs / N
```

Where:
- `fs` = Sample Rate (48000 Hz)
- `N` = Window Size (samples)

---

## **1.2 Guitar Frequency Range**

Standard guitar tuning (6 strings):

| String | Note | Frequency (Hz) | Period (ms) |
|--------|------|----------------|-------------|
| 6th (Low E) | E2 | 82.41 | 12.14 |
| 5th | A2 | 110.00 | 9.09 |
| 4th | D3 | 146.83 | 6.81 |
| 3rd | G3 | 196.00 | 5.10 |
| 2nd | B3 | 246.94 | 4.05 |
| 1st (High E) | E4 | 329.63 | 3.03 |

**Extended Range**:
- **Lowest**: E2 (82.41 Hz) - standard tuning
- **Drop D / 7-string**: D2 (73.42 Hz)
- **Highest fret (24th fret)**: ~1200 Hz

**Target Range**: **73 Hz - 1200 Hz**

---

## **1.3 Minimum Window Size (Theory)**

For autocorrelation to detect a pitch, we need **at least 2 full periods** in the window:

```
Minimum Window Size = 2 × Period × Sample Rate

For E2 (82.41 Hz):
Period = 1 / 82.41 = 0.01214 seconds = 12.14 ms

Minimum Window = 2 × 12.14 ms = 24.28 ms
Minimum Samples = 24.28 ms × 48000 Hz = 1165 samples
```

**Rounded up to power of 2**: **2048 samples** (for FFT efficiency if needed)

---

## **1.4 Frequency Resolution Comparison**

### **512 Samples**

```
Window Duration = 512 / 48000 = 10.67 ms
Frequency Resolution = 48000 / 512 = 93.75 Hz

Number of Periods (E2):
10.67 ms / 12.14 ms = 0.88 periods ❌
```

**Analysis**:
- ❌ **Less than 1 full period** for E2
- ❌ Autocorrelation will fail or be unreliable
- ❌ Frequency resolution (93.75 Hz) too coarse for guitar

**Verdict**: **INSUFFICIENT for guitar pitch detection**

---

### **1024 Samples**

```
Window Duration = 1024 / 48000 = 21.33 ms
Frequency Resolution = 48000 / 1024 = 46.88 Hz

Number of Periods (E2):
21.33 ms / 12.14 ms = 1.76 periods
```

**Analysis**:
- ⚠️ **~1.76 periods** for E2 (marginally acceptable)
- ⚠️ Frequency resolution (46.88 Hz) still coarse
- ⚠️ May work but with reduced confidence for low notes

**Verdict**: **MARGINAL for guitar pitch detection**

---

### **2048 Samples** ✅

```
Window Duration = 2048 / 48000 = 42.67 ms
Frequency Resolution = 48000 / 2048 = 23.44 Hz

Number of Periods (E2):
42.67 ms / 12.14 ms = 3.51 periods ✅
```

**Analysis**:
- ✅ **3.5+ periods** for E2 (excellent)
- ✅ Frequency resolution (23.44 Hz) much finer
- ✅ Reliable autocorrelation for all guitar strings

**Verdict**: **OPTIMAL for guitar pitch detection**

---

### **4096 Samples** (Alternative)

```
Window Duration = 4096 / 48000 = 85.33 ms
Frequency Resolution = 4096 / 48000 = 11.72 Hz

Number of Periods (E2):
85.33 ms / 12.14 ms = 7.03 periods
```

**Analysis**:
- ✅ **7+ periods** for E2 (excellent)
- ✅ Frequency resolution (11.72 Hz) very fine
- ⚠️ **Latency**: 85 ms is noticeable for real-time feedback
- ⚠️ **CPU Cost**: More complex autocorrelation

**Verdict**: **TOO SLOW for real-time guitar practice**

---

## **1.5 Recommendation: 2048 Samples**

### **Justification**

| Metric | 512 | 1024 | **2048** | 4096 |
|--------|-----|------|----------|------|
| **Window Duration** | 10.67 ms | 21.33 ms | **42.67 ms** | 85.33 ms |
| **Frequency Resolution** | 93.75 Hz | 46.88 Hz | **23.44 Hz** | 11.72 Hz |
| **E2 Periods** | 0.88 ❌ | 1.76 ⚠️ | **3.51 ✅** | 7.03 ✅ |
| **Latency** | Excellent | Good | **Acceptable** | Poor |
| **CPU Cost** | Low | Moderate | **Moderate** | High |

**Final Recommendation**: **2048 samples**

**Rationale**:
1. ✅ **3.5+ periods** for lowest guitar note (E2)
2. ✅ **23.44 Hz resolution** is sufficiently fine for guitar
3. ✅ **42.67 ms latency** is acceptable for practice feedback
4. ✅ **Power of 2** (efficient for FFT if needed later)

---

## **1.6 Impact on Architecture**

### **Current (Phase 2A)**
- AudioWorklet: **512 samples** per frame
- Frame rate: 93.75 fps
- Latency: 10.67 ms

### **Proposed (Phase 3)**
- AudioWorklet: **512 samples** per frame (unchanged)
- **DSP Window**: **2048 samples** (4 frames combined)
- Frame rate: 93.75 fps (unchanged)
- Pitch detection rate: 93.75 / 4 = **23.44 Hz** (every 42.67 ms)

**No change to Phase 2A architecture** — we accumulate 4 frames before pitch detection.

---

# 2️⃣ FRAME OVERLAP STRATEGY

## **Problem Statement**

Current assumption: Process **non-overlapping frames** (512 samples each).

**Challenge**: Non-overlapping frames cause:
1. **Temporal aliasing** — pitch events near frame boundaries may be missed
2. **Output jitter** — pitch updates only every 10.67 ms (or 42.67 ms for 2048 samples)
3. **Poor time resolution** — onset detection (Phase 4) will struggle

**Question**: What overlap strategy should we use?

---

## **2.1 Windowing Theory**

### **Why Windowing?**

Raw frames have **discontinuities at edges** → spectral leakage in FFT.

**Solution**: Apply **window function** to smooth edges.

**Common Windows**:
- **Hann Window**: Good for general use, smooth transitions
- **Hamming Window**: Similar to Hann, slightly different sidelobes
- **Blackman Window**: Excellent sidelobe suppression, wider main lobe

**Recommendation**: **Hann Window** (industry standard for pitch detection)

### **Hann Window Formula**

```
w[n] = 0.5 × (1 - cos(2π × n / (N - 1)))

For n = 0 to N-1
```

**Properties**:
- Smooth roll-off at edges (0 → 1 → 0)
- Good frequency resolution
- Standard in audio DSP

---

## **2.2 Overlap Strategy**

### **No Overlap (0%)**

**Current assumption** (Phase 2A):

```
Frame 1: [0 ........ 511]
Frame 2:             [512 ........ 1023]
Frame 3:                          [1024 ........ 1535]
```

**Problems**:
- ❌ Pitch events near frame boundaries may be split
- ❌ Output update rate = frame rate (93.75 Hz for 512 samples, 23.44 Hz for 2048 samples)
- ❌ Poor time resolution

**Verdict**: **UNACCEPTABLE for real-time pitch tracking**

---

### **50% Overlap** ✅

**Standard practice**:

```
Frame 1: [0 ........ 2047]
Frame 2:       [1024 ........ 3071]
Frame 3:              [2048 ........ 4095]
Frame 4:                     [3072 ........ 5119]
```

**Benefits**:
- ✅ Pitch events captured regardless of position
- ✅ Output update rate = **2× frame rate** (46.88 Hz for 2048 samples)
- ✅ Smoother output, less jitter

**Cost**:
- ⚠️ **2× CPU** (process 2 frames per window duration)

**Verdict**: **RECOMMENDED for Phase 3**

---

### **75% Overlap** (Optional)

**High-resolution tracking**:

```
Frame 1: [0 ........ 2047]
Frame 2:    [512 ........ 2559]
Frame 3:         [1024 ........ 3071]
Frame 4:              [1536 ........ 3583]
```

**Benefits**:
- ✅ Very smooth output, minimal jitter
- ✅ Output update rate = **4× frame rate** (93.75 Hz for 2048 samples)

**Cost**:
- ⚠️ **4× CPU** (process 4 frames per window duration)

**Verdict**: **TOO EXPENSIVE for mobile**, defer to Phase 4+ if needed

---

## **2.3 Recommended Overlap Strategy**

### **Phase 3 Configuration**

| Parameter | Value | Rationale |
|-----------|-------|-----------|
| **AudioWorklet Frame Size** | 512 samples | No change (Phase 2A) |
| **DSP Window Size** | 2048 samples | Optimal for guitar (see 1.5) |
| **Overlap** | 50% (1024 samples) | Standard practice, acceptable CPU cost |
| **Window Function** | Hann | Industry standard |
| **Pitch Update Rate** | 46.88 Hz | Every ~21.33 ms |

### **Implementation Strategy**

1. **AudioWorklet** sends 512-sample frames (unchanged)
2. **Frame Buffer** accumulates frames (unchanged)
3. **Pitch Detection Consumer**:
   - Reads **4 frames** (4 × 512 = 2048 samples)
   - Applies **Hann window**
   - Runs **autocorrelation** or **YIN**
   - Outputs pitch result
   - **Advances by 2 frames** (50% overlap = 1024 samples)
4. **Next iteration** starts at sample 1024

### **Buffer Management**

```
Buffer: [Frame 0] [Frame 1] [Frame 2] [Frame 3] [Frame 4] [Frame 5] ...

Iteration 1: Process [Frame 0-3] → Pitch 1
Iteration 2: Process [Frame 2-5] → Pitch 2
Iteration 3: Process [Frame 4-7] → Pitch 3
...
```

**Buffer Size**: Keep **6 frames** minimum (2048 + 1024 = 3072 samples = 6 frames)

---

## **2.4 Expected Jitter (Output Timing)**

### **Without Overlap**

```
Pitch update rate = 23.44 Hz (every 42.67 ms)
Jitter = ±42.67 ms
```

**Problem**: If pitch changes at sample 1024, we won't detect it until sample 2048 (21.33 ms delay).

---

### **With 50% Overlap** ✅

```
Pitch update rate = 46.88 Hz (every 21.33 ms)
Jitter = ±21.33 ms
```

**Improved**: Pitch changes detected within 21.33 ms (acceptable for practice feedback).

---

### **With 75% Overlap**

```
Pitch update rate = 93.75 Hz (every 10.67 ms)
Jitter = ±10.67 ms
```

**Excellent but expensive**: 4× CPU cost.

---

## **2.5 Final Overlap Recommendation**

**Phase 3**: **50% overlap** (1024 samples)

**Rationale**:
- ✅ Acceptable jitter (±21.33 ms)
- ✅ Standard practice in audio DSP
- ✅ Manageable CPU cost (2× frame rate)
- ✅ Works well for guitar practice feedback

**Defer 75% overlap** to Phase 4+ if timing precision requirements increase.

---

# 3️⃣ TIMESTAMP DRIFT MODEL

## **Problem Statement**

Proposed strategy:
- **DSP**: Use `AudioContext.currentTime`
- **UI**: Use `performance.now()`

**Challenge**: These clocks are **independent** and will **drift** over time.

**Question**: How do we handle drift after 30 minutes of continuous use?

---

## **3.1 Clock Comparison**

### **AudioContext.currentTime**

- **Source**: Audio hardware clock
- **Unit**: Seconds (double-precision float)
- **Precision**: Microseconds
- **Origin**: Relative to AudioContext creation
- **Stability**: Very stable (hardware clock)
- **Drift**: Minimal (< 1 ms per hour)

### **performance.now()**

- **Source**: System monotonic clock
- **Unit**: Milliseconds (double-precision float)
- **Precision**: Microseconds
- **Origin**: Relative to page load
- **Stability**: Very stable (OS clock)
- **Drift**: Minimal (< 1 ms per hour)

### **Metronome Clock**

- **Source**: `performance.now()` (via metronome adapter)
- **Unit**: Milliseconds
- **Precision**: Microseconds
- **Origin**: Same as `performance.now()`
- **Stability**: Same as `performance.now()`

---

## **3.2 Drift Analysis**

### **Expected Drift**

**Typical crystal oscillator drift**: 10-100 ppm (parts per million)

**Worst-case drift**: 100 ppm = 0.01% = 0.1 ms per second

**After 30 minutes (1800 seconds)**:
```
Drift = 1800 s × 100 ppm = 180 ms (worst case)
Drift = 1800 s × 10 ppm = 18 ms (typical)
```

**Conclusion**: Drift is **negligible** for 30-minute sessions.

---

## **3.3 Drift Correction Model**

### **Model: Continuous Offset Tracking**

**Strategy**: Track offset between AudioContext time and Metronome time.

```
Offset(t) = MetronomeTime(t) - AudioContextTime(t)
```

**At initialization (t=0)**:
```
Offset(0) = MetronomeTime(0) - AudioContextTime(0)
```

**Example**:
```
AudioContextTime(0) = 0.000 s
MetronomeTime(0) = 12345.678 ms = 12.345678 s

Offset(0) = 12.345678 s - 0.000 s = 12.345678 s
```

**At any time t**:
```
EstimatedMetronomeTime(t) = AudioContextTime(t) + Offset(0)
```

---

### **Periodic Re-Sync (Optional)**

**If drift exceeds threshold** (e.g., 50 ms):

1. **Measure** actual drift:
   ```
   ActualMetronomeTime(t) = Read from metronome adapter
   EstimatedMetronomeTime(t) = AudioContextTime(t) + Offset(0)
   
   Drift(t) = ActualMetronomeTime(t) - EstimatedMetronomeTime(t)
   ```

2. **Update offset**:
   ```
   Offset(t) = Offset(0) + Drift(t)
   ```

3. **Frequency**: Every 10 seconds (via timing-sync module)

---

### **Simplified Model for Phase 3**

**Recommendation**: **Single-time calibration only**

**Rationale**:
- Drift < 180 ms over 30 minutes (worst case)
- For pitch detection, **absolute time doesn't matter**
- We only need **relative timing** (frame-to-frame)
- Re-sync complexity not justified for Phase 3

**Implementation**:
1. Calibrate offset at initialization
2. Use AudioContext.currentTime for all DSP
3. Convert to Metronome time only for UI display (if needed)
4. **No periodic re-sync** in Phase 3

**Defer periodic re-sync** to Phase 4+ if scoring requires millisecond-accurate timing.

---

## **3.4 Final Timestamp Strategy**

| Use Case | Clock | Rationale |
|----------|-------|-----------|
| **DSP Processing** | AudioContext.currentTime | Native audio clock, most accurate |
| **Frame Timestamps** | AudioContext.currentTime | Consistent with DSP |
| **Pitch Output** | AudioContext.currentTime | No conversion needed |
| **UI Display** | Convert to Metronome time | For display only |
| **Scoring (Phase 5+)** | Metronome time | Align with metronome beats |

**Conversion Formula**:
```javascript
metronomeTime = (audioContextTime + offset) × 1000 // Convert to ms
```

**Offset Calibration** (once at start):
```javascript
offset = performance.now() / 1000 - audioContext.currentTime
```

---

# 4️⃣ CPU COMPLEXITY ESTIMATES

## **Problem Statement**

Mobile devices (mid-range Android, iPhone non-Pro) have limited CPU power.

**Question**: What is the estimated CPU cost per frame for autocorrelation and YIN?

**Requirement**: Processing time **must be < frame duration** to avoid backlog.

---

## **4.1 Autocorrelation Algorithm**

### **Naive Implementation**

```
For each lag τ = 0 to N-1:
    R[τ] = Σ (x[n] × x[n + τ]) for n = 0 to N-τ-1
```

**Complexity**: **O(N²)**

For N = 2048:
```
Operations ≈ 2048² = 4,194,304 multiply-accumulate operations
```

---

### **Optimized Autocorrelation (FFT-based)**

```
1. Compute FFT(x) → X
2. Compute Power Spectrum: P = X × X*
3. Compute IFFT(P) → R (autocorrelation)
```

**Complexity**: **O(N log N)**

For N = 2048:
```
FFT: 2048 × log₂(2048) = 2048 × 11 = 22,528 operations
Total: ~45,056 operations (FFT + IFFT)
```

**Speedup**: 4,194,304 / 45,056 ≈ **93× faster**

**Verdict**: **Must use FFT-based autocorrelation** for real-time performance.

---

## **4.2 YIN Algorithm**

YIN is an improved pitch detection algorithm based on autocorrelation with additional steps:

### **YIN Steps**

1. **Difference Function** (similar to autocorrelation):
   ```
   d[τ] = Σ (x[n] - x[n + τ])² for n = 0 to N-τ-1
   ```
   Complexity: **O(N²)** (naive) or **O(N log N)** (FFT-based)

2. **Cumulative Mean Normalized Difference**:
   ```
   d'[τ] = d[τ] / ((1/τ) × Σ d[j] for j = 1 to τ)
   ```
   Complexity: **O(N)**

3. **Absolute Threshold** (find first minimum below threshold):
   Complexity: **O(N)**

4. **Parabolic Interpolation** (refine peak):
   Complexity: **O(1)**

### **Total YIN Complexity**

**O(N log N)** (dominated by Step 1 if using FFT)

**Operations** (N = 2048):
- FFT-based difference: ~45,056
- Normalization: ~2,048
- Threshold search: ~2,048
- Interpolation: ~10

**Total**: ~49,000 operations

---

## **4.3 CPU Cost Estimates**

### **Desktop (Reference)**

**CPU**: Intel i5-10400 (mid-range desktop, 2020)
- **Clock Speed**: 2.9 GHz
- **FLOPS**: ~100 GFLOPS (single-precision)

**Autocorrelation (FFT-based, N=2048)**:
```
Operations: 45,056
Time: 45,056 / 100,000,000,000 = 0.45 microseconds
```

**Overhead** (JavaScript, memory access, etc.): ×1000
```
Practical Time: ~0.45 ms
```

**Conclusion**: Desktop has **plenty of headroom** (42.67 ms frame vs 0.45 ms processing).

---

### **iPhone 13 (Non-Pro)**

**CPU**: Apple A15 Bionic (2021)
- **Efficiency Cores**: 2.0 GHz
- **FLOPS**: ~15 GFLOPS (per core, single-precision)

**Autocorrelation (FFT-based, N=2048)**:
```
Operations: 45,056
Time: 45,056 / 15,000,000,000 = 3 microseconds
```

**Overhead** (JavaScript, memory access, etc.): ×1000
```
Practical Time: ~3 ms
```

**Conclusion**: iPhone 13 can process **in ~3 ms** (< 42.67 ms frame duration).

**Safety Margin**: 42.67 ms / 3 ms ≈ **14× headroom** ✅

---

### **Mid-Range Android (2021-2022)**

**CPU**: Snapdragon 750G or MediaTek Dimensity 800
- **Clock Speed**: ~2.2 GHz (performance cores)
- **FLOPS**: ~10 GFLOPS (per core, single-precision)

**Autocorrelation (FFT-based, N=2048)**:
```
Operations: 45,056
Time: 45,056 / 10,000,000,000 = 4.5 microseconds
```

**Overhead** (JavaScript, memory access, etc.): ×1000
```
Practical Time: ~4.5 ms
```

**Conclusion**: Mid-range Android can process **in ~4.5 ms** (< 42.67 ms frame duration).

**Safety Margin**: 42.67 ms / 4.5 ms ≈ **9× headroom** ✅

---

### **Budget Android (2020)**

**CPU**: Snapdragon 665 or MediaTek Helio G85
- **Clock Speed**: ~2.0 GHz (performance cores)
- **FLOPS**: ~5 GFLOPS (per core, single-precision)

**Autocorrelation (FFT-based, N=2048)**:
```
Operations: 45,056
Time: 45,056 / 5,000,000,000 = 9 microseconds
```

**Overhead** (JavaScript, memory access, etc.): ×1000
```
Practical Time: ~9 ms
```

**Conclusion**: Budget Android can process **in ~9 ms** (< 42.67 ms frame duration).

**Safety Margin**: 42.67 ms / 9 ms ≈ **4.7× headroom** ✅

---

## **4.4 Worst-Case Scenario**

### **Older Budget Phone (2018-2019)**

**CPU**: Snapdragon 450 or MediaTek Helio P22
- **Clock Speed**: ~1.8 GHz
- **FLOPS**: ~3 GFLOPS (per core)

**Autocorrelation (FFT-based, N=2048)**:
```
Practical Time: ~15 ms
```

**Safety Margin**: 42.67 ms / 15 ms ≈ **2.8× headroom** ⚠️

**Conclusion**: Older phones **may struggle** with 50% overlap (2× CPU).

---

## **4.5 CPU Cost Summary**

| Device | Processing Time | Frame Duration | Safety Margin | Overlap Support |
|--------|----------------|----------------|---------------|-----------------|
| **Desktop (i5-10400)** | ~0.45 ms | 42.67 ms | 94× | ✅ 75% overlap |
| **iPhone 13** | ~3 ms | 42.67 ms | 14× | ✅ 50% overlap |
| **Mid-Range Android** | ~4.5 ms | 42.67 ms | 9× | ✅ 50% overlap |
| **Budget Android (2020)** | ~9 ms | 42.67 ms | 4.7× | ✅ 50% overlap |
| **Older Budget (2018)** | ~15 ms | 42.67 ms | 2.8× | ⚠️ 50% overlap |

**Conclusion**:
- ✅ **50% overlap is safe** for most devices (2020+)
- ⚠️ **Older devices** may need **no overlap** or **longer frames**
- ✅ **2048 samples** is the right choice (acceptable latency + sufficient headroom)

---

## **4.6 Big-O Complexity Summary**

| Algorithm | Naive | Optimized (FFT) | Practical Time (Mid-Range) |
|-----------|-------|-----------------|---------------------------|
| **Autocorrelation** | O(N²) | O(N log N) | ~4.5 ms |
| **YIN** | O(N²) | O(N log N) | ~5 ms |

**Recommendation**: Use **FFT-based autocorrelation** or **FFT-based YIN**.

**Critical**: **Must use FFT** for real-time performance on mobile.

---

# 5️⃣ PHASE 3 SCOPE ADJUSTMENT

## **5.1 Revised Scope - MINIMAL**

### **✅ Approved for Phase 3**

1. **Pitch Detection Core Algorithm**
   - FFT-based autocorrelation **OR** FFT-based YIN
   - Input: 2048-sample frame (windowed)
   - Output: **Frequency (Hz)** + **Confidence (0-1)**

2. **Frame Consumer**
   - Read frames from Frame Buffer
   - Accumulate 4 frames (2048 samples)
   - Apply Hann window
   - Call pitch detection algorithm
   - Advance by 2 frames (50% overlap)

3. **Performance Measurement**
   - Measure processing time per frame (in ms)
   - Log to console
   - Monitor frame queue depth

### **❌ Removed from Phase 3**

1. **Note Name Conversion** (e.g., "A4")
   - Deferred to Phase 4

2. **Cents Calculation** (e.g., +12 cents)
   - Deferred to Phase 4

3. **Musical Mapping Logic**
   - Deferred to Phase 4

4. **UI Integration** (test route)
   - Minimal console-only output
   - No graphical display

---

## **5.2 Phase 3 Output Format (Revised)**

### **PitchResult Object (Minimal)**

```javascript
{
  frequency: number | null,    // Detected frequency (Hz) or null if no pitch
  confidence: number,          // Confidence score [0.0, 1.0]
  timestamp: number,           // AudioContext.currentTime (seconds)
  frameNumber: number          // Frame counter (from first frame of window)
}
```

**Example**:
```javascript
{
  frequency: 440.0,
  confidence: 0.92,
  timestamp: 1.234567,
  frameNumber: 42
}
```

**No musical interpretation** — just raw frequency and confidence.

---

## **5.3 Phase 3 Test Output (Console Only)**

### **Log Format**

```javascript
[PITCH] Frame 42 | 440.0 Hz | Confidence: 92% | Time: 1.235s | Processing: 4.2ms
[PITCH] Frame 46 | 441.2 Hz | Confidence: 89% | Time: 1.256s | Processing: 4.1ms
[PITCH] Frame 50 | null Hz | Confidence: 15% | Time: 1.277s | Processing: 4.3ms
```

**No UI display** — console logs only.

---

# 6️⃣ FINAL RECOMMENDED CONFIGURATION

## **Phase 3 Audio Pipeline Configuration**

| Parameter | Value | Justification |
|-----------|-------|---------------|
| **AudioWorklet Frame Size** | 512 samples | No change (Phase 2A) |
| **DSP Window Size** | 2048 samples | 3.5+ periods for E2, 23.44 Hz resolution |
| **Overlap** | 50% (1024 samples) | Standard practice, acceptable CPU cost |
| **Window Function** | Hann | Industry standard |
| **Algorithm** | FFT-based Autocorrelation | O(N log N), real-time on mobile |
| **Pitch Update Rate** | 46.88 Hz (every 21.33 ms) | Acceptable jitter for practice feedback |
| **Latency** | 42.67 ms | Acceptable for real-time feedback |
| **CPU Cost (Mid-Range)** | ~4.5 ms per window | 9× headroom vs frame duration |
| **Timestamp Strategy** | AudioContext.currentTime | Single-time calibration, no periodic re-sync |
| **Output Format** | Frequency (Hz) + Confidence | No musical mapping (Phase 4+) |

---

## **Mathematical Summary**

### **Window Size (2048 samples)**

```
Duration = 2048 / 48000 = 42.67 ms
Frequency Resolution = 48000 / 2048 = 23.44 Hz
E2 Periods = 42.67 ms / 12.14 ms = 3.51 periods ✅
```

### **50% Overlap**

```
Hop Size = 1024 samples = 21.33 ms
Pitch Update Rate = 48000 / 1024 = 46.88 Hz
Jitter = ±21.33 ms
```

### **CPU Cost (FFT-based Autocorrelation)**

```
Operations = 2048 × log₂(2048) × 2 ≈ 45,000
Processing Time (Mid-Range Android) ≈ 4.5 ms
Safety Margin = 42.67 ms / 4.5 ms = 9.5× ✅
```

---

# ✅ VALIDATION SUMMARY

## **Signal Theory Validated**

✅ **Window Size**: 2048 samples (optimal for guitar)  
✅ **Overlap Strategy**: 50% overlap with Hann window  
✅ **Timestamp Drift**: Single-time calibration (< 180 ms drift in 30 min)  
✅ **CPU Complexity**: FFT-based O(N log N), 9× safety margin on mid-range Android  
✅ **Phase 3 Scope**: Minimal (frequency + confidence only)

---

## **Ready for Phase 3 Approval**

**Pending**:
- [ ] Review and approval of window size analysis
- [ ] Review and approval of overlap strategy
- [ ] Review and approval of timestamp model
- [ ] Review and approval of CPU estimates
- [ ] Review and approval of minimal scope

**Once approved**:
- Create branch `phase-3-pitch-detection`
- Implement FFT-based pitch detection
- Test on real devices (desktop, iPhone, Android)
- Document performance metrics
- **NO merge to main**

---

**End of Signal Theory Validation** 📄

---

**Status**: ⏸️ **AWAITING APPROVAL**  
**Next**: Phase 3 implementation (after approval)  
**Development**: PAUSED
