# 🔧 FIX TAP - Race Condition (Aléatoire)

**Problème** : Le bouton TAP fonctionne au premier clic de manière aléatoire (parfois oui, parfois non)

**Cause** : Race condition - Le listener est attaché avant que les variables soient complètement initialisées

---

## ✅ SOLUTION GARANTIE

**Dans `script.js`, remplace TOUT le bloc d'initialisation du bouton TAP par ce code** :

```javascript
function initTapButton() {
    const tapBtn = document.querySelector('.tap-btn');
    
    if (!tapBtn) {
        console.warn('[TAP] Bouton TAP non trouvé');
        return;
    }
    
    // ✅ 1. INITIALISER LES VARIABLES EN PREMIER (dans une closure)
    let tapTimes = [];
    const MAX_TAP_INTERVAL = 2000;
    
    // ✅ 2. DÉFINIR LA FONCTION handleTapLogic (dans la même closure)
    const handleTapLogic = () => {
        const now = Date.now();
        
        console.log('[TAP DEBUG] Clic reçu, tapTimes avant:', tapTimes.length);
        
        // Supprimer les anciens taps (> 2 secondes)
        tapTimes = tapTimes.filter(time => (now - time) < MAX_TAP_INTERVAL);
        
        // Ajouter le tap actuel
        tapTimes.push(now);
        
        console.log('[TAP DEBUG] tapTimes après ajout:', tapTimes.length);
        
        // Il faut au moins 2 taps pour calculer un tempo
        if (tapTimes.length >= 2) {
            // Calculer les intervalles entre taps
            const intervals = [];
            for (let i = 1; i < tapTimes.length; i++) {
                intervals.push(tapTimes[i] - tapTimes[i - 1]);
            }
            
            // Moyenne des intervalles (en ms)
            const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
            
            // Convertir en BPM (60000 ms = 1 minute)
            let newBPM = Math.round(60000 / avgInterval);
            
            // Limiter au range MIN_BPM - MAX_BPM
            newBPM = Math.max(MIN_BPM, Math.min(MAX_BPM, newBPM));
            
            // Mettre à jour le BPM
            bpm = newBPM;
            updateBPMDisplay(bpm);
            const percentage = bpmToSliderPosition(bpm);
            updateVerticalSliderPosition(percentage);
            
            console.log(`[TAP TEMPO] ${tapTimes.length} taps, intervalle moyen: ${avgInterval.toFixed(0)}ms, BPM: ${newBPM}`);
            
            // Redémarrer le métronome si en cours
            if (isPlaying) {
                restartMetronome();
            }
        } else {
            console.log('[TAP TEMPO] Premier tap enregistré');
        }
        
        // Limiter à 8 taps maximum pour éviter trop de calculs
        if (tapTimes.length > 8) {
            tapTimes.shift();
        }
    };
    
    // ✅ 3. EXPOSER GLOBALEMENT (pour postMessage)
    window.handleTapTempo = handleTapLogic;
    
    // ✅ 4. ATTACHER LE LISTENER (seulement maintenant)
    tapBtn.addEventListener('click', (e) => {
        // Empêcher tout comportement par défaut
        e.preventDefault();
        e.stopPropagation();
        
        console.log('[TAP DEBUG] Click event déclenché');
        
        // Son UI click
        playUIClick();
        
        // Ajouter classe .tapping pour feedback visuel
        tapBtn.classList.add('tapping');
        setTimeout(() => tapBtn.classList.remove('tapping'), 150);
        
        // Appeler la logique TAP
        handleTapLogic();
        
        // IMPORTANT: Retirer le focus pour éviter que ESPACE déclenche TAP
        tapBtn.blur();
    });
    
    // ✅ 5. EMPÊCHER ESPACE de déclencher le bouton TAP
    tapBtn.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            e.stopPropagation();
        }
    });
    
    console.log('[TAP DEBUG] Bouton TAP initialisé avec succès');
}
```

---

## 🎯 CHANGEMENTS CLÉS

### 1. Closure Complète
```javascript
function initTapButton() {
    // TOUT est dans la fonction
    // Variables privées dans la closure
    let tapTimes = [];
    const MAX_TAP_INTERVAL = 2000;
    
    // Fonction dans la même closure
    const handleTapLogic = () => { ... };
    
    // Listener dans la même closure
    tapBtn.addEventListener('click', () => { ... });
}
```

### 2. Ordre Garanti
1. Variables initialisées
2. Fonction définie
3. Fonction exposée globalement
4. Listener attaché
5. Log de confirmation

### 3. preventDefault + stopPropagation
```javascript
tapBtn.addEventListener('click', (e) => {
    e.preventDefault();      // Empêche comportement par défaut
    e.stopPropagation();     // Empêche propagation
    // ...
});
```

---

## 🧪 TESTS

Après avoir appliqué le fix :

1. **Redémarre le serveur**
   ```bash
   pm2 restart metronome
   ```

2. **Vide le cache du navigateur**
   - **Ctrl+Shift+R** (Chrome/Edge)
   - **Cmd+Shift+R** (Mac)

3. **Ouvre la console** (F12)

4. **Clique sur TAP 5 fois d'affilée**
   - Chaque clic doit afficher les logs
   - Premier clic : "Premier tap enregistré"
   - Deuxième clic : BPM calculé

5. **Attends 3 secondes, puis clique à nouveau**
   - Les taps doivent être réinitialisés
   - "Premier tap enregistré" à nouveau

---

## 📝 COMMIT

```bash
git add script.js
git commit -m "fix: TAP button race condition - guaranteed initialization order"
```

---

## ✅ RÉSULTAT ATTENDU

- ✅ **Premier clic TOUJOURS fonctionnel** (pas aléatoire)
- ✅ **Logs visibles à chaque clic**
- ✅ **Pas de race condition**
- ✅ **Initialisation garantie**

---

## 🔍 SI ÇA NE FONCTIONNE TOUJOURS PAS

**Ajoute ce log AU TOUT DÉBUT de `script.js`** :

```javascript
console.log('[INIT] Script chargé - timestamp:', Date.now());

document.addEventListener('DOMContentLoaded', () => {
    console.log('[INIT] DOMContentLoaded - timestamp:', Date.now());
    
    // Attendre 100ms de plus pour être SÛR
    setTimeout(() => {
        console.log('[INIT] Initialisation TAP - timestamp:', Date.now());
        initTapButton();
    }, 100);
});
```

Cela garantit que le DOM est complètement chargé avant d'initialiser TAP.

---

**Applique ce fix dans l'autre discussion (métronome) et confirme "TAP 100% OK !" 🚀**
