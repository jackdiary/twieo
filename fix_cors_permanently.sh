#!/bin/bash

echo "🔧 CORS 문제 완전 해결 스크립트"
echo "================================"

# 1. 서버 접속 및 환경 확인
echo "📋 1단계: 서버 환경 확인"
ssh -i run.pem root@110.165.18.249 << 'ENDSSH'
cd /root/run
echo "현재 ENVIRONMENT 설정:"
grep ENVIRONMENT backend/.env
ENDSSH

# 2. 서버의 .env 파일 업데이트
echo ""
echo "🔄 2단계: 서버 .env 파일 업데이트"
ssh -i run.pem root@110.165.18.249 << 'ENDSSH'
cd /root/run/backend

# .env 파일에서 ENVIRONMENT를 development로 변경
sed -i 's/ENVIRONMENT=production/ENVIRONMENT=development/' .env

echo "업데이트된 ENVIRONMENT 설정:"
grep ENVIRONMENT .env
ENDSSH

# 3. main.py 업데이트 (더 명확한 CORS 설정)
echo ""
echo "📝 3단계: main.py CORS 설정 강화"
cat > temp_main_cors.py << 'ENDPYTHON'
# CORS 설정 부분만 추출
ENVIRONMENT = os.getenv("ENVIRONMENT", "development")

# 개발 환경에서는 모든 origin 허용
if ENVIRONMENT == "development":
    allowed_origins = ["*"]
    print("🔓 개발 모드: 모든 origin 허용")
else:
    # 프로덕션에서는 특정 origin만 허용
    allowed_origins = [
        "https://twieo.shop",
        "https://www.twieo.shop",
        "http://110.165.18.249",
        "http://110.165.18.249:8000",
        "http://localhost:8081",
        "http://localhost:19006",
    ]
    print(f"🔒 프로덕션 모드: 제한된 origin 허용")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],  # 추가
)

print(f"✅ CORS 설정 완료 - Environment: {ENVIRONMENT}")
print(f"✅ Allowed origins: {allowed_origins}")
ENDPYTHON

# 4. 서버 프로세스 완전 종료 및 재시작
echo ""
echo "🔄 4단계: 서버 완전 재시작"
ssh -i run.pem root@110.165.18.249 << 'ENDSSH'
cd /root/run

# 모든 uvicorn 프로세스 종료
echo "기존 프로세스 종료 중..."
pkill -9 -f uvicorn
sleep 2

# 가상환경 활성화 및 서버 재시작
echo "서버 재시작 중..."
cd backend
source venv/bin/activate
nohup uvicorn main:app --host 0.0.0.0 --port 8000 --reload > ../server.log 2>&1 &

sleep 3
echo "서버 프로세스 확인:"
ps aux | grep uvicorn | grep -v grep
ENDSSH

# 5. CORS 테스트
echo ""
echo "🧪 5단계: CORS 테스트"
sleep 2
curl -I -X OPTIONS http://110.165.18.249:8000/api/profile/ \
  -H "Origin: http://localhost:8081" \
  -H "Access-Control-Request-Method: GET"

echo ""
echo "================================"
echo "✅ 완료! 브라우저를 새로고침하고 다시 테스트해보세요."
