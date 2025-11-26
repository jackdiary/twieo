# PostgreSQL 데이터베이스 설정 가이드

## 1. PostgreSQL 설치

### Windows
1. https://www.postgresql.org/download/windows/ 에서 설치 파일 다운로드
2. 설치 중 비밀번호 설정 (기억해두세요!)
3. 포트: 5432 (기본값)

### Mac
```bash
brew install postgresql
brew services start postgresql
```

### Linux (Ubuntu)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## 2. 데이터베이스 생성

### psql 접속
```bash
# Windows
psql -U postgres

# Mac/Linux
sudo -u postgres psql
```

### 데이터베이스 생성
```sql
CREATE DATABASE runpick_db;
CREATE USER runpick_user WITH PASSWORD 'your_password_here';
GRANT ALL PRIVILEGES ON DATABASE runpick_db TO runpick_user;
\q
```

## 3. 환경 변수 설정

backend 폴더에 `.env` 파일 생성:

```env
DATABASE_URL=postgresql://runpick_user:your_password_here@localhost:5432/runpick_db
SECRET_KEY=your-super-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
WEATHER_API_KEY=your-weather-api-key
HOST=0.0.0.0
PORT=8000
```

## 4. Python 패키지 설치

```bash
cd backend
pip install -r requirements.txt
```

## 5. 데이터베이스 테이블 생성

FastAPI 서버를 실행하면 자동으로 테이블이 생성됩니다:

```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

또는 수동으로 생성:

```python
from database import engine
import models

models.Base.metadata.create_all(bind=engine)
```

## 6. CSV 데이터 로드 (실내 시설)

CSV 파일이 `frontend/KS_WNTY_PUBLIC_PHSTRN_FCLTY_STTUS_202507.csv`에 있는지 확인하세요.

서버가 시작되면 자동으로 로드됩니다.

## 7. 기상청 API 키 발급

1. https://www.data.go.kr/ 접속
2. 회원가입 및 로그인
3. "기상청_단기예보 조회서비스" 검색
4. 활용신청 → API 키 발급
5. `.env` 파일의 `WEATHER_API_KEY`에 입력

## 8. 서버 실행

```bash
cd backend
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

서버가 실행되면:
- API 문서: http://localhost:8000/docs
- 메인 페이지: http://localhost:8000/

## 9. 프론트엔드 연결

frontend/screens의 API 호출 URL을 서버 주소로 변경:

```javascript
// 로컬 테스트
const API_URL = 'http://localhost:8000';

// 모바일 테스트 (같은 네트워크)
const API_URL = 'http://192.168.x.x:8000';

// 프로덕션
const API_URL = 'https://your-domain.com';
```

## 10. 테스트

### API 테스트
```bash
# 회원가입
curl -X POST "http://localhost:8000/api/auth/register" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"password123"}'

# 로그인
curl -X POST "http://localhost:8000/api/auth/login" \
  -F "username=test@example.com" \
  -F "password=password123"
```

## 문제 해결

### 연결 오류
- PostgreSQL이 실행 중인지 확인: `pg_isready`
- 포트가 열려있는지 확인: `netstat -an | grep 5432`
- 방화벽 설정 확인

### 권한 오류
```sql
GRANT ALL PRIVILEGES ON DATABASE runpick_db TO runpick_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO runpick_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO runpick_user;
```

### 테이블 초기화
```sql
DROP DATABASE runpick_db;
CREATE DATABASE runpick_db;
```

그 다음 서버를 다시 실행하면 테이블이 재생성됩니다.
