#!/bin/bash

echo "🚀 서버 CORS 설정 업데이트"
echo "======================================"

SERVER="110.165.18.249"

echo "1. backend/main.py 파일 업로드 중..."
scp backend/main.py root@$SERVER:/root/twieo/backend/

echo ""
echo "2. 서버에서 프로세스 재시작 중..."
ssh root@$SERVER << 'EOF'
cd /root/twieo/backend

# 기존 프로세스 종료
echo "기존 프로세스 종료 중..."
sudo pkill -f uvicorn

# 가상환경 활성화 및 서버 재시작
echo "서버 재시작 중..."
source venv/bin/activate
nohup python -m uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/twieo.log 2>&1 &

sleep 2

# 프로세스 확인
if ps aux | grep -E "uvicorn.*main:app" | grep -v grep > /dev/null; then
    echo "✅ 서버 재시작 성공"
    echo "로그: tail -f /tmp/twieo.log"
else
    echo "❌ 서버 재시작 실패"
    echo "로그 확인: cat /tmp/twieo.log"
fi
EOF

echo ""
echo "======================================"
echo "완료!"
echo ""
echo "브라우저에서 테스트:"
echo "http://110.165.18.249:8000/docs"
