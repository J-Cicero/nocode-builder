# Périmètre gelé (V1)

Ce document recense les microservices et portails exclus de la stack V1 ([infra/docker-compose.v1.yml](infra/docker-compose.v1.yml)).
Leur code est conservé intact dans le dépôt mais **gelé** pour le socle V1 : `svc-api-gateway` démarre et fonctionne sans eux.

## Services backend gelés (6)

1. `backend/svc-tenant`
2. `backend/svc-billing`
3. `backend/svc-payment-gateway`
4. `backend/svc-customer-service`
5. `backend/svc-service-desk`
6. `backend/svc-consent-dsar`

## Portails frontend gelés (6)

1. `frontend/host-shell`
2. `frontend/portal-admin`
3. `frontend/portal-super-admin`
4. `frontend/portal-customer-service`
5. `frontend/portal-service-desk`
6. `frontend/site-legal-rgpd`

## Noyau V1 actif

- Bases : `svc-iam-db`, `svc-nocode-core-db`
- Services : `svc-iam`, `svc-nocode-core`, `svc-api-gateway`
- Frontend utilisateur (hors scope compose V1) : `frontend/portal-user`
