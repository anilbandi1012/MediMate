from app.models.base import BaseModel
from app.models.engine import engine
from app.models import *  # import all your models here

# Create all tables
BaseModel.metadata.create_all(bind=engine)

print("✅ All tables created successfully")
