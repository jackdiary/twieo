#!/usr/bin/env python3
"""빠른 서버 테스트"""
import requests

try:
    response = requests.get("http://localhost:8000/", timeout=2)
    if response.status_code == 200:
        print("✅ 서버 연결 성공!")
        print(f"📡 응답: {response.json()}")
    else:
        print(f"⚠️  서버 응답: {response.status_code}")
except Exception as e:
    print(f"❌ 연결 실패: {str(e)[:100]}")
    print("\n서버가 완전히 시작될 때까지 기다려주세요...")
    print("서버 터미널에서 다음 메시지를 확인하세요:")
    print("  ✅ Loaded 42484 facilities from CSV")
    print("  🌐 CORS allowed origins")
