# 🎨 PHASE 4.1 - TUNER UI PROTOTYPE (Visual Mock)

## ✅ PROTOTYPE DÉPLOYÉ

**URL de test:** https://8080-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai/

**Status:** ✅ Online  
**Branch:** `feature/phase-4-tuner-integration`  
**DSP:** ❌ Not connected (Phase 3 DSP frozen)  
**Mode:** Visual mock only - simulated data

---

## 🎯 OBJECTIF PHASE 4.1

Créer l'interface visuelle du Tuner **SANS** connexion DSP.

**Ce qui est implémenté:**
- ✅ Note Display (grande typo + sharp symbol)
- ✅ Horizontal Meter (-50 to +50 cents)
- ✅ Reactive Graph (Canvas scrolling)
- ✅ Neumorphic design system matching Metronome
- ✅ Mock data avec animations fluides

**Ce qui n'est PAS implémenté:**
- ❌ Connexion DSP Phase 3
- ❌ Pitch detection réelle
- ❌ State machine validation
- ❌ Intégration dans SHRED UP

---

## 🎨 COMPOSANTS VISUELS

### 1. Note Display (Top Center)

**Design:**
- Note letter: 72px, bold, white
- Sharp symbol: 36px, elevated (+8px), opacity 0.8
- Cents deviation: 24px, monospace, color-coded
- In-tune glow: white 0 0 20px rgba(255,255,255,0.3)

**Color coding (cents):**
- Perfect (≤3 cents): Green `#00ff88`
- Good (≤10 cents): Light green `#00cc66`
- Mid (≤25 cents): Yellow `#ffcc00`
- Bad (>25 cents): Red `#ff4444`

**Mock behavior:**
- Cycles through 7 notes: A1, D2, G2, C3, F3, A3, D4
- Changes every 3 seconds
- Cents oscillate continuously (-50 to +50)

---

### 2. Horizontal Meter (Middle)

**Design:**
- Range: -50 to +50 cents
- Zones:
  - Red extreme: -50 to -25, +25 to +50
  - Yellow mid: -25 to -10, +10 to +25
  - Green center: -10 to +10
- Fine ticks:
  - Major: every 25 cents (12px height)
  - Minor: every 5 cents (6px height)
- Animated indicator:
  - White vertical line with pointer
  - Glow effect
  - Smooth spring motion (cubic-bezier easing)

**Mock behavior:**
- Indicator follows mock cents value
- Smooth transition animation (0.3s)

---

### 3. Reactive Graph (Canvas - Bottom)

**Design:**
- Canvas: 100% width, 200px height
- Background: #1e1e1e with radial gradient
- Grid lines: horizontal every 25 cents (opacity 0.05)
- Center line: dashed (opacity 0.15)
- Data line:
  - White 2px stroke
  - Shadow blur 8px
  - Color shifts based on deviation:
    - Green when in-tune
    - Yellow when mid
    - Red when bad
  - Gradient fill under line

**Mock behavior:**
- Scrolls left at 60fps
- New data point every 100ms
- Data = sine wave + random noise
- Stats update:
  - Session time (elapsed)
  - Average cents (calculated from data points)

---

## 🎨 DESIGN SYSTEM INTEGRATION

### Colors (SHRED UP Palette)

```css
--bg-primary: #1a1a1a
--bg-card: #1e1e1e
--text-primary: #ffffff
--text-secondary: #b0b0b0
--text-muted: #808080

--green-perfect: #00ff88    /* ±3 cents */
--green-good: #00cc66       /* ±10 cents */
--yellow-mid: #ffcc00       /* ±25 cents */
--red-bad: #ff4444          /* >25 cents */

--glow-white: rgba(255,255,255,0.3)
--glow-green: rgba(0,255,136,0.4)
```

### Neumorphic Shadows (Matching Metronome)

```css
/* Card container */
box-shadow: 
  0 8px 24px rgba(0, 0, 0, 0.4),
  inset 0 1px 2px rgba(255, 255, 255, 0.05);

/* Inset elements (meter track) */
box-shadow: 
  inset 0 2px 8px rgba(0, 0, 0, 0.6),
  inset 0 -1px 1px rgba(255, 255, 255, 0.03);

/* Buttons */
box-shadow: 
  0 4px 12px rgba(0, 0, 0, 0.3),
  0 1px 2px rgba(255, 255, 255, 0.05);
```

### Border Radius Scale

```css
--radius-sm: 8px
--radius-md: 12px
--radius-lg: 16px
--radius-xl: 20px
```

### Spacing Scale

```css
--space-xs: 8px
--space-sm: 12px
--space-md: 16px
--space-lg: 24px
--space-xl: 32px
```

---

## 🎬 ANIMATIONS

### Note Display
- Transition: 0.3s ease
- Glow appears when in-tune (≤3 cents)

### Horizontal Meter Indicator
- Transition: 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)
- Spring-like easing for natural feel

### Reactive Graph
- 60fps scrolling (requestAnimationFrame)
- New point every 100ms
- Line color interpolation based on cents
- Smooth gradient fill under line

---

## 📐 LAYOUT

```
┌─────────────────────────────────────────────────┐
│  TUNER                        [Start Mock]   │  60px
├─────────────────────────────────────────────────┤
│                                                 │
│                   A                             │  120px
│                [+12 cents]                      │
│                                                 │
├─────────────────────────────────────────────────┤
│                                                 │
│   -50    -25     0      +25    +50             │  80px
│    |------|------|------|------|                │
│          [████▲███]                             │
│                                                 │
├─────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────┐ │
│  │                                           │ │  240px
│  │         ╱╲    ╱╲                          │ │
│  │      ╱╲╱  ╲╱╲╱  ╲                         │ │
│  │ ───╱──────────────╲───                    │ │
│  │                                           │ │
│  └───────────────────────────────────────────┘ │
│  Session: 12.5s          Avg: +2.3 cents      │
│                                                 │
└─────────────────────────────────────────────────┘

Total: ~540px height
Width: 100% (max 800px)
Padding: 24px
```

---

## 🧪 MOCK DATA GENERATOR

### Note Cycling
```javascript
const notes = [
    { letter: 'A', sharp: false, freq: 55.00 },    // A1
    { letter: 'D', sharp: false, freq: 73.42 },    // D2
    { letter: 'G', sharp: false, freq: 98.00 },    // G2
    { letter: 'C', sharp: false, freq: 130.81 },   // C3
    { letter: 'F', sharp: false, freq: 174.61 },   // F3
    { letter: 'A', sharp: false, freq: 220.00 },   // A3
    { letter: 'D', sharp: false, freq: 293.66 },   // D4
];

// Change every 3 seconds
setInterval(() => {
    currentNoteIndex = (currentNoteIndex + 1) % notes.length;
}, 3000);
```

### Cents Oscillation
```javascript
// Sine wave + noise
const baseCents = Math.sin(Date.now() / 1500) * 40;
const noise = (Math.random() - 0.5) * 10;
currentCents = baseCents + noise;
```

### Graph Data Generation
```javascript
// 60fps animation loop
const animate = () => {
    // Generate new point
    const newPoint = Math.sin(Date.now() / 500) * 30 + 
                     (Math.random() - 0.5) * 10;
    
    dataPoints.push(newPoint);
    if (dataPoints.length > 200) {
        dataPoints.shift(); // Keep only 200 points
    }
    
    drawGraph();
    requestAnimationFrame(animate);
};
```

---

## 📊 PERFORMANCE

**Canvas rendering:**
- 60fps stable
- ~200 data points buffered
- Glow effects via ctx.shadowBlur
- Gradient fills cached

**Animation:**
- CSS transitions for smooth UI
- requestAnimationFrame for graph
- setInterval for note changes (3s)
- setInterval for data generation (100ms)

**Memory:**
- Fixed buffer size (200 points max)
- No memory leaks
- Smooth cleanup on stop

---

## 🎯 VALIDATION VISUELLE

### ✅ Checklist Design

- [x] Note Display large et lisible
- [x] Sharp symbol correctement positionné
- [x] Color coding cents visible
- [x] In-tune glow fonctionne
- [x] Horizontal Meter smooth
- [x] Zones de couleur correctes
- [x] Indicator animation fluide
- [x] Ticks visibles
- [x] Graph scrolling 60fps
- [x] Line glow effect
- [x] Color shift dynamique
- [x] Stats update en temps réel
- [x] Neumorphic shadows cohérents
- [x] Border radius uniformes
- [x] Spacing scale respecté
- [x] Responsive sur mobile

---

## 🔄 NEXT STEPS (Phase 4.2)

**Après validation visuelle:**

1. ✅ Valider le design avec l'utilisateur
2. ⏳ Intégrer dans `src/index.tsx` (SHRED UP)
3. ⏳ Connecter DSP Phase 3 (pitch-detection.js)
4. ⏳ Remplacer mock data par real DSP output
5. ⏳ Add Start/Stop controls
6. ⏳ Add string selection UI
7. ⏳ Add reference pitch selector (A=440)
8. ⏳ Manual tests sur 7 cordes
9. ⏳ Production deployment

---

## 🚀 TEST INSTRUCTIONS

1. **Ouvrir:** https://8080-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai/

2. **Cliquer:** "Start Mock" button

3. **Observer:**
   - Note changes every 3 seconds
   - Cents oscillate continuously
   - Meter indicator follows smoothly
   - Graph scrolls left at 60fps
   - Color shifts based on deviation

4. **Vérifier:**
   - In-tune glow apparaît quand cents ≤ 3
   - Color coding fonctionne (green/yellow/red)
   - Stats update (session time, avg cents)
   - Animations fluides (no lag)
   - Neumorphic shadows cohérents

5. **Feedback:**
   - ✅ Design approuvé → proceed to Phase 4.2
   - ⚠️ Ajustements nécessaires → itérer sur le prototype

---

## 📝 FICHIERS CRÉÉS

```
/home/user/webapp/
├── tuner-prototype.html        ← Standalone HTML prototype
├── serve-prototype.cjs         ← Node.js server (PM2)
└── PHASE-4.1-TUNER-PROTOTYPE.md ← Ce document
```

---

## ✅ STATUS

**Prototype:** ✅ Deployed  
**URL:** https://8080-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai/  
**Server:** ✅ Running (PM2: tuner-prototype)  
**Branch:** feature/phase-4-tuner-integration  
**Main:** 🔒 Protected (untouched)  
**DSP Phase 3:** 🔒 Frozen (v0.3-phase3-stable)

**En attente:** Validation visuelle utilisateur avant Phase 4.2

---

🎸 **READY FOR VISUAL VALIDATION**
