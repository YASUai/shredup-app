/**
 * SHRED UP - Client-side Interactions
 * Phase 1: Visual States Only (No Real Logic)
 */

document.addEventListener('DOMContentLoaded', () => {
  initializeRecordButtons()
  initializeTempoSubdivision()
  initializeMetronome()
  initializeDateTime()
})

/**
 * Initialize REC Buttons - Per Exercise
 * CRITICAL: Each button controls recording for ONE specific exercise
 */
function initializeRecordButtons() {
  const recButtons = document.querySelectorAll('.rec-button')
  
  recButtons.forEach((button) => {
    let isRecording = false
    
    button.addEventListener('click', () => {
      isRecording = !isRecording
      
      if (isRecording) {
        // Visual state: Recording
        button.classList.add('recording')
        console.log(`Recording started for exercise: ${button.dataset.exercise}`)
      } else {
        // Visual state: Stopped
        button.classList.remove('recording')
        console.log(`Recording stopped for exercise: ${button.dataset.exercise}`)
      }
    })
  })
}

/**
 * Initialize Tempo Column Buttons
 * + button: Adds a new 90px column (1 → 2 → 3 columns)
 * - button: Removes the last column (3 → 2 → 1 column)
 */
function initializeTempoSubdivision() {
  console.log('🔧 Initializing tempo columns...')
  const subdivideBtn = document.querySelector('.tempo-subdivide-btn')
  const reduceBtn = document.querySelector('.tempo-reduce-btn')
  console.log('📍 Buttons found:', { subdivideBtn, reduceBtn })
  let currentColumns = 1
  
  // Update button states
  function updateButtonStates() {
    // Disable - button at minimum (1)
    if (currentColumns <= 1) {
      reduceBtn.classList.add('min-subdivisions')
    } else {
      reduceBtn.classList.remove('min-subdivisions')
    }
    
    // Disable + button at maximum (3)
    if (currentColumns >= 3) {
      subdivideBtn.classList.add('max-subdivisions')
    } else {
      subdivideBtn.classList.remove('max-subdivisions')
    }
  }
  
  // Initialize button states
  updateButtonStates()
  
  // + Button: Add a new column
  if (subdivideBtn) {
    console.log('✅ Adding click listener to + button')
    subdivideBtn.addEventListener('click', () => {
      console.log('🖱️ + button clicked! Current columns:', currentColumns)
      if (currentColumns >= 3) {
        console.log('Maximum columns reached (3)')
        return
      }
      
      // Increment column count
      currentColumns++
      
      // Update all tempo column containers
      const containers = document.querySelectorAll('.tempo-columns-container')
      console.log(`📊 Found ${containers.length} tempo containers`)
      containers.forEach((container, index) => {
        // Set new column count
        container.setAttribute('data-columns', currentColumns)
        
        // Add new column
        const newColumn = document.createElement('div')
        newColumn.className = 'tempo-column'
        newColumn.innerHTML = '<input type="text" class="tempo-input" placeholder="---" maxlength="3" />'
        container.appendChild(newColumn)
        console.log(`  ✅ Added column to container ${index}`)
      })
      
      updateButtonStates()
      console.log(`Columns increased to: ${currentColumns}`)
    })
  }
  
  // - Button: Remove last column
  if (reduceBtn) {
    console.log('✅ Adding click listener to - button')
    reduceBtn.addEventListener('click', () => {
      console.log('🖱️ - button clicked! Current columns:', currentColumns)
      if (currentColumns <= 1) {
        console.log('Minimum columns reached (1)')
        return
      }
      
      // Decrement column count
      currentColumns--
      
      // Update all tempo column containers
      const containers = document.querySelectorAll('.tempo-columns-container')
      containers.forEach((container) => {
        // Set new column count
        container.setAttribute('data-columns', currentColumns)
        
        // Remove last column
        const lastColumn = container.querySelector('.tempo-column:last-child')
        if (lastColumn) {
          lastColumn.remove()
        }
      })
      
      updateButtonStates()
      console.log(`Columns decreased to: ${currentColumns}`)
    })
  }
}

/**
 * Initialize Metronome - Basic Placeholder Functionality
 */
function initializeMetronome() {
  const playButton = document.querySelector('.metronome-controls .control-button:first-child')
  const stopButton = document.querySelector('.metronome-controls .control-button:last-child')
  const bpmSlider = document.querySelector('.slider-input')
  const bpmDisplay = document.querySelector('.bpm-value')
  const beatIndicators = document.querySelectorAll('.beat-indicator')
  
  let isPlaying = false
  let currentBeat = 0
  let intervalId = null
  
  if (playButton) {
    playButton.addEventListener('click', () => {
      isPlaying = !isPlaying
      
      if (isPlaying) {
        playButton.classList.add('primary')
        const bpm = parseInt(bpmSlider?.value || 114)
        const interval = 60000 / bpm
        
        // Start beat animation
        intervalId = setInterval(() => {
          // Remove active from all
          beatIndicators.forEach(b => b.classList.remove('active'))
          
          // Add active to current
          if (beatIndicators[currentBeat]) {
            beatIndicators[currentBeat].classList.add('active')
          }
          
          currentBeat = (currentBeat + 1) % beatIndicators.length
        }, interval)
        
        console.log('Metronome started at', bpm, 'BPM')
      } else {
        playButton.classList.remove('primary')
        if (intervalId) {
          clearInterval(intervalId)
          intervalId = null
        }
        currentBeat = 0
        beatIndicators.forEach(b => b.classList.remove('active'))
        if (beatIndicators[0]) {
          beatIndicators[0].classList.add('active')
        }
        console.log('Metronome stopped')
      }
    })
  }
  
  if (stopButton) {
    stopButton.addEventListener('click', () => {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
      isPlaying = false
      currentBeat = 0
      playButton?.classList.remove('primary')
      beatIndicators.forEach(b => b.classList.remove('active'))
      if (beatIndicators[0]) {
        beatIndicators[0].classList.add('active')
      }
      console.log('Metronome reset')
    })
  }
  
  if (bpmSlider && bpmDisplay) {
    bpmSlider.addEventListener('input', (e) => {
      const value = e.target.value
      bpmDisplay.textContent = value
      
      // If playing, restart with new tempo
      if (isPlaying && intervalId) {
        clearInterval(intervalId)
        const interval = 60000 / parseInt(value)
        intervalId = setInterval(() => {
          beatIndicators.forEach(b => b.classList.remove('active'))
          if (beatIndicators[currentBeat]) {
            beatIndicators[currentBeat].classList.add('active')
          }
          currentBeat = (currentBeat + 1) % beatIndicators.length
        }, interval)
      }
    })
  }
}

/**
 * Initialize Date/Time Display - Real-time clock
 */
function initializeDateTime() {
  const timeElement = document.getElementById('current-time')
  const dayElement = document.getElementById('current-day')
  const sessionElement = document.getElementById('session-number')
  
  if (!timeElement || !dayElement) return
  
  // Days of the week
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  
  // Update time every second
  function updateDateTime() {
    const now = new Date()
    
    // Format time as hh:mm:ss
    const hours = String(now.getHours()).padStart(2, '0')
    const minutes = String(now.getMinutes()).padStart(2, '0')
    const seconds = String(now.getSeconds()).padStart(2, '0')
    timeElement.textContent = `${hours}:${minutes}:${seconds}`
    
    // Update day
    const dayName = days[now.getDay()]
    dayElement.textContent = dayName
  }
  
  // Initialize session number (could be retrieved from localStorage)
  if (sessionElement) {
    const sessionNumber = localStorage.getItem('shred-up-session-count') || '1'
    sessionElement.textContent = sessionNumber
  }
  
  // Update immediately
  updateDateTime()
  
  // Update every second
  setInterval(updateDateTime, 1000)
  
  console.log('✅ Date/Time initialized')
}

/**
 * Initialize Keyboard Shortcuts
 * Sends postMessage to metronome iframe
 * 🔒 VERROUILLÉ: Les raccourcis fonctionnent même si l'iframe a le focus
 */
function initializeKeyboardShortcuts() {
  const metronomeIframe = document.querySelector('.metronome-iframe')
  
  if (!metronomeIframe) {
    console.warn('⚠️ Metronome iframe not found')
    return
  }
  
  console.log('✅ Keyboard shortcuts initialized (LOCKED MODE)')
  
  // 🔒 SOLUTION 1: Capturer les événements au niveau WINDOW (pas document)
  // Ça permet de capturer même si le focus est dans l'iframe
  window.addEventListener('keydown', (e) => {
    const target = e.target
    
    // ✅ CORRECTION: Ignorer SEULEMENT si on tape dans un input/textarea de SHRED UP
    // Ne PAS vérifier isInIframe - on veut TOUJOURS capturer les raccourcis
    if (target && target.ownerDocument === document) {
      // On est dans SHRED UP (pas iframe)
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // User est en train de taper → ignorer les raccourcis
        return
      }
    }
    
    const iframe = metronomeIframe.contentWindow
    if (!iframe) return
    
    // 🔒 TRAITER TOUS LES RACCOURCIS - TOUJOURS preventDefault pour bloquer l'iframe
    let handled = false
    
    switch(e.code) {
      case 'Space':
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        console.log('⌨️ SPACE → Toggle Play/Stop (LOCKED)')
        iframe.postMessage({ action: 'TOGGLE_PLAY' }, '*')
        handled = true
        break
        
      case 'ArrowLeft': // Left Arrow key for TAP
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        console.log('⌨️ ← → TAP Tempo (LOCKED)')
        iframe.postMessage({ action: 'TAP_CLICK' }, '*')
        handled = true
        break
        
      case 'Equal':
      case 'NumpadAdd':
      case 'ArrowUp':
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        console.log('⌨️ + → BPM +1 (LOCKED)')
        iframe.postMessage({ action: 'BPM_UP' }, '*')
        handled = true
        break
        
      case 'Minus':
      case 'NumpadSubtract':
      case 'ArrowDown':
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        console.log('⌨️ - → BPM -1 (LOCKED)')
        iframe.postMessage({ action: 'BPM_DOWN' }, '*')
        handled = true
        break
        
      case 'NumpadMultiply':
        e.preventDefault()
        e.stopPropagation()
        e.stopImmediatePropagation()
        console.log('⌨️ * → Toggle REC (LOCKED)')
        const firstRecBtn = document.querySelector('.rec-button')
        if (firstRecBtn) firstRecBtn.click()
        handled = true
        break
    }
    
    // 🔒 FORCER LE FOCUS À REVENIR SUR SHRED UP
    if (handled) {
      // Forcer document.body à prendre le focus
      if (document.activeElement && document.activeElement !== document.body) {
        document.activeElement.blur()
      }
      document.body.focus()
      console.log('🔒 Focus maintained on SHRED UP')
    }
  }, true) // ✅ useCapture = true pour capturer AVANT l'iframe
  
  // 🔒 SOLUTION 2: Forcer le focus à revenir après un clic dans l'iframe
  metronomeIframe.addEventListener('load', () => {
    try {
      // Intercepter les clics dans l'iframe
      metronomeIframe.contentWindow.document.addEventListener('click', () => {
        // Après 100ms, forcer le focus à revenir sur SHRED UP
        setTimeout(() => {
          document.body.focus()
          console.log('🔒 Focus restored to SHRED UP')
        }, 100)
      })
    } catch (e) {
      console.warn('⚠️ Cannot access iframe (cross-origin)')
    }
  })
  
  // 🔒 SOLUTION 3: Surveiller les changements de focus
  window.addEventListener('blur', () => {
    // Si SHRED UP perd le focus, le récupérer après 50ms
    setTimeout(() => {
      if (document.hasFocus()) {
        document.body.focus()
        console.log('🔒 Focus maintained on SHRED UP')
      }
    }, 50)
  })
}

// Initialize shortcuts after DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // ✅ CRITIQUE: Activer AudioContext dès le premier mouvement de souris
  // Sans ça, AltGr ne peut pas activer AudioContext (pas reconnu comme geste utilisateur)
  const activateAudioContext = () => {
    console.log('🔊 Premier mouvement détecté - AudioContext peut être activé')
    // Le prochain TAP pourra activer AudioContext
    document.removeEventListener('mousemove', activateAudioContext)
    document.removeEventListener('click', activateAudioContext)
  }
  
  // Écouter le premier mouvement ou clic
  document.addEventListener('mousemove', activateAudioContext, { once: true })
  document.addEventListener('click', activateAudioContext, { once: true })
  
  // Wait for iframe to load
  setTimeout(() => {
    initializeKeyboardShortcuts()
  }, 1000)
})
