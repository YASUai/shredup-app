# 🧪 TEST DIRECT MÉTRONOME vs SHRED UP

## 🎯 HYPOTHÈSE

Le code du métronome est PARFAIT, mais :
- Soit **cache navigateur** sert l'ancien code
- Soit le problème est dans **SHRED UP** (postMessage)

---

## 🧪 TEST 1 : DIRECT SUR MÉTRONOME (sans SHRED UP)

**URL** : https://7777-iopksqtiphh7vk63ml8pt-c07dda5e.sandbox.novita.ai/

**ÉTAPES** :
1. **Vider le cache** : Ctrl+Shift+R (hard refresh)
2. Ouvrir Console (F12)
3. Cliquer **bouton TAP** directement (pas AltGr)
4. Observer les logs

**LOGS ATTENDUS** :
```
[AUDIO] AudioContext suspendu, reprise en cours...
✅ AudioContext resumed, état: running
[AUDIO] clickSound absent, rechargement...
✅ clickSound chargé avec succès
[AUDIO] UI Click joué avec succès
[TAP DEBUG] Fonction appelée, tapTimes avant: 0
[TAP DEBUG] tapTimes après ajout: 1
[TAP TEMPO] Premier tap enregistré
```

**RÉSULTAT** :
- ✅ Si logs OK + son audible → **MÉTRONOME MARCHE** → Problème dans SHRED UP
- ❌ Si pas de logs/son → **CACHE NAVIGATEUR** → Faire un force refresh

---

## 🧪 TEST 2 : VÉRIFIER LE CACHE

Si le test 1 échoue, vérifier que le script est bien rechargé :

**Console** :
```javascript
// Coller dans la console du métronome
console.log('Test cache:', typeof handleTapLogic, typeof playUIClick)
```

**ATTENDU** :
```
Test cache: function function
```

Si `undefined`, le script n'est pas chargé correctement.

---

## 🧪 TEST 3 : SHRED UP - AltGr

**URL** : https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai

**ÉTAPES** :
1. Vider le cache : Ctrl+Shift+R
2. Console (F12)
3. AltGr ×4
4. Observer les logs

**LOGS ATTENDUS dans console MÉTRONOME** :
```
🎯 TAP click triggered via AltGr (postMessage)
[AUDIO] AudioContext suspendu, reprise en cours...
✅ AudioContext resumed, état: running
[AUDIO] clickSound absent, rechargement...
✅ clickSound chargé avec succès
[AUDIO] UI Click joué avec succès
[TAP TEMPO] Premier tap enregistré
```

**RÉSULTAT** :
- ✅ Si logs OK → **TOUT MARCHE**
- ❌ Si pas de logs → **postMessage ne passe pas** → Problème SHRED UP

---

## 🧪 TEST 4 : VÉRIFIER postMessage dans SHRED UP

Si test 3 échoue, vérifier que SHRED UP envoie bien le message :

**Console SHRED UP** :
```javascript
// Trouver l'iframe
const iframe = document.querySelector('.metronome-iframe')
console.log('Iframe:', iframe)
console.log('contentWindow:', iframe?.contentWindow)

// Tester postMessage
iframe.contentWindow.postMessage({ action: 'TAP_CLICK' }, '*')
```

**ATTENDU** :
- Iframe trouvée ✅
- contentWindow existe ✅
- Log dans console métronome : `🎯 TAP click triggered via AltGr (postMessage)`

---

## 📊 DIAGNOSTIC

| Test | Résultat | Signification |
|------|----------|---------------|
| Test 1 ✅ | Son au clic TAP direct | Métronome marche, problème dans SHRED UP |
| Test 1 ❌ | Pas de son | Cache navigateur OU code pas déployé |
| Test 3 ✅ | Son avec AltGr | TOUT MARCHE ! |
| Test 3 ❌ | Pas de son | postMessage bloqué |

---

## 🎯 PROCHAINES ÉTAPES

**Si Test 1 ÉCHOUE** :
1. Hard refresh (Ctrl+Shift+R)
2. Vider cache navigateur complètement
3. Vérifier que pm2 a bien redémarré le métronome

**Si Test 1 MARCHE mais Test 3 ÉCHOUE** :
1. Vérifier code SHRED UP (app.js)
2. Vérifier que l'iframe charge bien le métronome
3. Vérifier postMessage

---

## 🔗 URLS

- **Métronome** : https://7777-iopksqtiphh7vk63ml8pt-c07dda5e.sandbox.novita.ai/
- **SHRED UP** : https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai

---

## ✅ ACTION IMMÉDIATE

**FAIS LE TEST 1 MAINTENANT** :
1. Ouvrir métronome
2. Ctrl+Shift+R (hard refresh)
3. Console (F12)
4. Cliquer TAP directement
5. **RAPPORTER LES LOGS + SI SON AUDIBLE**

C'est le test le plus important pour savoir où est le problème ! 🎯
