#!/usr/bin/env python3
"""간단한 API 테스트"""
import requests
import time

BASE_URL = "http://localhost:8000"

print("🔍 서버 연결 테스트 중...")
print("-" * 60)

# 최대 5번 재시도
for i in range(5):
    try:
        response = requests.get(f"{BASE_URL}/", timeout=2)
        if response.status_code == 200:
            print(f"✅ 서버 연결 성공! (시도 {i+1}/5)")
            print(f"📡 응답: {response.json()}")
            break
    except Exception as e:
        print(f"❌ 연결 실패 (시도 {i+1}/5): {str(e)[:50]}...")
        if i < 4:
            print("   3초 후 재시도...")
            time.sleep(3)
else:
    print("\n⚠️  서버에 연결할 수 없습니다.")
    print("   수동으로 서버를 시작해주세요:")
    print("   cd backend")
    print("   .\\venv\\Scripts\\activate")
    print("   python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000")
    exit(1)

print("\n" + "="*60)
print("✅ 서버가 정상적으로 실행 중입니다!")
print("="*60)
