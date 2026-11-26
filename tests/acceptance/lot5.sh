#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker-compose.v1.yml"
COMPOSE_TEST_FILE="$ROOT_DIR/infra/docker-compose.test.yml"
WEB_RT_DIR="$ROOT_DIR/backend/svc-nocode-core/app/modules/generator/web_runtime"
GATEWAY_URL="${GATEWAY_URL:-http://127.0.0.1:8000}"

export DOCKER_BUILDKIT=0

FAILURES=0
report_step() {
  local step="$1" code="$2" detail="$3" status="$4"
  printf '[lot5:%s] http=%s | %s | %s\n' "$step" "$code" "$detail" "$status"
  if [[ "$status" == "FAIL" ]]; then
    FAILURES=$((FAILURES + 1))
  fi
}

TMP_WORK="$(mktemp -d)"
trap 'rm -rf "$TMP_WORK"' EXIT

# a. Prérequis : node >= 18, npm, registre npm joignable (jamais SKIP)
NODE_VER="$(node -v 2>/dev/null || true)"
NPM_VER="$(npm -v 2>/dev/null || true)"
if [[ -z "$NODE_VER" || -z "$NPM_VER" ]]; then
  report_step "a" "n/a" "FAIL: node ou npm absent sur l'hôte" "FAIL"
  exit 1
fi
NODE_MAJOR="${NODE_VER#v}"
NODE_MAJOR="${NODE_MAJOR%%.*}"
if [[ "$NODE_MAJOR" -lt 18 ]]; then
  report_step "a" "n/a" "FAIL: node >= 18 requis (trouvé $NODE_VER)" "FAIL"
  exit 1
fi
if ! npm ping >/dev/null 2>&1; then
  report_step "a" "n/a" "FAIL: registre npm injoignable" "FAIL"
  exit 1
fi
report_step "a" "n/a" "node=$NODE_VER npm=$NPM_VER registry=OK" "PASS"

# b. Runtime autonome : copie dans /tmp, npm ci && npm test && npm run build
RT_COPY="$TMP_WORK/runtime_standalone"
cp -R "$WEB_RT_DIR" "$RT_COPY"
rm -rf "$RT_COPY/node_modules" "$RT_COPY/dist"
if (cd "$RT_COPY" && npm ci --prefer-offline && npm test | tee "$TMP_WORK/rt_vitest.log" && npm run build) >/dev/null 2>&1 && [[ -f "$RT_COPY/dist/index.html" ]]; then
  PASSED_LINE="$(grep -E "Tests[[:space:]]+[0-9]+ passed" "$TMP_WORK/rt_vitest.log" | tail -n 1 || echo "vitest OK")"
  report_step "b" "n/a" "runtime autonome build+test OK ($PASSED_LINE)" "PASS"
else
  report_step "b" "n/a" "échec npm ci / npm test / npm run build sur web_runtime" "FAIL"
fi

# Démarrage / attente de la stack V1
docker compose -f "$COMPOSE_FILE" up -d --build --wait >/dev/null

http_call() {
  local method="$1" url="$2" body="${3:-}" token="${4:-}"
  local tmp_body
  tmp_body="$(mktemp)"
  local args=(-sS -X "$method" "$url" -o "$tmp_body" -w "%{http_code}")
  if [[ -n "$token" ]]; then
    args+=(-H "Authorization: Bearer $token")
  fi
  if [[ -n "$body" ]]; then
    args+=(-H "Content-Type: application/json" -d "$body")
  fi
  local code
  code="$(curl "${args[@]}")"
  printf '%s\n' "$code"
  cat "$tmp_body"
  rm -f "$tmp_body"
}

json_field() {
  python3 -c 'import json, sys; d=json.loads(sys.stdin.read()); print(d.get(sys.argv[1], ""))' "$1"
}

RUN_ID="$(date +%s)-$$"
EMAIL="lot5-${RUN_ID}@example.com"
PASS="Lot5StrongPass!2026"
PROJ_LOG_NAME="SecretLogCheckProj-${RUN_ID}"

http_call POST "$GATEWAY_URL/api/iam/auth/register" "{\"email\":\"$EMAIL\",\"name\":\"Lot5\",\"surname\":\"User\",\"password\":\"$PASS\"}" >/dev/null
LOGIN_OUT="$(http_call POST "$GATEWAY_URL/api/iam/auth/login" "{\"email\":\"$EMAIL\",\"password\":\"$PASS\"}")"
TOKEN="$(printf '%s' "${LOGIN_OUT#*$'\n'}" | json_field access_token)"

# i. Partie 0 : hook sans ENABLE_TEST_HOOKS -> 201 ; logs SQL sans INSERT INTO / email / nom de projet
TEST_FAIL_TEMPLATE_INSTANTIATION=1 docker compose -f "$COMPOSE_FILE" -f "$COMPOSE_TEST_FILE" up -d --no-deps --wait svc-nocode-core >/dev/null
OUT_NO_HOOK="$(http_call POST "$GATEWAY_URL/api/nocode/api/templates/saas-dashboard/instantiate" "{\"name\":\"$PROJ_LOG_NAME\"}" "$TOKEN")"
NO_HOOK_CODE="${OUT_NO_HOOK%%$'\n'*}"
docker compose -f "$COMPOSE_FILE" up -d --no-deps --wait svc-nocode-core >/dev/null

LOGS_CHECK="$(docker compose -f "$COMPOSE_FILE" logs --tail=300 svc-nocode-core svc-iam 2>&1 || true)"
LOG_LEAK=0
if printf '%s' "$LOGS_CHECK" | grep -qF "INSERT INTO"; then LOG_LEAK=1; fi
if printf '%s' "$LOGS_CHECK" | grep -qF "$EMAIL"; then LOG_LEAK=1; fi
if printf '%s' "$LOGS_CHECK" | grep -qF "$PROJ_LOG_NAME"; then LOG_LEAK=1; fi

if [[ "$NO_HOOK_CODE" == "201" && "$LOG_LEAK" -eq 0 ]]; then
  report_step "i" "201" "hook ignoré sans ENABLE_TEST_HOOKS + 0 fuite SQL/email/projet dans les logs" "PASS"
else
  report_step "i" "$NO_HOOK_CODE" "log_leak=$LOG_LEAK" "FAIL"
fi

# Préparation des projets pour c, d, e, f, g
declare -a PROJECT_IDS=()
declare -a PROJECT_LABELS=()

for tid in saas-dashboard crm-sales e-commerce; do
  RES="$(http_call POST "$GATEWAY_URL/api/nocode/api/templates/$tid/instantiate" "{\"name\":\"Lot5 $tid $RUN_ID\"}" "$TOKEN")"
  PID="$(printf '%s' "${RES#*$'\n'}" | json_field tracking_id)"
  PROJECT_IDS+=("$PID")
  PROJECT_LABELS+=("tpl:$tid")
done

# Projet mobile avec les 3 types mobiles
RES_MOB="$(http_call POST "$GATEWAY_URL/api/nocode/api/templates/saas-dashboard/instantiate" "{\"name\":\"Lot5 Mobile $RUN_ID\"}" "$TOKEN")"
MOB_PID="$(printf '%s' "${RES_MOB#*$'\n'}" | json_field tracking_id)"
IFACE_JSON="$(http_call GET "$GATEWAY_URL/api/nocode/api/interface/$MOB_PID" "" "$TOKEN")"
MOB_PAGE_ID="$(printf '%s' "${IFACE_JSON#*$'\n'}" | python3 -c 'import json,sys; d=json.loads(sys.stdin.read()); print(d["pages"][0]["tracking_id"])')"
for mtype in mobile-header mobile-card-list bottom-nav; do
  http_call POST "$GATEWAY_URL/api/nocode/api/interface/pages/$MOB_PAGE_ID/sections" "{\"type\":\"$mtype\",\"title\":\"Sec $mtype\",\"ordre\":99,\"config\":{}}" "$TOKEN" >/dev/null
done
PROJECT_IDS+=("$MOB_PID")
PROJECT_LABELS+=("mobile")

# Projet malicieux (étape f)
RES_MAL="$(http_call POST "$GATEWAY_URL/api/nocode/api/templates/saas-dashboard/instantiate" "{\"name\":\"Mon \\\"Projet\\\" {Test} $RUN_ID\"}" "$TOKEN")"
MAL_PID="$(printf '%s' "${RES_MAL#*$'\n'}" | json_field tracking_id)"
http_call POST "$GATEWAY_URL/api/nocode/api/interface/$MAL_PID/pages" "{\"nom\":\"x\\\"); alert(1); //\",\"chemin\":\"/malicious\",\"type_page\":\"desktop\",\"ordre\":10}" "$TOKEN" >/dev/null
PROJECT_IDS+=("$MAL_PID")
PROJECT_LABELS+=("malicious")

# c, d, f, g : génération, unzip, npm ci && npm test && npm run build, vérifications
C_FAILS=0
D_FAILS=0
F_FAILS=0
G_FAILS=0
FIRST_UNZIP=""

for idx in "${!PROJECT_IDS[@]}"; do
  PID="${PROJECT_IDS[$idx]}"
  LABEL="${PROJECT_LABELS[$idx]}"
  GEN_OUT="$(http_call POST "$GATEWAY_URL/api/nocode/api/generator/$PID" "{\"nom\":\"Build-$LABEL\",\"config\":{}}" "$TOKEN")"
  GCODE="${GEN_OUT%%$'\n'*}"
  GBODY="${GEN_OUT#*$'\n'}"
  GID="$(printf '%s' "$GBODY" | json_field tracking_id)"
  if [[ "$GCODE" != "201" || -z "$GID" ]]; then
    C_FAILS=$((C_FAILS + 1))
    continue
  fi
  ZFILE="$TMP_WORK/gen_${idx}.zip"
  UNZIP_DIR="$TMP_WORK/unzip_${idx}"
  curl -sf -H "Authorization: Bearer $TOKEN" "$GATEWAY_URL/api/nocode/api/generator/download/$GID" -o "$ZFILE"
  mkdir -p "$UNZIP_DIR"
  python3 -c 'import sys, zipfile; zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])' "$ZFILE" "$UNZIP_DIR"
  [[ -z "$FIRST_UNZIP" ]] && FIRST_UNZIP="$UNZIP_DIR"

  if ! (cd "$UNZIP_DIR/frontend" && npm ci --prefer-offline && npm test && npm run build) >/dev/null 2>&1 || [[ ! -f "$UNZIP_DIR/frontend/dist/index.html" ]]; then
    C_FAILS=$((C_FAILS + 1))
  fi

  # d. warnings & EXPORT_NOTES.md
  if [[ "$LABEL" == "mobile" ]]; then
    if ! printf '%s' "$GBODY" | python3 -c 'import json,sys; w=json.loads(sys.stdin.read()).get("warnings",[]); assert all(any(t in x for x in w) for t in ("mobile-header","mobile-card-list","bottom-nav"))' || [[ ! -f "$UNZIP_DIR/frontend/EXPORT_NOTES.md" ]]; then
      D_FAILS=$((D_FAILS + 1))
    fi
  elif [[ "$LABEL" == tpl:* ]]; then
    if ! printf '%s' "$GBODY" | python3 -c 'import json,sys; assert json.loads(sys.stdin.read()).get("warnings",[]) == []' || [[ -f "$UNZIP_DIR/frontend/EXPORT_NOTES.md" ]]; then
      D_FAILS=$((D_FAILS + 1))
    fi
  fi

  # f. sécurité/contenu
  if grep -rnE "test-token|\{BASE_URL\}|dangerouslySetInnerHTML|ApiContext" "$UNZIP_DIR/frontend/src" >/dev/null 2>&1; then
    F_FAILS=$((F_FAILS + 1))
  fi
  if ! python3 -c 'import json,sys; json.load(open(sys.argv[1], encoding="utf-8"))' "$UNZIP_DIR/frontend/package.json"; then
    F_FAILS=$((F_FAILS + 1))
  fi

  # g. backend compileall
  if ! python3 -m compileall -q "$UNZIP_DIR/backend"; then
    G_FAILS=$((G_FAILS + 1))
  fi
done

[[ "$C_FAILS" -eq 0 ]] && report_step "c" "201" "tous les projets exportés passent npm ci + test + build" "PASS" || report_step "c" "n/a" "c_fails=$C_FAILS" "FAIL"
[[ "$D_FAILS" -eq 0 ]] && report_step "d" "201" "warnings mobiles + EXPORT_NOTES.md OK, templates sans warnings" "PASS" || report_step "d" "n/a" "d_fails=$D_FAILS" "FAIL"
[[ "$F_FAILS" -eq 0 ]] && report_step "f" "201" "0 test-token/{BASE_URL}/dangerouslySetInnerHTML/ApiContext + projet malicieux OK" "PASS" || report_step "f" "n/a" "f_fails=$F_FAILS" "FAIL"
[[ "$G_FAILS" -eq 0 ]] && report_step "g" "n/a" "backend compileall OK" "PASS" || report_step "g" "n/a" "g_fails=$G_FAILS" "FAIL"

# e. Preuve par mutation (build fail + test fail)
if [[ -n "$FIRST_UNZIP" ]]; then
  PR="$FIRST_UNZIP/frontend/src/runtime/PageRenderer.jsx"
  cp "$PR" "$PR.bak"
  printf '\n}}}\n' >> "$PR"
  set +e
  (cd "$FIRST_UNZIP/frontend" && npm run build) >/dev/null 2>&1
  MUT_BUILD_RC=$?
  set -e
  mv "$PR.bak" "$PR"

  cp "$PR" "$PR.bak"
  cat > "$PR" <<'EOF'
import React from 'react';
export default function PageRenderer() { return <main className="rt-page" />; }
EOF
  set +e
  (cd "$FIRST_UNZIP/frontend" && npm test) >/dev/null 2>&1
  MUT_TEST_RC=$?
  set -e
  mv "$PR.bak" "$PR"

  if [[ "$MUT_BUILD_RC" -ne 0 && "$MUT_TEST_RC" -ne 0 ]] && (cd "$FIRST_UNZIP/frontend" && npm test && npm run build) >/dev/null 2>&1; then
    report_step "e" "n/a" "mutations build(rc=$MUT_BUILD_RC) + test(rc=$MUT_TEST_RC) détectées, restauration OK" "PASS"
  else
    report_step "e" "n/a" "mut_build=$MUT_BUILD_RC mut_test=$MUT_TEST_RC" "FAIL"
  fi
else
  report_step "e" "n/a" "aucun ZIP disponible pour mutation" "FAIL"
fi

# h. static_checks.sh
if bash "$ROOT_DIR/tests/acceptance/static_checks.sh"; then
  report_step "h" "n/a" "static_checks.sh (incluant 3 nouveaux garde-fous) OK" "PASS"
else
  report_step "h" "n/a" "static_checks.sh failed" "FAIL"
fi

# j. lot4b.sh reste vert
if bash "$ROOT_DIR/tests/acceptance/lot4b.sh"; then
  report_step "j" "n/a" "lot4b.sh PASS" "PASS"
else
  report_step "j" "n/a" "lot4b.sh failed" "FAIL"
fi

if [[ "$FAILURES" -gt 0 ]]; then
  echo "=== RESULTAT LOT 5: $FAILURES ECHEC(S) ==="
  exit 1
fi
echo "=== RESULTAT LOT 5: 100% PASS ==="
