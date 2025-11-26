# CORS 오류 해결 완료

## 문제
```
Access to fetch at 'http://localhost:8000/api/auth/register' from origin 'http://localhost:8081' 
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 원인
- 프론트엔드 (http://localhost:8081)에서 백엔드 (http://localhost:8000)로 요청
- CORS 정책으로 인해 다른 origin 간 요청 차단

## 해결 방법
`backend/main.py`의 CORS 설정을 업데이트했습니다:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:8081",  # Expo web
        "http://localhost:19006",  # Expo web alternative
        "http://192.168.*.*:8081",  # 로컬 네트워크
        "http://192.168.*.*:19006",  # 로컬 네트워크 alternative
        "*"  # 모든 origin 허용 (개발용)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
)
```

## 백엔드 서버 재시작 필요

### 1. 현재 서버 종료
- 실행 중인 터미널에서 `Ctrl+C`

### 2. 서버 재시작
```bash
cd backend
.\venv\Scripts\activate
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 3. 테스트
- 프론트엔드에서 회원가입/로그인 시도
- CORS 오류가 사라져야 함

## 프로덕션 환경
프로덕션에서는 `allow_origins=["*"]` 대신 실제 도메인만 허용:
```python
allow_origins=[
    "https://yourdomain.com",
    "https://www.yourdomain.com",
]
```
