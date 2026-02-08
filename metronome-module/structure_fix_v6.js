/**
 * MÉTRONOME UI - STRUCTURE FIXÉE V6
 * Applique les 3 corrections sur la structure correcte
 * CORE ZONE: BPM + PLAY/STOP + SLIDER
 * ADVANCED ZONE: TIMER + RANDOM + SESSION + BUTTONS
 */

// ================================
// CONFIGURATION
// ================================
const FIX_CONFIG = {
  bpm: {
    minFontSize: 40,
    maxFontSize: 200,
    targetFillRatio: 0.95
  },
  hud: {
    totalGraduations: 76,
    majorEvery: 10,
    minorWidth: '8px',
    minorHeight: '1px',
    majorWidth: '12px',
    majorHeight: '1.5px'
  },
  slider: {
    gapAbovePlus: 10
  },
  sliderCurrentBPM: 128,
  sliderMinBPM: 60,
  sliderMaxBPM: 250
};

// ================================
// NOUVEAU: CALCULER HAUTEUR DYNAMIQUE DU SLIDER
// ================================

function calculateSliderHeight() {
  const sliderWrapper = document.querySelector('.slider-vertical-wrapper');
  const plusBtn = document.querySelector('.plus-btn');
  
  if (!sliderWrapper || !plusBtn) {
    console.warn('⚠️ Elements introuvables pour calcul hauteur slider');
    return;
  }
  
  // ⚠️ DÉSACTIVÉ : Le slider utilise maintenant position:fixed avec height en vh dans le CSS
  // const wrapperRect = sliderWrapper.getBoundingClientRect();
  // const plusRect = plusBtn.getBoundingClientRect();
  
  // // Calculer la hauteur disponible depuis le top du wrapper jusqu'au top du bouton PLUS
  // const availableHeight = plusRect.top - wrapperRect.top - FIX_CONFIG.slider.gapAbovePlus;
  
  // // Soustraire l'espace pour les labels (20px top + 20px bottom)
  // const sliderHeight = availableHeight - 40;
  
  // if (sliderHeight > 0) {
  //   const sliderContainer = document.querySelector('.slider-hud-container');
  //   if (sliderContainer) {
  //     sliderContainer.style.height = `${sliderHeight}px`;
  //     console.log(`✅ Slider height: ${sliderHeight}px (available: ${availableHeight}px, gap: ${FIX_CONFIG.slider.gapAbovePlus}px)`);
  //   }
  // }
  
  // 🔧 FORCER LA SUPPRESSION DU STYLE INLINE (au cas où il existe déjà)
  const sliderContainer = document.querySelector('.slider-hud-container');
  if (sliderContainer && sliderContainer.style.height) {
    console.log('⚠️  Style inline détecté:', sliderContainer.style.height);
    sliderContainer.style.height = '';
    console.log('✅ Style inline supprimé - hauteur contrôlée par CSS');
  }
  
  console.log('✅ Slider height controlled by CSS (position:fixed with vh)');
}

// ================================
// 1) BPM AUTO-FIT
// ================================

function calculateOptimalBPMSize(text, containerWidth, containerHeight) {
  const temp = document.createElement('div');
  temp.style.cssText = `
    font-family: 'Conthrax', sans-serif;
    font-weight: 600;
    letter-spacing: -0.05em;
    line-height: 0.9;
    position: absolute;
    visibility: hidden;
    white-space: nowrap;
  `;
  temp.textContent = text;
  document.body.appendChild(temp);
  
  let low = FIX_CONFIG.bpm.minFontSize;
  let high = FIX_CONFIG.bpm.maxFontSize;
  let optimal = low;
  
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    temp.style.fontSize = `${mid}px`;
    
    const rect = temp.getBoundingClientRect();
    const widthRatio = rect.width / containerWidth;
    const heightRatio = rect.height / containerHeight;
    const maxRatio = Math.max(widthRatio, heightRatio);
    
    if (maxRatio <= FIX_CONFIG.bpm.targetFillRatio) {
      optimal = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }
  
  document.body.removeChild(temp);
  return optimal;
}

function applyBPMAutoFit() {
  const bpmDisplay = document.querySelector('.bpm-display');
  const bpmBox = document.querySelector('.bpm-box');
  
  if (!bpmDisplay || !bpmBox) return;
  
  // Calculer les dimensions cibles basées sur la largeur de l'écran
  const screenWidth = window.innerWidth;
  const isMobile = screenWidth <= 768;
  
  // Dimensions adaptatives selon l'écran
  const targetWidth = isMobile ? screenWidth * 0.5 : 200;   // 50% de l'écran mobile, 200px desktop
  const targetHeight = isMobile ? screenWidth * 0.25 : 100;  // 25% de l'écran mobile, 100px desktop
  
  const text = bpmDisplay.textContent;
  
  // Log pour débogage
  const computedStyle = window.getComputedStyle(bpmDisplay);
  const currentFont = computedStyle.fontFamily;
  console.log(`📝 Font actuelle: ${currentFont}`);
  console.log(`📱 Screen: ${screenWidth}px, Mobile: ${isMobile}, Target: ${targetWidth.toFixed(0)}×${targetHeight.toFixed(0)}px`);
  
  const optimalSize = calculateOptimalBPMSize(text, targetWidth, targetHeight);
  
  // Forcer avec setProperty pour override le CSS
  bpmDisplay.style.setProperty('font-size', `${optimalSize}px`, 'important');
  
  console.log(`✅ BPM auto-fit: ${optimalSize}px`);
}

// ================================
// 2) HUD GRADUATIONS
// ================================

function createHUDGraduations() {
  const hudContainer = document.querySelector('.hud-graduations');
  
  if (!hudContainer) {
    console.error('❌ .hud-graduations introuvable');
    return;
  }
  
  hudContainer.innerHTML = '';
  
  const { totalGraduations, majorEvery, minorWidth, minorHeight, majorWidth, majorHeight } = FIX_CONFIG.hud;
  const step = 100 / (totalGraduations - 1);
  
  // Créer les graduations des DEUX côtés
  for (let i = 0; i < totalGraduations; i++) {
    const isMajor = i % majorEvery === 0;
    const width = isMajor ? majorWidth : minorWidth;
    const height = isMajor ? majorHeight : minorHeight;
    const className = isMajor ? 'hud-grad hud-grad-major' : 'hud-grad hud-grad-minor';
    
    // Graduation LEFT
    const gradLeft = document.createElement('div');
    gradLeft.className = `${className} hud-grad-left`;
    gradLeft.style.cssText = `
      position: absolute;
      top: ${i * step}%;
      width: ${width};
      height: ${height};
    `;
    hudContainer.appendChild(gradLeft);
    
    // Graduation RIGHT
    const gradRight = document.createElement('div');
    gradRight.className = `${className} hud-grad-right`;
    gradRight.style.cssText = `
      position: absolute;
      top: ${i * step}%;
      width: ${width};
      height: ${height};
    `;
    hudContainer.appendChild(gradRight);
  }
  
  console.log(`✅ HUD: ${totalGraduations * 2} graduations créées (${totalGraduations} left + ${totalGraduations} right)`);
}

// ================================
// 3) SLIDER POSITION
// ================================

function updateSliderPosition(bpm) {
  const { sliderMinBPM, sliderMaxBPM } = FIX_CONFIG;
  
  bpm = Math.max(sliderMinBPM, Math.min(sliderMaxBPM, bpm));
  
  const percentage = ((bpm - sliderMinBPM) / (sliderMaxBPM - sliderMinBPM)) * 100;
  
  const handle = document.querySelector('.slider-handle');
  
  if (handle) handle.style.bottom = `${percentage}%`;
  
  console.log(`✅ Slider: ${bpm} BPM → ${percentage.toFixed(1)}%`);
}

// ================================
// INIT GLOBAL
// ================================

function initStructureFixV6() {
  console.log('🚀 Structure Fix V6 - Init...');
  console.log('═══════════════════════════════════════');
  
  // Vérifier structure
  const coreZone = document.getElementById('core-zone');
  const advancedZone = document.getElementById('advanced-zone');
  
  if (!coreZone) {
    console.error('❌ #core-zone introuvable');
    return;
  }
  
  if (!advancedZone) {
    console.error('❌ #advanced-zone introuvable');
    return;
  }
  
  console.log('✅ Structure DOM correcte détectée');
  console.log('   #core-zone: BPM + PLAY/STOP + SLIDER');
  console.log('   #advanced-zone: TIMER + RANDOM + SESSION + BUTTONS');
  console.log('');
  
  // Attendre que la police Conthrax soit chargée AVANT le BPM auto-fit
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      console.log('✅ Police Conthrax détectée comme chargée');
      // Délai supplémentaire pour être SÛR que la police est appliquée
      setTimeout(() => {
        console.log('⏱️  Délai supplémentaire appliqué (100ms)');
        applyAllCorrections();
      }, 100);
    });
  } else {
    // Fallback si Font Loading API non disponible
    console.warn('⚠️ Font Loading API non disponible - délai de 300ms');
    setTimeout(applyAllCorrections, 300);
  }
}

function applyAllCorrections() {
  // Correction 0: Calculer hauteur dynamique du slider
  console.log('0️⃣  SLIDER HEIGHT CALCULATION');
  calculateSliderHeight();
  console.log('');
  
  // Correction 1: BPM Auto-Fit (APRÈS le chargement de la police !)
  console.log('1️⃣  BPM AUTO-FIT');
  applyBPMAutoFit();
  console.log('');
  
  // Correction 2: HUD Graduations
  console.log('2️⃣  HUD GRADUATIONS');
  createHUDGraduations();
  console.log('');
  
  // Correction 3: Slider Position
  console.log('3️⃣  SLIDER POSITION');
  updateSliderPosition(FIX_CONFIG.sliderCurrentBPM);
  console.log('');
  
  console.log('═══════════════════════════════════════');
  console.log('✅ Structure Fix V6 appliquée');
}

// Auto-init
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(initStructureFixV6, 100);
  });
} else {
  setTimeout(initStructureFixV6, 100);
}

// Resize
window.addEventListener('resize', () => {
  clearTimeout(window.fixV6ResizeTimeout);
  window.fixV6ResizeTimeout = setTimeout(initStructureFixV6, 300);
});

// Export API
window.initStructureFixV6 = initStructureFixV6;
window.updateSliderPosition = updateSliderPosition;
window.calculateSliderHeight = calculateSliderHeight;

console.log('📦 structure_fix_v6.js chargé');
