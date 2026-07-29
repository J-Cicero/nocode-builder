import asyncio
import json
from sqlalchemy.ext.asyncio import create_async_engine
from sqlalchemy import text

async def run():
    engine = create_async_engine("postgresql+asyncpg://postgres:cicero@localhost/nocode_builder_db")
    async with engine.begin() as conn:
        valid_json = {
            "pages": [
                {
                    "uuid": "page-1",
                    "name": "Home",
                    "slug": "home",
                    "path": "/",
                    "sections": []
                }
            ]
        }
        await conn.execute(text("UPDATE blueprints SET content = :content WHERE uuid = 'bp-uuid-1'"), {"content": json.dumps(valid_json)})
        print("Database updated!")

asyncio.run(run())
