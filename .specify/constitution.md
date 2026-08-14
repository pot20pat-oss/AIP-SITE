# Atelier Potvin (AIP-Site) Constitution

## Core Principles

### I. Single Project Root (NON-NEGOTIABLE)
Tout artefact (code, CMS, specs, build) vit dans la racine unique `F:\AIP-Site`.
Aucun dossier frère (spikes/, contrats/, copie). Les specs Spec Kit vont dans `.specify/` à la racine.

### II. Spec-Driven (NON-NEGOTIABLE)
Toute tranche non triviale démarre par `specify` : constitution → specify → clarify → plan → tasks → implement.
Ne jamais coder à l'aveugle. Le piège vécu (CMS : 2h perdues sur Decap/Netlify) interdit la répétition.

### III. Static-First, Zero-Server-State
Site vitrine = HTML/CSS/JS pur servi par Cloudflare Pages. Le contenu éditable est dans `content/*.json`.
Le build (`build.py`) fusionne JSON → HTML. Pas de base de données, pas de runtime server-side sur le site public.

### IV. Client-Ownable CMS
Le CMS (`cms.html` + `cms.js`) doit rester utilisable par un non-développeur : langage humain (pas jargon technique),
aperçu live, upload d'images avec métadonnées (taille/poids), liens preview↔édition. Le client comprend « je change mes photos/prix/avis ».

### V. French-Only Output
Toute réponse utilisateur, tout texte produit, tout commit message orienté user = français.
Le code/commentaires peuvent être techniques mais l'interface CMS est en français.

### VI. Visual Verification Required
Livrer « c'est fait » sans validation visuelle du user (ou preuve équivalente) est interdit.
Le user lance et capture l'UI réelle. En sandbox headless, prouver le transport/pipeline, pas les pixels.

## Additional Constraints

### Sécurité CMS
- Token GitHub (PAT) saisi par le user, stocké en sessionStorage (meurt à la fermeture d'onglet), jamais en clair côté serveur.
- Avertissement poste partagé si « Se souvenir » coché.
- Upload image limité par poids (max par fichier défini dans IMGDESC).

### Encodage
- UTF-8 strict partout (lecture base64 via TextDecoder, écriture via btoa(unescape(encodeURIComponent()))).
- Interdit les double-encodages (« DÃ©pannage »).

### Déploiement
- Push sur `pot20pat-oss/AIP-SITE` main → Cloudflare Pages rebuild auto.
- `build.py` doit copier `cms.js` (et tout fichier racine éditable) vers `dist/` sinon Cloudflare sert 0 octet.

## Development Workflow

1. `specify init . --integration hermes` (fait)
2. Pour chaque évolution : `specify specify` (ou écriture directe de `specs/NN-feature.md`)
3. `specify clarify` si ambiguïté
4. `specify plan` → `specify tasks` → `specify implement`
5. Commit + push → user valide visuellement

## Governance

Cette constitution prime sur toute pratique ad hoc. Tout amendement = commit dédié + version incrémentée.
Le user (Patrick) approuve les changements de périmètre.

**Version**: 1.0.0 | **Ratified**: 2026-08-14 | **Last Amended**: 2026-08-14
