import asyncio
import sys
import os
sys.path.append(os.getcwd())

from app.core.database import SessionLocal
from app.modules.projects.models import Project
from app.modules.generator.service import GeneratorService
from sqlalchemy import select

async def test():
    async with SessionLocal() as db:
        result = await db.execute(select(Project).limit(1))
        project = result.scalar_one_or_none()
        if not project:
            print("No projects found")
            return
        
        print(f"Testing deploy_preview for project: {project.tracking_id}")
        service = GeneratorService(db)
        try:
            response = await service.deploy_preview(project.tracking_id, "http://localhost:8000")
            print("Success:", response)
        except Exception as e:
            print(f"Error: {repr(e)}")

asyncio.run(test())
