# 🚨 서버 연결 안 됨 - 즉시 해결 가이드

## 문제 상황
- **오류**: ERR_CONNECTION_TIMED_OUT
- **의미**: 서버가 응답하지 않음 (서버 중지 또는 방화벽 차단)

---

## 🔧 즉시 실행할 명령어

### 1단계: 서버 접속
```bash
ssh root@110.165.18.249
```

### 2단계: 서버 상태 확인
```bash
# 현재 실행 중인 Python 프로세스 확인
ps aux | grep python

# 포트 8000 사용 확인
netstat -tlnp | grep 8000

# Systemd 서비스 상태 확인
systemctl status twieo
```

---

## 🎯 시나리오별 해결 방법

### 시나리오 A: 서비스가 설정되지 않음
**증상**: `systemctl status twieo` 실행 시 "Unit twieo.service could not be found"

**해결:**
```bash
# 1. 서비스 파일 생성
sudo nano /etc/systemd/system/twieo.service
```

**다음 내용 입력:**
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

**저장 후 (Ctrl+X, Y, Enter):**
```bash
# 2. 서비스 활성화
sudo systemctl daemon-reload
sudo systemctl enable twieo
sudo systemctl start twieo

# 3. 상태 확인
sudo systemctl status twieo
```

---

### 시나리오 B: 서비스가 실패함 (failed)
**증상**: `systemctl status twieo` 실행 시 "Active: failed"

**해결:**
```bash
# 1. 로그 확인
sudo journalctl -u twieo -n 50

# 2. 수동 실행으로 오류 확인
cd /root/twieo/backend
source venv/bin/activate
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

**일반적인 오류:**

#### 오류 1: 모듈을 찾을 수 없음
```
ModuleNotFoundError: No module named 'fastapi'
```
**해결:**
```bash
cd /root/twieo/backend
source venv/bin/activate
pip install -r requirements.txt
```

#### 오류 2: 데이터베이스 연결 실패
```
could not connect to server
```
**해결:**
```bash
# PostgreSQL 시작
sudo systemctl start postgresql
sudo systemctl status postgresql

# 데이터베이스 테스트
cd /root/twieo/backend
source venv/bin/activate
python test_db.py
```

#### 오류 3: 포트가 이미 사용 중
```
error while attempting to bind on address ('0.0.0.0', 8000)
```
**해결:**
```bash
# 포트 사용 중인 프로세스 찾기
sudo netstat -tlnp | grep 8000

# 프로세스 종료 (PID를 위 명령어에서 확인)
sudo kill -9 <PID>

# 또는 모든 Python 프로세스 종료
sudo pkill -f uvicorn
```

---

### 시나리오 C: 방화벽 문제
**증상**: 서버는 실행 중이지만 외부에서 접속 안 됨

**해결:**

#### 1. 네이버 클라우드 ACG 설정
1. 네이버 클라우드 콘솔 접속
2. Server > ACG (Access Control Group) 설정
3. 다음 포트 허용:
   - **22** (SSH)
   - **80** (HTTP)
   - **8000** (API)
   - **443** (HTTPS)

#### 2. 서버 방화벽 (UFW) 설정
```bash
# UFW 상태 확인
sudo ufw status

# UFW가 활성화되어 있고 8000 포트가 막혀있다면
sudo ufw allow 8000/tcp

# 또는 UFW 비활성화 (테스트용)
sudo ufw disable
```

---

### 시나리오 D: 서버가 실행 중이지만 localhost에서만 접근 가능
**증상**: 서버에서 `curl http://localhost:8000`은 되지만 외부에서 안 됨

**해결:**
```bash
# uvicorn이 0.0.0.0으로 바인딩되었는지 확인
netstat -tlnp | grep 8000

# 출력 예시:
# tcp  0  0 0.0.0.0:8000  0.0.0.0:*  LISTEN  12345/python
#           ^^^^^^^^^ 이 부분이 0.0.0.0이어야 함

# 127.0.0.1:8000으로 되어있다면 서비스 재시작
sudo systemctl restart twieo
```

---

## ✅ 빠른 해결 체크리스트

서버에 접속해서 다음 명령어들을 순서대로 실행:

```bash
# 1. 서버 접속
ssh root@110.165.18.249

# 2. 백엔드 디렉토리로 이동
cd /root/twieo/backend

# 3. 기존 프로세스 종료
sudo pkill -f uvicorn

# 4. 가상환경 활성화
source venv/bin/activate

# 5. 의존성 확인
pip install -r requirements.txt

# 6. 데이터베이스 확인
sudo systemctl start postgresql
python test_db.py

# 7. 수동으로 서버 시작 (테스트)
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```

**이 상태에서 브라우저로 접속 테스트:**
- http://110.165.18.249:8000/

**접속이 되면 Ctrl+C로 종료하고 서비스로 실행:**
```bash
# 서비스 설정 (위의 시나리오 A 참조)
sudo systemctl start twieo
sudo systemctl status twieo
```

---

## 🧪 테스트 명령어

### 서버 내부에서 테스트
```bash
curl http://localhost:8000/
curl http://127.0.0.1:8000/
```

### 로컬 컴퓨터에서 테스트
```bash
curl http://110.165.18.249:8000/
```

### 브라우저에서 테스트
```
http://110.165.18.249:8000/
http://110.165.18.249:8000/docs
```

---

## 📞 여전히 안 되면?

1. **서버 로그 확인**
   ```bash
   sudo journalctl -u twieo -n 100
   ```

2. **수동 실행 상태에서 오류 메시지 확인**
   ```bash
   cd /root/twieo/backend
   source venv/bin/activate
   python -m uvicorn main:app --host 0.0.0.0 --port 8000
   ```

3. **네이버 클라우드 콘솔에서 ACG 설정 재확인**

4. **서버 재부팅** (최후의 수단)
   ```bash
   sudo reboot
   ```

---

## 💡 성공 확인

다음이 모두 되면 성공:
- ✅ `systemctl status twieo` → Active: active (running)
- ✅ `netstat -tlnp | grep 8000` → 0.0.0.0:8000 LISTEN
- ✅ `curl http://localhost:8000/` → 응답 받음
- ✅ 브라우저에서 `http://110.165.18.249:8000/` → 접속됨
