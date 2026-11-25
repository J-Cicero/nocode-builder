#!/usr/bin/env bash
set -euo pipefail

# Test live optionnel contre Mistral (SKIP si MISTRAL_API_KEY absente).
# Informatif uniquement : ne fait pas échouer run_all.sh.

if [[ -z "${MISTRAL_API_KEY:-}" ]]; then
  echo "[lot3_live] MISTRAL_API_KEY absente -> SKIP"
  exit 0
fi

GATEWAY_URL="${GATEWAY_URL:-http://localhost:8000}"
echo "[lot3_live] Exécution avec MISTRAL_API_KEY (open-mistral-7b)..."

python3 - <<'PY' || true
import json, os, urllib.error, urllib.request, uuid

gw = os.getenv("GATEWAY_URL", "http://localhost:8000").rstrip("/")
uid = uuid.uuid4().hex[:8]
email = f"lot3_live_{uid}@example.com"
pwd = "Password123!"

def call(method, path, body=None, token=None):
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json"} if body is not None else {}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    req = urllib.request.Request(f"{gw}{path}", data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=90) as r:
            return r.status, r.read().decode()
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode()

call("POST", "/api/iam/auth/register", {"email": email, "name": "Live", "surname": "Tester", "password": pwd})
_, login_body = call("POST", "/api/iam/auth/login", {"email": email, "password": pwd})
tok = json.loads(login_body)["access_token"]
_, proj_body = call("POST", "/api/nocode/api/projects/", {"name": f"Pressing Live {uid}"}, tok)
pid = json.loads(proj_body)["tracking_id"]
code, body = call(
    "POST",
    f"/api/nocode/api/ai/projects/{pid}/generate-app",
    {"description": "application de gestion de pressing : clients, vêtements, commandes"},
    tok,
)
print(f"[lot3_live] HTTP={code}")
try:
    d = json.loads(body)
    tables = d.get("db_schema", {}).get("tables_created", [])
    iface = d.get("interface", {}).get("raw_interface", {})
    secs = [s.get("type") for p in iface.get("pages", []) for s in p.get("sections", [])]
    print(f"[lot3_live] success={d.get('success')} tables={len(tables)} sections={secs}")
except Exception as exc:
    print(f"[lot3_live] parse info: {exc}")
PY
