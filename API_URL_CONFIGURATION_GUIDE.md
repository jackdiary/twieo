# API URL 설정 가이드

## ✅ 4단계 완료: API URL 설정

### 완료된 작업
- [x] 환경별 API URL 설정 구현
- [x] app.json에 environment 추가
- [x] 프로덕션용 app.json 템플릿 생성
- [x] 자동 IP 감지 개선

---

## 📋 현재 설정

### 개발 환경 (현재)
```javascript
// 웹: http://localhost:8000
// 모바일: http://192.168.219.42:8000 (자동 감지 또는 fallback)
```

### 프로덕션 환경 (배포 시)
```javascript
// 모든 플랫폼: https://api.yourdomain.com
```

---

## 🔧 설정 파일

### 1. frontend/config/api.js
환경과 플랫폼에 따라 자동으로 API URL 결정:
- **프로덕션**: `https://api.yourdomain.com`
- **개발 (웹)**: `http://localhost:8000`
- **개발 (모바일)**: 자동 감지 또는 `http://192.168.219.42:8000`

### 2. frontend/app.json
개발 환경 설정:
```json
{
  "extra": {
    "environment": "development"
  }
}
```

### 3. frontend/app.production.json
프로덕션 환경 설정 (배포 시 사용):
```json
{
  "extra": {
    "environment": "production",
    "apiUrl": "https://api.yourdomain.com"
  }
}
```

---

## 🚀 프로덕션 배포 시 설정

### 1. API URL 변경

**frontend/config/api.js** 수정:
```javascript
const API_CONFIG = {
    production: {
        apiUrl: 'https://api.twieo.com',  // 실제 도메인으로 변경
    },
    // ...
};
```

### 2. app.production.json 수정

```json
{
  "extra": {
    "environment": "production",
    "apiUrl": "https://api.twieo.com"  // 실제 도메인으로 변경
  }
}
```

### 3. 빌드 시 프로덕션 설정 사용

```bash
# app.production.json을 app.json으로 복사
cp app.production.json app.json

# 또는 EAS 빌드 설정 사용
eas build --platform android --profile production
```

---

## 🧪 테스트 방법

### 1. 개발 환경 테스트

```bash
cd frontend
npm start

# 로그 확인
# 출력: 🔧 Development mode
# 출력: 🌐 API URL: http://192.168.219.42:8000
```

### 2. 프로덕션 모드 시뮬레이션

**app.json 임시 수정**:
```json
{
  "extra": {
    "environment": "production"
  }
}
```

```bash
# 앱 재시작
npm start

# 로그 확인
# 출력: 🚀 Production mode - Using production API
# 출력: 🌐 API URL: https://api.yourdomain.com
```

### 3. API 연결 테스트

```javascript
// 앱에서 API 호출 시 로그 확인
console.log('API URL:', API_URL);

// 실제 요청 테스트
fetch(`${API_URL}/`)
  .then(res => res.json())
  .then(data => console.log('API Response:', data));
```

---

## 📱 플랫폼별 동작

### 웹 (개발)
```
http://localhost:8000
```

### iOS/Android (개발)
```
1. Expo 자동 감지 시도
2. 성공: http://<감지된IP>:8000
3. 실패: http://192.168.219.42:8000 (fallback)
```

### iOS/Android (프로덕션)
```
https://api.yourdomain.com
```

---

## 🔄 IP 주소 변경 방법

컴퓨터 IP가 변경되었을 때:

### 1. 현재 IP 확인
```bash
# Windows
ipconfig

# 찾기: IPv4 주소 (예: 192.168.0.100)
```

### 2. api.js 수정
```javascript
const API_CONFIG = {
    development: {
        fallbackIp: '192.168.0.100',  // 새 IP로 변경
    }
};
```

### 3. 앱 재시작
```bash
npm start
```

---

## 🚨 문제 해결

### 에러: "Network request failed"

**원인**: API URL이 잘못되었거나 서버가 실행되지 않음

**해결**:
1. 백엔드 서버 실행 확인
   ```bash
   cd backend
   uvicorn main:app --host 0.0.0.0 --port 8000
   ```

2. IP 주소 확인
   ```bash
   ipconfig
   ```

3. 방화벽 확인
   - Windows 방화벽에서 포트 8000 허용

### 에러: "Unable to resolve host"

**원인**: 모바일에서 컴퓨터에 접근 불가

**해결**:
1. 같은 Wi-Fi 네트워크 사용 확인
2. IP 주소 정확한지 확인
3. 백엔드 서버가 `0.0.0.0`으로 실행 중인지 확인

### 프로덕션에서 localhost 접근 시도

**원인**: app.json의 environment가 development로 설정됨

**해결**:
```json
{
  "extra": {
    "environment": "production"
  }
}
```

---

## 📝 체크리스트

### 개발 환경
- [x] API URL 자동 감지 구현
- [x] Fallback IP 설정
- [x] 로그 출력 추가
- [x] 현재 정상 작동 중

### 프로덕션 준비
- [ ] 실제 도메인 구매
- [ ] API 서버 배포
- [ ] HTTPS 설정
- [ ] api.js에 프로덕션 URL 설정
- [ ] app.production.json 수정
- [ ] 빌드 및 테스트

---

## 🔐 보안 고려사항

### 1. HTTPS 필수
프로덕션에서는 반드시 HTTPS 사용:
```javascript
// ✅ 올바름
apiUrl: 'https://api.yourdomain.com'

// ❌ 금지
apiUrl: 'http://api.yourdomain.com'
```

### 2. API 키 보안
민감한 정보는 환경 변수로 관리:
```javascript
// ❌ 하드코딩 금지
const API_KEY = 'secret-key-123';

// ✅ 환경 변수 사용
const API_KEY = Constants.expoConfig?.extra?.apiKey;
```

### 3. 도메인 검증
프로덕션에서 올바른 도메인 사용 확인:
```javascript
if (API_URL.includes('localhost') && !__DEV__) {
    console.error('⚠️  Production build using localhost!');
}
```

---

## 📚 추가 참고사항

### Expo Constants
```javascript
import Constants from 'expo-constants';

// 환경 변수 접근
Constants.expoConfig?.extra?.environment
Constants.expoConfig?.extra?.apiUrl

// 디버그 모드 확인
__DEV__  // true: 개발, false: 프로덕션
```

### EAS Build 설정

**eas.json** 예시:
```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal"
    },
    "production": {
      "env": {
        "ENVIRONMENT": "production"
      }
    }
  }
}
```

---

## ✅ 완료 확인

**현재 상태**:
- ✅ 개발 환경: 로컬 IP 사용
- ✅ 자동 IP 감지 작동
- ✅ 프로덕션 설정 준비 완료

**다음 단계**: 5단계 - .gitignore 확인

**현재 진행률**: 4/7 단계 완료 (57%) 🎉
