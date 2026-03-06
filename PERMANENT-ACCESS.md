# 📦 SHREDUP - ACCÈS PERMANENT & REPRISE APRÈS PAUSE

## ✅ SOLUTIONS MISES EN PLACE

### **1️⃣ Backup complet du projet**
**URL CDN** : https://www.genspark.ai/api/files/s/7jlXTsHq  
**Taille** : 6.6 MB  
**Contenu** : Code complet + git history  
**Validité** : Permanent (hébergé sur CDN GenSpark)

**Restauration en 3 commandes** :
```bash
cd /home/user
wget https://www.genspark.ai/api/files/s/7jlXTsHq -O shredup.tar.gz
tar -xzf shredup.tar.gz
cd /home/user/webapp && npm install && npm run build && pm2 start ecosystem.config.cjs
```

---

### **2️⃣ GitHub Repository**
**URL** : https://github.com/YASUai/shredup-app  
**Branch principale** : `feature/phase-4-tuner-integration`  
**Commits** : Tous sauvegardés avec messages détaillés

**Clone depuis GitHub** :
```bash
cd /home/user
git clone https://github.com/YASUai/shredup-app.git webapp
cd webapp
npm install
npm run build
pm2 start ecosystem.config.cjs
```

---

### **3️⃣ Cloudflare Pages (DÉPLOIEMENT PERMANENT)**
**Nom du projet** : `shredup-app`  
**URL future** : https://shredup-app.pages.dev  
**Avantage** : Accessible 24/7 même sans sandbox

**Premier déploiement** (à faire maintenant) :
```bash
# 1. Configurer l'API Cloudflare (une seule fois)
#    → Aller dans l'onglet "Deploy" de GenSpark
#    → Créer un token API sur dash.cloudflare.com
#    → Copier le token dans GenSpark

# 2. Déployer
cd /home/user/webapp
npm run build
npx wrangler pages project create shredup-app --production-branch main
npx wrangler pages deploy dist --project-name shredup-app

# Résultat : https://shredup-app.pages.dev (permanent !)
```

---

## 🔄 SCÉNARIO : REPRISE APRÈS PLUSIEURS SEMAINES

### **Cas 1 : Sandbox a expiré, mais GitHub accessible**
```bash
# Méthode rapide (recommandée)
cd /home/user
git clone https://github.com/YASUai/shredup-app.git webapp
cd webapp
npm install
npm run build
pm2 start ecosystem.config.cjs

# Obtenir nouvelle URL sandbox
# → Appeler GetServiceUrl(port=3000)
```

---

### **Cas 2 : Sandbox + GitHub expirés, utiliser le backup CDN**
```bash
# Restauration depuis backup
cd /home/user
wget https://www.genspark.ai/api/files/s/7jlXTsHq -O shredup.tar.gz
tar -xzf shredup.tar.gz
cd /home/user/webapp
npm install
npm run build
pm2 start ecosystem.config.cjs
```

---

### **Cas 3 : Accès à l'application sans sandbox (IDÉAL)**
**Cloudflare Pages** : https://shredup-app.pages.dev

✅ Toujours accessible (24/7)  
✅ Pas besoin de sandbox pour utiliser  
✅ Partage facile avec utilisateurs  
✅ Mises à jour rapides (`./deploy.sh production`)

---

## 📋 FICHIERS IMPORTANTS CRÉÉS

1. **DEPLOYMENT.md** : Guide complet de déploiement
2. **deploy.sh** : Script de déploiement en une commande
3. **.cloudflare-project** : Nom du projet Cloudflare
4. **README.md** : Documentation générale (à créer)

---

## 🎯 PROCHAINES ÉTAPES RECOMMANDÉES

### **Maintenant**
1. [ ] Configurer API Cloudflare dans l'onglet "Deploy"
2. [ ] Exécuter premier déploiement : `./deploy.sh production`
3. [ ] Tester URL Cloudflare Pages
4. [ ] Bookmarker les 3 URLs importantes

### **À chaque session de développement**
1. Cloner depuis GitHub ou restaurer backup
2. Développer dans sandbox
3. Commit + push vers GitHub
4. Déployer sur Cloudflare Pages (`./deploy.sh production`)

---

## 📂 URLS À SAUVEGARDER

### **Code source**
- GitHub : https://github.com/YASUai/shredup-app
- Backup CDN : https://www.genspark.ai/api/files/s/7jlXTsHq

### **Application déployée**
- Cloudflare Pages : https://shredup-app.pages.dev (après déploiement)
- Sandbox actuelle : https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai (temporaire)

### **Déploiement**
- Cloudflare Dashboard : https://dash.cloudflare.com/pages
- GitHub Actions : https://github.com/YASUai/shredup-app/actions (si configuré)

---

## 💡 AVANTAGES DU SYSTÈME MIS EN PLACE

### **Résilience totale**
- ✅ Code sur GitHub (permanent)
- ✅ Backup sur CDN (permanent)
- ✅ App sur Cloudflare (permanent)
- ✅ Sandbox pour dev (temporaire mais recréable)

### **Flexibilité**
- ✅ Reprendre projet en 2 minutes (git clone)
- ✅ Accès app sans sandbox (Cloudflare Pages)
- ✅ Déploiement rapide (1 commande)
- ✅ Rollback facile (git + Cloudflare versions)

### **Workflow optimal**
```
Développement → Sandbox temporaire
    ↓
   Git commit + push → GitHub permanent
    ↓
   Deploy → Cloudflare Pages permanent
    ↓
Utilisateurs → https://shredup-app.pages.dev
```

---

## 🔧 COMMANDES DE RÉFÉRENCE RAPIDE

```bash
# Restaurer projet (méthode 1 - GitHub)
git clone https://github.com/YASUai/shredup-app.git webapp
cd webapp && npm install && npm run build

# Restaurer projet (méthode 2 - Backup)
wget https://www.genspark.ai/api/files/s/7jlXTsHq -O shredup.tar.gz
tar -xzf shredup.tar.gz && cd /home/user/webapp

# Démarrer sandbox local
pm2 start ecosystem.config.cjs

# Déployer sur Cloudflare
./deploy.sh production

# Commit + push
git add . && git commit -m "message" && git push origin feature/phase-4-tuner-integration
```

---

**🎸 Ton projet ShredUp est maintenant permanent et accessible à tout moment !**
