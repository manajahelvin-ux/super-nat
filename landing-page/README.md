# Super-Nat — Landing Page SaaS sur-mesure

Landing page statique (HTML/CSS/JS natifs) pour un freelance qui conçoit et développe des **applications / plateformes SaaS sur-mesure** (desktop ou web).  
Objectif : **collecter des leads qualifiés** via un formulaire relié à Google Sheets (sans backend), en mettant en avant l'argument central **« 15 jours d'essai gratuit, sans aucun paiement »** — le choix entre achat unique et abonnement n'est décidé qu'après l'essai.

> Aucun framework, aucun bundler, aucune dépendance npm. Ouvrez `index.html` directement dans un navigateur : tout fonctionne.

---

## Aperçu

| Élément | Détail |
|---|---|
| **Hébergement** | 100 % statique (Render Static Site, Netlify, Vercel Static, GitHub Pages…) |
| **Formulaire** | `fetch()` POST vers Google Apps Script Web App → Google Sheet |
| **Responsive** | Mobile-first, testé 320 px → 1440 px |
| **Accessibilité** | Labels, `alt`, contrastes AA, navigation clavier, `aria-live` |
| **Design** | Sombre minimal, inspiré Linear / Vercel / Arc |

---

## Structure des fichiers

```
landing-page/
├── index.html          # Structure sémantique complète (8 sections)
├── style.css           # Design system + responsive
├── script.js           # Validation, envoi Apps Script, animations scroll, nav mobile
├── img/
│   ├── logo.svg                # Logo (placeholder, remplaçable)
│   ├── hero-illustration.svg   # Illustration hero (dashboard abstrait)
│   └── avatar-placeholder.svg  # Avatar témoignages
├── apps-script/
│   └── Code.gs         # Code Google Apps Script à coller (doPost)
├── README.md           # Ce fichier
└── .gitignore
```

Le dossier `landing-page/` est **autonome** : vous pouvez le déployer tel quel (publish directory = `landing-page`) ou copier son contenu à la racine du repo si vous préférez.

---

## Décisions de design — expliquées

### Accroche choisie

> **« Arrêtez d'adapter votre entreprise à votre logiciel. »**

**Pourquoi ce choix :**

- **Orientée résultat business**, pas technique. Elle nomme la douleur immédiate (le logiciel générique qui impose ses cases) plutôt que la solution.
- **Inversée et mémorable** : elle fait écho au quotidien du prospect (plutôt que « un SaaS sur-mesure », vague), et prépare la promesse qui suit en sous-titre : *« Je conçois l'application qui épouse vos processus »*.
- **Cohérente avec l'essai gratuit** : si le logiciel s'adapte à l'entreprise, il faut l'essayer en conditions réelles — d'où la transition naturelle vers les 15 jours sans paiement.

Variantes écartées : « Votre métier est unique… » (trop générique / déjà vu), « Un SaaS à votre image » (trop centré produit, pas assez douleur).

Sous-titre figé :
> « Je conçois et développe votre application SaaS sur-mesure — desktop ou web — qui épouse exactement vos processus. Pas de compromis, pas de fonctionnalités inutiles. Juste votre outil, enfin à votre image. »

### Palette exacte

Choix d'un **sombre neutre chaud** (pas de noir pur, pas de bleu) pour évoquer le premium / outil pro (Linear, Vercel) tout en restant lisible longtemps.

| Rôle | Variable CSS | Hex | Usage |
|---|---|---|---|
| Fond page | `--bg` | `#08080A` | `body` |
| Fond doux | `--bg-soft` | `#0F0F11` | Sections alternées |
| Surface cartes | `--bg-card` | `#17171A` | Cards, formulaire |
| Surface hover | `--bg-card-hover` | `#1E1E22` | Hover cards |
| Bordure | `--border` | `#232326` | Bordures par défaut |
| Bordure hover | `--border-hover` | `#2E2E32` | Hover |
| Texte primaire | `--text-primary` | `#FAFAFA` | Titres, corps |
| Texte secondaire | `--text-secondary` | `#A1A1AA` | Sous-titres, descriptions |
| Texte atténué | `--text-muted` | `#71717B` | Métadonnées, footnotes |
| Accent CTA | `--accent` | `#FFFFFF` | Bouton principal (fond blanc, texte `#09090B`) |
| Accent hover | `--accent-hover` | `#E4E4E7` | Hover CTA |
| Violet discret | `--violet` | `#8B5CF6` | Badge « Le plus choisi », glows |
| Succès | `--success` | `#22C55E` | Points, confirmations |

**Contrastes** : tous les couples texte/fond respectent WCAG AA (ex. `#FAFAFA` sur `#08080A` = 19.5:1, `#A1A1AA` sur `#08080A` = 8.2:1). Les CTA blancs sur fond sombre sont au contraste maximal, avec états `hover`/`focus` visibles (bordure + `box-shadow` + `outline`).

**Rayons** : `8 / 12 / 16 / 20` px — cohérence « macOS » (cartes `16–20`, boutons `9999` pilule).  
**Ombres** : très subtiles (`0 1px 2px` + `0 8px 24px` à 35 % noir) pour détacher les cartes sans effet « néon ».

### Typographie

- **Inter** (Google Fonts, `400 / 500 / 600 / 700 / 800`) — sans-serif géométrique, standard Linear/Vercel, excellente lisibilité à petites tailles. Chargée via `<link>` avec `preconnect`.
- **JetBrains Mono** (`400 / 500`) — pour les métadonnées (`eyebrow`, badges, numéros d'étapes, stack). Apporte la touche « outil dev » sans surcharger.
- Système de secours : `system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif` (aucun FOIT bloquant).

Tailles fluides avec `clamp()` (hero `32 → 52 px`, sections `26 → 36 px`), interlignage `1.6` corps / `0.95–1.15` titres, `letter-spacing` négatif sur les titres (`-0.04em`) pour le côté éditorial premium.

### Principes d'interaction

- **CTA à fort contraste** : fond blanc, texte noir, `border-radius: 9999px`, ombre douce. `hover` → `#E4E4E7`, `active` → léger `scale(0.99)`, `focus-visible` → `outline` blanc.
- **Animations scroll discrètes** : `fade-in + translateY(14px)` en 600 ms, déclenchées par `IntersectionObserver` à 12 % de visibilité. Désactivées si `prefers-reduced-motion: reduce`.
- **Cartes** : `hover` = bordure un peu plus claire + fond légèrement éclairci, pas de lift agressif.
- **Mobile-first** : une seule colonne par défaut, `grid` à 2/3/4 colonnes à partir de 768 px. Header sticky avec fond flou (`backdrop-filter: blur(16px)`).

---

## Installation locale (aperçu)

Aucune installation. Dézippez / clonez et ouvrez :

```bash
# Option 1 : ouverture directe
open landing-page/index.html        # macOS
xdg-open landing-page/index.html    # Linux
start landing-page/index.html       # Windows

# Option 2 : petit serveur local (recommandé pour tester le fetch)
npx serve landing-page              # si vous avez Node, sinon :
python3 -m http.server --directory landing-page 8000
# puis http://localhost:8000
```

---

## Intégration Google Sheet (sans backend) — Étapes détaillées

> Temps estimé : 6 minutes. Aucun code à écrire, juste copier-coller.

### Étape 1 — Créer la Google Sheet

1. Allez sur [sheets.google.com](https://sheets.google.com) → **Feuille de calcul vierge**.
2. Renommez-la (ex. `Leads — Super-Nat`).
3. Dans la première ligne (ligne 1), créez exactement ces en-têtes, dans cet ordre :

| A | B | C | D | E | F | G | H | I | J |
|---|---|---|---|---|---|---|---|---|---|
| Horodatage | Nom complet | Email | Entreprise | Type d'application | Mode envisagé | Budget | Description du besoin | Source | User-Agent |

> Le script peut aussi créer la feuille et les en-têtes automatiquement s'ils manquent, mais les créer à la main évite toute ambiguïté.

4. Optionnel : figez la ligne 1 (Affichage → Figer → 1 ligne), ajustez la largeur des colonnes.

### Étape 2 — Coller le script Apps Script

1. Dans la Sheet : **Extensions → Apps Script**. Un nouvel onglet s'ouvre.
2. Supprimez le contenu par défaut de `Code.gs`.
3. Ouvrez `landing-page/apps-script/Code.gs` dans ce repo, **copiez tout le fichier** et **collez-le** dans l'éditeur Apps Script.
4. Vérifiez les deux constantes en haut du fichier :
   ```js
   const SPREADSHEET_ID = ""; // laissez vide si le script est lié à la Sheet (recommandé)
   const SHEET_NAME = "Leads";
   ```
   - Si le script a été ouvert depuis la Sheet (Extensions → Apps Script), laissez `SPREADSHEET_ID = ""`.
   - Si vous avez créé le script depuis [script.google.com](https://script.google.com) (script autonome), copiez l'ID de la Sheet (dans l'URL : `https://docs.google.com/spreadsheets/d/<ID>/edit`) et collez-le entre les guillemets.
5. Cliquez sur **Enregistrer** (icône disquette).

### Étape 3 — Déployer en Web App

1. Dans l'éditeur Apps Script, cliquez sur **Déployer → Nouveau déploiement**.
2. Cliquez sur l'icône roue dentée à côté de « Sélectionner le type » → **Application web**.
3. Configurez :
   - **Description** : `Leads Super-Nat v1`
   - **Exécuter en tant que** : `Moi` (votre compte Google)
   - **Qui a accès** : **`Tout le monde`** (Anyone) — **indispensable**, sinon le formulaire sera bloqué par une page de connexion Google.
4. Cliquez sur **Déployer**.
5. Autorisez l'accès si Google le demande (Compte → Autoriser → Avancé → Accéder à…).
6. Copiez l'**URL de l'application web** affichée (format `https://script.google.com/macros/s/AKfycb.../exec`). C'est votre `GOOGLE_SCRIPT_URL`.

> **Test rapide** : collez cette URL dans un navigateur. Vous devez voir `{"ok":true,"message":"Super-Nat Leads Web App en ligne..."}`. Si vous voyez une page de connexion Google, le déploiement n'est pas en « Anyone » — corrigez le paramètre.

### Étape 4 — Coller l'URL dans la landing page

1. Ouvrez `landing-page/script.js`.
2. Tout en haut, remplacez :

   ```js
   const GOOGLE_SCRIPT_URL = "COLLER_ICI_APRES_DEPLOIEMENT";
   ```

   par :

   ```js
   const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/VOTRE_ID/exec";
   ```

3. Enregistrez. **Redéployez** la landing page (push Git → Render se met à jour automatiquement).

> **Mode démo** : tant que l'URL vaut `COLLER_ICI…`, le formulaire fonctionne en mode démo (message de succès simulé après ~900 ms, log dans la console). Aucune donnée n'est envoyée à Google. Dès que l'URL est configurée, l'envoi réel est activé.

### Test de bout en bout

1. Ouvrez la landing page (locale ou déployée).
2. Remplissez le formulaire et envoyez.
3. Retournez dans la Google Sheet : une nouvelle ligne doit apparaître en quelques secondes.
4. En cas d'erreur : ouvrez la console du navigateur (F12) et les **Exécutions** dans Apps Script (à gauche dans l'éditeur) pour voir les logs.

### Sécurité & confidentialité

- Le Web App en « Anyone » est nécessaire pour que des visiteurs non connectés puissent poster. Le script **n'expose aucune donnée** en lecture (seul `doPost` écrit, `doGet` renvoie un message statique).
- Pour limiter le spam : un champ honeypot est présent (`website` caché). Le script valide aussi côté serveur (email, champs requis) et utilise `LockService` pour éviter les écritures concurrentes.
- Pour aller plus loin : ajoutez un quota, un CAPTCHA (hCaptcha/Cloudflare Turnstile) ou filtrez par domaine email.

---

## Git + GitHub — Commandes exactes

Le repo est déjà initialisé avec un commit initial. Pour le pousser sur GitHub :

```bash
# Depuis la racine du repo (là où se trouve landing-page/)
git remote -v
# Si aucun remote n'est configuré, ajoutez-le (remplacez <URL_DU_REPO>) :
git remote add origin <URL_DU_REPO>
# Exemple : git remote add origin https://github.com/votre-utilisateur/super-nat.git

# Vérifiez la branche
git branch --show-current
# => arena/01a0a6ca-super-nat  (ou main selon votre choix)

# Poussez
git push -u origin arena/01a0a6ca-super-nat
# Si vous voulez que main soit la branche principale sur GitHub :
# git push -u origin arena/01a0a6ca-super-nat:main
```

> Remplacez `<URL_DU_REPO>` par l'URL affichée par GitHub après « Create repository » (en HTTPS ou SSH).  
> Si `git remote add` échoue avec « remote origin already exists », faites `git remote set-url origin <URL_DU_REPO>` puis `git push`.

---

## Déploiement Render (Static Site)

### Création du service

1. Allez sur [dashboard.render.com](https://dashboard.render.com) → **New + → Static Site**.
2. Connectez votre repo GitHub (`super-nat`).
3. Configurez :
   - **Name** : `super-nat` (ou autre)
   - **Branch** : `arena/01a0a6ca-super-nat` (ou `main` si vous avez poussé dessus)
   - **Root Directory** : `landing-page` ← **important**
   - **Build Command** : *(laissez vide)* — aucun build nécessaire
   - **Publish Directory** : *(laissez vide ou `.`)* — car Root Directory pointe déjà vers `landing-page`. Si vous avez mis Root Directory vide, alors Publish Directory = `landing-page`.
4. Cliquez sur **Create Static Site**. Le premier déploiement se lance.

### Rappel avant déploiement

> **Ajoutez l'URL Apps Script dans `script.js` AVANT de déployer** (voir Étape 4 ci-dessus), sinon le formulaire restera en mode démo en production. Si vous l'avez oublié, modifiez `script.js`, `git commit -am "config: ajout GOOGLE_SCRIPT_URL" && git push` — Render redéploie automatiquement.

### Domaine personnalisé (optionnel)

Dans Render → votre Static Site → **Settings → Custom Domains** → ajoutez `www.votre-domaine.fr` et suivez les instructions DNS.

### Alternatives

Tout hébergement statique convient : **Netlify** (drag & drop du dossier), **Vercel**, **Cloudflare Pages**, **GitHub Pages** — même principe : Build Command vide, dossier publié = `landing-page`.

---

## Personnalisation rapide

| Élément | Où modifier |
|---|---|
| Textes, titres, offres | `index.html` (cherchez les sections commentées) |
| Couleurs, espacements, rayons | `:root` en haut de `style.css` |
| Illustration hero | `img/hero-illustration.svg` (ou remplacez `<img>` dans le hero) |
| Logo | `img/logo.svg` + `.logo__text` dans `index.html` |
| Coordonnées footer | `index.html` → `<footer>` (email, téléphone, réseaux) |
| Stack / témoignages / logos | `index.html` → section `#confiance` (placeholders commentés) |
| Champs formulaire | `index.html` + `script.js` (`payload`) + `Code.gs` (`HEADERS` + mapping) |
| URL Google Sheet | `script.js` (`GOOGLE_SCRIPT_URL`) + `Code.gs` (`SPREADSHEET_ID` si script autonome) |

---

## Checklist Definition of Done

- [x] Tous les fichiers de la structure existent et sont non vides
- [x] Formulaire avec les 7 champs listés + validation HTML5 + JS
- [x] CTA « essai gratuit 15 jours » présent 4 fois (header, hero, deux offres, formulaire)
- [x] Aucune mention d'« automatisation » ou d'offre autre que SaaS sur-mesure
- [x] Fonctionne sans build (ouverture directe d'`index.html`)
- [x] README déployable par un non-développeur
- [x] Commit git initial effectué

---

## Licence

Projet fourni tel quel pour le besoin Super-Nat. Adaptez librement.

---

Fait avec soin à Lyon. 15 jours d'essai gratuit, sans paiement — même pour cette landing page.
