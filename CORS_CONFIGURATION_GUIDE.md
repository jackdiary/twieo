# CORS 설정 가이드

## ✅ 3단계 완료: CORS 도메인 설정

### 완료된 작업
- [x] 환경별 CORS 설정 구현
- [x] .env 파일에 ENVIRONMENT 변수 추가
- [x] 프로덕션 환경 변수 템플릿 생성
- [x] 동적 CORS 도메인 설정

---

## 📋 현재 설정

### 개발 환경 (ENVIRONMENT=development)
```
허용 도메인:
- http://localhost:8081
- http://localhost:19006
- http://192.168.219.42:8081
- http://192.168.219.42:19006
- * (모든 도메인)
```

### 프로덕션 환경 (ENVIRONMENT=production)
```
환경 변수 ALLOWED_ORIGINS에서 도메인 가져옴
예: ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com
```

---

## 🔧 프로덕션 배포 시 설정

### 1. .env 파일 수정

```env
# Environment를 production으로 변경
ENVIRONMENT=production

# 허용할 도메인 추가 (쉼표로 구분)
ALLOWED_ORIGINS=https://twieo.com,https://app.twieo.com,https://www.twieo.com
```

### 2. 도메인 형식

**올바른 형식**:
```
✅ https://yourdomain.com
✅ https://app.yourdomain.com
✅ https://www.yourdomain.com
```

**잘못된 형식**:
```
❌ yourdomain.com (프로토콜 없음)
❌ https://yourdomain.com/ (끝에 슬래시)
❌ https://yourdomain.com:443 (포트 번호)
```

### 3. 여러 도메인 설정

```env
# 메인 도메인, 앱 도메인, www 도메인
ALLOWED_ORIGINS=https://twieo.com,https://app.twieo.com,https://www.twieo.com

# 개발/스테이징 환경 포함
ALLOWED_ORIGINS=https://twieo.com,https://staging.twieo.com,https://dev.twieo.com
```

---

## 🧪 테스트 방법

### 1. 개발 환경 테스트

```bash
# 서버 시작
cd backend
venv\Scripts\activate
uvicorn main:app --reload

# 로그 확인
# 출력: 🌐 CORS allowed origins (development): ['http://localhost:8081', ...]
```

### 2. 프로덕션 환경 시뮬레이션

```bash
# .env 파일 임시 수정
ENVIRONMENT=production
ALLOWED_ORIGINS=https://test.com,https://app.test.com

# 서버 재시작
uvicorn main:app --reload

# 로그 확인
# 출력: 🌐 CORS allowed origins (production): ['https://test.com', 'https://app.test.com']
```

### 3. CORS 테스트 요청

```bash
# 허용된 도메인에서 요청 (성공)
curl -H "Origin: https://test.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:8000/api/auth/login

# 허용되지 않은 도메인에서 요청 (실패)
curl -H "Origin: https://evil.com" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:8000/api/auth/login
```

---

## 🔒 보안 권장사항

### 1. 프로덕션에서 절대 하지 말아야 할 것

```python
# ❌ 절대 금지!
allow_origins=["*"]  # 모든 도메인 허용
```

### 2. 서브도메인 와일드카드 (주의)

FastAPI/Starlette는 와일드카드를 지원하지 않습니다:
```python
# ❌ 작동하지 않음
allow_origins=["https://*.yourdomain.com"]
```

대신 각 서브도메인을 명시:
```python
# ✅ 올바른 방법
allow_origins=[
    "https://app.yourdomain.com",
    "https://api.yourdomain.com",
    "https://admin.yourdomain.com"
]
```

### 3. HTTP vs HTTPS

프로덕션에서는 반드시 HTTPS 사용:
```env
# ✅ 프로덕션
ALLOWED_ORIGINS=https://yourdomain.com

# ❌ 프로덕션에서 HTTP 사용 금지
ALLOWED_ORIGINS=http://yourdomain.com
```

---

## 🚨 문제 해결

### 에러: "CORS policy: No 'Access-Control-Allow-Origin' header"

**원인**: 요청 도메인이 허용 목록에 없음

**해결**:
1. 브라우저 개발자 도구에서 요청 Origin 확인
2. .env 파일의 ALLOWED_ORIGINS에 해당 도메인 추가
3. 서버 재시작

### 에러: "CORS policy: The value of the 'Access-Control-Allow-Credentials' header"

**원인**: credentials 설정 불일치

**해결**:
```python
# main.py에서 확인
allow_credentials=True  # 이미 설정됨
```

프론트엔드에서도 설정:
```javascript
fetch(url, {
    credentials: 'include',  // 쿠키 포함
    ...
})
```

### 서버 로그에 경고 표시

```
⚠️  WARNING: Using default CORS origins. Set ALLOWED_ORIGINS environment variable!
```

**해결**: .env 파일에 ALLOWED_ORIGINS 추가

---

## 📝 체크리스트

### 개발 환경
- [x] ENVIRONMENT=development 설정
- [x] 로컬 도메인 허용 확인
- [x] 서버 로그 확인

### 프로덕션 준비
- [ ] ENVIRONMENT=production 설정
- [ ] ALLOWED_ORIGINS에 실제 도메인 추가
- [ ] HTTPS 도메인만 사용
- [ ] 서버 재시작 및 테스트

### 배포 후
- [ ] CORS 에러 없는지 확인
- [ ] 브라우저 콘솔 에러 확인
- [ ] 모든 API 엔드포인트 테스트

---

## 📚 추가 참고사항

### FastAPI CORS 문서
https://fastapi.tiangolo.com/tutorial/cors/

### CORS 이해하기
- Origin: 프로토콜 + 도메인 + 포트
- Preflight: OPTIONS 요청으로 사전 확인
- Credentials: 쿠키/인증 정보 포함 여부

### 환경별 설정 파일

```bash
# 개발
.env

# 스테이징
.env.staging

# 프로덕션
.env.production
```

---

## ✅ 완료 확인

**현재 상태**:
- ✅ 개발 환경: 모든 도메인 허용
- ✅ 프로덕션 환경: 환경 변수로 제어 가능
- ✅ 로그로 현재 설정 확인 가능

**다음 단계**: 4단계 - API URL 변경

**현재 진행률**: 3/7 단계 완료 (43%) 🎉
