# 네이버 클라우드 서버 문제 해결 가이드

## 📊 현재 상황
- **서버 IP**: 110.165.18.249
- **접속 상태**: SSH 접속 가능
- **API URL**: http://110.165.18.249:8000
- **프론트엔드 설정**: ✅ 완료 (api.js 업데이트됨)
- **백엔드 CORS**: ✅ 완료 (네이버 클라우드 IP 추가됨)
- **위치**: `/root/twieo/backend`

---

## 🔧 즉시 해결 방법

### 1단계: 서버 접속
```bash
ssh root@110.165.18.249
cd /root/twieo/backend
```

### 2단계: 가상환경 활성화
```bash
source venv/bin/activate
```

### 3단계: 환경 변수 확인
```bash
cat .env
```

**확인 사항:**
- DATABASE_URL이 올바른지
- SECRET_KEY가 설정되어 있는지
- WEATHER_API_KEY가 있는지

### 4단계: 수동으로 서버 시작 (테스트)
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

**예상 출력:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

**오류가 발생하면:**
- 오류 메시지를 확인하고 아래 문제 해결 섹션 참조

---

## 🐛 일반적인 문제 및 해결

### 문제 1: 모듈을 찾을 수 없음
```
ModuleNotFoundError: No module named 'fastapi'
```

**해결:**
```bash
source venv/bin/activate
pip install -r requirements.txt
```

### 문제 2: 데이터베이스 연결 실패
```
could not connect to server
```

**해결:**
```bash
# PostgreSQL 상태 확인
sudo systemctl status postgresql

# PostgreSQL 시작
sudo systemctl start postgresql

# 데이터베이스 연결 테스트
python test_db.py
```

### 문제 3: 포트가 이미 사용 중
```
error while attempting to bind on address ('0.0.0.0', 8000)
```

**해결:**
```bash
# 포트 8000 사용 중인 프로세스 확인
sudo netstat -tlnp | grep 8000

# 프로세스 종료
sudo kill -9 <PID>
```

### 문제 4: 권한 문제
```
Permission denied
```

**해결:**
```bash
# uploads 디렉토리 권한 설정
sudo chown -R www-data:www-data uploads/
sudo chmod -R 755 uploads/
```

---

## 🚀 Systemd 서비스 설정 (자동 시작)

### 1. 서비스 파일 생성
```bash
sudo nano /etc/systemd/system/twieo.service
```

### 2. 다음 내용 입력:
```ini
[Unit]
Description=Twieo API Server
After=network.target postgresql.service

[Service]
Type=simple
User=root
WorkingDirectory=/root/twieo/backend
Environment="PATH=/root/twieo/backend/venv/bin"
ExecStart=/root/twieo/backend/venv/bin/python -m uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

### 3. 서비스 활성화 및 시작
```bash
# 서비스 파일 리로드
sudo systemctl daemon-reload

# 서비스 시작
sudo systemctl start twieo

# 서비스 상태 확인
sudo systemctl status twieo

# 부팅 시 자동 시작 설정
sudo systemctl enable twieo
```

### 4. 로그 확인
```bash
# 실시간 로그 보기
sudo journalctl -u twieo -f

# 최근 50줄 보기
sudo journalctl -u twieo -n 50
```

---

## 🌐 Nginx 설정 (선택사항)

### 1. Nginx 설치
```bash
sudo apt update
sudo apt install nginx -y
```

### 2. 설정 파일 생성
```bash
sudo nano /etc/nginx/sites-available/twieo
```

### 3. 다음 내용 입력:
```nginx
server {
    listen 80;
    server_name 110.165.18.249;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads {
        alias /root/twieo/backend/uploads;
    }
}
```

### 4. 설정 활성화
```bash
# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/twieo /etc/nginx/sites-enabled/

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl restart nginx
```

---

## 🔒 방화벽 설정

### 네이버 클라우드 ACG (Access Control Group)
1. 네이버 클라우드 콘솔 접속
2. Server > ACG 설정
3. 다음 포트 허용:
   - **22** (SSH)
   - **80** (HTTP)
   - **443** (HTTPS)
   - **8000** (API - 테스트용)

### 서버 방화벽 (ufw)
```bash
# UFW 설치 및 설정
sudo apt install ufw -y

# 기본 정책 설정
sudo ufw default deny incoming
sudo ufw default allow outgoing

# 필요한 포트 허용
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8000/tcp  # API (테스트용)

# 방화벽 활성화
sudo ufw enable

# 상태 확인
sudo ufw status
```

---

## 📝 환경 변수 설정

### .env 파일 확인 및 수정
```bash
cd /root/twieo/backend
nano .env
```

**필수 환경 변수:**
```env
# Database
DATABASE_URL=postgresql://twieo_user:password@localhost:5432/twieo_db

# JWT Secret
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Weather API
WEATHER_API_KEY=your-weather-api-key

# Server
HOST=0.0.0.0
PORT=8000

# Environment
ENVIRONMENT=production

# CORS (네이버 클라우드 IP 추가)
ALLOWED_ORIGINS=http://110.165.18.249,http://110.165.18.249:8000
```

---

## 🧪 테스트

### 1. 로컬에서 API 테스트
```bash
# 서버에서
curl http://localhost:8000/

# 로컬에서
curl http://110.165.18.249:8000/
```

### 2. 브라우저 테스트
```
http://110.165.18.249:8000/
http://110.165.18.249:8000/docs
```

---

## 📊 모니터링

### 서버 상태 확인
```bash
# 서비스 상태
sudo systemctl status twieo

# 로그 확인
sudo journalctl -u twieo -n 50

# 프로세스 확인
ps aux | grep uvicorn

# 포트 확인
sudo netstat -tlnp | grep 8000

# 리소스 사용량
htop
```

---

## 🆘 긴급 문제 해결

### 서버가 응답하지 않을 때
```bash
# 1. 서비스 재시작
sudo systemctl restart twieo

# 2. 로그 확인
sudo journalctl -u twieo -n 100

# 3. 수동 실행으로 오류 확인
cd /root/twieo/backend
source venv/bin/activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 데이터베이스 문제
```bash
# PostgreSQL 재시작
sudo systemctl restart postgresql

# 연결 테스트
python test_db.py

# 데이터베이스 재생성 (주의!)
sudo -u postgres psql
DROP DATABASE twieo_db;
CREATE DATABASE twieo_db;
GRANT ALL PRIVILEGES ON DATABASE twieo_db TO twieo_user;
\q

# 테이블 재생성
python -c "from database import engine; import models; models.Base.metadata.create_all(bind=engine)"
python init_achievements.py
```

---

## ✅ 체크리스트

### 배포 완료 확인
- [ ] 서버 접속 가능
- [ ] 가상환경 활성화
- [ ] .env 파일 설정 완료
- [ ] 의존성 설치 완료
- [ ] 데이터베이스 연결 성공
- [ ] 수동 실행 테스트 성공
- [ ] Systemd 서비스 설정
- [ ] 서비스 자동 시작 설정
- [ ] Nginx 설정 (선택)
- [ ] 방화벽 설정
- [ ] API 테스트 성공
- [ ] 브라우저 접속 확인

---

## � 변경사항 서버에 배포하기

### 로컬에서 변경한 파일을 서버로 업로드

```bash
# 1. backend/main.py 파일 업로드 (CORS 설정 업데이트)
scp backend/main.py root@110.165.18.249:/root/twieo/backend/

# 2. 서버 접속
ssh root@110.165.18.249

# 3. 서비스 재시작
cd /root/twieo/backend
sudo systemctl restart twieo

# 4. 서비스 상태 확인
sudo systemctl status twieo

# 5. 로그 확인
sudo journalctl -u twieo -n 50
```

### 또는 Git을 사용한 배포 (권장)

```bash
# 1. 로컬에서 변경사항 커밋 및 푸시
git add .
git commit -m "Update API URL and CORS settings for Naver Cloud"
git push origin main

# 2. 서버에서 변경사항 가져오기
ssh root@110.165.18.249
cd /root/twieo
git pull origin main

# 3. 서비스 재시작
cd backend
sudo systemctl restart twieo

# 4. 상태 확인
sudo systemctl status twieo
```

---

## 📱 프론트엔드 앱 테스트

### Expo 앱에서 네이버 클라우드 서버 연결 테스트

1. **앱 재시작**
   ```bash
   # 프론트엔드 디렉토리에서
   cd frontend
   npx expo start
   ```

2. **로그 확인**
   - 앱 시작 시 콘솔에서 다음 메시지 확인:
   ```
   🚀 Production mode - Using production API
   🌐 API URL: http://110.165.18.249:8000
   ```

3. **API 연결 테스트**
   - 로그인 시도
   - 회원가입 시도
   - 프로필 조회

---

## 📞 다음 단계

1. ✅ **프론트엔드 설정 완료**: API URL 업데이트됨
2. ✅ **백엔드 CORS 설정 완료**: 네이버 클라우드 IP 추가됨
3. **서버 배포**: 위의 "변경사항 서버에 배포하기" 따라하기
4. **자동화**: Systemd 서비스 설정
5. **보안**: Nginx + SSL 설정
6. **모니터링**: 로그 및 상태 확인

**다음 작업: 변경사항을 서버에 배포하세요!**

```bash
# 간단한 방법 (파일 직접 업로드)
scp backend/main.py root@110.165.18.249:/root/twieo/backend/
ssh root@110.165.18.249 "cd /root/twieo/backend && sudo systemctl restart twieo"
```
