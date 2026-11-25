#!/usr/bin/env bash
set -euo pipefail

export DOCKER_BUILDKIT=0
export COMPOSE_DOCKER_CLI_BUILD=0

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_V1="$ROOT_DIR/infra/docker-compose.v1.yml"
COMPOSE_TEST="$ROOT_DIR/infra/docker-compose.test.yml"
GATEWAY_URL="${GATEWAY_URL:-http://localhost:8000}"
FAKE_AI_URL="${FAKE_AI_URL:-http://localhost:8090}"

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

if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  echo "[prereq] docker compose introuvable sur cette machine | FAIL"
  exit 1
fi

export PLATFORM_SHARED_SECRET="${PLATFORM_SHARED_SECRET:-$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')}"
export IAM_DB_PASSWORD="${IAM_DB_PASSWORD:-$(python3 -c 'import secrets; print(secrets.token_hex(16))')}"
export NOCODE_DB_PASSWORD="${NOCODE_DB_PASSWORD:-$(python3 -c 'import secrets; print(secrets.token_hex(16))')}"

# a. Contrôles statiques (ruff F821/F811 + auto-test)
if bash "$ROOT_DIR/tests/acceptance/static_checks.sh"; then
  report_step "a" "n/a" "static_checks.sh + selftest OK" "PASS"
else
  report_step "a" "n/a" "static_checks.sh failed" "FAIL"
fi

# Démarrage de sa propre pile avec les deux fichiers compose
docker compose -f "$COMPOSE_V1" -f "$COMPOSE_TEST" down -v >/dev/null 2>&1 || true
docker compose -f "$COMPOSE_V1" -f "$COMPOSE_TEST" up -d --build --wait

RUN_ID="$(python3 -c 'import uuid; print(uuid.uuid4().hex[:8])')"
USER_A="lot3_a_${RUN_ID}@example.com"
USER_B="lot3_b_${RUN_ID}@example.com"
PASSWORD="Password123!"

http_call POST "$GATEWAY_URL/api/iam/auth/register" "{\"email\":\"$USER_A\",\"name\":\"User\",\"surname\":\"A\",\"password\":\"$PASSWORD\"}" >/dev/null
LOGIN_A="$(http_call POST "$GATEWAY_URL/api/iam/auth/login" "{\"email\":\"$USER_A\",\"password\":\"$PASSWORD\"}")"
TOKEN_A="$(printf '%s' "${LOGIN_A#*$'\n'}" | json_field access_token || true)"

http_call POST "$GATEWAY_URL/api/iam/auth/register" "{\"email\":\"$USER_B\",\"name\":\"User\",\"surname\":\"B\",\"password\":\"$PASSWORD\"}" >/dev/null
LOGIN_B="$(http_call POST "$GATEWAY_URL/api/iam/auth/login" "{\"email\":\"$USER_B\",\"password\":\"$PASSWORD\"}")"
TOKEN_B="$(printf '%s' "${LOGIN_B#*$'\n'}" | json_field access_token || true)"

create_project() {
  local name="$1"
  local res
  res="$(http_call POST "$GATEWAY_URL/api/nocode/api/projects/" "{\"name\":\"$name\",\"description\":\"Lot 3\"}" "$TOKEN_A")"
  printf '%s' "${res#*$'\n'}" | json_field tracking_id
}

project_snapshot() {
  local pid="$1"
  python3 -c '
import json, sys, urllib.request
gw, pid, tok = sys.argv[1], sys.argv[2], sys.argv[3]
def get(p):
    req = urllib.request.Request(f"{gw}{p}", headers={"Authorization": f"Bearer {tok}"})
    with urllib.request.urlopen(req, timeout=10) as r:
        return json.loads(r.read().decode())
schema = get(f"/api/nocode/api/schema/projects/{pid}")
iface = get(f"/api/nocode/api/interface/{pid}")
tables = sorted(t["name"] for t in schema.get("tables", []))
pages = sorted(p["chemin"] for p in iface.get("pages", []))
sections = [s["type"] for p in iface.get("pages", []) for s in p.get("sections", [])]
print(json.dumps({"tables": tables, "pages": pages, "sections": sections}, sort_keys=True))
' "$GATEWAY_URL" "$pid" "$TOKEN_A"
}

P1="$(create_project "Lot3 App1 $RUN_ID")"
P2="$(create_project "Lot3 SchemaOnly $RUN_ID")"
P3="$(create_project "Lot3 IfaceOnly $RUN_ID")"
P4="$(create_project "Lot3 Retry $RUN_ID")"

# b. generate-app mode valid -> DB + ZIP contenant backend/main.py
OUT="$(http_call POST "$GATEWAY_URL/api/nocode/api/ai/projects/$P1/generate-app" "{\"description\":\"Application pressing complete [[MODE:valid]]\"}" "$TOKEN_A")"
CODE="${OUT%%$'\n'*}"
BODY="${OUT#*$'\n'}"
SNAP_B="$(project_snapshot "$P1")"
GEN_OUT="$(http_call POST "$GATEWAY_URL/api/nocode/api/generator/$P1" "{\"nom\":\"Lot3Zip\",\"config\":{}}" "$TOKEN_A")"
GEN_CODE="${GEN_OUT%%$'\n'*}"
GEN_ID="$(printf '%s' "${GEN_OUT#*$'\n'}" | json_field tracking_id || true)"
ZIP_OK=0
if [[ "$GEN_CODE" == "201" && -n "$GEN_ID" ]]; then
  TMP_ZIP="$(mktemp --suffix=.zip)"
  curl -sf -H "Authorization: Bearer $TOKEN_A" "$GATEWAY_URL/api/nocode/api/generator/download/$GEN_ID" -o "$TMP_ZIP"
  if python3 -c '
import json, sys, zipfile
snap = json.loads(sys.argv[1])
allowed = {"navbar","hero","stats-row","data-table","form","card-grid","text-section","mobile-header","mobile-card-list","bottom-nav"}
assert len(snap["tables"]) >= 1
assert len(snap["pages"]) >= 1
assert len(snap["sections"]) >= 1
assert all(s in allowed for s in snap["sections"])
with zipfile.ZipFile(sys.argv[2]) as zf:
    assert "backend/main.py" in zf.namelist(), zf.namelist()
' "$SNAP_B" "$TMP_ZIP"; then
    ZIP_OK=1
  fi
  rm -f "$TMP_ZIP"
fi
if [[ "$CODE" == "200" && "$ZIP_OK" -eq 1 ]]; then
  report_step "b" "$CODE" "$SNAP_B" "PASS"
else
  report_step "b" "$CODE" "$BODY" "FAIL"
fi

# c. generate-schema seul et generate-interface seul sur projets vides
OUT_S="$(http_call POST "$GATEWAY_URL/api/nocode/api/ai/projects/$P2/generate-schema" "{\"description\":\"Schema pressing simple [[MODE:valid]]\"}" "$TOKEN_A")"
OUT_I="$(http_call POST "$GATEWAY_URL/api/nocode/api/ai/projects/$P3/generate-interface" "{\"description\":\"Interface pressing simple [[MODE:valid]]\"}" "$TOKEN_A")"
if [[ "${OUT_S%%$'\n'*}" == "200" && "${OUT_I%%$'\n'*}" == "200" ]]; then
  report_step "c" "200" "generate-schema & generate-interface seuls OK" "PASS"
else
  report_step "c" "${OUT_S%%$'\n'*}/${OUT_I%%$'\n'*}" "schema=${OUT_S#*$'\n'} iface=${OUT_I#*$'\n'}" "FAIL"
fi

# d. Relance generate-app sur P1 sans replace -> 409 PROJECT_NOT_EMPTY + comptes inchangés
OUT="$(http_call POST "$GATEWAY_URL/api/nocode/api/ai/projects/$P1/generate-app" "{\"description\":\"Deuxieme appel [[MODE:valid]]\"}" "$TOKEN_A")"
CODE="${OUT%%$'\n'*}"
BODY="${OUT#*$'\n'}"
ERR_CODE="$(printf '%s' "$BODY" | json_field code || true)"
SNAP_D="$(project_snapshot "$P1")"
if [[ "$CODE" == "409" && "$ERR_CODE" == "PROJECT_NOT_EMPTY" && "$SNAP_B" == "$SNAP_D" ]]; then
  report_step "d" "$CODE" "$BODY" "PASS"
else
  report_step "d" "$CODE" "$BODY" "FAIL"
fi

# e. ?replace=true -> 200 et remplacement effectué
OUT="$(http_call POST "$GATEWAY_URL/api/nocode/api/ai/projects/$P1/generate-app?replace=true" "{\"description\":\"Remplacement complet [[MODE:valid]]\"}" "$TOKEN_A")"
CODE="${OUT%%$'\n'*}"
BODY="${OUT#*$'\n'}"
SNAP_E="$(project_snapshot "$P1")"
if [[ "$CODE" == "200" ]]; then
  report_step "e" "$CODE" "$SNAP_E" "PASS"
else
  report_step "e" "$CODE" "$BODY" "FAIL"
fi

# f. Atomicité : replace=true avec invalid_json -> 502 AI_INVALID_OUTPUT & contenu P1 intact
OUT="$(http_call POST "$GATEWAY_URL/api/nocode/api/ai/projects/$P1/generate-app?replace=true" "{\"description\":\"Cassure atomique [[MODE:invalid_json]]\"}" "$TOKEN_A")"
CODE="${OUT%%$'\n'*}"
BODY="${OUT#*$'\n'}"
ERR_CODE="$(printf '%s' "$BODY" | json_field code || true)"
SNAP_F="$(project_snapshot "$P1")"
if [[ "$CODE" == "502" && "$ERR_CODE" == "AI_INVALID_OUTPUT" && "$SNAP_E" == "$SNAP_F" ]]; then
  report_step "f" "$CODE" "$BODY" "PASS"
else
  report_step "f" "$CODE" "$BODY" "FAIL" "before=$SNAP_E after=$SNAP_F"
fi

# g. bad_section_type -> 502 AI_INVALID_OUTPUT & rien en base ; bad_then_good -> 200 & stats retry
OUT_BAD="$(http_call POST "$GATEWAY_URL/api/nocode/api/ai/projects/$P4/generate-app" "{\"description\":\"Section carousel [[MODE:bad_section_type]]\"}" "$TOKEN_A")"
P4_DB_COUNTS="$(docker compose -f "$COMPOSE_V1" -f "$COMPOSE_TEST" exec -T svc-nocode-core-db \
  psql -U "${NOCODE_DB_USER:-nocode}" -d "${NOCODE_DB_NAME:-nocode_builder_v2}" -Atc \
  "SELECT (SELECT count(*) FROM tables_schema t JOIN schemas s ON t.schema_id = s.tracking_id WHERE s.project_id = '$P4') || ',' || (SELECT count(*) FROM pages p JOIN interfaces i ON p.interface_id = i.tracking_id WHERE i.project_id = '$P4') || ',' || (SELECT count(*) FROM workflows WHERE project_id = '$P4');")"
curl -sf -X POST "$FAKE_AI_URL/stats/reset" >/dev/null
OUT_RETRY="$(http_call POST "$GATEWAY_URL/api/nocode/api/ai/projects/$P4/generate-app" "{\"description\":\"Retry unique [[MODE:bad_then_good]]\"}" "$TOKEN_A")"
STATS_JSON="$(curl -sf "$FAKE_AI_URL/stats")"
BAD_CODE="${OUT_BAD%%$'\n'*}"
BAD_ERR="$(printf '%s' "${OUT_BAD#*$'\n'}" | json_field code || true)"
RETRY_CODE="${OUT_RETRY%%$'\n'*}"
EMPTY_CHECK="$(python3 -c 'import json,sys; st=json.loads(sys.argv[2]); print(sys.argv[1]=="0,0,0" and st["by_type"]["schema"]==2 and st["total"]==4)' "$P4_DB_COUNTS" "$STATS_JSON")"
if [[ "$BAD_CODE" == "502" && "$BAD_ERR" == "AI_INVALID_OUTPUT" && "$RETRY_CODE" == "200" && "$EMPTY_CHECK" == "True" ]]; then
  report_step "g" "502/200" "bad_section_type=502 (DB=$P4_DB_COUNTS), bad_then_good=200, stats=$STATS_JSON" "PASS"
else
  report_step "g" "$BAD_CODE/$RETRY_CODE" "stats=$STATS_JSON db_counts=$P4_DB_COUNTS" "FAIL"
fi

# h. rate_limit -> 503, auth_error -> 502, slow -> 504 (<15s), sans Traceback ni clé
P_ERR="$(create_project "Lot3 Errors $RUN_ID")"
OUT_RL="$(http_call POST "$GATEWAY_URL/api/nocode/api/ai/projects/$P_ERR/generate-schema" "{\"description\":\"Test rate limit [[MODE:rate_limit]]\"}" "$TOKEN_A")"
OUT_AU="$(http_call POST "$GATEWAY_URL/api/nocode/api/ai/projects/$P_ERR/generate-schema" "{\"description\":\"Test auth error [[MODE:auth_error]]\"}" "$TOKEN_A")"
T_START="$(python3 -c 'import time; print(time.time())')"
OUT_TO="$(http_call POST "$GATEWAY_URL/api/nocode/api/ai/projects/$P_ERR/generate-schema" "{\"description\":\"Test timeout [[MODE:slow]]\"}" "$TOKEN_A")"
ELAPSED="$(python3 -c 'import time,sys; print(round(time.time()-float(sys.argv[1]),2))' "$T_START")"
H_OK="$(python3 -c '
import json, sys
cases = [
    ("rl", sys.argv[1], sys.argv[2], 503, "AI_RATE_LIMITED"),
    ("au", sys.argv[3], sys.argv[4], 502, "AI_PROVIDER_AUTH"),
    ("to", sys.argv[5], sys.argv[6], 504, "AI_TIMEOUT"),
]
for label, code_s, body, exp_http, exp_code in cases:
    assert int(code_s) == exp_http, f"{label}: {code_s} != {exp_http} ({body})"
    assert "Traceback" not in body and "fake-key-lot3-test" not in body, f"{label} leaked"
    d = json.loads(body)
    assert d.get("code") == exp_code and d.get("detail"), f"{label}: {d}"
assert float(sys.argv[7]) < 15.0, f"slow took {sys.argv[7]}s"
print("True")
' "${OUT_RL%%$'\n'*}" "${OUT_RL#*$'\n'}" "${OUT_AU%%$'\n'*}" "${OUT_AU#*$'\n'}" "${OUT_TO%%$'\n'*}" "${OUT_TO#*$'\n'}" "$ELAPSED")" || H_OK="False"
if [[ "$H_OK" == "True" ]]; then
  report_step "h" "503/502/504" "rate_limit=503, auth_error=502, slow=504 (${ELAPSED}s)" "PASS"
else
  report_step "h" "n/a" "rl=${OUT_RL%%$'\n'*} au=${OUT_AU%%$'\n'*} to=${OUT_TO%%$'\n'*} (${ELAPSED}s)" "FAIL"
fi

# i. Recrée svc-nocode-core avec AI_API_KEY vide -> 503 AI_NOT_CONFIGURED puis restaure
AI_API_KEY="" docker compose -f "$COMPOSE_V1" -f "$COMPOSE_TEST" up -d --no-deps --wait svc-nocode-core >/dev/null
OUT_NC="$(http_call POST "$GATEWAY_URL/api/nocode/api/ai/projects/$P_ERR/generate-schema" "{\"description\":\"Sans cle configuree\"}" "$TOKEN_A")"
docker compose -f "$COMPOSE_V1" -f "$COMPOSE_TEST" up -d --no-deps --wait svc-nocode-core >/dev/null
NC_CODE="${OUT_NC%%$'\n'*}"
NC_ERR="$(printf '%s' "${OUT_NC#*$'\n'}" | json_field code || true)"
if [[ "$NC_CODE" == "503" && "$NC_ERR" == "AI_NOT_CONFIGURED" ]]; then
  report_step "i" "$NC_CODE" "${OUT_NC#*$'\n'}" "PASS"
else
  report_step "i" "$NC_CODE" "${OUT_NC#*$'\n'}" "FAIL"
fi

# j. Grep fake-key-lot3-test dans les logs compose -> 0 occurrence
if docker compose -f "$COMPOSE_V1" -f "$COMPOSE_TEST" logs 2>&1 | grep -q "fake-key-lot3-test"; then
  report_step "j" "n/a" "cle fake-key-lot3-test trouvee dans les logs!" "FAIL"
else
  report_step "j" "n/a" "0 occurrence de fake-key-lot3-test dans docker compose logs" "PASS"
fi

# k. User B appelle generate-app sur le projet de User A -> 404
OUT_B="$(http_call POST "$GATEWAY_URL/api/nocode/api/ai/projects/$P1/generate-app" "{\"description\":\"Acces B sur projet A\"}" "$TOKEN_B")"
B_CODE="${OUT_B%%$'\n'*}"
if [[ "$B_CODE" == "404" ]]; then
  report_step "k" "$B_CODE" "${OUT_B#*$'\n'}" "PASS"
else
  report_step "k" "$B_CODE" "${OUT_B#*$'\n'}" "FAIL"
fi

if [[ "$FAILURES" -gt 0 ]]; then
  echo "=== RESULTAT LOT 3: $FAILURES ECHEC(S) ==="
  exit 1
fi
echo "=== RESULTAT LOT 3: 100% PASS ==="
