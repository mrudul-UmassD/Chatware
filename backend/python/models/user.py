from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime
from enum import Enum

class Role(str, Enum):
    USER = "user"
    ADMIN = "admin"
    SUPER_ADMIN = "super-admin"

class Status(str, Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    AWAY = "away"

class UserBase(BaseModel):
    """Base User model"""
    name: str
    email: str
    profilePic: Optional[str] = None
    bio: Optional[str] = None
    status: Status = Status.OFFLINE
    role: Role = Role.USER

class UserCreate(UserBase):
    """User create model"""
    password: str

class User(UserBase):
    """User model with ID"""
    id: str
    lastSeen: Optional[datetime] = None
    isActive: bool = True
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }

class UserInDB(User):
    """User model stored in DB"""
    password: str
    resetPasswordToken: Optional[str] = None
    resetPasswordExpire: Optional[datetime] = None
    createdAt: datetime
    updatedAt: datetime 