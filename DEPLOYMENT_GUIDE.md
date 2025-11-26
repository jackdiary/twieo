# 뛰어 (Twieo) 배포 가이드

## 📋 사전 준비사항

### 필수 요구사항
- Python 3.9+
- PostgreSQL 12+
- Node.js 16+
- Expo CLI
- 도메인 및 SSL 인증서

## 🔧 백엔드 배포

### 1. 환경 설정

```bash
cd backend

# 가상환경 생성
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 의존성 설치
pip install -r requirements.txt
```

### 2. 환경 변수 설정

`.env` 파일 생성:
```bash
cp .env.example .env
```

`.env` 파일 수정:
```env
# 강력한 SECRET_KEY 생성
SECRET_KEY=$(openssl rand -hex 32)

# 데이터베이스 URL
DATABASE_URL=postgresql://user:password@host:5432/twieo_db

# 기상청 API 키
WEATHER_API_KEY=your-api-key

# 환경
ENVIRONMENT=production
```

### 3. 데이터베이스 설정

```bash
# PostgreSQL 데이터베이스 생성
createdb twieo_db

# 테이블 생성
psql -d twieo_db -f setup_database.sql

# 초기 데이터 입력
python init_achievements.py
```

### 4. 서버 실행

#### 개발 환경
```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### 프로덕션 환경
```bash
# Gunicorn 사용 (권장)
pip install gunicorn

gunicorn main:app \
  --workers 4 \
  --worker-class uvicorn.workers.UvicornWorker \
  --bind 0.0.0.0:8000 \
  --access-logfile - \
  --error-logfile -
```

### 5. Nginx 설정 (선택사항)

`/etc/nginx/sites-available/twieo`:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 6. SSL 인증서 설정

```bash
# Let's Encrypt 사용
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d api.yourdomain.com
```

## 📱 프론트엔드 배포

### 1. 환경 설정

```bash
cd frontend
npm install
```

### 2. API URL 변경

`frontend/config/api.js` 수정:
```javascript
const getApiUrl = () => {
    if (Platform.OS === 'web') {
        return 'https://api.yourdomain.com';
    }
    return 'https://api.yourdomain.com';
};
```

### 3. 앱 설정

`app.json` 수정:
```json
{
  "expo": {
    "name": "뛰어",
    "slug": "twieo",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "android": {
      "package": "com.yourcompany.twieo",
      "versionCode": 1,
      "permissions": [
        "ACCESS_FINE_LOCATION",
        "ACCESS_COARSE_LOCATION",
        "CAMERA"
      ]
    },
    "ios": {
      "bundleIdentifier": "com.yourcompany.twieo",
      "buildNumber": "1.0.0",
      "infoPlist": {
        "NSLocationWhenInUseUsageDescription": "러닝 경로를 기록하기 위해 위치 권한이 필요합니다.",
        "NSCameraUsageDescription": "프로필 사진을 촬영하기 위해 카메라 권한이 필요합니다."
      }
    }
  }
}
```

### 4. EAS 빌드 설정

```bash
# EAS CLI 설치
npm install -g eas-cli

# EAS 로그인
eas login

# 프로젝트 설정
eas build:configure
```

### 5. 빌드

```bash
# Android 빌드
eas build --platform android --profile production

# iOS 빌드
eas build --platform ios --profile production
```

### 6. 배포

```bash
# Google Play Store
eas submit --platform android

# Apple App Store
eas submit --platform ios
```

## 🔒 보안 체크리스트

### 배포 전 필수 확인
- [ ] SECRET_KEY 변경
- [ ] 데이터베이스 비밀번호 변경
- [ ] CORS 설정 제한
- [ ] API URL 프로덕션으로 변경
- [ ] .env 파일 .gitignore에 추가
- [ ] HTTPS 설정
- [ ] 방화벽 설정

### 권장 사항
- [ ] Rate Limiting 설정
- [ ] 로그 모니터링
- [ ] 백업 시스템
- [ ] 에러 추적 (Sentry 등)
- [ ] 성능 모니터링

## 🐳 Docker 배포 (선택사항)

### Dockerfile (백엔드)
```dockerfile
FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["gunicorn", "main:app", "--workers", "4", "--worker-class", "uvicorn.workers.UvicornWorker", "--bind", "0.0.0.0:8000"]
```

### docker-compose.yml
```yaml
version: '3.8'

services:
  db:
    image: postgres:14
    environment:
      POSTGRES_DB: twieo_db
      POSTGRES_USER: twieo_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://twieo_user:${DB_PASSWORD}@db:5432/twieo_db
      SECRET_KEY: ${SECRET_KEY}
    depends_on:
      - db

volumes:
  postgres_data:
```

## 📊 모니터링

### 로그 확인
```bash
# Gunicorn 로그
tail -f /var/log/gunicorn/access.log
tail -f /var/log/gunicorn/error.log

# Nginx 로그
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

### 성능 모니터링
- New Relic
- Datadog
- Prometheus + Grafana

## 🔄 업데이트 프로세스

### 백엔드 업데이트
```bash
cd backend
git pull
source venv/bin/activate
pip install -r requirements.txt
sudo systemctl restart gunicorn
```

### 프론트엔드 업데이트
```bash
cd frontend
git pull
npm install
eas build --platform all --profile production
eas submit --platform all
```

## 🆘 문제 해결

### 데이터베이스 연결 실패
```bash
# PostgreSQL 상태 확인
sudo systemctl status postgresql

# 연결 테스트
psql -h localhost -U twieo_user -d twieo_db
```

### 서버 응답 없음
```bash
# 프로세스 확인
ps aux | grep gunicorn

# 포트 확인
netstat -tulpn | grep 8000
```

### CORS 에러
- CORS 설정 확인
- 도메인 설정 확인
- HTTPS 설정 확인

## 📞 지원

문제가 발생하면 다음을 확인하세요:
1. 로그 파일
2. 환경 변수 설정
3. 방화벽 설정
4. SSL 인증서 유효성
