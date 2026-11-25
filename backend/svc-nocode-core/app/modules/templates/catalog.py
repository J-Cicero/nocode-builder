"""Catalog loader validating all server templates at import/startup time."""
from __future__ import annotations

import json
from pathlib import Path

from pydantic import ValidationError

from app.modules.ai.validation import format_validation_errors
from app.modules.templates.schemas import TemplateDefinition

CATALOG_DIR = Path(__file__).resolve().parent / "catalog"


def load_catalog(catalog_dir: Path = CATALOG_DIR) -> dict[str, TemplateDefinition]:
    """Load and validate every *.json template under *catalog_dir*.

    Raises RuntimeError naming the offending file and exact validation errors
    if any template is missing or invalid so the service refuses to start.
    """
    if not catalog_dir.is_dir():
        raise RuntimeError(f"Répertoire catalogue introuvable : {catalog_dir}")

    files = sorted(catalog_dir.glob("*.json"))
    if not files:
        raise RuntimeError(f"Catalogue de templates vide dans {catalog_dir}")

    catalog: dict[str, TemplateDefinition] = {}
    for path in files:
        try:
            raw = json.loads(path.read_text(encoding="utf-8"))
        except Exception as exc:
            raise RuntimeError(f"Template invalide '{path.name}': JSON illisible ({exc})") from exc

        try:
            tpl = TemplateDefinition.model_validate(raw)
        except ValidationError as exc:
            errs = "; ".join(format_validation_errors(exc))
            raise RuntimeError(f"Template invalide '{path.name}': {errs}") from exc

        if tpl.id != path.stem:
            raise RuntimeError(
                f"Template invalide '{path.name}': id '{tpl.id}' différent du nom de fichier '{path.stem}'."
            )
        if tpl.id in catalog:
            raise RuntimeError(f"Template en double '{tpl.id}' ({path.name}).")
        catalog[tpl.id] = tpl

    return catalog


TEMPLATE_CATALOG: dict[str, TemplateDefinition] = load_catalog()
