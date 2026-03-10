/**
 * SHRED UP - Client-side Interactions
 * Phase 1: Visual States Only (No Real Logic)
 */

// COMMENTED OUT - THIS IS A DUPLICATE, SEE LINE ~502
// document.addEventListener('DOMContentLoaded', () => {
//   initializeRecordButtons()
//   initializeTempoSubdivision()
//   initializeMetronome()
//   initializeDateTime()
//   initializeGlobalKeyboardShortcuts()
//   initializeGlobalFocusManagement()
// })

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
 * Initialize Global Keyboard Shortcuts
 * ============================================================================
 * CRITICAL: Shortcuts work from ANYWHERE on the page (not just iframe)
 * 
 * SOLUTION:
 * - Listen on PARENT window (document level)
 * - Access iframe buttons via contentWindow
 * - Call button.click() which works now because all buttons use 'click' event
 * 
 * WHY THIS WORKS NOW:
 * - All metronome buttons use addEventListener('click') ✅
 * - button.click() triggers 'click' event ✅
 * - No need for complex event dispatching ✅
 */
function initializeGlobalKeyboardShortcuts() {
  const metronomeIframe = document.querySelector('.metronome-iframe')
  
  if (!metronomeIframe) {
    console.warn('⚠️ Metronome iframe not found - shortcuts disabled')
    return
  }
  
  // Wait for iframe to load
  const setupShortcuts = () => {
    console.log('🎹 Global keyboard shortcuts initialized (work from anywhere)')
    
    document.addEventListener('keydown', (e) => {
      // Ignore if typing in input/textarea/select or contentEditable
      const target = e.target
      if (target && (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' || 
        target.tagName === 'SELECT' ||
        target.isContentEditable
      )) {
        console.log('⌨️ Keyboard input detected in editable field, skipping global shortcuts')
        return
      }
      
      const iframeWindow = metronomeIframe.contentWindow
      const iframeDocument = iframeWindow?.document
      
      if (!iframeDocument) {
        return
      }
      
      let handled = false
      
      switch(e.key) {
        case ' ':
          e.preventDefault()
          const playBtn = iframeDocument.querySelector('.play-btn')
          if (playBtn) {
            playBtn.click()
            handled = true
          }
          break
          
        case '+':
        case '=':
        case 'ArrowUp':
          e.preventDefault()
          const plusBtn = iframeDocument.querySelector('.plus-btn')
          if (plusBtn) {
            plusBtn.click()
            handled = true
          }
          break
          
        case '-':
        case '_':
        case 'ArrowDown':
          e.preventDefault()
          const minusBtn = iframeDocument.querySelector('.minus-btn')
          if (minusBtn) {
            minusBtn.click()
            handled = true
          }
          break
          
        case 'ArrowLeft':
          e.preventDefault()
          const tapBtn = iframeDocument.querySelector('.tap-btn')
          if (tapBtn) {
            tapBtn.click()
            handled = true
          }
          break
      }
      
      if (handled) {
        console.log('⌨️ Global shortcut:', e.key)
      }
    })
  }
  
  // Check if iframe is already loaded
  if (metronomeIframe.contentDocument && metronomeIframe.contentDocument.readyState === 'complete') {
    setupShortcuts()
  } else {
    metronomeIframe.addEventListener('load', setupShortcuts)
  }
}

/**
 * Initialize Global Focus Management
 * ============================================================================
 * CRITICAL: Prevent ANY element from keeping focus and blocking shortcuts
 * 
 * PROBLEM:
 * - Clicking TUNER toggles → focus stays on button → shortcuts don't work
 * - Clicking metronome iframe → focus goes to iframe → shortcuts don't work
 * - User has to click elsewhere to restore shortcuts
 * 
 * SOLUTION:
 * - Force blur on ALL interactive elements after click
 * - Restore focus to document.body (focusable)
 * - Apply to entire page (parent + iframe)
 */
function initializeGlobalFocusManagement() {
  console.log('🔒 Initializing global focus management...')
  
  // Make body focusable
  document.body.setAttribute('tabindex', '-1')
  
  // Apply to ALL buttons, links, and interactive elements in PARENT
  const applyFocusProtection = (element) => {
    // SKIP editable elements (inputs, textareas, selects)
    if (element.tagName === 'INPUT' || 
        element.tagName === 'TEXTAREA' || 
        element.tagName === 'SELECT' ||
        element.isContentEditable) {
      console.log('⏭️ Skipping focus protection for editable element:', element.className || element.tagName)
      return
    }
    
    element.setAttribute('tabindex', '-1')
    
    // Force blur on mousedown (before click, capture phase)
    element.addEventListener('mousedown', (e) => {
      e.target.blur()
      // Restore focus to body immediately
      setTimeout(() => {
        document.body.focus()
        console.log('🔄 Focus restored to body after click on:', e.target.className || e.target.tagName)
      }, 0)
    }, true)
  }
  
  // Apply to all interactive elements in parent (but applyFocusProtection will skip inputs)
  document.querySelectorAll('button, a, [role="button"], .toggle, [tabindex]').forEach(applyFocusProtection)
  
  // Helper function to apply protection to any iframe
  const applyToIframe = (iframe, name) => {
    return () => {
      try {
        const iframeDoc = iframe.contentDocument || iframe.contentWindow.document
        if (iframeDoc) {
          // Apply to ALL interactive elements in iframe
          iframeDoc.querySelectorAll('button, a, [role="button"], .toggle, input[type="checkbox"], input[type="radio"], [tabindex]').forEach(element => {
            element.setAttribute('tabindex', '-1')
            element.addEventListener('mousedown', (e) => {
              e.target.blur()
              // Restore focus to PARENT body (not iframe body)
              setTimeout(() => {
                document.body.focus()
                console.log(`🔄 Focus restored to parent body after ${name} click:`, e.target.className || e.target.tagName)
              }, 0)
            }, true)
          })
          console.log(`✅ Focus protection applied to ${name} iframe`)
        }
      } catch (err) {
        console.warn(`⚠️ Could not apply focus protection to ${name} iframe:`, err)
      }
    }
  }
  
  // Apply to metronome iframe
  const metronomeIframe = document.querySelector('.metronome-iframe')
  if (metronomeIframe) {
    const applyMetronome = applyToIframe(metronomeIframe, 'metronome')
    if (metronomeIframe.contentDocument && metronomeIframe.contentDocument.readyState === 'complete') {
      applyMetronome()
    } else {
      metronomeIframe.addEventListener('load', applyMetronome)
    }
  }
  
  // Apply to tuner iframe
  const tunerIframe = document.querySelector('.tuner-iframe-right')
  if (tunerIframe) {
    const applyTuner = applyToIframe(tunerIframe, 'tuner')
    if (tunerIframe.contentDocument && tunerIframe.contentDocument.readyState === 'complete') {
      applyTuner()
    } else {
      tunerIframe.addEventListener('load', applyTuner)
    }
  }
  
  // Initial focus on body
  document.body.focus()
  
  console.log('✅ Global focus management enabled')
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

// DOM Content Loaded - Initialize all modules
document.addEventListener('DOMContentLoaded', () => {
  // CRITICAL: Make all inputs editable by removing value binding
  makeInputsEditable()
  
  initializeRecordButtons()
  initializeTempoSubdivision()
  initializeMetronome()
  initializeDateTime()
  // TEMPORARILY DISABLED FOR DEBUGGING - These block input fields
  // initializeGlobalKeyboardShortcuts()
  // initializeGlobalFocusManagement()
  console.log('⚠️ Keyboard shortcuts and focus management DISABLED for debugging')
  console.log('✅ You should now be able to type in all input fields')
})

/**
 * Make all inputs/textareas actually editable
 * Remove value property binding so users can type
 */
function makeInputsEditable() {
  // Find all text inputs and textareas
  const editableElements = document.querySelectorAll(
    'input[type="text"], textarea, select'
  )
  
  editableElements.forEach(element => {
    // Remove readonly attribute if present
    element.removeAttribute('readonly')
    element.removeAttribute('disabled')
    
    // Ensure they're focusable
    if (!element.hasAttribute('tabindex') || element.getAttribute('tabindex') === '-1') {
      element.removeAttribute('tabindex')
    }
    
    console.log('✅ Made editable:', element.className || element.tagName)
  })
  
  console.log(`✅ ${editableElements.length} inputs/textareas made editable`)
}

/**
 * ============================================================
 * SESSION SAVE FEATURE - Capture practice data before closing
 * ============================================================
 */

/**
 * Collect all session data from the practice interface
 */
function collectSessionData() {
  const sessionData = {
    timestamp: new Date().toISOString(),
    date: new Date().toLocaleDateString('fr-FR'),
    time: new Date().toLocaleTimeString('fr-FR'),
    exercises: [],
    focusPoints: '',
    notepad: '',
  }

  // Collect Focus Points
  const focusTextarea = document.querySelector('.editable-focus')
  if (focusTextarea) {
    sessionData.focusPoints = focusTextarea.value.trim()
  }

  // Collect Notepad
  const notepadTextarea = document.querySelector('.notepad-textarea')
  if (notepadTextarea) {
    sessionData.notepad = notepadTextarea.value.trim()
  }

  // Collect all exercises
  const exerciseRows = document.querySelectorAll('.exercise-row')
  exerciseRows.forEach((row, index) => {
    const exerciseName = row.querySelector('.exercise-name-input')?.value.trim() || ''
    const subRyth = row.querySelector('.sub-ryth-select')?.value || ''
    const tempoGoal = row.querySelector('.tempo-goal-input')?.value || ''
    const tempsPasse = row.querySelector('.temps-passe-select')?.value || ''
    const isDone = row.querySelector('.exercise-checkbox input')?.checked || false

    // Collect all tempo atteints (multiple columns possible)
    const tempoInputs = row.querySelectorAll('.tempo-atteints-input')
    const tempoAtteints = Array.from(tempoInputs)
      .map(input => input.value.trim())
      .filter(val => val !== '')

    // Only include exercises that are marked as DONE
    if (isDone && (exerciseName || subRyth || tempoAtteints.length > 0 || tempoGoal || tempsPasse)) {
      sessionData.exercises.push({
        index: index + 1,
        name: exerciseName,
        subdivision: subRyth,
        temposAtteints: tempoAtteints,
        tempoGoal: tempoGoal,
        tempsPasse: tempsPasse,
        done: isDone
      })
    }
  })

  return sessionData
}

/**
 * Format session data as readable text for download
 */
function formatSessionReport(data) {
  let report = '═══════════════════════════════════════════════════\n'
  report += '         SHRED UP - SESSION REPORT\n'
  report += '═══════════════════════════════════════════════════\n\n'
  report += `📅 Date: ${data.date}\n`
  report += `🕒 Time: ${data.time}\n`
  report += `📝 ISO Timestamp: ${data.timestamp}\n\n`

  // Focus Points
  if (data.focusPoints) {
    report += '─────────────────────────────────────────────────\n'
    report += '🎯 FOCUS POINTS\n'
    report += '─────────────────────────────────────────────────\n'
    report += data.focusPoints + '\n\n'
  }

  // Exercises (Only completed ones)
  if (data.exercises.length > 0) {
    report += '─────────────────────────────────────────────────\n'
    report += '🎸 EXERCISES COMPLETED\n'
    report += '─────────────────────────────────────────────────\n\n'

    data.exercises.forEach((ex) => {
      report += `${ex.index}. ${ex.name || '(No name)'}\n`
      if (ex.subdivision) report += `   Subdivision: ${ex.subdivision}\n`
      if (ex.temposAtteints.length > 0) {
        report += `   Tempos Travaillés: ${ex.temposAtteints.join(' → ')} BPM\n`
      }
      if (ex.tempoGoal) report += `   Tempo Goal: ${ex.tempoGoal} BPM\n`
      if (ex.tempsPasse) report += `   Temps Passé: ${ex.tempsPasse}\n`
      report += `\n`
    })
  } else {
    report += '─────────────────────────────────────────────────\n'
    report += 'ℹ️  No completed exercises\n\n'
  }

  // Notepad
  if (data.notepad) {
    report += '─────────────────────────────────────────────────\n'
    report += '📓 NOTEPAD\n'
    report += '─────────────────────────────────────────────────\n'
    report += data.notepad + '\n\n'
  }

  report += '═══════════════════════════════════════════════════\n'
  report += 'End of Session Report\n'
  report += '═══════════════════════════════════════════════════\n'

  return report
}

/**
 * Download session data as a text file
 */
function downloadSessionReport() {
  const sessionData = collectSessionData()
  const reportText = formatSessionReport(sessionData)
  
  // Create download link
  const blob = new Blob([reportText], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  
  const filename = `shredup-session-${sessionData.date.replace(/\//g, '-')}-${sessionData.time.replace(/:/g, '-')}.txt`
  link.href = url
  link.download = filename
  link.click()
  
  // Clean up
  URL.revokeObjectURL(url)
  
  console.log('✅ Session report downloaded:', filename)
  console.log('📊 Session data:', sessionData)
  
  // Show visual confirmation
  showSaveConfirmation()
  
  // Temporarily disable beforeunload warning (5 seconds)
  window.sessionSaved = true
  setTimeout(() => {
    window.sessionSaved = false
  }, 5000)
}

/**
 * Show visual confirmation after save
 */
function showSaveConfirmation() {
  const btn = document.querySelector('.save-session-btn-neumorph')
  if (!btn) return
  
  const originalHTML = btn.innerHTML
  btn.innerHTML = `
    <svg class="save-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 6L9 17L4 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>
    <span class="save-text">Session sauvegardée</span>
  `
  btn.classList.add('saved')
  btn.disabled = true
  
  setTimeout(() => {
    btn.innerHTML = originalHTML
    btn.classList.remove('saved')
    btn.disabled = false
  }, 3000)
}

/**
 * Initialize beforeunload handler to prompt save on page close
 */
function initializeSessionSave() {
  window.addEventListener('beforeunload', (event) => {
    // Don't warn if session was just saved (5 second grace period)
    if (window.sessionSaved) {
      return
    }
    
    const sessionData = collectSessionData()
    
    // Check if there's any meaningful data to save
    const hasData = 
      sessionData.exercises.length > 0 || 
      sessionData.focusPoints.length > 0 || 
      sessionData.notepad.length > 0

    if (hasData) {
      // Show browser's default confirmation dialog
      event.preventDefault()
      event.returnValue = '' // Required for Chrome
      
      // Note: Modern browsers don't allow custom messages in beforeunload dialogs
      // The browser will show a generic "Leave site?" message
      
      return ''
    }
  })
  
  // Add manual save button (optional - for testing)
  console.log('💾 Session save initialized')
  console.log('💡 Click "💾 Sauvegarder Session" button to save manually')
  console.log('⚠️  Closing tab with unsaved data will show "Leave site?" warning')
}

// ============================================================================
// METRONOME INTEGRATION - Auto-fill Focus Zone
// ============================================================================

let currentExerciseIndex = 0

/**
 * Handle postMessage from metronome iframe
 */
window.addEventListener('message', (event) => {
  console.log('[FOCUS ZONE] 📨 Message reçu:', event.data)
  
  const { type, payload } = event.data
  
  if (type === 'METRONOME_TIMER_START') {
    console.log('[FOCUS ZONE] ⏱️ Timer démarré:', payload)
    // Optional: Visual feedback when timer starts
  }
  
  if (type === 'METRONOME_TIMER_COMPLETE') {
    console.log('[FOCUS ZONE] ✅ Timer terminé:', payload)
    autoFillCurrentExercise(payload)
  }
})

/**
 * Parse une durée MM:SS en secondes
 * @param {string} duration - Format MM:SS
 * @returns {number} Durée en secondes
 */
function parseDuration(duration) {
  if (!duration || duration === '---' || duration === '') return 0
  
  const parts = duration.split(':')
  if (parts.length !== 2) return 0
  
  const minutes = parseInt(parts[0]) || 0
  const seconds = parseInt(parts[1]) || 0
  
  return minutes * 60 + seconds
}

/**
 * Formate des secondes en MM:SS
 * @param {number} totalSeconds - Durée en secondes
 * @returns {string} Format MM:SS
 */
function formatSeconds(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60)
  const secs = totalSeconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

/**
 * Auto-fill current exercise with metronome data
 */
function autoFillCurrentExercise(data) {
  const rows = document.querySelectorAll('.exercise-row')
  
  if (currentExerciseIndex >= rows.length) {
    console.warn('[FOCUS ZONE] Aucun exercice disponible (index:', currentExerciseIndex, ')')
    return
  }
  
  const currentRow = rows[currentExerciseIndex]
  
  // Fill TEMPS PASSÉ (select dropdown) - ADDITIONNER les temps
  const tempsPasseSelect = currentRow.querySelector('.temps-passe-select')
  if (tempsPasseSelect) {
    // Récupérer le temps existant
    const existingValue = tempsPasseSelect.value
    const existingSeconds = parseDuration(existingValue)
    
    // Additionner avec le nouveau temps
    const newSeconds = data.elapsedSeconds
    const totalSeconds = existingSeconds + newSeconds
    const totalFormatted = formatSeconds(totalSeconds)
    
    console.log('[FOCUS ZONE] ⏱️  Addition des temps:', {
      existant: existingValue,
      existantSeconds: existingSeconds,
      nouveauSeconds: newSeconds,
      total: totalFormatted
    })
    
    // Check if total matches a preset
    const matchingOption = Array.from(tempsPasseSelect.options).find(
      opt => opt.value === totalFormatted
    )
    
    if (matchingOption) {
      tempsPasseSelect.value = totalFormatted
    } else {
      // Use Custom option and set its value
      let customOption = tempsPasseSelect.querySelector('option[value="custom"]')
      if (customOption) {
        customOption.value = totalFormatted
        customOption.textContent = totalFormatted
        tempsPasseSelect.value = totalFormatted
      } else {
        // Create custom option if doesn't exist
        customOption = document.createElement('option')
        customOption.value = totalFormatted
        customOption.textContent = totalFormatted
        tempsPasseSelect.appendChild(customOption)
        tempsPasseSelect.value = totalFormatted
      }
    }
    
    // Flash green
    tempsPasseSelect.style.backgroundColor = 'rgba(80, 255, 80, 0.2)'
    setTimeout(() => {
      tempsPasseSelect.style.backgroundColor = ''
    }, 500)
  }
  
  // Fill TEMPO ATTEINT - Find next empty column or add new one
  const tempoContainer = currentRow.querySelector('.tempo-columns-container')
  if (tempoContainer) {
    // Find all tempo inputs in this container
    const tempoInputs = tempoContainer.querySelectorAll('.tempo-input')
    const tempoText = data.tempos.join(' → ')
    
    // Find first empty input
    let targetInput = null
    for (const input of tempoInputs) {
      if (!input.value || input.value.trim() === '' || input.value === '---') {
        targetInput = input
        break
      }
    }
    
    // If all columns are full, add a new one
    if (!targetInput) {
      const currentColumns = parseInt(tempoContainer.getAttribute('data-columns')) || 1
      
      if (currentColumns < 3) {
        // Add new column
        const newColumn = document.createElement('div')
        newColumn.className = 'tempo-column'
        newColumn.innerHTML = '<input type="text" class="tempo-input" placeholder="---" maxlength="3" />'
        tempoContainer.appendChild(newColumn)
        tempoContainer.setAttribute('data-columns', currentColumns + 1)
        
        targetInput = newColumn.querySelector('.tempo-input')
        console.log('[FOCUS ZONE] 📊 Nouvelle colonne ajoutée automatiquement')
      } else {
        // Max columns reached, use last column
        targetInput = tempoInputs[tempoInputs.length - 1]
        console.log('[FOCUS ZONE] ⚠️  Maximum de colonnes atteint, écrasement de la dernière')
      }
    }
    
    if (targetInput) {
      targetInput.value = tempoText
      
      console.log('[FOCUS ZONE] 🎵 Tempo ajouté:', {
        colonne: Array.from(tempoInputs).indexOf(targetInput) + 1,
        tempo: tempoText
      })
      
      // Flash green
      targetInput.style.backgroundColor = 'rgba(80, 255, 80, 0.2)'
      setTimeout(() => {
        targetInput.style.backgroundColor = ''
      }, 500)
    }
  }
  
  console.log(`[FOCUS ZONE] ✅ Exercice ${currentExerciseIndex + 1} auto-rempli (cumulatif):`, {
    tempsTotal: tempsPasseSelect ? tempsPasseSelect.value : 'N/A',
    colonnesTempos: tempoContainer ? tempoContainer.querySelectorAll('.tempo-input').length : 0
  })
}

/**
 * Setup DONE checkbox auto-advance
 */
function setupDoneCheckboxes() {
  const checkboxes = document.querySelectorAll('.exercise-checkbox input[type="checkbox"]')
  
  checkboxes.forEach((checkbox, index) => {
    checkbox.addEventListener('change', () => {
      if (checkbox.checked && index === currentExerciseIndex) {
        // Flash yellow to indicate advancing
        const row = checkbox.closest('.exercise-row')
        if (row) {
          row.style.backgroundColor = 'rgba(255, 200, 80, 0.15)'
          setTimeout(() => {
            row.style.backgroundColor = ''
          }, 400)
        }
        
        // Advance to next exercise
        currentExerciseIndex++
        console.log(`[FOCUS ZONE] ➡️  Avancé à l'exercice ${currentExerciseIndex + 1}`)
      }
    })
  })
  
  console.log(`[FOCUS ZONE] ${checkboxes.length} checkboxes initialisées`)
}

// Initialize session save on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeSessionSave()
  setupDoneCheckboxes()
  console.log('[FOCUS ZONE] Metronome integration active - Exercise index:', currentExerciseIndex)
})

