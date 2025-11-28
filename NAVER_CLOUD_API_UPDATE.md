# 네이버 클라우드 API 연결 설정 완료 ✅

## 변경된 파일

### 1. frontend/config/api.js
- **변경 내용**: 프로덕션 API URL을 네이버 클라우드 서버로 업데이트
- **이전**: `https://api.twieo.shop`
- **이후**: `http://110.165.18.249:8000`

### 2. backend/main.py
- **변경 내용**: CORS 설정에 네이버 클라우드 IP 추가
- **추가된 origins**:
  - `http://110.165.18.249`
  - `http://110.165.18.249:8000`

---

## 🚀 서버 배포 방법

### 방법 1: 파일 직접 업로드 (빠름)
```bash
# backend/main.py 업로드
scp backend/main.py root@110.165.18.249:/root/twieo/backend/

# 서버 재시작
ssh root@110.165.18.249 "cd /root/twieo/backend && sudo systemctl restart twieo"
```

### 방법 2: Git 사용 (권장)
```bash
# 로컬에서 커밋 및 푸시
git add .
git commit -m "Update API URL and CORS for Naver Cloud"
git push origin main

# 서버에서 가져오기
ssh root@110.165.18.249
cd /root/twieo
git pull origin main
cd backend
sudo systemctl restart twieo
```

---

## ✅ 배포 후 확인사항

### 1. 서버 상태 확인
```bash
ssh root@110.165.18.249
sudo systemctl status twieo
```

### 2. API 접속 테스트
```bash
# 브라우저에서 접속
http://110.165.18.249:8000/
http://110.165.18.249:8000/docs

# 또는 curl로 테스트
curl http://110.165.18.249:8000/
```

### 3. 로그 확인
```bash
sudo journalctl -u twieo -n 50
```

---

## 📱 프론트엔드 앱 테스트

### Expo 앱 재시작
```bash
cd frontend
npx expo start
```

### 확인할 로그 메시지
```
🚀 Production mode - Using production API
🌐 API URL: http://110.165.18.249:8000
```

### 테스트 항목
- [ ] 로그인 기능
- [ ] 회원가입 기능
- [ ] 프로필 조회
- [ ] 러닝 기록 저장
- [ ] 날씨 정보 조회

---

## 🔧 문제 해결

### 앱에서 "Network request failed" 오류
1. 서버가 실행 중인지 확인
2. 방화벽에서 8000 포트가 열려있는지 확인
3. CORS 설정이 올바른지 확인

### 서버 재시작이 안 될 때
```bash
# 수동으로 프로세스 종료
sudo pkill -f uvicorn

# 서비스 재시작
sudo systemctl restart twieo
```

---

## 📝 다음 단계

1. ✅ 프론트엔드 API URL 설정 완료
2. ✅ 백엔드 CORS 설정 완료
3. ⏳ 서버에 변경사항 배포 (위의 방법 사용)
4. ⏳ 앱에서 연결 테스트
5. ⏳ SSL 인증서 설정 (HTTPS)
6. ⏳ 도메인 연결 (선택사항)

**현재 상태**: 로컬 설정 완료, 서버 배포 대기 중
