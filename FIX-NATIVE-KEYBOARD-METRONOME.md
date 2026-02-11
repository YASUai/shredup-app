# 🔧 FIX : Listeners Clavier NATIFS dans le Métronome LOCAL

**Date :** 2026-02-11  
**Branche :** `integrate-metronome`  
**Commit :** `e3bdd18`

---

## 🐛 **PROBLÈME IDENTIFIÉ**

### **Symptômes :**
- ✅ **AVANT clic dans modale BAR :** Tous les raccourcis fonctionnent
- ❌ **APRÈS clic dans modale BAR :** Seul ArrowLeft (TAP) fonctionne, les autres cassés

### **Cause Racine :**
1. **app.js (SHRED UP parent)** envoie des `postMessage` à l'iframe du métronome
2. **MAIS** : Quand on clique dans la modale BAR, le **focus passe DANS l'iframe**
3. **Résultat** : app.js ne capte plus les événements clavier (ils sont capturés par l'iframe)
4. **Le métronome** n'avait **AUCUN listener clavier natif** — il n'écoutait QUE les postMessage !

### **Pourquoi ArrowLeft fonctionnait quand même ?**
- ArrowLeft fonctionnait car app.js l'envoyait via postMessage **avant** que le focus passe dans l'iframe
- Mais après le clic dans BAR, même ArrowLeft ne fonctionnait plus depuis app.js

---

## ✅ **SOLUTION APPLIQUÉE**

### **Ajout de Listeners Clavier NATIFS dans le Métronome**

On a ajouté un `document.addEventListener('keydown', ...)` **directement dans script.js du métronome** pour qu'il capte les événements clavier même quand le focus est dedans !

### **Code Ajouté (script.js, AVANT le handler postMessage) :**

```javascript
// 🔒 LISTENER CLAVIER NATIF DANS LE MÉTRONOME (pour fonctionner même avec focus dans iframe)
document.addEventListener('keydown', (e) => {
    // ❌ NE PAS capturer si on tape dans un input/textarea (sauf ArrowLeft pour TAP)
    const target = e.target;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        if (e.code !== 'ArrowLeft') {
            return; // Laisser ArrowUp/ArrowDown modifier les valeurs des inputs
        }
    }

    let action = null;

    switch(e.code) {
        case 'Space':
            e.preventDefault();
            action = 'TOGGLE_PLAY';
            console.log('⌨️ [METRONOME] SPACE → TOGGLE_PLAY');
            break;
            
        case 'ArrowLeft':
            e.preventDefault();
            action = 'TAP_CLICK';
            console.log('⌨️ [METRONOME] ArrowLeft → TAP_CLICK');
            break;
            
        case 'Equal':
        case 'NumpadAdd':
            e.preventDefault();
            action = 'BPM_UP';
            console.log('⌨️ [METRONOME] + → BPM_UP');
            break;
            
        case 'Minus':
        case 'NumpadSubtract':
            e.preventDefault();
            action = 'BPM_DOWN';
            console.log('⌨️ [METRONOME] - → BPM_DOWN');
            break;
            
        case 'ArrowUp':
            // Ne bloquer que si PAS dans un input
            if (target.tagName !== 'INPUT') {
                e.preventDefault();
                action = 'BPM_UP';
                console.log('⌨️ [METRONOME] ArrowUp → BPM_UP');
            }
            break;
            
        case 'ArrowDown':
            // Ne bloquer que si PAS dans un input
            if (target.tagName !== 'INPUT') {
                e.preventDefault();
                action = 'BPM_DOWN';
                console.log('⌨️ [METRONOME] ArrowDown → BPM_DOWN');
            }
            break;
    }

    if (action) {
        // Simuler un postMessage pour réutiliser le handler existant
        window.dispatchEvent(new MessageEvent('message', {
            data: { action },
            source: window
        }));
    }
}, true); // useCapture = true pour capturer avant les inputs
```

---

## 🎯 **COMMENT ÇA FONCTIONNE**

### **Double Capture :**
1. **app.js (SHRED UP parent)** : Capte les raccourcis AVANT que le focus passe dans l'iframe
2. **script.js (Métronome)** : Capte les raccourcis APRÈS que le focus passe dans l'iframe

### **Gestion des Inputs :**
- ✅ **ArrowLeft** : Toujours bloqué (pour TAP Tempo)
- ✅ **Space, +, -** : Toujours bloqués (sauf dans input/textarea)
- ⚠️ **ArrowUp/ArrowDown** : Passthrough dans les inputs (pour modifier les valeurs)

### **Réutilisation du Handler Existant :**
- Au lieu de dupliquer la logique, on **dispatch un MessageEvent** qui simule un `postMessage`
- Le handler `window.addEventListener('message', ...)` existant traite l'action
- ✅ Pas de duplication de code !

---

## 📋 **TESTS À REFAIRE**

**URL :** https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai/test-local

### **Test 1 : AVANT clic dans modale**
- `SPACE` → Play/Stop → ✅ Devrait fonctionner
- `← ArrowLeft` → TAP → ✅ Devrait fonctionner
- `+` → BPM +1 → ✅ Devrait fonctionner
- `-` → BPM -1 → ✅ Devrait fonctionner
- `↑` → BPM +1 → ✅ Devrait fonctionner
- `↓` → BPM -1 → ✅ Devrait fonctionner

### **Test 2 : APRÈS clic dans modale BAR**
1. Cliquer **BAR**
2. Cliquer dans un **input numérique**
3. Tester tous les raccourcis → ✅ **TOUS devraient fonctionner maintenant !**

### **Test 3 : Dans un input numérique**
- `↑` → Valeur input +1 → ✅ Devrait modifier l'input
- `↓` → Valeur input -1 → ✅ Devrait modifier l'input
- `SPACE` → Play/Stop → ✅ Devrait fonctionner (pas l'input)
- `← ArrowLeft` → TAP → ✅ Devrait fonctionner (pas l'input)

---

## 🔍 **LOGS À VÉRIFIER**

Dans la console (F12), tu devrais voir :

### **Avant clic dans modale :**
```
⌨️ SPACE → Toggle Play/Stop (LOCKED)    [depuis app.js]
📨 Message received from parent: { action: 'TOGGLE_PLAY' }
```

### **Après clic dans modale :**
```
⌨️ [METRONOME] SPACE → TOGGLE_PLAY       [depuis script.js]
📨 Message received from parent: { action: 'TOGGLE_PLAY' }
```

---

## 📂 **FICHIERS MODIFIÉS**

- ✅ `public/static/metronome/script.js` (67 lignes ajoutées)
- ✅ `dist/static/metronome/script.js` (copié)

---

## 🚀 **COMMIT & PUSH**

- **Branche :** `integrate-metronome`
- **Commit :** `e3bdd18`
- **Message :** "fix: add native keyboard listeners to local metronome for same-origin shortcut handling"
- **Push :** ✅ GitHub

---

## 🎯 **RÉSULTAT ATTENDU**

**TOUS les raccourcis devraient désormais fonctionner, MÊME après avoir cliqué dans la modale BAR !**

---

**TESTE MAINTENANT et confirme si ça marche ! 🚀**

**URL :** https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai/test-local
