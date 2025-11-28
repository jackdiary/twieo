# 원격 서버 재시작 스크립트

$SERVER_IP = "110.165.18.249"
$SSH_KEY = "run.pem"

Write-Host "=== 원격 서버 재시작 ===" -ForegroundColor Cyan

# SSH 명령어 출력
Write-Host "`n다음 명령어를 실행하세요:" -ForegroundColor Yellow
Write-Host "ssh -i $SSH_KEY root@$SERVER_IP" -ForegroundColor White

Write-Host "`n서버 접속 후 실행할 명령어:" -ForegroundColor Yellow
Write-Host @"
# 1. 현재 실행 중인 프로세스 확인
ps aux | grep uvicorn

# 2. 기존 프로세스 종료
pkill -f uvicorn

# 3. 서비스 상태 확인
systemctl status twieo

# 4. 서비스 재시작
systemctl restart twieo

# 5. 로그 확인
journalctl -u twieo -f --lines=50

# 6. 환경 변수 확인
cat /root/run/backend/.env | grep ENVIRONMENT
"@ -ForegroundColor White

Write-Host "`n또는 자동 재시작:" -ForegroundColor Yellow
Write-Host "ssh -i $SSH_KEY root@$SERVER_IP 'systemctl restart twieo && systemctl status twieo'" -ForegroundColor White
