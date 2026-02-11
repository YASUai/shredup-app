# 🔧 BRANCHE : integrate-metronome

## ⚠️ BRANCHE EXPÉRIMENTALE - NE PAS UTILISER EN PRODUCTION

Cette branche est dédiée à **l'intégration du métronome** dans SHRED UP pour résoudre les problèmes de cross-origin.

---

## 🎯 OBJECTIF

**Intégrer le métronome (actuellement sur port 7777) directement dans SHRED UP (port 3000) en same-origin.**

### **Problème actuel** :
- Métronome sur port 7777 (cross-origin)
- Proxy `/metronome-scaled` pour gérer la communication
- Problèmes de raccourcis clavier à cause du cross-origin
- Seul ArrowLeft fonctionne correctement

### **Solution visée** :
- Métronome intégré dans SHRED UP (same-origin)
- Tous les raccourcis clavier fonctionnent
- Communication directe (pas de postMessage)
- Un seul déploiement

---

## 📦 VERSION STABLE SAUVEGARDÉE

### **Tag Git** : `v1.3-stable-before-integration`
```bash
# Revenir à la version stable
git checkout v1.3-stable-before-integration
```

### **Backup tar.gz** : https://www.genspark.ai/api/files/s/luYI3wnh
- Taille : 3.00 MB
- Contient : Projet complet avec historique Git
- État : Métronome port 7777 externe + SHRED UP fonctionnel

### **GitHub** :
```bash
# Revenir à main (version stable)
git checkout main
```

---

## 🔄 COMMENT RESTAURER LA VERSION STABLE

### **Méthode 1 : Via Git tag**
```bash
cd /home/user/webapp
git fetch --all --tags
git checkout v1.3-stable-before-integration
npm install
npm run build
pm2 restart webapp
```

### **Méthode 2 : Via backup tar.gz**
```bash
cd /home/user
wget https://www.genspark.ai/api/files/s/luYI3wnh -O backup-stable.tar.gz
tar -xzf backup-stable.tar.gz
cd webapp
npm install
npm run build
pm2 restart webapp
```

### **Méthode 3 : Via branche main**
```bash
cd /home/user/webapp
git checkout main
npm install
npm run build
pm2 restart webapp
```

---

## 📋 PLAN D'INTÉGRATION (cette branche)

### **Phase 1 : Audit et téléchargement** 🔍
- [ ] Télécharger TOUS les fichiers du métronome (port 7777)
- [ ] Analyser les dépendances et assets
- [ ] Identifier les modifications nécessaires
- [ ] Documenter les différences de comportement

### **Phase 2 : Intégration locale** 🛠️
- [ ] Copier les fichiers dans `public/static/metronome/`
- [ ] Créer route `/metronome-local` dans Hono
- [ ] Adapter les chemins des assets
- [ ] Tester en parallèle avec port 7777

### **Phase 3 : Tests de compatibilité** 🧪
- [ ] Vérifier apparence identique
- [ ] Tester tous les raccourcis clavier
- [ ] Vérifier modales BEAT/BAR/NOTE
- [ ] Tester inputs et navigation
- [ ] Comparer comportement audio

### **Phase 4 : Migration** 🔄
- [ ] Changer iframe vers `/metronome-local`
- [ ] Supprimer proxy `/metronome-scaled`
- [ ] Supprimer code postMessage inutile
- [ ] Simplifier gestion keyboard events
- [ ] Tests complets

### **Phase 5 : Validation** ✅
- [ ] Tous les raccourcis fonctionnent
- [ ] Apparence identique
- [ ] Performance OK
- [ ] Pas de régression
- [ ] Documentation à jour

---

## 🚨 RÈGLES DE SÉCURITÉ

### **À FAIRE** ✅
- Travailler UNIQUEMENT sur cette branche
- Commiter fréquemment avec messages clairs
- Tester chaque modification
- Documenter les changements

### **À NE PAS FAIRE** ❌
- Ne PAS merger sur main sans validation complète
- Ne PAS supprimer le backup tar.gz
- Ne PAS supprimer le tag v1.3-stable-before-integration
- Ne PAS modifier la branche main

---

## 🔗 LIENS UTILES

### **Version STABLE (main)** :
- Branch : `main`
- Tag : `v1.3-stable-before-integration`
- Backup : https://www.genspark.ai/api/files/s/luYI3wnh
- Métronome : Port 7777 (externe)
- SHRED UP : Port 3000

### **Version EXPÉRIMENTALE (cette branche)** :
- Branch : `integrate-metronome`
- Métronome : Intégré dans SHRED UP
- SHRED UP : Port 3000 (tout intégré)

---

## 📊 STATUS ACTUEL

- ✅ Tag créé : `v1.3-stable-before-integration`
- ✅ Backup créé : 3.00 MB
- ✅ Branche créée : `integrate-metronome`
- ⏳ Intégration : **EN COURS**

---

## 🎯 PROCHAINES ÉTAPES

1. **Télécharger** les fichiers du métronome (port 7777)
2. **Copier** dans `public/static/metronome/`
3. **Créer** route `/metronome-local`
4. **Tester** visuellement
5. **Valider** comportement identique

---

## 💡 SI QUELQUE CHOSE SE PASSE MAL

**NE PANIQUE PAS ! Tu as 3 sauvegardes :**

1. **Branche main** (toujours intacte)
2. **Tag Git** (v1.3-stable-before-integration)
3. **Backup tar.gz** (téléchargeable)

**Revenir à la version stable** :
```bash
git checkout main
npm run build
pm2 restart webapp
```

**Et tout redevient comme avant ! ✅**

---

## 📝 NOTES

- Cette branche est **EXPÉRIMENTALE**
- La branche **main reste intacte**
- Le **port 7777 reste actif** pendant les tests
- On peut **basculer entre les deux** à tout moment

**Aucun risque de perdre le travail actuel ! 🎯✅**
