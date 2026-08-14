# Feature Specification: CMS — État des changements & robustesse

**Feature Branch**: `002-cms-etat-robustesse`

**Created**: 2026-08-14

**Status**: Draft

**Input**: Feedback utilisateur 2026-08-14 (notes: simplicité 9/10, client non-tech 9/10, parcours 8.5/10, réutilisable 8/10). Points à monter : état des changements visible, boutons explicites, protection contre erreurs.

## User Scenarios & Testing

### User Story 1 - État de publication visible (Priority: P1)

Après Enregistrer, le user voit une confirmation persistante : « ✓ Modifications enregistrées » → « Publication en cours… » → « ✓ Site mis à jour » + « Dernière sauvegarde : [date heure] ».

**Why this priority**: User a marqué ça comme « le point le plus important » — enlève l'incertitude « est-ce que ça a pris ».

**Independent Test**: Modifier un champ + Enregistrer → les 3 états s'affichent en séquence + horodatage persistant.

**Acceptance Scenarios**:

1. **Given** user clique Enregistrer, **When** PUT réussit, **Then** message « ✓ Modifications enregistrées » + horodatage « Dernière sauvegarde : [maintenant] ».
2. **Given** après save, **When** le commit GitHub est fait, **Then** message « ✓ Site mis à jour » (ou « Publication en cours… » pendant le rebuild Cloudflare si détectable).
3. **Given** message affiché, **When** user recharge la page, **Then** « Dernière sauvegarde » reste visible (stocké sessionStorage/localStorage).

---

### User Story 2 - Boutons explicites (Priority: P1)

Le bouton « Enregistrer » devient « Enregistrer les modifications ». Après save, bouton secondaire « Voir le site publié » (ouvre atelierpotvin.ca dans nouvel onglet, distinct de l'aperçu live).

**Why this priority**: Clarté pour client non-tech (ta note 9/10 à conserver).

**Acceptance Scenarios**:

1. **Given** section édition, **When** user lit le bouton, **Then** libellé = « Enregistrer les modifications ».
2. **Given** après save, **When** il clique « Voir le site publié », **Then** nouvel onglet ouvre https://atelierpotvin.ca/ (site réel, pas aperçu).

---

### User Story 3 - Protection contre erreurs (Priority: P2)

Alert before leave si modifs non enregistrées. Bouton « Annuler / Rétablir dernière version » (recharge le JSON depuis GitHub, annule les changements locaux). Validation tel/prix/email/URL avant save.

**Why this priority**: « robustesse à ajouter » — rend le CMS vendable/réutilisable (ta note 8/10).

**Acceptance Scenarios**:

1. **Given** modifs non sauvées, **When** user ferme l'onglet, **Then** alerte navigateur « Modifications non enregistrées ».
2. **Given** user clique « Rétablir », **When** confirm, **Then** champs reviennent à la dernière version GitHub.
3. **Given** prix non numérique, **When** save, **Then** erreur bloque + message clair.
4. **Given** tel invalide (format), **When** save, **Then** erreur bloque.

---

### User Story 4 - Autosave local pendant rédaction (Priority: P2)

Le brouillon est sauvegardé dans le navigateur (sessionStorage) pendant la frappe. Si l'onglet se ferme, le brouillon est proposé au retour.

**Why this priority**: Évite la perte de texte (protection erreurs).

**Acceptance Scenarios**:

1. **Given** user tape dans un champ, **When** il recharge la page, **Then** le texte tapé est restauré depuis sessionStorage (si pas encore enregistré).

---

## Requirements

### Functional Requirements

- **FR-001**: CMS MUST afficher un état de publication persistante après save (enregistré / publication / mis à jour + horodatage).
- **FR-002**: Bouton MUST être libellé « Enregistrer les modifications ».
- **FR-003**: CMS MUST proposer « Voir le site publié » (nouvel onglet, site réel) après save.
- **FR-004**: CMS MUST alerter avant de quitter si modifs non enregistrées (beforeunload).
- **FR-005**: CMS MUST offrir « Rétablir la dernière version » (recharge JSON GitHub, annule local).
- **FR-006**: CMS MUST valider tel (format), prix (nombre), email (format), URL avant save.
- **FR-007**: CMS MUST autosave le brouillon dans sessionStorage pendant la frappe + restaurer au retour.

### Key Entities

- **ChangeState**: {status: 'idle'|'saved'|'publishing'|'updated', lastSave: timestamp}
- **DraftBuffer**: sessionStorage par section (clé `aip_draft_{sec}`)
- **ValidationRules**: tel/prix/email/url par champ (dans FILES[sec].fields[].validate)

## Success Criteria

- **SC-001**: Après save, user voit « ✓ Site mis à jour » + horodatage persistant (survit reload).
- **SC-002**: Bouton « Enregistrer les modifications » présent ; « Voir le site publié » ouvre le site réel.
- **SC-003**: beforeunload alerte si modifs non sauvées.
- **SC-004**: « Rétablir » restaure la dernière version GitHub.
- **SC-005**: Prix/tel/email invalides → save bloquée avec message.

## Assumptions

- Rebuild Cloudflare ~1-2 min après push → « Publication en cours… » puis « ✓ Site mis à jour » (on ne peut pas détecter fin rebuild côté client sans webhook ; on affiche « mis à jour » dès le commit OK + note « quelques minutes »).
- sessionStorage suffit pour autosave (pas de backend).

## Out of Scope (cette tranche)

- Historique versions (10 dernières) = tranche 003 (nécessite API commits ou stockage dédié).
- Template multi-client = tranche 004 (après robustesse validée).
