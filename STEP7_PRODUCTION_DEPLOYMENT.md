# 🚀 7단계: 최종 배포 준비

## 📋 개요

프로덕션 환경으로 배포하기 위한 최종 설정 및 체크리스트입니다.

---

## ✅ 완료된 작업 (1-6단계)

1. ✅ SECRET_KEY 변경
2. ✅ 데이터베이스 비밀번호 변경 및 URL 인코딩
3. ✅ CORS 설정 (개발 환경)
4. ✅ API URL 설정 (개발 환경)
5. ✅ .gitignore 및 보안 체크
6. ✅ 서버 재시작 및 테스트

---

## 🎯 7단계 목표

### 프로덕션 환경 설정
- [ ] 환경 변수 프로덕션 모드 전환
- [ ] CORS 도메인 설정
- [ ] API URL 프로덕션 설정
- [ ] 최종 보안 체크
- [ ] 배포 체크리스트 완료

---

## 📝 프로덕션 배포 체크리스트

### 1. 백엔드 환경 변수 설정

#### backend/.env 파일 확인

**현재 상태 (개발):**
```env
ENVIRONMENT=development
```

**프로덕션 변경 필요:**
```env
# Environment (development, production)
ENVIRONMENT=production

# CORS 허용 도메인 (쉼표로 구분)
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

⚠️ **주의**: 실제 도메인으로 변경해야 합니다!

---

### 2. CORS 설정 확인

**backend/main.py** - 이미 설정되어 있음 ✅

```python
if ENVIRONMENT == "production":
    allowed_origins_str = os.getenv("ALLOWED_ORIGINS", "")
    if allowed_origins_str:
        allowed_origins = [origin.strip() for origin in allowed_origins_str.split(",")]
    else:
        allowed_origins = [
            "https://yourdomain.com",
            "https://app.yourdomain.com",
        ]
```

**작업 필요:**
- [ ] 실제 도메인 확보
- [ ] backend/.env에 ALLOWED_ORIGINS 추가

---

### 3. 프론트엔드 API URL 설정

**frontend/config/api.js** - 이미 설정되어 있음 ✅

```javascript
const getApiUrl = () => {
    if (process.env.NODE_ENV === 'production') {
        return 'https://api.yourdomain.com';  // 실제 API 도메인
    }
    // 개발 환경...
};
```

**작업 필요:**
- [ ] 실제 API 도메인 확보
- [ ] 프로덕션 빌드 시 적용

---

### 4. 데이터베이스 설정

#### 프로덕션 데이터베이스

**현재 (로컬):**
```env
DATABASE_URL=postgresql://twieo_user:6%40H%5ELA854Jb%26wtMR5ryD0KLk@localhost:5432/twieo_db
```

**프로덕션 변경 필요:**
```env
DATABASE_URL=postgresql://username:password@production-host:5432/production_db
```

**작업 필요:**
- [ ] 프로덕션 데이터베이스 생성
- [ ] 사용자 및 권한 설정
- [ ] 백업 설정
- [ ] SSL 연결 설정 (권장)

---

### 5. 보안 최종 점검

#### 실행:
```powershell
python security_check.py
```

**예상 결과:**
```
🎉 모든 보안 체크 통과!
✅ 배포 준비 완료
```

#### 확인 사항:
- [ ] .env 파일이 Git에 없음
- [ ] SECRET_KEY가 강력함 (32자 이상)
- [ ] 데이터베이스 비밀번호가 강력함
- [ ] API 키가 유효함

---

### 6. 서버 배포 옵션

#### 옵션 A: 클라우드 플랫폼

**AWS (Amazon Web Services)**
- EC2: 가상 서버
- RDS: 관리형 PostgreSQL
- Elastic Beanstalk: 자동 배포

**Azure**
- App Service: 웹 앱 호스팅
- Azure Database for PostgreSQL
- Container Instances

**Google Cloud Platform**
- Compute Engine: VM
- Cloud SQL: PostgreSQL
- App Engine: 관리형 플랫폼

**Heroku (간단한 배포)**
- 무료 티어 제공
- PostgreSQL 애드온
- 자동 배포

#### 옵션 B: VPS (Virtual Private Server)

**DigitalOcean, Linode, Vultr**
- 저렴한 가격
- 완전한 제어
- 수동 설정 필요

---

### 7. 도메인 및 SSL 설정

#### 도메인 구매
- Namecheap
- GoDaddy
- Google Domains
- Cloudflare

#### SSL 인증서
**무료 옵션:**
- Let's Encrypt (권장)
- Cloudflare SSL

**설정 예시 (Let's Encrypt):**
```bash
# Certbot 설치
sudo apt-get install certbot python3-certbot-nginx

# 인증서 발급
sudo certbot --nginx -d api.yourdomain.com

# 자동 갱신 설정
sudo certbot renew --dry-run
```

---

### 8. 프론트엔드 빌드 및 배포

#### React Native 앱 빌드

**Android:**
```bash
cd frontend
npx react-native build-android --mode=release
```

**iOS:**
```bash
cd frontend
npx react-native build-ios --mode=release
```

#### 앱 스토어 배포
- [ ] Google Play Console 계정
- [ ] Apple Developer 계정
- [ ] 앱 아이콘 및 스크린샷 준비
- [ ] 개인정보 처리방침 작성
- [ ] 앱 설명 작성

---

### 9. 모니터링 설정

#### 로그 관리
```python
# backend/main.py에 추가
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('app.log'),
        logging.StreamHandler()
    ]
)
```

#### 에러 추적
- Sentry (권장)
- Rollbar
- Bugsnag

#### 성능 모니터링
- New Relic
- Datadog
- Prometheus + Grafana

---

### 10. 백업 전략

#### 데이터베이스 백업

**자동 백업 스크립트:**
```bash
#!/bin/bash
# backup_db.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups"
DB_NAME="twieo_db"
DB_USER="twieo_user"

pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

**Cron 설정 (매일 새벽 2시):**
```bash
0 2 * * * /path/to/backup_db.sh
```

#### 파일 백업
- 업로드된 파일 (avatars)
- 로그 파일
- 설정 파일

---

## 🚀 배포 단계별 가이드

### 단계 1: 로컬 테스트
```bash
# 프로덕션 모드로 로컬 테스트
cd backend
# .env에서 ENVIRONMENT=production 설정
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 단계 2: 서버 준비
```bash
# 서버 접속
ssh user@your-server-ip

# 필요한 패키지 설치
sudo apt-get update
sudo apt-get install python3 python3-pip postgresql nginx
```

### 단계 3: 코드 배포
```bash
# Git으로 코드 가져오기
git clone https://github.com/yourusername/your-repo.git
cd your-repo/backend

# 가상환경 생성
python3 -m venv venv
source venv/bin/activate

# 의존성 설치
pip install -r requirements.txt
```

### 단계 4: 환경 변수 설정
```bash
# .env 파일 생성
nano .env

# 프로덕션 설정 입력
# (로컬 .env를 참고하되, 프로덕션 값으로 변경)
```

### 단계 5: 데이터베이스 설정
```bash
# PostgreSQL 접속
sudo -u postgres psql

# 데이터베이스 및 사용자 생성
CREATE DATABASE twieo_db;
CREATE USER twieo_user WITH PASSWORD 'strong-password';
GRANT ALL PRIVILEGES ON DATABASE twieo_db TO twieo_user;
\q

# 테이블 생성
python -c "from database import engine; import models; models.Base.metadata.create_all(bind=engine)"

# 업적 초기화
python init_achievements.py
```

### 단계 6: Nginx 설정
```nginx
# /etc/nginx/sites-available/twieo
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

```bash
# 설정 활성화
sudo ln -s /etc/nginx/sites-available/twieo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 단계 7: Systemd 서비스 설정
```ini
# /etc/systemd/system/twieo.service
[Unit]
Description=Twieo API Server
After=network.target

[Service]
User=your-user
WorkingDirectory=/path/to/your-repo/backend
Environment="PATH=/path/to/your-repo/backend/venv/bin"
ExecStart=/path/to/your-repo/backend/venv/bin/uvicorn main:app --host 0.0.0.0 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

```bash
# 서비스 시작
sudo systemctl daemon-reload
sudo systemctl start twieo
sudo systemctl enable twieo
sudo systemctl status twieo
```

### 단계 8: SSL 설정
```bash
# Let's Encrypt 인증서 발급
sudo certbot --nginx -d api.yourdomain.com

# 자동 갱신 확인
sudo certbot renew --dry-run
```

### 단계 9: 방화벽 설정
```bash
# UFW 설정
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

### 단계 10: 최종 테스트
```bash
# API 테스트
curl https://api.yourdomain.com/

# 로그 확인
sudo journalctl -u twieo -f
```

---

## 📊 배포 후 체크리스트

### 즉시 확인
- [ ] API 엔드포인트 응답 확인
- [ ] 데이터베이스 연결 확인
- [ ] 로그 정상 작동 확인
- [ ] SSL 인증서 작동 확인

### 24시간 내 확인
- [ ] 에러 로그 검토
- [ ] 성능 모니터링
- [ ] 백업 작동 확인
- [ ] 사용자 피드백 수집

### 1주일 내 확인
- [ ] 서버 리소스 사용량
- [ ] 데이터베이스 성능
- [ ] API 응답 시간
- [ ] 에러율 분석

---

## 🆘 문제 해결

### 서버가 시작되지 않음
```bash
# 로그 확인
sudo journalctl -u twieo -n 50

# 수동 실행으로 오류 확인
cd /path/to/backend
source venv/bin/activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

### 데이터베이스 연결 실패
```bash
# PostgreSQL 상태 확인
sudo systemctl status postgresql

# 연결 테스트
psql -U twieo_user -d twieo_db -h localhost
```

### Nginx 오류
```bash
# 설정 테스트
sudo nginx -t

# 로그 확인
sudo tail -f /var/log/nginx/error.log
```

---

## 📚 추가 리소스

### 문서
- FastAPI 배포: https://fastapi.tiangolo.com/deployment/
- Nginx 설정: https://nginx.org/en/docs/
- Let's Encrypt: https://letsencrypt.org/getting-started/

### 도구
- PM2 (Node.js 프로세스 관리)
- Docker (컨테이너화)
- Kubernetes (오케스트레이션)

---

## ✅ 7단계 완료 조건

배포가 완료되면 다음을 확인하세요:

- [ ] 프로덕션 환경 변수 설정 완료
- [ ] CORS 도메인 설정 완료
- [ ] SSL 인증서 설치 완료
- [ ] 서버 정상 작동 확인
- [ ] 모니터링 설정 완료
- [ ] 백업 설정 완료
- [ ] 최종 보안 체크 통과

---

## 🎉 축하합니다!

모든 단계를 완료하셨습니다! 이제 안전하게 배포할 준비가 되었습니다.

**현재 진행률**: 7/7 단계 완료 (100%) 🎊

---

## 📞 다음 단계

1. **도메인 구매** - 실제 서비스 도메인 확보
2. **서버 선택** - 클라우드 플랫폼 또는 VPS 선택
3. **배포 실행** - 위의 가이드 따라 배포
4. **모니터링 시작** - 서비스 안정성 확인
5. **사용자 피드백** - 실제 사용자 테스트

**성공적인 배포를 기원합니다!** 🚀
