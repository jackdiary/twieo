#!/bin/bash

echo "🔍 서버 CORS 설정 확인 및 수정"
echo "======================================"

SERVER="110.165.18.249"

ssh root@$SERVER << 'ENDSSH'
cd /root/twieo/backend

echo "1️⃣  현재 main.py의 CORS 설정 확인:"
echo "------------------------------------"
grep -A 10 "allowed_origins" main.py

echo ""
echo "2️⃣  현재 실행 중인 프로세스:"
echo "------------------------------------"
ps aux | grep uvicorn | grep -v grep

echo ""
echo "3️⃣  현재 로그 확인:"
echo "------------------------------------"
tail -30 /tmp/twieo.log

echo ""
echo "4️⃣  프로세스 종료 및 재시작:"
echo "------------------------------------"
sudo pkill -9 -f uvicorn
sleep 2

source venv/bin/activate
nohup python -m uvicorn main:app --host 0.0.0.0 --port 8000 > /tmp/twieo.log 2>&1 &

echo "서버 시작 중... (3초 대기)"
sleep 3

echo ""
echo "5️⃣  새 로그 확인:"
echo "------------------------------------"
tail -30 /tmp/twieo.log

echo ""
echo "6️⃣  프로세스 확인:"
echo "------------------------------------"
if ps aux | grep -E "uvicorn.*main:app" | grep -v grep > /dev/null; then
    echo "✅ 서버 실행 중"
else
    echo "❌ 서버 실행 실패"
fi

ENDSSH

echo ""
echo "======================================"
echo "완료!"
