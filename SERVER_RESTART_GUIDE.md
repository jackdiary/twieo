# 서버 재시작 및 테스트 가이드

## ✅ 6단계: 서버 재시작 및 기능 테스트

### 📋 개요

배포 전 서버를 재시작하고 모든 주요 기능이 정상 작동하는지 확인합니다.

---

## 🚀 서버 시작 방법

### 1. 백엔드 서버 시작

```powershell
# 1. 백엔드 디렉토리로 이동
cd backend

# 2. 가상환경 활성화
.\venv\Scripts\activate

# 3. 서버 시작
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

**예상 출력:**
```
INFO:     Will watch for changes in these directories: ['C:\\...\\backend']
INFO:     Uvicorn running on http://0.0.0.0:8000 (Press CTRL+C to quit)
INFO:     Started reloader process [xxxxx] using StatReload
✅ Loaded 42484 facilities from CSV (encoding: utf-8)
```

### 2. 서버 상태 확인

새 터미널을 열고:

```powershell
# 간단한 연결 테스트
python simple_test.py
```

또는 브라우저에서:
```
http://localhost:8000/
```

---

## 🧪 자동 테스트 실행

서버가 실행 중인 상태에서 **새 터미널**을 열고:

```powershell
# 전체 API 테스트
python test_api_endpoints.py
```

### 테스트 항목

1. **서버 상태 확인**
   - Root 엔드포인트 (`/`)
   
2. **인증 시스템**
   - 회원가입 (`/api/auth/register`)
   - 로그인 (`/api/auth/login`)
   
3. **사용자 프로필**
   - 프로필 조회 (`/api/profile`)
   - 프로필 수정 (`/api/profile`)
   
4. **날씨 API**
   - 날씨 정보 조회 (`/api/weather`)
   
5. **시설 정보**
   - 근처 시설 조회 (`/api/facilities/indoor`)
   
6. **러닝 기록**
   - 기록 생성 (`/api/runs`)
   - 기록 조회 (`/api/runs`)
   
7. **목표 관리**
   - 목표 생성 (`/api/goals`)
   - 목표 조회 (`/api/goals`)
   
8. **업적 시스템**
   - 업적 조회 (`/api/achievements`)
   - 사용자 업적 조회 (`/api/achievements/user`)
   
9. **챌린지 시스템**
   - 활성 챌린지 조회 (`/api/challenges/active`)
   
10. **친구 시스템**
    - 친구 목록 조회 (`/api/friends`)

---

## 🔍 수동 테스트 방법

### 1. API 문서 확인

브라우저에서 Swagger UI 접속:
```
http://localhost:8000/docs
```

### 2. 주요 엔드포인트 테스트

#### 회원가입
```powershell
curl -X POST "http://localhost:8000/api/auth/register" `
  -H "Content-Type: application/json" `
  -d '{
    "username": "testuser",
    "email": "test@example.com",
    "password": "TestPassword123!",
    "full_name": "테스트 사용자"
  }'
```

#### 로그인
```powershell
curl -X POST "http://localhost:8000/api/auth/login" `
  -H "Content-Type: application/x-www-form-urlencoded" `
  -d "username=test@example.com&password=TestPassword123!"
```

#### 날씨 조회
```powershell
curl "http://localhost:8000/api/weather?lat=37.5665&lon=126.9780"
```

#### 시설 조회
```powershell
curl "http://localhost:8000/api/facilities/indoor?lat=37.5665&lon=126.9780"
```

---

## 🐛 문제 해결

### 서버가 시작되지 않는 경우

#### 1. 포트가 이미 사용 중
```powershell
# 포트 8000을 사용하는 프로세스 확인
netstat -ano | Select-String ":8000"

# 프로세스 종료 (PID 확인 후)
Stop-Process -Id <PID> -Force
```

#### 2. 데이터베이스 연결 오류
```powershell
# .env 파일 확인
cat backend\.env

# 데이터베이스 연결 테스트
cd backend
python test_db.py
```

**예상 출력:**
```
✅ 데이터베이스 연결 성공!
📊 데이터베이스 정보:
   - 버전: PostgreSQL 17.2
   - 데이터베이스: twieo_db
   - 사용자: twieo_user
```

#### 3. 모듈 누락
```powershell
cd backend
.\venv\Scripts\activate
pip install -r requirements.txt
```

#### 4. 가상환경 문제
```powershell
# 가상환경 재생성
cd backend
Remove-Item -Recurse -Force venv
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
```

### 테스트 실패 시

#### 1. 서버 로그 확인
서버 터미널에서 오류 메시지 확인

#### 2. 데이터베이스 상태 확인
```powershell
cd backend
python test_db.py
```

#### 3. 환경 변수 확인
```powershell
# .env 파일 내용 확인
cat backend\.env

# 필수 변수:
# - DATABASE_URL
# - SECRET_KEY
# - WEATHER_API_KEY
```

---

## ✅ 테스트 체크리스트

### 필수 테스트

- [ ] 서버가 정상적으로 시작됨
- [ ] Root 엔드포인트 (`/`) 응답 확인
- [ ] API 문서 (`/docs`) 접근 가능
- [ ] 회원가입 기능 작동
- [ ] 로그인 기능 작동
- [ ] 날씨 API 응답 확인
- [ ] 시설 조회 기능 작동

### 선택 테스트

- [ ] 프로필 조회/수정
- [ ] 러닝 기록 생성/조회
- [ ] 목표 생성/조회
- [ ] 업적 시스템
- [ ] 챌린지 시스템
- [ ] 친구 시스템

---

## 📊 성능 확인

### 1. 응답 시간 측정

```powershell
# 간단한 성능 테스트
Measure-Command {
    Invoke-WebRequest -Uri "http://localhost:8000/" -UseBasicParsing
}
```

**목표:** 100ms 이하

### 2. 동시 요청 테스트

```powershell
# 10개의 동시 요청
1..10 | ForEach-Object -Parallel {
    Invoke-WebRequest -Uri "http://localhost:8000/" -UseBasicParsing
}
```

### 3. 메모리 사용량 확인

```powershell
Get-Process | Where-Object {$_.ProcessName -like "*python*"} | 
    Select-Object ProcessName, @{Name="Memory(MB)";Expression={[math]::Round($_.WS/1MB,2)}}
```

---

## 🔄 서버 재시작 절차

### 정상 종료

1. 서버 터미널에서 `Ctrl+C` 입력
2. 프로세스가 완전히 종료될 때까지 대기
3. 위의 "서버 시작 방법" 참조하여 재시작

### 강제 종료 (필요시)

```powershell
# Python 프로세스 모두 종료
Get-Process | Where-Object {$_.ProcessName -like "*python*"} | Stop-Process -Force

# 포트 확인
netstat -ano | Select-String ":8000"
```

---

## 📝 로그 확인

### 서버 로그

서버 터미널에서 실시간으로 확인:
- `INFO`: 정상 작동
- `WARNING`: 주의 필요
- `ERROR`: 오류 발생

### 주요 로그 메시지

**정상:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
✅ Loaded 42484 facilities from CSV
🌐 CORS allowed origins (development): [...]
```

**오류:**
```
ERROR:    [Errno 10048] error while attempting to bind on address
ERROR:    Could not connect to database
ERROR:    Module not found
```

---

## 🚀 프로덕션 배포 전 최종 확인

### 1. 환경 변수 설정

```powershell
# backend/.env 확인
cat backend\.env
```

**필수 확인 사항:**
- [ ] `DATABASE_URL` - 프로덕션 데이터베이스 URL
- [ ] `SECRET_KEY` - 강력한 비밀 키 (최소 32자)
- [ ] `WEATHER_API_KEY` - 유효한 API 키
- [ ] `ENVIRONMENT=production`
- [ ] `ALLOWED_ORIGINS` - 실제 도메인

### 2. 보안 체크

```powershell
python security_check.py
```

**예상 출력:**
```
🎉 모든 보안 체크 통과!
✅ 배포 준비 완료
```

### 3. 데이터베이스 마이그레이션

```powershell
cd backend
python -c "from database import engine; import models; models.Base.metadata.create_all(bind=engine)"
```

### 4. 업적 초기화

```powershell
cd backend
python init_achievements.py
```

---

## 📚 관련 문서

- `DEPLOYMENT_GUIDE.md` - 전체 배포 가이드
- `API_URL_CONFIGURATION_GUIDE.md` - API URL 설정
- `CORS_CONFIGURATION_GUIDE.md` - CORS 설정
- `SECURITY_CHECKLIST.md` - 보안 체크리스트
- `DATABASE_SETUP.md` - 데이터베이스 설정

---

## 🎯 다음 단계

서버 테스트가 완료되면:

**7단계: 최종 배포 준비**
- 프로덕션 환경 변수 설정
- 도메인 및 SSL 인증서 설정
- 서버 배포 (AWS, Azure, GCP 등)
- 모니터링 설정

---

## 💡 팁

### 개발 중 자동 재시작

`--reload` 옵션을 사용하면 코드 변경 시 자동으로 재시작됩니다:
```powershell
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 다른 포트 사용

```powershell
# 포트 8080 사용
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8080
```

### 로그 레벨 조정

```powershell
# 디버그 모드
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 --log-level debug

# 경고만 표시
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000 --log-level warning
```

---

## ✅ 완료 확인

**현재 상태:**
- ✅ 서버 재시작 가이드 작성
- ✅ 테스트 스크립트 준비
- ✅ 문제 해결 가이드 작성

**다음 단계:** 7단계 - 최종 배포 준비

**현재 진행률:** 6/7 단계 완료 (86%) 🎉

---

이제 서버를 수동으로 시작하고 테스트를 진행해주세요! 🚀
