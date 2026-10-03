"""Cross-service DSAR erasure orchestration.

This is what was missing before: svc-consent-dsar used to only track an
erasure *request* and let an admin mark it "completed" as a label with no
actual effect anywhere else. This module makes completion real -- it calls
each service's internal erasure endpoint (authenticated with a real
service-to-service token, see app/core/service_auth.py) and reports what
actually happened, service by service.

svc-billing is intentionally excluded -- see the comment on
IAM_UPSTREAM/NOCODE_UPSTREAM/etc. in app/core/config.py for why.

This does not (yet) handle partial failure with retries or a dead-letter
queue -- if one target is down, its result is recorded as a failure and the
DSAR is left in-progress rather than silently marked done. A production
version of this belongs on a durable queue (Kafka, per the platform
blueprint's compliance.dsar.* topics) rather than a synchronous fan-out;
this synchronous version proves the erasure actually happens end to end,
which is the gap that mattered most to close first.
"""
import httpx
from app.core.config import settings
from app.core.service_auth import create_service_token

TARGETS = {
    "svc-iam": (settings.IAM_UPSTREAM, "/auth/internal/erase-user"),
    "svc-nocode-core": (settings.NOCODE_UPSTREAM, "/api/projects/internal/erase-user"),
    "svc-customer-service": (settings.CUSTOMER_SERVICE_UPSTREAM, "/tickets/internal/erase-user"),
    "svc-service-desk": (settings.SERVICE_DESK_UPSTREAM, "/internal/erase-user"),
}


async def erase_user_everywhere(user_id: str) -> dict:
    """Returns {service_name: {"ok": bool, "detail": ...}} for every target."""
    service_token = create_service_token("svc-consent-dsar")
    results: dict[str, dict] = {}

    async with httpx.AsyncClient(timeout=10.0) as client:
        for name, (base_url, path) in TARGETS.items():
            try:
                resp = await client.post(
                    f"{base_url}{path}/{user_id}",
                    headers={"X-Service-Auth": service_token},
                )
                resp.raise_for_status()
                results[name] = {"ok": True, "detail": resp.json()}
            except httpx.HTTPError as exc:
                results[name] = {"ok": False, "detail": str(exc)}

    return results
