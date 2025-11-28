# 서버 환경을 development로 변경하고 재시작

Write-Host "🔧 서버 환경 변경 및 재시작..." -ForegroundColor Cyan

# 1단계: .env 파일 수정
Write-Host "`n1. .env 파일을 development로 변경..." -ForegroundColor Yellow
ssh -i run.pem root@110.165.18.249 "cd twieo/backend && sed -i 's/ENVIRONMENT=production/ENVIRONMENT=development/' .env && grep ENVIRONMENT .env"

# 2단계: 서버 재시작
Write-Host "`n2. 서버 재시작..." -ForegroundColor Yellow
ssh -i run.pem root@110.165.18.249 "cd twieo && pkill -9 -f uvicorn && sleep 2 && cd backend && source venv/bin/activate && nohup uvicorn main:app --host 0.0.0.0 --port 8000 --reload > ../server.log 2>&1 & sleep 3 && ps aux | grep uvicorn | grep -v grep"

# 3단계: 로그 확인
Write-Host "`n3. 서버 로그 확인..." -ForegroundColor Yellow
ssh -i run.pem root@110.165.18.249 "cd twieo && tail -30 server.log"

Write-Host "`n✅ 완료!" -ForegroundColor Green
Write-Host "이제 브라우저를 새로고침(Ctrl+Shift+R)하고 테스트해보세요." -ForegroundColor Cyan
