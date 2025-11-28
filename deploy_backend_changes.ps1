# 백엔드 변경사항을 네이버 클라우드 서버에 배포

Write-Host "백엔드 파일 업로드 중..." -ForegroundColor Green

# 수정된 파일들 업로드
scp -i run.pem backend/routers/profiles.py root@110.165.18.249:/root/twieo/backend/routers/profiles.py
scp -i run.pem backend/dependencies.py root@110.165.18.249:/root/twieo/backend/dependencies.py
scp -i run.pem backend/main.py root@110.165.18.249:/root/twieo/backend/main.py
scp -i run.pem backend/database.py root@110.165.18.249:/root/twieo/backend/database.py

Write-Host "서버 재시작 중..." -ForegroundColor Yellow
ssh -i run.pem root@110.165.18.249 "systemctl restart twieo"

Start-Sleep -Seconds 3

Write-Host "서버 상태 확인..." -ForegroundColor Cyan
ssh -i run.pem root@110.165.18.249 "systemctl status twieo"

Write-Host "`n배포 완료!" -ForegroundColor Green
