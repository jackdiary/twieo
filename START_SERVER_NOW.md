# 🚀 서버 즉시 시작 가이드

## 현재 상황
- ✅ SSH 접속 가능
- ❌ API 서버 (포트 8000) 실행 안 됨

---

## 📋 즉시 실행할 명령어 (복사해서 붙여넣기)

### 1단계: 서버 접속
```bash
ssh root@110.165.18.249
```

### 2단계: 백엔드 디렉토리로 이동
```bash
cd /root/twieo/backend
```

### 3단계: 기존 프로세스 정리 (있다면)
```bash
sudo pkill -f uvicorn
```

### 4단계: 가상환경 활성화
```bash
source venv/bin/activate
```

### 5단계: 서버 수동 시작 (테스트)
```bash
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

**예상 출력:**
```
INFO:     Started server process [12345]
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
```

### 6단계: 브라우저에서 테스트
새 브라우저 탭에서 접속:
```
http://110.165.18.249:8000/
http://110.165.18.249:8000/docs
```

**접속이 되면 성공!** ✅

---

## 🔧 자동 시작 설정 (Systemd)

수동 실행이 성공했다면, Ctrl+C로 종료하고 자동 시작 설정:

### 1. 서비스 파일 생성
```bash
sudo nano /etc/systemd/system/twieo.service
```

### 2. 다음 내용 복사해서 붙여넣기
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

### 3. 저장 및 종료
- `Ctrl + X`
- `Y` (Yes)
- `Enter`

### 4. 서비스 활성화 및 시작
```bash
sudo systemctl daemon-reload
sudo systemctl enable twieo
sudo systemctl start twieo
```

### 5. 서비스 상태 확인
```bash
sudo systemctl status twieo
```

**예상 출력:**
```
● twieo.service - Twieo API Server
   Loaded: loaded (/etc/systemd/system/twieo.service; enabled)
   Active: active (running) since ...
```

---

## 🐛 오류 발생 시

### 오류 1: ModuleNotFoundError
```bash
cd /root/twieo/backend
source venv/bin/activate
pip install -r requirements.txt
```

### 오류 2: 데이터베이스 연결 실패
```bash
sudo systemctl start postgresql
sudo systemctl status postgresql
```

### 오류 3: 포트 이미 사용 중
```bash
sudo netstat -tlnp | grep 8000
sudo kill -9 <PID>
```

---

## ✅ 성공 확인

다음 명령어들이 모두 성공하면 완료:

```bash
# 1. 서비스 상태
sudo systemctl status twieo
# → Active: active (running)

# 2. 포트 확인
netstat -tlnp | grep 8000
# → 0.0.0.0:8000 LISTEN

# 3. 로컬 테스트
curl http://localhost:8000/
# → 응답 받음

# 4. 로그 확인
sudo journalctl -u twieo -n 20
```

---

## 📱 앱에서 테스트

서버가 실행되면 Expo 앱에서:

1. 앱 재시작
2. 로그인 시도
3. API 연결 확인

---

## 💡 팁

### 실시간 로그 보기
```bash
sudo journalctl -u twieo -f
```

### 서비스 재시작
```bash
sudo systemctl restart twieo
```

### 서비스 중지
```bash
sudo systemctl stop twieo
```

---

## 🎯 한 번에 실행 (전체 명령어)

```bash
ssh root@110.165.18.249 << 'EOF'
cd /root/twieo/backend
sudo pkill -f uvicorn
source venv/bin/activate
nohup python -m uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/twieo.log 2>&1 &
echo "서버 시작됨. 로그: tail -f /tmp/twieo.log"
EOF
```

이 명령어는 서버를 백그라운드에서 실행합니다.
