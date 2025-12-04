"""
업적 관련 API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import models
import schemas
from database import get_db
from auth import oauth2_scheme, decode_token

router = APIRouter(prefix="/api/achievements", tags=["achievements"])

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="자격 증명이 유효하지 않습니다")
    
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="사용자를 찾을 수 없습니다")
    return user

@router.get("/")
def get_achievements(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """모든 업적 및 달성 여부"""
    all_achievements = db.query(models.Achievement).all()
    user_achievements = db.query(models.UserAchievement).filter(
        models.UserAchievement.user_id == current_user.id
    ).all()
    
    unlocked_ids = {ua.achievement_id for ua in user_achievements}
    
    results = []
    for achievement in all_achievements:
        results.append({
            "id": achievement.id,
            "name": achievement.name,
            "description": achievement.description,
            "icon": achievement.icon,
            "color": achievement.color,
            "unlocked": achievement.id in unlocked_ids,
            "unlocked_at": next((ua.unlocked_at for ua in user_achievements if ua.achievement_id == achievement.id), None)
        })
    
    return results

@router.get("/unlocked")
def get_unlocked_achievements(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """달성한 업적 목록"""
    user_achievements = db.query(models.UserAchievement).filter(
        models.UserAchievement.user_id == current_user.id
    ).all()
    
    results = []
    for ua in user_achievements:
        achievement = db.query(models.Achievement).filter(models.Achievement.id == ua.achievement_id).first()
        if achievement:
            results.append({
                "id": achievement.id,
                "name": achievement.name,
                "description": achievement.description,
                "icon": achievement.icon,
                "color": achievement.color,
                "unlocked_at": ua.unlocked_at
            })
    
    return results

def check_and_unlock_achievements(user_id: int, db: Session):
    """업적 달성 확인 및 잠금 해제 (러닝 기록 후 호출)"""
    user = db.query(models.User).filter(models.User.id == user_id).first()
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user_id).first()
    runs = db.query(models.Run).filter(models.Run.user_id == user_id).all()
    
    if not profile or not runs:
        return []
    
    # 이미 달성한 업적
    unlocked = db.query(models.UserAchievement).filter(
        models.UserAchievement.user_id == user_id
    ).all()
    unlocked_ids = {ua.achievement_id for ua in unlocked}
    
    # 모든 업적
    achievements = db.query(models.Achievement).all()
    newly_unlocked = []
    
    for achievement in achievements:
        if achievement.id in unlocked_ids:
            continue
        
        unlocked = False
        
        if achievement.requirement_type == "runs":
            if profile.total_runs >= achievement.requirement_value:
                unlocked = True
        
        elif achievement.requirement_type == "distance":
            max_distance = max((run.distance for run in runs), default=0)
            if max_distance >= achievement.requirement_value:
                unlocked = True
        
        elif achievement.requirement_type == "total_distance":
            if profile.total_distance >= achievement.requirement_value:
                unlocked = True
        
        elif achievement.requirement_type == "pace":
            if profile.best_pace > 0 and profile.best_pace <= achievement.requirement_value:
                unlocked = True
        
        elif achievement.requirement_type == "streak":
            # 연속 일수 계산
            streak = calculate_streak(runs)
            if streak >= achievement.requirement_value:
                unlocked = True
        
        if unlocked:
            user_achievement = models.UserAchievement(
                user_id=user_id,
                achievement_id=achievement.id
            )
            db.add(user_achievement)
            newly_unlocked.append(achievement)
    
    db.commit()
    return newly_unlocked

def calculate_streak(runs):
    """연속 러닝 일수 계산"""
    if not runs:
        return 0
    
    dates = sorted(set(run.date.date() for run in runs), reverse=True)
    if not dates:
        return 0
    
    streak = 1
    for i in range(len(dates) - 1):
        if (dates[i] - dates[i + 1]).days == 1:
            streak += 1
        else:
            break
    
    return streak
