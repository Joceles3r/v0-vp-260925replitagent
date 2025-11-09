from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List, Dict
from datetime import datetime
from enum import Enum
import uuid

class SocialPlatform(str, Enum):
    YOUTUBE = "youtube"
    TIKTOK = "tiktok"
    FACEBOOK = "facebook"

class EventType(str, Enum):
    VIEW = "view"
    CLICK = "click"

# User Models
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    full_name: str
    hashed_password: str
    visupoints: int = 0
    badges: List[str] = []
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    visupoints: int
    badges: List[str]
    created_at: datetime

class Token(BaseModel):
    access_token: str
    token_type: str

# Project Models
class ProjectCreate(BaseModel):
    title: str
    description: str
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    description: str
    video_url: Optional[str] = None
    thumbnail_url: Optional[str] = None
    views: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Social Authorization Models
class AuthorizeShareRequest(BaseModel):
    project_id: str
    platforms: List[SocialPlatform]

class SocialAuthorization(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    project_id: str
    platforms: List[SocialPlatform]
    authorized_at: datetime = Field(default_factory=datetime.utcnow)
    authorized_ip: Optional[str] = None
    revoked: bool = False
    revoked_at: Optional[datetime] = None

class AuthorizeShareResponse(BaseModel):
    project_id: str
    platforms: List[SocialPlatform]
    links: Dict[str, str]
    message: str

# Social Stats Models
class SocialStats(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    platform: SocialPlatform
    views: int = 0
    clicks: int = 0
    last_updated_at: datetime = Field(default_factory=datetime.utcnow)

class TrackEventRequest(BaseModel):
    project_id: str
    platform: SocialPlatform
    event_type: EventType

# Leaderboard Models
class LeaderboardEntry(BaseModel):
    user_id: str
    full_name: str
    visupoints: int
    total_views: int
    total_clicks: int
    badges: List[str]
    rank: int

# Video Generation Models
class VideoExcerpt(BaseModel):
    platform: SocialPlatform
    duration: int  # seconds
    aspect_ratio: str
    format: str
    output_path: Optional[str] = None