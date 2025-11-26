from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

import schemas
import models
from database import get_db
from dependencies import get_current_user

# 업적 및 목표 관련 함수 임포트
from .goals import update_goal_progress
from .achievements import check_and_unlock_achievements
from .challenges import update_challenge_progress

router = APIRouter(
    prefix="/api/runs",
    tags=["runs"],
)

@router.post("", response_model=schemas.Run, status_code=201)
def create_run(run: schemas.RunCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """러닝 기록 저장"""
    db_run = models.Run(**run.dict(), user_id=current_user.id)
    db.add(db_run)
    
    # 프로필 업데이트
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
    if profile:
        profile.total_distance += run.distance
        profile.total_runs += 1
        if run.distance > profile.longest_run:
            profile.longest_run = run.distance
        if profile.best_pace == 0 or (run.pace > 0 and run.pace < profile.best_pace):
            profile.best_pace = run.pace
        profile.level = int(profile.total_distance / 10) + 1
    
    db.commit()
    
    # 연관된 기능들 업데이트
    update_goal_progress(current_user.id, db)
    newly_unlocked = check_and_unlock_achievements(current_user.id, db)
    update_challenge_progress(current_user.id, db)
    
    db.refresh(db_run)
    
    # 새로 달성한 업적 정보를 응답에 포함 (선택적)
    # 이 부분을 위해서는 Run 스키마에 `newly_unlocked_achievements` 필드가 추가되어야 합니다.
    # 여기서는 간단하게 러닝 기록만 반환합니다.
    return db_run

@router.get("", response_model=List[schemas.Run])
def get_runs(skip: int = 0, limit: int = 100, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """러닝 기록 조회"""
    runs = db.query(models.Run).filter(models.Run.user_id == current_user.id).order_by(models.Run.date.desc()).offset(skip).limit(limit).all()
    return runs
