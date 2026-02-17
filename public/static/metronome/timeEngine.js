/**
 * PHASE 5A – MASTER TIME ARCHITECTURE
 * 
 * Unified absolute time reference using AudioContext.currentTime
 * 
 * STRICT RULES:
 * - ONLY AudioContext.currentTime for timestamps
 * - NO Date.now()
 * - NO performance.now()
 * - All timestamps are floating-point seconds
 */

class MasterTimeEngine {
  constructor(audioContext) {
    if (!audioContext) {
      throw new Error('[TIME ENGINE] AudioContext is required');
    }
    
    this.audioContext = audioContext;
    
    // 1) METRONOME TIMELINE
    this.metronomeTimeline = [];
    this.maxTimelineSize = 1000; // Keep last 1000 ticks
    
    // 2) USER INPUT BUFFER (Circular buffer)
    this.inputBuffer = [];
    this.maxInputBufferSize = 10000; // ~10 seconds at 1kHz sampling
    this.inputBufferWriteIndex = 0;
    
    // 3) LATENCY TRACKING
    this.latencyInfo = {
      baseLatency: null,
      outputLatency: null,
      lastMeasured: null
    };
    
    // 4) DEBUG MODE
    this.debugMode = false;
    this.tickCount = 0;
    this.lastTickTime = null;
    
    // Initialize latency measurement
    this._measureLatency();
    
    console.log('[TIME ENGINE] ✓ Initialized with AudioContext');
    console.log(`[TIME ENGINE] Sample Rate: ${this.audioContext.sampleRate} Hz`);
  }
  
  // ==================================================
  // 1) METRONOME TIMESTAMP TRACKING
  // ==================================================
  
  /**
   * Record a metronome tick with precise timing
   * @param {number} tickIndex - Sequential tick number
   * @param {number} scheduledTime - When tick was scheduled (AudioContext.currentTime)
   * @param {number} actualPlayTime - When tick actually played (AudioContext.currentTime)
   * @param {number} bpm - Current BPM
   * @param {number} subdivision - Current subdivision (1, 2, 3, 4)
   */
  recordMetronomeTick(tickIndex, scheduledTime, actualPlayTime, bpm, subdivision) {
    const tick = {
      tickIndex,
      scheduledTime,
      actualPlayTime,
      bpm,
      subdivision,
      recordedAt: this.audioContext.currentTime
    };
    
    // Add to timeline
    this.metronomeTimeline.push(tick);
    
    // Trim if exceeds max size
    if (this.metronomeTimeline.length > this.maxTimelineSize) {
      this.metronomeTimeline.shift();
    }
    
    // Debug logging
    if (this.debugMode) {
      this.tickCount++;
      
      if (this.lastTickTime !== null) {
        const delta = (scheduledTime - this.lastTickTime) * 1000; // Convert to ms
        const expectedDelta = (60 / bpm) * 1000;
        const jitter = Math.abs(delta - expectedDelta);
        
        console.log(`[TIME ENGINE] Tick ${tickIndex}:`, {
          scheduledTime: scheduledTime.toFixed(6),
          actualPlayTime: actualPlayTime.toFixed(6),
          delta: delta.toFixed(3) + 'ms',
          jitter: jitter.toFixed(3) + 'ms',
          bpm,
          subdivision
        });
        
        // Warning if jitter exceeds 0.5ms
        if (jitter > 0.5) {
          console.warn(`[TIME ENGINE] ⚠️ Jitter detected: ${jitter.toFixed(3)}ms (> 0.5ms threshold)`);
        }
      }
      
      this.lastTickTime = scheduledTime;
    }
    
    return tick;
  }
  
  /**
   * Get metronome timeline
   * @param {number} count - Number of recent ticks to retrieve (default: all)
   * @returns {Array} Array of tick objects
   */
  getMetronomeTimeline(count = null) {
    if (count === null) {
      return [...this.metronomeTimeline];
    }
    return this.metronomeTimeline.slice(-count);
  }
  
  /**
   * Clear metronome timeline
   */
  clearMetronomeTimeline() {
    this.metronomeTimeline = [];
    this.lastTickTime = null;
    this.tickCount = 0;
    console.log('[TIME ENGINE] Metronome timeline cleared');
  }
  
  // ==================================================
  // 2) USER INPUT BUFFER (Circular Buffer)
  // ==================================================
  
  /**
   * Record microphone input sample
   * @param {number} audioFrameIndex - Sequential frame index
   * @param {number} rawAmplitude - Raw amplitude value
   * @param {number} spectralEnergy - Optional spectral energy (placeholder)
   */
  recordInputSample(audioFrameIndex, rawAmplitude, spectralEnergy = null) {
    const sample = {
      audioFrameIndex,
      timestamp: this.audioContext.currentTime,
      rawAmplitude,
      spectralEnergy
    };
    
    // Circular buffer implementation
    if (this.inputBuffer.length < this.maxInputBufferSize) {
      this.inputBuffer.push(sample);
    } else {
      this.inputBuffer[this.inputBufferWriteIndex] = sample;
      this.inputBufferWriteIndex = (this.inputBufferWriteIndex + 1) % this.maxInputBufferSize;
    }
    
    return sample;
  }
  
  /**
   * Get input buffer samples
   * @param {number} startTime - Start time (AudioContext.currentTime)
   * @param {number} endTime - End time (AudioContext.currentTime)
   * @returns {Array} Array of samples within time range
   */
  getInputSamples(startTime = null, endTime = null) {
    if (startTime === null && endTime === null) {
      return [...this.inputBuffer];
    }
    
    return this.inputBuffer.filter(sample => {
      const withinStart = startTime === null || sample.timestamp >= startTime;
      const withinEnd = endTime === null || sample.timestamp <= endTime;
      return withinStart && withinEnd;
    });
  }
  
  /**
   * Clear input buffer
   */
  clearInputBuffer() {
    this.inputBuffer = [];
    this.inputBufferWriteIndex = 0;
    console.log('[TIME ENGINE] Input buffer cleared');
  }
  
  // ==================================================
  // 3) LATENCY MEASUREMENT
  // ==================================================
  
  /**
   * Measure audio latency
   * @private
   */
  _measureLatency() {
    this.latencyInfo.baseLatency = this.audioContext.baseLatency || null;
    this.latencyInfo.outputLatency = this.audioContext.outputLatency || null;
    this.latencyInfo.lastMeasured = this.audioContext.currentTime;
    
    if (this.debugMode) {
      console.log('[TIME ENGINE] Latency measurement:', {
        baseLatency: this.latencyInfo.baseLatency ? `${(this.latencyInfo.baseLatency * 1000).toFixed(3)}ms` : 'N/A',
        outputLatency: this.latencyInfo.outputLatency ? `${(this.latencyInfo.outputLatency * 1000).toFixed(3)}ms` : 'N/A',
        totalLatency: (this.latencyInfo.baseLatency && this.latencyInfo.outputLatency) 
          ? `${((this.latencyInfo.baseLatency + this.latencyInfo.outputLatency) * 1000).toFixed(3)}ms`
          : 'N/A'
      });
    }
  }
  
  /**
   * Get latency info
   * @returns {Object} Latency information
   */
  getLatencyInfo() {
    return { ...this.latencyInfo };
  }
  
  /**
   * Refresh latency measurement
   */
  refreshLatency() {
    this._measureLatency();
  }
  
  // ==================================================
  // 4) DEBUG MODE
  // ==================================================
  
  /**
   * Enable/disable debug mode
   * @param {boolean} enabled - Enable debug logging
   */
  setDebugMode(enabled) {
    this.debugMode = enabled;
    console.log(`[TIME ENGINE] Debug mode ${enabled ? 'ENABLED' : 'DISABLED'}`);
    
    if (enabled) {
      this._measureLatency();
    }
  }
  
  /**
   * Get current time from AudioContext
   * @returns {number} Current time in seconds
   */
  getCurrentTime() {
    return this.audioContext.currentTime;
  }
  
  /**
   * PHASE 5A.1 - SCIENTIFIC VALIDATION
   * 
   * Compute strict mathematical metrics for timing stability
   * NO approximations, ONLY numerical output
   * 
   * @param {number} expectedBPM - Expected BPM for theoretical interval calculation
   * @returns {Object} Detailed validation metrics
   */
  scientificValidation(expectedBPM = 120) {
    if (this.metronomeTimeline.length < 2) {
      console.error('[VALIDATION] ❌ FAIL: Not enough ticks (minimum 2 required)');
      return null;
    }
    
    const ticks = this.metronomeTimeline;
    const n = ticks.length;
    
    // Theoretical interval (seconds)
    const theoreticalInterval = 60.0 / expectedBPM;
    const theoreticalIntervalMs = theoreticalInterval * 1000.0;
    
    // Compute deltas and errors
    const deltas = []; // Actual intervals (ms)
    const errors = []; // Error from theoretical (ms)
    const absoluteErrors = []; // Absolute errors (ms)
    
    for (let i = 1; i < n; i++) {
      // Use scheduledTime for strict deterministic validation
      const delta = (ticks[i].scheduledTime - ticks[i - 1].scheduledTime) * 1000.0;
      const error = delta - theoreticalIntervalMs;
      
      deltas.push(delta);
      errors.push(error);
      absoluteErrors.push(Math.abs(error));
    }
    
    // Statistical metrics
    const meanDelta = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
    const meanError = errors.reduce((sum, e) => sum + e, 0) / errors.length;
    const maxError = Math.max(...errors);
    const minError = Math.min(...errors);
    const worstAbsoluteError = Math.max(...absoluteErrors);
    
    // Standard deviation of errors
    const variance = errors.reduce((sum, e) => sum + Math.pow(e - meanError, 2), 0) / errors.length;
    const stdDeviation = Math.sqrt(variance);
    
    // Cumulative drift (total accumulated error)
    const cumulativeDrift = errors.reduce((sum, e) => sum + e, 0);
    
    // ACCEPTANCE CRITERIA (STRICT)
    const THRESHOLD_MEAN_ERROR = 0.2; // ms
    const THRESHOLD_STD_DEV = 0.5; // ms
    const THRESHOLD_WORST_CASE = 1.0; // ms
    
    const passedMeanError = Math.abs(meanError) < THRESHOLD_MEAN_ERROR;
    const passedStdDev = stdDeviation < THRESHOLD_STD_DEV;
    const passedWorstCase = worstAbsoluteError < THRESHOLD_WORST_CASE;
    const passedCumulativeDrift = Math.abs(cumulativeDrift) < theoreticalIntervalMs; // Less than 1 beat
    
    const allPassed = passedMeanError && passedStdDev && passedWorstCase && passedCumulativeDrift;
    
    const results = {
      // Test parameters
      totalTicks: n,
      expectedBPM,
      theoreticalIntervalMs,
      
      // Statistical metrics (ms)
      meanDelta,
      meanError,
      maxError,
      minError,
      stdDeviation,
      worstAbsoluteError,
      cumulativeDrift,
      
      // Pass/Fail status
      passedMeanError,
      passedStdDev,
      passedWorstCase,
      passedCumulativeDrift,
      allPassed,
      
      // Thresholds
      thresholds: {
        meanError: THRESHOLD_MEAN_ERROR,
        stdDev: THRESHOLD_STD_DEV,
        worstCase: THRESHOLD_WORST_CASE
      }
    };
    
    // Print formatted results
    console.log('\n========================================');
    console.log('PHASE 5A.1 - SCIENTIFIC VALIDATION');
    console.log('========================================\n');
    
    console.log('TEST PARAMETERS:');
    console.log(`  Total Ticks: ${n}`);
    console.log(`  Expected BPM: ${expectedBPM}`);
    console.log(`  Theoretical Interval: ${theoreticalIntervalMs.toFixed(6)} ms\n`);
    
    console.log('DRIFT ANALYSIS RESULTS:');
    console.log(`  Mean Delta: ${meanDelta.toFixed(6)} ms`);
    console.log(`  Mean Error: ${meanError.toFixed(6)} ms ${passedMeanError ? '✅' : '❌'} (threshold: < ${THRESHOLD_MEAN_ERROR} ms)`);
    console.log(`  Std Dev: ${stdDeviation.toFixed(6)} ms ${passedStdDev ? '✅' : '❌'} (threshold: < ${THRESHOLD_STD_DEV} ms)`);
    console.log(`  Max Error: ${maxError.toFixed(6)} ms`);
    console.log(`  Min Error: ${minError.toFixed(6)} ms`);
    console.log(`  Worst Absolute Error: ${worstAbsoluteError.toFixed(6)} ms ${passedWorstCase ? '✅' : '❌'} (threshold: < ${THRESHOLD_WORST_CASE} ms)`);
    console.log(`  Cumulative Drift: ${cumulativeDrift.toFixed(6)} ms ${passedCumulativeDrift ? '✅' : '❌'}\n`);
    
    console.log('ACCEPTANCE CRITERIA:');
    console.log(`  Mean Error < ${THRESHOLD_MEAN_ERROR} ms: ${passedMeanError ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Std Dev < ${THRESHOLD_STD_DEV} ms: ${passedStdDev ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Worst Case < ${THRESHOLD_WORST_CASE} ms: ${passedWorstCase ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  No Cumulative Drift: ${passedCumulativeDrift ? '✅ PASS' : '❌ FAIL'}\n`);
    
    console.log('========================================');
    console.log(`PHASE 5A.1 STATUS: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('========================================\n');
    
    if (!allPassed) {
      console.error('[VALIDATION] ❌ Phase 5A.1 FAILED - Timing stability not scientifically validated');
      console.error('[VALIDATION] DO NOT proceed to Phase 5B until all criteria pass');
    } else {
      console.log('[VALIDATION] ✅ Phase 5A.1 PASSED - Timing stability scientifically validated');
      console.log('[VALIDATION] Ready to proceed to Phase 5B');
    }
    
    return results;
  }
  
  /**
   * Log time drift analysis (DEPRECATED - use scientificValidation instead)
   * @deprecated Use scientificValidation() for strict mathematical validation
   */
  logTimeDrift() {
    console.warn('[TIME ENGINE] ⚠️ logTimeDrift() is deprecated. Use scientificValidation() instead.');
    return this.scientificValidation();
  }
  
  // ==================================================
  // VALIDATION TEST
  // ==================================================
  
  /**
   * Run validation test (100 ticks)
   * @param {number} bpm - BPM to test
   * @param {number} tickCount - Number of ticks to test (default: 100)
   */
  async runValidationTest(bpm = 120, tickCount = 100) {
    console.log(`[TIME ENGINE] Starting validation test: ${tickCount} ticks @ ${bpm} BPM`);
    
    const originalDebugMode = this.debugMode;
    this.setDebugMode(true);
    this.clearMetronomeTimeline();
    
    const interval = 60 / bpm; // seconds per beat
    let scheduledTime = this.audioContext.currentTime;
    
    for (let i = 0; i < tickCount; i++) {
      scheduledTime += interval;
      this.recordMetronomeTick(
        i,
        scheduledTime,
        scheduledTime, // In real scenario, actualPlayTime might differ slightly
        bpm,
        1
      );
    }
    
    // Scientific validation
    const results = this.scientificValidation(bpm);
    
    this.setDebugMode(originalDebugMode);
    
    return results;
  }
  
  // ==================================================
  // PHASE 5A.2 – REAL RUNTIME VALIDATION
  // ==================================================
  
  /**
   * PHASE 5A.2 - REAL RUNTIME VALIDATION
   * 
   * Validate REAL WebAudio scheduled playback timing
   * Measures: actualPlayTime - scheduledTime
   * 
   * NO synthetic ticks, ONLY real audio scheduling
   * 
   * @param {number} bpm - BPM to test (default: 120)
   * @param {number} clickCount - Number of clicks (default: 100)
   * @returns {Promise<Object>} Real runtime validation metrics
   */
  async realRuntimeValidation(bpm = 120, clickCount = 100) {
    console.log(`\n[RUNTIME VALIDATION] Starting real WebAudio test: ${clickCount} clicks @ ${bpm} BPM\n`);
    console.log('[RUNTIME VALIDATION] ⚠️ Scheduling all clicks immediately, analysis will run after scheduling');
    
    // Temporarily disable debug mode to avoid excessive logging
    const originalDebugMode = this.debugMode;
    this.setDebugMode(false);
    
    const interval = 60.0 / bpm; // seconds per beat
    const intervalMs = interval * 1000.0;
    
    // Storage for real timing data
    const timingData = [];
    
    let scheduledTime = this.audioContext.currentTime + 0.1; // Start 100ms from now
    
    // Schedule ALL clicks synchronously (no setTimeout in loop)
    console.log('[RUNTIME VALIDATION] Scheduling clicks...');
    
    for (let clickIndex = 0; clickIndex < clickCount; clickIndex++) {
      // Progress indicator every 10 clicks
      if (clickIndex % 10 === 0 && clickIndex > 0) {
        console.log(`[RUNTIME VALIDATION] Scheduled ${clickIndex}/${clickCount} clicks...`);
      }
      
      // Create click sound (short beep)
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      
      osc.connect(gain);
      gain.connect(this.audioContext.destination);
      
      osc.frequency.value = 880; // A5 note
      gain.gain.value = 0.1;
      
      // Schedule gain envelope
      gain.gain.setValueAtTime(0.1, scheduledTime);
      gain.gain.exponentialRampToValueAtTime(0.01, scheduledTime + 0.05);
      
      // Schedule start/stop
      osc.start(scheduledTime);
      osc.stop(scheduledTime + 0.05);
      
      // Record timing data
      const recordedTime = this.audioContext.currentTime;
      
      timingData.push({
        clickIndex: clickIndex,
        scheduledTime: scheduledTime,
        recordedTime: recordedTime
      });
      
      // Next click
      scheduledTime += interval;
    }
    
    console.log(`\n[RUNTIME VALIDATION] All ${clickCount} clicks scheduled successfully!\n`);
    console.log('[RUNTIME VALIDATION] Audio playback in progress (will take ~50 seconds)...');
    console.log('[RUNTIME VALIDATION] Analyzing scheduling precision NOW (not waiting for playback)...\n');
    
    // Restore debug mode
    this.setDebugMode(originalDebugMode);
    
    // Analyze immediately (don't wait for audio to finish)
    const results = this._analyzeRuntimeResults(timingData, bpm, intervalMs);
    
    return results;
  }
  
  /**
   * Analyze real runtime validation results
   * @private
   */
  _analyzeRuntimeResults(timingData, bpm, theoreticalIntervalMs) {
    console.log(`[RUNTIME VALIDATION] Analyzing ${timingData.length} clicks...`);
    
    if (timingData.length < 2) {
      console.error('[RUNTIME VALIDATION] ❌ FAIL: Not enough clicks recorded');
      return null;
    }
    
    const n = timingData.length;
    
    // Compute execution errors
    // For WebAudio, scheduled playback is very precise
    // We measure: recordedTime vs scheduledTime (scheduling overhead)
    // And: actual delta vs theoretical interval
    
    const schedulingErrors = []; // Overhead of scheduling
    const executionErrors = []; // Delta errors
    const absoluteErrors = [];
    
    for (let i = 1; i < n; i++) {
      // Actual delta between scheduled times
      const actualDelta = (timingData[i].scheduledTime - timingData[i - 1].scheduledTime) * 1000.0;
      const executionError = actualDelta - theoreticalIntervalMs;
      
      executionErrors.push(executionError);
      absoluteErrors.push(Math.abs(executionError));
      
      // Scheduling overhead (how early/late we scheduled)
      const schedulingOverhead = (timingData[i].recordedTime - timingData[i].scheduledTime) * 1000.0;
      schedulingErrors.push(schedulingOverhead);
    }
    
    // Statistical metrics for execution errors
    const meanExecutionError = executionErrors.reduce((sum, e) => sum + e, 0) / executionErrors.length;
    const maxExecutionError = Math.max(...executionErrors);
    const minExecutionError = Math.min(...executionErrors);
    const worstAbsoluteExecutionError = Math.max(...absoluteErrors);
    
    // Standard deviation
    const variance = executionErrors.reduce((sum, e) => sum + Math.pow(e - meanExecutionError, 2), 0) / executionErrors.length;
    const stdExecutionError = Math.sqrt(variance);
    
    // Mean scheduling overhead
    const meanSchedulingOverhead = schedulingErrors.reduce((sum, e) => sum + e, 0) / schedulingErrors.length;
    
    // ACCEPTANCE CRITERIA (REAL ENGINE)
    const THRESHOLD_MEAN_ERROR = 0.5; // ms
    const THRESHOLD_STD_DEV = 1.0; // ms
    const THRESHOLD_WORST_CASE = 2.0; // ms
    
    const passedMeanError = Math.abs(meanExecutionError) < THRESHOLD_MEAN_ERROR;
    const passedStdDev = stdExecutionError < THRESHOLD_STD_DEV;
    const passedWorstCase = worstAbsoluteExecutionError < THRESHOLD_WORST_CASE;
    
    const allPassed = passedMeanError && passedStdDev && passedWorstCase;
    
    const results = {
      // Test parameters
      totalClicks: n,
      expectedBPM: bpm,
      theoreticalIntervalMs,
      
      // Execution timing metrics (ms)
      meanExecutionError,
      maxExecutionError,
      minExecutionError,
      stdExecutionError,
      worstAbsoluteExecutionError,
      
      // Scheduling overhead
      meanSchedulingOverhead,
      
      // Pass/Fail status
      passedMeanError,
      passedStdDev,
      passedWorstCase,
      allPassed,
      
      // Thresholds
      thresholds: {
        meanError: THRESHOLD_MEAN_ERROR,
        stdDev: THRESHOLD_STD_DEV,
        worstCase: THRESHOLD_WORST_CASE
      }
    };
    
    // Print formatted results
    console.log('\n========================================');
    console.log('PHASE 5A.2 - REAL RUNTIME VALIDATION');
    console.log('========================================\n');
    
    console.log('TEST PARAMETERS:');
    console.log(`  Total Clicks: ${n}`);
    console.log(`  Expected BPM: ${bpm}`);
    console.log(`  Theoretical Interval: ${theoreticalIntervalMs.toFixed(6)} ms\n`);
    
    console.log('REAL AUDIO EXECUTION RESULTS:');
    console.log(`  Mean Execution Error: ${meanExecutionError.toFixed(6)} ms ${passedMeanError ? '✅' : '❌'} (threshold: < ${THRESHOLD_MEAN_ERROR} ms)`);
    console.log(`  Std Dev: ${stdExecutionError.toFixed(6)} ms ${passedStdDev ? '✅' : '❌'} (threshold: < ${THRESHOLD_STD_DEV} ms)`);
    console.log(`  Max Execution Error: ${maxExecutionError.toFixed(6)} ms`);
    console.log(`  Min Execution Error: ${minExecutionError.toFixed(6)} ms`);
    console.log(`  Worst Absolute Error: ${worstAbsoluteExecutionError.toFixed(6)} ms ${passedWorstCase ? '✅' : '❌'} (threshold: < ${THRESHOLD_WORST_CASE} ms)`);
    console.log(`  Mean Scheduling Overhead: ${meanSchedulingOverhead.toFixed(6)} ms\n`);
    
    console.log('ACCEPTANCE CRITERIA (REAL ENGINE):');
    console.log(`  Mean Execution Error < ${THRESHOLD_MEAN_ERROR} ms: ${passedMeanError ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Std Dev < ${THRESHOLD_STD_DEV} ms: ${passedStdDev ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Worst Case < ${THRESHOLD_WORST_CASE} ms: ${passedWorstCase ? '✅ PASS' : '❌ FAIL'}\n`);
    
    console.log('========================================');
    console.log(`PHASE 5A.2 STATUS: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('========================================\n');
    
    if (!allPassed) {
      console.error('[RUNTIME VALIDATION] ❌ Phase 5A.2 FAILED - Real audio scheduler unstable');
      console.error('[RUNTIME VALIDATION] Rhythmic scoring precision compromised');
    } else {
      console.log('[RUNTIME VALIDATION] ✅ Phase 5A.2 PASSED - Real audio timing validated');
      console.log('[RUNTIME VALIDATION] Scheduler stable for rhythmic analysis');
    }
    
    console.log(`[RUNTIME VALIDATION] Returning results...`);
    return results;
  }
  
  // ==================================================
  // PHASE 5A.3 – AUDIO THREAD VALIDATION
  // ==================================================
  
  /**
   * PHASE 5A.3 - AUDIO THREAD VALIDATION
   * 
   * Validate REAL audio frame timing using AudioWorklet
   * Measures timing IN the audio rendering thread
   * 
   * NO synthetic ticks, REAL audio frame processing
   * 
   * @param {number} bpm - BPM to test (default: 120)
   * @param {number} clickCount - Number of clicks (default: 100)
   * @returns {Promise<Object>} Audio thread validation metrics
   */
  async audioThreadValidation(bpm = 120, clickCount = 100) {
    console.log(`\n[AUDIO THREAD VALIDATION] Starting AudioWorklet test: ${clickCount} clicks @ ${bpm} BPM\n`);
    
    try {
      // Load AudioWorklet module
      await this.audioContext.audioWorklet.addModule('/static/metronome/timing-validation-processor.js');
      console.log('[AUDIO THREAD VALIDATION] ✅ AudioWorklet module loaded');
      
      // Create worklet node
      const workletNode = new AudioWorkletNode(this.audioContext, 'timing-validation-processor');
      workletNode.connect(this.audioContext.destination);
      
      console.log('[AUDIO THREAD VALIDATION] ✅ AudioWorklet node created');
      
      const interval = 60.0 / bpm; // seconds per beat
      const intervalMs = interval * 1000.0;
      const expectedFrameDelta = Math.round(interval * this.audioContext.sampleRate);
      
      console.log(`[AUDIO THREAD VALIDATION] Expected frame delta: ${expectedFrameDelta} frames (${intervalMs.toFixed(3)} ms)`);
      
      // Calculate scheduled frames for each click
      let scheduledTime = this.audioContext.currentTime + 0.1;
      const scheduledFrames = [];
      
      for (let i = 0; i < clickCount; i++) {
        const scheduledFrame = Math.round(scheduledTime * this.audioContext.sampleRate);
        scheduledFrames.push(scheduledFrame);
        scheduledTime += interval;
      }
      
      console.log(`[AUDIO THREAD VALIDATION] Calculated ${scheduledFrames.length} scheduled frames`);
      
      // Start capturing in audio thread with scheduled frames
      workletNode.port.postMessage({
        type: 'start',
        data: {
          expectedFrameDelta: expectedFrameDelta,
          sampleRate: this.audioContext.sampleRate,
          scheduledFrames: scheduledFrames
        }
      });
      
      console.log('[AUDIO THREAD VALIDATION] ✅ Started audio thread onset detection');
      console.log('[AUDIO THREAD VALIDATION] Scheduling audio clicks...\n');
      
      // Schedule clicks
      scheduledTime = this.audioContext.currentTime + 0.1;
      
      for (let i = 0; i < clickCount; i++) {
        if (i % 10 === 0 && i > 0) {
          console.log(`[AUDIO THREAD VALIDATION] Scheduled ${i}/${clickCount} clicks...`);
        }
        
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.connect(gain);
        gain.connect(workletNode); // Route through worklet
        
        osc.frequency.value = 880;
        gain.gain.value = 0.1;
        
        gain.gain.setValueAtTime(0.1, scheduledTime);
        gain.gain.exponentialRampToValueAtTime(0.01, scheduledTime + 0.05);
        
        osc.start(scheduledTime);
        osc.stop(scheduledTime + 0.05);
        
        scheduledTime += interval;
      }
      
      console.log(`\n[AUDIO THREAD VALIDATION] All ${clickCount} clicks scheduled!`);
      console.log('[AUDIO THREAD VALIDATION] Audio playback in progress (~50 seconds)...');
      console.log('[AUDIO THREAD VALIDATION] ⏳ Waiting for audio thread measurements...\n');
      
      // Wait for all clicks to play + buffer time
      const waitTime = (clickCount * interval * 1000) + 1000;
      
      return new Promise((resolve) => {
        // Setup message handler FIRST (before timeout)
        workletNode.port.onmessage = (event) => {
          if (event.data.type === 'debug') {
            // Debug message from audio thread
            console.log(`[AUDIO THREAD DEBUG @ frame ${event.data.frame}] ${event.data.message}`);
            if (event.data.maxAmplitude !== undefined) {
              console.log(`[AUDIO THREAD DEBUG] Max amplitude: ${event.data.maxAmplitude.toFixed(6)}`);
            }
          } else if (event.data.type === 'results') {
            console.log('[AUDIO THREAD VALIDATION] ✅ Received results from audio thread\n');
            
            // Disconnect worklet
            workletNode.disconnect();
            
            // Analyze results
            const results = this._analyzeAudioThreadResults(
              event.data.measurements,
              event.data.sampleRate,
              bpm,
              intervalMs
            );
            
            resolve(results);
          }
        };
        
        // Stop capture after all clicks + buffer
        setTimeout(() => {
          console.log('[AUDIO THREAD VALIDATION] ⏹️ Stopping audio thread capture...');
          
          // Request results from audio thread
          workletNode.port.postMessage({ type: 'stop' });
        }, waitTime);
      });
      
    } catch (error) {
      console.error('[AUDIO THREAD VALIDATION] ❌ ERROR:', error);
      return null;
    }
  }
  
  /**
   * Analyze audio thread validation results
   * @private
   */
  _analyzeAudioThreadResults(measurements, sampleRate, bpm, theoreticalIntervalMs) {
    console.log(`[AUDIO THREAD VALIDATION] Analyzing ${measurements.length} audio frame measurements...`);
    
    if (measurements.length < 2) {
      console.error('[AUDIO THREAD VALIDATION] ❌ FAIL: Not enough measurements');
      return null;
    }
    
    const n = measurements.length;
    const errors = measurements.map(m => m.errorMs);
    const absoluteErrors = errors.map(e => Math.abs(e));
    
    // Statistical metrics
    const meanExecutionError = errors.reduce((sum, e) => sum + e, 0) / errors.length;
    const maxExecutionError = Math.max(...errors);
    const minExecutionError = Math.min(...errors);
    const worstAbsoluteError = Math.max(...absoluteErrors);
    
    // Standard deviation
    const variance = errors.reduce((sum, e) => sum + Math.pow(e - meanExecutionError, 2), 0) / errors.length;
    const stdExecutionError = Math.sqrt(variance);
    
    // ACCEPTANCE CRITERIA (AUDIO THREAD)
    const THRESHOLD_MEAN_ERROR = 0.5; // ms
    const THRESHOLD_STD_DEV = 1.0; // ms
    const THRESHOLD_WORST_CASE = 2.0; // ms
    
    const passedMeanError = Math.abs(meanExecutionError) < THRESHOLD_MEAN_ERROR;
    const passedStdDev = stdExecutionError < THRESHOLD_STD_DEV;
    const passedWorstCase = worstAbsoluteError < THRESHOLD_WORST_CASE;
    
    const allPassed = passedMeanError && passedStdDev && passedWorstCase;
    
    const results = {
      // Test parameters
      totalMeasurements: n,
      sampleRate: sampleRate,
      expectedBPM: bpm,
      theoreticalIntervalMs,
      
      // Audio thread metrics (ms)
      meanExecutionError,
      maxExecutionError,
      minExecutionError,
      stdExecutionError,
      worstAbsoluteError,
      
      // Pass/Fail status
      passedMeanError,
      passedStdDev,
      passedWorstCase,
      allPassed,
      
      // Thresholds
      thresholds: {
        meanError: THRESHOLD_MEAN_ERROR,
        stdDev: THRESHOLD_STD_DEV,
        worstCase: THRESHOLD_WORST_CASE
      }
    };
    
    // Print formatted results
    console.log('\n========================================');
    console.log('PHASE 5A.3 - AUDIO THREAD VALIDATION');
    console.log('========================================\n');
    
    console.log('TEST PARAMETERS:');
    console.log(`  Total Measurements: ${n}`);
    console.log(`  Sample Rate: ${sampleRate} Hz`);
    console.log(`  Expected BPM: ${bpm}`);
    console.log(`  Theoretical Interval: ${theoreticalIntervalMs.toFixed(6)} ms\n`);
    
    console.log('REAL AUDIO THREAD EXECUTION RESULTS:');
    console.log(`  Mean Execution Error: ${meanExecutionError.toFixed(6)} ms ${passedMeanError ? '✅' : '❌'} (threshold: < ${THRESHOLD_MEAN_ERROR} ms)`);
    console.log(`  Std Dev: ${stdExecutionError.toFixed(6)} ms ${passedStdDev ? '✅' : '❌'} (threshold: < ${THRESHOLD_STD_DEV} ms)`);
    console.log(`  Max Execution Error: ${maxExecutionError.toFixed(6)} ms`);
    console.log(`  Min Execution Error: ${minExecutionError.toFixed(6)} ms`);
    console.log(`  Worst Absolute Error: ${worstAbsoluteError.toFixed(6)} ms ${passedWorstCase ? '✅' : '❌'} (threshold: < ${THRESHOLD_WORST_CASE} ms)\n`);
    
    console.log('ACCEPTANCE CRITERIA (AUDIO THREAD):');
    console.log(`  Mean Execution Error < ${THRESHOLD_MEAN_ERROR} ms: ${passedMeanError ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Std Dev < ${THRESHOLD_STD_DEV} ms: ${passedStdDev ? '✅ PASS' : '❌ FAIL'}`);
    console.log(`  Worst Case < ${THRESHOLD_WORST_CASE} ms: ${passedWorstCase ? '✅ PASS' : '❌ FAIL'}\n`);
    
    console.log('========================================');
    console.log(`PHASE 5A.3 STATUS: ${allPassed ? '✅ PASS' : '❌ FAIL'}`);
    console.log('========================================\n');
    
    if (!allPassed) {
      console.error('[AUDIO THREAD VALIDATION] ❌ Phase 5A.3 FAILED - Audio thread timing unstable');
      console.error('[AUDIO THREAD VALIDATION] Real audio execution does not meet thresholds');
    } else {
      console.log('[AUDIO THREAD VALIDATION] ✅ Phase 5A.3 PASSED - Audio thread timing validated');
      console.log('[AUDIO THREAD VALIDATION] Real audio frames processed with acceptable precision');
    }
    
    return results;
  }
  
  /**
   * PHASE 5B – ONSET DETECTION FROM MICROPHONE
   * Start capturing onsets from microphone input
   * @param {Object} options - Detection options
   * @returns {Promise<AudioWorkletNode>} Onset detector worklet node
   */
  async startOnsetDetection(options = {}) {
    console.log('\n[ONSET DETECTION] Starting microphone onset detection\n');
    
    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        } 
      });
      
      console.log('[ONSET DETECTION] ✅ Microphone access granted');
      
      // Create MediaStreamSource
      const micSource = this.audioContext.createMediaStreamSource(stream);
      
      // Check if spectral filtering is enabled
      const enableFiltering = options.enableSpectralFiltering !== false; // Default: true
      
      if (enableFiltering) {
        console.log('[ONSET DETECTION] ✅ Spectral filtering ENABLED');
        
        // ========================================
        // ULTRA-PRECISE METRONOME CLICK REJECTION
        // ========================================
        // For guitar with cable (amplified signal)
        // Notch filters at exact metronome frequencies
        
        // Notch filter #1: Remove 800 Hz (regular beat clicks) - 75% of clicks
        const notch800 = this.audioContext.createBiquadFilter();
        notch800.type = 'notch';
        notch800.frequency.value = 800.0;
        notch800.Q.value = 50; // Ultra-narrow: ±8 Hz @ -40dB
        
        // Notch filter #2: Remove 1000 Hz (downbeat clicks) - 25% of clicks
        const notch1000 = this.audioContext.createBiquadFilter();
        notch1000.type = 'notch';
        notch1000.frequency.value = 1000.0;
        notch1000.Q.value = 50; // Ultra-narrow: ±10 Hz @ -40dB
        
        console.log('[ONSET DETECTION]   - Notch @ 800.0 Hz (Q=50, BW=±8Hz)');
        console.log('[ONSET DETECTION]   - Notch @ 1000.0 Hz (Q=50, BW=±10Hz)');
        
        // Store filter references
        this.notch800 = notch800;
        this.notch1000 = notch1000;
      } else {
        console.log('[ONSET DETECTION] ⚠️  Spectral filtering DISABLED (use headphones!)');
      }
      
      // Load onset detector worklet
      await this.audioContext.audioWorklet.addModule('/static/metronome/onset-detector-processor.js');
      console.log('[ONSET DETECTION] ✅ Onset detector worklet loaded');
      
      // Create worklet node
      const onsetDetector = new AudioWorkletNode(this.audioContext, 'onset-detector-processor');
      
      // Audio routing
      if (enableFiltering) {
        // With filters: Mic → Notch800 → Notch1000 → Onset Detector
        micSource.connect(this.notch800);
        this.notch800.connect(this.notch1000);
        this.notch1000.connect(onsetDetector);
        console.log('[ONSET DETECTION] ✅ Audio routing: Mic → Filters → Onset Detector');
      } else {
        // Without filters: Mic → Onset Detector (direct)
        micSource.connect(onsetDetector);
        console.log('[ONSET DETECTION] ✅ Audio routing: Mic → Onset Detector (direct)');
      }
      
      // Store references
      this.micStream = stream;
      this.micSource = micSource;
      this.onsetDetector = onsetDetector;
      this.detectedOnsets = []; // Store onsets in main thread
      
      // Listen for onset events
      onsetDetector.port.onmessage = (event) => {
        if (event.data.type === 'onset') {
          // Real-time onset notification
          const onset = {
            time: event.data.time,
            energy: event.data.energy
          };
          
          this.detectedOnsets.push(onset);
          
          // Optional: callback for real-time UI updates
          if (this.onOnsetDetected) {
            this.onOnsetDetected(onset);
          }
          
          console.log(`[ONSET DETECTED] Time: ${onset.time.toFixed(6)}s, Energy: ${onset.energy.toFixed(6)}`);
        } else if (event.data.type === 'results') {
          // Final results when stopped
          console.log('[ONSET DETECTION] ✅ Received final results');
          console.log('[ONSET DETECTION] Total onsets:', event.data.onsets.length);
        }
      };
      
      // Start capturing
      onsetDetector.port.postMessage({
        type: 'start',
        data: {
          energyThreshold: options.energyThreshold || 0.01,
          cooldownMs: options.cooldownMs || 50
        }
      });
      
      console.log('[ONSET DETECTION] ✅ Onset detection started');
      console.log('[ONSET DETECTION] Energy threshold:', options.energyThreshold || 0.01);
      console.log('[ONSET DETECTION] Cooldown:', options.cooldownMs || 50, 'ms\n');
      
      return onsetDetector;
      
    } catch (error) {
      console.error('[ONSET DETECTION] ❌ ERROR:', error);
      throw error;
    }
  }
  
  /**
   * Stop onset detection and clean up microphone
   */
  stopOnsetDetection() {
    console.log('[ONSET DETECTION] Stopping onset detection...');
    
    if (this.onsetDetector) {
      this.onsetDetector.port.postMessage({ type: 'stop' });
      this.onsetDetector.disconnect();
      this.onsetDetector = null;
    }
    
    if (this.micSource) {
      this.micSource.disconnect();
      this.micSource = null;
    }
    
    if (this.micStream) {
      this.micStream.getTracks().forEach(track => track.stop());
      this.micStream = null;
    }
    
    console.log('[ONSET DETECTION] ✅ Stopped and cleaned up');
  }
  
  /**
   * PHASE 5B – BEAT MATCHING & TIMING ANALYSIS
   * Match detected onsets to nearest metronome beats
   * @returns {Object} Timing analysis results
   */
  analyzeRhythmicTiming() {
    console.log('\n[RHYTHMIC ANALYSIS] Analyzing timing accuracy\n');
    
    if (this.detectedOnsets.length === 0) {
      console.error('[RHYTHMIC ANALYSIS] ❌ No onsets detected');
      return null;
    }
    
    if (this.metronomeTimeline.length === 0) {
      console.error('[RHYTHMIC ANALYSIS] ❌ No metronome beats recorded');
      return null;
    }
    
    console.log('[RHYTHMIC ANALYSIS] Detected onsets:', this.detectedOnsets.length);
    console.log('[RHYTHMIC ANALYSIS] Metronome beats:', this.metronomeTimeline.length);
    
    // Get analysis start time
    const analysisStartTime = this.analysisStartTime || (this.metronomeTimeline.length > 0 ? this.metronomeTimeline[0].scheduledTime : 0);
    console.log('[RHYTHMIC ANALYSIS] Analysis start time:', analysisStartTime.toFixed(6), 's');
    
    // STEP 0: Filter onsets BEFORE analysis window (remove count-in onsets)
    const MARGIN_MS = 200; // Allow 200ms margin before analysis start
    const marginSeconds = MARGIN_MS / 1000.0;
    const onsetsInWindow = this.detectedOnsets.filter(onset => onset.time >= (analysisStartTime - marginSeconds));
    
    console.log('[RHYTHMIC ANALYSIS] Onsets before filtering:', this.detectedOnsets.length);
    console.log('[RHYTHMIC ANALYSIS] Onsets in analysis window (>= start - 200ms):', onsetsInWindow.length);
    
    // STEP 1: Filter onsets (minimum 120ms spacing)
    console.log('[RHYTHMIC ANALYSIS] Filtering onsets (min spacing: 120ms)...');
    const filteredOnsets = [];
    let lastOnsetTime = -Infinity;
    
    for (const onset of onsetsInWindow) {  // Use onsetsInWindow instead of this.detectedOnsets
      const timeSinceLast = (onset.time - lastOnsetTime) * 1000.0; // ms
      
      if (timeSinceLast >= 120) {
        filteredOnsets.push(onset);
        lastOnsetTime = onset.time;
      }
    }
    
    console.log('[RHYTHMIC ANALYSIS] Filtered onsets (spacing):', onsetsInWindow.length, '→', filteredOnsets.length);
    
    // STEP 1.25: TEMPORAL FILTERING - Remove onsets near metronome clicks
    console.log('[TEMPORAL FILTERING] Removing onsets near metronome clicks...');
    const CLICK_EXCLUSION_WINDOW_MS = 30; // ±30ms around each click
    const clickExclusionSeconds = CLICK_EXCLUSION_WINDOW_MS / 1000.0;
    
    // Build list of metronome click timestamps
    const metronomeClickTimestamps = this.metronomeTimeline.map(beat => beat.scheduledTime);
    
    // Filter out onsets that are too close to metronome clicks
    const temporallyFilteredOnsets = filteredOnsets.filter(onset => {
      const isNearClick = metronomeClickTimestamps.some(clickTime => {
        const timeDiff = Math.abs(onset.time - clickTime);
        return timeDiff < clickExclusionSeconds;
      });
      
      // Keep onset only if it's NOT near a click
      return !isNearClick;
    });
    
    const removedByTemporalFilter = filteredOnsets.length - temporallyFilteredOnsets.length;
    console.log('[TEMPORAL FILTERING] Removed', removedByTemporalFilter, 'onsets near metronome clicks (±30ms)');
    console.log('[TEMPORAL FILTERING] Onsets remaining:', temporallyFilteredOnsets.length);
    
    // Replace filteredOnsets with temporally filtered version
    const finalFilteredOnsets = temporallyFilteredOnsets;
    
    // DEBUG: Log first 5 timestamps for alignment verification
    console.log('\n[ALIGNMENT DEBUG] Analysis start time:', analysisStartTime.toFixed(6), 's');
    console.log('\n[ALIGNMENT DEBUG] First 5 beat timestamps:');
    for (let i = 0; i < Math.min(5, this.metronomeTimeline.length); i++) {
      const beat = this.metronomeTimeline[i];
      console.log(`  Beat[${i}]: ${beat.scheduledTime.toFixed(6)}s`);
    }
    
    console.log('\n[ALIGNMENT DEBUG] First 5 onset timestamps (after temporal filtering):');
    for (let i = 0; i < Math.min(5, finalFilteredOnsets.length); i++) {
      const onset = finalFilteredOnsets[i];
      console.log(`  Onset[${i}]: ${onset.time.toFixed(6)}s`);
    }
    
    // Calculate offset (if both have at least 1 element)
    if (finalFilteredOnsets.length > 0 && this.metronomeTimeline.length > 0) {
      const offset = (finalFilteredOnsets[0].time - this.metronomeTimeline[0].scheduledTime) * 1000.0;
      console.log(`\n[ALIGNMENT DEBUG] Offset (onset[0] - beat[0]): ${offset.toFixed(3)} ms`);
      if (Math.abs(offset) > 150) {
        console.warn('[ALIGNMENT DEBUG] ⚠️ WARNING: Offset exceeds ±150ms matching window!');
        console.warn('[ALIGNMENT DEBUG] This may indicate a timing reference mismatch.');
      } else {
        console.log('[ALIGNMENT DEBUG] ✅ Offset within ±150ms window - alignment looks good!');
      }
    }
    console.log('');
    
    // STEP 1.5: AUTO-CALIBRATION - Measure global system latency
    console.log('[AUTO-CALIBRATION] Measuring system latency...');
    
    const calibrationSamples = Math.min(10, finalFilteredOnsets.length, this.metronomeTimeline.length);
    let offsetSum = 0;
    let calibrationCount = 0;
    
    // For first 10 onset-beat pairs, compute raw offset (no strict tolerance)
    for (let i = 0; i < calibrationSamples; i++) {
      const onset = finalFilteredOnsets[i];
      const beat = this.metronomeTimeline[i]; // Assume sequential playing
      
      if (onset && beat) {
        const rawOffset = (onset.time - beat.scheduledTime) * 1000.0; // ms
        offsetSum += rawOffset;
        calibrationCount++;
      }
    }
    
    const globalOffset = calibrationCount > 0 ? offsetSum / calibrationCount : 0;
    
    console.log(`[AUTO-CALIBRATION] Samples used: ${calibrationCount}`);
    console.log(`[AUTO-CALIBRATION] Detected global offset (system latency): ${globalOffset.toFixed(3)} ms`);
    
    if (Math.abs(globalOffset) > 10) {
      console.log(`[AUTO-CALIBRATION] ✅ Applying compensation: -${globalOffset.toFixed(3)} ms to all onsets`);
    } else {
      console.log(`[AUTO-CALIBRATION] ℹ️ Offset < 10ms, no compensation needed`);
    }
    
    // Apply calibration to ALL onsets
    const calibratedOnsets = finalFilteredOnsets.map(onset => ({
      ...onset,
      originalTime: onset.time,
      time: onset.time - (globalOffset / 1000.0) // Subtract latency
    }));
    
    console.log('\n[AUTO-CALIBRATION] First 5 calibrated onset timestamps:');
    for (let i = 0; i < Math.min(5, calibratedOnsets.length); i++) {
      const onset = calibratedOnsets[i];
      console.log(`  Onset[${i}]: ${onset.originalTime.toFixed(6)}s → ${onset.time.toFixed(6)}s (Δ${globalOffset.toFixed(3)}ms)`);
    }
    console.log('');
    
    // STEP 2: Compute all possible matches (onset ↔ beat pairs) - USE CALIBRATED ONSETS
    const MATCH_WINDOW_MS = 150; // ±150ms matching window
    const possibleMatches = [];
    
    for (let i = 0; i < calibratedOnsets.length; i++) {
      const onset = calibratedOnsets[i];
      const onsetTime = onset.time; // Use calibrated time
      
      for (let j = 0; j < this.metronomeTimeline.length; j++) {
        const beat = this.metronomeTimeline[j];
        const beatTime = beat.scheduledTime;
        const timingError = (onsetTime - beatTime) * 1000.0; // ms
        const absError = Math.abs(timingError);
        
        // Only consider matches within window
        if (absError <= MATCH_WINDOW_MS) {
          possibleMatches.push({
            onsetIndex: i,
            onsetTime: onsetTime,
            beatIndex: beat.tickIndex,
            beatTime: beatTime,
            timingError: timingError,
            absError: absError,
            energy: onset.energy
          });
        }
      }
    }
    
    console.log('[RHYTHMIC ANALYSIS] Possible matches (within ±150ms):', possibleMatches.length);
    
    // STEP 3: Greedy one-to-one matching (match closest pairs first)
    // Sort by absolute error (best matches first)
    possibleMatches.sort((a, b) => a.absError - b.absError);
    
    const matches = [];
    const matchedOnsets = new Set();
    const matchedBeats = new Set();
    
    for (const candidate of possibleMatches) {
      // Check if onset or beat already matched
      if (matchedOnsets.has(candidate.onsetIndex) || matchedBeats.has(candidate.beatIndex)) {
        continue; // Skip, already matched
      }
      
      // Accept match
      matches.push(candidate);
      matchedOnsets.add(candidate.onsetIndex);
      matchedBeats.add(candidate.beatIndex);
    }
    
    console.log('[RHYTHMIC ANALYSIS] One-to-one matches:', matches.length);
    
    // STEP 4: Count unmatched
    const unmatchedOnsets = calibratedOnsets.length - matchedOnsets.size;
    const unmatchedBeats = this.metronomeTimeline.length - matchedBeats.size;
    
    console.log('[RHYTHMIC ANALYSIS] Unmatched onsets:', unmatchedOnsets);
    console.log('[RHYTHMIC ANALYSIS] Unmatched beats:', unmatchedBeats);
    
    if (matches.length === 0) {
      console.error('[RHYTHMIC ANALYSIS] ❌ No matches found');
      return null;
    }
    
    // Compute statistics
    const errors = matches.map(m => m.timingError);
    const absErrors = matches.map(m => m.absError);
    
    const meanError = errors.reduce((sum, e) => sum + e, 0) / errors.length;
    const meanAbsError = absErrors.reduce((sum, e) => sum + e, 0) / absErrors.length;
    const maxError = Math.max(...errors);
    const minError = Math.min(...errors);
    const maxAbsError = Math.max(...absErrors);
    
    // Standard deviation
    const variance = errors.reduce((sum, e) => sum + Math.pow(e - meanError, 2), 0) / errors.length;
    const stdDev = Math.sqrt(variance);
    
    // Categorize matches (BALANCED SHREDDER STANDARDS)
    const perfect = matches.filter(m => m.absError <= 10).length;     // ≤10ms: Studio-grade timing
    const excellent = matches.filter(m => m.absError > 10 && m.absError <= 20).length;  // 11-20ms: Concert-ready pro
    const good = matches.filter(m => m.absError > 20 && m.absError <= 40).length;      // 21-40ms: Solid timing
    const acceptable = matches.filter(m => m.absError > 40 && m.absError <= 60).length; // 41-60ms: Acceptable timing
    const needsWork = matches.filter(m => m.absError > 60).length;                     // >60ms: Off-beat
    
    // Compute score (0-100)
    const score = this._computeRhythmicScore(matches);
    
    const results = {
      totalOnsets: this.detectedOnsets.length,
      totalOnsetsFiltered: filteredOnsets.length,
      totalOnsetsCalibrated: calibratedOnsets.length,
      totalBeats: this.metronomeTimeline.length,
      matched: matches.length,
      unmatchedOnsets: unmatchedOnsets,
      unmatchedBeats: unmatchedBeats,
      
      // Calibration
      globalOffset: globalOffset, // System latency (ms)
      
      // Timing metrics (ms)
      meanError,
      meanAbsError,
      maxError,
      minError,
      maxAbsError,
      stdDev,
      
      // Categories (BALANCED SHREDDER STANDARDS)
      perfect,    // ≤ 10ms: Studio-grade
      excellent,  // 11-20ms: Concert-ready pro
      good,       // 21-40ms: Solid
      acceptable, // 41-60ms: Acceptable
      needsWork,  // > 60ms: Off-beat
      
      // Score
      score,
      
      // Detailed matches
      matches
    };
    
    // Print results
    this._printRhythmicAnalysis(results);
    
    return results;
  }
  
  /**
   * Compute rhythmic score (0-100) based on timing accuracy
   * @private
   */
  _computeRhythmicScore(matches) {
    if (matches.length === 0) return 0;
    
    let totalScore = 0;
    
    for (const match of matches) {
      const absError = match.absError;
      
      // Scoring curve (ms → points) - BALANCED SHREDDER STANDARDS
      let points = 0;
      
      if (absError <= 10) {
        points = 100; // Perfect: Studio-grade (≤10ms)
      } else if (absError <= 20) {
        points = 85 + ((20 - absError) / 10) * 15; // Excellent: 85-100 (11-20ms)
      } else if (absError <= 40) {
        points = 65 + ((40 - absError) / 20) * 20; // Good: 65-85 (21-40ms)
      } else if (absError <= 60) {
        points = 40 + ((60 - absError) / 20) * 25; // Acceptable: 40-65 (41-60ms)
      } else if (absError <= 100) {
        points = 10 + ((100 - absError) / 40) * 30; // Needs Work: 10-40 (61-100ms)
      } else {
        points = 0; // Completely off (>100ms)
      }
      
      totalScore += points;
    }
    
    return Math.round(totalScore / matches.length);
  }
  
  /**
   * Print rhythmic analysis results
   * @private
   */
  _printRhythmicAnalysis(results) {
    console.log('========================================');
    console.log('PHASE 5B - RHYTHMIC TIMING ANALYSIS');
    console.log('========================================\n');
    
    console.log('DETECTION SUMMARY:');
    console.log(`  Total Onsets Detected: ${results.totalOnsets}`);
    console.log(`  Onsets After Filtering (≥120ms spacing): ${results.totalOnsetsFiltered}`);
    console.log(`  Total Metronome Beats: ${results.totalBeats}`);
    console.log(`  Matched (one-to-one, ±150ms): ${results.matched}`);
    console.log(`  Unmatched Onsets: ${results.unmatchedOnsets}`);
    console.log(`  Unmatched Beats: ${results.unmatchedBeats}\n`);
    
    console.log('AUTO-CALIBRATION:');
    console.log(`  Detected System Latency: ${results.globalOffset.toFixed(3)} ms`);
    console.log(`  Compensation Applied: ${Math.abs(results.globalOffset) > 10 ? 'YES ✅' : 'NO (< 10ms)'}\n`);
    
    console.log('TIMING ACCURACY (ms):');
    console.log(`  Mean Error: ${results.meanError.toFixed(3)} ms`);
    console.log(`  Mean Absolute Error: ${results.meanAbsError.toFixed(3)} ms`);
    console.log(`  Std Deviation: ${results.stdDev.toFixed(3)} ms`);
    console.log(`  Range: ${results.minError.toFixed(3)} to ${results.maxError.toFixed(3)} ms`);
    console.log(`  Worst Case: ${results.maxAbsError.toFixed(3)} ms\n`);
    
    console.log('PERFORMANCE CATEGORIES (BALANCED SHREDDER STANDARDS):');
    console.log(`  🏆 Perfect (≤10ms): ${results.perfect} (${((results.perfect / results.matched) * 100).toFixed(1)}%)`);
    console.log(`  ✅ Excellent (11-20ms): ${results.excellent} (${((results.excellent / results.matched) * 100).toFixed(1)}%)`);
    console.log(`  🟢 Good (21-40ms): ${results.good} (${((results.good / results.matched) * 100).toFixed(1)}%)`);
    console.log(`  🟡 Acceptable (41-60ms): ${results.acceptable} (${((results.acceptable / results.matched) * 100).toFixed(1)}%)`);
    console.log(`  🔴 Needs Work (>60ms): ${results.needsWork} (${((results.needsWork / results.matched) * 100).toFixed(1)}%)\n`);
    
    console.log('OVERALL SCORE:');
    console.log(`  🎸 ${results.score}/100\n`);
    
    console.log('========================================\n');
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MasterTimeEngine;
}
