# 네이버 클라우드 서버 상태 체크 (PowerShell)

$SERVER = "110.165.18.249"
$PORT = 8000

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "네이버 클라우드 서버 상태 체크" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 1. Ping 테스트
Write-Host "1. 서버 Ping 테스트..." -ForegroundColor Yellow
$ping = Test-Connection -ComputerName $SERVER -Count 2 -Quiet
if ($ping) {
    Write-Host "✅ Ping 성공 - 서버 온라인" -ForegroundColor Green
} else {
    Write-Host "❌ Ping 실패 - 서버 오프라인 또는 ICMP 차단" -ForegroundColor Red
}
Write-Host ""

# 2. 포트 8000 연결 테스트
Write-Host "2. 포트 8000 연결 테스트..." -ForegroundColor Yellow
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $connect = $tcpClient.BeginConnect($SERVER, $PORT, $null, $null)
    $wait = $connect.AsyncWaitHandle.WaitOne(5000, $false)
    
    if ($wait -and $tcpClient.Connected) {
        Write-Host "✅ 포트 8000 열림 - 서버 실행 중" -ForegroundColor Green
        $tcpClient.Close()
    } else {
        Write-Host "❌ 포트 8000 닫힘 - 서버 중지 또는 방화벽 차단" -ForegroundColor Red
        $tcpClient.Close()
    }
} catch {
    Write-Host "❌ 연결 실패: $_" -ForegroundColor Red
}
Write-Host ""

# 3. HTTP 요청 테스트
Write-Host "3. HTTP API 테스트..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://${SERVER}:${PORT}/" -TimeoutSec 5 -UseBasicParsing
    Write-Host "✅ API 응답 성공 (Status: $($response.StatusCode))" -ForegroundColor Green
    Write-Host "응답 내용: $($response.Content.Substring(0, [Math]::Min(100, $response.Content.Length)))..." -ForegroundColor Gray
} catch {
    Write-Host "❌ API 응답 실패: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 4. SSH 연결 가능 여부 (포트 22)
Write-Host "4. SSH 포트 (22) 테스트..." -ForegroundColor Yellow
try {
    $tcpClient = New-Object System.Net.Sockets.TcpClient
    $connect = $tcpClient.BeginConnect($SERVER, 22, $null, $null)
    $wait = $connect.AsyncWaitHandle.WaitOne(5000, $false)
    
    if ($wait -and $tcpClient.Connected) {
        Write-Host "✅ SSH 포트 열림 - 서버 접속 가능" -ForegroundColor Green
        $tcpClient.Close()
    } else {
        Write-Host "❌ SSH 포트 닫힘" -ForegroundColor Red
        $tcpClient.Close()
    }
} catch {
    Write-Host "❌ SSH 연결 실패: $_" -ForegroundColor Red
}
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "체크 완료" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 결과 요약
Write-Host "📋 다음 단계:" -ForegroundColor Yellow
Write-Host "1. 포트 8000이 닫혀있다면 → 서버에 SSH 접속해서 서비스 시작" -ForegroundColor White
Write-Host "   ssh root@$SERVER" -ForegroundColor Gray
Write-Host ""
Write-Host "2. 서버 상태 확인 및 시작:" -ForegroundColor White
Write-Host "   cd /root/twieo/backend" -ForegroundColor Gray
Write-Host "   sudo systemctl status twieo" -ForegroundColor Gray
Write-Host "   sudo systemctl start twieo" -ForegroundColor Gray
Write-Host ""
Write-Host "3. 수동 실행 (테스트):" -ForegroundColor White
Write-Host "   source venv/bin/activate" -ForegroundColor Gray
Write-Host "   python -m uvicorn main:app --host 0.0.0.0 --port 8000" -ForegroundColor Gray
