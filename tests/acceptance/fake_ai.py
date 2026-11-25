"""Local OpenAI-compatible mock AI server for LOT 3 acceptance tests.

Call-type identification (by exact phrase in the system message):
  - schema:    "Tu es un expert en architecture de données."
  - interface: "You are an expert Senior UI/UX Designer"
  - workflows: "Analyze the app description and suggest relevant automation workflows."
  - chat:      "Tu es EnoC, l'assistant intelligent et bienveillant de NoCode Builder."

Supported modes via [[MODE:xxx]] marker inside request messages:
  - valid (default)
  - invalid_json
  - bad_section_type (returns section type "carousel" on interface calls)
  - rate_limit (HTTP 429)
  - auth_error (HTTP 401)
  - slow (sleeps longer than AI_TIMEOUT_SECONDS=5 before responding)
  - bad_then_good (returns invalid JSON on first attempt, valid JSON on retry)
"""
from __future__ import annotations

import argparse
import json
import os
import re
import threading
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from typing import Any

FIXTURES_DIR = Path(__file__).resolve().parent / "fixtures"

SYSTEM_PROMPT_IDENTIFIERS: dict[str, str] = {
    "schema": "Tu es un expert en architecture de données.",
    "interface": "You are an expert Senior UI/UX Designer",
    "workflows": "Analyze the app description and suggest relevant automation workflows.",
    "chat": "Tu es EnoC, l'assistant intelligent et bienveillant de NoCode Builder.",
}

_STATS_LOCK = threading.Lock()
_STATS: dict[str, Any] = {
    "total": 0,
    "by_type": {"schema": 0, "interface": 0, "workflows": 0, "chat": 0, "unknown": 0},
    "by_mode": {},
}


def _load_fixture(name: str) -> dict[str, Any]:
    return json.loads((FIXTURES_DIR / f"{name}.json").read_text(encoding="utf-8"))


def _identify_call_type(messages: list[dict[str, Any]]) -> str:
    system_texts = " ".join(
        str(m.get("content", "")) for m in messages if m.get("role") == "system"
    )
    for call_type, marker in SYSTEM_PROMPT_IDENTIFIERS.items():
        if marker in system_texts:
            return call_type
    return "unknown"


def _extract_mode(messages: list[dict[str, Any]]) -> str:
    joined = " ".join(str(m.get("content", "")) for m in messages)
    match = re.findall(r"\[\[MODE:([a-zA-Z0-9_]+)\]\]", joined)
    return match[-1] if match else "valid"


def _completion_payload(content: str, model: str = "fake-model") -> dict[str, Any]:
    return {
        "id": "chatcmpl-fake-lot3",
        "object": "chat.completion",
        "created": int(time.time()),
        "model": model,
        "choices": [
            {
                "index": 0,
                "message": {"role": "assistant", "content": content},
                "finish_reason": "stop",
            }
        ],
        "usage": {"prompt_tokens": 10, "completion_tokens": 10, "total_tokens": 20},
    }


def _record_stat(call_type: str, mode: str) -> None:
    with _STATS_LOCK:
        _STATS["total"] += 1
        _STATS["by_type"][call_type] = _STATS["by_type"].get(call_type, 0) + 1
        _STATS["by_mode"][mode] = _STATS["by_mode"].get(mode, 0) + 1


class FakeAIHandler(BaseHTTPRequestHandler):
    def log_message(self, format: str, *args: Any) -> None:
        # Never log Authorization headers or tokens; keep stdout clean.
        return

    def _send_json(self, code: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        try:
            self.wfile.write(body)
        except BrokenPipeError:
            pass

    def do_GET(self) -> None:
        if self.path == "/health":
            self._send_json(200, {"status": "ok", "service": "fake-ai"})
            return
        if self.path == "/stats":
            with _STATS_LOCK:
                snapshot = json.loads(json.dumps(_STATS))
            self._send_json(200, snapshot)
            return
        self._send_json(404, {"detail": "Not found"})

    def do_POST(self) -> None:
        if self.path == "/stats/reset":
            with _STATS_LOCK:
                _STATS["total"] = 0
                for k in _STATS["by_type"]:
                    _STATS["by_type"][k] = 0
                _STATS["by_mode"].clear()
            self._send_json(200, {"reset": True})
            return

        if self.path not in ("/v1/chat/completions", "/chat/completions"):
            self._send_json(404, {"detail": "Not found"})
            return

        length = int(self.headers.get("Content-Length", "0"))
        raw_body = self.rfile.read(length) if length > 0 else b"{}"
        req = json.loads(raw_body.decode("utf-8"))
        messages: list[dict[str, Any]] = req.get("messages", [])
        model = str(req.get("model", "fake-model"))

        call_type = _identify_call_type(messages)
        mode = _extract_mode(messages)
        _record_stat(call_type, mode)

        if mode == "auth_error":
            self._send_json(401, {"error": {"message": "Invalid API key", "type": "authentication_error"}})
            return
        if mode == "rate_limit":
            self._send_json(429, {"error": {"message": "Rate limit reached", "type": "rate_limit_error"}})
            return
        if mode == "slow":
            time.sleep(float(os.getenv("FAKE_AI_SLOW_SECONDS", "8.0")))

        is_retry = any(m.get("role") == "assistant" for m in messages)

        if mode == "invalid_json":
            self._send_json(200, _completion_payload("Voici une réponse cassée { invalid json", model))
            return

        if mode == "bad_section_type" and call_type == "interface":
            bad_iface = {
                "pages": [
                    {
                        "name": "Accueil",
                        "path": "/",
                        "device": "desktop",
                        "is_home": True,
                        "sections": [
                            {"type": "carousel", "ordre": 1, "title": "Slider", "config": {}}
                        ],
                    }
                ]
            }
            self._send_json(200, _completion_payload(json.dumps(bad_iface), model))
            return

        if mode == "bad_then_good" and call_type == "schema" and not is_retry:
            self._send_json(200, _completion_payload("{not-valid-json-first-attempt", model))
            return

        if call_type == "chat":
            content = _load_fixture("chat")["content"]
            self._send_json(200, _completion_payload(content, model))
            return

        if call_type in ("schema", "interface", "workflows"):
            fixture = _load_fixture(call_type)
            self._send_json(200, _completion_payload(json.dumps(fixture, ensure_ascii=False), model))
            return

        self._send_json(200, _completion_payload("{}", model))


def main() -> None:
    parser = argparse.ArgumentParser(description="Fake OpenAI-compatible AI server for LOT 3.")
    parser.add_argument("--host", default=os.getenv("FAKE_AI_HOST", "0.0.0.0"))
    parser.add_argument("--port", type=int, default=int(os.getenv("FAKE_AI_PORT", "8090")))
    args = parser.parse_args()
    server = ThreadingHTTPServer((args.host, args.port), FakeAIHandler)
    print(f"fake-ai listening on http://{args.host}:{args.port}", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
