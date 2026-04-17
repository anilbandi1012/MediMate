# app/database.py
import logging
from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.exc import SQLAlchemyError

from app.config import settings
from app.models.base import BaseModel  # Import the correct declarative base

# logger = logging.getLogger(__name__)

# Database URL
DATABASE_URL = settings.get_database_url()

# Create async engine
try:
    engine = create_async_engine(
        DATABASE_URL,
        echo=settings.debug,
        future=True,
        pool_pre_ping=True,   # 🔥 IMPORTANT
        pool_recycle=300,
        connect_args={"ssl": "require"}
    )
    # logger.info("Database engine created successfully")
except Exception as e:
    # logger.error(f"Failed to create database engine: {e}")
    raise

# print("DATABASE_URL =", DATABASE_URL)

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency to get database session
    Usage:
    @app.get("/endpoint")
    async def endpoint(db: AsyncSession = Depends(get_db)):
        ...
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            # logger.error(f"Database session error: {e}")
            await session.rollback()
            raise
        finally:
            try:
                await session.close()
            except Exception as e:
                # logger.error(f"Error closing database session: {e}")
                pass


async def create_db_and_tables():
    """
    Create all database tables. Call this on startup.
    """
    # logger.info("Creating database tables...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(BaseModel.metadata.create_all)
        # logger.info("Database tables created successfully")
    except SQLAlchemyError as e:
        # logger.error(f"Failed to create database tables: {e}")
        raise
    except Exception as e:
        # logger.error(f"Unexpected error creating database tables: {e}")
        raise


async def drop_db_and_tables():
    """
    Drop all database tables. Use with caution - deletes all data.
    """
    # logger.warning("Dropping all database tables...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(BaseModel.metadata.drop_all)
        # logger.info("Database tables dropped successfully")
    except SQLAlchemyError as e:
        # logger.error(f"Failed to drop database tables: {e}")
        raise
    except Exception as e:
        # logger.error(f"Unexpected error dropping database tables: {e}")
        raise