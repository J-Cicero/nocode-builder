#!/usr/bin/env bash
set -euo pipefail

export DOCKER_BUILDKIT=0
export COMPOSE_DOCKER_CLI_BUILD=0

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.v1.yml"
GATEWAY_URL="${GATEWAY_URL:-http://localhost:8000}"
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

json_field() {
  local field="$1"
  python3 -c 'import json, sys; data = json.loads(sys.stdin.read()); print(data.get(sys.argv[1], ""))' "$field"
}

jwt_sub() {
  python3 -c '
import base64, json, sys
tok = sys.stdin.read().strip()
part = tok.split(".")[1]
part += "=" * (-len(part) % 4)
print(json.loads(base64.urlsafe_b64decode(part))["sub"])
'
}

if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  echo "[prereq] docker compose introuvable sur cette machine | FAIL"
  exit 1
fi

export PLATFORM_SHARED_SECRET="${PLATFORM_SHARED_SECRET:-$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')}"
export IAM_DB_PASSWORD="${IAM_DB_PASSWORD:-$(python3 -c 'import secrets; print(secrets.token_hex(16))')}"
export NOCODE_DB_PASSWORD="${NOCODE_DB_PASSWORD:-$(python3 -c 'import secrets; print(secrets.token_hex(16))')}"

docker compose -f "$COMPOSE_FILE" down -v >/dev/null 2>&1 || true
docker compose -f "$COMPOSE_FILE" up -d --build --wait

RUN_ID="$(python3 -c 'import uuid; print(uuid.uuid4().hex[:8])')"
USER_A="lot4_a_${RUN_ID}@example.com"
USER_B="lot4_b_${RUN_ID}@example.com"
PASSWORD="Password123!"

http_call POST "$GATEWAY_URL/api/iam/auth/register" "{\"email\":\"$USER_A\",\"name\":\"User\",\"surname\":\"A\",\"password\":\"$PASSWORD\"}" >/dev/null
LOGIN_A="$(http_call POST "$GATEWAY_URL/api/iam/auth/login" "{\"email\":\"$USER_A\",\"password\":\"$PASSWORD\"}")"
TOKEN_A="$(printf '%s' "${LOGIN_A#*$'\n'}" | json_field access_token || true)"
SUB_A="$(printf '%s' "$TOKEN_A" | jwt_sub)"

http_call POST "$GATEWAY_URL/api/iam/auth/register" "{\"email\":\"$USER_B\",\"name\":\"User\",\"surname\":\"B\",\"password\":\"$PASSWORD\"}" >/dev/null
LOGIN_B="$(http_call POST "$GATEWAY_URL/api/iam/auth/login" "{\"email\":\"$USER_B\",\"password\":\"$PASSWORD\"}")"
TOKEN_B="$(printf '%s' "${LOGIN_B#*$'\n'}" | json_field access_token || true)"

# a. GET /api/templates -> 3 entrées ; sans token -> 401
OUT_NOAUTH="$(http_call GET "$GATEWAY_URL/api/nocode/api/templates")"
OUT_LIST="$(http_call GET "$GATEWAY_URL/api/nocode/api/templates" "" "$TOKEN_A")"
TPL_IDS="$(printf '%s' "${OUT_LIST#*$'\n'}" | python3 -c 'import json,sys; d=json.loads(sys.stdin.read()); assert len(d)==3; print(" ".join(x["id"] for x in d))')" || TPL_IDS=""
if [[ "${OUT_NOAUTH%%$'\n'*}" == "401" && "${OUT_LIST%%$'\n'*}" == "200" && -n "$TPL_IDS" ]]; then
  report_step "a" "200/401" "templates=$TPL_IDS" "PASS"
else
  report_step "a" "${OUT_LIST%%$'\n'*}" "${OUT_LIST#*$'\n'}" "FAIL"
fi

# b, c, d. Pour chaque template : instancier, vérifier DB, générer ZIP (backend/main.py), vérifier B=404
declare -a PROJ_IDS=()
B_FAILS=0
C_FAILS=0
D_FAILS=0

for tid in $TPL_IDS; do
  OUT_INST="$(http_call POST "$GATEWAY_URL/api/nocode/api/templates/$tid/instantiate" "{\"name\":\"Projet $tid $RUN_ID\"}" "$TOKEN_A")"
  ICODE="${OUT_INST%%$'\n'*}"
  IBODY="${OUT_INST#*$'\n'}"
  PID="$(printf '%s' "$IBODY" | json_field tracking_id || true)"
  OWNER="$(printf '%s' "$IBODY" | json_field owner_id || true)"
  PROJ_IDS+=("$PID")

  if [[ "$ICODE" != "201" || -z "$PID" || "$OWNER" != "$SUB_A" ]]; then
    B_FAILS=$((B_FAILS + 1))
    continue
  fi

  VERIFY_DB="$(python3 -c '
import json, sys, urllib.request
gw, pid, tok = sys.argv[1], sys.argv[2], sys.argv[3]
def get(p):
    req = urllib.request.Request(f"{gw}{p}", headers={"Authorization": f"Bearer {tok}"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode())
allowed = {"navbar","hero","stats-row","data-table","form","card-grid","text-section","mobile-header","mobile-card-list","bottom-nav"}
sc = get(f"/api/nocode/api/schema/projects/{pid}")
ic = get(f"/api/nocode/api/interface/{pid}")
tables = sc.get("tables", [])
pages = ic.get("pages", [])
secs = [s for p in pages for s in p.get("sections", [])]
assert len(tables) >= 1 and all(len(t.get("fields", [])) >= 1 for t in tables)
assert len(pages) >= 1 and len(secs) >= 1
assert all(s["type"] in allowed for s in secs)
print("True")
' "$GATEWAY_URL" "$PID" "$TOKEN_A" || echo "False")"
  if [[ "$VERIFY_DB" != "True" ]]; then
    B_FAILS=$((B_FAILS + 1))
  fi

  OUT_GEN="$(http_call POST "$GATEWAY_URL/api/nocode/api/generator/$PID" "{\"nom\":\"Build-$tid\",\"config\":{}}" "$TOKEN_A")"
  GCODE="${OUT_GEN%%$'\n'*}"
  GID="$(printf '%s' "${OUT_GEN#*$'\n'}" | json_field tracking_id || true)"
  if [[ "$GCODE" == "201" && -n "$GID" ]]; then
    TMP_ZIP="$(mktemp --suffix=.zip)"
    curl -sf -H "Authorization: Bearer $TOKEN_A" "$GATEWAY_URL/api/nocode/api/generator/download/$GID" -o "$TMP_ZIP"
    if ! python3 -c 'import sys, zipfile; zf=zipfile.ZipFile(sys.argv[1]); assert "backend/main.py" in zf.namelist()' "$TMP_ZIP"; then
      C_FAILS=$((C_FAILS + 1))
    fi
    rm -f "$TMP_ZIP"
  else
    C_FAILS=$((C_FAILS + 1))
  fi

  for pair in "GET /api/nocode/api/projects/$PID" "PATCH /api/nocode/api/projects/$PID" "DELETE /api/nocode/api/projects/$PID" "POST /api/nocode/api/generator/$PID"; do
    m="${pair%% *}"
    u="${pair#* }"
    bpayload=""
    [[ "$m" == "PATCH" ]] && bpayload="{\"name\":\"Hijack\"}"
    [[ "$m" == "POST" ]] && bpayload="{\"nom\":\"Hijack\",\"config\":{}}"
    res="$(http_call "$m" "${GATEWAY_URL}${u}" "$bpayload" "$TOKEN_B")"
    if [[ "${res%%$'\n'*}" != "404" ]]; then
      D_FAILS=$((D_FAILS + 1))
    fi
  done
done

[[ "$B_FAILS" -eq 0 ]] && report_step "b" "201" "3/3 templates instanciés et vérifiés" "PASS" || report_step "b" "n/a" "b_fails=$B_FAILS" "FAIL"
[[ "$C_FAILS" -eq 0 ]] && report_step "c" "201" "3/3 ZIP générés avec backend/main.py" "PASS" || report_step "c" "n/a" "c_fails=$C_FAILS" "FAIL"
[[ "$D_FAILS" -eq 0 ]] && report_step "d" "404" "isolation B=404 (12/12 appels sur les 3 projets)" "PASS" || report_step "d" "n/a" "d_fails=$D_FAILS" "FAIL"

# e. Atomicité avec ENABLE_TEST_HOOKS=1 et TEST_FAIL_TEMPLATE_INSTANTIATION=1
db_counts_user_a() {
  docker compose -f "$COMPOSE_FILE" exec -T svc-nocode-core-db \
    psql -U "${NOCODE_DB_USER:-nocode}" -d "${NOCODE_DB_NAME:-nocode_builder_v2}" -Atc \
    "SELECT (SELECT count(*) FROM nocode_projects WHERE owner_id = '$SUB_A') || ',' || (SELECT count(*) FROM schemas s JOIN nocode_projects p ON s.project_id = p.tracking_id WHERE p.owner_id = '$SUB_A') || ',' || (SELECT count(*) FROM tables_schema t JOIN schemas s ON t.schema_id = s.tracking_id JOIN nocode_projects p ON s.project_id = p.tracking_id WHERE p.owner_id = '$SUB_A') || ',' || (SELECT count(*) FROM interfaces i JOIN nocode_projects p ON i.project_id = p.tracking_id WHERE p.owner_id = '$SUB_A');"
}

COMPOSE_TEST_FILE="$ROOT_DIR/infra/docker-compose.test.yml"
COUNTS_BEFORE="$(db_counts_user_a)"
ENABLE_TEST_HOOKS=1 TEST_FAIL_TEMPLATE_INSTANTIATION=1 docker compose -f "$COMPOSE_FILE" -f "$COMPOSE_TEST_FILE" up -d --no-deps --wait svc-nocode-core >/dev/null
OUT_FAIL="$(http_call POST "$GATEWAY_URL/api/nocode/api/templates/saas-dashboard/instantiate" "{\"name\":\"Atomic Fail $RUN_ID\"}" "$TOKEN_A")"
LOG_LINE="$(docker compose -f "$COMPOSE_FILE" logs --tail=80 svc-nocode-core | grep -F "TEST_FAIL_TEMPLATE_INSTANTIATION=1" || true)"
docker compose -f "$COMPOSE_FILE" up -d --no-deps --wait svc-nocode-core >/dev/null
COUNTS_AFTER="$(db_counts_user_a)"

if [[ "${OUT_FAIL%%$'\n'*}" == "500" && -n "$LOG_LINE" && "$COUNTS_BEFORE" == "$COUNTS_AFTER" ]]; then
  report_step "e" "500" "counts=$COUNTS_AFTER hook='$LOG_LINE'" "PASS"
else
  report_step "e" "${OUT_FAIL%%$'\n'*}" "before=$COUNTS_BEFORE after=$COUNTS_AFTER log=$LOG_LINE" "FAIL"
fi

# f. Template inconnu -> 404 ; nom vide -> 422 ; même nom 2 fois -> 2 projets distincts
OUT_UNK="$(http_call POST "$GATEWAY_URL/api/nocode/api/templates/inconnu/instantiate" "{\"name\":\"Valid\"}" "$TOKEN_A")"
OUT_EMP="$(http_call POST "$GATEWAY_URL/api/nocode/api/templates/saas-dashboard/instantiate" "{\"name\":\"   \"}" "$TOKEN_A")"
OUT_D1="$(http_call POST "$GATEWAY_URL/api/nocode/api/templates/saas-dashboard/instantiate" "{\"name\":\"Meme Nom $RUN_ID\"}" "$TOKEN_A")"
OUT_D2="$(http_call POST "$GATEWAY_URL/api/nocode/api/templates/saas-dashboard/instantiate" "{\"name\":\"Meme Nom $RUN_ID\"}" "$TOKEN_A")"
ID1="$(printf '%s' "${OUT_D1#*$'\n'}" | json_field tracking_id || true)"
ID2="$(printf '%s' "${OUT_D2#*$'\n'}" | json_field tracking_id || true)"
SLUG1="$(printf '%s' "${OUT_D1#*$'\n'}" | json_field slug || true)"
SLUG2="$(printf '%s' "${OUT_D2#*$'\n'}" | json_field slug || true)"

if [[ "${OUT_UNK%%$'\n'*}" == "404" && "${OUT_EMP%%$'\n'*}" == "422" && "${OUT_D1%%$'\n'*}" == "201" && "${OUT_D2%%$'\n'*}" == "201" && "$ID1" != "$ID2" && "$SLUG1" != "$SLUG2" ]]; then
  report_step "f" "404/422/201" "slug1=$SLUG1 slug2=$SLUG2" "PASS"
else
  report_step "f" "${OUT_UNK%%$'\n'*}/${OUT_EMP%%$'\n'*}/${OUT_D1%%$'\n'*}/${OUT_D2%%$'\n'*}" "id1=$ID1 id2=$ID2" "FAIL"
fi

# g. /api/templates dans OpenAPI + 401 sans token
OPENAPI_CHECK="$(curl -sf "$NOCODE_URL/openapi.json" | python3 -c '
import json, sys
paths = json.loads(sys.stdin.read()).get("paths", {})
print("/api/templates" in paths and "/api/templates/{template_id}/instantiate" in paths)
')"
if [[ "$OPENAPI_CHECK" == "True" ]]; then
  report_step "g" "200" "/api/templates et /api/templates/{template_id}/instantiate présents dans OpenAPI" "PASS"
else
  report_step "g" "n/a" "routes templates absentes de OpenAPI" "FAIL"
fi

# h. static_checks.sh (inclut validation catalogue)
if bash "$ROOT_DIR/tests/acceptance/static_checks.sh"; then
  report_step "h" "n/a" "static_checks.sh + validation catalogue OK" "PASS"
else
  report_step "h" "n/a" "static_checks.sh failed" "FAIL"
fi

if [[ "$FAILURES" -gt 0 ]]; then
  echo "=== RESULTAT LOT 4: $FAILURES ECHEC(S) ==="
  exit 1
fi
echo "=== RESULTAT LOT 4: 100% PASS ==="
