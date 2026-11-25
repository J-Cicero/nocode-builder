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
5. **`tests/acceptance/lot1.sh`, `lot2.sh`, `run_all.sh`** : validés syntaxiquement par `bash -n` ; sous Windows 10 Pro sans Docker, la validation d'exécution complète a été exécutée contre PostgreSQL 17 réel et les 3 serveurs `uvicorn` réels (`svc-iam`, `svc-nocode-core`, `svc-api-gateway`).
