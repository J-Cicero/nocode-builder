#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

PYTHON_BIN=""
for cand in python3 python "$ROOT_DIR/.venv/Scripts/python.exe" "$ROOT_DIR/.venv/bin/python"; do
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

"$VENV_PY" -m pip install -q --upgrade pip >/dev/null 2>&1 || true
"$VENV_PY" -m pip install -q ruff

echo ">>> Ruff version: $("$RUFF_BIN" --version)"

# 1. Contrôle strict (F821, F811 et erreurs de syntaxe intégrées à ruff) sur les 3 services actifs
# (generator_engine.py est exclu du verdict bloquant et vérifié en mode rapport ci-dessous).
"$RUFF_BIN" check --select F821,F811 \
  --exclude "app/modules/generator/generator_engine.py" \
  "$ROOT_DIR/backend/svc-iam" \
  "$ROOT_DIR/backend/svc-nocode-core" \
  "$ROOT_DIR/backend/svc-api-gateway"
echo "[static:active_services] F821/F811/syntax OK | PASS"

# 2. Mode rapport uniquement sur generator_engine.py (hors périmètre lot 3)
echo ">>> [report-only] generator_engine.py :"
"$RUFF_BIN" check --select F821,F811 \
  "$ROOT_DIR/backend/svc-nocode-core/app/modules/generator/generator_engine.py" || true

# 3. Auto-test obligatoire : vérifie que ruff détecte bien un symbole non défini (F821)
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
echo "=== RESULTAT STATIC_CHECKS: 100% PASS ==="
