from pydantic_settings import BaseSettings
from typing import List, Optional
import os
import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)

logger = logging.getLogger(__name__)


class Settings(BaseSettings):

    # Database
    database_url: str

    # Security
    secret_key: str = "MuVt7L2DFfJnSjw2bkp8eHU-qKdiSu0c6gkV9uqhmp8"
    algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    VAPID_PRIVATE_KEY: str
    VAPID_PUBLIC_KEY: str

    # API
    api_v1_str: str = "/api/v1"
    project_name: str = "Pillio"
    debug: bool = True

    # CORS
    allowed_origins: List[str] = [
        "http://localhost:3000",
        "http://localhost:8080",
        "https://medi-mate-lime.vercel.app"
    ]

    # Server
    host: str = "0.0.0.0"
    port: int = 8000

    # File Upload
    upload_dir: str = "uploads"
    max_file_size: int = 5242880

    allowed_file_types: str = "jpg,jpeg,png,pdf"
    allowed_image_types: str = "jpg,jpeg,png"

    # Notifications
    reminder_check_interval: int = 60
    low_stock_threshold: int = 5

    # Email
    smtp_tls: bool = True
    smtp_port: int = 587
    smtp_host: str = "smtp.gmail.com"
    smtp_user: Optional[str] = os.getenv("SMTP_USER")
    smtp_password: Optional[str] = os.getenv("SMTP_PASSWORD")

    emails_from_email: Optional[str] = None
    emails_from_name: str = "Pillio"

    class Config:
        env_file = ".env"
        case_sensitive = True

    def get_database_url(self) -> str:
        return self.database_url

    def get_allowed_file_extensions(self):
        return [ext.strip() for ext in self.allowed_file_types.split(",")]

    def get_allowed_image_extensions(self):
        return [ext.strip() for ext in self.allowed_image_types.split(",")]

    def ensure_upload_dir_exists(self):
        if not os.path.exists(self.upload_dir):
            os.makedirs(self.upload_dir)


settings = Settings()