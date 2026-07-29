import asyncio
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def run():
    engine = create_async_engine("postgresql+asyncpg://postgres:cicero@localhost/nocode_builder_db")
    async with engine.connect() as conn:
        res1 = await conn.execute(text("SELECT id, uuid FROM projects;"))
        print("PROJECTS:", res1.fetchall())
        res2 = await conn.execute(text("SELECT id, uuid, project_id FROM blueprints;"))
        print("BLUEPRINTS:", res2.fetchall())

asyncio.run(run())
