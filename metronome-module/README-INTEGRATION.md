# 🎯 METRONOME MODULE SAAS - INTÉGRATION 400×725px

## 📦 Contenu du module

Ce dossier contient le **métronome SHRED-UP v31** adapté pour intégration SaaS dans un conteneur de **400×725px**.

---

## 📁 Structure des fichiers

```
metronome-module/
├── index-saas.html          # Version SaaS avec wrapper 400×725px
├── saas-wrapper.css         # Container queries (vw/vh → cqw/cqh)
├── index.html               # Version originale (référence)
├── styles.css               # Styles originaux du métronome
├── script.js                # Logique métronome complète
├── ui-click.mp3             # Son UI click
├── Conthrax-SemiBold.otf    # Police de caractères
└── README-INTEGRATION.md    # Ce fichier
```

---

## 🚀 Test du module isolé

### URL de test directe :
```
https://8888-idisowycqqgdrvtdl8cr9-8f57ffe2.sandbox.novita.ai/index-saas.html
```

### Résultat attendu :
- ✅ **Fond rouge** autour du module (indique l'espace hors conteneur)
- ✅ **Bordure verte** de 5px (limite du conteneur 400×725px)
- ✅ **Métronome complet** à l'intérieur
- ✅ **Dimensions exactes** : 400px × 725px

---

## 🔧 Intégration dans SHRED-UP-APP

### Option 1 : IFRAME (recommandé)

```html
<iframe 
    src="/metronome-module/index-saas.html" 
    width="400" 
    height="725"
    frameborder="0"
    style="border: none; overflow: hidden;">
</iframe>
```

**Avantages** :
- ✅ Isolation totale CSS/JS
- ✅ Pas de conflits de styles
- ✅ Sécurité maximale

---

### Option 2 : DIV intégré (même domaine)

```html
<!-- Dans votre HTML principal -->
<div id="metronome-container"></div>

<script>
fetch('/metronome-module/index-saas.html')
    .then(res => res.text())
    .then(html => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const module = doc.querySelector('.saas-metronome-module');
        document.getElementById('metronome-container').appendChild(module);
    });
</script>
```

**Avantages** :
- ✅ Même contexte DOM
- ✅ Communication parent/enfant facile

**Inconvénients** :
- ⚠️ Risques de conflits CSS
- ⚠️ Nécessite prefix CSS strict

---

## 🎨 Personnalisation

### Retirer la bordure verte (production)

Dans `saas-wrapper.css`, décommenter la ligne :

```css
/* .saas-metronome-module { border: none !important; } */
```

Devient :

```css
.saas-metronome-module { border: none !important; }
```

---

### Changer les dimensions

Si vous voulez d'autres dimensions (ex: 500×800px) :

1. Modifier dans `saas-wrapper.css` :

```css
.saas-metronome-module {
    width: 500px !important;
    height: 800px !important;
    max-width: 500px !important;
    max-height: 800px !important;
    /* ... */
}
```

2. Les proportions internes restent correctes grâce aux **container queries** (`cqw`, `cqh`)

---

## 🔍 Vérification des dimensions

### Avec Chrome DevTools :

1. Ouvrir DevTools (F12)
2. Inspecter `.saas-metronome-module`
3. Onglet "Computed"
4. Vérifier :
   ```
   width: 400px ✅
   height: 725px ✅
   ```

---

## 🎯 Fonctionnalités incluses

- ✅ **PLAY/STOP** (lecture métronome)
- ✅ **BPM réglable** (40-250) avec slider vertical
- ✅ **Boutons +/−** (ajustement précis)
- ✅ **TAP TEMPO** (latence 0ms, feedback blanc 100ms)
- ✅ **BEAT** (temps par mesure 1-16)
- ✅ **BAR** (signature rythmique)
- ✅ **NOTE** (subdivision)
- ✅ **TIMER** (minuteur)
- ✅ **RANDOM MASKING** (masquage aléatoire)
- ✅ **SESSION DURATION** (durée session)
- ✅ **LED visuelles** (clignotement beats)
- ✅ **Son métronome** (click audio)
- ✅ **Design neumorphique dark** (#1A1A1A)

---

## 🌐 Compatibilité navigateurs

### Container Queries support :

- ✅ **Chrome** 105+ (Sept 2022)
- ✅ **Edge** 105+ (Sept 2022)
- ✅ **Safari** 16+ (Sept 2022)
- ✅ **Firefox** 110+ (Fév 2023)
- ✅ **Opera** 91+ (Oct 2022)

**Support global** : **~95%** des navigateurs modernes

Voir : https://caniuse.com/css-container-queries

---

## 📊 Architecture technique

### Principe des Container Queries

Au lieu de :
```css
.tap-btn { width: 26vw; }  /* 26% du VIEWPORT navigateur */
```

On utilise :
```css
.saas-metronome-module .tap-btn { width: 26cqw !important; }  /* 26% du CONTENEUR */
```

**Résultat** : Le métronome s'affiche TOUJOURS de la même façon, peu importe la taille de l'écran parent.

---

## 🐛 Troubleshooting

### Le métronome déborde du conteneur

**Cause** : Les container queries ne sont pas appliquées.

**Solution** :
1. Vérifier que `saas-wrapper.css` est bien chargé APRÈS `styles.css`
2. Vérifier la compatibilité du navigateur (voir section ci-dessus)

---

### Les boutons ne fonctionnent pas

**Cause** : Le fichier `script.js` n'est pas chargé.

**Solution** :
```html
<script src="script.js?v=20260206-11"></script>
```

Vérifier le chemin relatif depuis votre page d'intégration.

---

### Le son ne marche pas

**Cause** : Le fichier `ui-click.mp3` n'est pas trouvé.

**Solution** :
Vérifier que tous les assets sont accessibles :
```
/metronome-module/
├── ui-click.mp3
├── Conthrax-SemiBold.otf
└── ...
```

---

## 📝 Changelog

### v1.0 - 2026-02-08
- ✅ Création du module SaaS 400×725px
- ✅ Container queries (conversion vw/vh → cqw/cqh)
- ✅ Isolation complète avec bordures debug
- ✅ Intégration depuis METRONOME-OK-01022026 v31
- ✅ Toutes fonctionnalités préservées

---

## 🔗 Liens utiles

- **Métronome standalone** : https://github.com/YASUai/METRONOME-OK-01022026
- **SHRED-UP-APP** : https://github.com/YASUai/shredup-app
- **Container Queries Doc** : https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_container_queries

---

## 👨‍💻 Support

Pour toute question sur l'intégration, consultez ce README ou testez la version isolée :

**https://8888-idisowycqqgdrvtdl8cr9-8f57ffe2.sandbox.novita.ai/index-saas.html**

---

**Version** : 1.0  
**Date** : 2026-02-08  
**Status** : ✅ Production Ready
