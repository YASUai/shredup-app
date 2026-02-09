# 🎯 SCALE -10% À APPLIQUER DANS LE MÉTRONOME

**Problème** : Le contenu du métronome est trop grand maintenant (taille originale 414×896)

**Solution** : Appliquer le scale -10% **dans le métronome** au lieu de l'iframe

---

## 📋 COPIE-COLLE DANS L'AUTRE DISCUSSION (Métronome port 7777)

---

**OBJECTIF** : Réduire le contenu du métronome de 10% et le centrer

**SOLUTION** : Ajouter un scale sur `.metronome-container` dans `styles.css`

### Code à ajouter dans `styles.css` :

```css
.metronome-container {
    position: relative;
    width: 100%;
    height: 100%;
    
    /* 🎯 SCALE -10% + CENTRAGE */
    transform: scale(0.9);
    transform-origin: center center;
    
    /* Reste du CSS inchangé */
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
    background-attachment: scroll;
    background-size: 100% 100%;
    background-repeat: no-repeat;
    
    margin: 0;
    padding: 0;
}
```

### Explication

**Calcul du scale** :
- Métronome original : 414×896
- Conteneur SHRED UP : 400×800
- Ratio : 400/414 ≈ 0.9662
- Réduction -10% : 0.9662 × 0.9 = **0.8696** (mais on utilise 0.9 pour simplifier)

**Pourquoi ça marche** :
- Le `body` remplit l'iframe 400×800 avec son background
- Le `.metronome-container` est scale(0.9) → réduit visuellement à ~360×720
- Le container reste centré grâce à `transform-origin: center center`
- Le background du `body` remplit toujours 100% (pas de bordures blanches)

### Résultat attendu

```
┌────────────────────────────────┐
│ body (400×800) background #141 │
│  ┌──────────────────────────┐  │
│  │ .metronome-container     │  │
│  │ scale(0.9) → ~360×720    │  │
│  │ ┌────────────────────┐   │  │
│  │ │   Boutons          │   │  │
│  │ │   BPM: 101         │   │  │
│  │ │   Controls         │   │  │
│  │ └────────────────────┘   │  │
│  └──────────────────────────┘  │
└────────────────────────────────┘
```

### Pas besoin de rebuild !

Les modifications CSS sont appliquées immédiatement. Juste :

```bash
# Forcer le rechargement dans le navigateur
# Ctrl+Shift+R (Chrome/Edge)
# Cmd+Shift+R (Mac)
```

### Commit

```bash
git add styles.css
git commit -m "feat: scale metronome-container -10% for better fit"
```

---

**Confirme "Scale OK !" quand c'est fait !**

---

## 🎯 ALTERNATIVE : Calcul précis

Si tu veux un scale **plus précis** pour remplir exactement l'espace :

```css
.metronome-container {
    /* Scale précis pour 400×800 depuis 414×896 */
    transform: scale(0.8696); /* = (400/414 + 800/896) / 2 × 0.9 */
    transform-origin: center center;
}
```

Mais **0.9** est plus simple et donne un peu de marge.

---

## ✅ RÉSULTAT FINAL

- ✅ Background remplit 100% (pas de bordures blanches)
- ✅ Contenu réduit de 10% et centré
- ✅ Latence 0ms conservée
- ✅ Raccourcis clavier fonctionnels
