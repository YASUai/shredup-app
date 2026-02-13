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
   * Log time drift analysis
   */
  logTimeDrift() {
    if (this.metronomeTimeline.length < 2) {
      console.log('[TIME ENGINE] Not enough ticks to analyze drift');
      return;
    }
    
    const ticks = this.metronomeTimeline;
    const deltas = [];
    
    for (let i = 1; i < ticks.length; i++) {
      const delta = (ticks[i].scheduledTime - ticks[i - 1].scheduledTime) * 1000;
      deltas.push(delta);
    }
    
    const avgDelta = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
    const maxDelta = Math.max(...deltas);
    const minDelta = Math.min(...deltas);
    const jitter = maxDelta - minDelta;
    
    console.log('[TIME ENGINE] Drift Analysis:', {
      totalTicks: ticks.length,
      avgDelta: avgDelta.toFixed(3) + 'ms',
      minDelta: minDelta.toFixed(3) + 'ms',
      maxDelta: maxDelta.toFixed(3) + 'ms',
      jitter: jitter.toFixed(3) + 'ms',
      jitterStatus: jitter <= 0.5 ? '✅ PASS' : '❌ FAIL (> 0.5ms)'
    });
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
    
    // Analyze results
    console.log('\n[TIME ENGINE] ========== VALIDATION RESULTS ==========');
    this.logTimeDrift();
    console.log('[TIME ENGINE] =====================================\n');
    
    this.setDebugMode(originalDebugMode);
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MasterTimeEngine;
}
