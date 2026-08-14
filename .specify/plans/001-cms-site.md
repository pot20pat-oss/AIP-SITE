# Implementation Plan: CMS Refonte (001-cms-site)

**Goal**: Refondre cms.html/cms.js pour un aperçu live FIDÈLE (vrai CSS du site) + icônes de cartes éditables par upload SVG. Site public (index.html + content/*.json) inchangé sauf ajout champ `icon` dans services.json.

## Approach

### A. Preview live fidèle (4A)
- Revenir à un **iframe `srcdoc`** (pas div) pour le preview, avec `<base href="https://atelierpotvin.ca/">` injecté dans `<head>`.
  - Le `<base href>` fait charger `styles.css`, `script.js`, et les images `assets/*` depuis le vrai site → rendu identique.
  - Les `content/*.json` sont injectés dans les `{{placeholder}}` avant `srcdoc`.
- `updatePreview()` : fetch `index.html` (GitHub API, brut), remplace `{{hero_h1}}` etc. par `liveData`, injecte `<base>`, met `srcdoc`.
- Debounce 300ms sur `liveEdit` pour ne pas regénérer à chaque touche.
- Clic sur un bloc du site (hero/explorer/avis-accueil/footer) → `parent.show(sec)` (même mécanique qu'avant, mais via `window.parent` depuis l'iframe + `postMessage` pour le scroll).

### B. Icônes éditables (5B)
- `content/services.json` : ajouter `icon` par item (ex: `"icon":"icone-depannage.svg"`). Valeur par défaut = nom généré ou vide → fallback emoji SVG inline si absent.
- Dans `show('services')` : pour chaque carte, un champ « Icône (SVG) » avec upload → dépose `assets/{icon}.svg` via API GitHub (PUT base64), met à jour `services.json.icon`.
- `updatePreview` : `card()` utilise `<img src="assets/{icon}" onerror="...emoji fallback">` au lieu de SVG inline fixe.
- Validation upload : accepter seulement `image/svg+xml` (ou extension .svg). Rejeter sinon.

### C. Navigation / UX (exists, à consolider)
- Sidebar sections (hero/footer/tarifs/avis/services/images) déjà là → garder.
- Bouton « Voir dans preview » → `postMessage({scrollTo:sec})` vers iframe → scroll + surbrillance.

## File Changes
- `cms.html` : iframe `#pframe` (au lieu de div), style `.preview-frame` ok.
- `cms.js` :
  - `updatePreview` : réintroduit `<base href>`, iframe srcdoc, debounce, icônes par `services.json.icon`.
  - `show('services')` : champ upload icône par carte.
  - `uploadIcon(name, file)` : PUT assets/{name}.svg, maj services.json.
  - `scrollToPreview` : `postMessage` vers iframe (au lieu de querySelector direct).
  - `parentGo` depuis iframe → `window.parent.show`.
- `content/services.json` : ajout champ `icon` par item (défaut vide).
- `build.py` : déjà copie cms.js → dist. Ajouter copie de `content/services.json` (déjà fait par build normal). Aucun changement build requis sauf si nouveau fichier racine.

## Verification (gate)
- Preview affiche le site avec le MÊME CSS que atelierpotvin.ca (user verdict visuel).
- Modifier H1 → preview live < 500ms, site identique après rebuild.
- Upload icône SVG → carte affiche le SVG (preview + site).
- Clic preview↔édition sans erreur console.
- UTF-8 correct (pas de « DÃ©pannage »).

## Out of Scope (cette tranche)
- Pages internes (services.html etc.) — reste index.html seul.
- Multi-client / token backend — plus tard.
- Avis réels — séparé.

## Risks
- iframe + `<base href>` + postMessage : cross-origin parent↔iframe same-domain (atelierpotvin.ca) → OK, pas de blocage.
- Debounce trop agressif → preview pas fluide → régler à 300ms.
- SVG uploadé cassé → `onerror` fallback emoji.
