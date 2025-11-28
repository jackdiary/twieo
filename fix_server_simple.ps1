# CORS 문제 해결 스크립트 (PowerShell)

Write-Host "🔧 서버 CORS 문제 해결 시작..." -ForegroundColor Cyan

# SSH 명령어를 하나의 문자열로 결합
$sshCommand = @"
cd twieo && \
echo '=== 1. 현재 환경 확인 ===' && \
grep ENVIRONMENT backend/.env && \
echo '' && \
echo '=== 2. 서버 프로세스 종료 ===' && \
pkill -9 -f uvicorn && \
sleep 2 && \
echo '=== 3. 서버 재시작 ===' && \
cd backend && \
source venv/bin/activate && \
nohup uvicorn main:app --host 0.0.0.0 --port 8000 --reload > ../server.log 2>&1 & \
sleep 3 && \
echo '=== 4. 프로세스 확인 ===' && \
ps aux | grep uvicorn | grep -v grep && \
echo '' && \
echo '=== 5. 서버 로그 확인 ===' && \
cd .. && \
tail -30 server.log
"@

Write-Host "서버에 연결 중..." -ForegroundColor Yellow
ssh -i run.pem root@110.165.18.249 $sshCommand

Write-Host "`n✅ 완료! 이제 브라우저를 새로고침하고 테스트해보세요." -ForegroundColor Green
