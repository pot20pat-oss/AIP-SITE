# Feature Specification: CMS Site Vitrine Atelier Potvin — Refonte

**Feature Branch**: `001-cms-site`

**Created**: 2026-08-14

**Status**: Draft (repensé après clarify — version antérieure obsolète)

**Input**: User clarification 2026-08-14:
- Garder le site public (index.html + content/*.json). Refondre SEULEMENT l'interface CMS (cms.html + cms.js).
- Aperçu live = VRAI rendu du site (même CSS, mêmes images, même layout) qui se met à jour en direct pendant l'édition. Pas un formulaire qui devine.
- Icônes de cartes = ÉDITABLES par l'user dans le CMS (upload SVG par carte, remplaçable).
- Usage actuel = user seul, mais terrain d'apprentissage pour revente client (architecture réutilisable, token GitHub sessionStorage accepté pour l'instant).

## User Scenarios & Testing

### User Story 1 - Aperçu live = vrai site (Priority: P1)

Le user édite un champ (ex: H1) et voit, dans le panneau preview, **son vrai site** (CSS + images + layout identiques à atelierpotvin.ca) se mettre à jour en direct. Pas de simulation, pas de placeholder.

**Why this priority**: C'est la plainte #1 (« ça marche pas comme je veux ») — l'aperçu actuel est pas fidèle (icônes manquantes, rendu approximatif).

**Independent Test**: Modifier hero.h1 dans le CMS → le preview affiche le H1 modifié avec le VRAI style du site (police, couleur, layout hero) → save → site public identique après rebuild.

**Acceptance Scenarios**:

1. **Given** preview ouvert, **When** user tape dans le champ H1, **Then** le preview montre le nouveau H1 avec le CSS réel du site (pas de style par défaut).
2. **Given** preview ouvert, **When** il remplace `photo.jpg` (upload), **Then** le preview affiche la nouvelle photo au même endroit que le site public.
3. **Given** preview ouvert, **When** il scroll/clique, **Then** le layout (hero, cartes, footer) est identique à atelierpotvin.ca (mêmes largeurs, mêmes espacements).

---

### User Story 2 - Icônes de cartes éditables (Priority: P1)

Le user peut remplacer l'icône de chaque carte de service (dépannage, création, etc.) par un SVG qu'il upload dans le CMS. L'icône remplace l'emoji/SVG généré et apparaît dans le preview + le site.

**Why this priority**: Exigence clarifiée 5B — tu veux contrôler l'icône toi-même, pas subir un choix imposé.

**Independent Test**: Upload `icone-depannage.svg` dans le CMS → la carte « Dépannage » affiche ce SVG dans le preview + site public.

**Acceptance Scenarios**:

1. **Given** section Cartes services, **When** user upload un SVG pour une carte, **Then** le fichier est déposé (assets/ ou content/services.json référence) et la carte l'affiche.
2. **Given** SVG invalide (pas du SVG), **When** il upload, **Then** message d'erreur « format non supporté ».
3. **Given** aucune icône uploadée, **When** la carte s'affiche, **Then** icône par défaut (emoji ou SVG généré) pour ne pas casser le visuel.

---

### User Story 3 - Édition texte commerciale (Priority: P1)

Le user modifie les champs (titre, prix, téléphone, avis) en langage humain, save, le site se met à jour. Validation (prix nombre, avis entier, tel format).

**Why this priority**: Valeur centrale — site maintenable sans code.

**Acceptance Scenarios**:

1. **Given** token valide, **When** il modifie un champ et save, **Then** content/*.json commité, site rebuild.
2. **Given** prix non numérique, **When** save, **Then** erreur bloque.

---

### User Story 4 - Navigation claire (Priority: P2)

Le CMS a une sidebar avec sections claires (Page d'accueil, Pied de page, Tarifs, Avis, Cartes services, Photos). Clic sur un bloc du preview ouvre la section. Bouton « Voir dans le preview » situe l'élément.

**Why this priority**: Évite la confusion « où je suis, quoi fait quoi ».

**Acceptance Scenarios**:

1. **Given** preview ouvert, **When** clic hero, **Then** section Page d'accueil s'ouvre.
2. **Given** section ouverte, **When** « Voir dans preview », **Then** preview scroll + surbrillance verte.

---

### User Story 5 - Présentable client (Priority: P3)

Interface pro, langage humain, états clairs. Terrain d'apprentissage pour revente.

**Acceptance Scenarios**:

1. **Given** client non-tech, **When** il lit les labels, **Then** aucun jargon (JSON, repo, commit).

---

## Requirements

### Functional Requirements

- **FR-001**: Preview live MUST charger le **vrai CSS** du site (`https://atelierpotvin.ca/styles.css`) + assets réels → rendu fidèle.
- **FR-002**: Preview live MUST se mettre à jour en direct à chaque frappe (debounce léger).
- **FR-003**: CMS MUST permettre upload d'icône SVG par carte de service (remplace défaut).
- **FR-004**: CMS MUST éditer content/*.json (hero/footer/tarifs/avis/services) avec validation (prix/champ numérique, avis entier, tel format).
- **FR-005**: CMS MUST lister images assets/ avec métadonnées (taille/poids) + upload + aperçu avant/après + warning poids.
- **FR-006**: CMS MUST relier preview↔édition (clic bloc → section ; bouton « Voir dans preview »).
- **FR-007**: Token GitHub MUST sessionStorage + avertissement poste partagé si « Se souvenir ».
- **FR-008**: Encodage UTF-8 strict (TextDecoder lecture, btoa+encodeURIComponent écriture).

### Key Entities

- **ContentFile**: content/{hero,footer,tarifs,avis,services}.json
- **AssetFile**: assets/* (images + icônes SVG par carte)
- **CardIcon**: référence SVG par carte dans services.json (ex: `icon: "icone-depannage.svg"`) ou fichier assets/
- **IMGDESC**: map nom→{catégorie, desc, taille, format, poids max}
- **TokenGitHub**: PAT scope repo, sessionStorage

## Success Criteria

- **SC-001**: Preview affiche le site avec le MÊME CSS que atelierpotvin.ca (vérifié visuellement par user).
- **SC-002**: Modifier H1 → preview se met à jour < 500ms, site public identique après rebuild.
- **SC-003**: Upload icône SVG par carte → carte affiche le SVG dans preview + site.
- **SC-004**: Aucune erreur console sur clic preview↔édition.

## Assumptions

- Cloudflare Pages rebuild auto après push.
- Token GitHub fourni par user, scope repo, non expiré.
- Site public = HTML statique servi par Cloudflare.
- Réutilisation client (6A) = plus tard ; pour l'instant token sessionStorage OK.

## Known Gaps (à planifier après cette tranche)

- Édition pages internes (services.html, apropos.html) pas dans cette tranche.
- Avis Google = exemples dans avis.json (pas vrais avis) — à corriger avec user.
- Multi-client (token caché backend) = tranche future, hors périmètre ici.
- Template CMS réutilisable par client = après validation sur AIP-Site.
