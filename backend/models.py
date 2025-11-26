from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, ForeignKey, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    username = Column(String, unique=True, index=True, nullable=False)  # 닉네임
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)
    
    # Relationships
    runs = relationship("Run", back_populates="user")
    profile = relationship("UserProfile", back_populates="user", uselist=False)
    
    # 친구 관계 (보낸 요청)
    sent_friend_requests = relationship(
        "Friendship",
        foreign_keys="Friendship.user_id",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    # 친구 관계 (받은 요청)
    received_friend_requests = relationship(
        "Friendship",
        foreign_keys="Friendship.friend_id",
        back_populates="friend",
        cascade="all, delete-orphan"
    )
    
    # 목표
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    
    # 업적
    achievements = relationship("UserAchievement", back_populates="user", cascade="all, delete-orphan")
    
    # 챌린지 참여
    challenges_created = relationship("Challenge", foreign_keys="Challenge.creator_id", back_populates="creator")
    challenge_participants = relationship("ChallengeParticipant", back_populates="user")

class UserProfile(Base):
    __tablename__ = "user_profiles"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True)
    full_name = Column(String, nullable=True)
    bio = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    level = Column(Integer, default=1)
    total_distance = Column(Float, default=0.0)
    total_runs = Column(Integer, default=0)
    longest_run = Column(Float, default=0.0)
    best_pace = Column(Float, default=0.0)
    
    user = relationship("User", back_populates="profile")

class Run(Base):
    __tablename__ = "runs"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    date = Column(DateTime, default=datetime.utcnow)
    distance = Column(Float, nullable=False)  # km
    duration = Column(Integer, nullable=False)  # seconds
    pace = Column(Float, nullable=False)  # min/km
    calories = Column(Integer, nullable=False)
    route = Column(JSON, nullable=True)  # GPS coordinates
    weather = Column(String, nullable=True)
    
    user = relationship("User", back_populates="runs")

class IndoorFacility(Base):
    __tablename__ = "indoor_facilities"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    address = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    phone = Column(String, nullable=True)
    operating_hours = Column(String, nullable=True)

# 친구 관계
class Friendship(Base):
    __tablename__ = "friendships"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    friend_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    status = Column(String, default="pending")  # pending, accepted, rejected
    created_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", foreign_keys=[user_id], back_populates="sent_friend_requests")
    friend = relationship("User", foreign_keys=[friend_id], back_populates="received_friend_requests")

# 목표
class Goal(Base):
    __tablename__ = "goals"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    goal_type = Column(String, nullable=False)  # distance, runs, time
    target_value = Column(Float, nullable=False)
    current_value = Column(Float, default=0.0)
    period = Column(String, nullable=False)  # daily, weekly, monthly
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=True)
    is_completed = Column(Boolean, default=False)
    
    user = relationship("User", back_populates="goals")

# 업적 정의
class Achievement(Base):
    __tablename__ = "achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False)
    description = Column(String, nullable=False)
    icon = Column(String, nullable=False)
    color = Column(String, nullable=False)
    requirement_type = Column(String, nullable=False)  # distance, runs, speed, streak
    requirement_value = Column(Float, nullable=False)

# 사용자 업적
class UserAchievement(Base):
    __tablename__ = "user_achievements"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    achievement_id = Column(Integer, ForeignKey("achievements.id"), nullable=False)
    unlocked_at = Column(DateTime, default=datetime.utcnow)
    
    user = relationship("User", back_populates="achievements")
    achievement = relationship("Achievement")

# 챌린지 (친구와 뛰어)
class Challenge(Base):
    __tablename__ = "challenges"
    
    id = Column(Integer, primary_key=True, index=True)
    creator_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    name = Column(String, nullable=False)
    challenge_type = Column(String, nullable=False)  # distance, time
    target_value = Column(Float, nullable=False)
    start_date = Column(DateTime, default=datetime.utcnow)
    end_date = Column(DateTime, nullable=False)
    is_active = Column(Boolean, default=True)
    
    creator = relationship("User", foreign_keys=[creator_id], back_populates="challenges_created")
    participants = relationship("ChallengeParticipant", back_populates="challenge", cascade="all, delete-orphan")

# 챌린지 참가자
class ChallengeParticipant(Base):
    __tablename__ = "challenge_participants"
    
    id = Column(Integer, primary_key=True, index=True)
    challenge_id = Column(Integer, ForeignKey("challenges.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    current_value = Column(Float, default=0.0)
    completed_at = Column(DateTime, nullable=True)
    rank = Column(Integer, nullable=True)
    
    challenge = relationship("Challenge", back_populates="participants")
    user = relationship("User", back_populates="challenge_participants")
