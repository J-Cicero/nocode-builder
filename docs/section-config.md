# Spécification factuelle des `config` de sections

Ce document recense, pour chacun des **10 types de sections** présents dans la plateforme, les clés de `section.config` réellement lues ou produites par :

- **(a) `portal-user`** : composants de rendu sous `frontend/portal-user/src/components/sectionsRenderer/sections/`
- **(b) Générateur / Preview (état avant Lot 5)** :
  - `backend/svc-nocode-core/app/modules/generator/generator_engine.py`
  - `backend/svc-nocode-core/app/modules/generator/preview_renderer.py`
- **(c) Prompts IA et templates serveur** :
  - `backend/svc-nocode-core/app/modules/ai/prompts.py`
  - `backend/svc-nocode-core/app/modules/templates/catalog/saas-dashboard.json`
  - `backend/svc-nocode-core/app/modules/templates/catalog/crm-sales.json`
  - `backend/svc-nocode-core/app/modules/templates/catalog/e-commerce.json`

---

## Inventaire des 10 types de sections

### 1. `navbar`
- **(a) `portal-user`** (`frontend/portal-user/src/components/sectionsRenderer/sections/NavbarSection.jsx`) :
  - Lit `config.title` (repli `section.title`, `"Logo"`).
  - Lit `config.links` : tableau de chaînes (`"Home"`) ou d'objets `{ label, path }`.
  - Lit `section.styles` (`backgroundColor`, `padding`, `color`).
- **(b) Générateur / Preview** :
  - `generator_engine.py` : lisait `config.title` (repli `section.title`, `project.name`) et `config.links` (`[{ label, path }]` ou chaînes).
  - `preview_renderer.py` : lit `props.title` / `config.title`, `props.links` / `config.links` (suppose des objets `{ label, path }`, plantera si chaîne).
- **(c) Prompts IA & templates** :
  - `prompts.py` : `{"title": "App Name", "links": [{"label": "...", "path": "/..."}]}`.
  - Templates (`saas-dashboard.json`, `crm-sales.json`, `e-commerce.json`) : `config.title`, `config.links` (`[{ label, path }]`).

### 2. `hero`
- **(a) `portal-user`** (`frontend/portal-user/src/components/sectionsRenderer/sections/HeroSection.jsx`) :
  - Lit `config.title` (repli `section.title`), `config.subtitle`.
  - Lit `config.cta` **comme objet `{ label, href }` ou chaîne**, mais aussi `config.cta_text` / `config.button_text` (selon variante) et `section.styles` (`backgroundColor`, `padding`, `color`, `textAlign`).
- **(b) Générateur / Preview** :
  - `generator_engine.py` : lisait `config.title` (repli `section.title`), `config.subtitle`, `config.cta` (`{ label, href }`).
  - `preview_renderer.py` : lit `props.title` / `config.title`, `props.subtitle` / `config.subtitle`, `props.cta` / `config.cta` (`{ label, href }`).
- **(c) Prompts IA & templates** :
  - `prompts.py` : `{"title": "...", "subtitle": "...", "cta": {"label": "...", "href": "/..."}}`.
  - Template `e-commerce.json` : `config.title`, `config.subtitle`, `config.cta` (`{ label, href }`).

### 3. `stats-row`
- **(a) `portal-user`** (`frontend/portal-user/src/components/sectionsRenderer/sections/StatsRowSection.jsx`) :
  - Lit `config.stats` : tableau d'objets `{ label, value }` ou de chaînes ; ne lit PAS `stat.table` ni `stat.icon` / `stat.trend`.
  - Lit `section.styles` (`padding`, `backgroundColor`).
- **(b) Générateur / Preview** :
  - `generator_engine.py` : lisait `config.stats` (`[{ label, table, value }]`), mais utilisait `s.get("table")` pour générer des appels API.
  - `preview_renderer.py` : lit `props.stats` / `config.stats` (`[{ label, value }]`).
- **(c) Prompts IA & templates** :
  - `prompts.py` : `{"stats": [{"label": "Total Items", "table": "table_name"}]}` (pas de `value`).
  - Templates (`saas-dashboard.json`, `crm-sales.json`) : `config.stats` (`[{ label, table }]` sans `value`).

### 4. `data-table`
- **(a) `portal-user`** (`frontend/portal-user/src/components/sectionsRenderer/sections/DataTableSection.jsx`) :
  - Lit `config.title` (repli `section.title`), `config.columns` (tableau de chaînes ou d'objets `{ key, label }`), `config.rows` / `connectionData`.
  - Lit `section.styles`.
- **(b) Générateur / Preview** :
  - `generator_engine.py` : lisait `config.title`, `config.columns`, `config.table` / `section.connecte_a`, `config.actions`.
  - `preview_renderer.py` : lit `props.title` / `config.title`, `props.columns` / `config.columns` (tableau de chaînes uniquement).
- **(c) Prompts IA & templates** :
  - `prompts.py` : `{"title": "...", "table": "...", "columns": ["..."], "actions": ["view", "edit", "delete"]}`.
  - Templates (`saas-dashboard.json`, `crm-sales.json`, `e-commerce.json`) : `config.columns`, `config.table` (et `section.connecte_a`, `section.title` hors `config`).

### 5. `form`
- **(a) `portal-user`** (`frontend/portal-user/src/components/sectionsRenderer/sections/FormSection.jsx`) :
  - Lit `config.title` (repli `section.title`), `config.fields` (`[{ name, label, type, placeholder, required }]`), `config.submit_label` / `config.button_text`.
  - Lit `section.styles`.
- **(b) Générateur / Preview** :
  - `generator_engine.py` : lisait `config.title`, `config.table` / `section.connecte_a`, `config.fields` (`[{ name, label, type, required }]`), `config.submit_label`.
  - `preview_renderer.py` : lit `props.title` / `config.title`, `props.fields` / `config.fields` (`[{ name, label, type }]`).
- **(c) Prompts IA & templates** :
  - `prompts.py` : `{"title": "...", "table": "...", "fields": [{"name": "...", "type": "...", "label": "...", "required": true}]}`.
  - Templates (`saas-dashboard.json`, `crm-sales.json`) : `config.fields`, `config.table` (`section.title` hors `config`).

### 6. `card-grid`
- **(a) `portal-user`** (`frontend/portal-user/src/components/sectionsRenderer/sections/CardGridSection.jsx`) :
  - Lit `config.title` (repli `section.title`), `config.cards` (tableau statique `{ title, description, ... }`) ou `connectionData`, `config.columns`.
  - Ne lit PAS `config.card_fields`.
- **(b) Générateur / Preview** :
  - `generator_engine.py` : lisait `config.title`, `config.table` / `section.connecte_a`, `config.columns`, `config.card_fields` (et `config.cards`).
  - `preview_renderer.py` : lit uniquement `props.title` / `config.title` (cartes statiques codées en dur).
- **(c) Prompts IA & templates** :
  - `prompts.py` : `{"title": "...", "table": "...", "columns": 3, "card_fields": ["title", "description"]}`.
  - Template `e-commerce.json` : `config.card_fields`, `config.columns`, `config.table` (pas de `config.cards`).

### 7. `text-section`
- **(a) `portal-user`** (`frontend/portal-user/src/components/sectionsRenderer/sections/TextSection.jsx`) :
  - Lit `config.title` (repli `section.title`), `config.content`.
  - Lit `section.styles` (`padding`, `backgroundColor`, `textAlign`, `color`).
- **(b) Générateur / Preview** :
  - `generator_engine.py` : lisait `config.title` (repli `section.title`), `config.content` (repli `config.text`).
  - `preview_renderer.py` : **non géré** (`ui_type == "text-section"` tombe dans `"Unsupported component"` ; seul `ui_type == "text"` existe et lit `props.text`).
- **(c) Prompts IA & templates** :
  - `prompts.py` : `{"title": "Section Title", "content": "Professional description text"}`.
  - Templates : non utilisé actuellement dans les 3 templates serveur.

### 8. `mobile-header`
- **(a) `portal-user`** (`frontend/portal-user/src/components/sectionsRenderer/sections/MobileHeaderSection.jsx`) :
  - Lit `config.title` (repli `"App Title"` — **ne lit pas `section.title`**), `config.subtitle` (repli `"Subtitle"`).
  - Ne lit PAS `config.has_back_button`.
- **(b) Générateur / Preview** :
  - `generator_engine.py` : **non pris en charge** dans l'export web (avant Lot 5, retombait dans un bloc générique).
  - `preview_renderer.py` : **non géré** (`Unsupported component`).
- **(c) Prompts IA & templates** :
  - `prompts.py` : `{"title": "App Name", "has_back_button": false}` (pas de `subtitle`).
  - Templates : non utilisé dans les 3 templates web.

### 9. `mobile-card-list`
- **(a) `portal-user`** (`frontend/portal-user/src/components/sectionsRenderer/sections/MobileCardListSection.jsx`) :
  - Lit `connectionData` ou `config.items` (`[{ title, name, description }]`).
  - Ne lit PAS `config.title`, `config.table`, ni `config.card_fields`.
- **(b) Générateur / Preview** :
  - `generator_engine.py` : **non pris en charge** dans l'export web.
  - `preview_renderer.py` : **non géré** (`Unsupported component`).
- **(c) Prompts IA & templates** :
  - `prompts.py` : `{"title": "Items", "table": "table_name", "card_fields": ["title", "subtitle"]}`.
  - Templates : non utilisé dans les 3 templates web.

### 10. `bottom-nav`
- **(a) `portal-user`** (`frontend/portal-user/src/components/sectionsRenderer/sections/BottomNavSection.jsx`) :
  - Lit `config.items` (repli tableau par défaut `{ label, icon }`) — **ne lit PAS `config.links`**.
- **(b) Générateur / Preview** :
  - `generator_engine.py` : **non pris en charge** dans l'export web.
  - `preview_renderer.py` : **non géré** (`Unsupported component`).
- **(c) Prompts IA & templates** :
  - `prompts.py` : `{"links": [{"label": "Home", "path": "/"}, {"label": "Data", "path": "/data"}]}`.
  - Templates : non utilisé dans les 3 templates web.

---

## Incohérences relevées entre les sources (sans correction)

1. **`bottom-nav` (`items` vs `links`)** : `portal-user/BottomNavSection.jsx` lit `config.items`, alors que `prompts.py` spécifie `config.links`.
2. **`card-grid` (`cards` vs `card_fields`)** : `portal-user/CardGridSection.jsx` lit `config.cards` (ou `connectionData`), alors que `prompts.py` et `e-commerce.json` fournissent `config.card_fields` + `config.table` (sans `config.cards`).
3. **`stats-row` (`value` vs `table`)** : `portal-user/StatsRowSection.jsx` et `preview_renderer.py` attendent `{ label, value }`, alors que `prompts.py` et les templates `saas-dashboard.json` / `crm-sales.json` produisent `{ label, table }` sans `value`.
4. **`mobile-header` (`subtitle` vs `has_back_button`)** : `portal-user/MobileHeaderSection.jsx` lit `config.subtitle` et ignore `config.has_back_button` (et ignore `section.title`), alors que `prompts.py` spécifie `has_back_button` sans `subtitle`.
5. **`mobile-card-list` (`items` vs `card_fields`/`table`)** : `portal-user/MobileCardListSection.jsx` lit `config.items` (`title`/`name`, `description`) et ignore `config.title`, `config.table` et `config.card_fields` spécifiés par `prompts.py`.
6. **Emplacement de `title` et `table`** : `prompts.py` place souvent `title` dans `config` ET sur la section, tandis que les templates serveur placent parfois `title` uniquement sur la section (hors `config`) et `table` à la fois dans `config.table` et `section.connecte_a`.
7. **`preview_renderer.py` désynchronisé** : ne gère ni `text-section`, ni les 3 types mobiles (`mobile-header`, `mobile-card-list`, `bottom-nav`), et suppose que `navbar.links` contient uniquement des objets (pas de chaînes).
