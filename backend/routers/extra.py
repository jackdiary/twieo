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
    # weather_data = weather_service.get_weather(request.lat, request.lon)
    # if not weather_data['is_good_for_running']:
    #     facilities = facility_service.get_indoor_facilities(request.lat, request.lon, weather_condition="bad")
    #     raise HTTPException(status_code=400, detail={"status": "bad_weather", "facilities": facilities, "reason": weather_data['recommendation']})
    
    if generate_multiple_routes is None:
        raise HTTPException(status_code=501, detail="Route generation service is not available.")

    print(f"Attempting to generate routes for {request.lat}, {request.lon}")
    # 사용자가 시간 걸려도 좋으니 무조건 실제 코스 생성하라고 함 (fallback 제거)
    routes = generate_multiple_routes(request.lat, request.lon, request.distance, request.preference, count=3)
    if routes:
        print("Routes generated successfully")
        return {"status": "success", "routes": routes}
    
    # generate_multiple_routes가 없거나 빈 리스트를 반환한 경우에만 여기로 옴 (에러나면 500 에러 발생)
    print("No routes generated")
    return {"status": "error", "message": "No routes generated"}

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
