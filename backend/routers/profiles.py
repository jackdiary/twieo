from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
import os
from pathlib import Path
import uuid

import schemas
import models
from database import get_db
from dependencies import get_current_user

router = APIRouter(
    prefix="/api/profile",
    tags=["profile"],
)

UPLOAD_DIR = Path("uploads/avatars")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

@router.get("/", response_model=schemas.UserProfile)
def get_my_profile(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """내 프로필 조회"""
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
    if not profile:
        # 프로필이 없으면 생성 (회원가입 시 생성되지만 안전장치)
        profile = models.UserProfile(user_id=current_user.id)
        db.add(profile)
        db.commit()
        db.refresh(profile)
    
    # Add username to response
    result = profile.__dict__
    result["username"] = current_user.username
    return result

@router.get("/{username}", response_model=schemas.UserProfile)
def get_profile(username: str, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """프로필 조회"""
    user = db.query(models.User).filter(models.User.username == username).first()
    if not user:
        raise HTTPException(status_code=404, detail="사용자를 찾을 수 없습니다")
    
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="프로필을 찾을 수 없습니다")
    
    # Add username to response
    result = profile.__dict__
    result["username"] = user.username
    return result

@router.put("/", response_model=schemas.UserProfile)
def update_profile(profile_update: schemas.UserProfileUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """내 프로필 수정"""
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="프로필을 찾을 수 없습니다")
    
    for key, value in profile_update.dict(exclude_unset=True).items():
        setattr(profile, key, value)
    
    db.commit()
    db.refresh(profile)
    
    # Add username to response
    result = profile.__dict__
    result["username"] = current_user.username
    return result

@router.post("/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """프로필 사진 업로드"""
    try:
        # Validate file
        if not file.filename:
            raise HTTPException(status_code=400, detail="파일 이름이 없습니다")
        
        # Check file extension
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if not file_ext:
            raise HTTPException(status_code=400, detail="파일 확장자가 없습니다")
            
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"지원하지 않는 파일 형식입니다. 이미지만 허용됩니다: {', '.join(allowed_extensions)}")
        
        # Read file content
        contents = await file.read()
        
        if not contents:
            raise HTTPException(status_code=400, detail="파일이 비어있습니다")
            
        if len(contents) > 5 * 1024 * 1024:  # 5MB limit
            raise HTTPException(status_code=400, detail="파일이 너무 큽니다. 최대 5MB까지 가능합니다.")
            
        # Generate unique filename
        filename = f"{uuid.uuid4()}{file_ext}"
        file_path = UPLOAD_DIR / filename
        
        # Save file
        with open(file_path, "wb") as f:
            f.write(contents)
            
        # Update profile
        profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
        if not profile:
            # Create profile if not exists
            profile = models.UserProfile(user_id=current_user.id)
            db.add(profile)
        else:
            if profile.avatar_url:
                old_file_path = Path(profile.avatar_url.lstrip('/'))
                if old_file_path.exists():
                    old_file_path.unlink()
        
        # Construct URL
        avatar_url = f"/uploads/avatars/{filename}"
        profile.avatar_url = avatar_url
        
        db.commit()
        db.refresh(profile)
        
        return {"avatar_url": avatar_url, "message": "아바타가 성공적으로 업로드되었습니다"}
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"업로드에 실패했습니다: {str(e)}")
