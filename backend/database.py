from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os

# 환경변수에서 데이터베이스 URL을 가져옵니다.
# 이 URL은 로컬에서는 .env 파일을 통해, 서버에서는 시스템 환경변수를 통해 주입됩니다.
SQLALCHEMY_DATABASE_URL = os.getenv("DATABASE_URL")

# 데이터베이스 URL이 설정되지 않은 경우를 대비한 방어 코드
if not SQLALCHEMY_DATABASE_URL:
    raise ValueError("DATABASE_URL is not set. Check your environment variables or .env file.")

# URL에 'sqlite'가 포함된 경우에만 특별한 옵션을 추가합니다.
# 이렇게 하면 로컬 테스트(SQLite)와 서버 배포(PostgreSQL) 모두를 지원할 수 있습니다.
if "sqlite" in SQLALCHEMY_DATABASE_URL:
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
else:
    engine = create_engine(SQLALCHEMY_DATABASE_URL)


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

# 데이터베이스 세션을 제공하는 의존성 함수
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
