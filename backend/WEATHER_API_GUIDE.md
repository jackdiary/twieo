# 날씨 API 설정 가이드

## 현재 상태: 401 Unauthorized 오류

### 문제 원인

1. **승인 대기 중**: 자동 승인이라도 시스템 반영까지 1~2시간 소요
2. **트래픽 인증키**: 개발계정 키가 아닌 트래픽 인증키 필요 가능성
3. **API 활성화 대기**: 백엔드 시스템에서 키 활성화 중

### 해결 방법

#### 방법 1: 기상청 API 재확인 (권장 - 1~2시간 후)

1. **마이페이지 확인**
   - https://www.data.go.kr/mypage/openapi/list
   - "기상청_단기예보" 상태 확인
   - 승인 시간 확인 (1~2시간 경과 필요)

2. **트래픽 인증키 확인**
   - 마이페이지 > 오픈API > 개발계정
   - "트래픽 제한" 섹션 확인
   - 트래픽 인증키가 있다면 그것 사용

3. **API 테스트**
   ```bash
   cd backend
   python -c "from services.weather_service import weather_service; weather_service.get_weather(37.5665, 126.9780)"
   ```

#### 방법 2: OpenWeatherMap API 사용 (즉시 사용 가능)

**장점:**
- 5분 안에 발급 및 사용 가능
- 전세계 날씨 데이터
- 안정적인 서비스
- 무료 플랜: 하루 1,000회 호출

**발급 방법:**
1. https://openweathermap.org/api 접속
2. "Sign Up" 클릭
3. 이메일 인증
4. API Keys 메뉴에서 키 복사
5. .env 파일에 추가:
   ```
   OPENWEATHER_API_KEY=여기에_키_붙여넣기
   ```

**코드 변경 필요:** weather_service.py 수정 필요 (요청 시 변경 가능)

#### 방법 3: 더미 데이터 사용 (현재 상태)

**현재 작동 중:**
- API 실패 시 자동으로 더미 데이터 반환
- 앱 테스트 및 개발에는 문제 없음
- 실제 날씨는 반영되지 않음

### 추천 순서

1. **지금**: 더미 데이터로 앱 개발 계속
2. **1~2시간 후**: 기상청 API 재테스트
3. **여전히 안 되면**: OpenWeatherMap으로 전환

### 기상청 API 디버깅 명령어

```bash
# API 키 확인
cd backend
python -c "import os; from dotenv import load_dotenv; load_dotenv(); print(os.getenv('WEATHER_API_KEY'))"

# API 테스트
python -c "from services.weather_service import weather_service; weather_service.get_weather(37.5665, 126.9780)"

# 직접 HTTP 요청 테스트
python -c "import requests; r=requests.get('https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst', params={'serviceKey':'YOUR_KEY','pageNo':'1','numOfRows':'10','dataType':'JSON','base_date':'20251125','base_time':'1100','nx':'60','ny':'127'}); print(r.status_code, r.text[:200])"
```

### 문의

- 기상청 API 문의: 공공데이터포털 고객센터 (1577-0133)
- OpenWeatherMap 전환 요청: 개발자에게 문의
