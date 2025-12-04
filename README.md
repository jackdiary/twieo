# 뛰어 (Twieo) 🏃‍♂️

날씨 기반 러닝 코스 추천 및 실내 시설 안내 앱

## 주요 기능

### 러닝 기능
-  **실시간 GPS 추적**: 정확한 거리, 시간, 페이스 측정
-  **러닝 코스 생성**: GPS 기반 맞춤형 러닝 코스 추천
-  **일시정지/재개**: 러닝 중 자유로운 컨트롤
-  **자동 저장**: 러닝 종료 시 자동으로 기록 저장

### 날씨 & 시설
-  **실시간 날씨 연동**: 기상청 API를 통한 날씨 정보
-  **실내 시설 추천**: 악천후 시 주변 실내 체육시설 안내
-  **거리 기반 추천**: 현재 위치에서 가까운 시설 우선 표시

### 기록 & 통계
-  **러닝 기록 관리**: 거리, 시간, 페이스, 칼로리 등 상세 기록
-  **달력 기능**: 러닝 기록 캘린더 뷰
-  **주간/월간 통계**: 기간별 러닝 통계 분석
-  **새로고침**: Pull-to-refresh로 최신 데이터 업데이트

### 프로필 & 소셜
-  **사용자 프로필**: 레벨, 통계, 업적 시스템
-  **프로필 사진 업로드**: 사용자 프로필 이미지 업로드 및 저장
-  **친구 기능**: 친구 추가, 요청 관리, 메시지
-  **업적 시스템**: 다양한 러닝 업적 달성

### 설정 & 알림
-  **설정**: 계정, 개인정보, 앱 설정 관리
-  **알림 설정**: 러닝 알림, 목표 달성, 날씨 알림 등
-  **도움말**: FAQ, 문의하기, 법적 정보

### 인증
-  **회원가입/로그인**: JWT 기반 안전한 인증
-  **비밀번호 암호화**: bcrypt를 통한 안전한 비밀번호 저장
## 기술 스택

### Backend
- FastAPI (Python)
- PostgreSQL
- SQLAlchemy ORM
- JWT 인증
- 기상청 API

### Frontend
- React Native (Expo)
- React Navigation
- React Native Maps
- React Native Calendars
- Expo Image Picker
- Expo Linear Gradient

## 설치 및 실행

### 1. 백엔드 설정

```bash
cd backend
pip install -r requirements.txt

# .env 파일 생성 (DATABASE_SETUP.md 참고)
cp .env.example .env

# 서버 실행
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 2. 프론트엔드 설정

```bash
cd frontend
npm install

# Expo 실행
npx expo start
```

### 3. 데이터베이스 설정

자세한 내용은 `backend/DATABASE_SETUP.md` 참고

## API 문서

서버 실행 후 http://localhost:8000/docs 에서 확인

## 프로젝트 구조

```
run-pick/
├── backend/
│   ├── main.py              # FastAPI 메인
│   ├── models.py            # 데이터베이스 모델
│   ├── schemas.py           # Pydantic 스키마
│   ├── auth.py              # 인증 로직
│   ├── database.py          # DB 연결
│   ├── services/
│   │   ├── weather_service.py    # 날씨 API
│   │   ├── facility_service.py   # 시설 추천
│   │   └── route_generator.py    # 코스 생성
│   └── DATABASE_SETUP.md    # DB 설정 가이드
│
└── frontend/
    ├── App.js               # 메인 앱
    ├── screens/
    │   ├── LoginScreen.js          # 로그인
    │   ├── RegisterScreen.js       # 회원가입
    │   ├── HomeScreen.js           # 홈 (날씨, 통계)
    │   ├── RunScreen.js            # 러닝 (GPS 추적)
    │   ├── HistoryScreen.js        # 기록 (달력, 통계)
    │   ├── ProfileScreen.js        # 프로필
    │   ├── SettingsScreen.js       # 설정
    │   ├── NotificationsScreen.js  # 알림 설정
    │   ├── FriendsScreen.js        # 친구
    │   └── HelpScreen.js           # 도움말
    └── package.json
```

## 환경 변수

### Backend (.env)
```
DATABASE_URL=postgresql://user:password@localhost:5432/runpick_db
SECRET_KEY=your-secret-key
WEATHER_API_KEY=your-weather-api-key
```

### Frontend
API URL을 각 화면에서 설정:
```javascript
const API_URL = 'http://192.168.x.x:8000';
```

## 배포

### Backend
- Heroku, AWS, DigitalOcean 등
- PostgreSQL 데이터베이스 필요
- 환경 변수 설정 필수

### Frontend
- Expo EAS Build
- App Store / Google Play Store

## 구현 완료 기능

###  백엔드
- [x] 사용자 인증 (회원가입/로그인)
- [x] JWT 토큰 기반 인증
- [x] 프로필 관리 (조회/수정)
- [x] 프로필 사진 업로드 및 저장
- [x] 러닝 기록 저장/조회
- [x] 날씨 정보 API (기상청 연동)
- [x] 실내 시설 추천 API

###  프론트엔드
- [x] 로그인/회원가입 화면
- [x] 자동 로그인 (토큰 저장)
- [x] 홈 화면 (날씨, 통계, 실내 시설)
- [x] 러닝 화면 (GPS 추적, 실시간 통계)
- [x] 기록 화면 (달력, 통계, API 연동)
- [x] 프로필 화면 (사진 업로드, 통계, 로그아웃)
- [x] 설정 화면
- [x] 알림 설정 화면
- [x] 친구 화면
- [x] 도움말 화면
- [x] 글라스모피즘 UI 디자인
- [x] 에러 처리 (ErrorBoundary)
- [x] 스플래시 스크린
- [x] 로딩 상태 관리

## 사용 방법

### 1. 회원가입 및 로그인
1. 앱 실행 후 "회원가입" 선택
2. 이메일, 사용자명, 비밀번호 입력
3. 로그인하여 앱 사용 시작

### 2. 러닝 시작
1. 홈 화면에서 "빠른 러닝" 또는 러닝 탭 이동
2. GPS 권한 허용
3. 시작 버튼(▶) 눌러 러닝 시작
4. 일시정지(⏸) 또는 종료(⏹) 버튼으로 컨트롤
5. 종료 시 자동으로 기록 저장

### 3. 코스 생성
1. 러닝 화면에서 원하는 거리 선택 (1km, 3km, 5km, 10km)
2. "코스 생성" 버튼 클릭
3. 추천 코스 확인 및 선택

### 4. 기록 확인
1. 기록 탭에서 모든 러닝 기록 확인
2. 달력 아이콘으로 날짜별 기록 보기
3. 주간/월간/연간 통계 확인
4. 아래로 당겨서 새로고침

### 5. 프로필 관리
1. 프로필 탭에서 프로필 사진 터치
2. 갤러리에서 사진 선택
3. 자동으로 업로드 및 저장
4. 통계 및 업적 확인





###  빠른 시작

#### 개발 환경
```bash
# 1. 백엔드 서버 시작
cd backend
.\venv\Scripts\activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000

# 2. 서버 테스트 (새 터미널)
python quick_test.py

# 3. 프론트엔드 실행
cd frontend
npx expo start
```

#### 프로덕션 배포
자세한 내용은 `STEP7_PRODUCTION_DEPLOYMENT.md` 참조

### 🔒 보안 상태
- ✅ SECRET_KEY: 강력한 키로 변경
- ✅ 데이터베이스: 강력한 비밀번호 + URL 인코딩
- ✅ .env 파일: Git에서 안전하게 제외
- ✅ CORS: 개발/프로덕션 환경 분리
- ✅ 보안 체크: 자동 검사 스크립트 (`security_check.py`)

### 📊 테스트 결과
- 서버: 정상 작동 ✅
- 데이터베이스: 연결 성공 ✅
- API: 핵심 기능 작동 ✅
- 인증: 회원가입/로그인 작동 ✅

## 다음 단계

### 로컬 개발
1. 서버 시작 및 테스트
2. 앱 개발 및 기능 추가
3. 정기적인 보안 체크

### 프로덕션 배포
1. 도메인 구매
2. 서버 선택 (AWS/Azure/GCP/Heroku)
3. 환경 변수 프로덕션 설정
4. SSL 인증서 설치
5. 모니터링 및 백업 설정



## 라이선스

MIT
