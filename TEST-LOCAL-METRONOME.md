# 🧪 TEST : INTÉGRATION MÉTRONOME LOCAL (Same-Origin)

**Date :** 2026-02-11  
**Branche :** `integrate-metronome`  
**Objectif :** Tester le métronome LOCAL intégré dans SHRED UP (same-origin) pour résoudre les problèmes de raccourcis clavier cross-origin

---

## 📋 **URLS DE TEST**

### **1. SHRED UP avec Métronome LOCAL (same-origin) 🧪**
**URL :** https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai/test-local

**À TESTER :**
- ✅ Apparence : Font Conthrax correcte ?
- ✅ Fonctionnement : Tous les boutons OK ?
- ✅ Raccourcis clavier :
  - `SPACE` : Play/Stop
  - `← ArrowLeft` : TAP Tempo
  - `+` ou `↑` : BPM +1
  - `-` ou `↓` : BPM -1
  - `*` (Pavé numérique) : Toggle REC
- ✅ Modales : BEAT/BAR/NOTE s'ouvrent ?
- ✅ Inputs : Fonctionnent dans les modales ?
- ✅ Après clic dans modale : Raccourcis fonctionnent TOUJOURS ?

---

### **2. COMPARAISON : Local vs External**
**URL :** https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai/metronome-compare

**À COMPARER :**
- Gauche : Métronome LOCAL (same-origin)
- Droite : Métronome EXTERNAL (port 7777, cross-origin)

---

### **3. SHRED UP ORIGINAL (Métronome EXTERNAL)**
**URL :** https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai/

**État :** Version STABLE actuelle avec métronome externe

---

## 🔍 **PROBLÈMES IDENTIFIÉS**

### ✅ **RÉSOLU : Font Conthrax manquante**
- **Cause :** Font `Conthrax-SemiBold.otf` non téléchargée
- **Solution :** Téléchargée depuis port 7777 et copiée dans `public/static/metronome/`
- **Statut :** ✅ Résolu

### ❌ **À RÉSOUDRE : Raccourcis clavier (sauf ArrowLeft)**
- **Problème :** Seul ArrowLeft fonctionne, les autres raccourcis ne marchent pas
- **Cause probable :** app.js envoie les postMessage à l'iframe `.metronome-iframe` qui cible `/metronome-scaled` (EXTERNAL), mais pas la version LOCAL
- **Solution à tester :** Vérifier si app.js cible bien l'iframe du métronome LOCAL dans `/test-local`

---

## 📂 **FICHIERS MODIFIÉS**

### **Nouveaux fichiers :**
- `public/static/metronome/` (tous les fichiers du métronome)
  - `index.html`
  - `script.js` (72 KB)
  - `styles.css` (36 KB)
  - `structure_fix_v6.js`
  - `ui-click.mp3`
  - `icon-192.svg`
  - `manifest.json`
  - `Conthrax-SemiBold.otf` (77 KB) ✅

### **Routes ajoutées (src/index.tsx) :**
- `/metronome-local` : Redirige vers `/static/metronome/index.html`
- `/test-local` : SHRED UP avec métronome LOCAL intégré
- `/metronome-compare` : Comparaison côte à côte

---

## 🎯 **PROCHAINES ÉTAPES**

1. **TESTER `/test-local`** et vérifier si TOUS les raccourcis fonctionnent
2. Si OK : Modifier SHRED UP principal pour utiliser métronome LOCAL
3. Supprimer le proxy `/metronome-scaled`
4. Tester complètement
5. Merger dans `main` si tout est OK

---

## 📊 **BUILD**

- **Taille :** 67.89 kB
- **Modules :** 50
- **Temps :** 921ms

---

## 🚨 **IMPORTANT**

⚠️ **Version STABLE préservée :**
- **Tag :** `v1.3-stable-before-integration`
- **Backup :** https://www.genspark.ai/api/files/s/luYI3wnh (3.00 MB)
- **Branche main :** INTACTE

Pour revenir en arrière :
```bash
git checkout main
npm run build
pm2 restart webapp
```

---

**TESTE MAINTENANT `/test-local` et confirme si les raccourcis fonctionnent ! 🚀**
