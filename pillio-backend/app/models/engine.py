from sqlalchemy import create_engine
from app.config import settings

# Connect to PostgreSQL
engine = create_engine(
    settings.database_url.replace("asyncpg", "psycopg2"),  # sync engine for table creation
    echo=True
)
