from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # MongoDB
    MONGO_URL: str
    DB_NAME: str
    CORS_ORIGINS: str = "*"
    
    # JWT
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 43200
    
    # YouTube
    YOUTUBE_API_KEY: Optional[str] = None
    YOUTUBE_CLIENT_ID: Optional[str] = None
    YOUTUBE_CLIENT_SECRET: Optional[str] = None
    
    # TikTok
    TIKTOK_API_KEY: Optional[str] = None
    TIKTOK_CLIENT_KEY: Optional[str] = None
    TIKTOK_CLIENT_SECRET: Optional[str] = None
    
    # Facebook
    FACEBOOK_APP_ID: Optional[str] = None
    FACEBOOK_APP_SECRET: Optional[str] = None
    FACEBOOK_ACCESS_TOKEN: Optional[str] = None
    
    # VISUAL URLs
    VISUAL_BASE_URL: str = "https://visual.app"
    VISUAL_OFFICIAL_YOUTUBE: str = "https://youtube.com/@visualproject"
    VISUAL_OFFICIAL_TIKTOK: str = "https://tiktok.com/@visualproject"
    VISUAL_OFFICIAL_FACEBOOK: str = "https://facebook.com/visualproject"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()