import asyncio
import sys
import os
sys.path.append(os.getcwd())

from app.core.database import SessionLocal
from app.modules.projects.models import Project
from sqlalchemy import select, text

async def test():
    async with SessionLocal() as db:
        result = await db.execute(select(Project).limit(1))
        project = result.scalar_one_or_none()
        if not project:
            print("No projects found")
            return
        
        print(f"Testing delete for project: {project.tracking_id}")
        pid = project.tracking_id
        
        try:
            await db.execute(text("DELETE FROM fields_schema WHERE table_id IN (SELECT tracking_id FROM tables_schema WHERE schema_id IN (SELECT tracking_id FROM schemas WHERE project_id = :pid))").bindparams(pid=pid))
            await db.execute(text("DELETE FROM relations WHERE source_table_id IN (SELECT tracking_id FROM tables_schema WHERE schema_id IN (SELECT tracking_id FROM schemas WHERE project_id = :pid))").bindparams(pid=pid))
            await db.execute(text("DELETE FROM tables_schema WHERE schema_id IN (SELECT tracking_id FROM schemas WHERE project_id = :pid)").bindparams(pid=pid))
            await db.execute(text("DELETE FROM schemas WHERE project_id = :pid").bindparams(pid=pid))
            
            await db.execute(text("DELETE FROM composants WHERE page_id IN (SELECT tracking_id FROM pages WHERE interface_id IN (SELECT tracking_id FROM interfaces WHERE project_id = :pid))").bindparams(pid=pid))
            await db.execute(text("DELETE FROM pages WHERE interface_id IN (SELECT tracking_id FROM interfaces WHERE project_id = :pid)").bindparams(pid=pid))
            await db.execute(text("DELETE FROM interfaces WHERE project_id = :pid").bindparams(pid=pid))
            
            await db.execute(text("DELETE FROM messages WHERE conversation_id IN (SELECT tracking_id FROM conversations WHERE project_id = :pid)").bindparams(pid=pid))
            await db.execute(text("DELETE FROM conversations WHERE project_id = :pid").bindparams(pid=pid))
            
            await db.execute(text("DELETE FROM etapes_workflow WHERE workflow_id IN (SELECT tracking_id FROM workflows WHERE project_id = :pid)").bindparams(pid=pid))
            await db.execute(text("DELETE FROM workflows WHERE project_id = :pid").bindparams(pid=pid))
            
            await db.execute(text("DELETE FROM champs_donnees WHERE donnee_id IN (SELECT tracking_id FROM donnees_projets WHERE project_id = :pid)").bindparams(pid=pid))
            await db.execute(text("DELETE FROM donnees_projets WHERE project_id = :pid").bindparams(pid=pid))
            
            await db.delete(project)
            await db.flush()
            print("Success!")
            await db.rollback()
        except Exception as e:
            print(f"Error: {e}")

asyncio.run(test())
