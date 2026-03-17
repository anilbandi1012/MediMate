from sqlalchemy import Column, Integer, String, ForeignKey
from app.database import Base

class UserDevice(Base):
    __tablename__ = "user_devices"

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    fcm_token = Column(String(255), unique=True)
