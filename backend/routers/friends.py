"""
친구 관련 API
"""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
import models
import schemas
from database import get_db
from auth import oauth2_scheme, decode_token

router = APIRouter(prefix="/api/friends", tags=["friends"])

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    payload = decode_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="자격 증명이 유효하지 않습니다")
    
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="사용자를 찾을 수 없습니다")
    return user

@router.get("/search")
def search_users(username: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """닉네임으로 사용자 검색"""
    users = db.query(models.User).filter(
        models.User.username.ilike(f"%{username}%"),
        models.User.id != current_user.id
    ).limit(10).all()
    
    results = []
    for user in users:
        profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user.id).first()
        results.append({
            "id": user.id,
            "username": user.username,
            "avatar_url": profile.avatar_url if profile else None,
            "level": profile.level if profile else 1,
            "total_distance": profile.total_distance if profile else 0
        })
    
    return results

@router.post("/request")
def send_friend_request(friend_username: str, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """친구 요청 보내기"""
    # 현재 친구 수 확인 (최대 20명)
    current_friends_count = db.query(models.Friendship).filter(
        ((models.Friendship.user_id == current_user.id) | (models.Friendship.friend_id == current_user.id)),
        models.Friendship.status == "accepted"
    ).count()
    
    if current_friends_count >= 20:
        raise HTTPException(status_code=400, detail="친구는 최대 20명까지만 등록할 수 있습니다")
    
    friend = db.query(models.User).filter(models.User.username == friend_username).first()
    if not friend:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    if friend.id == current_user.id:
        raise HTTPException(status_code=400, detail="자기 자신을 친구로 추가할 수 없습니다")
    
    # 상대방의 친구 수도 확인
    friend_count = db.query(models.Friendship).filter(
        ((models.Friendship.user_id == friend.id) | (models.Friendship.friend_id == friend.id)),
        models.Friendship.status == "accepted"
    ).count()
    
    if friend_count >= 20:
        raise HTTPException(status_code=400, detail="상대방의 친구 목록이 가득 찼습니다")
    
    # 이미 친구 요청이 있는지 확인
    existing = db.query(models.Friendship).filter(
        ((models.Friendship.user_id == current_user.id) & (models.Friendship.friend_id == friend.id)) |
        ((models.Friendship.user_id == friend.id) & (models.Friendship.friend_id == current_user.id))
    ).first()
    
    if existing:
        if existing.status == "accepted":
            raise HTTPException(status_code=400, detail="이미 친구입니다")
        else:
            raise HTTPException(status_code=400, detail="이미 친구 요청을 보냈습니다")
    
    friendship = models.Friendship(user_id=current_user.id, friend_id=friend.id, status="pending")
    db.add(friendship)
    db.commit()
    
    return {"message": "Friend request sent"}

@router.get("/requests")
def get_friend_requests(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """받은 친구 요청 목록"""
    requests = db.query(models.Friendship).filter(
        models.Friendship.friend_id == current_user.id,
        models.Friendship.status == "pending"
    ).all()
    
    results = []
    for req in requests:
        user = db.query(models.User).filter(models.User.id == req.user_id).first()
        profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user.id).first()
        results.append({
            "id": req.id,
            "user_id": user.id,
            "username": user.username,
            "avatar_url": profile.avatar_url if profile else None,
            "level": profile.level if profile else 1,
            "total_distance": profile.total_distance if profile else 0,
            "created_at": req.created_at
        })
    
    return results

@router.post("/accept/{friendship_id}")
def accept_friend_request(friendship_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """친구 요청 수락"""
    # 현재 친구 수 확인 (최대 20명)
    current_friends_count = db.query(models.Friendship).filter(
        ((models.Friendship.user_id == current_user.id) | (models.Friendship.friend_id == current_user.id)),
        models.Friendship.status == "accepted"
    ).count()
    
    if current_friends_count >= 20:
        raise HTTPException(status_code=400, detail="친구는 최대 20명까지만 등록할 수 있습니다")
    
    friendship = db.query(models.Friendship).filter(
        models.Friendship.id == friendship_id,
        models.Friendship.friend_id == current_user.id
    ).first()
    
    if not friendship:
        raise HTTPException(status_code=404, detail="친구 요청을 찾을 수 없습니다")
    
    friendship.status = "accepted"
    db.commit()
    
    return {"message": "Friend request accepted"}

@router.post("/reject/{friendship_id}")
def reject_friend_request(friendship_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """친구 요청 거절"""
    friendship = db.query(models.Friendship).filter(
        models.Friendship.id == friendship_id,
        models.Friendship.friend_id == current_user.id
    ).first()
    
    if not friendship:
        raise HTTPException(status_code=404, detail="친구 요청을 찾을 수 없습니다")
    
    db.delete(friendship)
    db.commit()
    
    return {"message": "Friend request rejected"}

@router.get("/list")
def get_friends(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """친구 목록"""
    friendships = db.query(models.Friendship).filter(
        ((models.Friendship.user_id == current_user.id) | (models.Friendship.friend_id == current_user.id)),
        models.Friendship.status == "accepted"
    ).all()
    
    results = []
    for friendship in friendships:
        friend_id = friendship.friend_id if friendship.user_id == current_user.id else friendship.user_id
        friend = db.query(models.User).filter(models.User.id == friend_id).first()
        profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == friend.id).first()
        
        results.append({
            "id": friend.id,
            "username": friend.username,
            "avatar_url": profile.avatar_url if profile else None,
            "level": profile.level if profile else 1,
            "total_distance": profile.total_distance if profile else 0
        })
    
    return results

@router.delete("/{friend_id}")
def remove_friend(friend_id: int, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """친구 삭제"""
    friendship = db.query(models.Friendship).filter(
        ((models.Friendship.user_id == current_user.id) & (models.Friendship.friend_id == friend_id)) |
        ((models.Friendship.user_id == friend_id) & (models.Friendship.friend_id == current_user.id)),
        models.Friendship.status == "accepted"
    ).first()
    
    if not friendship:
        raise HTTPException(status_code=404, detail="친구 관계를 찾을 수 없습니다")
    
    db.delete(friendship)
    db.commit()
    
    return {"message": "Friend removed"}
