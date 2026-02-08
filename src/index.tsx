import { Hono } from 'hono'
import { renderer } from './renderer'

const app = new Hono()

app.use(renderer)

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
        <div class="focus-description">
          Session intention: Work on alternate picking precision and timing.
          Focus on clean transitions between strings while maintaining consistent tempo.
        </div>
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

      {/* METRONOME + TUNER COLUMN - Stacked Vertically */}
      <div class="zone-metronome-tuner">
        {/* METRONOME - Top */}
        <div class="zone-metronome">
          <div class="metronome-container">
            {/* Beat Indicators */}
            <div class="metronome-header">
              <div class="metronome-beats">
                <div class="beat-indicator active"></div>
                <div class="beat-indicator"></div>
                <div class="beat-indicator"></div>
                <div class="beat-indicator"></div>
              </div>
              <div class="beat-label">BEAT 1 / BEAT 2 / BEAT 3 / BEAT 4</div>
            </div>

            {/* BPM Display */}
            <div class="metronome-display">
              <div class="bpm-value">114</div>
              <div class="bpm-label">BPM</div>
            </div>

            {/* Controls */}
            <div class="metronome-controls">
              <button class="control-button">▶</button>
              <button class="control-button">■</button>
            </div>

            {/* BPM Slider */}
            <div class="bpm-slider-container">
              <input 
                type="range" 
                class="slider-input" 
                min="40" 
                max="240" 
                value="114" 
                orient="vertical"
              />
            </div>

            {/* Timer */}
            <div class="metronome-timer">
              <div class="block-title">TIMER</div>
              <div class="timer-value">00:00</div>
            </div>
          </div>
        </div>

        {/* TUNER - Bottom */}
        <div class="zone-tuner">
          <div class="tuner-container">
            <div class="block-title">TUNER</div>
            <div class="tuner-display">A4</div>
            <div class="tuner-indicator">
              <div class="tuner-needle"></div>
            </div>
            <div class="tuner-frequency">440 Hz</div>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN - Date/Time + Session Summary + Notepad */}
      <div class="zone-right-top">
        {/* Date/Time Block - 725px */}
        <div class="datetime-container">
          <div class="datetime-block">
            <div class="datetime-time" id="current-time">00:00:00</div>
            <div class="datetime-info">
              <div class="datetime-day" id="current-day">Monday</div>
              <div class="datetime-session">Session <span id="session-number">1</span></div>
            </div>
          </div>
        </div>

        {/* Session Summary Block - 725px */}
        <div class="right-block session-summary-block">
          <div class="block-title">SESSION<br />SUMMARY</div>
          <div class="summary-placeholder">
            Complete your practice session to see analysis and feedback here.
            No real-time feedback during practice.
          </div>
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
          <input type="text" class="tempo-input" placeholder="---" maxlength="3" />
        </div>
      </div>
      <div class="exercise-param">{ex.tempoGoal}</div>
      <div class="exercise-param">{ex.tempsPasse}</div>
      <div class="exercise-checkbox">
        <input type="checkbox" />
      </div>
    </div>
  ))
}

export default app
