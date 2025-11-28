#!/bin/bash

echo "=========================================="
echo "네이버 클라우드 서버 진단 스크립트"
echo "=========================================="
echo ""

SERVER_IP="110.165.18.249"
SERVER_PORT="8000"

echo "1️⃣  서버 접속 테스트..."
if ssh -o ConnectTimeout=5 root@$SERVER_IP "echo 'SSH 연결 성공'" 2>/dev/null; then
    echo "✅ SSH 연결 성공"
else
    echo "❌ SSH 연결 실패 - 서버에 접속할 수 없습니다"
    exit 1
fi

echo ""
echo "2️⃣  서버 프로세스 확인..."
ssh root@$SERVER_IP << 'ENDSSH'
    echo "--- Python/Uvicorn 프로세스 ---"
    ps aux | grep -E "python|uvicorn" | grep -v grep
    
    echo ""
    echo "--- 포트 8000 사용 확인 ---"
    netstat -tlnp | grep 8000 || echo "⚠️  포트 8000이 사용되지 않음"
ENDSSH

echo ""
echo "3️⃣  Systemd 서비스 상태 확인..."
ssh root@$SERVER_IP "systemctl status twieo 2>/dev/null || echo '⚠️  twieo 서비스가 설정되지 않음'"

echo ""
echo "4️⃣  방화벽 설정 확인..."
ssh root@$SERVER_IP << 'ENDSSH'
    echo "--- UFW 상태 ---"
    ufw status 2>/dev/null || echo "UFW가 설치되지 않음"
    
    echo ""
    echo "--- iptables 규칙 ---"
    iptables -L -n | grep 8000 || echo "iptables에 8000 포트 규칙 없음"
ENDSSH

echo ""
echo "5️⃣  서버 로그 확인 (최근 20줄)..."
ssh root@$SERVER_IP "journalctl -u twieo -n 20 --no-pager 2>/dev/null || echo '⚠️  서비스 로그 없음'"

echo ""
echo "=========================================="
echo "진단 완료"
echo "=========================================="
