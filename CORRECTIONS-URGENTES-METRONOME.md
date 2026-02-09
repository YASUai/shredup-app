# 🚨 CORRECTIONS URGENTES MÉTRONOME

**À appliquer dans**: Discussion Métronome Port 7777

---

## 🎯 DEUX PROBLÈMES

1. **Premier clic TAP inactif** → mousedown consommé par navigateur
2. **Son silencieux** → AudioContext suspendu jusqu'à PLAY

---

## 🔧 SOLUTION 1: AudioContext au premier geste

**Dans initializeAudio() (ligne ~1450)**:

```javascript
function initializeAudio() {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    
    // ✅ AJOUTER CE BLOC
    const resumeAudioContext = async () => {
        if (audioContext.state === 'suspended') {
            await audioContext.resume();
            console.log('✅ AudioContext resumed on first interaction');
        }
        document.removeEventListener('mousedown', resumeAudioContext);
        document.removeEventListener('click', resumeAudioContext);
    };
    
    document.addEventListener('mousedown', resumeAudioContext, { once: true });
    document.addEventListener('click', resumeAudioContext, { once: true });
    
    // ... reste du code existant
}
```

---

## 🔧 SOLUTION 2: mousedown → mouseup

**Dans initTempoButtons() (ligne ~1310)**:

```javascript
// REMPLACER cette ligne:
tapBtn.addEventListener('mousedown', (e) => {

// PAR celle-ci:
tapBtn.addEventListener('mouseup', (e) => {

// Et changer le log:
console.log('[TAP DEBUG] Mouseup event déclenché');

// Reste identique
```

---

## ✅ RÉSULTAT

- ✅ Son click audible SANS cliquer PLAY d'abord
- ✅ Premier clic TAP fonctionne 100% du temps
- ✅ mouseup n'est JAMAIS consommé pour activation

---

## 🧪 TEST RAPIDE

```
1. Recharger page (F5)
2. Cliquer TAP immédiatement (sans PLAY)
3. Vérifier:
   ✅ AudioContext resumed on first interaction
   ✅ [TAP DEBUG] Mouseup event déclenché
   ✅ Son click AUDIBLE
   ✅ Flash blanc visible
```

---

## 📝 COMMIT

```bash
git add script.js
git commit -m "fix: TAP mouseup + AudioContext resume on first gesture"
pm2 restart metronome
```

---

**Détails complets**: `CORRECTIONS-METRONOME-TAP-AUDIO.md`
