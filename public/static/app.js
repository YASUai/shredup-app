/**
 * SHRED UP - Client-side Interactions
 * Phase 1: Visual States Only (No Real Logic)
 */

document.addEventListener('DOMContentLoaded', () => {
  initializeRecordButtons()
  initializeTempoSubdivision()
  initializeMetronome()
  initializeDateTime()
  initializeKeyboardShortcuts()
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
    if (!reduceBtn || !subdivideBtn) return;  // Guard clause for iframe
    
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
  
  // Initialize button states (only if buttons exist)
  if (subdivideBtn && reduceBtn) {
    updateButtonStates()
  }
  
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
 * ============================================================================
 * Global keyboard shortcuts that work anywhere on the page (parent)
 * They communicate with the metronome iframe to trigger actions
 */
function initializeKeyboardShortcuts() {
  const metronomeIframe = document.querySelector('.metronome-iframe')
  
  if (!metronomeIframe) {
    console.warn('⚠️ Metronome iframe not found - keyboard shortcuts disabled')
    return
  }
  
  console.log('🎹 Parent keyboard shortcuts initialized (DIRECT IFRAME ACCESS)')
  
  // Listen for keyboard events on the parent window
  document.addEventListener('keydown', (e) => {
    // Ignore if typing in input/textarea
    const target = e.target
    if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) {
      return
    }
    
    const iframeWindow = metronomeIframe.contentWindow
    const iframeDocument = iframeWindow?.document
    
    if (!iframeDocument) {
      console.warn('⚠️ Cannot access iframe document')
      return
    }
    
    let handled = false
    
    switch(e.key) {
      case ' ':          // Space only (no Tab because it conflicts with navigation)
        e.preventDefault()
        console.log('⌨️ SPACE → Toggle PLAY/STOP (from parent)')
        
        // Find and click PLAY button in iframe
        const playBtn = iframeDocument.querySelector('.play-btn')
        if (playBtn) {
          playBtn.click()
          handled = true
        } else {
          console.warn('⚠️ Play button not found in iframe')
        }
        break
        
      case '+':          // Plus (Shift + =)
      case '=':          // Equal (same key as +)
      case 'ArrowUp':    // Up arrow
        e.preventDefault()
        console.log('⌨️ +/↑ → BPM +1 (from parent)')
        
        // Find and click BPM+ button in iframe
        const plusBtn = iframeDocument.querySelector('.plus-btn')
        if (plusBtn) {
          plusBtn.click()
          handled = true
        } else {
          console.warn('⚠️ Plus button not found in iframe')
        }
        break
        
      case '-':          // Minus
      case '_':          // Underscore (Shift + -)
      case 'ArrowDown':  // Down arrow
        e.preventDefault()
        console.log('⌨️ -/↓ → BPM -1 (from parent)')
        
        // Find and click BPM- button in iframe
        const minusBtn = iframeDocument.querySelector('.minus-btn')
        if (minusBtn) {
          minusBtn.click()
          handled = true
        } else {
          console.warn('⚠️ Minus button not found in iframe')
        }
        break
        
      case 'ArrowLeft':  // Left arrow
        e.preventDefault()
        console.log('⌨️ ← → TAP Tempo (from parent)')
        
        // Find and click TAP button in iframe
        const tapBtn = iframeDocument.querySelector('.tap-btn')
        if (tapBtn) {
          tapBtn.click()
          handled = true
        } else {
          console.warn('⚠️ TAP button not found in iframe')
        }
        break
    }
    
    if (handled) {
      console.log('✅ Parent keyboard shortcut executed successfully')
    }
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
  
  // Keyboard shortcuts will be initialized here from scratch
})
