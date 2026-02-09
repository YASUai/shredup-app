# 🎸 SHRED UP v1.1

**Professional music practice SaaS with integrated metronome**

[![Version](https://img.shields.io/badge/version-1.1--production--ready-brightgreen)](https://github.com)
[![Status](https://img.shields.io/badge/status-production--ready-success)](https://github.com)
[![Build](https://img.shields.io/badge/build-52.47kB-blue)](https://github.com)

---

## 🎯 À Propos

SHRED UP est une application web professionnelle de pratique musicale intégrant un métronome avancé avec contrôle par raccourcis clavier, feedback visuel instantané (0ms) et communication inter-iframe via PostMessage.

### Fonctionnalités Principales

- ⌨️ **Raccourcis clavier** : Contrôle complet du métronome (Play/Stop, TAP Tempo, BPM)
- ⚡ **Latence 0ms** : Feedback visuel et audio instantané
- 🎨 **Design neumorphique** : Interface moderne et élégante
- 📱 **Responsive** : Optimisé pour 400×800px (format portrait)
- 🔊 **Audio immédiat** : Click sound sur toutes les interactions

---

## 🚀 Démarrage Rapide

### Prérequis

- Node.js 20+
- npm ou pnpm
- PM2 (pré-installé dans le sandbox)

### Installation

```bash
# Cloner le repository
git clone <repository-url>
cd webapp

# Installer les dépendances
npm install

# Build
npm run build

# Démarrer avec PM2
pm2 start ecosystem.config.cjs
```

### URLs

- **Local** : http://localhost:3000
- **Métronome** : http://localhost:3000/metronome-scaled
- **Production** : https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai

---

## ⌨️ Raccourcis Clavier

| Touche | Action |
|---|---|
| **ESPACE** | Play/Stop métronome |
| **CTRL** (×4) | TAP Tempo (calcule BPM sur 4 taps) |
| **+** ou **↑** | BPM +1 |
| **−** ou **↓** | BPM −1 |
| ***** (Numpad) | Toggle REC |

### Caractéristiques

- **TAP Tempo intelligent** : Moyenne sur 4 taps, reset après 2s
- **Plage BPM** : 20-250 BPM
- **Focus robuste** : ESPACE fonctionne même après clic sur TAP
- **Feedback instantané** : 0ms de latence

---

## 🏗️ Architecture

### Stack Technique

- **Framework** : Hono (lightweight web framework)
- **Runtime** : Cloudflare Workers / Node.js
- **Frontend** : Vanilla JavaScript + TailwindCSS (CDN)
- **Communication** : PostMessage (SHRED UP ↔ Métronome)
- **Build** : Vite + TypeScript

### Structure

```
webapp/
├── src/
│   ├── index.tsx          # Routes principales
│   └── renderer.tsx       # Renderer Hono
├── public/static/
│   ├── app.js            # Raccourcis clavier + PostMessage
│   └── style.css         # Styles globaux
├── ecosystem.config.cjs   # Configuration PM2
├── package.json          # Dépendances
├── wrangler.jsonc        # Config Cloudflare
└── README.md
```

### Architecture PostMessage

```
SHRED UP (port 3000)
  └─ app.js capture touches
     └─ postMessage → iframe
        └─ MÉTRONOME (port 7777)
           └─ script.js reçoit messages
              └─ Exécute actions (click boutons, MAJ BPM)
```

---

## 🎨 Intégration Métronome

### Route `/metronome-scaled`

L'iframe métronome est intégrée avec :
- **Taille** : 400×800px (100% du conteneur)
- **Scale** : Contenu réduit de 10% (`scale(0.9)`) et centré
- **Background** : Gradient #141414 remplissant 100%
- **Communication** : PostMessage bidirectionnelle

### Configuration

```typescript
// src/index.tsx
app.get('/metronome-scaled', (c) => {
  return c.html(`
    <iframe 
      src="https://7777-iopksqtiphh7vk63ml8pt-c07dda5e.sandbox.novita.ai/"
      style="width: 100%; height: 100%;"
    ></iframe>
  `)
})
```

---

## 🔧 Scripts

```bash
# Développement
npm run dev              # Vite dev server
npm run dev:sandbox      # Wrangler pages dev (sandbox)

# Build
npm run build            # Build production

# PM2
npm run clean-port       # Libérer le port 3000
pm2 start ecosystem.config.cjs  # Démarrer
pm2 restart webapp       # Redémarrer
pm2 logs webapp --nostream      # Voir les logs

# Git
npm run git:init         # Initialiser git
npm run git:commit       # Commit rapide
npm run git:status       # Status
```

---

## 📚 Documentation

### Guides Complets

- **PRODUCTION-READY-v1.1.md** - Documentation finale complète
- **VALIDATION-FINALE-COMPLETE.md** - Checklist validation
- **RACCOURCIS-WORKING-v1.1.md** - Architecture raccourcis clavier

### Guides Techniques

- **CORRECTION-APPLIQUEE-BACKGROUND.md** - Fix background 100%
- **SCALE-10-METRONOME.md** - Application scale -10%
- **FIX-LATENCE-0MS-BACKGROUND-100.md** - Fix latence et background

### Guides Rapides

- **ACTION-IMMEDIATE.md** - Guide ultra-simplifié
- **RECAPITULATIF-VISUEL.md** - Résumé visuel avec diagrammes

---

## 🏷️ Versions

### Tags Principaux

- `v1.0-raccourcis-fonctionnels` - Première implémentation
- `v1.1-background-fixed` - Background 100% corrigé
- `v1.1-docs-complete` - Documentation complète
- **`v1.1-production-ready`** ⭐ - Version finale validée

### Derniers Commits

```
4b13ae7 docs: add production ready final documentation v1.1
f0ee8b5 docs: add complete final validation checklist
9994e59 fix: remove scale transform, use 100% iframe size
542ca62 feat: add keyboard shortcuts in app.js
```

---

## ✅ Statut Validation

### Fonctionnalités ✅

- [x] Raccourcis clavier complets
- [x] Latence 0ms (instantané)
- [x] Background 100% sans bordures
- [x] Scale -10% centré
- [x] PostMessage fonctionnel
- [x] Feedback visuel + audio

### Tests ✅

- [x] ESPACE → Play/Stop instantané
- [x] CTRL ×4 → TAP Tempo
- [x] +/− → BPM ±1
- [x] Background remplit 100%
- [x] Pas de bordures blanches
- [x] Console sans erreurs

---

## 🚀 Déploiement

### Cloudflare Pages (Optionnel)

```bash
# Setup
npx wrangler login

# Deploy
npm run build
npx wrangler pages deploy dist --project-name shred-up
```

### GitHub

```bash
# Setup (dans Claude Code)
# Appeler setup_github_environment d'abord

# Push
git push origin main
git push origin --tags
```

---

## 🐛 Dépannage

### Port 3000 occupé

```bash
npm run clean-port
# ou
fuser -k 3000/tcp
```

### Build échoue

```bash
# Nettoyer et rebuilder
rm -rf node_modules dist
npm install
npm run build
```

### Raccourcis ne fonctionnent pas

1. Vérifier la console (F12)
2. Vérifier les logs : `⌨️ SPACE → Toggle Play/Stop`
3. Vider le cache : Ctrl+Shift+R

---

## 📝 Notes de Développement

### Commits Explicites

Ce repository utilise une approche de commits explicites. Aucun merge automatique n'est effectué. Tous les commits sont déclenchés manuellement par le propriétaire du projet.

### État Initial

Le premier état commité correspond à une fondation visuelle validée. Chaque commit ultérieur marque une étape validée du développement.

---

## 📄 Licence

Propriétaire : Projet privé

---

## 🤝 Contact

Pour toute question ou suggestion, veuillez contacter l'équipe de développement.

---

**Version** : v1.1-production-ready  
**Date** : 2026-02-09  
**Statut** : ✅ Production Ready

---

**SHRED UP - Professional Music Practice SaaS** 🎸🚀
