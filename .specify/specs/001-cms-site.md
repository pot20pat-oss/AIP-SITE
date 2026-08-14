# Feature Specification: CMS Site Vitrine Atelier Potvin

**Feature Branch**: `001-cms-site`

**Created**: 2026-08-14

**Status**: Draft (état actuel validé par usage, évolutions listées)

**Input**: User description: "Je veux un CMS pour éditer mon site vitrine (texte + images), avec aperçu live, présentable à un client, sans outil dev."

## User Scenarios & Testing

### User Story 1 - Éditer le texte commercial (Priority: P1)

Le propriétaire (non-développeur) ouvre `cms.html`, colle son token GitHub, charge le site, modifie les champs (titre H1, lead, prix, téléphone, avis) et enregistre. Le site public se met à jour après rebuild Cloudflare.

**Why this priority**: C'est la valeur centrale — transformer un site statique en site maintenable sans toucher au code.

**Independent Test**: Modifier `hero.h1` via le CMS → commit dans `content/hero.json` → `atelierpotvin.ca` affiche le nouveau titre après rebuild.

**Acceptance Scenarios**:

1. **Given** user sur `cms.html` avec token valide, **When** il modifie le H1 et clique Enregistrer, **Then** le fichier `content/hero.json` est commité et le site rebuild.
2. **Given** un champ prix contenant du texte non numérique, **When** il clique Enregistrer, **Then** un message d'erreur bloque la sauvegarde.
3. **Given** token invalide (401), **When** il charge le site, **Then** message d'erreur clair (pas crash silencieux).

---

### User Story 2 - Gérer les images (Priority: P1)

Le user remplace une image (photo de Patrick, logo, fond hero, icônes) via l'onglet Photos. Même nom = même emplacement. Métadonnées (taille/poids) affichées, aperçu avant/après, warning si trop lourd.

**Why this priority**: Les images soutiennent le branding et les sections services — c'est « piloter l'apparence réelle ».

**Independent Test**: Choisir `photo.jpg` < 2 Mo → upload → `assets/photo.jpg` remplacé → site rebuild.

**Acceptance Scenarios**:

1. **Given** onglet Photos, **When** user choisit `photo.jpg` (1 Mo) et upload, **Then** `assets/photo.jpg` est mis à jour, check vert « ✓ Remplacée ».
2. **Given** fichier > poids max (ex: photo.jpg 5 Mo), **When** il tente l'upload, **Then** toast rouge « trop lourde » bloque.
3. **Given** aperçu live ouvert, **When** il remplace une image, **Then** l'aperçu montre la nouvelle image.

---

### User Story 3 - Aperçu live cliquable (Priority: P2)

Le user voit son site en direct dans le CMS (iframe/div) et peut cliquer un bloc (hero, cartes, avis, footer) pour ouvrir la section d'édition correspondante. Un bouton « Voir dans le preview » situe l'élément.

**Why this priority**: Réduit la confusion « où je suis, quoi fait quoi » — critère client.

**Independent Test**: Cliquer le hero dans le preview → la section « Page d'accueil » s'ouvre.

**Acceptance Scenarios**:

1. **Given** preview ouvert, **When** user clique le hero, **Then** `show('hero')` s'active.
2. **Given** section « Page d'accueil » ouverte, **When** il clique « Voir dans le preview », **Then** le preview scroll vers le hero + surbrillance verte.

---

### User Story 4 - Présentable à un client (Priority: P3)

Le CMS a une interface pro (sidebar, cartes, langage humain, états clairs) utilisable par un tiers non-technique.

**Why this priority**: Le user vend des sites à des clients — le CMS fait partie de l'offre.

**Independent Test**: Un client non-tech lit « Page d'accueil → Grand titre principal » et comprend sans jargon.

**Acceptance Scenarios**:

1. **Given** client sur le CMS, **When** il lit les labels, **Then** aucun terme technique (JSON, repo, commit) n'apparaît.

---

## Requirements

### Functional Requirements

- **FR-001**: Le CMS MUST charger `content/*.json` (hero, footer, tarifs, avis, services) via API GitHub.
- **FR-002**: Le CMS MUST permettre l'édition de chaque champ et l'enregistrement (PUT JSON).
- **FR-003**: Le CMS MUST valider prix (nombre), avis (entier), téléphone (format) avant save.
- **FR-004**: Le CMS MUST lister les images `assets/` avec description, taille recommandée, format, poids max.
- **FR-005**: Le CMS MUST uploader une image (base64 PUT) avec warning si > poids max.
- **FR-006**: Le CMS MUST afficher un aperçu live du site (hero + cartes + avis + footer) avec icônes visibles.
- **FR-007**: Le CMS MUST relier preview ↔ édition (clic bloc → section ; bouton « Voir dans le preview »).
- **FR-008**: Le token GitHub MUST être stocké en sessionStorage (pas localStorage persistant par défaut), avec avertissement poste partagé.
- **FR-009**: Encodage UTF-8 MUST être strict (lecture TextDecoder, écriture btoa+encodeURIComponent).

### Key Entities

- **ContentFile**: `content/{hero,footer,tarifs,avis,services}.json` — source de vérité du texte éditable.
- **AssetFile**: `assets/{photo.jpg, logo.png, hero-bg.jpg, ...}` — images remplaçables par nom.
- **IMGDESC**: map nom→{catégorie, description, taille, format, poids max} — métadonnées d'upload.
- **TokenGitHub**: PAT scope `repo`, saisi par user, sessionStorage.

## Success Criteria

- **SC-001**: User non-dev modifie le H1 et voit le changement sur le site en < 5 min (rebuild inclus).
- **SC-002**: Upload d'une image < poids max réussit à 100% (toast vert, site mis à jour).
- **SC-003**: Aperçu live affiche les icônes de cartes (SVG inline, pas dépendance police).
- **SC-004**: Clic sur un bloc du preview ouvre la bonne section CMS (0 erreur console).

## Assumptions

- Cloudflare Pages rebuild auto après push GitHub (pas de build manuel).
- Token GitHub (PAT) fourni par le user, scope `repo`, non expiré.
- Le site public est un HTML statique servi par Cloudflare (pas de runtime server sur le site).
- Évolutions futures : multi-pages (services.html, apropos.html), édition du vrai HTML, CMS multi-clients.

## Known Gaps (à clarifier / planifier)

- Édition des pages internes (services.html, apropos.html, faq.html) pas encore dans le CMS (seulement index.html via content/*.json).
- Avis Google = exemples dans avis.json (pas vrais avis vérifiés) — risque crédibilité à corriger avec le user.
- Pas de historique/rollback dans le CMS (dépend du commit GitHub).
- Icônes cartes = SVG inline générées (pas éditable nom par nom via CMS, mais le visuel est garanti).
