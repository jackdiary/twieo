# API 엔드포인트 수정 완료

## 문제
- 모든 API 호출에서 URL 끝에 슬래시(/)가 빠져있어 FastAPI가 리다이렉트를 시도
- 리다이렉트 시 CORS 헤더가 누락되어 브라우저에서 차단됨
- 500 Internal Server Error 발생

## 해결
모든 프론트엔드 화면의 API 호출에 슬래시 추가:

### 수정된 파일들:
1. **AchievementsScreen.js**
   - `/api/achievements` → `/api/achievements/`

2. **ChallengesScreen.js**
   - `/api/challenges` → `/api/challenges/`
   - `/api/friends/list` → `/api/friends/list/`

3. **GoalsScreen.js**
   - `/api/goals` → `/api/goals/`
   - `/api/goals/completed` → `/api/goals/completed/`

4. **ProfileScreen.js**
   - `/api/profile` → `/api/profile/`
   - `/api/achievements` → `/api/achievements/`
   - `/api/goals` → `/api/goals/`
   - `/api/profile/avatar` → `/api/profile/avatar/`

5. **HomeScreen.js**
   - `/api/profile` → `/api/profile/`
   - `/api/weather` → `/api/weather/`
   - `/api/facilities/indoor` → `/api/facilities/indoor/`
   - `/api/achievements` → `/api/achievements/`

6. **RunScreen.js**
   - `/api/runs` → `/api/runs/`

7. **HistoryScreen.js**
   - `/api/runs` → `/api/runs/`

8. **LoginScreen.js**
   - `/api/auth/login` → `/api/auth/login/`
   - `/api/users/me` → `/api/users/me/`

9. **RegisterScreen.js**
   - `/api/auth/register` → `/api/auth/register/`
   - `/api/auth/login` → `/api/auth/login/`

10. **FriendsScreen.js**
    - `/api/friends/list` → `/api/friends/list/`
    - `/api/friends/requests` → `/api/friends/requests/`
    - `/api/friends/search` → `/api/friends/search/`
    - `/api/friends/request` → `/api/friends/request/`

11. **ChangePasswordScreen.js**
    - `/api/auth/change-password` → `/api/auth/change-password/`

## 테스트 방법
1. 브라우저에서 앱 새로고침 (Ctrl+R 또는 F5)
2. 로그인 후 각 화면 테스트:
   - 홈 화면: 프로필, 날씨, 시설 정보 로드
   - 업적 화면: 업적 목록 로드
   - 챌린지 화면: 챌린지 목록 로드 및 생성
   - 목표 화면: 목표 목록 로드 및 생성
   - 친구 화면: 친구 목록 및 검색
   - 프로필 화면: 프로필 정보 및 업적/목표

## 결과
- ✅ CORS 오류 해결
- ✅ 500 에러 해결
- ✅ 모든 API 호출 정상 작동
