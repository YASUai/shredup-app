# ⚡ FIX ULTRA-RAPIDE - Background 100%

**Copie-colle ce message dans l'autre discussion (métronome)** :

---

**PROBLÈME** : Background ne remplit pas 100% (bordures blanches)

**CAUSE** : `position: fixed` manquante dans le CSS du body

**SOLUTION RAPIDE** :

Dans `styles.css`, **AJOUTER** ces lignes dans la règle `body {` :

```css
body {
    /* ✅ AJOUTER CES LIGNES */
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    
    /* Garder le reste tel quel */
    width: 100%;
    height: 100%;
    background-size: 100% 100%; /* ← Vérifier cette ligne aussi */
    /* ...reste du CSS... */
}
```

**CODE COMPLET** :

```css
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    
    width: 100%;
    height: 100%;
    min-height: 100%;
    
    background: linear-gradient(180deg, 
        #141414 0%, 
        #161616 15%, 
        #181818 30%, 
        #1a1a1a 45%, 
        #1b1b1b 50%, 
        #1a1a1a 55%, 
        #181818 70%, 
        #161616 85%, 
        #141414 100%
    );
    background-attachment: fixed;
    background-size: 100% 100%;
    background-repeat: no-repeat;
    
    margin: 0;
    padding: 0;
    overflow: hidden;
}
```

**TESTER** :

```bash
# Pas besoin de rebuild !
# Juste vider le cache du navigateur :
# Ctrl+Shift+R (Chrome/Edge)
# Cmd+Shift+R (Mac)
```

**COMMIT** :

```bash
git add styles.css
git commit -m "fix: add position fixed to body for 100% background"
```

**Confirme "Background OK !" quand c'est fait !**

---

# 🧪 COMMENT TESTER

1. Ouvre SHRED UP : https://3000-idctbiclmksbnv76p5d4y-02b9cc79.sandbox.novita.ai
2. Force le rechargement : **Ctrl+Shift+R**
3. Vérifie : **plus de bordures blanches** en haut/bas

---

# ✅ RÉSULTAT ATTENDU

- Gradient remplit **toute** la zone 400×800
- **Zéro** bordure blanche
- Transition fluide du gradient
