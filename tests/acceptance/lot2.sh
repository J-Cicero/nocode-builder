#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.v1.yml"
GATEWAY_URL="${GATEWAY_URL:-http://localhost:8000}"
IAM_URL="${IAM_URL:-http://localhost:8001}"
NOCODE_URL="${NOCODE_URL:-http://localhost:8002}"

FAILURES=0

truncate_body() {
  python3 -c 'import sys; s = sys.stdin.read().replace("\n", " "); print(s[:220] + ("..." if len(s) > 220 else ""))'
}

report_step() {
  local step_id="$1"
  local http_code="$2"
  local raw_body="$3"
  local status="$4"
  local detail="${5:-}"
  local preview
  preview="$(printf '%s' "$raw_body" | truncate_body)"
  echo "[$step_id] HTTP=$http_code | BODY=$preview | $status${detail:+ ($detail)}"
  if [[ "$status" != "PASS" ]]; then
    FAILURES=$((FAILURES + 1))
  fi
}

http_call() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  local token="${4:-}"
  local tmp_file
  tmp_file="$(mktemp)"
  local -a args=(-sS -o "$tmp_file" -w "%{http_code}" -X "$method" "$url")
  if [[ -n "$token" ]]; then
    args+=(-H "Authorization: Bearer $token")
  fi
  if [[ -n "$body" ]]; then
    args+=(-H "Content-Type: application/json" -d "$body")
  fi
  local code
  code="$(curl "${args[@]}" || echo "000")"
  local resp
  resp="$(cat "$tmp_file")"
  rm -f "$tmp_file"
  printf '%s\n%s' "$code" "$resp"
}

extract_json_field() {
  local field="$1"
  python3 -c 'import json, sys; data = json.loads(sys.stdin.read()); print(data.get(sys.argv[1], ""))' "$field"
}

if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  echo "[prereq] docker compose introuvable sur cette machine | FAIL"
  exit 1
fi

export PLATFORM_SHARED_SECRET="${PLATFORM_SHARED_SECRET:-$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')}"
export IAM_DB_PASSWORD="${IAM_DB_PASSWORD:-$(python3 -c 'import secrets; print(secrets.token_hex(16))')}"
export NOCODE_DB_PASSWORD="${NOCODE_DB_PASSWORD:-$(python3 -c 'import secrets; print(secrets.token_hex(16))')}"

if ! curl -sf "$GATEWAY_URL/health" >/dev/null 2>&1; then
  docker compose -f "$COMPOSE_FILE" up -d --build --wait
fi

# a. Vérifier que svc-nocode-core expose >= 20 opérations dans OpenAPI
OPENAPI_JSON="$(curl -sf "$NOCODE_URL/openapi.json")"
ROUTE_COUNT="$(printf '%s' "$OPENAPI_JSON" | python3 -c '
import json, sys
spec = json.loads(sys.stdin.read())
ops = sum(1 for methods in spec.get("paths", {}).values() for m in methods if m.lower() in {"get","post","put","patch","delete"})
print(ops)
')"
if [[ "$ROUTE_COUNT" -ge 20 ]]; then
  report_step "a" "200" "openapi_ops=$ROUTE_COUNT" "PASS"
else
  report_step "a" "200" "openapi_ops=$ROUTE_COUNT" "FAIL" "attendu >= 20"
fi

# b. Balayage 401 sans Authorization sur toutes les routes OpenAPI hors liste blanche
SWEEP_RESULT="$(printf '%s' "$OPENAPI_JSON" | python3 -c '
import json, re, sys, urllib.error, urllib.request
spec = json.loads(sys.stdin.read())
base = sys.argv[1].rstrip("/")
whitelist = {"/", "/health", "/docs", "/openapi.json"}
bad = []
checked = 0
dummy_uuid = "00000000-0000-0000-0000-000000000001"
for path, methods in spec.get("paths", {}).items():
    if path in whitelist or path.startswith("/public-deployments/"):
        continue
    url_path = re.sub(r"\{[^}]*table_name[^}]*\}", "items", path)
    url_path = re.sub(r"\{[^}]+\}", dummy_uuid, url_path)
    for m in methods:
        method = m.upper()
        if method not in {"GET", "POST", "PUT", "PATCH", "DELETE"}:
            continue
        checked += 1
        req = urllib.request.Request(f"{base}{url_path}", method=method)
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                code = resp.status
        except urllib.error.HTTPError as err:
            code = err.code
        if code != 401:
            bad.append(f"{method} {path} -> {code}")
print(f"checked={checked};bad={bad}")
if bad or checked < 20:
    sys.exit(1)
' "$NOCODE_URL" 2>&1)" && SWEEP_OK=1 || SWEEP_OK=0

if [[ "$SWEEP_OK" -eq 1 ]]; then
  report_step "b" "401" "$SWEEP_RESULT" "PASS"
else
  report_step "b" "n/a" "$SWEEP_RESULT" "FAIL"
fi

# c. Créer User A et User B et récupérer leurs tokens
RUN_ID="$(python3 -c 'import uuid; print(uuid.uuid4().hex[:8])')"
USER_A="lot2_a_${RUN_ID}@example.com"
USER_B="lot2_b_${RUN_ID}@example.com"
PASSWORD="Password123!"

http_call POST "$GATEWAY_URL/api/iam/auth/register" "{\"email\":\"$USER_A\",\"name\":\"User\",\"surname\":\"A\",\"password\":\"$PASSWORD\"}" >/dev/null
LOGIN_A="$(http_call POST "$GATEWAY_URL/api/iam/auth/login" "{\"email\":\"$USER_A\",\"password\":\"$PASSWORD\"}")"
TOKEN_A="$(printf '%s' "${LOGIN_A#*$'\n'}" | extract_json_field access_token || true)"

http_call POST "$GATEWAY_URL/api/iam/auth/register" "{\"email\":\"$USER_B\",\"name\":\"User\",\"surname\":\"B\",\"password\":\"$PASSWORD\"}" >/dev/null
LOGIN_B="$(http_call POST "$GATEWAY_URL/api/iam/auth/login" "{\"email\":\"$USER_B\",\"password\":\"$PASSWORD\"}")"
TOKEN_B="$(printf '%s' "${LOGIN_B#*$'\n'}" | extract_json_field access_token || true)"

if [[ -n "$TOKEN_A" && -n "$TOKEN_B" ]]; then
  report_step "c" "200" "tokens A et B obtenus" "PASS"
else
  report_step "c" "n/a" "echec obtention tokens" "FAIL"
  exit 1
fi

# d. A crée projet, page, section hero, table, champ, et génère un ZIP
OUT="$(http_call POST "$GATEWAY_URL/api/nocode/api/projects/" "{\"name\":\"Lot2 App $RUN_ID\",\"description\":\"Ownership test\"}" "$TOKEN_A")"
PROJECT_ID="$(printf '%s' "${OUT#*$'\n'}" | extract_json_field tracking_id || true)"

OUT="$(http_call POST "$GATEWAY_URL/api/nocode/api/interface/$PROJECT_ID/pages" "{\"nom\":\"Accueil\",\"chemin\":\"/\",\"est_accueil\":true}" "$TOKEN_A")"
PAGE_ID="$(printf '%s' "${OUT#*$'\n'}" | extract_json_field tracking_id || true)"

OUT="$(http_call POST "$GATEWAY_URL/api/nocode/api/interface/pages/$PAGE_ID/sections" "{\"type\":\"hero\",\"title\":\"Bienvenue\",\"config\":{\"headline\":\"Hello\"}}" "$TOKEN_A")"
SECTION_ID="$(printf '%s' "${OUT#*$'\n'}" | extract_json_field tracking_id || true)"

OUT="$(http_call POST "$GATEWAY_URL/api/nocode/api/schema/projects/$PROJECT_ID/tables" "{\"name\":\"items\",\"display_name\":\"Items\"}" "$TOKEN_A")"
TABLE_ID="$(printf '%s' "${OUT#*$'\n'}" | extract_json_field tracking_id || true)"

OUT="$(http_call POST "$GATEWAY_URL/api/nocode/api/schema/tables/$TABLE_ID/fields" "{\"name\":\"title\",\"type\":\"text\",\"required\":true}" "$TOKEN_A")"
FIELD_ID="$(printf '%s' "${OUT#*$'\n'}" | extract_json_field tracking_id || true)"

OUT="$(http_call POST "$GATEWAY_URL/api/nocode/api/generator/$PROJECT_ID" "{\"nom\":\"Lot2Build\",\"config\":{}}" "$TOKEN_A")"
GEN_ID="$(printf '%s' "${OUT#*$'\n'}" | extract_json_field tracking_id || true)"

if [[ -n "$PROJECT_ID" && -n "$PAGE_ID" && -n "$SECTION_ID" && -n "$TABLE_ID" && -n "$FIELD_ID" && -n "$GEN_ID" ]]; then
  report_step "d" "201" "project=$PROJECT_ID gen=$GEN_ID" "PASS"
else
  report_step "d" "n/a" "creation ressources A incomplete" "FAIL"
fi

# e. B tente lire/modifier/supprimer/télécharger les ressources de A -> 404 partout ; A -> 200
B_FAILS=0
check_404_b() {
  local method="$1"
  local url="$2"
  local body="${3:-}"
  local res
  res="$(http_call "$method" "$url" "$body" "$TOKEN_B")"
  local code="${res%%$'\n'*}"
  if [[ "$code" != "404" ]]; then
    echo "  [isolation FAIL] $method $url -> HTTP=$code (attendu 404)"
    B_FAILS=$((B_FAILS + 1))
  fi
}

check_404_b GET "$GATEWAY_URL/api/nocode/api/projects/$PROJECT_ID"
check_404_b PATCH "$GATEWAY_URL/api/nocode/api/projects/$PROJECT_ID" "{\"name\":\"Hijack\"}"
check_404_b DELETE "$GATEWAY_URL/api/nocode/api/projects/$PROJECT_ID"
check_404_b GET "$GATEWAY_URL/api/nocode/api/interface/$PROJECT_ID"
check_404_b GET "$GATEWAY_URL/api/nocode/api/interface/pages/$PAGE_ID"
check_404_b PATCH "$GATEWAY_URL/api/nocode/api/interface/sections/$SECTION_ID" "{\"title\":\"Hijack\"}"
check_404_b GET "$GATEWAY_URL/api/nocode/api/schema/projects/$PROJECT_ID"
check_404_b PATCH "$GATEWAY_URL/api/nocode/api/schema/tables/$TABLE_ID" "{\"display_name\":\"Hijack\"}"
check_404_b GET "$GATEWAY_URL/api/nocode/api/generator/generation/$GEN_ID"
check_404_b GET "$GATEWAY_URL/api/nocode/api/generator/download/$GEN_ID"
check_404_b GET "$GATEWAY_URL/api/nocode/api/ai/projects/$PROJECT_ID/history"
check_404_b GET "$GATEWAY_URL/api/nocode/api/workflows/$PROJECT_ID"
check_404_b GET "$GATEWAY_URL/api/nocode/api/data/projects/$PROJECT_ID/items"

OUT_A_PROJ="$(http_call GET "$GATEWAY_URL/api/nocode/api/projects/$PROJECT_ID" "" "$TOKEN_A")"
OUT_A_ZIP="$(http_call GET "$GATEWAY_URL/api/nocode/api/generator/download/$GEN_ID" "" "$TOKEN_A")"
if [[ "$B_FAILS" -eq 0 && "${OUT_A_PROJ%%$'\n'*}" == "200" && "${OUT_A_ZIP%%$'\n'*}" == "200" ]]; then
  report_step "e" "404/200" "isolation B=404 (13/13), acces A=200" "PASS"
else
  report_step "e" "n/a" "b_fails=$B_FAILS a_proj=${OUT_A_PROJ%%$'\n'*} a_zip=${OUT_A_ZIP%%$'\n'*}" "FAIL"
fi

# f. Ancienne API /api/v1/projects -> 404
OUT="$(http_call GET "$GATEWAY_URL/api/nocode/api/v1/projects" "" "$TOKEN_A")"
CODE="${OUT%%$'\n'*}"
BODY="${OUT#*$'\n'}"
if [[ "$CODE" == "404" ]]; then
  report_step "f" "$CODE" "$BODY" "PASS"
else
  report_step "f" "$CODE" "$BODY" "FAIL"
fi

# g. Démarrer chaque service avec SECRET_KEY=court -> doit échouer
SHORT_OK=1
for svc in svc-iam svc-nocode-core svc-api-gateway; do
  if docker compose -f "$COMPOSE_FILE" run --rm -T --no-deps -e SECRET_KEY=court "$svc" \
     python -c "import app.main" >/dev/null 2>&1; then
    echo "  [secret FAIL] $svc a accepté SECRET_KEY=court"
    SHORT_OK=0
  fi
done
if [[ "$SHORT_OK" -eq 1 ]]; then
  report_step "g" "n/a" "svc-iam, svc-nocode-core, svc-api-gateway rejettent SECRET_KEY=court" "PASS"
else
  report_step "g" "n/a" "un service a accepté SECRET_KEY=court" "FAIL"
fi

# h. Inspecter \dt dans nocode-core DB : aucune table legacy
TABLES_OUT="$(docker compose -f "$COMPOSE_FILE" exec -T svc-nocode-core-db \
  psql -U "${NOCODE_DB_USER:-nocode}" -d "${NOCODE_DB_NAME:-nocode_builder_v2}" -Atc "\dt")"
if printf '%s' "$TABLES_OUT" | grep -qE "\|(users|workspaces|blueprints|projects)\|"; then
  report_step "h" "n/a" "tables legacy detectees: $TABLES_OUT" "FAIL"
else
  report_step "h" "n/a" "aucune table legacy dans svc-nocode-core-db" "PASS"
fi

# i. Couper svc-iam -> gateway doit renvoyer 502 ou 503 en JSON -> redémarrer svc-iam
docker compose -f "$COMPOSE_FILE" stop svc-iam >/dev/null
OUT="$(http_call POST "$GATEWAY_URL/api/iam/auth/login" "{\"email\":\"$USER_A\",\"password\":\"$PASSWORD\"}")"
CODE="${OUT%%$'\n'*}"
BODY="${OUT#*$'\n'}"
IS_JSON="$(printf '%s' "$BODY" | python3 -c 'import json,sys; d=json.loads(sys.stdin.read()); print(isinstance(d, dict) and "detail" in d)' 2>/dev/null || echo "False")"
docker compose -f "$COMPOSE_FILE" start svc-iam >/dev/null
sleep 3
if [[ ("$CODE" == "502" || "$CODE" == "503") && "$IS_JSON" == "True" ]]; then
  report_step "i" "$CODE" "$BODY" "PASS"
else
  report_step "i" "$CODE" "$BODY" "FAIL"
fi

# j. Grep 0 référence à app.modules.auth.models
if grep -rn "app\.modules\.auth\.models" "$ROOT_DIR/backend/svc-nocode-core/app/" >/dev/null 2>&1; then
  report_step "j" "n/a" "app.modules.auth.models encore present" "FAIL"
else
  report_step "j" "n/a" "0 reference a app.modules.auth.models" "PASS"
fi

if [[ "$FAILURES" -gt 0 ]]; then
  echo "=== RESULTAT LOT 2: $FAILURES ECHEC(S) ==="
  exit 1
fi
echo "=== RESULTAT LOT 2: 100% PASS ==="
