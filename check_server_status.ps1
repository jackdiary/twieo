# 서버 상태 확인 스크립트

Write-Host "=== 서버 상태 확인 ===" -ForegroundColor Cyan

# 1. 로컬 서버 확인
Write-Host "`n1. 로컬 서버 프로세스 확인..." -ForegroundColor Yellow
$uvicornProcess = Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*uvicorn*" }
if ($uvicornProcess) {
    Write-Host "✓ Uvicorn 프로세스 실행 중" -ForegroundColor Green
} else {
    Write-Host "✗ Uvicorn 프로세스 없음" -ForegroundColor Red
}

# 2. 원격 서버 확인
Write-Host "`n2. 원격 서버 연결 확인..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://110.165.18.249:8000/" -Method Get -TimeoutSec 5 -ErrorAction Stop
    Write-Host "✓ 서버 응답: $($response.StatusCode)" -ForegroundColor Green
} catch {
    Write-Host "✗ 서버 연결 실패: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. API 엔드포인트 확인
Write-Host "`n3. API 엔드포인트 확인..." -ForegroundColor Yellow
$endpoints = @(
    "http://110.165.18.249:8000/api/achievements/",
    "http://110.165.18.249:8000/api/goals/",
    "http://110.165.18.249:8000/docs"
)

foreach ($endpoint in $endpoints) {
    try {
        $response = Invoke-WebRequest -Uri $endpoint -Method Get -TimeoutSec 5 -ErrorAction Stop
        Write-Host "✓ $endpoint - Status: $($response.StatusCode)" -ForegroundColor Green
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode) {
            Write-Host "✗ $endpoint - Status: $statusCode" -ForegroundColor Red
        } else {
            Write-Host "✗ $endpoint - 연결 실패" -ForegroundColor Red
        }
    }
}

Write-Host "`n=== 확인 완료 ===" -ForegroundColor Cyan
