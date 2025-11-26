import requests
import os
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "")
print(f"API Key: {WEATHER_API_KEY[:20]}...")

# 서울 좌표를 격자로 변환 (간단 계산)
lat, lon = 37.5665, 126.9780
nx, ny = 60, 127  # 서울 대략적인 격자

now = datetime.now()
base_date = now.strftime("%Y%m%d")
base_time = "1400"  # 오후 2시 발표

url = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst"
params = {
    'serviceKey': WEATHER_API_KEY,
    'pageNo': '1',
    'numOfRows': '100',
    'dataType': 'JSON',
    'base_date': base_date,
    'base_time': base_time,
    'nx': nx,
    'ny': ny
}

print(f"\nRequesting: {url}")
print(f"Date: {base_date}, Time: {base_time}")
print(f"Grid: nx={nx}, ny={ny}")

response = requests.get(url, params=params, timeout=10)
print(f"\nStatus Code: {response.status_code}")
print(f"Response: {response.text[:500]}")
