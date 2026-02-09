# 🔧 FIX RACCOURCIS CLAVIER - CONFLITS À RÉSOUDRE

## ❌ PROBLÈMES ACTUELS

1. **ESPACE active TAP** au lieu de PLAY/PAUSE
2. **PLUS/MINUS ne fonctionnent plus**
3. **Les raccourcis du métronome entrent en conflit avec ceux de SHRED UP**

---

## 🎯 RACCOURCIS ATTENDUS

| Touche | Action Attendue | Ce qui se passe actuellement |
|--------|-----------------|------------------------------|
| **ESPACE** | Play/Pause | ❌ Active TAP |
| **CTRL** | TAP tempo | ❌ ? |
| **+** ou **↑** | BPM +1 | ❌ Ne fonctionne plus |
| **−** ou **↓** | BPM -1 | ❌ Ne fonctionne plus |

---

## 🔍 DIAGNOSTIC

Le métronome a probablement ses **propres listeners clavier** qui capturent les touches avant que les messages postMessage n'arrivent.

**Recherche dans script.js :**

```bash
# Chercher les listeners de clavier dans le métronome
grep -n "addEventListener.*keydown\|addEventListener.*keyup\|addEventListener.*keypress" script.js
```

Si tu trouves des listeners clavier, il faut **les désactiver** ou **les modifier** pour qu'ils n'interfèrent pas.

---

## ✅ SOLUTION 1 : DÉSACTIVER LES RACCOURCIS NATIFS DU MÉTRONOME

Si le métronome a déjà des raccourcis clavier définis, commente-les ou supprime-les :

```javascript
// CHERCHE CE GENRE DE CODE ET COMMENTE-LE :

// document.addEventListener('keydown', (e) => {
//     if (e.code === 'Space') {
//         // quelque chose
//     }
// })

// OU

// window.addEventListener('keypress', (e) => {
//     // ...
// })
```

---

## ✅ SOLUTION 2 : VÉRIFIER QUE LE LISTENER POSTMESSAGE EST BON

Le listener postMessage doit être exactement comme ceci :

```javascript
window.addEventListener('message', (event) => {
    const { action, bpm: newBpm } = event.data;
    
    console.log('📨 Message received from parent:', event.data);
    
    switch (action) {
        case 'TOGGLE_PLAY':
            // IMPORTANT : Doit déclencher PLAY/PAUSE, pas TAP
            const playBtn = document.querySelector('.play-btn');
            if (playBtn) {
                playBtn.click();
                console.log('▶️ Play/Pause toggled via SPACE');
            }
            break;
            
        case 'SET_BPM':
            // Pour CTRL (TAP tempo)
            if (newBpm && typeof newBpm === 'number') {
                bpm = Math.max(MIN_BPM, Math.min(MAX_BPM, newBpm));
                updateBPMDisplay(bpm);
                const percentage = bpmToSliderPosition(bpm);
                updateVerticalSliderPosition(percentage);
                
                if (isPlaying) {
                    restartMetronome();
                }
                
                console.log(`🎯 BPM set to ${bpm} via TAP (CTRL)`);
            }
            break;
            
        case 'BPM_UP':
            // Pour + ou ↑
            const plusBtn = document.querySelector('.plus-btn');
            if (plusBtn) {
                playUIClick();
                plusBtn.classList.add('clicking');
                setTimeout(() => plusBtn.classList.remove('clicking'), 150);
                
                if (bpm < MAX_BPM) {
                    bpm++;
                    updateBPMDisplay(bpm);
                    const percentage = bpmToSliderPosition(bpm);
                    updateVerticalSliderPosition(percentage);
                    
                    if (isPlaying) {
                        restartMetronome();
                    }
                    
                    console.log(`⬆️ BPM increased to ${bpm} via + key`);
                }
            }
            break;
            
        case 'BPM_DOWN':
            // Pour − ou ↓
            const minusBtn = document.querySelector('.minus-btn');
            if (minusBtn) {
                playUIClick();
                minusBtn.classList.add('clicking');
                setTimeout(() => minusBtn.classList.remove('clicking'), 150);
                
                if (bpm > MIN_BPM) {
                    bpm--;
                    updateBPMDisplay(bpm);
                    const percentage = bpmToSliderPosition(bpm);
                    updateVerticalSliderPosition(percentage);
                    
                    if (isPlaying) {
                        restartMetronome();
                    }
                    
                    console.log(`⬇️ BPM decreased to ${bpm} via - key`);
                }
            }
            break;
    }
});
```

---

## ✅ SOLUTION 3 : TESTER LES MESSAGES DANS LA CONSOLE

Ouvre la console du navigateur sur le métronome (F12) et teste manuellement :

```javascript
// Test ESPACE → PLAY/PAUSE
window.postMessage({ action: 'TOGGLE_PLAY' }, '*')

// Test CTRL → TAP (exemple 120 BPM)
window.postMessage({ action: 'SET_BPM', bpm: 120 }, '*')

// Test + → BPM +1
window.postMessage({ action: 'BPM_UP' }, '*')

// Test − → BPM -1
window.postMessage({ action: 'BPM_DOWN' }, '*')
```

Si ces commandes fonctionnent dans la console, alors le problème vient bien d'un conflit avec les listeners clavier natifs.

---

## 🔧 ACTIONS À FAIRE

1. **Cherche les listeners clavier existants** dans script.js
2. **Commente ou supprime** ces listeners
3. **Teste** les commandes postMessage dans la console
4. **Vérifie** que TOGGLE_PLAY déclenche bien PLAY et non TAP
5. **Commit** et **redémarre** le serveur

```bash
git add script.js
git commit -m "fix: remove keyboard conflicts, ensure postMessage controls work

- Disabled native keyboard listeners
- SPACE now toggles PLAY (not TAP)
- CTRL triggers TAP tempo
- +/- adjust BPM correctly"

git push origin main
pm2 restart metronome
```

---

## 📋 CHECKLIST DE VÉRIFICATION

Une fois fait, reviens dans SHRED UP et teste :

- [ ] ESPACE → Play/Pause métronome
- [ ] CTRL ×4 → TAP tempo (calcule BPM)
- [ ] + → BPM augmente de 1
- [ ] − → BPM diminue de 1
- [ ] Console montre les bons logs

---

**Une fois corrigé, reviens dans l'autre discussion SHRED UP et confirme !** 🔧✅
