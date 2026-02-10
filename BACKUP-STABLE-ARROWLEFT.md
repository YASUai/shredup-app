# ✅ SHRED UP v1.1 - État Stable ArrowLeft

## 🎯 BACKUP CRÉÉ AVEC SUCCÈS

**Date** : 2026-02-10  
**Commit** : a8fb921  
**Tag** : v1.1-arrowleft-stable  
**Build** : 53.58 kB  

---

## 📦 BACKUP

**URL de téléchargement** : https://www.genspark.ai/api/files/s/tTjgnyOP  
**Taille** : 2.90 MB (archive tar.gz)  
**Contenu** : Projet complet avec git history

---

## ⌨️ RACCOURCIS CLAVIER FONCTIONNELS

| Touche | Action | Status |
|--------|--------|--------|
| **ESPACE** | Play/Stop | ✅ Fonctionne |
| **⬅️ ArrowLeft** | TAP Tempo | ✅ Fonctionne |
| **+ / ↑** | BPM +1 | ✅ Fonctionne |
| **- / ↓** | BPM -1 | ✅ Fonctionne |
| *** (pavé numérique)** | Toggle REC | ✅ Fonctionne |

---

## 🔗 URLS

- **SHRED UP** : https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai
- **Métronome** : https://7777-iopksqtiphh7vk63ml8pt-c07dda5e.sandbox.novita.ai/

---

## 📊 ARCHITECTURE

```
SHRED UP (Port 3000)
  ├─ public/static/app.js ← Raccourcis clavier
  ├─ src/index.tsx ← Routes + Proxy iframe
  └─ /metronome-scaled ← Proxy iframe
      └─ iframe → Métronome Port 7777
```

---

## 🔧 FICHIERS CLÉS

### **app.js - Raccourcis clavier**
```javascript
case 'Space': → TOGGLE_PLAY
case 'ArrowLeft': → TAP_CLICK
case 'Equal'|'ArrowUp': → BPM_UP
case 'Minus'|'ArrowDown': → BPM_DOWN
case 'NumpadMultiply': → Toggle REC
```

### **index.tsx - Proxy iframe**
```javascript
/metronome-scaled → Proxy qui forward postMessage
  └─ iframe src="https://7777-..."
```

---

## 📝 NOTES

### **Pourquoi ArrowLeft fonctionne**
- ArrowLeft est une **touche normale** reconnue comme "geste utilisateur"
- Peut activer AudioContext du navigateur
- Pas comme AltGr qui est une touche modificatrice

### **Légère latence au premier TAP**
- Normal : clickSound se charge au premier appel
- Latence : ~50-100ms
- TAP suivants : instantanés

---

## 🚀 POUR RESTAURER CE BACKUP

1. **Télécharger** : https://www.genspark.ai/api/files/s/tTjgnyOP
2. **Extraire** : `tar -xzf shredup-v1.1-arrowleft-stable.tar.gz`
3. **Installer** : `cd webapp && npm install`
4. **Build** : `npm run build`
5. **Déployer** : `npm run deploy` ou `pm2 start ecosystem.config.cjs`

---

## 📋 HISTORIQUE DES CHANGEMENTS

### **Fonctionnels**
- ✅ Passage de AltGr à ArrowLeft pour TAP
- ✅ Correction du proxy postMessage (listeners unifiés)
- ✅ TAP_CLICK fonctionnel

### **Tentatives abandonnées (causaient bugs)**
- ❌ Préchargement PRELOAD_AUDIO
- ❌ Changement vers Backspace
- ❌ Modifications des listeners d'iframe load

---

## ✅ VALIDATION

**Tous les tests passent** :
- ✅ ESPACE → Play/Stop
- ✅ ArrowLeft ×4 → Calcul BPM
- ✅ +/- → BPM change
- ✅ * → REC toggle

---

## 🎉 CONCLUSION

**État stable et production-ready !**

- Tous les raccourcis fonctionnent
- Code simple et maintenable
- Backup créé pour restauration rapide
- Tag git pour référence future

**NE PAS MODIFIER** sans créer une branche de test d'abord !
