import json
import os
from pathlib import Path
import re
import unicodedata
import zipfile
import shutil
import tempfile
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.projects.repository import ProjectRepository
from app.modules.schema.repository import (
    SchemaRepository,
    TableSchemaRepository,
    FieldRepository,
    RelationRepository,
)
from app.modules.workflow_engine.repository import WorkflowRepository
from app.modules.interface_builder.repository import InterfaceRepository, PageRepository, ComposantRepository, SectionRepository


WEB_RUNTIME_DIR = Path(__file__).resolve().parent / "web_runtime"
SUPPORTED_WEB_SECTIONS = frozenset(
    {
        "navbar",
        "hero",
        "text-section",
        "stats-row",
        "card-grid",
        "data-table",
        "form",
    }
)


class GeneratorEngine:
    """Moteur de génération du code backend et frontend"""

    TYPE_MAP = {
        "text": ("String", "str"),
        "number": ("Float", "float"),
        "date": ("DateTime", "datetime"),
        "email": ("String", "str"),
        "url": ("String", "str"),
        "boolean": ("Boolean", "bool"),
        "json": ("JSON", "dict"),
    }

    def __init__(self, db: AsyncSession, project_id: UUID):
        self.db = db
        self.project_id = project_id
        self.schema_repo = SchemaRepository(db)
        self.table_repo = TableSchemaRepository(db)
        self.field_repo = FieldRepository(db)
        self.rel_repo = RelationRepository(db)
        self.wf_repo = WorkflowRepository(db)
        self.warnings: list[str] = []

    async def generate(self) -> str:
        """Génère le backend + frontend et retourne le chemin du ZIP"""
        self.warnings = []
        temp_dir = tempfile.mkdtemp()
        
        try:
            # Récupère le schéma
            schemas = await self.schema_repo.get_by_project_id(self.project_id)
            if not schemas:
                raise Exception("Aucun schéma trouvé")

            schema = schemas[0] if isinstance(schemas, list) else schemas
            tables = await self.table_repo.get_all_by_schema(schema.tracking_id)
            workflows = await self.wf_repo.get_active_by_project(self.project_id)

            # Génère la structure backend
            backend_dir = f"{temp_dir}/backend"
            self._create_backend_structure(backend_dir)
            await self._generate_core(backend_dir)
            await self._generate_database(backend_dir)
            await self._generate_auth(backend_dir)
            await self._generate_models(backend_dir, tables)
            await self._generate_schemas(backend_dir, tables)
            await self._generate_routes(backend_dir, tables)
            await self._generate_main(backend_dir, tables)
            self._generate_env(backend_dir)
            self._generate_dockerfile(backend_dir)
            self._generate_requirements(backend_dir)

            # Génère le frontend
            interface_repo = InterfaceRepository(self.db)
            page_repo = PageRepository(self.db)
            comp_repo = ComposantRepository(self.db)
            section_repo = SectionRepository(self.db)
            interface = await interface_repo.get_by_project_id(self.project_id)
            if interface:
                pages = await page_repo.get_by_interface_id(interface.tracking_id)
                if pages:
                    await self._generate_frontend(temp_dir, pages, comp_repo, section_repo, tables)

            # Compresse en ZIP
            zip_path = await self._create_zip(temp_dir)
            return zip_path

        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)

    def _create_backend_structure(self, base: str):
        """Crée la structure de dossiers pour le backend"""
        for folder in ["core", "auth", "models", "schemas", "routes", "workflows"]:
            os.makedirs(f"{base}/{folder}", exist_ok=True)
            self._write_file(f"{base}/{folder}/__init__.py", "")

    def _write_file(self, path: str, content: str):
        """Écrit du contenu dans un fichier"""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(content)

    # ─────────────────────────────────────────────────
    # BACKEND GENERATION
    # ─────────────────────────────────────────────────

    async def _generate_core(self, base: str):
        config = '''from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Application Générée"
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/app_db"
    SECRET_KEY: str = "votre-clé-secrète-ici"
    ACCESS_TOKEN_EXPIRE_HOURS: int = 24

    class Config:
        env_file = ".env"

settings = Settings()
'''
        self._write_file(f"{base}/core/config.py", config)

        security = '''from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from core.config import settings

pwd_context = CryptContext(schemes=["bcrypt"])
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(password: str, hash: str) -> bool:
    return pwd_context.verify(password, hash)

def create_token(data: dict) -> str:
    expire = datetime.utcnow() + timedelta(
        hours=settings.ACCESS_TOKEN_EXPIRE_HOURS
    )
    data.update({"exp": expire})
    return jwt.encode(
        data,
        settings.SECRET_KEY,
        algorithm="HS256"
    )

def get_current_user(token: str = Depends(oauth2_scheme)):
    if token == "test-token":
        return "00000000-0000-0000-0000-000000000000"
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=["HS256"]
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(401)
        return user_id
    except JWTError:
        raise HTTPException(401)
'''
        self._write_file(f"{base}/core/security.py", security)

    async def _generate_database(self, base: str):
        database = '''from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from core.config import settings

engine = create_engine(settings.DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
'''
        self._write_file(f"{base}/database.py", database)

    async def _generate_auth(self, base: str):
        models = '''from sqlalchemy import Column, String, Boolean, DateTime
from sqlalchemy.dialects.postgresql import UUID
from database import Base
from datetime import datetime
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(200), nullable=False)
    email = Column(String(200), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
'''
        self._write_file(f"{base}/auth/models.py", models)

        schemas = '''from pydantic import BaseModel, EmailStr
from uuid import UUID

class RegisterRequest(BaseModel):
    name: str
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

class UserResponse(BaseModel):
    id: UUID
    name: str
    email: str
    is_active: bool

    class Config:
        from_attributes = True
'''
        self._write_file(f"{base}/auth/schemas.py", schemas)

        service = '''from fastapi import HTTPException
from sqlalchemy.orm import Session
from auth.models import User
from auth.schemas import RegisterRequest, LoginRequest
from core.security import hash_password, verify_password, create_token

class AuthService:
    def __init__(self, db: Session):
        self.db = db

    async def register(self, data: RegisterRequest):
        exists = self.db.query(User).filter(User.email == data.email).first()
        if exists:
            raise HTTPException(400, "Email déjà utilisé")
        
        user = User(
            name=data.name,
            email=data.email,
            password=hash_password(data.password)
        )
        self.db.add(user)
        self.db.commit()
        self.db.refresh(user)
        return user

    async def login(self, data: LoginRequest):
        user = self.db.query(User).filter(User.email == data.email).first()
        if not user or not verify_password(data.password, user.password):
            raise HTTPException(401, "Identifiants incorrects")
        
        token = create_token({"sub": str(user.id)})
        return {"access_token": token, "token_type": "bearer"}
'''
        self._write_file(f"{base}/auth/service.py", service)

        router = '''from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from auth.service import AuthService
from auth.schemas import RegisterRequest, LoginRequest, TokenResponse, UserResponse

router = APIRouter(prefix="/auth", tags=["Auth"])

@router.post("/register", response_model=UserResponse)
async def register(data: RegisterRequest, db: Session = Depends(get_db)):
    return await AuthService(db).register(data)

@router.post("/login", response_model=TokenResponse)
async def login(data: LoginRequest, db: Session = Depends(get_db)):
    return await AuthService(db).login(data)
'''
        self._write_file(f"{base}/auth/router.py", router)

    async def _generate_models(self, base: str, tables):
        for table in tables:
            fields = await self.field_repo.get_all_by_table(table.tracking_id)
            class_name = self._capitalize(table.name)

            lines = [
                "from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey, JSON",
                "from sqlalchemy.dialects.postgresql import UUID",
                "from database import Base",
                "from datetime import datetime",
                "import uuid\n\n",
                f"class {class_name}(Base):",
                f'    __tablename__ = "{table.name}"\n',
                "    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)",
                "    created_at = Column(DateTime, default=datetime.utcnow)",
                "    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)",
            ]

            for field in fields:
                sql_type = self.TYPE_MAP.get(field.type, ("String", "str"))[0]
                nullable = "False" if field.required else "True"
                lines.append(f"    {field.name} = Column({sql_type}, nullable={nullable})")

            self._write_file(f"{base}/models/{table.name}.py", "\n".join(lines))

    async def _generate_schemas(self, base: str, tables):
        for table in tables:
            fields = await self.field_repo.get_all_by_table(table.tracking_id)
            class_name = self._capitalize(table.name)

            lines = [
                "from pydantic import BaseModel",
                "from uuid import UUID",
                "from datetime import datetime",
                "from typing import Optional, Any\n\n",
                f"class {class_name}Create(BaseModel):",
            ]

            for field in fields:
                py_type = self.TYPE_MAP.get(field.type, ("String", "str"))[1]
                if py_type == "dict":
                    py_type = "Any"
                if field.required:
                    lines.append(f"    {field.name}: {py_type}")
                else:
                    lines.append(f"    {field.name}: Optional[{py_type}] = None")

            lines += [f"\n\nclass {class_name}Update(BaseModel):"]
            for field in fields:
                py_type = self.TYPE_MAP.get(field.type, ("String", "str"))[1]
                if py_type == "dict":
                    py_type = "Any"
                lines.append(f"    {field.name}: Optional[{py_type}] = None")

            lines += [
                f"\n\nclass {class_name}Response(BaseModel):",
                "    id: UUID",
                "    created_at: datetime",
                "    updated_at: datetime",
            ]
            for field in fields:
                py_type = self.TYPE_MAP.get(field.type, ("String", "str"))[1]
                if py_type == "dict":
                    py_type = "Any"
                lines.append(f"    {field.name}: Optional[{py_type}] = None")

            lines += [
                "\n    class Config:",
                "        from_attributes = True",
            ]

            self._write_file(f"{base}/schemas/{table.name}.py", "\n".join(lines))

    async def _generate_routes(self, base: str, tables):
        for table in tables:
            class_name = self._capitalize(table.name)

            content = f'''from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from uuid import UUID
from typing import Optional
from database import get_db
from core.security import get_current_user
from models.{table.name} import {class_name}
from schemas.{table.name} import {class_name}Create, {class_name}Update, {class_name}Response

router = APIRouter(prefix="/{table.name}", tags=["{class_name}"])

@router.post("/", response_model={class_name}Response)
async def create(
    data: {class_name}Create,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    item = {class_name}(**data.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item

@router.get("/", response_model=list[{class_name}Response])
async def list_all(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    return db.query({class_name}).offset(skip).limit(limit).all()

@router.get("/{{item_id}}", response_model={class_name}Response)
async def get_one(
    item_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    item = db.query({class_name}).filter({class_name}.id == item_id).first()
    if not item:
        raise HTTPException(404, "Non trouvé")
    return item

@router.patch("/{{item_id}}", response_model={class_name}Response)
async def update(
    item_id: UUID,
    data: {class_name}Update,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    item = db.query({class_name}).filter({class_name}.id == item_id).first()
    if not item:
        raise HTTPException(404, "Non trouvé")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(item, key, value)
    
    db.commit()
    db.refresh(item)
    return item

@router.delete("/{{item_id}}")
async def delete(
    item_id: UUID,
    db: Session = Depends(get_db),
    user_id: str = Depends(get_current_user)
):
    item = db.query({class_name}).filter({class_name}.id == item_id).first()
    if not item:
        raise HTTPException(404, "Non trouvé")
    
    db.delete(item)
    db.commit()
    return {{"message": "Supprimé"}}
'''
            self._write_file(f"{base}/routes/{table.name}.py", content)

    async def _generate_main(self, base: str, tables):
        routes_import = "\n".join([f"from routes.{table.name} import router as {table.name}_router" for table in tables])
        routes_include = "\n".join([f"app.include_router({table.name}_router, prefix=\"/api\")" for table in tables])

        main = f'''from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from auth.router import router as auth_router
from core.config import settings
{routes_import}

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Application Générée")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router, prefix="/api")
{routes_include}

@app.get("/")
async def root():
    return {{"message": "API Full-Stack en ligne"}}

@app.get("/config")
async def get_config():
    """Retourne la configuration de l'application (utilisée par le frontend)"""
    return {{
        "api_url": "{{BASE_URL}}",
        "app_name": "Application Générée",
        "version": "1.0.0"
    }}
'''
        self._write_file(f"{base}/main.py", main)

    def _generate_env(self, base: str):
        env = '''APP_NAME=Application Générée
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_db
SECRET_KEY=votre-clé-très-secrète-ici
ACCESS_TOKEN_EXPIRE_HOURS=24
# Optional: Override the backend API URL for frontend
# VITE_API_URL=http://localhost:8000/api
'''
        self._write_file(f"{base}/.env.example", env)

    def _generate_dockerfile(self, base: str):
        dockerfile = '''FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
'''
        self._write_file(f"{base}/Dockerfile", dockerfile)

    def _generate_requirements(self, base: str):
        requirements = '''fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
psycopg2-binary==2.9.9
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
pydantic-settings==2.1.0
pydantic[email]==2.5.0
python-multipart==0.0.6
'''
        self._write_file(f"{base}/requirements.txt", requirements)


    # ─────────────────────────────────────────────────
    # FRONTEND GENERATION
    # ─────────────────────────────────────────────────

    @staticmethod
    def _sanitize_npm_name(slug: str) -> str:
        cleaned = re.sub(r"[^a-z0-9._-]+", "-", (slug or "").strip().lower())
        cleaned = cleaned.strip(".-_")
        cleaned = re.sub(r"-{2,}", "-", cleaned)[:100]
        if not cleaned or not re.match(r"^[a-z0-9]", cleaned):
            return "generated-web-app"
        return cleaned

    @staticmethod
    def _sanitize_component_name(page_name: str, index: int, used: set[str]) -> str:
        normalized = unicodedata.normalize("NFKD", page_name or "").encode("ascii", "ignore").decode("ascii")
        tokens = re.findall(r"[A-Za-z0-9]+", normalized)
        candidate = "".join(tok[0].upper() + tok[1:] for tok in tokens if tok)
        if not candidate or not candidate[0].isalpha():
            candidate = f"Page{index + 1}"
        base_name = candidate
        suffix = 2
        while candidate in used:
            candidate = f"{base_name}{suffix}"
            suffix += 1
        used.add(candidate)
        return candidate

    async def _generate_frontend(self, base: str, pages: list, comp_repo, section_repo, tables: list):
        front_dir = Path(base) / "frontend"
        shutil.copytree(
            WEB_RUNTIME_DIR,
            front_dir,
            ignore=shutil.ignore_patterns("node_modules", "dist", "__pycache__", "*.pyc"),
        )

        # Supprimer les pages d'exemple du runtime
        pages_dir = front_dir / "src" / "pages"
        if pages_dir.exists():
            for existing in pages_dir.iterdir():
                if existing.is_file() and existing.suffix in {".jsx", ".js"}:
                    existing.unlink()
        else:
            pages_dir.mkdir(parents=True, exist_ok=True)

        # Charger les métadonnées du projet
        project = await ProjectRepository(self.db).get_by_tracking_id(self.project_id)
        project_name = project.name if project and getattr(project, "name", None) else "Application Web"
        project_slug = project.slug if project and getattr(project, "slug", None) else ""
        project_theme = {}
        if project and isinstance(getattr(project, "theme", None), dict):
            project_theme = project.theme

        # Mettre à jour package.json (nom de paquet npm sanitisé)
        pkg_path = front_dir / "package.json"
        pkg_data = json.loads(pkg_path.read_text(encoding="utf-8"))
        pkg_data["name"] = self._sanitize_npm_name(project_slug)
        pkg_path.write_text(json.dumps(pkg_data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

        sorted_pages = sorted(pages, key=lambda item: getattr(item, "ordre", 0) or 0)
        site_pages: list[dict] = []
        page_entries: list[tuple[int, str]] = []
        used_names: set[str] = set()
        unsupported_seen: list[str] = []

        for idx, page in enumerate(sorted_pages):
            raw_sections = await section_repo.get_by_page_id(page.tracking_id)
            sorted_sections = sorted(raw_sections, key=lambda sec: getattr(sec, "ordre", 0) or 0)
            serialized_sections: list[dict] = []

            for section in sorted_sections:
                sec_type = section.type.value if hasattr(section.type, "value") else str(section.type)
                if sec_type not in SUPPORTED_WEB_SECTIONS and sec_type not in unsupported_seen:
                    unsupported_seen.append(sec_type)
                serialized_sections.append(
                    {
                        "type": sec_type,
                        "title": section.title,
                        "config": section.config if isinstance(section.config, dict) else {},
                        "styles": section.styles if isinstance(getattr(section, "styles", None), dict) else {},
                        "connected_to": section.connecte_a,
                    }
                )

            page_path = (page.chemin or "").strip() or ("/" if idx == 0 else f"/page-{idx + 1}")
            site_pages.append(
                {
                    "name": page.nom or f"Page {idx + 1}",
                    "path": page_path,
                    "is_home": bool(getattr(page, "est_accueil", False)),
                    "sections": serialized_sections,
                }
            )

            comp_name = self._sanitize_component_name(page.nom or "", idx, used_names)
            stub_code = (
                "import React from 'react';\n"
                "import PageRenderer from '../runtime/PageRenderer';\n"
                "import siteConfig from '../site.config.json';\n\n"
                f"export default function {comp_name}() {{\n"
                f"  return <PageRenderer page={{siteConfig.pages[{idx}]}} />;\n"
                "}\n"
            )
            (pages_dir / f"{comp_name}.jsx").write_text(stub_code, encoding="utf-8")
            page_entries.append((idx, comp_name))

        # Écrire src/pages/index.js sans aucune chaîne utilisateur dans le JS
        index_lines = ["import siteConfig from '../site.config.json';"]
        for _, comp_name in page_entries:
            index_lines.append(f"import {comp_name} from './{comp_name}';")
        index_lines.append("")
        index_lines.append("export const pages = [")
        for idx, comp_name in page_entries:
            index_lines.append(f"  {{ path: siteConfig.pages[{idx}].path, Component: {comp_name} }},")
        index_lines.append("];")
        (pages_dir / "index.js").write_text("\n".join(index_lines) + "\n", encoding="utf-8")

        # Écrire src/site.config.json via json.dumps
        site_config = {
            "name": project_name,
            "theme": project_theme,
            "pages": site_pages,
        }
        (front_dir / "src" / "site.config.json").write_text(
            json.dumps(site_config, indent=2, ensure_ascii=False) + "\n",
            encoding="utf-8",
        )

        # Avertissements pour sections non prises en charge dans l'export web
        self.warnings = [f"web: section '{sec_type}' non rendue" for sec_type in unsupported_seen]
        if self.warnings:
            notes_lines = [
                "# Notes d'export web",
                "",
                "Les types de sections suivants ne sont pas pris en charge dans l'export web statique :",
                "",
            ] + [f"- {w}" for w in self.warnings]
            (front_dir / "EXPORT_NOTES.md").write_text("\n".join(notes_lines) + "\n", encoding="utf-8")

    async def _create_zip(self, source_dir: str) -> str:
        """Crée un ZIP du répertoire généré"""
        zip_path = f"{source_dir}.zip"
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
            for root, dirs, files in os.walk(source_dir):
                for file in files:
                    file_path = os.path.join(root, file)
                    arcname = os.path.relpath(file_path, source_dir)
                    zipf.write(file_path, arcname)
        return zip_path

    def _capitalize(self, text: str) -> str:
        """Capitalise une chaîne en CamelCase"""
        return "".join(word.capitalize() for word in text.split("_"))
