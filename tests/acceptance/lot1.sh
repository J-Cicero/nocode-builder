#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.v1.yml"
GATEWAY_URL="${GATEWAY_URL:-http://localhost:8000}"

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

if ! command -v docker >/dev/null 2>&1 || ! docker compose version >/dev/null 2>&1; then
  echo "[prereq] docker compose introuvable sur cette machine | FAIL"
  exit 1
fi

# a. Générer des secrets aléatoires, reset volumes, build + démarrage --wait
export PLATFORM_SHARED_SECRET
export IAM_DB_PASSWORD
export NOCODE_DB_PASSWORD
PLATFORM_SHARED_SECRET="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
IAM_DB_PASSWORD="$(python3 -c 'import secrets; print(secrets.token_hex(16))')"
NOCODE_DB_PASSWORD="$(python3 -c 'import secrets; print(secrets.token_hex(16))')"

if docker compose -f "$COMPOSE_FILE" down -v >/dev/null 2>&1 && \
   docker compose -f "$COMPOSE_FILE" up -d --build --wait; then
  report_step "a" "n/a" "docker compose down -v && up -d --build --wait" "PASS"
else
  report_step "a" "n/a" "docker compose startup failed" "FAIL"
  exit 1
fi

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

jwt_sub() {
  python3 -c '
import base64, json, sys
tok = sys.stdin.read().strip()
part = tok.split(".")[1]
part += "=" * (-len(part) % 4)
print(json.loads(base64.urlsafe_b64decode(part))["sub"])
'
}

RUN_ID="$(python3 -c 'import uuid; print(uuid.uuid4().hex[:8])')"
USER_A_EMAIL="usera_${RUN_ID}@example.com"
USER_B_EMAIL="userb_${RUN_ID}@example.com"
PASSWORD="Password123!"

# b. GET gateway /health -> 200
OUT="$(http_call GET "$GATEWAY_URL/health")"
CODE="${OUT%%$'\n'*}"
BODY="${OUT#*$'\n'}"
if [[ "$CODE" == "200" ]]; then
  report_step "b" "$CODE" "$BODY" "PASS"
else
  report_step "b" "$CODE" "$BODY" "FAIL"
fi

# c. Register + login user A via gateway
OUT="$(http_call POST "$GATEWAY_URL/api/iam/auth/register" "{\"email\":\"$USER_A_EMAIL\",\"name\":\"User\",\"surname\":\"Alpha\",\"password\":\"$PASSWORD\"}")"
CODE="${OUT%%$'\n'*}"
BODY="${OUT#*$'\n'}"
if [[ "$CODE" == "201" ]]; then
  report_step "c.1" "$CODE" "$BODY" "PASS" "register A"
else
  report_step "c.1" "$CODE" "$BODY" "FAIL" "register A"
fi

OUT="$(http_call POST "$GATEWAY_URL/api/iam/auth/login" "{\"email\":\"$USER_A_EMAIL\",\"password\":\"$PASSWORD\"}")"
CODE="${OUT%%$'\n'*}"
BODY="${OUT#*$'\n'}"
TOKEN_A="$(printf '%s' "$BODY" | extract_json_field access_token || true)"
if [[ "$CODE" == "200" && -n "$TOKEN_A" ]]; then
  SUB_A="$(printf '%s' "$TOKEN_A" | jwt_sub)"
  report_step "c.2" "$CODE" "$BODY" "PASS" "login A"
else
  SUB_A=""
  report_step "c.2" "$CODE" "$BODY" "FAIL" "login A"
fi

# d. Créer un projet avec le token A via la gateway -> 201, owner_id == sub
PROJECT_NAME="Lot1 Project $RUN_ID"
OUT="$(http_call POST "$GATEWAY_URL/api/nocode/api/projects/" "{\"name\":\"$PROJECT_NAME\",\"description\":\"Acceptance test\",\"is_public\":false}" "$TOKEN_A")"
CODE="${OUT%%$'\n'*}"
BODY="${OUT#*$'\n'}"
PROJECT_ID="$(printf '%s' "$BODY" | extract_json_field tracking_id || true)"
OWNER_ID="$(printf '%s' "$BODY" | extract_json_field owner_id || true)"
if [[ "$CODE" == "201" && -n "$PROJECT_ID" && "$OWNER_ID" == "$SUB_A" ]]; then
  report_step "d" "$CODE" "$BODY" "PASS" "owner_id==sub"
else
  report_step "d" "$CODE" "$BODY" "FAIL" "owner_id=$OWNER_ID sub=$SUB_A"
fi

# e. Lister les projets de A -> contient le projet
OUT="$(http_call GET "$GATEWAY_URL/api/nocode/api/projects/" "" "$TOKEN_A")"
CODE="${OUT%%$'\n'*}"
BODY="${OUT#*$'\n'}"
HAS_PROJ="$(printf '%s' "$BODY" | python3 -c 'import json, sys; d=json.loads(sys.stdin.read()); pid=sys.argv[1]; print("1" if any(p.get("tracking_id")==pid for p in d.get("projects",[])) else "0")' "$PROJECT_ID" 2>/dev/null || echo 0)"
if [[ "$CODE" == "200" && "$HAS_PROJ" == "1" ]]; then
  report_step "e" "$CODE" "$BODY" "PASS"
else
  report_step "e" "$CODE" "$BODY" "FAIL"
fi

# f. docker compose restart, login A -> 200, liste contient toujours le projet
docker compose -f "$COMPOSE_FILE" restart >/dev/null
READY="0"
for _ in $(seq 1 30); do
  CHK="$(http_call GET "$GATEWAY_URL/health")"
  if [[ "${CHK%%$'\n'*}" == "200" ]]; then
    READY="1"
    break
  fi
  sleep 1
done

OUT="$(http_call POST "$GATEWAY_URL/api/iam/auth/login" "{\"email\":\"$USER_A_EMAIL\",\"password\":\"$PASSWORD\"}")"
CODE="${OUT%%$'\n'*}"
BODY="${OUT#*$'\n'}"
TOKEN_A2="$(printf '%s' "$BODY" | extract_json_field access_token || true)"
if [[ "$READY" == "1" && "$CODE" == "200" && -n "$TOKEN_A2" ]]; then
  report_step "f.1" "$CODE" "$BODY" "PASS" "restart + login A"
else
  report_step "f.1" "$CODE" "$BODY" "FAIL" "restart + login A"
fi

OUT="$(http_call GET "$GATEWAY_URL/api/nocode/api/projects/" "" "$TOKEN_A2")"
CODE="${OUT%%$'\n'*}"
BODY="${OUT#*$'\n'}"
HAS_PROJ2="$(printf '%s' "$BODY" | python3 -c 'import json, sys; d=json.loads(sys.stdin.read()); pid=sys.argv[1]; print("1" if any(p.get("tracking_id")==pid for p in d.get("projects",[])) else "0")' "$PROJECT_ID" 2>/dev/null || echo 0)"
if [[ "$CODE" == "200" && "$HAS_PROJ2" == "1" ]]; then
  report_step "f.2" "$CODE" "$BODY" "PASS" "persisted after restart"
else
  report_step "f.2" "$CODE" "$BODY" "FAIL" "persisted after restart"
fi

# g. Register + login user B ; liste de B ne contient PAS le projet de A
OUT="$(http_call POST "$GATEWAY_URL/api/iam/auth/register" "{\"email\":\"$USER_B_EMAIL\",\"name\":\"User\",\"surname\":\"Beta\",\"password\":\"$PASSWORD\"}")"
CODE="${OUT%%$'\n'*}"
BODY="${OUT#*$'\n'}"
if [[ "$CODE" == "201" ]]; then
  report_step "g.1" "$CODE" "$BODY" "PASS" "register B"
else
  report_step "g.1" "$CODE" "$BODY" "FAIL" "register B"
fi

OUT="$(http_call POST "$GATEWAY_URL/api/iam/auth/login" "{\"email\":\"$USER_B_EMAIL\",\"password\":\"$PASSWORD\"}")"
CODE="${OUT%%$'\n'*}"
BODY="${OUT#*$'\n'}"
TOKEN_B="$(printf '%s' "$BODY" | extract_json_field access_token || true)"
if [[ "$CODE" == "200" && -n "$TOKEN_B" ]]; then
  report_step "g.2" "$CODE" "$BODY" "PASS" "login B"
else
  report_step "g.2" "$CODE" "$BODY" "FAIL" "login B"
fi

OUT="$(http_call GET "$GATEWAY_URL/api/nocode/api/projects/" "" "$TOKEN_B")"
CODE="${OUT%%$'\n'*}"
BODY="${OUT#*$'\n'}"
B_HAS_A="$(printf '%s' "$BODY" | python3 -c 'import json, sys; d=json.loads(sys.stdin.read()); pid=sys.argv[1]; print("1" if any(p.get("tracking_id")==pid for p in d.get("projects",[])) else "0")' "$PROJECT_ID" 2>/dev/null || echo 1)"
if [[ "$CODE" == "200" && "$B_HAS_A" == "0" ]]; then
  report_step "g.3" "$CODE" "$BODY" "PASS" "isolation B"
else
  report_step "g.3" "$CODE" "$BODY" "FAIL" "isolation B"
fi

if [[ "$FAILURES" -ne 0 ]]; then
  echo "RESULT: FAIL ($FAILURES step(s) failed)"
  exit 1
fi
echo "RESULT: PASS (all steps passed)"
