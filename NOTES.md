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
