from fastapi import APIRouter, Depends, HTTPException, File, UploadFile
from sqlalchemy.orm import Session
import os
from pathlib import Path

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
def get_profile(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """프로필 조회"""
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@router.put("/", response_model=schemas.UserProfile)
def update_profile(profile_update: schemas.UserProfileCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """프로필 수정"""
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    update_data = profile_update.dict(exclude_unset=True)
    for key, value in update_data.items():
        setattr(profile, key, value)
    
    db.commit()
    db.refresh(profile)
    return profile

@router.post("/avatar/")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """프로필 사진 업로드"""
    try:
        print(f"파일 업로드 시작: {file.filename}, content_type: {file.content_type}")
        
        if not file.filename:
            raise HTTPException(status_code=400, detail="No filename provided")
        
        allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
        file_ext = os.path.splitext(file.filename)[1].lower()
        
        if not file_ext:
            raise HTTPException(status_code=400, detail="File has no extension")
        
        if file_ext not in allowed_extensions:
            raise HTTPException(status_code=400, detail=f"Invalid file type '{file_ext}'. Only images are allowed: {', '.join(allowed_extensions)}")
        
        contents = await file.read()
        print(f"파일 크기: {len(contents)} bytes")
        
        if len(contents) == 0:
            raise HTTPException(status_code=400, detail="File is empty")
        
        if len(contents) > 5 * 1024 * 1024: # 5MB limit
            raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")
        
        import time
        filename = f"avatar_{current_user.id}_{int(time.time())}{file_ext}"
        file_path = UPLOAD_DIR / filename
        
        print(f"파일 저장 경로: {file_path}")
        
        with open(file_path, "wb") as f:
            f.write(contents)
        
        avatar_url = f"/uploads/avatars/{filename}"
        profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
        
        if not profile:
            profile = models.UserProfile(user_id=current_user.id, avatar_url=avatar_url)
            db.add(profile)
        else:
            if profile.avatar_url:
                old_file_path = Path(profile.avatar_url.lstrip('/'))
                if old_file_path.exists():
                    old_file_path.unlink()
            profile.avatar_url = avatar_url
            
        db.commit()
        db.refresh(profile)
        
        print(f"아바타 업로드 성공: {avatar_url}")
        return {"avatar_url": avatar_url, "message": "Avatar uploaded successfully"}
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"아바타 업로드 에러: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
