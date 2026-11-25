#!/usr/bin/env bash
set -euo pipefail

export DOCKER_BUILDKIT=0
export COMPOSE_DOCKER_CLI_BUILD=0

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

if ! curl -sf "$GATEWAY_URL/health" >/dev/null 2>&1; then
  docker compose -f "$COMPOSE_FILE" up -d --build --wait
fi

RUN_ID="$(python3 -c 'import uuid; print(uuid.uuid4().hex[:8])')"
USER_A="lot4b_a_${RUN_ID}@example.com"
PASSWORD="Password123!"

http_call POST "$GATEWAY_URL/api/iam/auth/register" "{\"email\":\"$USER_A\",\"name\":\"User\",\"surname\":\"A\",\"password\":\"$PASSWORD\"}" >/dev/null
LOGIN_A="$(http_call POST "$GATEWAY_URL/api/iam/auth/login" "{\"email\":\"$USER_A\",\"password\":\"$PASSWORD\"}")"
TOKEN_A="$(printf '%s' "${LOGIN_A#*$'\n'}" | json_field access_token || true)"

OUT_TPLS="$(http_call GET "$GATEWAY_URL/api/nocode/api/templates" "" "$TOKEN_A")"
TPL_JSON="${OUT_TPLS#*$'\n'}"
TPL_IDS="$(printf '%s' "$TPL_JSON" | python3 -c 'import json,sys; print(" ".join(x["id"] for x in json.loads(sys.stdin.read())))')"

# a. Générer le ZIP pour les 3 templates : backend/main.py + frontend/src/App.jsx + une page par page du template
GEN_FAILS=0
for tid in $TPL_IDS; do
  OUT_INST="$(http_call POST "$GATEWAY_URL/api/nocode/api/templates/$tid/instantiate" "{\"name\":\"Lot4b $tid $RUN_ID\"}" "$TOKEN_A")"
  PID="$(printf '%s' "${OUT_INST#*$'\n'}" | json_field tracking_id || true)"
  OUT_GEN="$(http_call POST "$GATEWAY_URL/api/nocode/api/generator/$PID" "{\"nom\":\"Lot4bBuild-$tid\",\"config\":{}}" "$TOKEN_A")"
  GCODE="${OUT_GEN%%$'\n'*}"
  GID="$(printf '%s' "${OUT_GEN#*$'\n'}" | json_field tracking_id || true)"
  EXPECTED_PAGES="$(printf '%s' "$TPL_JSON" | python3 -c 'import json,sys; d={x["id"]:x["pages_count"] for x in json.loads(sys.stdin.read())}; print(d[sys.argv[1]])' "$tid")"

  if [[ "$GCODE" != "201" || -z "$GID" ]]; then
    echo "  [lot4b FAIL] $tid generator HTTP=$GCODE"
    GEN_FAILS=$((GEN_FAILS + 1))
    continue
  fi

  TMP_ZIP="$(mktemp --suffix=.zip)"
  curl -sf -H "Authorization: Bearer $TOKEN_A" "$GATEWAY_URL/api/nocode/api/generator/download/$GID" -o "$TMP_ZIP"
  if ! python3 -c '
import sys, zipfile
zf = zipfile.ZipFile(sys.argv[1])
names = zf.namelist()
expected_pages = int(sys.argv[2])
assert "backend/main.py" in names, "missing backend/main.py"
assert "frontend/src/App.jsx" in names, "missing frontend/src/App.jsx"
page_files = [n for n in names if n.startswith("frontend/src/pages/") and n.endswith(".jsx")]
assert len(page_files) >= expected_pages, f"pages {len(page_files)} < {expected_pages}: {page_files}"
' "$TMP_ZIP" "$EXPECTED_PAGES"; then
    GEN_FAILS=$((GEN_FAILS + 1))
  fi
  rm -f "$TMP_ZIP"
done

if [[ "$GEN_FAILS" -eq 0 ]]; then
  report_step "lot4b.zip" "201/200" "3/3 templates générés avec backend/main.py, App.jsx et pages/*.jsx" "PASS"
else
  report_step "lot4b.zip" "n/a" "gen_fails=$GEN_FAILS" "FAIL"
fi

# b. Preuve de mutation en copie temporaire (/tmp) : remettre les 3 {{...}} -> TypeError unhashable type: 'dict'
TMP_MUT="$(mktemp -d)"
trap 'rm -rf "$TMP_MUT"' EXIT
MUT_OUT="$(python3 - "$ROOT_DIR" "$TMP_MUT" <<'PY'
import importlib.util, pathlib, re, shutil, sys, types

root = pathlib.Path(sys.argv[1])
tmp_dir = pathlib.Path(sys.argv[2])
orig_file = root / "backend" / "svc-nocode-core" / "app" / "modules" / "generator" / "generator_engine.py"
mut_file = tmp_dir / "mutated_engine.py"

src = orig_file.read_text(encoding="utf-8")
mut_src = src.replace(
    '{"label": "Utilisateurs", "value": "10K+"},',
    '{{"label": "Utilisateurs", "value": "10K+"}},',
).replace(
    '{"title": "Feature 1", "description": "Description de la feature 1"},',
    '{{"title": "Feature 1", "description": "Description de la feature 1"}},',
).replace(
    'fields = config.get("fields", [{"label": "Email", "type": "email", "placeholder": "votre@email.com"}])',
    'fields = config.get("fields", [{{"label": "Email", "type": "email", "placeholder": "votre@email.com"}}])',
)
assert mut_src != src, "Mutation did not alter source!"
mut_file.write_text(mut_src, encoding="utf-8")

def load_engine(path: pathlib.Path, mod_name: str):
    # Minimal stub imports to test _generate_react_page directly in isolation
    for pkg in ("app", "app.core", "app.modules", "app.modules.projects", "app.modules.schema", "app.modules.interface_builder", "app.modules.workflow_engine"):
        if pkg not in sys.modules:
            sys.modules[pkg] = types.ModuleType(pkg)
    class _Dummy:
        def __init__(self, *args, **kwargs):
            pass
    sys.modules["app.modules.projects.repository"] = types.SimpleNamespace(ProjectRepository=_Dummy)
    sys.modules["app.modules.schema.repository"] = types.SimpleNamespace(SchemaRepository=_Dummy, TableSchemaRepository=_Dummy, FieldRepository=_Dummy, RelationRepository=_Dummy)
    sys.modules["app.modules.interface_builder.repository"] = types.SimpleNamespace(InterfaceRepository=_Dummy, PageRepository=_Dummy, ComposantRepository=_Dummy, SectionRepository=_Dummy)
    sys.modules["app.modules.workflow_engine.repository"] = types.SimpleNamespace(WorkflowRepository=_Dummy)
    spec = importlib.util.spec_from_file_location(mod_name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod.GeneratorEngine(None, None)

mut_eng = load_engine(mut_file, "mut_gen_engine")
fix_eng = load_engine(orig_file, "fix_gen_engine")

for sec_type in ("stats-row", "card-grid", "form"):
    sec = types.SimpleNamespace(type=sec_type, config={}, styles=None, connecte_a=None, title=sec_type)
    try:
        mut_eng._generate_react_page("TestPage", [], [sec], {})
        raise AssertionError(f"Mutated engine did NOT fail on {sec_type}!")
    except TypeError as exc:
        assert "unhashable type: 'dict'" in str(exc), f"Unexpected TypeError on {sec_type}: {exc}"
    out = fix_eng._generate_react_page("TestPage", [], [sec], {})
    assert "TestPage" in out

print("MUTATION_OK: mutated raises TypeError unhashable dict on stats-row/card-grid/form; fixed succeeds on all 3")
PY
)"
if printf '%s' "$MUT_OUT" | grep -q "MUTATION_OK"; then
  report_step "lot4b.mutation" "n/a" "$MUT_OUT" "PASS"
else
  report_step "lot4b.mutation" "n/a" "$MUT_OUT" "FAIL"
fi

if [[ "$FAILURES" -gt 0 ]]; then
  echo "=== RESULTAT LOT 4B: $FAILURES ECHEC(S) ==="
  exit 1
fi
echo "=== RESULTAT LOT 4B: 100% PASS ==="
