
import asyncio
from app.core.config import settings
from app.core.database import Base
# Import all models to ensure they are registered with the Base metadata
from app.modules.auth.models import User
from app.modules.projects.models import Project
from app.modules.schema.models import Schema, TableSchema, Field, Relation
from app.modules.interface_builder.models import Interface, Page, Composant
from app.modules.generator.models import Generation, Deployment
from app.modules.ai.models import Conversation, Message



def create_all():
    print("Connecting to the database...")
    # Use a synchronous engine for this script
    engine = create_engine(settings.DATABASE_URL.replace("postgresql+asyncpg", "postgresql"))
    
    print("Creating all tables from Base metadata...")
    Base.metadata.create_all(bind=engine)
    print("Tables created successfully.")

if __name__ == "__main__":
    create_all()
