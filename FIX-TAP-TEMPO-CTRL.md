# 🔧 FIX URGENT - TAP TEMPO (CTRL) ET CONFLIT ESPACE

## ❌ PROBLÈMES IDENTIFIÉS

### Problème 1 : CTRL ne déclenche pas TAP
- **Symptôme** : Appuyer sur CTRL ne fait rien
- **Cause probable** : Le métronome ne trouve pas le bouton TAP ou la fonction n'est pas déclenchée

### Problème 2 : Après clic manuel sur TAP, ESPACE est capturé
- **Symptôme** : Cliquer sur TAP avec la souris → ESPACE ne fonctionne plus pour PLAY/PAUSE
- **Cause** : Le bouton TAP garde le focus et capture ESPACE

---

## ✅ SOLUTION IMMÉDIATE

### DANS L'AUTRE DISCUSSION (MÉTRONOME PORT 7777)

Copie-colle ce code pour **remplacer le case 'SET_BPM'** dans le listener postMessage :

```javascript
case 'SET_BPM':
    // Pour CTRL (TAP tempo)
    if (newBpm && typeof newBpm === 'number') {
        // OPTION 1 : Simuler un clic sur le bouton TAP
        const tapBtn = document.querySelector('.tap-btn');
        if (tapBtn) {
            playUIClick();
            tapBtn.classList.add('tapping');
            setTimeout(() => tapBtn.classList.remove('tapping'), 150);
            
            // Appeler directement la fonction TAP si elle existe
            if (typeof handleTap === 'function') {
                handleTap();
            } else {
                // Sinon, simuler un clic
                tapBtn.click();
            }
        }
        
        // OPTION 2 : Mettre à jour le BPM directement
        bpm = Math.max(MIN_BPM, Math.min(MAX_BPM, newBpm));
        updateBPMDisplay(bpm);
        
        const percentage = bpmToSliderPosition(bpm);
        updateVerticalSliderPosition(percentage);
        
        if (isPlaying) {
            restartMetronome();
        }
        
        console.log(`🎯 BPM set to ${bpm} via TAP tempo (CTRL)`);
    }
    break;
```

---

## 🔧 FIX POUR LE FOCUS DU BOUTON TAP

Ajoute ce code **juste après le listener du bouton TAP** :

```javascript
// Cherche le listener du bouton TAP
const tapBtn = document.querySelector('.tap-btn');

if (tapBtn) {
    tapBtn.addEventListener('click', () => {
        // Ton code TAP existant...
        
        // AJOUTE CETTE LIGNE À LA FIN :
        tapBtn.blur();  // Retire le focus immédiatement après le clic
    });
    
    // Ajoute aussi un listener pour empêcher ESPACE de déclencher TAP
    tapBtn.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();  // Empêche ESPACE de déclencher le bouton
            e.stopPropagation();  // Empêche la propagation
        }
    });
}
```

---

## 🔧 ALTERNATIVE : DÉSACTIVER COMPLÈTEMENT LE FOCUS SUR TAP

Ajoute ce CSS dans **styles.css** :

```css
/* Empêcher le focus sur le bouton TAP */
.tap-btn:focus {
    outline: none;
}

/* Désactiver l'activation par ESPACE quand TAP a le focus */
.tap-btn {
    pointer-events: auto;
}
```

Et ajoute cet attribut dans le **HTML du bouton TAP** :

```html
<button class="tap-btn" tabindex="-1">TAP</button>
```

Le `tabindex="-1"` empêche le bouton de recevoir le focus via la touche Tab.

---

## 🧪 TEST CONSOLE POUR TAP

Ouvre la console du métronome (F12) et teste :

```javascript
// Test 1 : Vérifier que le bouton TAP existe
console.log('TAP button:', document.querySelector('.tap-btn'));

// Test 2 : Tester le message SET_BPM
window.postMessage({ action: 'SET_BPM', bpm: 120 }, '*');

// Test 3 : Simuler un clic sur TAP
document.querySelector('.tap-btn')?.click();

// Test 4 : Vérifier si handleTap existe
console.log('handleTap function:', typeof handleTap);
```

---

## 📋 ORDRE D'APPLICATION

1. **Remplace le case 'SET_BPM'** dans le listener postMessage
2. **Ajoute tapBtn.blur()** après le clic sur TAP
3. **Ajoute le listener keydown** sur TAP pour bloquer ESPACE
4. **Teste** dans la console avec les commandes ci-dessus
5. **Commit et redémarre**

```bash
git add script.js styles.css index.html
git commit -m "fix: TAP tempo via CTRL + prevent SPACE capture by TAP button

- Added SET_BPM handler to call TAP function
- Added blur() after TAP click to remove focus
- Added keydown listener to prevent SPACE on TAP button
- tabindex=-1 to disable focus on TAP

CTRL now triggers TAP tempo
SPACE always triggers PLAY/PAUSE even after TAP click"

git push origin main
pm2 restart metronome
```

---

## 🎯 RÉSULTAT ATTENDU

Après application :
- ✅ **CTRL** → Déclenche TAP tempo (4 taps, calcule BPM)
- ✅ **ESPACE** → TOUJOURS Play/Pause (même après clic sur TAP)
- ✅ **+/−** → Continue de fonctionner
- ✅ Clic manuel sur TAP ne casse plus ESPACE

---

## 🔍 SI ÇA NE MARCHE TOUJOURS PAS

Vérifie dans la console :

```javascript
// Vérifier les listeners actifs
getEventListeners(document.querySelector('.tap-btn'))

// Vérifier quel élément a le focus
console.log('Focus:', document.activeElement)

// Après avoir appuyé sur CTRL, vérifie les logs
// Tu devrais voir : 📨 Message received from parent: {action: "SET_BPM", bpm: 120}
```

---

**Applique ces corrections dans l'autre discussion et reviens confirmer !** 🔧✅
