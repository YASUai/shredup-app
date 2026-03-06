# 🚀 SHREDUP - GUIDE DE DÉPLOIEMENT PERMANENT

## 📦 SAUVEGARDE DU PROJET

### **Backup complet (à télécharger)**
**URL** : https://www.genspark.ai/api/files/s/7jlXTsHq  
**Taille** : 6.6 MB  
**Format** : .tar.gz  
**Contenu** : Code source complet + git history + node_modules

**Restauration** :
```bash
# Télécharger et extraire
cd /home/user
wget https://www.genspark.ai/api/files/s/7jlXTsHq -O shredup-backup.tar.gz
tar -xzf shredup-backup.tar.gz

# Le projet est restauré avec le chemin absolu
cd /home/user/webapp
npm install  # Si node_modules manquants
npm run build
pm2 start ecosystem.config.cjs
```

---

## 🌐 DÉPLOIEMENT CLOUDFLARE PAGES (PERMANENT)

### **Prérequis**
1. Compte Cloudflare (gratuit) : https://dash.cloudflare.com/sign-up
2. API Token Cloudflare configuré dans l'onglet **Deploy** de GenSpark

### **Étape 1 : Configuration API (première fois uniquement)**
```bash
# Appeler cet outil pour configurer l'environnement
setup_cloudflare_api_key

# Vérifier que l'API est configurée
npx wrangler whoami
```

### **Étape 2 : Lecture du nom de projet**
```bash
# Lire le nom de projet existant (ou utiliser par défaut)
meta_info(action="read", key="cloudflare_project_name")
# Retourne : "webapp" ou le nom configuré
```

### **Étape 3 : Build du projet**
```bash
cd /home/user/webapp
npm run build
# Génère dist/ avec _worker.js et fichiers statiques
```

### **Étape 4 : Créer le projet Cloudflare Pages (première fois)**
```bash
# Utiliser le nom depuis meta_info (ex: shredup-app)
npx wrangler pages project create shredup-app \
  --production-branch main \
  --compatibility-date 2024-01-01
```

### **Étape 5 : Déployer**
```bash
# Déployer dist/ vers Cloudflare Pages
npx wrangler pages deploy dist --project-name shredup-app

# Vous recevrez 2 URLs :
# - Production : https://shredup-app.pages.dev
# - Branch : https://main.shredup-app.pages.dev
```

### **Étape 6 : Sauvegarder le nom du projet**
```bash
# Écrire le nom final dans meta_info pour référence future
meta_info(action="write", key="cloudflare_project_name", value="shredup-app")
```

### **Résultat**
✅ Application accessible 24/7 : https://shredup-app.pages.dev  
✅ Auto-déploiement : push GitHub → déploiement automatique  
✅ HTTPS gratuit : certificat SSL automatique  
✅ CDN global : performance optimale mondiale

---

## 🔄 DÉPLOIEMENT ULTÉRIEUR (MISES À JOUR)

```bash
# 1. Build
cd /home/user/webapp
npm run build

# 2. Déployer (utiliser le nom depuis meta_info)
npx wrangler pages deploy dist --project-name shredup-app

# Déploiement en ~30 secondes
# URL mise à jour instantanément
```

---

## 📂 GITHUB REPOSITORY (CODE SOURCE)

### **Repository actuel**
https://github.com/YASUai/shredup-app

### **Synchronisation**
```bash
# Avant toute opération GitHub
setup_github_environment

# Commit et push
cd /home/user/webapp
git add .
git commit -m "Your commit message"
git push origin feature/phase-4-tuner-integration

# Ou push vers main
git push origin main
```

---

## 🛠️ COMMANDES UTILES

### **Local (Sandbox)**
```bash
# Build
npm run build

# Démarrer serveur local
pm2 start ecosystem.config.cjs

# Arrêter
pm2 delete webapp

# Logs
pm2 logs webapp --nostream

# Redémarrer
pm2 restart webapp
```

### **Cloudflare Pages**
```bash
# Liste des projets
npx wrangler pages project list

# Infos projet
npx wrangler pages project show shredup-app

# Liste des déploiements
npx wrangler pages deployment list --project-name shredup-app

# Rollback (revenir à un déploiement précédent)
npx wrangler pages deployment tail --project-name shredup-app
```

---

## 📋 CHECKLIST POST-DÉPLOIEMENT

- [ ] Tester URL production : https://shredup-app.pages.dev
- [ ] Vérifier page subdivisions : /static/metronome/test-subdivisions.html
- [ ] Tester enregistreur audio : /static/metronome/test-audio-recorder.html
- [ ] Vérifier tuner : /
- [ ] Confirmer métronome visuel : /static/metronome/test-visual-metronome.html
- [ ] Mettre à jour meta_info avec le nom du projet

---

## 🔐 SECRETS (VARIABLES D'ENVIRONNEMENT)

Si vous avez besoin de secrets (API keys, tokens) :

```bash
# Ajouter un secret
npx wrangler pages secret put API_KEY --project-name shredup-app

# Lister les secrets
npx wrangler pages secret list --project-name shredup-app

# Supprimer un secret
npx wrangler pages secret delete API_KEY --project-name shredup-app
```

Les secrets sont accessibles dans votre code via `env.API_KEY`.

---

## 📞 SUPPORT

- **Cloudflare Docs** : https://developers.cloudflare.com/pages
- **Wrangler CLI** : https://developers.cloudflare.com/workers/wrangler
- **GitHub Issues** : https://github.com/YASUai/shredup-app/issues

---

## 🎯 RÉSUMÉ : ACCÈS PERMANENT

### **Sandbox temporaire (développement)**
- URL : https://3000-{sandbox-id}.sandbox.novita.ai
- Durée : expire après quelques heures d'inactivité
- Usage : développement et tests rapides

### **Cloudflare Pages (production)**
- URL : https://shredup-app.pages.dev
- Durée : **permanent** (tant que compte Cloudflare actif)
- Usage : accès 24/7, partage avec utilisateurs

### **GitHub (code source)**
- URL : https://github.com/YASUai/shredup-app
- Durée : **permanent**
- Usage : versioning, collaboration, backup

---

**🎸 ShredUp est maintenant accessible en permanence !**
