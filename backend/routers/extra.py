from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from services.weather_service import weather_service
from services.facility_service import facility_service

# route_generator는 선택적으로 임포트
try:
    from services.route_generator import generate_multiple_routes
except ImportError:
    generate_multiple_routes = None

router = APIRouter(
    tags=["extra"],
)

class CourseRequest(BaseModel):
    lat: float
    lon: float
    distance: float
    preference: str

@router.get("/api/weather")
def get_weather_info(lat: float, lon: float):
    """날씨 정보"""
    return weather_service.get_weather(lat, lon)

@router.get("/api/facilities/indoor")
def get_indoor_facilities_api(lat: float, lon: float, weather_condition: str = "bad"):
    """실내 시설 추천"""
    facilities = facility_service.get_indoor_facilities(lat, lon, max_distance=5.0, weather_condition=weather_condition)
    weather_data = weather_service.get_weather(lat, lon)
    return {"facilities": facilities, "reason": weather_data['recommendation'], "weather_condition": weather_data['condition']}

@router.post("/generate_course")
def generate_course_endpoint(request: CourseRequest):
    """러닝 코스 생성"""
    weather_data = weather_service.get_weather(request.lat, request.lon)
    if not weather_data['is_good_for_running']:
        facilities = facility_service.get_indoor_facilities(request.lat, request.lon, weather_condition="bad")
        raise HTTPException(status_code=400, detail={"status": "bad_weather", "facilities": facilities, "reason": weather_data['recommendation']})
    
    if generate_multiple_routes:
        try:
            routes = generate_multiple_routes(request.lat, request.lon, request.distance, request.preference, count=3)
            if routes:
                return {"status": "success", "routes": routes}
        except Exception as e:
            print(f"Route generation error: {e}")
    
    # Dummy course generation as fallback
    dummy_routes = [
        {
            "distance": request.distance,
            "description": f"추천 코스 1 - {request.preference} 스타일",
            "waypoints": [
                {"lat": request.lat, "lon": request.lon},
                {"lat": request.lat + 0.01, "lon": request.lon + 0.01}
            ]
        }
    ]
    return {"status": "success", "routes": dummy_routes}

@router.get("/")
def read_root():
    return {
        "message": "뛰어 (Twieo) API Server v1.0.0",
        "endpoints": {
            "auth": "/api/auth/register, /api/auth/login",
            "profile": "/api/profile",
            "runs": "/api/runs",
            "weather": "/api/weather",
            "facilities": "/api/facilities/indoor",
            "course": "/generate_course"
        }
    }
