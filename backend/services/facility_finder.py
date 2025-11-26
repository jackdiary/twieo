import pandas as pd
import math

def load_facilities():
    """Load and filter indoor facilities from CSV"""
    try:
        df = pd.read_csv('data/facilities.csv', encoding='utf-8')
    except:
        try:
            df = pd.read_csv('data/facilities.csv', encoding='cp949')
        except Exception as e:
            print(f"Error loading CSV: {e}")
            return []
    
    # Filter for indoor facilities
    indoor_keywords = ['체육관', '수영장', '실내', '배드민턴장', '탁구장', '헬스장']
    
    # Filter rows containing indoor keywords in facility type
    mask = df['FCLTY_TY_NM'].str.contains('|'.join(indoor_keywords), na=False, case=False)
    indoor_df = df[mask]
    
    # Convert to list of dictionaries
    facilities = []
    for _, row in indoor_df.iterrows():
        try:
            lat = float(row['FCLTY_LA']) if pd.notna(row['FCLTY_LA']) else None
            lon = float(row['FCLTY_LO']) if pd.notna(row['FCLTY_LO']) else None
            
            if lat and lon:
                facilities.append({
                    'name': str(row['FCLTY_NM']).strip(),
                    'type': str(row['FCLTY_TY_NM']).strip(),
                    'address': str(row['RDNMADR_NM']).strip() if pd.notna(row['RDNMADR_NM']) else '',
                    'lat': lat,
                    'lon': lon,
                    'tel': str(row['RSPNSBLTY_TEL_NO']).strip() if pd.notna(row['RSPNSBLTY_TEL_NO']) else '',
                })
        except Exception as e:
            continue
    
    return facilities

def find_nearby_indoor_facilities(user_lat, user_lon, max_distance_km=5.0, limit=10):
    """Find nearby indoor facilities within max_distance_km"""
    facilities = load_facilities()
    
    # Calculate distance for each facility
    nearby = []
    for facility in facilities:
        distance = calculate_distance(user_lat, user_lon, facility['lat'], facility['lon'])
        if distance <= max_distance_km:
            facility['distance'] = round(distance, 2)
            nearby.append(facility)
    
    # Sort by distance and return top results
    nearby.sort(key=lambda x: x['distance'])
    return nearby[:limit]

def calculate_distance(lat1, lon1, lat2, lon2):
    """Calculate distance between two points using Haversine formula"""
    R = 6371  # Earth radius in km
    
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    
    a = (math.sin(dlat / 2) ** 2 +
         math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) *
         math.sin(dlon / 2) ** 2)
    
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    distance = R * c
    
    return distance
