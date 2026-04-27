# SHRED UP — Guide de reconstruction complète

Ce document permet de reconstruire et redéployer l'application de zéro sur n'importe quelle machine.

---

## Vue d'ensemble de l'architecture

| Couche | Techno | Hébergement | URL |
|--------|--------|-------------|-----|
| Frontend | Hono + Vite → Cloudflare Workers | Cloudflare Pages | `https://webapp-3i0.pages.dev/` |
| Fichiers statiques | Vanilla JS / CSS (non bundlés) | Cloudflare Pages (via `dist/static/`) | — |
| Backend | Python FastAPI + Librosa | Railway (Docker) | `https://npx-railwaycli-up-production.up.railway.app` |

**Repo GitHub :** `https://github.com/YASUai/shredup-app` (branche `main`)

---

## Prérequis à installer sur la nouvelle machine

- **Node.js** ≥ 18 — https://nodejs.org
- **Git** — https://git-scm.com
- **Python** ≥ 3.10 (pour le backend uniquement) — https://python.org
- **Un compte Cloudflare** avec accès au projet `shredup-app`
- **Un compte Railway** avec accès au projet backend (optionnel si le backend Railway tourne déjà)

---

## 1. Cloner le repo

```bash
git clone https://github.com/YASUai/shredup-app.git
cd shredup-app
```

Tout le code source est sur la branche `main`. Pas besoin d'autres branches.

---

## 2. Installer les dépendances frontend

```bash
npm install
```

Cela installe Vite, Wrangler, Hono et tous les outils de build.

---

## 3. Développement local

```bash
npm run dev
```

Lance le serveur Vite avec hot-reload sur `http://localhost:5173`.

> Pour simuler l'environnement Cloudflare Workers exactement :
> ```bash
> npm run build
> cp -r public/static dist/static
> npm run preview
> ```
> Accessible sur `http://localhost:8788`.

---

## 4. Build pour la production

```bash
npm run build
```

Génère le dossier `dist/` avec le worker Cloudflare (`dist/_worker.js`, etc.).

### ⚠️ Étape critique — copier les fichiers statiques

Le build Vite/Hono **ne copie pas automatiquement** `public/static/` vers `dist/static/`. Il faut le faire manuellement après chaque build :

**Sur Mac/Linux :**
```bash
cp -r public/static dist/static
```

**Sur Windows (PowerShell) :**
```powershell
Copy-Item -Recurse -Force public\static dist\static
```

**Sur Windows (Git Bash) :**
```bash
cp -r public/static dist/static
```

Sans cette étape, l'app se charge mais tous les modules (métronome, tuner, etc.) seront vides.

---

## 5. Déployer sur Cloudflare Pages

### Connexion Wrangler (première fois uniquement)

```bash
npx wrangler login
```

Un navigateur s'ouvre → se connecter au compte Cloudflare → autoriser Wrangler.

### Déploiement

```bash
npx wrangler pages deploy dist --project-name shredup-app
```

> Le nom du projet Cloudflare est `shredup-app` (configuré dans `.cloudflare-project`).

Après déploiement, l'URL de production est : **`https://webapp-3i0.pages.dev/`**

### Script complet build + deploy (Mac/Linux)

```bash
npm run build && cp -r public/static dist/static && npx wrangler pages deploy dist --project-name shredup-app
```

### Script complet build + deploy (Windows PowerShell)

```powershell
npm run build; Copy-Item -Recurse -Force public\static dist\static; npx wrangler pages deploy dist --project-name shredup-app
```

---

## 6. Backend Python (Railway)

Le backend gère l'analyse audio (BPM, pitch via Librosa). Il tourne sur Railway et est déjà déployé. Si tu dois le redéployer :

### Développement local du backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

API disponible sur `http://localhost:8000`  
Swagger UI : `http://localhost:8000/docs`

### Redéployer sur Railway

1. Aller sur [railway.app](https://railway.app) → projet existant
2. Connecter le repo GitHub (`YASUai/shredup-app`)
3. Configurer le **Root Directory** sur `backend/`
4. Railway détecte automatiquement le `Dockerfile` et build le container

> Le backend a un **cold start de ~60 secondes** (chargement de Librosa). C'est normal.

### URL du backend

L'URL est codée en dur dans `src/api.ts` :
```
https://npx-railwaycli-up-production.up.railway.app
```

Si tu redéploies sur un nouveau service Railway, mettre à jour cette URL dans `src/api.ts`.

---

## Structure du projet (fichiers clés)

```
shredup-app/
├── src/
│   ├── index.tsx          # Routes Hono (point d'entrée serveur)
│   ├── api.ts             # Wrapper vers le backend Railway
│   └── renderer.tsx       # Layout HTML de base
├── public/static/
│   ├── app.js             # Logique principale de l'app (vanilla JS)
│   ├── style.css          # Styles globaux + thème dark/light
│   ├── metronome/
│   │   ├── index.html     # Métronome (iframe standalone)
│   │   ├── script.js      # Logique métronome
│   │   └── styles.css     # Styles métronome (neumorphique)
│   ├── tuner/
│   │   ├── index.html     # Tuner (iframe standalone)
│   │   └── backend-integration.js
│   └── audio-engine/      # Détection de pitch (YIN, stabilisateurs)
├── backend/
│   ├── main.py            # API FastAPI
│   ├── requirements.txt
│   ├── Dockerfile
│   └── railway.toml
├── vite.config.ts         # Config Vite + Hono build
├── wrangler.jsonc         # Config Cloudflare Pages
└── package.json
```

---

## Points d'attention importants

### Cache Cloudflare
Après un déploiement, les utilisateurs doivent faire **Ctrl+Shift+R** (hard refresh) pour voir les changements. Cloudflare Pages met les fichiers statiques en cache de manière agressive.

### Modifier les fichiers statiques
Les fichiers dans `public/static/` (app.js, style.css, etc.) sont du vanilla JS/CSS — pas de build nécessaire pour les modifier. Mais il faut toujours les copier dans `dist/static/` avant de déployer.

### Communication inter-iframes
Le métronome et le tuner sont des iframes séparées. L'app principale communique avec eux via `postMessage`. Si tu modifies `app.js` ou les scripts des iframes, vérifie que les listeners `window.addEventListener('message', ...)` sont cohérents des deux côtés.

### Thème dark/light
Le toggle ☀️/🌙 envoie `postMessage({ type: 'THEME_CHANGE', theme: 'light'|'dark' })` aux deux iframes. La préférence est sauvegardée dans `localStorage` (`shred-up-theme`).

---

## Récapitulatif — commandes essentielles

| Action | Commande |
|--------|----------|
| Cloner | `git clone https://github.com/YASUai/shredup-app.git` |
| Installer | `npm install` |
| Dev local | `npm run dev` |
| Build | `npm run build` |
| Copier static (Mac/Linux) | `cp -r public/static dist/static` |
| Copier static (Windows PS) | `Copy-Item -Recurse -Force public\static dist\static` |
| Déployer | `npx wrangler pages deploy dist --project-name shredup-app` |
| Backend local | `cd backend && pip install -r requirements.txt && uvicorn main:app --reload` |
