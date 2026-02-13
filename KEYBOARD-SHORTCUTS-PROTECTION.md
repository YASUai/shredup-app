# 🔒 Protection des Raccourcis Clavier - Architecture

## 🎯 Objectif

**GARANTIR que les raccourcis clavier fonctionnent TOUJOURS, peu importe les interactions souris précédentes.**

---

## ⚠️ Problème Identifié

Après avoir cliqué sur un bouton (PLAY, BPM+, TAP, etc.) :
1. **Le bouton garde le focus** (état `:focus` CSS)
2. **Les événements clavier vont au bouton** (pas au document)
3. **La touche Space déclenche le clic du bouton** (comportement natif du navigateur)
4. **Les raccourcis ne fonctionnent plus**

---

## ✅ Solution : Protection 3 Couches

### **Couche 1 : Prévention du Focus**
```javascript
btn.setAttribute('tabindex', '-1');
```
- Empêche le focus via la touche Tab
- Les boutons ne sont plus "focusables" au clavier

### **Couche 2 : Blur Immédiat**
```javascript
btn.addEventListener('mousedown', (e) => {
    e.target.blur();  // Synchrone, pas de setTimeout
}, true);  // useCapture = true
```
- Détecte le `mousedown` (avant le `click`)
- Appelle `blur()` immédiatement (synchrone)
- `useCapture` garantit l'exécution avant les autres handlers

### **Couche 3 : Restauration du Focus**
```javascript
setTimeout(() => {
    document.body.focus();
}, 0);
```
- Restaure le focus sur le `<body>`
- `body` rendu focusable avec `tabindex="-1"`
- Garantit que `document` reçoit les événements clavier

---

## 🎮 Gestion Spéciale : INPUT

Les champs de saisie (édition BPM) doivent rester fonctionnels :

```javascript
input.addEventListener('blur', () => {
    setTimeout(() => {
        // Restaurer focus seulement si aucun autre input n'est actif
        if (document.activeElement === document.body || 
            document.activeElement === null) {
            document.body.focus();
        }
    }, 0);
});
```

**Comportement :**
- ✅ Pendant la saisie : INPUT garde le focus
- ✅ Après validation/annulation : Focus restauré sur body
- ✅ Raccourcis ne fonctionnent PAS pendant la saisie (normal)
- ✅ Raccourcis fonctionnent immédiatement après

---

## 🔍 Focus Initial

```javascript
// Au chargement de la page
document.body.focus();
```

Garantit que les raccourcis fonctionnent **dès le chargement**, sans clic préalable.

---

## 📊 Scénarios de Test

| Scénario | État Avant | État Après | Raccourci |
|----------|-----------|------------|-----------|
| **Clic PLAY** | Focus sur PLAY | Focus sur body | ✅ Fonctionne |
| **Clic BPM+** | Focus sur BPM+ | Focus sur body | ✅ Fonctionne |
| **Clic TAP** | Focus sur TAP | Focus sur body | ✅ Fonctionne |
| **Édition BPM (en cours)** | Focus sur INPUT | INPUT garde focus | ❌ Désactivé (normal) |
| **Édition BPM (validé)** | INPUT removed | Focus sur body | ✅ Fonctionne |
| **Page load** | Aucun focus | Focus sur body | ✅ Fonctionne |

---

## 🧪 Tests de Validation

### Test 1 : Après clic PLAY
```
1. Cliquer sur PLAY
2. Appuyer sur Space
Attendu : Métronome s'arrête (pas de double-clic PLAY)
```

### Test 2 : Après clic BPM+
```
1. Cliquer sur BPM+
2. Appuyer sur +
Attendu : BPM augmente encore (pas de clic BPM+)
```

### Test 3 : Après édition BPM
```
1. Cliquer sur le BPM (128)
2. Taper "140" puis Enter
3. Appuyer sur Space
Attendu : PLAY/STOP toggle (pas d'espace dans l'input)
```

### Test 4 : Sans interaction
```
1. Charger la page
2. Appuyer immédiatement sur Space
Attendu : PLAY démarre
```

### Test 5 : Alternance rapide
```
1. Cliquer sur PLAY
2. Appuyer sur +
3. Appuyer sur Space
4. Appuyer sur ArrowLeft
Attendu : Toutes les actions s'exécutent correctement
```

---

## 📝 Code Implémenté

**Fichier :** `public/static/metronome/script.js`

**Lignes :** ~800-860

**Log console :**
```
🔒 Keyboard shortcuts protection enabled:
  ✅ All buttons: tabindex="-1"
  ✅ Auto-blur on mousedown
  ✅ Focus restored to body
  ✅ Inputs handled separately
```

---

## ✅ Garanties

1. ✅ **Raccourcis TOUJOURS fonctionnels** après n'importe quel clic souris
2. ✅ **Pas d'interférence** entre clics souris et raccourcis clavier
3. ✅ **Inputs restent fonctionnels** (saisie non perturbée)
4. ✅ **Focus géré automatiquement** (pas de gestion manuelle requise)
5. ✅ **Comportement prévisible** (toujours le même, peu importe l'historique)

---

## 🚀 Prêt pour l'Implémentation

Avec cette protection en place, nous pouvons maintenant implémenter les raccourcis clavier en toute confiance :

- Les raccourcis fonctionneront **toujours**
- Aucun conflit souris-clavier possible
- Architecture robuste et maintenable
- Tests simples et reproductibles

**Prochaine étape :** Implémentation des raccourcis clavier dans le métronome.
