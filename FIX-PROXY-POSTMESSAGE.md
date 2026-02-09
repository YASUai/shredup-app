# 🎯 CORRECTION APPLIQUÉE - Proxy postMessage

## ❌ PROBLÈME TROUVÉ

**Double iframe** : SHRED UP → `/metronome-scaled` (proxy) → Métronome 7777

**Conflit de listeners** : Le proxy avait **DEUX** `window.addEventListener('message')` qui se bloquaient mutuellement !

```javascript
// ❌ AVANT - DEUX listeners séparés
window.addEventListener('message', (event) => {
    // Forward vers iframe
    metronomeIframe.contentWindow.postMessage(event.data, '*');
});

window.addEventListener('message', (event) => {
    // Forward vers parent
    window.parent.postMessage(event.data, '*');
});
```

**Résultat** : Les messages TAP_CLICK étaient bloqués ou perdus dans le proxy !

---

## ✅ CORRECTION APPLIQUÉE

**UN SEUL listener** avec logique conditionnelle :

```javascript
// ✅ APRÈS - UN listener intelligent
window.addEventListener('message', (event) => {
    console.log('[PROXY] Message reçu:', event.data);
    
    const metronomeIframe = document.querySelector('.metronome-iframe');
    
    // Si message du parent → forward vers métronome
    if (event.source === window.parent && metronomeIframe && metronomeIframe.contentWindow) {
        console.log('[PROXY] Forward vers métronome:', event.data);
        metronomeIframe.contentWindow.postMessage(event.data, '*');
    }
    // Si message du métronome → forward vers parent
    else if (event.source === metronomeIframe?.contentWindow && window.parent !== window) {
        console.log('[PROXY] Forward vers parent:', event.data);
        window.parent.postMessage(event.data, '*');
    }
});
```

---

## 🎯 POURQUOI ÇA MARCHE MAINTENANT

### **AVANT (conflit)**
```
AltGr → app.js postMessage
         ↓
      /metronome-scaled
         ├─ Listener 1 : Forward vers métronome ✅
         └─ Listener 2 : Forward vers parent ❌ (conflit)
            ↓
         Message perdu ou bloqué ❌
```

### **APRÈS (intelligent)**
```
AltGr → app.js postMessage
         ↓
      /metronome-scaled
         └─ UN listener :
            - Détecte source = parent
            - Forward vers métronome ✅
         ↓
      Métronome reçoit TAP_CLICK ✅
         ↓
      Son joué + BPM calculé ✅
```

---

## 🧪 TEST APRÈS CORRECTION

1. **Ouvrir** : https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai
2. **Console (F12)** pour voir les logs `[PROXY]`
3. **Refresh** : Ctrl+Shift+R
4. **AltGr ×4** immédiatement
5. **Vérifier** :
   - Logs : `[PROXY] Message reçu: {action: "TAP_CLICK"}`
   - Logs : `[PROXY] Forward vers métronome: {action: "TAP_CLICK"}`
   - Son audible dès le premier AltGr ✅
   - BPM calculé après 2e AltGr ✅

---

## 📊 RÉSULTAT ATTENDU

| Action | AVANT | APRÈS |
|--------|-------|-------|
| **AltGr (1er)** | Silence ❌ | Son ✅ |
| **AltGr (2e)** | Silence ❌ | Son + BPM ✅ |
| **Clic TAP direct** | Son ✅ | Son ✅ |

**UNIFORMITÉ PARFAITE** 🎉

---

## 🔗 URLS

- **SHRED UP** : https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai
- **Métronome** : https://7777-iopksqtiphh7vk63ml8pt-c07dda5e.sandbox.novita.ai/

---

## ✅ MODIFICATIONS

- **Fichier** : `/home/user/webapp/src/index.tsx`
- **Lignes** : 61-74 et 134-147 (2 occurrences corrigées)
- **Changement** : 2 listeners → 1 listener intelligent
- **Build** : 53.45 kB
- **Commit** : 13e028a

---

## 🎉 CONCLUSION

Le problème n'était **NI dans le métronome NI dans app.js**, mais dans le **proxy `/metronome-scaled`** qui avait des listeners en conflit !

**Teste maintenant et confirme que TAP fonctionne dès le premier AltGr !** 🚀
