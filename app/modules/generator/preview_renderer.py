from __future__ import annotations

from pathlib import Path
from html import escape
from urllib.parse import quote
import tempfile


PUBLIC_DEPLOYMENTS_DIR = Path(tempfile.gettempdir()) / "nocode_builder_public_deployments"


def get_public_deployments_dir() -> Path:
    PUBLIC_DEPLOYMENTS_DIR.mkdir(parents=True, exist_ok=True)
    return PUBLIC_DEPLOYMENTS_DIR


def slugify_page_path(path: str, fallback: str) -> str:
    cleaned = (path or "").strip().strip("/")
    if not cleaned:
        return fallback
    return cleaned.replace("/", "_")


def build_static_site_files(project_name: str, pages: list[dict]) -> dict[str, str]:
    files: dict[str, str] = {}
    navigation_items = []
    normalized_pages = []

    for index, page in enumerate(pages):
        filename = f"{slugify_page_path(page.get('chemin', ''), f'page-{index + 1}')}-{page.get('type_page', 'mobile')}.html"
        normalized = {**page, "_preview_filename": filename}
        normalized_pages.append(normalized)
        navigation_items.append(
            f'<a href="./{quote(filename)}" class="nav-link">{escape(page.get("nom", "Page"))} <span>{escape(page.get("type_page", "mobile"))}</span></a>'
        )

    for page in normalized_pages:
        files[page["_preview_filename"]] = _render_page(project_name, page, navigation_items)

    home_page = next((page for page in normalized_pages if page.get("est_accueil")), normalized_pages[0] if normalized_pages else None)
    if home_page:
        files["index.html"] = _render_page(project_name, home_page, navigation_items)

    return files


def render_preview_site(project_name: str, pages: list[dict], deployment_id: str) -> str:
    root = get_public_deployments_dir() / deployment_id
    root.mkdir(parents=True, exist_ok=True)
    for filename, content in build_static_site_files(project_name, pages).items():
        (root / filename).write_text(content, encoding="utf-8")

    return str(root)


def _render_page(project_name: str, page: dict, navigation_items: list[str]) -> str:
    components_html = "\n".join(_render_component(component) for component in page.get("composants", []))
    page_name = escape(page.get("nom", "Page"))
    device = escape(page.get("type_page", "mobile"))
    return f"""<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>{page_name} - {escape(project_name)}</title>
    <style>
      :root {{
        --bg: #f6efe5;
        --surface: #fffaf4;
        --ink: #24160d;
        --muted: #7a5c44;
        --accent: #c4622d;
        --line: #ead8c2;
      }}
      * {{ box-sizing: border-box; }}
      body {{
        margin: 0;
        font-family: Georgia, "Times New Roman", serif;
        background:
          radial-gradient(circle at top left, rgba(196,98,45,0.18), transparent 30%),
          linear-gradient(180deg, #f6efe5, #efe4d6);
        color: var(--ink);
      }}
      .shell {{
        max-width: 1200px;
        margin: 0 auto;
        padding: 24px;
      }}
      .topbar {{
        display: flex;
        justify-content: space-between;
        gap: 16px;
        align-items: center;
        margin-bottom: 24px;
        padding: 18px 20px;
        background: rgba(255,255,255,0.72);
        border: 1px solid var(--line);
        border-radius: 18px;
        backdrop-filter: blur(10px);
      }}
      .brand h1 {{
        margin: 0;
        font-size: 24px;
      }}
      .brand p {{
        margin: 6px 0 0;
        color: var(--muted);
        font-family: Arial, sans-serif;
      }}
      .nav {{
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
      }}
      .nav-link {{
        text-decoration: none;
        color: var(--ink);
        border: 1px solid var(--line);
        background: white;
        padding: 10px 12px;
        border-radius: 999px;
        font-family: Arial, sans-serif;
        font-size: 13px;
      }}
      .nav-link span {{
        color: var(--muted);
        margin-left: 6px;
      }}
      .canvas {{
        display: flex;
        flex-wrap: wrap;
        gap: 14px;
        padding: 22px;
        min-height: 70vh;
        background: rgba(255,255,255,0.8);
        border: 1px solid var(--line);
        border-radius: 24px;
        box-shadow: 0 18px 50px rgba(36,22,13,0.08);
      }}
      .block {{
        background: var(--surface);
        border: 1px solid var(--line);
        border-radius: 18px;
        padding: 14px;
        width: 100%;
      }}
      .block.card {{
        box-shadow: 0 10px 30px rgba(36,22,13,0.06);
      }}
      .btn {{
        display: inline-block;
        background: var(--accent);
        color: white;
        padding: 12px 16px;
        border-radius: 12px;
        text-decoration: none;
        font-family: Arial, sans-serif;
      }}
      .input, .textarea, .select {{
        width: 100%;
        border: 1px solid var(--line);
        border-radius: 12px;
        padding: 12px 14px;
        background: white;
        font-family: Arial, sans-serif;
      }}
      .label {{
        display: block;
        margin-bottom: 8px;
        font-family: Arial, sans-serif;
        font-size: 13px;
        color: var(--muted);
      }}
      .badge {{
        display: inline-block;
        padding: 6px 10px;
        border-radius: 999px;
        background: #f3d88b;
        color: #4a341b;
        font-family: Arial, sans-serif;
        font-size: 12px;
        font-weight: 700;
      }}
      .muted {{
        color: var(--muted);
        font-family: Arial, sans-serif;
      }}
      .divider {{
        height: 1px;
        background: var(--line);
        margin: 12px 0;
      }}
      img {{
        max-width: 100%;
        border-radius: 14px;
      }}
      table {{
        width: 100%;
        border-collapse: collapse;
        font-family: Arial, sans-serif;
      }}
      th, td {{
        border-bottom: 1px solid var(--line);
        padding: 10px;
        text-align: left;
      }}
    </style>
  </head>
  <body>
    <div class="shell">
      <div class="topbar">
        <div class="brand">
          <h1>{page_name}</h1>
          <p>{escape(project_name)} · {device}</p>
        </div>
        <nav class="nav">
          {''.join(navigation_items)}
        </nav>
      </div>
      <main class="canvas">
        {components_html or '<div class="block"><p class="muted">No component generated for this page yet.</p></div>'}
      </main>
    </div>
  </body>
</html>"""


def _render_component(component: dict) -> str:
    config = component.get("config") or {}
    props = config.get("props") or {}
    ui_type = config.get("uiType") or "text"
    width = escape(str(component.get("largeur", "100%")))
    height = escape(str(component.get("hauteur", "auto")))
    style = f'style="width:{width};min-height:{height if height != "auto" else "auto"};"'

    if ui_type == "title":
        return f'<section class="block" {style}><h2>{escape(props.get("text", "Title"))}</h2></section>'
    if ui_type == "text":
        return f'<section class="block" {style}><p class="muted">{escape(props.get("text", "Text block"))}</p></section>'
    if ui_type == "button":
        return f'<section class="block" {style}><a href="#" class="btn">{escape(props.get("label", "Button"))}</a></section>'
    if ui_type == "input":
        return f'<section class="block" {style}><label class="label">{escape(props.get("label", "Field"))}</label><input class="input" placeholder="{escape(props.get("placeholder", "Enter text"))}" /></section>'
    if ui_type == "textarea":
        return f'<section class="block" {style}><label class="label">{escape(props.get("label", "Message"))}</label><textarea class="textarea" rows="4" placeholder="{escape(props.get("placeholder", "Type here"))}"></textarea></section>'
    if ui_type == "dropdown":
        return f'<section class="block" {style}><label class="label">{escape(props.get("label", "Select"))}</label><select class="select"><option>{escape(props.get("placeholder", "Choose an option"))}</option></select></section>'
    if ui_type == "checkbox":
        return f'<section class="block" {style}><label class="label"><input type="checkbox" /> {escape(props.get("label", "Checkbox"))}</label></section>'
    if ui_type == "image":
        src = escape(props.get("url", "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80"))
        return f'<section class="block card" {style}><img src="{src}" alt="{escape(props.get("alt", "Image"))}" /></section>'
    if ui_type == "dataList":
        table_name = escape(str(props.get("table", "Data")))
        return f'<section class="block card" {style}><h3>{table_name}</h3><table><thead><tr><th>Name</th><th>Info</th><th>Status</th></tr></thead><tbody><tr><td>Sample</td><td>Generated preview</td><td>Active</td></tr><tr><td>Sample 2</td><td>Generated preview</td><td>Draft</td></tr></tbody></table></section>'
    if ui_type == "card":
        return f'<section class="block card" {style}><h3>{escape(props.get("title", "Card Title"))}</h3><p class="muted">{escape(props.get("text", "Card content"))}</p></section>'
    if ui_type == "badge":
        return f'<section class="block" {style}><span class="badge">{escape(props.get("text", "Badge"))}</span></section>'
    if ui_type == "divider":
        return f'<section class="block" {style}><div class="divider"></div></section>'
    if ui_type == "spacer":
        spacer_height = escape(str(props.get("height", "24")))
        return f'<section class="block" style="width:{width};min-height:{spacer_height}px;"></section>'
    if ui_type in {"container", "columns"}:
        return f'<section class="block card" {style}><p class="muted">{escape(ui_type.title())} block</p></section>'

    return f'<section class="block" {style}><p class="muted">Unsupported component: {escape(ui_type)}</p></section>'
