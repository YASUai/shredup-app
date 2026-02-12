# 🧪 Test des Raccourcis Clavier - Guide Complet

## 🔗 URL de Test
https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai/

---

## ✅ Scénarios de Test

### 1️⃣ **Test de base - Sans clic préalable**
**Objectif:** Vérifier que les raccourcis fonctionnent dès le chargement

**Actions:**
1. Ouvrir l'URL dans le navigateur
2. Ouvrir la console DevTools (F12)
3. **NE PAS CLIQUER** nulle part
4. Appuyer sur les touches suivantes :

| Touche | Action Attendue | Log Console Attendu |
|--------|-----------------|---------------------|
| **Space** | Toggle PLAY/STOP | `⌨️ SPACE → Toggle Play/Stop` |
| **ArrowLeft** | TAP Tempo | `⌨️ ← → TAP Tempo` |
| **+** (Equal) | BPM +1 | `⌨️ + → BPM +1` |
| **-** (Minus) | BPM -1 | `⌨️ - → BPM -1` |
| **ArrowUp** | BPM +1 | `⌨️ + → BPM +1` |
| **ArrowDown** | BPM -1 | `⌨️ - → BPM -1` |

**Résultat Attendu:**
- ✅ Chaque touche déclenche l'action
- ✅ Logs apparaissent dans la console
- ✅ Le métronome réagit visuellement

---

### 2️⃣ **Test après clic sur BPM+**
**Objectif:** Vérifier que les raccourcis fonctionnent après interaction avec l'iframe

**Actions:**
1. **Cliquer** sur le bouton **BPM +** dans le métronome
2. Appuyer sur **Space**

**Résultat Attendu:**
- ✅ Space toggle PLAY/STOP
- ❌ Le bouton BPM+ ne doit PAS s'allumer
- ✅ Log console : `⌨️ SPACE → Toggle Play/Stop`
- ✅ Log console : `🎵 metronomeTogglePlay() called from parent`

---

### 3️⃣ **Test après clic sur PLAY**
**Objectif:** Vérifier focus après activation du métronome

**Actions:**
1. **Cliquer** sur **PLAY**
2. Appuyer sur **+**
3. Appuyer sur **Space**

**Résultat Attendu:**
- ✅ + augmente le BPM
- ✅ Space arrête le métronome
- ✅ Aucun bouton ne reste allumé

---

### 4️⃣ **Test après édition du BPM**
**Objectif:** Vérifier que l'édition n'interfère pas

**Actions:**
1. **Cliquer** sur le chiffre du BPM (128)
2. **Taper** "140" puis **Entrée**
3. Attendre 1 seconde
4. Appuyer sur **Space**

**Résultat Attendu:**
- ✅ BPM passe à 140
- ✅ Space toggle PLAY/STOP (pas de caractère tapé)

---

### 5️⃣ **Test de la touche TAP (ArrowLeft)**
**Objectif:** Vérifier le calcul de tempo

**Actions:**
1. Appuyer sur **ArrowLeft** 4 fois de suite à un rythme régulier

**Résultat Attendu:**
- ✅ Le BPM se calcule automatiquement
- ✅ Log console : `👆 metronomeTap() called from parent`
- ✅ Feedback visuel sur le bouton TAP

---

### 6️⃣ **Test dans un champ de texte (NOTEPAD)**
**Objectif:** Vérifier que les raccourcis sont ignorés dans les inputs

**Actions:**
1. **Cliquer** dans le bloc NOTEPAD (textarea en bas à droite)
2. Appuyer sur **Space** plusieurs fois

**Résultat Attendu:**
- ✅ Des espaces sont tapés dans le textarea
- ❌ Le métronome NE doit PAS toggle PLAY/STOP
- ❌ Aucun log de raccourci dans la console

---

### 7️⃣ **Test rapide de tous les raccourcis**
**Objectif:** Stress test

**Actions:**
1. Appuyer rapidement sur : **Space → + → - → ArrowLeft → ArrowUp → ArrowDown**

**Résultat Attendu:**
- ✅ Toutes les actions se déclenchent
- ✅ Aucune erreur dans la console
- ✅ Le métronome reste stable

---

## 📊 Checklist Finale

| Test | État | Notes |
|------|------|-------|
| 1️⃣ Raccourcis sans clic | ⬜ | |
| 2️⃣ Space après BPM+ | ⬜ | |
| 3️⃣ Raccourcis après PLAY | ⬜ | |
| 4️⃣ Raccourcis après édition BPM | ⬜ | |
| 5️⃣ TAP tempo (ArrowLeft) | ⬜ | |
| 6️⃣ Input ignoré (NOTEPAD) | ⬜ | |
| 7️⃣ Stress test | ⬜ | |

---

## 🔍 Logs Console à Vérifier

**Au chargement:**
```
✅ Metronome API exposed on window: metronomeTogglePlay, metronomeTap, metronomeBPMUp, metronomeBPMDown
✅ Keyboard shortcuts initialized (DIRECT CALL MODE)
```

**À chaque raccourci:**
```
⌨️ SPACE → Toggle Play/Stop
🎵 metronomeTogglePlay() called from parent
✅ Keyboard shortcut handled
```

---

## 🚨 Problèmes Possibles

| Symptôme | Cause | Solution |
|----------|-------|----------|
| Aucun log de raccourci | app.js pas chargé | Vérifier la console |
| "iframe not found" | Timing issue | Attendre 2 secondes et recharger |
| Cross-origin error | URL externe | Vérifier src="/static/metronome/index.html" |
| Bouton s'allume sur Space | Focus issue | Vérifier tabindex="-1" + auto-blur |

---

## ✅ Critères de Succès

Pour que le test soit réussi, **TOUS** les points suivants doivent être validés :

1. ✅ Tous les raccourcis fonctionnent sans clic préalable
2. ✅ Aucun bouton ne s'allume après un raccourci clavier
3. ✅ Les raccourcis fonctionnent après n'importe quelle interaction
4. ✅ Les inputs/textareas ignorent les raccourcis
5. ✅ Aucune erreur dans la console
6. ✅ Les logs confirment les appels directs (pas de postMessage)

---

## 📝 Rapport de Test

**Date:** _______________  
**Testeur:** _______________  
**Résultat Global:** ⬜ PASS / ⬜ FAIL  

**Commentaires:**
_______________________________________________
_______________________________________________
_______________________________________________
