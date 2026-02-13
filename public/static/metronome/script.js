// ═══════════════════════════════════════════════════════════════════
// MÉTRONOME UI RESPONSIVE - INTERACTIVITÉ ULTRA-FLUIDE
// Plage BPM: 20-250
// ═══════════════════════════════════════════════════════════════════

// Variables globales
let bpm = 128;
let volume = 0.4;
let isPlaying = false;
let currentBeat = 0;
let beatInterval = null;
let audioContext = null;
let isMaskingOn = false;
let clickSound = null;

// Variables pour TAP TEMPO (GLOBAL pour éviter race condition)
let tapTimes = [];
const MAX_TAP_INTERVAL = 2000; // Reset si > 2 secondes entre taps

// Variables pour TIME SIGNATURE (BEAT/BAR/NOTE)
let beatsPerMeasure = 4;     // BEAT: nombre de temps par mesure (1-16)
let timeSignature = '4/4';    // BAR: signature rythmique (2/4, 3/4, 4/4, 5/4, 6/8, etc.)
let noteValue = '1/4';        // NOTE: valeur de note (1/4, 1/8, 1/16, etc.)

// Variables pour TIMER (compte à rebours)
let timerMinutes = 0;
let timerSeconds = 0;
let timerInterval = null;
let isTimerActive = false;

// Variables pour SESSION DURATION (chronomètre)
let sessionStartTime = null;
let sessionElapsedSeconds = 0;
let sessionInterval = null;
let hasSessionStarted = false;

const MIN_BPM = 20;
const MAX_BPM = 250;

// ═══════════════════════════════════════════════════════════════════
// RANDOM MASKING SYSTEM — CHAOS CONTRÔLÉ PREMIUM
// ═══════════════════════════════════════════════════════════════════

// Définition des blocs de complexité
const MASKING_BLOCKS = {
    A: { level: 0, name: 'A', maskedCount: 0 },  // Aucun beat masqué
    B: { level: 1, name: 'B', maskedCount: 1 },  // 1 beat masqué
    C: { level: 2, name: 'C', maskedCount: 2 },  // 2 beats masqués
    D: { level: 3, name: 'D', maskedCount: 4 }   // 4 beats masqués (TOUS)
};

// État du système de masking
const maskingState = {
    currentBlock: MASKING_BLOCKS.A,
    anchoringRemaining: 2,  // Phase d'ancrage obligatoire (2 blocs A minimum)
    maskedBeats: [],        // Liste des beats actuellement masqués [0-3]
    blockHistory: [],       // Historique des blocs pour analyse
    measureCount: 0,        // Compteur de mesures pour reset périodique
    consecutiveMaskedCount: 0,  // Compteur de blocs masqués consécutifs
    
    // Tracking avancé pour blocs D (mesure 9+)
    lastDMeasure: -1,           // Dernière mesure avec un bloc D
    lastConsecutiveDMeasure: -1, // Dernière mesure avec deux D consécutifs
    consecutiveDCount: 0,        // Compteur de D consécutifs en cours
    
    // Pondérations PHASE MASKING (après ancrage) - MASKING ENGAGÉ
    weightsPhaseMasking: {
        A: 0.05,  // 5%  - Reset uniquement (quasi absent)
        B: 0.45,  // 45% - Complexité légère (dominant)
        C: 0.35,  // 35% - Complexité moyenne (fréquent)
        D: 0.15   // 15% - Complexité maximale (régulier)
    }
};

// Sélection pondérée aléatoire
function weightedRandom(blocks, weights) {
    const totalWeight = blocks.reduce((sum, block) => sum + weights[block.name], 0);
    let random = Math.random() * totalWeight;
    
    for (const block of blocks) {
        random -= weights[block.name];
        if (random <= 0) {
            return block;
        }
    }
    
    return blocks[blocks.length - 1];  // Fallback
}

// Obtenir les blocs autorisés selon les règles de continuité
function getAllowedBlocks(currentBlock) {
    const allBlocks = Object.values(MASKING_BLOCKS);
    const currentLevel = currentBlock.level;
    let allowed = [];
    
    // Règle 1: Saut maximum de 1 niveau (A↔B, B↔C, C↔D uniquement)
    for (const block of allBlocks) {
        const levelDiff = Math.abs(block.level - currentLevel);
        if (levelDiff <= 1) {
            allowed.push(block);
        }
    }
    
    // Règle 2: Interdiction de transition directe A → D
    if (currentBlock === MASKING_BLOCKS.A) {
        allowed = allowed.filter(b => b !== MASKING_BLOCKS.D);
    }
    
    // Règle 3: Interdiction de deux blocs D consécutifs
    // SAUF à partir de la mesure 9 et toutes les 5 mesures
    if (currentBlock === MASKING_BLOCKS.D) {
        const canHaveConsecutiveD = (
            maskingState.measureCount >= 9 &&  // À partir de la mesure 9
            (maskingState.measureCount - maskingState.lastConsecutiveDMeasure) >= 5  // Toutes les 5 mesures
        );
        
        if (!canHaveConsecutiveD) {
            allowed = allowed.filter(b => b !== MASKING_BLOCKS.D);
        } else {
            console.log(`[MASKING] Mesure ${maskingState.measureCount}: D→D consécutif AUTORISÉ`);
        }
    }
    
    return allowed;
}

// Sélectionner le prochain bloc
function selectNextBlock() {
    // ═════════════════════════════════════════════════════════════
    // PHASE 1 : ANCRAGE OBLIGATOIRE (2 blocs A fixes)
    // ═════════════════════════════════════════════════════════════
    if (maskingState.anchoringRemaining > 0) {
        maskingState.anchoringRemaining--;
        maskingState.currentBlock = MASKING_BLOCKS.A;
        maskingState.blockHistory.push('A');
        console.log('[MASKING] Phase ancrage - Bloc A obligatoire');
        return MASKING_BLOCKS.A;
    }
    
    // ═════════════════════════════════════════════════════════════
    // PHASE 2 : MASKING ACTIF (entrée forcée en B)
    // ═════════════════════════════════════════════════════════════
    
    // Sortie obligatoire de A → Force B (pas de A→A→A)
    if (maskingState.currentBlock === MASKING_BLOCKS.A) {
        maskingState.currentBlock = MASKING_BLOCKS.B;
        maskingState.blockHistory.push('B');
        maskingState.consecutiveMaskedCount = 1;
        console.log('[MASKING] Entrée phase masking - Bloc B forcé');
        return MASKING_BLOCKS.B;
    }
    
    // Obtenir les blocs autorisés selon règles de continuité
    let allowedBlocks = getAllowedBlocks(maskingState.currentBlock);
    
    // ═════════════════════════════════════════════════════════════
    // RÈGLES STRICTES POST-ANCRAGE
    // ═════════════════════════════════════════════════════════════
    
    // RÈGLE AVANCÉE (MESURE 9+): Au moins un bloc D toutes les 2 mesures
    const shouldForceD = (
        maskingState.measureCount >= 9 &&  // À partir de la mesure 9
        (maskingState.measureCount - maskingState.lastDMeasure) >= 2  // Au moins 2 mesures depuis le dernier D
    );
    
    if (shouldForceD && allowedBlocks.includes(MASKING_BLOCKS.D)) {
        console.log(`[MASKING] Mesure ${maskingState.measureCount}: Bloc D FORCÉ (2 mesures depuis dernier D)`);
        maskingState.currentBlock = MASKING_BLOCKS.D;
        maskingState.blockHistory.push('D');
        maskingState.measureCount++;
        maskingState.lastDMeasure = maskingState.measureCount;  // Mise à jour
        maskingState.consecutiveMaskedCount++;
        
        // Compteur de D consécutifs
        if (maskingState.blockHistory[maskingState.blockHistory.length - 2] === 'D') {
            maskingState.consecutiveDCount++;
            maskingState.lastConsecutiveDMeasure = maskingState.measureCount;
        } else {
            maskingState.consecutiveDCount = 1;
        }
        
        return MASKING_BLOCKS.D;
    }
    
    // RÈGLE 1: A interdit comme résultat de random standard
    // A ne peut être que reset ponctuel après D ou longue série
    const canResetToA = (
        maskingState.currentBlock === MASKING_BLOCKS.D ||  // Après D
        maskingState.consecutiveMaskedCount >= 6            // Après 6+ blocs masqués
    );
    
    if (!canResetToA) {
        allowedBlocks = allowedBlocks.filter(b => b !== MASKING_BLOCKS.A);
    }
    
    // RÈGLE 2: Interdiction de deux blocs D consécutifs (déjà dans getAllowedBlocks)
    
    // RÈGLE 3: Interdiction de A→D direct (déjà dans getAllowedBlocks)
    
    // Si aucun bloc autorisé (ne devrait jamais arriver), fallback vers B
    if (allowedBlocks.length === 0) {
        console.warn('[MASKING] Aucun bloc autorisé - fallback vers B');
        maskingState.currentBlock = MASKING_BLOCKS.B;
        maskingState.blockHistory.push('B');
        maskingState.consecutiveMaskedCount = 1;
        return MASKING_BLOCKS.B;
    }
    
    // Sélection pondérée avec poids phase masking
    const chosen = weightedRandom(allowedBlocks, maskingState.weightsPhaseMasking);
    
    // Mise à jour de l'état
    maskingState.currentBlock = chosen;
    maskingState.blockHistory.push(chosen.name);
    maskingState.measureCount++;
    
    // Mise à jour tracking pour blocs D
    if (chosen === MASKING_BLOCKS.D) {
        maskingState.lastDMeasure = maskingState.measureCount;
        
        // Compteur de D consécutifs
        if (maskingState.blockHistory[maskingState.blockHistory.length - 2] === 'D') {
            maskingState.consecutiveDCount++;
            maskingState.lastConsecutiveDMeasure = maskingState.measureCount;
            console.log(`[MASKING] D→D consécutif détecté (count: ${maskingState.consecutiveDCount})`);
        } else {
            maskingState.consecutiveDCount = 1;
        }
    }
    
    // Mise à jour compteur de blocs masqués consécutifs
    if (chosen === MASKING_BLOCKS.A) {
        maskingState.consecutiveMaskedCount = 0;  // Reset après A
    } else {
        maskingState.consecutiveMaskedCount++;
    }
    
    console.log(`[MASKING] Bloc ${chosen.name} sélectionné (consécutifs: ${maskingState.consecutiveMaskedCount})`);
    
    return chosen;
}

// Sélectionner les beats à masquer
function selectMaskedBeats(block) {
    if (block === MASKING_BLOCKS.A) {
        return [];  // Aucun masking
    }
    
    const totalBeats = 4;  // 4 beats par mesure
    const maskCount = block.maskedCount;
    
    // Priorité: beats faibles (2, 3, 4)
    const weakBeats = [1, 2, 3];  // Index 1, 2, 3 (beats 2, 3, 4)
    
    // Mélanger les beats faibles
    const shuffled = weakBeats.sort(() => Math.random() - 0.5);
    
    let masked = [];
    
    if (maskCount === 1) {
        // Bloc B: masquer 1 beat faible
        masked = [shuffled[0]];
        
    } else if (maskCount === 2) {
        // Bloc C: masquer 2 beats faibles
        masked = shuffled.slice(0, 2);
        
    } else if (maskCount === 4) {
        // Bloc D: masquer TOUS les 4 beats (SILENCE COMPLET)
        masked = [0, 1, 2, 3];  // Beats 1, 2, 3, 4 - TOUS masqués
        console.log('[MASKING] Bloc D: SILENCE COMPLET (4 beats masqués)');
    }
    
    return masked.sort((a, b) => a - b);  // Trier par ordre croissant
}

// Appliquer le masking pour la mesure actuelle
function applyRandomMasking() {
    if (!isMaskingOn) {
        maskingState.maskedBeats = [];
        return;
    }
    
    // Au début de chaque mesure (beat 0)
    if (currentBeat === 0) {
        const nextBlock = selectNextBlock();
        maskingState.maskedBeats = selectMaskedBeats(nextBlock);
        
        console.log(`[MASKING] Bloc: ${nextBlock.name}, Beats masqués: [${maskingState.maskedBeats.map(b => b + 1).join(', ')}]`);
    }
}

// Vérifier si le beat actuel est masqué
function isBeatMasked(beatIndex) {
    return isMaskingOn && maskingState.maskedBeats.includes(beatIndex);
}

// Réinitialiser le système de masking
function resetMaskingSystem() {
    maskingState.currentBlock = MASKING_BLOCKS.A;
    maskingState.anchoringRemaining = 2;
    maskingState.maskedBeats = [];
    maskingState.blockHistory = [];
    maskingState.measureCount = 0;
    maskingState.consecutiveMaskedCount = 0;  // Reset compteur
    
    // Reset tracking pour blocs D
    maskingState.lastDMeasure = -1;
    maskingState.lastConsecutiveDMeasure = -1;
    maskingState.consecutiveDCount = 0;
    
    console.log('[MASKING] Système réinitialisé - Phase d\'ancrage active');
}

// ═══════════════════════════════════════════════════════════════════
// TIME SIGNATURE CONTROLS (BEAT / BAR / NOTE)
// ═══════════════════════════════════════════════════════════════════

// Options disponibles pour chaque sélecteur
const BEAT_OPTIONS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16];
const BAR_OPTIONS = ['2/4', '3/4', '4/4', '5/4', '6/4', '7/4', '3/8', '5/8', '6/8', '7/8', '9/8', '12/8'];
const NOTE_OPTIONS = [
    { value: '1/2', name: 'Blanche' },
    { value: '1/4', name: 'Noire' },
    { value: '1/8', name: 'Croche' },
    { value: '1/16', name: 'Double croche' },
    { value: '1/32', name: 'Triple croche' }
];

function updateBeatsPerMeasure(newValue) {
    beatsPerMeasure = newValue;
    const beatDisplay = document.querySelector('.control-wrapper:nth-child(1) .control-value span:first-child');
    if (beatDisplay) {
        beatDisplay.textContent = newValue;
    }
    
    // Réinitialiser le beat actuel si nécessaire
    if (currentBeat >= beatsPerMeasure) {
        currentBeat = 0;
    }
    
    // 🔄 SYNCHRONISATION AUTOMATIQUE: mettre à jour BAR avec BEAT/NOTE
    const denominator = noteValue.split('/')[1] || '4';
    timeSignature = `${newValue}/${denominator}`;
    const barDisplay = document.querySelector('.control-wrapper:nth-child(2) .control-value span:first-child');
    if (barDisplay) {
        barDisplay.textContent = timeSignature;
    }
    
    // Update LED visibility
    generateBeatLEDs();
    updateBeatIndicators();
    
    console.log(`[TIME SIGNATURE] BEAT changé: ${newValue} → BAR auto-sync: ${timeSignature}`);
}

function updateTimeSignature(newValue) {
    timeSignature = newValue;
    const barDisplay = document.querySelector('.control-wrapper:nth-child(2) .control-value span:first-child');
    if (barDisplay) {
        barDisplay.textContent = newValue;
    }
    
    // 🔄 SYNCHRONISATION AUTOMATIQUE: extraire et mettre à jour BEAT et NOTE
    const [numerator, denominator] = newValue.split('/');
    const numValue = parseInt(numerator);
    const denValue = parseInt(denominator);
    
    if (!isNaN(numValue)) {
        beatsPerMeasure = numValue;
        const beatDisplay = document.querySelector('.control-wrapper:nth-child(1) .control-value span:first-child');
        if (beatDisplay) {
            beatDisplay.textContent = numValue;
        }
    }
    
    if (!isNaN(denValue)) {
        noteValue = `1/${denValue}`;
        const noteDisplay = document.querySelector('.control-wrapper:nth-child(3) .control-value span:first-child');
        if (noteDisplay) {
            noteDisplay.textContent = noteValue;
        }
    }
    
    // 🔄 Régénérer les LEDs avec le bon nombre
    generateBeatLEDs();
    updateBeatIndicators();
    
    console.log(`[TIME SIGNATURE] BAR changé: ${newValue} → BEAT: ${beatsPerMeasure}, NOTE: ${noteValue}`);
}

function updateNoteValue(newValue) {
    noteValue = newValue;
    const noteDisplay = document.querySelector('.control-wrapper:nth-child(3) .control-value span:first-child');
    if (noteDisplay) {
        noteDisplay.textContent = newValue;
    }
    
    // 🔄 SYNCHRONISATION AUTOMATIQUE: mettre à jour BAR avec BEAT/NOTE
    const denominator = newValue.split('/')[1] || '4';
    timeSignature = `${beatsPerMeasure}/${denominator}`;
    const barDisplay = document.querySelector('.control-wrapper:nth-child(2) .control-value span:first-child');
    if (barDisplay) {
        barDisplay.textContent = timeSignature;
    }
    
    console.log(`[TIME SIGNATURE] NOTE changée: ${newValue} → BAR auto-sync: ${timeSignature}`);
}

// Modal management
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('active');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('active');
    }
}

function initTimeSignatureControls() {
    // BEAT selector - open modal
    const beatControl = document.querySelector('.control-wrapper:nth-child(1) .control-group');
    if (beatControl) {
        beatControl.addEventListener('click', () => {
            populateBeatModal();
            openModal('beat-modal');
        });
    }
    
    // BAR selector - open modal
    const barControl = document.querySelector('.control-wrapper:nth-child(2) .control-group');
    if (barControl) {
        barControl.addEventListener('click', () => {
            populateBarModal();
            openModal('bar-modal');
        });
    }
    
    // NOTE selector - open modal
    const noteControl = document.querySelector('.control-wrapper:nth-child(3) .control-group');
    if (noteControl) {
        noteControl.addEventListener('click', () => {
            populateNoteModal();
            openModal('note-modal');
        });
    }
    
    // Close modals on X or outside click
    document.querySelectorAll('.modal-close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            if (modal) {
                modal.classList.remove('active');
            }
        });
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

function populateBeatModal() {
    const container = document.getElementById('beat-options');
    if (!container) return;
    
    container.innerHTML = '';
    BEAT_OPTIONS.forEach(option => {
        const item = document.createElement('div');
        item.className = 'option-item';
        if (option === beatsPerMeasure) {
            item.classList.add('selected');
        }
        item.textContent = option;
        item.addEventListener('click', () => {
            updateBeatsPerMeasure(option);
            if (isPlaying) {
                restartMetronome();
            }
            closeModal('beat-modal');
        });
        container.appendChild(item);
    });
}

function populateBarModal() {
    const container = document.getElementById('bar-options');
    if (!container) return;
    
    container.innerHTML = '';
    BAR_OPTIONS.forEach(option => {
        const item = document.createElement('div');
        item.className = 'option-item';
        if (option === timeSignature) {
            item.classList.add('selected');
        }
        item.textContent = option;
        item.addEventListener('click', () => {
            updateTimeSignature(option);
            if (isPlaying) {
                restartMetronome();
            }
            closeModal('bar-modal');
        });
        container.appendChild(item);
    });
}

function populateNoteModal() {
    const container = document.getElementById('note-options');
    if (!container) return;
    
    container.innerHTML = '';
    NOTE_OPTIONS.forEach(option => {
        const item = document.createElement('div');
        item.className = 'option-item';
        if (option.value === noteValue) {
            item.classList.add('selected');
        }
        item.innerHTML = `
            <span>${option.value}</span>
            <span class="note-name">${option.name}</span>
        `;
        item.addEventListener('click', () => {
            updateNoteValue(option.value);
            closeModal('note-modal');
        });
        container.appendChild(item);
    });
}

// ═══════════════════════════════════════════════════════════════════
// TIMER (COMPTE À REBOURS)
// ═══════════════════════════════════════════════════════════════════

function updateTimerDisplay() {
    const minutesDisplay = document.querySelector('.timer-field:first-child span');
    const secondsDisplay = document.querySelector('.timer-field:last-child span');
    
    if (minutesDisplay && secondsDisplay) {
        minutesDisplay.textContent = String(timerMinutes).padStart(2, '0');
        secondsDisplay.textContent = String(timerSeconds).padStart(2, '0');
    }
}

function startTimer() {
    if (isTimerActive || (timerMinutes === 0 && timerSeconds === 0)) {
        return;
    }
    
    isTimerActive = true;
    
    timerInterval = setInterval(() => {
        if (timerSeconds > 0) {
            timerSeconds--;
        } else if (timerMinutes > 0) {
            timerMinutes--;
            timerSeconds = 59;
        } else {
            // Timer terminé
            stopTimer();
            stopMetronome();
            console.log('[TIMER] Compte à rebours terminé - Métronome arrêté');
            // Flash visuel ou notification
            flashTimerNotification();
        }
        
        updateTimerDisplay();
    }, 1000);
    
    console.log(`[TIMER] Démarré: ${timerMinutes}:${timerSeconds}`);
}

function stopTimer() {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
    isTimerActive = false;
}

function resetTimer() {
    stopTimer();
    timerMinutes = 0;
    timerSeconds = 0;
    updateTimerDisplay();
}

function flashTimerNotification() {
    const timerFields = document.querySelectorAll('.timer-field');
    timerFields.forEach(field => {
        field.style.backgroundColor = 'rgba(255, 80, 80, 0.3)';
        setTimeout(() => {
            field.style.backgroundColor = '';
        }, 300);
    });
}

function initTimerControls() {
    const timerSection = document.querySelector('.timer-fields');
    
    // Click pour ouvrir la modale
    if (timerSection) {
        timerSection.addEventListener('click', () => {
            openModal('timer-modal');
            // Pré-remplir les inputs avec les valeurs actuelles
            document.getElementById('timer-minutes-input').value = timerMinutes;
            document.getElementById('timer-seconds-input').value = timerSeconds;
        });
    }
    
    // Bouton "Définir" dans la modale
    const setBtn = document.getElementById('timer-set-btn');
    if (setBtn) {
        setBtn.addEventListener('click', () => {
            const minutes = parseInt(document.getElementById('timer-minutes-input').value) || 0;
            const seconds = parseInt(document.getElementById('timer-seconds-input').value) || 0;
            
            timerMinutes = Math.max(0, Math.min(59, minutes));
            timerSeconds = Math.max(0, Math.min(59, seconds));
            
            updateTimerDisplay();
            closeModal('timer-modal');
            
            console.log(`[TIMER] Défini: ${timerMinutes}:${timerSeconds}`);
        });
    }
    
    // Bouton "Reset" dans la modale
    const resetBtn = document.getElementById('timer-reset-btn');
    if (resetBtn) {
        resetBtn.addEventListener('click', () => {
            resetTimer();
            document.getElementById('timer-minutes-input').value = 0;
            document.getElementById('timer-seconds-input').value = 0;
            console.log('[TIMER] Reset');
        });
    }
    
    // Boutons presets (02:30 et 05:00)
    const presetBtns = document.querySelectorAll('.preset-btn');
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const minutes = parseInt(btn.dataset.minutes) || 0;
            const seconds = parseInt(btn.dataset.seconds) || 0;
            
            // Mettre à jour les inputs
            document.getElementById('timer-minutes-input').value = minutes;
            document.getElementById('timer-seconds-input').value = seconds;
            
            // Mettre à jour les variables
            timerMinutes = minutes;
            timerSeconds = seconds;
            
            updateTimerDisplay();
            closeModal('timer-modal');
            
            console.log(`[TIMER] Preset sélectionné: ${timerMinutes}:${String(timerSeconds).padStart(2, '0')}`);
        });
    });
}

// ═══════════════════════════════════════════════════════════════════
// SESSION DURATION (CHRONOMÈTRE)
// ═══════════════════════════════════════════════════════════════════

function updateSessionDisplay() {
    const hours = Math.floor(sessionElapsedSeconds / 3600);
    const minutes = Math.floor((sessionElapsedSeconds % 3600) / 60);
    const seconds = sessionElapsedSeconds % 60;
    
    const displays = document.querySelectorAll('.duration-field span:not(.time-separator)');
    
    if (displays.length >= 3) {
        displays[0].textContent = String(hours).padStart(2, '0');
        displays[1].textContent = String(minutes).padStart(2, '0');
        displays[2].textContent = String(seconds).padStart(2, '0');
    }
}

function startSession() {
    // Si la session n'a jamais été démarrée, initialiser
    if (!hasSessionStarted) {
        hasSessionStarted = true;
        sessionStartTime = Date.now();
        console.log('[SESSION] Chronomètre démarré pour la première fois');
    } else {
        // Reprise : ajuster le temps de départ pour conserver le temps écoulé
        sessionStartTime = Date.now() - (sessionElapsedSeconds * 1000);
        console.log('[SESSION] Chronomètre repris');
    }
    
    // (Re)démarrer l'intervalle
    if (sessionInterval) {
        clearInterval(sessionInterval);
    }
    
    sessionInterval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
        sessionElapsedSeconds = elapsed;
        updateSessionDisplay();
    }, 1000);
}

function stopSession() {
    if (sessionInterval) {
        clearInterval(sessionInterval);
        sessionInterval = null;
    }
}

function resetSession() {
    stopSession();
    sessionElapsedSeconds = 0;
    hasSessionStarted = false;
    sessionStartTime = null;
    updateSessionDisplay();
    console.log('[SESSION] Chronomètre réinitialisé');
}

function initSessionDuration() {
    const durationField = document.querySelector('.duration-field');
    
    if (durationField) {
        // Click pour reset (nécessite confirmation)
        durationField.addEventListener('click', () => {
            if (hasSessionStarted) {
                const confirmReset = confirm('Réinitialiser le chronomètre de session ?');
                if (confirmReset) {
                    resetSession();
                }
            }
        });
    }
    
    // Initialize display
    updateSessionDisplay();
}

// Fonction de conversion position slider -> BPM réel
function sliderPositionToBPM(percentage) {
    if (percentage >= 0.304) {
        const adjustedPercentage = (percentage - 0.304) / (1 - 0.304);
        return Math.round(60 + adjustedPercentage * (250 - 60));
    } else {
        const adjustedPercentage = percentage / 0.304;
        return Math.round(20 + adjustedPercentage * (60 - 20));
    }
}

// Fonction inverse : BPM réel -> position slider
function bpmToSliderPosition(bpmValue) {
    if (bpmValue >= 60) {
        const percentage = (bpmValue - 60) / (250 - 60);
        return 0.304 + percentage * (1 - 0.304);
    } else {
        const percentage = (bpmValue - 20) / (60 - 20);
        return percentage * 0.304;
    }
}

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', () => {
    initAudioContext();
    // ❌ NE PAS charger clickSound ici - le navigateur refuse sans geste
    // ✅ Il sera chargé au premier clic dans playUIClick()
    initVerticalSlider();
    initVolumeSlider();
    initBPMClick();
    initPlaybackControls();
    initTempoButtons();
    initMaskingButton();
    initUniversalUIClick();  // Add UI click to all interactive buttons
    
    // Initialize new controls
    initTimeSignatureControls();  // BEAT / BAR / NOTE
    initTimerControls();          // TIMER (compte à rebours)
    initSessionDuration();        // SESSION DURATION (chronomètre)
    
    updateBPMDisplay(bpm);
    updateMaskingLED(isMaskingOn);
    updateMaskingText(isMaskingOn);  // Initialize text to OFF
    
    // Initialize displays
    updateTimerDisplay();
    updateSessionDisplay();
    
    // Generate beat LEDs dynamically
    generateBeatLEDs();
    
    // Ensure all beat LEDs are OFF at startup
    updateBeatIndicators();
    
    // ============================================================================
    // 🔒 CRITICAL: GUARANTEE KEYBOARD SHORTCUTS ALWAYS WORK
    // ============================================================================
    // Problem: After clicking a button, it retains focus and keyboard shortcuts
    // may stop working or trigger button clicks instead
    // 
    // Solution: 3-layer protection
    // 1. Make buttons non-focusable via Tab
    // 2. Force blur immediately after click
    // 3. Restore focus to body (ensures document receives keyboard events)
    
    // Make body focusable (needed for focus restoration)
    document.body.setAttribute('tabindex', '-1');
    
    // Apply to ALL buttons
    document.querySelectorAll('button').forEach(btn => {
        // Layer 1: Prevent Tab focus
        btn.setAttribute('tabindex', '-1');
        
        // Ensure button type (prevents form submission)
        if (!btn.hasAttribute('type')) {
            btn.setAttribute('type', 'button');
        }
        
        // Layer 2 & 3: Force blur + restore focus to body
        // Use mousedown (before click) to catch the focus change early
        btn.addEventListener('mousedown', (e) => {
            // Immediate blur (no setTimeout - must be synchronous)
            e.target.blur();
            
            // Restore focus to body (ensures keyboard events reach document)
            // Use setTimeout to let the click event complete first
            setTimeout(() => {
                document.body.focus();
            }, 0);
        }, true); // useCapture = true (runs before other handlers)
    });
    
    // Also handle any INPUT fields (BPM editor, etc.)
    document.querySelectorAll('input').forEach(input => {
        // When input loses focus, restore focus to body
        input.addEventListener('blur', () => {
            setTimeout(() => {
                // Only restore if no other input has focus
                if (document.activeElement === document.body || 
                    document.activeElement === null ||
                    document.activeElement.tagName === 'BODY') {
                    document.body.focus();
                }
            }, 0);
        });
    });
    
    // Initial focus on body (ensures keyboard works from page load)
    document.body.focus();
    
    console.log('🔒 Keyboard shortcuts protection enabled:');
    console.log('  ✅ All buttons: tabindex="-1"');
    console.log('  ✅ Auto-blur on mousedown');
    console.log('  ✅ Focus restored to body');
    console.log('  ✅ Inputs handled separately');
});

// ═══════════════════════════════════════════════════════════════════
// AUDIO CONTEXT
// ═══════════════════════════════════════════════════════════════════

function initAudioContext() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // ✅ CORRECTION: Reprendre AudioContext à CHAQUE geste (pas once)
    // Car certains navigateurs re-suspendent après 4s d'inactivité
    const resumeAudioContext = async () => {
        if (audioContext && audioContext.state === 'suspended') {
            try {
                await audioContext.resume();
                console.log('✅ AudioContext resumed on interaction');
            } catch (error) {
                console.error('❌ Error resuming AudioContext:', error);
            }
        }
    };
    
    // ✅ GARDER les listeners actifs (PAS de once: true)
    // Pour réactiver après re-suspension automatique
    document.addEventListener('mousedown', resumeAudioContext);
    document.addEventListener('mouseup', resumeAudioContext);
    document.addEventListener('click', resumeAudioContext);
    
    console.log('[AUDIO] AudioContext créé, état:', audioContext.state);
}

async function loadClickSound() {
    try {
        const response = await fetch('ui-click.mp3');
        const arrayBuffer = await response.arrayBuffer();
        clickSound = await audioContext.decodeAudioData(arrayBuffer);
        console.log('✅ UI Click sound loaded successfully');
    } catch (error) {
        console.error('❌ Error loading UI click sound:', error);
        console.warn('⚠️ Click sound not available');
    }
}

async function playUIClick() {
    // ✅ Si AudioContext suspendu, tenter resume
    if (audioContext && audioContext.state === 'suspended') {
        console.log('[AUDIO] AudioContext suspendu, tentative resume...');
        try {
            await audioContext.resume();
            console.log('✅ AudioContext resumed, état:', audioContext.state);
        } catch (error) {
            console.error('❌ Erreur resume AudioContext:', error);
            return;
        }
    }
    
    if (!audioContext) {
        console.warn('⚠️ AudioContext not ready');
        return;
    }
    
    // ✅ Recharger clickSound si absent
    if (!clickSound) {
        console.log('[AUDIO] clickSound absent, rechargement...');
        try {
            const response = await fetch('ui-click.mp3');
            const arrayBuffer = await response.arrayBuffer();
            clickSound = await audioContext.decodeAudioData(arrayBuffer);
            console.log('✅ clickSound chargé avec succès');
        } catch (error) {
            console.error('❌ Erreur chargement clickSound:', error);
            return;
        }
    }
    
    try {
        const source = audioContext.createBufferSource();
        const gainNode = audioContext.createGain();
        
        source.buffer = clickSound;
        source.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        source.start(0);
        console.log('[AUDIO] UI Click joué avec succès');
    } catch (error) {
        console.error('❌ Error playing UI click:', error);
    }
}

// ═══════════════════════════════════════════════════════════════════
// TAP TEMPO LOGIC (GLOBAL FUNCTION)
// ═══════════════════════════════════════════════════════════════════

function handleTapLogic() {
    const now = Date.now();
    
    console.log('[TAP DEBUG] Fonction appelée, tapTimes avant:', tapTimes.length);
    console.log('[TAP DEBUG] now:', now);
    
    // Supprimer les anciens taps (> 2 secondes)
    tapTimes = tapTimes.filter(time => (now - time) < MAX_TAP_INTERVAL);
    
    // Ajouter le tap actuel
    tapTimes.push(now);
    
    console.log('[TAP DEBUG] tapTimes après ajout:', tapTimes.length);
    console.log('[TAP DEBUG] tapTimes array:', tapTimes);
    
    // Il faut au moins 2 taps pour calculer un tempo
    if (tapTimes.length >= 2) {
        // Calculer les intervalles entre taps
        const intervals = [];
        for (let i = 1; i < tapTimes.length; i++) {
            intervals.push(tapTimes[i] - tapTimes[i - 1]);
        }
        
        // Moyenne des intervalles (en ms)
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
        
        // Convertir en BPM (60000 ms = 1 minute)
        let newBPM = Math.round(60000 / avgInterval);
        
        // Limiter au range MIN_BPM - MAX_BPM
        newBPM = Math.max(MIN_BPM, Math.min(MAX_BPM, newBPM));
        
        // Mettre à jour le BPM
        bpm = newBPM;
        updateBPMDisplay(bpm);
        const percentage = bpmToSliderPosition(bpm);
        updateVerticalSliderPosition(percentage);
        
        console.log(`[TAP TEMPO] ${tapTimes.length} taps, intervalle moyen: ${avgInterval.toFixed(0)}ms, BPM: ${newBPM}`);
        
        // Redémarrer le métronome si en cours
        if (isPlaying) {
            restartMetronome();
        }
    } else {
        console.log('[TAP TEMPO] Premier tap enregistré');
    }
    
    // Limiter à 8 taps maximum
    if (tapTimes.length > 8) {
        tapTimes.shift();
    }
}

// Exposer globalement pour postMessage
window.handleTapTempo = handleTapLogic;

function playClick() {
    if (!audioContext) return;
    
    // Ne pas jouer si le beat est masqué
    if (isBeatMasked(currentBeat)) {
        console.log(`[MASKING] Beat ${currentBeat + 1} masqué - son omis`);
        return;
    }
    
    // Utiliser l'oscillateur (ancien son)
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = currentBeat === 0 ? 1200 : 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.05);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.05);
}

// ═══════════════════════════════════════════════════════════════════
// SLIDER VERTICAL (TEMPO) - RESPONSIVE TOUCH
// ═══════════════════════════════════════════════════════════════════

function initVerticalSlider() {
    const verticalTrack = document.querySelector('.slider-track-vertical');
    
    if (!verticalTrack) return;
    
    let isDragging = false;
    let animationFrameId = null;
    
    const updateTempo = (clientY) => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
        animationFrameId = requestAnimationFrame(() => {
            const rect = verticalTrack.getBoundingClientRect();
            let y = clientY - rect.top;
            y = Math.max(0, Math.min(y, rect.height));
            
            const percentage = 1 - (y / rect.height);
            let newBpm = sliderPositionToBPM(percentage);
            newBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, newBpm));
            
            if (newBpm !== bpm) {
                bpm = newBpm;
                updateBPMDisplay(bpm);
                
                if (isPlaying) {
                    restartMetronome();
                }
            }
            
            updateVerticalSliderPosition(percentage);
        });
    };
    
    // Mouse events
    verticalTrack.addEventListener('mousedown', (e) => {
        isDragging = true;
        verticalTrack.style.cursor = 'grabbing';
        updateTempo(e.clientY);
        e.preventDefault();
    });
    
    // Touch events
    verticalTrack.addEventListener('touchstart', (e) => {
        isDragging = true;
        updateTempo(e.touches[0].clientY);
        e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            updateTempo(e.clientY);
        }
    });
    
    document.addEventListener('touchmove', (e) => {
        if (isDragging) {
            updateTempo(e.touches[0].clientY);
        }
    }, { passive: false });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            verticalTrack.style.cursor = 'pointer';
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }
    });
    
    document.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }
    });
    
    verticalTrack.addEventListener('mouseenter', () => {
        if (!isDragging) {
            verticalTrack.style.cursor = 'pointer';
        }
    });
    
    const percentage = bpmToSliderPosition(bpm);
    updateVerticalSliderPosition(percentage);
}

function updateVerticalSliderPosition(percentage) {
    const verticalTrack = document.querySelector('.slider-track-vertical');
    if (!verticalTrack) return;
    
    const stopPoint = percentage * 100;
    
    verticalTrack.style.background = `linear-gradient(to top,
        #1a1a1a 0%,
        #252525 ${stopPoint * 0.1}%,
        #323232 ${stopPoint * 0.2}%,
        #424242 ${stopPoint * 0.3}%,
        #555555 ${stopPoint * 0.4}%,
        #6b6b6b ${stopPoint * 0.5}%,
        #838383 ${stopPoint * 0.6}%,
        #9d9d9d ${stopPoint * 0.7}%,
        #b8b8b8 ${stopPoint * 0.8}%,
        #d4d4d4 ${stopPoint * 0.88}%,
        #ececec ${stopPoint * 0.94}%,
        #ffffff ${stopPoint}%,
        rgba(255, 255, 255, 0.3) ${stopPoint}%,
        rgba(100, 100, 100, 0.2) 100%
    )`;
}

// ═══════════════════════════════════════════════════════════════════
// SLIDER HORIZONTAL (VOLUME) - RESPONSIVE TOUCH
// ═══════════════════════════════════════════════════════════════════

function initVolumeSlider() {
    const volumeTrack = document.querySelector('.volume-track');
    
    if (!volumeTrack) return;
    
    let isDragging = false;
    let animationFrameId = null;
    
    const updateVolume = (clientX) => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        
        animationFrameId = requestAnimationFrame(() => {
            const rect = volumeTrack.getBoundingClientRect();
            let x = clientX - rect.left;
            x = Math.max(0, Math.min(x, rect.width));
            
            const percentage = x / rect.width;
            volume = percentage;
            
            updateVolumeSliderPosition(percentage);
        });
    };
    
    // Mouse events
    volumeTrack.addEventListener('mousedown', (e) => {
        isDragging = true;
        volumeTrack.style.cursor = 'grabbing';
        updateVolume(e.clientX);
        e.preventDefault();
    });
    
    // Touch events
    volumeTrack.addEventListener('touchstart', (e) => {
        isDragging = true;
        updateVolume(e.touches[0].clientX);
        e.preventDefault();
    }, { passive: false });
    
    document.addEventListener('mousemove', (e) => {
        if (isDragging) {
            updateVolume(e.clientX);
        }
    });
    
    document.addEventListener('touchmove', (e) => {
        if (isDragging) {
            updateVolume(e.touches[0].clientX);
        }
    }, { passive: false });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            volumeTrack.style.cursor = 'pointer';
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }
    });
    
    document.addEventListener('touchend', () => {
        if (isDragging) {
            isDragging = false;
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        }
    });
    
    volumeTrack.addEventListener('mouseenter', () => {
        if (!isDragging) {
            volumeTrack.style.cursor = 'pointer';
        }
    });
    
    updateVolumeSliderPosition(volume);
}

function updateVolumeSliderPosition(percentage) {
    const volumeTrack = document.querySelector('.volume-track');
    if (!volumeTrack) return;
    
    const stopPoint = percentage * 100;
    
    volumeTrack.style.background = `linear-gradient(to right,
        #1a1a1a 0%,
        #252525 ${stopPoint * 0.1}%,
        #323232 ${stopPoint * 0.2}%,
        #424242 ${stopPoint * 0.3}%,
        #555555 ${stopPoint * 0.4}%,
        #6b6b6b ${stopPoint * 0.5}%,
        #838383 ${stopPoint * 0.6}%,
        #9d9d9d ${stopPoint * 0.7}%,
        #b8b8b8 ${stopPoint * 0.8}%,
        #d4d4d4 ${stopPoint * 0.88}%,
        #ececec ${stopPoint * 0.94}%,
        #ffffff ${stopPoint}%,
        rgba(255, 255, 255, 0.3) ${stopPoint}%,
        rgba(100, 100, 100, 0.2) 100%
    )`;
}

// ═══════════════════════════════════════════════════════════════════
// VALEUR BPM CLIQUABLE - RESPONSIVE
// ═══════════════════════════════════════════════════════════════════

function initBPMClick() {
    const bpmDisplay = document.querySelector('.bpm-display');
    
    if (!bpmDisplay) return;
    
    bpmDisplay.style.cursor = 'pointer';
    bpmDisplay.style.userSelect = 'none';
    
    bpmDisplay.addEventListener('click', () => {
        const input = document.createElement('input');
        input.type = 'number';
        input.min = String(MIN_BPM);
        input.max = String(MAX_BPM);
        input.value = bpm;
        input.style.cssText = `
            font-family: 'Conthrax', sans-serif;
            font-size: 16vw;
            color: rgba(80, 80, 80, 0.8);
            background: rgba(255, 255, 255, 0.05);
            border: 2px solid rgba(255, 255, 255, 0.1);
            border-radius: 8px;
            width: 100%;
            text-align: center;
            line-height: 0.9;
            letter-spacing: -0.05em;
            font-weight: 600;
            padding: 10px;
            transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
        `;
        
        bpmDisplay.style.display = 'none';
        bpmDisplay.parentElement.appendChild(input);
        input.focus();
        input.select();
        
        input.addEventListener('focus', () => {
            input.style.borderColor = 'rgba(255, 255, 255, 0.3)';
            input.style.background = 'rgba(255, 255, 255, 0.08)';
        });
        
        const validateAndUpdate = () => {
            let newBpm = parseInt(input.value);
            newBpm = Math.max(MIN_BPM, Math.min(MAX_BPM, newBpm));
            
            if (!isNaN(newBpm) && newBpm !== bpm) {
                bpm = newBpm;
                updateBPMDisplay(bpm);
                const percentage = bpmToSliderPosition(bpm);
                updateVerticalSliderPosition(percentage);
                
                if (isPlaying) {
                    restartMetronome();
                }
            }
            
            input.remove();
            bpmDisplay.style.display = 'block';
        };
        
        input.addEventListener('blur', validateAndUpdate);
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                validateAndUpdate();
            } else if (e.key === 'Escape') {
                input.remove();
                bpmDisplay.style.display = 'block';
            }
        });
    });
    
    bpmDisplay.addEventListener('mouseenter', () => {
        bpmDisplay.style.transform = 'scale(1.02)';
        bpmDisplay.style.color = 'rgba(100, 100, 100, 0.6)';
    });
    
    bpmDisplay.addEventListener('mouseleave', () => {
        bpmDisplay.style.transform = 'scale(1)';
        bpmDisplay.style.color = 'rgba(80, 80, 80, 0.5)';
    });
}

function updateBPMDisplay(value) {
    const bpmDisplay = document.querySelector('.bpm-display');
    if (bpmDisplay) {
        bpmDisplay.textContent = value;
    }
}

// ═══════════════════════════════════════════════════════════════════
// BOUTONS +/- TEMPO
// ═══════════════════════════════════════════════════════════════════

function initTempoButtons() {
    const plusBtn = document.querySelector('.plus-btn');
    const minusBtn = document.querySelector('.minus-btn');
    const tapBtn = document.querySelector('.tap-btn');
    
    if (plusBtn) {
        plusBtn.addEventListener('mousedown', async () => {
            await playUIClick();  // Son UI click
            
            // Ajouter classe .clicking pour feedback visuel
            plusBtn.classList.add('clicking');
            setTimeout(() => plusBtn.classList.remove('clicking'), 150);
            
            bpm = Math.min(MAX_BPM, bpm + 1);
            updateBPMDisplay(bpm);
            const percentage = bpmToSliderPosition(bpm);
            updateVerticalSliderPosition(percentage);
            
            if (isPlaying) {
                restartMetronome();
            }
        });
    }
    
    if (minusBtn) {
        minusBtn.addEventListener('mousedown', async () => {
            await playUIClick();  // Son UI click
            
            // Ajouter classe .clicking pour feedback visuel
            minusBtn.classList.add('clicking');
            setTimeout(() => minusBtn.classList.remove('clicking'), 150);
            
            bpm = Math.max(MIN_BPM, bpm - 1);
            updateBPMDisplay(bpm);
            const percentage = bpmToSliderPosition(bpm);
            updateVerticalSliderPosition(percentage);
            
            if (isPlaying) {
                restartMetronome();
            }
        });
    }
    
    if (tapBtn) {
        console.log('[TAP DEBUG] Bouton TAP trouvé, ajout listener mousedown');
        
        tapBtn.addEventListener('mousedown', (e) => {
            console.log('[TAP DEBUG] ===== MOUSEDOWN DÉCLENCHÉ =====');
            console.log('[TAP DEBUG] Event type:', e.type);
            console.log('[TAP DEBUG] Event target:', e.target);
            console.log('[TAP DEBUG] AudioContext state AVANT:', audioContext?.state);
            
            // ✅ ANIMATION IMMÉDIATE (feedback visuel instantané, 0ms latence)
            tapBtn.classList.add('tapping');
            setTimeout(() => tapBtn.classList.remove('tapping'), 150);
            
            // ✅ LOGIQUE TAP IMMÉDIATE (calcul BPM instantané)
            handleTapLogic();
            
            // ✅ SON EN PARALLÈLE (ne bloque pas l'animation)
            playUIClick().then(() => {
                console.log('[TAP DEBUG] Son joué après animation');
                console.log('[TAP DEBUG] AudioContext state APRÈS:', audioContext?.state);
            }).catch(err => {
                console.warn('[TAP DEBUG] Son indisponible:', err);
            });
            
            console.log('[TAP DEBUG] ===== MOUSEDOWN TERMINÉ (instant) =====');
        });
        
        console.log('[TAP DEBUG] Bouton TAP initialisé avec listener mousedown');
    }
}

// ═══════════════════════════════════════════════════════════════════
// BOUTON MASKING + LED TÉMOIN
// ═══════════════════════════════════════════════════════════════════

function initMaskingButton() {
    const maskingField = document.querySelector('.masking-field');
    
    if (!maskingField) return;
    
    maskingField.style.cursor = 'pointer';
    
    maskingField.addEventListener('click', () => {
        isMaskingOn = !isMaskingOn;
        playUIClick();
        
        // Add visual feedback with .clicking class
        maskingField.classList.add('clicking');
        setTimeout(() => maskingField.classList.remove('clicking'), 150);
        
        updateMaskingLED(isMaskingOn);
        updateMaskingText(isMaskingOn);
    });
}

function updateMaskingLED(isOn) {
    const maskingField = document.querySelector('.masking-field');
    if (!maskingField) return;
    
    if (isOn) {
        maskingField.classList.add('active');  // Add active class for styling
    } else {
        maskingField.classList.remove('active');  // Remove active class
    }
}

function updateMaskingText(isOn) {
    const maskingText = document.querySelector('.masking-field span');
    if (maskingText) {
        maskingText.textContent = isOn ? 'ON' : 'OFF';
    }
}

// ═══════════════════════════════════════════════════════════════════
// UI CLICK SOUND - UNIVERSAL APPLICATION
// ═══════════════════════════════════════════════════════════════════

function initUniversalUIClick() {
    // Add UI click sound + visual feedback to all interactive buttons
    const selectors = [
        '.control-group',      // BEAT, BAR, NOTE selectors
        '.timer-field',        // Timer input fields
        '.duration-field'      // Session duration field
    ];
    
    selectors.forEach(selector => {
        const elements = document.querySelectorAll(selector);
        elements.forEach(element => {
            element.addEventListener('click', () => {
                playUIClick();
                
                // Add visual feedback with .clicking class
                element.classList.add('clicking');
                setTimeout(() => element.classList.remove('clicking'), 150);
            });
        });
    });
}

// ═══════════════════════════════════════════════════════════════════
// CONTRÔLES PLAYBACK
// ═══════════════════════════════════════════════════════════════════

function initPlaybackControls() {
    const playBtn = document.querySelector('.play-btn');
    const stopBtn = document.querySelector('.stop-btn');
    
    if (playBtn) {
        playBtn.addEventListener('click', () => {
            if (!isPlaying) {
                // Pas de son UI pour PLAY
                startMetronome();
                playBtn.classList.add('active');  // Ajoute la classe active
            } else {
                // Pas de son UI pour PLAY
                stopMetronome();
                playBtn.classList.remove('active');  // Retire la classe active
            }
        });
    }
    
    if (stopBtn) {
        stopBtn.addEventListener('click', () => {
            if (isPlaying) {
                playUIClick();  // Son de click UI
                
                // Ajouter classe .clicking pour feedback visuel
                stopBtn.classList.add('clicking');
                setTimeout(() => stopBtn.classList.remove('clicking'), 150);
                
                stopMetronome();
                if (playBtn) playBtn.classList.remove('active');  // Retire active du bouton PLAY
            }
        });
    }
}

function startMetronome() {
    if (isPlaying) return;
    
    isPlaying = true;
    currentBeat = 0;
    
    // Réinitialiser le système de masking au démarrage
    resetMaskingSystem();
    
    // Démarrer ou reprendre la session à chaque PLAY
    startSession();
    
    // Démarrer le timer si configuré
    if ((timerMinutes > 0 || timerSeconds > 0) && !isTimerActive) {
        startTimer();
    }
    
    // 🎵 CALCUL INTERVALLE SELON LA SUBDIVISION RYTHMIQUE
    // Extraire le dénominateur de la signature rythmique (NOTE)
    const denominator = parseInt(noteValue.split('/')[1]) || 4;
    
    // Ajuster l'intervalle selon le dénominateur
    // 1/4 (noire) = base, 1/8 (croche) = 2x plus rapide, 1/16 = 4x plus rapide
    const baseInterval = 60000 / bpm;  // Intervalle pour une noire (1/4)
    const interval = baseInterval * (4 / denominator);
    
    console.log(`[METRONOME] BPM: ${bpm}, Signature: ${timeSignature}, Intervalle: ${interval.toFixed(2)}ms`);
    
    // Appliquer le masking pour la première mesure
    applyRandomMasking();
    
    playClick();
    updateBeatIndicators();
    
    beatInterval = setInterval(() => {
        currentBeat = (currentBeat + 1) % beatsPerMeasure;  // Utiliser beatsPerMeasure au lieu de 4
        
        // Appliquer le masking au début de chaque mesure
        if (currentBeat === 0) {
            applyRandomMasking();
        }
        
        playClick();
        updateBeatIndicators();
    }, interval);
}

function stopMetronome() {
    if (!isPlaying) return;
    
    isPlaying = false;
    clearInterval(beatInterval);
    currentBeat = 0;
    
    // Arrêter le timer
    stopTimer();
    
    // Mettre en pause la session (pas de reset)
    stopSession();
    
    // Réinitialiser le masking à l'arrêt
    resetMaskingSystem();
    
    // Retirer la classe active du bouton PLAY
    const playBtn = document.querySelector('.play-btn');
    if (playBtn) playBtn.classList.remove('active');
    
    updateBeatIndicators();
}

function restartMetronome() {
    if (isPlaying) {
        stopMetronome();
        setTimeout(() => startMetronome(), 50);
    }
}

// ============================================================================
// GÉNÉRATION DYNAMIQUE DES LEDs (40px carrés avec 4 états de glow)
// ============================================================================
function generateBeatLEDs() {
    const container = document.getElementById('beat-indicators-container');
    if (!container) return;
    
    // Effacer les LEDs existantes
    container.innerHTML = '';
    
    // Créer les LEDs selon beatsPerMeasure
    for (let i = 0; i < beatsPerMeasure; i++) {
        const ledWrapper = document.createElement('div');
        ledWrapper.className = 'beat-led';
        ledWrapper.dataset.beat = i;
        
        const ledSquare = document.createElement('div');
        ledSquare.className = 'led-square';
        
        const ledLabel = document.createElement('div');
        ledLabel.className = 'led-label';
        ledLabel.textContent = `BEAT ${i + 1}`;
        
        ledWrapper.appendChild(ledSquare);
        ledWrapper.appendChild(ledLabel);
        container.appendChild(ledWrapper);
    }
    
    console.log(`[LEDs] Générées: ${beatsPerMeasure} LEDs`);
}

// ============================================================================
// CALCUL DES DURÉES DE FADE ADAPTATIVES AU BPM
// Fade IN rapide + Fade OUT TRÈS RAPIDE pour transitions réalistes
// ============================================================================
function calculateFadeDurations() {
    const beatDurationMs = 60000 / bpm;
    
    return {
        // Shadow 1 (traînée immédiate) - ULTRA RAPIDE avec motion blur
        shadow1: {
            fadeIn: Math.max(3, beatDurationMs * 0.01),      // 1% du beat, min 3ms
            fadeOut: Math.max(8, beatDurationMs * 0.02)      // 2% SEULEMENT = SNAP instantané
        },
        // Shadow 2 (beat actif standard) - SNAP rapide avec léger trail
        shadow2: {
            fadeIn: Math.max(5, beatDurationMs * 0.015),     // 1.5% du beat, min 5ms
            fadeOut: Math.max(12, beatDurationMs * 0.03)     // 3% SEULEMENT = disparition rapide
        },
        // Shadow 3 (accent Beat 1) - Fade in rapide, fade out COURT avec bloom
        shadow3: {
            fadeIn: Math.max(8, beatDurationMs * 0.02),      // 2% du beat, min 8ms
            fadeOut: Math.min(60, Math.max(15, beatDurationMs * 0.05))  // 5% max 60ms = decay rapide
        }
    };
}

// ============================================================================
// GESTION DES TIMEOUTS DES LEDs
// ============================================================================
const ledTimeouts = new Map(); // Stocker les timeouts par LED pour pouvoir les nettoyer

function clearLEDTimeouts(ledSquare) {
    // Nettoyer tous les timeouts associés à cette LED
    if (ledTimeouts.has(ledSquare)) {
        const timeouts = ledTimeouts.get(ledSquare);
        timeouts.forEach(timeout => clearTimeout(timeout));
        ledTimeouts.delete(ledSquare);
    }
}

// ============================================================================
// MISE À JOUR DES ÉTATS DES LEDs
// NOUVELLE LOGIQUE : Rectangle (défaut) → Shadow 2/3 (actif) → Rectangle
// ============================================================================
function updateBeatIndicators() {
    const leds = document.querySelectorAll('.beat-led');
    const fadeDurations = calculateFadeDurations();
    
    leds.forEach((led, index) => {
        const ledSquare = led.querySelector('.led-square');
        if (!ledSquare) return;
        
        // 🚫 Si métronome arrêté, toutes les LEDs OFF (#2f2f2f)
        if (!isPlaying) {
            clearLEDTimeouts(ledSquare);
            ledSquare.className = 'led-square state-off';
            return;
        }
        
        // Calculer la position relative par rapport au beat actuel
        const relativePosition = (index - currentBeat + beatsPerMeasure) % beatsPerMeasure;
        const isBeat1 = (index === 0); // Beat 1 = temps fort
        
        // ═══════════════════════════════════════════════════════════════
        // SEUL LE BEAT ACTUEL EST TRAITÉ ICI
        // Les autres LEDs gardent leur état (Rectangle ou en fade)
        // ═══════════════════════════════════════════════════════════════
        
        if (relativePosition !== 0) {
            // Pas le beat actuel → ne rien faire (laisser l'animation en cours)
            return;
        }
        
        // ═══════════════════════════════════════════════════════════════
        // BEAT ACTUEL → Lancer l'animation LIFECYCLE complète
        // Une seule animation qui dure toute la durée du beat
        // ═══════════════════════════════════════════════════════════════
        
        // Nettoyer les anciens timeouts (plus nécessaire avec lifecycle, mais par sécurité)
        clearLEDTimeouts(ledSquare);
        
        ledSquare.className = 'led-square';
        void ledSquare.offsetWidth; // Force reflow
        
        // Calculer la durée du beat en ms
        const beatDurationMs = 60000 / bpm;
        ledSquare.style.setProperty('--beat-duration', `${beatDurationMs}ms`);
        
        if (isBeat1) {
            // Beat 1 : Lifecycle Shadow 3 (Fade IN → Peak 0.2ms → Fade OUT)
            ledSquare.classList.add('beat-active-shadow3');
        } else {
            // Autres beats : Lifecycle Shadow 2 (Fade IN → Peak 0.2ms → Fade OUT)
            ledSquare.classList.add('beat-active-shadow2');
        }
    });
    
    console.log(`[LED] Beat ${currentBeat + 1}/${beatsPerMeasure} | BPM ${bpm} | Beat duration: ${(60000 / bpm).toFixed(1)}ms | Peak: 0.2ms`);
}


// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================
// NOTE: Keyboard shortcuts are now handled in the PARENT window (app.js)
// to avoid focus issues. The parent directly clicks the buttons in this iframe.
// We keep this placeholder for documentation purposes.

console.log('🎹 Metronome keyboard shortcuts: handled by PARENT (app.js)');

// ============================================================================
// SERVICE WORKER POUR PWA (Progressive Web App)
// ============================================================================
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then(registration => {
                console.log('✅ Service Worker enregistré:', registration.scope);
            })
            .catch(error => {
                console.error('❌ Erreur Service Worker:', error);
            });
    });
}
