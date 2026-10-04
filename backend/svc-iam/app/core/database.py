from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import declarative_base
from app.core.config import settings

try:
    from sqlalchemy.ext.asyncio import async_sessionmaker
    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False)
except ImportError:
    from sqlalchemy.orm import sessionmaker
    engine = create_async_engine(settings.DATABASE_URL, pool_pre_ping=True)
    AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

Base = declarative_base()


async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        yield session
