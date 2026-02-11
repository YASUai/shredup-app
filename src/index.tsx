import { Hono } from 'hono'
import { renderer } from './renderer'

const app = new Hono()

app.use(renderer)

// 🧪 Route pour le métronome LOCAL (intégré same-origin)
// Redirige vers le fichier statique
app.get('/metronome-local', (c) => {
  return c.redirect('/static/metronome/index.html')
})

// 🧪 Route TEST : SHRED UP avec Métronome LOCAL (same-origin)
app.get('/test-local', (c) => {
  return c.render(
    <div class="app-container">
      {/* TOP BANNER - Full Width */}
      <div class="zone-banner">
        <div class="brand-logo">SHRED UP - TEST LOCAL METRONOME 🧪</div>
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
          🧪 TEST VERSION : Métronome LOCAL intégré (same-origin)
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
        {/* METRONOME - Top - 🧪 VERSION LOCAL */}
        <div class="zone-metronome">
          <iframe 
            src="/static/metronome/index.html" 
            class="metronome-iframe"
            title="SHRED-UP Metronome LOCAL"
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
            🧪 TEST VERSION LOCALE - Same Origin
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

// 🧪 Route TEST SIDE-BY-SIDE : Métronome Local vs External
app.get('/metronome-compare', (c) => {
  return c.html(`<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>COMPARE : Métronome Local vs External</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            background: #0a0a0a;
            color: white;
            font-family: Arial, sans-serif;
            padding: 20px;
        }

        h1 {
            text-align: center;
            margin-bottom: 20px;
            font-size: 24px;
        }

        .compare-container {
            display: flex;
            gap: 20px;
            justify-content: center;
            align-items: start;
        }

        .metronome-box {
            width: 400px;
            position: relative;
        }

        .metronome-box h2 {
            background: #1a1a1a;
            padding: 10px;
            text-align: center;
            border-radius: 8px 8px 0 0;
            font-size: 18px;
        }

        .metronome-box.local h2 {
            background: #1a4d1a;
        }

        .metronome-box.external h2 {
            background: #4d1a1a;
        }

        iframe {
            width: 400px;
            height: 800px;
            border: none;
            display: block;
            border-radius: 0 0 8px 8px;
        }

        .instructions {
            background: #1a1a1a;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 20px;
            max-width: 820px;
            margin-left: auto;
            margin-right: auto;
        }

        .instructions h3 {
            margin-bottom: 10px;
            color: #4CAF50;
        }

        .instructions ul {
            margin-left: 20px;
        }

        .instructions li {
            margin-bottom: 8px;
        }
    </style>
</head>
<body>
    <h1>🔍 COMPARAISON : Métronome Local vs External</h1>
    
    <div class="instructions">
        <h3>📋 INSTRUCTIONS DE TEST :</h3>
        <ul>
            <li><strong>GAUCHE (LOCAL) :</strong> Métronome intégré dans SHRED UP (same-origin)</li>
            <li><strong>DROITE (EXTERNAL) :</strong> Métronome externe via port 7777 (cross-origin)</li>
            <li><strong>À VÉRIFIER :</strong>
                <ul>
                    <li>✅ Apparence visuelle identique ?</li>
                    <li>✅ Bouton Play/Stop fonctionne ?</li>
                    <li>✅ TAP Tempo via ArrowLeft fonctionne ?</li>
                    <li>✅ Modales BEAT/BAR/NOTE s'ouvrent ?</li>
                    <li>✅ Inputs fonctionnent dans les modales ?</li>
                    <li>✅ Slider BPM fonctionne ?</li>
                    <li>✅ Raccourcis clavier : SPACE / ← / + / - / ↑ / ↓</li>
                </ul>
            </li>
        </ul>
    </div>

    <div class="compare-container">
        <div class="metronome-box local">
            <h2>🟢 LOCAL (Same-Origin)</h2>
            <iframe 
                src="/metronome-local" 
                title="Métronome Local"
                scrolling="no"
                allow="autoplay"
            ></iframe>
        </div>

        <div class="metronome-box external">
            <h2>🔴 EXTERNAL (Port 7777)</h2>
            <iframe 
                src="/metronome-scaled" 
                title="Métronome External"
                scrolling="no"
                allow="autoplay"
            ></iframe>
        </div>
    </div>
</body>
</html>`)
})

// 🧪 Route pour le métronome LOCAL (intégré same-origin)
app.get('/metronome-local', async (c) => {
  const html = await Bun.file('public/static/metronome-backup/index.html').text()
  return c.html(html)
})

// Route pour servir les assets du métronome local
app.get('/metronome-local/:filename', async (c) => {
  const filename = c.req.param('filename')
  const filePath = `public/static/metronome-backup/${filename}`
  
  try {
    const file = Bun.file(filePath)
    
    // Déterminer le Content-Type
    let contentType = 'text/plain'
    if (filename.endsWith('.js')) contentType = 'application/javascript'
    else if (filename.endsWith('.css')) contentType = 'text/css'
    else if (filename.endsWith('.mp3')) contentType = 'audio/mpeg'
    else if (filename.endsWith('.json')) contentType = 'application/json'
    else if (filename.endsWith('.svg')) contentType = 'image/svg+xml'
    
    return new Response(file, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'no-cache'
      }
    })
  } catch (error) {
    return c.text('File not found', 404)
  }
})

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
            position: relative;
            margin: 0;
            padding: 0;
            background: #141414; /* Backup background */
        }

        .metronome-wrapper {
            width: 100%;
            height: 100%;
            position: relative;
            overflow: hidden;
            background: #141414; /* Backup background */
        }

        .metronome-iframe {
            /* ✅ EXACTEMENT la taille du conteneur - pas de scale ! */
            width: 100%;
            height: 100%;
            border: none;
            display: block;
        }
    </style>
</head>
<body>
    <div class="metronome-wrapper">
        <iframe 
            src="https://7777-iopksqtiphh7vk63ml8pt-c07dda5e.sandbox.novita.ai/" 
            class="metronome-iframe"
            title="SHRED-UP Metronome"
            scrolling="no"
            allow="autoplay"
        ></iframe>
    </div>

    <script>
        // ✅ UN SEUL listener - SANS await, juste forward
        window.addEventListener('message', (event) => {
            console.log('[PROXY] Message reçu:', event.data);
            
            const metronomeIframe = document.querySelector('.metronome-iframe');
            
            // Si le message vient du parent (SHRED UP) → forward vers iframe métronome
            if (event.source === window.parent && metronomeIframe?.contentWindow) {
                console.log('[PROXY] Forward vers métronome:', event.data);
                // ✅ CRITIQUE: Pas de await ici, juste forward immédiatement
                metronomeIframe.contentWindow.postMessage(event.data, '*');
            }
            // Si le message vient de l'iframe métronome → forward vers parent
            else if (event.source === metronomeIframe?.contentWindow && window.parent !== window) {
                console.log('[PROXY] Forward vers parent:', event.data);
                window.parent.postMessage(event.data, '*');
            }
        });

        // 🔒 ATTENDRE QUE L'IFRAME SOIT CHARGÉE avant d'ajouter le listener keydown
        window.addEventListener('DOMContentLoaded', () => {
            console.log('[PROXY DEBUG] DOMContentLoaded - Setting up keyboard listener');
            
            const metronomeIframe = document.querySelector('.metronome-iframe');
            if (!metronomeIframe) {
                console.error('[PROXY DEBUG] ❌ Iframe .metronome-iframe NOT FOUND in DOM!');
                return;
            }
            
            console.log('[PROXY DEBUG] ✅ Iframe found:', metronomeIframe);

            // 🔒 Capturer les événements clavier DANS LE PROXY
            // Et les forward vers l'iframe métronome via postMessage
            window.addEventListener('keydown', (e) => {
                console.log('[PROXY DEBUG] Keydown captured:', e.code, 'target:', e.target.tagName);
                
                if (!metronomeIframe?.contentWindow) {
                    console.log('[PROXY DEBUG] ❌ Iframe contentWindow not available');
                    return;
                }

                let action = null;
                let shouldPreventDefault = false;

                switch(e.code) {
                    case 'Space':
                        shouldPreventDefault = true;
                        action = 'TOGGLE_PLAY';
                        console.log('[PROXY] ⌨️ SPACE → TOGGLE_PLAY');
                        break;
                        
                    case 'ArrowLeft':
                        shouldPreventDefault = true;
                        action = 'TAP_CLICK';
                        console.log('[PROXY] ⌨️ ArrowLeft → TAP_CLICK');
                        break;
                        
                    case 'Equal':
                    case 'NumpadAdd':
                        shouldPreventDefault = true;
                        action = 'BPM_UP';
                        console.log('[PROXY] ⌨️ + → BPM_UP');
                        break;
                        
                    case 'Minus':
                    case 'NumpadSubtract':
                        shouldPreventDefault = true;
                        action = 'BPM_DOWN';
                        console.log('[PROXY] ⌨️ - → BPM_DOWN');
                        break;
                        
                    case 'ArrowUp':
                    case 'ArrowDown':
                        action = (e.code === 'ArrowUp') ? 'BPM_UP' : 'BPM_DOWN';
                        console.log('[PROXY] ⌨️ Arrow (passthrough) → ' + action);
                        break;
                }

                if (shouldPreventDefault) {
                    console.log('[PROXY DEBUG] Preventing default for', e.code);
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                }

                if (action) {
                    console.log('[PROXY DEBUG] ✅ Sending postMessage:', action);
                    metronomeIframe.contentWindow.postMessage({ action }, '*');
                } else {
                    console.log('[PROXY DEBUG] ⚠️ No action for', e.code);
                }
            }, true); // useCapture = true
            
            console.log('[PROXY DEBUG] ✅ Keyboard listener attached with useCapture=true');
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
            background: #141414;
            position: relative;
            margin: 0;
            padding: 0;
        }

        .metronome-wrapper {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            overflow: hidden;
            background: #141414;
        }

        .metronome-iframe {
            /* ✅ EXACTEMENT la taille du conteneur - pas de scale ! */
            width: 100%;
            height: 100%;
            border: none;
            display: block;
        }
    </style>
</head>
<body>
    <div class="metronome-wrapper">
        <iframe 
            src="https://7777-iopksqtiphh7vk63ml8pt-c07dda5e.sandbox.novita.ai/" 
            class="metronome-iframe"
            title="SHRED-UP Metronome (Test -10%)"
            scrolling="no"
            allow="autoplay"
        ></iframe>
    </div>

    <script>
        // ✅ UN SEUL listener - SANS await, juste forward
        window.addEventListener('message', (event) => {
            console.log('[PROXY] Message reçu:', event.data);
            
            const metronomeIframe = document.querySelector('.metronome-iframe');
            
            // Si le message vient du parent (SHRED UP) → forward vers iframe métronome
            if (event.source === window.parent && metronomeIframe?.contentWindow) {
                console.log('[PROXY] Forward vers métronome:', event.data);
                // ✅ CRITIQUE: Pas de await ici, juste forward immédiatement
                metronomeIframe.contentWindow.postMessage(event.data, '*');
            }
            // Si le message vient de l'iframe métronome → forward vers parent
            else if (event.source === metronomeIframe?.contentWindow && window.parent !== window) {
                console.log('[PROXY] Forward vers parent:', event.data);
                window.parent.postMessage(event.data, '*');
            }
        });

        // 🔒 ATTENDRE QUE L'IFRAME SOIT CHARGÉE avant d'ajouter le listener keydown
        window.addEventListener('DOMContentLoaded', () => {
            console.log('[PROXY DEBUG] DOMContentLoaded - Setting up keyboard listener');
            
            const metronomeIframe = document.querySelector('.metronome-iframe');
            if (!metronomeIframe) {
                console.error('[PROXY DEBUG] ❌ Iframe .metronome-iframe NOT FOUND in DOM!');
                return;
            }
            
            console.log('[PROXY DEBUG] ✅ Iframe found:', metronomeIframe);

            // 🔒 Capturer les événements clavier DANS LE PROXY
            // Et les forward vers l'iframe métronome via postMessage
            window.addEventListener('keydown', (e) => {
                console.log('[PROXY DEBUG] Keydown captured:', e.code, 'target:', e.target.tagName);
                
                if (!metronomeIframe?.contentWindow) {
                    console.log('[PROXY DEBUG] ❌ Iframe contentWindow not available');
                    return;
                }

                let action = null;
                let shouldPreventDefault = false;

                switch(e.code) {
                    case 'Space':
                        shouldPreventDefault = true;
                        action = 'TOGGLE_PLAY';
                        console.log('[PROXY] ⌨️ SPACE → TOGGLE_PLAY');
                        break;
                        
                    case 'ArrowLeft':
                        shouldPreventDefault = true;
                        action = 'TAP_CLICK';
                        console.log('[PROXY] ⌨️ ArrowLeft → TAP_CLICK');
                        break;
                        
                    case 'Equal':
                    case 'NumpadAdd':
                        shouldPreventDefault = true;
                        action = 'BPM_UP';
                        console.log('[PROXY] ⌨️ + → BPM_UP');
                        break;
                        
                    case 'Minus':
                    case 'NumpadSubtract':
                        shouldPreventDefault = true;
                        action = 'BPM_DOWN';
                        console.log('[PROXY] ⌨️ - → BPM_DOWN');
                        break;
                        
                    case 'ArrowUp':
                    case 'ArrowDown':
                        action = (e.code === 'ArrowUp') ? 'BPM_UP' : 'BPM_DOWN';
                        console.log('[PROXY] ⌨️ Arrow (passthrough) → ' + action);
                        break;
                }

                if (shouldPreventDefault) {
                    console.log('[PROXY DEBUG] Preventing default for', e.code);
                    e.preventDefault();
                    e.stopPropagation();
                    e.stopImmediatePropagation();
                }

                if (action) {
                    console.log('[PROXY DEBUG] ✅ Sending postMessage:', action);
                    metronomeIframe.contentWindow.postMessage({ action }, '*');
                } else {
                    console.log('[PROXY DEBUG] ⚠️ No action for', e.code);
                }
            }, true); // useCapture = true
            
            console.log('[PROXY DEBUG] ✅ Keyboard listener attached with useCapture=true');
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
