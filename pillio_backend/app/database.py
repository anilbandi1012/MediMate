from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from typing import AsyncGenerator
import logging
from sqlalchemy.exc import SQLAlchemyError
from app.config import settings

# IMPORTANT: load models before creating tables
import app.models
from app.models.base import Base

logger = logging.getLogger(__name__)

DATABASE_URL = settings.get_database_url()

# Create async engine
engine = create_async_engine(
    DATABASE_URL,
    echo=settings.debug,
    future=True,
)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"Database session error: {e}")
            await session.rollback()
            raise
        finally:
            await session.close()


async def create_db_and_tables():
    logger.info("Creating database tables...")

    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)

        logger.info("Database tables created successfully")

    except SQLAlchemyError as e:
        logger.error(f"Failed to create database tables: {e}")
        raise


async def drop_db_and_tables():
    logger.warning("Dropping all database tables...")

    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.drop_all)

        logger.info("Database tables dropped successfully")

    except SQLAlchemyError as e:
        logger.error(f"Failed to drop database tables: {e}")
        raise