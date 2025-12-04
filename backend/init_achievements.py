"""
업적 초기 데이터 생성
"""
from sqlalchemy.orm import Session
from database import engine, SessionLocal
import models

# 데이터베이스 테이블 생성
models.Base.metadata.create_all(bind=engine)


def init_achievements():
    # .env 로드
    from dotenv import load_dotenv
    load_dotenv()
    
    print(f"Database URL: {engine.url}")
    
    db = SessionLocal()
    
    # 기존 업적 확인
    existing_count = db.query(models.Achievement).count()
    print(f"기존 업적 수: {existing_count}")
    
    if existing_count > 0:
        first_few = db.query(models.Achievement).limit(5).all()
        print("상위 5개 업적:")
        for ach in first_few:
            print(f"- {ach.name} ({ach.requirement_type})")
            
    achievements_data = [
        # 1. 러닝 횟수 (Runs) - 12개
        {"name": "첫 걸음", "description": "첫 러닝 완료", "icon": "footsteps", "color": "#4CAF50", "requirement_type": "runs", "requirement_value": 1},
        {"name": "작심삼일 극복", "description": "러닝 3회 달성", "icon": "footsteps", "color": "#8BC34A", "requirement_type": "runs", "requirement_value": 3},
        {"name": "러닝 입문", "description": "러닝 5회 달성", "icon": "footsteps", "color": "#CDDC39", "requirement_type": "runs", "requirement_value": 5},
        {"name": "꾸준함의 시작", "description": "러닝 10회 달성", "icon": "star", "color": "#FFEB3B", "requirement_type": "runs", "requirement_value": 10},
        {"name": "러닝 습관", "description": "러닝 25회 달성", "icon": "star", "color": "#FFC107", "requirement_type": "runs", "requirement_value": 25},
        {"name": "성실한 러너", "description": "러닝 50회 달성", "icon": "star", "color": "#FF9800", "requirement_type": "runs", "requirement_value": 50},
        {"name": "러닝 매니아", "description": "러닝 75회 달성", "icon": "star", "color": "#FF5722", "requirement_type": "runs", "requirement_value": 75},
        {"name": "100회 클럽", "description": "러닝 100회 달성", "icon": "medal", "color": "#795548", "requirement_type": "runs", "requirement_value": 100},
        {"name": "멈추지 않는 발", "description": "러닝 150회 달성", "icon": "medal", "color": "#9E9E9E", "requirement_type": "runs", "requirement_value": 150},
        {"name": "200회 돌파", "description": "러닝 200회 달성", "icon": "medal", "color": "#607D8B", "requirement_type": "runs", "requirement_value": 200},
        {"name": "베테랑 러너", "description": "러닝 300회 달성", "icon": "trophy", "color": "#3F51B5", "requirement_type": "runs", "requirement_value": 300},
        {"name": "전설의 시작", "description": "러닝 500회 달성", "icon": "trophy", "color": "#673AB7", "requirement_type": "runs", "requirement_value": 500},

        # 2. 단일 거리 (Distance) - 11개
        {"name": "가벼운 조깅", "description": "1km 달리기 완료", "icon": "walk", "color": "#4CAF50", "requirement_type": "distance", "requirement_value": 1},
        {"name": "3km 완주", "description": "3km 달리기 완료", "icon": "walk", "color": "#8BC34A", "requirement_type": "distance", "requirement_value": 3},
        {"name": "5km 완주", "description": "5km 달리기 완료", "icon": "ribbon", "color": "#CDDC39", "requirement_type": "distance", "requirement_value": 5},
        {"name": "10km 완주", "description": "10km 달리기 완료", "icon": "ribbon", "color": "#FFC107", "requirement_type": "distance", "requirement_value": 10},
        {"name": "15km 도전", "description": "15km 달리기 완료", "icon": "ribbon", "color": "#FF9800", "requirement_type": "distance", "requirement_value": 15},
        {"name": "20km 도전", "description": "20km 달리기 완료", "icon": "ribbon", "color": "#FF5722", "requirement_type": "distance", "requirement_value": 20},
        {"name": "하프 마라톤", "description": "21.1km 달리기 완료", "icon": "medal", "color": "#E91E63", "requirement_type": "distance", "requirement_value": 21.1},
        {"name": "25km 롱런", "description": "25km 달리기 완료", "icon": "medal", "color": "#9C27B0", "requirement_type": "distance", "requirement_value": 25},
        {"name": "30km 롱런", "description": "30km 달리기 완료", "icon": "medal", "color": "#673AB7", "requirement_type": "distance", "requirement_value": 30},
        {"name": "35km 롱런", "description": "35km 달리기 완료", "icon": "medal", "color": "#3F51B5", "requirement_type": "distance", "requirement_value": 35},
        {"name": "풀 마라톤", "description": "42.195km 달리기 완료", "icon": "trophy", "color": "#2196F3", "requirement_type": "distance", "requirement_value": 42.195},

        # 3. 누적 거리 (Total Distance) - 10개
        {"name": "누적 10km", "description": "총 10km 달성", "icon": "map", "color": "#4CAF50", "requirement_type": "total_distance", "requirement_value": 10},
        {"name": "누적 50km", "description": "총 50km 달성", "icon": "map", "color": "#8BC34A", "requirement_type": "total_distance", "requirement_value": 50},
        {"name": "누적 100km", "description": "총 100km 달성", "icon": "map", "color": "#CDDC39", "requirement_type": "total_distance", "requirement_value": 100},
        {"name": "서울에서 대전까지", "description": "총 150km 달성", "icon": "map", "color": "#FFEB3B", "requirement_type": "total_distance", "requirement_value": 150},
        {"name": "누적 300km", "description": "총 300km 달성", "icon": "map", "color": "#FFC107", "requirement_type": "total_distance", "requirement_value": 300},
        {"name": "서울에서 부산까지", "description": "총 400km 달성", "icon": "map", "color": "#FF9800", "requirement_type": "total_distance", "requirement_value": 400},
        {"name": "누적 500km", "description": "총 500km 달성", "icon": "rocket", "color": "#FF5722", "requirement_type": "total_distance", "requirement_value": 500},
        {"name": "누적 1000km", "description": "총 1000km 달성", "icon": "rocket", "color": "#E91E63", "requirement_type": "total_distance", "requirement_value": 1000},
        {"name": "누적 2000km", "description": "총 2000km 달성", "icon": "rocket", "color": "#9C27B0", "requirement_type": "total_distance", "requirement_value": 2000},
        {"name": "지구 한 바퀴 도전", "description": "총 5000km 달성", "icon": "planet", "color": "#673AB7", "requirement_type": "total_distance", "requirement_value": 5000},

        # 4. 페이스 (Pace) - 7개
        {"name": "거북이 탈출", "description": "7:00/km 페이스 달성", "icon": "speedometer", "color": "#4CAF50", "requirement_type": "pace", "requirement_value": 7.0},
        {"name": "조깅 마스터", "description": "6:30/km 페이스 달성", "icon": "speedometer", "color": "#8BC34A", "requirement_type": "pace", "requirement_value": 6.5},
        {"name": "6분대 진입", "description": "6:00/km 페이스 달성", "icon": "speedometer", "color": "#CDDC39", "requirement_type": "pace", "requirement_value": 6.0},
        {"name": "스피드 업", "description": "5:30/km 페이스 달성", "icon": "flash", "color": "#FFC107", "requirement_type": "pace", "requirement_value": 5.5},
        {"name": "5분대 러너", "description": "5:00/km 페이스 달성", "icon": "flash", "color": "#FF9800", "requirement_type": "pace", "requirement_value": 5.0},
        {"name": "고수의 영역", "description": "4:30/km 페이스 달성", "icon": "flash", "color": "#FF5722", "requirement_type": "pace", "requirement_value": 4.5},
        {"name": "번개 같은 속도", "description": "4:00/km 페이스 달성", "icon": "flash", "color": "#F44336", "requirement_type": "pace", "requirement_value": 4.0},

        # 5. 연속 러닝 (Streak) - 10개
        {"name": "3일 연속", "description": "3일 연속 러닝", "icon": "calendar", "color": "#4CAF50", "requirement_type": "streak", "requirement_value": 3},
        {"name": "5일 연속", "description": "5일 연속 러닝", "icon": "calendar", "color": "#8BC34A", "requirement_type": "streak", "requirement_value": 5},
        {"name": "일주일 개근", "description": "7일 연속 러닝", "icon": "calendar", "color": "#CDDC39", "requirement_type": "streak", "requirement_value": 7},
        {"name": "10일 연속", "description": "10일 연속 러닝", "icon": "calendar", "color": "#FFEB3B", "requirement_type": "streak", "requirement_value": 10},
        {"name": "2주 연속", "description": "14일 연속 러닝", "icon": "calendar", "color": "#FFC107", "requirement_type": "streak", "requirement_value": 14},
        {"name": "3주 연속", "description": "21일 연속 러닝", "icon": "calendar", "color": "#FF9800", "requirement_type": "streak", "requirement_value": 21},
        {"name": "한 달 개근", "description": "30일 연속 러닝", "icon": "calendar", "color": "#FF5722", "requirement_type": "streak", "requirement_value": 30},
        {"name": "두 달 연속", "description": "60일 연속 러닝", "icon": "fire", "color": "#E91E63", "requirement_type": "streak", "requirement_value": 60},
        {"name": "세 달 연속", "description": "90일 연속 러닝", "icon": "fire", "color": "#9C27B0", "requirement_type": "streak", "requirement_value": 90},
        {"name": "100일의 기적", "description": "100일 연속 러닝", "icon": "fire", "color": "#673AB7", "requirement_type": "streak", "requirement_value": 100},
    ]
    
    count = 0
    for ach_data in achievements_data:
        # 이름으로 중복 확인
        existing = db.query(models.Achievement).filter(models.Achievement.name == ach_data["name"]).first()
        if not existing:
            achievement = models.Achievement(**ach_data)
            db.add(achievement)
            count += 1
    
    db.commit()
    print(f"{count}개의 새로운 업적이 생성되었습니다.")
    
    total = db.query(models.Achievement).count()
    print(f"현재 총 업적 수: {total}개")
    
    db.close()

if __name__ == "__main__":
    init_achievements()
