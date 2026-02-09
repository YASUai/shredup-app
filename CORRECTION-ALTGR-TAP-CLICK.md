# 🚨 CORRECTION URGENTE - AltGr TAP_CLICK

**À appliquer dans**: Discussion Métronome Port 7777

---

## 🎯 PROBLÈME IDENTIFIÉ

**AltGr depuis SHRED UP ne produit pas de son** parce que :
1. SHRED UP envoie maintenant `{ action: 'TAP_CLICK' }` au lieu de `SET_BPM`
2. Le métronome n'a **pas** de case `TAP_CLICK` dans le postMessage handler

---

## 🔧 SOLUTION

Ajouter un nouveau case `TAP_CLICK` qui **simule un clic sur le bouton TAP**.

### **Dans script.js (ligne ~1718, après case 'TOGGLE_PLAY')**:

```javascript
window.addEventListener('message', (event) => {
    const { action, bpm: newBpm } = event.data;
    
    console.log('📨 Message received from parent:', event.data);
    
    switch (action) {
        case 'TOGGLE_PLAY':
            const playBtn = document.querySelector('.play-btn');
            if (playBtn) {
                playBtn.click();
            }
            break;
            
        // ✅ NOUVEAU: Simuler un clic TAP depuis AltGr
        case 'TAP_CLICK':
            const tapBtn = document.querySelector('.tap-btn');
            if (tapBtn) {
                console.log('🎯 TAP click triggered via AltGr (postMessage)');
                
                // Simuler un clic mousedown sur le bouton TAP
                // Cela déclenche playUIClick() + handleTapLogic() avec le son
                const event = new MouseEvent('mousedown', {
                    bubbles: true,
                    cancelable: true,
                    view: window
                });
                tapBtn.dispatchEvent(event);
            }
            break;
            
        case 'SET_BPM':
            // ... reste du code existant
```

---

## 📊 POURQUOI CETTE SOLUTION

### **Avant** ❌
```javascript
// SHRED UP
case 'AltRight':
  // Calcul BPM dans SHRED UP
  iframe.postMessage({ action: 'SET_BPM', bpm }, '*')

// Métronome
case 'SET_BPM':
  window.handleTapTempo()  // ← Pas de playUIClick() = PAS DE SON
```

### **Après** ✅
```javascript
// SHRED UP
case 'AltRight':
  // Simuler un clic TAP
  iframe.postMessage({ action: 'TAP_CLICK' }, '*')

// Métronome
case 'TAP_CLICK':
  tapBtn.dispatchEvent(new MouseEvent('mousedown'))  // ← Déclenche playUIClick() = SON AUDIBLE
```

---

## ✅ RÉSULTAT ATTENDU

**Après cette correction** :
1. Appuyer AltGr depuis SHRED UP
2. SHRED UP envoie `{ action: 'TAP_CLICK' }`
3. Métronome simule un clic mousedown sur le bouton TAP
4. Le handler `handleTapClick` s'exécute :
   - `await playUIClick()` → **SON AUDIBLE** ✅
   - `handleTapLogic()` → Calcul BPM
   - Flash blanc visible
5. BPM calculé et mis à jour

---

## 🧪 TEST APRÈS CORRECTION

```
1. Appliquer le code ci-dessus dans script.js
2. pm2 restart metronome
3. Ouvrir SHRED UP: https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai
4. F12 (console)
5. Appuyer AltGr 4 fois

✅ RÉSULTAT ATTENDU:
   - Console SHRED UP: ⌨️ AltGr → Simulate TAP button click
   - Console Métronome: 🎯 TAP click triggered via AltGr
   - Console Métronome: [TAP DEBUG] Event déclenché: mousedown
   - Console Métronome: [AUDIO] UI Click joué avec succès
   - 🔊 SON AUDIBLE à chaque pression AltGr
   - ⚪ Flash blanc visible
   - BPM calculé après 2 pressions
```

---

## 📝 COMMIT

```bash
# Après avoir ajouté le case TAP_CLICK
git add script.js
git commit -m "feat: add TAP_CLICK postMessage handler for AltGr keyboard shortcut

PROBLÈME:
- AltGr depuis SHRED UP ne produisait pas de son
- SET_BPM appelait handleTapTempo() sans playUIClick()

SOLUTION:
- Nouveau case TAP_CLICK dans postMessage handler
- Simule un clic mousedown sur le bouton TAP
- Déclenche playUIClick() + handleTapLogic() avec son

RÉSULTAT:
- AltGr produit maintenant un son audible
- Calcul BPM fonctionnel
- Flash blanc visible"

pm2 restart metronome
```

---

## 🎯 RÉSUMÉ

**Action** : Ajouter `case 'TAP_CLICK'` dans le postMessage handler du métronome

**Ligne** : ~1718 (après `case 'TOGGLE_PLAY'`)

**Code** :
```javascript
case 'TAP_CLICK':
    const tapBtn = document.querySelector('.tap-btn');
    if (tapBtn) {
        console.log('🎯 TAP click triggered via AltGr (postMessage)');
        const event = new MouseEvent('mousedown', {
            bubbles: true,
            cancelable: true,
            view: window
        });
        tapBtn.dispatchEvent(event);
    }
    break;
```

**Résultat** : AltGr → SON AUDIBLE + BPM calculé ✅

---

**Une fois appliqué, revenir dans SHRED UP pour rebuild et tester !**
