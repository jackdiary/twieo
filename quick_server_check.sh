#!/bin/bash

echo "🔍 네이버 클라우드 서버 빠른 체크"
echo "======================================"
echo ""

SERVER="110.165.18.249"

echo "1. SSH 연결 테스트..."
if timeout 5 ssh -o ConnectTimeout=5 root@$SERVER "echo '✅ SSH OK'" 2>/dev/null; then
    echo ""
else
    echo "❌ SSH 연결 실패"
    exit 1
fi

echo "2. 서버 프로세스 및 포트 확인..."
ssh root@$SERVER << 'EOF'
echo "--- Python 프로세스 ---"
if ps aux | grep -E "uvicorn|python.*main" | grep -v grep; then
    echo "✅ Python 프로세스 실행 중"
else
    echo "❌ Python 프로세스 없음"
fi

echo ""
echo "--- 포트 8000 ---"
if netstat -tlnp 2>/dev/null | grep 8000; then
    echo "✅ 포트 8000 LISTEN 중"
else
    echo "❌ 포트 8000 사용 안 함"
fi

echo ""
echo "--- Systemd 서비스 ---"
if systemctl is-active --quiet twieo 2>/dev/null; then
    echo "✅ twieo 서비스 실행 중"
    systemctl status twieo --no-pager -l
else
    echo "❌ twieo 서비스 실행 안 됨"
fi

echo ""
echo "--- 로컬 API 테스트 ---"
if curl -s http://localhost:8000/ > /dev/null 2>&1; then
    echo "✅ 로컬에서 API 응답 OK"
else
    echo "❌ 로컬에서 API 응답 없음"
fi
EOF

echo ""
echo "3. 외부에서 API 접근 테스트..."
if curl -s --connect-timeout 5 http://$SERVER:8000/ > /dev/null 2>&1; then
    echo "✅ 외부에서 API 접근 가능"
else
    echo "❌ 외부에서 API 접근 불가 (방화벽 또는 서버 문제)"
fi

echo ""
echo "======================================"
echo "체크 완료"
