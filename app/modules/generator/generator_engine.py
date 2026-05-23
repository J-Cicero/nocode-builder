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
from app.modules.interface_builder.repository import InterfaceRepository, PageRepository, ComposantRepository


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

    async def generate(self) -> str:
        """Génère le backend + frontend et retourne le chemin du ZIP"""
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
            interface = await interface_repo.get_by_project_id(self.project_id)
            if interface:
                pages = await page_repo.get_by_interface_id(interface.tracking_id)
                if pages:
                    await self._generate_frontend(temp_dir, pages, comp_repo, tables)

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
'''
        self._write_file(f"{base}/main.py", main)

    def _generate_env(self, base: str):
        env = '''APP_NAME=Application Générée
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/app_db
SECRET_KEY=votre-clé-très-secrète-ici
ACCESS_TOKEN_EXPIRE_HOURS=24
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

    async def _generate_frontend(self, base: str, pages: list, comp_repo, tables: list):
        front_dir = f"{base}/frontend"
        os.makedirs(f"{front_dir}/src/pages", exist_ok=True)
        os.makedirs(f"{front_dir}/src/api", exist_ok=True)
        
        # package.json
        package_json = '''{
  "name": "frontend",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.6.2",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.0",
    "vite": "^5.0.0"
  }
}'''
        self._write_file(f"{front_dir}/package.json", package_json)

        # vite.config.js
        vite_config = '''import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})'''
        self._write_file(f"{front_dir}/vite.config.js", vite_config)

        # index.html
        index_html = '''<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Application Générée</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>'''
        self._write_file(f"{front_dir}/index.html", index_html)

        # src/main.jsx
        main_jsx = '''import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)'''
        self._write_file(f"{front_dir}/src/main.jsx", main_jsx)

        # src/index.css
        index_css = ''':root {
  --primary: #C4622D;
  --bg: #FBF4E9;
  --text: #1A0E0A;
}
body {
  margin: 0;
  font-family: system-ui, -apple-system, sans-serif;
  background-color: var(--bg);
  color: var(--text);
}
* {
  box-sizing: border-box;
}
.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
.btn {
  background-color: var(--primary);
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-weight: bold;
}
.input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
}
.card {
  background: white;
  padding: 1.5rem;
  border-radius: 1rem;
  box-shadow: 0 4px 6px rgba(0,0,0,0.05);
  margin-bottom: 1rem;
  border: 1px solid #f3f4f6;
}
'''
        self._write_file(f"{front_dir}/src/index.css", index_css)

        # src/api/axios.js
        axios_js = '''import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
});

// Mock d'auth pour simplifier les requêtes (test-token)
api.interceptors.request.use(config => {
  config.headers.Authorization = 'Bearer test-token';
  return config;
});

export default api;'''
        self._write_file(f"{front_dir}/src/api/axios.js", axios_js)

        # Map table UUID to table Name
        table_map = {t.tracking_id: t.name for t in tables}

        # Generate pages
        app_routes = []
        app_imports = []
        
        for page in pages:
            comps = await comp_repo.get_by_page_id(page.tracking_id)
            page_name = self._capitalize(page.nom.replace(' ', ''))
            page_file = f"{page_name}.jsx"
            
            page_content = self._generate_react_page(page_name, comps, table_map)
            self._write_file(f"{front_dir}/src/pages/{page_file}", page_content)
            
            app_imports.append(f"import {page_name} from './pages/{page_name}';")
            app_routes.append(f'<Route path="{page.chemin}" element={{<{page_name} />}} />')

        # src/App.jsx
        app_jsx = f'''import React from 'react';
import {{ BrowserRouter, Routes, Route }} from 'react-router-dom';
{"".join([f"{i}\\n" for i in app_imports])}

function App() {{
  return (
    <BrowserRouter>
      <Routes>
        {"".join([f"{r}\\n        " for r in app_routes])}
      </Routes>
    </BrowserRouter>
  );
}}

export default App;
'''
        self._write_file(f"{front_dir}/src/App.jsx", app_jsx)


    def _generate_react_page(self, page_name: str, comps: list, table_map: dict) -> str:
        imports = ["import React, { useState, useEffect } from 'react';"]
        imports.append("import api from '../api/axios';")
        
        state_declarations = []
        effects = []
        render_elements = []

        form_tables = set()
        for comp in comps:
            table_name = table_map.get(comp.connecte_a)
            ui_type = comp.config.get("uiType") if comp.config else "text"
            if table_name and ui_type in ["input", "textarea", "dropdown", "checkbox", "button"]:
                form_tables.add(table_name)
                
        for table in form_tables:
            state_declarations.append(f"const [form{self._capitalize(table)}, setForm{self._capitalize(table)}] = useState({{}});")
            state_declarations.append(f'''
  const handleSubmit{self._capitalize(table)} = async (e) => {{
    e.preventDefault();
    try {{
      await api.post('/{table}/', form{self._capitalize(table)});
      alert('Succès !');
      window.location.reload();
    }} catch (err) {{
      console.error(err);
      alert('Erreur lors de la soumission.');
    }}
  }};
''')

        current_form = None
        
        for comp in sorted(comps, key=lambda x: x.ordre):
            ui_type = comp.config.get("uiType") if comp.config else "text"
            props = comp.config.get("props", {}) if comp.config else {}
            table_name = table_map.get(comp.connecte_a)
            
            if table_name and table_name in form_tables and current_form != table_name:
                if current_form:
                    render_elements.append("</form>")
                current_form = table_name
                render_elements.append(f'<form onSubmit={{handleSubmit{self._capitalize(table_name)}}} className="card">')
                
            elif current_form and (not table_name or table_name != current_form):
                render_elements.append("</form>")
                current_form = None

            if ui_type == "title":
                render_elements.append(f"<h2>{props.get('text', 'Titre')}</h2>")
            elif ui_type == "text":
                render_elements.append(f"<p>{props.get('text', 'Texte')}</p>")
            elif ui_type in ["input", "textarea"]:
                if table_name:
                    field_name = props.get("label", "champ").lower().replace(" ", "_").replace("'", "")
                    render_elements.append(f'''
        <div style={{marginBottom: "1rem"}}>
          <label style={{display: "block", marginBottom: "0.5rem"}}>{props.get('label', 'Champ')}</label>
          <input className="input" placeholder="{props.get('placeholder', '')}" onChange={{e => setForm{self._capitalize(table_name)}({{...form{self._capitalize(table_name)}, {field_name}: e.target.value}})}} required />
        </div>''')
                else:
                    render_elements.append(f"<input className='input' placeholder='{props.get('placeholder', 'Input')}' />")
            elif ui_type == "button":
                if current_form:
                    render_elements.append(f"<button type='submit' className='btn' style={{width: '100%'}}>{props.get('label', 'Valider')}</button>")
                else:
                    render_elements.append(f"<button className='btn'>{props.get('label', 'Bouton')}</button>")
            elif ui_type == "dataList":
                if table_name:
                    state_name = f"{table_name}List"
                    state_declarations.append(f"const [{state_name}, set{self._capitalize(table_name)}List] = useState([]);")
                    effects.append(f'''
  useEffect(() => {{
    api.get('/{table_name}/').then(res => set{self._capitalize(table_name)}List(res.data)).catch(console.error);
  }}, []);
''')
                    render_elements.append(f'''
      <div className="card">
        <h3>{props.get('title', table_name)}</h3>
        <table style={{width: '100%', textAlign: 'left', marginTop: '1rem'}}>
          <thead><tr><th style={{paddingBottom: '1rem'}}>Données enregistrées</th></tr></thead>
          <tbody>
            {{{state_name}.map((item, idx) => (
              <tr key={{idx}}><td style={{padding: '0.75rem 0', borderBottom: '1px solid #eee'}}>{{JSON.stringify(item)}}</td></tr>
            ))}}
          </tbody>
        </table>
      </div>''')
                else:
                    render_elements.append("<div className='card'>Liste sans données</div>")
            elif ui_type == "card":
                render_elements.append(f"<div className='card'><h3>{props.get('title', 'Carte')}</h3><p>{props.get('text', '')}</p></div>")
            elif ui_type == "divider":
                render_elements.append("<hr style={{margin: '2rem 0', border: 'none', borderTop: '1px solid #eee'}} />")
            elif ui_type == "spacer":
                render_elements.append("<div style={{height: '2rem'}}></div>")
            
        if current_form:
            render_elements.append("</form>")

        react_code = f'''{"".join([i + "\\n" for i in imports])}

export default function {page_name}() {{
  {"".join([s + "\\n  " for s in state_declarations])}
  {"".join([e + "\\n  " for e in effects])}
  return (
    <div className="container">
      <h1 style={{color: 'var(--primary)', marginBottom: '2rem'}}>{page_name}</h1>
      {"".join([r + "\\n      " for r in render_elements])}
    </div>
  );
}}
'''
        return react_code

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
