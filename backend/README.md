# SHRED UP - Backend Python FastAPI

Backend service pour l'analyse de précision audio avec comparaison tempo-agnostic.

## 🎯 Fonctionnalités

- **Analyse tempo** : Détection BPM avec Librosa
- **Détection d'onsets** : Précision ±1-2ms avec Aubio
- **Analyse pitch** : Précision ±1-2 cents avec pYIN
- **Comparaison rythmique tempo-agnostic** : DTW pour comparer patterns indépendamment du tempo
- **Score global** : Métriques pondérées avec feedback détaillé

## 📦 Installation locale

### Prérequis

- Python 3.9+
- pip

### Installer les dépendances

```bash
cd backend
pip install -r requirements.txt
```

**Note:** L'installation de `aubio` peut nécessiter des outils de compilation sur Windows. Alternatives :
- Utiliser WSL (Windows Subsystem for Linux)
- Installer via conda : `conda install -c conda-forge aubio`
- Utiliser Docker (voir section Docker)

## 🚀 Lancement local

### Développement

```bash
cd backend
python main.py
```

Ou avec uvicorn directement :

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

L'API sera accessible sur : **http://localhost:8000**

### Tester l'API

1. **Health check**
```bash
curl http://localhost:8000/health
```

2. **Test analyse avec fichiers**
```bash
curl -X POST http://localhost:8000/api/analyze-with-reference \
  -F "user_audio=@user_recording.mp3" \
  -F "reference_audio=@reference.mp3" \
  -F "exercise_name=Alternate Picking"
```

## 📚 Documentation API

Une fois le serveur lancé, accédez à :
- **Swagger UI** : http://localhost:8000/docs
- **ReDoc** : http://localhost:8000/redoc

## 🐳 Déploiement

### Option 1 : Railway.app (Recommandé)

1. Créer un compte sur [Railway.app](https://railway.app/)
2. Installer Railway CLI :
```bash
npm i -g @railway/cli
```

3. Se connecter :
```bash
railway login
```

4. Créer un nouveau projet :
```bash
cd backend
railway init
```

5. Déployer :
```bash
railway up
```

6. Obtenir l'URL :
```bash
railway domain
```

### Option 2 : Render.com

1. Créer un compte sur [Render.com](https://render.com/)
2. Créer un nouveau Web Service
3. Connecter votre repo GitHub
4. Configuration :
   - **Build Command** : `pip install -r requirements.txt`
   - **Start Command** : `uvicorn main:app --host 0.0.0.0 --port $PORT`
   - **Root Directory** : `backend`

### Option 3 : Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for audio libraries
RUN apt-get update && apt-get install -y \
    libsndfile1 \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Build et run :
```bash
docker build -t shredup-backend .
docker run -p 8000:8000 shredup-backend
```

## 🧪 Tests

Test basique avec cURL :

```bash
# Health check
curl http://localhost:8000/health

# Analyse solo
curl -X POST http://localhost:8000/api/analyze-solo \
  -F "audio=@test_audio.mp3"

# Analyse avec référence
curl -X POST http://localhost:8000/api/analyze-with-reference \
  -F "user_audio=@user.mp3" \
  -F "reference_audio=@ref.mp3"
```

## 📊 Structure des réponses

### `/api/analyze-with-reference`

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
    },
    "weights": {
      "tempo": 0.15,
      "timing": 0.35,
      "rhythm": 0.30,
      "pitch": 0.20
    }
  },
  "tempo": {
    "user_bpm": 118.5,
    "reference_bpm": 120.0,
    "difference_bpm": 1.5,
    "difference_percent": 1.25,
    "score": 95.0
  },
  "timing": {
    "user_onset_count": 48,
    "reference_onset_count": 48,
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
  },
  "metadata": {
    "user_duration": 12.5,
    "reference_duration": 12.8,
    "sample_rate": 22050
  }
}
```

## 🔧 Configuration

Variables d'environnement (optionnel) :

```bash
# .env
PORT=8000
ALLOWED_ORIGINS=http://localhost:3000,https://your-app.pages.dev
MAX_FILE_SIZE=10485760  # 10MB
```

## 📝 Notes techniques

### Précision des analyses

- **Timing (onset detection)** : ±1-2ms avec Aubio
- **Pitch** : ±1-2 cents avec pYIN
- **Tempo** : BPM détection avec Librosa beat tracker
- **Rhythm** : DTW distance pour comparaison tempo-agnostic

### Limitations

- Fichiers audio max : 10MB (configurable)
- Formats supportés : MP3, WAV, FLAC, OGG, M4A
- Temps de traitement : ~2-5 secondes pour 10-15 secondes d'audio

### Optimisations futures

- [ ] Cache des analyses pour références récurrentes
- [ ] Traitement par batch
- [ ] Support WebSocket pour streaming real-time
- [ ] GPU acceleration pour pitch detection
- [ ] Export des résultats en PDF

## 🐛 Dépannage

### Erreur "aubio not found"

Sur Windows, installer via conda :
```bash
conda install -c conda-forge aubio
```

Ou utiliser Docker.

### Erreur "soundfile not found"

Installer libsndfile :
```bash
# Ubuntu/Debian
sudo apt-get install libsndfile1

# macOS
brew install libsndfile

# Windows
# Inclus dans soundfile pip package
```

### Erreur mémoire avec fichiers volumineux

Réduire la taille des fichiers ou augmenter la mémoire disponible.

## 📞 Support

Pour toute question ou problème, ouvrir une issue sur GitHub.

## 🚀 Prochaines étapes

1. Tester localement
2. Déployer sur Railway/Render
3. Connecter au frontend Hono
4. Ajouter bouton "Analyze" dans l'UI
5. Afficher résultats avec graphiques
