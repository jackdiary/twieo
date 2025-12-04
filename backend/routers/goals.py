"""
목표 관련 API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
import models
import schemas
from database import get_db
from auth import oauth2_scheme, decode_token

router = APIRouter(prefix="/api/goals", tags=["goals"])

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

@router.post("/", response_model=schemas.Goal)
def create_goal(goal: schemas.GoalCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """목표 생성"""
    # 종료 날짜 계산
    end_date = None
    if goal.period == "daily":
        end_date = datetime.utcnow() + timedelta(days=1)
    elif goal.period == "weekly":
        end_date = datetime.utcnow() + timedelta(weeks=1)
    elif goal.period == "monthly":
        end_date = datetime.utcnow() + timedelta(days=30)
    
    db_goal = models.Goal(
        user_id=current_user.id,
        goal_type=goal.goal_type,
        target_value=goal.target_value,
        period=goal.period,
        end_date=end_date
    )
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    
    return db_goal

@router.get("/", response_model=List[schemas.Goal])
def get_goals(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """목표 목록"""
    goals = db.query(models.Goal).filter(
        models.Goal.user_id == current_user.id,
        models.Goal.is_completed == False
    ).all()
    
    return goals

@router.get("/completed", response_model=List[schemas.Goal])
def get_completed_goals(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """완료된 목표 목록"""
    goals = db.query(models.Goal).filter(
        models.Goal.user_id == current_user.id,
        models.Goal.is_completed == True
    ).all()
    
    return goals

@router.delete("/{goal_id}")
def delete_goal(goal_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """목표 삭제"""
    goal = db.query(models.Goal).filter(
        models.Goal.id == goal_id,
        models.Goal.user_id == current_user.id
    ).first()
    
    if not goal:
        raise HTTPException(status_code=404, detail="목표를 찾을 수 없습니다")
    
    db.delete(goal)
    db.commit()
    
    return {"message": "Goal deleted"}

def update_goal_progress(user_id: int, db: Session):
    """목표 진행도 업데이트 (러닝 기록 후 호출)"""
    goals = db.query(models.Goal).filter(
        models.Goal.user_id == user_id,
        models.Goal.is_completed == False
    ).all()
    
    for goal in goals:
        # 기간 내 러닝 기록 조회
        runs = db.query(models.Run).filter(
            models.Run.user_id == user_id,
            models.Run.date >= goal.start_date
        )
        
        if goal.end_date:
            runs = runs.filter(models.Run.date <= goal.end_date)
        
        runs = runs.all()
        
        # 목표 타입에 따라 진행도 계산
        if goal.goal_type == "distance":
            goal.current_value = sum(run.distance for run in runs)
        elif goal.goal_type == "runs":
            goal.current_value = len(runs)
        elif goal.goal_type == "time":
            goal.current_value = sum(run.duration for run in runs) / 60  # 분 단위
        
        # 목표 달성 확인
        if goal.current_value >= goal.target_value:
            goal.is_completed = True
    
    db.commit()
