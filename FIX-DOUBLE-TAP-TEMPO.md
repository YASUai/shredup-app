# 🔧 FIX : Double TAP Tempo (BPM doublé)

**Date :** 2026-02-11  
**Branche :** `integrate-metronome`  
**Commit :** `01d4bc9`

---

## 🐛 **PROBLÈME IDENTIFIÉ**

### **Symptômes :**
- ✅ Raccourcis clavier fonctionnent tous correctement
- ❌ **TAP Tempo calcule mal le BPM** :
  - Taper à ~100 BPM → Affiche 200-250 BPM ❌
  - BPM **doublé** systématiquement

### **Cause Racine : Double Capture du TAP**

Le TAP était capturé **DEUX FOIS** :
1. **app.js (parent)** capte ArrowLeft → envoie `postMessage({ action: 'TAP_CLICK' })`
2. **script.js (métronome)** capte ArrowLeft → dispatch `MessageEvent({ action: 'TAP_CLICK' })`

**Résultat :**
- 2 taps enregistrés au lieu de 1
- Intervalle divisé par 2
- BPM doublé !

**Exemple :**
- Tu tapes à 600ms d'intervalle (100 BPM)
- Double capture → 2 taps à 300ms d'intervalle
- Calcul : `60000 / 300 = 200 BPM` ❌

---

## ✅ **SOLUTION APPLIQUÉE**

### **Anti-Double-TAP : Détection d'iframe**

On détecte si le métronome est dans une iframe :
```javascript
const isInIframe = (window.parent !== window);
```

**Si dans une iframe :**
- ✅ Le **parent** (app.js) gère ArrowLeft via postMessage
- ❌ Le **métronome** (script.js) **ignore** ArrowLeft

**Si standalone (pas dans iframe) :**
- ✅ Le **métronome** (script.js) gère ArrowLeft directement

### **Code Modifié (script.js) :**

```javascript
// 🔒 ANTI-DOUBLE-TAP : Vérifier si l'événement vient déjà du parent
// Si window.parent !== window, on est dans une iframe
// Dans ce cas, on laisse le parent gérer ArrowLeft pour éviter les doubles taps
const isInIframe = (window.parent !== window);

switch(e.code) {
    // ...
    
    case 'ArrowLeft':
        // ⚠️ NE capturer ArrowLeft QUE si on n'est PAS dans une iframe
        // Pour éviter le double TAP (parent + métronome)
        if (!isInIframe) {
            e.preventDefault();
            action = 'TAP_CLICK';
            console.log('⌨️ [METRONOME] ArrowLeft → TAP_CLICK (standalone)');
        } else {
            console.log('⌨️ [METRONOME] ArrowLeft → Ignored (handled by parent to avoid double tap)');
        }
        break;
    
    // ... autres raccourcis restent inchangés
}
```

---

## 🎯 **COMMENT ÇA FONCTIONNE**

### **Mode IFRAME (SHRED UP avec métronome intégré) :**
```
User appuie ArrowLeft
  ↓
app.js (parent) capte → preventDefault → postMessage({ action: 'TAP_CLICK' })
  ↓
script.js (métronome) reçoit postMessage → handleTapLogic()
  ↓
✅ 1 seul TAP enregistré
```

### **Mode STANDALONE (métronome seul) :**
```
User appuie ArrowLeft
  ↓
script.js (métronome) capte → preventDefault → dispatch MessageEvent
  ↓
script.js (métronome) reçoit message → handleTapLogic()
  ↓
✅ 1 seul TAP enregistré
```

---

## 📋 **TESTS À REFAIRE**

**URL :** https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai/test-local

### **Test TAP Tempo :**

1. **Hard refresh** : Ctrl+Shift+R
2. **F12** → Console
3. **Teste TAP à ~100 BPM** :
   - Appuie ArrowLeft 4 fois à intervalle régulier (~600ms)
   - Résultat attendu : BPM ~100 ✅ (pas 200 !)

4. **Teste TAP à ~120 BPM** :
   - Appuie ArrowLeft 4 fois à intervalle régulier (~500ms)
   - Résultat attendu : BPM ~120 ✅ (pas 240 !)

5. **Teste TAP après clic BAR** :
   - Clique BAR
   - Appuie ArrowLeft 4 fois
   - Résultat attendu : BPM correct ✅

---

## 🔍 **LOGS ATTENDUS**

### **Dans l'iframe (métronome) :**
```
⌨️ SPACE → Toggle Play/Stop (LOCKED)           [app.js capte]
📨 Message received from parent: { action: 'TOGGLE_PLAY' }
[AUDIO] UI click joué avec succès

⌨️ ← → TAP Tempo (LOCKED)                      [app.js capte]
📨 Message received from parent: { action: 'TAP_CLICK' }
[TAP_CLICK] Appel playUIClick()...
⌨️ [METRONOME] ArrowLeft → Ignored (handled by parent to avoid double tap)

[TAP TEMPO] 2 taps, intervalle moyen: 600ms, BPM: 100
```

**IMPORTANT :** Tu devrais voir **"Ignored (handled by parent)"** pour ArrowLeft !

---

## 📂 **FICHIERS MODIFIÉS**

- ✅ `public/static/metronome/script.js` (14 lignes modifiées)
- ✅ `dist/static/metronome/script.js` (copié)

---

## 🚀 **COMMIT & PUSH**

- **Branche :** `integrate-metronome`
- **Commit :** `01d4bc9`
- **Message :** "fix: prevent double TAP in iframe by letting parent handle ArrowLeft"
- **Push :** ✅ GitHub

---

## 🎯 **RÉSULTAT ATTENDU**

**TAP Tempo devrait maintenant calculer le BPM CORRECTEMENT !**

- Taper à ~100 BPM → Affiche ~100 BPM ✅
- Taper à ~120 BPM → Affiche ~120 BPM ✅
- Plus de BPM doublé ! ✅

---

## 📊 **HISTORIQUE DES FIXES**

1. ✅ **Font Conthrax manquante** → Téléchargée depuis port 7777
2. ✅ **Raccourcis cassés après clic BAR** → Listeners natifs ajoutés
3. ✅ **TAP Tempo BPM doublé** → Anti-double-TAP avec détection iframe

---

**TESTE MAINTENANT le TAP Tempo et confirme si le BPM est correct ! 🚀**

**URL :** https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai/test-local
