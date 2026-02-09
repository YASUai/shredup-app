# 📍 LOCALISATION DES RACCOURCIS CLAVIER

**Date**: 2026-02-09  
**Question**: Où sont les raccourcis clavier fonctionnels ?

---

## ✅ RÉPONSE: Dans SHRED UP (Port 3000)

**Fichier**: `/home/user/webapp/public/static/app.js`  
**Fonction**: `initializeKeyboardShortcuts()` (ligne 274)

---

## 🎯 ARCHITECTURE

```
┌─────────────────────────────────────────┐
│   SHRED UP (Port 3000)                  │
│   public/static/app.js                  │
│                                         │
│   ┌───────────────────────────────┐    │
│   │  initializeKeyboardShortcuts  │    │
│   │  (ligne 274-365)              │    │
│   │                               │    │
│   │  Écoute:                      │    │
│   │  - ESPACE → TOGGLE_PLAY       │    │
│   │  - AltGr → TAP Tempo (SET_BPM)│    │
│   │  - +/- → BPM_UP/DOWN          │    │
│   │  - * → Toggle REC             │    │
│   └───────────┬───────────────────┘    │
│               │ postMessage            │
└───────────────┼────────────────────────┘
                │
                ▼
┌───────────────────────────────────────┐
│   MÉTRONOME (Port 7777)               │
│   script.js                           │
│                                       │
│   ┌─────────────────────────────┐    │
│   │  window.addEventListener    │    │
│   │  ('message', ...)          │    │
│   │  (ligne ~1661)             │    │
│   │                            │    │
│   │  Reçoit:                   │    │
│   │  - TOGGLE_PLAY             │    │
│   │  - SET_BPM (TAP)           │    │
│   │  - BPM_UP                  │    │
│   │  - BPM_DOWN                │    │
│   └────────────────────────────┘    │
└───────────────────────────────────────┘
```

---

## 📋 DÉTAILS DES RACCOURCIS

### **ESPACE → Play/Stop** ✅
```javascript
case 'Space':
  e.preventDefault()
  console.log('⌨️ SPACE → Toggle Play/Stop')
  iframe.postMessage({ action: 'TOGGLE_PLAY' }, '*')
  break
```

**Emplacement**: SHRED UP `app.js` ligne 297-301  
**Cible**: Métronome via postMessage  
**Action**: Toggle Play/Stop du métronome

---

### **AltGr → TAP Tempo** ✅
```javascript
case 'AltRight': // AltGr key
  e.preventDefault()
  const now = Date.now()
  tapTimes.push(now)
  
  // Keep only last 4 taps
  if (tapTimes.length > 4) tapTimes.shift()
  
  // Reset if more than 2s since last tap
  if (tapTimes.length > 1 && (now - tapTimes[tapTimes.length - 2]) > 2000) {
    tapTimes = [now]
  }
  
  // Calculate BPM from taps
  if (tapTimes.length >= 2) {
    const intervals = []
    for (let i = 1; i < tapTimes.length; i++) {
      intervals.push(tapTimes[i] - tapTimes[i-1])
    }
    const avgInterval = intervals.reduce((a,b) => a+b, 0) / intervals.length
    let bpm = Math.round(60000 / avgInterval)
    
    // Clamp to 20-250
    bpm = Math.max(20, Math.min(250, bpm))
    
    console.log('⌨️ AltGr → TAP Tempo:', bpm, 'BPM')
    iframe.postMessage({ action: 'SET_BPM', bpm }, '*')
  }
  break
```

**Emplacement**: SHRED UP `app.js` ligne 303-331  
**Logique**: 
- Calcul BPM dans SHRED UP (côté parent)
- Envoie BPM calculé au métronome via postMessage
- Métronome reçoit BPM et met à jour l'affichage

---

### **+/- → BPM ±1** ✅
```javascript
case 'Equal':
case 'NumpadAdd':
case 'ArrowUp':
  e.preventDefault()
  console.log('⌨️ + → BPM +1')
  iframe.postMessage({ action: 'BPM_UP' }, '*')
  break
  
case 'Minus':
case 'NumpadSubtract':
case 'ArrowDown':
  e.preventDefault()
  console.log('⌨️ - → BPM -1')
  iframe.postMessage({ action: 'BPM_DOWN' }, '*')
  break
```

**Emplacement**: SHRED UP `app.js` ligne 333-347  
**Cible**: Métronome via postMessage  
**Actions**: BPM +1 ou BPM -1

---

### *** → Toggle REC** ✅
```javascript
case 'NumpadMultiply':
  e.preventDefault()
  console.log('⌨️ * → Toggle REC')
  const firstRecBtn = document.querySelector('.rec-button')
  if (firstRecBtn) firstRecBtn.click()
  break
```

**Emplacement**: SHRED UP `app.js` ligne 349-354  
**Cible**: Bouton REC dans SHRED UP (pas dans métronome)  
**Action**: Clic sur le premier bouton REC de l'interface

---

## 🔍 POURQUOI DANS SHRED UP ?

### **Avantages** ✅
1. **Un seul point d'écoute**: Tous les raccourcis gérés au même endroit
2. **Pas de conflit focus**: SHRED UP capture les événements clavier globalement
3. **Communication unidirectionnelle**: SHRED UP → Métronome (plus simple)
4. **Extensible**: Facile d'ajouter des raccourcis pour d'autres modules

### **Fonctionnement**
1. Utilisateur appuie sur une touche (ESPACE, AltGr, +, -, *)
2. SHRED UP `app.js` capture l'événement `keydown`
3. SHRED UP envoie un message au métronome via `postMessage`
4. Métronome reçoit le message et exécute l'action

---

## 📊 STATUT ACTUEL

| Raccourci | Emplacement | Statut | Notes |
|-----------|-------------|--------|-------|
| **ESPACE** | SHRED UP | ✅ Fonctionnel | Toggle Play/Stop |
| **AltGr** | SHRED UP | ⚠️ En attente | TAP tempo (problème son + 1er clic) |
| **+/-** | SHRED UP | ✅ Fonctionnel | BPM ±1 |
| *** | SHRED UP | ✅ Fonctionnel | Toggle REC |

---

## 🚧 PROBLÈMES ACTUELS (TAP)

### **Côté Métronome** ⚠️
1. **Son silencieux**: AudioContext suspendu
2. **Premier clic inactif**: mouseup/mousedown problème

### **Corrections en cours** (Discussion Métronome)
- ✅ AudioContext resume au premier geste
- ✅ mouseup au lieu de mousedown
- 🔄 Analyse approfondie en cours pour trouver la vraie cause

---

## 🎯 RÉSUMÉ

**Question**: Où sont les raccourcis clavier ?  
**Réponse**: **Dans SHRED UP** (`public/static/app.js` ligne 274-365)

**Architecture**:
```
SHRED UP (app.js)
  └─ keydown listener
      └─ postMessage
          └─ Métronome (script.js)
              └─ message listener
                  └─ Actions (PLAY, TAP, BPM±1)
```

**Statut global**: 
- ✅ 3/4 raccourcis fonctionnels (ESPACE, +/-, *)
- ⚠️ 1/4 en correction (AltGr TAP)

---

## 📄 FICHIERS CONCERNÉS

**SHRED UP (Port 3000)**:
- `/home/user/webapp/public/static/app.js` (ligne 274-365) ← **Raccourcis ICI**
- `/home/user/webapp/src/index.tsx` (iframe embed)

**Métronome (Port 7777)**:
- `script.js` (ligne ~1661) ← Message listener
- `index.html` (boutons TAP, PLAY, etc.)

---

**En attente**: Corrections Métronome pour résoudre problèmes TAP (son + 1er clic)
