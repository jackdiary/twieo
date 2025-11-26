from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from datetime import timedelta
import os
import shutil
from pathlib import Path

# 새로운 모듈
import models
import schemas
import auth
from database import engine, get_db
from services.weather_service import weather_service
from services.facility_service import facility_service

# 라우터
from routers import friends, goals, achievements, challenges

# 기존 서비스 (있는 경우에만)
try:
    from services.route_generator import generate_circular_route, generate_multiple_routes
except ImportError:
    generate_circular_route = None
    generate_multiple_routes = None

# 데이터베이스 테이블 생성
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="뛰어 (Twieo) API", version="1.0.0")

# 업로드 디렉토리 생성
UPLOAD_DIR = Path("uploads/avatars")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

# 정적 파일 서빙
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

# CORS 설정
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

if ENVIRONMENT == "production":
    # 프로덕션: 환경 변수에서 허용 도메인 가져오기
    allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
    if allowed_origins_str:
        allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]
    else:
        # 기본값 (실제 배포 시 반드시 ALLOWED_ORIGINS 환경 변수 설정 필요)
        allowed_origins = [
            "https://yourdomain.com",
            "https://app.yourdomain.com",
        ]
        print("⚠️  WARNING: Using default CORS origins. Set ALLOWED_ORIGINS environment variable!")
else:
    # 개발: 로컬 개발 환경 허용
    allowed_origins = [
        "http://localhost:8081",
        "http://localhost:19006",
        "http://192.168.219.42:8081",
        "http://192.168.219.42:19006",
        "*"  # 개발용 - 모든 origin 허용
    ]

print(f"🌐 CORS allowed origins ({ENVIRONMENT}): {allowed_origins}")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)

# 라우터 등록
app.include_router(friends.router)
app.include_router(goals.router)
app.include_router(achievements.router)
app.include_router(challenges.router)

class CourseRequest(BaseModel):
    lat: float
    lon: float
    distance: float  # km
    preference: str  # "scenic", "quiet", "none"

class Facility(BaseModel):
    name: str
    type: str
    lat: float
    lon: float
    distance: float

# ==================== 인증 API ====================

@app.post("/api/auth/register", response_model=schemas.User, status_code=status.HTTP_201_CREATED)
def register(user: schemas.UserCreate, db: Session = Depends(get_db)):
    """회원가입"""
    try:
        print(f"[Register] Received data: email={user.email}, username={user.username}")
        
        db_user = db.query(models.User).filter(models.User.email == user.email).first()
        if db_user:
            print(f"[Register] Email already exists: {user.email}")
            raise HTTPException(status_code=400, detail="Email already registered")
        
        db_user = db.query(models.User).filter(models.User.username == user.username).first()
        if db_user:
            print(f"[Register] Username already exists: {user.username}")
            raise HTTPException(status_code=400, detail="Username already taken")
        
        hashed_password = auth.get_password_hash(user.password)
        db_user = models.User(email=user.email, username=user.username, hashed_password=hashed_password)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        
        db_profile = models.UserProfile(user_id=db_user.id)
        db.add(db_profile)
        db.commit()
        
        print(f"[Register] Success: user_id={db_user.id}")
        return db_user
    except HTTPException:
        raise
    except Exception as e:
        print(f"[Register] Error: {str(e)}")
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Registration failed: {str(e)}")

@app.post("/api/auth/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    """로그인"""
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    
    access_token = auth.create_access_token(data={"sub": user.email}, expires_delta=timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES))
    return {"access_token": access_token, "token_type": "bearer"}

def get_current_user(token: str = Depends(auth.oauth2_scheme), db: Session = Depends(get_db)):
    """현재 사용자"""
    payload = auth.decode_token(token)
    if payload is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")
    
    email = payload.get("sub")
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")
    return user

@app.get("/api/users/me", response_model=schemas.User)
def get_current_user_info(current_user: models.User = Depends(get_current_user)):
    """현재 로그인한 사용자 정보"""
    return current_user

@app.post("/api/auth/change-password")
def change_password(
    password_data: schemas.ChangePassword,
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """비밀번호 변경"""
    # 현재 비밀번호 확인
    if not auth.verify_password(password_data.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # 새 비밀번호 길이 확인
    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be at least 6 characters long"
        )
    
    # 새 비밀번호 해싱 및 저장
    current_user.hashed_password = auth.get_password_hash(password_data.new_password)
    db.commit()
    
    return {"message": "Password changed successfully"}

# ==================== 프로필 API ====================

@app.get("/api/profile", response_model=schemas.UserProfile)
def get_profile(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """프로필 조회"""
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return profile

@app.put("/api/profile", response_model=schemas.UserProfile)
def update_profile(profile_update: schemas.UserProfileCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """프로필 수정"""
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    
    for key, value in profile_update.dict(exclude_unset=True).items():
        setattr(profile, key, value)
    
    db.commit()
    db.refresh(profile)
    return profile

@app.post("/api/profile/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """프로필 사진 업로드"""
    # 파일 확장자 검증
    allowed_extensions = {".jpg", ".jpeg", ".png", ".gif", ".webp"}
    file_ext = os.path.splitext(file.filename)[1].lower()
    
    if file_ext not in allowed_extensions:
        raise HTTPException(status_code=400, detail="Invalid file type. Only images are allowed.")
    
    # 파일 크기 제한 (5MB)
    contents = await file.read()
    if len(contents) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="File too large. Maximum size is 5MB.")
    
    # 파일명 생성 (user_id + timestamp)
    import time
    filename = f"avatar_{current_user.id}_{int(time.time())}{file_ext}"
    file_path = UPLOAD_DIR / filename
    
    # 파일 저장
    with open(file_path, "wb") as f:
        f.write(contents)
    
    # 프로필에 URL 저장
    avatar_url = f"/uploads/avatars/{filename}"
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
    
    if not profile:
        profile = models.UserProfile(user_id=current_user.id, avatar_url=avatar_url)
        db.add(profile)
    else:
        # 기존 파일 삭제
        if profile.avatar_url:
            old_file = profile.avatar_url.replace("/uploads/avatars/", "")
            old_path = UPLOAD_DIR / old_file
            if old_path.exists():
                old_path.unlink()
        
        profile.avatar_url = avatar_url
    
    db.commit()
    db.refresh(profile)
    
    return {"avatar_url": avatar_url, "message": "Avatar uploaded successfully"}

# ==================== 러닝 기록 API ====================

@app.post("/api/runs", response_model=schemas.Run, status_code=status.HTTP_201_CREATED)
def create_run(run: schemas.RunCreate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """러닝 기록 저장"""
    db_run = models.Run(**run.dict(), user_id=current_user.id)
    db.add(db_run)
    
    profile = db.query(models.UserProfile).filter(models.UserProfile.user_id == current_user.id).first()
    if profile:
        profile.total_distance += run.distance
        profile.total_runs += 1
        if run.distance > profile.longest_run:
            profile.longest_run = run.distance
        if profile.best_pace == 0 or run.pace < profile.best_pace:
            profile.best_pace = run.pace
        
        # 레벨 계산 (10km당 1레벨)
        profile.level = int(profile.total_distance / 10) + 1
    
    db.commit()
    
    # 목표 진행도 업데이트
    from routers.goals import update_goal_progress
    update_goal_progress(current_user.id, db)
    
    # 업적 확인 및 잠금 해제
    from routers.achievements import check_and_unlock_achievements
    newly_unlocked = check_and_unlock_achievements(current_user.id, db)
    
    # 챌린지 진행도 업데이트
    from routers.challenges import update_challenge_progress
    update_challenge_progress(current_user.id, db)
    
    db.refresh(db_run)
    
    # 새로 달성한 업적 반환
    response = db_run.dict() if hasattr(db_run, 'dict') else {
        "id": db_run.id,
        "user_id": db_run.user_id,
        "date": db_run.date,
        "distance": db_run.distance,
        "duration": db_run.duration,
        "pace": db_run.pace,
        "calories": db_run.calories,
        "route": db_run.route,
        "weather": db_run.weather
    }
    
    if newly_unlocked:
        response["newly_unlocked_achievements"] = [
            {"name": ach.name, "description": ach.description, "icon": ach.icon}
            for ach in newly_unlocked
        ]
    
    return db_run

@app.get("/api/runs", response_model=List[schemas.Run])
def get_runs(skip: int = 0, limit: int = 100, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    """러닝 기록 조회"""
    runs = db.query(models.Run).filter(models.Run.user_id == current_user.id).offset(skip).limit(limit).all()
    return runs

# ==================== 날씨 & 시설 API ====================

@app.get("/api/weather")
def get_weather_info(lat: float, lon: float):
    """날씨 정보"""
    return weather_service.get_weather(lat, lon)

@app.get("/api/facilities/indoor")
def get_indoor_facilities_api(lat: float, lon: float, weather_condition: str = "bad"):
    """실내 시설 추천"""
    facilities = facility_service.get_indoor_facilities(lat, lon, max_distance=5.0, weather_condition=weather_condition)
    weather_data = weather_service.get_weather(lat, lon)
    return {"facilities": facilities, "reason": weather_data['recommendation'], "weather_condition": weather_data['condition']}

@app.get("/")
def read_root():
    return {
        "message": "뛰어 (Twieo) API Server v1.0.0",
        "endpoints": {
            "auth": "/api/auth/register, /api/auth/login",
            "profile": "/api/profile",
            "runs": "/api/runs",
            "weather": "/api/weather",
            "facilities": "/api/facilities/indoor",
            "course": "/generate_course"
        }
    }

@app.post("/generate_course")
def generate_course_endpoint(request: CourseRequest):
    """러닝 코스 생성"""
    # 1. 날씨 확인
    weather_data = weather_service.get_weather(request.lat, request.lon)
    
    if not weather_data['is_good_for_running']:
        # 실내 시설 추천
        facilities = facility_service.get_indoor_facilities(request.lat, request.lon, weather_condition="bad")
        return {"status": "bad_weather", "facilities": facilities, "reason": weather_data['recommendation']}
    
    # 2. 코스 생성 (route_generator가 있는 경우)
    if generate_multiple_routes:
        try:
            routes = generate_multiple_routes(request.lat, request.lon, request.distance, request.preference, count=3)
            if routes:
                return {"status": "success", "routes": routes}
        except Exception as e:
            print(f"Route generation error: {e}")
    
    # 간단한 더미 코스 생성
    dummy_routes = [
        {
            "distance": request.distance,
            "description": f"추천 코스 1 - {request.preference} 스타일",
            "estimated_time": int(request.distance * 6),  # 6분/km 기준
            "difficulty": "보통",
            "waypoints": [
                {"lat": request.lat, "lon": request.lon},
                {"lat": request.lat + 0.01, "lon": request.lon + 0.01},
                {"lat": request.lat, "lon": request.lon}
            ]
        },
        {
            "distance": request.distance * 0.8,
            "description": f"추천 코스 2 - 짧은 코스",
            "estimated_time": int(request.distance * 0.8 * 6),
            "difficulty": "쉬움",
            "waypoints": [
                {"lat": request.lat, "lon": request.lon},
                {"lat": request.lat - 0.008, "lon": request.lon + 0.008},
                {"lat": request.lat, "lon": request.lon}
            ]
        },
        {
            "distance": request.distance * 1.2,
            "description": f"추천 코스 3 - 긴 코스",
            "estimated_time": int(request.distance * 1.2 * 6),
            "difficulty": "어려움",
            "waypoints": [
                {"lat": request.lat, "lon": request.lon},
                {"lat": request.lat + 0.015, "lon": request.lon - 0.01},
                {"lat": request.lat, "lon": request.lon}
            ]
        }
    ]
    
    return {"status": "success", "routes": dummy_routes}

@app.get("/facilities")
def get_facilities(lat: float, lon: float):
    """주변 시설 조회"""
    facilities = facility_service.get_indoor_facilities(lat, lon)
    return {"facilities": facilities}
