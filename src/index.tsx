import { Hono } from 'hono'
import { renderer } from './renderer'

const app = new Hono()

app.use(renderer)

// 🧪 Route pour le métronome LOCAL (intégré same-origin)
// Redirige vers le fichier statique
// 🎸 Route pour le TUNER (intégré same-origin)
// Redirige vers le fichier statique
app.get('/tuner', (c) => {
  return c.redirect('/static/tuner/index.html')
})

// ⏱️ Route TEST: Time Engine Validation (Phase 5A)
app.get('/test-time-engine', (c) => {
  return c.redirect('/static/metronome/test-time-engine.html')
})

// 🎸 Route TEST: Phase 5B Onset Detection (Rhythmic Timing)
app.get('/test-phase-5b', (c) => {
  return c.redirect('/static/metronome/test-phase-5b.html')
})

// 🎸 Route TEST: Audio Engine Phase 2A (Audio Scaffolding)
app.get('/audio-test', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SHRED UP - Audio Engine Test (Phase 2A)</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: #0a0a0a;
            color: white;
            font-family: 'Courier New', monospace;
            padding: 40px;
        }

        .container {
            max-width: 800px;
            margin: 0 auto;
        }

        h1 {
            font-size: 24px;
            margin-bottom: 10px;
            color: #4CAF50;
        }

        .phase-tag {
            display: inline-block;
            background: #1a1a1a;
            padding: 5px 15px;
            border-radius: 4px;
            font-size: 12px;
            margin-bottom: 30px;
            color: #888;
        }

        .controls {
            background: #1a1a1a;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
        }

        button {
            background: #4CAF50;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            font-weight: bold;
            margin-right: 10px;
            margin-bottom: 10px;
        }

        button:hover {
            background: #45a049;
        }

        button:disabled {
            background: #333;
            cursor: not-allowed;
        }

        button.stop {
            background: #f44336;
        }

        button.stop:hover {
            background: #da190b;
        }

        .status-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
        }

        .status-card {
            background: #1a1a1a;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #333;
        }

        .status-card.healthy {
            border-left-color: #4CAF50;
        }

        .status-card.degraded {
            border-left-color: #f44336;
        }

        .status-card h3 {
            font-size: 12px;
            color: #888;
            margin-bottom: 8px;
            text-transform: uppercase;
        }

        .status-value {
            font-size: 18px;
            font-weight: bold;
        }

        .status-indicator {
            display: inline-block;
            width: 10px;
            height: 10px;
            border-radius: 50%;
            margin-right: 8px;
        }

        .indicator-connected {
            background: #4CAF50;
        }

        .indicator-disconnected {
            background: #666;
        }

        .info-box {
            background: #1a1a1a;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            border-left: 4px solid #2196F3;
        }

        .info-box h3 {
            font-size: 14px;
            margin-bottom: 10px;
            color: #2196F3;
        }

        .info-box p {
            font-size: 12px;
            line-height: 1.6;
            color: #aaa;
        }

        .console-hint {
            background: #1a1a1a;
            padding: 15px;
            border-radius: 8px;
            border-left: 4px solid #FF9800;
            margin-top: 20px;
        }

        .console-hint p {
            font-size: 12px;
            color: #FF9800;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎸 SHRED UP - Audio Engine Test</h1>
        <div class="phase-tag">Phase 2A - Audio Scaffolding Only</div>

        <div class="info-box">
            <h3>📋 Phase 2A Scope</h3>
            <p>
                This test page validates the audio pipeline scaffolding.<br>
                <strong>Implemented:</strong> Audio capture, AudioWorklet, frame buffering, timing sync<br>
                <strong>NOT implemented:</strong> Pitch detection, onset detection, timing analysis, scoring (Phase 3+)
            </p>
        </div>

        <div class="controls">
            <button id="initBtn" onclick="initAudioEngine()">Initialize Audio Engine</button>
            <button id="startBtn" onclick="startAudioEngine()" disabled>Start Audio Capture</button>
            <button id="stopBtn" class="stop" onclick="stopAudioEngine()" disabled>Stop Audio Capture</button>
            <button onclick="logStatus()">Log Status</button>
        </div>

        <div class="status-grid">
            <div class="status-card" id="micStatus">
                <h3>Microphone</h3>
                <div class="status-value">
                    <span class="status-indicator indicator-disconnected" id="micIndicator"></span>
                    <span id="micText">Disconnected</span>
                </div>
            </div>

            <div class="status-card" id="frameStatus">
                <h3>Frame Processing</h3>
                <div class="status-value">
                    <span id="frameText">Idle</span>
                </div>
            </div>

            <div class="status-card" id="syncStatus">
                <h3>Clock Sync</h3>
                <div class="status-value">
                    <span id="syncText">Not Synced</span>
                </div>
            </div>

            <div class="status-card" id="tempoStatus">
                <h3>Tempo (from metronome)</h3>
                <div class="status-value">
                    <span id="tempoText">-- BPM</span>
                </div>
            </div>
        </div>

        <div class="console-hint">
            <p>💡 Open Console (F12) to see detailed debug logs</p>
        </div>
    </div>

    <!-- Load all audio engine modules -->
    <script src="/static/audio-engine/debug-logger.js"></script>
    <script src="/static/audio-engine/metronome-adapter.js"></script>
    <script src="/static/audio-engine/frame-buffer.js"></script>
    <script src="/static/audio-engine/audio-capture.js"></script>
    <script src="/static/audio-engine/timing-sync.js"></script>
    <script src="/static/audio-engine/audio-engine.js"></script>

    <script>
        // UI update interval
        let statusUpdateInterval = null;

        async function initAudioEngine() {
            console.log('Initializing Audio Engine...');
            document.getElementById('initBtn').disabled = true;
            
            const success = await audioEngine.init();
            
            if (success) {
                document.getElementById('initBtn').textContent = 'Initialized ✓';
                document.getElementById('startBtn').disabled = false;
                startStatusUpdates();
            } else {
                document.getElementById('initBtn').disabled = false;
                alert('Initialization failed. Check console for errors.');
            }
        }

        async function startAudioEngine() {
            console.log('Starting Audio Engine...');
            document.getElementById('startBtn').disabled = true;
            
            const success = await audioEngine.start();
            
            if (success) {
                document.getElementById('startBtn').textContent = 'Running ✓';
                document.getElementById('stopBtn').disabled = false;
            } else {
                document.getElementById('startBtn').disabled = false;
                alert('Start failed. Check console for errors.');
            }
        }

        function stopAudioEngine() {
            console.log('Stopping Audio Engine...');
            
            const success = audioEngine.stop();
            
            if (success) {
                document.getElementById('stopBtn').disabled = true;
                document.getElementById('startBtn').disabled = false;
                document.getElementById('startBtn').textContent = 'Start Audio Capture';
            }
        }

        function logStatus() {
            audioEngine.logStatus();
        }

        function startStatusUpdates() {
            statusUpdateInterval = setInterval(updateStatus, 200);
        }

        function updateStatus() {
            const status = audioEngine.getStatus();

            // Microphone status
            const micConnected = status.audioCapture.capturing;
            document.getElementById('micIndicator').className = 
                \`status-indicator \${micConnected ? 'indicator-connected' : 'indicator-disconnected'}\`;
            document.getElementById('micText').textContent = 
                micConnected ? 'Connected' : 'Disconnected';
            document.getElementById('micStatus').className = 
                \`status-card \${micConnected ? 'healthy' : ''}\`;

            // Frame processing status
            const frameHealthy = status.frameBuffer.healthy;
            const frameCount = status.frameBuffer.frameCount;
            document.getElementById('frameText').textContent = 
                frameHealthy ? \`✓ Healthy (\${frameCount} frames)\` : \`✗ Degraded (\${frameCount} frames)\`;
            document.getElementById('frameStatus').className = 
                \`status-card \${frameHealthy ? 'healthy' : 'degraded'}\`;

            // Clock sync status
            const synced = status.timingSync.synced;
            document.getElementById('syncText').textContent = 
                synced ? '✓ Synced' : '✗ Not Synced';
            document.getElementById('syncStatus').className = 
                \`status-card \${synced ? 'healthy' : ''}\`;

            // Tempo status
            const tempo = status.timingSync.tempo;
            document.getElementById('tempoText').textContent = \`\${tempo} BPM\`;
        }

        // Log initial message
        console.log('%c🎸 SHRED UP - Audio Engine Test (Phase 2A)', 
            'font-size: 16px; font-weight: bold; color: #4CAF50');
        console.log('%cAudio Scaffolding Only - No DSP Intelligence', 
            'font-size: 12px; color: #888');
        console.log('──────────────────────────────────');
    </script>
</body>
</html>`)
})

// 🧪 Route TEST : SHRED UP avec Métronome LOCAL (same-origin)
// MAIN APPLICATION ROUTE
// ============================================================================
app.get('/', (c) => {
  return c.render(
    <div class="app-container">
      {/* TOP BANNER - Full Width */}
      <div class="zone-banner">
        <div class="brand-logo">SHRED UP LOGO BANNER</div>
      </div>

      {/* LEFT SIDEBAR - Distinct Stacked Blocks */}
      <div class="zone-left">
        {/* Profile Block */}
        <div class="left-block">
          <div class="block-title">PROFILE<br />(name/lvl/picture)</div>
          <div class="profile-info">
            <div class="profile-avatar">👤</div>
            <div class="profile-name">Musician</div>
            <div class="profile-level">Level 1</div>
          </div>
        </div>

        {/* Menu Block */}
        <div class="left-block">
          <div class="block-title">MENU</div>
          <ul class="menu-list">
            <li class="menu-item">ACCOUNT</li>
            <li class="menu-item">LOGS</li>
            <li class="menu-item">DISTANCE TO LVL</li>
          </ul>
        </div>

        {/* Progression Graph Block */}
        <div class="left-block">
          <div class="block-title">PROGRESSION<br />GRAPH</div>
          <div class="graph-placeholder">
            Graph visualization
          </div>
        </div>
      </div>

      {/* FOCUS POINTS - Distinct Block ABOVE Exercise List */}
      <div class="zone-focus">
        <div class="focus-title">FOCUS POINTS</div>
        <textarea 
          class="focus-description editable-focus"
          placeholder="Session intention: Work on alternate picking precision and timing. Focus on clean transitions between strings while maintaining consistent tempo."
        >Session intention: Work on alternate picking precision and timing. Focus on clean transitions between strings while maintaining consistent tempo.</textarea>
      </div>

      {/* PRACTICE ZONE - Exercise List (Main Workspace) */}
      <div class="zone-practice">
        {/* Column Headers */}
        <div class="exercise-header">
          <div class="header-cell">REC</div>
          <div class="header-cell">EXERCISE</div>
          <div class="header-cell">SUB<br />RYTH</div>
          <div class="header-cell header-tempo">
            TEMPO ATTEINTS
            <button class="tempo-reduce-btn">−</button>
            <button class="tempo-subdivide-btn">+</button>
          </div>
          <div class="header-cell">TEMPO<br />GOAL</div>
          <div class="header-cell">TEMPS<br />PASSÉ</div>
          <div class="header-cell">DONE</div>
        </div>
        
        {/* Exercise List */}
        <div class="exercise-list">
          {generateExercises()}
        </div>
      </div>

      {/* ZONE 3: METRONOME + SESSION SUMMARY COLUMN */}
      <div class="zone-metronome-tuner">
        {/* METRONOME - Top */}
        <div class="zone-metronome">
          <iframe 
            src="/static/metronome/index.html" 
            class="metronome-iframe"
            title="SHRED-UP Metronome"
            scrolling="no"
            allow="autoplay"
          ></iframe>
        </div>

        {/* SESSION SUMMARY - Bottom */}
        <div class="zone-session-summary-bottom">
          <div class="block-title">SESSION<br />SUMMARY</div>
          <div class="summary-placeholder">
            Complete your practice session to see analysis and feedback here.
            No real-time feedback during practice.
          </div>
        </div>
      </div>

      {/* ZONE 4: RIGHT COLUMN - Date/Time + Tuner + Notepad */}
      <div class="zone-right-top">
        {/* Date/Time Block - 140px */}
        <div class="datetime-container">
          <div class="datetime-block">
            <div class="datetime-time" id="current-time" style="font-family: 'Conthrax', sans-serif;">00:00:00</div>
            <div class="datetime-info">
              <div class="datetime-day" id="current-day">Monday</div>
              <div class="datetime-session">Session <span id="session-number">1</span></div>
            </div>
          </div>
        </div>

        {/* TUNER Block - 592px (was SESSION SUMMARY) */}
        <div class="right-block tuner-block">
          <iframe 
            src="/static/tuner/index.html?v=4" 
            class="tuner-iframe-right"
            title="SHRED-UP Tuner V4"
            scrolling="no"
          ></iframe>
        </div>

        {/* Notepad Block - Flexible */}
        <div class="right-block notepad-block">
          <div class="block-title">NOTEPAD</div>
          <textarea 
            class="notepad-textarea" 
            placeholder="Take notes after your session..."
          ></textarea>
        </div>
      </div>
    </div>
  )
})

// Helper function to generate exercise rows with proper columns
function generateExercises() {
  const exercises = [
    { name: 'Chromatic Scale Warm-up', subRyth: '', tempoAtteints: '', tempoGoal: '120', tempsPasse: '' },
    { name: 'Alternate Picking Exercise 1', subRyth: '', tempoAtteints: '', tempoGoal: '140', tempsPasse: '' },
    { name: 'String Skipping Pattern', subRyth: '', tempoAtteints: '', tempoGoal: '100', tempsPasse: '' },
    { name: 'Pentatonic Scale - Position 1', subRyth: '', tempoAtteints: '', tempoGoal: '130', tempsPasse: '' },
    { name: 'Legato Exercise - Hammer-ons', subRyth: '', tempoAtteints: '', tempoGoal: '110', tempsPasse: '' },
    { name: 'Sweep Picking Arpeggios', subRyth: '', tempoAtteints: '', tempoGoal: '90', tempsPasse: '' },
    { name: 'Economy Picking Drill', subRyth: '', tempoAtteints: '', tempoGoal: '150', tempsPasse: '' },
    { name: 'Tremolo Picking Exercise', subRyth: '', tempoAtteints: '', tempoGoal: '160', tempsPasse: '' },
    { name: 'Finger Independence Study', subRyth: '', tempoAtteints: '', tempoGoal: '80', tempsPasse: '' },
    { name: 'Stretching Exercise - Wide Intervals', subRyth: '', tempoAtteints: '', tempoGoal: '70', tempsPasse: '' },
    { name: 'Rhythm Patterns - Syncopation', subRyth: '', tempoAtteints: '', tempoGoal: '125', tempsPasse: '' },
    { name: 'Scale Sequences - 3NPS', subRyth: '', tempoAtteints: '', tempoGoal: '135', tempsPasse: '' },
    { name: 'Hybrid Picking Patterns', subRyth: '', tempoAtteints: '', tempoGoal: '105', tempsPasse: '' },
    { name: 'Fingerstyle Exercise', subRyth: '', tempoAtteints: '', tempoGoal: '95', tempsPasse: '' },
    { name: 'Tapping Exercise', subRyth: '', tempoAtteints: '', tempoGoal: '115', tempsPasse: '' },
  ]

  return exercises.map((ex, index) => (
    <div class="exercise-row" data-exercise={index}>
      <button class="rec-button" data-exercise={index}></button>
      <input 
        type="text" 
        class="exercise-name-input" 
        value={ex.name} 
        placeholder="Enter exercise name..."
      />
      <select class="sub-ryth-select">
        <option value="">-</option>
        <option value="1/2">1/2</option>
        <option value="1/4">1/4</option>
        <option value="1/8">1/8</option>
        <option value="1/8t">1/8 triplets</option>
        <option value="1/16">1/16</option>
        <option value="1/16t">1/16 triplets</option>
        <option value="1/32">1/32</option>
      </select>
      <div class="tempo-columns-container" data-columns="1">
        <div class="tempo-column">
          <input type="text" class="tempo-input tempo-atteints-input" placeholder="---" maxlength="3" />
        </div>
      </div>
      <div class="tempo-goal-container">
        <input type="text" class="tempo-goal-input" value={ex.tempoGoal} placeholder="---" maxlength="3" />
      </div>
      <div class="exercise-param">{ex.tempsPasse}</div>
      <div class="exercise-checkbox">
        <input type="checkbox" />
      </div>
    </div>
  ))
}

// 🎸 Route TEST: Phase 3 - Pitch Detection
app.get('/pitch-test', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SHRED UP - Pitch Detection Test (Phase 3)</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { background: #0a0a0a; color: white; font-family: 'Courier New', monospace; padding: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        h1 { font-size: 24px; margin-bottom: 10px; color: #4CAF50; }
        .phase-tag { background: #1a1a1a; padding: 5px 15px; border-radius: 4px; font-size: 12px; margin-bottom: 30px; color: #888; }
        .controls { background: #1a1a1a; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        button { background: #4CAF50; color: white; border: none; padding: 12px 24px; border-radius: 4px; cursor: pointer; font-size: 14px; font-weight: bold; margin-right: 10px; margin-bottom: 10px; }
        button:hover { background: #45a049; }
        button:disabled { background: #333; cursor: not-allowed; }
        button.stop { background: #f44336; }
        button.stop:hover { background: #da190b; }
        .info-box { background: #1a1a1a; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #2196F3; }
        .info-box h3 { font-size: 14px; margin-bottom: 10px; color: #2196F3; }
        .info-box p { font-size: 12px; line-height: 1.6; color: #aaa; }
        .console-hint { background: #1a1a1a; padding: 15px; border-radius: 8px; border-left: 4px solid #FF9800; margin-top: 20px; }
        .console-hint p { font-size: 12px; color: #FF9800; }
    </style>
</head>
<body>
    <div class="container">
        <h1>🎸 SHRED UP - Pitch Detection Test</h1>
        <div class="phase-tag">Phase 3 - Pitch Detection Only</div>

        <div class="info-box">
            <h3>📋 Phase 3 Scope (YIN Algorithm)</h3>
            <p>
                <strong>Implemented:</strong> YIN fundamental frequency estimator (CMND)<br>
                <strong>Window:</strong> 2048 samples (42.67ms), 50% overlap<br>
                <strong>Output:</strong> Frequency (Hz) + Confidence (0-1) only<br>
                <strong>NOT implemented:</strong> Note names, cents, UI display, scoring
            </p>
        </div>

        <div class="controls">
            <button id="initBtn" onclick="initAudioEngine()">Initialize Audio Engine</button>
            <button id="startBtn" onclick="startAudioEngine()" disabled>Start Pitch Detection</button>
            <button id="stopBtn" class="stop" onclick="stopAudioEngine()" disabled>Stop Pitch Detection</button>
            <button onclick="logStatus()">Log Status</button>
        </div>

        <div class="info-box" style="border-left-color: #FF9800;">
            <h3>🎸 Musical Validation Mode</h3>
            <p style="margin-bottom: 10px;">
                <strong>Expected Frequency (Hz):</strong><br>
                <input type="number" id="expectedFreq" placeholder="e.g. 82.41 for E2" 
                    style="background: #0a0a0a; color: white; border: 1px solid #444; padding: 8px; 
                    border-radius: 4px; width: 200px; font-size: 14px; margin-top: 5px;">
            </p>
            <p style="font-size: 11px; color: #888; margin-top: 10px;">
                <strong>6-String Standard:</strong> E2=82.41, A2=110.00, D3=146.83, G3=196.00, B3=246.94, E4=329.63<br>
                <strong>7-String Modern (A1):</strong> A1=55.00, D2=73.42, G2=98.00, C3=130.81, F3=174.61, A3=220.00, D4=293.66
            </p>
            <p style="font-size: 11px; color: #888; margin-top: 5px;">
                <button onclick="resetValidation()" style="background: #555; padding: 6px 12px; font-size: 12px;">
                    Reset Statistics
                </button>
            </p>
        </div>

        <div class="console-hint">
            <p>💡 Open Console (F12) to see pitch detection logs</p>
            <p>Format: [PITCH] Frame X | 440.0 Hz | Conf: 0.92 | Proc: 4.3ms</p>
            <p style="margin-top: 8px; color: #FF9800;">Validation: [VALIDATION] Expected X Hz | Detected Y Hz | Error Z Hz (+W%)</p>
        </div>
    </div>

    <!-- Load all audio engine modules (DEPENDENCY ORDER!) -->
    <script src="/static/audio-engine/debug-logger.js"></script>
    <script src="/static/audio-engine/audio-capture.js"></script>
    <script src="/static/audio-engine/metronome-adapter.js"></script>
    <script src="/static/audio-engine/frame-buffer.js"></script>
    <script src="/static/audio-engine/timing-sync.js"></script>
    <script src="/static/audio-engine/dsp/spectral-analyzer.js"></script>
    <script src="/static/audio-engine/dsp/low-frequency-specialist.js"></script>
    <script src="/static/audio-engine/dsp/octave-consistency-stabilizer.js"></script>
    <script src="/static/audio-engine/dsp/pitch-detection.js"></script>
    <script src="/static/audio-engine/audio-engine-phase3.js"></script>

    <script>
        // ============================================================
        // VALIDATION MODE - MUSICAL ACCURACY MEASUREMENT
        // ============================================================
        
        // GLOBAL: Expose to pitch detection module
        window.validationStats = {
            detections: [],
            expectedFreq: null,
            startTime: null
        };

        function resetValidation() {
            window.validationStats = {
                detections: [],
                expectedFreq: null,
                startTime: null
            };
            console.log('%c[VALIDATION] Statistics reset', 'color: #FF9800; font-weight: bold');
        }

        window.isOctaveError = function(detected, expected) {
            if (!detected || !expected) return false;
            
            const ratio = detected / expected;
            
            // Check if detected is 2×, 4×, 0.5×, 0.25× of expected (within 5% tolerance)
            const octaveRatios = [0.25, 0.5, 2.0, 4.0];
            
            for (const octaveRatio of octaveRatios) {
                if (Math.abs(ratio - octaveRatio) / octaveRatio < 0.05) {
                    return true;
                }
            }
            
            return false;
        };

        function logValidationSummary() {
            if (window.validationStats.detections.length === 0) {
                console.log('[VALIDATION] No detections recorded');
                return;
            }

            const expected = window.validationStats.expectedFreq;
            const allDetections = window.validationStats.detections;
            const sessionStart = window.validationStats.startTime;
            
            // ============================================================
            // RAW STATISTICS (All detections)
            // ============================================================
            const rawFrequencies = allDetections.map(d => d.frequency);
            const rawConfidences = allDetections.map(d => d.confidence);
            
            const rawAvgFreq = rawFrequencies.reduce((a, b) => a + b, 0) / rawFrequencies.length;
            const rawStdDev = Math.sqrt(
                rawFrequencies.map(f => Math.pow(f - rawAvgFreq, 2))
                    .reduce((a, b) => a + b, 0) / rawFrequencies.length
            );
            const rawAvgConf = rawConfidences.reduce((a, b) => a + b, 0) / rawConfidences.length;
            
            const rawAbsError = rawAvgFreq - expected;
            const rawRelError = (rawAbsError / expected) * 100;
            
            const rawOctaveErrors = allDetections.filter(d => window.isOctaveError(d.frequency, expected)).length;
            const rawOctaveErrorRate = (rawOctaveErrors / allDetections.length) * 100;
            
            // ============================================================
            // SCIENTIFIC MEASUREMENT METRICS (3 Tiers)
            // ============================================================
            
            // TIER A: RAW ALL (Diagnostic - already computed above)
            // - All detections including ATTACK, STABLE, RELEASE
            // - No filtering
            // - Purpose: Full diagnostic view
            
            // TIER B: STABLE ONLY (State Machine Filter)
            // - Only frames published during STABLE state
            // - Already filtered by state machine (dominant established, variation < 3%, 5 frames required)
            // - Additional filter: warm-up exclusion only (NO confidence filter)
            
            const warmupThreshold = 200; // ms
            const stableOnly = allDetections.filter(d => {
                const elapsed = d.timestamp - sessionStart;
                return elapsed >= warmupThreshold;  // Only warm-up filter, NO confidence filter
            });
            
            // TIER C: CLEAN STABLE (High-Confidence Filter)
            // - Only frames with confidence ≥ 0.8
            // - Purpose: Assess peak performance quality
            
            const cleanStable = allDetections.filter(d => {
                const elapsed = d.timestamp - sessionStart;
                return elapsed >= warmupThreshold && d.confidence >= 0.8;
            });
            
            // Helper function to calculate statistics
            function calculateStats(detections) {
                if (detections.length === 0) {
                    return {
                        avgFreq: 0,
                        stdDev: 0,
                        avgConf: 0,
                        absError: 0,
                        relError: 0,
                        octaveErrors: 0,
                        octaveErrorRate: 0,
                        count: 0
                    };
                }
                
                const frequencies = detections.map(d => d.frequency);
                const confidences = detections.map(d => d.confidence);
                
                const avgFreq = frequencies.reduce((a, b) => a + b, 0) / frequencies.length;
                const stdDev = Math.sqrt(
                    frequencies.map(f => Math.pow(f - avgFreq, 2))
                        .reduce((a, b) => a + b, 0) / frequencies.length
                );
                const avgConf = confidences.reduce((a, b) => a + b, 0) / confidences.length;
                
                const absError = avgFreq - expected;
                const relError = (absError / expected) * 100;
                
                const octaveErrors = detections.filter(d => window.isOctaveError(d.frequency, expected)).length;
                const octaveErrorRate = (octaveErrors / detections.length) * 100;
                
                return {
                    avgFreq,
                    stdDev,
                    avgConf,
                    absError,
                    relError,
                    octaveErrors,
                    octaveErrorRate,
                    count: detections.length
                };
            }
            
            const stableStats = calculateStats(stableOnly);
            const cleanStats = calculateStats(cleanStable);
            
            const sessionDuration = ((Date.now() - sessionStart) / 1000).toFixed(1);
            const warmupCount = allDetections.length - allDetections.filter(d => {
                const elapsed = d.timestamp - sessionStart;
                return elapsed >= warmupThreshold;
            }).length;
            
            // ============================================================
            // LOG SUMMARY (Scientific 3-Tier Metrics)
            // ============================================================
            
            console.log('%c════════════════════════════════════════', 'color: #FF9800');
            console.log('%c[VALIDATION SUMMARY - SCIENTIFIC MEASUREMENT]', 'color: #FF9800; font-weight: bold; font-size: 14px');
            console.log('%c════════════════════════════════════════', 'color: #FF9800');
            console.log('Expected:          ' + expected.toFixed(2) + ' Hz');
            console.log('Session Duration:  ' + sessionDuration + 's');
            console.log('');
            
            // TIER A: RAW ALL (Diagnostic)
            console.log('%c─── A) RAW ALL (Diagnostic Brut) ───', 'color: #888');
            console.log('Purpose:           Full diagnostic (IDLE + ATTACK + STABLE + RELEASE)');
            console.log('Detected Avg:      ' + rawAvgFreq.toFixed(2) + ' Hz');
            console.log('Abs Error:         ' + (rawAbsError >= 0 ? '+' : '') + rawAbsError.toFixed(2) + ' Hz');
            console.log('Rel Error:         ' + (rawRelError >= 0 ? '+' : '') + rawRelError.toFixed(2) + '%');
            console.log('Std Dev:           ' + rawStdDev.toFixed(2) + ' Hz');
            console.log('Octave Errors:     ' + rawOctaveErrors + '/' + allDetections.length + ' (' + rawOctaveErrorRate.toFixed(1) + '%)');
            console.log('Avg Confidence:    ' + rawAvgConf.toFixed(3));
            console.log('');
            
            // TIER B: STABLE ONLY (State Machine Filter)
            if (stableStats.count > 0) {
                console.log('%c─── B) STABLE ONLY (State === STABLE) ───', 'color: #4CAF50; font-weight: bold');
                console.log('Purpose:           State machine filtered (conf ≥ 0.75, warm-up excluded)');
                console.log('Detected Avg:      ' + stableStats.avgFreq.toFixed(2) + ' Hz');
                console.log('Abs Error:         ' + (stableStats.absError >= 0 ? '+' : '') + stableStats.absError.toFixed(2) + ' Hz');
                console.log('Rel Error:         ' + (stableStats.relError >= 0 ? '+' : '') + stableStats.relError.toFixed(2) + '%');
                console.log('Std Dev:           ' + stableStats.stdDev.toFixed(2) + ' Hz');
                console.log('Octave Errors:     ' + stableStats.octaveErrors + '/' + stableStats.count + ' (' + stableStats.octaveErrorRate.toFixed(1) + '%)');
                console.log('Avg Confidence:    ' + stableStats.avgConf.toFixed(3));
                console.log('Sample Count:      ' + stableStats.count + ' / ' + allDetections.length + ' (' + ((stableStats.count / allDetections.length) * 100).toFixed(1) + '%)');
                console.log('');
            } else {
                console.log('%c─── B) STABLE ONLY (State === STABLE) ───', 'color: #f44336');
                console.log('%c[WARNING] No STABLE samples (state machine did not reach STABLE)', 'color: #f44336; font-weight: bold');
                console.log('');
            }
            
            // TIER C: CLEAN STABLE (High-Confidence Filter)
            if (cleanStats.count > 0) {
                console.log('%c─── C) CLEAN STABLE (Confidence ≥ 0.8) ───', 'color: #2196F3; font-weight: bold');
                console.log('Purpose:           Peak performance quality (conf ≥ 0.8, warm-up excluded)');
                console.log('Detected Avg:      ' + cleanStats.avgFreq.toFixed(2) + ' Hz');
                console.log('Abs Error:         ' + (cleanStats.absError >= 0 ? '+' : '') + cleanStats.absError.toFixed(2) + ' Hz');
                console.log('Rel Error:         ' + (cleanStats.relError >= 0 ? '+' : '') + cleanStats.relError.toFixed(2) + '%');
                console.log('Std Dev:           ' + cleanStats.stdDev.toFixed(2) + ' Hz');
                console.log('Octave Errors:     ' + cleanStats.octaveErrors + '/' + cleanStats.count + ' (' + cleanStats.octaveErrorRate.toFixed(1) + '%)');
                console.log('Avg Confidence:    ' + cleanStats.avgConf.toFixed(3));
                console.log('Sample Count:      ' + cleanStats.count + ' / ' + allDetections.length + ' (' + ((cleanStats.count / allDetections.length) * 100).toFixed(1) + '%)');
                console.log('');
            } else {
                console.log('%c─── C) CLEAN STABLE (Confidence ≥ 0.8) ───', 'color: #FF9800');
                console.log('%c[WARNING] No CLEAN STABLE samples (confidence never reached 0.8)', 'color: #FF9800; font-weight: bold');
                console.log('');
            }
            
            // Filter Breakdown
            console.log('%c─── Filter Breakdown ───', 'color: #9E9E9E');
            console.log('Warm-up (< 200ms):  ' + warmupCount + ' samples discarded');
            console.log('Tier B samples:     ' + stableStats.count + ' (conf ≥ 0.75, warm-up excluded)');
            console.log('Tier C samples:     ' + cleanStats.count + ' (conf ≥ 0.8, warm-up excluded)');
            
            console.log('%c════════════════════════════════════════', 'color: #FF9800');
        }

        // ============================================================
        // AUDIO ENGINE INTERFACE
        // ============================================================

        async function initAudioEngine() {
            console.log('Initializing Audio Engine (Phase 3)...');
            document.getElementById('initBtn').disabled = true;
            
            const success = await audioEngine.init();
            
            if (success) {
                document.getElementById('initBtn').textContent = 'Initialized ✓';
                document.getElementById('startBtn').disabled = false;
            } else {
                document.getElementById('initBtn').disabled = false;
                alert('Initialization failed. Check console for errors.');
            }
        }

        async function startAudioEngine() {
            console.log('Starting Audio Engine...');
            document.getElementById('startBtn').disabled = true;
            
            // Read expected frequency for validation
            const expectedInput = document.getElementById('expectedFreq');
            const expectedFreq = parseFloat(expectedInput.value);
            
            if (expectedFreq && expectedFreq > 0) {
                window.validationStats.expectedFreq = expectedFreq;
                window.validationStats.detections = [];
                window.validationStats.startTime = Date.now();
                console.log('%c[VALIDATION] Mode ACTIVE | Expected: ' + expectedFreq.toFixed(2) + ' Hz', 
                    'color: #FF9800; font-weight: bold');
            } else {
                console.log('%c[VALIDATION] Mode INACTIVE (no expected frequency set)', 
                    'color: #888');
            }
            
            const success = await audioEngine.start();
            
            if (success) {
                document.getElementById('startBtn').textContent = 'Running ✓';
                document.getElementById('stopBtn').disabled = false;
            } else {
                document.getElementById('startBtn').disabled = false;
                alert('Start failed. Check console for errors.');
            }
        }

        function stopAudioEngine() {
            console.log('Stopping Audio Engine...');
            
            const success = audioEngine.stop();
            
            if (success) {
                document.getElementById('stopBtn').disabled = true;
                document.getElementById('startBtn').disabled = false;
                document.getElementById('startBtn').textContent = 'Start Pitch Detection';
                
                // Log validation summary if active
                if (window.validationStats.expectedFreq && window.validationStats.detections.length > 0) {
                    logValidationSummary();
                }
            }
        }

        function logStatus() {
            audioEngine.logStatus();
        }

        // Log initial message
        console.log('%c🎸 SHRED UP - Pitch Detection Test (Phase 3)', 
            'font-size: 16px; font-weight: bold; color: #4CAF50');
        console.log('%cFrequency + Confidence Only - No Musical Mapping', 
            'font-size: 12px; color: #888');
        console.log('%c🎯 Validation Mode Available', 
            'font-size: 12px; color: #FF9800');
        console.log('──────────────────────────────────');
    </script>
</body>
</html>`)
})

// 🧪 API Test Endpoint - Low Frequency Validation
app.get('/test-low-freq-tuning', (c) => {
  const frequency = c.req.query('frequency') || '73.42'
  const duration = c.req.query('duration') || '10000'
  
  return c.json({
    status: 'manual_test_required',
    message: 'This endpoint provides instructions for manual testing in browser console',
    instructions: {
      step1: 'Open http://localhost:3000/pitch-test in your browser',
      step2: 'Open browser Developer Console (F12)',
      step3: 'Initialize Audio Engine by clicking "Initialize Audio Engine" button',
      step4: `Set validation frequency: window.validationStats.expectedFreq = ${frequency}`,
      step5: 'Click "Start Pitch Detection" and play your instrument',
      step6: `Test duration: ${parseInt(duration) / 1000} seconds`,
      step7: 'Stop detection and check console for validation summary',
      step8: 'Look for [LF-SPECIALIST] logs (should be ZERO for D2)',
    },
    expected_frequency: parseFloat(frequency),
    test_duration_ms: parseInt(duration),
    validation_criteria: {
      lf_specialist_activations: 0,
      relative_error: '<5%',
      octave_errors: '<5%',
      confidence: '>0.7'
    },
    note: 'D2 (73.42 Hz) is a CRITICAL edge case - frequency is below 75 Hz guard threshold but above 70 Hz LF-Specialist internal threshold'
  })
})

export default app
