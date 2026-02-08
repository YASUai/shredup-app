import { Hono } from 'hono'
import { renderer } from './renderer'

const app = new Hono()

app.use(renderer)

// Route pour le métronome scaled (-10% centré - VALIDÉ)
app.get('/metronome-scaled', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SHRED-UP Metronome Scaled</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            width: 400px;
            height: 800px;
            overflow: hidden;
            background: #1A1A1A; /* ✅ Background qui remplit tout */
            position: relative;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .metronome-wrapper {
            width: 100%; /* ✅ Remplir tout le body */
            height: 100%;
            display: flex;
            justify-content: center;
            align-items: center;
            background: #1A1A1A; /* ✅ Background uniforme */
        }

        .metronome-iframe {
            width: 414px;
            height: 896px;
            border: none;
            transform-origin: center center;
            /* ✅ SCALE RÉDUIT DE 10%: 0.9662 × 0.9 = 0.86958 */
            transform: scale(0.86958);
        }
    </style>
</head>
<body>
    <div class="metronome-wrapper">
        <iframe 
            src="https://7777-idisowycqqgdrvtdl8cr9-8f57ffe2.sandbox.novita.ai/" 
            class="metronome-iframe"
            title="SHRED-UP Metronome"
            scrolling="no"
            allow="autoplay"
        ></iframe>
    </div>

    <script>
        window.addEventListener('message', (event) => {
            const metronomeIframe = document.querySelector('.metronome-iframe');
            if (metronomeIframe && metronomeIframe.contentWindow) {
                metronomeIframe.contentWindow.postMessage(event.data, '*');
            }
        });

        window.addEventListener('message', (event) => {
            if (window.parent !== window) {
                window.parent.postMessage(event.data, '*');
            }
        });
    </script>
</body>
</html>`)
})

// 🧪 TEST - Route pour le métronome scaled réduit de 10% (Option B - Centré)
app.get('/metronome-scaled-test', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>SHRED-UP Metronome Scaled TEST (-10%)</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            width: 400px;
            height: 800px;
            overflow: hidden;
            background: #1A1A1A;
            position: relative;
            margin: 0;
            padding: 0;
        }

        .metronome-wrapper {
            position: absolute;
            top: 0;
            left: 0;
            width: 400px;
            height: 800px;
            overflow: hidden;
            background: #1A1A1A;
            /* 🎯 OPTION B: Centrer le métronome */
            display: flex;
            justify-content: center;
            align-items: center;
        }

        .metronome-iframe {
            width: 414px;
            height: 896px;
            border: none;
            transform-origin: center center; /* ✅ CHANGÉ: top left → center center */
            /* 🎯 SCALE RÉDUIT DE 10%: 0.9662 × 0.9 = 0.86958 */
            transform: scale(0.86958);
        }
    </style>
</head>
<body>
    <div class="metronome-wrapper">
        <iframe 
            src="https://7777-idisowycqqgdrvtdl8cr9-8f57ffe2.sandbox.novita.ai/" 
            class="metronome-iframe"
            title="SHRED-UP Metronome (Test -10%)"
            scrolling="no"
            allow="autoplay"
        ></iframe>
    </div>

    <script>
        window.addEventListener('message', (event) => {
            const metronomeIframe = document.querySelector('.metronome-iframe');
            if (metronomeIframe && metronomeIframe.contentWindow) {
                metronomeIframe.contentWindow.postMessage(event.data, '*');
            }
        });

        window.addEventListener('message', (event) => {
            if (window.parent !== window) {
                window.parent.postMessage(event.data, '*');
            }
        });
    </script>
</body>
</html>`)
})

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
          <iframe 
            src="/metronome-scaled" 
            class="metronome-iframe"
            title="SHRED-UP Metronome"
            scrolling="no"
            allow="autoplay"
          ></iframe>
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
