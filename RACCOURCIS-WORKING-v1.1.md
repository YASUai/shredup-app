# 🎹 SHRED UP - Raccourcis Clavier v1.1 - VERSION STABLE

**Date**: 2026-02-09  
**Tag**: v1.1-raccourcis-working  
**Branch**: main  
**Status**: ✅ TOUS LES RACCOURCIS FONCTIONNENT

---

## ✅ RACCOURCIS CLAVIER OPÉRATIONNELS

| Touche | Action | Status |
|--------|--------|--------|
| **ESPACE** | Play/Stop métronome | ✅ Fonctionnel |
| **CTRL** (gauche/droite) | TAP Tempo (moyenne 4 taps) | ✅ Fonctionnel |
| **+** ou **↑** | BPM +1 | ✅ Fonctionnel |
| **−** ou **↓** | BPM -1 | ✅ Fonctionnel |
| **\*** (Numpad) | Toggle REC (premier exercice) | ✅ Fonctionnel |

---

## 🏗️ ARCHITECTURE

```
SHRED UP (port 3000)
  │
  ├── public/static/app.js
  │   └── initializeKeyboardShortcuts()
  │       └── Capture clavier + envoi postMessage
  │
  └── src/index.tsx
      └── iframe métronome
          └── https://7777-iopksqtiphh7vk63ml8pt-c07dda5e.sandbox.novita.ai/
              └── script.js
                  └── Listener postMessage
                      └── Exécution actions (startMetronome, stopMetronome, etc.)
```

---

## 🎵 MÉTRONOME INTÉGRÉ

**URL**: `https://7777-iopksqtiphh7vk63ml8pt-c07dda5e.sandbox.novita.ai/`

**Version**: CSS 20260205-19

**PostMessage Listener**: ✅ Actif

**Actions supportées**:
- `TOGGLE_PLAY` → Start/Stop métronome + classe `.active`
- `SET_BPM` → Change le BPM (TAP tempo)
- `BPM_UP` → Augmente BPM de 1
- `BPM_DOWN` → Diminue BPM de 1

---

## 📝 DÉTAILS TECHNIQUES

### TAP Tempo
- **Moyenne** : 4 derniers taps
- **Timeout** : 2 secondes entre les taps
- **Plage** : 20-250 BPM
- **Calcul** : `bpm = 60000 / avgInterval`

### Communication postMessage
```javascript
// SHRED UP envoie
iframe.postMessage({ action: 'TOGGLE_PLAY' }, '*')
iframe.postMessage({ action: 'SET_BPM', bpm: 120 }, '*')
iframe.postMessage({ action: 'BPM_UP' }, '*')
iframe.postMessage({ action: 'BPM_DOWN' }, '*')

// Métronome reçoit
window.addEventListener('message', (event) => {
    const { action, bpm } = event.data;
    // Exécute l'action correspondante
})
```

### Logs Console
- `⌨️ SPACE → Toggle Play/Stop` (SHRED UP)
- `📨 Message received from parent: {...}` (métronome)
- `▶️ Metronome started via keyboard shortcut` (métronome)
- `🎯 BPM set to XXX via TAP` (métronome)

---

## 📦 FICHIERS MODIFIÉS

### `/public/static/app.js`
- **Fonction** : `initializeKeyboardShortcuts()`
- **Lignes** : ~98 lignes ajoutées
- **Fonctionnalités** :
  - Capture événements clavier
  - TAP tempo (tracking 4 taps)
  - Envoi postMessage vers iframe
  - Désactivation dans input/textarea

### `/src/index.tsx`
- **Iframe** : URL mise à jour vers port 7777
- **Classe** : `.metronome-iframe`

---

## 🔄 RESTAURATION

### Option 1 : Via tag
```bash
git checkout v1.1-raccourcis-working
```

### Option 2 : Via branche
```bash
git checkout raccourcis-fonctionnels-backup
```

### Option 3 : Via commit
```bash
git checkout 542ca62
```

---

## 🚀 DÉPLOIEMENT

### Local (sandbox)
```bash
cd /home/user/webapp
npm run build
pm2 restart webapp
```

### Test
```bash
curl http://localhost:3000/static/app.js | grep -c "initializeKeyboardShortcuts"
# Devrait retourner: 2
```

---

## 📊 HISTORIQUE DES COMMITS

```
542ca62 - feat: add keyboard shortcuts in app.js
030fd40 - fix: update metronome iframe to NEW server with postMessage support
a5e234f - feat: update button colors and metronome border-radius
```

---

## 🎯 PROCHAINES AMÉLIORATIONS POSSIBLES

1. **Animations visuelles** : Ajouter feedback visuel sur boutons métronome
2. **Plus de raccourcis** : Volume, presets timer, etc.
3. **Configuration** : Permettre personnalisation des touches
4. **Accessibilité** : Labels ARIA pour les raccourcis

---

## ⚠️ NOTES IMPORTANTES

- ✅ **NE PAS MODIFIER** `public/static/app.js` sans backup
- ✅ **NE PAS CHANGER** l'URL de l'iframe métronome
- ✅ **TESTER** après chaque modification
- ✅ **COMMIT** régulièrement

---

**🔒 VERSION VERROUILLÉE - TOUS LES RACCOURCIS FONCTIONNENT**
