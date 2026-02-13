# 🎸 Tuner - Sélecteur d'Accordage

## ✅ État Final (2026-02-13)

### 📋 Feature Implémentée
**Bouton TUNING** - Bascule entre 2 accordages pour guitare 7 cordes :
- **E Standard (STD)** → Par défaut, toggle ON
- **D Standard (D↓)** → Toggle OFF

---

## 🎯 Accordages Disponibles

### 1️⃣ **E STANDARD (STD - Toggle ON)**
Accordage standard pour guitare 7 cordes :

| Corde | Note | Fréquence |
|-------|------|-----------|
| 7 (grave) | **B1** | 61.74 Hz |
| 6 | **E2** | 82.41 Hz |
| 5 | **A2** | 110.00 Hz |
| 4 | **D3** | 146.83 Hz |
| 3 | **G3** | 196.00 Hz |
| 2 | **B3** | 246.94 Hz |
| 1 (aiguë) | **E4** | 329.63 Hz |

### 2️⃣ **D STANDARD (D↓ - Toggle OFF)**
Accordage un ton en dessous :

| Corde | Note | Fréquence |
|-------|------|-----------|
| 7 (grave) | **A1** | 55.00 Hz |
| 6 | **D2** | 73.42 Hz |
| 5 | **G2** | 98.00 Hz |
| 4 | **C3** | 130.81 Hz |
| 3 | **F3** | 174.61 Hz |
| 2 | **A3** | 220.00 Hz |
| 1 (aiguë) | **D4** | 293.66 Hz |

---

## 🖥️ Interface Utilisateur

### Position du Toggle
```
┌────────────────────────────┐
│  TUNER                     │
│                      ┌───┐ │ ← TUNING (top)
│                      │STD│ │
│                      └───┘ │
│                      ┌───┐ │ ← BEND (middle)
│                      │   │ │
│                      └───┘ │
│                      ┌───┐ │ ← ON/OFF (bottom)
│                      │ON │ │
│  B1  E2  A2  D3...   └───┘ │
└────────────────────────────┘
```

### États Visuels

#### Toggle ON (E Standard)
```
┌────────┐
│  [●]   │  STD
└────────┘
```
- Knob à droite
- Label "STD" visible et blanc
- Barres affichent : B1, E2, A2, D3, G3, B3, E4

#### Toggle OFF (D Standard)
```
┌────────┐
│   [●]  │  D↓
└────────┘
```
- Knob à gauche
- Label "D↓" visible et gris
- Barres affichent : A1, D2, G2, C3, F3, A3, D4

---

## 🔧 Implémentation Technique

### Fichier Modifié
- **`public/static/tuner/index.html`**

### Changements Clés

#### 1. Définition des Accordages
```javascript
const E_STANDARD_TUNING = [
  { name: 'B1', freq: 61.74, string: 1 },
  { name: 'E2', freq: 82.41, string: 2 },
  { name: 'A2', freq: 110.0, string: 3 },
  { name: 'D3', freq: 146.83, string: 4 },
  { name: 'G3', freq: 196.0, string: 5 },
  { name: 'B3', freq: 246.94, string: 6 },
  { name: 'E4', freq: 329.63, string: 7 }
];

const D_STANDARD_TUNING = [
  { name: 'A1', freq: 55.0, string: 1 },
  { name: 'D2', freq: 73.42, string: 2 },
  { name: 'G2', freq: 98.0, string: 3 },
  { name: 'C3', freq: 130.81, string: 4 },
  { name: 'F3', freq: 174.61, string: 5 },
  { name: 'A3', freq: 220.0, string: 6 },
  { name: 'D4', freq: 293.66, string: 7 }
];

let NOTES = E_STANDARD_TUNING; // Default
let isStandardTuning = true;
```

#### 2. Listener du Toggle
```javascript
tuningToggle.addEventListener('click', () => {
  isStandardTuning = !isStandardTuning;
  
  if (isStandardTuning) {
    tuningToggle.classList.add('active');
    NOTES = E_STANDARD_TUNING;
    console.log('🎸 E STANDARD tuning selected (B1, E2, A2, D3, G3, B3, E4)');
  } else {
    tuningToggle.classList.remove('active');
    NOTES = D_STANDARD_TUNING;
    console.log('🎸 D STANDARD tuning selected (A1, D2, G2, C3, F3, A3, D4)');
  }
  
  // Update bars and hexagons labels
  NOTES.forEach((note, i) => {
    const barLabel = document.querySelector(`#bar-${i} + .bar-label`) || 
                     document.querySelectorAll('.bar-label')[i];
    const hexShape = document.querySelector(`#hex-${i} .hex-shape`);
    if (barLabel) barLabel.textContent = note.name;
    if (hexShape) hexShape.textContent = note.name;
  });
  
  // Reset current note index
  currentNoteIndex = 0;
  updateHexagons();
});
```

#### 3. HTML du Toggle
```html
<div class="toggles-container">
  <!-- TUNING Toggle (top) -->
  <div class="toggle-container">
    <div class="toggle-btn active" id="tuning-toggle">
      <div class="toggle-knob"></div>
      <span class="toggle-label on">STD</span>
      <span class="toggle-label off">D↓</span>
    </div>
  </div>
  <!-- ... autres toggles ... -->
</div>
```

---

## 🧪 Tests

### Scénario de Test
1. **Chargement initial** :
   - ✅ Affiche E Standard (B1, E2, A2, D3, G3, B3, E4)
   - ✅ Toggle en position ON (STD)
   - ✅ Console log : `🎸 E STANDARD tuning selected`

2. **Clic sur toggle** :
   - ✅ Bascule vers D Standard
   - ✅ Barres affichent : A1, D2, G2, C3, F3, A3, D4
   - ✅ Hexagones mis à jour
   - ✅ Console log : `🎸 D STANDARD tuning selected`

3. **Re-clic sur toggle** :
   - ✅ Retour à E Standard
   - ✅ Toutes les notes repassent à B1-E4

### URL de Test
🌐 https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai/

---

## 📦 Git & GitHub

### Commits
```
db165d5 - feat: TUNER toggle between E Standard and D Standard tunings
da91894 - fix: TUNER iframe toggles now properly release focus
b831333 - fix: TUNER and iframe clicks no longer block shortcuts
```

### Branche
- **feature/phase-4-tuner-integration**
- Push : ✅ OK

### Backup
- **Fichier** : shredup-tuner-selector-functional.tar.gz
- **URL** : https://www.genspark.ai/api/files/s/DZ4Nu1Mj
- **Taille** : 5.2 MB
- **Date** : 2026-02-13

---

## 🚀 Déploiement

### Local (Sandbox)
```bash
cd /home/user/webapp
npm run build
pm2 restart webapp
```

### Production (Cloudflare Pages)
```bash
cd /home/user/webapp
npm run build
npx wrangler pages deploy dist --project-name shredup-app
```

---

## 📊 État Global du Projet

### Features Actives
- ✅ Métronome avec BPM 40-300
- ✅ Session Recording avec timers
- ✅ Notepad intégré
- ✅ **Tuner avec sélecteur E/D Standard** ← NOUVEAU
- ✅ Raccourcis clavier globaux

### Raccourcis Clavier
| Touche | Action |
|--------|--------|
| **Space** | Play/Stop métronome |
| **+, =, ↑** | BPM +1 |
| **-, _, ↓** | BPM -1 |
| **←** | Tap Tempo |

**Note** : Raccourcis fonctionnent partout sauf dans le NOTEPAD (comportement normal pour l'édition de texte).

---

## 🎯 Prochaines Étapes Suggérées

### Features Potentielles
1. **Autres accordages** :
   - Drop C
   - Drop B
   - Drop A
   - 8-string (F# Standard / E Standard)

2. **Indicateur visuel** :
   - Afficher l'accordage actuel en grand dans le tuner
   - Animation lors du changement d'accordage

3. **Sauvegarde préférence** :
   - Mémoriser l'accordage choisi (localStorage)
   - Restaurer au prochain chargement

4. **Mode "Custom Tuning"** :
   - Permettre de définir un accordage personnalisé
   - Modifier chaque corde individuellement

---

## 📝 Notes Techniques

### Contraintes
- **Fréquences fixes** : Basées sur A4 = 440 Hz (standard)
- **7 cordes** : Interface optimisée pour 7 strings
- **Detection DSP** : Le DSP doit détecter les fréquences correctes pour chaque accordage

### Architecture
```
parent document (app.js)
  ├─ metronome iframe
  └─ tuner iframe
       └─ tuner-dsp-bridge.js
            └─ audio-engine-phase3.js (DSP)
```

### Logs Console
```javascript
🎸 E STANDARD tuning selected (B1, E2, A2, D3, G3, B3, E4)
🎸 D STANDARD tuning selected (A1, D2, G2, C3, F3, A3, D4)
```

---

## ✅ Checklist Finale

- [x] Toggle HTML ajouté
- [x] E_STANDARD_TUNING défini avec fréquences correctes
- [x] D_STANDARD_TUNING défini
- [x] Listener click implémenté
- [x] Mise à jour dynamique des barres
- [x] Mise à jour dynamique des hexagones
- [x] Toggle initialisé en position E Standard
- [x] Console logs informatifs
- [x] Tests manuels effectués
- [x] Git commit créé
- [x] Push GitHub effectué
- [x] Backup créé
- [x] Documentation complète

---

**Date** : 2026-02-13  
**Auteur** : YASUai  
**Version** : 1.0  
**Status** : ✅ COMPLET
