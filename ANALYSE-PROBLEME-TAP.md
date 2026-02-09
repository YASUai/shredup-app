# 🎯 PROBLÈME TROUVÉ - AltGr TAP

**Date**: 2026-02-09  
**Problème**: Plus de son TAP, ni au clic direct ni via AltGr

---

## 🔍 ANALYSE

### **Problème 1: AltGr calculait le BPM dans SHRED UP** ❌

**Code AVANT** (SHRED UP `app.js` ligne 303-330):
```javascript
case 'AltRight': // AltGr key
  // Calcul BPM dans SHRED UP
  const intervals = []
  // ... calcul BPM
  const bpm = Math.round(60000 / avgInterval)
  
  console.log('⌨️ AltGr → TAP Tempo:', bpm, 'BPM')
  iframe.postMessage({ action: 'SET_BPM', bpm }, '*')  // ← Envoie BPM calculé
```

**Problème** :
- Le calcul BPM se faisait dans **SHRED UP**
- Envoyait `SET_BPM` au métronome avec BPM calculé
- Le métronome recevait `SET_BPM` et appelait `window.handleTapTempo()`
- **Mais `handleTapTempo()` ne joue PAS de son** (pas de `playUIClick()`)

---

### **Problème 2: SET_BPM sans son** ❌

**Code AVANT** (Métronome `script.js` ligne 1719-1731):
```javascript
case 'SET_BPM':
    const tapBtn = document.querySelector('.tap-btn');
    if (tapBtn && typeof window.handleTapTempo === 'function') {
        // ✅ NE PAS jouer playUIClick() ici - le bouton TAP le fera
        // playUIClick();  ← COMMENTÉ pour éviter double son
        
        window.handleTapTempo();  // ← Appel direct SANS son
    }
```

**Pourquoi pas de son** :
- `handleTapTempo()` appelle `handleTapLogic()` directement
- `handleTapLogic()` calcule le BPM mais **ne joue pas de son**
- Le son est joué **seulement** dans le event listener du bouton TAP

---

## ✅ SOLUTION APPLIQUÉE

### **Dans SHRED UP** ✅

**Code APRÈS** (`app.js` ligne 303-309):
```javascript
case 'AltRight': // AltGr key
  e.preventDefault()
  console.log('⌨️ AltGr → Simulate TAP button click')
  
  // ✅ SOLUTION: Simuler un clic sur le bouton TAP du métronome
  // Cela déclenche playUIClick() + handleTapLogic() avec le son
  iframe.postMessage({ action: 'TAP_CLICK' }, '*')
  break
```

**Changements** :
- ❌ **Plus de calcul BPM** dans SHRED UP
- ✅ **Envoie `TAP_CLICK`** au lieu de `SET_BPM`
- ✅ Le métronome simule un **clic sur le bouton TAP**
- ✅ Déclenche **playUIClick() + handleTapLogic()**

---

### **Dans Métronome** ⚠️ À APPLIQUER

**Code À AJOUTER** (`script.js` ligne ~1718):
```javascript
case 'TAP_CLICK':
    const tapBtn = document.querySelector('.tap-btn');
    if (tapBtn) {
        console.log('🎯 TAP click triggered via AltGr (postMessage)');
        
        // Simuler un clic mousedown sur le bouton TAP
        const event = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        tapBtn.dispatchEvent(event);
    }
    break;
```

**Résultat** :
- ✅ Simule un **vrai clic mousedown** sur le bouton TAP
- ✅ Le event listener `handleTapClick` s'exécute
- ✅ `await playUIClick()` est appelé → **SON AUDIBLE**
- ✅ `handleTapLogic()` calcule le BPM
- ✅ Flash blanc visible

---

## 📊 COMPARAISON AVANT/APRÈS

### **AVANT** ❌
```
SHRED UP (AltGr)
  ↓ Calcul BPM: 120
  ↓ postMessage({ action: 'SET_BPM', bpm: 120 })
  ↓
Métronome
  ↓ Reçoit SET_BPM
  ↓ window.handleTapTempo()
  ↓ handleTapLogic() ← PAS DE SON
  ✗ Silence
```

### **APRÈS** ✅
```
SHRED UP (AltGr)
  ↓ postMessage({ action: 'TAP_CLICK' })
  ↓
Métronome
  ↓ Reçoit TAP_CLICK
  ↓ tapBtn.dispatchEvent(new MouseEvent('mousedown'))
  ↓ handleTapClick() déclenché
  ↓ await playUIClick() ← SON AUDIBLE ✅
  ↓ handleTapLogic() ← Calcul BPM
  ✓ Son + Flash + BPM
```

---

## 🧪 TESTS

### **Test 1: AltGr depuis SHRED UP**
```
URL: https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai

1. F12 (console)
2. Appuyer AltGr 4 fois

✅ RÉSULTAT ATTENDU (après correction métronome):
   SHRED UP Console:
   - ⌨️ AltGr → Simulate TAP button click (×4)
   
   Métronome Console:
   - 🎯 TAP click triggered via AltGr (×4)
   - [TAP DEBUG] Event déclenché: mousedown (×4)
   - [AUDIO] UI Click joué avec succès (×4)
   - 🔊 Son audible (×4)
   - ⚪ Flash blanc (×4)
   - BPM calculé après 2 pressions
```

### **Test 2: Clic direct TAP (métronome)**
```
URL: https://7777-iopksqtiphh7vk63ml8pt-c07dda5e.sandbox.novita.ai/

1. F12 (console)
2. Cliquer TAP 3 fois

✅ RÉSULTAT ATTENDU:
   - [TAP DEBUG] Event déclenché: mousedown (×3)
   - [AUDIO] UI Click joué avec succès (×3)
   - 🔊 Son audible (×3)
   - ⚪ Flash blanc (×3)
   - BPM calculé après 2 clics
```

---

## 📋 ACTIONS REQUISES

### **SHRED UP** ✅ FAIT
- ✅ AltGr envoie `TAP_CLICK` au lieu de `SET_BPM`
- ✅ Calcul BPM retiré de SHRED UP
- ✅ Rebuild effectué
- ✅ Commit: `3b35a22`

### **Métronome** ⚠️ À FAIRE
- ⚠️ Ajouter `case 'TAP_CLICK'` dans postMessage handler
- ⚠️ Simuler mousedown sur le bouton TAP
- ⚠️ pm2 restart metronome
- ⚠️ Tester AltGr depuis SHRED UP

---

## 🎯 CONCLUSION

**Problème racine** :
- AltGr calculait BPM dans SHRED UP et envoyait `SET_BPM`
- `SET_BPM` appelait `handleTapTempo()` **sans son**
- Le son est joué **seulement** dans le event listener du bouton TAP

**Solution** :
- AltGr envoie maintenant `TAP_CLICK`
- Métronome simule un **vrai clic mousedown** sur le bouton TAP
- Déclenche **playUIClick() + handleTapLogic()** avec son

**Résultat attendu** :
- ✅ AltGr → Son audible + BPM calculé
- ✅ Clic direct TAP → Son audible + BPM calculé
- ✅ Cohérence parfaite entre clavier et souris

---

**Document créé** : `CORRECTION-ALTGR-TAP-CLICK.md`  
**À appliquer dans** : Discussion Métronome Port 7777
