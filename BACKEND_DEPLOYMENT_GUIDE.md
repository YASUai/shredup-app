# 🚀 Phase 2 : Backend Python - Guide de déploiement

## ✅ Ce qui a été créé

Le backend Python FastAPI est maintenant **prêt à déployer** :

```
backend/
├── main.py                 # Serveur FastAPI
├── audio_analysis.py       # Fonctions d'analyse audio
├── requirements.txt        # Dépendances Python
├── Dockerfile             # Container Docker
├── .env.example           # Configuration exemple
├── README.md              # Documentation complète
└── test_api.py            # Script de test
```

---

## 🎯 Fonctionnalités implémentées

### Endpoints API

1. **`GET /`** - Health check simple
2. **`GET /health`** - Health check détaillé avec versions des librairies
3. **`POST /api/analyze-with-reference`** - Analyse comparative (utilisateur vs référence)
4. **`POST /api/analyze-solo`** - Analyse basique d'un fichier audio

### Métriques d'analyse

- ✅ **Tempo** : Détection BPM (Librosa)
- ✅ **Timing** : Précision onset ±1-2ms (Aubio)
- ✅ **Pitch** : Précision ±1-2 cents (pYIN)
- ✅ **Rythme** : Comparaison tempo-agnostic (DTW)
- ✅ **Score global** : Agrégation pondérée

---

## 📋 Prochaines étapes - Déploiement

### Option 1 : Railway.app (RECOMMANDÉ - Gratuit)

Railway offre un plan gratuit parfait pour ce backend.

#### 1. Créer un compte Railway

👉 **[Railway.app](https://railway.app/)**

- Inscription gratuite
- $5/mois de crédit gratuit
- Largement suffisant pour ce backend

#### 2. Installer Railway CLI

```bash
npm install -g @railway/cli
```

#### 3. Se connecter

```bash
railway login
```

#### 4. Déployer le backend

```bash
cd backend
railway init
railway up
```

#### 5. Obtenir l'URL du backend

```bash
railway domain
```

Exemple d'URL : `https://shredup-backend-production.up.railway.app`

#### 6. Configurer les variables d'environnement (optionnel)

```bash
railway variables set PORT=8000
railway variables set ALLOWED_ORIGINS="https://your-frontend.pages.dev"
```

---

### Option 2 : Render.com (Alternative gratuite)

#### 1. Créer un compte

👉 **[Render.com](https://render.com/)**

#### 2. Créer un nouveau Web Service

- Connecter votre repo GitHub
- Sélectionner la branche `feature/phase-4-tuner-integration`

#### 3. Configuration

- **Root Directory** : `backend`
- **Build Command** : `pip install -r requirements.txt`
- **Start Command** : `uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Instance Type** : Free

#### 4. Déployer

Render déploiera automatiquement à chaque push.

#### 5. Obtenir l'URL

Exemple : `https://shredup-backend.onrender.com`

---

### Option 3 : Docker + Cloud Run (Google Cloud)

Si tu veux utiliser Google Cloud (gratuit pour petits volumes) :

#### 1. Build l'image Docker

```bash
cd backend
docker build -t shredup-backend .
```

#### 2. Tagger pour Google Container Registry

```bash
docker tag shredup-backend gcr.io/YOUR-PROJECT/shredup-backend
```

#### 3. Pusher vers GCR

```bash
docker push gcr.io/YOUR-PROJECT/shredup-backend
```

#### 4. Déployer sur Cloud Run

```bash
gcloud run deploy shredup-backend \
  --image gcr.io/YOUR-PROJECT/shredup-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

---

## 🧪 Tester le backend localement (optionnel)

### Prérequis

- Python 3.9+
- pip

### Installation

```bash
cd backend
pip install -r requirements.txt
```

**⚠️ Note pour Windows** : L'installation d'`aubio` peut échouer. Solutions :

1. Utiliser WSL (recommandé)
2. Installer via conda : `conda install -c conda-forge aubio`
3. Utiliser Docker (voir Dockerfile)

### Lancer le serveur

```bash
python main.py
```

Ou :

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Tester

```bash
# Health check
curl http://localhost:8000/health

# Test avec le script
python test_api.py
```

---

## 🔗 Connexion Frontend → Backend

Une fois le backend déployé, il faudra :

### 1. Récupérer l'URL du backend

Exemple : `https://shredup-backend-production.up.railway.app`

### 2. Ajouter la configuration dans le frontend

Dans `public/static/app.js`, ajouter :

```javascript
// Backend API configuration
const BACKEND_API_URL = 'https://shredup-backend-production.up.railway.app';

// Function to analyze with reference
async function analyzeWithReference(userAudioBlob, referenceAudioBlob, exerciseName) {
    const formData = new FormData();
    formData.append('user_audio', userAudioBlob, 'user_recording.mp3');
    formData.append('reference_audio', referenceAudioBlob, 'reference.mp3');
    formData.append('exercise_name', exerciseName);
    
    try {
        const response = await fetch(`${BACKEND_API_URL}/api/analyze-with-reference`, {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Analysis failed: ${response.status}`);
        }
        
        const results = await response.json();
        return results;
    } catch (error) {
        console.error('[ANALYSIS] Error:', error);
        throw error;
    }
}
```

---

## 📊 Structure de la réponse API

```json
{
  "exercise_name": "Alternate Picking",
  "status": "success",
  "overall_score": {
    "total": 87.5,
    "breakdown": {
      "tempo": 95.0,
      "timing": 88.0,
      "rhythm": 85.0,
      "pitch": 82.0
    }
  },
  "tempo": {
    "user_bpm": 118.5,
    "reference_bpm": 120.0,
    "difference_bpm": 1.5,
    "score": 95.0
  },
  "timing": {
    "mean_error_ms": 3.2,
    "std_error_ms": 1.8,
    "score": 88.0
  },
  "rhythm": {
    "dtw_distance": 0.42,
    "tempo_agnostic": true,
    "score": 85.0
  },
  "pitch": {
    "mean_error_cents": 4.1,
    "std_error_cents": 2.3,
    "score": 82.0
  }
}
```

---

## 🎯 Quelle option choisir ?

### ✅ Railway.app (RECOMMANDÉ)

- ✅ Le plus simple
- ✅ Gratuit ($5/mois crédit)
- ✅ CLI facile
- ✅ Déploiement rapide
- ✅ Support Python/Docker natif

### ⚠️ Render.com

- ✅ Gratuit
- ⚠️ Plus lent au démarrage (instance free)
- ✅ Bon pour tester

### 🔧 Docker + Cloud

- ⚠️ Plus complexe
- ✅ Plus de contrôle
- ✅ Scalable

---

## 📝 À FAIRE MAINTENANT

1. **Choisir une plateforme** : Railway.app recommandé
2. **Créer un compte**
3. **Déployer le backend**
4. **Récupérer l'URL**
5. **Me donner l'URL** → Je l'intégrerai au frontend

Ou si tu veux que je t'aide à déployer, dis-moi quelle plateforme tu préfères ! 🚀
