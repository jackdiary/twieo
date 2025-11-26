from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os
from pathlib import Path

# 기능별로 분리된 라우터들을 임포트합니다.
from routers import auth, profiles, runs, extra, friends, goals, achievements, challenges

# 데이터베이스 테이블 생성은 이제 Alembic이 관리하므로 이 코드는 필요 없습니다.
# import models
# from database import engine
# models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="뛰어 (Twieo) API",
    version="1.0.0",
    description="러닝 앱 '뛰어'의 백엔드 API입니다."
)

# --- 미들웨어 설정: CORS --- #

ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

if ENVIRONMENT == "production":
    allowed_origins = [
        "https://twieo.shop",
        "https://www.twieo.shop",
    ]
else:
    # 개발 환경에서는 로컬 및 모든 요청을 허용합니다.
    allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print(f"🌐 CORS allowed origins ({ENVIRONMENT}): {allowed_origins}")

# --- 정적 파일 설정 --- #

# 업로드된 프로필 사진 등을 서빙하기 위한 경로를 설정합니다.
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# --- 라우터 포함 --- #

# 각 파일로 분리된 API 라우터들을 앱에 포함시킵니다.
app.include_router(auth.router)
app.include_router(profiles.router)
app.include_router(runs.router)
app.include_router(friends.router)
app.include_router(goals.router)
app.include_router(achievements.router)
app.include_router(challenges.router)
app.include_router(extra.router)  # 날씨, 코스 생성, 루트(/) 엔드포인트 포함

print("✅ FastAPI app is configured. Ready to run.")
