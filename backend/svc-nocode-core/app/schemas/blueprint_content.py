from pydantic import BaseModel, Field, model_validator
from typing import List, Dict, Any, Optional
import uuid

# --- Component Model ---
class Component(BaseModel):
    uuid: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str  # button, input, heading, text, image, container, card
    props: Dict[str, Any] = Field(default_factory=dict)
    styles: Dict[str, Any] = Field(default_factory=dict)
    children: List['Component'] = Field(default_factory=list)

# --- Section Model ---
class Section(BaseModel):
    uuid: str = Field(default_factory=lambda: str(uuid.uuid4()))
    type: str = "hero"
    order: int = 0
    components: List[Component] = Field(default_factory=list)

# --- Page Model ---
class Page(BaseModel):
    uuid: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    slug: str
    path: str
    icon: Optional[str] = None
    sections: List[Section] = Field(default_factory=list)

# --- Theme Model ---
class Theme(BaseModel):
    colors: Dict[str, str] = Field(default_factory=dict)
    typography: Dict[str, str] = Field(default_factory=dict)
    spacing: Dict[str, str] = Field(default_factory=dict)
    radius: Dict[str, str] = Field(default_factory=dict)
    shadow: Dict[str, str] = Field(default_factory=dict)

# --- Database Model ---
class DatabaseField(BaseModel):
    uuid: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    type: str
    required: bool = False

class DatabaseTable(BaseModel):
    uuid: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    fields: List[DatabaseField] = Field(default_factory=list)

class Database(BaseModel):
    tables: List[DatabaseTable] = Field(default_factory=list)

# --- Workflow Model ---
class Workflow(BaseModel):
    uuid: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    trigger: str
    actions: List[Dict[str, Any]] = Field(default_factory=list)

# --- Blueprint Content Model ---
class BlueprintContent(BaseModel):
    metadata: Dict[str, Any] = Field(default_factory=dict)
    pages: List[Page] = Field(default_factory=list)
    theme: Theme = Field(default_factory=Theme)
    database: Database = Field(default_factory=Database)
    workflows: List[Workflow] = Field(default_factory=list)
    settings: Dict[str, Any] = Field(default_factory=dict)

    @model_validator(mode='after')
    def validate_blueprint_rules(self) -> 'BlueprintContent':
        # 1. Unicité des UUIDs
        all_uuids = []
        
        def collect_uuids(item):
            if hasattr(item, 'uuid'):
                all_uuids.append(item.uuid)
            if hasattr(item, 'sections'):
                for s in item.sections:
                    collect_uuids(s)
            if hasattr(item, 'components'):
                for c in item.components:
                    collect_uuids(c)
            if hasattr(item, 'children'):
                for child in item.children:
                    collect_uuids(child)

        for page in self.pages:
            collect_uuids(page)
            
        for table in self.database.tables:
            all_uuids.append(table.uuid)
            for field in table.fields:
                all_uuids.append(field.uuid)
                
        for wf in self.workflows:
            all_uuids.append(wf.uuid)
            
        duplicates = [u for u in set(all_uuids) if all_uuids.count(u) > 1]
        if duplicates:
            raise ValueError(f"Duplicate UUIDs found in Blueprint: {duplicates}")
            
        # 2. Vérification des slugs de pages
        slugs = [p.slug for p in self.pages]
        if len(slugs) != len(set(slugs)):
            raise ValueError("Page slugs must be unique")
            
        # 3. Vérification des chemins de pages
        paths = [p.path for p in self.pages]
        if len(paths) != len(set(paths)):
            raise ValueError("Page paths must be unique")

        return self

def validate_blueprint(data: dict) -> BlueprintContent:
    '''Valide un dictionnaire en tant que BlueprintContent complet'''
    return BlueprintContent.model_validate(data)
