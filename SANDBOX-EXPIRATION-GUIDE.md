# 🔄 SHREDUP - GUIDE DE REPRISE APRÈS EXPIRATION SANDBOX

## 🎯 **PROBLÈME : LA SANDBOX EXPIRE APRÈS QUELQUES JOURS**

Quand tu reviens après plusieurs jours/semaines, la sandbox GenSpark est réinitialisée et le projet `/home/user/webapp` n'existe plus.

---

## ✅ **SOLUTION AUTOMATIQUE : JE M'EN OCCUPE**

### **Quand tu demandes une modification**

**Tu dis simplement** :
> "Change le seuil d'énergie à 0.10"

**Je détecte automatiquement** que la sandbox est vide et je :

1. ✅ **Clone depuis GitHub** (2 min)
   ```bash
   git clone https://github.com/YASUai/shredup-app.git webapp
   npm install
   npm run build
   pm2 start ecosystem.config.cjs
   ```

2. ✅ **Ou restaure depuis backup** (si GitHub échoue)
   ```bash
   wget https://www.genspark.ai/api/files/s/7jlXTsHq
   tar -xzf shredup-backup.tar.gz
   npm install
   pm2 start ecosystem.config.cjs
   ```

3. ✅ **Puis je fais ta modification** comme d'habitude

**Temps total : ~2-3 minutes**  
**Tu n'as rien à faire !**

---

## 🎯 **SI TU VEUX LE FAIRE MANUELLEMENT**

### **Option 1 : Script automatique (RECOMMANDÉ)**

```bash
# Télécharge et exécute le script de restauration
cd /home/user
wget https://raw.githubusercontent.com/YASUai/shredup-app/feature/phase-4-tuner-integration/restore.sh
chmod +x restore.sh
./restore.sh
```

Le script :
- ✅ Détecte si webapp existe
- ✅ Clone depuis GitHub si manquant
- ✅ Installe les dépendances
- ✅ Build le projet
- ✅ Démarre PM2

### **Option 2 : Restauration manuelle depuis GitHub**

```bash
cd /home/user
git clone https://github.com/YASUai/shredup-app.git webapp
cd webapp
npm install
npm run build
pm2 start ecosystem.config.cjs
```

### **Option 3 : Restauration depuis backup CDN**

```bash
cd /home/user
wget https://www.genspark.ai/api/files/s/7jlXTsHq -O shredup.tar.gz
tar -xzf shredup.tar.gz
cd webapp
npm install
npm run build
pm2 start ecosystem.config.cjs
```

---

## 🎯 **WORKFLOW COMPLET AVEC EXPIRATION**

### **Scénario : Tu reviens après 2 semaines**

```
JOUR 1 (Développement)
├─ Tu : "Ajoute une feature X"
├─ Moi : Je modifie le code
├─ Build + Test + Commit
└─ Tu déploies en production
    └─ URL permanente : https://0b596d24-c79c-4659-a359-785995cb196d.vip.gensparksite.com

⏱️  2 SEMAINES SANS ACTIVITÉ
└─ Sandbox GenSpark expire et est réinitialisée

JOUR 15 (Retour)
├─ Tu : "Change la couleur en bleu"
├─ Moi : 
│   ├─ Je détecte que /home/user/webapp n'existe pas
│   ├─ Je restaure depuis GitHub (2 min)
│   ├─ npm install + build + pm2 start
│   └─ ENSUITE je fais ta modification
└─ Tout fonctionne comme avant !
```

---

## 🎯 **TU N'AS RIEN À FAIRE, SAUF...**

### **Dans le chat GenSpark, tu peux dire** :

**Si tu veux juste utiliser l'app** :
- Aucune action nécessaire
- URL permanente fonctionne toujours : https://0b596d24-c79c-4659-a359-785995cb196d.vip.gensparksite.com

**Si tu veux modifier le code** :
- "Change X en Y" → Je restaure automatiquement puis je modifie
- "La sandbox a expiré" → Je restaure explicitement
- "Restaure le projet" → Je le fais

**Si la restauration échoue** :
- "GitHub ne répond pas" → J'utilise le backup CDN
- "Le backup ne fonctionne pas" → Je t'aide à diagnostiquer

---

## 📋 **RESSOURCES PERMANENTES**

### **3 copies de sauvegarde (toujours accessibles)**

1. **Production (app déployée)** ✅
   - https://0b596d24-c79c-4659-a359-785995cb196d.vip.gensparksite.com
   - Fonctionne 24/7, même si sandbox expire
   - Aucune restauration nécessaire pour utiliser

2. **GitHub (code source)** ✅
   - https://github.com/YASUai/shredup-app
   - Clone en 2 minutes
   - Toujours à jour (commits automatiques)

3. **CDN Backup (archive complète)** ✅
   - https://www.genspark.ai/api/files/s/7jlXTsHq
   - 6.6 MB (code + git history)
   - Téléchargeable à tout moment

---

## 🔑 **POINTS CLÉS**

### **Application en production**
✅ **Toujours accessible** : https://0b596d24-c79c-4659-a359-785995cb196d.vip.gensparksite.com  
✅ **Pas affectée** par l'expiration sandbox  
✅ **Fonctionne 24/7** pour toi et tes utilisateurs

### **Développement dans sandbox**
⏱️ **Temporaire** : expire après quelques jours d'inactivité  
🔄 **Restaurable** : automatiquement en 2-3 minutes  
🎯 **Pour** : tester modifications avant déploiement

### **Workflow idéal**
```
Modifications (sandbox) → Test → Commit → Déploiement (production)
         ↓                                        ↓
   Expire après N jours                    Permanent 24/7
         ↓                                        ↓
   Restauration auto                      Toujours accessible
```

---

## 💡 **EN RÉSUMÉ**

### **Pour UTILISER ShredUp**
→ Va sur : https://0b596d24-c79c-4659-a359-785995cb196d.vip.gensparksite.com  
→ Fonctionne toujours (sandbox ou pas)

### **Pour MODIFIER ShredUp**
→ Dis-moi ce que tu veux changer  
→ Je restaure automatiquement si nécessaire  
→ Je fais la modification  
→ Tu testes et déploies

### **Si problème**
→ Dis "restaure le projet" ou "la sandbox a expiré"  
→ Je m'en occupe

**Tu n'as jamais besoin de gérer la restauration manuellement !** 🚀

---

## 📞 **COMMANDES UTILES (OPTIONNEL)**

Si tu veux voir l'état du projet :

```bash
# Vérifier si le projet existe
ls -la /home/user/webapp

# Vérifier l'état Git
cd /home/user/webapp && git status

# Vérifier PM2
pm2 list

# Voir les logs
pm2 logs webapp --nostream

# Restaurer manuellement
/home/user/webapp/restore.sh
```

Mais normalement, **tu n'as pas besoin** de ces commandes !

---

**🎸 Ton application est maintenant résiliente à l'expiration de sandbox !**
