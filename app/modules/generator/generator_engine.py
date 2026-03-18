import os
import zipfile
import shutil
import tempfile
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.schema.repository import (
    SchemaRepository,
    TableSchemaRepository,
    FieldRepository,
    RelationRepository,
)
from app.modules.workflow_engine.repository import WorkflowRepository


class GeneratorEngine:
    """Moteur de génération du code backend"""

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

    async def generate(self) -> str:
        """Génère le backend et retourne le chemin du ZIP"""
        temp_dir = tempfile.mkdtemp()
        
        try:
            # Récupère le schéma
            schemas = await self.schema_repo.get_by_project_id(self.project_id)
            if not schemas:
                raise Exception("Aucun schéma trouvé")

            schema = schemas[0] if isinstance(schemas, list) else schemas
            tables = await self.table_repo.get_all_by_schema(schema.tracking_id)
            workflows = await self.wf_repo.get_active_by_project(self.project_id)

            # Génère la structure
            self._create_structure(temp_dir)
            await self._generate_core(temp_dir)
            await self._generate_database(temp_dir)
            await self._generate_auth(temp_dir)
            await self._generate_models(temp_dir, tables)
            await self._generate_schemas(temp_dir, tables)
            await self._generate_routes(temp_dir, tables)
            await self._generate_main(temp_dir, tables)
            self._generate_env(temp_dir)
            self._generate_dockerfile(temp_dir)
            self._generate_requirements(temp_dir)

            # Compresse en ZIP
            zip_path = await self._create_zip(temp_dir)
            return zip_path

        finally:
            shutil.rmtree(temp_dir, ignore_errors=True)


    def _create_structure(self, base: str):
        """Crée la structure de dossiers"""
        for folder in ["core", "auth", "models", "schemas", "routes", "workflows"]:
            os.makedirs(f"{base}/{folder}", exist_ok=True)
            self._write_file(f"{base}/{folder}/__init__.py", "")

    def _write_file(self, path: str, content: str):
        """Écrit du contenu dans un fichier"""
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w") as f:
            f.write(content)


    async def _generate_core(self, base: str):
        """Génère les fichiers de configuration core"""
        
        config = '''from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Application Générée"
    DATABASE_URL: str = "sqlite:///./app.db"
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
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")

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
        """Génère la configuration database"""
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
        """Génère les fichiers d'authentification"""
        
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
from typing import Optional

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
        exists = self.db.query(User).filter(
            User.email == data.email
        ).first()
        
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
        user = self.db.query(User).filter(
            User.email == data.email
        ).first()
        
        if not user or not verify_password(
            data.password, user.password
        ):
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

    # ─────────────────────────────────────────────────
    # MODELS
    # ─────────────────────────────────────────────────

    async def _generate_models(self, base: str, tables):
        """Génère les modèles SQLAlchemy"""
        for table in tables:
            fields = await self.field_repo.get_all_by_table(table.tracking_id)
            class_name = self._capitalize(table.name)

            lines = [
                "from sqlalchemy import Column, String, Float, Boolean, DateTime, ForeignKey",
                "from sqlalchemy.dialects.postgresql import UUID",
                "from sqlalchemy.orm import relationship",
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
                lines.append(
                    f"    {field.name} = Column({sql_type}, nullable={nullable})"
                )

            self._write_file(
                f"{base}/models/{table.name}.py",
                "\n".join(lines)
            )

    # ─────────────────────────────────────────────────
    # SCHEMAS
    # ─────────────────────────────────────────────────

    async def _generate_schemas(self, base: str, tables):
        """Génère les schémas Pydantic"""
        for table in tables:
            fields = await self.field_repo.get_all_by_table(table.tracking_id)
            class_name = self._capitalize(table.name)

            lines = [
                "from pydantic import BaseModel",
                "from uuid import UUID",
                "from datetime import datetime",
                "from typing import Optional\n\n",
                f"class {class_name}Create(BaseModel):",
            ]

            for field in fields:
                py_type = self.TYPE_MAP.get(field.type, ("String", "str"))[1]
                if field.required:
                    lines.append(f"    {field.name}: {py_type}")
                else:
                    lines.append(f"    {field.name}: Optional[{py_type}] = None")

            lines += [
                f"\n\nclass {class_name}Update(BaseModel):",
            ]

            for field in fields:
                py_type = self.TYPE_MAP.get(field.type, ("String", "str"))[1]
                lines.append(f"    {field.name}: Optional[{py_type}] = None")

            lines += [
                f"\n\nclass {class_name}Response(BaseModel):",
                "    id: UUID",
                "    created_at: datetime",
                "    updated_at: datetime",
            ]

            for field in fields:
                py_type = self.TYPE_MAP.get(field.type, ("String", "str"))[1]
                lines.append(f"    {field.name}: Optional[{py_type}] = None")

            lines += [
                "\n    class Config:",
                "        from_attributes = True",
            ]

            self._write_file(
                f"{base}/schemas/{table.name}.py",
                "\n".join(lines)
            )

    # ─────────────────────────────────────────────────
    # ROUTES
    # ─────────────────────────────────────────────────

    async def _generate_routes(self, base: str, tables):
        """Génère les routes CRUD"""
        for table in tables:
            fields = await self.field_repo.get_all_by_table(table.tracking_id)
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
    item = {class_name}(**data.dict())
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
    
    for key, value in data.dict(exclude_unset=True).items():
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

    # ─────────────────────────────────────────────────
    # MAIN
    # ─────────────────────────────────────────────────

    async def _generate_main(self, base: str, tables):
        """Génère le fichier main.py"""
        routes_import = "\n".join(
            [f"from routes.{table.name} import router as {table.name}_router" for table in tables]
        )
        routes_include = "\n".join(
            [f"app.include_router({table.name}_router, prefix=\"/api\")" for table in tables]
        )

        main = f'''from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
from auth.router import router as auth_router
{routes_import}

# Crée les tables
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
    return {{"message": "API générée avec succès"}}
'''
        self._write_file(f"{base}/main.py", main)

    # ─────────────────────────────────────────────────
    # CONFIG FILES
    # ─────────────────────────────────────────────────

    def _generate_env(self, base: str):
        """Génère le fichier .env.example"""
        env = '''APP_NAME=Application Générée
DATABASE_URL=sqlite:///./app.db
SECRET_KEY=votre-clé-très-secrète-ici
ACCESS_TOKEN_EXPIRE_HOURS=24
'''
        self._write_file(f"{base}/.env.example", env)

    def _generate_dockerfile(self, base: str):
        """Génère le Dockerfile"""
        dockerfile = '''FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
'''
        self._write_file(f"{base}/Dockerfile", dockerfile)

    def _generate_requirements(self, base: str):
        """Génère le requirements.txt"""
        requirements = '''fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
pydantic-settings==2.1.0
pydantic[email]==2.5.0
python-multipart==0.0.6
'''
        self._write_file(f"{base}/requirements.txt", requirements)

    # ─────────────────────────────────────────────────
    # UTILS
    # ─────────────────────────────────────────────────

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
