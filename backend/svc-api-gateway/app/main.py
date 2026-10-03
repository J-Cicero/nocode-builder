"""svc-api-gateway — thin edge service in front of every backend microservice.

Responsibilities kept deliberately narrow (a gateway that does too much becomes
its own monolith):
  1. Terminate the client's access token, verify signature + expiry.
  2. Per-tenant / per-IP rate limiting.
  3. Reverse-proxy to the right upstream by path prefix.
  4. Inject trace headers (X-Request-Id) for the SIEM/observability stack.

It does NOT own business logic, and it does NOT talk to any database.
"""
import time
import uuid
import httpx
from fastapi import FastAPI, Request, HTTPException, status
from fastapi.responses import Response
from jose import jwt, JWTError
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

import os

SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-vault")  # same signing key as svc-iam, injected via Vault in real envs
ALGORITHM = "HS256"

# path-prefix -> upstream base URL. Grows by one line per new svc-*.
# Defaults match docker-compose service names; override per-env via env vars
# (Terraform/Helm inject these, never hardcoded in a real deployment).
ROUTES: dict[str, str] = {
    "/api/iam": os.getenv("IAM_UPSTREAM", "http://svc-iam:8001"),
    "/api/nocode": os.getenv("NOCODE_UPSTREAM", "http://svc-nocode-core:8000"),
    "/api/tenants": os.getenv("TENANT_UPSTREAM", "http://svc-tenant:8003"),
    "/api/billing": os.getenv("BILLING_UPSTREAM", "http://svc-billing:8004"),
    "/api/payments": os.getenv("PAYMENT_UPSTREAM", "http://svc-payment-gateway:8005"),
    "/api/support": os.getenv("CUSTOMER_SERVICE_UPSTREAM", "http://svc-customer-service:8006"),
    "/api/service-desk": os.getenv("SERVICE_DESK_UPSTREAM", "http://svc-service-desk:8007"),
    "/api/legal": os.getenv("CONSENT_DSAR_UPSTREAM", "http://svc-consent-dsar:8008"),
}

# Paths that don't require a valid access token (registration, login itself).
PUBLIC_PATHS = {"/api/iam/auth/login", "/api/iam/auth/register", "/api/iam/auth/refresh", "/api/iam/auth/mfa/verify"}

limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])
app = FastAPI(title="svc-api-gateway")
app.state.limiter = limiter


@app.exception_handler(RateLimitExceeded)
async def rate_limit_handler(request: Request, exc: RateLimitExceeded):
    return Response(status_code=429, content="Rate limit exceeded")


def _resolve_upstream(path: str) -> tuple[str, str]:
    for prefix, upstream in ROUTES.items():
        if path.startswith(prefix):
            return upstream, path[len(prefix):] or "/"
    raise HTTPException(status.HTTP_404_NOT_FOUND, "No upstream registered for this path.")


@app.get("/health")
async def health():
    return {"status": "ok", "service": "svc-api-gateway", "routes": list(ROUTES.keys())}


@app.api_route("/api/{full_path:path}", methods=["GET", "POST", "PUT", "PATCH", "DELETE"])
@limiter.limit("120/minute")
async def proxy(full_path: str, request: Request):
    path = f"/api/{full_path}"
    request_id = str(uuid.uuid4())

    if path not in PUBLIC_PATHS:
        auth_header = request.headers.get("authorization", "")
        if not auth_header.startswith("Bearer "):
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Missing bearer token.")
        token = auth_header.removeprefix("Bearer ")
        try:
            claims = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            if claims.get("type") != "access":
                raise JWTError("not an access token")
        except JWTError:
            raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid or expired token.")

    upstream, upstream_path = _resolve_upstream(path)
    url = f"{upstream}{upstream_path}"

    body = await request.body()
    headers = dict(request.headers)
    headers["x-request-id"] = request_id
    headers.pop("host", None)

    async with httpx.AsyncClient(timeout=15.0) as client:
        start = time.monotonic()
        resp = await client.request(request.method, url, params=request.query_params, headers=headers, content=body)
        duration_ms = (time.monotonic() - start) * 1000

    out = Response(content=resp.content, status_code=resp.status_code, media_type=resp.headers.get("content-type"))
    out.headers["x-request-id"] = request_id
    out.headers["x-upstream-latency-ms"] = f"{duration_ms:.1f}"
    return out
