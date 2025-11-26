import requests
import os
from datetime import datetime
from dotenv import load_dotenv
from urllib.parse import unquote

load_dotenv()

WEATHER_API_KEY = os.getenv("WEATHER_API_KEY", "")
# API 키가 인코딩되어 있다면 디코딩
if WEATHER_API_KEY and '%' in WEATHER_API_KEY:
    WEATHER_API_KEY = unquote(WEATHER_API_KEY)

class WeatherService:
    def __init__(self):
        self.api_key = WEATHER_API_KEY
        # HTTPS 사용
        self.base_url = "https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0"
    
    def get_weather(self, lat: float, lon: float):
        """
        기상청 단기예보 API를 사용하여 날씨 정보 가져오기
        """
        try:
            # 좌표를 기상청 격자 좌표로 변환 (간단한 근사값)
            nx, ny = self._convert_to_grid(lat, lon)
            
            now = datetime.now()
            base_date = now.strftime("%Y%m%d")
            base_time = self._get_base_time(now)
            
            params = {
                'serviceKey': self.api_key,
                'pageNo': '1',
                'numOfRows': '100',
                'dataType': 'JSON',
                'base_date': base_date,
                'base_time': base_time,
                'nx': nx,
                'ny': ny
            }
            
            print(f"[Weather API] Requesting: lat={lat}, lon={lon}, nx={nx}, ny={ny}")
            print(f"[Weather API] Date: {base_date}, Time: {base_time}")
            print(f"[Weather API] API Key: {self.api_key[:10]}..." if self.api_key else "[Weather API] No API Key")
            
            response = requests.get(f"{self.base_url}/getVilageFcst", params=params, timeout=10)
            
            print(f"[Weather API] Status Code: {response.status_code}")
            
            if response.status_code == 200:
                data = response.json()
                print(f"[Weather API] Response: {data.get('response', {}).get('header', {})}")
                
                # 응답 코드 확인
                header = data.get('response', {}).get('header', {})
                if header.get('resultCode') == '00':
                    return self._parse_weather_data(data)
                else:
                    print(f"[Weather API] Error: {header.get('resultMsg')}")
                    return self._get_dummy_weather()
            else:
                print(f"[Weather API] HTTP Error: {response.text[:200]}")
                return self._get_dummy_weather()
                
        except Exception as e:
            print(f"[Weather API] Exception: {e}")
            import traceback
            traceback.print_exc()
            return self._get_dummy_weather()
    
    def _convert_to_grid(self, lat: float, lon: float):
        """
        위경도를 기상청 격자 좌표로 변환 (Lambert Conformal Conic)
        """
        import math
        
        RE = 6371.00877  # 지구 반경(km)
        GRID = 5.0  # 격자 간격(km)
        SLAT1 = 30.0  # 표준위도1
        SLAT2 = 60.0  # 표준위도2
        OLON = 126.0  # 기준점 경도
        OLAT = 38.0  # 기준점 위도
        XO = 43  # 기준점 X좌표
        YO = 136  # 기준점 Y좌표
        
        DEGRAD = math.pi / 180.0
        
        re = RE / GRID
        slat1 = SLAT1 * DEGRAD
        slat2 = SLAT2 * DEGRAD
        olon = OLON * DEGRAD
        olat = OLAT * DEGRAD
        
        sn = math.tan(math.pi * 0.25 + slat2 * 0.5) / math.tan(math.pi * 0.25 + slat1 * 0.5)
        sn = math.log(math.cos(slat1) / math.cos(slat2)) / math.log(sn)
        sf = math.tan(math.pi * 0.25 + slat1 * 0.5)
        sf = math.pow(sf, sn) * math.cos(slat1) / sn
        ro = math.tan(math.pi * 0.25 + olat * 0.5)
        ro = re * sf / math.pow(ro, sn)
        
        ra = math.tan(math.pi * 0.25 + lat * DEGRAD * 0.5)
        ra = re * sf / math.pow(ra, sn)
        theta = lon * DEGRAD - olon
        if theta > math.pi:
            theta -= 2.0 * math.pi
        if theta < -math.pi:
            theta += 2.0 * math.pi
        theta *= sn
        
        x = math.floor(ra * math.sin(theta) + XO + 0.5)
        y = math.floor(ro - ra * math.cos(theta) + YO + 0.5)
        
        return int(x), int(y)
    
    def _get_base_time(self, now):
        """
        기상청 API 발표 시각 계산
        """
        hour = now.hour
        if hour < 2:
            return "2300"
        elif hour < 5:
            return "0200"
        elif hour < 8:
            return "0500"
        elif hour < 11:
            return "0800"
        elif hour < 14:
            return "1100"
        elif hour < 17:
            return "1400"
        elif hour < 20:
            return "1700"
        elif hour < 23:
            return "2000"
        else:
            return "2300"
    
    def _parse_weather_data(self, data):
        """
        기상청 API 응답 파싱
        """
        try:
            items = data['response']['body']['items']['item']
            print(f"[Weather API] Parsing {len(items)} items")
            
            weather_info = {
                'temperature': 0,
                'humidity': 0,
                'precipitation': 0,
                'wind_speed': 0,
                'sky_condition': '맑음'  # 기본값 설정
            }
            
            for item in items:
                category = item['category']
                value = item['fcstValue']
                
                if category == 'TMP':  # 기온
                    weather_info['temperature'] = float(value)
                    print(f"[Weather API] Temperature: {value}°C")
                elif category == 'REH':  # 습도
                    weather_info['humidity'] = int(value)
                    print(f"[Weather API] Humidity: {value}%")
                elif category == 'PCP':  # 강수량
                    if value == '강수없음':
                        weather_info['precipitation'] = 0
                    elif '미만' in value:
                        weather_info['precipitation'] = 0  # '1 미만'은 0으로 처리
                    else:
                        try:
                            weather_info['precipitation'] = float(value.replace('mm', ''))
                        except ValueError:
                            weather_info['precipitation'] = 0
                    print(f"[Weather API] Precipitation: {value}")
                elif category == 'WSD':  # 풍속
                    weather_info['wind_speed'] = float(value)
                    print(f"[Weather API] Wind Speed: {value}m/s")
                elif category == 'SKY':  # 하늘상태
                    sky_code = int(value)
                    if sky_code == 1:
                        weather_info['sky_condition'] = '맑음'
                    elif sky_code == 3:
                        weather_info['sky_condition'] = '구름많음'
                    else:
                        weather_info['sky_condition'] = '흐림'
                    print(f"[Weather API] Sky: {weather_info['sky_condition']} (code: {sky_code})")
            
            print(f"[Weather API] Parsed weather: {weather_info}")
            result = self._evaluate_running_conditions(weather_info)
            print(f"[Weather API] Final result: {result}")
            return result
            
        except Exception as e:
            print(f"[Weather API] Parse Error: {e}")
            import traceback
            traceback.print_exc()
            return self._get_dummy_weather()
    
    def _evaluate_running_conditions(self, weather_info):
        """
        러닝하기 좋은 날씨인지 평가
        """
        temp = weather_info['temperature']
        precipitation = weather_info['precipitation']
        wind_speed = weather_info['wind_speed']
        
        is_good = True
        reasons = []
        
        # 비가 오는 경우
        if precipitation > 0:
            is_good = False
            reasons.append("비가 오고 있습니다")
        
        # 너무 덥거나 추운 경우
        if temp > 30:
            is_good = False
            reasons.append("기온이 너무 높습니다")
        elif temp < 0:
            is_good = False
            reasons.append("기온이 너무 낮습니다")
        
        # 바람이 강한 경우
        if wind_speed > 10:
            is_good = False
            reasons.append("바람이 강합니다")
        
        recommendation = "실외 러닝하기 좋은 날씨입니다!" if is_good else f"실내 운동을 추천합니다. ({', '.join(reasons)})"
        
        return {
            'temperature': temp,
            'condition': weather_info['sky_condition'],
            'humidity': weather_info['humidity'],
            'wind_speed': wind_speed,
            'precipitation': precipitation,
            'is_good_for_running': is_good,
            'recommendation': recommendation
        }
    
    def _get_dummy_weather(self):
        """
        API 실패 시 더미 데이터
        """
        return {
            'temperature': 20.0,
            'condition': '맑음',
            'humidity': 60,
            'wind_speed': 2.5,
            'precipitation': 0,
            'is_good_for_running': True,
            'recommendation': '실외 러닝하기 좋은 날씨입니다!'
        }

weather_service = WeatherService()

def get_weather_data(lat: float, lon: float):
    """
    날씨 데이터 가져오기 (main.py에서 호출)
    """
    return weather_service.get_weather(lat, lon)
