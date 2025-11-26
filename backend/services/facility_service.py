import pandas as pd
import os
from typing import List, Tuple
from math import radians, cos, sin, asin, sqrt

class FacilityService:
    def __init__(self):
        # CSV 파일 경로 수정 (backend 폴더 기준)
        self.csv_path = os.path.join(os.path.dirname(__file__), "../../frontend/KS_WNTY_PUBLIC_PHSTRN_FCLTY_STTUS_202507.csv")
        self.facilities_df = None
        self.load_facilities()
    
    def load_facilities(self):
        """
        CSV 파일에서 시설 데이터 로드
        """
        try:
            if os.path.exists(self.csv_path):
                # 여러 인코딩 시도
                encodings = ['utf-8', 'cp949', 'euc-kr', 'utf-8-sig']
                for encoding in encodings:
                    try:
                        self.facilities_df = pd.read_csv(self.csv_path, encoding=encoding)
                        print(f"✅ Loaded {len(self.facilities_df)} facilities from CSV (encoding: {encoding})")
                        return
                    except UnicodeDecodeError:
                        continue
                
                # 모든 인코딩 실패 시
                print(f"❌ Could not decode CSV with any encoding")
                self.facilities_df = pd.DataFrame()
            else:
                print(f"❌ CSV file not found: {self.csv_path}")
                self.facilities_df = pd.DataFrame()
        except Exception as e:
            print(f"❌ Error loading CSV: {e}")
            self.facilities_df = pd.DataFrame()
    
    def haversine_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """
        두 좌표 간의 거리 계산 (km)
        """
        lon1, lat1, lon2, lat2 = map(radians, [lon1, lat1, lon2, lat2])
        dlon = lon2 - lon1
        dlat = lat2 - lat1
        a = sin(dlat/2)**2 + cos(lat1) * cos(lat2) * sin(dlon/2)**2
        c = 2 * asin(sqrt(a))
        km = 6371 * c
        return km
    
    def get_indoor_facilities(self, lat: float, lon: float, max_distance: float = 5.0, weather_condition: str = "bad") -> List[dict]:
        """
        주변 실내 시설 추천
        
        Args:
            lat: 위도
            lon: 경도
            max_distance: 최대 거리 (km)
            weather_condition: 날씨 상태 (bad, rain, snow, dust)
        """
        if self.facilities_df is None or self.facilities_df.empty:
            return self._get_dummy_facilities()
        
        try:
            # 실내 키워드 필터링 (더 넓은 범위)
            indoor_keywords = ['실내', '체육관', '수영장', '배드민턴', '테니스', '헬스', '피트니스', '스포츠센터', '운동장', '체육시설']
            
            # 날씨에 따른 추가 키워드
            if weather_condition == "rain" or weather_condition == "snow":
                indoor_keywords.extend(['실내체육관', '실내수영장', '실내배드민턴장', '실내테니스장'])
            elif weather_condition == "dust":
                indoor_keywords.extend(['실내', '헬스장', '피트니스센터'])
            
            print(f"[Facility Service] Searching for facilities with keywords: {indoor_keywords}")
            
            # 시설명 컬럼 찾기 (CSV 구조에 따라 조정 필요)
            name_column = None
            lat_column = None
            lon_column = None
            address_column = None
            
            print(f"[Facility Service] CSV Columns: {list(self.facilities_df.columns)}")
            
            for col in self.facilities_df.columns:
                col_upper = str(col).upper().strip()
                col_lower = str(col).lower()
                
                # 시설명: FCLTY_NM
                if col_upper == 'FCLTY_NM' or '시설명' in col or '명칭' in col or 'name' in col_lower:
                    name_column = col
                # 위도: FCLTY_LA
                elif col_upper == 'FCLTY_LA' or '위도' in col or 'lat' in col_lower or 'latitude' in col_lower:
                    lat_column = col
                # 경도: FCLTY_LO
                elif col_upper == 'FCLTY_LO' or '경도' in col or 'lon' in col_lower or 'longitude' in col_lower:
                    lon_column = col
                # 주소: RDNMADR_NM
                elif col_upper == 'RDNMADR_NM' or '주소' in col or '소재지' in col or 'address' in col_lower:
                    address_column = col
            
            print(f"[Facility Service] Found columns - Name: {name_column}, Lat: {lat_column}, Lon: {lon_column}, Address: {address_column}")
            
            if name_column is None:
                print("[Facility Service] Name column not found")
                return self._get_dummy_facilities()
            
            # 실내 시설 필터링
            indoor_facilities = self.facilities_df[
                self.facilities_df[name_column].str.contains('|'.join(indoor_keywords), na=False, case=False)
            ]
            
            print(f"[Facility Service] Found {len(indoor_facilities)} facilities matching keywords")
            
            # 거리 계산 및 정렬
            facilities_with_distance = []
            
            for _, facility in indoor_facilities.iterrows():
                # 좌표 가져오기
                facility_lat = facility.get(lat_column) if lat_column else None
                facility_lon = facility.get(lon_column) if lon_column else None
                
                if facility_lat is not None and facility_lon is not None:
                    try:
                        # 문자열 값 처리 ("1 미만" 등)
                        # pd.isna()로 NaN 체크
                        if pd.isna(facility_lat) or pd.isna(facility_lon):
                            continue
                        
                        # 문자열인 경우 숫자로 변환 가능한지 확인
                        try:
                            lat_float = float(facility_lat)
                            lon_float = float(facility_lon)
                        except (ValueError, TypeError):
                            # 변환 실패 시 건너뛰기
                            continue
                        
                        # 0이거나 유효하지 않은 좌표 건너뛰기
                        if lat_float == 0 or lon_float == 0:
                            continue
                        
                        # 유효한 좌표 범위 확인 (한국 기준)
                        if not (33 <= lat_float <= 43 and 124 <= lon_float <= 132):
                            continue
                        
                        distance = self.haversine_distance(lat, lon, lat_float, lon_float)
                        
                        if distance <= max_distance:
                            address = facility.get(address_column, 'N/A') if address_column else 'N/A'
                            facilities_with_distance.append({
                                'name': str(facility[name_column]),
                                'category': self._categorize_facility(str(facility[name_column])),
                                'address': str(address),
                                'latitude': lat_float,
                                'longitude': lon_float,
                                'distance': round(distance, 2),
                                'phone': str(facility.get('전화번호', 'N/A')),
                                'operating_hours': 'N/A'
                            })
                    except (ValueError, TypeError) as e:
                        # float 변환 실패 시 무시
                        continue
                    except Exception as e:
                        # 기타 오류 무시
                        continue
            
            # 거리순 정렬
            facilities_with_distance.sort(key=lambda x: x['distance'])
            
            print(f"[Facility Service] Returning {len(facilities_with_distance[:10])} facilities within {max_distance}km")
            
            return facilities_with_distance[:10]  # 상위 10개만 반환
            
        except Exception as e:
            print(f"Error getting facilities: {e}")
            return self._get_dummy_facilities()
    
    def _categorize_facility(self, name: str) -> str:
        """
        시설명으로 카테고리 분류
        """
        if '수영장' in name:
            return '실내수영장'
        elif '배드민턴' in name:
            return '실내배드민턴장'
        elif '테니스' in name:
            return '실내테니스장'
        elif '헬스' in name or '피트니스' in name:
            return '헬스장/피트니스'
        elif '체육관' in name:
            return '실내체육관'
        else:
            return '실내스포츠시설'
    
    def _get_dummy_facilities(self) -> List[dict]:
        """
        더미 시설 데이터 (CSV 로드 실패 시)
        """
        print("⚠️ Using dummy facilities - CSV file not loaded properly")
        return []

facility_service = FacilityService()
