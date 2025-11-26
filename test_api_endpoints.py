#!/usr/bin/env python3
"""
API 엔드포인트 테스트 스크립트
서버 재시작 후 주요 기능들이 정상 작동하는지 확인
"""
import requests
import json
from datetime import datetime

BASE_URL = "http://localhost:8000"

# 테스트 결과 저장
test_results = []

def test_endpoint(name, method, url, data=None, headers=None, expected_status=200):
    """API 엔드포인트 테스트"""
    try:
        if method == "GET":
            response = requests.get(url, headers=headers, timeout=5)
        elif method == "POST":
            response = requests.post(url, json=data, headers=headers, timeout=5)
        elif method == "PUT":
            response = requests.put(url, json=data, headers=headers, timeout=5)
        elif method == "DELETE":
            response = requests.delete(url, headers=headers, timeout=5)
        
        success = response.status_code == expected_status
        test_results.append({
            "name": name,
            "success": success,
            "status": response.status_code,
            "expected": expected_status
        })
        
        if success:
            print(f"✅ {name}: {response.status_code}")
        else:
            print(f"❌ {name}: {response.status_code} (예상: {expected_status})")
            
        return response
    except Exception as e:
        print(f"❌ {name}: 오류 - {str(e)}")
        test_results.append({
            "name": name,
            "success": False,
            "error": str(e)
        })
        return None

def main():
    print("🚀 API 엔드포인트 테스트 시작\n")
    print("="*60)
    
    # 1. 서버 상태 확인
    print("\n📡 1. 서버 상태 확인")
    print("-"*60)
    test_endpoint("Root 엔드포인트", "GET", f"{BASE_URL}/")
    
    # 2. 인증 테스트
    print("\n🔐 2. 인증 시스템 테스트")
    print("-"*60)
    
    # 회원가입 테스트
    test_user = {
        "username": f"testuser_{datetime.now().strftime('%Y%m%d%H%M%S')}",
        "email": f"test_{datetime.now().strftime('%Y%m%d%H%M%S')}@example.com",
        "password": "TestPassword123!",
        "full_name": "테스트 사용자"
    }
    
    register_response = test_endpoint(
        "회원가입",
        "POST",
        f"{BASE_URL}/api/auth/register",
        data=test_user,
        expected_status=201
    )
    
    # 로그인 테스트 (OAuth2PasswordRequestForm 형식 필요)
    import urllib.parse
    login_data_form = f"username={test_user['email']}&password={test_user['password']}"
    
    try:
        response = requests.post(
            f"{BASE_URL}/api/auth/login",
            data=login_data_form,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            timeout=5
        )
        if response.status_code == 200:
            print(f"✅ 로그인: {response.status_code}")
            login_response = response
            test_results.append({"name": "로그인", "success": True, "status": 200, "expected": 200})
        else:
            print(f"❌ 로그인: {response.status_code} (예상: 200)")
            login_response = None
            test_results.append({"name": "로그인", "success": False, "status": response.status_code, "expected": 200})
    except Exception as e:
        print(f"❌ 로그인: 오류 - {str(e)}")
        login_response = None
        test_results.append({"name": "로그인", "success": False, "error": str(e)})
    
    # 토큰 추출
    token = None
    if login_response and login_response.status_code == 200:
        token = login_response.json().get("access_token")
        print(f"   🔑 토큰 획득 성공")
    
    # 인증 헤더 설정
    auth_headers = {"Authorization": f"Bearer {token}"} if token else None
    
    # 3. 사용자 프로필 테스트
    print("\n👤 3. 사용자 프로필 테스트")
    print("-"*60)
    if auth_headers:
        test_endpoint("프로필 조회", "GET", f"{BASE_URL}/users/me", headers=auth_headers)
    else:
        print("⚠️  토큰이 없어 프로필 테스트 건너뜀")
    
    # 4. 날씨 API 테스트
    print("\n🌤️  4. 날씨 API 테스트")
    print("-"*60)
    test_endpoint(
        "날씨 정보 조회",
        "GET",
        f"{BASE_URL}/api/weather?lat=37.5665&lon=126.9780"
    )
    
    # 5. 시설 정보 테스트
    print("\n🏃 5. 시설 정보 테스트")
    print("-"*60)
    test_endpoint(
        "근처 시설 조회",
        "GET",
        f"{BASE_URL}/api/facilities/indoor?lat=37.5665&lon=126.9780"
    )
    
    # 6. 러닝 기록 테스트 (인증 필요)
    print("\n🏃‍♂️ 6. 러닝 기록 테스트")
    print("-"*60)
    if auth_headers:
        # 러닝 기록 생성
        run_data = {
            "distance": 5.2,
            "duration": 1800,
            "calories": 350,
            "pace": 346,
            "route": {"type": "LineString", "coordinates": [[126.9780, 37.5665], [126.9790, 37.5675]]}
        }
        test_endpoint("러닝 기록 생성", "POST", f"{BASE_URL}/api/runs", data=run_data, headers=auth_headers, expected_status=201)
        
        # 러닝 기록 조회
        test_endpoint("러닝 기록 조회", "GET", f"{BASE_URL}/api/runs", headers=auth_headers)
    else:
        print("⚠️  토큰이 없어 러닝 기록 테스트 건너뜀")
    
    # 7. 목표 테스트 (인증 필요)
    print("\n🎯 7. 목표 관리 테스트")
    print("-"*60)
    if auth_headers:
        goal_data = {
            "goal_type": "distance",
            "target_value": 100.0,
            "period": "weekly",
            "start_date": datetime.now().strftime("%Y-%m-%d")
        }
        test_endpoint("목표 생성", "POST", f"{BASE_URL}/api/goals", data=goal_data, headers=auth_headers, expected_status=201)
        test_endpoint("목표 조회", "GET", f"{BASE_URL}/api/goals", headers=auth_headers)
    else:
        print("⚠️  토큰이 없어 목표 테스트 건너뜀")
    
    # 8. 업적 테스트 (인증 필요)
    print("\n🏆 8. 업적 시스템 테스트")
    print("-"*60)
    if auth_headers:
        test_endpoint("업적 조회", "GET", f"{BASE_URL}/api/achievements", headers=auth_headers)
        test_endpoint("사용자 업적 조회", "GET", f"{BASE_URL}/api/achievements/user", headers=auth_headers)
    else:
        print("⚠️  토큰이 없어 업적 테스트 건너뜀")
    
    # 9. 챌린지 테스트 (인증 필요)
    print("\n🎮 9. 챌린지 시스템 테스트")
    print("-"*60)
    if auth_headers:
        test_endpoint("활성 챌린지 조회", "GET", f"{BASE_URL}/api/challenges/active", headers=auth_headers)
    else:
        print("⚠️  토큰이 없어 챌린지 테스트 건너뜀")
    
    # 10. 친구 시스템 테스트 (인증 필요)
    print("\n👥 10. 친구 시스템 테스트")
    print("-"*60)
    if auth_headers:
        test_endpoint("친구 목록 조회", "GET", f"{BASE_URL}/api/friends", headers=auth_headers)
    else:
        print("⚠️  토큰이 없어 친구 테스트 건너뜀")
    
    # 결과 요약
    print("\n" + "="*60)
    print("📊 테스트 결과 요약")
    print("="*60)
    
    total = len(test_results)
    success = sum(1 for r in test_results if r.get("success", False))
    failed = total - success
    
    print(f"\n총 테스트: {total}")
    print(f"✅ 성공: {success}")
    print(f"❌ 실패: {failed}")
    print(f"성공률: {(success/total*100):.1f}%")
    
    if failed > 0:
        print("\n❌ 실패한 테스트:")
        for result in test_results:
            if not result.get("success", False):
                print(f"  - {result['name']}")
                if "error" in result:
                    print(f"    오류: {result['error']}")
                elif "status" in result:
                    print(f"    상태 코드: {result['status']} (예상: {result['expected']})")
    
    print("\n" + "="*60)
    
    if success == total:
        print("🎉 모든 테스트 통과!")
        return True
    else:
        print("⚠️  일부 테스트 실패")
        return False

if __name__ == "__main__":
    try:
        success = main()
        exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  테스트 중단됨")
        exit(1)
    except Exception as e:
        print(f"\n\n❌ 테스트 실행 오류: {e}")
        exit(1)
