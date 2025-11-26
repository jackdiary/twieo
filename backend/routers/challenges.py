"""
챌린지 (친구와 뛰어) 관련 API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
import models
import schemas
from database import get_db
from auth import oauth2_scheme, decode_token

router = APIRouter(prefix="/api/challenges", tags=["challenges"])

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

@router.post("/")
def create_challenge(challenge: schemas.ChallengeCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """챌린지 생성"""
    db_challenge = models.Challenge(
        creator_id=current_user.id,
        name=challenge.name,
        challenge_type=challenge.challenge_type,
        target_value=challenge.target_value,
        end_date=challenge.end_date
    )
    db.add(db_challenge)
    db.flush()
    
    # 생성자도 참가자로 추가
    creator_participant = models.ChallengeParticipant(
        challenge_id=db_challenge.id,
        user_id=current_user.id
    )
    db.add(creator_participant)
    
    # 다른 참가자 추가
    for participant_id in challenge.participant_ids:
        if participant_id != current_user.id:
            participant = models.ChallengeParticipant(
                challenge_id=db_challenge.id,
                user_id=participant_id
            )
            db.add(participant)
    
    db.commit()
    db.refresh(db_challenge)
    
    return {"id": db_challenge.id, "message": "Challenge created"}

@router.get("/")
def get_challenges(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """내 챌린지 목록"""
    # 내가 참여 중인 챌린지
    participants = db.query(models.ChallengeParticipant).filter(
        models.ChallengeParticipant.user_id == current_user.id
    ).all()
    
    challenge_ids = [p.challenge_id for p in participants]
    challenges = db.query(models.Challenge).filter(
        models.Challenge.id.in_(challenge_ids),
        models.Challenge.is_active == True
    ).all()
    
    results = []
    for challenge in challenges:
        # 참가자 정보
        participants = db.query(models.ChallengeParticipant).filter(
            models.ChallengeParticipant.challenge_id == challenge.id
        ).all()
        
        participant_list = []
        for p in participants:
            user = db.query(models.User).filter(models.User.id == p.user_id).first()
            profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == p.user_id).first()
            
            participant_list.append({
                "user_id": user.id,
                "username": user.username,
                "avatar_url": profile.avatar_url if profile else None,
                "current_value": p.current_value,
                "completed_at": p.completed_at,
                "rank": p.rank
            })
        
        # 순위 정렬
        participant_list.sort(key=lambda x: (-x["current_value"], x["completed_at"] or datetime.max))
        for i, p in enumerate(participant_list, 1):
            p["rank"] = i
        
        results.append({
            "id": challenge.id,
            "name": challenge.name,
            "challenge_type": challenge.challenge_type,
            "target_value": challenge.target_value,
            "start_date": challenge.start_date,
            "end_date": challenge.end_date,
            "is_active": challenge.is_active,
            "participants": participant_list
        })
    
    return results

@router.get("/{challenge_id}")
def get_challenge(challenge_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """챌린지 상세"""
    challenge = db.query(models.Challenge).filter(models.Challenge.id == challenge_id).first()
    if not challenge:
        raise HTTPException(status_code=404, detail="Challenge not found")
    
    # 참가자 확인
    participant = db.query(models.ChallengeParticipant).filter(
        models.ChallengeParticipant.challenge_id == challenge_id,
        models.ChallengeParticipant.user_id == current_user.id
    ).first()
    
    if not participant:
        raise HTTPException(status_code=403, detail="Not a participant")
    
    # 참가자 정보
    participants = db.query(models.ChallengeParticipant).filter(
        models.ChallengeParticipant.challenge_id == challenge_id
    ).all()
    
    participant_list = []
    for p in participants:
        user = db.query(models.User).filter(models.User.id == p.user_id).first()
        profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == p.user_id).first()
        
        participant_list.append({
            "user_id": user.id,
            "username": user.username,
            "avatar_url": profile.avatar_url if profile else None,
            "current_value": p.current_value,
            "completed_at": p.completed_at,
            "rank": p.rank
        })
    
    # 순위 정렬
    participant_list.sort(key=lambda x: (-x["current_value"], x["completed_at"] or datetime.max))
    for i, p in enumerate(participant_list, 1):
        p["rank"] = i
    
    return {
        "id": challenge.id,
        "name": challenge.name,
        "challenge_type": challenge.challenge_type,
        "target_value": challenge.target_value,
        "start_date": challenge.start_date,
        "end_date": challenge.end_date,
        "is_active": challenge.is_active,
        "participants": participant_list
    }

def update_challenge_progress(user_id: int, db: Session):
    """챌린지 진행도 업데이트 (러닝 기록 후 호출)"""
    # 사용자가 참여 중인 챌린지
    participants = db.query(models.ChallengeParticipant).filter(
        models.ChallengeParticipant.user_id == user_id
    ).all()
    
    for participant in participants:
        challenge = db.query(models.Challenge).filter(
            models.Challenge.id == participant.challenge_id,
            models.Challenge.is_active == True
        ).first()
        
        if not challenge:
            continue
        
        # 챌린지 기간 내 러닝 기록
        runs = db.query(models.Run).filter(
            models.Run.user_id == user_id,
            models.Run.date >= challenge.start_date,
            models.Run.date <= challenge.end_date
        ).all()
        
        # 진행도 계산
        if challenge.challenge_type == "distance":
            participant.current_value = sum(run.distance for run in runs)
        elif challenge.challenge_type == "time":
            participant.current_value = sum(run.duration for run in runs) / 60
        
        # 목표 달성 확인
        if participant.current_value >= challenge.target_value and not participant.completed_at:
            participant.completed_at = datetime.utcnow()
    
    db.commit()
