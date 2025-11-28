#!/bin/bash
# 네이버 클라우드 배포 스크립트

SERVER_IP="110.165.18.249"
SERVER_USER="root"
PROJECT_DIR="/root/twieo/backend"

echo "🚀 네이버 클라우드 서버 진단 및 수정 시작..."

# 1. 서버 상태 확인
echo "📊 1. 현재 서버 상태 확인..."
ssh ${SERVER_USER}@${SERVER_IP} << 'ENDSSH'
cd /root/twieo/backend

echo "=== 현재 디렉토리 ==="
pwd

echo -e "\n=== Python 버전 ==="
python3 --version

echo -e "\n=== 가상환경 확인 ==="
ls -la venv/

echo -e "\n=== .env 파일 확인 ==="
if [ -f .env ]; then
    echo ".env 파일 존재"
    cat .env | grep -v "PASSWORD\|SECRET\|KEY" || echo "환경 변수 확인 필요"
else
    echo "❌ .env 파일 없음!"
fi

echo -e "\n=== 실행 중인 Python 프로세스 ==="
ps aux | grep python | grep -v grep

echo -e "\n=== 포트 8000 사용 확인 ==="
netstat -tlnp | grep 8000 || echo "포트 8000 사용 안 함"

echo -e "\n=== Systemd 서비스 확인 ==="
ls -la /etc/systemd/system/ | grep twieo || echo "Systemd 서비스 없음"

echo -e "\n=== Nginx 설정 확인 ==="
ls -la /etc/nginx/sites-enabled/ | grep twieo || echo "Nginx 설정 없음"

echo -e "\n=== 최근 로그 (있는 경우) ==="
if [ -f /var/log/twieo.log ]; then
    tail -20 /var/log/twieo.log
else
    echo "로그 파일 없음"
fi

ENDSSH

echo -e "\n✅ 진단 완료!"
echo -e "\n다음 명령어로 수동 실행 테스트:"
echo "ssh root@${SERVER_IP}"
echo "cd /root/twieo/backend"
echo "source venv/bin/activate"
echo "python -m uvicorn main:app --host 0.0.0.0 --port 8000"
