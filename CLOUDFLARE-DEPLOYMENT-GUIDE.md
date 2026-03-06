# 🚀 DÉPLOIEMENT CLOUDFLARE PAGES - GUIDE ÉTAPE PAR ÉTAPE

## ✅ PRÉREQUIS VÉRIFIÉS
- [x] Projet buildé : `dist/` existe (1.7 MB, 77 fichiers)
- [x] Git repository : https://github.com/YASUai/shredup-app
- [x] Nom du projet : `shredup-app`
- [ ] API Cloudflare configurée (à faire maintenant)

---

## 🔑 ÉTAPE 1 : CONFIGURATION API CLOUDFLARE (5 MIN)

### **A. Créer le token API**
1. Aller sur : https://dash.cloudflare.com/profile/api-tokens
2. Cliquer "Create Token"
3. Choisir template "Edit Cloudflare Workers"
4. Permissions :
   - ✅ Account → Cloudflare Pages → Edit
   - ✅ User → User Details → Read (optionnel)
5. "Continue to summary" → "Create Token"
6. **COPIER LE TOKEN** (commence par un long string)

### **B. Configurer dans GenSpark**
1. Onglet **"Deploy"** dans GenSpark sidebar
2. Coller le token
3. Sauvegarder

### **C. Vérifier la configuration**
Dans le terminal GenSpark, exécuter :
```bash
# Cette commande vérifiera que l'API est configurée
setup_cloudflare_api_key

# Puis vérifier l'authentification
npx wrangler whoami
```

Résultat attendu : affiche ton email Cloudflare

---

## 🏗️ ÉTAPE 2 : CRÉER LE PROJET CLOUDFLARE PAGES (1 MIN)

```bash
cd /home/user/webapp

# Créer le projet sur Cloudflare
npx wrangler pages project create shredup-app \
  --production-branch main \
  --compatibility-date 2024-01-01
```

**Résultat attendu** :
```
✅ Successfully created the 'shredup-app' project.
🌎  View your project at https://dash.cloudflare.com/...
```

---

## 📦 ÉTAPE 3 : PREMIER DÉPLOIEMENT (2 MIN)

```bash
cd /home/user/webapp

# Déployer le dossier dist/
npx wrangler pages deploy dist --project-name shredup-app --branch main
```

**Résultat attendu** :
```
✨ Compiled Worker successfully
✨ Uploading...
✨ Deployment complete! Take a peek over at https://shredup-app.pages.dev
```

**Tu recevras 2 URLs** :
- **Production** : https://shredup-app.pages.dev
- **Branch** : https://main.shredup-app.pages.dev

---

## ✅ ÉTAPE 4 : VÉRIFICATION (2 MIN)

### **A. Tester l'URL de production**
```bash
curl -I https://shredup-app.pages.dev
```

Attendu : `HTTP/2 200`

### **B. Tester les pages clés**
Ouvrir dans le navigateur :
- https://shredup-app.pages.dev (page d'accueil / tuner)
- https://shredup-app.pages.dev/static/metronome/test-subdivisions.html
- https://shredup-app.pages.dev/static/metronome/test-audio-recorder.html

### **C. Sauvegarder le nom du projet**
```bash
# Dans GenSpark, appeler l'outil meta_info
meta_info(action="write", key="cloudflare_project_name", value="shredup-app")
```

---

## 🔄 DÉPLOIEMENTS FUTURS (30 SECONDES)

```bash
# Méthode 1 : Script automatique
cd /home/user/webapp
./deploy.sh production

# Méthode 2 : Commande manuelle
npm run build
npx wrangler pages deploy dist --project-name shredup-app
```

---

## 🐛 DÉPANNAGE

### **Erreur : "No token found"**
```bash
# Reconfigurer l'API
setup_cloudflare_api_key
# Puis entrer le token manuellement
npx wrangler login  # Alternative
```

### **Erreur : "Project already exists"**
```bash
# Lister les projets existants
npx wrangler pages project list

# Déployer directement (sans créer)
npx wrangler pages deploy dist --project-name shredup-app
```

### **Erreur : "Build failed"**
```bash
# Rebuild proprement
cd /home/user/webapp
rm -rf dist node_modules
npm install
npm run build
```

### **Erreur : "Invalid worker format"**
```bash
# Vérifier que dist/_worker.js existe
ls -lh dist/_worker.js

# Si manquant, rebuild
npm run build
```

---

## 📊 COMMANDES UTILES POST-DÉPLOIEMENT

```bash
# Liste des déploiements
npx wrangler pages deployment list --project-name shredup-app

# Infos projet
npx wrangler pages project show shredup-app

# Logs en temps réel
npx wrangler pages deployment tail --project-name shredup-app

# Rollback (revenir version précédente)
npx wrangler pages deployment rollback --project-name shredup-app

# Ajouter un secret (API key, token, etc.)
npx wrangler pages secret put MY_SECRET --project-name shredup-app

# Lister les secrets
npx wrangler pages secret list --project-name shredup-app
```

---

## 🎯 RÉCAPITULATIF FINAL

Après déploiement réussi, tu auras :

✅ **Application permanente** : https://shredup-app.pages.dev  
✅ **CDN global** : latence <50ms partout dans le monde  
✅ **HTTPS automatique** : certificat SSL géré par Cloudflare  
✅ **Déploiements illimités** : push → auto-deploy (si GitHub Actions configuré)  
✅ **Historique complet** : rollback à tout moment  
✅ **Pas de frais** : plan gratuit très généreux  

---

## 📝 CHECKLIST DE DÉPLOIEMENT

- [ ] API Cloudflare configurée (setup_cloudflare_api_key)
- [ ] Authentification vérifiée (npx wrangler whoami)
- [ ] Projet créé (wrangler pages project create)
- [ ] Premier déploiement (wrangler pages deploy)
- [ ] URL de production testée (https://shredup-app.pages.dev)
- [ ] Pages clés vérifiées (subdivisions, recorder, tuner)
- [ ] meta_info mis à jour (cloudflare_project_name)
- [ ] URLs bookmarkées (production + dashboard Cloudflare)

---

## 🎸 PROCHAINE ÉTAPE

Une fois le déploiement terminé, tu pourras :
1. Partager l'URL avec utilisateurs
2. Revenir sur le projet à tout moment (même après des mois)
3. Déployer les mises à jour en 30 secondes
4. Analyser l'APK Tuner Pitch pour intégrer son moteur

**COMMENCE MAINTENANT** : Configure ton API Cloudflare dans l'onglet Deploy ! 🚀
