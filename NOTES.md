# Notes techniques — LOT 1 (`v1/lot-1`)

## Contournement local Docker (`build.network: host`)

Dans [infra/docker-compose.v1.yml](infra/docker-compose.v1.yml), les trois services construits (`svc-iam`, `svc-nocode-core`, `svc-api-gateway`) utilisent `build.network: host`.
Il s'agit d'un **contournement local** nécessaire lorsque le réseau bridge de BuildKit/Docker ne dispose pas de résolution DNS fonctionnelle pendant `pip install`. Ce paramètre est destiné au build local et pourra être retiré dans un environnement CI/Docker standard.

## Hors périmètre

Les points suivants ont été constatés lors de l'audit et consignés ici **sans modification** car ils sont hors périmètre du LOT 1 :

1. **`.gitignore` (`lib/` non ancré)** : la règle `lib/` ignore les dossiers `src/lib/` (`authClient.js`, `authedFetch.js`) importés par les portails frontend gelés (`host-shell`, `portal-admin`, `portal-super-admin`, `portal-customer-service`, `portal-service-desk`).
2. **`backend/svc-api-gateway/app/main.py`** :
   - `PUBLIC_PATHS` ne contient pas `/api/legal/consent` ni `/api/payments/webhook` (routes de services gelés).
   - `allow_origins=["*"]` combiné à `allow_credentials=True` dans le middleware CORS.
   - Absence de gestion explicite des erreurs réseau upstream (`502`/`504`) dans `proxy()`.
3. **`backend/svc-nocode-core/app/modules/ai/service.py`** :
   - `SectionType` est utilisé aux lignes 459–476 sans être importé (erreur `F821`).
   - Ligne 34 importe encore `from app.modules.auth.models import User`.
4. **`backend/svc-nocode-core/app/core/database.py`** : `echo=settings.ENVIRONMENT == "development"` active l'écho SQL brut dans les logs lorsque `ENVIRONMENT=development` (valeur par défaut).
5. **`backend/svc-nocode-core/app/modules/generator/generator_engine.py`** : génère encore l'ancien squelette frontend (`ApiContext`, `Bearer test-token`, `{{BASE_URL}}`).
6. **`backend/svc-tenant/app/main.py` (service gelé)** : `tenants_router` est inclus avant `@app.get("/health")`, ce qui permet à `/{tenant_id}` de masquer `/health`.
7. **Environnement de la machine locale (Windows 10 Pro)** : Docker Desktop et WSL ne sont pas installés et la virtualisation matérielle (`VirtualizationFirmwareEnabled=False`) est désactivée dans le firmware, empêchant l'exécution de `docker compose` sur ce poste.

---

# Notes techniques — LOT 2 (`v1/lot-2`)

## Points réglés dans le LOT 2

- Suppression complète de `app/modules/auth` et de l'ancienne API `/api/v1` (`app/api`, `app/models`, `app/schemas`, `app/services`, `app/repositories`) et de leurs tables associées.
- Authentification JWT globale via liste blanche unique (`app/core/identity.py`) et middleware HTTP dans `svc-nocode-core`.
- Vérification centralisée d'appartenance projet (`app/core/ownership.py`) renvoyant `404` sur tous les modules métier (`projects`, `schema`, `interface_builder`, `data_engine`, `workflow_engine`, `generator`, `ai`).
- Interdiction de démarrage avec `SECRET_KEY` absent ou `< 32` caractères sur les 3 services (`svc-iam`, `svc-nocode-core`, `svc-api-gateway`).
- Réponses JSON `502`/`503` sur `svc-api-gateway` lors d'une indisponibilité/timeout upstream.
- Boucle de retry `>= 30s` sur l'initialisation base de données au démarrage de `svc-iam` et `svc-nocode-core` + `restart: unless-stopped` dans `infra/docker-compose.v1.yml`.

## Hors périmètre LOT 2 (conservés pour les lots suivants)

1. **`backend/svc-nocode-core/app/modules/ai/catalog_router.py`** : contient encore `require_admin` (`identity.role`) sur les endpoints `/api/ai/admin/*` ; non modifié dans le LOT 2 conformément à la contrainte de périmètre.
2. **`backend/svc-nocode-core/app/modules/ai/service.py`** : `SectionType` reste non importé aux lignes 459–476 (seul l'import mort `app.modules.auth.models.User` ligne 34 a été remplacé par `Identity as User`).
3. **`backend/svc-nocode-core/app/modules/generator/generator_engine.py`** : intouché dans le LOT 2 (`Bearer test-token`, erreur `TypeError: unhashable type: 'dict'` sur `card-grid`/`stats-row`/`form`, etc. — prévu pour le lot générateur).
4. **`backend/svc-nocode-core/app/modules/data_engine/service.py` (ligne 34)** : `create()` passe `schema.id` (Integer) au lieu de `schema.tracking_id` (UUID) à `table_repo.get_by_name_and_schema()`, provoquant une 500 PostgreSQL lors du `POST /api/data/projects/{project_id}/{table_name}`. Hors périmètre LOT 2 (découvert lors de la validation E2E).
5. **`backend/svc-nocode-core/app/modules/workflow_engine/service.py` (ligne 52)** : `create_workflow()` appelle `WorkflowResponse.model_validate(workflow)` sans `selectinload(Workflow.etapes)` après `workflow_repo.create()`, provoquant un `MissingGreenlet` sous SQLAlchemy async. Hors périmètre LOT 2 (découvert lors de la validation E2E).
6. **`tests/acceptance/lot1.sh`, `lot2.sh`, `run_all.sh`** : validés syntaxiquement par `bash -n` ; sous Windows 10 Pro sans Docker, la validation d'exécution complète a été exécutée contre PostgreSQL 17 réel et les 3 serveurs `uvicorn` réels (`svc-iam`, `svc-nocode-core`, `svc-api-gateway`).

---

# Notes techniques — LOT 3 (`v1/lot-3`)

## Points réglés dans le LOT 3

- **Partie 0 (compléments de sécurité du lot 2)** :
  - Export de `OWNED_PATH_PARAMS` et `NON_OWNERSHIP_PATH_PARAMS` depuis `backend/svc-nocode-core/app/core/ownership.py` et audit automatique des paramètres de chemin OpenAPI dans `tests/acceptance/lot2.sh` (`a2`).
  - Vérification d'appartenance de `data.source_table_id` et `data.target_table_id` dans `create_relation` (`backend/svc-nocode-core/app/modules/schema/router.py`).
  - Test de non-création par l'utilisateur B sous les parents de l'utilisateur A (avec et sans préfixe `/api`) avec vérification des comptes avant/après dans `tests/acceptance/lot2.sh` (`e2`).
- **Partie 1** : import de `SectionType` corrigé dans `backend/svc-nocode-core/app/modules/ai/service.py` et création de `tests/acceptance/static_checks.sh` avec auto-test `F821`.
  - Note outillage (`ruff 0.17.6`) : la règle `E999` a été supprimée des versions récentes de `ruff` (les erreurs de syntaxe restent toujours détectées nativement quel que soit `--select`). `static_checks.sh` utilise `--select F821,F811`.
- **Partie 2–4** : configuration IA par variables d'environnement (`AI_TIMEOUT_SECONDS=60`), validation Pydantic v2 stricte (`backend/svc-nocode-core/app/modules/ai/validation.py`) sans repli silencieux vers `text-section`, retry unique avec erreurs précises, transactions atomiques et protection `409 PROJECT_NOT_EMPTY` avec `?replace=true`, erreurs JSON françaises normalisées (`AI_NOT_CONFIGURED`, `AI_PROVIDER_AUTH`, `AI_RATE_LIMITED`, `AI_TIMEOUT`, `AI_PROVIDER_ERROR`, `AI_INVALID_OUTPUT`, `PROJECT_NOT_EMPTY`).
- **Tests d'acceptance LOT 3** : `tests/acceptance/fake_ai.py`, `tests/acceptance/fixtures/*.json`, `infra/docker-compose.test.yml`, `tests/acceptance/lot3.sh`, `tests/acceptance/lot3_live.sh` et `tests/acceptance/run_all.sh`.

## Écarts d'environnement / hors périmètre LOT 3

- Branche `v1/lot-3` créée depuis le tag local `lot-2` (équivalent sur ce dépôt du tag `lot-2b` mentionné dans le prompt).
- Le catalogue IA admin (`catalog_router.py`, `catalog_service.py`), `generator_engine.py`, les frontends et les services gelés n'ont pas été modifiés.
- `GET /api/interface/{project_id}` (`interface_builder/service.py`) crée automatiquement une interface et une page d'accueil `/` lors d'une lecture sur un projet vierge (comportement pré-existant conservé hors périmètre LOT 3).
- Sous Windows 10 Pro sans Docker, la validation bout en bout de `lot2.sh` + `lot3.sh` a été exécutée contre PostgreSQL 17 réel, les 3 serveurs `uvicorn` réels et `tests/acceptance/fake_ai.py` réel (et `lot3_live.sh` est SKIP sans `MISTRAL_API_KEY`).

---

# Notes techniques — LOT 4 (`v1/lot-4`)

## Points réglés dans le LOT 4

- Factorisation du moteur d'écriture transactionnelle (`schema` + `interface` + `workflows`) dans `backend/svc-nocode-core/app/core/app_builder.py` (`apply_blueprint`) réutilisé par `AIService` et `TemplateService`.
- Hook d'échec atomique dans `app_builder.py` activé **exclusivement** par la variable d'environnement `TEST_FAIL_TEMPLATE_INSTANTIATION=1` (jamais définie dans `docker-compose.v1.yml`, `.env.example` ou les scripts de démarrage).
- Catalogue serveur de 3 templates (`backend/svc-nocode-core/app/modules/templates/catalog/*.json`) validés au démarrage par les schémas Pydantic d'IA (`AISchemaOutput`, `AIInterfaceOutput`) et exposés via `GET /api/templates` et `POST /api/templates/{template_id}/instantiate`.
- Unicité garantie du `slug` dans `ProjectRepository._unique_slug()` en cas de création multiple avec le même nom.
- Garde-fous ajoutés dans `tests/acceptance/static_checks.sh` : validation du catalogue hors conteneur (avec `SECRET_KEY` éphémère isolé en sous-shell `env -i`) et vérification `DOCKER_BUILDKIT=0` sur tous les scripts appelant `docker compose up/build`.

## Constats hors périmètre LOT 4 (conservés sans correction dans LOT 4)

- `backend/svc-nocode-core/app/modules/generator/generator_engine.py` contient 3 dictionnaires imbriqués dans des `set` (`{{...}}` aux lignes 870–872, 890–892, 912 pour `stats-row`, `card-grid`, `form`), causant `TypeError: unhashable type: 'dict'` lors de la génération des templates (corrigé explicitement au LOT 4b).
- `backend/svc-nocode-core/app/core/database.py` a `echo=settings.ENVIRONMENT == "development"`.
- `organization_id`, `company_id`, `product_id` dans les schémas des 3 templates sont de type `number` alors que les identifiants `tracking_id` en base sont des UUID (alignement prévu ultérieurement).

---

# Notes techniques — LOT 4b (`v1/lot-4b`)

## Points réglés dans le LOT 4b

- Correction minimale autorisée dans `backend/svc-nocode-core/app/modules/generator/generator_engine.py` : remplacement des 3 valeurs par défaut `{{...}}` (`set` de `dict`) par `{...}` (`dict` dans `list`) pour `stats-row` (lignes 870–872), `card-grid` (lignes 890–892) et `form` (ligne 912). Le double échappement `\\n` (lignes 759, 784) reste intact et hors périmètre.
- Zéro monkeypatch dans `generator/service.py` ni ailleurs dans `backend/`.
- Ajout du contrôle statique AST permanent anti-monkeypatch (avec auto-test) dans `tests/acceptance/static_checks.sh`.
- Ajout de `tests/acceptance/lot4b.sh` (ZIP contenant `backend/main.py`, `frontend/src/App.jsx` et les pages `.jsx` pour les 3 templates + preuve de mutation en copie temporaire).

## Réponses aux points d'audit LOT 4b (rapport sans modification)

1. **`projects/repository.py`** : modifié au LOT 4 uniquement pour ajouter `_unique_slug()` afin d'éviter la violation de contrainte `UNIQUE(slug)` lors de l'instanciation multiple d'un template sous le même nom (étape `f`).
2. **Affichage SQL (`echo`)** : `backend/svc-nocode-core/app/core/database.py` (ligne 8) définit `echo=settings.ENVIRONMENT == "development"` (`ENVIRONMENT` vaut `"development"` par défaut dans `config.py`), ce qui logue les requêtes SQL et leurs paramètres. `svc-iam` n'active pas `echo=True`. Hors périmètre de correction LOT 4b (noté pour un lot ultérieur).
3. **Types `organization_id`, `company_id`, `product_id` (`number` vs `UUID`)** : incohérence conservée pour décision produit ultérieure (les tables générées par `generator_engine.py` utilisent un `id` `Integer` auto-incrémenté côté backend exporté, tandis que `nocode-core` utilise des `tracking_id` UUID).
