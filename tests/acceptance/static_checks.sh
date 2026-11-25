#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

PYTHON_BIN=""
for cand in "$ROOT_DIR/.venv/Scripts/python.exe" "$ROOT_DIR/.venv/bin/python" python3 python; do
  if "$cand" -c "import sys, venv; sys.exit(0)" >/dev/null 2>&1; then
    PYTHON_BIN="$cand"
    break
  fi
done
if [[ -z "$PYTHON_BIN" ]]; then
  echo "[static_checks] Python (avec module venv) introuvable | FAIL"
  exit 1
fi

"$PYTHON_BIN" -m venv "$TMP_DIR/venv"
if [[ -x "$TMP_DIR/venv/bin/python" ]]; then
  VENV_PY="$TMP_DIR/venv/bin/python"
  RUFF_BIN="$TMP_DIR/venv/bin/ruff"
else
  VENV_PY="$TMP_DIR/venv/Scripts/python.exe"
  RUFF_BIN="$TMP_DIR/venv/Scripts/ruff.exe"
fi

"$VENV_PY" -m pip install -q ruff

echo ">>> Ruff version: $("$RUFF_BIN" --version)"

# 1. Contrôle strict (F821, F811 et erreurs de syntaxe) sur les 3 services actifs
"$RUFF_BIN" check --select F821,F811 \
  --exclude "app/modules/generator/generator_engine.py" \
  "$ROOT_DIR/backend/svc-iam" \
  "$ROOT_DIR/backend/svc-nocode-core" \
  "$ROOT_DIR/backend/svc-api-gateway"
echo "[static:active_services] F821/F811/syntax OK | PASS"

# 2. Mode rapport uniquement sur generator_engine.py
echo ">>> [report-only] generator_engine.py :"
"$RUFF_BIN" check --select F821,F811 \
  "$ROOT_DIR/backend/svc-nocode-core/app/modules/generator/generator_engine.py" || true

# 3. Auto-test F821
SELFTEST_FILE="$TMP_DIR/selftest_f821.py"
cat > "$SELFTEST_FILE" <<'EOF'
def broken_fn():
    return undefined_selftest_symbol + 1
EOF

set +e
SELFTEST_OUT="$("$RUFF_BIN" check --select F821,F811 "$SELFTEST_FILE" 2>&1)"
SELFTEST_RC=$?
set -e

if [[ "$SELFTEST_RC" -eq 0 ]] || ! printf '%s' "$SELFTEST_OUT" | grep -q "F821"; then
  echo "[static:selftest] FAIL: ruff n'a pas détecté F821 sur le fichier témoin (rc=$SELFTEST_RC)"
  echo "$SELFTEST_OUT"
  exit 1
fi
echo "[static:selftest] F821 bien détecté par ruff sur fichier témoin | PASS"

# 4. Garde-fou DOCKER_BUILDKIT=0 sur tous les scripts tests/acceptance/*.sh appelant docker compose up/build
check_buildkit_scripts() {
  local target_dir="$1"
  "$VENV_PY" - "$target_dir" <<'PY'
import pathlib, re, sys
root = pathlib.Path(sys.argv[1])
missing = []
for sh in sorted(root.glob("*.sh")):
    txt = sh.read_text(encoding="utf-8", errors="replace")
    uses_compose_build = any(
        "docker compose" in line and not line.lstrip().startswith("#") and re.search(r"\b(up|build)\b", line)
        for line in txt.splitlines()
    )
    if uses_compose_build and "DOCKER_BUILDKIT=0" not in txt:
        missing.append(sh.name)
if missing:
    print(f"Scripts sans DOCKER_BUILDKIT=0: {missing}")
    sys.exit(1)
PY
}

check_buildkit_scripts "$ROOT_DIR/tests/acceptance"
echo "[static:buildkit_guard] Tous les scripts docker compose up/build définissent DOCKER_BUILDKIT=0 | PASS"

# Auto-test BuildKit guard
mkdir -p "$TMP_DIR/bad_scripts"
cat > "$TMP_DIR/bad_scripts/missing_buildkit.sh" <<'EOF'
#!/usr/bin/env bash
docker compose -f infra/docker-compose.v1.yml up -d --build
EOF
if check_buildkit_scripts "$TMP_DIR/bad_scripts" >/dev/null 2>&1; then
  echo "[static:buildkit_selftest] FAIL: script sans DOCKER_BUILDKIT=0 non détecté"
  exit 1
fi
echo "[static:buildkit_selftest] Script témoin sans DOCKER_BUILDKIT=0 détecté | PASS"

# 5. Validation permanente du catalogue de templates hors conteneur (sans variable d'env hôte)
CAT_PY="$PYTHON_BIN"
if ! "$CAT_PY" -c "import pydantic, pydantic_settings, sqlalchemy" >/dev/null 2>&1; then
  "$VENV_PY" -m pip install -q pydantic pydantic-settings sqlalchemy
  CAT_PY="$VENV_PY"
fi

env -i PATH="$PATH" HOME="${HOME:-}" SYSTEMROOT="${SYSTEMROOT:-}" \
  SECRET_KEY="static-check-ephemeral-secret-key-32-chars" \
  "$CAT_PY" - "$ROOT_DIR" "$TMP_DIR" <<'PY'
import json, pathlib, sys
root = pathlib.Path(sys.argv[1])
tmp = pathlib.Path(sys.argv[2])
sys.path.insert(0, str(root / "backend" / "svc-nocode-core"))

from app.modules.templates.catalog import load_catalog

catalog = load_catalog()
assert len(catalog) == 3, f"Attendu 3 templates, trouvé {len(catalog)}"

# Auto-test : un template invalide doit échouer en nommant le fichier fautif
bad_dir = tmp / "bad_catalog"
bad_dir.mkdir(parents=True, exist_ok=True)
bad_file = bad_dir / "broken-tpl.json"
bad_file.write_text(json.dumps({
    "id": "broken-tpl",
    "name": "Broken",
    "description": "Invalid section test",
    "schema": {"tables": [{"name": "items", "fields": [{"name": "title", "type": "text"}]}]},
    "interface": {"pages": [{"name": "Home", "path": "/", "sections": [{"type": "carousel"}]}]},
}), encoding="utf-8")
try:
    load_catalog(bad_dir)
    raise AssertionError("Un template invalide a été accepté!")
except RuntimeError as exc:
    assert "broken-tpl.json" in str(exc), f"Nom du fichier absent de l'erreur: {exc}"

print(f"[static:templates_catalog] 3/3 templates valides ({sorted(catalog.keys())}) + rejet template invalide OK | PASS")
PY

echo "=== RESULTAT STATIC_CHECKS: 100% PASS ==="
