# Atelier — landing page SaaS sur-mesure

Landing page en français pour un **développeur indépendant**. HTML, CSS et JavaScript natifs, sans framework, sans npm et sans compilation. Compatible avec Render Static Site. Le formulaire transmet un JSON à Google Apps Script, qui ajoute une ligne dans une feuille Google Sheets privée.

> **État de livraison :** les fichiers du site et le collecteur sont fournis. La connexion Google et la publication Render nécessitent les étapes ci-dessous depuis vos comptes. Aucun service distant n’a été créé dans cet environnement, faute d’accès Google/Render. L’URL Apps Script reste volontairement un placeholder : le formulaire affiche une erreur explicite tant qu’elle n’est pas renseignée, jamais un faux succès. Un aperçu local n’est pas un déploiement Render.

## 1. Ce que vous avez

```text
landing-page/
├── index.html              # Contenu, navigation et formulaire
├── style.css               # Design system et responsive
├── script.js               # Validation, envoi et animations
├── img/
│   ├── mark.svg            # Symbole Atelier
│   ├── activity.svg        # Courbe illustrative
│   └── workshop.svg        # Pictogramme de développement
├── apps-script/
│   └── Code.gs             # À coller dans Google Apps Script
├── README.md
└── .gitignore
```

**Contrat commercial conservé :** applications/plateformes SaaS sur-mesure, web ou desktop ; achat avec paiement unique ou abonnement mensuel géré. L’application est testée **15 jours gratuitement, sans carte ni aucun paiement**. Le mode, le tarif et les conditions ne sont discutés et confirmés qu’à l’issue de l’essai. Le radio du formulaire est une indication facultative, pas une commande.

L’envoi du formulaire est une **demande de prise de contact**, pas l’ouverture immédiate d’un accès. Après échange et développement, les 15 jours commencent à la mise à disposition de la version d’essai. Le périmètre de développement, le calendrier, les conditions de l’essai, la livraison et l’étendue des évolutions doivent être cadrés ensemble. Aucun achat ni abonnement ne démarre sans accord explicite après l’essai.

## 2. Voir la page sur votre ordinateur

- Ouvrez `landing-page/index.html` dans votre navigateur. Toute la page fonctionne sans compilation. JavaScript est nécessaire pour l’envoi du formulaire.
- Ou, si Python est installé, depuis la racine du dépôt :

```bash
python3 -m http.server 8000 --bind 0.0.0.0 --directory landing-page
```

Ouvrez `http://localhost:8000` **sur le même ordinateur**. Dans Arena, utilisez le lien d’aperçu fourni par la plateforme, pas `localhost` sur votre appareil. Ce serveur sert uniquement les fichiers ; il ne constitue pas un backend applicatif.

Le JavaScript du site ne référence jamais `localhost`. Tous les assets sont locaux et les ancres utilisent des URLs relatives. L’ouverture en `file://` affiche bien la page ; pour le test final de l’envoi, préférez HTTPS sur Render car les politiques navigateur/Google peuvent restreindre une origine locale `null`.

## 3. Personnaliser avant publication commerciale

1. Dans `index.html`, remplacez le nom de présentation **Atelier** par votre identité/marque réelle si nécessaire (titre, logo texte, pied de page, mentions légales).
2. Remplacez **toutes** les occurrences de `bonjour@example.com`, y compris le `mailto:`, ainsi que `[email réel]`, `[nom…]` et les autres crochets des mentions légales et de la confidentialité.
3. Renseignez votre identité légale, statut, adresse professionnelle, identifiant d’entreprise, TVA si applicable, téléphone et directeur de publication. Vérifiez et complétez les coordonnées légales de Render à partir de son site officiel. Le modèle n’est pas une garantie de conformité juridique pour toutes les juridictions.
4. Remplacez le texte des réseaux par vos vrais liens LinkedIn/GitHub, par exemple `<a href="https://github.com/VOTRE_COMPTE">GitHub</a>`. Aucun faux profil n’est fourni.
5. La section de confiance contient **trois emplacements de logos et un emplacement de témoignage explicitement provisoires**. Les commentaires HTML indiquent quoi remplacer. Utilisez uniquement des références réelles et autorisées, ou retirez les modules non renseignés avant publication. La stack est illustrative, à adapter aux compétences réelles.
6. L’interface du hero est une illustration réalisée en HTML/CSS/SVG ; les chiffres sont marqués **données fictives**, et ne constituent pas des résultats clients.
7. Finalisez la notice de confidentialité : responsable, adresse d’exercice des droits, prestataires, transferts éventuels et politique de conservation. La durée proposée de **12 mois après le dernier échange** implique une suppression manuelle régulière dans la feuille et ses copies éventuelles.

## 4. Créer votre Google Sheet — compte Google requis

1. Connectez-vous à votre compte Google et ouvrez **https://sheets.google.com**.
2. Cliquez sur **Vide** et nommez le fichier, par exemple **Prospects — Applications sur-mesure**.
3. Conservez le partage en **Accès limité**. Il n’est pas nécessaire de rendre la feuille publique pour recevoir des demandes.
4. Renommez l’onglet initial **Leads**, ou laissez le script créer cet onglet lors du premier envoi.
5. Laissez la feuille `Leads` vide. Le script crée les titres à la première demande valide. Si vous préférez les saisir vous-même, copiez cette ligne dans A1 (séparateurs : tabulations) :

```text
Horodatage	Nom complet	Email professionnel	Nom de l’entreprise	Type d’application souhaitée	Mode envisagé après l’essai	Budget approximatif	Description du besoin
```

| Colonne | Titre exact | Clé JSON |
|---|---|---|
| A | Horodatage | Généré côté Google, objet `Date` |
| B | Nom complet | `fullName` |
| C | Email professionnel | `email` |
| D | Nom de l’entreprise | `company` |
| E | Type d’application souhaitée | `appType` |
| F | Mode envisagé après l’essai | `collaborationMode` |
| G | Budget approximatif | `budget` |
| H | Description du besoin | `description` |

6. Copiez l’identifiant situé entre `/d/` et `/edit` dans l’adresse du fichier :
   `https://docs.google.com/spreadsheets/d/IDENTIFIANT_DE_VOTRE_FEUILLE/edit`.
7. Conservez aussi l’URL complète : c’est **votre lien Google Sheet**, accessible aux comptes que vous autorisez, pas aux visiteurs de la landing page.
8. Dans les paramètres du fichier et du projet Apps Script, choisissez votre fuseau horaire, par exemple **Europe/Paris**. Vous pouvez formater la colonne A en date et heure.

**Ne changez pas l’ordre ni l’orthographe des titres.** Le script refuse les écritures si les en-têtes ne correspondent pas, pour éviter de mélanger les colonnes.

## 5. Connecter Google Apps Script — sans serveur custom

1. Depuis la feuille : **Extensions → Apps Script**.
2. Nommez le projet **Collecteur prospects Atelier**.
3. Remplacez le contenu de `Code.gs` par celui de `landing-page/apps-script/Code.gs`.
4. Tout en haut, remplacez uniquement la valeur suivante par l’identifiant de la feuille de l’étape précédente :

```javascript
const SPREADSHEET_ID = "IDENTIFIANT_DE_VOTRE_FEUILLE";
```

5. Enregistrez. Le nom de l’onglet est fixé par `SHEET_NAME = "Leads"`.
6. Cliquez sur **Déployer → Nouveau déploiement**.
7. Sélectionnez le type **Application Web / Web app** via la roue dentée.
8. **Exécuter en tant que / Execute as : Moi / Me.**
9. **Qui a accès / Who has access : Tout le monde / Anyone**, et non « tous les utilisateurs disposant d’un compte Google ».
10. Cliquez sur **Déployer**, puis autorisez l’accès à votre feuille avec le compte propriétaire. Si Google affiche un avertissement pour un projet non vérifié que vous venez de créer, vérifiez bien qu’il s’agit de votre propre projet et suivez les indications Google. Ne contournez jamais une politique de sécurité de votre entreprise.
11. Copiez l’URL de l’**application Web** terminée par **`/exec`**, par exemple :
    `https://script.google.com/macros/s/IDENTIFIANT_DU_DEPLOIEMENT/exec`.
12. Dans `landing-page/script.js`, première ligne de configuration, remplacez :

```javascript
const GOOGLE_SCRIPT_URL = "COLLER_ICI_APRES_DEPLOIEMENT";
```

par :

```javascript
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/IDENTIFIANT_DU_DEPLOIEMENT/exec";
```

**Collez la vraie URL `/exec` AVANT le déploiement Render.** N’utilisez ni l’adresse de la feuille, ni celle de l’éditeur Apps Script, ni l’URL de test `/dev`. L’URL du collecteur est publique ; ce n’est pas une clé secrète. L’identifiant de la feuille reste dans le script exécuté chez Google, inutile de le renseigner dans le navigateur.

Certains comptes Workspace interdisent les applications publiques. Si « Anyone » n’est pas disponible, demandez à l’administrateur une solution conforme à votre organisation ; ne publiez pas la feuille pour compenser cette restriction.

### Modification ultérieure du collecteur

Après toute modification de `Code.gs` : **Déployer → Gérer les déploiements → crayon → Version : Nouvelle version → Déployer**. La simple sauvegarde ne met pas à jour la version publique. Modifier le déploiement existant conserve généralement son URL ; si vous créez un autre déploiement, mettez également à jour `GOOGLE_SCRIPT_URL` et republiez Render.

### Fonctionnement et CORS

- Le navigateur envoie un **JSON** avec `fetch`, `method: "POST"` et `Content-Type: text/plain;charset=utf-8`. Le contenu reste du JSON, parsé par `JSON.parse(e.postData.contents)`.
- Ce type de contenu évite la requête préalable `OPTIONS`, que les Web Apps Apps Script ne gèrent pas comme un serveur classique. N’ajoutez pas d’en-tête personnalisé ou `application/json` sans revoir l’intégration.
- Google ContentService redirige la réponse vers son domaine de contenu. Le navigateur suit la redirection et lit la réponse JSON en mode CORS. Les cookies Google ne sont pas transmis (`credentials: "omit"`).
- Le succès est affiché uniquement après une réponse lisible `{ "success": true }`. **Ne remplacez pas le mode par `no-cors`** : une réponse opaque ne prouve pas l’écriture dans la feuille.
- Les erreurs applicatives Apps Script peuvent arriver avec HTTP 200 : le code contrôle aussi `success` et `code`.
- Il n’y a pas de `doGet` public exposant les prospects. Ouvrir l’URL `/exec` dans la barre d’adresse n’est donc **pas** un test du formulaire. N’exécutez pas directement `doPost` depuis l’éditeur : il lui manquerait l’événement HTTP.

## 6. Git et GitHub

Le dépôt courant existe déjà : pas de réinitialisation ni de remplacement du `.git`. La livraison est commitée sur la branche de session **`arena/01a0a6e3-super-nat`**, sans changement de branche. Le `.gitignore` de ce dossier ignore les fichiers locaux, secrets, dépendances et artefacts inutiles.

Depuis la racine du dépôt, commandes pour enregistrer vos personnalisations et pousser :

```bash
git status
git add landing-page
git commit -m "Configure landing page identity and Google Apps Script endpoint"
# Vérifiez si origin existe déjà :
git remote -v
# UNIQUEMENT si aucun remote origin n’existe, après création du repo sur GitHub :
git remote add origin <URL_DU_REPO>
# Exemple d’URL : https://github.com/VOTRE_COMPTE/VOTRE_REPO.git
# Ne remplacez pas un origin existant sans raison.
git push -u origin arena/01a0a6e3-super-nat
```

Dans ce dépôt, `origin` est déjà configuré sur `manajahelvin-ux/super-nat`. N’exécutez donc pas `git remote add origin` une seconde fois. Si aucune modification n’existe, le commit de configuration n’est pas nécessaire. Aucune donnée prospect ni aucun jeton d’accès ne doit être ajouté au dépôt.

## 7. Déployer sur Render Static Site

1. Terminez d’abord les étapes Google et les mentions légales, puis poussez les fichiers configurés sur GitHub.
2. Connectez-vous à **https://dashboard.render.com** et autorisez l’accès au dépôt GitHub concerné.
3. Cliquez sur **New + → Static Site** (pas Web Service).
4. Sélectionnez le dépôt `super-nat` ou votre dépôt équivalent.
5. Choisissez la branche **`arena/01a0a6e3-super-nat`**, où se trouvent les fichiers de cette session.
6. Choisissez un nom de site libre, par exemple `atelier-applications` si disponible.
7. Appliquez cette configuration :

| Paramètre Render | Valeur |
|---|---|
| Root Directory | **Vide** (racine du dépôt) |
| Build Command | **Vide** (aucune compilation) |
| Publish Directory | `landing-page` |
| Auto-Deploy | Activé, si vous souhaitez publier à chaque push de cette branche |
| Variables d’environnement | Aucune requise |

Ne définissez pas simultanément Root Directory sur `landing-page` et Publish Directory sur `landing-page`. Avec une Root Directory `landing-page`, le répertoire publié serait `.`. La configuration retenue ici est racine vide + publication `landing-page`.

8. Cliquez sur **Deploy Static Site** et attendez l’état **Live**.
9. Copiez l’URL HTTPS réellement attribuée par Render depuis la fiche du service : c’est **votre lien Render final**. Le nom est attribué par Render ; aucune URL de production n’est préinventée dans ce projet.
10. Ouvrez cette URL sur ordinateur et téléphone, puis réalisez le test de bout en bout ci-dessous.

L’URL Apps Script est une configuration **publique incluse dans `script.js`**. Une variable d’environnement Render ne remplace pas une constante JS sur un site statique sans build. Modifiez le fichier puis poussez pour la changer. Aucun proxy personnalisé, aucune règle SPA, aucun backend ni aucune dépendance npm n’est nécessaire.

## 8. Test réel avant de lancer une campagne

1. Sur le site Render, cliquez sur les CTA : ils doivent atteindre `#contact`. « Offres » doit atteindre `#offres`.
2. Essayez de soumettre des champs vides, un email incorrect et une description courte : la validation doit bloquer l’envoi.
3. Envoyez une demande de test avec une adresse que vous contrôlez et la description « TEST À SUPPRIMER — création d’une application web de suivi des projets. »
4. Vérifiez l’état d’envoi, le bouton désactivé et la confirmation **sans rechargement**. La confirmation rappelle qu’aucun paiement n’est demandé avant la fin de l’essai.
5. Ouvrez votre Google Sheet : une ligne doit exister, avec les huit colonnes dans le bon ordre. C’est indispensable pour valider la connexion réelle.
6. Testez un second envoi avec l’autre mode envisagé et le type desktop. Les valeurs doivent être fidèlement conservées.
7. Supprimez les lignes de test. Vérifiez que la feuille reste privée.
8. Testez clavier seul (Tab, Entrée, flèches dans les radios), navigation mobile, zoom à 200 % et préférence système de réduction des animations.
9. Coupez le réseau pendant un envoi : un message inline doit conserver les champs. Le délai maximal d’attente est de 30 secondes.

### Dépannage

| Symptôme | À vérifier |
|---|---|
| « Le formulaire n’est pas encore connecté » | La constante contient encore le placeholder, une URL `/dev` ou une URL invalide. |
| Réponse HTML, connexion Google demandée ou erreur CORS | Déploiement **Moi / Anyone**, vraie URL `/exec`, permissions du compte Workspace, absence d’en-têtes personnalisés. Tester hors connexion Google dans une fenêtre privée. |
| `HEADER_MISMATCH` | Les titres de `Leads` ne sont pas identiques à la liste ; les corriger sans supprimer vos données. |
| Erreur côté service | ID de feuille, autorisations du propriétaire, nom d’onglet, déploiement de la dernière version, quotas Apps Script. Consulter **Exécutions** dans Apps Script et l’onglet Réseau du navigateur. |
| Timeout ou `Failed to fetch` | Réseau, blocage navigateur, configuration CORS ou délai Google. Vérifier la feuille avant de renvoyer. |
| Modifications invisibles sur Render | Branche sélectionnée, push effectif, état du dernier déploiement et cache navigateur. |

**Pas de faux accusé de réception :** une panne réseau après l’écriture peut empêcher le navigateur de recevoir la confirmation. Le message l’indique ; il n’y a pas de relance silencieuse. Le bouton bloque les doubles clics pendant l’envoi, mais le service n’implémente pas l’idempotence entre deux tentatives distinctes. Vérifiez la feuille avant de renvoyer pour éviter un doublon.

## 9. Sécurité, données et limites opérationnelles

- Validation des deux côtés : formats, types, tailles, choix autorisés. Le serveur rejette les clés inconnues et les corps excessifs.
- Seuls le nom (2–120 caractères), l’email (maximum 254) et la description (20–5 000) sont requis. Entreprise : maximum 160. Les autres choix restent facultatifs, avec des valeurs neutres par défaut.
- L’email a un pattern HTML5 et une validation serveur ; aucun domaine grand public n’est bloqué, afin de ne pas exclure des indépendants. Ce contrôle n’atteste pas l’existence de la boîte.
- Les valeurs susceptibles de devenir des formules sont préfixées par une apostrophe côté Google. Les messages du navigateur utilisent `textContent`, jamais `innerHTML` avec du contenu reçu.
- Verrou Apps Script pendant l’initialisation/écriture pour gérer les envois simultanés. Aucune donnée personnelle n’est renvoyée au navigateur ni journalisée explicitement par le script.
- Aucun cookie applicatif, outil d’audience, stockage local des prospects, paiement ou pixel publicitaire. Les données restent dans les champs jusqu’au succès ou à la fermeture/recharge de la page.
- Le collecteur public peut recevoir du spam : CORS n’est pas une protection d’authentification. Il n’y a pas de CAPTCHA, de filtrage par IP ni de garantie de débit. Pour une campagne importante, prévoir une protection anti-abus validée côté service et revoir l’architecture si nécessaire. Ne mettez jamais de « secret » dans le JavaScript public.
- Respecter les quotas Apps Script/Sheets et les conditions des prestataires. Le collecteur ne garantit pas un service haute disponibilité. Surveillez les demandes et nettoyez les données selon votre politique.
- Pas de mail de notification ou d’accusé de réception envoyé au prospect : le périmètre est l’ajout au Sheet et la confirmation inline. Consultez la feuille régulièrement.
- Le dossier `apps-script` et ce README sont publiés comme fichiers statiques avec le répertoire. Le code livré ne contient aucun secret ni donnée client. Effectuez la configuration de la feuille dans l’éditeur Google ; ne stockez pas de clés privées dans ces fichiers.

## 10. Décisions de design et de contenu

- **Direction :** atelier logiciel indépendant, interface sombre minimaliste inspirée des fenêtres macOS et de la précision visuelle Linear/Vercel, sans recopier leur marque. Un aperçu produit original remplace les photos de banque d’images.
- **Palette figée :** fond `#101311`, surface `#171B18`, surface élevée `#1C211D`, texte `#F0F2EC`, texte secondaire `#A5AFA5`, accent sauge clair `#D0EF9B`, survol `#E0FFB0`, encre des CTA `#17210E`, bordures `#303831`, erreurs `#FFB5AE`.
- **Typographie :** pile système `-apple-system, BlinkMacSystemFont, Segoe UI, Helvetica, Arial, sans-serif` ; repères et petits labels en `SFMono-Regular, Consolas, Liberation Mono, monospace`. Aucun chargement de Google Fonts, aucune requête externe pour des images ou icônes.
- **Accroche définitive :** « **Votre métier. Votre application. Pas l’inverse.** » Elle exprime immédiatement le bénéfice : le logiciel s’adapte aux processus métier plutôt que d’imposer ses limites. Le texte adjacent précise SaaS, sur-mesure, web et desktop.
- **Conversion :** essai visible dès le hero, CTA répétés, deux offres sans prix arbitraire, quatre étapes explicites, formulaire sans paiement ni choix contractuel forcé. Les tranches de budget représentent une enveloppe globale, jamais une mensualité ou une grille tarifaire.
- **Accessibilité :** langue française, sections nommées, lien d’évitement, labels/fieldset/legend, contraintes HTML5, messages `aria-live`, focus visible, contenu visible sans JS, SVG avec texte alternatif approprié et `prefers-reduced-motion`. Les références provisoires sont identifiées comme telles.
- **Responsive :** mobile d’abord ; points de rupture à 600 et 1 000 px ; offres et formulaire en une colonne sur mobile. Les ancres secondaires restent présentes dans le HTML et apparaissent dans la navigation à partir de 600 px ; le CTA principal reste visible sur mobile.
- **Animations :** apparitions discrètes avec `IntersectionObserver`, sans bibliothèque ; désactivées pour la préférence de mouvement réduit. Pas de vidéo, pas d’animation de chiffres ni d’effet bloquant.

## 11. Checklist de livraison et de publication

### Vérifications effectuées le 15 septembre 2026

- Syntaxe JavaScript et Apps Script vérifiée avec Node ; parsing CSS et XML des trois SVG, liens internes, IDs uniques, assets locaux, labels et champs obligatoires contrôlés.
- Tests Chromium aux largeurs **320, 375, 600, 768, 1 024 et 1 440 px** : aucun débordement horizontal ; CTA vers le formulaire fonctionnels.
- Validation des champs vides et de l’email, erreur honnête si URL absente, ouverture du panneau de confidentialité, mode mouvement réduit, ouverture directe `file://` et lecture sans JavaScript vérifiés.
- Réponses du collecteur **simulées dans le navigateur** : succès, rejet de validation, réponse HTML de connexion et panne réseau. JSON à sept clés, état de chargement, verrouillage pendant l’envoi, réinitialisation au succès et conservation en erreur vérifiés ; aucune exception JavaScript relevée.
- Audit automatisé **axe-core, règles WCAG 2 A/AA et 2.1 AA** : aucune violation détectée sur la page desktop testée. Ce résultat n’est pas une certification exhaustive d’accessibilité.
- Tests unitaires du collecteur avec services Google **simulés** : colonnes, champs facultatifs, choix autorisés, 15 corps invalides, protection contre les formules, incohérence d’en-têtes, verrouillage et erreurs de configuration/service.

Les outils de test ont été installés hors du dépôt. Ils ne sont ni des dépendances du site, ni une étape de build. **Aucun de ces contrôles ne remplace le test réel Render → Apps Script → Google Sheet**, impossible sans services Google/Render configurés.

### Fichiers livrés

- [x] Tous les fichiers attendus, trois SVG légers et aucune dépendance externe de présentation.
- [x] Sections dans l’ordre demandé et exactement sept groupes de champs métier.
- [x] Essai gratuit 15 jours dans le header, le hero, les offres et le formulaire.
- [x] Seulement les deux modes de collaboration pour une application SaaS sur-mesure.
- [x] HTML/CSS/JS natifs, aucun build, ouverture directe possible.
- [x] États chargement/succès/erreur inline et confirmation conditionnée à la réponse du service.
- [x] Collecteur `doPost`, validation serveur, écriture dans le Sheet et guide pas à pas.
- [x] Dépôt Git existant conservé ; commit de livraison sur la branche de session.

### À effectuer avec vos comptes avant exploitation

- [ ] Identité, coordonnées, références et notice légale finalisées.
- [ ] Feuille Google créée, privée, et ID configuré dans Apps Script.
- [ ] Web App déployée en **Moi / Anyone**, URL `/exec` renseignée dans `script.js`.
- [ ] Configuration poussée sur GitHub et Render Static Site créé.
- [ ] Test réel depuis Render : confirmation reçue **et ligne présente dans le Sheet**.
- [ ] Lien Render et lien privé Google Sheet copiés depuis vos tableaux de bord.

Ces dernières cases ne peuvent pas être cochées par un test local ou une réponse Google simulée. Elles nécessitent vos services réellement déployés.
