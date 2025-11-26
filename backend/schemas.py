from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: int
    created_at: datetime
    is_active: bool
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class ChangePassword(BaseModel):
    current_password: str
    new_password: str

# Profile Schemas
class UserProfileBase(BaseModel):
    full_name: Optional[str] = None
    bio: Optional[str] = None
    avatar_url: Optional[str] = None

class UserProfileCreate(UserProfileBase):
    pass

class UserProfile(UserProfileBase):
    id: int
    user_id: int
    level: int
    total_distance: float
    total_runs: int
    longest_run: float
    best_pace: float
    
    class Config:
        from_attributes = True

# Run Schemas
class RunBase(BaseModel):
    distance: float
    duration: int
    pace: float
    calories: int
    route: Optional[List[dict]] = None
    weather: Optional[str] = None

class RunCreate(RunBase):
    pass

class Run(RunBase):
    id: int
    user_id: int
    date: datetime
    
    class Config:
        from_attributes = True

# Weather Schema
class WeatherResponse(BaseModel):
    temperature: float
    condition: str
    humidity: int
    wind_speed: float
    is_good_for_running: bool
    recommendation: str

# Indoor Facility Schema
class IndoorFacilityBase(BaseModel):
    name: str
    category: str
    address: str
    latitude: float
    longitude: float
    phone: Optional[str] = None
    operating_hours: Optional[str] = None

class IndoorFacility(IndoorFacilityBase):
    id: int
    
    class Config:
        from_attributes = True

class IndoorFacilityRecommendation(BaseModel):
    facilities: List[IndoorFacility]
    reason: str
    weather_condition: str

# Friendship Schemas
class FriendshipBase(BaseModel):
    friend_id: int

class FriendshipCreate(BaseModel):
    friend_username: str

class Friendship(BaseModel):
    id: int
    user_id: int
    friend_id: int
    status: str
    created_at: datetime
    
    class Config:
        from_attributes = True

class FriendInfo(BaseModel):
    id: int
    username: str
    avatar_url: Optional[str] = None
    level: int
    total_distance: float
    
    class Config:
        from_attributes = True

# Goal Schemas
class GoalBase(BaseModel):
    goal_type: str
    target_value: float
    period: str

class GoalCreate(GoalBase):
    pass

class Goal(GoalBase):
    id: int
    user_id: int
    current_value: float
    start_date: datetime
    end_date: Optional[datetime] = None
    is_completed: bool
    
    class Config:
        from_attributes = True

# Achievement Schemas
class AchievementBase(BaseModel):
    name: str
    description: str
    icon: str
    color: str
    requirement_type: str
    requirement_value: float

class Achievement(AchievementBase):
    id: int
    
    class Config:
        from_attributes = True

class UserAchievement(BaseModel):
    id: int
    achievement: Achievement
    unlocked_at: datetime
    
    class Config:
        from_attributes = True

# Challenge Schemas
class ChallengeBase(BaseModel):
    name: str
    challenge_type: str
    target_value: float
    end_date: datetime

class ChallengeCreate(ChallengeBase):
    participant_ids: List[int]

class ChallengeParticipant(BaseModel):
    user_id: int
    username: str
    avatar_url: Optional[str] = None
    current_value: float
    completed_at: Optional[datetime] = None
    rank: Optional[int] = None
    
    class Config:
        from_attributes = True

class Challenge(ChallengeBase):
    id: int
    creator_id: int
    start_date: datetime
    is_active: bool
    participants: List[ChallengeParticipant]
    
    class Config:
        from_attributes = True
