# ✅ 네이버 클라우드 배포 완료!

## 🎉 배포 성공!

**서버 IP**: 110.165.18.249
**포트**: 8000
**상태**: 정상 작동 중 ✅

---

## 🔧 수정한 문제들

### 1. ✅ database.py 수정
**문제**: `python-dotenv`를 사용하지 않아 .env 파일을 로드하지 못함

**해결**: 
```python
from dotenv import load_dotenv
load_dotenv()
```
추가

### 2. ✅ DATABASE_URL 수정
**문제**: 포트 번호 누락
- 이전: `postgresql://twieo_user:asd1004!!@localhost/twieo`
- 수정: `postgresql://twieo_user:asd1004!!@localhost:5432/twieo`

### 3. ✅ CORS 설정 추가
```env
ALLOWED_ORIGINS=http://110.165.18.249,http://110.165.18.249:8000,http://110.165.18.249:80
```

### 4. ✅ 서버 시작
```bash
nohup python -m uvicorn main:app --host 0.0.0.0 --port 8000 > /var/log/twieo.log 2>&1 &
```

### 5. ✅ Systemd 서비스 설정
- 자동 시작 설정 완료
- 재부팅 시 자동 실행

---

## 📊 현재 상태

### 서버 프로세스
```
✅ uvicorn 실행 중 (PID: 45244)
✅ 포트 8000 리스닝
✅ 데이터베이스 연결 성공
✅ 모든 테이블 생성 완료
```

### API 테스트 (서버 내부)
```bash
curl http://localhost:8000/
```
**응답**:
```json
{
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
```

---

## ⚠️ 남은 작업: 네이버 클라우드 ACG 설정

### 문제
외부에서 포트 8000 접속 불가

### 해결 방법
1. 네이버 클라우드 콘솔 접속
2. **Server > ACG (Access Control Group)** 이동
3. 해당 서버의 ACG 선택
4. **Inbound 규칙 추가**:
   - **프로토콜**: TCP
   - **포트**: 8000
   - **소스**: 0.0.0.0/0 (모든 IP 허용)
   - **설명**: Twieo API Server

5. 규칙 저장

### 추가 권장 포트
- **80** (HTTP) - Nginx 사용 시
- **443** (HTTPS) - SSL 인증서 사용 시
- **22** (SSH) - 이미 열려있음

---

## 🚀 서비스 관리 명령어

### 서비스 시작/중지/재시작
```bash
# 서비스 시작
sudo systemctl start twieo

# 서비스 중지
sudo systemctl stop twieo

# 서비스 재시작
sudo systemctl restart twieo

# 서비스 상태 확인
sudo systemctl status twieo
```

### 로그 확인
```bash
# 실시간 로그
sudo tail -f /var/log/twieo.log

# 최근 50줄
sudo tail -50 /var/log/twieo.log

# Systemd 로그
sudo journalctl -u twieo -f
```

### 프로세스 확인
```bash
# uvicorn 프로세스 확인
ps aux | grep uvicorn

# 포트 확인
netstat -tlnp | grep 8000
```

---

## 📱 프론트엔드 연결

### API URL 변경
`frontend/config/api.js` 파일 수정:

```javascript
const getApiUrl = () => {
    if (process.env.NODE_ENV === 'production') {
        return 'http://110.165.18.249:8000';  // 네이버 클라우드 IP
    }
    
    // 개발 환경
    if (Platform.OS === 'web') {
        return 'http://localhost:8000';
    }
    
    // 모바일 개발
    return 'http://192.168.219.42:8000';
};
```

---

## 🔒 보안 권장사항

### 1. Nginx 리버스 프록시 설정 (권장)
```bash
# Nginx 설치
sudo apt update
sudo apt install nginx -y

# 설정 파일 생성
sudo nano /etc/nginx/sites-available/twieo
```

**설정 내용**:
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

```bash
# 설정 활성화
sudo ln -s /etc/nginx/sites-available/twieo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 2. SSL 인증서 설정 (권장)
도메인이 있다면 Let's Encrypt 사용:
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d yourdomain.com
```

### 3. 방화벽 설정 (선택)
```bash
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 8000/tcp  # API (테스트용)
sudo ufw enable
```

---

## ✅ 배포 완료 체크리스트

- [x] 데이터베이스 연결 설정
- [x] .env 파일 설정
- [x] database.py 수정 (dotenv 로드)
- [x] 서버 시작
- [x] Systemd 서비스 설정
- [x] 자동 시작 설정
- [ ] **네이버 클라우드 ACG 포트 8000 열기** ⚠️ 필수!
- [ ] Nginx 설정 (선택)
- [ ] SSL 인증서 (선택)
- [ ] 프론트엔드 API URL 변경

---

## 🧪 테스트

### ACG 설정 후 테스트
```bash
# 로컬에서
curl http://110.165.18.249:8000/

# 브라우저에서
http://110.165.18.249:8000/
http://110.165.18.249:8000/docs
```

**예상 응답**:
```json
{
  "message": "뛰어 (Twieo) API Server v1.0.0",
  "endpoints": {...}
}
```

---

## 📞 문제 해결

### 서버가 응답하지 않을 때
```bash
# 1. 서비스 상태 확인
sudo systemctl status twieo

# 2. 로그 확인
sudo tail -50 /var/log/twieo.log

# 3. 서비스 재시작
sudo systemctl restart twieo
```

### 데이터베이스 연결 실패
```bash
# PostgreSQL 상태 확인
sudo systemctl status postgresql

# PostgreSQL 시작
sudo systemctl start postgresql

# 연결 테스트
cd /root/twieo/backend
source venv/bin/activate
python test_db.py
```

---

## 🎉 완료!

서버가 정상적으로 작동하고 있습니다!

**다음 단계**:
1. ⚠️ **네이버 클라우드 콘솔에서 ACG 포트 8000 열기** (필수)
2. 프론트엔드 API URL 변경
3. 앱 테스트

**서버 접속**:
```bash
ssh root@110.165.18.249
cd /root/twieo/backend
```

**로그 확인**:
```bash
tail -f /var/log/twieo.log
```

축하합니다! 🎊
