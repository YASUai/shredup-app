# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SHRED UP** is a music practice SaaS app featuring a metronome with real-time pitch detection. The frontend is a Hono/TypeScript app deployed to Cloudflare Pages; the backend is a Python FastAPI service deployed to Railway.app.

## Commands

### Frontend (root directory)
```bash
npm run dev          # Vite dev server (hot reload)
npm run build        # Vite build → dist/
npm run deploy       # build + wrangler deploy to Cloudflare Pages
npm run dev:sandbox  # wrangler pages dev (Cloudflare Workers runtime simulation)
```

### Backend (backend/ directory)
```bash
pip install -r requirements.txt   # Install Python dependencies
uvicorn main:app --reload          # Dev server at http://localhost:8000
# Swagger UI: http://localhost:8000/docs
python test_api.py                 # Run API tests
```

No test runner is configured for the frontend (the `test` script is just a curl health check).

## Architecture

### Frontend Stack
- **Framework:** Hono (JSX-based server-side routing, runs on Cloudflare Workers)
- **Entry point:** `src/index.tsx` — defines all routes, renders HTML shells
- **Build:** Vite + `@hono/vite-build` targeting Cloudflare Pages (`dist/`)
- **Client-side logic:** Vanilla JavaScript in `public/static/` (NOT bundled by Vite — served as static files)
- **Styling:** TailwindCSS via CDN

### Backend Stack
- **Framework:** Python FastAPI, deployed via Docker on Railway
- **Key lib:** Librosa (BPM + pitch analysis) — has a slow cold start (~60s+)
- **Endpoints:** `POST /api/audio/analyze-bpm`, `POST /api/audio/analyze-pitch`, `GET /health`
- **Live URL:** `https://npx-railwaycli-up-production.up.railway.app` (hardcoded in `src/api.ts`)

### Key Architectural Patterns

**Static files vs. server-rendered routes:**
`src/index.tsx` serves as a thin router — most app logic lives in `public/static/`. Routes like `/tuner` simply redirect to `/static/tuner/index.html`. The Hono server is essentially a static file host with a few redirect routes.

**Inter-iframe communication:**
The metronome runs inside an `<iframe>`. `public/static/app.js` captures keyboard shortcuts and uses `postMessage` to control the metronome. The metronome (`public/static/metronome/script.js`) listens for these messages and simulates button clicks.

**Audio pipeline (Phase 3 — real-time pitch detection):**
```
Microphone (48kHz) → Frame Buffer (512 samples) → YIN Algorithm (2048-sample window)
  → [if f < 75 Hz] Low Frequency Specialist (harmonic ratio correction)
  → Octave Consistency Stabilizer (harmonic locking, 5-frame temporal window)
  → Output: frequency (Hz) + confidence (0–1)
```
Key files: `public/static/audio-engine/dsp/pitch-detection.js` (YIN), `octave-consistency-stabilizer.js`, `low-frequency-specialist.js`

**Backend integration (Phase 4 — tuner):**
`public/static/tuner/backend-integration.js` contains `BackendAudioAnalyzer` — records audio via `MediaRecorder`, POSTs to Railway backend, returns pitch/BPM results. `src/api.ts` is a thin TypeScript wrapper used from server-side routes.

### Deployment
- **Frontend:** `npm run deploy` → Cloudflare Pages. Config in `wrangler.jsonc`.
- **Backend:** Docker on Railway. Config in `backend/Dockerfile`. The `backend/railway.toml` was removed to use Railway defaults (see recent commits).
- **Local full-stack:** Frontend on port 3000, backend on port 8000.
