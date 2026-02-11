# 🎸 SHRED UP v1.2 - Phase 3 (Pitch Detection + Octave Stabilization)

**Professional music practice SaaS with integrated metronome & real-time pitch detection**

[![Version](https://img.shields.io/badge/version-1.2--phase3--octave--stabilizer-brightgreen)](https://github.com)
[![Status](https://img.shields.io/badge/status-octave--stabilization--active-success)](https://github.com)
[![Build](https://img.shields.io/badge/build-91.86kB-blue)](https://github.com)

---

## 🎯 À Propos

SHRED UP est une application web professionnelle de pratique musicale intégrant un métronome avancé avec contrôle par raccourcis clavier, feedback visuel instantané (0ms), communication inter-iframe via PostMessage, et **détection de pitch en temps réel (Phase 3)**.

### Fonctionnalités Principales

#### Métronome & Interface (Phase 1-2)
- ⌨️ **Raccourcis clavier** : Contrôle complet du métronome (Play/Stop, TAP Tempo, BPM)
- ⚡ **Latence 0ms** : Feedback visuel et audio instantané
- 🎨 **Design neumorphique** : Interface moderne et élégante
- 📱 **Responsive** : Optimisé pour 400×800px (format portrait)
- 🔊 **Audio immédiat** : Click sound sur toutes les interactions

#### Pitch Detection (Phase 3) 🎵
- 🎸 **YIN Algorithm** : Détection de fréquence fondamentale (50-1200 Hz)
- 🎯 **Low Frequency Specialist** : Post-traitement pour < 70 Hz (A1 55 Hz uniquement)
- 🔒 **Octave Consistency Stabilizer** : Verrouillage harmonique temporel (toutes fréquences)
- ⚡ **Temps réel** : Fenêtre 2048 échantillons (50% overlap), latence ~55ms
- 🔬 **Haute précision** : Détection des harmoniques et correction de la fondamentale
- 📊 **Feedback visuel** : Affichage de la fréquence détectée + confidence
- 🎼 **Range étendu** : Support 7-string guitar DROP D (D2-D6) + 4-string bass (A1-G2)

---

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 20+
- npm ou pnpm
- PM2 (pré-installé dans le sandbox)

### Installation

```bash
# Cloner le repository
git clone <repository-url>
cd webapp

# Installer les dépendances
npm install

# Build
npm run build

# Démarrer avec PM2
pm2 start ecosystem.config.cjs
```

### URLs

- **Local** : http://localhost:3000
- **Métronome** : http://localhost:3000/metronome-scaled
- **Production** : https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai
- **GitHub** : https://github.com/YASUai/shredup-app (branch: `phase-3-pitch-detection`)

---

## 🎵 Phase 3 - Pitch Detection

### Architecture Technique

#### YIN Algorithm (Baseline)
- **Window Size** : 2048 échantillons (baseline inviolable)
- **Hop Size** : 1024 échantillons (50% overlap)
- **Sample Rate** : 48000 Hz
- **Frequency Range** : 50-1200 Hz
- **Latency** : ~55ms (acceptable pour practice)
- **Processing Time** : ~1.5ms par frame

#### Low Frequency Specialist (<70 Hz ONLY)
- **Activation** : POST-traitement si `frequency < 70 Hz` et `confidence >= 0.5`
- **Scope** : A1 (55 Hz) uniquement - notes vraiment basses 4-string bass
- **Fonction** : Correction des harmoniques dominantes (ex: 230-270 Hz → 55 Hz)
- **Méthode** : Analyse structurelle des ratios harmoniques (6×→5×→4×→3×→2×)
- **Smoothing** : Médian 5-frame window pour stabilité
- **Overhead** : < 0.5ms
- **Guard-rail** : `if (frequency > 75 Hz)` → skip (protège E2, D2, et toutes fréquences mid-range)

#### Octave Consistency Stabilizer (ALL frequencies)
- **Activation** : POST-traitement APRÈS LF-Specialist sur TOUTES les fréquences
- **Scope** : Toutes les notes (D2-D6) - correction d'instabilité harmonique YIN baseline
- **Fonction** : Verrouillage harmonique temporel (snap-back 2×-6× vers fondamental dominant)
- **Méthode** : Clustering temporel 5-frame window + pondération confiance
- **Target** : Résoudre instabilité D2 (73 Hz → 287 Hz 4× octave jump)
- **Overhead** : < 0.5ms
- **Architecture** : Indépendant du LF-Specialist (séparation des responsabilités)

#### Pipeline de Détection

```
Audio Capture (48kHz)
    ↓
Frame Buffer (512 samples/frame)
    ↓
Process Frames (4 frames = 2048 samples)
    ↓
YIN Detection (2048 window)
    ↓
[IF f < 75 Hz] → Low Frequency Specialist (<70 Hz)
    ├─ Harmonic ratio analysis (6×→5×→4×→3×→2×)
    ├─ Fundamental correction (A1 ~55 Hz)
    └─ Median smoothing (5-frame)
    ↓
Octave Consistency Stabilizer (ALL frequencies)
    ├─ Temporal window (5 frames)
    ├─ Dominant fundamental clustering
    ├─ Harmonic locking (2×-6× snap-back)
    └─ Confidence-weighted averaging
    ↓
Output: [Frequency (Hz), Confidence (0-1)]
```

### Validation Results (DROP D Tuning)

#### ✅ A1 (55 Hz) - 4-String Bass Low A
```
Rel Error:      +0.38% (< 5% ✅)
Octave Errors:  0% (< 5% ✅)
Avg Confidence: 0.818 (> 0.7 ✅)
LF-Specialist:  38 snap events (harmonic correction active)
Octave-Stabilizer: 0 snap events (not needed for A1)
Status: VALIDATED ✅
```

#### ✅ E2 (82.41 Hz) - Standard 6th String
```
Rel Error:      +2.98% (< 5% ✅)
Octave Errors:  0% (< 5% ✅)
Avg Confidence: 0.851 (> 0.7 ✅)
LF-Specialist:  0 activations (protected by 75 Hz guard)
Octave-Stabilizer: 0 snap events (baseline stable)
Status: VALIDATED ✅
```

#### ✅ D4 (293.66 Hz) - DROP D 1st String
```
Rel Error:      -3.66% (< 5% ✅)
Octave Errors:  3.9% (< 5% ✅)
Avg Confidence: 0.860 (> 0.7 ✅)
LF-Specialist:  0 activations (mid-range frequency)
Octave-Stabilizer: 0 snap events (baseline stable)
Status: VALIDATED ✅
```

#### ❌ D2 (73.42 Hz) - DROP D 6th String (BEFORE Octave Stabilizer)
```
Rel Error:      +166.35% (>> 5% ❌)
Octave Errors:  42.5% (>> 5% ❌)
Avg Confidence: 0.663 (< 0.7 ⚠️)
Issue: YIN detects 4× harmonic (287-300 Hz) instead of fundamental
Status: FAILED ❌ → Octave Stabilizer implementation required
```

#### 🔄 D2 (73.42 Hz) - Pending Re-validation with Octave Stabilizer
```
Expected: <5% octave errors, <5% rel error, dominant snap-backs active
Status: PENDING VALIDATION
```

### Logs Attendus

```
[PITCH-DETECTION] Initialized (window: 2048, hop: 1024)
[PITCH-DETECTION] Low Frequency Specialist: ACTIVE (<70 Hz correction)
[PITCH-DETECTION] Mode: Structural harmonic analysis + median smoothing
[PITCH-DETECTION] Octave Consistency Stabilizer: ACTIVE (all frequencies)
[PITCH-DETECTION] Mode: Temporal harmonic locking (5-frame window)
[PITCH-DETECTION] Frequency range: 50-1200 Hz
[PITCH-DETECTION] Expected latency: ~55ms (2048 baseline)

[PITCH-DETECTION] Frame 124 | 54.8 Hz | Conf: 0.52 | Win: 2048 | Proc: 1.5ms
[LF-SPECIALIST] 267.1 Hz → 54.3 Hz | Reason: Harmonic 5× detected (lag ratio 4.92)
[PITCH-DETECTION] Frame 128 | 54.3 Hz | Conf: 0.75 | Win: 2048 | Proc: 1.8ms

[PITCH-DETECTION] Frame 540 | 287.3 Hz | Conf: 0.73 | Win: 2048 | Proc: 1.9ms
[OCTAVE-STABILIZER] 287.3 Hz → 73.2 Hz | Harmonic 4× detected (287.3 Hz → 73.2 Hz)
[PITCH-DETECTION] Frame 544 | 73.2 Hz | Conf: 0.66 | Win: 2048 | Proc: 2.1ms
```

### Fichiers Principaux

```
public/static/audio-engine/
├── dsp/
│   ├── pitch-detection.js                    # YIN Algorithm (baseline 2048)
│   ├── low-frequency-specialist.js           # Post-processing <70 Hz (A1)
│   ├── octave-consistency-stabilizer.js      # Post-processing all frequencies (harmonic locking)
│   └── spectral-analyzer.js                  # Spectral pre-analysis (future use)
│   ├── low-frequency-specialist.js # Post-processing <70 Hz
│   └── spectral-analyzer.js        # Spectral pre-analysis (inactive)
├── frame-buffer.js                 # Frame accumulation
├── audio-capture.js                # Audio capture
├── audio-engine-phase3.js          # Engine orchestrator
└── timing-sync.js                  # Timing synchronization
```

### Commits Phase 3

```
d302748 feat(phase3): implement YIN baseline (2048 window)
789f7e8 feat(phase3): low frequency specialist mode FAILED (dual-pass issue)
e29549c feat(phase3): dual-pass YIN + spectral analyzer OK
c3913bb fix(phase3): correct frame availability check for 4096 window
448ab1f fix(phase3): correct FrameBuffer API call (getBufferSize)
7c46e3a feat(phase3): integrate Low Frequency Specialist (<70 Hz) ⭐
```

### Validation A1 (55 Hz)

**Target Metrics:**
- Detected Frequency: 52-58 Hz (±5% of 55 Hz)
- Relative Error: < 10% (vs +178% avant Low Frequency Specialist)
- Octave Error Rate: < 10% (vs 75% avant)
- Detection Rate: ≥ 60% (confidence >= 0.5)

**Résultats Avant Low Frequency Specialist:**
- ✅ A1 détecté correctement en 2048 : ~54.3-54.8 Hz sur 50+ frames
- ❌ Dominances harmoniques intermittentes : ~230-270 Hz (80+ frames)
- Abs Error: +98.33 Hz | Rel Error: +178.78% | Octave Errors: 2.9%

**Objectif Après Low Frequency Specialist:**
- ✅ Correction harmoniques → fondamentale (~230-270 Hz → ~55 Hz)
- ✅ Médian smoothing pour stabilité
- ✅ Préservation baseline 6-string (E2-E4 unchanged)

---

## ⌨️ Raccourcis Clavier

| Touche | Action |
|---|---|
| **ESPACE** | Play/Stop métronome |
| **CTRL** (×4) | TAP Tempo (calcule BPM sur 4 taps) |
| **+** ou **↑** | BPM +1 |
| **−** ou **↓** | BPM −1 |
| ***** (Numpad) | Toggle REC |

### Caractéristiques

- **TAP Tempo intelligent** : Moyenne sur 4 taps, reset après 2s
- **Plage BPM** : 20-250 BPM
- **Focus robuste** : ESPACE fonctionne même après clic sur TAP
- **Feedback instantané** : 0ms de latence

---

## 🏗️ Architecture

### Stack Technique

- **Framework** : Hono (lightweight web framework)
- **Runtime** : Cloudflare Workers / Node.js
- **Frontend** : Vanilla JavaScript + TailwindCSS (CDN)
- **Communication** : PostMessage (SHRED UP ↔ Métronome)
- **Build** : Vite + TypeScript

### Structure

```
webapp/
├── src/
│   ├── index.tsx          # Routes principales
│   └── renderer.tsx       # Renderer Hono
├── public/static/
│   ├── app.js            # Raccourcis clavier + PostMessage
│   └── style.css         # Styles globaux
├── ecosystem.config.cjs   # Configuration PM2
├── package.json          # Dépendances
├── wrangler.jsonc        # Config Cloudflare
└── README.md
```

### Architecture PostMessage

```
SHRED UP (port 3000)
  └─ app.js capture touches
     └─ postMessage → iframe
        └─ MÉTRONOME (port 7777)
           └─ script.js reçoit messages
              └─ Exécute actions (click boutons, MAJ BPM)
```

---

## 🎨 Intégration Métronome

### Route `/metronome-scaled`

L'iframe métronome est intégrée avec :
- **Taille** : 400×800px (100% du conteneur)
- **Scale** : Contenu réduit de 10% (`scale(0.9)`) et centré
- **Background** : Gradient #141414 remplissant 100%
- **Communication** : PostMessage bidirectionnelle

### Configuration

```typescript
// src/index.tsx
app.get('/metronome-scaled', (c) => {
  return c.html(`
    <iframe 
      src="https://7777-iopksqtiphh7vk63ml8pt-c07dda5e.sandbox.novita.ai/"
      style="width: 100%; height: 100%;"
    ></iframe>
  `)
})
```

---

## 🔧 Scripts

```bash
# Développement
npm run dev              # Vite dev server
npm run dev:sandbox      # Wrangler pages dev (sandbox)

# Build
npm run build            # Build production (timeout 300s)

# PM2
npm run clean-port       # Libérer le port 3000
pm2 start ecosystem.config.cjs  # Démarrer
pm2 restart webapp       # Redémarrer
pm2 logs webapp --nostream      # Voir les logs

# Git
npm run git:init         # Initialiser git
npm run git:commit       # Commit rapide
npm run git:status       # Status

# Phase 3 - Pitch Detection Testing
# 1. Open: http://localhost:3000
# 2. F12 Console
# 3. Enter frequency (ex: 55 for A1)
# 4. Click "Initialize Audio Engine"
# 5. Click "Start" → Play A1 note
# 6. Observe console logs: [PITCH-DETECTION] + [LF-SPECIALIST]
```

---

## 📚 Documentation

### Guides Complets

- **PRODUCTION-READY-v1.1.md** - Documentation finale complète
- **VALIDATION-FINALE-COMPLETE.md** - Checklist validation
- **RACCOURCIS-WORKING-v1.1.md** - Architecture raccourcis clavier

### Guides Techniques

- **CORRECTION-APPLIQUEE-BACKGROUND.md** - Fix background 100%
- **SCALE-10-METRONOME.md** - Application scale -10%
- **FIX-LATENCE-0MS-BACKGROUND-100.md** - Fix latence et background

### Guides Rapides

- **ACTION-IMMEDIATE.md** - Guide ultra-simplifié
- **RECAPITULATIF-VISUEL.md** - Résumé visuel avec diagrammes

---

## 🏷️ Versions

### Tags Principaux

- `v1.0-raccourcis-fonctionnels` - Première implémentation
- `v1.1-background-fixed` - Background 100% corrigé
- `v1.1-docs-complete` - Documentation complète
- **`v1.1-production-ready`** ⭐ - Version finale validée

### Derniers Commits

```
4b13ae7 docs: add production ready final documentation v1.1
f0ee8b5 docs: add complete final validation checklist
9994e59 fix: remove scale transform, use 100% iframe size
542ca62 feat: add keyboard shortcuts in app.js
```

---

## ✅ Statut Validation

### Fonctionnalités Phase 1-2 ✅

- [x] Raccourcis clavier complets
- [x] Latence 0ms (instantané)
- [x] Background 100% sans bordures
- [x] Scale -10% centré
- [x] PostMessage fonctionnel
- [x] Feedback visuel + audio

### Fonctionnalités Phase 3 (Pitch Detection) 🔄

- [x] YIN Algorithm (baseline 2048)
- [x] Frame Buffer (512 samples/frame)
- [x] Spectral Analyzer (40-80 Hz detection)
- [x] Low Frequency Specialist (post-processing <70 Hz)
- [x] Structural CMNDF analysis
- [x] Harmonic detection (2×, 3×, 4×, 5×, 6×)
- [x] Fundamental correction
- [x] Median smoothing (5-frame window)
- [ ] **A1 (55 Hz) validation PENDING** ⏳
- [ ] E2-E4 (6-string) validation PENDING

### Tests Phase 1-2 ✅

- [x] ESPACE → Play/Stop instantané
- [x] CTRL ×4 → TAP Tempo
- [x] +/− → BPM ±1
- [x] Background remplit 100%
- [x] Pas de bordures blanches
- [x] Console sans erreurs

### Tests Phase 3 (À Effectuer) 🔄

**Validation A1 (55 Hz):**
1. Enter expected frequency: `55`
2. Click "Initialize Audio Engine" (should succeed without errors)
3. Click "Start"
4. Play A1 note (55 Hz) on instrument
5. Observe console logs:
   - ✅ `[PITCH-DETECTION] Initialized (window: 2048, hop: 1024)`
   - ✅ `[PITCH-DETECTION] Low Frequency Specialist: ACTIVE (<70 Hz correction)`
   - ✅ `Frame XXX | 54.X Hz | Conf: 0.XX | Win: 2048 | Proc: X.Xms`
   - ✅ `[LF-SPECIALIST] XXX.X Hz → 5X.X Hz | Reason: Harmonic X× detected`
6. Verify metrics:
   - Detected Frequency: 52-58 Hz (±5% of 55 Hz)
   - Relative Error: < 10%
   - Octave Error Rate: < 10%
   - Detection Rate: ≥ 60%

**Validation E2 (82 Hz):**
- Same protocol with expected frequency `82`
- NO Low Frequency Specialist activation (f >= 70 Hz)
- YIN baseline only

**Validation E4 (330 Hz):**
- Same protocol with expected frequency `330`
- NO Low Frequency Specialist activation
- YIN baseline only

---

## 🚀 Déploiement

### Cloudflare Pages (Optionnel)

```bash
# Setup
npx wrangler login

# Deploy
npm run build
npx wrangler pages deploy dist --project-name shred-up
```

### GitHub

```bash
# Setup (dans Claude Code)
# Appeler setup_github_environment d'abord

# Push
git push origin main
git push origin --tags
```

---

## 🐛 Dépannage

### Port 3000 occupé

```bash
npm run clean-port
# ou
fuser -k 3000/tcp
```

### Build échoue

```bash
# Nettoyer et rebuilder
rm -rf node_modules dist
npm install
npm run build
```

### Raccourcis ne fonctionnent pas

1. Vérifier la console (F12)
2. Vérifier les logs : `⌨️ SPACE → Toggle Play/Stop`
3. Vider le cache : Ctrl+Shift+R

---

## 📝 Notes de Développement

### Phase 3 - Pitch Detection Journey

**Diagnostic Initial (A1 55 Hz):**
- YIN baseline 2048 détectait correctement A1 (~54.3-54.8 Hz) sur 50+ frames
- Problème: Dominances harmoniques intermittentes (~230-270 Hz) sur 80+ frames
- Conclusion: Le problème n'était PAS lié à la résolution de fenêtre

**Tentative 1: Dual-Pass Architecture (2048/4096)**
- Spectral pre-analysis pour détecter basse fréquence (40-80 Hz)
- Si détecté → extended window 4096
- Résultat: FAILED (4096 jamais activé, bugs de frame availability)

**Solution Finale: Low Frequency Specialist**
- Approche: POST-traitement spécialisé pour < 70 Hz
- Méthode: Analyse structurelle CMNDF + comparaison harmoniques
- Correction: Détection harmonique (2×, 3×, 4×, 5×, 6×) → fondamentale
- Smoothing: Médian 5-frame window
- Overhead: < 0.5ms
- Status: ✅ Intégré, en attente de validation

**Key Learnings:**
- Toujours privilégier la simplicité (post-processing vs dual-pass)
- Analyser les données avant d'élargir la fenêtre
- YIN 2048 est suffisant si post-traitement adapté
- Les harmoniques sont un problème d'analyse, pas de résolution

### Commits Explicites

Ce repository utilise une approche de commits explicites. Aucun merge automatique n'est effectué. Tous les commits sont déclenchés manuellement par le propriétaire du projet.

### État Initial

Le premier état commité correspond à une fondation visuelle validée. Chaque commit ultérieur marque une étape validée du développement.

---

## 📄 Licence

Propriétaire : Projet privé

---

## 🤝 Contact

Pour toute question ou suggestion, veuillez contacter l'équipe de développement.

---

**Version** : v1.2-phase3-pitch-detection  
**Date** : 2026-02-11  
**Statut** : 🔄 Phase 3 - Low Frequency Specialist Integrated (Validation Pending)

---

**SHRED UP - Professional Music Practice SaaS** 🎸🚀

**Current Branch:** `phase-3-pitch-detection`  
**Last Commit:** `7c46e3a` - feat(phase3): integrate Low Frequency Specialist (<70 Hz)
