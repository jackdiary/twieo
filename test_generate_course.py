import requests
import json

# 테스트 요청
url = "http://110.165.18.249:8000/generate_course"
data = {
    "lat": 37.5063976,
    "lon": 127.0529477,
    "distance": 3.0,
    "preference": "scenic"
}

print("요청 URL:", url)
print("요청 데이터:", json.dumps(data, indent=2))
print("\n" + "="*50)

response = requests.post(url, json=data)

print("응답 상태:", response.status_code)
print("응답 데이터:")
print(json.dumps(response.json(), indent=2))
