# Implementation Plan: CMS État & Robustesse (002)

**Goal**: Ajouter état de publication visible, boutons explicites, protection erreurs (alert leave / rétablir / validation), autosave local — sans casser l'aperçu live (tranche 001).

## Approach

### A. État de publication (FR-001)
- Ajouter une zone `#save-state` dans `cms.html` (au-dessus ou sous le bouton save).
- Dans `save(sec)` : après PUT réussi → `setState('saved', '✓ Modifications enregistrées')` + horodatage `lastSave` stocké `localStorage['aip_lastsave']`.
- Après commit OK → `setState('updated', '✓ Site mis à jour')` + note « (quelques minutes pour le site public) ».
- Au chargement : lire `localStorage['aip_lastsave']` → afficher « Dernière sauvegarde : [date] ».

### B. Boutons explicites (FR-002, FR-003)
- `cms.html` : bouton save = « Enregistrer les modifications ».
- Après save : bouton secondaire « Voir le site publié » → `window.open('https://atelierpotvin.ca/','_blank')`.

### C. Protection erreurs (FR-004, FR-005, FR-006)
- `beforeunload` : si `dirty[sec]` true (modifs non sauvées) → alerte navigateur.
- Bouton « Rétablir la dernière version » par section → recharge `ghGetRaw(content/sec.json)` → re-peuple `liveData[sec]` + champs.
- Validation déjà partiellement là (`validate()`) : ajouter tel/email/url. `FILES[sec].fields[k].validate` = 'tel'|'email'|'url'|'number'|null. `validate(v,type)` étendu.

### D. Autosave local (FR-007)
- `liveEdit` → écrit `sessionStorage['aip_draft_'+sec]` = JSON des champs.
- Au `show(sec)` : si draft existe et diffère du live → proposer « Reprendre le brouillon ? » (ou restaurer auto). Simple : restaurer auto le brouillon dans les champs (pas le liveData GitHub) → user peut save ou rétablir.

## File Changes
- `cms.html` : `#save-state` div, bouton « Enregistrer les modifications », bouton « Voir le site publié », bouton « Rétablir la dernière version ».
- `cms.js` :
  - `setState(status,msg)` + `localStorage` lastSave.
  - `save(sec)` : états + bouton « Voir le site publié ».
  - `beforeunload` handler (dirty flag).
  - `revert(sec)` : recharge GitHub.
  - `validate(v,type)` : tel/email/url/number.
  - `liveEdit` : autosave sessionStorage + dirty=true.
  - `show(sec)` : restaurer brouillon si présent.
  - `FILES` : ajouter `validate` sur tel/prix/email/url fields.

## Verification (gate)
- Save → « ✓ Site mis à jour » + horodatage persiste après reload.
- Bouton « Enregistrer les modifications » présent ; « Voir le site publié » ouvre atelierpotvin.ca.
- Modifs non sauvées + fermeture → alerte.
- « Rétablir » restaure dernière version GitHub.
- Prix « abc » → save bloquée + message.

## Out of Scope
- Historique 10 versions (003).
- Template multi-client (004).
