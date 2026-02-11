# 🔍 DEBUG : TESTS À FAIRE POUR IDENTIFIER LE PROBLÈME

## 🎯 OBJECTIF

Identifier POURQUOI ArrowLeft (TAP) fonctionne mais pas les autres raccourcis (SPACE, +, -, ↑, ↓) quand une modale est ouverte.

---

## 📋 PROCÉDURE DE TEST

### **1. Ouvrir SHRED UP avec Console**
- URL : https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai
- **Hard refresh** : Ctrl+Shift+R (important !)
- **Ouvrir Console** : F12 → Console

---

### **2. Test SANS modale (baseline)**

**Actions** :
1. Appuyer **SPACE**
2. Appuyer **ArrowLeft**
3. Appuyer **+**
4. Appuyer **-**
5. Appuyer **↑**
6. Appuyer **↓**

**Logs attendus dans Console** :
```
[PROXY DEBUG] Keydown captured: Space target: BODY
[PROXY] ⌨️ SPACE → TOGGLE_PLAY
[PROXY DEBUG] Preventing default for Space
[PROXY DEBUG] ✅ Sending postMessage: TOGGLE_PLAY

[PROXY DEBUG] Keydown captured: ArrowLeft target: BODY
[PROXY] ⌨️ ArrowLeft → TAP_CLICK
[PROXY DEBUG] Preventing default for ArrowLeft
[PROXY DEBUG] ✅ Sending postMessage: TAP_CLICK

[PROXY DEBUG] Keydown captured: Equal target: BODY
[PROXY] ⌨️ + → BPM_UP
[PROXY DEBUG] Preventing default for Equal
[PROXY DEBUG] ✅ Sending postMessage: BPM_UP
```

**Résultat attendu** : ✅ Tous les raccourcis fonctionnent

---

### **3. Test AVEC modale BEAT ouverte, HORS input**

**Actions** :
1. Cliquer **BEAT** dans le métronome
2. Modale s'ouvre
3. Cliquer **en dehors** des inputs (sur le fond de la modale)
4. Appuyer **SPACE**
5. Appuyer **ArrowLeft**
6. Appuyer **+**

**Logs attendus** :
```
[PROXY DEBUG] Keydown captured: Space target: ???
[PROXY] ⌨️ SPACE → TOGGLE_PLAY
[PROXY DEBUG] Preventing default for Space
[PROXY DEBUG] ✅ Sending postMessage: TOGGLE_PLAY
```

**Questions à répondre** :
- ❓ **Les logs `[PROXY DEBUG]` apparaissent-ils ?**
  - Si OUI → Le proxy capture bien les événements
  - Si NON → Les événements ne parviennent PAS au proxy
- ❓ **Quelle est la valeur de `target:` ?**
  - BODY ? DIV ? INPUT ? IFRAME ?
- ❓ **Le postMessage est-il envoyé ?**

---

### **4. Test AVEC modale BEAT ouverte, DANS input**

**Actions** :
1. Cliquer **BEAT** dans le métronome
2. Cliquer **DANS** un input numérique
3. Appuyer **SPACE**
4. Appuyer **ArrowLeft**
5. Appuyer **+**
6. Appuyer **↑**

**Logs attendus** :
```
[PROXY DEBUG] Keydown captured: Space target: INPUT
[PROXY] ⌨️ SPACE → TOGGLE_PLAY
[PROXY DEBUG] Preventing default for Space
[PROXY DEBUG] ✅ Sending postMessage: TOGGLE_PLAY

[PROXY DEBUG] Keydown captured: ArrowLeft target: INPUT
[PROXY] ⌨️ ArrowLeft → TAP_CLICK
[PROXY DEBUG] Preventing default for ArrowLeft
[PROXY DEBUG] ✅ Sending postMessage: TAP_CLICK

[PROXY DEBUG] Keydown captured: Equal target: INPUT
[PROXY] ⌨️ + → BPM_UP
[PROXY DEBUG] Preventing default for Equal
[PROXY DEBUG] ✅ Sending postMessage: BPM_UP

[PROXY DEBUG] Keydown captured: ArrowUp target: INPUT
[PROXY] ⌨️ Arrow (passthrough) → BPM_UP
[PROXY DEBUG] ⚠️ NO preventing default for ArrowUp
[PROXY DEBUG] ✅ Sending postMessage: BPM_UP
```

**Questions CRITIQUES** :
- ❓ **ArrowLeft montre-t-il `target: INPUT` ?**
- ❓ **Les autres touches montrent-elles `target: INPUT` ?**
- ❓ **Si ArrowLeft fonctionne mais pas les autres, quelle est la DIFFÉRENCE dans les logs ?**

---

## 🎯 HYPOTHÈSES À VÉRIFIER

### **Hypothèse 1 : Les événements ne parviennent PAS au proxy**
- **Si** : Aucun log `[PROXY DEBUG]` n'apparaît pour SPACE/+/-
- **Alors** : Le proxy ne capture pas les événements → Problème de focus/capture

### **Hypothèse 2 : Les événements sont capturés mais pas envoyés**
- **Si** : Logs `[PROXY DEBUG] Keydown captured` apparaissent mais pas `[PROXY DEBUG] ✅ Sending postMessage`
- **Alors** : Le code ne génère pas l'action → Problème de switch/case

### **Hypothèse 3 : Les événements sont envoyés mais le métronome ne les reçoit pas**
- **Si** : Logs `[PROXY DEBUG] ✅ Sending postMessage` apparaissent mais rien ne se passe
- **Alors** : Le métronome ne reçoit pas le message → Problème de postMessage

### **Hypothèse 4 : ArrowLeft a un traitement spécial**
- **Si** : Les logs d'ArrowLeft sont DIFFÉRENTS des autres
- **Alors** : Il y a une différence de code/comportement entre ArrowLeft et les autres

---

## 📝 INFORMATIONS À COLLECTER

**Pour CHAQUE touche testée, noter** :

| Touche | Logs visibles ? | target: | postMessage envoyé ? | Fonctionne ? |
|--------|-----------------|---------|---------------------|--------------|
| SPACE | ❓ OUI/NON | ❓ | ❓ OUI/NON | ❓ OUI/NON |
| ArrowLeft | ❓ OUI/NON | ❓ | ❓ OUI/NON | ❓ OUI/NON |
| + | ❓ OUI/NON | ❓ | ❓ OUI/NON | ❓ OUI/NON |
| - | ❓ OUI/NON | ❓ | ❓ OUI/NON | ❓ OUI/NON |
| ↑ | ❓ OUI/NON | ❓ | ❓ OUI/NON | ❓ OUI/NON |
| ↓ | ❓ OUI/NON | ❓ | ❓ OUI/NON | ❓ OUI/NON |

---

## 🔥 CE QUI VA NOUS DIRE OÙ EST LE PROBLÈME

1. **Si ArrowLeft montre `target: BODY` et les autres `target: INPUT`**
   → Le problème est que les autres touches sont consommées par l'input avant d'arriver au proxy

2. **Si TOUS montrent le même `target:` mais seul ArrowLeft fonctionne**
   → Le problème est dans le handler du métronome ou dans le postMessage

3. **Si AUCUN log n'apparaît sauf ArrowLeft**
   → ArrowLeft a un listener différent (peut-être dans app.js ?)

4. **Si les logs apparaissent mais pas le postMessage**
   → Problème dans notre switch/case

---

## 🌐 URL DE TEST

**SHRED UP** : https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai

---

## 📌 PROCHAINES ÉTAPES

Après avoir collecté ces informations, on saura EXACTEMENT où est le problème et on pourra le corriger de manière ciblée !

**FAIS MAINTENANT CE TEST ET COPIE-MOI TOUS LES LOGS DE LA CONSOLE ! 🔍✅**
